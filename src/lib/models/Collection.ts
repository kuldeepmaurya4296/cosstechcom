import mongoose, { Schema, Document } from "mongoose";

export interface ICollection extends Document {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  products: mongoose.Types.ObjectId[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    imageUrl: { type: String },
    products: [{ type: Schema.Types.ObjectId, ref: "Product", index: true }],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.models.Collection ||
  mongoose.model<ICollection>("Collection", CollectionSchema);
