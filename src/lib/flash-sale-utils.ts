import FlashSale from "@/lib/models/FlashSale";

export async function applyFlashSales(products: any[]): Promise<any[]> {
  const now = new Date();
  const activeSales = await FlashSale.find({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
  }).lean();

  if (activeSales.length === 0) return products;

  return products.map((norm) => {
    const sale = activeSales.find((s: any) =>
      s.products.some((prodId: any) => prodId.toString() === norm.id),
    );

    if (sale) {
      let flashPrice = norm.price;
      if (sale.discountType === "PERCENTAGE") {
        flashPrice = Math.round(norm.price * (1 - sale.discountValue / 100));
      } else if (sale.discountType === "FLAT") {
        flashPrice = Math.max(0, norm.price - sale.discountValue);
      }

      return {
        ...norm,
        price: flashPrice,
        compareAt: norm.compareAt || norm.price,
        flashSale: {
          name: sale.name,
          endTime:
            sale.endTime instanceof Date
              ? sale.endTime.toISOString()
              : new Date(sale.endTime).toISOString(),
          discountType: sale.discountType,
          discountValue: sale.discountValue,
        },
      };
    }

    return norm;
  });
}

export async function applyFlashSaleToSingleProduct(norm: any): Promise<any> {
  const now = new Date();
  const activeFlashSale = await FlashSale.findOne({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
    products: norm.id,
  }).lean();

  if (!activeFlashSale) return norm;

  let flashPrice = norm.price;
  if (activeFlashSale.discountType === "PERCENTAGE") {
    flashPrice = Math.round(norm.price * (1 - activeFlashSale.discountValue / 100));
  } else if (activeFlashSale.discountType === "FLAT") {
    flashPrice = Math.max(0, norm.price - activeFlashSale.discountValue);
  }

  return {
    ...norm,
    price: flashPrice,
    compareAt: norm.compareAt || norm.price,
    flashSale: {
      name: activeFlashSale.name,
      endTime:
        activeFlashSale.endTime instanceof Date
          ? activeFlashSale.endTime.toISOString()
          : new Date(activeFlashSale.endTime).toISOString(),
      discountType: activeFlashSale.discountType,
      discountValue: activeFlashSale.discountValue,
    },
  };
}
