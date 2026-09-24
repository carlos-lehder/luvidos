import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email address.").max(254);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long.");

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, "Use 3–30 lowercase letters, numbers or underscores.");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  displayName: z.string().trim().max(60).optional(),
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export const profileUpdateSchema = z.object({
  username: usernameSchema,
  displayName: z
    .string()
    .trim()
    .max(60)
    .transform((v) => (v.length ? v : null)),
  bio: z
    .string()
    .trim()
    .max(300)
    .transform((v) => (v.length ? v : null)),
});
