import mongoose, { Schema } from "mongoose";

const AuditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    event: { type: String, required: true, index: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    status: { type: Number, required: true },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    meta: { type: Schema.Types.Mixed, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", AuditLogSchema);

