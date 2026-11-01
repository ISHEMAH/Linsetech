"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { TOPICS, type Topic } from "@/lib/forms";

/**
 * What the contact drawer opens on. `topic` preselects "What do you need?" (`careers` = job application for `role`);
 * `returnFocus` is where focus goes when it closes (default: whatever had focus when it opened).
 */
export type ContactRequest = { topic?: Topic; role?: string; returnFocus?: HTMLElement | null };

type Ctx = {
  isOpen: boolean;
  /** the latest open() call; a new object each time */
  request: ContactRequest;
  /** `open()`, `open({ topic: "careers", role })`, or straight as an onClick handler (the event is ignored) */
  open: (request?: ContactRequest | SyntheticEvent) => void;
  close: () => void;
};

const ContactCtx = createContext<Ctx>({ isOpen: false, request: {}, open: () => {}, close: () => {} });

function toRequest(arg: unknown): ContactRequest {
  if (!arg || typeof arg !== "object" || "nativeEvent" in arg || arg instanceof Event) return {};
  const { topic, role, returnFocus } = arg as Record<string, unknown>;
  return {
    topic: typeof topic === "string" && (TOPICS as readonly string[]).includes(topic) ? (topic as Topic) : undefined,
    role: typeof role === "string" ? role : undefined,
    returnFocus: returnFocus instanceof HTMLElement ? returnFocus : undefined,
  };
}

export function ContactProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ isOpen: boolean; request: ContactRequest }>({ isOpen: false, request: {} });
  const open = useCallback((arg?: ContactRequest | SyntheticEvent) => setState({ isOpen: true, request: toRequest(arg) }), []);
  const close = useCallback(() => setState((s) => (s.isOpen ? { ...s, isOpen: false } : s)), []);
  const value = useMemo(() => ({ ...state, open, close }), [state, open, close]);
  return <ContactCtx.Provider value={value}>{children}</ContactCtx.Provider>;
}

export const useContact = () => useContext(ContactCtx);
