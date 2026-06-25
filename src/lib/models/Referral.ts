import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  code: string; // The code used
  reward: number; // Wallet credits rewarded to each
  status: 'pending' | 'completed' | 'expired';
  orderId?: mongoose.Types.ObjectId; // The order that unlocked the referral reward
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema: Schema = new Schema(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referredUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    code: { type: String, required: true, index: true, uppercase: true, trim: true },
    reward: { type: Number, required: true, default: 0 },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'expired'], 
      default: 'pending',
      index: true
    },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

export default mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);
