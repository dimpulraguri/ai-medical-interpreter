import mongoose, { Schema } from "mongoose";

const MedicineScheduleSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    times: { type: [String], required: true },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    durationDays: { type: Number, required: true },
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

MedicineScheduleSchema.index({ userId: 1, enabled: 1 });

export const MedicineSchedule = mongoose.model("MedicineSchedule", MedicineScheduleSchema);

