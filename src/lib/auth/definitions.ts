import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(72, "Password must be 72 characters or fewer.")
  .regex(/[a-zA-Z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a number.")
  .regex(/[^a-zA-Z0-9]/, "Password must contain a special character.");

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long.").max(100),
  email: z.string().trim().email("Enter a valid email address.").max(320),
  password,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(320),
  password: z.string().min(1, "Enter your password."),
});

export type AuthFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
