"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertAuthConfiguration,
  createSession,
  deleteSession,
} from "@/lib/auth/session";
import {
  loginSchema,
  signupSchema,
  type AuthFormState,
} from "@/lib/auth/definitions";
import {
  clearLoginAttempts,
  consumeLoginAttempt,
} from "@/lib/auth/rate-limit";

// Used when an email is not found so login attempts perform a password hash
// comparison in both cases, avoiding an obvious timing difference.
const DUMMY_PASSWORD_HASH =
  "$2b$12$LQv3c1yqBW4d4w4oJ2sS.uJ4d7w0hN6b1mC5gH9x2R8s3eY7kP6qW";

export async function signup(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validatedFields = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password } = validatedFields.data;
  assertAuthConfiguration();
  const passwordHash = await bcrypt.hash(password, 12);
  const normalizedEmail = email.toLowerCase();

  let user: { id: string };

  try {
    user = await prisma.user.create({
      data: { name, email: normalizedEmail, passwordHash },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { message: "Unable to create the account. Please check your details and try again." };
    }

    return {
      message: "Unable to create the account. Please try again later.",
    };
  }

  try {
    await createSession(user.id);
  } catch {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    return { message: "Unable to create the account. Please try again later." };
  }

  redirect("/dashboard");
}

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;
  const normalizedEmail = email.toLowerCase();

  assertAuthConfiguration();

  if (!consumeLoginAttempt(normalizedEmail)) {
    return { message: "Invalid email or password." };
  }

  let user: { id: string; passwordHash: string } | null;

  try {
    user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, passwordHash: true },
    });
  } catch {
    return { message: "Unable to sign in right now. Please try again later." };
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) {
    return { message: "Invalid email or password." };
  }

  clearLoginAttempts(normalizedEmail);
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
