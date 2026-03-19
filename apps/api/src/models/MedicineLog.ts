import mongoose, { Schema } from "mongoose";

const MedicineLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scheduleId: { type: Schema.Types.ObjectId, ref: "MedicineSchedule", required: true, index: true },
    plannedAt: { type: Date, required: true },
    status: { type: String, enum: ["taken", "skipped"], required: true },
    loggedAt: { type: Date, required: true, default: () => new Date() }
  },
  { timestamps: true }
);

MedicineLogSchema.index({ userId: 1, plannedAt: -1 });

export const MedicineLog = mongoose.model("MedicineLog", MedicineLogSchema);

