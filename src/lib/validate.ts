import { z } from "zod";

const nameRule = z
  .string()
  .trim()
  .min(2, "Enter your full name")
  .max(80, "That name is too long")
  .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u, "Use letters, spaces, hyphens and apostrophes only");

const emailRule = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "Enter your email address")
  .max(160, "That email is too long")
  .email("Enter a valid email address");

const phoneRule = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(24, "That phone number is too long")
  .regex(/^[+]?[\d\s()./-]{7,24}$/, "Use digits, spaces and + only");

const passwordRule = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Passwords cannot exceed 72 characters")
  .regex(/[A-Z]/, "Add at least one uppercase letter")
  .regex(/[a-z]/, "Add at least one lowercase letter")
  .regex(/[0-9]/, "Add at least one number")
  .regex(/[^A-Za-z0-9]/, "Add at least one special character");

export const signupSchema = z
  .object({
    accountType: z.enum(["individual", "joint"]).default("individual"),

    fullName: nameRule,
    email: emailRule,
    phone: phoneRule,
    dateOfBirth: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"),
    address: z.string().trim().min(5, "Enter your street address").max(200),
    country: z.string().trim().min(2, "Select your country").max(80),
    occupation: z.string().trim().min(2, "Enter your occupation").max(80),

    secondFullName: z.string().trim().max(80).optional().or(z.literal("")),
    secondEmail: z.union([emailRule, z.literal("")]).optional(),
    secondPhone: z.union([phoneRule, z.literal("")]).optional(),
    secondDateOfBirth: z
      .union([z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"), z.literal("")])
      .optional(),
    secondAddress: z.string().trim().max(200).optional().or(z.literal("")),
    secondCountry: z.string().trim().max(80).optional().or(z.literal("")),
    secondOccupation: z.string().trim().max(80).optional().or(z.literal("")),

    password: passwordRule,
    confirmPassword: z.string(),
    referralCode: z.string().trim().max(40).optional().or(z.literal("")),
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms & Privacy Policy" }),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }

    if (value.accountType === "joint") {
      const required: [keyof typeof value, string][] = [
        ["secondFullName", "Enter the second holder's full name"],
        ["secondEmail", "Enter the second holder's email"],
        ["secondPhone", "Enter the second holder's phone number"],
        ["secondDateOfBirth", "Enter the second holder's date of birth"],
        ["secondAddress", "Enter the second holder's address"],
        ["secondCountry", "Select the second holder's country"],
        ["secondOccupation", "Enter the second holder's occupation"],
      ];
      for (const [field, message] of required) {
        const raw = value[field];
        if (typeof raw !== "string" || raw.trim().length === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
        }
      }
      if (
        value.secondEmail &&
        value.email &&
        value.secondEmail.toLowerCase() === value.email.toLowerCase()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["secondEmail"],
          message: "The second holder needs a different email address",
        });
      }
    }
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(4, "Enter your Account ID or email")
    .max(160, "That value is too long"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const paymentSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Enter the amount you sent" })
    .positive("Amount must be greater than zero")
    .max(5_000_000, "Amount is too large"),
  purpose: z.enum(["deposit", "investment", "nft"]).default("deposit"),
  walletId: z.string().trim().min(2, "Choose the wallet you paid to").max(40),
  providerRef: z
    .string()
    .trim()
    .min(4, "Paste the transaction hash or your sending wallet address")
    .max(160, "That reference is too long"),
  planId: z.string().trim().max(40).optional().or(z.literal("")),
  itemSlug: z.string().trim().max(80).optional().or(z.literal("")),
  note: z.string().trim().max(600).optional().or(z.literal("")),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const adminCreditSchema = z.object({
  userId: z.string().uuid("Invalid customer"),
  amount: z.coerce
    .number({ invalid_type_error: "Enter an amount" })
    .positive("Amount must be greater than zero")
    .max(50_000_000, "Amount is too large"),
  note: z.string().trim().max(400).optional().or(z.literal("")),
  transactionId: z.string().uuid().optional().or(z.literal("")),
  createInvestment: z.boolean().optional().default(false),
  planId: z.string().trim().max(40).optional().or(z.literal("")),
});

export type AdminCreditInput = z.infer<typeof adminCreditSchema>;

export const adminReviewSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction"),
  decision: z.enum(["approve", "reject"]),
  adminNote: z.string().trim().max(400).optional().or(z.literal("")),
});

export type AdminReviewInput = z.infer<typeof adminReviewSchema>;

/** Flattens a Zod error into a `{ field: message }` map for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
