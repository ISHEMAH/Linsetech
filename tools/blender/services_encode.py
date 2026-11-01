"""
services_encode.py — encode the /services hero loop (own copy of encode.py's recipe; Blender's FFmpeg).

    Blender -b -P services_encode.py     # public/clips/services_hero_chrome.webm (VP9), services_hero_safari.mp4 (H.264),
                                         # services_hero_poster.jpg, services_hero_sheet.jpg
    Blender -b -P services_encode.py -- alpha
                                         # the transparent version (out/services_hero_a): services_hero_chrome.webm (VP9 +
                                         # alpha, GOP 15), services_hero_4444.mov (ProRes 4444 master), services_hero_poster.png,
                                         # services_hero_sheet.jpg; then hevc_alpha/hevc_alpha <4444.mov> services_hero_safari.mp4 15 0.8
"""
import os, sys, glob, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa

NAME, W, H, FPS, N = "services_hero", 1600, 1000, 30, 150
ALPHA = "alpha" in (sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
FRAMES = sorted(glob.glob(os.path.join(OUT, NAME + ("_a" if ALPHA else ""), "frames", f"{NAME}_*.png")))
assert len(FRAMES) == N, f"expected {N} frames, found {len(FRAMES)}"
os.makedirs(CLIPS, exist_ok=True)

scene = reset_scene()
r = scene.render
r.resolution_x, r.resolution_y, r.resolution_percentage = W, H, 100
r.fps, r.fps_base = FPS, 1.0
scene.frame_start, scene.frame_end = 1, N
r.film_transparent = ALPHA
scene.view_settings.view_transform = "Standard"
scene.sequencer_colorspace_settings.name = "sRGB"
se = scene.sequence_editor_create()
strip = se.strips.new_image(NAME, FRAMES[0], 1, 1)
for p in FRAMES[1:]:
    strip.elements.append(os.path.basename(p))
strip.frame_final_duration = N
strip.alpha_mode = "STRAIGHT"
strip.blend_type = "ALPHA_OVER" if ALPHA else "REPLACE"


def encode(filename, fmt, codec, crf, color="RGB", gop=30, prores=None, kbps=None):
    ims = r.image_settings
    ims.media_type = "VIDEO"
    ims.file_format = "FFMPEG"
    ff = r.ffmpeg
    ff.format, ff.codec = fmt, codec
    if prores:
        ff.ffmpeg_prores_profile = prores  # the RGBA option only exists once the profile supports alpha
    elif kbps:
        ff.constant_rate_factor = "NONE"  # bitrate-capped (the shards make a CRF encode heavy)
        ff.video_bitrate, ff.minrate, ff.maxrate, ff.buffersize = kbps, 0, int(kbps * 1.5), kbps * 2
        ff.ffmpeg_preset = "GOOD"
    else:
        ff.constant_rate_factor = crf
        ff.ffmpeg_preset = "GOOD"
    ims.color_mode = color
    ff.gopsize = gop
    ff.max_b_frames = 0
    ff.use_max_b_frames = True
    ff.audio_codec = "NONE"
    out = os.path.join(CLIPS, filename)
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


if ALPHA:
    encode(f"{NAME}_chrome.webm", "WEBM", "WEBM", None, color="RGBA", gop=15, kbps=6000)   # VP9 + alpha (≈ 4 MB)
    encode(f"{NAME}_4444.mov", "QUICKTIME", "PRORES", None, color="RGBA", prores="4444")  # master for HEVC + alpha
    save_pixels(os.path.join(CLIPS, f"{NAME}_poster.png"), load_pixels(FRAMES[0])[::2, ::2], alpha=True)
    contact_sheet([FRAMES[i - 1] for i in preview_frames(N)], os.path.join(CLIPS, f"{NAME}_sheet.jpg"), cols=4, cell_w=400, checker=("#04150F", "#0B3D2E", "#DFF3E7"))
else:
    encode(f"{NAME}_chrome.webm", "WEBM", "WEBM", "VERYLOW")
    encode(f"{NAME}_safari.mp4", "MPEG4", "H264", "MEDIUM")
    save_pixels(os.path.join(CLIPS, f"{NAME}_poster.jpg"), load_pixels(FRAMES[0]), alpha=False)
    contact_sheet([FRAMES[i - 1] for i in preview_frames(N)], os.path.join(CLIPS, f"{NAME}_sheet.jpg"), cols=4, cell_w=400)
log("done", NAME)
