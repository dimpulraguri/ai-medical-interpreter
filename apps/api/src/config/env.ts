import { z } from "zod";

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema);

const AiModeSchema = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  // Backwards/UX aliases:
  // - "live" is used by some deployment guides; treat it as HF here.
  if (v.toLowerCase() === "live") return "huggingface";
  return v;
}, z.enum(["openai", "huggingface", "demo", "off"]));

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  MONGODB_URI: z.string().default("memory"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_MIN: z.coerce.number().int().min(5).max(240).default(30),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  DATA_ENCRYPTION_KEY_BASE64: z.string().min(44),
  OPENAI_API_KEY: z.string().default(""),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  HF_API_KEY: emptyToUndefined(z.string().optional()),
  // HuggingFace Router model name (OpenAI-compatible). Example: deepseek-ai/DeepSeek-R1:fastest
  // Recommended (open license): Qwen/Qwen2.5-7B-Instruct
  HF_MODEL: z.string().default("Qwen/Qwen2.5-7B-Instruct"),
  AI_MODE: AiModeSchema.default("openai"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  ALLOW_LOCAL_STORAGE_IN_PROD: z.coerce.boolean().default(false),
  LOCAL_UPLOAD_DIR: emptyToUndefined(z.string().optional()),
  S3_BUCKET: emptyToUndefined(z.string().optional()),
  S3_REGION: emptyToUndefined(z.string().optional()),
  S3_ACCESS_KEY_ID: emptyToUndefined(z.string().optional()),
  S3_SECRET_ACCESS_KEY: emptyToUndefined(z.string().optional()),
  S3_ENDPOINT: emptyToUndefined(z.string().optional()),
  PDF_OCR_MAX_PAGES: z.coerce.number().int().min(1).max(10).default(3),
  SENDGRID_API_KEY: emptyToUndefined(z.string().optional()),
  EMAIL_FROM: emptyToUndefined(z.string().email().optional()),
  ADMIN_EMAILS: emptyToUndefined(z.string().optional())
}).superRefine((val, ctx) => {
  if (val.NODE_ENV === "production" && (val.MONGODB_URI === "memory" || !val.MONGODB_URI)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["MONGODB_URI"],
      message: "MONGODB_URI must be set to a real MongoDB URI in production"
    });
  }
  if (val.STORAGE_DRIVER === "s3") {
    const missing: string[] = [];
    if (!val.S3_BUCKET) missing.push("S3_BUCKET");
    if (!val.S3_REGION) missing.push("S3_REGION");
    if (!val.S3_ACCESS_KEY_ID) missing.push("S3_ACCESS_KEY_ID");
    if (!val.S3_SECRET_ACCESS_KEY) missing.push("S3_SECRET_ACCESS_KEY");
    if (missing.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["STORAGE_DRIVER"],
        message: `Missing required S3 config: ${missing.join(", ")}`
      });
    }
  }
  if (val.NODE_ENV === "production" && val.STORAGE_DRIVER === "local" && !val.ALLOW_LOCAL_STORAGE_IN_PROD) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["STORAGE_DRIVER"],
      message: "In production, set STORAGE_DRIVER=s3 (recommended) or set ALLOW_LOCAL_STORAGE_IN_PROD=true"
    });
  }
  if (val.AI_MODE === "huggingface" && !val.HF_API_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["HF_API_KEY"],
      message: "HF_API_KEY must be set when AI_MODE=huggingface"
    });
  }
});

export const env = EnvSchema.parse(process.env);
