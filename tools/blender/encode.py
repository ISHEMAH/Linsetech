"""
encode.py — encode the rendered PNG sequences into the web deliverables (web/public/clips/).

    Blender -b -P encode.py -- hero     # hero_chrome.webm (VP9), hero_safari.mp4 (H.264), hero_poster.jpg, hero_sheet.jpg
    Blender -b -P encode.py -- stack    # stack_chrome.webm (VP9 + alpha, GOP 1), stack_4444.mov (ProRes 4444), stack_poster.png, stack_sheet.jpg
                                        # then hevc_alpha/hevc_alpha turns stack_4444.mov into stack_safari.mp4 (HEVC + alpha, GOP 1)

Uses Blender's own FFmpeg (the system ffmpeg on this Mac is broken) through the video sequencer.
"""
import os, sys, glob, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
NAME = argv[0] if argv else "hero"
SPEC = {
    "hero": dict(w=1600, h=1000, fps=30, n=300, alpha=False, poster_frame=300, poster="hero_poster.jpg"),
    "stack": dict(w=1200, h=1600, fps=30, n=270, alpha=True, poster_frame=109, poster="stack_poster.png"),
}[NAME]
FRAMES = sorted(glob.glob(os.path.join(OUT, NAME, "frames", f"{NAME}_*.png")))
assert len(FRAMES) == SPEC["n"], f"expected {SPEC['n']} frames, found {len(FRAMES)}"
os.makedirs(CLIPS, exist_ok=True)

scene = reset_scene()
r = scene.render
r.resolution_x, r.resolution_y, r.resolution_percentage = SPEC["w"], SPEC["h"], 100
r.fps, r.fps_base = SPEC["fps"], 1.0
scene.frame_start, scene.frame_end = 1, SPEC["n"]
r.film_transparent = SPEC["alpha"]
scene.view_settings.view_transform = "Standard"  # frames are already display-referred sRGB: pass them through untouched
scene.sequencer_colorspace_settings.name = "sRGB"
se = scene.sequence_editor_create()
strip = se.strips.new_image(NAME, FRAMES[0], 1, 1)
for p in FRAMES[1:]:
    strip.elements.append(os.path.basename(p))
strip.frame_final_duration = SPEC["n"]
strip.alpha_mode = "STRAIGHT"
strip.blend_type = "ALPHA_OVER" if SPEC["alpha"] else "REPLACE"


def encode(filename, fmt, codec, color_mode, crf="VERYLOW", gop=None, prores=None):
    ims = r.image_settings
    ims.media_type = "VIDEO"
    ims.file_format = "FFMPEG"
    ff = r.ffmpeg
    ff.format, ff.codec = fmt, codec
    # the RGBA option only exists once the codec/profile supports alpha (ProRes 4444), so set the profile first
    if prores:
        ff.ffmpeg_prores_profile = prores
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
    # Blender appends the frame range to movie names: render to a temp stem, then rename
    stem = os.path.join(CLIPS, "_tmp_" + os.path.splitext(filename)[0])
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


if NAME == "hero":
    encode("hero_chrome.webm", "WEBM", "WEBM", "RGB", crf="VERYLOW")            # VP9, crf ~29-30
    encode("hero_safari.mp4", "MPEG4", "H264", "RGB", crf="MEDIUM")             # H.264, crf 23
else:
    # the clip is shown in a half-width column, so 75 % (900x1200) is plenty; GOP 2 keeps scrubbing smooth at a third of the size
    r.resolution_percentage = 75
    encode("stack_chrome.webm", "WEBM", "WEBM", "RGBA", crf="MEDIUM", gop=2)      # VP9 with alpha (scroll-scrubbed)
    encode("stack_4444.mov", "QUICKTIME", "PRORES", "RGBA", prores="4444")       # intermediate for HEVC-with-alpha

# poster + 12-frame review sheet straight from the frames
src = os.path.join(OUT, NAME, "frames", f"{NAME}_{SPEC['poster_frame']:04d}.png")
px = load_pixels(src)
save_pixels(os.path.join(CLIPS, SPEC["poster"]), px, alpha=SPEC["alpha"])
sheet_frames = [FRAMES[i - 1] for i in preview_frames(SPEC["n"])]
contact_sheet(sheet_frames, os.path.join(CLIPS, f"{NAME}_sheet.jpg"), cols=4, cell_w=400, checker=("#0a1e3c", "#ff00ff") if SPEC["alpha"] else None)
log("done", NAME)
