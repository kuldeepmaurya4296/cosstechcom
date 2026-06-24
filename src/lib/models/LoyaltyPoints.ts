import mongoose, { Schema, Document } from "mongoose";

export interface ILoyaltyPoints extends Document {
  userId: mongoose.Types.ObjectId;
  points: number; // positive for earn, negative for redeem
  type: "EARNED" | "REDEEMED" | "REFUNDED" | "EXPIRED";
  orderId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltyPointsSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    points: { type: Number, required: true },
    type: {
      type: String,
      enum: ["EARNED", "REDEEMED", "REFUNDED", "EXPIRED"],
      required: true,
      index: true,
    },
    orderId: { type: String, index: true },
    description: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.LoyaltyPoints ||
  mongoose.model<ILoyaltyPoints>("LoyaltyPoints", LoyaltyPointsSchema);
