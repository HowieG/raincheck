import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

const COOKIE_NAME = "raincheck_session";
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 30;

interface SessionPayload {
  uid: string;
  sv: number;
  iat: number;
  exp: number;
}

function getSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET;
  if (!raw) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(raw);
}

function base64UrlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function base64UrlDecode(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, "base64url"));
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    getSecret() as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64UrlEncode(new Uint8Array(sig));
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function sign(payload: SessionPayload): Promise<string> {
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(body);
  return `${body}.${sig}`;
}

export async function verify(token: string): Promise<SessionPayload | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmac(body);
  if (!constantTimeEq(sig, expected)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as SessionPayload;
    if (Date.now() > payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, sessionVersion: number): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign({
    uid: userId,
    sv: sessionVersion,
    iat: now,
    exp: now + COOKIE_MAX_AGE_S,
  });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_S,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verify(token);
  if (!payload) return null;
  const [row] = await db.select().from(users).where(eq(users.id, payload.uid)).limit(1);
  if (!row) return null;
  if (row.sessionVersion !== payload.sv) return null;
  return row;
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin(): Promise<User> {
  const u = await requireUser();
  if (!u.isAdmin) redirect("/");
  return u;
}

export async function revokeAllSessionsFor(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ sessionVersion: (await db.select({ sv: users.sessionVersion }).from(users).where(eq(users.id, userId)).limit(1))[0].sv + 1 })
    .where(eq(users.id, userId));
}
