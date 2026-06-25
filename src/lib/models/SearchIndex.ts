import mongoose, { Schema, Document } from 'mongoose';

export interface ISearchIndex extends Document {
  productId: mongoose.Types.ObjectId;
  lastIndexedAt: Date;
  indexStatus: 'pending' | 'indexed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SearchIndexSchema: Schema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true, index: true },
    lastIndexedAt: { type: Date, default: Date.now },
    indexStatus: { 
      type: String, 
      enum: ['pending', 'indexed', 'failed'], 
      default: 'pending',
      index: true
    },
    error: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.SearchIndex || 
  mongoose.model<ISearchIndex>('SearchIndex', SearchIndexSchema);
