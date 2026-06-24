import mongoose, { Schema, Document } from "mongoose";

export interface INewsletterSubscriber extends Document {
  name: string;
  email: string;
  phone: string;
  message?: string;
  createdAt: Date;
}

const NewsletterSubscriberSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
  },
  { timestamps: true },
);

export default mongoose.models.NewsletterSubscriber ||
  mongoose.model<INewsletterSubscriber>("NewsletterSubscriber", NewsletterSubscriberSchema);
