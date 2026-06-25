import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryHold extends Document {
  productId: mongoose.Types.ObjectId;
  size: string;
  color: string;
  quantity: number;
  holderId: string; // cartId or userId
  expiresAt: Date;
  status: 'pending' | 'committed' | 'released';
  createdAt: Date;
  updatedAt: Date;
}

const InventoryHoldSchema: Schema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    holderId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    status: { 
      type: String, 
      enum: ['pending', 'committed', 'released'], 
      default: 'pending',
      index: true
    },
  },
  { timestamps: true }
);

// TTL index to automatically delete expired hold documents (MongoDB does this in background)
InventoryHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.InventoryHold || 
  mongoose.model<IInventoryHold>('InventoryHold', InventoryHoldSchema);
