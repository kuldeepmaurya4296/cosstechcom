import mongoose, { Schema, Document } from 'mongoose';

export interface IAbandonedCartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface IAbandonedCart extends Document {
  userId: mongoose.Types.ObjectId;
  items: IAbandonedCartItem[];
  lastActiveAt: Date;
  nudgeSentAt?: Date;
  recoveredAt?: Date;
  status: 'abandoned' | 'nudged' | 'recovered' | 'cleared';
  createdAt: Date;
  updatedAt: Date;
}

const AbandonedCartItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  selectedSize: { type: String },
  selectedColor: { type: String },
});

const AbandonedCartSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [AbandonedCartItemSchema],
    lastActiveAt: { type: Date, default: Date.now, index: true },
    nudgeSentAt: { type: Date },
    recoveredAt: { type: Date },
    status: { 
      type: String, 
      enum: ['abandoned', 'nudged', 'recovered', 'cleared'], 
      default: 'abandoned',
      index: true
    },
  },
  { timestamps: true }
);

export default mongoose.models.AbandonedCart || 
  mongoose.model<IAbandonedCart>('AbandonedCart', AbandonedCartSchema);
