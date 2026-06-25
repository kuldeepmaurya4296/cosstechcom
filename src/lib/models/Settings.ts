import mongoose, { Schema, Document } from "mongoose";

export interface IGrievanceOfficer {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ITcsConfig {
  tcsRate: number; // default 0.5%
  tdsRate: number; // default 1%
  enabled: boolean;
}

export interface IShippingConfig {
  defaultProvider: "shiprocket" | "delhivery" | "self";
  freeShippingThreshold: number;
  flatShippingCharge: number;
  codCharge: number;
}

export interface ISmsConfig {
  provider: "msg91" | "twilio";
  senderId?: string;
  templateIds?: Record<string, string>;
}

export interface IWhatsappConfig {
  provider: "interakt" | "gupshup";
  templateIds?: Record<string, string>;
}

export interface ISettings extends Document {
  key: "general" | "grievance" | "tcs" | "shipping" | "sms" | "whatsapp" | string;
  value: any; // Can contain IGrievanceOfficer, ITcsConfig, etc. based on the key
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export default mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);
