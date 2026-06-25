import mongoose, { Schema, Document } from 'mongoose';

export interface IRefundRequest extends Document {
  orderId: mongoose.Types.ObjectId;
  subOrderId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  refundMethod: 'original_source' | 'wallet';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  gatewayTransactionId?: string;
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefundRequestSchema: Schema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    subOrderId: { type: Schema.Types.ObjectId, ref: 'SubOrder', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    refundMethod: { 
      type: String, 
      enum: ['original_source', 'wallet'], 
      required: true,
      default: 'original_source' 
    },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed', 'rejected'], 
      default: 'pending',
      index: true
    },
    gatewayTransactionId: { type: String },
    processedAt: { type: Date },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.RefundRequest || 
  mongoose.model<IRefundRequest>('RefundRequest', RefundRequestSchema);
