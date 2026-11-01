import { HONEYPOT, MIN_FILL_MS, STARTED_AT, type FieldErrors, type FormResponse, type Validation } from "./forms";

/**
 * Server side of the site forms: body parsing with a size cap, the anti-spam checks (honeypot, minimum fill time,
 * per-IP rate limit) and the JSON answers. Nothing personal is logged: no addresses, names, messages or IPs.
 */

const MAX_BODY = 32 * 1024;
const RATE = { max: 5, windowMs: 10 * 60 * 1000 };

type Raw = Record<string, unknown>;

// In-memory sliding window per scope + IP. The site runs as one Node process on its own server, so a Map is enough;
// it lives on globalThis so dev reloads keep it. Rejected requests are not recorded, so waiting always helps.
const hits: Map<string, number[]> = ((globalThis as { __linseFormHits?: Map<string, number[]> }).__linseFormHits ??= new Map());

function rateLimit(key: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE.windowMs);
  if (recent.length >= RATE.max) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((recent[0] + RATE.windowMs - now) / 1000)) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, list] of hits) if (now - list[list.length - 1] >= RATE.windowMs) hits.delete(k);
  return { ok: true };
}

/**
 * Behind the reverse proxy (nginx `proxy_add_x_forwarded_for`) the last X-Forwarded-For entry is the address the proxy
 * saw, which the client cannot forge; without a proxy Next fills the header with the socket address itself.
 */
function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return forwarded?.at(-1) || req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Reads at most MAX_BODY bytes; JSON or url-encoded. */
async function readBody(req: Request): Promise<Raw | "too_large" | null> {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return "too_large";
  if (!req.body) return null;
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel().catch(() => {});
      return "too_large";
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try {
    if ((req.headers.get("content-type") ?? "").includes("application/x-www-form-urlencoded")) return Object.fromEntries(new URLSearchParams(text));
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Raw) : null;
  } catch {
    return null;
  }
}

function automated(raw: Raw): "honeypot" | "too fast" | null {
  const trap = raw[HONEYPOT];
  if (trap != null && (typeof trap !== "string" || trap.trim() !== "")) return "honeypot";
  const startedAt = Number(raw[STARTED_AT]);
  if (!Number.isFinite(startedAt) || startedAt <= 0 || Date.now() - startedAt < MIN_FILL_MS) return "too fast";
  return null;
}

const json = (body: FormResponse, init?: ResponseInit) => Response.json(body, init);

/** Mail / webhook errors carry addresses in their message: log the codes only. */
function describe(err: unknown) {
  if (!err || typeof err !== "object") return { error: typeof err };
  const e = err as Record<string, unknown>;
  return Object.fromEntries(["name", "code", "responseCode", "command", "status"].filter((k) => e[k] != null).map((k) => [k, e[k]]));
}

/**
 * The pipeline both endpoints share: rate limit → parse → bot checks → validation → delivery.
 * Bots get the same answer as an undelivered form (200, delivered: false) so they learn nothing; a person caught by
 * mistake sees the "write to us" fallback.
 */
export async function handleForm<T>(
  req: Request,
  scope: string,
  validate: (raw: Raw) => Validation<T>,
  deliver: (data: T) => Promise<boolean>,
): Promise<Response> {
  try {
    const limit = rateLimit(`${scope}:${clientIp(req)}`);
    if (!limit.ok) {
      console.warn(`[${scope}] rate limited`);
      return json({ ok: false, error: "rate_limited", retryAfter: limit.retryAfter }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    }
    const raw = await readBody(req);
    if (raw === "too_large") return json({ ok: false, error: "too_large" }, { status: 413 });
    if (!raw) return json({ ok: false, error: "bad_request" }, { status: 400 });

    const bot = automated(raw);
    if (bot) {
      console.info(`[${scope}] dropped (${bot})`);
      return json({ ok: true, delivered: false });
    }

    const result = validate(raw);
    if (!result.ok) return json({ ok: false, error: "validation", fields: result.fields satisfies FieldErrors }, { status: 400 });

    const delivered = await deliver(result.data);
    console.info(`[${scope}] ${delivered ? "delivered" : "accepted, delivery not configured"}`);
    return json({ ok: true, delivered });
  } catch (err) {
    console.error(`[${scope}] failed`, describe(err));
    return json({ ok: false, error: "server" }, { status: 500 });
  }
}
