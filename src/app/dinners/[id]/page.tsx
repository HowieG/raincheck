import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attendees, reservations, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/session";
import { format as formatPhone } from "@/lib/phone";
import RaincheckButton from "./RaincheckButton";

export const dynamic = "force-dynamic";

export default async function DinnerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser();

  const [res] = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  if (!res) notFound();

  const rows = await db
    .select({
      userId: attendees.userId,
      voteCancel: attendees.voteCancel,
      name: users.name,
      phone: users.phone,
    })
    .from(attendees)
    .innerJoin(users, eq(users.id, attendees.userId))
    .where(eq(attendees.reservationId, id));

  const mine = rows.find((r) => r.userId === me.id);
  if (!mine) notFound();
  const others = rows.filter((r) => r.userId !== me.id);

  const isCancelled = res.status === "cancelled";
  const myVote = mine.voteCancel;

  if (isCancelled) return <Resolved restaurant={res.restaurant} when={res.scheduledAt} />;
  if (myVote) return <Pending reservationId={id} />;

  return (
    <main className="min-h-dvh bg-[#C9E3E7] text-[#4A1E33] font-sans">
      <div className="px-7 pt-12 pb-8 max-w-md mx-auto w-full flex flex-col gap-6 min-h-dvh">
        <div>
          <Link
            href="/"
            className="inline-flex w-10 h-10 rounded-full border border-[#1a17172e] items-center justify-center"
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A1E33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        </div>

        {res.location ? (
          <div className="text-[11px] font-mono tracking-[0.14em] uppercase text-[#7A6070]">
            {res.location}
          </div>
        ) : null}
        <h1 className="font-serif text-5xl leading-none">{res.restaurant}</h1>

        <div className="flex border-y border-[#1a17171f] mt-4">
          <div className="flex-1 py-3.5">
            <div className="text-[10px] font-mono tracking-wider uppercase text-[#7A6070]">Date</div>
            <div className="text-base mt-1">{fmtDate(res.scheduledAt)}</div>
          </div>
          <div className="w-px bg-[#1a17171f]" />
          <div className="flex-1 py-3.5 pl-5">
            <div className="text-[10px] font-mono tracking-wider uppercase text-[#7A6070]">Time</div>
            <div className="text-base mt-1 font-mono">{fmtTime(res.scheduledAt)}</div>
          </div>
        </div>

        <div className="text-[11px] font-mono tracking-[0.12em] uppercase text-[#7A6070] mt-2">
          The table
        </div>

        <div className="flex flex-col gap-4">
          <PersonRow
            name={`${me.name}`}
            sub={res.creatorId === me.id ? "You · organizer" : "You"}
            initial={me.name[0]}
            statusDot="#B0863C"
            statusLabel="In"
          />
          {others.map((o) => (
            <PersonRow
              key={o.userId}
              name={o.name}
              sub={formatPhone(o.phone)}
              initial={o.name[0]}
              statusDot="#B0863C"
              statusLabel="In"
            />
          ))}
        </div>

        <div className="mt-auto pb-6">
          <p className="text-[13px] text-[#7A6070] text-center px-3 mb-3">
            Can't make it? Tap raincheck. We keep it to yourself — and only call dinner off, texting
            you {others.length === 1 ? `and ${others[0].name}` : "everyone"}, if they raincheck too.
          </p>
          <RaincheckButton reservationId={id} />
          <div className="text-[10.5px] font-mono text-[#A89F95] text-center tracking-wider mt-3">
            HELD A MOMENT BEFORE IT SENDS
          </div>
        </div>
      </div>
    </main>
  );
}

function PersonRow({
  name,
  sub,
  initial,
  statusDot,
  statusLabel,
}: {
  name: string;
  sub: string;
  initial: string;
  statusDot: string;
  statusLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#D9C7CE] flex items-center justify-center font-semibold text-[#7A6070]">
        {initial}
      </div>
      <div className="flex-1">
        <div className="font-semibold">{name}</div>
        <div className="font-mono text-xs text-[#7A6070]">{sub}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: statusDot }} />
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#7A6070]">
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

function Pending({ reservationId }: { reservationId: string }) {
  return (
    <main className="min-h-dvh bg-[#C9E3E7] text-[#4A1E33] font-sans">
      <div className="px-7 pt-16 pb-8 max-w-md mx-auto w-full flex flex-col gap-2 items-center text-center min-h-dvh">
        <div className="w-24 h-24 rounded-full border border-[#c66b8666] flex items-center justify-center mt-2">
          <div className="w-[62px] h-[62px] rounded-full bg-[#C66B86] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F4EDEF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v2.5" />
              <path d="M3.5 12a8.5 8.5 0 0 1 17 0z" />
              <path d="M12 12v6.5a2.5 2.5 0 0 1-5 0" />
            </svg>
          </div>
        </div>
        <h1 className="font-serif text-4xl leading-tight mt-7">
          Your raincheck
          <br />
          is in.
        </h1>
        <p className="text-[#7A6070] mt-4 max-w-xs">
          Quietly noted. Nothing changes — the dinner's still on — until everyone's ready to let it
          go. Then you'll both get a text.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c66b861f]">
          <div className="w-2 h-2 rounded-full bg-[#C66B86]" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#A03E5C]">
            Waiting on the table
          </span>
        </div>
        <div className="text-sm text-[#A89F95] mt-4 max-w-xs">No one has been told.</div>
        <div className="mt-auto w-full flex flex-col gap-1">
          <RaincheckButton reservationId={reservationId} variant="undo" />
          <Link
            href="/"
            className="h-12 inline-flex items-center justify-center text-[#7A6070] font-semibold"
          >
            Back to my dinners
          </Link>
        </div>
      </div>
    </main>
  );
}

function Resolved({ restaurant, when }: { restaurant: string; when: Date }) {
  return (
    <main className="min-h-dvh bg-[#C9E3E7] text-[#4A1E33] font-sans">
      <div className="px-7 pt-16 pb-8 max-w-md mx-auto w-full flex flex-col gap-3 items-center text-center min-h-dvh">
        <div className="w-24 h-24 rounded-full border border-[#B0863C66] flex items-center justify-center mt-2">
          <div className="w-[62px] h-[62px] rounded-full bg-[#B0863C] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F4EDEF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4 10-11" />
            </svg>
          </div>
        </div>
        <h1 className="font-serif text-4xl mt-7">It's called off.</h1>
        <p className="text-[#7A6070] mt-4 max-w-xs">
          You both rainchecked. We just texted you so it's settled. Go enjoy the night off.
        </p>
        <div className="mt-7 w-full bg-[#E8DBB9] border border-[#1a17171a] rounded-2xl p-4 text-left">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-5 h-5 rounded-md bg-[#C2627E] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F4EDEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v2.5" />
                <path d="M3.5 12a8.5 8.5 0 0 1 17 0z" />
                <path d="M12 12v6.5a2.5 2.5 0 0 1-5 0" />
              </svg>
            </div>
            <span className="text-[10.5px] font-mono tracking-wider uppercase text-[#7A6070]">
              Raincheck · now
            </span>
          </div>
          <div className="text-[14.5px] leading-snug">
            Your dinner at {restaurant} ({fmtDate(when)} {fmtTime(when)}) is off — you both called
            it. No hard feelings; see you next time.
          </div>
        </div>
        <div className="mt-auto w-full">
          <Link
            href="/"
            className="h-14 w-full rounded-2xl bg-[#C2627E] text-[#F4EDEF] font-semibold flex items-center justify-center"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}

function fmtDate(d: Date) {
  return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function fmtTime(d: Date) {
  return d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
}
