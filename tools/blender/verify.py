"""verify.py — sanity-check the encoded clips: WebM AlphaMode (EBML 0x53C0), MP4 sync-sample tables (GOP), sizes."""
import os, sys, struct

clips = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "clips")


def ebml_alpha(path):
    """AlphaMode (EBML id 0x53C0) lives in the Tracks header, before the first Cluster (0x1F43B675)."""
    b = open(path, "rb").read()
    end = b.find(b"\x1f\x43\xb6\x75")
    head = b[: end if end > 0 else 4096]
    i = head.find(b"\x53\xc0\x81")  # id, 1-byte size
    return None if i < 0 else head[i + 3]


def mp4_sync(path):
    b = open(path, "rb").read()
    i = b.find(b"stss")
    entries = int.from_bytes(b[i + 8:i + 12], "big") if i > 0 else None
    j = b.find(b"stsz")
    count = int.from_bytes(b[j + 12:j + 16], "big") if j > 0 else None
    return entries, count


for f in sorted(os.listdir(clips)):
    p = os.path.join(clips, f)
    size = os.path.getsize(p) / 1e6
    if f.endswith(".webm"):
        a = ebml_alpha(p)
        print(f"{f:22s} {size:6.2f} MB  AlphaMode={'absent' if a is None else a}")
    elif f.endswith(".mp4") or f.endswith(".mov"):
        k, n = mp4_sync(p)
        hevc = b"hvc1" in open(p, "rb").read(4096 * 16) or b"hev1" in open(p, "rb").read(4096 * 16)
        print(f"{f:22s} {size:6.2f} MB  keyframes={'all' if k is None else k}/{n} frames  hevc={hevc}")
    else:
        print(f"{f:22s} {size:6.2f} MB")
