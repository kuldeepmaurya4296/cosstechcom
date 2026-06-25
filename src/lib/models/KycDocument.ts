import mongoose, { Schema, Document } from 'mongoose';

export interface IKycDocument extends Document {
  vendorId: mongoose.Types.ObjectId;
  docType: 'gstin' | 'pan' | 'bank_proof' | 'aadhaar' | 'signature';
  docNumber: string;
  fileUrl: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const KycDocumentSchema: Schema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    docType: { 
      type: String, 
      enum: ['gstin', 'pan', 'bank_proof', 'aadhaar', 'signature'], 
      required: true,
      index: true
    },
    docNumber: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    verificationStatus: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'], 
      default: 'pending',
      index: true
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// Allow one active document of each type per vendor
KycDocumentSchema.index({ vendorId: 1, docType: 1 });

export default mongoose.models.KycDocument || 
  mongoose.model<IKycDocument>('KycDocument', KycDocumentSchema);
