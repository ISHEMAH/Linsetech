"use client";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useContact } from "@/components/layout/ContactContext";

/** Sharplink about-hero CTAs: primary with the arrow box, secondary plain, stacked 2 px apart at one shared width. */
export default function HeroCtas({ work, talk }: { work: string; talk: string }) {
  const { open } = useContact();
  return (
    <div className="flex flex-col items-stretch gap-[2px]">
      <ButtonLink href="/work">{work}</ButtonLink>
      <Button variant="secondary" arrow={false} onClick={open}>
        {talk}
      </Button>
    </div>
  );
}
