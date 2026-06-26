"use client";

import { useActionState } from "react";
import { verifyCode, type VerifyState } from "../actions";

const initial: VerifyState = {};

export default function VerifyForm({ phone }: { phone: string }) {
  const [state, action, pending] = useActionState(verifyCode, initial);
  return (
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
  );
}
