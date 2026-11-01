"use client";
import { useCallback, useState } from "react";
import type { RootState } from "@react-three/fiber";

/**
 * Rebuilds a canvas from scratch when the browser gives back a WebGL context it took away (Safari drops contexts under
 * GPU memory pressure). three.js restores its own state, but not everything a scene built, and the Process tiles came
 * back black for the rest of the visit. Returns a key for the <Canvas> and a handler to call from its onCreated.
 */
export function useContextRecovery(): [number, (state: RootState) => void] {
  const [generation, setGeneration] = useState(0);
  const watch = useCallback((state: RootState) => {
    state.gl.domElement.addEventListener("webglcontextrestored", () => setGeneration((g) => g + 1), { once: true });
  }, []);
  return [generation, watch];
}
