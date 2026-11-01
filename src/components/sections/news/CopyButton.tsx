"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Check, CopyIcon } from "./Icons";
import s from "./news-classes";

/** Sharplink contact "COPY": 12px icon + narrow label; confirms for 2s after copying. */
export default function CopyButton({ value, label, done, className }: { value: string; label: string; done: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={cn(s.copy, className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setOk(true);
          setTimeout(() => setOk(false), 2000);
        } catch {
          /* clipboard unavailable */
        }
      }}
      aria-label={`${label} ${value}`}
    >
      {ok ? <Check /> : <CopyIcon />}
      <span aria-live="polite">{ok ? done : label}</span>
    </button>
  );
}
