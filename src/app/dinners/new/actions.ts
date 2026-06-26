"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { reservations, attendees, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/session";
import { notify, inviteMessage } from "@/lib/notify";

export type CreateDinnerState = { error?: string };

export async function createDinnerAction(
  _prev: CreateDinnerState,
  formData: FormData
): Promise<CreateDinnerState> {
  const me = await requireUser();
  const restaurant = String(formData.get("restaurant") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "").trim();
  const otherId = String(formData.get("otherAttendeeId") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim() || null;

  if (!restaurant) return { error: "Restaurant name is required" };
  if (!scheduledAtRaw) return { error: "Date and time are required" };
  if (!otherId) return { error: "Pick someone to dine with" };
  if (otherId === me.id) return { error: "You can't dine with yourself in v1" };

  const scheduledAt = new Date(scheduledAtRaw);
  if (Number.isNaN(scheduledAt.getTime())) return { error: "Invalid date" };

  const [other] = await db.select().from(users).where(eq(users.id, otherId)).limit(1);
  if (!other) return { error: "That person isn't in the roster anymore" };

  let reservationId: string;
  try {
    const [row] = await db
      .insert(reservations)
      .values({
        creatorId: me.id,
        restaurant,
        location,
        scheduledAt,
        sourceUrl,
      })
      .returning({ id: reservations.id });
    reservationId = row.id;
    await db.insert(attendees).values([
      { reservationId, userId: me.id },
      { reservationId, userId: other.id },
    ]);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create dinner" };
  }

  const url = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/dinners/${reservationId}`;
  const whenLocal = scheduledAt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  void notify({
    user: other,
    kind: "invite",
    reservationId,
    ...inviteMessage({ fromName: me.name, restaurant, whenLocal, url }),
  });

  revalidatePath("/");
  redirect(`/dinners/${reservationId}`);
}
