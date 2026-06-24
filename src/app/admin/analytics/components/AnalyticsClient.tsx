"use client";

import { useState } from "react";
import {
  IndianRupee,
  ShoppingCart,
  Users,
  TrendingUp,
  Tag,
  Award,
  Grid,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { StatCard } from "@/modules/admin/dashboard/components/StatCard";

export interface SerializedOrderItem {
  productId: string;
  name: string;
  image: string;
  size: number;
  color: string;
  price: number;
  qty: number;
}

export interface SerializedOrder {
  _id: string;
  orderId: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  pricing: {
    subtotal: number;
    shipping: number;
    couponDiscount: number;
    total: number;
  };
  payment: {
    method: string;
    status: string;
  };
  items: SerializedOrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pin: string;
  };
  coupon?: {
    code: string;
    discountAmount: number;
  };
  shipping?: {
    courier: string;
    trackingNumber: string;
  };
  refundDetails?: {
    preference: string;
    upiId: string;
    bankDetails?: {
      accountHolderName: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
    };
    method: string;
    transactionId: string;
    refundedAt?: string;
  };
}

export interface SerializedProduct {
  _id: string;
  name: string;
  brand: string;
  category: string;
  gender: string;
  price: number;
  salePrice: number;
  stock: number;
  image: string;
}

export interface SerializedBrand {
  _id: string;
  name: string;
}

export interface SerializedCategory {
  _id: string;
  name: string;
}

export interface SerializedCustomer {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AnalyticsClientProps {
  orders: SerializedOrder[];
  products: SerializedProduct[];
  brands: SerializedBrand[];
  categories: SerializedCategory[];
  customers: SerializedCustomer[];
}

export default function AnalyticsClient({
  orders,
  products,
  brands,
  categories,
  customers,
}: AnalyticsClientProps) {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [reportType, setReportType] = useState<string>("master_ledger");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "financials" | "status_funnel" | "refunds"
  >("overview");

  // Maps for fast lookups
  const categoryMap = new Map(categories.map((c) => [c._id, c.name]));
  const brandMap = new Map(brands.map((b) => [b._id, b.name]));
  const productMap = new Map(
    products.map((p) => [
      p._id,
      {
        brandName: brandMap.get(p.brand) || "Raja Boot House",
        categoryName: categoryMap.get(p.category) || "Uncategorized",
      },
    ]),
  );

  // Date threshold calculations
  const now = new Date();
  let startDate = new Date();
  let prevStartDate = new Date();
  let prevEndDate = new Date();

  if (timeframe === "7d") {
    startDate.setDate(now.getDate() - 7);
    prevStartDate.setDate(now.getDate() - 14);
    prevEndDate.setDate(now.getDate() - 7);
  } else if (timeframe === "30d") {
    startDate.setDate(now.getDate() - 30);
    prevStartDate.setDate(now.getDate() - 60);
    prevEndDate.setDate(now.getDate() - 30);
  } else if (timeframe === "90d") {
    startDate.setDate(now.getDate() - 90);
    prevStartDate.setDate(now.getDate() - 180);
    prevEndDate.setDate(now.getDate() - 90);
  } else {
    // All time - start from beginning
    startDate = new Date(0);
  }

  // Filter orders by date
  const currentOrders = orders.filter((o) => new Date(o.createdAt) >= startDate);
  const prevOrders =
    timeframe === "all"
      ? []
      : orders.filter((o) => {
          const d = new Date(o.createdAt);
          return d >= prevStartDate && d < prevEndDate;
        });

  // Detailed calculations (P&L, Status counts, Refund preferences)
  const calculateDetailedKPIs = (periodOrders: SerializedOrder[]) => {
    let grossSales = 0;
    let cancellationsValue = 0;
    let refundsValue = 0;
    let couponDiscounts = 0;
    let shippingRevenue = 0;
    let cogs = 0;

    // Status counts
    const statusCounts: Record<string, { count: number; value: number }> = {
      PLACED: { count: 0, value: 0 },
      CONFIRMED: { count: 0, value: 0 },
      PACKED: { count: 0, value: 0 },
      SHIPPED: { count: 0, value: 0 },
      OUT_FOR_DELIVERY: { count: 0, value: 0 },
      DELIVERED: { count: 0, value: 0 },
      CANCELLED: { count: 0, value: 0 },
      RETURN_REQUESTED: { count: 0, value: 0 },
      RETURNED: { count: 0, value: 0 },
      REFUNDED: { count: 0, value: 0 },
    };

    // Refund routing preferences
    const refundPrefs: Record<string, { count: number; value: number }> = {
      ORIGINAL: { count: 0, value: 0 },
      BANK: { count: 0, value: 0 },
      UPI: { count: 0, value: 0 },
      UNSPECIFIED: { count: 0, value: 0 },
    };

    periodOrders.forEach((o) => {
      const orderTotal = o.pricing.total || 0;
      const subtotal = o.pricing.subtotal || 0;
      const shipping = o.pricing.shipping || 0;
      const discount = o.pricing.couponDiscount || 0;

      // Update status counts
      if (statusCounts[o.status]) {
        statusCounts[o.status].count += 1;
        statusCounts[o.status].value += orderTotal;
      }

      // Financial components
      grossSales += subtotal + shipping;
      couponDiscounts += discount;

      if (o.status === "CANCELLED") {
        cancellationsValue += orderTotal;
      } else if (["RETURNED", "REFUNDED", "RETURN_REQUESTED"].includes(o.status)) {
        refundsValue += orderTotal;

        // Track refund preference
        const pref = o.refundDetails?.preference || "UNSPECIFIED";
        if (refundPrefs[pref]) {
          refundPrefs[pref].count += 1;
          refundPrefs[pref].value += orderTotal;
        }
      } else {
        // Active orders: calculate COGS (60% of item purchase price) and Shipping revenue
        shippingRevenue += shipping;
        o.items.forEach((item) => {
          const qty = item.qty || 1;
          const price = item.price || 0;
          cogs += price * qty * 0.6; // 60% base cost of goods
        });
      }
    });

    const netSales = grossSales - couponDiscounts - cancellationsValue - refundsValue;
    const grossProfit = netSales - cogs;

    // Estimate gateway/processing fee (2% of Net Sales from non-COD payments)
    let onlineNetSales = 0;
    periodOrders.forEach((o) => {
      if (
        !["CANCELLED", "RETURNED", "REFUNDED", "RETURN_REQUESTED"].includes(o.status) &&
        o.payment.method !== "COD"
      ) {
        onlineNetSales += o.pricing.total;
      }
    });
    const gatewayFees = onlineNetSales * 0.02;

    // Net profit = Gross profit - gateway fees
    const netProfit = grossProfit - gatewayFees;

    const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
    const netMargin = netSales > 0 ? (netProfit / netSales) * 100 : 0;

    // AOV = Net Sales / non-cancelled orders
    const nonCancelledOrdersCount = periodOrders.filter((o) => o.status !== "CANCELLED").length;
    const aov = nonCancelledOrdersCount > 0 ? netSales / nonCancelledOrdersCount : 0;

    // Cancellation & Return Rates
    const cancellationRate =
      periodOrders.length > 0 ? (statusCounts.CANCELLED.count / periodOrders.length) * 100 : 0;
    const returnRate =
      periodOrders.length > 0
        ? ((statusCounts.RETURNED.count +
            statusCounts.REFUNDED.count +
            statusCounts.RETURN_REQUESTED.count) /
            periodOrders.length) *
          100
        : 0;

    const totalReturnsCount =
      statusCounts.RETURNED.count +
      statusCounts.REFUNDED.count +
      statusCounts.RETURN_REQUESTED.count;
    const totalReturnsValue = refundsValue;

    return {
      totalOrders: periodOrders.length,
      grossSales,
      cancellationsValue,
      refundsValue,
      couponDiscounts,
      shippingRevenue,
      netSales,
      cogs,
      grossProfit,
      gatewayFees,
      netProfit,
      grossMargin,
      netMargin,
      aov,
      cancellationRate,
      returnRate,
      totalReturnsCount,
      totalReturnsValue,
      statusCounts,
      refundPrefs,
    };
  };

  const currentKPIs = calculateDetailedKPIs(currentOrders);
  const prevKPIs = calculateDetailedKPIs(prevOrders);

  // Helper to calculate percentage growth deltas
  const getGrowthDelta = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
  };

  const salesDelta =
    timeframe === "all" ? 0 : getGrowthDelta(currentKPIs.netSales, prevKPIs.netSales);
  const ordersDelta =
    timeframe === "all" ? 0 : getGrowthDelta(currentKPIs.totalOrders, prevKPIs.totalOrders);
  const aovDelta = timeframe === "all" ? 0 : getGrowthDelta(currentKPIs.aov, prevKPIs.aov);

  // Customer stats
  const currentCustomersCount = customers.filter((c) => new Date(c.createdAt) >= startDate).length;
  const prevCustomersCount =
    timeframe === "all"
      ? 0
      : customers.filter((c) => {
          const d = new Date(c.createdAt);
          return d >= prevStartDate && d < prevEndDate;
        }).length;
  const customersDelta =
    timeframe === "all" ? 0 : getGrowthDelta(currentCustomersCount, prevCustomersCount);

  // SVG Area Chart Trend Data
  const getChartData = () => {
    const dataMap: Record<string, { revenue: number; orders: number }> = {};
    const labels: string[] = [];
    const rawKeys: string[] = [];
    const today = new Date();

    if (timeframe === "7d" || timeframe === "30d" || timeframe === "90d") {
      const days = timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 90;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const key = d.toISOString().split("T")[0];
        dataMap[key] = { revenue: 0, orders: 0 };
        labels.push(dateStr);
        rawKeys.push(key);
      }

      currentOrders.forEach((o) => {
        const key = o.createdAt.split("T")[0];
        if (dataMap[key]) {
          dataMap[key].orders += 1;
          if (!["CANCELLED", "RETURNED", "REFUNDED"].includes(o.status)) {
            dataMap[key].revenue += o.pricing.total;
          }
        }
      });

      return rawKeys.map((key, idx) => ({
        label: labels[idx],
        revenue: dataMap[key].revenue,
        orders: dataMap[key].orders,
      }));
    } else {
      // All time - group by Month
      let minDate = new Date();
      minDate.setMonth(minDate.getMonth() - 11); // default to 12 months ago

      if (orders.length > 0) {
        let earliest = new Date(orders[0].createdAt);
        orders.forEach((o) => {
          const d = new Date(o.createdAt);
          if (d < earliest) earliest = d;
        });
        if (earliest < minDate) minDate = earliest;
      }

      const curr = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 1);

      while (curr <= end) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, "0")}`;
        const label = curr.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        dataMap[key] = { revenue: 0, orders: 0 };
        labels.push(label);
        rawKeys.push(key);
        curr.setMonth(curr.getMonth() + 1);
      }

      orders.forEach((o) => {
        const date = new Date(o.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (dataMap[key]) {
          dataMap[key].orders += 1;
          if (!["CANCELLED", "RETURNED", "REFUNDED"].includes(o.status)) {
            dataMap[key].revenue += o.pricing.total;
          }
        }
      });

      return rawKeys.map((key, idx) => ({
        label: labels[idx],
        revenue: dataMap[key].revenue,
        orders: dataMap[key].orders,
      }));
    }
  };

  const chartData = getChartData();

  // SVG dimensions & coords
  const svgWidth = 600;
  const svgHeight = 240;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxRevenueRaw = Math.max(...chartData.map((d) => d.revenue), 0);
  const maxRevenue = maxRevenueRaw > 0 ? Math.ceil((maxRevenueRaw * 1.15) / 1000) * 1000 : 1000;

  const points = chartData.map((d, idx) => {
    const x =
      paddingLeft +
      (chartData.length > 1 ? (idx / (chartData.length - 1)) * chartWidth : chartWidth / 2);
    const y = paddingTop + chartHeight - (d.revenue / maxRevenue) * chartHeight;
    return { x, y };
  });

  const linePath =
    points.length > 0
      ? points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : "";

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : "";

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * svgWidth;

    let closestIndex = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });
    setHoveredIndex(closestIndex);
  };

  // Payment method donut calculations
  const paymentRevenue: Record<string, number> = {
    UPI: 0,
    Card: 0,
    "Net Banking": 0,
    Wallet: 0,
    COD: 0,
  };
  currentOrders.forEach((o) => {
    if (["CANCELLED", "RETURNED", "REFUNDED"].includes(o.status)) return;
    const method = o.payment.method || "COD";
    if (paymentRevenue[method] !== undefined) {
      paymentRevenue[method] += o.pricing.total;
    }
  });

  const totalPaymentRevenue = Object.values(paymentRevenue).reduce((sum, v) => sum + v, 0) || 1;
  const paymentColors = ["#846358", "#B5A490", "#2F2D2A", "#65594F", "#D4C7B8"];
  const paymentMethodsList = ["UPI", "Card", "Net Banking", "Wallet", "COD"];

  const donutSlices = paymentMethodsList
    .map((method, idx) => {
      const revenue = paymentRevenue[method];
      const percentage = Math.round((revenue / totalPaymentRevenue) * 100);
      return {
        name: method,
        revenue,
        percentage,
        color: paymentColors[idx % paymentColors.length],
      };
    })
    .filter((s) => s.revenue > 0);

  const donutGradient =
    donutSlices.length > 0
      ? `conic-gradient(${donutSlices
          .map((slice, idx) => {
            let cumulative = 0;
            for (let i = 0; i < idx; i++) {
              cumulative += donutSlices[i].percentage;
            }
            const start = cumulative;
            const end = start + slice.percentage;
            return `${slice.color} ${start}% ${end}%`;
          })
          .join(", ")})`
      : "conic-gradient(#e5e7eb 0% 100%)";

  // Category & Brand Share Calculations
  const categorySales: Record<string, number> = {};
  const brandSales: Record<string, number> = {};

  currentOrders.forEach((o) => {
    if (["CANCELLED", "RETURNED", "REFUNDED"].includes(o.status)) return;
    o.items.forEach((item) => {
      const qty = item.qty || 1;
      const rev = item.price * qty;
      const info = productMap.get(item.productId);
      const catName = info?.categoryName || "Uncategorized";
      const brandName = info?.brandName || "Raja Boot House";

      categorySales[catName] = (categorySales[catName] || 0) + rev;
      brandSales[brandName] = (brandSales[brandName] || 0) + rev;
    });
  });

  const totalCatRevenue = Object.values(categorySales).reduce((sum, v) => sum + v, 0) || 1;
  const categoryStats = Object.entries(categorySales)
    .map(([name, revenue]) => ({
      name,
      revenue,
      pct: Math.round((revenue / totalCatRevenue) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const totalBrandRevenue = Object.values(brandSales).reduce((sum, v) => sum + v, 0) || 1;
  const brandStats = Object.entries(brandSales)
    .map(([name, revenue]) => ({
      name,
      revenue,
      pct: Math.round((revenue / totalBrandRevenue) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top Products calculations
  const productSalesMap: Record<string, { qty: number; revenue: number }> = {};
  currentOrders.forEach((o) => {
    if (["CANCELLED", "RETURNED", "REFUNDED"].includes(o.status)) return;
    o.items.forEach((item) => {
      const qty = item.qty || 1;
      const rev = item.price * qty;

      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += qty;
      productSalesMap[item.productId].revenue += rev;
    });
  });

  const topProductsList = Object.entries(productSalesMap)
    .map(([productId, sales]) => {
      const p = products.find((prod) => prod._id === productId);
      const brandName = p ? brandMap.get(p.brand) || "Raja Boot House" : "Raja Boot House";
      const categoryName = p ? categoryMap.get(p.category) || "Uncategorized" : "Uncategorized";
      return {
        id: productId,
        name: p?.name || "Unknown Product",
        image: p?.image || "/assets/product-placeholder.jpg",
        brand: brandName,
        category: categoryName,
        qtySold: sales.qty,
        revenue: sales.revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top Customers calculations
  const customerSalesMap: Record<
    string,
    { name: string; email: string; orderCount: number; spend: number }
  > = {};
  currentOrders.forEach((o) => {
    if (["CANCELLED", "RETURNED", "REFUNDED"].includes(o.status)) return;
    const userId = o.userId;
    const dbUser = customers.find((c) => c._id === userId);
    const name = dbUser?.name || o.shippingAddress?.fullName || "Guest Customer";
    const email = dbUser?.email || "—";
    const key = userId || o.shippingAddress?.fullName || "guest";

    if (!customerSalesMap[key]) {
      customerSalesMap[key] = { name, email, orderCount: 0, spend: 0 };
    }
    customerSalesMap[key].orderCount += 1;
    customerSalesMap[key].spend += o.pricing.total;
  });

  const topCustomersList = Object.values(customerSalesMap)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  // Export CSV Handler
  const handleExport = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";
    const todayStr = new Date().toISOString().split("T")[0];

    if (reportType === "master_ledger") {
      filename = `master_business_ledger_${todayStr}.csv`;
      headers = [
        "Order ID",
        "Order Date",
        "Order Status",
        "Customer Name",
        "Customer Email",
        "Customer Phone",
        "Shipping Address Line 1",
        "Shipping City",
        "Shipping State",
        "Shipping Pin",
        "Payment Method",
        "Payment Status",
        "Coupon Code",
        "Coupon Discount (INR)",
        "Shipping Collected (INR)",
        "Order Subtotal (INR)",
        "Order Total Paid (INR)",
        "Item Product ID",
        "Item Name",
        "Item Brand",
        "Item Category",
        "Item Size",
        "Item Color",
        "Item Unit Price (INR)",
        "Item Quantity",
        "Estimated Item COGS (INR)",
        "Estimated Item Net Margin (INR)",
        "Shipping Courier",
        "Tracking AWB Number",
        "Refund Preference",
        "Refund UPI ID",
        "Refund Account Holder",
        "Refund Bank Name",
        "Refund Account Number",
        "Refund IFSC Code",
        "Refund Transaction ID",
        "Refund Date",
      ];

      currentOrders.forEach((o) => {
        const dbUser = customers.find((c) => c._id === o.userId);
        const customerName = dbUser?.name || o.shippingAddress?.fullName || "Guest Customer";
        const customerEmail = dbUser?.email || "—";
        const customerPhone = o.shippingAddress?.phone || "—";
        const addressLine1 = o.shippingAddress?.line1 || "";
        const city = o.shippingAddress?.city || "";
        const state = o.shippingAddress?.state || "";
        const pin = o.shippingAddress?.pin || "";

        o.items.forEach((item) => {
          const qty = item.qty || 1;
          const price = item.price || 0;
          const itemCogs = price * qty * 0.6;
          const margin = price * qty - itemCogs;

          const p = products.find((prod) => prod._id === item.productId);
          const brandName = p ? brandMap.get(p.brand) || "Raja Boot House" : "Raja Boot House";
          const categoryName = p ? categoryMap.get(p.category) || "Uncategorized" : "Uncategorized";

          rows.push([
            o.orderId,
            o.createdAt.split("T")[0],
            o.status,
            customerName,
            customerEmail,
            customerPhone,
            addressLine1,
            city,
            state,
            pin,
            o.payment.method,
            o.payment.status,
            o.coupon?.code || "—",
            (o.pricing.couponDiscount || 0).toString(),
            (o.pricing.shipping || 0).toString(),
            (o.pricing.subtotal || 0).toString(),
            (o.pricing.total || 0).toString(),
            item.productId,
            item.name,
            brandName,
            categoryName,
            item.size.toString(),
            item.color,
            price.toString(),
            qty.toString(),
            itemCogs.toFixed(2),
            margin.toFixed(2),
            o.shipping?.courier || "—",
            o.shipping?.trackingNumber || "—",
            o.refundDetails?.preference || "—",
            o.refundDetails?.upiId || "—",
            o.refundDetails?.bankDetails?.accountHolderName || "—",
            o.refundDetails?.bankDetails?.bankName || "—",
            o.refundDetails?.bankDetails?.accountNumber || "—",
            o.refundDetails?.bankDetails?.ifscCode || "—",
            o.refundDetails?.transactionId || "—",
            o.refundDetails?.refundedAt ? o.refundDetails.refundedAt.split("T")[0] : "—",
          ]);
        });
      });
    } else if (reportType === "sales_summary") {
      filename = `financial_sales_summary_${todayStr}.csv`;
      headers = [
        "Date",
        "Placed Orders Count",
        "Gross Revenue (INR)",
        "Coupon Discounts (INR)",
        "Cancellations Value (INR)",
        "Refunds Value (INR)",
        "Net Sales Revenue (INR)",
        "Estimated COGS (INR)",
        "Gross Profit (INR)",
        "Estimated Net Profit (INR)",
      ];

      const dailyMap: Record<
        string,
        {
          placedCount: number;
          grossSales: number;
          discounts: number;
          cancellations: number;
          refunds: number;
          netSales: number;
          cogs: number;
          netProfit: number;
        }
      > = {};

      currentOrders.forEach((o) => {
        const day = o.createdAt.split("T")[0];
        if (!dailyMap[day]) {
          dailyMap[day] = {
            placedCount: 0,
            grossSales: 0,
            discounts: 0,
            cancellations: 0,
            refunds: 0,
            netSales: 0,
            cogs: 0,
            netProfit: 0,
          };
        }

        const subtotal = o.pricing.subtotal || 0;
        const shipping = o.pricing.shipping || 0;
        const discount = o.pricing.couponDiscount || 0;
        const total = o.pricing.total || 0;

        dailyMap[day].placedCount += 1;
        dailyMap[day].grossSales += subtotal + shipping;
        dailyMap[day].discounts += discount;

        if (o.status === "CANCELLED") {
          dailyMap[day].cancellations += total;
        } else if (["RETURNED", "REFUNDED"].includes(o.status)) {
          dailyMap[day].refunds += total;
        } else {
          // cogs
          let orderCogs = 0;
          o.items.forEach((item) => {
            orderCogs += (item.price || 0) * (item.qty || 1) * 0.6;
          });
          dailyMap[day].cogs += orderCogs;
        }
      });

      const sortedDays = Object.keys(dailyMap).sort((a, b) => b.localeCompare(a));
      rows = sortedDays.map((day) => {
        const stats = dailyMap[day];
        const netSalesVal =
          stats.grossSales - stats.discounts - stats.cancellations - stats.refunds;
        const grossProfitVal = netSalesVal - stats.cogs;
        const netProfitVal = grossProfitVal; // shipping offsets expenses

        return [
          day,
          stats.placedCount.toString(),
          stats.grossSales.toFixed(2),
          stats.discounts.toFixed(2),
          stats.cancellations.toFixed(2),
          stats.refunds.toFixed(2),
          netSalesVal.toFixed(2),
          stats.cogs.toFixed(2),
          grossProfitVal.toFixed(2),
          netProfitVal.toFixed(2),
        ];
      });
    } else if (reportType === "product_performance") {
      filename = `product_sales_profitability_${todayStr}.csv`;
      headers = [
        "Product ID",
        "Product Name",
        "Brand",
        "Category",
        "MRP (INR)",
        "Selling Price (INR)",
        "Units Sold",
        "Gross Revenue (INR)",
        "Estimated COGS (INR)",
        "Estimated Net Profit (INR)",
        "Stock Available",
      ];

      const salesCount: Record<string, number> = {};
      currentOrders.forEach((o) => {
        if (["CANCELLED", "RETURNED", "REFUNDED"].includes(o.status)) return;
        o.items.forEach((item) => {
          salesCount[item.productId] = (salesCount[item.productId] || 0) + (item.qty || 1);
        });
      });

      rows = products
        .map((p) => {
          const qtySold = salesCount[p._id] || 0;
          const grossRev = qtySold * p.salePrice;
          const prodCogs = grossRev * 0.6;
          const profit = grossRev - prodCogs;

          const brandName = brandMap.get(p.brand) || "Raja Boot House";
          const categoryName = categoryMap.get(p.category) || "Uncategorized";
          return [
            p._id,
            p.name,
            brandName,
            categoryName,
            p.price.toString(),
            p.salePrice.toString(),
            qtySold.toString(),
            grossRev.toFixed(2),
            prodCogs.toFixed(2),
            profit.toFixed(2),
            p.stock.toString(),
          ];
        })
        .sort((a, b) => Number(b[9]) - Number(a[9])); // sort by profit
    } else if (reportType === "detailed_orders") {
      filename = `detailed_orders_financial_ledger_${todayStr}.csv`;
      headers = [
        "Order ID",
        "Order Date",
        "Customer Name",
        "Customer Email",
        "Order Status",
        "Payment Method",
        "Payment Status",
        "Subtotal (INR)",
        "Shipping Fee (INR)",
        "Coupon Discount (INR)",
        "Refund Preference",
        "Refund Transaction ID",
        "Total Paid Amount (INR)",
        "Estimated COGS (INR)",
        "Estimated Margin (INR)",
      ];

      rows = currentOrders.map((o) => {
        const dbUser = customers.find((c) => c._id === o.userId);
        const name = dbUser?.name || o.shippingAddress?.fullName || "Guest Customer";
        const email = dbUser?.email || "—";

        let orderCogs = 0;
        if (!["CANCELLED", "RETURNED", "REFUNDED"].includes(o.status)) {
          o.items.forEach((item) => {
            orderCogs += (item.price || 0) * (item.qty || 1) * 0.6;
          });
        }
        const orderTotal = o.pricing.total || 0;
        const margin = ["CANCELLED", "RETURNED", "REFUNDED"].includes(o.status)
          ? 0
          : orderTotal - orderCogs;

        return [
          o.orderId,
          o.createdAt.split("T")[0],
          name,
          email,
          o.status,
          o.payment.method,
          o.payment.status,
          o.pricing.subtotal.toString(),
          o.pricing.shipping.toString(),
          o.pricing.couponDiscount.toString(),
          o.refundDetails?.preference || "—",
          o.refundDetails?.transactionId || "—",
          orderTotal.toString(),
          orderCogs.toFixed(2),
          margin.toFixed(2),
        ];
      });
    } else if (reportType === "customer_activity") {
      filename = `customer_ltv_profitability_${todayStr}.csv`;
      headers = [
        "Customer ID",
        "Name",
        "Email",
        "Sign-Up Date",
        "Total Orders Count",
        "Lifetime Net Spend (INR)",
        "Estimated LTV Gross Profit (INR)",
        "Average Order Value (INR)",
      ];

      const userStats: Record<string, { count: number; spend: number; cogs: number }> = {};
      currentOrders.forEach((o) => {
        if (["CANCELLED", "RETURNED", "REFUNDED"].includes(o.status)) return;
        const key = o.userId || o.shippingAddress?.fullName || "guest";
        if (!userStats[key]) {
          userStats[key] = { count: 0, spend: 0, cogs: 0 };
        }

        let orderCogs = 0;
        o.items.forEach((item) => {
          orderCogs += (item.price || 0) * (item.qty || 1) * 0.6;
        });

        userStats[key].count += 1;
        userStats[key].spend += o.pricing.total;
        userStats[key].cogs += orderCogs;
      });

      rows = customers
        .map((c) => {
          const stats = userStats[c._id] || { count: 0, spend: 0, cogs: 0 };
          const profit = stats.spend - stats.cogs;
          const aov = stats.count > 0 ? (stats.spend / stats.count).toFixed(2) : "0.00";
          return [
            c._id,
            c.name,
            c.email,
            c.createdAt.split("T")[0],
            stats.count.toString(),
            stats.spend.toFixed(2),
            profit.toFixed(2),
            aov,
          ];
        })
        .sort((a, b) => Number(b[6]) - Number(a[6])); // sort by total customer profit
    }

    if (rows.length === 0) {
      toast.warning("No data found to export in the selected timeframe.");
      return;
    }

    // Generate CSV contents
    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Successfully exported ${filename}`);
  };

  return (
    <DashboardPage
      eyebrow="Insights & Performance"
      title="Analytics Dashboard"
      action={
        <div className="flex items-center gap-3 bg-card border border-border p-1.5 rounded-xl shadow-sm">
          <Calendar className="h-4 w-4 text-cognac ml-2 hidden sm:block" />
          <div className="flex gap-1">
            {(["7d", "30d", "90d", "all"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tf === "all" ? "All Time" : tf}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Net Sales Revenue"
          value={formatINR(currentKPIs.netSales)}
          delta={salesDelta}
          icon={IndianRupee}
        />
        <StatCard
          label="Total Orders Placed"
          value={currentKPIs.totalOrders.toString()}
          delta={ordersDelta}
          icon={ShoppingCart}
          tint="accent"
        />
        <StatCard
          label="Average Order Value"
          value={formatINR(currentKPIs.aov)}
          delta={aovDelta}
          icon={TrendingUp}
          tint="brass"
        />
        <StatCard
          label="Estimated Net Profit"
          value={formatINR(currentKPIs.netProfit)}
          delta={
            timeframe === "all" ? 0 : getGrowthDelta(currentKPIs.netProfit, prevKPIs.netProfit)
          }
          icon={TrendingUp}
          tint="brass"
        />
        <StatCard
          label="Total Returns"
          value={formatINR(currentKPIs.totalReturnsValue)}
          delta={
            timeframe === "all"
              ? 0
              : getGrowthDelta(currentKPIs.totalReturnsValue, prevKPIs.totalReturnsValue)
          }
          icon={TrendingDown}
          tint="muted"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border/80 gap-2 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Overview Insights" },
          { id: "financials", label: "Financial Statement (P&L)" },
          { id: "status_funnel", label: "Order Status Funnel" },
          { id: "refunds", label: "Refund Analysis" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab rendering */}
      {activeTab === "overview" && (
        <>
          {/* Main Charts Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Trend Area Chart (Custom Interactive SVG) */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Revenue Over Time
                  </span>
                  <h3 className="font-serif font-bold text-lg text-foreground">Sales Trend</h3>
                </div>
                {salesDelta !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                      salesDelta >= 0
                        ? "bg-green-500/10 text-green-600"
                        : "bg-red-500/10 text-red-600"
                    }`}
                  >
                    {salesDelta >= 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    <span>{Math.abs(salesDelta)}%</span>
                  </div>
                )}
              </div>

              <div
                className="relative w-full h-[240px] select-none mt-2"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Interactive Tooltip Floating HTML Overlay */}
                {hoveredIndex !== null && chartData[hoveredIndex] && (
                  <div
                    className="absolute bg-charcoal text-cream text-xs rounded-xl p-3 shadow-xl border border-brass/20 pointer-events-none transition-all duration-75 z-20 whitespace-nowrap flex flex-col gap-0.5"
                    style={{
                      left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
                      top: `${(points[hoveredIndex].y / svgHeight) * 100 - 10}%`,
                      transform: "translate(-50%, -100%)",
                    }}
                  >
                    <div className="font-bold text-[10px] text-brass/75 uppercase tracking-wider">
                      {chartData[hoveredIndex].label}
                    </div>
                    <div className="text-sm font-serif font-bold mt-0.5">
                      {formatINR(chartData[hoveredIndex].revenue)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {chartData[hoveredIndex].orders} Orders
                    </div>
                  </div>
                )}

                {/* SVG Line / Area Graph */}
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-full overflow-visible"
                  onMouseMove={handleMouseMove}
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#846358" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#846358" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines & labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => {
                    const y = paddingTop + chartHeight - fraction * chartHeight;
                    const value = fraction * maxRevenue;
                    return (
                      <g key={i} className="opacity-40">
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={svgWidth - paddingRight}
                          y2={y}
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                          className="text-border"
                        />
                        <text
                          x={paddingLeft - 8}
                          y={y}
                          textAnchor="end"
                          alignmentBaseline="middle"
                          className="text-[10px] font-semibold fill-muted-foreground"
                        >
                          {value >= 100000
                            ? `₹${(value / 100000).toFixed(1)}L`
                            : value >= 1000
                              ? `₹${(value / 1000).toFixed(0)}K`
                              : `₹${value}`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area path with color gradient fill */}
                  {points.length > 0 && (
                    <path
                      d={areaPath}
                      fill="url(#chartGradient)"
                      className="transition-all duration-300"
                    />
                  )}

                  {/* Sparkline path */}
                  {points.length > 0 && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#846358"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-300"
                    />
                  )}

                  {/* Active hover indicators */}
                  {hoveredIndex !== null && points[hoveredIndex] && (
                    <g>
                      {/* Vertical cursor guide line */}
                      <line
                        x1={points[hoveredIndex].x}
                        y1={paddingTop}
                        x2={points[hoveredIndex].x}
                        y2={paddingTop + chartHeight}
                        stroke="#846358"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        className="opacity-70"
                      />
                      {/* Outer pulsing target dot */}
                      <circle
                        cx={points[hoveredIndex].x}
                        cy={points[hoveredIndex].y}
                        r="8"
                        fill="#846358"
                        opacity="0.3"
                      />
                      {/* Inner solid dot */}
                      <circle
                        cx={points[hoveredIndex].x}
                        cy={points[hoveredIndex].y}
                        r="4.5"
                        fill="#846358"
                        stroke="#fff"
                        strokeWidth="2"
                      />
                    </g>
                  )}

                  {/* X Axis Labels */}
                  {chartData.map((d, idx) => {
                    const skipInterval = Math.max(1, Math.round(chartData.length / 6));
                    if (idx % skipInterval !== 0 && idx !== chartData.length - 1) return null;

                    const x =
                      paddingLeft +
                      (chartData.length > 1
                        ? (idx / (chartData.length - 1)) * chartWidth
                        : chartWidth / 2);
                    return (
                      <text
                        key={idx}
                        x={x}
                        y={svgHeight - 12}
                        textAnchor="middle"
                        className="text-[10px] font-semibold fill-muted-foreground opacity-85"
                      >
                        {d.label}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Payment Shares Donut Chart */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Sales Distribution
                </span>
                <h3 className="font-serif font-bold text-lg text-foreground mb-4">
                  Payment Methods
                </h3>
              </div>

              <div className="flex justify-center items-center py-4">
                <div
                  className="relative w-40 h-40 rounded-full shadow-inner flex items-center justify-center transition-all duration-300"
                  style={{ background: donutGradient }}
                >
                  <div className="w-28 h-28 bg-card rounded-full flex flex-col items-center justify-center shadow-md">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Net Sales
                    </span>
                    <span className="text-sm font-serif font-bold mt-0.5">
                      {formatINR(currentKPIs.netSales)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 mt-2">
                {donutSlices.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center">
                    No orders recorded in this period.
                  </p>
                ) : (
                  donutSlices.map((slice) => (
                    <div key={slice.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="font-semibold text-foreground/80">{slice.name}</span>
                      </div>
                      <span className="font-medium text-muted-foreground">
                        {formatINR(slice.revenue)} ({slice.percentage}%)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Leaderboards row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Sales by Category progress bars */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Tag className="h-4.5 w-4.5 text-cognac" />
                <h3 className="font-serif font-bold text-lg">Sales by Category</h3>
              </div>
              <div className="space-y-4.5">
                {categoryStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No sales recorded yet.</p>
                ) : (
                  categoryStats.map((c) => (
                    <div key={c.name}>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span>{c.name}</span>
                        <span className="text-muted-foreground">
                          {formatINR(c.revenue)} ({c.pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${c.pct}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sales by Brand progress bars */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Award className="h-4.5 w-4.5 text-cognac" />
                <h3 className="font-serif font-bold text-lg">Sales by Brand</h3>
              </div>
              <div className="space-y-4.5">
                {brandStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No sales recorded yet.</p>
                ) : (
                  brandStats.map((b) => (
                    <div key={b.name}>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span>{b.name}</span>
                        <span className="text-muted-foreground">
                          {formatINR(b.revenue)} ({b.pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-cognac" style={{ width: `${b.pct}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Lists Row: Top products & customer spending */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Top Performing Products */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Grid className="h-4.5 w-4.5 text-cognac" />
                <h3 className="font-serif font-bold text-lg">Top Performing Products</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold">
                      <th className="py-2.5 font-bold uppercase tracking-wider">Product</th>
                      <th className="py-2.5 font-bold uppercase tracking-wider">Brand</th>
                      <th className="py-2.5 font-bold uppercase tracking-wider">Category</th>
                      <th className="py-2.5 font-bold uppercase tracking-wider text-right">
                        Units Sold
                      </th>
                      <th className="py-2.5 font-bold uppercase tracking-wider text-right">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {topProductsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-muted-foreground italic">
                          No product sales in this period.
                        </td>
                      </tr>
                    ) : (
                      topProductsList.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 flex items-center gap-3 pr-2">
                            <div className="h-9 w-9 bg-muted rounded-lg overflow-hidden shrink-0 border border-border/40">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-[200px]">
                              {item.name}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground font-medium">{item.brand}</td>
                          <td className="py-3 text-muted-foreground font-medium">
                            {item.category}
                          </td>
                          <td className="py-3 text-right font-semibold text-foreground/80">
                            {item.qtySold}
                          </td>
                          <td className="py-3 text-right font-serif font-bold text-cognac">
                            {formatINR(item.revenue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Leaderboard (Spending) */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-4.5 w-4.5 text-cognac" />
                  <h3 className="font-serif font-bold text-lg">Top Customer Spend</h3>
                </div>

                <div className="space-y-4">
                  {topCustomersList.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">
                      No orders recorded in this period.
                    </p>
                  ) : (
                    topCustomersList.map((customer, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-xs text-foreground truncate">
                            {customer.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {customer.email}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-serif font-bold text-xs text-cognac">
                            {formatINR(customer.spend)}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {customer.orderCount} Orders
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "financials" && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-4xl mx-auto">
          <div className="border-b border-border pb-4 mb-6">
            <h3 className="font-serif font-bold text-xl text-foreground">
              Profit & Loss (P&L) Financial Statement
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Statement of operations for the selected timeframe. All amounts in Indian Rupees
              (INR).
            </p>
          </div>

          <div className="space-y-4">
            {/* Revenue section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Operating Revenue
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-1.5 border-b border-border/40">
                  <span className="text-foreground/80 pl-2">Gross Sales (Subtotal + Shipping)</span>
                  <span className="font-semibold text-foreground">
                    {formatINR(currentKPIs.grossSales)}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-border/40">
                  <span className="text-foreground/80 pl-2">Coupon Discounts Redeemed</span>
                  <span className="font-semibold text-red-500">
                    -{formatINR(currentKPIs.couponDiscounts)}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-border/40">
                  <span className="text-foreground/80 pl-2">Order Cancellations (Value Lost)</span>
                  <span className="font-semibold text-red-500">
                    -{formatINR(currentKPIs.cancellationsValue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-border/40">
                  <span className="text-foreground/80 pl-2">Returns & Refunds Deducted</span>
                  <span className="font-semibold text-red-500">
                    -{formatINR(currentKPIs.refundsValue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold bg-muted/30 px-3 py-2 rounded-lg mt-1">
                  <span className="text-foreground">Net Sales Revenue</span>
                  <span className="text-primary">{formatINR(currentKPIs.netSales)}</span>
                </div>
              </div>
            </div>

            {/* Cost of sales section */}
            <div className="pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Cost of Goods & Operations
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-1.5 border-b border-border/40">
                  <span className="text-foreground/80 pl-2">
                    Cost of Goods Sold (COGS){" "}
                    <span className="text-[10px] text-muted-foreground font-normal">
                      (Estimated 60% of item sales price)
                    </span>
                  </span>
                  <span className="font-semibold text-red-500">-{formatINR(currentKPIs.cogs)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold bg-muted/30 px-3 py-2 rounded-lg mt-1">
                  <span className="text-foreground">Gross Profit</span>
                  <span className="text-cognac">{formatINR(currentKPIs.grossProfit)}</span>
                </div>
              </div>
            </div>

            {/* Other expenses / Income section */}
            <div className="pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Expenses & Operational Costs
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-1.5 border-b border-border/40">
                  <span className="text-foreground/80 pl-2">Shipping Charges Collected</span>
                  <span className="font-semibold text-green-600">
                    +{formatINR(currentKPIs.shippingRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-border/40">
                  <span className="text-foreground/80 pl-2">
                    Payment Gateway Fees{" "}
                    <span className="text-[10px] text-muted-foreground font-normal">
                      (Estimated 2.0% of online transactions)
                    </span>
                  </span>
                  <span className="font-semibold text-red-500">
                    -{formatINR(currentKPIs.gatewayFees)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold bg-primary/10 px-3 py-2.5 rounded-lg border border-primary/20 mt-1.5">
                  <span className="text-primary font-bold">Estimated Net Profit</span>
                  <span className="text-primary font-serif text-lg font-bold">
                    {formatINR(currentKPIs.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Margins breakdown cards */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
            <div className="bg-muted/40 p-4 rounded-xl border border-border/50 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Gross Profit Margin
                </span>
                <p className="text-2xl font-bold font-serif text-cognac mt-1">
                  {currentKPIs.grossMargin.toFixed(1)}%
                </p>
              </div>
              <div className="w-full bg-border h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-cognac h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, currentKPIs.grossMargin))}%` }}
                />
              </div>
            </div>
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Net Profit Margin
                </span>
                <p className="text-2xl font-bold font-serif text-primary mt-1">
                  {currentKPIs.netMargin.toFixed(1)}%
                </p>
              </div>
              <div className="w-full bg-border h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, currentKPIs.netMargin))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "status_funnel" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-serif font-bold text-lg text-foreground mb-4">
              Detailed Order Lifecycle Funnel
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Track conversion and volume flow of orders across all processing stages in the
              selected timeframe.
            </p>

            <div className="space-y-4">
              {Object.entries(currentKPIs.statusCounts).map(([status, item]) => {
                const percentage =
                  currentKPIs.totalOrders > 0 ? (item.count / currentKPIs.totalOrders) * 100 : 0;
                let barColor = "bg-primary";
                if (status === "CANCELLED") barColor = "bg-red-400";
                if (status === "RETURNED" || status === "REFUNDED") barColor = "bg-orange-400";
                if (status === "DELIVERED") barColor = "bg-green-500";

                return (
                  <div
                    key={status}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="w-40 shrink-0">
                      <span className="text-xs font-semibold text-foreground/80">{status}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-1 h-3.5 bg-muted rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full ${barColor} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-32 text-right shrink-0">
                        <span className="text-xs font-bold text-foreground">
                          {item.count} orders
                        </span>
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          ({percentage.toFixed(1)}% share)
                        </span>
                      </div>
                      <div className="w-24 text-right shrink-0">
                        <span className="text-xs font-bold text-cognac">
                          {formatINR(item.value)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rates cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Order Cancellation Rate
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-bold font-serif text-red-500">
                  {currentKPIs.cancellationRate.toFixed(1)}%
                </p>
                <span className="text-xs text-muted-foreground">of placed orders</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                Percentage of total orders placed that were cancelled before shipping.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Return & Refund Rate
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-bold font-serif text-orange-500">
                  {currentKPIs.returnRate.toFixed(1)}%
                </p>
                <span className="text-xs text-muted-foreground">of placed orders</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                Percentage of total orders returned or refunded post-delivery.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "refunds" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Refund preferences chart */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground mb-4">
                  Refund Channel Preferences
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Preferred return routing methods chosen by customers during return requests.
                </p>
              </div>

              <div className="space-y-4">
                {Object.entries(currentKPIs.refundPrefs).map(([pref, item]) => {
                  const totalRefundValue =
                    Object.values(currentKPIs.refundPrefs).reduce((sum, v) => sum + v.value, 0) ||
                    1;
                  const percentage = Math.round((item.value / totalRefundValue) * 100);

                  return (
                    <div key={pref} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>
                          {pref === "ORIGINAL"
                            ? "Original Payment Method"
                            : pref === "BANK"
                              ? "Bank Account Transfer"
                              : pref === "UPI"
                                ? "UPI ID Transfer"
                                : "Unspecified Cash/COD"}
                        </span>
                        <span className="text-muted-foreground">
                          {formatINR(item.value)} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-brass" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Refund processing status */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground mb-2">
                  Refund Processing Status
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Aggregate of returned orders and refund status values in this timeframe.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Total Completed Refunds
                    </span>
                    <p className="text-xl font-serif font-bold text-green-600 mt-1">
                      {formatINR(
                        currentOrders
                          .filter((o) => o.status === "REFUNDED")
                          .reduce((sum, o) => sum + o.pricing.total, 0),
                      )}
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
                    {currentOrders.filter((o) => o.status === "REFUNDED").length} Orders
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-500/5 rounded-xl border border-orange-500/10">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Total Pending Refunds
                    </span>
                    <p className="text-xl font-serif font-bold text-orange-500 mt-1">
                      {formatINR(
                        currentOrders
                          .filter((o) => ["RETURNED", "RETURN_REQUESTED"].includes(o.status))
                          .reduce((sum, o) => sum + o.pricing.total, 0),
                      )}
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full">
                    {
                      currentOrders.filter((o) =>
                        ["RETURNED", "RETURN_REQUESTED"].includes(o.status),
                      ).length
                    }{" "}
                    Orders
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Center Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Download className="h-4.5 w-4.5 text-cognac" />
            <h3 className="font-serif font-bold text-lg">Download Center</h3>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
            Excel/CSV Exports
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-6 max-w-2xl leading-relaxed">
          Generate and export complete structured reports for further analysis. Reports are built
          on-the-fly based on the currently selected timeframe (
          {timeframe === "all"
            ? "All Time"
            : timeframe === "7d"
              ? "last 7 days"
              : timeframe === "30d"
                ? "last 30 days"
                : "last 90 days"}
          ).
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 max-w-sm">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-cream text-charcoal border border-border hover:border-brass/40 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass transition cursor-pointer"
            >
              <option value="master_ledger">Master Business Ledger (Complete Admin Export)</option>
              <option value="sales_summary">Sales & Revenue P&L Summary</option>
              <option value="product_performance">Product Sales & Profitability</option>
              <option value="detailed_orders">Detailed Financial Orders Ledger</option>
              <option value="customer_activity">Customer LTV & Profitability</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-cognac text-primary-foreground font-semibold text-xs px-5 py-3 rounded-xl shadow-sm transition-all cursor-pointer hover:shadow-md"
          >
            <Download className="h-4 w-4" />
            <span>Export Report (CSV)</span>
          </button>
        </div>
      </div>
    </DashboardPage>
  );
}
