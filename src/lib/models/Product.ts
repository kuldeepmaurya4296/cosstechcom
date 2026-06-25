import mongoose, { Schema, Document } from "mongoose";

export interface IVariant {
  size?: string;
  color?: string;
  colorHex?: string;
  stock: number;
  sku: string;
  images?: { url: string; public_id: string }[];
  attributes?: Record<string, string>;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  brand: mongoose.Types.ObjectId | string;
  vendorId: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  gender?: "Men" | "Women" | "Children" | "Unisex" | "None";
  occasion?: string[];
  images: { url: string; public_id: string }[];
  variants: IVariant[];
  price: number;
  salePrice: number;
  discount: number; // percentage
  returnDays?: number;
  rating: {
    average: number;
    count: number;
  };
  isFeatured: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  specifications?: { key: string; value: string }[];
  shippingWeight?: number;
  freeShipping: boolean;
  estimatedDeliveryDays?: number;
  commissionRate?: number;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  
  // Legal compliance & tax details
  countryOfOrigin?: string;
  mfgDetails?: string;
  netQuantity?: string;
  hsnCode?: string;
  searchVector?: number[]; // For vector embeddings / advanced search
  
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema({
  size: { type: String }, // String type instead of Number
  color: { type: String },
  colorHex: { type: String },
  stock: { type: Number, required: true, default: 0 },
  sku: { type: String, required: true },
  images: [
    {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
  ],
  attributes: { type: Map, of: String },
});

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    gender: {
      type: String,
      enum: ["Men", "Women", "Children", "Unisex", "None"],
      default: "None",
      index: true,
    },
    occasion: [
      {
        type: String,
        index: true,
      },
    ],
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    variants: [VariantSchema],
    price: { type: Number, required: true }, // MRP
    salePrice: { type: Number, required: true }, // Actual selling price
    discount: { type: Number, default: 0 }, // Discount % auto-calculated or stored
    returnDays: { type: Number, default: 7 },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isFeatured: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved", // auto-approve seeded items
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    specifications: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    shippingWeight: { type: Number },
    freeShipping: { type: Boolean, default: false },
    estimatedDeliveryDays: { type: Number, default: 5 },
    commissionRate: { type: Number },
    tags: [{ type: String }],
    metaTitle: { type: String },
    metaDescription: { type: String },
    
    // Legal compliance & tax
    countryOfOrigin: { type: String, trim: true },
    mfgDetails: { type: String, trim: true },
    netQuantity: { type: String, trim: true },
    hsnCode: { type: String, trim: true, index: true },
    searchVector: [{ type: Number }], // For vector search
  },
  { timestamps: true },
);

// Pre-save hook to calculate discount percentage
ProductSchema.pre("save", function (this: any) {
  if (this.price && this.salePrice) {
    this.discount = Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
});

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
