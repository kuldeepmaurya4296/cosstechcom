import mongoose, { Schema, Document } from "mongoose";

export interface IAddress {
  label: string; // Home, Work, etc.
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pin: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  phone?: string;
  isPhoneVerified: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  twoFactorEnabled: boolean;
  referralCode?: string;
  referredBy?: mongoose.Types.ObjectId;
  subAdminPermissions: string[];
  role: "customer" | "admin" | "vendor" | "delivery_partner" | "support";
  vendorStatus?: "pending" | "approved" | "rejected" | "suspended" | null;
  storeName?: string;
  storeSlug?: string;
  walletBalance: number;
  isActive: boolean;
  isEmailVerified: boolean;
  addresses: IAddress[];
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  label: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pin: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String },
    googleId: { type: String, index: true },
    avatar: { type: String },
    phone: { type: String, index: true },
    isPhoneVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    referralCode: { type: String, unique: true, sparse: true, trim: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },
    subAdminPermissions: [{ type: String }],
    role: { 
      type: String, 
      enum: ["customer", "admin", "vendor", "delivery_partner", "support"], 
      default: "customer", 
      index: true 
    },
    vendorStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended", null],
      default: null,
      index: true
    },
    storeName: { type: String, trim: true },
    storeSlug: { type: String, trim: true, index: true },
    walletBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    addresses: [AddressSchema],
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
