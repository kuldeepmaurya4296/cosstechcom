import mongoose, { Schema, Document } from 'mongoose';

export interface IFraudFlag extends Document {
  entityType: 'user' | 'vendor' | 'order' | 'review' | 'payout';
  entityId: mongoose.Types.ObjectId; // ID of user, vendor, order, etc.
  flagType: 'velocity' | 'cod_abuse' | 'fake_review' | 'multiple_accounts' | 'suspicious_payout' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  status: 'active' | 'under_review' | 'resolved' | 'dismissed';
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FraudFlagSchema: Schema = new Schema(
  {
    entityType: { 
      type: String, 
      enum: ['user', 'vendor', 'order', 'review', 'payout'], 
      required: true,
      index: true
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    flagType: { 
      type: String, 
      enum: ['velocity', 'cod_abuse', 'fake_review', 'multiple_accounts', 'suspicious_payout', 'other'], 
      required: true,
      index: true
    },
    severity: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      required: true,
      index: true
    },
    details: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['active', 'under_review', 'resolved', 'dismissed'], 
      default: 'active',
      index: true
    },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolutionNotes: { type: String },
  },
  { timestamps: true }
);

// Compound index for entity queries
FraudFlagSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.models.FraudFlag || 
  mongoose.model<IFraudFlag>('FraudFlag', FraudFlagSchema);
