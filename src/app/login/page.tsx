"use client";

import { useActionState } from "react";
import { requestCode, type LoginStartState } from "./actions";

const initial: LoginStartState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(requestCode, initial);
  return (
    <main className="min-h-dvh flex flex-col bg-[#C9E3E7] text-[#4A1E33] font-sans">
      <div className="flex-1 flex flex-col px-8 pt-16 pb-10 max-w-md mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#C2627E]" />
          <span className="text-xs font-mono tracking-[0.22em] uppercase">Raincheck</span>
        </div>
        <h1 className="mt-12 font-serif text-5xl leading-none">
          Bow out,
          <br />
          gracefully.
        </h1>
        <p className="mt-5 text-base text-[#7A6070] max-w-xs leading-snug">
          Add your dinners. When everyone's quietly ready to bail, Raincheck makes the call and texts
          the table — no awkwardness, no bad guy.
        </p>
        <form action={action} className="mt-auto flex flex-col gap-6">
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-mono tracking-[0.12em] uppercase text-[#7A6070]">
              Mobile number
            </span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              defaultValue={state.phone}
              placeholder="+1 (305) 555-0148"
              className="bg-transparent border-b border-[#1a17150d] py-2 text-xl font-mono outline-none focus:border-[#4A1E33] placeholder:text-[#A89F95]"
            />
          </label>
          {state.error ? (
            <p className="text-sm text-[#C2627E]">{state.error}</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="h-14 rounded-2xl bg-[#C2627E] text-[#F4EDEF] font-semibold disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send me a code"}
          </button>
          <p className="text-[11px] font-mono leading-snug text-[#A89F95] text-center -mt-1">
            We text a 6-digit code to confirm it's you.
            <br />
            Message &amp; data rates may apply.
          </p>
        </form>
      </div>
    </main>
  );
}
