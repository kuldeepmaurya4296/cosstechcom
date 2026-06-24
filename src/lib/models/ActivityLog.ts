import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  adminId: mongoose.Types.ObjectId;
  adminName: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    adminName: { type: String, required: true },
    action: { type: String, required: true, index: true },
    details: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
