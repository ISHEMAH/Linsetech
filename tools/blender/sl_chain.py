"""
sl_chain.py — Sharplink's About hero clip (shrp_about_chrome.webm) rebuilt with the Linse LS mark as the chrome gem.
TRANSPARENT film, 1600x1200, 30 fps, 202 frames (6.73 s), seamless loop (empty at both ends).

    Blender -b -P sl_chain.py -- --preview        # 12 frames at 25 % -> out/sl_chain/preview/
    Blender -b -P sl_chain.py                     # out/sl_chain/frames/sl_chain_####.png
    TEST=<tag> TEST_FRAMES=40,70,140 Blender -b -P sl_chain.py -- --scale 50
    then: Blender -b -P sl_encode.py -- sl_chain, and hevc_alpha for the Safari mp4 (see sl_encode.py)

The shot (measured on the original, 0-based frames at 30 fps; positions in the original's 2160x1620 pixels):
  0-10    empty.
  10-48   a small cluster appears at (1175,844) and flies toward the camera while thin circuit-board plates, chips and
          small parts converge on it, threaded on a thin diagonal axis line with two small square plates; dotted
          connectors and small blueprint boxes tie the parts together.
  48-60   the missing half flies in from the left and closes on the plates: the gem is assembled at (1240,818).
  60-84   the assembled gem turns slowly, framed by a tall blueprint rectangle and a smaller one.
  84-97   it tumbles toward the camera (lies diagonally at 89) and rights itself while drifting up and right.
  97-126  it climbs to the top-right slot of a chain while two more gems rush in from the lower left, dark and
          motion-blurred, and dock below it along the diagonal: (1447,~230) (1222,883) (977,~1440), linked by
          dotted lines and boxes.
  126-170 the chain holds perfectly still.
  170-190 the chain pulls apart (top gem up and out, the others down and out); 190-201 empty.
Ours: the same beats with the chrome LS mark (both outlines, prismatic bevels so every stroke reads as a cut facet)
as the gem. The two outlines are the gem's two halves: the S outline arrives with the plates, the L outline closes in.
Blueprint boxes and dotted connectors are drawn in post, in 2D, from projected anchor points (like Sharplink's).
"""
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
from bpy_extras.object_utils import world_to_camera_view

ARGS = parse_args()
NAME = "sl_chain"
W, H, FPS, N = 1600, 1200, 30, 202
OUT_DIR = os.path.join(OUT, NAME)
os.makedirs(OUT_DIR, exist_ok=True)
ENV = lambda k, d: float(os.environ.get(k, d))  # noqa: E731
random.seed(7)

# ---------------------------------------------------------------- render setup
scene = reset_scene()
setup_render(scene, W, H, FPS, N, ARGS, samples=int(ENV("SAMPLES", "40")), transparent=True, motion_blur=True, view="Standard", look=None)
scene.eevee.ray_tracing_options.resolution_scale = "1"
scene.eevee.motion_blur_steps = 1          # velocity-based blur only (cheap): the gems that rush in smear like the original
scene.render.motion_blur_shutter = ENV("SHUTTER", "0.6")
setup_world(scene, strength=ENV("HDR_STR", "0.7"), gradient=None, rotation=math.radians(ENV("HDR_ROT", "200")))
nt = scene.world.node_tree
env_node = next(n for n in nt.nodes if n.type == "TEX_ENVIRONMENT")
bg_node = next(n for n in nt.nodes if n.type == "BACKGROUND")
hs = nt.nodes.new("ShaderNodeHueSaturation")
hs.inputs["Saturation"].default_value = 0.0      # neutral chrome: all colour comes from the page gradient
nt.links.new(env_node.outputs["Color"], hs.inputs["Color"])
nt.links.new(hs.outputs["Color"], bg_node.inputs["Color"])

# camera: straight on, 50 mm; the original's pixel coordinates map through F px per unit at depth d
LENS = 50.0
cam = add_camera(scene, (0, 0, 0), (0, 1, 0), lens=LENS)
cam.data.sensor_width, cam.data.sensor_fit = 36.0, "HORIZONTAL"
cam.data.clip_start, cam.data.clip_end = 0.5, 600
FPX = LENS / 36.0 * 2160          # focal length in the original's pixels
cam.data.dof.use_dof = True
cam.data.dof.focus_distance = 24.0
cam.data.dof.aperture_fstop = ENV("FSTOP", "4.0")


def S2W(u, v, d):
    """Original-frame pixel (u, v) at depth d (along +Y) -> world point."""
    return Vector(((u - 1080) / FPX * d, d, -(v - 810) / FPX * d))


TGT = Vector((0, 24, 0))
add_light(scene, "Key", TGT + Vector((-14, -12, 16)), TGT, ENV("KEY", "2600"), 12, size_y=8)
add_light(scene, "Fill", TGT + Vector((16, -14, -4)), TGT, ENV("FILL", "900"), 14, size_y=10).data.use_shadow = False
add_light(scene, "Top", TGT + Vector((4, 6, 22)), TGT, ENV("TOP", "1800"), 16, size_y=10)
add_light(scene, "Rim", TGT + Vector((18, 20, 6)), TGT, ENV("RIM", "1600"), 8).data.use_shadow = False
scene.eevee.light_threshold = 0.0002
for L in bpy.data.lights:
    L.use_custom_distance, L.cutoff_distance = True, 400.0

gem_mat = mat_chrome("gem", color=hex2lin("#e6e6e6")[:3], rough=ENV("GEM_ROUGH", "0.09"), coat=0.4)
plate_mat = mat_chrome("plate", color=hex2lin("#bdbdbd")[:3], rough=0.28, coat=0.0)
part_mat = mat_chrome("part", color=hex2lin("#bdbdbd")[:3], rough=0.3, coat=0.0)
line_mat = mat_emit("axisLine", "#F2F2F2", 2.2, alpha=0.85)


def weighted_normals(o):
    m = o.modifiers.new("wn", "WEIGHTED_NORMAL")
    m.mode, m.weight, m.keep_sharp = "FACE_AREA", 100, True
    return o


# ---------------------------------------------------------------- the mark (unit height = 1)
MS = 1.0 / 552.0                      # path units -> mark of height 1, width 1.16
DEPTH = ENV("MARK_DEPTH", "150")      # extrusion (path units): a thick gem
BEV = ENV("MARK_BEVEL", "34")         # prismatic chamfer (path units): strokes ~70-90 wide -> narrow crest


def mark_piece(i, name, parent=None):
    bm = bm_logo(LOGO_PATHS[i], MS, DEPTH, BEV, 1)
    o = weighted_normals(mesh_object(scene, name, bm, gem_mat, smooth=True, sharp_angle=25, parent=parent))
    return o


def mark_whole(name, parent=None):
    bm = bm_logo_mark(MS, DEPTH, BEV, 1)
    return weighted_normals(mesh_object(scene, name, bm, gem_mat, smooth=True, sharp_angle=25, parent=parent))


# piece centroids (mark space, x right, z up): used for the assembly offsets and the call-out anchors
L_CEN = Vector(((150 - CX) * MS, 0, -(330 - CY) * MS))
S_CEN = Vector(((440 - CX) * MS, 0, -(380 - CY) * MS))


def mk_rig(name):
    rig = add_empty(scene, name)
    rig.rotation_mode = "XYZ"
    return rig


hero = mk_rig("Hero")
hero_L_rig = add_empty(scene, "HeroL")
hero_L_rig.parent = hero
hero_S_rig = add_empty(scene, "HeroS")
hero_S_rig.parent = hero
hero_L = mark_piece(0, "HeroLMesh", hero_L_rig)
hero_S = mark_piece(1, "HeroSMesh", hero_S_rig)
gem2 = mk_rig("Gem2")
gem3 = mk_rig("Gem3")
mark_whole("Gem2Mesh", gem2)
mark_whole("Gem3Mesh", gem3)

# ---- assembly parts: circuit-board plates (with raised components), chips, the axis line and its two small plates
plates = []
for j in range(4):
    pr = add_empty(scene, f"PlateRig{j}")
    pr.parent = hero
    bw, bh = 0.5 - 0.05 * j, 0.76 - 0.07 * j
    bm = bm_box(0.018, bw, bh, bevel=0.003, seg=1)   # thin board (x thin), turned to face the camera below
    for c in range(16):
        w, h = random.uniform(0.03, 0.12), random.uniform(0.025, 0.1)
        y = random.uniform(-0.4, 0.4) * (bw - w) / 2 * 2
        z = random.uniform(-0.4, 0.4) * (bh - h) / 2 * 2
        bm_merge(bm, bm_box(0.014, w, h, bevel=0.002, seg=1), loc=(-0.016, y, z))
    o = weighted_normals(mesh_object(scene, f"Plate{j}", bm, plate_mat, smooth=True, sharp_angle=30, parent=pr))
    o.rotation_euler = (0, 0, math.radians(90))
    plates.append(pr)
chips = []
for j in range(16):
    cr = add_empty(scene, f"ChipRig{j}")
    cr.parent = hero
    w, h, d = random.uniform(0.04, 0.12), random.uniform(0.015, 0.04), random.uniform(0.04, 0.14)
    o = weighted_normals(mesh_object(scene, f"Chip{j}", bm_box(w, h, d, bevel=0.006, seg=1), part_mat if j % 3 else plate_mat, smooth=True, sharp_angle=30, parent=cr))
    chips.append((cr, Vector((random.uniform(-0.75, -0.15), random.uniform(-0.4, 0.2), random.uniform(-0.4, 0.4))),
                  Vector((random.uniform(-1.2, 0.6), random.uniform(-1.0, 0.6), random.uniform(-0.9, 0.9)))))
axis = add_empty(scene, "Axis")
axis.parent = hero
ax_mesh = mesh_object(scene, "AxisLine", bm_cyl(0.0035, 1.0, segs=8), line_mat, smooth=False, parent=axis)
ax_mesh.rotation_euler = (math.radians(90), 0, 0)        # cylinder along local Y
ax_mesh.visible_shadow = False
ax_plates = []
for j in range(2):
    ap = add_empty(scene, f"AxisPlate{j}")
    ap.parent = axis
    mesh_object(scene, f"AxisPlateMesh{j}", bm_box(0.11, 0.012, 0.13, bevel=0.003, seg=1), plate_mat, smooth=False, parent=ap)
    ax_plates.append(ap)


# ---------------------------------------------------------------- keyframed motion (original pixel space)
def lerp(a, b, t):
    return a + (b - a) * t


def ease(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def track(keys, i):
    """keys: [(frame, (u, v, d, h_px, rx, ry, rz)), ...] -> smoothly interpolated tuple at frame index i (Catmull-Rom)."""
    if i <= keys[0][0]:
        return keys[0][1]
    if i >= keys[-1][0]:
        return keys[-1][1]
    for k in range(len(keys) - 1):
        f0, a = keys[k]
        f1, b = keys[k + 1]
        if f0 <= i <= f1:
            t = (i - f0) / (f1 - f0)
            pa = keys[k - 1][1] if k > 0 else a
            pb = keys[k + 2][1] if k + 2 < len(keys) else b
            out = []
            for q in range(len(a)):
                p0, p1, p2, p3 = pa[q], a[q], b[q], pb[q]
                # Catmull-Rom, with tangents scaled by segment length ratios kept simple
                out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
            return tuple(out)


D0 = 24.0     # working depth
R = math.radians
# hero gem: u, v, depth, height(px), rx, ry, rz (deg).  height in px of the original at that depth
HERO = [
    (10, (1175, 844, 120.0, 70, 8, 0, 56)),
    (14, (1180, 840, 90.0, 230, 8, 0, 56)),
    (18, (1230, 815, 60.0, 430, 8, 0, 57)),
    (24, (1262, 798, 40.0, 560, 7, 0, 58)),
    (36, (1272, 790, D0, 700, 6, 0, 56)),
    (48, (1262, 800, D0, 720, 4, 0, 50)),
    (58, (1266, 812, D0, 730, 2, 0, 0)),
    (66, (1280, 818, D0, 780, 0, 0, -36)),
    (84, (1276, 818, D0, 780, -4, 0, -48)),
    (89, (1212, 870, D0 * 0.82, 720, -50, 35, -20)),
    (97, (1262, 815, D0 * 0.9, 660, -18, 24, -24)),
    (105, (1345, 560, D0, 600, -12, 18, -28)),
    (113, (1410, 360, D0, 570, -12, 18, -30)),
    (126, (1447, 236, D0, 560, -12, 18, -30)),
    (170, (1447, 236, D0, 560, -12, 18, -30)),
    (178, (1480, 120, D0, 560, -14, 18, -28)),
    (186, (1620, -300, D0, 560, -16, 18, -26)),
]
GEM2 = [
    (100, (300, 1500, D0 * 0.7, 560, 40, 50, -40)),
    (105, (595, 1221, D0 * 0.8, 560, 20, 40, -10)),
    (113, (1009, 1060, D0, 560, -4, 26, 14)),
    (121, (1205, 900, D0, 560, -10, 19, 24)),
    (126, (1222, 883, D0, 560, -12, 18, 26)),
    (170, (1222, 883, D0, 560, -12, 18, 26)),
    (178, (1180, 1010, D0, 560, -12, 18, 26)),
    (186, (1000, 1700, D0, 560, -12, 18, 26)),
]
GEM3 = [
    (112, (700, 1900, D0 * 0.8, 560, 40, 50, -40)),
    (117, (891, 1640, D0, 560, 10, 30, -30)),
    (121, (930, 1500, D0, 560, -6, 20, -26)),
    (126, (977, 1445, D0, 560, -12, 18, -24)),
    (170, (977, 1445, D0, 560, -12, 18, -24)),
    (176, (950, 1560, D0, 560, -12, 18, -24)),
    (184, (860, 2100, D0, 560, -12, 18, -24)),
]
MARK_H = 1.0


def place_rig(rig, keys, f, hide_before=None, hide_after=None):
    i = f - 1
    u, v, d, hp, rx, ry, rz = track(keys, i)
    s = hp / FPX * d / MARK_H
    loc = S2W(u, v, d)
    hidden = (hide_before is not None and i < hide_before) or (hide_after is not None and i > hide_after)
    if hidden:
        s = 0.0001
    return dict(loc=loc, rot=(R(rx), R(ry), R(rz)), scale=(s, s, s))


bake(hero, range(1, N + 1), lambda f: place_rig(hero, HERO, f, hide_before=10, hide_after=188))
bake(gem2, range(1, N + 1), lambda f: place_rig(gem2, GEM2, f, hide_before=99, hide_after=188))
bake(gem3, range(1, N + 1), lambda f: place_rig(gem3, GEM3, f, hide_before=111, hide_after=186))


# assembly (all in hero space, mark height = 1): the L outline waits off to the left and closes in 50-58,
# the plates sit in front of the S outline and slide into it 50-60, chips converge 12-50 then tuck in.
def L_fn(f):
    i = f - 1
    t = ease((i - 49) / 9.0)
    off = Vector((-2.5, -0.3, 0.25)).lerp(Vector((0, 0, 0)), t)
    rot = (0, R(lerp(-35, 0, t)), R(lerp(25, 0, t)))
    s = 0.0001 if i < 49 else 1.0
    return dict(loc=off, rot=rot, scale=(s, s, s))


def S_fn(f):
    i = f - 1
    t = ease((i - 50) / 10.0)
    off = Vector((0.18, 0.25, 0)).lerp(Vector((0, 0, 0)), t)
    return dict(loc=off, rot=(0, 0, 0), scale=(1, 1, 1))


bake(hero_L_rig, range(1, N + 1), L_fn)
bake(hero_S_rig, range(1, N + 1), S_fn)
for j, pr in enumerate(plates):
    def plate_fn(f, j=j):
        i = f - 1
        t_in = ease((i - 10 - 2 * j) / 18.0)
        t_out = ease((i - 46 - j) / 8.0)
        # the stack: boards spaced in depth in front of the S outline, spread out to the left while arriving
        home = Vector((-0.02 - 0.12 * j, -0.14 - 0.06 * j, 0.03 - 0.035 * j))
        start = home + Vector((-0.9 - 0.35 * j, -0.3, 0.25 - 0.15 * j))
        loc = start.lerp(home, t_in).lerp(Vector((0.18, 0.0, 0.0)), t_out)
        s = lerp(1.0, 0.0001, ease((i - 53 - j) / 6.0)) if i > 9 else 0.0001
        # while sliding in they turn edge-on (sandwiched between the outlines, like the original's boards)
        return dict(loc=loc, rot=(0, R(-6 + 3 * j), R(-14 + 6 * j + 68 * t_out)), scale=(s, s, s))
    bake(pr, range(1, N + 1), plate_fn)
for j, (cr, home, spread) in enumerate(chips):
    def chip_fn(f, j=j, home=home, spread=spread):
        i = f - 1
        t_in = ease((i - 10 - (j % 5)) / 30.0)
        t_out = ease((i - 50 - (j % 4)) / 7.0)
        p = (home + spread).lerp(home, t_in).lerp(Vector((0.1, 0, 0)), t_out)
        s = lerp(1.0, 0.0001, t_out) if i > 9 else 0.0001
        return dict(loc=p, rot=(R(40 * j + 90 * t_in), R(25 * j), R(-30 * j + 60 * t_in)), scale=(s, s, s))
    bake(cr, range(1, N + 1), chip_fn)


def axis_fn(f):
    i = f - 1
    grow = ease((i - 12) / 14.0) * (1 - ease((i - 56) / 10.0))
    s = max(0.0001, grow)
    return dict(loc=(0, 0, 0), rot=(R(-18), 0, R(64)), scale=(1, 9.0 * s, 1))


bake(axis, range(1, N + 1), axis_fn)
for j, ap in enumerate(ax_plates):
    def ap_fn(f, j=j):
        i = f - 1
        t = ease((i - 14) / 30.0)
        y = (-0.42 if j == 0 else 0.30) * lerp(1.6, 1.0, t) + (0.03 if j else -0.03) * math.sin(i / 6)
        return dict(loc=(0, y, 0), rot=(0, 0, 0), scale=(1, 1 / 9.0, 1))
    bake(ap, range(1, N + 1), ap_fn)


# ---------------------------------------------------------------- 2D call-outs (post)
S = W / 2160.0


def proj(p):
    c = world_to_camera_view(scene, cam, Vector(p))
    return Vector((c.x * W, (1 - c.y) * H)), c.z


def rig_point(keys, f, local):
    """World point of a mark-space point for a rig driven by `keys` at frame f (scale/rot/loc like place_rig)."""
    i = f - 1
    u, v, d, hp, rx, ry, rz = track(keys, i)
    s = hp / FPX * d / MARK_H
    M = Matrix.Translation(S2W(u, v, d)) @ Euler((R(rx), R(ry), R(rz)), "XYZ").to_matrix().to_4x4() @ Matrix.Diagonal((s, s, s, 1))
    return M @ Vector(local)


def mpt(x, y):
    """Mark-space point from path coordinates (front face)."""
    return Vector(((x - CX) * MS, -DEPTH * MS / 2, -(y - CY) * MS))


def overlay_items(f):
    i = f - 1
    boxes, lines = [], []
    if 14 <= i < 60:
        a = 1.0 if i < 56 else (60 - i) / 4
        hp = [proj(rig_point(HERO, f, mpt(x, y)))[0] for (x, y) in ((360, 40), (560, 520), (430, 300), (230, 260), (300, 470))]
        boxes += [(hp[0], 80, 46, a), (hp[1], 98, 120, a), (hp[2], 40, 52, a), (hp[3], 30, 30, a), (hp[4], 52, 26, a)]
        lines += [(hp[0], hp[1], a), (hp[2], hp[3], a), (hp[3], hp[4], a), (hp[4], hp[1], a)]
        far = hp[3] + Vector((-760, 250)) * S
        lines += [(hp[4], far, a * 0.8), (hp[3], far + Vector((0, -24)) * S, a * 0.8)]
    if 60 <= i < 98:
        a = min(1.0, (i - 60) / 4) * (1.0 if i < 94 else (98 - i) / 4)
        top = proj(rig_point(HERO, f, mpt(320, 0)))[0]
        foot = proj(rig_point(HERO, f, mpt(140, 468)))[0]
        mid = proj(rig_point(HERO, f, mpt(420, 340)))[0]
        right = proj(rig_point(HERO, f, mpt(600, 520)))[0]
        x0, x1 = min(top.x, foot.x, mid.x) - 60 * S, max(top.x, mid.x) + 70 * S
        boxes += [(Vector(((x0 + x1) / 2, (top.y + mid.y) / 2)), (x1 - x0) / S, (mid.y - top.y) / S + 40, a),
                  (mid + Vector((-30, 50)) * S, 116, 192, a), (right + Vector((-30, -20)) * S, 82, 56, a)]
        lines += [(top + Vector((0, 230)) * S, mid + Vector((-20, 110)) * S, a), (top + Vector((0, 230)) * S, right, a), (mid + Vector((-20, 110)) * S, right, a)]
    if i >= 102:
        gems = [(HERO, 188), (GEM2, 188), (GEM3, 186)]
        pts = []
        for keys, last in gems:
            if i > last:
                pts.append(None)
                continue
            up_ = proj(rig_point(keys, f, mpt(320, 60)))[0]
            low = proj(rig_point(keys, f, mpt(420, 500)))[0]
            left = proj(rig_point(keys, f, mpt(120, 420)))[0]
            pts.append((up_, low, left))
        a = min(1.0, (i - 102) / 6)
        for k, pp in enumerate(pts):
            if pp is None:
                continue
            up_, low, left = pp
            boxes += [(up_ + Vector((-20, 40)) * S, 156, 150, a), (low + Vector((-40, 10)) * S, 40, 68, a)]
            if k == 2:
                boxes.append((left + Vector((20, -40)) * S, 216, 160, a))
        for k in range(2):
            if pts[k] is None or pts[k + 1] is None:
                continue
            lines += [(pts[k][1], pts[k + 1][0], a), (pts[k][1] + Vector((-14, 0)) * S, pts[k + 1][2], a)]
    return boxes, lines


def _splat(img, xs, ys, a):
    h, w = img.shape
    x0 = np.floor(xs).astype(int)
    y0 = np.floor(ys).astype(int)
    fx, fy = xs - x0, ys - y0
    for dx, dy, wt in ((0, 0, (1 - fx) * (1 - fy)), (1, 0, fx * (1 - fy)), (0, 1, (1 - fx) * fy), (1, 1, fx * fy)):
        xx, yy = x0 + dx, y0 + dy
        m = (xx >= 0) & (xx < w) & (yy >= 0) & (yy < h)
        np.add.at(img, (yy[m], xx[m]), a[m] * wt[m])


def draw_overlay(px, f):
    boxes, lines = overlay_items(f)
    h, w = px.shape[:2]
    ink = np.zeros((h, w), dtype=np.float32)
    s = w / W

    def seg(p0, p1, alpha, dotted=False):
        p0, p1 = Vector(p0) * s, Vector(p1) * s
        L = (p1 - p0).length
        if L < 0.5 or alpha <= 0:
            return
        n = int(L * 2) + 2
        t = np.linspace(0, 1, n)
        xs = p0.x + (p1.x - p0.x) * t
        ys = p0.y + (p1.y - p0.y) * t
        a = np.full(n, 0.5 * alpha, dtype=np.float32)
        if dotted:
            period = max(2.5, 6.0 * s)
            a *= ((t * L) % period) < period * 0.5
        _splat(ink, xs, (h - 1) - ys, a)

    for (c, bw, bh, a) in boxes:
        bw, bh = bw * S, bh * S
        x0, y0, x1, y1 = c.x - bw / 2, c.y - bh / 2, c.x + bw / 2, c.y + bh / 2
        seg((x0, y0), (x1, y0), a); seg((x1, y0), (x1, y1), a); seg((x1, y1), (x0, y1), a); seg((x0, y1), (x0, y0), a)
    for (p0, p1, a) in lines:
        seg(p0, p1, a, dotted=True)
    a_line = np.clip(ink, 0, 1) * ENV("BOX_A", "0.6")
    a_bg = px[..., 3].copy()
    out_a = a_line + a_bg * (1 - a_line)
    for c in range(3):
        px[..., c] = np.where(out_a > 1e-5, (a_line + px[..., c] * a_bg * (1 - a_line)) / np.maximum(out_a, 1e-5), px[..., c])
    px[..., 3] = out_a
    return px


def chroma(px):
    amt = ENV("CA", "0.0011")
    if amt <= 0:
        return px
    h, w = px.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = (w - 1) / 2, (h - 1) / 2

    def sample(ch, sc):
        sx = cx + (xx - cx) * sc
        sy = cy + (yy - cy) * sc
        x0 = np.clip(np.floor(sx).astype(int), 0, w - 2)
        y0 = np.clip(np.floor(sy).astype(int), 0, h - 2)
        fx, fy = np.clip(sx - x0, 0, 1), np.clip(sy - y0, 0, 1)
        c = px[..., ch] * px[..., 3]
        return c[y0, x0] * (1 - fx) * (1 - fy) + c[y0, x0 + 1] * fx * (1 - fy) + c[y0 + 1, x0] * (1 - fx) * fy + c[y0 + 1, x0 + 1] * fx * fy
    a = px[..., 3]
    r = sample(0, 1 - amt)
    b = sample(2, 1 + amt)
    na = np.maximum(a, 1e-5)
    px[..., 0] = np.where(a > 1e-4, np.clip(r / na, 0, 1), px[..., 0])
    px[..., 2] = np.where(a > 1e-4, np.clip(b / na, 0, 1), px[..., 2])
    return px


def post(p, f):
    px = load_pixels(p)
    px = chroma(px)
    px = draw_overlay(px, f)
    save_pixels(p, px, alpha=True)


def render_list(frames, out_dir, tag, force=False):
    os.makedirs(out_dir, exist_ok=True)
    t0 = time.time()
    paths = []
    for j, f in enumerate(frames):
        pth = os.path.join(out_dir, f"{tag}_{f:04d}.png")
        paths.append(pth)
        if os.path.exists(pth) and os.path.getsize(pth) > 0 and not force:
            continue
        scene.frame_set(f)
        scene.render.filepath = pth
        bpy.ops.render.render(write_still=True)
        post(pth, f)
        el = time.time() - t0
        print(f"[{tag}] frame {f} ({j + 1}/{len(frames)}) {el:.0f}s elapsed, ~{el / (j + 1) * (len(frames) - j - 1):.0f}s left", flush=True)
    return paths


TEST = os.environ.get("TEST")
if TEST:
    frames = [int(v) for v in os.environ.get("TEST_FRAMES", "40,70,90,140").split(",")]
    render_list(frames, os.path.join(OUT_DIR, "test"), f"test_{TEST}", force=True)
elif ARGS["preview"]:
    render_list(preview_frames(N), os.path.join(OUT_DIR, "preview"), NAME + "_pv", force=True)
else:
    lo, hi = ARGS["frames"] or (1, N)
    t0 = time.time()
    render_list(list(range(lo, hi + 1)), os.path.join(OUT_DIR, "frames"), NAME, force=os.environ.get("FORCE") == "1")
    log(f"rendered {hi - lo + 1} frames in {time.time() - t0:.0f}s")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, f"{NAME}.blend"))
