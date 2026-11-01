"use client";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Props = {
  count?: number;
  /** 0 = drifting freely, 1 = docked into a grid (scroll-scrubbed) */
  dockRef?: RefObject<number>;
  /** Formation generator: returns the docked position for instance i */
  formation?: (i: number, n: number) => [number, number, number];
  color?: string;
  lite?: boolean;
  spread?: [number, number, number];
  center?: [number, number, number];
};

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3(1, 1, 1);

/** Puture's frosted-glass tiles: one InstancedMesh, physical material with transmission. */
export default function Tiles({ count = 48, dockRef, formation, color = "#86efac", lite = false, spread = [9, 4.5, 5], center = [0, 0.4, -1] }: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const viewport = useThree((s) => s.viewport);
  const geo = useMemo(() => new RoundedBoxGeometry(0.52, 0.52, 0.09, 3, 0.06), []);
  const mat = useMemo(
    () =>
      lite
        ? new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.55, envMapIntensity: 1.2 })
        : new THREE.MeshPhysicalMaterial({
            color,
            transmission: 0.92,
            thickness: 0.6,
            roughness: 0.28,
            ior: 1.4,
            attenuationColor: new THREE.Color("#22c55e"),
            attenuationDistance: 1.2,
            envMapIntensity: 1.2,
            clearcoat: 0.6,
          }),
    [color, lite],
  );

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        base: new THREE.Vector3(
          center[0] + (Math.random() - 0.5) * spread[0],
          center[1] + (Math.random() - 0.5) * spread[1],
          center[2] + (Math.random() - 0.5) * spread[2],
        ),
        dock: new THREE.Vector3(...(formation ? formation(i, count) : defaultFormation(i, count))),
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.5,
        rot: new THREE.Vector3(Math.random() * 0.4 - 0.2, Math.random() * 0.6 - 0.3, Math.random() * 0.3 - 0.15),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  );

  useFrame((state) => {
    const im = mesh.current;
    if (!im) return;
    const t = state.clock.elapsedTime;
    const d = dockRef?.current ?? 0;
    const ease = d * d * (3 - 2 * d);
    const px = state.pointer.x * viewport.width * 0.5;
    const py = state.pointer.y * viewport.height * 0.5;

    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      _p.copy(s.base);
      _p.y += Math.sin(t * s.speed + s.phase) * 0.18;
      _p.x += Math.cos(t * s.speed * 0.7 + s.phase) * 0.12;
      // pointer repulsion (in the camera plane)
      const dx = _p.x - px;
      const dy = _p.y - py;
      const dist = Math.hypot(dx, dy);
      if (dist < 1.6) {
        const f = (1.6 - dist) * 0.45 * (1 - ease);
        _p.x += (dx / (dist || 1)) * f;
        _p.y += (dy / (dist || 1)) * f;
      }
      _p.lerp(s.dock, ease);
      _e.set(s.rot.x * (1 - ease) + Math.sin(t * 0.3 + s.phase) * 0.08 * (1 - ease), s.rot.y * (1 - ease), s.rot.z * (1 - ease));
      _q.setFromEuler(_e);
      _m.compose(_p, _q, _s);
      im.setMatrixAt(i, _m);
    }
    im.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geo, mat, count]} frustumCulled={false} />;
}

/** Docked: a tidy 8-wide wall behind and slightly below the logo. */
export function defaultFormation(i: number, n: number): [number, number, number] {
  const cols = 8;
  const rows = Math.ceil(n / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  return [(col - (cols - 1) / 2) * 0.62, (row - (rows - 1) / 2) * 0.62 - 0.2, -2.2];
}
