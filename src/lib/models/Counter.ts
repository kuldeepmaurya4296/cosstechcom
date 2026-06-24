import mongoose, { Schema } from "mongoose";

export interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema: Schema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);
