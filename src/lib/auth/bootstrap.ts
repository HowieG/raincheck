import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { normalize } from "@/lib/phone";

let bootstrapped = false;

export async function ensureAdminBootstrapped(): Promise<void> {
  if (bootstrapped) return;
  const adminPhoneRaw = process.env.ADMIN_PHONE;
  const adminName = process.env.ADMIN_NAME ?? "Admin";
  if (!adminPhoneRaw) {
    bootstrapped = true;
    return;
  }
  const phone = normalize(adminPhoneRaw);
  const [existing] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (existing) {
    if (!existing.isAdmin) {
      await db.update(users).set({ isAdmin: true }).where(eq(users.id, existing.id));
    }
    bootstrapped = true;
    return;
  }
  await db.insert(users).values({
    name: adminName,
    phone,
    isAdmin: true,
  });
  bootstrapped = true;
}
