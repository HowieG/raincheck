"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { attendees, reservations, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/session";
import { notify, cancelMessage } from "@/lib/notify";

export type ToggleResult =
  | { ok: true; voteCancel: boolean; cancelled: boolean }
  | { ok: false; error: string };

export async function toggleVoteAction(reservationId: string): Promise<ToggleResult> {
  const me = await requireUser();

  let didCancel = false;
  let myVote = false;

  try {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .update(attendees)
        .set({
          voteCancel: sql`NOT ${attendees.voteCancel}`,
          votedAt: sql`NOW()`,
        })
        .where(
          and(
            eq(attendees.reservationId, reservationId),
            eq(attendees.userId, me.id),
            sql`EXISTS (
              SELECT 1 FROM ${reservations} r
              WHERE r.id = ${attendees.reservationId}
                AND r.status = 'active'
                AND r.cancelled_at IS NULL
            )`
          )
        )
        .returning({ voteCancel: attendees.voteCancel });

      if (!row) throw new Error("This dinner is no longer active.");
      myVote = row.voteCancel;

      if (!myVote) return;

      const [{ total, voted }] = await tx
        .select({
          total: sql<number>`COUNT(*)::int`,
          voted: sql<number>`SUM(CASE WHEN ${attendees.voteCancel} THEN 1 ELSE 0 END)::int`,
        })
        .from(attendees)
        .where(eq(attendees.reservationId, reservationId));

      if (Number(voted) < Number(total)) return;

      const [cancelled] = await tx
        .update(reservations)
        .set({ status: "cancelled", cancelledAt: sql`NOW()` })
        .where(and(eq(reservations.id, reservationId), sql`${reservations.cancelledAt} IS NULL`))
        .returning({ id: reservations.id });

      if (cancelled) didCancel = true;
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Vote failed" };
  }

  if (didCancel) {
    const [res] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, reservationId))
      .limit(1);
    const everyone = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
      })
      .from(attendees)
      .innerJoin(users, eq(users.id, attendees.userId))
      .where(eq(attendees.reservationId, reservationId));
    if (res) {
      const whenLocal = res.scheduledAt.toLocaleString("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      });
      const msg = cancelMessage({ restaurant: res.restaurant, whenLocal });
      await Promise.all(
        everyone.map((u) =>
          notify({
            user: u,
            kind: "cancel",
            reservationId,
            idempotencyKey: `cancel_${reservationId}_${u.id}`,
            ...msg,
          })
        )
      );
    }
  }

  revalidatePath(`/dinners/${reservationId}`);
  revalidatePath("/");
  return { ok: true, voteCancel: myVote, cancelled: didCancel };
}
