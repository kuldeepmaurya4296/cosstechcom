import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletTransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  balanceAfter: number;
  description: string;
  referenceType: 'order' | 'refund' | 'payout' | 'referral' | 'manual';
  referenceId?: string;
  idempotencyKey?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema: Schema = new Schema(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true, index: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, required: true },
    referenceType: { 
      type: String, 
      enum: ['order', 'refund', 'payout', 'referral', 'manual'], 
      required: true 
    },
    referenceId: { type: String },
    idempotencyKey: { type: String, index: true },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed'], 
      default: 'completed',
      index: true
    },
  },
  { timestamps: true }
);

// Compound index on walletId and createdAt for transaction history queries
WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });

export default mongoose.models.WalletTransaction || 
  mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);
