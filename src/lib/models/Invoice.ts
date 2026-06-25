import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number; // Base price (excluding tax)
  hsnCode?: string;
  taxRate: number; // Combined rate (e.g. 18 for 18%)
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  total: number; // Including tax
}

export interface IInvoice extends Document {
  orderId: mongoose.Types.ObjectId;
  subOrderId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  gstBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  };
  items: IInvoiceItem[];
  subTotal: number; // Base total (excluding tax)
  totalAmount: number; // Grand total (including tax)
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  hsnCode: { type: String },
  taxRate: { type: Number, required: true, default: 0 },
  cgstAmount: { type: Number, required: true, default: 0 },
  sgstAmount: { type: Number, required: true, default: 0 },
  igstAmount: { type: Number, required: true, default: 0 },
  totalTax: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true },
});

const InvoiceSchema: Schema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    subOrderId: { type: Schema.Types.ObjectId, ref: 'SubOrder', required: true, unique: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    gstBreakdown: {
      cgst: { type: Number, required: true, default: 0 },
      sgst: { type: Number, required: true, default: 0 },
      igst: { type: Number, required: true, default: 0 },
      totalTax: { type: Number, required: true, default: 0 },
    },
    items: [InvoiceItemSchema],
    subTotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    pdfUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
