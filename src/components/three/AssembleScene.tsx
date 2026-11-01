"use client";
import { Suspense, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Env from "./Env";
import { useCanvasVisible } from "./useCanvasVisible";
import LogoMark3D, { type LogoMaterial } from "./LogoMark3D";

type Props = { explodeRef: RefObject<number>; material?: LogoMaterial; className?: string; light?: boolean; spin?: number };

/** The LS mark assembling from its five strokes, scrubbed by scroll (replaces Sharplink's piston video). */
export default function AssembleScene({ explodeRef, material = "chrome", className, light = true, spin = 0.12 }: Props) {
  const [wrap, visible] = useCanvasVisible();

  return (
    <div ref={wrap} className={className}>
      <Canvas
        dpr={[1, 1.6]}
        frameloop={visible ? "always" : "never"}
        camera={{ fov: 28, position: [0, 0, 9.5] }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: light ? 1.15 : 1 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Env intensity={light ? 1.2 : 1.7} green={light ? 0.7 : 1} />
          <LogoMark3D material={material} explodeRef={explodeRef} parallax={0.25} float={false} spin={spin} scale={1} explodeScale={0.55} />
        </Suspense>
        <directionalLight position={[4, 5, 6]} intensity={2} />
        <directionalLight position={[-5, -3, 3]} intensity={2.2} color="#8dffc4" />
      </Canvas>
    </div>
  );
}
