"""
sl_sphere.py — Sharplink's "breakthrough" sphere (shrp_opportunitysphere_chrome.webm) recreated shot for shot, with the
chrome LS mark at the core instead of the ETH gem. 800x800, 30 fps, 300 frames (10 s), transparent, seamless loop.

    Blender -b -P sl_sphere.py -- --preview         # 12 frames at 25 % + contact sheet (out/sl_sphere_preview_sheet.png)
    Blender -b -P sl_sphere.py -- --preview --scale 50
    Blender -b -P sl_sphere.py                      # full RGBA PNG sequence -> out/sl_sphere/frames/
    TEST=a TEST_FRAME=1,43,136 Blender -b -P sl_sphere.py -- --scale 50   # a few frames -> out/sl_sphere/test_a_####.png

What the original does (reference frame index, 30 fps):
  0-2     polished chrome sphere at rest (≈39 % of the frame, centre slightly right of / below centre), fine cube-sphere
          seams (6 caps; a cube corner faces the camera, up-right of centre), blueprint boxes + dotted lines on it.
  3-35    it bursts: the 6 outer caps fly out along the cube axes (up, down, left, right, toward / away from camera)
          and stop at ~93 % of the frame (the whole layout drifts ~30 px left / 10 px up meanwhile); the inner onion
          layers (each also cut into 6 cube-face patches) follow.
  35-128  conveyor: every 12 frames one inner layer leaves the core, travels out along its axis (≈24 frames) and docks
          under its outer cap as a nested bowl: the caps grow terraced undersides (concentric rings), the core shrinks.
  104-122 the last core layer leaves and the gem grows at the centre.
  140-162 the whole assembly yaws 90° about the vertical (a cube symmetry, so the layout lands where it started).
  150-299 the explode state plays back in reverse (palindrome): layers return to the core, the caps close, the sphere
          is whole again at ~297 and frame 299 flows into frame 0.
Ours: the same rig (cube-sphere, 10 layers per axis, same schedule, same camera) with the faceted chrome LS mark at the
core; it makes one full turn around the 90° yaw so it always faces the camera when the layout is at rest.
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
from bpy_extras.object_utils import world_to_camera_view

ARGS = parse_args()
E = os.environ.get
W = H = 800
FPS, N = 30, 300
NAME = "sl_sphere"
OUT_DIR = os.path.join(OUT, NAME)
os.makedirs(OUT_DIR, exist_ok=True)

scene = reset_scene()
setup_render(scene, W, H, FPS, N, ARGS, samples=int(E("SAMPLES", "48")), transparent=True, motion_blur=False,
             view=E("VIEW", "AgX"), look=E("LOOK", "AgX - High Contrast"))
scene.view_settings.exposure = float(E("EXPOSURE", "0.3"))
setup_world(scene, strength=float(E("HDR_STR", "1.0")), gradient=None, rotation=math.radians(float(E("HDR_ROT", "205"))))
# neutral studio: the HDRI in grey, its softbox peaks clamped (no hot spots: the reference has none) and its dark room
# lifted a little (the reference's darkest reflection bands sit around 50-80, never black)
_wn = scene.world.node_tree
_env = next(n for n in _wn.nodes if n.type == "TEX_ENVIRONMENT")
_bg = next(n for n in _wn.nodes if n.type == "BACKGROUND")
_bw = _wn.nodes.new("ShaderNodeRGBToBW")
_mn = _wn.nodes.new("ShaderNodeMath")
_mn.operation = "MINIMUM"
_mn.inputs[1].default_value = float(E("CLAMP", "4.0"))
_ad = _wn.nodes.new("ShaderNodeMath")
_ad.operation = "ADD"
_ad.inputs[1].default_value = float(E("LIFT", "0.05"))
_wn.links.new(_env.outputs["Color"], _bw.inputs["Color"])
_wn.links.new(_bw.outputs["Val"], _mn.inputs[0])
_wn.links.new(_mn.outputs[0], _ad.inputs[0])
_wn.links.new(_ad.outputs[0], _bg.inputs["Color"])


def smooth(a, b, x):
    return smoothstep(a, b, x)


def tp(tau):
    """Palindrome: the explode state at reference time tau (0..299)."""
    return tau if tau <= 150 else 300 - tau


# ---------------------------------------------------------------- camera: fitted to the reference (long lens, ~23° down, ~27° round)
ELEV, AZIM = math.radians(float(E("ELEV", "22.5"))), math.radians(float(E("AZIM", "26.5")))
DIST, LENS = float(E("DIST", "17.8")), float(E("LENS", "126"))
cdir = Vector((math.cos(ELEV) * math.sin(AZIM), -math.cos(ELEV) * math.cos(AZIM), math.sin(ELEV)))
cam = add_camera(scene, tuple(cdir * DIST), (0, 0, 0), lens=LENS)
cam.data.clip_start, cam.data.clip_end = 1.0, 100.0
# the sphere's centre sits at (526, 548)/1024 at rest and the exploded layout at (496, 538): lens shift follows the burst
SH_REST = (-(526.3 - 512) / 1024, (548.2 - 512) / 1024)
SH_OPEN = (-(float(E("OPEN_X", "496")) - 512) / 1024, (float(E("OPEN_Y", "538")) - 512) / 1024)
BURST = (2, 33)


def burst(tau):
    return smooth(BURST[0], BURST[1], tp(tau))


for f in range(1, N + 1):
    b = burst(f - 1)
    cam.data.shift_x = SH_REST[0] + (SH_OPEN[0] - SH_REST[0]) * b
    cam.data.shift_y = SH_REST[1] + (SH_OPEN[1] - SH_REST[1]) * b
    cam.data.keyframe_insert("shift_x", frame=f)
    cam.data.keyframe_insert("shift_y", frame=f)
for fc in fcurves_of(cam.data):
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# soft studio boxes on top of the HDRI (bright silver with dark bands)
add_light(scene, "Key", (-6.0, -7.0, 7.0), (0, 0, 0), float(E("KEY", "450")), 7.0)
add_light(scene, "Fill", (7.0, -6.0, 1.5), (0, 0, 0), float(E("FILL", "160")), 8.0).data.use_shadow = False
add_light(scene, "Top", (0.5, 1.5, 9.0), (0, 0, 0), float(E("TOP", "0")), 9.0)

# ---------------------------------------------------------------- materials (neutral chrome)
BASE = hex2lin("#e6e6e6")[:3]
polished = mat_chrome("slPolished", color=BASE, rough=float(E("ROUGH", "0.17")), coat=0.0)
satin = mat_chrome("slSatin", color=BASE, rough=float(E("SATIN", "0.30")), coat=0.0)
markmat = mat_chrome("slMark", color=hex2lin(E("MARK_COL", "#e4e4e4"))[:3], rough=float(E("MARK_ROUGH", "0.22")), coat=0.0)

# ---------------------------------------------------------------- layers
K = 10                        # onion layers per axis (0 = outer cap)
T = float(E("T", "1.45"))     # outer cap travel (sphere radius = 1)
T0 = float(E("T0", "0.085"))  # outer shell thickness
TI = float(E("TI", "0.060"))  # inner layer thickness (a near-solid onion: thin gaps at rest)
R1 = 1.0 - T0 - 0.012         # first inner layer radius
DR = float(E("DR", "0.0705"))  # radial step between inner layers (core radius r9 ≈ 0.34)
GN = float(E("GN", "0.018"))   # apex gap when docked (reads as the dark lines between docked layers)
SEAM = float(E("SEAM", "0.988"))  # cube-face half extent (tan space) -> the fine seams

RADII = [1.0] + [R1 - DR * (i - 1) for i in range(1, K)]
THICK = [T0] + [TI] * (K - 1)
APEX = [1.0 + T]  # docked (nested-bowl) apex of each layer: GN under the previous layer's inner apex
for i in range(1, K):
    APEX.append(APEX[-1] - THICK[i - 1] - GN)
SDOCK = [APEX[i] - RADII[i] for i in range(K)]

# schedule (reference frames, first half): departure / docking per layer (12-frame conveyor)
# (the cap leaves alone; layer 1 trails it and docks at ~34; then one layer docks every 12 frames, each ~22 frames in transit)
ARR = [BURST[1], 35, 46] + [56 + 12 * (i - 3) for i in range(3, K - 1)] + [130]
DEP = [BURST[0], 8, 14] + [ARR[i] - 22 for i in range(3, K)]
log("radii", [round(r, 3) for r in RADII], "dock", [round(s, 3) for s in SDOCK])


def bm_patch(r, t, w=SEAM, n=24, bevel=0.007):
    """Cube-face patch (+Z face) of a spherical shell: outer radius r, thickness t; satin walls on the 4 cut sides."""
    bm = bmesh.new()
    a = math.atan(w)

    def d(i, j):
        u, v = math.tan(-a + 2 * a * i / n), math.tan(-a + 2 * a * j / n)
        return Vector((u, v, 1.0)).normalized()

    outer = [[bm.verts.new(d(i, j) * r) for j in range(n + 1)] for i in range(n + 1)]
    inner = [[bm.verts.new(d(i, j) * (r - t)) for j in range(n + 1)] for i in range(n + 1)]
    for i in range(n):
        for j in range(n):
            bm.faces.new((outer[i][j], outer[i + 1][j], outer[i + 1][j + 1], outer[i][j + 1]))
            bm.faces.new((inner[i][j], inner[i][j + 1], inner[i + 1][j + 1], inner[i + 1][j]))
    loop = [(i, 0) for i in range(n)] + [(n, j) for j in range(n)] + [(i, n) for i in range(n, 0, -1)] + [(0, j) for j in range(n, 0, -1)]
    walls = []
    for q in range(len(loop)):
        (i0, j0), (i1, j1) = loop[q], loop[(q + 1) % len(loop)]
        walls.append(bm.faces.new((outer[i0][j0], inner[i0][j0], inner[i1][j1], outer[i1][j1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    for f in walls:
        f.material_index = 1
    if bevel > 0:
        edges = [e for e in bm.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > math.radians(40)]
        bmesh.ops.bevel(bm, geom=edges, offset=min(bevel, t * 0.3), offset_type="OFFSET", segments=2, profile=0.5,
                        affect="EDGES", clamp_overlap=True)
    return bm


SLOTS = {  # axis empty rotation so that local +Z -> slot direction (front = toward the camera side, -Y)
    "top": (0, 0, 0), "bottom": (math.pi, 0, 0),
    "right": (0, math.pi / 2, 0), "left": (0, -math.pi / 2, 0),
    "back": (-math.pi / 2, 0, 0), "front": (math.pi / 2, 0, 0),
}
assembly = add_empty(scene, "Assembly")
layers, meshes = {}, {}
for sname, rot in SLOTS.items():
    ax = add_empty(scene, f"Axis_{sname}")
    ax.parent = assembly
    ax.rotation_euler = rot
    for i in range(K):
        if i not in meshes:
            o = mesh_object(scene, f"L_{sname}_{i}", bm_patch(RADII[i], THICK[i], n=40 if i == 0 else 26), polished,
                            smooth=True, sharp_angle=35, parent=ax)
            o.data.materials.append(satin)
            meshes[i] = o.data
        else:
            o = bpy.data.objects.new(f"L_{sname}_{i}", meshes[i])
            scene.collection.objects.link(o)
            o.parent = ax
        layers[(sname, i)] = o

# ---------------------------------------------------------------- the LS mark at the core (faceted chrome, same size as the gem)
MARK_H = float(E("MARK_H", "1.40"))
mark_rig = add_empty(scene, "MarkRig", tuple(Vector((math.cos(AZIM), math.sin(AZIM), 0)) * float(E("MARK_R", "0.08")) + Vector((0, 0, float(E("MARK_Z", "0.16"))))))
mark_rig.rotation_euler = (-ELEV * 0.8, 0, AZIM + math.radians(float(E("MARK_YAW", "-6"))))  # front face (-Y) toward the camera, turned a little
mark_spin = add_empty(scene, "MarkSpin")
mark_spin.parent = mark_rig
mark = mesh_object(scene, "Mark", bm_logo_mark(scale=MARK_H / 552.0, depth=float(E("MARK_D", "150")),
                                               bevel=float(E("MARK_BEV", "36")), segs=1),
                   markmat, smooth=True, sharp_angle=30, parent=mark_spin)


# ---------------------------------------------------------------- animation
def layer_s(i, tau):
    t = tp(tau)
    if i == 0:
        return T * smooth(DEP[0], ARR[0], t)
    return SDOCK[i] * smooth(DEP[i], ARR[i], t)


YAW0, YAW1 = float(E("YAW0", "140")), float(E("YAW1", "162"))
YAWMID = (YAW0 + YAW1) / 2


def yaw(tau):
    return (math.pi / 2) * smooth(YAW0, YAW1, tau)


def mark_scale(tau):
    return 0.22 + 0.78 * smooth(106, 122, tp(tau))


def mark_turn(tau):
    return 2 * math.pi * smooth(float(E("TURN0", "134")), float(E("TURN1", "163")), tau)


frames = range(1, N + 1)
bake(assembly, frames, lambda f: dict(rot=(0, 0, yaw(f - 1))))
for (sname, i), o in layers.items():
    bake(o, frames, lambda f, i=i: dict(loc=(0, 0, layer_s(i, f - 1))))
bake(mark_spin, frames, lambda f: dict(rot=(0, 0, mark_turn(f - 1)), scale=(mark_scale(f - 1),) * 3))

# ---------------------------------------------------------------- blueprint overlay (baked into the PNGs: 1 px boxes + dotted lines)
# anchors ride the outer caps; each is given by where it sits in the reference at frame 135 (1024 px) and solved
# onto its cap's surface once, so the same points also land where the reference has them at rest.
ANCHOR_PX = {
    "top": ("top", 397, 105), "topR": ("top", 456, 148), "left": ("left", 213, 510),
    "frontL": ("front", 225, 619), "frontR": ("front", 426, 661), "bottom": ("bottom", 546, 835),
    "rightA": ("right", 918, 486), "rightB": ("right", 965, 513), "rightC": ("right", 865, 598),
}
LINES = [("top", "bottom", 0), ("topR", "rightA", 0), ("left", "rightB", 1), ("left", "rightC", 1),
         ("frontL", "rightC", 0), ("frontL", "frontR", 0), ("frontR", "bottom", 1)]  # (a, b, appears with the burst)
BOXES = [  # (anchor, w, h, dx, dy) px @1024, centred on anchor + offset
    ("top", 114, 90, 0, 0), ("left", 22, 23, 0, 0), ("frontL", 35, 39, 0, 0), ("frontR", 20, 39, 0, 0),
    ("bottom", 43, 36, -1, 18), ("bottom", 128, 111, 57, 95), ("bottom", 13, 11, 24, 65),
    ("rightA", 49, 47, 5, 30), ("rightB", 49, 106, 0, 3), ("rightC", 16, 33, 3, 2),
]
GLOWS = ["frontL", "rightA"]
SLOT_FRAME = {s: tuple(Euler(r, "XYZ").to_matrix() @ Vector(v) for v in ((1, 0, 0), (0, 1, 0), (0, 0, 1))) for s, r in SLOTS.items()}


def cap_point(slot, u, v, tau, yaw_off=0.0):
    eu, ev, n = SLOT_FRAME[slot]
    p = (u * eu + v * ev + n).normalized() + n * layer_s(0, tau)
    return Matrix.Rotation(yaw(tau) + yaw_off, 3, "Z") @ p


def to_px(co, w=1024, h=1024):
    c = world_to_camera_view(scene, cam, co)
    return c.x * w, (1 - c.y) * h


def solve_anchor(slot, X, Y, tau=135):
    scene.frame_set(tau + 1)
    best = (1e18, 0, 0)
    for rng, step in ((1.0, 0.1), (0.12, 0.01), (0.015, 0.001)):
        u0, v0 = best[1], best[2]
        k = int(round(rng / step))
        for a in range(-k, k + 1):
            for b in range(-k, k + 1):
                u, v = u0 + a * step, v0 + b * step
                if abs(u) > 1.3 or abs(v) > 1.3:
                    continue
                x, y = to_px(cap_point(slot, u, v, tau))
                d = (x - X) ** 2 + (y - Y) ** 2
                if d < best[0]:
                    best = (d, u, v)
    return best[1], best[2], math.sqrt(best[0])


ANCHORS = {}
for nm, (slot, X, Y) in ANCHOR_PX.items():
    u, v, err = solve_anchor(slot, X, Y)
    ANCHORS[nm] = (slot, u, v)
    log(f"anchor {nm}: {slot} u={u:.3f} v={v:.3f} err={err:.1f}px")


def anchor_world(nm, tau):
    slot, u, v = ANCHORS[nm]
    # after the spin midpoint the slot holds the cap that rotated in from the previous slot: draw on that one
    return cap_point(slot, u, v, tau, yaw_off=-math.pi / 2 if tau > YAWMID else 0.0)


def _blend(img, ys, xs, cov):
    """white 'over' a straight-alpha RGBA image (top-left origin)."""
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
    if L < 1 or op <= 0:
        return
    t = np.linspace(0, 1, int(L * 3) + 1)
    s = t * L
    keep = np.mod(s, period) < period * duty
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


def draw_rect(img, cx, cy, bw, bh, op):
    h, w = img.shape[:2]
    x0, x1 = int(round(cx - bw / 2)), int(round(cx + bw / 2))
    y0, y1 = int(round(cy - bh / 2)), int(round(cy + bh / 2))
    for (ax0, ay0, ax1, ay1) in ((x0, y0, x1, y0), (x0, y1, x1, y1), (x0, y0 + 1, x0, y1 - 1), (x1, y0 + 1, x1, y1 - 1)):
        if ax0 == ax1:
            ys_ = np.arange(max(0, ay0), min(h - 1, ay1) + 1)
            if 0 <= ax0 < w and len(ys_):
                _blend(img, ys_, np.full(len(ys_), ax0), np.full(len(ys_), op, np.float32))
        else:
            xs = np.arange(max(0, ax0), min(w - 1, ax1) + 1)
            if 0 <= ay0 < h and len(xs):
                _blend(img, np.full(len(xs), ay0), xs, np.full(len(xs), op, np.float32))


def draw_glow(img, cx, cy, r, op):
    h, w = img.shape[:2]
    x0, x1, y0, y1 = max(0, int(cx - 2 * r)), min(w - 1, int(cx + 2 * r)), max(0, int(cy - 2 * r)), min(h - 1, int(cy + 2 * r))
    if x0 >= x1 or y0 >= y1:
        return
    yy, xx = np.mgrid[y0:y1 + 1, x0:x1 + 1]
    g = np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * (r * 0.6) ** 2)) * op
    m = g > 0.004
    _blend(img, yy[m], xx[m], g[m].astype(np.float32))


def post_overlay(path):
    tau = scene.frame_current - 1
    al = smooth(0.0, 3.0, abs(tau - YAWMID))  # quick dip while the overlay re-attaches mid-spin
    if al <= 0.01 or E("NO_OVERLAY"):
        return
    eo = smooth(6, 24, tp(tau))  # elements that appear as the sphere opens
    px = load_pixels(path)[::-1].copy()  # top-left origin
    h, w = px.shape[:2]
    sc = w / 1024.0
    pts = {nm: to_px(anchor_world(nm, tau), w, h) for nm in ANCHORS}
    LA, BA = float(E("LINE_A", "0.55")), float(E("BOX_A", "0.42"))
    for a, b, late in LINES:
        draw_line(px, pts[a], pts[b], LA * al * (eo if late else 1.0), period=max(2.0, 6.0 * sc))
    bs = 0.9 + 0.1 * burst(tau)
    for nm, bw, bh, dx, dy in BOXES:
        late = nm in ("bottom", "left") or (nm == "rightC")
        x, y = pts[nm]
        draw_rect(px, x + dx * sc * bs, y + dy * sc * bs, bw * sc * bs, bh * sc * bs, BA * al * (eo if late else 1.0))
    for nm in GLOWS:
        x, y = pts[nm]
        draw_glow(px, x, y, 9 * sc, 0.35 * al)
    save_pixels(path, px[::-1], alpha=True)


# ---------------------------------------------------------------- render
TEST = E("TEST")
if TEST:
    fr = [int(x) for x in E("TEST_FRAME", "136").split(",")]
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
