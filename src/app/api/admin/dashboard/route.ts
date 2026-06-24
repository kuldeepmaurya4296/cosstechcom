import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import Product from "@/lib/models/Product";
import { orders as fallbackOrders } from "@/data/orders";
import { customers as fallbackCustomers } from "@/data/users";
import { products as fallbackProducts } from "@/data/products";
import { cleanupExpiredPendingOrders } from "@/lib/db-utils";

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (db) {
      await cleanupExpiredPendingOrders();
    }
    if (!db) {
      console.warn("Using local mock files for admin dashboard fallback (database offline).");

      const totalRevenue = fallbackOrders.reduce((sum, o) => sum + o.total, 0);
      const ordersCount = fallbackOrders.length;
      const customersCount = fallbackCustomers.length;
      const productsCount = fallbackProducts.length;

      // Mock sales chart (last 7 days)
      const salesChart = {
        data: [42000, 58000, 51000, 73000, 65000, 88000, 79000],
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      };

      const latestOrders = fallbackOrders.slice(0, 6);
      const topProducts = fallbackProducts.slice(0, 5);
      const lowStockAlerts = fallbackProducts
        .filter((p: any) => p.stock < 10)
        .map((p: any) => ({ id: p.id, name: p.name, stock: p.stock }));

      return NextResponse.json({
        revenue: totalRevenue,
        ordersCount,
        customersCount,
        productsCount,
        revenueDelta: 12.4,
        ordersDelta: 8.1,
        customersDelta: 4.7,
        productsDelta: -2.1,
        salesChart,
        latestOrders,
        topProducts,
        lowStockAlerts,
        placedQueue: 3,
        readyToShipQueue: 5,
        inTransitQueue: 4,
      });
    }

    // Live DB aggregation
    const ordersCount = await Order.countDocuments({
      $or: [{ "payment.method": "COD" }, { "payment.status": { $ne: "PENDING" } }],
    });
    const customersCount = await User.countDocuments({ role: "customer" });
    const productsCount = await Product.countDocuments();

    // Sum revenue from PAID orders using aggregation
    const revenueAgg = await Order.aggregate([
      { $match: { "payment.status": "PAID" } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total ?? 0;

    // Dynamic sales chart for last 7 days using aggregation
    const today = new Date();
    const sevenDaysAgo = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 6,
      0,
      0,
      0,
    );
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const salesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          "payment.status": "PAID",
        },
      },
      {
        $group: {
          _id: {
            dateStr: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
            },
          },
          revenue: { $sum: "$pricing.total" },
        },
      },
    ]);

    const revenueMap: Record<string, number> = {};
    salesAgg.forEach((item: any) => {
      if (item._id && item._id.dateStr) {
        revenueMap[item._id.dateStr] = item.revenue;
      }
    });

    const last7DaysData: number[] = [];
    const last7DaysLabels: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;

      const dayRevenue = revenueMap[dateKey] ?? 0;
      last7DaysData.push(dayRevenue);
      last7DaysLabels.push(weekdays[d.getDay()]);
    }

    // Fetch latest 6 orders and populate customer user info using .populate()
    const rawLatestOrders = await Order.find({
      $or: [{ "payment.method": "COD" }, { "payment.status": { $ne: "PENDING" } }],
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate({ path: "userId", model: User, select: "name" });

    const latestOrders = rawLatestOrders.map((o: any) => {
      let customerName = "—";
      if (o.userId && typeof o.userId === "object" && o.userId.name) {
        customerName = o.userId.name;
      } else {
        customerName = o.shippingAddress?.fullName || "—";
      }

      return {
        id: o._id.toString(),
        orderId: o.orderId,
        number: o.orderId,
        customerName,
        createdAt: o.createdAt,
        status: o.status,
        total: o.pricing.total,
        paymentStatus: o.payment.status,
      };
    });

    // Fetch top products (e.g. sorted by rating count or featured)
    const rawProducts = await Product.find({ isActive: true })
      .sort({ "rating.count": -1 })
      .limit(5);

    const topProducts = rawProducts.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      image: p.images && p.images[0] ? p.images[0].url : "/assets/product-placeholder.jpg",
      price: p.salePrice,
      reviewsCount: p.rating ? p.rating.count : 0,
    }));

    // Find products with low stock (variant stock < 5)
    const rawLowStockProducts = await Product.find({
      isActive: true,
      "variants.stock": { $lt: 5 },
    }).limit(10);

    const lowStockAlerts = rawLowStockProducts.map((p) => {
      const minStock = p.variants.reduce(
        (min: number, v: any) => (v.stock < min ? v.stock : min),
        9999,
      );
      return {
        id: p._id.toString(),
        name: p.name,
        stock: minStock === 9999 ? 0 : minStock,
      };
    });

    // Week-over-Week calculations
    const fourteenDaysAgo = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 14,
      0,
      0,
      0,
    );

    const thisWeekOrders = await Order.find({
      createdAt: { $gte: sevenDaysAgo },
      $or: [{ "payment.method": "COD" }, { "payment.status": { $ne: "PENDING" } }],
    }).lean();

    const lastWeekOrders = await Order.find({
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      $or: [{ "payment.method": "COD" }, { "payment.status": { $ne: "PENDING" } }],
    }).lean();

    const thisWeekRevenue = thisWeekOrders
      .filter((o: any) => o.payment?.status === "PAID")
      .reduce((sum, o) => sum + o.pricing.total, 0);

    const lastWeekRevenue = lastWeekOrders
      .filter((o: any) => o.payment?.status === "PAID")
      .reduce((sum, o) => sum + o.pricing.total, 0);

    const calcDelta = (current: number, previous: number) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    const revenueDelta = calcDelta(thisWeekRevenue, lastWeekRevenue);
    const ordersDelta = calcDelta(thisWeekOrders.length, lastWeekOrders.length);

    const thisWeekCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: sevenDaysAgo },
    });
    const lastWeekCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
    });
    const customersDelta = calcDelta(thisWeekCustomers, lastWeekCustomers);

    const thisWeekProducts = await Product.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const lastWeekProducts = await Product.countDocuments({
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
    });
    const productsDelta = calcDelta(thisWeekProducts, lastWeekProducts);

    const placedQueue = await Order.countDocuments({
      status: "PLACED",
      $or: [{ "payment.method": "COD" }, { "payment.status": { $ne: "PENDING" } }],
    });
    const readyToShipQueue = await Order.countDocuments({
      status: { $in: ["CONFIRMED", "PACKED"] },
    });
    const inTransitQueue = await Order.countDocuments({
      status: { $in: ["SHIPPED", "OUT_FOR_DELIVERY"] },
    });

    return NextResponse.json({
      revenue: totalRevenue,
      ordersCount,
      customersCount,
      productsCount,
      revenueDelta,
      ordersDelta,
      customersDelta,
      productsDelta,
      salesChart: {
        data: last7DaysData,
        labels: last7DaysLabels,
      },
      latestOrders,
      topProducts,
      lowStockAlerts,
      placedQueue,
      readyToShipQueue,
      inTransitQueue,
    });
  } catch (error: any) {
    console.error("Dashboard metrics aggregation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard metrics" },
      { status: 500 },
    );
  }
}
export const dynamic = "force-dynamic";
