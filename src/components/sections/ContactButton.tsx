"use client";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useContact } from "@/components/layout/ContactContext";

/** Opens the "Start a project" dialog; usable from server components. */
export function ContactButton({ children, variant = "primary" }: { children: ReactNode; variant?: "primary" | "secondary" | "light" }) {
  const { open } = useContact();
  return (
    <Button variant={variant} onClick={open}>
      {children}
    </Button>
  );
}
