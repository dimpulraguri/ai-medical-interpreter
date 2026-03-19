import mongoose, { Schema } from "mongoose";
import type { EncryptedBlob } from "../services/encryption.js";

const EncryptedBlobSchema = new Schema<EncryptedBlob>(
  { iv: String, tag: String, data: String },
  { _id: false }
);

const ReportSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    storageKey: { type: String, required: true },
    status: { type: String, enum: ["uploaded", "processing", "ready", "failed"], default: "uploaded" },
    extractedTextEnc: { type: EncryptedBlobSchema, default: null },
    aiExplanationEnc: { type: EncryptedBlobSchema, default: null },
    abnormalFindingsEnc: { type: EncryptedBlobSchema, default: null }
  },
  { timestamps: true }
);

ReportSchema.index({ userId: 1, createdAt: -1 });

export const Report = mongoose.model("Report", ReportSchema);

