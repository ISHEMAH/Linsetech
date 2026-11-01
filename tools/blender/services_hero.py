"""
services_hero.py — the /services hero loop: 1600x1000, 30 fps, 5 s (150 frames), opaque, seamless (frame 151 == 1).

Sharplink's ethereum-opportunity hero is a short looping machine close-up behind a top-left title. Ours re-uses the
hero film's exploded chrome device (device.py) at its "hold" pose, framed in the right half so the title sits on the
dark top-left: the stack breathes along its explode axis, sways ±7°, chrome shards drift around it and the blueprint
call-outs stay lit. Every motion is a whole number of periods over the loop, so the clip loops without a seam.

    Blender -b -P services_hero.py -- --preview [--scale 40]   # PV_FRAMES (default 1,38,76,113) -> out/services_hero_preview_sheet.png
    Blender -b -P services_hero.py                              # out/services_hero/frames/services_hero_####.png
    Blender -b -P services_encode.py                            # -> public/clips/services_hero_*.{webm,mp4,jpg}

ALPHA=1 renders the Sharplink-style version used by the page hero now: transparent film (no backdrop, no bottom fade
— the page's own dark gradient sits behind it), neutral white lights, frames in out/services_hero_a/frames;
encode it with `Blender -b -P services_encode.py -- alpha` (VP9 + alpha, ProRes 4444 master for HEVC + alpha).
"""
import os, sys, math, random, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
from device import build_device

ARGS = parse_args()
W, H, FPS, N = 1600, 1000, 30, 150
ALPHA = os.environ.get("ALPHA") == "1"
NAME = "services_hero"
OUT_DIR = os.path.join(OUT, NAME + ("_a" if ALPHA else ""))
os.makedirs(OUT_DIR, exist_ok=True)
SPREAD = float(os.environ.get("SPREAD", "1.7"))
SHIFT_X = float(os.environ.get("SHIFT_X", "-0.14"))
CAM_D = float(os.environ.get("CAM_D", "12.5"))


def PH(f, k=1.0, phase=0.0):  # loop phase: k whole periods over the clip
    return 2 * math.pi * k * (f - 1) / N + phase


random.seed(21)
scene = reset_scene()
setup_render(scene, W, H, FPS, N, ARGS, samples=40, transparent=ALPHA, motion_blur=False, view="Standard", look=None)
scene.eevee.ray_tracing_options.resolution_scale = "1"
setup_world(scene, strength=0.9, gradient=None, rotation=math.radians(35))
# neutral lights for the transparent version (all colour comes from the page gradient behind it)
add_light(scene, "Key", (-7, -7, 10), (0, 0, 0), 1600, 5, color=(1.0, 1.0, 1.0) if ALPHA else (0.9, 1.0, 0.94))
add_light(scene, "Rim", (8, 7, 6), (0, 0, 0), 900, 4, color=(1.0, 1.0, 1.0) if ALPHA else (0.45, 1.0, 0.62))
add_light(scene, "Fill", (7, -10, -3), (0, 0, 0), 250, 7, color=(1.0, 1.0, 1.0) if ALPHA else (0.9, 1.0, 0.95)).data.use_shadow = False

# camera: static, slightly above, lens shifted so the device sits in the right half of the frame
cam = add_camera(scene, (0, -CAM_D, 0.11 * CAM_D + 0.12), (0, 0, 0.1), lens=50, shift_x=SHIFT_X)
backdrop = None if ALPHA else add_backdrop(scene, cam, [(0.0, "#DFF3E7"), (0.09, "#B9E4CB"), (0.2, "#4FA87E"), (0.33, "#1C6E4D"), (0.46, "#0F4A37"), (0.6, "#0B3D2E"), (0.78, "#05201A"), (1.0, "#02100A")], depth=70.0, lens=50, aspect=W / H)

chrome_mark = mat_chrome("chromeMark", rough=0.08, coat=0.0)
chrome_dev = mat_chrome("chromeDev", color=(0.92, 0.94, 0.93), rough=0.1, coat=0.0)
chrome_dark_dev = mat_chrome("chromeDarkDev", color=(0.5, 0.56, 0.53), rough=0.26, coat=0.3)
pcb = mat_pcb("pcbDev")
chip = mat_chip("chipDev")
perf = mat_perforated("perfDev")
lens_mat = mat_chrome("lensDev", color=(0.06, 0.12, 0.09), rough=0.05, coat=1.0)
guide = mat_emit("guide", "#DFF3E7", 1.3, alpha=0.85)

# ---- device rig: hold pose of the hero film, swaying
dev_rig = add_empty(scene, "DeviceRig")
YAW0 = math.radians(-48)


def sway(f):
    return math.radians(7) * math.sin(PH(f)) + math.radians(1.5) * math.sin(PH(f, 2, 0.8))


bake(dev_rig, range(1, N + 1), lambda f: dict(rot=(math.radians(10) + 0.03 * math.sin(PH(f, 1, 1.3)), math.radians(-6), YAW0 + sway(f)), loc=(0, 0, 0.05 * math.sin(PH(f, 1, 0.6)))))
parts = build_device(scene, dev_rig, dict(chrome=chrome_dev, dark=chrome_dark_dev, pcb=pcb, chip=chip, perf=perf, lens=lens_mat), spread=1.0)
for i, (o, home, rot, delay) in enumerate(parts):
    d = Vector((home.x or (random.random() - 0.5), home.y or (random.random() - 0.5), home.z or (random.random() - 0.5))).normalized()
    h = Vector((home.x, home.y * SPREAD, home.z))
    phase = random.random() * math.tau
    amp = 0.08 + random.random() * 0.07

    def part_fn(f, h=h, d=d, rot=rot, phase=phase, amp=amp):
        s = math.sin(PH(f, 1, phase))
        return dict(loc=h + d * amp * s, rot=(rot[0] + 0.035 * s, rot[1] + 0.03 * math.cos(PH(f, 1, phase)), rot[2] - 0.025 * s))

    bake(o, range(1, N + 1), part_fn)

# ---- the chrome mark at the core (assembled strokes, same scale as the film's hold)
mark_rig = add_empty(scene, "MarkRig")
for i, p in enumerate(LOGO_PIECES):
    mesh_object(scene, f"Stroke{i}", bm_logo(p, depth=130, bevel=22, segs=1), chrome_mark, parent=mark_rig)
bake(mark_rig, range(1, N + 1), lambda f: dict(rot=(0.03 * math.sin(PH(f, 1, 1.3)), 0.0, -0.1 + sway(f)), loc=(0, 0, 0.05 * math.sin(PH(f, 1, 0.6))), scale=0.55))

# ---- chrome shards drifting on closed orbits around the stack
frag_me = bpy.data.meshes.new("Frag")
bmf = bm_box(1, 1, 1)
bmf.to_mesh(frag_me)
bmf.free()
frag_me.materials.append(chrome_dev)
for i in range(int(os.environ.get("SHARDS", "170"))):
    o = bpy.data.objects.new(f"Frag{i}", frag_me)
    scene.collection.objects.link(o)
    o.parent = dev_rig
    base = Vector(((random.random() - 0.5) * 3.4, (random.random() - 0.5) * 5.2, (random.random() - 0.5) * 4.4))
    sz = (0.012 + random.random() * 0.045, 0.012 + random.random() * 0.04, 0.012 + random.random() * 0.045)
    a, b, c = (random.random() * math.tau for _ in range(3))
    r0 = tuple(random.random() * math.tau for _ in range(3))
    amp = 0.08 + random.random() * 0.18

    def frag_fn(f, base=base, a=a, b=b, c=c, r0=r0, amp=amp, sz=sz):
        return dict(loc=base + Vector((math.sin(PH(f, 1, a)), math.cos(PH(f, 1, b)), math.sin(PH(f, 1, c)))) * amp,
                    rot=(r0[0] + math.sin(PH(f, 1, a)) * 0.8, r0[1] + PH(f, 1), r0[2] + math.cos(PH(f, 1, c)) * 0.8), scale=sz)

    bake(o, range(1, N + 1), frag_fn)

# ---- blueprint call-outs pinned near the parts (camera-facing) + dotted connectors
rect_centres = []
for i in range(20):
    o_, home, rot, delay = parts[random.randrange(len(parts))]
    c = Vector((home.x, home.y * SPREAD, home.z)) + Vector(((random.random() - 0.5) * 1.8, -0.35 - random.random() * 0.4, (random.random() - 0.5) * 3.0))
    w, h = 0.08 + random.random() ** 2 * 0.6, 0.08 + random.random() ** 2 * 0.5
    r = mesh_object(scene, f"Rect{i}", bm_rect_frame(w, h, 0.006), guide, smooth=False, parent=dev_rig)
    r.location = c
    con = r.constraints.new("TRACK_TO")
    con.target, con.track_axis, con.up_axis = cam, "TRACK_NEGATIVE_Y", "UP_Z"
    rect_centres.append(c)
segs = [tuple(map(tuple, random.sample(rect_centres, 2))) for _ in range(24)]
mesh_object(scene, "Guides", bm_dots(segs, spacing=0.05, size=0.007), guide, smooth=False, parent=dev_rig)

# ---- post: fade the bottom of the frame to the page colour (as the hero film)
PAGE = np.array(hex2srgb01(COL["page"]) + [1.0], dtype=np.float32)


def post_fade(path):
    a = load_pixels(path)  # row 0 = bottom
    hgt = a.shape[0]
    depth = 1.0 - np.arange(hgt, dtype=np.float32) / (hgt - 1)
    g = np.clip((depth - 0.75) / 0.25, 0, 1)
    g = g * g * (3 - 2 * g)
    a = a * (1 - g[:, None, None]) + PAGE[None, None, :] * g[:, None, None]
    a[..., 3] = 1.0
    save_pixels(path, a, alpha=False)


POST = None if ALPHA else post_fade
if ARGS["preview"]:
    frames = [int(x) for x in os.environ.get("PV_FRAMES", "1,38,76,113").split(",")]
    paths = render_frames(scene, NAME + "_pv", frames, os.path.join(OUT_DIR, "preview"), post=POST, skip_existing=False)
    log("preview sheet:", contact_sheet(paths, os.path.join(OUT, f"{NAME}_preview_sheet.png"), cols=2, cell_w=800))
else:
    lo, hi = ARGS["frames"] or (1, N)
    t0 = time.time()
    paths = render_frames(scene, NAME, range(lo, hi + 1), os.path.join(OUT_DIR, "frames"), post=POST)
    log(f"rendered {len(paths)} frames in {time.time() - t0:.0f}s")
