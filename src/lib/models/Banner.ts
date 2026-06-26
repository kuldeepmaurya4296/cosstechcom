import mongoose, { Schema, Document } from "mongoose";

export interface IBanner extends Document {
  title?: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  tagline?: string;
  cta?: string;
  badgeTitle?: string;
  badgePrice?: string;
  objectPosition?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema(
  {
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    imageUrl: { type: String, required: true }, // Vercel Blob or asset URL
    linkUrl: { type: String },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    tagline: { type: String, trim: true },
    cta: { type: String, trim: true },
    badgeTitle: { type: String, trim: true },
    badgePrice: { type: String, trim: true },
    objectPosition: { type: String, default: "object-center", trim: true },
  },
  { timestamps: true },
);

export default mongoose.models.Banner || mongoose.model<IBanner>("Banner", BannerSchema);

