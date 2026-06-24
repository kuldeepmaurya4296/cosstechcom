import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  key: string;
  value: Schema.Types.Mixed;
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
