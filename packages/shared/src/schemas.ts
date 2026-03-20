import { z } from "zod";

export const EmailSchema = z.string().email();
export const PasswordSchema = z.string().min(8).max(72);
export const NameSchema = z.string().min(2).max(64);

export const SignUpSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: NameSchema,
  acceptTerms: z.boolean().refine((v) => v === true, { message: "You must accept the Terms & Privacy Policy" })
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema
});

export const CreateReminderSchema = z.object({
  type: z.enum(["water", "medicine", "diet", "exercise", "disease", "custom"]),
  title: z.string().min(2).max(80),
  message: z.string().max(280).optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1).max(6),
  enabled: z.boolean().default(true)
});

export const CreateMedicineScheduleSchema = z.object({
  name: z.string().min(2).max(80),
  dosage: z.string().min(1).max(80),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1).max(6),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationDays: z.number().int().min(1).max(365),
  enabled: z.boolean().default(true)
});

export const ChatSendSchema = z.object({
  message: z.string().min(1).max(2000),
  reportId: z.string().min(1).max(128).optional()
});
