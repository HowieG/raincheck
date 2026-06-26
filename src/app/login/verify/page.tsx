"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyCode, type VerifyState } from "../actions";

const initial: VerifyState = {};

export default function VerifyPage() {
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const [state, action, pending] = useActionState(verifyCode, initial);
  return (
    <main className="min-h-dvh bg-[#C9E3E7] text-[#4A1E33] font-sans">
      <div className="px-8 pt-16 pb-10 max-w-md mx-auto w-full flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#C2627E]" />
          <span className="text-xs font-mono tracking-[0.22em] uppercase">Raincheck</span>
        </div>
        <div>
          <h1 className="font-serif text-4xl leading-none">Check your texts.</h1>
          <p className="mt-4 text-[#7A6070] font-mono text-sm">{phone}</p>
        </div>
        <form action={action} className="flex flex-col gap-6">
          <input type="hidden" name="phone" value={phone} />
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-mono tracking-[0.12em] uppercase text-[#7A6070]">
              6-digit code
            </span>
            <input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              required
              placeholder="000000"
              className="bg-transparent border-b border-[#1a17150d] py-2 text-2xl font-mono tracking-[0.3em] outline-none focus:border-[#4A1E33] placeholder:text-[#A89F95]"
            />
          </label>
          {state.error ? <p className="text-sm text-[#C2627E]">{state.error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="h-14 rounded-2xl bg-[#C2627E] text-[#F4EDEF] font-semibold disabled:opacity-60"
          >
            {pending ? "Checking…" : "Verify"}
          </button>
        </form>
      </div>
    </main>
  );
}
