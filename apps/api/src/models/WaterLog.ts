import mongoose, { Schema } from "mongoose";

const WaterLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    glasses: { type: Number, required: true, min: 0, max: 40 }
  },
  { timestamps: true }
);

WaterLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const WaterLog = mongoose.model("WaterLog", WaterLogSchema);

