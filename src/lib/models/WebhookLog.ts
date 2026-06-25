import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookLog extends Document {
  source: 'razorpay' | 'shiprocket' | 'other';
  event: string;
  payload: Record<string, any>;
  signatureValid: boolean;
  status: 'received' | 'processed' | 'failed' | 'ignored';
  errorMessage?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookLogSchema: Schema = new Schema(
  {
    source: { 
      type: String, 
      enum: ['razorpay', 'shiprocket', 'other'], 
      required: true,
      index: true
    },
    event: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    signatureValid: { type: Boolean, default: false, index: true },
    status: { 
      type: String, 
      enum: ['received', 'processed', 'failed', 'ignored'], 
      default: 'received',
      index: true
    },
    errorMessage: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for log cleanup or audits
WebhookLogSchema.index({ createdAt: -1 });

export default mongoose.models.WebhookLog || 
  mongoose.model<IWebhookLog>('WebhookLog', WebhookLogSchema);
