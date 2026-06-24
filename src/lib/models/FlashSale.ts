import mongoose, { Schema, Document } from "mongoose";

export interface IFlashSale extends Document {
  name: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  products: mongoose.Types.ObjectId[];
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FlashSaleSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    discountType: { type: String, enum: ["PERCENTAGE", "FLAT"], required: true },
    discountValue: { type: Number, required: true },
    products: [{ type: Schema.Types.ObjectId, ref: "Product", required: true, index: true }],
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.FlashSale ||
  mongoose.model<IFlashSale>("FlashSale", FlashSaleSchema);
