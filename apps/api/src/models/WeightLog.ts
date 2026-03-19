import mongoose, { Schema } from "mongoose";

const WeightLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    weightKg: { type: Number, required: true, min: 1, max: 500 }
  },
  { timestamps: true }
);

WeightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const WeightLog = mongoose.model("WeightLog", WeightLogSchema);

