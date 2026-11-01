"use client";
import { useRef } from "react";
import dynamic from "next/dynamic";
import type { LogoMaterial } from "./LogoMark3D";

const AssembleScene = dynamic(() => import("./AssembleScene"), { ssr: false });

/** A floating (assembled) LS mark for page heroes: glass on About, chrome elsewhere. */
export default function LogoFloat({ material = "glass", className }: { material?: LogoMaterial; className?: string }) {
  const zero = useRef(0);
  return <AssembleScene explodeRef={zero} material={material} light={false} spin={0.25} className={className} />;
}
