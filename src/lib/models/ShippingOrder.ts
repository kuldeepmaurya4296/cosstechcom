import mongoose, { Schema, Document } from 'mongoose';

export interface IShippingHistory {
  status: string;
  detail: string;
  location?: string;
  timestamp: Date;
}

export interface IShippingOrder extends Document {
  subOrderId: mongoose.Types.ObjectId;
  shipmentId: string;
  awbNumber?: string;
  carrier?: string;
  status: 'pending' | 'manifested' | 'pickup_scheduled' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  trackingUrl?: string;
  estimatedDelivery?: Date;
  history: IShippingHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const ShippingHistorySchema = new Schema({
  status: { type: String, required: true },
  detail: { type: String, required: true },
  location: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const ShippingOrderSchema: Schema = new Schema(
  {
    subOrderId: { type: Schema.Types.ObjectId, ref: 'SubOrder', required: true, unique: true, index: true },
    shipmentId: { type: String, required: true, unique: true, index: true },
    awbNumber: { type: String, index: true },
    carrier: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'manifested', 'pickup_scheduled', 'shipped', 'delivered', 'returned', 'cancelled'], 
      default: 'pending',
      index: true
    },
    trackingUrl: { type: String },
    estimatedDelivery: { type: Date },
    history: [ShippingHistorySchema],
  },
  { timestamps: true }
);

export default mongoose.models.ShippingOrder || 
  mongoose.model<IShippingOrder>('ShippingOrder', ShippingOrderSchema);
