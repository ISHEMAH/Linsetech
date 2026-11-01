import type { Service } from "@/content/services";

const paths: Record<Service["key"], string> = {
  design: "M4 20l4-1 10-10-3-3L5 16l-1 4zM14 6l3 3",
  web: "M3 5h18v12H3zM8 21h8M12 17v4",
  systems: "M4 6h6v6H4zM14 12h6v6h-6zM10 9h4M14 15h-4v-6",
  software: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  hardware: "M4 7h16v8H4zM2 19h20M9 15v4M15 15v4",
  it: "M12 2a4 4 0 110 8 4 4 0 010-8zM4 22a8 8 0 0116 0M18 8l3-1M3 7l3 1",
};

export default function ServiceIcon({ name, className }: { name: Service["key"]; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}
