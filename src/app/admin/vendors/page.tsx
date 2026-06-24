import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { connectToDatabase as dbConnect } from "@/lib/db";
import User from "@/lib/models/User";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import { VendorsClient } from "./VendorsClient";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage({
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
  const statusFilter = params.status || "";

  const query: any = { role: "vendor" };

  if (statusFilter === "active") {
    query.isActive = true;
  } else if (statusFilter === "pending") {
    query.isActive = false;
  }

  if (q) {
    query.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];
  }

  const sortObj: any = {};
  sortObj[sortKey] = sortOrder;

  const [vendorsRaw, totalItems] = await Promise.all([
    User.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  // Pre-fetch all vendor products and orders
  const vendorIds = vendorsRaw.map((v: any) => v._id);

  const [allVendorProducts, allVendorOrders] = await Promise.all([
    Product.find({ vendorId: { $in: vendorIds } })
      .select("vendorId")
      .lean(),
    Order.find({ "items.vendorId": { $in: vendorIds } }).lean(), // Assuming order items could store vendorId for split carts
  ]);

  const vendors = vendorsRaw.map((v: any) => {
    const productsCount = allVendorProducts.filter(
      (p: any) => p.vendorId?.toString() === v._id.toString(),
    ).length;
    // Compute revenue from orders that have items belonging to this vendor
    let revenue = 0;
    allVendorOrders.forEach((o: any) => {
      o.items.forEach((item: any) => {
        if (item.vendorId?.toString() === v._id.toString()) {
          revenue += item.price * item.quantity;
        }
      });
    });

    return {
      id: v._id.toString(),
      name: v.name,
      email: v.email,
      joinedAt: v.createdAt?.toISOString() || new Date().toISOString(),
      productsCount,
      revenue,
      isActive: v.isActive,
    };
  });

  return (
    <DashboardPage eyebrow="Marketplace" title="Vendors">
      <VendorsClient vendors={vendors} totalItems={totalItems} />
    </DashboardPage>
  );
}
