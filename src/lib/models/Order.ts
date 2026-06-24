import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  image: string;
  size: string; // changed to string
  color: string;
  price: number;
  qty: number;
  returnDays?: number;
  vendorId: mongoose.Types.ObjectId;
  subOrderId?: mongoose.Types.ObjectId;
}

export interface IOrderHistory {
  status: string;
  timestamp: Date;
  note?: string;
}

export interface IOrder extends Document {
  orderId: string;
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subOrders?: mongoose.Types.ObjectId[];
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pin: string;
    country: string;
  };
  pricing: {
    subtotal: number;
    shipping: number;
    couponDiscount: number;
    pointsDiscount?: number;
    // GST frozen at purchase time (India legal requirement — invoices must not recompute)
    taxRate?: number;
    taxableAmount?: number;
    cgst?: number;
    sgst?: number;
    tax?: number;
    total: number;
  };
  coupon?: {
    code: string;
    discountAmount: number;
  };
  payment: {
    method: "UPI" | "Card" | "Net Banking" | "Wallet" | "COD";
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    status: "PENDING" | "PAID" | "FAILED" | "REFUND_PENDING" | "REFUNDED";
  };
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
  statusHistory: IOrderHistory[];
  refundDetails?: {
    preference?: "ORIGINAL" | "BANK" | "UPI";
    upiId?: string;
    bankDetails?: {
      accountHolderName: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
    };
    method?: "ONLINE" | "CASH" | "BANK_TRANSFER" | "UPI";
    transactionId?: string;
    refundedAt?: Date;
    payoutBatchId?: string;
  };
  shipping?: {
    deliveryMethod?: "SELF" | "THIRD_PARTY";
    deliveryPersonName?: string;
    deliveryPersonPhone?: string;
    courier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  auditLogs?: {
    action: string;
    performedBy: mongoose.Types.ObjectId | string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    details?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  size: { type: String, required: true }, // Changed from Number to String
  color: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  returnDays: { type: Number, default: 7 },
  vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  subOrderId: { type: Schema.Types.ObjectId, ref: "SubOrder", index: true },
});

const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
});

const OrderSchema: Schema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [OrderItemSchema],
    subOrders: [{ type: Schema.Types.ObjectId, ref: "SubOrder", index: true }],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pin: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      shipping: { type: Number, required: true, default: 0 },
      couponDiscount: { type: Number, required: true, default: 0 },
      pointsDiscount: { type: Number, default: 0 },
      // GST frozen at purchase time (India legal requirement — invoices must not recompute)
      taxRate: { type: Number, default: 0 },
      taxableAmount: { type: Number, default: 0 },
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    coupon: {
      code: { type: String },
      discountAmount: { type: Number, default: 0 },
    },
    payment: {
      method: {
        type: String,
        enum: ["UPI", "Card", "Net Banking", "Wallet", "COD"],
        required: true,
      },
      razorpayOrderId: { type: String, index: true },
      razorpayPaymentId: { type: String },
      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED", "REFUND_PENDING", "REFUNDED"],
        default: "PENDING",
        index: true,
      },
    },
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
    statusHistory: [StatusHistorySchema],
    refundDetails: {
      preference: { type: String, enum: ["ORIGINAL", "BANK", "UPI"], index: true },
      upiId: { type: String },
      bankDetails: {
        accountHolderName: { type: String },
        bankName: { type: String },
        accountNumber: { type: String },
        ifscCode: { type: String },
      },
      method: { type: String, enum: ["ONLINE", "CASH", "BANK_TRANSFER", "UPI"] },
      transactionId: { type: String },
      refundedAt: { type: Date },
      payoutBatchId: { type: String, index: true },
    },
    shipping: {
      deliveryMethod: { type: String, enum: ["SELF", "THIRD_PARTY"], index: true },
      deliveryPersonName: { type: String },
      deliveryPersonPhone: { type: String },
      courier: { type: String },
      trackingNumber: { type: String, index: true },
      trackingUrl: { type: String },
    },
    auditLogs: [
      {
        action: { type: String, required: true },
        performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        timestamp: { type: Date, default: Date.now },
        ipAddress: { type: String },
        userAgent: { type: String },
        details: { type: String },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
