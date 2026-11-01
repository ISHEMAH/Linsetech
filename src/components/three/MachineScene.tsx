"use client";
import { Suspense, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Env from "./Env";
import { logoPieceGeometries, LOGO_SCALE } from "./logoShapes";
import { useCanvasVisible } from "./useCanvasVisible";

/**
 * Sharplink's "stack" machine (the chrome piston), procedural:
 * cap + crest, springs, glass tube with dotted guides, the floating icon pieces of the active row,
 * grooved ring, base disc and pillars. Assembles with `progressRef`, swaps the icon set with `rowRef`,
 * crossfades to a line drawing with `wireRef` (the dark banner).
 */
type Variant = "stack" | "banner" | "parts";
type Props = {
  progressRef?: RefObject<number>;
  rowRef?: RefObject<number>;
  wireRef?: RefObject<number>;
  variant?: Variant;
  className?: string;
  dark?: boolean;
};

const chromeBase = { color: "#ffffff", metalness: 1, roughness: 0.18, envMapIntensity: 1.35 };

function chromeMat() {
  return new THREE.MeshStandardMaterial({ ...chromeBase, transparent: true });
}

type Part = { name: string; geo: THREE.BufferGeometry; pos: [number, number, number]; rot?: [number, number, number]; offset: [number, number, number]; delay: number; mat?: THREE.Material };

function helix(radius: number, turns: number, height: number, segments = 240) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2 * turns;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, (i / segments) * height - height / 2, Math.sin(a) * radius));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segments, 0.045, 12, false);
}

function buildParts(): Part[] {
  const P: Part[] = [];
  const add = (name: string, geo: THREE.BufferGeometry, pos: [number, number, number], offset: [number, number, number], delay: number, rot?: [number, number, number]) =>
    P.push({ name, geo, pos, offset, delay, rot });
  // top cap + crest
  add("crestCone", new THREE.ConeGeometry(0.46, 0.7, 4), [0, 3.05, 0], [0, 3.6, 0], 0.0, [0, Math.PI / 4, 0]);
  add("cap", new THREE.CylinderGeometry(1.15, 1.15, 0.55, 72), [0, 2.35, 0], [0, 3.2, 0], 0.05);
  add("capInner", new THREE.CylinderGeometry(0.78, 0.78, 0.4, 64), [0, 1.9, 0], [0, 3.2, 0], 0.1);
  add("spring", helix(0.62, 4, 0.95), [0, 1.25, 0], [0, 2.4, 0], 0.2);
  // grooved mid ring
  add("ring", new THREE.CylinderGeometry(1.22, 1.22, 0.5, 72), [0, -1.0, 0], [0, -1.6, 0], 0.3);
  add("ringGroove", new THREE.TorusGeometry(1.24, 0.03, 12, 96), [0, -0.85, 0], [0, -1.6, 0], 0.3, [Math.PI / 2, 0, 0]);
  add("ringGroove2", new THREE.TorusGeometry(1.24, 0.03, 12, 96), [0, -1.15, 0], [0, -1.6, 0], 0.3, [Math.PI / 2, 0, 0]);
  add("ringInner", new THREE.CylinderGeometry(0.95, 0.95, 0.35, 64), [0, -0.6, 0], [0, -1.6, 0], 0.32);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    add(`knurl${i}`, new THREE.BoxGeometry(0.06, 0.16, 0.07), [Math.cos(a) * 1.24, -1.0, Math.sin(a) * 1.24], [0, -1.6, 0], 0.34, [0, -a, 0]);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    add(`bolt${i}`, new THREE.CylinderGeometry(0.07, 0.07, 0.08, 6), [Math.cos(a) * 0.95, 2.66, Math.sin(a) * 0.95], [0, 3.2, 0], 0.08);
  }
  add("rod", new THREE.CylinderGeometry(0.16, 0.16, 0.9, 32), [0, -1.5, 0], [0, -2.2, 0], 0.4);
  // base
  add("baseTop", new THREE.CylinderGeometry(1.35, 1.35, 0.22, 72), [0, -1.95, 0], [0, -3, 0], 0.45);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    add(`pillar${i}`, new THREE.CylinderGeometry(0.14, 0.14, 0.95, 24), [Math.cos(a) * 1.08, -2.55, Math.sin(a) * 1.08], [0, -3.2 - (i % 3) * 0.4, 0], 0.5 + (i % 4) * 0.06);
  }
  add("baseBottom", new THREE.CylinderGeometry(1.4, 1.4, 0.2, 72), [0, -3.12, 0], [0, -3.6, 0], 0.6);
  return P;
}

/** Icon pieces per row: small chrome symbols floating inside the tube. */
function IconSet({ row }: { row: number }) {
  const geos = useMemo(() => logoPieceGeometries(), []);
  const mat = useMemo(() => chromeMat(), []);
  switch (row) {
    case 0: // software: two people
      return (
        <group>
          <mesh geometry={new THREE.SphereGeometry(0.14, 24, 24)} material={mat} position={[-0.28, 0.42, 0]} />
          <mesh geometry={new THREE.CapsuleGeometry(0.17, 0.22, 8, 24)} material={mat} position={[-0.28, 0.04, 0]} />
          <mesh geometry={new THREE.SphereGeometry(0.12, 24, 24)} material={mat} position={[0.3, 0.22, 0.1]} />
          <mesh geometry={new THREE.CapsuleGeometry(0.15, 0.2, 8, 24)} material={mat} position={[0.3, -0.14, 0.1]} />
        </group>
      );
    case 1: // products: the LS mark on a hexagonal badge
      return (
        <group>
          <mesh geometry={new THREE.CylinderGeometry(0.46, 0.46, 0.1, 6)} material={mat} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, -0.08]} />
          <group scale={LOGO_SCALE * 0.22} position={[0, 0.05, 0.02]}>
            {geos.map((g, i) => (
              <mesh key={i} geometry={g} material={mat} />
            ))}
          </group>
        </group>
      );
    case 2: // hardware: server box + two cables
      return (
        <group>
          <mesh geometry={new THREE.BoxGeometry(0.62, 0.34, 0.3)} material={mat} position={[0, 0.1, 0]} />
          <mesh geometry={new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16)} material={mat} position={[-0.18, -0.3, 0.1]} rotation={[0.2, 0, 0.3]} />
          <mesh geometry={new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16)} material={mat} position={[0.2, -0.32, -0.05]} rotation={[-0.2, 0, -0.35]} />
        </group>
      );
    default: // services: linked rings + cog
      return (
        <group>
          <mesh geometry={new THREE.TorusGeometry(0.26, 0.06, 16, 48)} material={mat} position={[-0.2, 0.1, 0]} rotation={[0.3, 0.4, 0]} />
          <mesh geometry={new THREE.TorusGeometry(0.26, 0.06, 16, 48)} material={mat} position={[0.2, -0.05, 0.1]} rotation={[0.5, -0.4, 0.4]} />
          <mesh geometry={new THREE.CylinderGeometry(0.18, 0.18, 0.1, 8)} material={mat} position={[0.05, 0.5, -0.1]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      );
  }
}

/** The opportunity clip: large chrome cylinders on a diagonal, a cone and a piston arm, drifting with scroll. */
function Parts({ progressRef }: Pick<Props, "progressRef">) {
  const root = useRef<THREE.Group>(null);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ ...chromeBase, roughness: 0.1 }), []);
  const items = useMemo(
    () => [
      { geo: new THREE.CylinderGeometry(0.95, 0.95, 3.6, 72, 1, false), pos: [0.2, 1.9, 0] as [number, number, number], drift: 0.7 },
      { geo: new THREE.CylinderGeometry(0.75, 0.75, 1.1, 72), pos: [0.2, -0.75, 0] as [number, number, number], drift: 0.2 },
      { geo: new THREE.ConeGeometry(0.72, 1.3, 4), pos: [0.2, -1.95, 0] as [number, number, number], drift: -0.3 },
      { geo: new THREE.CylinderGeometry(0.95, 0.95, 2.2, 72), pos: [0.2, -3.9, 0] as [number, number, number], drift: -0.9 },
      { geo: new THREE.CylinderGeometry(0.12, 0.12, 1.6, 24), pos: [1.3, -1.2, 0.3] as [number, number, number], drift: -0.4, rot: [0, 0, 1.1] as [number, number, number] },
      { geo: new THREE.SphereGeometry(0.22, 32, 32), pos: [2.0, -1.65, 0.3] as [number, number, number], drift: -0.4 },
      { geo: new THREE.TorusGeometry(0.98, 0.05, 16, 96), pos: [0.2, 0.1, 0] as [number, number, number], drift: 0.5, rot: [Math.PI / 2, 0, 0] as [number, number, number] },
    ],
    [],
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((st, dt) => {
    const g = root.current!;
    const p = progressRef?.current ?? 0;
    const t = st.clock.elapsedTime;
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, 0.42 + st.pointer.x * 0.05, 2, dt);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, st.pointer.x * 0.3 + Math.sin(t * 0.2) * 0.15, 2, dt);
    g.position.y = THREE.MathUtils.lerp(1.9, -1.4, p);
    items.forEach((it, i) => {
      const m = refs.current[i];
      if (!m) return;
      // the stack opens up as you scroll past it
      m.position.set(it.pos[0], it.pos[1] + it.drift * (p * 1.6 - 0.4) + Math.sin(t * 0.6 + i) * 0.05, it.pos[2]);
    });
  });
  return (
    <group ref={root} position={[1.2, 0, 0]}>
      {items.map((it, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={it.geo} material={mat} position={it.pos} rotation={it.rot ?? [0, 0, 0]} />
      ))}
    </group>
  );
}

function Machine({ progressRef, rowRef, wireRef, variant }: Required<Pick<Props, "variant">> & Pick<Props, "progressRef" | "rowRef" | "wireRef">) {
  const root = useRef<THREE.Group>(null);
  const parts = useMemo(() => buildParts().filter((p) => (variant === "parts" ? /cap|spring|ring$|pillar[0-5]$|baseTop/.test(p.name) : true)), [variant]);
  const mats = useMemo(() => parts.map(() => chromeMat()), [parts]);
  const lineMats = useMemo(() => parts.map(() => new THREE.LineBasicMaterial({ color: "#f3f3f3", transparent: true, opacity: 0 })), [parts]);
  const edges = useMemo(() => parts.map((p) => new THREE.EdgesGeometry(p.geo, 28)), [parts]);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lineRefs = useRef<(THREE.LineSegments | null)[]>([]);
  const iconGroups = useRef<(THREE.Group | null)[]>([]);
  const glassMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0, roughness: 0.05, transparent: true, opacity: 0.16, side: THREE.DoubleSide, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false }),
    [],
  );
  const dots = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      pts.push(Math.cos(a) * 0.5, -0.75, Math.sin(a) * 0.5, Math.cos(a) * 0.5, 1.6, Math.sin(a) * 0.5);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const dotsRef = useRef<THREE.LineSegments>(null);

  useFrame((st, dt) => {
    const g = root.current!;
    const t = st.clock.elapsedTime;
    const p = progressRef?.current ?? 1;
    const wire = wireRef?.current ?? (variant === "banner" ? 1 : 0);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, st.pointer.x * 0.35 + t * 0.08, 2, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -st.pointer.y * 0.08 + 0.12, 2, dt);

    parts.forEach((part, i) => {
      const m = meshRefs.current[i];
      if (!m) return;
      const a = THREE.MathUtils.clamp((p - part.delay) / (1 - part.delay), 0, 1);
      const k = a * a * (3 - 2 * a);
      m.position.set(part.pos[0] + part.offset[0] * (1 - k), part.pos[1] + part.offset[1] * (1 - k), part.pos[2] + part.offset[2] * (1 - k));
      if (variant === "parts") {
        // loose column drifting apart (the opportunity clip)
        m.position.y += Math.sin(t * 0.5 + i) * 0.08 + (1 - p) * (i % 2 ? 0.6 : -0.6);
        m.rotation.z = 0.35 + Math.sin(t * 0.3 + i) * 0.04;
      }
      mats[i].opacity = 1 - wire;
      lineMats[i].opacity = wire * 0.9;
      m.visible = wire < 0.98;
      const l = lineRefs.current[i];
      if (l) {
        l.visible = wire > 0.02;
        l.position.copy(m.position);
        l.rotation.copy(m.rotation);
      }
    });
    glassMat.opacity = 0.16 * (1 - wire);
    if (dotsRef.current) (dotsRef.current.material as THREE.LineDashedMaterial).opacity = 0.5 * Math.max(wire, 0.6);

    const row = rowRef?.current ?? 0;
    iconGroups.current.forEach((ig, i) => {
      if (!ig) return;
      const target = i === Math.round(row) ? 1.35 : 0;
      const s = THREE.MathUtils.damp(ig.scale.x, target, 5, dt);
      ig.scale.setScalar(Math.max(0.0001, s));
      ig.visible = s > 0.01 && wire < 0.98;
      ig.rotation.y = t * 0.6 + i;
      ig.position.y = 0.35 + Math.sin(t * 0.9 + i) * 0.08;
    });
  });

  return (
    <group ref={root}>
      {parts.map((part, i) => (
        <group key={part.name}>
          <mesh ref={(el) => (meshRefs.current[i] = el)} geometry={part.geo} material={mats[i]} rotation={part.rot ?? [0, 0, 0]} />
          <lineSegments ref={(el) => (lineRefs.current[i] = el)} geometry={edges[i]} material={lineMats[i]} rotation={part.rot ?? [0, 0, 0]} visible={false} />
        </group>
      ))}
      {variant !== "parts" && (
        <>
          <mesh material={glassMat} position={[0, 0.42, 0]}>
            <cylinderGeometry args={[1.0, 1.0, 2.55, 64, 1, true]} />
          </mesh>
          <lineSegments ref={dotsRef} geometry={dots}>
            <lineDashedMaterial color="#d9fbe6" dashSize={0.05} gapSize={0.05} transparent opacity={0.4} />
          </lineSegments>
          {[0, 1, 2, 3].map((r) => (
            <group key={r} ref={(el) => (iconGroups.current[r] = el)} scale={0.0001} position={[0, 0.35, 0]}>
              <IconSet row={r} />
            </group>
          ))}
          {/* crest: a small chrome LS mark set into the cone */}
          <Crest progressRef={progressRef} wireRef={wireRef} />
        </>
      )}
    </group>
  );
}

function Crest({ progressRef, wireRef }: Pick<Props, "progressRef" | "wireRef">) {
  const geos = useMemo(() => logoPieceGeometries(), []);
  const mat = useMemo(() => chromeMat(), []);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const p = progressRef?.current ?? 1;
    const a = THREE.MathUtils.clamp((p - 0.0) / 0.9, 0, 1);
    const k = a * a * (3 - 2 * a);
    g.current!.position.y = 2.66 + 3.6 * (1 - k);
    mat.opacity = 1 - (wireRef?.current ?? 0);
    g.current!.visible = mat.opacity > 0.02;
  });
  return (
    <group ref={g} position={[0, 2.66, 0]} scale={LOGO_SCALE * 0.2}>
      <group position={[0, 276 * 0.5, 0]} rotation={[0, 0.4, 0]}>
        {geos.map((geo, i) => (
          <mesh key={i} geometry={geo} material={mat} />
        ))}
      </group>
    </group>
  );
}

function DashedMaterialFix() {
  // LineDashedMaterial needs computeLineDistances on the geometry
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    scene.traverse((o) => {
      if ((o as THREE.LineSegments).isLineSegments) (o as THREE.LineSegments).computeLineDistances();
    });
  }, [scene]);
  return null;
}

export default function MachineScene({ progressRef, rowRef, wireRef, variant = "stack", className, dark = false }: Props) {
  const [wrap, visible] = useCanvasVisible();
  return (
    <div ref={wrap} className={className}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={visible ? "always" : "never"}
        camera={{ fov: 28, position: [0, variant === "parts" ? 0 : 0.6, variant === "parts" ? 19 : 15.5], near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: dark ? 0.9 : 1.05 }}
        style={{ background: "transparent" }}
        onCreated={({ camera }) => camera.lookAt(0, variant === "parts" ? 0 : -0.2, 0)}
      >
        <Suspense fallback={<Env intensity={dark ? 0.9 : 1.2} green={0.4} />}>
          <Environment files="/hdr/studio.hdr" environmentIntensity={dark ? 0.8 : 1.15} />
        </Suspense>
        {variant === "parts" ? <Parts progressRef={progressRef} /> : <Machine progressRef={progressRef} rowRef={rowRef} wireRef={wireRef} variant={variant} />}
        <DashedMaterialFix />
        <directionalLight position={[3, 6, 5]} intensity={1.2} />
        <directionalLight position={[-4, 2, -3]} intensity={0.8} color="#bfffe0" />
      </Canvas>
    </div>
  );
}
