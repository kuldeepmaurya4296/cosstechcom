import mongoose, { Schema, Document } from "mongoose";

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true },
);

export default mongoose.models.Wishlist || mongoose.model<IWishlist>("Wishlist", WishlistSchema);
