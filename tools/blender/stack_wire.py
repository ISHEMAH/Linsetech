"""
stack_wire.py — line-art still of the stack machine at its final frame (Sharplink's wireframe hand-off).

    Blender -b out/stack/stack.blend -P stack_wire.py -- [frame]

Writes tools/blender/out/stack/wire.png (1200x1600 RGBA, lines only) — surfaces are holdout, Freestyle draws
silhouettes / creases / borders in off-white.
"""
import bpy, os, sys, math

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
frame = int(argv[0]) if argv else 270
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, "out", "stack", "wire.png")

scene = bpy.context.scene
scene.frame_set(frame)

hold = bpy.data.materials.new("Holdout")
hold.use_nodes = True
nt = hold.node_tree
nt.nodes.clear()
o = nt.nodes.new("ShaderNodeOutputMaterial")
h = nt.nodes.new("ShaderNodeHoldout")
nt.links.new(h.outputs[0], o.inputs[0])

for ob in scene.objects:
    if ob.type in {"MESH", "CURVE"}:
        data = ob.data
        data.materials.clear()
        data.materials.append(hold)
    if ob.name.lower().startswith("guide") or ob.name.lower().startswith("dot"):
        ob.hide_render = True

r = scene.render
r.engine = "BLENDER_EEVEE_NEXT" if hasattr(bpy.types, "SceneEEVEE") and "BLENDER_EEVEE_NEXT" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
r.use_freestyle = True
r.line_thickness_mode = "ABSOLUTE"
r.line_thickness = 1.4
r.film_transparent = True
r.resolution_percentage = 100
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"
r.image_settings.color_depth = "8"
r.filepath = out
scene.eevee.taa_render_samples = 8

vl = scene.view_layers[0]
vl.use_freestyle = True
fs = vl.freestyle_settings
for ls in list(fs.linesets):
    fs.linesets.remove(ls)
fs.crease_angle = math.radians(120)
fs.use_culling = True
ls = fs.linesets.new("Wire")
ls.select_silhouette = True
ls.select_crease = True
ls.select_border = True
ls.select_contour = False
ls.select_edge_mark = False
ls.select_by_visibility = True
ls.visibility = "VISIBLE"
st = ls.linestyle
st.color = (0.86, 0.95, 0.90)
st.alpha = 1.0
st.thickness = 1.4
st.caps = "ROUND"

# pass A: everything (outer silhouette incl. the glass tube); pass B: tube hidden (spring / icon / plate inside)
a_path, b_path = out.replace(".png", "_a.png"), out.replace(".png", "_b.png")
r.filepath = a_path
bpy.ops.render.render(write_still=True)
tube = scene.objects.get("Tube")
if tube:
    tube.hide_render = True
r.filepath = b_path
bpy.ops.render.render(write_still=True)

import numpy as np
def load(pth):
    im = bpy.data.images.load(pth)
    px = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], 4)
    return im, px
ia, A = load(a_path)
ib, B = load(b_path)
alpha = np.maximum(A[..., 3], B[..., 3] * 0.8)
C = np.zeros_like(A)
C[..., :3] = (0.86, 0.95, 0.90)
C[..., 3] = alpha
im = bpy.data.images.new("wire", ia.size[0], ia.size[1], alpha=True)
im.pixels = C.ravel().tolist()
im.filepath_raw = out
im.file_format = "PNG"
im.save()
print("wire still:", out)
