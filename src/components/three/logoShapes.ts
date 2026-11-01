import * as THREE from "three";
import { LOGO_PIECES, LOGO_PATHS } from "@/components/ui/Logo";

/** Path units → scene units. The mark is 640 wide; we want it ≈ 2.7 units wide. */
export const LOGO_SCALE = 1 / 240;
const CX = 320;
const CY = 276;

function shapeFromPath(d: string) {
  const nums = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  const s = new THREE.Shape();
  for (let i = 0; i < nums.length; i += 2) {
    const x = nums[i] - CX;
    const y = -(nums[i + 1] - CY);
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

export const EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 88,
  bevelEnabled: true,
  bevelThickness: 9,
  bevelSize: 7,
  bevelSegments: 5,
  curveSegments: 4,
};

/** Outward offsets for the "assemble" animation, in path units (x, y, z) + a spin axis. */
export const PIECE_OFFSETS: [number, number, number][] = [
  [-140, 190, 90],
  [-210, -150, -70],
  [110, 240, -90],
  [240, 20, 110],
  [190, -210, -40],
];

let cache: THREE.ExtrudeGeometry[] | null = null;
export function logoPieceGeometries() {
  if (!cache) {
    cache = LOGO_PIECES.map((d) => {
      const g = new THREE.ExtrudeGeometry(shapeFromPath(d), EXTRUDE);
      g.translate(0, 0, -EXTRUDE.depth! / 2);
      return g;
    });
  }
  return cache;
}

let outlineCache: THREE.ExtrudeGeometry[] | null = null;
/** The L and the S as two whole solids (no overlapping strokes), for the frosted-glass state. */
export function logoOutlineGeometries() {
  if (!outlineCache) {
    outlineCache = LOGO_PATHS.map((d) => {
      const g = new THREE.ExtrudeGeometry(shapeFromPath(d), EXTRUDE);
      g.translate(0, 0, -EXTRUDE.depth! / 2);
      return g;
    });
  }
  return outlineCache;
}
