"use client";
/**
 * Puture's Process chapter (03 PROCESS) in the shared space: the title over the tiles settled on a dark grid,
 * then one formation per step (drifting over a curled valley, a board on a standing wall, a stream rushing past
 * the camera, a conveyor row running along a tilted grid), and the closing statement with the tiles rising.
 */
import { useMemo, useState, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import type { ProcessPacing } from "@/components/sections/WorkPacing";
import { cn } from "@/lib/cn";
import { useCanvasVisible } from "./useCanvasVisible";
import { useContextRecovery } from "./useContextRecovery";
import CanvasBoundary from "./CanvasBoundary";
import { CANVAS_CAMERA, CANVAS_DPR, DARK, Space, SpaceBackdrop, SpaceTimeline, frame, handoffFrame, type PresetName, type SpaceParams, type TileChipState } from "./WorkSpace";

/** One look per step (discover · design · build · run); the first two are light presets turned dark. */
const LOOKS: { name: PresetName; over: Partial<SpaceParams> }[] = [
  { name: "valley", over: DARK },
  { name: "board", over: DARK },
  { name: "ship", over: {} },
  { name: "conveyor", over: {} },
];

function buildTimeline(pacing: ProcessPacing, mobile: boolean) {
  const m = mobile ? {} : false;
  return new SpaceTimeline([
    // opens on the exact frame the Work floor ended on
    { at: 0, frame: handoffFrame(mobile) },
    ...pacing.steps.map((s, i) => {
      const look = LOOKS[i % LOOKS.length];
      return { at: s.at, frame: frame(look.name, look.over, m) };
    }),
    { at: pacing.statement.at, frame: frame("launch", {}, m) },
    // the sky goes to night under the statement so the dark section after it clips over a dark frame
    { at: pacing.end, frame: frame("launch", { sky: -1.15, dust: 0.3 }, m) },
  ]);
}

type Props = { pacing: ProcessPacing; screensRef: RefObject<number>; className?: string; chip?: TileChipState };

export default function ProcessScene({ pacing, screensRef, className, chip }: Props) {
  const [wrap, visible] = useCanvasVisible();
  const [generation, watchContext] = useContextRecovery();
  const [ready, setReady] = useState(false);
  const timeline = useMemo(() => buildTimeline(pacing, false), [pacing]);
  const mobileTimeline = useMemo(() => buildTimeline(pacing, true), [pacing]);
  return (
    // Puture's `.space-stage`: the canvas fades in over 1.4s once it exists
    <div ref={wrap} className={cn(className, "transition-opacity duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none", ready ? "opacity-100" : "opacity-0")}>
      <CanvasBoundary>
        <Canvas
          key={generation}
          dpr={CANVAS_DPR}
          flat
          frameloop={visible ? "always" : "never"}
          camera={CANVAS_CAMERA}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          style={{ background: "#020a07" }}
          onCreated={(state) => {
            watchContext(state);
            // the error check reads each program's compile log at once, forcing a blocking compile (60–100 ms frames)
            state.gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
            requestAnimationFrame(() => setReady(true));
          }}
        >
          <Space timeline={timeline} mobileTimeline={mobileTimeline} screensRef={screensRef}>
            <SpaceBackdrop env={1.2} chip={chip} />
          </Space>
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}
