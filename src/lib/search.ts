import Product from './models/Product';
import Category from './models/Category';
import Brand from './models/Brand';

export interface ISearchOptions {
  query: string;
  limit?: number;
  skip?: number;
  categorySlug?: string;
  brandName?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'relevance';
}

/**
 * Searches products using MongoDB Atlas Search if available and enabled,
 * otherwise falls back to a standard regex-based query search.
 */
export async function searchProducts(options: ISearchOptions) {
  const queryText = options.query?.trim() || '';
  const limit = options.limit || 16;
  const skip = options.skip || 0;

  // If query is empty, return empty list
  if (!queryText) {
    return { products: [], total: 0, method: 'none' };
  }

  // 1. Try MongoDB Atlas Search (if enabled by environment variable)
  if (process.env.USE_ATLAS_SEARCH === 'true') {
    try {
      const searchPipeline: any[] = [
        {
          $search: {
            index: process.env.ATLAS_SEARCH_INDEX_NAME || 'default',
            text: {
              query: queryText,
              path: ['name', 'description', 'tags'],
              fuzzy: { maxEdits: 1 },
            },
          },
        },
      ];

      // Add match filters after search (filtering on active status is critical)
      const matchConditions: any = { isActive: true, approvalStatus: 'approved' };

      // Apply category filter if provided
      if (options.categorySlug) {
        const category = await Category.findOne({ slug: options.categorySlug }).select('_id');
        if (category) {
          matchConditions.category = category._id;
        }
      }

      // Apply brand filter if provided
      if (options.brandName) {
        const brand = await Brand.findOne({ name: { $regex: new RegExp(`^${options.brandName}$`, 'i') } }).select('_id');
        if (brand) {
          matchConditions.brand = brand._id;
        }
      }

      // Apply price range filters
      if (options.minPrice !== undefined || options.maxPrice !== undefined) {
        matchConditions.salePrice = {};
        if (options.minPrice !== undefined) matchConditions.salePrice.$gte = options.minPrice;
        if (options.maxPrice !== undefined) matchConditions.salePrice.$lte = options.maxPrice;
      }

      searchPipeline.push({ $match: matchConditions });

      // Apply sorting
      if (options.sortBy) {
        let sortStage = {};
        if (options.sortBy === 'price_asc') sortStage = { salePrice: 1 };
        else if (options.sortBy === 'price_desc') sortStage = { salePrice: -1 };
        else if (options.sortBy === 'rating') sortStage = { 'rating.average': -1 };
        else if (options.sortBy === 'newest') sortStage = { createdAt: -1 };
        
        if (Object.keys(sortStage).length > 0) {
          searchPipeline.push({ $sort: sortStage });
        }
      }

      // Pagination
      searchPipeline.push({ $skip: skip });
      searchPipeline.push({ $limit: limit });

      // Run aggregation
      const products = await Product.aggregate(searchPipeline);
      const populatedProducts = await Product.populate(products, [
        { path: 'category', model: Category },
        { path: 'brand', model: Brand },
      ]);

      return {
        products: populatedProducts,
        total: populatedProducts.length, // approximate for search result count
        method: 'atlas',
      };
    } catch (err) {
      console.warn('⚠️ Atlas Search failed or index not found. Falling back to regex search:', err);
    }
  }

  // 2. Standard Regex Search Fallback
  // Escape search query for regex safety
  function escapeRegExp(str: string) {
    return str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  const regex = new RegExp(escapeRegExp(queryText), 'i');

  // Find category and brand matches to expand regex scope
  const matchingCategories = await Category.find({
    $or: [{ name: regex }, { slug: regex }],
  }).select('_id').lean();
  const categoryIds = matchingCategories.map((c) => c._id);

  const matchingBrands = await Brand.find({ name: regex }).select('_id').lean();
  const brandIds = matchingBrands.map((b) => b._id);

  // Build match query
  const matchQuery: any = {
    isActive: true,
    approvalStatus: 'approved',
    $or: [
      { name: regex },
      { description: regex },
      { tags: regex },
      { category: { $in: categoryIds } },
      ...(brandIds.length > 0 ? [{ brand: { $in: brandIds } }] : []),
    ],
  };

  // Specific filters overrides
  if (options.categorySlug) {
    const specificCategory = await Category.findOne({ slug: options.categorySlug }).select('_id');
    if (specificCategory) {
      matchQuery.category = specificCategory._id;
    }
  }

  if (options.brandName) {
    const specificBrand = await Brand.findOne({ name: { $regex: new RegExp(`^${options.brandName}$`, 'i') } }).select('_id');
    if (specificBrand) {
      matchQuery.brand = specificBrand._id;
    }
  }

  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    matchQuery.salePrice = {};
    if (options.minPrice !== undefined) matchQuery.salePrice.$gte = options.minPrice;
    if (options.maxPrice !== undefined) matchQuery.salePrice.$lte = options.maxPrice;
  }

  // Get total count
  const total = await Product.countDocuments(matchQuery);

  // Apply sorting
  let sortCriteria: any = {};
  if (options.sortBy === 'price_asc') sortCriteria = { salePrice: 1 };
  else if (options.sortBy === 'price_desc') sortCriteria = { salePrice: -1 };
  else if (options.sortBy === 'rating') sortCriteria = { 'rating.average': -1 };
  else if (options.sortBy === 'newest') sortCriteria = { createdAt: -1 };
  else sortCriteria = { score: { $meta: 'textScore' } }; // Default relevance placeholder

  // If no relevance score text index, fallback to default order (newest)
  if (Object.keys(sortCriteria).length === 0 || sortCriteria.score) {
    sortCriteria = { createdAt: -1 };
  }

  const products = await Product.find(matchQuery)
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit)
    .populate({ path: 'category', model: Category })
    .populate({ path: 'brand', model: Brand })
    .lean();

  return {
    products,
    total,
    method: 'regex',
  };
}
