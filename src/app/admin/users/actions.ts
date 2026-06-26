"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { normalize, PhoneParseError } from "@/lib/phone";
import { requireAdmin } from "@/lib/auth/session";

export type AddUserState = { error?: string; success?: string };

export async function addUserAction(
  _prev: AddUserState,
  formData: FormData
): Promise<AddUserState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Forbidden" };
  }
  const name = String(formData.get("name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "");
  const emailRaw = String(formData.get("email") ?? "").trim();
  if (!name) return { error: "Name is required" };
  let phone: string;
  try {
    phone = normalize(phoneRaw);
  } catch (e) {
    return { error: e instanceof PhoneParseError ? e.message : "Invalid phone number" };
  }
  const email = emailRaw || null;
  const [existing] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (existing) return { error: `${existing.name} already exists on that number.` };
  try {
    await db.insert(users).values({ name, phone, email });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Database error" };
  }
  revalidatePath("/admin/users");
  return { success: `Added ${name}.` };
}
