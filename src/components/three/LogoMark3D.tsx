"use client";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { logoPieceGeometries, LOGO_SCALE, PIECE_OFFSETS } from "./logoShapes";

export type LogoMaterial = "chrome" | "glass" | "wire";

export function makeLogoMaterial(kind: LogoMaterial) {
  if (kind === "glass")
    return new THREE.MeshPhysicalMaterial({
      color: "#9ff5c0",
      transmission: 1,
      thickness: 1.4,
      roughness: 0.1,
      ior: 1.45,
      attenuationColor: new THREE.Color("#16a34a"),
      attenuationDistance: 1.8,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.4,
    });
  if (kind === "wire")
    return new THREE.MeshBasicMaterial({ color: "#22c55e", wireframe: true, transparent: true, opacity: 0.35 });
  return new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    metalness: 1,
    roughness: 0.07,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 2.2,
  });
}

type Props = {
  material?: LogoMaterial;
  /** 0 = assembled, 1 = exploded. Read every frame (scroll-scrubbed). */
  explodeRef?: RefObject<number>;
  /** Pointer parallax strength */
  parallax?: number;
  float?: boolean;
  scale?: number;
  spin?: number;
  /** multiplier on the explode offsets */
  explodeScale?: number;
};

/** The LS mark as five extruded strokes, so it can assemble / explode. */
export default function LogoMark3D({ material = "chrome", explodeRef, parallax = 0.35, float = true, scale = 1, spin = 0, explodeScale = 1 }: Props) {
  const group = useRef<THREE.Group>(null);
  const pieces = useRef<(THREE.Mesh | null)[]>([]);
  const geos = useMemo(() => logoPieceGeometries(), []);
  const mat = useMemo(() => makeLogoMaterial(material), [material]);
  const target = useMemo(() => new THREE.Vector2(), []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // Pointer parallax with damping (Puture: tiles react to pointer; Sharplink: hero object tilts)
    target.set(state.pointer.x * parallax, state.pointer.y * parallax);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, target.x * 0.9 + spin * t, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -target.y * 0.6, 3, dt);
    if (float) g.position.y = Math.sin(t * 0.8) * 0.08;

    const e = explodeRef?.current ?? 0;
    pieces.current.forEach((m, i) => {
      if (!m) return;
      const [ox, oy, oz] = PIECE_OFFSETS[i];
      const ease = e * e * (3 - 2 * e);
      m.position.set(ox * ease * explodeScale, oy * ease * explodeScale, oz * ease * explodeScale);
      m.rotation.set(ease * (i % 2 ? 0.6 : -0.4), ease * (i % 3 ? -0.5 : 0.7), ease * 0.3 * (i - 2));
    });
  });

  return (
    <group ref={group} scale={LOGO_SCALE * scale}>
      {geos.map((geo, i) => (
        <mesh key={i} ref={(el) => (pieces.current[i] = el)} geometry={geo} material={mat} castShadow />
      ))}
    </group>
  );
}
