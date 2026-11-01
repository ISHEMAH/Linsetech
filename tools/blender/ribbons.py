"""
ribbons.py — the nested ribbon field behind the hero mark.

A smooth "distance" field D(x, y) on the ground plane (a rounded-square well around the mark, a second
lobe, a sine warp that grows outward) is contoured at evenly spaced levels (marching squares, numpy).
Every contour becomes a rounded wall: a profile (vertical sides + semicircular top) swept along the
polyline, built straight into a Mesh with foreach_set. One object per level so the field can rise
from the centre outward and fade in per band (Object Info > Alpha drives the material alpha).
"""
import math
import numpy as np
import bpy

# marching-squares segment table: case bit order tl=8 tr=4 br=2 bl=1; edges T R B L
_CASES = {
    1: [("L", "B")], 2: [("B", "R")], 3: [("L", "R")], 4: [("T", "R")], 5: [("T", "L"), ("B", "R")],
    6: [("T", "B")], 7: [("T", "L")], 8: [("T", "L")], 9: [("T", "B")], 10: [("T", "R"), ("B", "L")],
    11: [("T", "R")], 12: [("L", "R")], 13: [("B", "R")], 14: [("L", "B")],
}


def marching_squares(h, xs, ys, level):
    """Contour polylines of h (ny, nx) at `level`. Returns [(points (n,2), closed), ...]."""
    ny, nx = h.shape
    b = h > level
    tl, tr, br, bl = b[:-1, :-1], b[:-1, 1:], b[1:, 1:], b[1:, :-1]
    case = tl * 8 + tr * 4 + br * 2 + bl * 1
    # crossing positions on horizontal edges (i, j)-(i, j+1) and vertical edges (i, j)-(i+1, j)
    X, Y = np.meshgrid(xs, ys)
    with np.errstate(divide="ignore", invalid="ignore"):
        th = (level - h[:, :-1]) / (h[:, 1:] - h[:, :-1])
        tv = (level - h[:-1, :]) / (h[1:, :] - h[:-1, :])
    hx = X[:, :-1] + np.clip(th, 0, 1) * (X[:, 1:] - X[:, :-1])
    hy = Y[:, :-1]
    vx = X[:-1, :]
    vy = Y[:-1, :] + np.clip(tv, 0, 1) * (Y[1:, :] - Y[:-1, :])
    hid = np.arange(ny * (nx - 1)).reshape(ny, nx - 1)          # horizontal edge ids
    vid = ny * (nx - 1) + np.arange((ny - 1) * nx).reshape(ny - 1, nx)  # vertical edge ids
    pos = {}

    def edge(name, ii, jj):
        if name == "T":
            e = hid[ii, jj]; p = (hx[ii, jj], hy[ii, jj])
        elif name == "B":
            e = hid[ii + 1, jj]; p = (hx[ii + 1, jj], hy[ii + 1, jj])
        elif name == "L":
            e = vid[ii, jj]; p = (vx[ii, jj], vy[ii, jj])
        else:
            e = vid[ii, jj + 1]; p = (vx[ii, jj + 1], vy[ii, jj + 1])
        return e, p

    segs = []
    for c, pairs in _CASES.items():
        ii, jj = np.nonzero(case == c)
        if len(ii) == 0:
            continue
        for a, bname in pairs:
            ea, pa = edge(a, ii, jj)
            eb, pb = edge(bname, ii, jj)
            for k in range(len(ii)):
                segs.append((int(ea[k]), int(eb[k])))
                pos[int(ea[k])] = (float(pa[0][k]), float(pa[1][k]))
                pos[int(eb[k])] = (float(pb[0][k]), float(pb[1][k]))
    # chain segments by shared edge ids
    adj = {}
    for s in segs:
        adj.setdefault(s[0], []).append(s[1])
        adj.setdefault(s[1], []).append(s[0])
    seen = set()
    lines = []
    # open lines first (nodes with a single neighbour), then closed loops
    starts = [n for n, nb in adj.items() if len(nb) == 1] + list(adj.keys())
    for s in starts:
        if s in seen or s not in adj:
            continue
        line = [s]
        seen.add(s)
        cur, prev = s, None
        while True:
            nxt = [n for n in adj[cur] if n != prev and n not in seen]
            if not nxt:
                break
            prev, cur = cur, nxt[0]
            line.append(cur)
            seen.add(cur)
        closed = len(line) > 2 and line[0] in adj[line[-1]]
        if len(line) >= 3:
            lines.append((np.array([pos[n] for n in line], dtype=np.float64), closed))
    return lines


def resample(P, closed, step):
    """Resample a polyline at uniform arc-length spacing and smooth it lightly."""
    if closed:
        P = np.vstack([P, P[:1]])
    d = np.sqrt(((P[1:] - P[:-1]) ** 2).sum(1))
    s = np.concatenate([[0], np.cumsum(d)])
    L = s[-1]
    n = max(4, int(L / step))
    t = np.linspace(0, L, n, endpoint=not closed)
    Q = np.stack([np.interp(t, s, P[:, 0]), np.interp(t, s, P[:, 1])], 1)
    for _ in range(3):  # gentle smoothing (wraps for loops)
        if closed:
            Q = (np.roll(Q, 1, 0) + 2 * Q + np.roll(Q, -1, 0)) / 4
        else:
            Q[1:-1] = (Q[:-2] + 2 * Q[1:-1] + Q[2:]) / 4
    return Q


def wall_profile(width, height, segs=7):
    """Profile (u across, v up): left side up, semicircular top, right side down."""
    r = width / 2
    pts = [(-r, 0.0), (-r, max(height - r, 0.0))]
    for i in range(1, segs):
        a = math.pi - math.pi * i / segs
        pts.append((r * math.cos(a), height - r + r * math.sin(a)))
    pts += [(r, max(height - r, 0.0)), (r, 0.0)]
    return np.array(pts)


def sweep_mesh(name, lines, profile, mat=None, z_scale=1.0):
    """Sweep `profile` along every polyline (in the XY plane, walls rising in +Z) into one Mesh object."""
    V, F = [], []
    base = 0
    m = len(profile)
    for P, closed in lines:
        n = len(P)
        if n < 3:
            continue
        nxt, prv = np.roll(P, -1, 0), np.roll(P, 1, 0)
        if not closed:
            nxt[-1], prv[0] = P[-1] + (P[-1] - P[-2]), P[0] - (P[1] - P[0])
        T = nxt - prv
        T /= np.linalg.norm(T, axis=1, keepdims=True) + 1e-9
        N = np.stack([-T[:, 1], T[:, 0]], 1)  # left normal
        # winding: make the profile's +u side the outer side of the loop (CCW loops have the outside on the right)
        area = 0.5 * np.sum(P[:, 0] * nxt[:, 1] - nxt[:, 0] * P[:, 1]) if closed else 1.0
        if area > 0:
            N = -N
        u, v = profile[:, 0][None, :, None], profile[:, 1][None, :, None] * z_scale
        pts = P[:, None, :] + u * N[:, None, :]
        pts3 = np.concatenate([pts, np.broadcast_to(v, (n, m, 1))], 2).reshape(-1, 3)
        V.append(pts3)
        r = np.arange(n if closed else n - 1)
        r1 = (r + 1) % n
        k = np.arange(m - 1)
        a = base + (r[:, None] * m + k[None, :])
        b = base + (r1[:, None] * m + k[None, :])
        quads = np.stack([a, b, b + 1, a + 1], 2).reshape(-1, 4)
        if area > 0:
            quads = quads[:, ::-1]
        F.append(quads)
        base += n * m
    verts = np.concatenate(V) if V else np.zeros((0, 3))
    faces = np.concatenate(F) if F else np.zeros((0, 4), dtype=np.int64)
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(verts))
    me.vertices.foreach_set("co", verts.astype(np.float32).ravel())
    nf = len(faces)
    me.loops.add(nf * 4)
    me.loops.foreach_set("vertex_index", faces.astype(np.int32).ravel())
    me.polygons.add(nf)
    me.polygons.foreach_set("loop_start", (np.arange(nf) * 4).astype(np.int32))
    me.polygons.foreach_set("loop_total", np.full(nf, 4, dtype=np.int32))
    me.polygons.foreach_set("use_smooth", np.ones(nf, dtype=bool))
    me.update(calc_edges=True)
    me.validate()
    if mat is not None:
        me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    return ob


def squircle(dx, dy, p=3.0, ax=1.0, ay=1.0):
    return (np.abs(dx / ax) ** p + np.abs(dy / ay) ** p) ** (1.0 / p)


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def distance_field(xs, ys, centre, lobe=None, warp=0.12, seed=3):
    """D(x, y): a rounded-square well at `centre` (optionally merged with a shallower second lobe), with a
    smooth sine warp that grows with distance so the outer bands wander like the reference."""
    X, Y = np.meshgrid(xs, ys)
    cx, cy = centre
    D = squircle(X - cx, Y - cy, 3.2, 1.0, 0.92)
    if lobe is not None:
        lx, ly, off, k = lobe
        D = smin(D, squircle(X - lx, Y - ly, 2.6, 0.9, 1.0) + off, k)
    rng = np.random.default_rng(seed)
    W = np.zeros_like(D)
    for i in range(5):
        f = 0.18 + 0.16 * i
        ang = rng.uniform(0, math.pi)
        ph = rng.uniform(0, 2 * math.pi)
        W += (1.0 / (1 + i)) * np.sin(f * (np.cos(ang) * X + np.sin(ang) * Y) + ph)
    amp = warp * np.clip(0.4 + 0.11 * D, 0, 3.5)
    return D + amp * W


def build_ribbon_field(scene, parent, mat, centre, n_levels=44, spacing=0.56, width=0.25, height=0.44,
                       extent=((-34, 34), (-14, 44)), res=0.09, lobe=None, warp=0.12, step=0.07, name="Band", offset=0.0):
    """Returns the list of band objects (one per level, inner first), parented to `parent` (field-local XY plane)."""
    (x0, x1), (y0, y1) = extent
    xs = np.arange(x0, x1, res)
    ys = np.arange(y0, y1, res)
    D = distance_field(xs, ys, centre, lobe=lobe, warp=warp)
    prof = wall_profile(width, height)
    objs = []
    for k in range(1, n_levels + 1):
        lines = [(resample(P, c, step), c) for P, c in marching_squares(D, xs, ys, offset + k * spacing)]
        lines = [(P, c) for P, c in lines if len(P) >= 4]
        if not lines:
            continue
        ob = sweep_mesh(f"{name}{k:02d}", lines, prof, mat)
        ob.parent = parent
        scene.collection.objects.link(ob)
        objs.append(ob)
    return objs
