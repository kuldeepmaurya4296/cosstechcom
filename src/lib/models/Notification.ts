import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'order' | 'promo' | 'wallet' | 'ticket' | 'system' | 'payout' | 'kyc';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { 
      type: String, 
      enum: ['order', 'promo', 'wallet', 'ticket', 'system', 'payout', 'kyc'], 
      required: true 
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema);
