"""
sl_watch.py — Sharplink's "supercycle" watch (shrp_opportunitywatch_chrome.webm) recreated shot for shot, with the chrome
LS mark turning at the dial centre instead of the ETH gem. 800x800, 30 fps, 150 frames (5 s), transparent, seamless loop.

    Blender -b -P sl_watch.py -- --preview          # 12 frames at 25 % + contact sheet (out/sl_watch_preview_sheet.png)
    Blender -b -P sl_watch.py                       # full RGBA PNG sequence -> out/sl_watch/frames/
    TEST=a TEST_FRAME=1,40 Blender -b -P sl_watch.py -- --scale 50

What the original does: a chunky chrome wristwatch case, three-quarter view (dial facing camera-left, case side and the
6 o'clock lug horns on the right), filling ~95 % of the frame and completely static: thick half-round polished bezel,
toothed rehaut, light dial with raised baton markers, minute track, a square date window and a sub-dial arc; a big
gear-toothed crown + collar on top (3 o'clock, guarded), an angular pusher upper right, a knurled crown lower left.
At the dial centre the faceted ETH gem tumbles in place, catching light. Two thin blueprint
boxes at the top left with dotted call-out lines to small square markers on the dial. Loops every 5 s.
Ours: the same watch with the faceted chrome LS mark turning in place at the dial centre (a wide rocking turn with a
tumbling tilt, never past edge-on so the LS always reads the right way round).
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa

ARGS = parse_args()
E = os.environ.get
W = H = 800
FPS, N = 30, 150
NAME = "sl_watch"
OUT_DIR = os.path.join(OUT, NAME)
os.makedirs(OUT_DIR, exist_ok=True)

scene = reset_scene()
setup_render(scene, W, H, FPS, N, ARGS, samples=int(E("SAMPLES", "48")), transparent=True, motion_blur=False,
             view=E("VIEW", "AgX"), look=E("LOOK", "AgX - High Contrast"))
scene.view_settings.exposure = float(E("EXPOSURE", "0.3"))
setup_world(scene, strength=float(E("HDR_STR", "1.0")), gradient=None, rotation=math.radians(float(E("HDR_ROT", "205"))))
# neutral studio (same treatment as sl_sphere): grey HDRI, softbox peaks clamped, dark room lifted a little
_wn = scene.world.node_tree
_env = next(n for n in _wn.nodes if n.type == "TEX_ENVIRONMENT")
_bg = next(n for n in _wn.nodes if n.type == "BACKGROUND")
_bw = _wn.nodes.new("ShaderNodeRGBToBW")
_mn = _wn.nodes.new("ShaderNodeMath")
_mn.operation = "MINIMUM"
_mn.inputs[1].default_value = float(E("CLAMP", "4.0"))
_ad = _wn.nodes.new("ShaderNodeMath")
_ad.operation = "ADD"
_ad.inputs[1].default_value = float(E("LIFT", "0.04"))
_wn.links.new(_env.outputs["Color"], _bw.inputs["Color"])
_wn.links.new(_bw.outputs["Val"], _mn.inputs[0])
_wn.links.new(_mn.outputs[0], _ad.inputs[0])
_wn.links.new(_ad.outputs[0], _bg.inputs["Color"])

# ---------------------------------------------------------------- camera (static)
LENS, DIST = float(E("LENS", "85")), float(E("DIST", "5.2"))
cam = add_camera(scene, (0, -DIST, 0), (0, 0, 0), lens=LENS, shift_x=float(E("SHIFT_X", "0.0")), shift_y=float(E("SHIFT_Y", "0.0")))
cam.data.clip_start, cam.data.clip_end = 1.0, 100.0
add_light(scene, "Key", (-6.0, -7.0, 6.0), (0, 0, 0), float(E("KEY", "500")), 7.0)
add_light(scene, "Fill", (7.0, -6.0, 0.0), (0, 0, 0), float(E("FILL", "200")), 8.0).data.use_shadow = False
add_light(scene, "Top", (0.0, -2.0, 9.0), (0, 0, 0), float(E("TOP", "150")), 8.0)

# ---------------------------------------------------------------- materials (neutral chrome)
BASE = hex2lin("#e6e6e6")[:3]
polished = mat_chrome("wPolished", color=BASE, rough=float(E("ROUGH", "0.11")), coat=0.0)
satin = mat_chrome("wSatin", color=BASE, rough=float(E("SATIN", "0.30")), coat=0.0)
dialmat = mat_chrome("wDial", color=hex2lin(E("DIAL_COL", "#f2f2f2"))[:3], rough=float(E("DIAL_ROUGH", "0.5")), coat=0.0)
setin(dialmat.node_tree.nodes["Principled BSDF"], "Metallic", float(E("DIAL_MET", "0.25")))
darkmat = mat_chrome("wDark", color=hex2lin("#5a5a5a")[:3], rough=0.35, coat=0.0)
markmat = mat_chrome("wMark", color=hex2lin(E("MARK_COL", "#d0d0d0"))[:3], rough=float(E("MARK_ROUGH", "0.1")), coat=0.0)


# ---------------------------------------------------------------- geometry helpers (local frame: dial in XZ, facing -Y, case toward +Y)
def bm_lathe(profile, segs=128, closed=True, a0=0.0, a1=2 * math.pi):
    """Revolve a 2D profile [(r, y), ...] around the Y axis (ring in the XZ plane). closed: the profile is a loop."""
    bm = bmesh.new()
    full = abs(a1 - a0 - 2 * math.pi) < 1e-6
    n = segs if full else segs + 1
    rings = []
    for k in range(n):
        a = a0 + (a1 - a0) * k / segs
        ca, sa = math.cos(a), math.sin(a)
        rings.append([bm.verts.new((r * ca, y, r * sa)) for r, y in profile])
    m = len(profile)
    for k in range(segs if full else segs):
        A, B = rings[k], rings[(k + 1) % n]
        for j in range(m if closed else m - 1):
            j2 = (j + 1) % m
            try:
                bm.faces.new((A[j], B[j], B[j2], A[j2]))
            except ValueError:
                pass
    if not full and closed:
        bm.faces.new(rings[0])
        bm.faces.new(list(reversed(rings[-1])))
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def round_profile(r_in, r_out, y_back, y_front, n=14):
    """Closed half-round ring profile (bezel): flat back at y_back, domed front reaching y_front (negative = toward camera)."""
    rc, ry = (r_in + r_out) / 2, (r_out - r_in) / 2
    return [(rc - ry * math.cos(math.pi * k / n), y_back - (y_back - y_front) * math.sin(math.pi * k / n)) for k in range(n + 1)]


def place(o, loc=(0, 0, 0), rot=(0, 0, 0), parent=None, scale=None):
    o.location, o.rotation_euler = loc, rot
    if scale is not None:
        o.scale = scale
    if parent is not None:
        o.parent = parent
    return o


watch = add_empty(scene, "Watch")
RT_C, RT_R, RT_Y = float(E("RT_C", "0.885")), float(E("RT_R", "0.115")), float(E("RT_Y", "-0.06"))  # bezel torus
RB_IN, RB_OUT = RT_C - RT_R, RT_C + RT_R
DEPTH = float(E("DEPTH", "0.46"))
R_DIAL = float(E("R_DIAL", "0.665"))   # dial radius
R_FLAT = float(E("R_FLAT", "0.70"))   # flat inner ring R_FLAT..R_WALL at the bottom of the recess
Y_DIAL = float(E("Y_DIAL", "0.20"))   # the dial sits deep behind the bezel (its inner wall shows on the far side)
Y_FLAT = Y_DIAL - float(E("FLAT_H", "0.06"))
R_WALL = RB_IN - 0.005

# bezel: a fat polished torus
mesh_object(scene, "Bezel", bm_lathe([(RT_C + RT_R * math.cos(2 * math.pi * k / 32), RT_Y + RT_R * math.sin(2 * math.pi * k / 32)) for k in range(32)], 160),
            polished, smooth=True, sharp_angle=80, parent=watch)
# deep inner wall from the torus down to the flat ring (one satin band, like the reference's), dark crevice at its foot
wall_prof = [(R_WALL, RT_Y), (R_WALL - 0.045, Y_FLAT), (R_WALL + 0.05, Y_FLAT), (R_WALL + 0.05, RT_Y)]
mesh_object(scene, "Wall", bm_lathe(wall_prof, 160, closed=True), satin, smooth=True, sharp_angle=30, parent=watch)
mesh_object(scene, "WallGroove", bm_lathe([(R_WALL - 0.05, Y_FLAT - 0.008), (R_WALL - 0.04, Y_FLAT - 0.008), (R_WALL - 0.04, Y_FLAT + 0.004), (R_WALL - 0.05, Y_FLAT + 0.004)], 160),
            darkmat, smooth=True, parent=watch)
# flat satin inner ring, then the dark toothed rehaut cone down to the dial
mesh_object(scene, "Step", bm_lathe([(R_WALL - 0.044, Y_FLAT), (R_FLAT, Y_FLAT), (R_FLAT, Y_DIAL + 0.03), (R_WALL - 0.044, Y_DIAL + 0.03)], 160, closed=True), satin, smooth=True, sharp_angle=30, parent=watch)
mesh_object(scene, "Rehaut", bm_lathe([(R_FLAT + 0.001, Y_FLAT + 0.002), (R_DIAL - 0.004, Y_DIAL - 0.012), (R_DIAL - 0.004, Y_DIAL + 0.03), (R_FLAT + 0.001, Y_DIAL + 0.03)], 160, closed=True),
            darkmat, smooth=True, sharp_angle=30, parent=watch)
# raised arc segment over the inner ring (upper left), sharp-ended
SEG_A0, SEG_A1 = math.radians(float(E("SEG_A0", "95"))), math.radians(float(E("SEG_A1", "178")))
seg = mesh_object(scene, "ArcSeg", bm_lathe([(R_FLAT + 0.005, Y_FLAT - 0.002), (R_WALL - 0.05, Y_FLAT - 0.002), (R_WALL - 0.05, Y_FLAT - 0.07), (R_FLAT + 0.005, Y_FLAT - 0.07)],
                                         48, closed=True, a0=SEG_A0, a1=SEG_A1), polished, smooth=True, sharp_angle=40, parent=watch)
# case middle: a cushion (superellipse prism) behind the bezel, bevelled, + a round caseback
def bm_cushion(a, b, n, y0, y1, bevel=0.05, segs=128):
    bm = bmesh.new()
    pts = []
    for k in range(segs):
        t = 2 * math.pi * k / segs
        c, s_ = math.cos(t), math.sin(t)
        pts.append((a * math.copysign(abs(c) ** (2 / n), c), b * math.copysign(abs(s_) ** (2 / n), s_)))
    f0 = [bm.verts.new((x, y0, z)) for x, z in pts]
    f1 = [bm.verts.new((x, y1, z)) for x, z in pts]
    bm.faces.new(f0)
    bm.faces.new(list(reversed(f1)))
    for k in range(segs):
        k2 = (k + 1) % segs
        bm.faces.new((f0[k], f0[k2], f1[k2], f1[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if bevel > 0:
        bm_bevel(bm, bevel, 3, geom=[e for e in bm.edges if abs(e.verts[0].co.y - e.verts[1].co.y) < 1e-6])
    return bm


CA, CB, CN = float(E("CASE_A", "0.95")), float(E("CASE_B", "0.95")), float(E("CASE_N", "3.0"))
mesh_object(scene, "Case", bm_cushion(CA, CB, CN, Y_DIAL + 0.025, DEPTH, bevel=0.06), polished, smooth=True, sharp_angle=40, parent=watch)
mesh_object(scene, "Caseback", bm_lathe([(0.0, DEPTH + 0.07), (0.6, DEPTH + 0.07), (0.82, DEPTH - 0.01), (0.0, DEPTH - 0.01)], 96), satin, smooth=True, sharp_angle=40, parent=watch)
# rehaut teeth: small sharp wedges pointing inward
teeth = bmesh.new()
NT = 60
for k in range(NT):
    a = 2 * math.pi * k / NT
    t = bm_pyramid(0.018, 0.05, 3)
    bm_merge(teeth, t, loc=((R_DIAL + 0.014) * math.cos(a), Y_DIAL - 0.022, (R_DIAL + 0.014) * math.sin(a)),
             rot=(0, -a + math.pi / 2, 0))
mesh_object(scene, "Teeth", teeth, polished, smooth=False, parent=watch)
# dial
mesh_object(scene, "Dial", bm_cyl(R_DIAL, 0.02, 128), dialmat, smooth=True, sharp_angle=40, parent=watch).rotation_euler = (math.pi / 2, 0, 0)
bpy.data.objects["Dial"].location = (0, Y_DIAL + 0.01, 0)
# minute track: 60 fine raised ticks
ticks = bmesh.new()
for k in range(60):
    a = 2 * math.pi * k / 60
    L = 0.05 if k % 5 == 0 else 0.032
    bm_merge(ticks, bm_box(L, 0.006, 0.008), loc=((R_DIAL - 0.05) * math.cos(a), Y_DIAL - 0.002, (R_DIAL - 0.05) * math.sin(a)), rot=(0, -a, 0))
mesh_object(scene, "Ticks", ticks, polished, smooth=False, parent=watch)
# baton hour markers (raised, rounded), skipping the date window and the sub-dial
DATE_A = math.radians(float(E("DATE_A", "44")))
markers = bmesh.new()
for k in range(12):
    a = 2 * math.pi * k / 12
    if abs(math.atan2(math.sin(a - DATE_A), math.cos(a - DATE_A))) < 0.3 or abs(a - math.pi / 2) < 0.1:
        continue
    bm_merge(markers, bm_box(0.13, 0.05, 0.05, bevel=0.016, seg=2), loc=(0.55 * math.cos(a), Y_DIAL - 0.025, 0.55 * math.sin(a)), rot=(0, -a, 0))
mesh_object(scene, "Markers", markers, polished, smooth=True, sharp_angle=40, parent=watch)
# date window: raised bevelled square frame with a dark aperture
dw = mesh_object(scene, "DateFrame", bm_ring_plate(0.15, 0.15, 0.02, 0.04, 0.05, bevel=0.01), polished, smooth=True, sharp_angle=40, parent=watch)
place(dw, loc=(0.6 * math.cos(DATE_A), Y_DIAL - 0.025, 0.6 * math.sin(DATE_A)), rot=(0, -DATE_A, 0))
dwin = mesh_object(scene, "DateWin", bm_box(0.075, 0.01, 0.075), dialmat, smooth=False, parent=watch)
place(dwin, loc=(0.6 * math.cos(DATE_A), Y_DIAL, 0.6 * math.sin(DATE_A)), rot=(0, -DATE_A, 0))
# sub-dial arc (raised half annulus with grooves) above the centre
SUB = Vector((float(E("SUB_X", "0.044")), 0, float(E("SUB_Z", "0.40"))))
for k, (ri, ro, h) in enumerate(((0.15, 0.19, 0.035), (0.20, 0.235, 0.05), (0.245, 0.27, 0.03))):
    arc = mesh_object(scene, f"Arc{k}", bm_lathe([(ri, 0.0), (ro, 0.0), (ro, -h), (ri, -h)], 64, closed=True, a0=math.radians(-15), a1=math.radians(195)),
                      polished if k != 1 else satin, smooth=True, sharp_angle=40, parent=watch)
    place(arc, loc=(SUB.x, Y_DIAL + 0.005, SUB.z))
pin = mesh_object(scene, "Pinion", bm_cyl(0.05, 0.06, 32), darkmat, smooth=True, parent=watch)
place(pin, loc=(SUB.x, Y_DIAL - 0.03, SUB.z), rot=(math.pi / 2, 0, 0))
# hands: a ring hand around the centre + a baton pointing to ~4 o'clock
hand_ring = mesh_object(scene, "HandRing", bm_lathe([(0.10, 0.0), (0.135, 0.0), (0.135, -0.025), (0.10, -0.025)], 48, closed=True), polished, smooth=True, parent=watch)
place(hand_ring, loc=(0.16, -0.07, -0.12))
hand = mesh_object(scene, "Hand", bm_box(0.42, 0.012, 0.035, bevel=0.006), polished, smooth=True, parent=watch)
place(hand, loc=(0.2, -0.08, -0.2), rot=(0, math.radians(35), 0))

# lugs: two horns on each side (6 o'clock = +X, right; 12 o'clock = -X, left), strap gap between them
LUG_Z0, LUG_Z1 = float(E("LUG_Z0", "0.245")), float(E("LUG_Z1", "0.60"))
LUG_X1 = {1: float(E("LUG_X1", "1.10")), -1: float(E("LUG_X1L", "1.0"))}
LUG_F, LUG_B = float(E("LUG_F", "-0.10")), float(E("LUG_B", "0.40"))   # front / back faces (local y)
for side in (1, -1):
    x1 = LUG_X1[side]
    for zs in (1, -1):
        z1 = LUG_Z1 if zs > 0 else float(E("LUG_Z1B", "0.54"))
        zc = zs * (LUG_Z0 + z1) / 2
        bx = bm_box(x1 - 0.78, LUG_B - LUG_F, z1 - LUG_Z0, bevel=0.03, seg=3)
        o = mesh_object(scene, f"Lug{side}{zs}", bx, polished, smooth=True, sharp_angle=40, parent=watch)
        place(o, loc=(side * (0.78 + x1) / 2, (LUG_F + LUG_B) / 2, zc))
    # spring-bar housing between the horns, set back so the strap notch reads deep
    bar = mesh_object(scene, f"LugBar{side}", bm_box(0.10, (LUG_B - LUG_F) * 0.7, 2 * LUG_Z0 + 0.02, bevel=0.03), satin, smooth=True, parent=watch)
    place(bar, loc=(side * float(E("BAR_X", "0.92")), LUG_B - (LUG_B - LUG_F) * 0.35, 0))

# crown at 3 o'clock (+Z, top): guard block, toothed collar, big gear crown
def bm_gear(r, h, teeth=10, depth=0.18, segs=120):
    """Toothed cylinder (axis Y): rounded teeth by modulating the radius."""
    bm = bmesh.new()
    rings = []
    for yv in (-h / 2, h / 2):
        ring = []
        for k in range(segs):
            a = 2 * math.pi * k / segs
            rr = r * (1 - depth * (0.5 - 0.5 * math.cos(teeth * a)) ** 3)
            ring.append(bm.verts.new((rr * math.cos(a), yv, rr * math.sin(a))))
        rings.append(ring)
    for k in range(segs):
        k2 = (k + 1) % segs
        bm.faces.new((rings[0][k], rings[0][k2], rings[1][k2], rings[1][k]))
    bm.faces.new(rings[0])
    bm.faces.new(list(reversed(rings[1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm_bevel(bm, 0.012, 2, geom=[e for e in bm.edges if abs(e.verts[0].co.y - e.verts[1].co.y) < 1e-6])
    return bm


CROWN_A = math.radians(float(E("CROWN_A", "84")))
CROWN_Y = float(E("CROWN_Y", "0.22"))
CR_R = float(E("CR_R", "-0.12"))  # radial shift of the crown stack
crown_rig = add_empty(scene, "CrownRig")
place(crown_rig, loc=(0, CROWN_Y, 0), rot=(0, -CROWN_A + math.pi / 2, 0), parent=watch)  # local +Z of the rig = crown axis
guard = mesh_object(scene, "Guard", bm_box(0.42, 0.34, 0.16, bevel=0.03), polished, smooth=True, parent=crown_rig)
place(guard, loc=(0, 0, 0.99 + CR_R))
collar = mesh_object(scene, "Collar", bm_gear(0.10, 0.08, 12, 0.14), polished, smooth=True, sharp_angle=50, parent=crown_rig)
place(collar, loc=(0, 0, 1.11 + CR_R), rot=(math.pi / 2, 0, 0))
crown = mesh_object(scene, "Crown", bm_gear(0.155, 0.10, 10, 0.18), polished, smooth=True, sharp_angle=50, parent=crown_rig)
place(crown, loc=(0, 0, 1.21 + CR_R), rot=(math.pi / 2, 0, 0))

# angular pusher upper right (~1:30)
PUSH_A = math.radians(float(E("PUSH_A", "47")))
push_rig = add_empty(scene, "PushRig")
place(push_rig, loc=(0, 0.28, 0), rot=(0, -PUSH_A + math.pi / 2, 0), parent=watch)
push = mesh_object(scene, "Pusher", bm_box(0.14, 0.36, 0.17, bevel=0.03), polished, smooth=True, parent=push_rig)
place(push, loc=(0, 0, 1.02))


# knurled crown lower left (~7:30): diamond knurl by alternating the radius on a cylinder grid
def bm_knurl(r, h, na=36, nh=7, d=0.012):
    bm = bmesh.new()
    grid = []
    for j in range(nh + 1):
        yv = -h / 2 + h * j / nh
        row = []
        for k in range(na):
            a = 2 * math.pi * (k + 0.5 * (j % 2)) / na
            rr = r + (d if (j % 2 == 0) else -d * 0.3)
            row.append(bm.verts.new((rr * math.cos(a), yv, rr * math.sin(a))))
        grid.append(row)
    for j in range(nh):
        for k in range(na):
            k2 = (k + 1) % na
            if j % 2 == 0:
                bm.faces.new((grid[j][k], grid[j][k2], grid[j + 1][k]))
                bm.faces.new((grid[j][k2], grid[j + 1][k2], grid[j + 1][k]))
            else:
                bm.faces.new((grid[j][k], grid[j][k2], grid[j + 1][k2]))
                bm.faces.new((grid[j][k], grid[j + 1][k2], grid[j + 1][k]))
    bm.faces.new(grid[0])
    bm.faces.new(list(reversed(grid[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


KN_A = math.radians(float(E("KN_A", "245")))
kn_rig = add_empty(scene, "KnurlRig")
place(kn_rig, loc=(0, float(E("KN_Y", "0.06")), 0), rot=(0, -KN_A + math.pi / 2, 0), parent=watch)
for k, (z0, hh, rr) in enumerate(((1.05, 0.09, 0.105), (1.17, 0.12, 0.125))):
    kn = mesh_object(scene, f"Knurl{k}", bm_knurl(rr, hh, 32, 5), polished, smooth=False, parent=kn_rig)
    place(kn, loc=(0, 0, z0), rot=(math.pi / 2, 0, 0))
kstem = mesh_object(scene, "KnurlStem", bm_cyl(0.06, 0.12, 32), darkmat, smooth=True, parent=kn_rig)
place(kstem, loc=(0, 0, 1.0), rot=(0, 0, 0))

# ---------------------------------------------------------------- the LS mark at the dial centre (faceted chrome)
MARK_H = float(E("MARK_H", "0.86"))
mark_rig = add_empty(scene, "MarkRig")  # world-aligned: faces the camera; placed on the dial centre after the watch is posed
mark_spin = add_empty(scene, "MarkSpin")
mark_spin.parent = mark_rig
mark = mesh_object(scene, "Mark", bm_logo_mark(scale=MARK_H / 552.0, depth=float(E("MARK_D", "170")), bevel=float(E("MARK_BEV", "48")), segs=1),
                   markmat, smooth=True, sharp_angle=30, parent=mark_spin)

# ---------------------------------------------------------------- pose the watch (three-quarter view)
watch.rotation_mode = "XYZ"
watch.rotation_euler = (math.radians(float(E("W_RX", "2.2"))), math.radians(float(E("W_RY", "12"))), math.radians(float(E("W_RZ", "-34.8"))))
watch.location = (float(E("W_X", "-0.212")), 0, float(E("W_Z", "-0.033")))


bpy.context.view_layer.update()
# on the camera ray through the dial centre (so it sits on the dial centre in frame, like the gem), MARK_FWD in front of the dial
_dial_c = watch.matrix_world @ Vector((float(E("MARK_X", "0.0")), Y_DIAL, float(E("MARK_Z", "0.0"))))
mark_rig.location = _dial_c - (_dial_c - cam.location).normalized() * float(E("MARK_FWD", "0.55"))
mark_rig.rotation_euler = (math.radians(float(E("MARK_TILT", "-14"))), 0, 0)


def mark_rot(f):
    """turns in place: a wide rocking turn about the vertical (never past edge-on, so the LS always reads the right way
    round) with a tumbling tilt/roll, one cycle per loop: seamless at frame N+1 == frame 1"""
    t = (f - 1) / N
    yaw = math.radians(float(E("MARK_YAW0", "-18"))) + math.radians(float(E("MARK_SWING", "58"))) * math.sin(2 * math.pi * t)
    tilt = math.radians(float(E("WOB_T", "16"))) * math.sin(2 * math.pi * t + 1.9)
    roll = math.radians(float(E("WOB_R", "10"))) * math.sin(4 * math.pi * t + 0.4)
    return (tilt, roll, yaw)


bake(mark_spin, range(1, N + 1), lambda f: dict(rot=mark_rot(f)))

if E("DEBUG"):
    from bpy_extras.object_utils import world_to_camera_view
    bpy.context.view_layer.update()
    for nm in ("Bezel", "Case", "Step", "Lug-11", "Lug-1-1", "LugBar-1", "Knurl1", "Crown"):
        o = bpy.data.objects.get(nm)
        if not o:
            continue
        mw = o.matrix_world
        xs = [world_to_camera_view(scene, cam, mw @ v.co) for v in o.data.vertices]
        print("DBG", nm, "x %.0f..%.0f y %.0f..%.0f" % (min(c.x for c in xs) * 1024, max(c.x for c in xs) * 1024, (1 - max(c.y for c in xs)) * 1024, (1 - min(c.y for c in xs)) * 1024))
    print("DBG watch", tuple(round(math.degrees(a), 2) for a in watch.rotation_euler), tuple(watch.location))
    for nm in ("MarkRig", "Dial", "Watch"):
        o = bpy.data.objects[nm]
        c = world_to_camera_view(scene, cam, o.matrix_world.translation)
        print("DBG centre", nm, round(c.x * 1024), round((1 - c.y) * 1024), tuple(round(v, 3) for v in o.matrix_world.translation))

# ---------------------------------------------------------------- blueprint overlay (static, as in the reference: px @1024)
OV_BOXES = [(214, 160, 252, 180), (279, 130, 333, 156)]   # x0, y0, x1, y1
OV_PTS = {"b1": (247, 171), "b2": (306, 146), "p1": (585, 332), "p2": (645, 452), "p3": (575, 708)}
OV_LINES = [("b1", "p1"), ("b2", "p3"), ("p1", "p2"), ("p2", "p3")]
OV_MARKS = ["p1", "p2", "p3"]


def _blend(img, ys, xs, cov):
    a = img[ys, xs, 3]
    na = a + cov * (1 - a)
    with np.errstate(invalid="ignore", divide="ignore"):
        for c in range(3):
            img[ys, xs, c] = np.where(na > 0, (img[ys, xs, c] * a * (1 - cov) + cov) / na, 0)
    img[ys, xs, 3] = na


def draw_line(img, p0, p1, op, period=6.0, duty=0.5):
    h, w = img.shape[:2]
    (x0, y0), (x1, y1) = p0, p1
    L = math.hypot(x1 - x0, y1 - y0)
    t = np.linspace(0, 1, int(L * 3) + 1)
    keep = np.mod(t * L, period) < period * duty
    xs, ys = (x0 + (x1 - x0) * t)[keep], (y0 + (y1 - y0) * t)[keep]
    acc = np.zeros((h, w), np.float32)
    xi, yi = np.floor(xs - 0.5).astype(int), np.floor(ys - 0.5).astype(int)
    fx, fy = xs - 0.5 - xi, ys - 0.5 - yi
    for dx, dy, wt in ((0, 0, (1 - fx) * (1 - fy)), (1, 0, fx * (1 - fy)), (0, 1, (1 - fx) * fy), (1, 1, fx * fy)):
        X, Y = xi + dx, yi + dy
        ok = (X >= 0) & (X < w) & (Y >= 0) & (Y < h)
        np.maximum.at(acc, (Y[ok], X[ok]), wt[ok].astype(np.float32))
    acc = np.clip(acc * 1.5, 0, 1) * op
    yy, xx = np.nonzero(acc > 0.004)
    _blend(img, yy, xx, acc[yy, xx])


def draw_rect(img, x0, y0, x1, y1, op):
    h, w = img.shape[:2]
    x0, x1, y0, y1 = int(round(x0)), int(round(x1)), int(round(y0)), int(round(y1))
    for (ax0, ay0, ax1, ay1) in ((x0, y0, x1, y0), (x0, y1, x1, y1), (x0, y0 + 1, x0, y1 - 1), (x1, y0 + 1, x1, y1 - 1)):
        if ax0 == ax1:
            ys_ = np.arange(max(0, ay0), min(h - 1, ay1) + 1)
            _blend(img, ys_, np.full(len(ys_), ax0), np.full(len(ys_), op, np.float32))
        else:
            xs = np.arange(max(0, ax0), min(w - 1, ax1) + 1)
            _blend(img, np.full(len(xs), ay0), xs, np.full(len(xs), op, np.float32))


def post_overlay(path):
    if E("NO_OVERLAY"):
        return
    px = load_pixels(path)[::-1].copy()
    h, w = px.shape[:2]
    sc = w / 1024.0
    P = {k: (x * sc, y * sc) for k, (x, y) in OV_PTS.items()}
    for a, b in OV_LINES:
        draw_line(px, P[a], P[b], float(E("LINE_A", "0.8")), period=max(2.0, 6.0 * sc))
    for (x0, y0, x1, y1) in OV_BOXES:
        draw_rect(px, x0 * sc, y0 * sc, x1 * sc, y1 * sc, float(E("BOX_A", "0.75")))
    for k in OV_MARKS:
        x, y = P[k]
        s = 4 * sc
        draw_rect(px, x - s, y - s, x + s, y + s, 0.7)
    save_pixels(path, px[::-1], alpha=True)


# ---------------------------------------------------------------- render
TEST = E("TEST")
if TEST:
    fr = [int(x) for x in E("TEST_FRAME", "1").split(",")]
    t0 = time.time()
    render_frames(scene, f"test_{TEST}", fr, OUT_DIR, post=post_overlay, skip_existing=False)
    log(f"test frames {fr}: {time.time() - t0:.1f}s")
elif ARGS["preview"]:
    fr = preview_frames(N)
    paths = render_frames(scene, NAME + "_pv", fr, os.path.join(OUT_DIR, "preview"), post=post_overlay, skip_existing=False)
    sheet = contact_sheet(paths, os.path.join(OUT, f"{NAME}_preview_sheet.png"), cols=4, checker=("#2a2f36",))
    log("preview sheet:", sheet)
else:
    lo, hi = ARGS["frames"] or (1, N)
    t0 = time.time()
    paths = render_frames(scene, NAME, range(lo, hi + 1), os.path.join(OUT_DIR, "frames"), post=post_overlay)
    log(f"rendered {len(paths)} frames in {time.time() - t0:.0f}s")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, f"{NAME}.blend"))
