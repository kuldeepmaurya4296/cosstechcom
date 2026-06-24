import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId | null;
  productCount: number;
  isActive: boolean;
  imageUrl?: string;
  icon?: string;
  bannerImageUrl?: string;
  commissionRate: number;
  level: 1 | 2 | 3;
  attributeTemplate?: { name: string; label: string; isRequired: boolean }[];
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    productCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String },
    icon: { type: String },
    bannerImageUrl: { type: String },
    commissionRate: { type: Number, default: 10 },
    level: { type: Number, enum: [1, 2, 3], default: 1, index: true },
    attributeTemplate: [
      {
        name: { type: String, required: true },
        label: { type: String, required: true },
        isRequired: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
