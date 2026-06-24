import mongoose, { Schema, Document } from "mongoose";

export interface IPayout extends Document {
  payoutId: string;
  vendorId: mongoose.Types.ObjectId;
  amount: number;
  commissionDeducted: number;
  netPayout: number;
  subOrderIds: mongoose.Types.ObjectId[];
  status: "REQUESTED" | "APPROVED" | "PROCESSING" | "COMPLETED" | "FAILED";
  bankTransactionId?: string;
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  requestedAt: Date;
  periodFrom?: Date;
  periodTo?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema(
  {
    payoutId: { type: String, required: true, unique: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    commissionDeducted: { type: Number, required: true },
    netPayout: { type: Number, required: true },
    subOrderIds: [{ type: Schema.Types.ObjectId, ref: "SubOrder", required: true }],
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "PROCESSING", "COMPLETED", "FAILED"],
      default: "REQUESTED",
      index: true,
    },
    bankTransactionId: { type: String },
    processedAt: { type: Date },
    processedBy: { type: Schema.Types.ObjectId, ref: "User" },
    requestedAt: { type: Date, default: Date.now },
    periodFrom: { type: Date },
    periodTo: { type: Date },
    remarks: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.Payout || mongoose.model<IPayout>("Payout", PayoutSchema);
