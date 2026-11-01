"""
sl_press.py — recreation of Sharplink's "Ethereum Opportunity" hero clip (shrp_opportunityhero_chrome.webm, 2160x1620,
5 s seamless loop, transparent) with the Linse LS mark in place of the ETH gem.

    Blender -b -P sl_press.py -- --preview          # 12 frames at 25 % -> out/sl_press_preview_sheet.png
    TEST=a TEST_FRAME=37 Blender -b -P sl_press.py   # one frame -> out/sl_press/test_a.png (half size unless --scale)
    Blender -b -P sl_press.py                        # 150 RGBA frames -> out/sl_press/frames/
    Blender -b -P sl_encode.py -- sl_press           # -> public/clips/sl_press_*

What the original does (measured frame by frame on the reference, 30 fps, frames 1-based):
  * static camera (long lens, ~137 mm on 36 mm, 26 deg down, 25 deg yaw) on a pick-and-place machine: a chrome board on
    a conveyor that crosses the frame diagonally, the faceted gem lying on the board, a six-nozzle head hanging from a
    gantry beam at the top right, a finned heatsink bottom-left and PCIe-like slots bottom-centre; the left of the frame
    is faded to transparent by a linear ramp (alpha 0 at the left edge -> 1 at ~38 % of the width) and blurred.
  * the head slides right by 4.3 % of the frame width over frames 42-53 and back over 81-93 (smoothstep).
  * eight fast dips (4 frames down, 1-2 held on contact, 3 up): M1 @37, M3 @48-49, M3 @54, M6 @60-61, M2 @84-85,
    M5 @91-92, M1 @97-98, M5 @109 (modules numbered left to right).
  * every contact spawns a thin white call-out: a screen-aligned square (grows 50 -> 100 % in ~4 frames, ~90 px at
    2160 wide, held ~0.5 s) or a rectangle lying on the board around a component.
Everything is a function of the frame number and frame 151 == frame 1, so the clip loops without a seam.
"""
import os, sys, math, random, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
from bpy_extras.object_utils import world_to_camera_view

ARGS = parse_args()
W, H, FPS, N = 1600, 1200, 30, 150
NAME = "sl_press"
OUT_DIR = os.path.join(OUT, NAME)
os.makedirs(OUT_DIR, exist_ok=True)


def E(k, d):
    return float(os.environ.get(k, d))


random.seed(7)
scene = reset_scene()
setup_render(scene, W, H, FPS, N, ARGS, samples=int(E("SAMPLES", 48)), transparent=True, motion_blur=False,
             view="Standard", look=None)
scene.eevee.ray_tracing_options.resolution_scale = "1"
scene.view_settings.exposure = E("EXPOSURE", 0.0)


def setup_studio_world(scene, hdr_str, hdr_rot, floor, panels):
    """Reflection environment: the studio HDRI (its bright cyclorama floor darkened to `floor`) plus soft circular
    'softbox' panels [(direction, cos_outer, cos_inner, strength), ...]. Film is transparent, so it only shows in the
    chrome."""
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
    # direction (normalised) for the masks
    nrm = nt.nodes.new("ShaderNodeVectorMath")
    nrm.operation = "NORMALIZE"
    nt.links.new(tc.outputs["Generated"], nrm.inputs[0])
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(nrm.outputs[0], sep.inputs[0])
    flo = nt.nodes.new("ShaderNodeMapRange")  # 1 above the horizon .. `floor` below
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
    bg.inputs["Strength"].default_value = 1.0
    nt.links.new(acc, bg.inputs["Color"])
    nt.links.new(bg.outputs[0], out.inputs["Surface"])
    return w


# camera forward on the ground (for placing the softboxes relative to the view)
_fx, _fy = -math.sin(math.radians(E("YAW", 24.8543))), math.cos(math.radians(E("YAW", 24.8543)))
PANELS = [
    ((0, 0, 1), 0.75, 0.92, E("P_TOP", 1.0)),                                                   # overhead
    ((_fx * 0.9 + E("P_BACK_DX", 0.5), _fy * 0.9, 0.44), E("P_BACK_C0", 0.86), 0.97, E("P_BACK", 1.1)),  # what the board reflects
    ((-_fx, -_fy, -0.35), 0.70, 0.92, E("P_FRONT", 0.35)),                                       # low front: camera-facing faces
    ((1.0, 0.3, -0.2), 0.85, 0.96, E("P_RIGHT", 1.3)),                                          # right-facing faces
    ((-1.0, 0.1, 0.2), 0.90, 0.98, E("P_LEFT", 0.6)),                                           # left strip
    ((-0.38, -0.81, -0.44), 0.80, 0.95, E("P_FL", 0.12)),                                        # front-left low: -Y faces
]
setup_studio_world(scene, E("HDR_STR", 0.06), math.radians(E("HDR_ROT", 200)), E("FLOOR", 0.02), PANELS)

# ---------------------------------------------------------------- camera (fit to the reference's board corners)
CAM_LOC = Vector((E("CAM_X", 45.1175), E("CAM_Y", -113.5764), E("CAM_Z", 63.8104)))
PITCH, YAW = math.radians(E("PITCH", 26.2501)), math.radians(E("YAW", 24.8543))
cd = bpy.data.cameras.new("Cam")
cd.lens, cd.sensor_fit, cd.sensor_width = E("LENS", 137.24), "HORIZONTAL", 36.0
cd.clip_start, cd.clip_end = 1.0, 1000.0
cam = bpy.data.objects.new("Cam", cd)
scene.collection.objects.link(cam)
cam.location = CAM_LOC
cam.rotation_euler = (math.radians(90) - PITCH, 0.0, YAW)
scene.camera = cam
focus = add_empty(scene, "Focus", (E("FOCUS_X", 0.0), E("FOCUS_Y", -0.5), E("FOCUS_Z", 1.0)))
cd.dof.use_dof = os.environ.get("DOF", "1") == "1"
cd.dof.focus_object = focus
cd.dof.aperture_fstop = E("FSTOP", 0.35)
scene.eevee.bokeh_max_size = 60

# ---------------------------------------------------------------- lights
add_light(scene, "Top", (E("TOP_X", -6), E("TOP_Y", -4), 42), (0, 0, 0), E("TOP", 100), 34, color=(1, 1, 1))
add_light(scene, "BoardLight", (_fx * 54, _fy * 54, 27), (0, 0, 0), E("BOARD", 0), 30, color=(1, 1, 1))
add_light(scene, "Key", (-40, -50, 30), (0, 0, 2), E("KEY", 150), 18, color=(1, 1, 1))
add_light(scene, "Rim", (40, 20, 22), (0, 0, 3), E("RIM", 300), 14, color=(1, 1, 1))
add_light(scene, "HeadKey", (-30, -45, 25), (0, -0.5, 12), E("HEADKEY", 600), 16, color=(1, 1, 1))
add_light(scene, "HeadFill", (-15, -33, -6), (0, -0.5, 12), E("HEADFILL", 900), 10, color=(1, 1, 1)).data.use_shadow = False

# ---------------------------------------------------------------- materials (neutral chrome, no tint)
chrome = mat_chrome("chrome", color=(0.80, 0.80, 0.80), rough=E("CHROME_R", 0.12), coat=0.0)
chrome_dark = mat_chrome("chromeDark", color=(0.55, 0.55, 0.55), rough=0.2, coat=0.0)
housing_face = mat_chrome("housingFace", color=(0.42, 0.42, 0.42), rough=0.18, coat=0.0)
satin = mat_chrome("satin", color=(0.85, 0.85, 0.85), rough=E("SATIN_R", 0.34), coat=0.0)
setin(satin.node_tree.nodes["Principled BSDF"], "Metallic", E("SATIN_MET", 0.75))
part = mat_chrome("part", color=(0.80, 0.80, 0.80), rough=0.24, coat=0.0)
mark_mat = mat_chrome("markChrome", color=(0.86, 0.86, 0.86), rough=E("MARK_R", 0.07), coat=0.0)
needle = mat_chrome("needle", color=(0.9, 0.9, 0.9), rough=0.05, coat=0.0)
brushed = mat_chrome("brushed", color=(0.85, 0.85, 0.85), rough=E("BODY_R", 0.2), coat=0.0)
setin(brushed.node_tree.nodes["Principled BSDF"], "Metallic", E("BODY_MET", 1.0))
housing_mat = mat_chrome("housing", color=(0.72, 0.72, 0.72), rough=0.16, coat=0.0)
setin(housing_mat.node_tree.nodes["Principled BSDF"], "Metallic", E("HOUS_MET", 1.0))
black = bpy.data.materials.new("black")
black.use_nodes = True
setin(black.node_tree.nodes["Principled BSDF"], "Base Color", (0.004, 0.004, 0.004))
setin(black.node_tree.nodes["Principled BSDF"], "Roughness", 1.0)
setin(black.node_tree.nodes["Principled BSDF"], "Specular IOR Level", 0.0)
label = bpy.data.materials.new("label")
label.use_nodes = True
setin(label.node_tree.nodes["Principled BSDF"], "Base Color", (0.01, 0.01, 0.01))
setin(label.node_tree.nodes["Principled BSDF"], "Roughness", 0.3)


def box(name, cx, cy, cz, sx, sy, sz, mat, bevel=0.0, seg=2, parent=None):
    o = mesh_object(scene, name, bm_box(sx, sy, sz, bevel, seg), mat, parent=parent)
    o.location = (cx, cy, cz)
    return o


def boxes_merged(name, specs, mat, parent=None, bevel=0.0):
    """One mesh from many boxes: specs = [(cx, cy, cz, sx, sy, sz), ...]."""
    bm = bmesh.new()
    for (cx, cy, cz, sx, sy, sz) in specs:
        bm_merge(bm, bm_box(sx, sy, sz, bevel, 1) if bevel > 0 else bm_box(sx, sy, sz), loc=(cx, cy, cz))
    return mesh_object(scene, name, bm, mat, parent=parent)


# ---------------------------------------------------------------- board (12.2 x 10, top at z = 0) and its parts
BL, BD, BT = 12.2, 10.0, 0.16
box("Board", 0, 0, -BT / 2, BL, BD, BT, satin, bevel=0.02)
parts = []
labels = []
# chips with pin rows (two of them sit under the board call-outs at the left and right)
CHIPS = [(-5.25, 2.45, 1.0, 1.5, 0.3, True), (4.62, 1.1, 1.05, 1.5, 0.28, True), (-3.3, 3.3, 1.6, 0.55, 0.22, False),
         (-4.0, -1.6, 1.7, 0.6, 0.22, False), (-3.7, -3.2, 1.2, 0.8, 0.35, False), (2.6, -2.6, 1.6, 0.5, 0.2, False),
         (3.6, 3.6, 1.1, 0.7, 0.3, False), (-1.8, 4.1, 0.9, 0.5, 0.25, False), (2.2, 2.6, 0.8, 0.8, 0.3, False)]
for (cx, cy, sx, sy, sz, rot90) in CHIPS:
    parts.append((cx, cy, sz / 2, sx, sy, sz))
    npin = int(sx / 0.16)
    for k in range(npin):
        px = cx - sx / 2 + (k + 0.5) * sx / npin
        for side in (-1, 1):
            parts.append((px, cy + side * (sy / 2 + 0.06), 0.05, 0.06, 0.14, 0.1))
# small passives in rows, pads, posts
for k in range(70):
    cx, cy = random.uniform(-5.8, 5.8), random.uniform(-4.6, 4.6)
    if abs(cx - 0.3) < 2.6 and abs(cy + 0.3) < 2.4:
        continue  # under the mark
    if random.random() < 0.5:
        parts.append((cx, cy, 0.06, 0.28, 0.14, 0.12))
    else:
        parts.append((cx, cy, 0.09, 0.18, 0.18, 0.18))
for k in range(30):  # flat pads / traces
    cx, cy = random.uniform(-5.9, 5.9), random.uniform(-4.8, 4.8)
    if random.random() < 0.6:
        parts.append((cx, cy, 0.01, random.choice((0.5, 0.8, 1.2)), 0.05, 0.02))
    else:
        parts.append((cx, cy, 0.01, 0.05, random.choice((0.5, 0.8)), 0.02))
boxes_merged("Parts", parts, part, bevel=0.012)
for (cx, cy) in ((3.9, -3.9), (-2.6, -4.3)):
    box(f"Label{cx}", cx, cy, 0.012, 0.9, 0.32, 0.02, label)
for (cx, cy, r) in ((-2.9, -4.0, 0.22), (1.2, 4.2, 0.18), (5.2, -2.0, 0.2)):
    o = mesh_object(scene, "Cap", bm_cyl(r, 0.35, 32, bevel=0.03), part)
    o.location = (cx, cy, 0.175)
# a tall capacitor under the first nozzle: the reference's M1 lands ~1.8 units above the board
CAP_H = E("CAP_H", 1.8)
o = mesh_object(scene, "TallCap", bm_cyl(0.34, CAP_H, 40, bevel=0.05), part)
o.location = (E("X_M1", -3.83), E("Y_ROW", -0.5), CAP_H / 2)

# ---------------------------------------------------------------- the LS mark lying on the board (faceted chrome strokes)
MARK_W = E("MARK_W", 7.0)  # world width of the 640-unit mark
MS = MARK_W / 640.0
mark_rig = add_empty(scene, "MarkRig", (E("MARK_X", 0.4), E("MARK_Y", -2.2), E("MARK_Z", 0.0)))
TILT = math.radians(E("MARK_TILT", 32))
mark_rig.rotation_euler = (math.radians(-90) + TILT, 0, math.radians(E("MARK_YAW", 22)))
MARK_DEPTH, MARK_BEVEL = E("MARK_DEPTH", 120), E("MARK_BEVEL", 26)
for i, p in enumerate(LOGO_PIECES):
    o = mesh_object(scene, f"Stroke{i}", bm_logo(p, scale=MS, depth=MARK_DEPTH, bevel=MARK_BEVEL, segs=1), mark_mat,
                    parent=mark_rig)
# rest the tilted mark on the board: lowest point at z = LIFT
bpy.context.view_layer.update()
zmin = min((mark_rig.matrix_world @ (o.matrix_local @ Vector(v.co))).z for o in mark_rig.children for v in o.data.vertices)
mark_rig.location.z += E("MARK_LIFT", 0.25) - zmin

# ---------------------------------------------------------------- conveyor: bed + rails + clamp blocks
X0R, X1R = -70.0, 40.0
XM, XL = (X0R + X1R) / 2, X1R - X0R
box("Bed", XM, 0, -1.6, XL, 12.0, 0.2, black)
# back rail (far side): lip under the board edge, the rail bar, a lower outer bar
box("BackLip", XM, 5.05, -0.4, XL, 0.6, 0.4, chrome_dark)
box("BackRail", XM, 5.5, -0.2, XL, 0.45, 1.3, chrome, bevel=0.06)
box("BackRail2", XM, 6.3, -0.45, XL, 0.7, 0.8, chrome_dark, bevel=0.06)
box("BackGroove", XM, 5.92, -0.3, XL, 0.06, 1.0, black)
# front rail (near side): lip, wide bright top, then the big housing face down to the motherboard
FR_Y0, FR_Y1, FR_Z = E("FR_Y0", -5.2), E("FR_Y1", -7.4), E("FR_Z", 0.25)
box("FrontLip", XM, -5.05, -0.4, XL, 0.6, 0.4, chrome_dark)
box("FrontRail", XM, (FR_Y0 + FR_Y1) / 2, (FR_Z - 1.2) / 2, XL, FR_Y0 - FR_Y1, FR_Z + 1.2, chrome, bevel=0.08)
_mz = E("MOBO_Z", -5.0)
box("FrontHousing", XM, FR_Y1 + 0.3, (FR_Z - 0.1 + _mz) / 2, XL, 0.6, FR_Z - 0.1 - _mz, housing_face, bevel=0.06)
# clamp blocks at the board corners
box("ClampBL", -7.6, 5.55, 0.6, 3.2, 0.62, 0.3, chrome, bevel=0.03)
box("ClampFL", -7.4, -5.75, FR_Z + 0.15, 2.8, 0.9, 0.3, chrome, bevel=0.03)
box("ClampFR", 7.9, -5.75, FR_Z + 0.15, 3.4, 0.9, 0.3, chrome, bevel=0.03)

# ---------------------------------------------------------------- foreground: motherboard, heatsink, slots
MOBO_Z = E("MOBO_Z", -5.0)
box("Mobo", -5, -20, MOBO_Z - 0.1, 70, 26, 0.2, black)
# heatsink: fins in the YZ plane stacked along X (back-top-left corner fit to the reference at (0.21, 0.665))
HS_X, HS_Y, HS_TOP, HS_DEPTH = E("HS_X", -13.97), E("HS_Y", -10.33), E("HS_TOP", 0.5), E("HS_DEPTH", 9.0)
hs = add_empty(scene, "Heatsink", (HS_X, HS_Y, HS_TOP))
NFIN, FIN_P = 10, E("FIN_P", 0.42)
fin_h = HS_TOP - MOBO_Z
for k in range(NFIN):
    box(f"Fin{k}", k * FIN_P, -HS_DEPTH / 2, -fin_h / 2, 0.11, HS_DEPTH, fin_h, chrome_dark, bevel=0.03, parent=hs)
box("HsWall", NFIN * FIN_P + 0.6, -HS_DEPTH / 2, -fin_h / 2, 1.2, HS_DEPTH, fin_h, housing_face, bevel=0.06, parent=hs)
box("HsBase", NFIN * FIN_P / 2, -HS_DEPTH / 2, -fin_h + 0.6, NFIN * FIN_P + 1.8, HS_DEPTH, 1.2, chrome_dark, parent=hs)
# slots (PCIe-like): two long connectors with a groove and rows of small teeth openings
SL_X, SL_Y, SL_TOP = E("SL_X", -6.4), E("SL_Y", -9.2), E("SL_TOP", -4.3)
slots = add_empty(scene, "Slots", (SL_X, SL_Y, SL_TOP))
for j, dy in enumerate((0.0, -1.35)):
    box(f"Slot{j}", 11.0, dy - 0.5, -(SL_TOP - MOBO_Z) / 2, 22.0, 1.0, SL_TOP - MOBO_Z, satin, bevel=0.03, parent=slots)
    box(f"SlotGroove{j}", 11.6, dy - 0.5, 0.0, 20.4, 0.26, 0.04, black, parent=slots)
    teeth = [(1.3 + t * 0.21, dy - 0.5 + side * 0.24, 0.0, 0.08, 0.13, 0.04) for t in range(98) for side in (-1, 1)]
    boxes_merged(f"SlotTeeth{j}", teeth, black, parent=slots)
    box(f"SlotKey{j}", 0.35, dy - 0.5, 0.0, 0.3, 0.3, 0.04, black, parent=slots)
box("Jumper", -1.2, -1.2, 0.2, 0.7, 1.1, 1.2, chrome, bevel=0.04, parent=slots)
CN_X, CN_Y, CN_TOP = E("CN_X", -6.0), E("CN_Y", -14.4), E("CN_TOP", -4.5)
conn = add_empty(scene, "Conn", (CN_X, CN_Y, CN_TOP))
box("ConnBody", 4.0, -0.4, -(CN_TOP - MOBO_Z) / 2, 8.0, 0.8, CN_TOP - MOBO_Z, satin, bevel=0.03, parent=conn)
boxes_merged("ConnTeeth", [(0.3 + t * 0.27, -0.95, -0.15, 0.12, 0.35, 0.3) for t in range(28)], chrome, parent=conn)

# ---------------------------------------------------------------- the head: six nozzle modules, back plate, gantry beam
X_M1, PITCH_M, Y_ROW, Z_TIP = E("X_M1", -3.83), E("PITCH_M", 1.49), E("Y_ROW", -0.5), E("Z_TIP", 5.4)
SHIFT = E("SHIFT", 1.63)  # head slide (world X) between the two rest poses
head = add_empty(scene, "Head", (0, 0, 0))
CONE_L, CONE_R, FL_R, COL_L, COL_R = 1.9, 0.3, 0.46, 0.9, 0.3
HOUS_W, HOUS_D, HOUS_H, LIP_H = 1.40, 1.25, 3.0, 0.36
BODY_H = 24.0


def module_bm():
    """One nozzle module, origin at the needle tip (z up)."""
    bm = bmesh.new()
    cone = bmesh.new()
    bmesh.ops.create_cone(cone, cap_ends=True, cap_tris=False, segments=40, radius1=0.004, radius2=CONE_R, depth=CONE_L)
    bm_merge(bm, cone, loc=(0, 0, CONE_L / 2))
    bm_merge(bm, bm_cyl(FL_R, 0.06, 48, bevel=0.012), loc=(0, 0, CONE_L + 0.03))
    bm_merge(bm, bm_cyl(COL_R, COL_L, 40, bevel=0.03), loc=(0, 0, CONE_L + 0.06 + COL_L / 2))
    bm_merge(bm, bm_cyl(COL_R * 1.12, 0.12, 40, bevel=0.02), loc=(0, 0, CONE_L + 0.06 + COL_L * 0.72))
    z0 = CONE_L + 0.06 + COL_L
    bm_merge(bm, bm_box(HOUS_W + 0.04, HOUS_D + 0.04, LIP_H, 0.03, 1), loc=(0, 0, z0 + LIP_H / 2))
    bm_merge(bm, bm_box(HOUS_W, HOUS_D, HOUS_H - LIP_H, 0.035, 1), loc=(0, 0, z0 + LIP_H + (HOUS_H - LIP_H) / 2))
    z1 = z0 + HOUS_H
    # tall fluted body: five rounded plates side by side + a spine behind them
    for k in range(5):
        bm_merge(bm, bm_box(0.16, 0.95, BODY_H, 0.06, 2), loc=(-0.54 + k * 0.27, -0.05, z1 + BODY_H / 2 - 0.2))
    bm_merge(bm, bm_box(HOUS_W - 0.1, 0.4, BODY_H, 0.03, 1), loc=(0, 0.35, z1 + BODY_H / 2 - 0.2))
    return bm


module_me = None
modules = []
for i in range(6):
    o = mesh_object(scene, f"Module{i + 1}", module_bm(), housing_mat, parent=head)
    o.location = (X_M1 + i * PITCH_M, Y_ROW, Z_TIP)
    modules.append(o)
# needles get their own polished material: second slot on the cone faces (faces below the flange)
Z_BODY = CONE_L + 0.06 + COL_L + HOUS_H
for o in modules:
    o.data.materials.append(needle)
    o.data.materials.append(brushed)
    for poly in o.data.polygons:
        if poly.center.z < CONE_L + 0.001:
            poly.material_index = 1
        elif poly.center.z > Z_BODY + 0.05:
            poly.material_index = 2
x_left, x_right = X_M1 - HOUS_W / 2 - 0.3, X_M1 + 5 * PITCH_M + HOUS_W / 2 + 0.55
box("HeadPlate", (x_left + x_right) / 2, Y_ROW + 0.95, Z_TIP + 9.5 + 12, x_right - x_left, 0.3, 24, chrome_dark, bevel=0.03, parent=head)
box("HeadSide", x_right - 0.2, Y_ROW + 0.2, Z_TIP + 8.6 + 12, 0.35, 1.6, 24, chrome, bevel=0.04, parent=head)
for k in range(4):  # notches along the side plate edge
    box(f"Notch{k}", x_right + 0.0, Y_ROW - 0.3, Z_TIP + 8.9 + k * 0.55, 0.12, 0.3, 0.16, black, parent=head)
box("Carriage", (x_left + x_right) / 2, Y_ROW + 0.3, Z_TIP + 13.4, x_right - x_left + 0.6, 2.6, 0.5, chrome, bevel=0.05, parent=head)
box("Beam", 30.0, E("BEAM_Y", 2.6), E("BEAM_Z", 18.3), 54.0, 3.0, 3.2, satin, bevel=0.12)
box("BeamUnder", 30.0, E("BEAM_Y", 2.6) - 0.6, E("BEAM_Z", 18.3) - 1.75, 54.0, 1.6, 0.4, black)

# ---------------------------------------------------------------- animation: head slide + dips (measured on the reference)


def ss(a, b, x):
    return smoothstep(a, b, x)


def head_x(f):
    return SHIFT * (ss(42, 53, f) - ss(81, 93, f))


# (module 1..6, last rest frame before, first contact frame, last contact frame, first rest frame after)
DIPS = [(1, 33, 37, 37, 40), (3, 44, 48, 49, 51), (3, 51, 54, 54, 56), (6, 56, 60, 61, 63),
        (2, 80, 84, 85, 87), (5, 88, 91, 92, 94), (1, 93, 97, 98, 101), (5, 105, 109, 109, 111)]


def dip_amount(m, f):
    """0 at rest .. 1 at contact."""
    v = 0.0
    for (mm, s, t1, t2, e) in DIPS:
        if mm != m or f < s or f > e:
            continue
        if f <= t1:
            v = max(v, ss(s, t1, f))
        elif f <= t2:
            v = 1.0
        else:
            v = max(v, 1.0 - ss(t2, e, f))
    return v


# contact depth per dip: ray cast straight down from the needle tip at the contact pose
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
DEPTH = {}
for (mm, s, t1, t2, e) in DIPS:
    x = X_M1 + (mm - 1) * PITCH_M + head_x(t1)
    hit, loc, nrm, idx, ob, mtx = scene.ray_cast(dg, Vector((x, Y_ROW, Z_TIP - 0.05)), Vector((0, 0, -1)))
    zc = loc.z if hit else 0.0
    DEPTH[(mm, t1)] = Z_TIP - zc - 0.02
    log(f"dip M{mm} @{t1}: x={x:.2f} lands on {ob.name if hit else '-'} z={zc:.2f} depth={DEPTH[(mm, t1)]:.2f}")


def module_z(m, f):
    z = 0.0
    for (mm, s, t1, t2, e) in DIPS:
        if mm == m and s <= f <= e:
            z = -DEPTH[(mm, t1)] * dip_amount(m, f)
    return Z_TIP + z


bake(head, range(1, N + 1), lambda f: dict(loc=(head_x(f), 0, 0)))
for i, o in enumerate(modules):
    bake(o, range(1, N + 1), lambda f, i=i: dict(loc=(X_M1 + i * PITCH_M, Y_ROW, module_z(i + 1, f))))

# ---------------------------------------------------------------- post: left alpha ramp, left blur, baked call-outs
# ramp measured on the reference: alpha = clamp((x - x0(y)) / 0.375), x0(y) = 0.022 - 0.306 (y - 0.5)  (x, y in 0..1, y down)
# screen squares: (first frame, last full frame, centre x, centre y)  — size 0.0417 W, line ~1.5 px at 1600
SQUARES = [(49, 66, 0.695, 0.624), (54, 66, 0.695, 0.624), (85, 97, 0.652, 0.632), (92, 104, 0.736, 0.642),
           (98, 110, 0.622, 0.607), (109, 121, 0.736, 0.648)]
# board call-outs: (first frame, last full frame, four corners in normalised screen coords, from the reference)
BOARD_RECTS = [(37, 49, [(0.5745, 0.5272), (0.6102, 0.5383), (0.5887, 0.5673), (0.5523, 0.5549)]),
               (61, 73, [(0.8130, 0.6160), (0.8501, 0.6272), (0.8273, 0.6582), (0.7894, 0.6453)])]
SQ = 0.0417


def grow(f, a):
    """Call-out scale: 0.5 -> 1 over 4 frames (ease-out), like the reference."""
    t = min(1.0, max(0.0, (f - a) / 4.0))
    return 0.5 + 0.5 * (1 - (1 - t) ** 2)


def fade(f, z):
    return 1.0 if f <= z else (0.55 if f == z + 1 else 0.0)


def draw_segments(img, segs, width, opacity):
    """Anti-aliased white lines over a straight-alpha RGBA float image (row 0 = bottom). segs in pixel coords (x, y-down)."""
    h, w = img.shape[:2]
    cov = np.zeros((h, w), np.float32)
    for (x0, y0, x1, y1) in segs:
        y0, y1 = h - 1 - y0, h - 1 - y1
        lo_x, hi_x = int(max(0, min(x0, x1) - 3)), int(min(w - 1, max(x0, x1) + 3))
        lo_y, hi_y = int(max(0, min(y0, y1) - 3)), int(min(h - 1, max(y0, y1) + 3))
        if hi_x <= lo_x or hi_y <= lo_y:
            continue
        yy, xx = np.mgrid[lo_y:hi_y + 1, lo_x:hi_x + 1].astype(np.float32)
        dx, dy = x1 - x0, y1 - y0
        L2 = max(dx * dx + dy * dy, 1e-6)
        t = np.clip(((xx - x0) * dx + (yy - y0) * dy) / L2, 0, 1)
        d = np.hypot(xx - (x0 + t * dx), yy - (y0 + t * dy))
        c = np.clip(width / 2 + 0.5 - d, 0, 1)
        cov[lo_y:hi_y + 1, lo_x:hi_x + 1] = np.maximum(cov[lo_y:hi_y + 1, lo_x:hi_x + 1], c)
    l = (cov * opacity)[..., None]
    a = img[..., 3:4]
    na = a * (1 - l) + l
    rgb = (img[..., :3] * a * (1 - l) + 1.0 * l) / np.maximum(na, 1e-6)
    img[..., :3] = np.where(na > 1e-6, rgb, img[..., :3])
    img[..., 3:4] = na
    return img


def callout_segments(f, w, h):
    segs = []
    for (a, z, cx, cy) in SQUARES:
        if a <= f <= z + 1:
            s = SQ * w * grow(f, a) / 2
            op = fade(f, z)
            x, y = cx * w, cy * h
            segs.append(([(x - s, y - s, x + s, y - s), (x + s, y - s, x + s, y + s), (x + s, y + s, x - s, y + s), (x - s, y + s, x - s, y - s)], op))
    for (a, z, pts) in BOARD_RECTS:
        if a <= f <= z + 1:
            g = grow(f, a)
            cx = sum(p[0] for p in pts) / 4
            cy = sum(p[1] for p in pts) / 4
            P = [((cx + (p[0] - cx) * g) * w, (cy + (p[1] - cy) * g) * h) for p in pts]
            segs.append(([(P[k][0], P[k][1], P[(k + 1) % 4][0], P[(k + 1) % 4][1]) for k in range(4)], fade(f, z)))
    return segs


def box_blur_premult(img, r):
    """Separable box blur (3 passes ~ gaussian) of a premultiplied RGBA image, radius r px."""
    if r < 1:
        return img
    out = img
    for axis in (0, 1):
        for _ in range(3):
            pad = [(0, 0)] * 3
            pad[axis] = (r + 1, r)
            c = np.cumsum(np.pad(out, pad, mode="edge"), axis=axis)
            n = out.shape[axis]
            if axis == 0:
                out = (c[2 * r + 1:2 * r + 1 + n] - c[:n]) / (2 * r + 1)
            else:
                out = (c[:, 2 * r + 1:2 * r + 1 + n] - c[:, :n]) / (2 * r + 1)
    return out


BLUR_MAX = E("BLUR_MAX", 12.0)  # px at 1600 wide (scaled with the render size)


def post(path, f=None):
    a = load_pixels(path)  # row 0 = bottom
    h, w = a.shape[:2]
    ys = (h - 1 - np.arange(h, dtype=np.float32)) / (h - 1)  # 0 top .. 1 bottom
    xs = np.arange(w, dtype=np.float32) / (w - 1)
    x0 = 0.022 - 0.306 * (ys[:, None] - 0.5)
    ramp = np.clip((xs[None, :] - x0) / 0.375, 0, 1)
    # blur that grows toward the left (the reference is soft wherever it fades)
    if BLUR_MAX > 0:
        k = BLUR_MAX * w / 1600.0
        pm = a.copy()
        pm[..., :3] *= pm[..., 3:4]
        bl = (1 - np.clip((xs[None, :] - x0 - 0.02) / 0.28, 0, 1)) ** 1.5  # 1 at the ramp start .. 0 from ~30 % of the width
        levels = [pm, box_blur_premult(pm, max(1, int(k * 0.35))), box_blur_premult(pm, max(1, int(k * 0.7))), box_blur_premult(pm, max(1, int(k)))]
        t = bl * (len(levels) - 1)
        i0 = np.clip(np.floor(t).astype(int), 0, len(levels) - 2)
        fr = (t - i0)[..., None]
        stack = np.stack(levels)
        rows = np.arange(h)[:, None]
        cols = np.arange(w)[None, :]
        pm = stack[i0, rows, cols] * (1 - fr) + stack[i0 + 1, rows, cols] * fr
        al = pm[..., 3:4]
        a[..., :3] = np.where(al > 1e-5, pm[..., :3] / np.maximum(al, 1e-5), 0)
        a[..., 3:4] = al
    a[..., 3] *= ramp
    if f is not None:
        for segs, op in callout_segments(f, w, h):
            if op > 0:
                a = draw_segments(a, segs, 1.5 * w / 1600.0, 0.92 * op)
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
    f = int(E("TEST_FRAME", 1))
    t0 = time.time()
    render_with_post([f], OUT_DIR, f"test_{TEST}", skip_existing=False)
    log(f"test frame {f}: {time.time() - t0:.1f}s")
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
