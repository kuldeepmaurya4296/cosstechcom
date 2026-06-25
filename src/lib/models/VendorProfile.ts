import mongoose, { Schema, Document } from "mongoose";

export interface IVendorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  storeName: string;
  storeSlug: string;
  storeLogo?: string;
  storeBanner?: string;
  storeDescription?: string;
  businessAddress: string;
  gstNumber: string;
  panNumber: string;
  bankAccount: {
    holderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
  commissionRate?: number; // percentage (e.g. 10)
  rating: {
    average: number;
    count: number;
  };
  totalSales: number;
  totalProducts: number;
  verificationStatus: "pending" | "approved" | "rejected" | "suspended";
  verificationDocuments: string[];
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  
  // KYC & Verification fields
  kycStatus: "pending" | "submitted" | "verified" | "rejected";
  bankVerified: boolean;
  gstinVerified: boolean;
  panVerified: boolean;
  agreementSignedAt?: Date;
  tcsRate: number; // e.g. 0.5 for 0.5% GST TCS
  
  sellerScore: {
    cancellationRate: number;
    returnRate: number;
    responseTime: number; // in hours or score
    deliverySLA: number; // % met
    overallScore: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VendorProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    storeName: { type: String, required: true, trim: true },
    storeSlug: { type: String, required: true, unique: true, index: true, trim: true },
    storeLogo: { type: String },
    storeBanner: { type: String },
    storeDescription: { type: String },
    businessAddress: { type: String, required: true },
    gstNumber: { type: String, required: true, trim: true },
    panNumber: { type: String, required: true, trim: true },
    bankAccount: {
      holderName: { type: String, required: true },
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
    },
    commissionRate: { type: Number, default: 10 },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    totalSales: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
      index: true,
    },
    verificationDocuments: [{ type: String }],
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    
    // KYC & Verification
    kycStatus: {
      type: String,
      enum: ["pending", "submitted", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    bankVerified: { type: Boolean, default: false },
    gstinVerified: { type: Boolean, default: false },
    panVerified: { type: Boolean, default: false },
    agreementSignedAt: { type: Date },
    tcsRate: { type: Number, default: 0.5 }, // 0.5% default TCS rate

    sellerScore: {
      cancellationRate: { type: Number, default: 0 },
      returnRate: { type: Number, default: 0 },
      responseTime: { type: Number, default: 24 },
      deliverySLA: { type: Number, default: 100 },
      overallScore: { type: Number, default: 100 },
    },
  },
  { timestamps: true },
);

export default mongoose.models.VendorProfile ||
  mongoose.model<IVendorProfile>("VendorProfile", VendorProfileSchema);
