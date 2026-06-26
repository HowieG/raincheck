import { Resend } from "resend";
import twilio from "twilio";
import { db } from "@/lib/db";
import { failedNotifications, type User } from "@/lib/db/schema";

type NotifyChannel = "email" | "sms" | "both" | "sms-first";
type NotifyKind = "invite" | "cancel";

interface NotifyInput {
  user: Pick<User, "id" | "name" | "phone" | "email">;
  kind: NotifyKind;
  subject: string;
  body: string;
  reservationId?: string;
  idempotencyKey?: string;
}

const channel = (process.env.NOTIFY_CHANNEL ?? "both") as NotifyChannel;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

async function recordFailure(args: {
  reservationId?: string;
  user: NotifyInput["user"];
  channel: "email" | "sms";
  body: string;
  kind: NotifyKind;
  error: unknown;
}) {
  const errorMessage = args.error instanceof Error ? args.error.message : String(args.error);
  try {
    await db.insert(failedNotifications).values({
      reservationId: args.reservationId ?? null,
      recipientUserId: args.user.id,
      recipientPhone: args.channel === "sms" ? args.user.phone : null,
      recipientEmail: args.channel === "email" ? args.user.email ?? null : null,
      channel: args.channel,
      body: args.body,
      kind: args.kind,
      errorMessage,
    });
  } catch (dbError) {
    console.error("[notify] failed to record failure", { dbError, errorMessage });
  }
}

async function sendEmail(input: NotifyInput): Promise<{ ok: boolean; error?: unknown }> {
  if (!resend) return { ok: false, error: new Error("RESEND_API_KEY not set") };
  if (!input.user.email) return { ok: false, error: new Error("user has no email") };
  const from = process.env.RESEND_FROM ?? "raincheck <onboarding@resend.dev>";
  try {
    const { error } = await resend.emails.send({
      from,
      to: input.user.email,
      subject: input.subject,
      text: input.body,
    });
    if (error) return { ok: false, error };
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

async function sendSms(input: NotifyInput): Promise<{ ok: boolean; error?: unknown }> {
  if (!twilioClient) return { ok: false, error: new Error("Twilio not configured") };
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) return { ok: false, error: new Error("TWILIO_FROM_NUMBER not set") };
  try {
    await twilioClient.messages.create({
      to: input.user.phone,
      from,
      body: input.body,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function notify(input: NotifyInput): Promise<void> {
  if (channel === "email") {
    const r = await sendEmail(input);
    if (!r.ok) await recordFailure({ ...input, channel: "email", error: r.error });
    return;
  }
  if (channel === "sms") {
    const r = await sendSms(input);
    if (!r.ok) await recordFailure({ ...input, channel: "sms", error: r.error });
    return;
  }
  if (channel === "sms-first") {
    const s = await sendSms(input);
    if (s.ok) return;
    await recordFailure({ ...input, channel: "sms", error: s.error });
    const e = await sendEmail(input);
    if (!e.ok) await recordFailure({ ...input, channel: "email", error: e.error });
    return;
  }
  const [s, e] = await Promise.all([sendSms(input), sendEmail(input)]);
  if (!s.ok) await recordFailure({ ...input, channel: "sms", error: s.error });
  if (!e.ok) await recordFailure({ ...input, channel: "email", error: e.error });
}

export function cancelMessage(args: { restaurant: string; whenLocal: string }) {
  return {
    subject: `Your dinner at ${args.restaurant} is off`,
    body: `Your dinner at ${args.restaurant} (${args.whenLocal}) is off — you both called it. No hard feelings; see you next time.`,
  };
}

export function inviteMessage(args: {
  fromName: string;
  restaurant: string;
  whenLocal: string;
  url: string;
}) {
  return {
    subject: `${args.fromName} added you to a raincheck dinner`,
    body: `${args.fromName} added you to a dinner at ${args.restaurant} on ${args.whenLocal}. View it: ${args.url}`,
  };
}
