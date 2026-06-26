"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { normalize, PhoneParseError } from "@/lib/phone";
import { startVerification, checkVerification } from "@/lib/auth/twilio-verify";
import { createSession } from "@/lib/auth/session";
import { ensureAdminBootstrapped } from "@/lib/auth/bootstrap";

export type LoginStartState = { error?: string; phone?: string };

export async function requestCode(
  _prev: LoginStartState,
  formData: FormData
): Promise<LoginStartState> {
  await ensureAdminBootstrapped();
  const raw = String(formData.get("phone") ?? "");
  let phone: string;
  try {
    phone = normalize(raw);
  } catch (e) {
    return { error: e instanceof PhoneParseError ? e.message : "Invalid phone number" };
  }
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) {
    return { error: "We don't recognize that phone. Ask the admin to add you." };
  }
  try {
    await startVerification(phone);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not send code" };
  }
  redirect(`/login/verify?phone=${encodeURIComponent(phone)}`);
}

export type VerifyState = { error?: string };

export async function verifyCode(
  _prev: VerifyState,
  formData: FormData
): Promise<VerifyState> {
  const raw = String(formData.get("phone") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{4,8}$/.test(code)) return { error: "Enter the code from your text" };
  let phone: string;
  try {
    phone = normalize(raw);
  } catch {
    return { error: "Session expired, start again" };
  }
  let approved = false;
  try {
    approved = await checkVerification(phone, code);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Verification failed" };
  }
  if (!approved) return { error: "That code didn't match. Try again." };
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) return { error: "Account vanished — ask the admin." };
  await createSession(user.id, user.sessionVersion);
  redirect("/");
}
