import mongoose, { Schema, Document } from "mongoose";

export interface IDisputeMessage {
  sender: "customer" | "vendor" | "support" | "admin";
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  message: string;
  timestamp: Date;
}

export interface IDispute extends Document {
  disputeId: string;
  orderId: mongoose.Types.ObjectId;
  orderSeqId: string;
  subOrderId?: mongoose.Types.ObjectId;
  subOrderSeqId?: string;
  customerId: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  type: "WRONG_ITEM" | "DAMAGED" | "NOT_DELIVERED" | "QUALITY" | "OTHER";
  description: string;
  evidenceImages: string[];
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
  assignedTo?: mongoose.Types.ObjectId;
  resolution?: {
    action: "REFUND_WALLET" | "REFUND_GATEWAY" | "REPLACEMENT" | "REJECTED" | "OTHER";
    refundAmount?: number;
    walletCredit?: number;
    vendorPenalty?: number;
    resolvedAt?: Date;
    resolvedBy?: mongoose.Types.ObjectId;
  };
  messages: IDisputeMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const DisputeMessageSchema = new Schema({
  sender: { type: String, enum: ["customer", "vendor", "support", "admin"], required: true },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const DisputeSchema = new Schema(
  {
    disputeId: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    orderSeqId: { type: String, required: true, index: true },
    subOrderId: { type: Schema.Types.ObjectId, ref: "SubOrder", index: true },
    subOrderSeqId: { type: String, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    type: {
      type: String,
      enum: ["WRONG_ITEM", "DAMAGED", "NOT_DELIVERED", "QUALITY", "OTHER"],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    evidenceImages: [{ type: String }],
    status: {
      type: String,
      enum: ["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    resolution: {
      action: {
        type: String,
        enum: ["REFUND_WALLET", "REFUND_GATEWAY", "REPLACEMENT", "REJECTED", "OTHER"],
      },
      refundAmount: { type: Number },
      walletCredit: { type: Number },
      vendorPenalty: { type: Number },
      resolvedAt: { type: Date },
      resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    messages: [DisputeMessageSchema],
  },
  { timestamps: true },
);

export default mongoose.models.Dispute || mongoose.model<IDispute>("Dispute", DisputeSchema);
