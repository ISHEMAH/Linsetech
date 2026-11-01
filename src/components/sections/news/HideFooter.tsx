"use client";
import { useEffect } from "react";

/** Sharplink's error page renders without the site footer (`footer { display: none }`); hide ours while mounted. */
export default function HideFooter() {
  useEffect(() => {
    const footer = document.querySelector<HTMLElement>("body > footer, main + footer");
    if (!footer) return;
    const prev = footer.style.display;
    footer.style.display = "none";
    return () => {
      footer.style.display = prev;
    };
  }, []);
  return null;
}
