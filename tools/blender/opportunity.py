"""
opportunity.py — recreation of Sharplink's opportunity clip (shrp_homeopportunity_chrome.webm, 1200x1600, 8.7 s, loops,
transparent) beside the home services list, with the Linse mark in place of their gem.

    Blender -b -P opportunity.py -- --preview            # 12 frames at 25 % -> out/opportunity_preview_sheet.png
    TEST=a TEST_FRAME=1,90 Blender -b -P opportunity.py  # single frames -> out/opportunity/test_a_####.png (half size)
    Blender -b -P opportunity.py                         # 261 RGBA frames -> out/opportunity/frames/
    Blender -b -P sl_encode.py -- opportunity

What the original shows (measured on the reference, 30 fps):
  * a column of polished sheet-metal shells on one axis leaning ~15 deg right at the top, filling the frame from the
    bottom-left corner to the top edge: closed tubes and open C-shells (rolled lips on the cut edges, a narrow slot in
    some), about a third of the frame wide, slightly different radii, short gaps between them;
  * the shells slide up the axis at a steady speed and pass around the core (their gem) at the frame centre, which a
    gripper arm reaching in from the right edge holds still — the core shows through the C-shells' openings and
    disappears inside the closed tubes;
  * the camera is close (wide-ish lens) at the core's height, so the lower shells show their top rims and the upper
    ones the inside of their lower end;
  * it loops seamlessly: the column has moved exactly one shell set after 8.7 s.
"""
import os, sys, math, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
from common import _new_mat

ARGS = parse_args()
W, H, FPS, N = 1200, 1600, 30, 261
NAME = "opportunity"
OUT_DIR = os.path.join(OUT, NAME)
os.makedirs(OUT_DIR, exist_ok=True)


def E(k, d):
    return float(os.environ.get(k, d))


scene = reset_scene()
setup_render(scene, W, H, FPS, N, ARGS, samples=int(E("SAMPLES", 48)), transparent=True, motion_blur=False,
             view="Standard", look=None)
scene.view_settings.exposure = E("EXPOSURE", 0.0)

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


# the camera looks along +Y: tall softboxes left and right give the tubes their long vertical highlights, the dark
# surround (low HDRI strength) their deep reflections, as in the reference
PANELS = [
    ((-0.9, -0.25, 0.1), 0.90, 0.985, E("P_LEFT", 4.0)),     # tall strip front-left: the main highlight down each tube
    ((0.95, -0.1, 0.05), 0.93, 0.99, E("P_RIGHT", 3.0)),     # narrower strip right: the second, thinner highlight
    ((0, 0.15, 1), 0.80, 0.95, E("P_TOP", 1.6)),             # overhead: top rims and the shells' upper inside
    ((-0.2, 0.95, 0.2), 0.88, 0.97, E("P_BACK", 1.2)),       # behind: rim light on the far edges
    ((0.3, -0.9, -0.5), 0.80, 0.94, E("P_LOW", 0.5)),        # low front: lifts the undersides a little
]
setup_studio_world(scene, E("HDR_STR", 0.35), math.radians(E("HDR_ROT", 160)), E("FLOOR", 0.5), PANELS)

# ---------------------------------------------------------------- camera
LENS, CAM_D = E("LENS", 36.0), E("CAM_D", 5.6)
cam = add_camera(scene, (0, -CAM_D, 0), (0, 0, 0), lens=LENS)
cam.data.sensor_fit = "HORIZONTAL"
cam.data.sensor_width = 36.0

# ---------------------------------------------------------------- axis frame
# a: along the axis (up), b: across it to the right (in the image plane), c: toward the camera. The column leans 15 deg
# right at the top and its top tips slightly away from the camera; the whole thing sits a little left of centre.
TILT, LEAN = math.radians(E("TILT", 22.0)), math.radians(E("LEAN", 4.0))
ORIGIN = Vector((E("OX", -0.45), 0.0, E("OZ", -0.15)))
A = Vector((math.sin(TILT), math.sin(LEAN), math.cos(TILT))).normalized()
C_ = Vector((math.cos(TILT), 0.0, -math.sin(TILT))).cross(A).normalized()  # toward the camera (-Y), right x up
B = A.cross(C_).normalized()  # image right, square to the axis
# local x -> b, y -> away from the camera, z -> a (a proper rotation: the bmesh cylinders run along +Z)
AXIS = Matrix((B, -C_, A)).transposed()


def P(a, b=0.0, c=0.0):
    return ORIGIN + A * a + B * b + C_ * c


def axis_quat(spin=0.0):
    """Orientation that maps a local +Z (bmesh cylinder axis) onto the column axis, turned `spin` about it (0 = local +X
    toward image right, 90 deg = away from the camera, 270 = toward it)."""
    return AXIS.to_quaternion() @ Euler((0, 0, spin)).to_quaternion()


# ---------------------------------------------------------------- materials
def mat_metal(name, color=(0.92, 0.93, 0.93), rough=0.16, coat=0.0, aniso=0.0):
    m, nt, pb, out = _new_mat(name)
    setin(pb, "Base Color", color)
    setin(pb, "Metallic", 1.0)
    setin(pb, "Roughness", rough)
    setin(pb, "Coat Weight", coat)
    setin(pb, "Coat Roughness", 0.04)
    if aniso:
        setin(pb, "Anisotropic", aniso)
    m.surface_render_method = "DITHERED"
    return m


SHEET = mat_metal("sheet", rough=E("SHEET_ROUGH", 0.22))
CORE = mat_metal("core", color=(0.95, 0.96, 0.955), rough=E("CORE_ROUGH", 0.07), coat=1.0)
ARM = mat_metal("arm", color=(0.9, 0.91, 0.91), rough=0.12, coat=0.5)
DARK = mat_metal("armDark", color=(0.30, 0.32, 0.32), rough=0.35)

# ---------------------------------------------------------------- shell geometry


def bm_shell(R, L, t, gap_deg=0.0, lip=0.0, slot=None, segs=96):
    """A thin sheet-metal cylinder along +Z centred on the origin: radius R (outer), length L, wall t. gap_deg > 0 cuts an
    opening of that angle centred on +X with a rolled lip (a tube of radius `lip`) along both cut edges; slot = (angle
    deg, width deg, length frac) cuts a narrow window."""
    bm = bmesh.new()
    gap = math.radians(gap_deg)
    a0, a1 = (gap / 2, 2 * math.pi - gap / 2) if gap else (0.0, 2 * math.pi)
    n = max(8, int(segs * (a1 - a0) / (2 * math.pi)))
    closed = not gap
    rings = []
    for (r, z) in ((R, -L / 2), (R, L / 2), (R - t, L / 2), (R - t, -L / 2)):
        ring = []
        for i in range(n if closed else n + 1):
            ang = a0 + (a1 - a0) * i / n
            ring.append(bm.verts.new((r * math.cos(ang), r * math.sin(ang), z)))
        rings.append(ring)
    m = len(rings[0])
    for k in range(4):
        ra, rb = rings[k], rings[(k + 1) % 4]
        for i in range(m if closed else m - 1):
            j = (i + 1) % m
            bm.faces.new((ra[i], ra[j], rb[j], rb[i]))
    if not closed:
        for end in (0, m - 1):  # the cut edges: close the wall's thickness
            bm.faces.new((rings[0][end], rings[1][end], rings[2][end], rings[3][end]) if end == 0 else
                         (rings[3][end], rings[2][end], rings[1][end], rings[0][end]))
        if lip:
            for ang in (a0, a1):
                rr = R - t / 2
                cx, cy = rr * math.cos(ang), rr * math.sin(ang)
                lb = bm_cyl(lip, L, segs=20)
                bm_merge(bm, lb, loc=(cx, cy, 0))
                lb.free()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if slot:
        s_ang, s_w, s_len = slot
        s = math.radians(s_ang)
        cut = bm_box(R * 0.6, 2 * R * math.sin(math.radians(s_w) / 2), L * s_len)
        bm_transform(cut, cut.verts, loc=(R * math.cos(s), R * math.sin(s), 0), rot=(0, 0, s))
        return bm, cut  # cut through a boolean once it is an object (bmesh has no robust boolean)
    return bm, None


SHELLS = [  # (kind, R, L, gap deg, opening azimuth deg (axis_quat's spin: 0 = right, 90 = away, 270 = toward the camera), slot)
    ("tube", 1.20, 2.6, 0, 0, None),
    ("c", 1.26, 1.7, 110, 265, None),
    ("tube", 1.15, 1.4, 0, 0, None),
    ("c", 1.22, 2.3, 80, 20, (200, 8, 0.7)),
    ("tube", 1.24, 3.2, 0, 0, None),
    ("c", 1.29, 1.4, 120, 285, None),
    ("tube", 1.17, 1.5, 0, 0, None),
]
GAP = E("GAP", 0.75)
CYCLE = sum(s[2] for s in SHELLS) + GAP * len(SHELLS)
SPEED = CYCLE / (N / FPS)  # one full shell set per loop: seamless
A_MIN = -CYCLE / 2 + E("A_SHIFT", 0.4)
log(f"cycle {CYCLE:.2f} units, speed {SPEED:.2f}/s")

shell_objs = []
s = 0.0
for i, (kind, R, L, gap_deg, azi, slot) in enumerate(SHELLS):
    bm, cut = bm_shell(R, L, t=0.045, gap_deg=gap_deg, lip=0.05 if gap_deg else 0.0, slot=slot)
    o = mesh_object(scene, f"shell{i}", bm, SHEET, smooth=True, sharp_angle=40)
    if cut is not None:
        apply_boolean(scene, o, [cut])
    o.rotation_mode = "QUATERNION"
    shell_objs.append((o, s + L / 2, math.radians(azi)))
    s += L + GAP


def shell_pose(base, spin, f):
    t = (f - 1) / FPS
    a = (base + SPEED * t - A_MIN) % CYCLE + A_MIN
    return P(a), axis_quat(spin)


for (o, base, spin) in shell_objs:
    for f in range(1, N + 1):
        loc, q = shell_pose(base, spin, f)
        o.location = loc
        o.rotation_quaternion = q
        o.keyframe_insert("location", frame=f)
        o.keyframe_insert("rotation_quaternion", frame=f)
    set_interpolation(o, "LINEAR")
    o.hide_render = bool(os.environ.get("NO_SHELLS"))  # debug: the core and the arm alone

# ---------------------------------------------------------------- core: the Linse mark, standing along the axis
mark_bm = bm_logo_mark(scale=LOGO_SCALE * E("MARK_SCALE", 0.75), depth=E("MARK_DEPTH", 110), bevel=9, segs=4)
core = mesh_object(scene, "core", mark_bm, CORE, smooth=True, sharp_angle=30)
# bm_logo_mark lies in the XZ plane, front toward -Y: AXIS stands it on the column facing the camera (its x along b, its
# up along a), then it turns about the axis to show its depth
core.rotation_mode = "QUATERNION"
core.location = P(E("CORE_A", 0.05), 0.0, 0.0)
core.rotation_quaternion = AXIS.to_quaternion() @ Euler((0, 0, math.radians(E("CORE_TURN", -20)))).to_quaternion() @ \
    Euler((0, math.radians(E("MARK_ROLL", -14)), 0)).to_quaternion()  # rolled back toward upright, so it reads as the mark

# ---------------------------------------------------------------- gripper arm from the right edge
arm_parts = []


def part(name, bm, mat, loc, quat):
    o = mesh_object(scene, name, bm, mat, smooth=True, sharp_angle=35)
    o.rotation_mode = "QUATERNION"
    o.location = loc
    o.rotation_quaternion = quat
    arm_parts.append(o)
    return o


def seg_between(name, p0, p1, r, mat, segs=32):
    d = p1 - p0
    bm = bm_cyl(r, d.length, segs=segs, bevel=min(0.02, r * 0.2), seg=2)
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    return part(name, bm, mat, (p0 + p1) / 2, q)


# joint positions in axis space (a, b, c): the jaws close on the mark's right edge; the arm leaves the frame through
# its right edge a little below the core, its last segment turning up and away (as theirs)
K = E("ARM_K", 1.0)  # overall thickness
GRIP = P(E("GRIP_A", -0.1), E("GRIP_B", 0.95), E("GRIP_C", 0.05))
WRIST = P(-0.32, 1.75, 0.0)
ELBOW = P(-0.62, 2.95, 0.25)
SHOULDER = P(0.35, 5.0, -0.4)
seg_between("upperArm", ELBOW, SHOULDER, 0.2 * K, ARM, segs=40)
part("elbow", bm_sphere(0.3 * K, segs=48, rings=24), ARM, ELBOW, Euler((0, 0, 0)).to_quaternion())
to_wrist = (WRIST - ELBOW).normalized()
seg_between("elbowCollar", ELBOW + to_wrist * 0.22 * K, ELBOW + to_wrist * 0.42 * K, 0.24 * K, DARK, segs=48)
seg_between("forearm", ELBOW, WRIST, 0.16 * K, ARM, segs=40)
seg_between("wristFlange", WRIST - to_wrist * 0.16 * K, WRIST - to_wrist * 0.02 * K, 0.27 * K, ARM, segs=56)
part("wristBall", bm_sphere(0.21 * K, segs=40, rings=20), ARM, WRIST, Euler((0, 0, 0)).to_quaternion())
# gripper body and two jaws, pointing from the wrist to the grip point
dirg = (GRIP - WRIST).normalized()
qg = Vector((0, 0, 1)).rotation_difference(dirg)
seg_between("gripNeck", WRIST, WRIST + dirg * 0.3 * K, 0.12 * K, ARM, segs=32)
part("gripBody", bm_box(0.42 * K, 0.3 * K, 0.26 * K, bevel=0.04), ARM, WRIST + dirg * 0.4 * K, qg)
side = dirg.cross(A).normalized()
reach = (GRIP - WRIST).length
for k, sgn in enumerate((-1, 1)):
    part(f"jaw{k}", bm_box(0.08 * K, 0.16 * K, reach - 0.42 * K, bevel=0.02), ARM, WRIST + dirg * (0.53 * K + (reach - 0.42 * K) / 2) + side * 0.14 * K * sgn, qg)
    part(f"pad{k}", bm_box(0.06 * K, 0.17 * K, 0.14 * K, bevel=0.012), DARK, GRIP - dirg * 0.05 + side * 0.11 * K * sgn, qg)

# a slight, periodic breathing of the whole core + arm (one period per loop, so the seam is invisible)
rig = add_empty(scene, "rig", ORIGIN)
for o in [core] + arm_parts:
    o.parent = rig
    o.matrix_parent_inverse = Matrix.Translation(ORIGIN).inverted()
for f in range(1, N + 1):
    ph = 2 * math.pi * (f - 1) / N
    rig.location = ORIGIN + A * (0.05 * math.sin(ph)) + B * (0.03 * math.sin(2 * ph))
    rig.keyframe_insert("location", frame=f)
set_interpolation(rig, "LINEAR")

# ---------------------------------------------------------------- render


def render_set(frames, out_dir, name, skip_existing=True):
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
        el = time.time() - t0
        print(f"[{name}] frame {f} ({i + 1}/{len(frames)}) {el:.0f}s elapsed, ~{el / (i + 1) * (len(frames) - i - 1):.0f}s left", flush=True)
    return paths


TEST = os.environ.get("TEST")
if TEST:
    if not ARGS["scale"]:
        scene.render.resolution_percentage = 50
    fl = [int(x) for x in os.environ.get("TEST_FRAME", "1").split(",")]
    t0 = time.time()
    paths = render_set(fl, OUT_DIR, f"test_{TEST}", skip_existing=False)
    if len(paths) > 1:
        log("test sheet:", contact_sheet(paths, os.path.join(OUT_DIR, f"test_{TEST}_sheet.png"), cols=min(4, len(paths)), checker=("#7d8a85",)))
    log(f"test frames {fl}: {time.time() - t0:.1f}s")
elif ARGS["preview"]:
    frames = preview_frames(N)
    paths = render_set(frames, os.path.join(OUT_DIR, "preview"), NAME + "_pv", skip_existing=False)
    log("preview sheet:", contact_sheet(paths, os.path.join(OUT, f"{NAME}_preview_sheet.png"), cols=4, checker=("#7d8a85",)))
else:
    lo, hi = ARGS["frames"] or (1, N)
    t0 = time.time()
    paths = render_set(range(lo, hi + 1), os.path.join(OUT_DIR, "frames"), NAME)
    log(f"rendered {len(paths)} frames in {time.time() - t0:.0f}s")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, f"{NAME}.blend"))
