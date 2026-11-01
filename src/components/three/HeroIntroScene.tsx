"use client";
import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, MeshTransmissionMaterial, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { gsap } from "@/lib/gsap";
import { logoPieceGeometries, logoOutlineGeometries, LOGO_SCALE, PIECE_OFFSETS } from "./logoShapes";
import { makeRibbonMaterial } from "./RibbonMaterial";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useCanvasVisible } from "./useCanvasVisible";
import Env from "./Env";

/**
 * Sharplink's hero clip, in real time:
 *  0–3 s   chrome parts fly in and assemble around the chrome LS mark
 *  3–5 s   the device dissolves, the mark turns to frosted glass
 *  4–7 s   the ribbon field rises behind it; then it idles (slow spin, pointer parallax)
 * scrollRef (0..1) is the hero → card transition: the mark drifts up and fades.
 */
type Props = { scrollRef: RefObject<number>; /** card centre in NDC (-1..1) and its height as a fraction of the viewport */ cardRef?: RefObject<{ x: number; y: number; h: number }>; className?: string; onReady?: () => void };

const chrome = new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 1, roughness: 0.12, envMapIntensity: 1.6 });
const chromeDark = new THREE.MeshStandardMaterial({ color: "#cfd8d3", metalness: 1, roughness: 0.25, envMapIntensity: 1.2, side: THREE.DoubleSide });

type Part = { geo: THREE.BufferGeometry; home: THREE.Vector3; rot: THREE.Euler; from: THREE.Vector3; fromRot: THREE.Euler; mat: THREE.Material; delay: number };

function cable(a: [number, number, number], b: [number, number, number], c: [number, number, number]) {
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(...a), new THREE.Vector3(...b), new THREE.Vector3(...c)]);
  return new THREE.TubeGeometry(curve, 48, 0.045, 10, false);
}

const pcbMat = new THREE.MeshStandardMaterial({ color: "#0b3d2e", metalness: 0.35, roughness: 0.55, envMapIntensity: 0.8 });
const chipMat = new THREE.MeshStandardMaterial({ color: "#1a1f1c", metalness: 0.6, roughness: 0.35, envMapIntensity: 1.0 });

/** Rectangular ring (hollow frame) built from one shape with a hole, extruded. */
function frameGeometry(w: number, h: number, t: number, depth: number) {
  const outer = new THREE.Shape();
  outer.moveTo(-w / 2, -h / 2); outer.lineTo(w / 2, -h / 2); outer.lineTo(w / 2, h / 2); outer.lineTo(-w / 2, h / 2); outer.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-w / 2 + t, -h / 2 + t); hole.lineTo(w / 2 - t, -h / 2 + t); hole.lineTo(w / 2 - t, h / 2 - t); hole.lineTo(-w / 2 + t, h / 2 - t); hole.closePath();
  outer.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/**
 * The device that assembles around the mark: hardware, since that is what Linse sells.
 * A circuit board with chips and capacitors behind, a heatsink, a fan, a memory module,
 * a chrome frame, rings, bolts, a bracket and cables — all flying in from outside the frame.
 */
function buildParts(): Part[] {
  const parts: Part[] = [];
  const add = (geo: THREE.BufferGeometry, home: [number, number, number], rot: [number, number, number], mat = chrome, delay = 0) => {
    const dir = new THREE.Vector3(home[0] || 0.3, home[1] || 0.2, home[2] || 0.5).normalize();
    parts.push({
      geo,
      home: new THREE.Vector3(...home),
      rot: new THREE.Euler(...rot),
      from: new THREE.Vector3(...home).add(dir.multiplyScalar(5 + Math.random() * 3)).add(new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, 2)),
      fromRot: new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3),
      mat,
      delay,
    });
  };
  // circuit board behind the mark, with chips and capacitors
  add(new RoundedBoxGeometry(3.4, 2.5, 0.08, 3, 0.04), [-0.1, 0.05, -1.0], [0, 0.12, 0.03], pcbMat, 0.1);
  for (const [x, y] of [[-1.2, 0.8], [1.0, 0.85], [-1.25, -0.75], [0.95, -0.7]] as [number, number][]) add(new THREE.BoxGeometry(0.42, 0.42, 0.07), [x, y, -0.93], [0, 0.12, 0.03], chipMat, 0.3 + Math.random() * 0.2);
  for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16), [-0.4 + i * 0.16, 1.0, -0.88], [Math.PI / 2, 0, 0], chrome, 0.45 + i * 0.03);
  // chrome frame around the board
  add(frameGeometry(3.7, 2.8, 0.14, 0.2), [-0.1, 0.05, -0.75], [0, 0.12, 0.03], chromeDark, 0.15);
  // heatsink: stacked fins
  for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(0.95, 0.5, 0.035), [1.75, 1.25, 0.2 + i * 0.07], [0, 0.3, 0], chrome, 0.5 + i * 0.02);
  // fan: ring + blades
  add(new THREE.TorusGeometry(0.58, 0.06, 16, 64), [-1.8, -1.0, 0.55], [0, 0.3, 0], chrome, 0.4);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    add(new THREE.BoxGeometry(0.42, 0.14, 0.03), [-1.8 + Math.cos(a) * 0.3, -1.0 + Math.sin(a) * 0.3, 0.55], [0, 0.3, a + 0.5], chromeDark, 0.55 + i * 0.03);
  }
  // memory module
  add(new THREE.BoxGeometry(1.5, 0.32, 0.05), [1.5, -1.3, 0.3], [0, 0, 0.25], pcbMat, 0.5);
  for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.24, 0.16, 0.05), [1.0 + i * 0.33, -1.3 + (i - 1.5) * 0.085, 0.33], [0, 0, 0.25], chipMat, 0.6 + i * 0.02);
  // rings around the mark
  add(new THREE.TorusGeometry(1.75, 0.07, 24, 96), [0, 0, 0], [Math.PI / 2, 0, 0], chrome, 0.1);
  add(new THREE.TorusGeometry(2.05, 0.04, 16, 96), [0, 0, -0.3], [Math.PI / 2 + 0.3, 0.2, 0], chromeDark, 0.35);
  // bolts, bracket, cables
  add(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 24), [-1.5, 1.1, 0.2], [0, 0, 0.3], chrome, 0.6);
  add(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 24), [1.5, -0.4, 0.4], [0, 0, 0.3], chrome, 0.7);
  add(new RoundedBoxGeometry(0.18, 1.9, 0.18, 2, 0.04), [2.1, 0.2, -0.2], [0, 0, 0.35], chromeDark, 0.55);
  add(cable([-1.9, 1.2, 0.3], [-0.6, 1.6, -0.5], [0.4, 1.3, 0.2]), [0, 0, 0], [0, 0, 0], chrome, 0.75);
  add(cable([1.3, -1.5, 0.5], [0.4, -1.9, 0.1], [-0.9, -1.4, 0.6]), [0, 0, 0], [0, 0, 0], chromeDark, 0.85);
  return parts;
}

const PARTICLES = 260;
const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s3 = new THREE.Vector3();

/** Tiny chrome fragments that scatter in with the parts and get absorbed as the device assembles. */
function Particles({ stateRef }: { stateRef: RefObject<{ assemble: number; device: number }> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: PARTICLES }, () => ({
        from: new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6 + 1),
        to: new THREE.Vector3((Math.random() - 0.5) * 3.2, (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.5),
        delay: Math.random() * 0.5,
        size: 0.02 + Math.random() * 0.05,
        spin: Math.random() * 6,
      })),
    [],
  );
  useFrame((st) => {
    const im = mesh.current;
    if (!im) return;
    const s = stateRef.current!;
    const t = st.clock.elapsedTime;
    for (let i = 0; i < PARTICLES; i++) {
      const p = seeds[i];
      const a = THREE.MathUtils.clamp((s.assemble - p.delay) / (1 - p.delay), 0, 1);
      const k = a * a * (3 - 2 * a);
      _v3.lerpVectors(p.from, p.to, k);
      _q.setFromEuler(new THREE.Euler(t * 0.5 + p.spin, t * 0.3, p.spin));
      const sc = p.size * (1 - k * 0.7) * s.device;
      _s3.setScalar(Math.max(0.0001, sc));
      _m4.compose(_v3, _q, _s3);
      im.setMatrixAt(i, _m4);
    }
    im.instanceMatrix.needsUpdate = true;
    im.visible = s.device > 0.02;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, PARTICLES]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.2} envMapIntensity={1.4} />
    </instancedMesh>
  );
}

/** Thin dotted guide lines from the parts to the core while they assemble (the blueprint lines in the clip). */
function GuideLines({ parts, stateRef }: { parts: Part[]; stateRef: RefObject<{ assemble: number; device: number }> }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    parts.forEach((p) => pts.push(p.home.x, p.home.y, p.home.z, p.home.x * 0.2, p.home.y * 0.2, 0.6));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [parts]);
  const ref = useRef<THREE.LineSegments>(null);
  useFrame(() => {
    const l = ref.current;
    if (!l) return;
    l.computeLineDistances();
    const s = stateRef.current!;
    const o = Math.sin(Math.min(1, s.assemble) * Math.PI) * s.device * 0.55;
    (l.material as THREE.LineDashedMaterial).opacity = o;
    l.visible = o > 0.01;
  });
  return (
    <lineSegments ref={ref} geometry={geo}>
      <lineDashedMaterial color="#d9f7e4" dashSize={0.06} gapSize={0.05} transparent opacity={0} />
    </lineSegments>
  );
}

function Rig({ scrollRef, cardRef, onReady, lite }: { scrollRef: RefObject<number>; cardRef?: Props["cardRef"]; onReady?: () => void; lite: boolean }) {
  const viewport = useThree((s) => s.viewport);
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);
  const chromeMark = useRef<THREE.Group>(null);
  const glassMark = useRef<THREE.Group>(null);
  const partRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ribbon = useRef<THREE.Mesh>(null);
  const geos = useMemo(() => logoPieceGeometries(), []);
  const solids = useMemo(() => logoOutlineGeometries(), []);
  const edgeGeos = useMemo(() => solids.map((g) => new THREE.EdgesGeometry(g, 30)), [solids]);
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.32 }), []);
  const parts = useMemo(() => buildParts(), []);
  const ribbonMat = useMemo(() => makeRibbonMaterial(viewport.aspect), []); // eslint-disable-line react-hooks/exhaustive-deps
  const state = useRef({ assemble: 0, device: 1, glass: 0, chromeOn: 1, rise: 0, explode: 1 });
  const cardWorld = useMemo(() => new THREE.Vector3(), []);

  // the fullscreen plane sits far behind everything
  const bg = useMemo(() => {
    const dist = 14;
    const v = viewport.getCurrentViewport(camera, [0, 0, -dist]);
    return { w: v.width * 1.02, h: v.height * 1.02, z: -dist };
  }, [viewport, camera]);

  useEffect(() => {
    const s = state.current;
    const tl = gsap.timeline({ delay: 0.2, onStart: onReady });
    tl.to(s, { assemble: 1, duration: 2.6, ease: "power3.inOut" }, 0)
      .to(s, { explode: 0, duration: 2.0, ease: "power3.inOut" }, 0.3)
      .to(s, { device: 0, duration: 1.2, ease: "power2.inOut" }, 3.7)
      .to(s, { chromeOn: 0, duration: 0.6, ease: "power2.in" }, 4.1)
      .to(s, { glass: 1, duration: 1.0, ease: "power2.out" }, 4.2)
      .to(s, { rise: 1, duration: 2.6, ease: "power2.inOut" }, 3.9);
    return () => {
      tl.kill();
    };
  }, [onReady]);

  const portrait = viewport.aspect < 0.9;
  const markPos = useMemo<[number, number, number]>(() => (portrait ? [0, 1.2, 0] : [viewport.width * 0.07, 0.05, 0]), [portrait, viewport.width]);
  const markScale = portrait ? Math.min(0.62, viewport.width * 0.24) : Math.min(1.25, viewport.width / 5.4);

  useFrame((st, dt) => {
    const s = state.current;
    const t = st.clock.elapsedTime;
    const p = scrollRef.current ?? 0;
    ribbonMat.uniforms.uTime.value = t;
    ribbonMat.uniforms.uRise.value = s.rise;
    ribbonMat.uniforms.uAspect.value = viewport.aspect;

    const g = group.current!;
    // pointer parallax + idle spin; on scroll the mark glides into the productivity card and shrinks with it
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, st.pointer.x * 0.25 + t * 0.12, 2.5, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -st.pointer.y * 0.15 + Math.sin(t * 0.6) * 0.05, 2.5, dt);
    const card = cardRef?.current;
    const k = p * p * (3 - 2 * p);
    if (card) cardWorld.set((card.x * viewport.width) / 2, (card.y * viewport.height) / 2, 0);
    else cardWorld.set(markPos[0], markPos[1] + 1.5, 0);
    // settle at ~40 % of the card, then fade away before the chart takes the card (Sharplink keeps the object only during the clip)
    const targetScale = card ? markScale * Math.min(0.38, (card.h * viewport.height) / 5.5) : markScale * 0.3;
    const fade = 1 - THREE.MathUtils.smoothstep(p, 0.62, 0.9);
    g.scale.setScalar(Math.max(0.0001, THREE.MathUtils.lerp(markScale, targetScale, k) * fade));
    g.position.set(
      THREE.MathUtils.lerp(markPos[0], cardWorld.x, k),
      THREE.MathUtils.lerp(markPos[1], cardWorld.y, k) + Math.sin(t * 0.8) * 0.06 * (1 - k),
      markPos[2],
    );

    // mark strokes: explode → assembled
    const e = s.explode * s.explode * (3 - 2 * s.explode);
    chromeMark.current?.children.forEach((m, i) => {
      const [ox, oy, oz] = PIECE_OFFSETS[i];
      m.position.set(ox * e * 0.6, oy * e * 0.6, oz * e * 0.6);
      m.rotation.set(e * (i % 2 ? 0.6 : -0.4), e * (i % 3 ? -0.5 : 0.7), e * 0.2 * (i - 2));
    });
    if (chromeMark.current) chromeMark.current.visible = s.chromeOn > 0.02;
    chromeMark.current?.scale.setScalar(LOGO_SCALE * s.chromeOn);
    if (glassMark.current) {
      glassMark.current.visible = s.glass > 0.02;
      glassMark.current.scale.setScalar(LOGO_SCALE * (0.6 + 0.4 * s.glass));
    }
    // device parts
    parts.forEach((part, i) => {
      const m = partRefs.current[i];
      if (!m) return;
      const a = THREE.MathUtils.clamp((s.assemble - part.delay * 0.5) / (1 - part.delay * 0.5), 0, 1);
      const k = a * a * (3 - 2 * a);
      m.position.lerpVectors(part.from, part.home, k);
      m.rotation.set(
        THREE.MathUtils.lerp(part.fromRot.x, part.rot.x, k),
        THREE.MathUtils.lerp(part.fromRot.y, part.rot.y, k),
        THREE.MathUtils.lerp(part.fromRot.z, part.rot.z, k),
      );
      const d = s.device;
      m.scale.setScalar(Math.max(0.0001, d));
      m.visible = d > 0.01 && a > 0.01;
    });
  });

  return (
    <>
      <mesh ref={ribbon} position={[0, 0, bg.z]} material={ribbonMat} renderOrder={-10}>
        <planeGeometry args={[bg.w, bg.h]} />
      </mesh>
      <group ref={group}>
        <group ref={chromeMark} scale={LOGO_SCALE}>
          {geos.map((geo, i) => (
            <mesh key={i} geometry={geo} material={chrome} />
          ))}
        </group>
        <group ref={glassMark} scale={LOGO_SCALE} visible={false}>
          {edgeGeos.map((eg, i) => (
            <lineSegments key={`e${i}`} geometry={eg} material={edgeMat} />
          ))}
          {solids.map((geo, i) => (
            <mesh key={i} geometry={geo}>
              <MeshTransmissionMaterial
                backside
                backsideThickness={0.6}
                samples={lite ? 4 : 10}
                resolution={lite ? 512 : 1024}
                backsideResolution={lite ? 256 : 512}
                thickness={2.2}
                roughness={0.42}
                anisotropicBlur={0.55}
                chromaticAberration={0.015}
                distortion={0.04}
                distortionScale={0.4}
                temporalDistortion={0.02}
                color="#ffffff"
                attenuationColor="#dcfbe8"
                attenuationDistance={1.4}
                envMapIntensity={1.6}
                emissive="#9ff5c0"
                emissiveIntensity={0.04}
                clearcoat={0.6}
                clearcoatRoughness={0.15}
              />
            </mesh>
          ))}
        </group>
        {parts.map((part, i) => (
          <mesh key={i} ref={(el) => (partRefs.current[i] = el)} geometry={part.geo} material={part.mat} visible={false} />
        ))}
        <Particles stateRef={state} />
        <GuideLines parts={parts} stateRef={state} />
      </group>
    </>
  );
}

export default function HeroIntroScene({ scrollRef, cardRef, className, onReady }: Props) {
  const [wrap, visible] = useCanvasVisible();
  const small = typeof window !== "undefined" && window.innerWidth < 900;
  // drops to a lighter pipeline (smaller transmission buffer, no bloom, dpr 1) if the frame rate falls
  const [degraded, setDegraded] = useState(false);
  const lite = small || degraded;
  return (
    <div ref={wrap} className={className}>
      <Canvas
        dpr={lite ? 1 : [1, 1.5]}
        frameloop={visible ? "always" : "never"}
        camera={{ fov: 30, position: [0, 0, 8], near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <color attach="background" args={["#04150f"]} />
        <Suspense fallback={<Env intensity={1.3} green={0.6} />}>
          <Environment files="/hdr/studio.hdr" environmentIntensity={1.1} />
        </Suspense>
        <Rig scrollRef={scrollRef} cardRef={cardRef} onReady={onReady} lite={lite} />
        <PerformanceMonitor onDecline={() => setDegraded(true)} flipflops={2} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} />
        <directionalLight position={[-5, -2, 4]} intensity={1.4} color="#9ff5c0" />
        <directionalLight position={[0, -4, 6]} intensity={1.0} color="#ffffff" />
        {!lite && (
          <EffectComposer multisampling={4}>
            <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.32} mipmapBlur radius={0.55} />
            <Vignette eskil={false} offset={0.2} darkness={0.45} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
