import mongoose, { Schema, Document } from "mongoose";

export interface IBrand extends Document {
  name: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Looked up by name (exact + regex) in product list & search routes.
BrandSchema.index({ name: 1 });

export default mongoose.models.Brand || mongoose.model<IBrand>("Brand", BrandSchema);
