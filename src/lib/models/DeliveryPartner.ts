import mongoose, { Schema, Document } from "mongoose";

export interface IDeliveryPartner extends Document {
  name: string;
  type: "SELF" | "THIRD_PARTY";
  phone?: string;
  trackingUrlTemplate?: string; // e.g. "https://delhivery.com/track?awb={{tracking}}"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryPartnerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    type: { type: String, enum: ["SELF", "THIRD_PARTY"], required: true, index: true },
    phone: { type: String },
    trackingUrlTemplate: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.DeliveryPartner ||
  mongoose.model<IDeliveryPartner>("DeliveryPartner", DeliveryPartnerSchema);
