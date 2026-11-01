import * as THREE from "three";

/**
 * The folded "ribbon" field behind Sharplink's hero: a smooth height field rendered as stacked
 * sheets (contour terraces). Every sheet has a lit outer edge, a soft body gradient and a dark gap
 * to the next sheet; the field is squashed toward a horizon at the top and fades into the page
 * colour at the bottom. Edges are anti-aliased with fwidth.
 */
export function makeRibbonMaterial(aspect: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRise: { value: 0 },
      uAspect: { value: aspect },
      uTop: { value: new THREE.Color("#020806") },
      uDeep: { value: new THREE.Color("#082a1e") },
      uSheet: { value: new THREE.Color("#2b7a55") },
      uLip: { value: new THREE.Color("#d9f7e4") },
      uBottom: { value: new THREE.Color("#dff3e7") },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime, uRise, uAspect;
      uniform vec3 uTop, uDeep, uSheet, uLip, uBottom;
      varying vec2 vUv;

      float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for (int i = 0; i < 4; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
        return v;
      }

      void main() {
        vec2 uv = vUv;
        float depth = pow(1.0 - uv.y, 1.6);                         // 0 = horizon (top), 1 = near (bottom)
        vec2 q = vec2((uv.x - 0.5) * uAspect * (0.3 + 1.9 * depth), depth * 1.7);
        q += vec2(uTime * 0.02, -uTime * 0.012);
        float h = fbm(q * 0.48) * 1.1;
        h += 0.22 * sin(q.x * 1.3 + q.y * 2.4 + uTime * 0.05);      // dominant fold direction
        h += 0.55 * exp(-pow((uv.x - 0.5) * 2.0, 2.0)) * (0.2 + 0.8 * depth);   // central mound toward the viewer
        h *= uRise;

        float levels = 9.0;
        float hl = h * levels;
        float f = fract(hl);
        float w = max(fwidth(hl), 0.004);                           // anti-aliasing width
        float terrace = clamp(floor(hl) / levels, 0.0, 1.0);

        // sheet body brightens toward its outer edge, a thin bright lip, then a dark gap
        float body = 0.45 + 0.55 * smoothstep(0.0, 0.85, f);
        float lip = smoothstep(0.84 - w, 0.88 + w, f) * (1.0 - smoothstep(0.955 - w, 0.975 + w, f));
        float gap = smoothstep(0.975 - w, 0.995, f) + (1.0 - smoothstep(0.0, 0.035 + w, f));
        gap = clamp(gap, 0.0, 1.0);

        // slope lighting from the continuous field (key light top-left) + a metallic specular streak
        float hx = dFdx(h) * 90.0, hy = dFdy(h) * 90.0;
        vec3 n = normalize(vec3(-hx * 0.6, -hy * 0.6, 1.0));
        vec3 L = normalize(vec3(-0.45, 0.75, 0.5));
        vec3 V = vec3(0.0, 0.0, 1.0);
        float light = clamp(0.35 + 0.65 * dot(n, L), 0.0, 1.0);
        float spec = pow(max(dot(reflect(-L, n), V), 0.0), 18.0);
        // the lip catches the light along the band, like a brushed-metal edge
        float sheen = pow(max(dot(n, normalize(vec3(0.3, 1.0, 0.8))), 0.0), 6.0);

        vec3 sheet = mix(uDeep, uSheet, smoothstep(0.0, 0.95, depth) * 0.9 + terrace * 0.25);
        vec3 col = sheet * body * (0.5 + 0.75 * light) + uLip * spec * 0.35 * body;
        col = mix(col, uLip * (0.5 + 0.7 * light + 0.5 * sheen), lip * 0.95);
        col = mix(col, uDeep * 0.45, gap * 0.85);
        col = mix(uTop, col, smoothstep(0.0, 0.22, depth));          // horizon falls to black
        vec3 flat_ = mix(uTop, uDeep, smoothstep(0.05, 0.9, depth));
        col = mix(flat_, col, smoothstep(0.0, 0.25, uRise));
        col = mix(col, uBottom, smoothstep(0.70, 1.0, depth));      // bottom fades to the light page colour
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    depthWrite: false,
    depthTest: false,
  });
}
