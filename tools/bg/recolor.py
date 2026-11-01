"""
recolor.py — re-hue Sharplink-style background assets from their blue to Linse green, keeping lightness, chroma and
alpha (OKLCH hue rotation with gamut clipping by chroma reduction). Run with Blender's Python (has numpy + image IO):

    Blender -b -P recolor.py -- <in.png> <out.png> [target_hue_deg] [source_hue_deg]

Source hue defaults to the dominant hue of the saturated pixels (Sharplink brand blue ~262 deg); target to Linse green.
Also prints a few sampled colours (hex) before/after so CSS stops can be mapped with the same function.
"""
import sys, math
import numpy as np
import bpy

argv = sys.argv[sys.argv.index("--") + 1:]
src, dst = argv[0], argv[1]
TARGET = float(argv[2]) if len(argv) > 2 else 151.0
SOURCE = float(argv[3]) if len(argv) > 3 else None
SPREAD = 0.35


def srgb_to_lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lin_to_srgb(c):
    c = np.clip(c, 0, None)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def lin_to_oklab(rgb):
    M1 = np.array([[0.4122214708, 0.5363325363, 0.0514459929], [0.2119034982, 0.6806995451, 0.1073969566], [0.0883024619, 0.2817188376, 0.6299787005]])
    M2 = np.array([[0.2104542553, 0.7936177850, -0.0040720468], [1.9779984951, -2.4285922050, 0.4505937099], [0.0259040371, 0.7827717662, -0.8086757660]])
    lms = rgb @ M1.T
    return np.cbrt(lms) @ M2.T


def oklab_to_lin(lab):
    M2i = np.array([[1.0, 0.3963377774, 0.2158037573], [1.0, -0.1055613458, -0.0638541728], [1.0, -0.0894841775, -1.2914855480]])
    M1i = np.array([[4.0767416621, -3.3077115913, 0.2309699292], [-1.2684380046, 2.6097574011, -0.3413193965], [-0.0041960863, -0.7034186147, 1.7076147010]])
    lms = (lab @ M2i.T) ** 3
    return lms @ M1i.T


def rehue(rgb01, src_h, dst_h):
    lab = lin_to_oklab(srgb_to_lin(rgb01))
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(a, b)
    h = np.degrees(np.arctan2(b, a)) % 360
    # rotate around the source hue and compress the spread (dither speckles of other hues stay near the target)
    d = (h - src_h + 180) % 360 - 180
    h2 = (dst_h + d * SPREAD) % 360
    # gamut map: reduce chroma until the sRGB result is in [0,1]
    scale = np.ones_like(C)
    for _ in range(14):
        a2 = C * scale * np.cos(np.radians(h2)); b2 = C * scale * np.sin(np.radians(h2))
        lin = oklab_to_lin(np.stack([L, a2, b2], -1))
        bad = np.any((lin < -1e-4) | (lin > 1 + 1e-4), axis=-1)
        if not bad.any():
            break
        scale = np.where(bad, scale * 0.9, scale)
    a2 = C * scale * np.cos(np.radians(h2)); b2 = C * scale * np.sin(np.radians(h2))
    return np.clip(lin_to_srgb(oklab_to_lin(np.stack([L, a2, b2], -1))), 0, 1)


def hexs(rgb):
    return "#" + "".join(f"{int(round(v * 255)):02x}" for v in rgb)


img = bpy.data.images.load(src)
img.colorspace_settings.name = "Non-Color"  # raw stored values (sRGB-encoded)
w, h = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
rgb, alpha = px[..., :3].astype(np.float64), px[..., 3]

if SOURCE is None:
    lab = lin_to_oklab(srgb_to_lin(rgb.reshape(-1, 3)))
    C = np.hypot(lab[:, 1], lab[:, 2]); hh = np.degrees(np.arctan2(lab[:, 2], lab[:, 1])) % 360
    m = (C > 0.08) & (alpha.reshape(-1) > 0.5)
    SOURCE = float(np.degrees(np.arctan2(np.sin(np.radians(hh[m])).mean(), np.cos(np.radians(hh[m])).mean())) % 360) if m.any() else 262.0
print(f"[recolor] {src} {w}x{h} source hue {SOURCE:.1f} -> target {TARGET:.1f}")

out = rehue(rgb, SOURCE, TARGET)
res = np.concatenate([out, alpha[..., None]], -1).astype(np.float32)

# samples down the centre column (row 0 = bottom in Blender)
for fy in (0.95, 0.8, 0.6, 0.45, 0.3, 0.15):
    y = int(fy * (h - 1)); x = w // 2
    print(f"[recolor] y={1 - fy:.2f} a={alpha[y, x]:.2f} {hexs(rgb[y, x])} -> {hexs(out[y, x])}")

o = bpy.data.images.new("out", w, h, alpha=True)
o.colorspace_settings.name = "Non-Color"
o.pixels = res.ravel().tolist()
o.filepath_raw = dst
o.file_format = "WEBP" if dst.lower().endswith(".webp") else "PNG"
if o.file_format == "WEBP":
    bpy.context.scene.render.image_settings.quality = 90
o.save()
print("[recolor] wrote", dst)
