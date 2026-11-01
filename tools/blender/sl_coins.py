"""
sl_coins.py — recreation of Sharplink's coins clip (shrp_opportunitycoins_chrome.webm, 1800x960, 3 s, plays once and
holds its last frame, transparent) with the Linse LS mark in relief on each coin.

    Blender -b -P sl_coins.py -- --preview          # 12 frames at 25 % -> out/sl_coins_preview_sheet.png
    TEST=a TEST_FRAME=90 Blender -b -P sl_coins.py   # one frame -> out/sl_coins/test_a_0090.png (half size)
    Blender -b -P sl_coins.py                        # 90 RGBA frames -> out/sl_coins/frames/
    Blender -b -P sl_encode.py -- sl_coins

What the original does (measured on the reference, 30 fps, frames 1-based):
  * empty frame until ~f9; five thick chrome coins then enter one after another from the bottom-right corner
    (A ~f9, B ~f19, C ~f28, D ~f38, E ~f48), each travelling the same arched path (up-left, then down-left) while it
    turns, and decelerating into its slot: A lower-left (0.19, 0.65), B (0.37, 0.50), C (0.53, 0.38), D (0.72, 0.33),
    E (0.87, 0.52) — a row of overlapping coins rising diagonally, faces turned ~55 deg to the left, E leaning back.
  * A settles ~f55, B ~f62, C ~f70, D ~f78, E ~f80; frames 80-90 are a clean, still rest pose.
  * coin face: the gem in relief, fine concentric grooves, a dashed ring, a binary-digit ring and a raised lip.
  * the frame fades to transparent toward the left edge (smoothstep x 0.03 -> 0.20) and the bottom (y 0.975 -> 0.835).
"""
import os, sys, math, random, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
from common import _new_mat

ARGS = parse_args()
W, H, FPS, N = 1350, 720, 30, 90
NAME = "sl_coins"
OUT_DIR = os.path.join(OUT, NAME)
os.makedirs(OUT_DIR, exist_ok=True)


def E(k, d):
    return float(os.environ.get(k, d))


random.seed(11)
scene = reset_scene()
setup_render(scene, W, H, FPS, N, ARGS, samples=int(E("SAMPLES", 48)), transparent=True, motion_blur=False,
             view="Standard", look=None)
scene.eevee.ray_tracing_options.resolution_scale = "1"
scene.view_settings.exposure = E("EXPOSURE", 0.3)

# ---------------------------------------------------------------- reflection environment (studio HDRI + softboxes)


def setup_studio_world(scene, hdr_str, hdr_rot, floor, panels):
    w = scene.world or bpy.data.worlds.new("World")
    scene.world = w
    if w.node_tree is None:
        w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value = (0, 0, hdr_rot)
    nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"])
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(HDRI, check_existing=True)
    nt.links.new(mp.outputs["Vector"], env.inputs["Vector"])
    nrm = nt.nodes.new("ShaderNodeVectorMath")
    nrm.operation = "NORMALIZE"
    nt.links.new(tc.outputs["Generated"], nrm.inputs[0])
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(nrm.outputs[0], sep.inputs[0])
    flo = nt.nodes.new("ShaderNodeMapRange")
    flo.inputs["From Min"].default_value, flo.inputs["From Max"].default_value = -0.08, 0.06
    flo.inputs["To Min"].default_value, flo.inputs["To Max"].default_value = floor, 1.0
    nt.links.new(sep.outputs["Z"], flo.inputs["Value"])
    mul = nt.nodes.new("ShaderNodeMix")
    mul.data_type = "RGBA"
    mul.blend_type = "MULTIPLY"
    mul.inputs["Factor"].default_value = 1.0
    nt.links.new(env.outputs["Color"], mul.inputs["A"])
    nt.links.new(flo.outputs["Result"], mul.inputs["B"])
    sc = nt.nodes.new("ShaderNodeVectorMath")
    sc.operation = "SCALE"
    nt.links.new(mul.outputs["Result"], sc.inputs[0])
    sc.inputs["Scale"].default_value = hdr_str
    acc = sc.outputs[0]
    for (d, c0, c1, s) in panels:
        d = Vector(d).normalized()
        dot = nt.nodes.new("ShaderNodeVectorMath")
        dot.operation = "DOT_PRODUCT"
        dot.inputs[1].default_value = d
        nt.links.new(nrm.outputs[0], dot.inputs[0])
        mr = nt.nodes.new("ShaderNodeMapRange")
        mr.interpolation_type = "SMOOTHSTEP"
        mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = c0, c1
        mr.inputs["To Min"].default_value, mr.inputs["To Max"].default_value = 0.0, s
        nt.links.new(dot.outputs["Value"], mr.inputs["Value"])
        add = nt.nodes.new("ShaderNodeVectorMath")
        add.operation = "ADD"
        nt.links.new(acc, add.inputs[0])
        nt.links.new(mr.outputs["Result"], add.inputs[1])
        acc = add.outputs[0]
    bg = nt.nodes.new("ShaderNodeBackground")
    nt.links.new(acc, bg.inputs["Color"])
    nt.links.new(bg.outputs[0], out.inputs["Surface"])
    return w


# camera looks along +Y; the coins face left/toward the camera, so their faces reflect what is behind-left of the camera
def _dir(name, d):
    v = os.environ.get(name)
    return tuple(float(x) for x in v.split(",")) if v else d


PANELS = [
    ((0, 0, 1), 0.70, 0.92, E("P_TOP", 2.0)),                                         # overhead
    (_dir("D_LEFT", (-0.95, 0.3, 0.15)), 0.88, 0.97, E("P_LEFT", 1.6)),              # left/behind: what the faces mirror (kept dim)
    (_dir("D_LF", (-0.55, -0.45, 0.7)), 0.86, 0.96, E("P_LF", 2.0)),                   # front-left high: gem facets, raised rings
    ((0.7, -0.6, 0.3), 0.85, 0.96, E("P_RIGHT", 1.6)),                                # front-right
    ((0.2, 0.9, 0.35), 0.85, 0.96, E("P_BACK", 1.8)),                                 # behind the coins: rims
    ((0, -1, -0.3), 0.75, 0.92, E("P_LOW", 0.3)),                                     # low front
]
setup_studio_world(scene, E("HDR_STR", 0.06), math.radians(E("HDR_ROT", 200)), E("FLOOR", 0.05), PANELS)
add_light(scene, "Key", (-9, -10, 7), (0, 0, 0), E("KEY", 0), 6, color=(1, 1, 1))
add_light(scene, "Top", (1, -2, 12), (0, 0, 0), E("TOP", 0), 8, color=(1, 1, 1))
add_light(scene, "Rim", (8, 6, 4), (0, 0, 0), E("RIM", 0), 5, color=(1, 1, 1))

# ---------------------------------------------------------------- camera
LENS, CAM_D = E("LENS", 68.0), E("CAM_D", 9.0)
cam = add_camera(scene, (0, -CAM_D, 0), (0, 0, 0), lens=LENS)
cam.data.sensor_fit = "HORIZONTAL"
cam.data.sensor_width = 36.0
HALF_W = lambda d: d * 18.0 / LENS          # half frame width at distance d along the view axis
HALF_H = lambda d: HALF_W(d) * H / W


def S2W(u, v, d):
    """Normalised screen (u right, v down) at view distance d -> world point (camera at (0,-CAM_D,0) looking +Y)."""
    return Vector(((u - 0.5) * 2 * HALF_W(d), -CAM_D + d, (0.5 - v) * 2 * HALF_H(d)))


# ---------------------------------------------------------------- coin face height map (grooves, dashed ring, binary ring, lip)
TEX = int(E("TEX", 2048))


def face_heightmap(n):
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    x = (xs + 0.5) / n * 2 - 1
    y = (ys + 0.5) / n * 2 - 1
    r = np.hypot(x, y)
    th = np.arctan2(y, x)
    h = np.zeros((n, n), np.float32)
    px = 2.0 / n  # one pixel in face units

    def band(r0, r1, soft=1.5):
        return np.clip((r - r0) / (soft * px) + 0.5, 0, 1) * np.clip((r1 - r) / (soft * px) + 0.5, 0, 1)

    # raised lip and a fine inner step
    h = np.maximum(h, band(0.915, 1.01) * 1.0)
    h = np.maximum(h, band(0.895, 0.905) * 0.6)
    # concentric grooves (fine raised rings in arcs) between r 0.30 and 0.66
    rng = np.random.default_rng(3)
    for k in range(15):
        rr = 0.30 + k * 0.025
        a0 = rng.uniform(-math.pi, math.pi)
        span = rng.uniform(1.4, 2.4) * math.pi / 2
        d_ang = np.angle(np.exp(1j * (th - a0)))
        arc = (np.abs(d_ang) < span).astype(np.float32)
        h = np.maximum(h, band(rr, rr + 0.011, 1.2) * arc * 0.75)
    # dashed ring (segments of varied length) at r 0.735-0.75
    ang = (th + math.pi) / (2 * math.pi)  # 0..1
    segs = []
    a = 0.0
    while a < 1.0:
        L = rng.choice([0.006, 0.01, 0.018, 0.03])
        segs.append((a, a + L))
        a += L + rng.choice([0.004, 0.007, 0.012])
    dash = np.zeros_like(h)
    for (a0, a1) in segs:
        dash = np.maximum(dash, ((ang >= a0) & (ang < min(a1, 1.0))).astype(np.float32))
    h = np.maximum(h, band(0.735, 0.752, 1.2) * dash * 0.6)
    # binary digits ring at r 0.79-0.865: glyphs drawn in local (tangent, radial) coordinates
    NCH = 84
    bits = rng.integers(0, 2, NCH)
    cell = 2 * math.pi / NCH
    k = np.floor((th + math.pi) / cell).astype(int) % NCH
    tc = ((th + math.pi) - (k + 0.5) * cell) * 0.828  # tangential offset (face units) from the glyph centre
    rc = r - 0.828                                   # radial offset
    is_one = bits[k] == 1
    hh, hw, tk = 0.030, 0.013, 0.0055                # glyph half height, half width, stroke
    ell = np.sqrt((tc / hw) ** 2 + (rc / hh) ** 2)
    zero = (np.abs(ell - 1.0) * min(hw, hh) < tk * 0.75).astype(np.float32)
    one = ((np.abs(tc) < tk * 0.75) & (np.abs(rc) < hh)).astype(np.float32)
    glyph = np.where(is_one, one, zero) * (np.abs(rc) < hh + 0.01)
    h = np.maximum(h, glyph * 0.8)
    return h


def make_height_image(n):
    path = os.path.join(OUT_DIR, f"coin_face_{n}.png")
    if not os.path.exists(path):
        hm = face_heightmap(n)
        rgba = np.dstack([hm, hm, hm, np.ones_like(hm)])
        save_pixels(path, rgba, alpha=False)  # row 0 = y -1 = bottom, as save_pixels expects
    img = bpy.data.images.load(path, check_existing=True)
    img.colorspace_settings.name = "Non-Color"
    return img


face_img = make_height_image(TEX)


def mat_coin(name, img, rough=0.14, bump=0.35):
    m, nt, pb, out = _new_mat(name)
    setin(pb, "Base Color", (0.86, 0.86, 0.86))
    setin(pb, "Metallic", 1.0)
    setin(pb, "Roughness", rough)
    uv = nt.nodes.new("ShaderNodeUVMap")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Cubic"
    tex.extension = "CLIP"
    nt.links.new(uv.outputs["UV"], tex.inputs["Vector"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = bump
    bp.inputs["Distance"].default_value = E("BUMP_D", 0.035)
    nt.links.new(tex.outputs["Color"], bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], pb.inputs["Normal"])
    # raised details brighter and more polished than the field, so grooves and digits read like the reference
    bc = nt.nodes.new("ShaderNodeMapRange")
    bc.inputs["To Min"].default_value, bc.inputs["To Max"].default_value = E("FIELD_V", 0.5), 0.95
    nt.links.new(tex.outputs["Color"], bc.inputs["Value"])
    nt.links.new(bc.outputs["Result"], pb.inputs["Base Color"])
    rr = nt.nodes.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value, rr.inputs["To Max"].default_value = rough, E("DETAIL_R", 0.05)
    nt.links.new(tex.outputs["Color"], rr.inputs["Value"])
    nt.links.new(rr.outputs["Result"], pb.inputs["Roughness"])
    return m


coin_face = mat_coin("coinFace", face_img, rough=E("FACE_R", 0.18), bump=E("BUMP", 1.0))
coin_edge = mat_chrome("coinEdge", color=(0.88, 0.88, 0.88), rough=E("EDGE_R", 0.12), coat=0.0)
mark_mat = mat_chrome("coinMark", color=(0.92, 0.92, 0.92), rough=E("MARK_R", 0.16), coat=0.0)

# ---------------------------------------------------------------- coin geometry (shared mesh data, five linked coins)
R, T = 1.0, E("COIN_T", 0.27)


def coin_mesh():
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=160, radius1=R, radius2=R, depth=T)
    # bevel the two rim edges
    rim = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-6 and abs(abs(e.verts[0].co.z) - T / 2) < 1e-5]
    bmesh.ops.bevel(bm, geom=rim, offset=0.03, offset_type="OFFSET", segments=3, profile=0.5, affect="EDGES", clamp_overlap=True)
    uvl = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        is_cap = abs(f.normal.z) > 0.99
        f.material_index = 0 if is_cap else 1
        for lp in f.loops:
            x, y = lp.vert.co.x, lp.vert.co.y
            if f.normal.z < 0:
                x = -x  # mirror so the back face reads the same way round
            lp[uvl].uv = (x / (2 * R) + 0.5, y / (2 * R) + 0.5)
    me = bpy.data.meshes.new("Coin")
    bm.to_mesh(me)
    bm.free()
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    me.materials.append(coin_face)
    me.materials.append(coin_edge)
    return me


def mark_mesh():
    """LS mark in relief for both faces (faceted chrome strokes)."""
    MW = E("MARK_W", 1.3)  # mark width on the face (coin diameter 2)
    s = MW / 640.0
    bm = bmesh.new()
    depth = E("MARK_D", 0.11) / s
    for side in (1, -1):
        for p in LOGO_PIECES:
            piece = bm_logo(p, scale=s, depth=depth, bevel=E("MARK_BEV", 0.035) / s, segs=1)
            # bm_logo: XZ plane, extruded along Y. Lay it on the face: Y -> Z (normal), Z (path up) -> Y.
            rot = (math.radians(-90), 0, 0) if side > 0 else (math.radians(-90), math.radians(180), 0)
            bm_merge(bm, piece, loc=(0, 0, side * (T / 2 + E("MARK_D", 0.11) / 2 - 0.01)), rot=rot)
    me = bpy.data.meshes.new("CoinMark")
    mark_sharp(bm, 35)
    bm.to_mesh(me)
    bm.free()
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    me.materials.append(mark_mat)
    return me


COIN_ME, MARK_ME = coin_mesh(), mark_mesh()

# ---------------------------------------------------------------- final slots and the shared arched path
# slots: screen centre (u, v), view depth, rotation (X tilt, Y roll, Z yaw) in degrees — tuned against the reference's last frame
SLOTS = [
    dict(u=E("U_A", 0.175), v=E("V_A", 0.83), d=E("D_A", 9.6), rot=(E("RXA", 84), E("RYA", 6), E("RZA", -36))),
    dict(u=E("U_B", 0.355), v=E("V_B", 0.64), d=E("D_B", 9.4), rot=(E("RXB", 90), E("RYB", 5), E("RZB", -40))),
    dict(u=E("U_C", 0.53), v=E("V_C", 0.46), d=E("D_C", 9.5), rot=(E("RXC", 91), E("RYC", 4), E("RZC", -46))),
    dict(u=E("U_D", 0.71), v=E("V_D", 0.40), d=E("D_D", 9.9), rot=(E("RXD", 92), E("RYD", 2), E("RZD", -52))),
    dict(u=E("U_E", 0.86), v=E("V_E", 0.50), d=E("D_E", 10.3), rot=(E("RXE", 62), E("RYE", -6), E("RZE", -40))),
]
ENTRY = dict(u=1.18, v=1.02, d=10.6, rot=(150.0, -40.0, 30.0))  # off-screen bottom-right, tumbling
# path control points from the entry through E, D, C, B to A (screen-space + depth), Catmull-Rom
CTRL = [ENTRY] + SLOTS[::-1]
CP = [S2W(c["u"], c["v"], c["d"]) for c in CTRL]
CR = [Vector(c["rot"]) for c in CTRL]
NSEG = len(CP) - 1


def catmull(p0, p1, p2, p3, t):
    t2, t3 = t * t, t * t * t
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)


def path_pos(s):
    """s in [0, NSEG]: 0 = entry, k = slot of the (NSEG-k+1)-th coin from the right... NSEG = slot A."""
    s = min(max(s, 0.0), NSEG)
    i = min(int(s), NSEG - 1)
    t = s - i
    p0 = CP[max(i - 1, 0)] if i > 0 else CP[0] + (CP[0] - CP[1])
    p3 = CP[i + 2] if i + 2 <= NSEG else CP[NSEG] + (CP[NSEG] - CP[NSEG - 1])
    return catmull(p0, CP[i], CP[i + 1], p3, t)


def path_rot(s):
    s = min(max(s, 0.0), NSEG)
    i = min(int(s), NSEG - 1)
    t = s - i
    t = t * t * (3 - 2 * t)
    return CR[i].lerp(CR[i + 1], t)


# arc-length table so the eased motion is uniform along the path (the entry leg is much longer than the slot gaps)
_SS = np.linspace(0.0, NSEG, 2001)
_PTS = [path_pos(float(x)) for x in _SS]
_LEN = np.concatenate([[0.0], np.cumsum([(_PTS[i + 1] - _PTS[i]).length for i in range(len(_PTS) - 1)])])


def s_at_length(L):
    return float(np.interp(L, _LEN, _SS))


def length_at_s(sv):
    return float(np.interp(sv, _SS, _LEN))


# per coin: slot along the path (A goes all the way, E stops at the first slot), entry frame, arrival frame
# (measured on the reference: A visible from f9 and settled ~f55, then B 19/62, C 28/70, D 38/78, E 48/80)
COINS = [
    dict(s=NSEG - 0, f0=E("F0A", 5), f1=E("F1A", 55)),
    dict(s=NSEG - 1, f0=E("F0B", 16), f1=E("F1B", 62)),
    dict(s=NSEG - 2, f0=E("F0C", 26), f1=E("F1C", 70)),
    dict(s=NSEG - 3, f0=E("F0D", 36), f1=E("F1D", 77)),
    dict(s=NSEG - 4, f0=E("F0E", 46), f1=E("F1E", 80)),
]
EASE_P = E("EASE_P", 1.9)


def coin_s(c, f):
    t = min(1.0, max(0.0, (f - c["f0"]) / (c["f1"] - c["f0"])))
    e = 1 - (1 - t) ** EASE_P
    return s_at_length(length_at_s(c["s"]) * e)


def coin_pose(c, f):
    s = coin_s(c, f)
    p = path_pos(s)
    r = path_rot(s)
    # a little extra spin about the coin axis that unwinds on arrival
    t = min(1.0, max(0.0, (f - c["f0"]) / (c["f1"] - c["f0"])))
    spin = E("SPIN", 50) * (1 - t) ** 2
    rot = Euler((math.radians(r.x), math.radians(r.y), math.radians(r.z + spin)), "XYZ")
    return p, rot


coins = []
for k, c in enumerate(COINS):
    o = bpy.data.objects.new(f"Coin{'ABCDE'[k]}", COIN_ME)
    scene.collection.objects.link(o)
    m = bpy.data.objects.new(f"Mark{'ABCDE'[k]}", MARK_ME)
    scene.collection.objects.link(m)
    m.parent = o
    coins.append(o)

    def fn(f, c=c):
        p, rot = coin_pose(c, f)
        return dict(loc=p, rot=rot)

    bake(o, range(1, N + 1), fn)

# ---------------------------------------------------------------- post: fades to transparent (left edge, bottom)


def post(path, f=None):
    a = load_pixels(path)  # row 0 = bottom
    h, w = a.shape[:2]
    ys = (h - 1 - np.arange(h, dtype=np.float32)) / (h - 1)
    xs = np.arange(w, dtype=np.float32) / (w - 1)

    def sstep(e0, e1, x):
        t = np.clip((x - e0) / (e1 - e0), 0, 1)
        return t * t * (3 - 2 * t)

    a[..., 3] *= sstep(0.03, 0.20, xs)[None, :] * sstep(0.975, 0.835, ys)[:, None]
    save_pixels(path, a, alpha=True)


def render_with_post(frames, out_dir, name, skip_existing=True):
    os.makedirs(out_dir, exist_ok=True)
    paths = []
    t0 = time.time()
    for i, f in enumerate(frames):
        p = os.path.join(out_dir, f"{name}_{f:04d}.png")
        paths.append(p)
        if skip_existing and os.path.exists(p) and os.path.getsize(p) > 0:
            continue
        scene.frame_set(f)
        scene.render.filepath = p
        bpy.ops.render.render(write_still=True)
        post(p, f)
        el = time.time() - t0
        print(f"[{name}] frame {f} ({i + 1}/{len(frames)}) {el:.0f}s elapsed, ~{el / (i + 1) * (len(frames) - i - 1):.0f}s left", flush=True)
    return paths


TEST = os.environ.get("TEST")
if TEST:
    if not ARGS["scale"]:
        scene.render.resolution_percentage = 50
    fl = [int(x) for x in os.environ.get("TEST_FRAME", "90").split(",")]
    t0 = time.time()
    render_with_post(fl, OUT_DIR, f"test_{TEST}", skip_existing=False)
    log(f"test frames {fl}: {time.time() - t0:.1f}s")
elif ARGS["preview"]:
    frames = preview_frames(N)
    paths = render_with_post(frames, os.path.join(OUT_DIR, "preview"), NAME + "_pv", skip_existing=False)
    log("preview sheet:", contact_sheet(paths, os.path.join(OUT, f"{NAME}_preview_sheet.png"), cols=4, checker=("#2a2f36",)))
else:
    lo, hi = ARGS["frames"] or (1, N)
    t0 = time.time()
    paths = render_with_post(range(lo, hi + 1), os.path.join(OUT_DIR, "frames"), NAME)
    log(f"rendered {len(paths)} frames in {time.time() - t0:.0f}s")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, f"{NAME}.blend"))
