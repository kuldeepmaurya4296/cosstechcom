import mongoose, { Schema, Document } from 'mongoose';

export interface ITcsReport extends Document {
  vendorId: mongoose.Types.ObjectId;
  month: string; // Format: YYYY-MM
  grossSales: number;
  returnsAmount: number;
  netSales: number;
  tcsAmount: number; // 0.5% or 1% of net sales
  depositStatus: 'pending' | 'deposited' | 'filed';
  filedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TcsReportSchema: Schema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: String, required: true, index: true },
    grossSales: { type: Number, required: true, default: 0 },
    returnsAmount: { type: Number, required: true, default: 0 },
    netSales: { type: Number, required: true, default: 0 },
    tcsAmount: { type: Number, required: true, default: 0 },
    depositStatus: { 
      type: String, 
      enum: ['pending', 'deposited', 'filed'], 
      default: 'pending',
      index: true
    },
    filedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per vendor and month
TcsReportSchema.index({ vendorId: 1, month: 1 }, { unique: true });

export default mongoose.models.TcsReport || mongoose.model<ITcsReport>('TcsReport', TcsReportSchema);
