"""
about_encode.py — encode the About clips (about_mark.py) into web deliverables (web/public/clips/). A copy of
encode.py's approach (Blender's own FFmpeg through the video sequencer; the system ffmpeg on this Mac is broken).

    Blender -b -P about_encode.py -- about_mark   # about_mark_chrome.webm (VP9 + alpha), about_mark_4444.mov, poster, sheet
    Blender -b -P about_encode.py -- about_logo   # about_logo_chrome.webm (VP9 + alpha), about_logo_4444.mov, poster
    then: hevc_alpha/hevc_alpha public/clips/<name>_4444.mov public/clips/<name>_safari.mp4 <gop> 0.8   (HEVC + alpha)

Both clips loop seamlessly (frame N+1 == frame 1). The hero clip keeps a short GOP so it can also be scrubbed.
"""
import os, sys, glob, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
NAME = argv[0] if argv else "about_mark"
SPEC = {
    "about_mark": dict(w=1000, h=1400, fps=30, n=180, gop=6, crf="MEDIUM", poster_frame=1),
    "about_logo": dict(w=600, h=600, fps=30, n=150, gop=30, crf="HIGH", poster_frame=1),
}[NAME]
FRAMES = sorted(glob.glob(os.path.join(OUT, NAME, "frames", f"{NAME}_*.png")))
assert len(FRAMES) == SPEC["n"], f"expected {SPEC['n']} frames, found {len(FRAMES)}"
os.makedirs(CLIPS, exist_ok=True)

scene = reset_scene()
r = scene.render
r.resolution_x, r.resolution_y, r.resolution_percentage = SPEC["w"], SPEC["h"], 100
r.fps, r.fps_base = SPEC["fps"], 1.0
scene.frame_start, scene.frame_end = 1, SPEC["n"]
r.film_transparent = True
scene.view_settings.view_transform = "Standard"  # frames are display-referred sRGB already: pass them through
scene.sequencer_colorspace_settings.name = "sRGB"
se = scene.sequence_editor_create()
strip = se.strips.new_image(NAME, FRAMES[0], 1, 1)
for p in FRAMES[1:]:
    strip.elements.append(os.path.basename(p))
strip.frame_final_duration = SPEC["n"]
strip.alpha_mode = "STRAIGHT"
strip.blend_type = "ALPHA_OVER"


def encode(filename, fmt, codec, color_mode, crf="MEDIUM", gop=None, prores=None):
    ims = r.image_settings
    ims.media_type = "VIDEO"
    ims.file_format = "FFMPEG"
    ff = r.ffmpeg
    ff.format, ff.codec = fmt, codec
    if prores:
        ff.ffmpeg_prores_profile = prores  # the RGBA option only exists once the profile supports alpha
    else:
        ff.constant_rate_factor = crf
        ff.ffmpeg_preset = "GOOD"
    ims.color_mode = color_mode
    if gop is not None:
        ff.gopsize = gop
        ff.max_b_frames = 0
        ff.use_max_b_frames = True
    ff.audio_codec = "NONE"
    out = os.path.join(CLIPS, filename)
    stem = os.path.join(CLIPS, "_tmp_" + os.path.splitext(filename)[0])  # Blender appends the frame range
    r.filepath = stem
    t0 = time.time()
    bpy.ops.render.render(animation=True)
    produced = glob.glob(stem + "*")
    assert produced, "no movie produced"
    if os.path.exists(out):
        os.remove(out)
    os.rename(produced[0], out)
    log(f"{filename}: {os.path.getsize(out) / 1e6:.2f} MB in {time.time() - t0:.0f}s")
    return out


encode(f"{NAME}_chrome.webm", "WEBM", "WEBM", "RGBA", crf=SPEC["crf"], gop=SPEC["gop"])  # VP9 with alpha
encode(f"{NAME}_4444.mov", "QUICKTIME", "PRORES", "RGBA", prores="4444")                 # master for HEVC + alpha

# poster (half size, alpha) + review sheet straight from the frames
px = load_pixels(os.path.join(OUT, NAME, "frames", f"{NAME}_{SPEC['poster_frame']:04d}.png"))
save_pixels(os.path.join(CLIPS, f"{NAME}_poster.png"), px[::2, ::2], alpha=True)
if NAME == "about_logo":
    # portrait stand-ins for the team tiles: the chrome mark at a few turntable angles, WebP with alpha
    for k, f in enumerate((1, 11, 140, 19, 132, 6)):
        px = load_pixels(os.path.join(OUT, NAME, "frames", f"{NAME}_{f:04d}.png"))
        h, w = px.shape[:2]
        img = bpy.data.images.new("portrait", w, h, alpha=True)
        img.pixels.foreach_set(np.ascontiguousarray(px, dtype=np.float32).ravel())
        dst = os.path.join(CLIPS, f"about_portrait_{k + 1}.webp")
        scene.render.image_settings.media_type = "IMAGE"
        scene.render.image_settings.file_format = "WEBP"
        scene.render.image_settings.color_mode = "RGBA"
        scene.render.image_settings.quality = 82
        img.save_render(dst, scene=scene)
        bpy.data.images.remove(img)
        log(dst, f"{os.path.getsize(dst) / 1e3:.0f} kB")
if NAME == "about_mark":
    contact_sheet([FRAMES[i - 1] for i in preview_frames(SPEC["n"])], os.path.join(CLIPS, f"{NAME}_sheet.jpg"), cols=4, cell_w=300, checker=("#04150F", "#0B3D2E", "#DFF3E7"))
log("done", NAME)
