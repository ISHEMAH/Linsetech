"""
stack.py — the "stack" clip: 1200x1600 portrait, 30 fps, 9 s (270 frames), TRANSPARENT background.

    Blender -b -P stack.py -- --preview     # 12-frame contact sheet at 25 % (alpha checked over dark/magenta)
    Blender -b -P stack.py                  # full RGBA PNG sequence -> tools/blender/out/stack/frames/

Timeline (seconds; frame = 1 + t*30; the page scrubs this by scroll):
    0.0–3.6  (0–40 %)  all parts converge from above/below into the assembled machine
    3.6–9.0  (40–100 %) assembled, slowly rotating; the icon inside the tube changes:
        3.6 s (40 %)  two chrome people
        4.95 s (55 %) the LS mark on a hexagonal badge
        6.3 s (70 %)  a small server box with two cables
        7.65 s (85 %) two linked rings + a cog
"""
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa

ARGS = parse_args()
W, H, FPS, N = 1200, 1600, 30, 270
NAME = "stack"
OUT_DIR = os.path.join(OUT, NAME)
os.makedirs(OUT_DIR, exist_ok=True)
DUR = (N - 1) / FPS


def F(t):
    return int(round(1 + t * FPS))


def T(f):
    return (f - 1) / FPS


ASM1 = 0.4 * DUR                       # 3.59 s: assembled
SWAPS = [0.4 * DUR, 0.55 * DUR, 0.7 * DUR, 0.85 * DUR]  # icon changes

random.seed(11)
scene = reset_scene()
setup_render(scene, W, H, FPS, N, ARGS, samples=48, transparent=True, motion_blur=False)
scene.eevee.ray_tracing_options.resolution_scale = "2"
setup_world(scene, strength=1.2, gradient=None, rotation=math.radians(200))
add_light(scene, "Key", (-6, -7, 9), (0, 0, 0.5), 1500, 5, color=(0.9, 1.0, 0.94))
add_light(scene, "Rim", (7, 6, 5), (0, 0, 0), 1100, 4, color=(0.45, 1.0, 0.62))
add_light(scene, "Fill", (6, -8, -4), (0, 0, -1), 500, 6, color=(0.9, 1.0, 0.95)).data.use_shadow = False
add_light(scene, "Top", (1, -3, 13), (0, 0, 2), 1600, 7, color=(1.0, 1.0, 1.0)).data.use_shadow = False
CENTER_Z = -0.05
EL = math.radians(7)
D = 11.7
cam = add_camera(scene, (0, -D * math.cos(EL), CENTER_Z + D * math.sin(EL)), (0, 0, CENTER_Z), lens=50)

chrome = mat_chrome("chrome", rough=0.1)
chrome_dark = mat_chrome_dark("chromeDark")
glass = mat_clear_glass("tubeGlass")
dots_mat = mat_emit("dots", "#CDEFD9", 2.0, alpha=0.75)

root = add_empty(scene, "Root")
parts = []  # (obj, home, offset_z, delay)


def part(name, bm, z, off, delay, mat=chrome, rot=(0, 0, 0), xy=(0, 0), sharp=35):
    o = mesh_object(scene, name, bm, mat, sharp_angle=sharp, parent=root)
    o.rotation_euler = rot
    parts.append((o, Vector((xy[0], xy[1], z)), off, delay))
    return o


# crest + cap (6 bolts) + inner cap
part("Crest", bm_pyramid(0.46, 0.7, 4), 3.05, 3.6, 0.0, rot=(0, 0, math.pi / 4))
part("Cap", bm_cyl(1.15, 0.55, 96, bevel=0.05), 2.35, 3.2, 0.05)
part("CapLip", bm_cyl(0.82, 0.08, 96, bevel=0.02), 2.66, 3.2, 0.05)
part("CapInner", bm_cyl(0.78, 0.4, 72, bevel=0.03), 1.9, 3.2, 0.1)
for i in range(6):
    a = i / 6 * 2 * math.pi + 0.3
    part(f"Bolt{i}", bm_cyl(0.07, 0.08, 6, bevel=0.012), 2.66, 3.2, 0.08, xy=(math.cos(a) * 0.95, math.sin(a) * 0.95), sharp=20)
# spring
spring = curve_tube(scene, "Spring", helix_points(0.62, 4, 0.95, 320), 0.07, chrome, parent=root, spline="POLY")
spring.data.resolution_u = 1
parts.append((spring, Vector((0, 0, 1.25)), 2.4, 0.2))
# grooved ring with knurled band + inner ring
part("Ring", bm_cyl(1.22, 0.5, 96, bevel=0.03), -1.0, -1.6, 0.3)
bmk = bmesh.new()
for i in range(36):
    a = i / 36 * 2 * math.pi
    bm_merge(bmk, bm_box(0.06, 0.07, 0.16), loc=(math.cos(a) * 1.24, math.sin(a) * 1.24, 0), rot=(0, 0, a))
bm_torus(1.24, 0.03, 128, 12, bm=bmk)
bm_merge(bmk, bm_torus(1.24, 0.03, 128, 12), loc=(0, 0, 0.15))
bm_merge(bmk, bm_torus(1.24, 0.03, 128, 12), loc=(0, 0, -0.15))
part("Knurl", bmk, -1.0, -1.6, 0.3, mat=chrome_dark)
part("RingInner", bm_cyl(0.95, 0.35, 72, bevel=0.02), -0.6, -1.6, 0.32)
# piston rod, base disc, pillars, bottom disc
part("Rod", bm_cyl(0.16, 0.9, 48, bevel=0.02), -1.5, -2.2, 0.4)
part("BaseTop", bm_cyl(1.35, 0.22, 96, bevel=0.03), -1.95, -3.0, 0.45)
for i in range(12):
    a = i / 12 * 2 * math.pi
    part(f"Pillar{i}", bm_cyl(0.14, 0.95, 32, bevel=0.02), -2.55, -3.2 - (i % 3) * 0.4, 0.5 + (i % 4) * 0.06, xy=(math.cos(a) * 1.08, math.sin(a) * 1.08))
part("BaseBottom", bm_cyl(1.4, 0.2, 96, bevel=0.03), -3.12, -3.6, 0.6)
# glass tube (thin wall) with 7 dotted vertical guides — fade in with the assembly
bmt = bm_cyl(1.0, 2.55, 128, cap=False)
bm_merge(bmt, bm_torus(0.985, 0.018, 128, 10), loc=(0, 0, 1.275))
bm_merge(bmt, bm_torus(0.985, 0.018, 128, 10), loc=(0, 0, -1.275))
tube = part("Tube", bmt, 0.42, 0.0, 0.0, mat=glass)
segs = []
for i in range(7):
    a = i / 7 * 2 * math.pi
    segs.append(((math.cos(a) * 0.5, math.sin(a) * 0.5, -0.75), (math.cos(a) * 0.5, math.sin(a) * 0.5, 1.6)))
guides = mesh_object(scene, "Guides", bm_dots(segs, spacing=0.05, size=0.012), dots_mat, smooth=False, parent=root)
key_input(dots_mat, "Alpha", F(ASM1 * 0.5), 0.0)
key_input(dots_mat, "Alpha", F(ASM1), 0.75)
key_input(glass, "Alpha", 1, 0.0) if False else None

# assembly: every part slides along Z from its offset to its home; the tube fades in via scale-from-centre
for o, home, off, delay in parts:
    t0 = delay * ASM1
    key(o, F(t0), loc=home + Vector((0, 0, off)))
    key(o, F(ASM1), loc=home)
    set_interpolation(o)
    key_hide(o, 1, True)
    key_hide(o, F(t0), False)
key(tube, F(ASM1 * 0.35), scale=(0.0001, 0.0001, 1.0))
key(tube, F(ASM1), scale=(1.0, 1.0, 1.0))
set_interpolation(tube)
key_hide(tube, 1, True)
key_hide(tube, F(ASM1 * 0.35), False)
key_hide(guides, 1, True)
key_hide(guides, F(ASM1 * 0.5), False)


# whole machine: slow continuous turn (scrubbed by scroll)
def root_fn(f):
    t = T(f)
    return dict(rot=(0, 0, -0.35 + 1.15 * t / DUR))


bake(root, range(1, N + 1), root_fn)

# ---- the floating icon pieces inside the tube
icons = []


def icon_group(name):
    g = add_empty(scene, name)
    g.parent = root
    g.location = (0, 0, 0.35)
    icons.append(g)
    return g


# 1: two chrome people
g = icon_group("IconPeople")
for i, (x, y, zh, rh, rb, hb) in enumerate([(-0.28, 0.0, 0.42, 0.14, 0.21, 0.36), (0.3, -0.1, 0.22, 0.12, 0.18, 0.32)]):
    mesh_object(scene, f"Head{i}", bm_sphere(rh), chrome, parent=g).location = (x, y, zh)
    mesh_object(scene, f"Body{i}", bm_cyl(rb, hb, 48, bevel=rb * 0.95, seg=8), chrome, parent=g).location = (x, y, zh - rh - hb / 2 + 0.02)
# 2: the LS mark on a hexagonal badge
g = icon_group("IconBadge")
hexb = mesh_object(scene, "HexBadge", bm_cyl(0.48, 0.09, 6, bevel=0.015), chrome_dark, parent=g, sharp_angle=20)
hexb.rotation_euler = (math.pi / 2, 0, math.pi / 6)
hexb.location = (0, 0.07, 0.05)
ls = mesh_object(scene, "BadgeLS", bm_logo_mark(scale=LOGO_SCALE * 0.22, bevel=5), chrome, parent=g)
ls.location = (0, -0.02, 0.05)
# 3: a small server box with two cables
g = icon_group("IconServer")
srv = mesh_object(scene, "Server", bm_box(0.62, 0.3, 0.34, bevel=0.02), chrome, parent=g)
srv.location = (0, 0, 0.1)
for i, (x, y) in enumerate([(-0.18, -0.1), (0.2, 0.05)]):
    mesh_object(scene, f"Slot{i}", bm_box(0.3, 0.02, 0.05), chrome_dark, parent=g).location = (0.05, -0.16, 0.16 - i * 0.1)
    curve_tube(scene, f"ServerCable{i}", [(x, y, -0.07), (x * 1.3, y * 1.4, -0.3), (x * 0.6, y * 1.8, -0.52)], 0.045, chrome, parent=g)
# 4: two linked rings + a cog
g = icon_group("IconRings")
r1 = mesh_object(scene, "RingA", bm_torus(0.26, 0.06, 96, 16), chrome, parent=g)
r1.location, r1.rotation_euler = (-0.17, 0, 0.05), (math.pi / 2 + 0.3, 0.4, 0)
r2 = mesh_object(scene, "RingB", bm_torus(0.26, 0.06, 96, 16), chrome, parent=g)
r2.location, r2.rotation_euler = (0.17, -0.1, -0.05), (math.pi / 2 + 0.5, -0.4, 0.4)
bmc = bm_cyl(0.16, 0.08, 32)
for i in range(8):
    a = i / 8 * 2 * math.pi
    bm_merge(bmc, bm_box(0.07, 0.06, 0.08), loc=(math.cos(a) * 0.18, math.sin(a) * 0.18, 0), rot=(0, 0, a))
bm_merge(bmc, bm_torus(0.06, 0.02, 32, 8))
cog = mesh_object(scene, "Cog", bmc, chrome, parent=g)
cog.location, cog.rotation_euler = (0.05, 0.1, 0.5), (math.pi / 2, 0, 0)

# icon windows: scale in/out around each swap, spin and bob while visible
IN, OUTT = 0.35, 0.25
for k, g in enumerate(icons):
    t_in = SWAPS[k]
    t_out = SWAPS[k + 1] if k + 1 < len(SWAPS) else DUR + 1
    key_hide(g, 1, True)
    key_hide(g, F(t_in), False)
    if t_out <= DUR:
        key_hide(g, F(t_out) + 1, True)

    def fn(f, k=k, t_in=t_in, t_out=t_out):
        t = T(f)
        s = smoothstep(t_in, t_in + IN, t) * (1 - smoothstep(t_out - OUTT, t_out, t))
        s = max(0.0001, 1.7 * s)
        return dict(scale=(s, s, s), rot=(0, 0, t * 0.6 + k), loc=(0, 0, 0.35 + 0.08 * math.sin(t * 0.9 + k)))

    bake(g, range(max(1, F(t_in) - 1), min(N, F(t_out) + 2) + 1), fn)

# ---- render
if ARGS["preview"]:
    frames = preview_frames(N)
    paths = render_frames(scene, NAME + "_pv", frames, os.path.join(OUT_DIR, "preview"), skip_existing=False)
    sheet = contact_sheet(paths, os.path.join(OUT, f"{NAME}_preview_sheet.png"), cols=4, checker=("#0a1e3c", "#ff00ff"))
    log("preview sheet:", sheet)
else:
    lo, hi = ARGS["frames"] or (1, N)
    t0 = time.time()
    paths = render_frames(scene, NAME, range(lo, hi + 1), os.path.join(OUT_DIR, "frames"))
    log(f"rendered {len(paths)} frames in {time.time() - t0:.0f}s")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, "stack.blend"))
