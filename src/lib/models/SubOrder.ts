import mongoose, { Schema, Document } from "mongoose";

export interface ISubOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  qty: number;
}

export interface ISubOrderHistory {
  status: string;
  timestamp: Date;
  note?: string;
}

export interface ISubOrder extends Document {
  subOrderId: string;
  parentOrderId: mongoose.Types.ObjectId;
  parentOrderSeqId: string;
  vendorId: mongoose.Types.ObjectId;
  items: ISubOrderItem[];
  status:
    | "PLACED"
    | "CONFIRMED"
    | "PACKED"
    | "SHIPPED"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURN_REQUESTED"
    | "RETURN_APPROVED"
    | "RETURNED"
    | "REFUNDED";
  statusHistory: ISubOrderHistory[];
  shipping: {
    courier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    deliveryPartnerId?: mongoose.Types.ObjectId;
  };
  pricing: {
    subtotal: number;
    shippingCost: number;
    taxRate: number;
    tax: number;
    couponDiscount: number;
    pointsDiscount: number;
    total: number;
    platformCommission: number;
    commissionRate: number;
    vendorPayout: number;
  };
  payoutStatus: "PENDING" | "PROCESSING" | "COMPLETED";
  payoutId?: mongoose.Types.ObjectId;
  deliveryEstimate?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubOrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
});

const SubOrderHistorySchema = new Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
});

const SubOrderSchema = new Schema(
  {
    subOrderId: { type: String, required: true, unique: true, index: true },
    parentOrderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    parentOrderSeqId: { type: String, required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [SubOrderItemSchema],
    status: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RETURN_REQUESTED",
        "RETURN_APPROVED",
        "RETURNED",
        "REFUNDED",
      ],
      default: "PLACED",
      index: true,
    },
    statusHistory: [SubOrderHistorySchema],
    shipping: {
      courier: { type: String },
      trackingNumber: { type: String },
      trackingUrl: { type: String },
      deliveryPartnerId: { type: Schema.Types.ObjectId, ref: "User" },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      shippingCost: { type: Number, required: true, default: 0 },
      taxRate: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      pointsDiscount: { type: Number, default: 0 },
      total: { type: Number, required: true },
      platformCommission: { type: Number, required: true, default: 0 },
      commissionRate: { type: Number, required: true, default: 10 },
      vendorPayout: { type: Number, required: true },
    },
    payoutStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    payoutId: { type: Schema.Types.ObjectId, ref: "Payout" },
    deliveryEstimate: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.models.SubOrder ||
  mongoose.model<ISubOrder>("SubOrder", SubOrderSchema);
