"""
sl_coin.py — Sharplink's Investors hero clip (shrp_investors_chrome.webm) rebuilt with a Linse coin, for the Careers and
Support heroes. TRANSPARENT film, 1600x1200, 30 fps, 201 frames (6.7 s), seamless loop.

    Blender -b -P sl_coin.py -- --variant careers --preview      # 12 frames at 25 % -> out/sl_coin_careers/preview/
    Blender -b -P sl_coin.py -- --variant careers                # out/sl_coin_careers/frames/sl_coin_careers_####.png
    Blender -b -P sl_coin.py -- --variant support                # renders only the frames where the back face shows (66-127)
                                                                 # and copies every other frame from the careers render
    TEST=<tag> TEST_FRAMES=1,46,90 Blender -b -P sl_coin.py -- --variant careers --scale 50   # a few test frames
    FORCE=1 ...                                                  # re-render frames that already exist
    then: Blender -b -P sl_encode.py -- sl_coin_careers (and sl_coin_support), hevc_alpha for the Safari mp4

Look: neutral (desaturated) studio HDRI rotated 200 deg + soft area lights placed on the mirror directions of the
surfaces they light (Edge: slat top/front bevels, Seam: bevels between slat tops, Sky/Sky2: slat tops with the
original's left-dark/right-light gradient, Key: coin), energies calibrated against the original's rail tones.
Post: mild lateral chromatic aberration (the original's lens fringing) and the 2D call-outs.

The shot (measured on the original, frame numbers 0-based at 30 fps):
  0-5    empty chrome rail: rectangular slats (cap + body, bevelled), running diagonally from lower left (off frame) to the
         right edge; 135 mm lens, camera 14.6 deg above, 30 deg off the rail axis (fitted to the original's edges, 1.4 px rms).
  5-52   the coin rolls in from the left along the rail top (accelerates, then brakes to a stop at frame centre); the slats
         under it dip and a small bump trails behind it, like keys being pressed.
  48-60  the slat under the coin and its neighbours rise into steps (+0.49 / +1.30 / +1.10 / +0.41), lifting the coin.
  50-76  the coin turns to face the camera (58), spins edge-on (65) and settles showing its back face (76).
  76-118 hold. 118-136 it spins back (edge-on 126, front face 130) while the steps sink (128-138).
  136-172 it rolls back out to the left; the rail is empty again until the loop point.
Blueprint call-outs (thin white boxes and dotted connector lines) ride with the coin; they are drawn in post, in 2D,
from the projected 3D anchor points, like Sharplink's baked overlays.

Units: one slat pitch = 1. The coin: radius 1.95, thickness 0.66, rolling along y = 2.2 on the 3.97-deep rail.
"""
import os, sys, math, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
from bpy_extras.object_utils import world_to_camera_view

ARGS = parse_args()
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
VARIANT = argv[argv.index("--variant") + 1] if "--variant" in argv else "careers"
assert VARIANT in ("careers", "support")
NAME = f"sl_coin_{VARIANT}"
W, H, FPS, N = 1600, 1200, 30, 201
OUT_DIR = os.path.join(OUT, NAME)
os.makedirs(OUT_DIR, exist_ok=True)
ENV = lambda k, d: float(os.environ.get(k, d))  # noqa: E731
FONT = os.path.join(HERE, "sl_assets", "Archivo-700.ttf")

# ---------------------------------------------------------------- measured motion (index = frame - 1)
XT = [0.316, 0.421, 0.528, 0.637, 0.751, 0.871, 0.996, 1.130, 1.271, 1.422, 1.582, 1.753, 1.934, 2.126, 2.331, 2.546, 2.774, 3.014, 3.265, 3.529, 3.803, 4.089, 4.386, 4.693, 5.009, 5.334, 5.668, 6.009, 6.356, 6.709, 7.065, 7.425, 7.786, 8.147, 8.507, 8.864, 9.216, 9.562, 9.898, 10.224, 10.536, 10.830, 11.106, 11.358, 11.584, 11.780, 11.944, 12.073, 12.169, 12.233, 12.270, 12.285, 12.286, 12.286, 12.286, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.290, 12.288, 12.257, 12.163, 11.970, 11.716, 11.417, 11.080, 10.709, 10.311, 9.889, 9.450, 8.997, 8.534, 8.065, 7.595, 7.125, 6.660, 6.202, 5.753, 5.316, 4.892, 4.484, 4.092, 3.718, 3.362, 3.026, 2.709, 2.411, 2.132, 1.872, 1.630, 1.403, 1.192, 0.995, 0.808, 0.631, 0.461, 0.295, 0.145, 0.010, -0.111, -0.220, -0.319, -0.407, -0.487, -0.558, -0.623, -0.681, -0.733, -0.780, -0.822, -0.860, -0.895, -0.925, -0.953, -0.978, -1.001, -1.021, -1.039, -1.056, -1.070, -1.084, -1.095, -1.106]
PT = [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.027, 0.080, 0.153, 0.240, 0.319, 0.400, 0.488, 0.580, 0.672, 0.770, 0.911, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 0.967, 0.910, 0.820, 0.700, 0.551, 0.400, 0.283, 0.180, 0.085, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
GT = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.6, -2.0, -4.4, -8.0, -12.6, -18.0, -23.5, -30.0, -38.7, -50.0, -67.6, -86.0, -98.9, -110.0, -120.0, -130.0, -138.4, -146.0, -153.4, -160.0, -165.6, -170.0, -173.1, -175.0, -175.7, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -176.0, -175.3, -173.6, -171.0, -163.9, -151.9, -140.0, -130.5, -120.0, -105.8, -88.0, -62.2, -38.0, -23.7, -14.0, -7.9, -4.0, -1.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
assert len(XT) == N and len(PT) == N and len(GT) == N, (len(XT), len(PT), len(GT))

# ---------------------------------------------------------------- scene constants
SLAT0 = 4.7911          # x of a slat seam (front seam index 0 of the fit)
DEPTH = 3.9694          # rail depth (y from 0 at the front face to DEPTH at the back)
CAP = 0.44              # cap block height
GAP = 0.024             # gap between slats
R, T = 1.95, 0.66       # coin radius / thickness
YC = 2.2                # coin track (y)
XSTOP = 12.29           # coin resting x (centre of slat 7)
PED = {6: 0.49, 7: 1.30, 8: 1.10, 9: 0.41}   # step heights under the resting coin
PED_DELAY = {6: 1.5, 7: 0.0, 8: 1.0, 9: 2.5}


def slat_x(k):
    return SLAT0 + k + 0.5


# ---------------------------------------------------------------- render setup
scene = reset_scene()
setup_render(scene, W, H, FPS, N, ARGS, samples=int(ENV("SAMPLES", "48")), transparent=True, motion_blur=False, view="Standard", look=None)
scene.eevee.ray_tracing_options.resolution_scale = "1"
scene.eevee.use_fast_gi = False
setup_world(scene, strength=ENV("HDR_STR", "0.5"), gradient=None, rotation=math.radians(ENV("HDR_ROT", "200")))


def neutral_world(sat=0.0):
    """Desaturate the studio HDRI so the chrome stays neutral (the page gradient supplies all colour)."""
    nt = scene.world.node_tree
    env = next(n for n in nt.nodes if n.type == "TEX_ENVIRONMENT")
    bg = next(n for n in nt.nodes if n.type == "BACKGROUND")
    hs = nt.nodes.new("ShaderNodeHueSaturation")
    hs.inputs["Saturation"].default_value = sat
    nt.links.new(env.outputs["Color"], hs.inputs["Color"])
    nt.links.new(hs.outputs["Color"], bg.inputs["Color"])


neutral_world(ENV("HDR_SAT", "0.0"))


def weighted_normals(o):
    """Flat big faces, smooth bevels (hard-surface shading) without touching the geometry."""
    m = o.modifiers.new("wn", "WEIGHTED_NORMAL")
    m.mode, m.weight, m.keep_sharp = "FACE_AREA", 100, True
    return o

# camera fitted to the original (pinhole, no shift): position, yaw 30.1 deg off the rail axis, pitch 14.6 deg down, roll -3.6 deg
CAM = Vector((-19.8683, -53.9881, 19.6101))
PSI, THETA, PHI = 0.525505, 0.254208, -0.063419
fwd = Vector((math.cos(THETA) * math.sin(PSI), math.cos(THETA) * math.cos(PSI), -math.sin(THETA)))
right = Vector((math.cos(PSI), -math.sin(PSI), 0.0))
up = right.cross(fwd)
r2 = math.cos(PHI) * right + math.sin(PHI) * up
u2 = -math.sin(PHI) * right + math.cos(PHI) * up
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens, cam_data.sensor_width, cam_data.sensor_fit = 135.17, 36.0, "HORIZONTAL"
cam_data.clip_start, cam_data.clip_end = 1.0, 400.0
cam = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam)
M = Matrix((r2, u2, -fwd)).transposed()
cam.matrix_world = Matrix.Translation(CAM) @ M.to_4x4()
scene.camera = cam

# lights: big soft studio boxes (neutral white)
TGT = Vector((12.0, 2.0, 1.0))
# placed on the mirror directions of the surfaces they should light (camera looks along +x+y, 14.6 deg down):
#   Edge  -> the bevel between slat tops and fronts (bright edge line), Seam -> the bevels between slat tops,
#   Sky   -> the slat tops (soft gradient, brighter to the right), Key -> shadows/definition on the coin.
add_light(scene, "Edge", TGT + Vector((12, -6, 21)), TGT, ENV("EDGE", "1500"), ENV("EDGE_SIZE", "10"), size_y=4)
add_light(scene, "Seam", TGT + Vector((-6, 21, 12)), TGT, ENV("SEAM", "400"), 6, size_y=3).data.use_shadow = False
add_light(scene, "Sky", TGT + Vector((18, 22, 8)), TGT, ENV("SKY", "340"), 34, size_y=14)      # slat tops, broad (its shadow = the coin's dark contact patch)
add_light(scene, "Sky2", TGT + Vector((20, 20, 8)), TGT, ENV("SKY2", "100"), 16, size_y=8)     # slat tops, brighter to the right
add_light(scene, "Key", TGT + Vector((-14, -16, 18)), TGT, ENV("KEY", "250"), 16, size_y=10)
add_light(scene, "Floor", TGT + Vector((14.5, -25, -7.5)), TGT, ENV("FLOOR", "0"), ENV("FLOOR_SIZE", "30"), size_y=14).data.use_shadow = False   # front faces + coin face
scene.eevee.light_threshold = 0.0002
for L in bpy.data.lights:   # the lights sit 25-30 units away: never let EEVEE cull them by influence distance
    L.use_custom_distance, L.cutoff_distance = True, 300.0

# ---------------------------------------------------------------- materials
rail_mat = mat_chrome("rail", color=hex2lin("#e6e6e6")[:3], rough=ENV("RAIL_ROUGH", "0.30"), coat=0.0)
coin_mat = mat_chrome("coin", color=hex2lin("#e6e6e6")[:3], rough=ENV("COIN_ROUGH", "0.18"), coat=0.3)
edge_mat = mat_chrome("coinEdge", color=hex2lin("#e6e6e6")[:3], rough=ENV("EDGE_ROUGH", "0.3"), coat=0.0)
dark_mat = mat_chrome("coinDark", color=hex2lin(os.environ.get("DARK_COL", "#6e6e6e"))[:3], rough=ENV("DARK_ROUGH", "0.38"), coat=0.0)
field_mat = mat_chrome("coinField", color=hex2lin(os.environ.get("FIELD_COL", "#c6c6c6"))[:3], rough=ENV("FIELD_ROUGH", "0.2"), coat=0.0)
emb_mat = mat_chrome("emblem", color=hex2lin("#ececec")[:3], rough=ENV("EMB_ROUGH", "0.07"), coat=0.5)


# ---------------------------------------------------------------- rail
def slat_bm():
    """One slat in local space: origin at the centre of its top face. Cap block on top, body below a hairline gap."""
    bm = bm_box(1.0 - GAP, DEPTH - 0.004, CAP, bevel=0.05, seg=3)
    bmesh.ops.translate(bm, vec=(0, 0, -CAP / 2), verts=bm.verts[:])
    body = bm_box(1.0 - GAP, DEPTH - 0.004, 9.0, bevel=0.035, seg=2)
    bm_merge(bm, body, loc=(0, 0, -CAP - 0.018 - 4.5))
    return bm


SLATS = {}
for k in range(-12, 31):
    o = weighted_normals(mesh_object(scene, f"Slat{k:+03d}", slat_bm(), rail_mat, smooth=True, sharp_angle=60))
    o.location = (slat_x(k), DEPTH / 2, 0.0)
    SLATS[k] = o


# ---------------------------------------------------------------- coin
def bm_lathe(profile, segs=160):
    """Solid of revolution about the local Y axis. profile: [(r, y), ...], r=0 at both ends (triangle fans there)."""
    bm = bmesh.new()
    rings = []
    for (r, y) in profile:
        if r <= 1e-9:
            rings.append([bm.verts.new((0.0, y, 0.0))])
        else:
            rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / segs), y, r * math.sin(2 * math.pi * i / segs))) for i in range(segs)])
    for a, b in zip(rings[:-1], rings[1:]):
        if len(a) == 1 and len(b) == 1:
            continue
        if len(a) == 1:
            for i in range(segs):
                bm.faces.new((a[0], b[i], b[(i + 1) % segs]))
        elif len(b) == 1:
            for i in range(segs):
                bm.faces.new((a[i], b[0], a[(i + 1) % segs]))
        else:
            for i in range(segs):
                bm.faces.new((a[i], b[i], b[(i + 1) % segs], a[(i + 1) % segs]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def arc_strip(bm, r0, r1, a0, a1, y_base, h, side, segs=None):
    """Raised annular sector (r0..r1, angles a0..a1 rad) standing on the plane y=y_base, height h toward side (-1 front, +1 back)."""
    segs = segs or max(2, int(abs(a1 - a0) / (2 * math.pi) * 180))
    yb, yt = y_base - side * 0.002, y_base + side * h
    grid = []
    for i in range(segs + 1):
        a = a0 + (a1 - a0) * i / segs
        c, s = math.cos(a), math.sin(a)
        grid.append([bm.verts.new((r * c, y, r * s)) for (r, y) in ((r0, yb), (r0, yt), (r1, yt), (r1, yb))])
    for i in range(segs):
        for j in range(4):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][(j + 1) % 4], grid[i][(j + 1) % 4]))
    bm.faces.new(grid[0])
    bm.faces.new(list(reversed(grid[-1])))


def glyph_bm(ch, size, extrude, bevel=0.0):
    """A text glyph as a bmesh (XY plane, baseline at y=0, horizontally centred), extruded +-extrude along Z."""
    cu = bpy.data.curves.new("glyph", "FONT")
    cu.body = ch
    if os.path.exists(FONT):
        cu.font = bpy.data.fonts.load(FONT, check_existing=True)
    cu.size = size
    cu.extrude = extrude
    cu.bevel_depth = bevel
    cu.bevel_resolution = 1
    cu.align_x = "CENTER"
    cu.resolution_u = 6
    ob = bpy.data.objects.new("glyph", cu)
    scene.collection.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    bm = bmesh.new()
    bm.from_mesh(me)
    bpy.data.objects.remove(ob)
    bpy.data.curves.remove(cu)
    bpy.data.meshes.remove(me)
    return bm


def place(dst, src_bm, matrix):
    """Append a copy of src_bm into dst transformed by matrix (src kept)."""
    me = bpy.data.meshes.new("tmp_place")
    src_bm.to_mesh(me)
    tmp = bmesh.new()
    tmp.from_mesh(me)
    bmesh.ops.transform(tmp, matrix=matrix, verts=tmp.verts[:])
    if matrix.determinant() < 0:
        bmesh.ops.reverse_faces(tmp, faces=tmp.faces[:])
    tmp.to_mesh(me)
    tmp.free()
    dst.from_mesh(me)
    bpy.data.meshes.remove(me)


def face_frame(side):
    """Matrix taking glyph space (x right, y up, z out of the face) onto a coin face: front side=-1 faces -Y, back +1 faces +Y.
    Reads correctly when the face is viewed from outside."""
    if side < 0:   # viewer at -Y: right=+X, up=+Z, out=-Y
        return Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
    return Matrix(((-1, 0, 0, 0), (0, 0, 1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))  # viewer at +Y: right=-X, up=+Z, out=+Y


R_RIM = 1.74            # inner edge of the raised rim
REC = 0.075             # field depth below the rim face
FIELD = T / 2 - REC     # |y| of the field plane
BACK_MARK_Z = 0.36      # back face: small mark centre height
BACK_WORD_Z = -0.56     # back face: word baseline


def build_coin(parent):
    # body: lathe profile from the front centre (field) out over the rim, round the edge, back to the back centre
    b = 0.07  # edge bevel
    prof = [(0.0, -FIELD), (R_RIM - 0.03, -FIELD), (R_RIM, -FIELD - 0.02), (R_RIM + 0.02, -T / 2), (R - b, -T / 2),
            (R - b * 0.29, -T / 2 + b * 0.29), (R, -T / 2 + b), (R, T / 2 - b), (R - b * 0.29, T / 2 - b * 0.29), (R - b, T / 2),
            (R_RIM + 0.02, T / 2), (R_RIM, FIELD + 0.02), (R_RIM - 0.03, FIELD), (0.0, FIELD)]
    body = weighted_normals(mesh_object(scene, "CoinBody", bm_lathe(prof, 192), coin_mat, smooth=True, sharp_angle=50, parent=parent))
    body.data.materials.append(edge_mat)
    # the cylindrical side gets the satin material
    body.data.materials.append(field_mat)
    for p in body.data.polygons:
        n = p.normal
        if abs(n.y) < 0.35 and p.center.length > R - 0.08:
            p.material_index = 1
        elif abs(n.y) > 0.9 and math.hypot(p.center.x, p.center.z) < R_RIM - 0.02:
            p.material_index = 2
    details = bmesh.new()   # binary digits, dashes, grooves (raised ridges) on both faces
    darks = bmesh.new()
    g0 = glyph_bm("0", 0.125, 0.012)
    g1 = glyph_bm("1", 0.125, 0.012)
    for side in (-1, 1):
        y_face = side * FIELD
        Fm = face_frame(side)
        # binary ring: glyph tops point outward, read clockwise around the face
        n_ch = 96
        for i in range(n_ch):
            a = math.pi / 2 - 2 * math.pi * i / n_ch          # angle in face space (x right, y up), clockwise from 12 o'clock
            rr = 1.535
            pos = Vector((rr * math.cos(a), rr * math.sin(a), 0.012))
            rot = Matrix.Rotation(a - math.pi / 2, 4, "Z")    # glyph up -> radial outward
            Mg = Matrix.Translation(pos) @ rot
            # face space -> coin local: x_face -> (+/-X), y_face -> Z, z_face -> outward (side*Y)
            Mf = Matrix.Translation((0, y_face, 0)) @ Fm
            place(details, g0 if (i % 2 == 0) else g1, Mf @ Mg)
        # dashed ring (dark dashes, two lengths)
        a = 0.0
        k = 0
        while a < 2 * math.pi - 0.05:
            L = math.radians(7.0 if k % 5 else 2.6)
            arc_strip(darks, 1.375, 1.44, a, a + L, y_face, 0.016, side, segs=6)
            a += L + math.radians(2.2)
            k += 1
        # concentric ridges, interrupted by a flat band (front: diagonal through the centre; back: horizontal, behind
        # the word). Angles are in face space; the back face is mirrored in X.
        if side < 0:
            bdir, boff, bhalf = math.radians(45.0), 0.0, 0.36
        else:
            bdir, boff, bhalf = 0.0, BACK_WORD_Z + 0.13, 0.27
        nx, ny = -math.sin(bdir), math.cos(bdir)      # band normal in face space
        for j in range(12):
            r = 0.52 + 0.068 * j
            steps = 360
            inside = [abs(r * math.cos(2 * math.pi * q / steps) * nx + r * math.sin(2 * math.pi * q / steps) * ny - boff) < bhalf for q in range(steps)]
            if all(inside):
                continue
            q0 = inside.index(True) if any(inside) else 0
            run = None
            for qq in range(steps + 1):
                q = (q0 + qq) % steps
                if not inside[q] and run is None:
                    run = q0 + qq
                if (inside[q] or qq == steps) and run is not None:
                    a0, a1 = 2 * math.pi * run / steps, 2 * math.pi * (q0 + qq) / steps
                    if side < 0:
                        arc_strip(details, r - 0.011, r + 0.011, a0, a1, y_face, 0.016, side)
                    else:
                        arc_strip(details, r - 0.011, r + 0.011, math.pi - a1, math.pi - a0, y_face, 0.016, side)
                    run = None
    g0.free()
    g1.free()
    mesh_object(scene, "CoinDetails", details, dark_mat, smooth=True, sharp_angle=40, parent=parent)
    mesh_object(scene, "CoinDashes", darks, dark_mat, smooth=True, sharp_angle=40, parent=parent)

    # front emblem: the LS mark in relief, prismatic (faceted) bevel so it reads like a cut chrome gem
    s = ENV("EMB_W", "1.9") / 640
    rel = ENV("EMB_RELIEF", "0.12")
    emb = bm_logo_mark(scale=s, depth=(rel + 0.03) / s, bevel=ENV("EMB_BEVEL", "30"), segs=1)
    bmesh.ops.translate(emb, vec=(0, -FIELD - (rel + 0.03) / 2 + 0.03, 45 * s), verts=emb.verts[:])   # lift: optical centre of the triangle
    mesh_object(scene, "EmblemFront", emb, emb_mat, smooth=True, sharp_angle=30, parent=parent)

    # back: small mark above the word (raised chrome lettering)
    s2 = ENV("BACK_MARK_W", "1.05") / 640
    bk = bm_logo_mark(scale=s2, depth=0.10 / s2, bevel=16, segs=1)
    # mirror X so it reads from behind, then lift it to the back field
    bmesh.ops.scale(bk, vec=(-1, 1, 1), verts=bk.verts[:])
    bmesh.ops.reverse_faces(bk, faces=bk.faces[:])
    bmesh.ops.translate(bk, vec=(0, FIELD + 0.10 / 2 - 0.02, BACK_MARK_Z), verts=bk.verts[:])
    word = glyph_bm(VARIANT.upper(), 0.36, 0.035, bevel=0.009)
    xs = [v.co.x for v in word.verts]
    wd = max(xs) - min(xs)
    sc = min(1.0, 1.95 / wd)
    Mw = Matrix.Translation((0, FIELD + 0.035 - 0.01, BACK_WORD_Z)) @ face_frame(1) @ Matrix.Diagonal((sc, sc, 1.0, 1.0))
    place(bk, word, Mw)
    word.free()
    mesh_object(scene, "EmblemBack", bk, emb_mat, smooth=True, sharp_angle=30, parent=parent)
    # dark satin band behind the word (back face), clipped to the inner field: the polished letters read against it
    z0, z1, rr = BACK_WORD_Z - 0.11, BACK_WORD_Z + 0.37, 1.31
    pts = []
    for q in range(17):
        z = z0 + (z1 - z0) * q / 16
        pts.append((math.sqrt(max(0.0, rr * rr - z * z)), z))
    poly = pts + [(-x, z) for (x, z) in reversed(pts)]
    band = bmesh.new()
    yb = FIELD + 0.004
    top = [band.verts.new((x, yb, z)) for (x, z) in poly]
    bot = [band.verts.new((x, FIELD - 0.002, z)) for (x, z) in poly]
    band.faces.new(top)
    band.faces.new(list(reversed(bot)))
    for k in range(len(poly)):
        band.faces.new((top[k], bot[k], bot[(k + 1) % len(poly)], top[(k + 1) % len(poly)]))
    bmesh.ops.recalc_face_normals(band, faces=band.faces[:])
    mesh_object(scene, "BackBand", band, dark_mat, smooth=False, parent=parent)


coin_rig = add_empty(scene, "CoinRig")     # position + yaw
coin_roll = add_empty(scene, "CoinRoll")   # rolling about the coin axis (local Y)
coin_roll.parent = coin_rig
build_coin(coin_roll)


# ---------------------------------------------------------------- animation
def ped_weight(f, k):
    """Pedestal blend for slat k at frame f (fractional delay)."""
    x = (f - 1) - PED_DELAY.get(k, 0.0)
    i = int(math.floor(x))
    if i < 0:
        return PT[0]
    if i >= N - 1:
        return PT[-1]
    t = x - i
    return PT[i] * (1 - t) + PT[i + 1] * t


def coin_state(f):
    i = f - 1
    x = XT[i]
    v = (XT[min(N - 1, i + 1)] - XT[max(0, i - 1)]) / 2
    return x, v, PT[i], math.radians(GT[i])


def wave(k, f):
    """Slat offset from the rolling coin: a dip under it and a bump trailing behind (direction of travel)."""
    x, v, p, g = coin_state(f)
    i = f - 1
    rolling_in = i < 90
    s = 1.0 if rolling_in else -1.0
    u = (slat_x(k) - x) * s
    # amplitude: fades in as the coin enters the frame; the dip deepens and the trailing bump appears as it brakes
    # (the original shows a faint dip at frame 30 and the full key-press pattern from ~40); mirror for the way out
    edge = smoothstep(0.6, 4.0, x)
    if rolling_in:
        amp = edge * (0.3 + 0.7 * smoothstep(30, 44, i))
        bump = 0.30 * smoothstep(34, 46, i)
    else:
        amp = edge * (0.3 + 0.7 * (1 - smoothstep(142, 156, i)))
        bump = 0.14 * (1 - smoothstep(140, 152, i))
    dip = -ENV("DIP", "0.22") * math.exp(-(u / 0.8) ** 2)
    hump = bump * math.exp(-((u + 2.4) / 1.0) ** 2) * edge
    return amp * dip + hump


def slat_offset(k, f):
    pw = ped_weight(f, k)
    return (1 - pw) * wave(k, f) + pw * PED.get(k, 0.0)


def coin_z(f, offs):
    """Coin centre height resting on the slats under it (disc on flat-topped boxes)."""
    x = coin_state(f)[0]
    best = -1e9
    for k, off in offs.items():
        dx = max(0.0, abs(slat_x(k) - x) - (1.0 - GAP) / 2)
        if dx < R:
            best = max(best, off + math.sqrt(R * R - dx * dx))
    return best


OFFS = {}
for f in range(1, N + 1):
    OFFS[f] = {k: slat_offset(k, f) for k in SLATS}
for k, o in SLATS.items():
    bake(o, range(1, N + 1), lambda f, k=k: dict(loc=(slat_x(k), DEPTH / 2, OFFS[f][k])))


def rig_fn(f):
    x, v, p, g = coin_state(f)
    return dict(loc=(x, YC, coin_z(f, OFFS[f])), rot=(0.0, 0.0, g))


def roll_fn(f):
    x = coin_state(f)[0]
    return dict(rot=(0.0, (x - XSTOP) / ENV("ROLL_R", "2.8"), 0.0))   # the original turns ~180 deg over frames 18-48: an effective radius of ~2.8, not 1.95


bake(coin_rig, range(1, N + 1), rig_fn)
bake(coin_roll, range(1, N + 1), roll_fn)


# ---------------------------------------------------------------- blueprint overlays (2D, drawn in post)
def proj(p):
    c = world_to_camera_view(scene, cam, Vector(p))
    return Vector((c.x * W, (1 - c.y) * H))


def coin_point(f, ang_deg, r, y_local=-T / 2, z_extra=0.0):
    """A point on the coin in its yaw frame (not rolling): angle in the face plane (0 = +X, 90 = up)."""
    x, v, p, g = coin_state(f)
    zc = coin_z(f, OFFS[f])
    a = math.radians(ang_deg)
    lx, lz = r * math.cos(a), r * math.sin(a) + z_extra
    ly = y_local
    cx, cy = math.cos(g), math.sin(g)
    return (x + lx * cx - ly * cy, YC + lx * cy + ly * cx, zc + lz)


def rail_point(f, dx, y, k_snap=True):
    """A point on the rail top at x = coin x + dx, depth y (lifted with the slat it lands on)."""
    x = coin_state(f)[0] + dx
    k = int(math.floor(x - SLAT0))
    off = OFFS[f].get(k, 0.0)
    return (x, y, off)


S = W / 2160.0   # the original's pixel sizes, scaled to our width


def overlay_items(f):
    """Boxes (centre px, w, h) and dotted lines (p0, p1) for frame f, plus a global alpha."""
    i = f - 1
    x, v, p, g = coin_state(f)
    boxes, lines = [], []
    # the trailing rail box: parked at the left edge while the rail is empty, follows the coin while it is in frame
    lead_in = smoothstep(0.5, 6.0, x)   # exactly 0 at frame 1 (x=0.316) and after the exit: the parked box loops cleanly
    if p < 0.5:
        if x > 0.75:   # rolling layout, only once the coin is entering the frame (frame 1 / loop end: just the parked box)
            a_top = proj(coin_point(f, 125, R * 0.98))
            a_left = proj(coin_point(f, 182, R * 0.99))
            a_emb = proj(coin_point(f, 20, 0.62, y_local=-T / 2 - 0.12))
            a_mid = proj(coin_point(f, 200, 0.18, y_local=-T / 2 - 0.15))
            b_ahead = proj(rail_point(f, 3.0, 1.6))
            b_tiny = proj(rail_point(f, 1.9, 0.05))
            boxes += [(a_top, 75, 42), (a_left, 34, 57), (a_emb, 97, 100), (a_mid, 22, 34), (b_ahead, 279, 84), (b_tiny, 18, 10)]
            lines += [(a_left, a_emb), (a_left, b_ahead), (a_top, a_mid), (a_top, a_top + (a_left - a_top) * 4.0), (b_tiny, b_tiny + Vector((-700, 330)) * S)]
    else:
        # pedestal layout
        c_top = proj(coin_point(f, 112, R * 1.0))
        c_left = proj(coin_point(f, 160, R * 1.0))
        c_edge = proj(coin_point(f, 200, R * 1.0))
        c_foot = proj(coin_point(f, 250, R * 0.95))
        step_l = proj((slat_x(6) - 0.45, 0.25, OFFS[f][6]))
        step_r1 = proj((slat_x(8) + 0.1, 0.35, OFFS[f][8]))
        step_r2 = proj((slat_x(9) + 0.15, 0.35, OFFS[f][9]))
        big_r = proj((slat_x(10) + 0.9, 0.6, OFFS[f].get(10, 0.0)))
        boxes += [(c_top, 113, 65), (c_left, 66, 119), (c_edge, 45, 50), (c_foot, 67, 46), (c_foot + Vector((-28, 26)) * S, 15, 12),
                  (step_l, 86, 55), (step_l + Vector((-40, 40)) * S, 20, 30), (step_r1, 96, 32), (step_r2, 107, 35), (big_r, 155, 88), (big_r + Vector((-20, -8)) * S, 13, 10)]
        lines += [(c_top, c_top + (c_edge - c_top) * 3.2), (c_foot + Vector((-28, 26)) * S, big_r), (step_l, big_r + Vector((0, 4)) * S),
                  (step_l + Vector((-40, 40)) * S, step_r2), (c_left, c_foot), (step_l + Vector((-40, 40)) * S, step_l + Vector((-300, 700)) * S)]
    # rail box behind the coin (also the box parked at the left edge during the empty part of the loop)
    park = Vector((42 * S, 1470 * S))
    if 0 < x:
        bt = proj(rail_point(f, -2.6, 0.1))
        bt = park.lerp(bt, lead_in)
        wbt = 85 + (248 - 85) * lead_in
        hbt = 35 + (75 - 35) * lead_in
    else:
        bt, wbt, hbt = park, 85, 35
    boxes.append((bt, wbt, hbt))
    if lead_in > 0.3 and p < 0.5 and x > 0.75:
        lines.append((bt, proj(coin_point(f, 182, R * 0.99))))
    vis = 1.0
    return boxes, lines, vis


def _splat(img, xs, ys, a):
    """Additively splat alpha `a` at float pixel positions (bilinear), into img[..., 0] (H, W)."""
    h, w = img.shape
    x0 = np.floor(xs).astype(int)
    y0 = np.floor(ys).astype(int)
    fx, fy = xs - x0, ys - y0
    for dx, dy, wt in ((0, 0, (1 - fx) * (1 - fy)), (1, 0, fx * (1 - fy)), (0, 1, (1 - fx) * fy), (1, 1, fx * fy)):
        xx, yy = x0 + dx, y0 + dy
        m = (xx >= 0) & (xx < w) & (yy >= 0) & (yy < h)
        np.add.at(img, (yy[m], xx[m]), a[m] * wt[m])


def draw_overlay(px, f):
    """Composite the call-outs (white, ~1 px) over straight-alpha RGBA pixels (rows bottom-up), in place."""
    boxes, lines, vis = overlay_items(f)
    h, w = px.shape[:2]
    ink = np.zeros((h, w), dtype=np.float32)
    s = w / W  # render px per full-size px

    def seg(p0, p1, dotted=False):
        p0, p1 = Vector(p0) * s, Vector(p1) * s
        L = (p1 - p0).length
        if L < 0.5:
            return
        n = int(L * 2) + 2
        t = np.linspace(0, 1, n)
        xs = p0.x + (p1.x - p0.x) * t
        ys = p0.y + (p1.y - p0.y) * t
        a = np.full(n, 0.5, dtype=np.float32)
        if dotted:
            period = max(2.5, 6.0 * s)
            a *= ((t * L) % period) < period * 0.5
        _splat(ink, xs, (h - 1) - ys, a)

    for (c, bw, bh) in boxes:
        bw, bh = bw * S, bh * S
        x0, y0, x1, y1 = c.x - bw / 2, c.y - bh / 2, c.x + bw / 2, c.y + bh / 2
        seg((x0, y0), (x1, y0)); seg((x1, y0), (x1, y1)); seg((x1, y1), (x0, y1)); seg((x0, y1), (x0, y0))
    for (p0, p1) in lines:
        seg(p0, p1, dotted=True)
    a_line = np.clip(ink, 0, 1) * ENV("BOX_A", "0.85") * vis
    a_bg = px[..., 3].copy()
    out_a = a_line + a_bg * (1 - a_line)
    for c in range(3):
        px[..., c] = np.where(out_a > 1e-5, (1.0 * a_line + px[..., c] * a_bg * (1 - a_line)) / np.maximum(out_a, 1e-5), px[..., c])
    px[..., 3] = out_a
    return px


def chroma(px):
    """Mild lateral chromatic aberration like the original's lens (red out, blue in, growing toward the corners)."""
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
        v = (c[y0, x0] * (1 - fx) * (1 - fy) + c[y0, x0 + 1] * fx * (1 - fy) + c[y0 + 1, x0] * (1 - fx) * fy + c[y0 + 1, x0 + 1] * fx * fy)
        return v
    a = px[..., 3]
    r = sample(0, 1 - amt)
    b = sample(2, 1 + amt)
    g = px[..., 1] * a
    na = np.maximum(a, 1e-5)
    px[..., 0] = np.where(a > 1e-4, np.clip(r / na, 0, 1), px[..., 0])
    px[..., 2] = np.where(a > 1e-4, np.clip(b / na, 0, 1), px[..., 2])
    return px


def post_for(f):
    def post(p):
        px = load_pixels(p)
        px = chroma(px)
        px = draw_overlay(px, f)
        save_pixels(p, px, alpha=True)
    return post


# ---------------------------------------------------------------- back-face visibility (for re-using frames across variants)
def back_visible(f):
    x, v, p, g = coin_state(f)
    n_back = Vector((-math.sin(g), math.cos(g), 0.0))   # local +Y rotated by yaw g
    to_cam = (CAM - Vector((x, YC, 2.0))).normalized()
    return n_back.dot(to_cam) > -0.12


# ---------------------------------------------------------------- render
def render_list(frames, out_dir, tag):
    os.makedirs(out_dir, exist_ok=True)
    paths = []
    t0 = time.time()
    for j, f in enumerate(frames):
        pth = os.path.join(out_dir, f"{tag}_{f:04d}.png")
        paths.append(pth)
        if os.path.exists(pth) and os.path.getsize(pth) > 0 and not TEST and os.environ.get("FORCE") != "1":
            continue
        scene.frame_set(f)
        scene.render.filepath = pth
        bpy.ops.render.render(write_still=True)
        post_for(f)(pth)
        el = time.time() - t0
        print(f"[{tag}] frame {f} ({j + 1}/{len(frames)}) {el:.0f}s elapsed, ~{el / (j + 1) * (len(frames) - j - 1):.0f}s left", flush=True)
    return paths


TEST = os.environ.get("TEST")
if os.environ.get("OVDEBUG"):
    for f in [int(v) for v in os.environ["OVDEBUG"].split(",")]:
        bx, ln, _ = overlay_items(f)
        print("OV", f, "x=%.3f" % coin_state(f)[0], "boxes", [(round(c.x), round(c.y), w, h) for c, w, h in bx], "lines", [(tuple(round(v) for v in p0), tuple(round(v) for v in p1)) for p0, p1 in ln])
    sys.exit(0)
if TEST:
    frames = [int(v) for v in os.environ.get("TEST_FRAMES", "1,46,90,128").split(",")]
    render_list(frames, os.path.join(OUT_DIR, "test"), f"test_{TEST}")
elif ARGS["preview"]:
    frames = preview_frames(N)
    paths = render_list(frames, os.path.join(OUT_DIR, "preview"), NAME + "_pv")
    log("preview frames:", paths[0], "...")
else:
    lo, hi = ARGS["frames"] or (1, N)
    frames = list(range(lo, hi + 1))
    fdir = os.path.join(OUT_DIR, "frames")
    if VARIANT == "support":
        src = os.path.join(OUT, "sl_coin_careers", "frames")
        keep = []
        for f in frames:
            s_p = os.path.join(src, f"sl_coin_careers_{f:04d}.png")
            if not back_visible(f) and os.path.exists(s_p):
                os.makedirs(fdir, exist_ok=True)
                shutil.copyfile(s_p, os.path.join(fdir, f"{NAME}_{f:04d}.png"))
            else:
                keep.append(f)
        log(f"support: {len(frames) - len(keep)} frames copied from careers, rendering {len(keep)}")
        frames = keep
    t0 = time.time()
    render_list(frames, fdir, NAME)
    log(f"rendered {len(frames)} frames in {time.time() - t0:.0f}s")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, f"{NAME}.blend"))
