import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters.')
  .max(128)
  .regex(/[A-Za-z]/, 'Include at least one letter.')
  .regex(/[0-9]/, 'Include at least one number.');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  country: z.string().trim().min(2).max(60),
  phone: z.string().trim().max(32).optional().or(z.literal('')),
  referralCode: z.string().trim().max(32).optional().or(z.literal('')),
  acceptTerms: z.literal(true, { message: 'You must accept the terms to continue.' }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
  totp: z.string().trim().length(6).optional().or(z.literal('')),
});

export const resetRequestSchema = z.object({ email: emailSchema });
export const resetSchema = z.object({ token: z.string().min(10), password: passwordSchema });
