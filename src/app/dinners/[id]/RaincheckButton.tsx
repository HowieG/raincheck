"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toggleVoteAction } from "./actions";

const HOLD_MS = 5000;

interface Props {
  reservationId: string;
  variant?: "primary" | "undo";
}

export default function RaincheckButton({ reservationId, variant = "primary" }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [holdingUntil, setHoldingUntil] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const r = await toggleVoteAction(reservationId);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  if (variant === "undo") {
    return (
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="h-14 w-full rounded-2xl border border-[#1a17172e] bg-transparent text-[#4A1E33] font-semibold disabled:opacity-60"
      >
        {pending ? "Bringing you back…" : "I changed my mind — I'm in"}
      </button>
    );
  }

  if (holdingUntil) {
    const msLeft = Math.max(0, holdingUntil - Date.now());
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setHoldingUntil(null);
          }}
          className="h-14 w-full rounded-2xl bg-[#C2627E] text-[#F4EDEF] font-semibold flex items-center justify-center gap-2"
        >
          Cancel — I&apos;m in (
          <Countdown until={holdingUntil} onZero={() => null} />)
        </button>
        {error ? <p className="text-sm text-[#C2627E] text-center mt-1">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const until = Date.now() + HOLD_MS;
          setHoldingUntil(until);
          timerRef.current = setTimeout(() => {
            setHoldingUntil(null);
            submit();
          }, HOLD_MS);
        }}
        className="h-14 w-full rounded-2xl bg-[#C2627E] text-[#F4EDEF] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F4EDEF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v2.5" />
          <path d="M3.5 12a8.5 8.5 0 0 1 17 0z" />
          <path d="M12 12v6.5a2.5 2.5 0 0 1-5 0" />
        </svg>
        Raincheck this dinner
      </button>
      {error ? <p className="text-sm text-[#C2627E] text-center mt-1">{error}</p> : null}
    </div>
  );
}

function Countdown({ until, onZero }: { until: number; onZero: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, Math.ceil((until - now) / 1000));
  useEffect(() => {
    if (remaining === 0) onZero();
  }, [remaining, onZero]);
  return <span className="font-mono text-sm">{remaining}s</span>;
}
