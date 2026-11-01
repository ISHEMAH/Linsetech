"""
about_mark.py — the About page clips (frosted-glass LS marks), TRANSPARENT background, seamless loops.

    Blender -b -P about_mark.py -- --preview               # hero clip: 12-frame contact sheet at 25 %
    Blender -b -P about_mark.py                            # hero clip: full RGBA PNG sequence -> out/about_mark/frames/
    Blender -b -P about_mark.py -- --clip logo [--preview] # end-of-page mark: 600x600 turntable -> out/about_logo/frames/

Hero ("about_mark", 1000x1400 portrait, 30 fps): Sharplink's about clip is a chain of chrome gems drifting down a
diagonal through the frame, tumbling as they go, tied by a dotted guide and thin blueprint boxes; it loops. Ours is
the same idea with the frosted-glass LS mark: K marks ride one path from above the frame (top right) to below it
(bottom left), each mark's pose, size and call-out boxes are functions of its position u on the path only, and in
one loop every mark advances exactly one slot — so frame N+1 == frame 1 and the clip loops without a seam (it can
also be scrubbed by scroll: the chain then advances one slot over the scrubbed range).

Logo ("about_logo", 600x600, 30 fps): one mark turning 360° on a tilted axis with two blueprint boxes, looping —
the 3D logomark moment at the end of the page (Sharplink's shrp_aboutlogo clip).
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa

ARGS = parse_args()
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
CLIP = argv[argv.index("--clip") + 1] if "--clip" in argv else "hero"

if CLIP == "hero":
    W, H, FPS = 1000, 1400, 30
    N = int(os.environ.get("N", "180"))
    NAME = "about_mark"
else:
    W, H, FPS = 600, 600, 30
    N = int(os.environ.get("N", "150"))
    NAME = "about_logo"
OUT_DIR = os.path.join(OUT, NAME)
os.makedirs(OUT_DIR, exist_ok=True)

scene = reset_scene()
setup_render(scene, W, H, FPS, N, ARGS, samples=int(os.environ.get("SAMPLES", "64")), transparent=True, motion_blur=False, view="Standard", look=None)
scene.eevee.ray_tracing_options.resolution_scale = "1"
setup_world(scene, strength=float(os.environ.get("HDR_STR", "0.6")), gradient=None, rotation=math.radians(float(os.environ.get("HDR_ROT", "35"))))
add_light(scene, "Key", (-7, -8, 9), (0, 0, 0), float(os.environ.get("KEY", "600")), 5, color=(0.9, 1.0, 0.94))
add_light(scene, "Rim", (8, 7, 6), (0, 0, 0), float(os.environ.get("RIM", "500")), 4, color=(0.45, 1.0, 0.62))
add_light(scene, "Fill", (7, -10, -3), (0, 0, 0), 300, 7, color=(0.9, 1.0, 0.95)).data.use_shadow = False
add_light(scene, "Top", (-2, -6, 14), (0, 0, 0), float(os.environ.get("TOP", "400")), 10, color=(0.85, 1.0, 0.9)).data.use_shadow = False

MARK_DEPTH, MARK_BEVEL = 130, 22
frosted = mat_frosted("frosted", tint="#E6FBEF", rough=float(os.environ.get("MARK_ROUGH", "0.12")), thickness=0.55, milk=float(os.environ.get("MILK", "0.10")))
guide = mat_emit("guide", "#DFF3E7", 1.4, alpha=float(os.environ.get("GUIDE_A", "0.75")))
callout = mat_emit("callout", "#EAFBF1", 1.3, alpha=float(os.environ.get("BOX_A", "0.7")))


chrome = mat_chrome("chrome", color=(0.86, 0.9, 0.88), rough=float(os.environ.get("CHROME_ROUGH", "0.12")), coat=0.6)
MARK_MAT = chrome if os.environ.get("MARK_MAT", "chrome" if CLIP == "logo" else "frosted") == "chrome" else frosted


def mark_object(name, parent):
    """The two outlines of the LS mark as one frosted-glass object (path units -> ~2.67 x 2.3 scene units)."""
    return mesh_object(scene, name, bm_logo_mark(depth=MARK_DEPTH, bevel=MARK_BEVEL, segs=1), MARK_MAT, parent=parent)


def box_object(name, w, h, parent):
    o = mesh_object(scene, name, bm_rect_frame(w, h, 0.012), callout, smooth=False, parent=parent)
    o.visible_shadow = False
    return o


if CLIP == "hero":
    # camera: straight on, slightly above; the frame is ~9.6 units tall at the path's mid depth
    LENS, D = 60, 16.0
    add_camera(scene, (0, -D, 0.6), (0, 0, 0.2), lens=LENS)
    K = int(os.environ.get("K", "6"))  # marks on the path; ~4 visible at once
    S = float(os.environ.get("MARK_S", "0.86"))

    def path(u):
        """Position on the chain (u 0 = above the frame, top right; 1 = below it, bottom left), with a slight S bend
        and the marks coming closer to the camera as they descend (they grow, like Sharplink's lower gem)."""
        x = 1.9 - 3.2 * u + 0.45 * math.sin(math.pi * u)
        y = 3.6 - 6.4 * u
        z = 7.9 - 15.0 * u
        return Vector((x, y, z))

    def pose(u):
        """Tumble as a function of u only (seamless): a slow pitch / roll / yaw sweep across the whole path."""
        rx = float(os.environ.get("RX0", "0.9")) - float(os.environ.get("RX1", "2.0")) * u + 0.15 * math.sin(2 * math.pi * u)
        ry = -0.55 + 1.1 * u
        rz = float(os.environ.get("RZ0", "-2.0")) + float(os.environ.get("RZ1", "4.0")) * u
        return (rx, ry, rz)

    def box_spec(u, j):
        """Call-out boxes ride with the mark, screen-aligned, their size and offset breathing with u."""
        if j == 0:
            return Vector((0.62 + 0.18 * math.sin(2 * math.pi * u), -0.05, 0.42 + 0.12 * math.cos(2 * math.pi * u))), (0.9 + 0.25 * math.sin(math.pi * u), 0.66)
        return Vector((-0.78 + 0.1 * math.cos(2 * math.pi * u), -0.05, -0.55 + 0.15 * math.sin(2 * math.pi * u))), (0.5, 1.05 + 0.2 * math.cos(math.pi * u))

    rigs = []
    for i in range(K):
        rig = add_empty(scene, f"Rig{i}")
        spin = add_empty(scene, f"Spin{i}")
        spin.parent = rig
        mark = mark_object(f"Mark{i}", spin)
        boxes = [box_object(f"Box{i}_{j}", 1.0, 1.0, rig) for j in range(2)]
        rigs.append((rig, spin, mark, boxes))

    # static dotted guides along the chain (two strands, offset left/right of the centres)
    segs = []
    M = 60
    for off in (-0.16, 0.16):
        pts = [path(-0.05 + 1.1 * k / M) + Vector((off, -0.4, 0)) for k in range(M + 1)]
        segs += [(tuple(pts[k]), tuple(pts[k + 1])) for k in range(M)]
    mesh_object(scene, "Guides", bm_dots(segs, spacing=0.07, size=0.016), guide, smooth=False).visible_shadow = False

    def u_of(i, f):
        return (i + (f - 1) / N) / K

    for i, (rig, spin, mark, boxes) in enumerate(rigs):
        def rig_fn(f, i=i):
            u = u_of(i, f)
            s = S * (0.8 + 0.4 * u)
            return dict(loc=path(u), scale=(s, s, s))

        def spin_fn(f, i=i):
            return dict(rot=pose(u_of(i, f)))

        bake(rig, range(1, N + 1), rig_fn)
        bake(spin, range(1, N + 1), spin_fn)
        for j, b in enumerate(boxes):
            def box_fn(f, i=i, j=j):
                loc, (bw, bh) = box_spec(u_of(i, f), j)
                return dict(loc=loc, scale=(bw, 1.0, bh))

            bake(b, range(1, N + 1), box_fn)
else:
    # end-of-page logomark: one mark turning on a tilted axis, two blueprint boxes, a short dotted diagonal
    LD = float(os.environ.get("LOGO_D", "5.8"))  # the mark fills ~2/3 of the frame (Sharplink's logomark fills its 280 px box)
    add_camera(scene, (0, -LD, LD * 0.095), (0, 0, 0), lens=50)
    rig = add_empty(scene, "Rig")
    rig.rotation_euler = (0.32, 0.0, 0.18)
    spin = add_empty(scene, "Spin")
    spin.parent = rig
    mark = mark_object("Mark", spin)
    b0 = box_object("Box0", 0.62, 0.5, None)
    b0.location = (-1.0, -0.3, 0.86)
    b1 = box_object("Box1", 0.4, 0.62, None)
    b1.location = (1.08, -0.3, -0.74)
    dots = mesh_object(scene, "Dots", bm_dots([((-1.0, -0.3, 0.86), (1.08, -0.3, -0.74))], spacing=0.06, size=0.014), guide, smooth=False)
    dots.visible_shadow = False

    def spin_fn(f):
        return dict(rot=(0.0, 0.0, 2 * math.pi * (f - 1) / N))

    bake(spin, range(1, N + 1), spin_fn)

# ---- render
TEST = os.environ.get("TEST")  # TEST=<tag>: render one frame (TEST_FRAME, default N/2) to out/<name>/test_<tag>.png
if TEST:
    f = int(os.environ.get("TEST_FRAME", str(N // 2)))
    t0 = time.time()
    render_frames(scene, f"test_{TEST}", [f], OUT_DIR, skip_existing=False)
    log(f"test frame {f}: {time.time() - t0:.1f}s")
elif ARGS["preview"]:
    frames = preview_frames(N)
    paths = render_frames(scene, NAME + "_pv", frames, os.path.join(OUT_DIR, "preview"), skip_existing=False)
    sheet = contact_sheet(paths, os.path.join(OUT, f"{NAME}_preview_sheet.png"), cols=4, checker=("#04150F", "#0B3D2E", "#DFF3E7"))
    log("preview sheet:", sheet)
else:
    lo, hi = ARGS["frames"] or (1, N)
    t0 = time.time()
    paths = render_frames(scene, NAME, range(lo, hi + 1), os.path.join(OUT_DIR, "frames"))
    log(f"rendered {len(paths)} frames in {time.time() - t0:.0f}s")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, f"{NAME}.blend"))
