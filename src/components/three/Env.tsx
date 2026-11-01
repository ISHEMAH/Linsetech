"use client";
import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Studio environment for the chrome / glass materials, generated on the GPU (no HDR download).
 * A neutral room with two green panels, so reflections carry the brand colour.
 */
export default function Env({ intensity = 1.6, green = 1 }: { intensity?: number; green?: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const panel = (color: number, pos: [number, number, number], rot: [number, number, number], size: [number, number]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
      m.position.set(...pos);
      m.rotation.set(...rot);
      room.add(m);
    };
    if (green > 0) {
      panel(new THREE.Color("#22c55e").multiplyScalar(2.2 * green).getHex(), [-6, 2, -2], [0, Math.PI / 2, 0], [6, 4]);
      panel(new THREE.Color("#4ade80").multiplyScalar(1.2 * green).getHex(), [5, -1, 3], [0, -Math.PI / 2, 0], [5, 3]);
    }
    const tex = pmrem.fromScene(room, 0.04).texture;
    scene.environment = tex;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
      tex.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, intensity, green]);

  return null;
}
