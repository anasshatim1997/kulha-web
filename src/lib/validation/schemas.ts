import { z } from "zod";
import { messages } from "@/lib/i18n/messages";
import { isGoodPassword } from "@/lib/auth/password-strength";

const v = messages.validation;

export const emailSchema = z
  .string()
  .trim()
  .min(1, v.required)
  .max(254, v.emailTooLong)
  .email(v.email);

/** Good is the minimum accepted level; Excellent (14+ characters) is optional. */
export const passwordSchema = z
  .string()
  .min(10, v.passwordMin)
  .max(128, v.passwordMax)
  .superRefine((password, context) => {
    if (password.length >= 10 && password.length <= 128 && !isGoodPassword(password)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: v.passwordGood });
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, v.required).max(128, v.passwordMax),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, v.required).max(120, v.fullNameMax),
  email: emailSchema,
  phone: z.string().trim().max(30, v.phoneMax),
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((data) => data.password === data.confirm, { path: ["confirm"], message: v.passwordsDiffer });

/** The first error message of each field, by field name. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!(field in errors)) errors[field] = issue.message;
  }
  return errors;
}
