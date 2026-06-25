import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxConfig extends Document {
  categoryId: mongoose.Types.ObjectId;
  hsnCode: string;
  cgstRate: number; // e.g. 9 for 9% CGST
  sgstRate: number; // e.g. 9 for 9% SGST
  igstRate: number; // e.g. 18 for 18% IGST (usually CGST + SGST)
  cessRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaxConfigSchema: Schema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, unique: true, index: true },
    hsnCode: { type: String, required: true, trim: true },
    cgstRate: { type: Number, required: true, default: 0 },
    sgstRate: { type: Number, required: true, default: 0 },
    igstRate: { type: Number, required: true, default: 0 },
    cessRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.TaxConfig || 
  mongoose.model<ITaxConfig>('TaxConfig', TaxConfigSchema);
