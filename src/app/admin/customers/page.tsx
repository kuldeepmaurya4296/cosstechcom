import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { connectToDatabase as dbConnect } from "@/lib/db";
import User from "@/lib/models/User";
import Order from "@/lib/models/Order";
import { CustomersClient } from "./CustomersClient";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await dbConnect();
  const params = await searchParams;

  const q = params.q || "";
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const sortKey = params.sort || "createdAt";
  const sortOrder = params.order === "asc" ? 1 : -1;

  const query: any = { role: "customer" };
  if (q) {
    query.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];
  }

  const sortObj: any = {};
  sortObj[sortKey] = sortOrder;

  const [usersRaw, totalItems] = await Promise.all([
    User.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  // Fetch stats for these users
  const userIds = usersRaw.map((u: any) => u._id);
  const ordersRaw = await Order.find({ userId: { $in: userIds } }).lean();

  const customers = usersRaw.map((u: any) => {
    const userOrders = ordersRaw.filter((o: any) => o.userId?.toString() === u._id.toString());
    const totalSpent = userOrders.reduce((sum: number, o: any) => sum + (o.pricing?.total || 0), 0);
    return {
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      joinedAt: u.createdAt?.toISOString() || new Date().toISOString(),
      orders: userOrders.length,
      totalSpent,
    };
  });

  return (
    <DashboardPage eyebrow="People" title="Customers">
      <CustomersClient customers={customers} totalItems={totalItems} />
    </DashboardPage>
  );
}
