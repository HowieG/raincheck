import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, inArray, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { attendees, reservations, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureAdminBootstrapped } from "@/lib/auth/bootstrap";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureAdminBootstrapped();
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const myAttendances = await db
    .select({ reservationId: attendees.reservationId })
    .from(attendees)
    .where(eq(attendees.userId, me.id));
  const resIds = myAttendances.map((a) => a.reservationId);

  const dinners = resIds.length
    ? await db
        .select()
        .from(reservations)
        .where(inArray(reservations.id, resIds))
        .orderBy(asc(reservations.scheduledAt))
    : [];

  const otherUserIds = new Set<string>();
  let dinnerAttendees: { reservationId: string; userId: string; name: string }[] = [];
  if (resIds.length) {
    const rows = await db
      .select({
        reservationId: attendees.reservationId,
        userId: attendees.userId,
        name: users.name,
      })
      .from(attendees)
      .innerJoin(users, eq(users.id, attendees.userId))
      .where(inArray(attendees.reservationId, resIds));
    dinnerAttendees = rows;
    for (const r of rows) if (r.userId !== me.id) otherUserIds.add(r.userId);
  }

  const upcoming = dinners.filter(
    (d) => d.status === "active" && d.scheduledAt.getTime() > Date.now() - 4 * 3600_000
  );

  return (
    <main className="min-h-dvh bg-[#C9E3E7] text-[#4A1E33] font-sans">
      <div className="px-7 pt-14 pb-8 max-w-md mx-auto w-full flex flex-col gap-7">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-mono tracking-[0.14em] uppercase text-[#7A6070]">
              Upcoming
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-none">
              {upcoming.length === 0
                ? "No dinners yet."
                : upcoming.length === 1
                  ? "One dinner\nahead."
                  : `${spellNumber(upcoming.length)} dinners\nahead.`}
            </h1>
          </div>
          <Link
            href="/admin/users"
            aria-label="Admin"
            className="w-10 h-10 rounded-full bg-[#D9C7CE] flex items-center justify-center font-semibold text-sm text-[#7A6070]"
          >
            {me.name[0]?.toUpperCase() ?? "U"}
          </Link>
        </div>

        <div className="flex flex-col gap-3.5">
          {upcoming.map((d) => {
            const others = dinnerAttendees
              .filter((a) => a.reservationId === d.id && a.userId !== me.id)
              .map((a) => a.name);
            return (
              <Link
                key={d.id}
                href={`/dinners/${d.id}`}
                className="bg-[#E8DBB9] border border-[#1a17171a] rounded-2xl p-5 block"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-serif text-2xl leading-tight">{d.restaurant}</div>
                    {d.location ? (
                      <div className="font-medium text-xs text-[#7A6070] mt-1">{d.location}</div>
                    ) : null}
                  </div>
                  <div className="font-mono text-[11px] text-[#7A6070] text-right uppercase">
                    {dayShort(d.scheduledAt)}
                    <br />
                    {dateShort(d.scheduledAt)}
                  </div>
                </div>
                <div className="h-px bg-[#1a171719] my-4" />
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[13px]">{timeShort(d.scheduledAt)}</div>
                  <div className="text-[#7A6070] font-medium text-[13px]">
                    You{others.length ? ` & ${others.join(", ")}` : ""}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <Link
          href="/dinners/new"
          className="mt-2 h-14 rounded-2xl border border-[#1a17172e] flex items-center justify-center gap-2 font-semibold"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add a dinner
        </Link>

        {me.isAdmin ? (
          <Link href="/admin/users" className="text-center text-xs font-mono text-[#7A6070] tracking-wider uppercase">
            Manage roster →
          </Link>
        ) : null}
      </div>
    </main>
  );
}

function dayShort(d: Date) {
  return d.toLocaleString("en-US", { weekday: "short" }).toUpperCase();
}
function dateShort(d: Date) {
  return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, "0")}`;
}
function timeShort(d: Date) {
  return d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
}
function spellNumber(n: number) {
  const m: Record<number, string> = { 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six" };
  return m[n] ?? String(n);
}
