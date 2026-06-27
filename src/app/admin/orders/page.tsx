import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { connectToDatabase as dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import { OrdersClient } from "./OrdersClient";
import { cleanupExpiredPendingOrders } from "@/lib/db-utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await dbConnect();

  // Passively cleanup any expired pending orders
  await cleanupExpiredPendingOrders();

  const params = await searchParams;

  const q = params.q || "";
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const sortKey = params.sort || "createdAt";
  const sortOrder = params.order === "asc" ? 1 : -1;
  const statusFilter = params.status || "";

  const query: any = {
    $or: [{ "payment.method": "COD" }, { "payment.status": { $ne: "PENDING" } }],
  };
  if (statusFilter) {
    query.status = statusFilter.toUpperCase();
  }
  if (q) {
    query.orderId = { $regex: q, $options: "i" };
  }

  const sortObj: any = {};
  // If sortKey is total, map to pricing.total
  if (sortKey === "total") {
    sortObj["pricing.total"] = sortOrder;
  } else if (sortKey === "payment") {
    sortObj["payment.method"] = sortOrder;
  } else {
    sortObj[sortKey] = sortOrder;
  }

  const [ordersRaw, totalItems, statusCountsRaw] = await Promise.all([
    Order.find(query)
      .populate({ path: "userId", model: User, select: "name email" })
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(query),
    Order.aggregate([
      {
        $match: {
          $or: [{ "payment.method": "COD" }, { "payment.status": { $ne: "PENDING" } }],
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const statusCounts: Record<string, number> = {};
  let totalCount = 0;
  statusCountsRaw.forEach((c: any) => {
    if (c._id) {
      statusCounts[c._id.toUpperCase()] = c.count;
      totalCount += c.count;
    }
  });
  statusCounts["ALL"] = totalCount;

  const orders = ordersRaw.map((o: any) => ({
    id: o._id.toString(),
    orderId: o.orderId,
    customerName: o.userId?.name || "Guest",
    itemCount: o.items?.length || 0,
    paymentMethod: o.payment?.method || "N/A",
    createdAt: o.createdAt.toISOString(),
    status: o.status,
    total: o.pricing?.total || 0,
    shipping: o.shipping || null,
  }));

  return (
    <DashboardPage eyebrow="Order Processing" title="Orders">
      <OrdersClient orders={orders} totalItems={totalItems} statusCounts={statusCounts} />
    </DashboardPage>
  );
}
