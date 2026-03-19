import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { encryptJson, type EncryptedBlob } from "../services/encryption.js";

export type UserDoc = mongoose.InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
  verifyPassword(password: string): Promise<boolean>;
  setPassword(password: string): Promise<void>;
  setRefreshToken(raw: string): void;
  hasRefreshToken(raw: string): boolean;
};

const EncryptedBlobSchema = new Schema<EncryptedBlob>(
  {
    iv: { type: String, required: true },
    tag: { type: String, required: true },
    data: { type: String, required: true }
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    passwordHash: { type: String, required: true },
    acceptedTermsAt: { type: Date, default: null },
    medicalHistoryEnc: { type: EncryptedBlobSchema, default: () => encryptJson([]) },
    refreshTokenHash: { type: String, default: null },
    deviceTokens: { type: [String], default: [] }
  },
  { timestamps: true }
);

UserSchema.methods.verifyPassword = async function verifyPassword(this: UserDoc, password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.methods.setPassword = async function setPassword(this: UserDoc, password: string) {
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(password, salt);
};

UserSchema.methods.setRefreshToken = function setRefreshToken(this: UserDoc, raw: string) {
  const h = crypto.createHash("sha256").update(raw).digest("hex");
  this.refreshTokenHash = h;
};

UserSchema.methods.hasRefreshToken = function hasRefreshToken(this: UserDoc, raw: string) {
  if (!this.refreshTokenHash) return false;
  const h = crypto.createHash("sha256").update(raw).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(this.refreshTokenHash));
};

export const User = mongoose.model("User", UserSchema);
