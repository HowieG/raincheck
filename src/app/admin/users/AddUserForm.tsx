"use client";

import { useActionState, useEffect, useRef } from "react";
import { addUserAction, type AddUserState } from "./actions";

const initial: AddUserState = {};

export default function AddUserForm() {
  const [state, action, pending] = useActionState(addUserAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);
  return (
    <form
      ref={formRef}
      action={action}
      className="bg-[#E8DBB9] border border-[#1a17171a] rounded-2xl p-5 flex flex-col gap-4"
    >
      <div className="text-[11px] font-mono tracking-[0.12em] uppercase text-[#7A6070]">
        Add a friend
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-mono tracking-[0.1em] uppercase text-[#7A6070]">
          Name
        </span>
        <input
          name="name"
          required
          className="bg-transparent border-b border-[#1a17171f] py-2 text-lg outline-none focus:border-[#4A1E33]"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-mono tracking-[0.1em] uppercase text-[#7A6070]">
          Mobile number
        </span>
        <input
          name="phone"
          type="tel"
          required
          placeholder="+1 (305) 555-0148"
          className="bg-transparent border-b border-[#1a17171f] py-2 text-lg font-mono outline-none focus:border-[#4A1E33] placeholder:text-[#A89F95]"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-mono tracking-[0.1em] uppercase text-[#7A6070]">
          Email (optional, enables fallback)
        </span>
        <input
          name="email"
          type="email"
          className="bg-transparent border-b border-[#1a17171f] py-2 text-lg outline-none focus:border-[#4A1E33] placeholder:text-[#A89F95]"
        />
      </label>
      {state.error ? <p className="text-sm text-[#C2627E]">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-[#B0863C]">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl bg-[#C2627E] text-[#F4EDEF] font-semibold disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add to roster"}
      </button>
    </form>
  );
}
