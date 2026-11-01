"use client";
import { Suspense, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import Env from "./Env";
import { useCanvasVisible } from "./useCanvasVisible";
import LogoMark3D from "./LogoMark3D";
import Tiles from "./Tiles";

type Props = { progressRef: RefObject<number>; className?: string };

function Rig({ progressRef }: { progressRef: RefObject<number> }) {
  const zeroRef = useRef(0);
  const viewport = useThree((s) => s.viewport);
  const portrait = viewport.aspect < 0.9;
  // keep the mark clear of the headline: right of centre on landscape, top-centre on phones
  const logoPos: [number, number, number] = portrait ? [0, viewport.height * 0.33, 0] : [viewport.width * 0.27, 0.15, 0];
  const logoScale = portrait ? Math.min(0.6, viewport.width * 0.27) : Math.min(1.1, viewport.width / 5.6);
  useFrame((state) => {
    // As the hero scrolls away the camera rises and the logo tilts back (Sharplink hero exit)
    const p = progressRef.current ?? 0;
    state.camera.position.y = THREE.MathUtils.lerp(0.35, 1.6, p);
    state.camera.position.z = THREE.MathUtils.lerp(7.2, 8.4, p);
    state.camera.lookAt(0, 0.1 - p * 0.6, 0);
  });
  return (
    <group>
      <group position={logoPos}>
        <LogoMark3D material="chrome" explodeRef={zeroRef} parallax={0.4} scale={logoScale} />
      </group>
      <Tiles count={typeof window !== "undefined" && window.innerWidth < 768 ? 20 : 48} dockRef={progressRef} lite={typeof window !== "undefined" && window.innerWidth < 768} />
    </group>
  );
}

/** Home hero: chrome LS mark over an infinite green grid, glass tiles drifting around it. */
export default function HeroScene({ progressRef, className }: Props) {
  const [wrap, visible] = useCanvasVisible();

  return (
    <div ref={wrap} className={className}>
      <Canvas
        dpr={[1, 1.6]}
        frameloop={visible ? "always" : "never"}
        camera={{ fov: 30, position: [0, 0.35, 7.2], near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        style={{ background: "transparent" }}
      >
        <fog attach="fog" args={["#04150f", 9, 24]} />
        <Suspense fallback={null}>
          <Env intensity={1.7} />
          <Rig progressRef={progressRef} />
        </Suspense>
        <directionalLight position={[4, 5, 6]} intensity={2.4} color="#ffffff" />
        <directionalLight position={[-5, -2, 3]} intensity={2.8} color="#8dffc4" />
        <directionalLight position={[2, -4, -3]} intensity={1.2} color="#bfffe0" />
        <Grid
          position={[0, -1.7, 0]}
          args={[40, 40]}
          cellSize={0.6}
          cellThickness={0.6}
          cellColor="#0f5132"
          sectionSize={3}
          sectionThickness={1.1}
          sectionColor="#16a34a"
          fadeDistance={24}
          fadeStrength={1.6}
          infiniteGrid
        />
      </Canvas>
    </div>
  );
}
