"""
hero.py (v2) — the hero clip: 1600x1000, 30 fps, 10 s (300 frames), opaque. Rebuilt to match
sharplink.com's hero beat for beat (timings taken from frames extracted from their clip).

    Blender -b -P hero.py -- --preview      # 12-frame contact sheet at 25 % -> tools/blender/out/hero_preview_sheet.png
    Blender -b -P hero.py                   # full PNG sequence -> tools/blender/out/hero/frames/

Timeline (seconds; frame = 1 + t*30):
    0.00–0.40  plain dark -> pale gradient (camera-parented backdrop)
    0.40–3.40  the chrome device flies in from outside the frame (motion blur) into an exploded stack around
               the chrome LS mark; ~450 chrome shards stream in and are absorbed; blueprint call-outs + dotted
               connectors fade in at 0.9 s; the camera pulls back from d=3.4 (parts overflow the frame)
    3.40–4.00  hold (exploded stack, mark at its core)
    4.00–5.20  takeover: shells drift apart, shrink and fade; the mark grows 0.55 -> 1 while chrome cross-fades
               to frosted glass (4.2–5.0); call-outs fade out by 4.5; camera keeps pulling back
    5.20–6.00  the glass mark alone over the gradient (~55 % of the frame height)
    6.00–7.42  the ribbon field rises band by band from the mark outward and fades in (thin mint-chrome walls)
    7.00–7.45  blueprint call-outs around the mark fade in (done before the loop point)
    7.47–10.0  idle: mark yaw ±10° (period 2.5 s) + slow pitch/bob, the field drifts; frame 300 == frame 225
"""
import os, sys, math, random, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
from common import _new_mat
from device import build_device
from ribbons import build_ribbon_field

ARGS = parse_args()
W, H, FPS, N = 1600, 1000, 30, 300
NAME = "hero"
OUT_DIR = os.path.join(OUT, NAME)
os.makedirs(OUT_DIR, exist_ok=True)


def F(t):  # seconds -> frame
    return int(round(1 + t * FPS))


def T(f):  # frame -> seconds
    return (f - 1) / FPS


# ---- timeline
ASM0, ASM1 = 0.40, 3.40
HOLD1 = 4.00
DIS0, DIS1 = 4.00, 5.20
CHR0, CHR1 = 4.20, 5.00
GUIDE = (0.9, 1.6, 3.9, 4.5)
RISE0, RISE1 = 6.00, 6.90
CALL0, CALL1 = 7.00, 7.45
LOOP0, PERIOD = 7.5, 2.5  # idle loop: frames 225 -> 300 (period 75 frames)

random.seed(7)
scene = reset_scene()
setup_render(scene, W, H, FPS, N, ARGS, samples=48, transparent=False, motion_blur=True, view="Standard", look=None)
scene.eevee.motion_blur_steps = 1
scene.eevee.ray_tracing_options.resolution_scale = "1"
HDR_ROT = float(os.environ.get("HDR_ROT", "35"))
setup_world(scene, strength=float(os.environ.get("HDR_STR", "0.9")), gradient=None, rotation=math.radians(HDR_ROT))
add_light(scene, "Key", (-7, -7, 10), (0, 0, 0), float(os.environ.get("KEY", "1600")), 5, color=(0.9, 1.0, 0.94))
add_light(scene, "Rim", (8, 7, 6), (0, 0, 0), 900, 4, color=(0.45, 1.0, 0.62))
add_light(scene, "Fill", (7, -10, -3), (0, 0, 0), 250, 7, color=(0.9, 1.0, 0.95)).data.use_shadow = False
add_light(scene, "FieldTop", (-3, -7, 16), (0, 3, -1.5), float(os.environ.get("TOP", "1500")), 16, color=(0.8, 1.0, 0.88), size_y=8).data.use_shadow = False


# ---- camera: dolly out along -Y, slightly above, looking at the mark
def cam_dist(t):
    d = 3.4
    d += (9.3 - 3.4) * smoothstep(ASM0, HOLD1, t)
    d += (10.2 - 9.3) * smoothstep(DIS0, DIS1, t)
    d += (11.6 - 10.2) * smoothstep(DIS1, 7.4, t)
    return d


cam = add_camera(scene, (0, -11.6, 1.4), (0, 0, 0.1), lens=50, shift_x=-0.03)


def cam_fn(f):
    d = cam_dist(T(f))
    loc = Vector((0.0, -d, 0.11 * d + 0.12))
    cam.location = loc
    point_at(cam, (0, 0, 0.1))
    return dict(loc=loc, rot=tuple(cam.rotation_euler))


bake(cam, range(1, N + 1), cam_fn)
cam.location = (0, -11.6, 1.4)
point_at(cam, (0, 0, 0.1))
backdrop = add_backdrop(scene, cam, [(0.0, "#DFF3E7"), (0.09, "#B9E4CB"), (0.2, "#4FA87E"), (0.33, "#1C6E4D"), (0.46, "#0F4A37"), (0.6, "#0B3D2E"), (0.78, "#05201A"), (1.0, "#02100A")], depth=70.0, lens=50, aspect=W / H)

# ---- materials
chrome_mark = mat_chrome("chromeMark", rough=0.08, coat=0.0)
chrome_dev = mat_chrome("chromeDev", color=(0.92, 0.94, 0.93), rough=0.1, coat=0.0)
chrome_dark_dev = mat_chrome("chromeDarkDev", color=(0.5, 0.56, 0.53), rough=0.26, coat=0.3)
pcb = mat_pcb("pcbDev")
chip = mat_chip("chipDev")
perf = mat_perforated("perfDev")
lens_mat = mat_chrome("lensDev", color=(0.06, 0.12, 0.09), rough=0.05, coat=1.0)
if os.environ.get("MARK_MODE", "frosted") == "satin":
    frosted = mat_chrome("frosted", color=hex2lin("#DDEFE4")[:3], rough=float(os.environ.get("MARK_ROUGH", "0.3")), coat=1.0)
    frosted.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 0.85
else:
    frosted = mat_frosted("frosted", tint="#E6FBEF", rough=float(os.environ.get("MARK_ROUGH", "0.25")), thickness=0.55, milk=float(os.environ.get("MILK", "0.28")))
guide = mat_emit("guide", "#DFF3E7", 1.3, alpha=0.0)
callout = mat_emit("callout", "#DFF3E7", 1.2, alpha=0.0)
DEV_MATS = [chrome_dev, chrome_dark_dev, pcb, chip, perf, lens_mat]
for m in DEV_MATS:
    m.surface_render_method = "DITHERED"

# ---- the mark: chrome strokes (device phase) and the frosted-glass outlines (after), one rig
MARK_DEPTH, MARK_BEVEL = 130, 22
mark_rig = add_empty(scene, "MarkRig")
strokes = [mesh_object(scene, f"Stroke{i}", bm_logo(p, depth=MARK_DEPTH, bevel=MARK_BEVEL, segs=1), chrome_mark, parent=mark_rig) for i, p in enumerate(LOGO_PIECES)]
glass = [mesh_object(scene, f"Glass{i}", bm_logo(p, depth=MARK_DEPTH, bevel=MARK_BEVEL, segs=1), frosted, parent=mark_rig) for i, p in enumerate(LOGO_PATHS)]
for i, s in enumerate(strokes):
    ox, oy, oz = PIECE_OFFSETS[i]
    off = V3(ox, oy, oz) * (LOGO_SCALE * 6.0)
    rot = (0.9 if i % 2 else -0.7, 0.3 * (i - 2), -0.8 if i % 3 else 1.1)
    t0 = 0.6 + i * 0.08
    key(s, F(t0), loc=off, rot=rot)
    key(s, F(2.6), loc=(0, 0, 0), rot=(0, 0, 0))
    set_interpolation(s)
    key_ease(s, F(t0), "QUART", "EASE_OUT")
    key_hide(s, 1, True)
    key_hide(s, F(t0), False)
    key_hide(s, F(CHR1) + 1, True)
key_input(chrome_mark, "Alpha", F(CHR0), 1.0)
key_input(chrome_mark, "Alpha", F(CHR1), 0.0)
for g in glass:
    key_hide(g, 1, True)
    key_hide(g, F(CHR0), False)
key_input(frosted, "Alpha", F(CHR0), 0.0)
key_input(frosted, "Alpha", F(CHR1), 1.0)


def mark_fn(f):
    t = T(f)
    ph = 2 * math.pi * (t - LOOP0) / PERIOD
    s_idle = smoothstep(DIS1, 7.0, t)
    yaw = -0.4 * (1 - smoothstep(ASM0, DIS1, t)) + s_idle * (0.175 * math.sin(ph) + 0.03 * math.sin(2 * ph + 0.7))
    pitch = s_idle * 0.05 * math.sin(ph + 1.3)
    roll = s_idle * 0.025 * math.cos(ph)
    sc = 0.55 + 0.45 * smoothstep(DIS0, DIS1, t)
    return dict(rot=(pitch, roll, yaw), loc=(0, 0, s_idle * 0.06 * math.sin(ph + 0.6)), scale=sc)


bake(mark_rig, range(1, N + 1), mark_fn)

# ---- the device: exploded chrome stack that flies in, holds, then drifts apart and fades
dev_rig = add_empty(scene, "DeviceRig")


def dev_fn(f):
    t = T(f)
    yaw = math.radians(-62 + 14 * smoothstep(ASM0, HOLD1, t) + 28 * smoothstep(DIS0, DIS1, t))
    return dict(rot=(math.radians(10), math.radians(-6), yaw))


bake(dev_rig, range(1, F(DIS1) + 2), dev_fn)
parts = build_device(scene, dev_rig, dict(chrome=chrome_dev, dark=chrome_dark_dev, pcb=pcb, chip=chip, perf=perf, lens=lens_mat), spread=1.0)


def spread(t):  # the exploded stack opens up along y as the camera pulls back (tight while the camera is close)
    return 0.75 + 0.95 * smoothstep(ASM0, ASM1, t)


for o, home, rot, delay in parts:
    d = Vector((home.x or (random.random() - 0.5), home.y or (random.random() - 0.5), home.z or (random.random() - 0.5))).normalized()
    d = (d + Vector(((random.random() - 0.5) * 0.8, (random.random() - 0.5) * 0.6, (random.random() - 0.5) * 0.8))).normalized()
    frm = Vector((home.x, home.y * 0.75, home.z)) + d * (7.0 + random.random() * 4.0)
    frot = tuple(r + (random.random() - 0.5) * 3.0 for r in rot)
    t0 = ASM0 + delay * 0.7
    t1 = t0 + 1.0
    dis0 = DIS0 + delay * 0.4

    def part_fn(f, home=home, rot=rot, d=d, frm=frm, frot=frot, t0=t0, t1=t1, dis0=dis0):
        t = T(f)
        p = min(1.0, max(0.0, (t - t0) / (t1 - t0)))
        e = 1 - (1 - p) ** 4  # fast in, soft landing
        h = Vector((home.x, home.y * spread(t), home.z))
        loc = frm.lerp(h, e)
        r = [a + (b - a) * e for a, b in zip(frot, rot)]
        q = smoothstep(dis0, DIS1, t)  # dissolve: drift outward, shrink
        loc = loc + d * 2.0 * q
        return dict(loc=loc, rot=(r[0] + 0.25 * q, r[1] + 0.35 * q, r[2] - 0.2 * q), scale=max(0.0001, 1 - q))

    bake(o, range(F(t0), F(DIS1) + 2), part_fn)
    key_hide(o, 1, True)
    key_hide(o, F(t0), False)
    key_hide(o, F(DIS1) + 1, True)
for m in DEV_MATS:
    key_input(m, "Alpha", F(DIS0 + 0.15), 1.0)
    key_input(m, "Alpha", F(DIS1 - 0.15), 0.0)

# ~450 chrome shards stream in and are absorbed by the device
frag_me = bpy.data.meshes.new("Frag")
bmf = bm_box(1, 1, 1)
bmf.to_mesh(frag_me)
bmf.free()
frag_me.materials.append(chrome_dev)
for i in range(450):
    o = bpy.data.objects.new(f"Frag{i}", frag_me)
    scene.collection.objects.link(o)
    o.parent = dev_rig
    to = Vector(((random.random() - 0.5) * 2.6, (random.random() - 0.5) * 3.6, (random.random() - 0.5) * 3.4))
    d = (to + Vector(((random.random() - 0.5) * 2, (random.random() - 0.5) * 2, (random.random() - 0.5) * 2))).normalized()
    frm = to + d * (5.0 + random.random() * 6.0)
    sz = (0.015 + random.random() * 0.06, 0.015 + random.random() * 0.05, 0.015 + random.random() * 0.06)
    t0 = 0.5 + random.random() * 1.7
    key(o, F(t0), loc=frm, rot=(random.random() * 6, random.random() * 6, random.random() * 6), scale=sz)
    key(o, F(t0 + 0.9), loc=to, rot=(random.random() * 2, random.random() * 2, random.random() * 2), scale=sz)
    key(o, F(t0 + 1.35), loc=to + d * -0.15, scale=0.0001)
    set_interpolation(o)
    key_ease(o, F(t0), "QUART", "EASE_OUT")
    key_hide(o, 1, True)
    key_hide(o, F(t0), False)
    key_hide(o, F(t0 + 1.35) + 1, True)

# blueprint call-outs during the assembly: camera-facing rectangles pinned to the parts + 3D dotted connectors
rect_centres = []
for i in range(26):
    o_, home, rot, delay = parts[random.randrange(len(parts))]
    c = home + Vector(((random.random() - 0.5) * 1.8, -0.35 - random.random() * 0.4, (random.random() - 0.5) * 3.0))
    w, h = 0.08 + random.random() ** 2 * 0.6, 0.08 + random.random() ** 2 * 0.5
    r = mesh_object(scene, f"Rect{i}", bm_rect_frame(w, h, 0.006), guide, smooth=False, parent=dev_rig)
    r.location = c
    con = r.constraints.new("TRACK_TO")
    con.target, con.track_axis, con.up_axis = cam, "TRACK_NEGATIVE_Y", "UP_Z"
    key_hide(r, 1, True)
    key_hide(r, F(GUIDE[0]), False)
    key_hide(r, F(GUIDE[3]) + 1, True)
    rect_centres.append(c)
segs = []
for i in range(30):
    a, b = random.sample(rect_centres, 2)
    segs.append((tuple(a), tuple(b)))
guides = mesh_object(scene, "Guides", bm_dots(segs, spacing=0.05, size=0.007), guide, smooth=False, parent=dev_rig)
key_hide(guides, 1, True)
key_hide(guides, F(GUIDE[0]), False)
key_hide(guides, F(GUIDE[3]) + 1, True)
key_input(guide, "Alpha", F(GUIDE[0]), 0.0)
key_input(guide, "Alpha", F(GUIDE[1]), 0.9)
key_input(guide, "Alpha", F(GUIDE[2]), 0.9)
key_input(guide, "Alpha", F(GUIDE[3]), 0.0)

# ---- blueprint call-outs around the glass mark (static, camera-facing), in before the loop point
bmc = bmesh.new()
RECTS = [((1.4, -0.7, 0.75), 0.55, 0.8), ((-1.5, -0.7, 0.5), 0.36, 0.36), ((-1.6, -0.7, -0.5), 0.6, 0.26),
         ((1.0, -0.7, -1.2), 0.66, 0.3), ((0.15, -0.7, 1.5), 0.26, 0.26), ((-0.35, -0.7, -1.1), 0.3, 0.2)]
for loc, w, h in RECTS:
    bm_rect_frame(w, h, 0.006, bmc, loc)
CONN = [((1.4, -0.7, 0.35), (0.55, -0.7, 0.05)), ((-1.5, -0.7, 0.32), (-0.75, -0.7, 0.05)), ((-1.3, -0.7, -0.5), (-0.9, -0.7, -0.9)),
        ((0.67, -0.7, -1.2), (0.3, -0.7, -0.75)), ((0.15, -0.7, 1.37), (0.15, -0.7, 0.95)), ((-0.2, -0.7, -1.1), (0.2, -0.7, -1.1))]
bm_dots(CONN, spacing=0.045, size=0.008, bm=bmc)
callouts = mesh_object(scene, "Callouts", bmc, callout, smooth=False)
callouts.rotation_euler = (cam.matrix_world.to_3x3() @ Matrix.Rotation(math.pi / 2, 3, "X")).to_euler()  # XZ geometry -> camera view plane
key_input(callout, "Alpha", F(CALL0), 0.0)
key_input(callout, "Alpha", F(CALL1), 0.85)
key_hide(callouts, 1, True)
key_hide(callouts, F(CALL0), False)

def mat_ribbon_v3(name="ribbon3", rim="#D9E9E0", rim_far="#7FA392", side="#2A5242", side_far="#0C2219", rim_rough=0.38, side_rough=0.22, d0=9.0, d1=34.0):
    """Sharplink's walls: a light matte rim on top of each wall (object-space normal pointing up), dark reflective
    inner faces, both dimming with view distance; per-object alpha from Object Info for the fade-in."""
    m, nt, pb, out = _new_mat(name)
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    vt = nt.nodes.new("ShaderNodeVectorTransform")
    vt.vector_type, vt.convert_from, vt.convert_to = "NORMAL", "WORLD", "OBJECT"
    nt.links.new(geo.outputs["Normal"], vt.inputs["Vector"])
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(vt.outputs["Vector"], sep.inputs["Vector"])
    up = nt.nodes.new("ShaderNodeMapRange")  # 0 on the sides -> 1 on the rim
    up.inputs["From Min"].default_value, up.inputs["From Max"].default_value = float(os.environ.get("RIM_LO", "0.45")), float(os.environ.get("RIM_HI", "0.75"))
    nt.links.new(sep.outputs["Z"], up.inputs["Value"])
    camd = nt.nodes.new("ShaderNodeCameraData")
    far = nt.nodes.new("ShaderNodeMapRange")
    far.inputs["From Min"].default_value, far.inputs["From Max"].default_value = d0, d1
    nt.links.new(camd.outputs["View Distance"], far.inputs["Value"])

    def mix_rgb(a, b, fac):
        mx = nt.nodes.new("ShaderNodeMix")
        mx.data_type = "RGBA"
        mx.inputs[6].default_value, mx.inputs[7].default_value = hex2lin(a), hex2lin(b)
        nt.links.new(fac, mx.inputs[0])
        return mx

    rim_c = mix_rgb(rim, rim_far, far.outputs["Result"])
    side_c = mix_rgb(side, side_far, far.outputs["Result"])
    col = nt.nodes.new("ShaderNodeMix")
    col.data_type = "RGBA"
    nt.links.new(up.outputs["Result"], col.inputs[0])
    nt.links.new(side_c.outputs[2], col.inputs[6])
    nt.links.new(rim_c.outputs[2], col.inputs[7])
    nt.links.new(col.outputs[2], pb.inputs["Base Color"])
    for sock, a, b in (("Roughness", side_rough, rim_rough), ("Metallic", 1.0, float(os.environ.get("RIM_METAL", "0.35")))):
        mf = nt.nodes.new("ShaderNodeMix")
        mf.data_type = "FLOAT"
        mf.inputs[2].default_value, mf.inputs[3].default_value = a, b
        nt.links.new(up.outputs["Result"], mf.inputs[0])
        nt.links.new(mf.outputs[0], pb.inputs[sock])
    setin(pb, "Coat Weight", 0.25)
    setin(pb, "Coat Roughness", 0.15)
    oi = nt.nodes.new("ShaderNodeObjectInfo")
    nt.links.new(oi.outputs["Alpha"], pb.inputs["Alpha"])
    m.surface_render_method = "DITHERED"
    return m


# ---- the ribbon field: nested rounded walls on a tilted ground plane behind the mark
field = add_empty(scene, "Field", (0, 4.0, -1.6))
field.rotation_euler = (math.radians(45), 0, 0)
bpy.context.view_layer.update()
Minv = field.matrix_world.inverted()
o_ = Minv @ Vector((0, -11.6, 1.4))
d_ = (Minv @ Vector((0, 0, 0.1))) - o_
hit = o_ + d_ * (-o_.z / d_.z)
# Sharplink's field: thin tall walls, light matte rims, dark reflective faces, dark gaps
ribbon = mat_ribbon_v3("ribbon3", rim=os.environ.get("RIM", "#D9E9E0"), rim_far=os.environ.get("RIM_FAR", "#7FA392"),
                       side=os.environ.get("SIDE", "#3F6E5A"), side_far=os.environ.get("SIDE_FAR", "#10291F"), d1=float(os.environ.get("RIB_D1", "34.0")))
bands = build_ribbon_field(scene, field, ribbon, centre=(hit.x, hit.y), lobe=(hit.x - 5.5, hit.y - 2.5, 1.6, 2.5),
                           n_levels=int(os.environ.get("RIB_N", "40")), spacing=float(os.environ.get("RIB_SP", "0.62")), width=float(os.environ.get("RIB_W", "0.16")),
                           height=float(os.environ.get("RIB_H", "1.3")), warp=0.2, offset=1.4)
log(f"ribbon field: {len(bands)} bands, {sum(len(b.data.vertices) for b in bands)} verts, nest at {hit.x:.2f},{hit.y:.2f}")
STAG = min(0.03, (7.42 - 0.55 - RISE0) / max(1, len(bands) - 1))  # every band settled before the loop point
for k, b in enumerate(bands):
    t0 = RISE0 + k * STAG
    key(b, F(t0), scale=(1, 1, 0.02))
    key(b, F(t0 + 0.55), scale=(1, 1, 1))
    set_interpolation(b)
    key_color(b, F(t0), 0.0)
    key_color(b, F(t0 + 0.4), 1.0)
    key_hide(b, 1, True)
    key_hide(b, F(t0), False)


def field_fn(f):
    t = T(f)
    ph = 2 * math.pi * (t - LOOP0) / PERIOD
    s = smoothstep(RISE0, 7.2, t)
    along = 0.2 * math.sin(ph + 1.1) * s
    return dict(loc=(0.22 * math.sin(ph) * s, 4.0 + along * math.cos(math.radians(45)), -1.6 + along * math.sin(math.radians(45))))


bake(field, range(F(RISE0) - 1, N + 1), field_fn)


# ---- post: fade the bottom of the frame to the page colour (exact sRGB #DFF3E7 on the last row)
PAGE = np.array(hex2srgb01(COL["page"]) + [1.0], dtype=np.float32)


def post_fade(path):
    a = load_pixels(path)  # row 0 = bottom
    h = a.shape[0]
    depth = 1.0 - np.arange(h, dtype=np.float32) / (h - 1)
    g = np.clip((depth - 0.75) / 0.25, 0, 1)
    g = g * g * (3 - 2 * g)
    g = g[:, None, None]
    a = a * (1 - g) + PAGE[None, None, :] * g
    a[..., 3] = 1.0
    save_pixels(path, a, alpha=False)


def samples_for(f):
    if ARGS["samples"]:
        return ARGS["samples"]
    if ARGS["preview"]:
        return 16
    return 48 if f < F(CHR0) else 72


if ARGS["preview"]:
    frames = preview_frames(N)
    if os.environ.get("PV_FRAMES"):
        frames = [int(x) for x in os.environ["PV_FRAMES"].split(",")]
    elif ARGS["frames"]:
        lo, hi = ARGS["frames"]
        frames = [f for f in range(lo, hi + 1)]
    paths = render_frames(scene, NAME + "_pv", frames, os.path.join(OUT_DIR, "preview" + os.environ.get("SHEET", "")), post=post_fade, skip_existing=False, samples_for=samples_for)
    sheet = contact_sheet(paths, os.path.join(OUT, f"{NAME}_preview_sheet{os.environ.get('SHEET', '')}.png"), cols=4)
    log("preview sheet:", sheet)
else:
    lo, hi = ARGS["frames"] or (1, N)
    t0 = time.time()
    paths = render_frames(scene, NAME, range(lo, hi + 1), os.path.join(OUT_DIR, "frames"), post=post_fade, samples_for=samples_for)
    log(f"rendered {len(paths)} frames in {time.time() - t0:.0f}s")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, "hero.blend"))
