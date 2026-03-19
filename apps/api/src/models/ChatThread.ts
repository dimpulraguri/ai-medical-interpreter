import mongoose, { Schema } from "mongoose";
import type { EncryptedBlob } from "../services/encryption.js";

const EncryptedBlobSchema = new Schema<EncryptedBlob>(
  { iv: String, tag: String, data: String },
  { _id: false }
);

const ChatMessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    contentEnc: { type: EncryptedBlobSchema, required: true }
  },
  { timestamps: true }
);

const ChatThreadSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    messages: { type: [ChatMessageSchema], default: [] }
  },
  { timestamps: true }
);

export const ChatThread = mongoose.model("ChatThread", ChatThreadSchema);

