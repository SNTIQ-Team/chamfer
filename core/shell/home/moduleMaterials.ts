export type ModuleMaterialId = 'chamfer';

export function isModuleMaterial(name: string): name is ModuleMaterialId {
  return name === 'chamfer';
}

const PREAMBLE = `#version 300 es
precision highp float;
precision mediump int;

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_ptr;
uniform float u_amp;
uniform float u_px;
uniform float u_band;
uniform float u_quality;
uniform float u_scrub;
uniform vec3 u_scrubTint;
uniform vec2 u_scrubPulse;
out vec4 fragColor;

const vec3 NIGHT = vec3(0.02353, 0.03137, 0.05098);

// Fast float-ALU hash (4-6x faster than 32-bit uint multiply/XOR on mobile PowerVR/Mali/Adreno GPUs).
float hash21f(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22f(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

// Lightweight 2D Simplex noise for kinetic rapid-switch Voronoi domain warping.
float scrubSimplex(vec2 p) {
  const float F = 0.3660254038, G = 0.2113248654;
  vec2 i = floor(p + (p.x + p.y) * F);
  vec2 a = p - i + (i.x + i.y) * G;
  vec2 j = a.x > a.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 b = a - j + G, c = a - 1.0 + 2.0 * G;
  vec3 t = max(vec3(0.5) - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  t *= t; t *= t;
  vec2 ga = normalize(hash22f(i) - 0.5 + 1e-4);
  vec2 gb = normalize(hash22f(i + j) - 0.5 + 1e-4);
  vec2 gc = normalize(hash22f(i + vec2(1.0)) - 0.5 + 1e-4);
  return clamp(0.5 + 32.0 * dot(t, vec3(dot(ga, a), dot(gb, b), dot(gc, c))), 0.0, 1.0);
}

// Sculpted obsidian Voronoi + Simplex mineral fracture field shown ONLY while
// the user scrubs rapidly across module tabs (zero GPU cost when u_scrub == 0).
vec3 scrubLattice(vec2 frag) {
  float minDim = max(min(u_res.x, u_res.y), 1.0);
  vec2 uv = (frag - 0.5 * u_res) / minDim;
  float t = u_time;
  float phase = u_scrubPulse.x;
  float pulse = clamp(u_scrubPulse.y, 0.0, 1.0);

  // Subtle dual-octave Simplex tectonic tension (~0.2 cell units): keeps Voronoi
  // shards crisp and architectural like fractured obsidian while flowing on clicks.
  vec2 sBase = uv * 2.1 + vec2(t * 0.22 + phase * 0.36, -t * 0.16 - phase * 0.22);
  float s1 = scrubSimplex(sBase);
  float s2 = scrubSimplex(sBase * 2.0 + vec2(4.7, -3.1));
  vec2 warp = (vec2(s1, s2) - 0.5) * (0.044 + 0.024 * pulse);
  vec2 g = (uv + warp) * 4.6;
  vec2 ig = floor(g), fg = fract(g);

  float f1 = 8.0, f2 = 8.0;
  vec2 bestOff = vec2(0.0);
  vec2 bestId = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 n = vec2(float(x), float(y));
      vec2 id = ig + n;
      vec2 rnd = hash22f(id);
      vec2 pt = n + 0.5 + 0.37 * sin(t * 0.65 + phase * 1.45 + 6.28318 * rnd) - fg;
      float d = dot(pt, pt);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        bestOff = pt;
        bestId = id;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  f1 = sqrt(f1);
  f2 = sqrt(f2);
  float edge = max(0.0, f2 - f1);

  // Architectural beveled slate facets with crisp planar tilt and studio key light.
  vec2 facetTilt = (hash22f(bestId + 19.3) - 0.5) * 0.82 + (vec2(s1, s2) - 0.5) * 0.14;
  vec3 N = normalize(vec3(facetTilt - bestOff * 0.14, 1.0));
  vec3 L = normalize(vec3(
    -0.54 + 0.18 * sin(t * 0.52 + phase * 0.85) + u_ptr.x * 0.36,
    0.58 + 0.14 * cos(t * 0.40 - phase * 0.65) - u_ptr.y * 0.28,
    0.62
  ));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float diff = smoothstep(-0.12, 1.0, dot(N, L));
  float spec = pow(max(dot(N, H), 0.0), 36.0);
  float cellTone = 0.60 + 0.40 * hash21f(bestId + 7.1);

  vec3 stone = mix(NIGHT, vec3(0.095, 0.112, 0.148), diff * cellTone);
  stone += vec3(0.18, 0.21, 0.26) * spec * cellTone;
  // Crisp dark chamfer groove framing every polygonal obsidian shard.
  stone *= 1.0 - 0.64 * exp(-edge * 22.0);

  // Smooth pinhole-free mineral fracture inlay (no fwidth cusp breaks on Voronoi ridges).
  float seam = 1.0 - smoothstep(0.005, 0.032, edge);
  float bevelGlow = exp(-edge * 16.0);
  float rippleDist = length(uv) - (1.0 - pulse) * 0.95;
  float wave = exp(-rippleDist * rippleDist * 14.0) * pulse;
  float lumGate = smoothstep(0.32, 0.86, s1 * 0.60 + s2 * 0.40 + wave * 0.55);

  vec3 tint = mix(vec3(0.76, 0.83, 0.94), u_scrubTint, 0.88);
  vec3 col = stone;
  col += tint * bevelGlow * (0.08 + 0.15 * lumGate + 0.18 * wave);
  col += mix(tint, vec3(1.0), 0.38) * seam * (0.16 + 0.56 * lumGate + 0.42 * wave);

  // Vignette cleanly into NIGHT so the target readout stays high-contrast.
  float rad = length(uv * vec2(0.84, 1.02));
  col = mix(col, NIGHT, smoothstep(0.32, 1.22, rad) * 0.68);
  col += (hash21f(frag + fract(t) * 13.0) - 0.5) * 0.008;
  return clamp(col, 0.0, 1.0);
}

// Aspect-preserving cover mapping centered on focus; wide NightBand strips
// broaden scale gently so diagonal edges stay in frame without stretching.
vec2 materialUV(vec2 frag, vec2 res, vec2 focus, float band) {
  float aspect = res.x / max(res.y, 1.0);
  float s = mix(max(res.x, res.y), res.x * 0.68, band * clamp((aspect - 1.6) / 2.4, 0.0, 1.0));
  return (vec2(frag.x, res.y - frag.y) - 0.5 * res) / s + focus;
}

vec3 finishColor(vec3 col, float amp, float band) {
  float k = clamp(amp, 0.0, 1.0);
  // Calm exposure slightly inside a wide page header band behind module titles.
  col *= mix(1.0, 0.78, band);
  // Highlights recede first as the surface dips down into night.
  vec3 dimmed = mix(col * (0.28 + 0.72 * k), pow(max(col, 0.0), vec3(1.18)) * k, 1.0 - k);
  vec3 base = clamp(mix(NIGHT, dimmed, k), 0.0, 1.0);
  if (u_scrub > 0.001) {
    float s = clamp(u_scrub, 0.0, 1.0);
    s = s * s * (3.0 - 2.0 * s);
    base = mix(base, scrubLattice(gl_FragCoord.xy), s);
  }
  return base;
}
`;

const CHAMFER_FS = `${PREAMBLE}
vec2 saltOff(float salt) { return vec2(fract(salt * 0.173) * 89.1, fract(salt * 0.317) * 107.3); }
float noise(vec2 p, float salt) {
  vec2 i = floor(p), t = fract(p);
  t = t * t * (3.0 - 2.0 * t);
  vec2 off = saltOff(salt);
  return mix(
    mix(hash21f(i + off), hash21f(i + vec2(1.0, 0.0) + off), t.x),
    mix(hash21f(i + vec2(0.0, 1.0) + off), hash21f(i + vec2(1.0, 1.0) + off), t.x),
    t.y
  );
}
vec3 nd(vec2 p, float salt) {
  vec2 i = floor(p), f = fract(p);
  vec2 w = f * f * (3.0 - 2.0 * f);
  vec2 dw = 6.0 * f * (1.0 - f);
  vec2 off = saltOff(salt);
  float a = hash21f(i + off), b = hash21f(i + vec2(1.0, 0.0) + off);
  float c = hash21f(i + vec2(0.0, 1.0) + off), d = hash21f(i + vec2(1.0, 1.0) + off);
  return vec3(
    mix(mix(a, b, w.x), mix(c, d, w.x), w.y),
    dw.x * mix(b - a, d - c, w.y),
    dw.y * mix(c - a, d - b, w.x)
  );
}
// Analytical paper tooth gradient: 1 pass instead of 3 finite-difference evaluations (3x faster on mobile).
float paper(vec2 p, float illumination, float angle, float salt, float fineFade) {
  float s = sin(angle), c = cos(angle);
  vec2 q = mat2(c, -s, s, c) * p + salt * 0.034;
  vec3 n1 = nd(q * vec2(480.0, 760.0), 11.0);
  vec3 n2 = nd(q * vec2(1150.0, 1480.0), 29.0);
  float h = n1.x * 0.50 + n2.x * 0.38;
  vec2 dh = n1.yz * vec2(0.44, 0.68) * 0.34 + n2.yz * vec2(0.42, 0.52) * 0.42;
  if (fineFade > 0.35) {
    vec3 n3 = nd(q * 2520.0, 41.0);
    h += n3.x * 0.12 * fineFade;
    dh += n3.yz * 0.24 * fineFade;
  }
  float grains = clamp(0.49 + 0.72 * dot(dh, vec2(0.55, -0.85)), 0.0, 1.0);
  float sparkle = pow(grains, 3.9);
  float fibre = noise(vec2(q.x * 2350.0, q.y * 740.0), salt + 83.0);
  float low = noise(q * 42.0, salt + 17.0) * 0.60 + noise(q * 112.0, salt + 61.0) * 0.40;
  float micro = fineFade > 0.40 ? (hash21f(floor(q * 4800.0) + salt) - 0.5) * fineFade : 0.0;
  float structure = 0.64 + (h - 0.5) * 1.7 + 0.52 * dot(dh, vec2(0.55, -0.85)) + sparkle * 0.42 + (fibre - 0.5) * 0.30 + micro * 0.08;
  structure = mix(0.72, structure, 0.80 * mix(0.45, 1.0, fineFade));
  return max(0.0, illumination * structure * (0.85 + 0.30 * low));
}

void main() {
  if (u_scrub > 0.995) { fragColor = vec4(scrubLattice(gl_FragCoord.xy), 1.0); return; }
  vec2 p = materialUV(gl_FragCoord.xy, u_res, vec2(0.46, 0.48), u_band);
  float pixel = 1.0 / max(min(u_res.x, u_res.y), 1.0);
  float fineFade = smoothstep(0.25, 0.95, u_px) * mix(0.50, 1.0, clamp(u_quality, 0.0, 1.0));
  float t = u_time;

  // Razor-sharp stacked cotton-paper sheets illuminated by a gliding studio softbox.
  float slope = 0.711;
  float d = (p.x - (0.205 + slope * p.y)) / sqrt(1.0 + slope * slope);
  float topMask = smoothstep(-pixel * 0.55, pixel * 0.55, d);

  // Studio softbox sweep & subtle warm cotton raking light (only light moves, cut edges stay sharp).
  float sweepCoord = p.x * 0.72 - p.y * 0.55 - 0.10 + 0.24 * sin(t * 0.38) + u_ptr.x * 0.26 - u_ptr.y * 0.18;
  float sweep = 0.88 + 0.52 * exp(-pow(sweepCoord * 2.4, 2.0));
  float edgeSheen = 0.76 + 0.44 * exp(-pow(sin(p.y * 3.1 - t * 0.62), 2.0) * 3.0);

  float value = 0.0;
  if (topMask < 0.999) {
    vec2 a2 = vec2(-0.13, 0.895), b2 = vec2(0.386, 0.452);
    float d2 = dot(p - a2, normalize(vec2(-(b2 - a2).y, (b2 - a2).x)));
    float clip2 = 2.0 - p.x;
    float mask2 = smoothstep(-pixel, pixel, d2) * smoothstep(0.0, pixel, clip2);

    vec2 a = vec2(-0.1, 0.579), b = vec2(0.296, 0.314);
    vec2 tangent = normalize(b - a), normal = vec2(-tangent.y, tangent.x);
    float across = dot(p - a, normal);
    float along = dot(p - a, tangent);
    float upperMask = smoothstep(-pixel, pixel, across)
      * (1.0 - smoothstep(0.202 - pixel, 0.202 + pixel, across))
      * (1.0 - smoothstep(0.493, 0.497, along));

    if (upperMask < 0.999) {
      if (mask2 < 0.999) {
        float backLight = (0.008 + 0.011 * exp(-dot((p - vec2(0.04, 0.20)) * vec2(2.0, 1.5), (p - vec2(0.04, 0.20)) * vec2(2.0, 1.5)))) * (0.90 + 0.22 * sweep);
        value = paper(p, backLight, -0.12, 101.0, fineFade);
      }
      if (mask2 > 0.001) {
        float leftGlow = (0.064 + 0.056 * (1.0 - p.y) + 0.014 * (1.0 - p.x)) * sweep;
        value = mix(value, paper(p, leftGlow, 0.57, 201.0, fineFade), mask2);
      }
      float edge2 = exp(-pow(d2 / (pixel * 0.52 + 0.00020), 2.0));
      value += edge2 * (0.35 + 0.22 * (1.0 - p.x)) * smoothstep(0.01, 0.045, clip2) * (1.0 - smoothstep(0.65, 0.69, dot(p - a2, normalize(b2 - a2)))) * edgeSheen;
    }

    float contact = exp(-max(across - 0.202, 0.0) * 130.0) * step(0.202, across) * (1.0 - smoothstep(0.45, 0.49, along));
    value *= 1.0 - 0.72 * contact;
    if (upperMask > 0.001) {
      float middleLight = (0.094 + 0.028 * exp(-pow((p.x - 0.17) * 2.0, 2.0))) * sweep;
      value = mix(value, paper(p, middleLight, 0.52, 301.0, fineFade), upperMask);
    }
    float line1 = exp(-pow(across / (pixel * 0.54 + 0.00014), 2.0));
    value += line1 * (0.50 + 0.14 * noise(p * 220.0, 99.0)) * (1.0 - smoothstep(0.44, 0.49, along)) * edgeSheen;

    // Soft cast penumbra underneath the raised top sheet reacting gently to light angle.
    float gap = 0.024 + 0.004 * sin(t * 0.38) - 0.004 * u_ptr.x;
    float shadow = exp(-pow(max(-d, 0.0) / max(gap, 0.014), 0.72));
    value *= 1.0 - 0.94 * shadow;
    value *= 1.0 - 0.84 * exp(-dot((p - vec2(0.46, 0.47)) * vec2(9.0, 7.0), (p - vec2(0.46, 0.47)) * vec2(9.0, 7.0)));
  }

  if (topMask > 0.001) {
    vec2 pc = clamp(p, vec2(-0.15), vec2(1.15));
    float broad = max(0.014, ((0.26269294) + (0.19789924)*pc.y + (-1.64239981)*pc.x + (-0.34928535)*pc.y*pc.y + (-1.22674591)*pc.x*pc.y + (5.01777898)*pc.x*pc.x + (0.69970572)*pc.y*pc.y*pc.y + (-0.50706878)*pc.x*pc.y*pc.y + (1.35846301)*pc.x*pc.x*pc.y + (-4.95569238)*pc.x*pc.x*pc.x + (-0.84410177)*pc.y*pc.y*pc.y*pc.y + (1.32069473)*pc.x*pc.y*pc.y*pc.y + (-0.39752031)*pc.x*pc.x*pc.y*pc.y + (-0.63847640)*pc.x*pc.x*pc.x*pc.y + (1.75377372)*pc.x*pc.x*pc.x*pc.x) * 1.18);
    float plane = paper(p, broad * sweep, 0.85, 401.0, fineFade);
    plane *= 0.90 + 0.10 * noise(p * 9.0, 499.0);
    value = mix(value, plane, topMask);
  }

  float edgeWidth = 0.00032 + pixel * 0.25;
  float edge = exp(-pow(d / edgeWidth, 2.0));
  float edgeLight = (0.86 - 0.36 * p.y) * (0.90 + 0.10 * noise(p * 520.0, 411.0)) * edgeSheen;
  value += edge * edgeLight;

  float vignette = 1.0 - 0.09 * dot(p - 0.5, p - 0.5);
  vec3 color = vec3(value * vignette);
  fragColor = vec4(finishColor(color, u_amp, u_band), 1.0);
}
`;

export function moduleFragmentShader(): string {
  return CHAMFER_FS;
}
