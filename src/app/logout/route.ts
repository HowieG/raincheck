import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function GET() {
  await destroySession();
  return NextResponse.redirect(new URL("/login", process.env.APP_BASE_URL ?? "http://localhost:3000"));
}
