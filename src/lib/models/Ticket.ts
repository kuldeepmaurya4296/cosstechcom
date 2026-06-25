import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  customerId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  subOrderId?: mongoose.Types.ObjectId;
  type: 'dispute' | 'inquiry' | 'refund' | 'other';
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    subOrderId: { type: Schema.Types.ObjectId, ref: 'SubOrder' },
    type: { 
      type: String, 
      enum: ['dispute', 'inquiry', 'refund', 'other'], 
      required: true,
      index: true
    },
    subject: { type: String, required: true, trim: true },
    status: { 
      type: String, 
      enum: ['open', 'pending', 'resolved', 'closed'], 
      default: 'open',
      index: true
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'], 
      default: 'medium',
      index: true
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
