"""
device.py — the chrome gadget that assembles around the mark in the hero's first seconds.

Modelled on the reference: a rounded tray shell, a perforated plate, a PCB with components, a keyhole
plate (real holes, boolean), a bezel frame with a lens ring, screws, a bracket tube. Everything lives in
the device rig's space: x right, y depth (+ away from the camera), z up; the stack is spread along y.
"""
import math, random
import bpy, bmesh
from mathutils import Vector
from common import *  # noqa

PLATE_W, PLATE_H = 2.0, 3.3


def bm_screw(r=0.075, head=0.05, shaft=0.28):
    bm = bm_cyl(r, head, 32, bevel=0.015)
    bmesh.ops.translate(bm, verts=bm.verts[:], vec=(0, 0, head / 2))
    s = bm_cyl(r * 0.52, shaft, 20)
    bm_merge(bm, s, loc=(0, 0, -shaft / 2))
    return bm


def bm_pin_header(cols=8, rows=2, pitch=0.07):
    bm = bmesh.new()
    for i in range(cols):
        for j in range(rows):
            r = bmesh.ops.create_cube(bm, size=1.0)
            bmesh.ops.scale(bm, vec=(0.028, 0.14, 0.028), verts=r["verts"])
            bmesh.ops.translate(bm, vec=((i - (cols - 1) / 2) * pitch, -0.07, (j - (rows - 1) / 2) * pitch), verts=r["verts"])
    return bm


def bm_keyhole_cutters(positions, r=0.17, slot_w=0.075, slot_l=0.3):
    """One cutter bmesh per hole/slot (applied separately, see apply_boolean)."""
    out = []
    for x, z in positions:
        c = bmesh.new()
        bm_merge(c, bm_cyl(r, 1.0, 32), loc=(x, 0, z), rot=(math.pi / 2, 0, 0))
        out.append(c)
        s = bmesh.new()
        bm_merge(s, bm_box(slot_w, 1.0, slot_l), loc=(x, 0, z - r - slot_l / 2 + 0.03))
        out.append(s)
    return out


def build_device(scene, rig, mats, spread=1.3):
    """Returns parts: list of (obj, home Vector, rot tuple, delay seconds)."""
    chrome, dark, pcb, chip, perf, lens = mats["chrome"], mats["dark"], mats["pcb"], mats["chip"], mats["perf"], mats["lens"]
    parts = []

    def add(name, bm, home, rot=(0, 0, 0), mat=chrome, delay=0.0, smooth=True, sharp=35):
        o = mesh_object(scene, name, bm, mat, smooth=smooth, sharp_angle=sharp, parent=rig)
        parts.append((o, Vector(home), rot, delay))
        return o

    Y = lambda y: y * spread  # noqa: E731

    # back shell: rounded tray open toward the camera, with corner bosses and a rib inside
    tray = bm_tray(PLATE_W, PLATE_H, 0.45, 0.6, 0.12, 0.1, bevel=0.05)
    for x, z in ((-0.7, 1.3), (0.7, 1.3), (-0.7, -1.3), (0.7, -1.3)):
        bm_merge(tray, bm_cyl(0.09, 0.34, 20), loc=(x, 0.03, z), rot=(math.pi / 2, 0, 0))
    bm_merge(tray, bm_box(1.5, 0.3, 0.06), loc=(0, 0.05, 0.1))
    bm_merge(tray, bm_box(0.06, 0.3, 2.6), loc=(0.45, 0.05, 0))
    add("Tray", tray, (0.0, Y(1.55), 0.0), (0, 0, 0), chrome, 0.05, sharp=50)

    # perforated mid plate (alpha holes)
    add("PerfPlate", bm_plate(1.8, 3.0, 0.36, 0.05, bevel=0.01), (0.0, Y(0.95), 0.0), (0, 0, 0), perf, 0.35)

    # PCB with components on the camera side
    add("PCB", bm_plate(1.7, 2.9, 0.2, 0.05, bevel=0.0), (0.05, Y(0.55), 0.0), (0, 0, 0), pcb, 0.2)
    rnd = random.Random(11)
    comps = bmesh.new()
    for x, z, w, h in ((-0.45, 0.7, 0.42, 0.42), (0.35, 0.75, 0.3, 0.3), (-0.3, -0.55, 0.5, 0.36), (0.45, -0.3, 0.24, 0.24), (0.1, 0.1, 0.36, 0.36), (-0.55, -1.1, 0.2, 0.3), (0.5, 1.2, 0.28, 0.14)):
        bm_merge(comps, bm_box(w, 0.07, h, bevel=0.008), loc=(x, -0.06, z))
    for i in range(12):
        bm_merge(comps, bm_box(0.06, 0.04, 0.03), loc=(-0.7 + rnd.random() * 1.4, -0.045, -1.3 + rnd.random() * 2.6))
    add("Chips", comps, (0.05, Y(0.55), 0.0), (0, 0, 0), chip, 0.25)
    caps = bmesh.new()
    for i in range(5):
        bm_merge(caps, bm_cyl(0.055, 0.16, 20, bevel=0.01), loc=(-0.5 + i * 0.22, -0.1, -0.95), rot=(math.pi / 2, 0, 0))
    bm_merge(caps, bm_cyl(0.09, 0.2, 24, bevel=0.012), loc=(0.6, -0.12, 0.35), rot=(math.pi / 2, 0, 0))
    bm_merge(caps, bm_cyl(0.09, 0.2, 24, bevel=0.012), loc=(0.6, -0.12, 0.6), rot=(math.pi / 2, 0, 0))
    add("Caps", caps, (0.05, Y(0.55), 0.0), (0, 0, 0), chrome, 0.3)
    add("Header", bm_pin_header(), (-0.35, Y(0.55), 1.15), (0, 0, 0), chrome, 0.32, smooth=False)
    add("Connector", bm_box(0.5, 0.16, 0.18, bevel=0.01), (0.35, Y(0.55) - 0.1, -1.3), (0, 0, 0), dark, 0.3)

    # keyhole plate (front cover) with real holes
    kp = add("KeyPlate", bm_plate(1.9, 3.2, 0.4, 0.08, bevel=0.02), (-0.15, Y(-0.5), 0.0), (0, 0, 0), chrome, 0.1, sharp=40)
    holes = [(-0.32 + (i % 2) * 0.64, 1.15 - i * 0.42) for i in range(6)]
    apply_boolean(scene, kp, bm_keyhole_cutters(holes))
    # screw holes on the plate corners
    sh = []
    for x, z in ((-0.75, 1.35), (0.75, 1.35), (-0.75, -1.35), (0.75, -1.35)):
        c = bmesh.new()
        bm_merge(c, bm_cyl(0.05, 1.0, 16), loc=(x, 0, z), rot=(math.pi / 2, 0, 0))
        sh.append(c)
    apply_boolean(scene, kp, sh)

    # bezel frame + lens ring
    add("Bezel", bm_ring_plate(PLATE_W, PLATE_H, 0.45, 0.22, 0.3, bevel=0.05), (0.05, Y(-1.05), 0.0), (0, 0, 0), chrome, 0.15, sharp=50)
    ring = bm_torus(0.44, 0.06, 96, 16)
    bm_merge(ring, bm_cyl(0.39, 0.22, 64, cap=False), loc=(0, 0, 0.0))
    add("LensRing", ring, (0.05, Y(-1.3), 0.85), (math.pi / 2, 0, 0), chrome, 0.4, sharp=60)
    add("Lens", bm_cyl(0.36, 0.04, 64), (0.05, Y(-1.3) + 0.08, 0.85), (math.pi / 2, 0, 0), lens, 0.45)
    add("LensRing2", bm_torus(0.31, 0.03, 64, 12), (0.05, Y(-1.3) - 0.08, 0.85), (math.pi / 2, 0, 0), dark, 0.5)

    # screws floating between the layers (as in an exploded diagram)
    for i, (x, y, z) in enumerate(((-0.75, -0.8, 1.35), (0.75, -0.8, 1.35), (-0.75, -0.8, -1.35), (0.75, -0.8, -1.35),
                                   (-0.72, 0.25, 1.3), (0.72, 0.25, -1.3), (-0.72, 0.25, -1.3), (0.72, 0.25, 1.3))):
        add(f"Screw{i}", bm_screw(), (x, Y(y), z), (-math.pi / 2, 0, 0), chrome, 0.5 + i * 0.04)

    # bracket tube and a cable
    br = curve_tube(scene, "Bracket", [(-0.75, Y(-0.35), -1.85), (-0.45, Y(-0.3), -2.15), (0.45, Y(-0.3), -2.15), (0.75, Y(-0.35), -1.85)], 0.05, chrome, parent=rig)
    parts.append((br, Vector((0, 0, 0)), (0, 0, 0), 0.55))
    cb = curve_tube(scene, "Cable", [(0.9, Y(0.3), 1.0), (1.3, Y(0.1), 1.55), (0.9, Y(-0.2), 1.95), (0.3, Y(-0.3), 1.9)], 0.03, dark, parent=rig)
    parts.append((cb, Vector((0, 0, 0)), (0, 0, 0), 0.7))
    return parts
