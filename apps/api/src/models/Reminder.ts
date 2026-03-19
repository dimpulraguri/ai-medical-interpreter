import mongoose, { Schema } from "mongoose";

const ReminderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["water", "medicine", "diet", "exercise", "disease", "custom"], required: true },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    frequency: { type: String, enum: ["daily", "weekly", "monthly"], required: true },
    times: { type: [String], required: true },
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

ReminderSchema.index({ userId: 1, enabled: 1 });

export const Reminder = mongoose.model("Reminder", ReminderSchema);

