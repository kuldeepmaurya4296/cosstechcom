import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketMessage extends Document {
  ticketId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: 'customer' | 'vendor' | 'support' | 'admin';
  message: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema: Schema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { 
      type: String, 
      enum: ['customer', 'vendor', 'support', 'admin'], 
      required: true 
    },
    message: { type: String, required: true },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

TicketMessageSchema.index({ ticketId: 1, createdAt: 1 });

export default mongoose.models.TicketMessage || 
  mongoose.model<ITicketMessage>('TicketMessage', TicketMessageSchema);
