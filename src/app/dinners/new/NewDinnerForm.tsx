"use client";

import { useActionState, useState } from "react";
import { createDinnerAction, type CreateDinnerState } from "./actions";

const initial: CreateDinnerState = {};

interface Props {
  me: { id: string; name: string };
  others: { id: string; name: string }[];
}

export default function NewDinnerForm({ me, others }: Props) {
  const [state, action, pending] = useActionState(createDinnerAction, initial);
  const [otherId, setOtherId] = useState<string>("");
  const otherName = others.find((o) => o.id === otherId)?.name;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="otherAttendeeId" value={otherId} />

      <div className="border border-dashed border-[#c2627e80] rounded-2xl px-4 py-3.5 flex items-center gap-3 bg-[#c2627e0a]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C2627E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 15l6-6" />
          <path d="M11 7l1-1a4 4 0 0 1 6 6l-1 1" />
          <path d="M13 17l-1 1a4 4 0 0 1-6-6l1-1" />
        </svg>
        <div className="flex-1">
          <input
            name="sourceUrl"
            type="url"
            placeholder="Paste a reservation link"
            className="w-full bg-transparent text-sm font-semibold text-[#C2627E] outline-none placeholder:text-[#C2627E]"
          />
          <div className="text-[10px] font-mono text-[#7A6070] tracking-wider mt-0.5">
            OPENTABLE · RESY · YELP · GOOGLE MAPS
          </div>
        </div>
      </div>

      <Field label="Restaurant">
        <input name="restaurant" required className={fieldInput} placeholder="The Drinking Pig" />
      </Field>

      <Field label="Where">
        <input name="location" className={fieldInput} placeholder="Coconut Grove, Miami" />
      </Field>

      <Field label="Date & time">
        <input
          name="scheduledAt"
          type="datetime-local"
          required
          className={`${fieldInput} font-mono text-lg`}
        />
      </Field>

      <div>
        <div className="text-[11px] font-mono tracking-[0.12em] uppercase text-[#7A6070] mb-3">
          Who's coming
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Chip selected name={`${me.name} (you)`} initial={me.name[0]} />
          {others.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOtherId(otherId === o.id ? "" : o.id)}
              className={
                otherId === o.id
                  ? "flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-[#E8DBB9] border border-[#1a17172e]"
                  : "flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-[#EFE8DD] border border-transparent opacity-70"
              }
            >
              <span className="w-6 h-6 rounded-full bg-[#E3DAEC] text-[10px] font-semibold text-[#7A6070] flex items-center justify-center">
                {o.name[0]}
              </span>
              <span className="text-sm font-medium">{o.name}</span>
            </button>
          ))}
        </div>
        <div className="text-[11px] font-mono text-[#A89F95] mt-3">
          {otherName ? `Just you and ${otherName} — that's all it takes.` : "Pick one person."}
        </div>
      </div>

      {state.error ? <p className="text-sm text-[#C2627E]">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending || !otherId}
        className="h-14 rounded-2xl bg-[#C2627E] text-[#F4EDEF] font-semibold disabled:opacity-50 mt-2"
      >
        {pending ? "Adding…" : "Add dinner"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-mono tracking-[0.12em] uppercase text-[#7A6070]">
        {label}
      </span>
      {children}
    </label>
  );
}

const fieldInput =
  "bg-transparent border-b border-[#1a17172e] py-2 text-xl outline-none focus:border-[#4A1E33] placeholder:text-[#A89F95]";

function Chip({ name, initial, selected }: { name: string; initial: string; selected?: boolean }) {
  return (
    <span
      className={
        selected
          ? "flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-[#EFE8DD] border border-[#1a17172e]"
          : "flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-[#EFE8DD]"
      }
    >
      <span className="w-6 h-6 rounded-full bg-[#DDD2C4] text-[10px] font-semibold text-[#7A6070] flex items-center justify-center">
        {initial}
      </span>
      <span className="text-sm font-medium">{name}</span>
    </span>
  );
}
