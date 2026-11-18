// clouds.js — sky-dome cloud layer (P2). Procedural thin-shell raymarch + layered fallback.
//
// Technique attribution (all MIT, clean-room ports — values/recipes, no source text vendored):
//   - sebh/UnrealEngineSkyAtmosphere (© 2020 Epic Games, MIT) — planet frame, LUT parametrizations
//     (transmittance / sky-view / multi-scatter UV math) via the shared uniforms of sky.js.
//   - sebh/TileableVolumeNoise (© Sebastien Hillaire, MIT) — tileable Perlin/Worley 3D noise:
//     wrapped-lattice gradient noise + wrapped-cell Worley billow, baked to a 128^3 RGBA8
//     Data3DTexture at first enable (GLSL slice bake + readRenderTargetPixels, the takram
//     Procedural3DTexture slice pattern).
//   - takram-design-engineering/three-geospatial @takram/three-clouds (© 2024 Shota Matsuda, MIT)
//     — coverage remap (cites Skybolt), worley-fbm octave weights (0.625/0.25/0.125), altitude/
//     density parametrization, transmittance-LUT-reuse lighting.
//   - SebLague/Clouds (© 2019 Sebastian Lague, MIT) — slab march skeleton (dithered entry,
//     2-step light march, Beer-Lambert, early-out transmittance), vertical height profile.
//   - CK42BB/procedural-clouds-threejs (© 2026 Kingsley, MIT) — dual-lobe HG phase + powder
//     term conventions, cirrus sheet treatment.
//   Papers: Hillaire EGSR-2020 + Frostbite 2016 course (ambient from the multi-scatter LUT,
//   slide-28-style segment integral), Schneider Nubis 2015 (coverage remap, Beer-powder).
//
// Design of record: analysis/R13_CLOUDS_RESEARCH.md (§2/§3), integrated ADDITIVELY on top of
// editor/js/sky.js: the classic dome path is byte-identical when clouds are OFF (mesh invisible,
// material never compiled, no shader-source edits to sky.js).
//
// Compositing: opaque pass, renderOrder -1 (realistic dome at -2 when clouds are on), CustomBlending
// src=ONE / dst=SRC_ALPHA => dst' = src.rgb + src.a * dst.rgb, outColor = (Lcloud, Tview):
// radiance added, sky behind attenuated by the march transmittance — that product IS the
// aerial-perspective factor (1 - exp(-distance * density)), realized by the blend equation.
import * as THREE from './vendor/three.module.js';
import { C } from './const.js';

// ---- file-private constants (CL_* = cloud layer) ----
const CL_SHAPE_RES = 128;        // 3D noise texture edge (RGBA8)
const CL_SHAPE_TILE_KM = 12.0;   // r13 fix: 40km made the whole sky sample one ~texel corner patch (12km -> cumulus-scale variety)   // world km covered by one noise tile (repeat-wrapped)
const CL_SIGMA_K = 0.9;          // cloud extinction per unit density, 1/km (research §3.5)
const CL_LIGHT_EXTINCT_K = 3.0;  // r13 tune: EXTRA extinction for the sun march — real water clouds are tau>>10 optically; at SIGMA_K alone a 1.2km deck transmits ~16% of the sun and the overcast base glows white (measured luma 0.87 vs the 0.35-0.6 mid-gray target). x3 => tau~5, Tlight~0.006 through a full deck, ~0.1-0.3 through cumulus sides = real sun-side/lee-side shading.
const CL_ALBEDO = 0.96;          // scattering albedo (whiteness)
const CL_TMAX_KM = 30.0;         // absolute slab clamp for grazing rays
const CL_MARCH_SPAN_KM = 15.0;    // r13: marched span cap — keeps dt <= ~375m at 40 steps so shallow rays sample the noise field finely enough
const CL_AERIAL_K = 0.05;        // aerial-perspective strength per km per unit density
const CL_HORIZON_FADE = 0.09;   // r13 tune: cloud-alpha fade over the lowest ~5° of elevation (grazing rays: 15km of slab march saturates L and the alpha seam at the floor line reads as a blowout band)
const CL_CIRRUS_KM = 7.0;        // cirrus sheet altitude (6-8 km band)
const CL_DETAIL_FREQ = 9.0;      // erosion re-sample frequency multiplier (r13 tune: 6 under-eroded at 12km tiles — fat feathered edges)
const CL_DETAIL_STRENGTH = 0.5; // erosion depth (Nubis) (r13 tune: 0.35 left edges mushy)
const CL_SHEET_COUNT = 6;        // layered fallback sheets (4-6; atlas rows)
const CL_SHEET_ATLAS_W = 256;
const CL_SHEET_RELIEF = 1.8;     // layered normal strength (r13 tune: 1.4 read as a washed sheet — the VLM acceptance pass wanted more veil modulation)
const CL_STEPS_MIN = 32;         // procedural primary march (32-48)
const CL_STEPS_MAX = 48;
const CL_STEPS_DEFAULT = 40;
const CL_WIND_UV_PER_UNIT = 0.02; // windSpeed 0..3 -> uv drift per second

const satJs = x => Math.min(1, Math.max(0, x));
// R13 §3.4 remap — the denominator keeps its SIGN: inverted ranges like remap(hn, 1.0,
// 0.30, 0.0, 1.0) (the cumulus "rounded top" profile) are intentional call sites; a
// max(h0-l0, eps) guard would zero them and with them the whole density field.
const remapJs = (v, l0, h0, l1, h1) => l1 + satJs((v - l0) / (h0 - l0)) * (h1 - l1);

// =====================================================================================
// GLSL — tileable noise bake (sebh/TileableVolumeNoise clean-room: wrapped gradient
// Perlin + wrapped-cell Worley billow). One fullscreen pass per z-slice into RGBA8.
// =====================================================================================
const CL_BAKE_VERT = /* glsl */`
  out vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const CL_NOISE_FRAG = /* glsl */`
  precision highp float;
  in vec2 vUv;
  layout(location = 0) out vec4 outColor;
  uniform float uZ;                       // slice depth in [0,1)

  float sat(float x) { return clamp(x, 0.0, 1.0); }
  // R13 §3.4 remap — signed denominator (see remapJs note; inverted ranges are call sites)
  float remap(float v, float l0, float h0, float l1, float h1) {
    return l1 + sat((v - l0) / (h0 - l0)) * (h1 - l1);
  }
  // deterministic wrapped-lattice hash (TileableVolumeNoise technique: mod on the integer cell)
  vec3 hash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
  }
  // tileable gradient (Perlin) noise — gradients at the 8 lattice corners, indices wrapped mod period
  float gradNoise(vec3 x, float period) {
    vec3 p = floor(x), w = fract(x);
    vec3 u = w * w * w * (w * (w * 6.0 - 15.0) + 10.0);
    #define CLG(o) dot(normalize(hash33(mod(p + (o), period)) * 2.0 - 1.0 + vec3(1e-4)), w - (o))
    float a = CLG(vec3(0.0, 0.0, 0.0)), b = CLG(vec3(1.0, 0.0, 0.0));
    float c = CLG(vec3(0.0, 1.0, 0.0)), d = CLG(vec3(1.0, 1.0, 0.0));
    float e = CLG(vec3(0.0, 0.0, 1.0)), f = CLG(vec3(1.0, 0.0, 1.0));
    float g = CLG(vec3(0.0, 1.0, 1.0)), h = CLG(vec3(1.0, 1.0, 1.0));
    #undef CLG
    return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
               mix(mix(e, f, u.x), mix(g, h, u.x), u.y), u.z);
  }
  float perlinFbm(vec3 x, float period, float octaves) {
    float sum = 0.0, amp = 0.5;
    for (float i = 0.0; i < octaves; i += 1.0) {
      sum += gradNoise(x, period) * amp;
      x *= 2.0; period *= 2.0; amp *= 0.5;
    }
    return sum;
  }
  // tileable Worley billow (1 - distance to the nearest wrapped feature point)
  float worleyBillow(vec3 x, float period) {
    vec3 p = floor(x), f = fract(x);
    float d = 1.0;
    for (int xo = -1; xo <= 1; xo++)
    for (int yo = -1; yo <= 1; yo++)
    for (int zo = -1; zo <= 1; zo++) {
      vec3 o = vec3(float(xo), float(yo), float(zo));
      vec3 diff = o + hash33(mod(p + o, period)) - f;
      d = min(d, dot(diff, diff));
    }
    return 1.0 - sqrt(d);
  }
  void main() {
    vec3 p = vec3(vUv, uZ);
    // R: Perlin-Worley base (perlin biases billow worley — Nubis recipe)
    float per = sat(0.5 + perlinFbm(p * 4.0, 4.0, 3.0));
    float w4 = worleyBillow(p * 4.0, 4.0);
    float r = remap(per, 0.0, 1.0, w4, 1.0);
    // G/B/A: worley fbm octaves at rising frequency (freq == period keeps tiling exact)
    float g = 0.625 * worleyBillow(p * 4.0, 4.0) + 0.375 * worleyBillow(p * 8.0, 8.0);
    float b = 0.625 * worleyBillow(p * 8.0, 8.0) + 0.375 * worleyBillow(p * 16.0, 16.0);
    float a = 0.625 * worleyBillow(p * 16.0, 16.0) + 0.375 * worleyBillow(p * 32.0, 32.0);
    outColor = vec4(clamp(vec3(r, g, b), 0.0, 1.0), a);
  }
`;

// =====================================================================================
// GLSL — cloud dome material (GLSL3, xyww far-plane, same recipe as the sky dome).
// uSteps > 0: procedural thin-shell march. uSteps == 0: layered sheet fallback.
// =====================================================================================
const CL_CLOUD_VERT = /* glsl */`
  out vec3 vDirection;
  void main() {
    vDirection = position;
    vec4 clip = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
    gl_Position = clip.xyww;      // sky at infinity: view rotation only
  }
`;

// atmosphere chunk (LUT parametrizations ported from sky.js — must match EXACTLY so the
// cloud shader reads the same LUTs the dome does; uBottomRadius/uTopRadius are SHARED
// uniform objects with sky.js so the values can never drift)
const CL_ATMOS_CHUNK = /* glsl */`
  #define PI 3.14159265358979
  #define SKYVIEW_W 192.0
  #define SKYVIEW_H 108.0
  #define MS_RES_F 32.0
  #define SHAPE_TILE_KM ${CL_SHAPE_TILE_KM.toFixed(1)}
  #define SIGMA_K ${CL_SIGMA_K.toFixed(4)}
  #define LIGHT_EXTINCT_K ${CL_LIGHT_EXTINCT_K.toFixed(2)}
  #define ALBEDO ${CL_ALBEDO.toFixed(3)}
  #define DETAIL_FREQ ${CL_DETAIL_FREQ.toFixed(1)}
  #define DETAIL_STRENGTH ${CL_DETAIL_STRENGTH.toFixed(3)}
  #define TMAX_KM ${CL_TMAX_KM.toFixed(1)}
  #define MARCH_SPAN_KM ${CL_MARCH_SPAN_KM.toFixed(1)}
  #define AERIAL_K ${CL_AERIAL_K.toFixed(4)}
  #define CIRRUS_KM ${CL_CIRRUS_KM.toFixed(2)}
  #define HORIZON_FADE ${CL_HORIZON_FADE.toFixed(3)}

  uniform vec3 uSunDir;
  uniform vec3 uSunIlluminance;
  uniform vec3 uCameraPosKm;             // SHARED with sky.js (planet frame, km)
  uniform float uBottomRadius;           // SHARED
  uniform float uTopRadius;              // SHARED

  float sat(float x) { return clamp(x, 0.0, 1.0); }
  // R13 §3.4 remap — signed denominator (see remapJs note; inverted ranges are call sites)
  float remap(float v, float l0, float h0, float l1, float h1) {
    return l1 + sat((v - l0) / (h0 - l0)) * (h1 - l1);
  }
  float fromUnitToSubUvs(float u, float resolution) { return (u + 0.5 / resolution) * (resolution / (resolution + 1.0)); }
  float fromSubUvsToUnit(float u, float resolution) { return (u - 0.5 / resolution) * (resolution / (resolution - 1.0)); }

  // lutTransmittanceParamsToUv (Bruneton 2017) — faithful port of sky.js's GLSL
  void lutTransmittanceParamsToUv(float viewHeight, float viewZenithCosAngle, out vec2 uv) {
    float H = sqrt(max(0.0, uTopRadius * uTopRadius - uBottomRadius * uBottomRadius));
    float rho = sqrt(max(0.0, viewHeight * viewHeight - uBottomRadius * uBottomRadius));
    float discriminant = viewHeight * viewHeight * (viewZenithCosAngle * viewZenithCosAngle - 1.0) + uTopRadius * uTopRadius;
    float d = max(0.0, -viewHeight * viewZenithCosAngle + sqrt(discriminant));
    float d_min = uTopRadius - viewHeight;
    float d_max = rho + H;
    uv = vec2((d - d_min) / (d_max - d_min), rho / H);
  }
  // skyViewLutParamsToUv — the dome's parametrization (same-direction LUT fetch for aerial haze)
  void skyViewLutParamsToUv(bool intersectGround, float viewZenithCosAngle, float lightViewCosAngle, float viewHeight, out vec2 uv) {
    float Vhorizon = sqrt(viewHeight * viewHeight - uBottomRadius * uBottomRadius);
    float CosBeta = Vhorizon / viewHeight;
    float Beta = acos(CosBeta);
    float ZenithHorizonAngle = PI - Beta;
    if (!intersectGround) {
      float coord = acos(viewZenithCosAngle) / ZenithHorizonAngle;
      coord = 1.0 - coord;
      coord = sqrt(coord);
      uv.y = (1.0 - coord) * 0.5;
    } else {
      float coord = (acos(viewZenithCosAngle) - ZenithHorizonAngle) / Beta;
      coord = sqrt(max(0.0, coord));
      uv.y = coord * 0.5 + 0.5;
    }
    float cx = -lightViewCosAngle * 0.5 + 0.5;
    uv.x = sqrt(max(0.0, cx));
    uv = vec2(fromUnitToSubUvs(uv.x, SKYVIEW_W), fromUnitToSubUvs(uv.y, SKYVIEW_H));
  }
  // ray-sphere both roots (planet center at the origin, rd normalized)
  vec2 raySphereTwo(vec3 ro, vec3 rd, float R) {
    float b = dot(ro, rd);
    float c = dot(ro, ro) - R * R;
    float disc = b * b - c;
    if (disc < 0.0) return vec2(-1.0);
    float s = sqrt(disc);
    return vec2(-b - s, -b + s);
  }
`;

const CL_CLOUD_FRAG = /* glsl */`
  precision highp float;
  precision highp sampler3D;
${CL_ATMOS_CHUNK}
  // ---- cloud state ----
  uniform highp sampler3D uShapeTex;     // 128^3 RGBA8: R perlin-worley, G/B/A worley fbm
  uniform sampler2D uTransmitTex;        // sky.js transmittance LUT (sun tint at cloud top)
  uniform sampler2D uSkyViewLut;         // sky.js sky-view LUT (aerial haze / horizon convergence)
  uniform sampler2D uMultiScatTex;       // sky.js multi-scatter LUT (ambient)
  uniform sampler2D uSheetAtlas;         // layered fallback: CL_SHEET_COUNT rows, RGBA8
  uniform float uCoverage;               // 0..1 (weather-coupled user coverage)
  uniform float uDensity;                // density multiplier 0.25..4
  uniform float uCirrus;                 // thin high sheet alpha 0..1
  uniform float uBaseKm;                 // slab base altitude above the planet surface
  uniform float uHeightKm;               // slab thickness
  uniform vec2 uWindOffset;              // wind uv offset (CPU-animated; frozen when static)
  uniform float uNightAmount;            // 0 day .. 1 night (sun -> moon)
  uniform vec3 uMoonDir;
  uniform int uSteps;                    // primary march steps (0 = layered path)
  uniform int uSheetCount;               // layered sheets
  uniform float uPowderScale;            // powder term (defaults 1.0 / 4.0)
  uniform float uPowderExponent;
  // ---- output/tone (mirror sky.js dome conventions exactly) ----
  uniform float uExposure;
  uniform vec3 uWhitePoint;
  uniform float uOutputSRGB;             // 1 plain render (OETF), 0 finish RT / PMREM (linear)
  uniform float uToneMap;                // 1 visible dome (demo curve), 0 PMREM (linear HDR)
  uniform float uCurve;                  // round 13 (HDR): 1 = legacy demo post curve, 0 = linear HDR out
                                         // (mirrors the dome's uCurve split — under finish+HDR the deck
                                         // must live in the SAME linear space as the dome it occludes;
                                         // the premultiplied over-composite crossfades the two)
  uniform float uWeatherDesat, uWeatherDarken;
  uniform vec3 uFogColor;                // linear working space (=== scene.fog.color)
  uniform float uFogBlend;
  in vec3 vDirection;
  layout(location = 0) out vec4 outColor;

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  vec3 linearToSrgb(vec3 c) {
    vec3 lo = c * 12.92;
    vec3 hi = 1.055 * pow(max(c, vec3(0.0031308)), vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(vec3(0.0031308), c));
  }
  float hg(float mu, float g) {
    float g2 = g * g;
    return (1.0 - g2) / (4.0 * PI * pow(max(1.0 + g2 - 2.0 * g * mu, 1e-4), 1.5));
  }
  // dual-lobe HG: base/back lobe g=0.6, forward lobe g=0.95 weighted by mu (silver lining)
  float phase2(float mu) { return mix(hg(mu, 0.6), hg(mu, 0.95), sat(mu * 0.5 + 0.5)); }

  // density: coverage->threshold remap of the 3D fbm (perlin-worley minus worley fbm) x
  // vertical profile; erosion from the same texture at DETAIL_FREQ (single-texture detail)
  float sampleDensity(vec3 pKm) {
    float h = length(pKm) - uBottomRadius;
    float hn = sat((h - uBaseKm) / max(uHeightKm, 1e-4));
    vec3 p = (pKm + vec3(uWindOffset.x, 0.0, uWindOffset.y) * SHAPE_TILE_KM) / SHAPE_TILE_KM
    + vec3(0.37, 0.0, 0.63);            // r13 fix: deterministic origin offset — avoids the (0,~0.06,0) corner hole (RepeatWrapping makes any offset valid)
    vec4 s = texture(uShapeTex, p);
    float lowFreqFBM = s.g * 0.625 + s.b * 0.25 + s.a * 0.125;         // takram octave weights
    float base = remap(s.r, lowFreqFBM - 1.0, 1.0, 0.0, 1.0);          // Nubis base+fbm
    float covThr = pow(1.0 - uCoverage, 1.15);                         // r13 tune: the raw field skews low — a linear knee yielded ~14% effective coverage at user 0.5
    base = remap(base, covThr, 1.0, 0.0, 1.0);                         // Schneider coverage remap (pow-knee)                // Schneider coverage remap
    // vertical profile: cumulus (rounded top, tapered base) flattened toward stratus for thin decks
    float stratusW = sat(1.0 - uHeightKm / 1.2);                       // thin slab -> flat deck
    float cumulus = sat(remap(hn, 0.0, 0.12, 0.0, 1.0)) * sat(remap(hn, 1.0, 0.30, 0.0, 1.0));
    float stratus = sat(remap(hn, 0.0, 0.05, 0.0, 1.0)) * sat(remap(hn, 1.0, 0.10, 0.0, 1.0));
    float prof = mix(cumulus, stratus, stratusW);
    vec3 dp = p * vec3(DETAIL_FREQ, DETAIL_FREQ * 3.5, DETAIL_FREQ);   // r13 tune: vertical anisotropy — a 1.2km slab sampled at one frequency reads as horizontal strata
    vec4 d = texture(uShapeTex, dp);
    float detailFBM = d.g * 0.625 + d.b * 0.25 + d.a * 0.125;
    base = remap(base, detailFBM * DETAIL_STRENGTH, 1.0, 0.0, 1.0);    // billow erosion
    return uDensity * base * prof;
  }

  // 2-step secondary sun march — density midpoints (NOT Beer shadow maps).
  // r13 tune: reach 0.4/1.6 km toward the sun (scaled by deck thickness) — the old 0.12/0.36 km
  // samples stayed inside one ~3km noise cell, so Tlight was near-constant and cloud bodies
  // had no sun-side/lee-side shading at all. Same sample count (cost unchanged).
  float lightMarch(vec3 p, vec3 Ld) {
    float s = max(uHeightKm, 1.0) / 1.2;
    float d1 = sampleDensity(p + Ld * (0.4 * s));
    float d2 = sampleDensity(p + Ld * (1.6 * s));
    return exp(-SIGMA_K * LIGHT_EXTINCT_K * (d1 * 0.4 + d2 * 1.2) * s);
  }

  // shell [rBot, rTop] above the planet center — entry/exit along the ray;
  // both components < 0 when the ray misses
  vec2 shellSpan(vec3 ro, vec3 rd, float rBot, float rTop) {
    float camR = length(ro);
    vec2 top = raySphereTwo(ro, rd, rTop);
    vec2 bot = raySphereTwo(ro, rd, rBot);
    if (camR < rBot) {                          // below the shell (editor camera default)
      if (top.y < 0.0) return vec2(-1.0);       // looking down: never reaches it
      return vec2(bot.y, top.y);
    }
    if (camR < rTop) return vec2(0.0, top.y);   // inside the band
    if (top.x < 0.0) return vec2(-1.0);         // above, looking away
    return vec2(top.x, bot.y > top.x ? bot.y : top.y);
  }

  void main() {
    vec3 worldDir = normalize(vDirection);
    vec3 camPos = uCameraPosKm;
    float viewHeight = length(camPos);
    vec3 upVector = camPos / viewHeight;

    // shared lighting frame: sun -> moon at night (uNightAmount gates the mix + show-through)
    vec3 Ld = normalize(mix(uSunDir, uMoonDir, uNightAmount));
    vec3 Lc = uSunIlluminance * mix(vec3(1.0), vec3(0.42, 0.52, 0.75) * 0.05, uNightAmount);
    float mu = dot(worldDir, Ld);

    // sun transmittance at the cloud-top height (1 LUT fetch — warm low-sun clouds for free)
    float topH = uBottomRadius + uBaseKm + uHeightKm;
    {
      vec2 tuv;
      lutTransmittanceParamsToUv(topH, dot(uSunDir, upVector), tuv);
      Lc *= texture(uTransmitTex, tuv).rgb;
    }
    // ambient: the multi-scatter LUT at cloud-top height (1 fetch; sun-zenith + height params)
    vec3 msAmb;
    {
      vec2 muv = vec2(dot(Ld, upVector) * 0.5 + 0.5, (topH - uBottomRadius) / max(uTopRadius - uBottomRadius, 1e-4));
      muv = vec2(fromUnitToSubUvs(muv.x, MS_RES_F), fromUnitToSubUvs(muv.y, MS_RES_F));
      msAmb = texture(uMultiScatTex, muv).rgb * uSunIlluminance;
    }

    vec3 L = vec3(0.0);
    float Tview = 1.0;
    float densSum = 0.0;
    float distMean = 0.0;

    // ---- cirrus: thin high sheet (6-8 km), pure fbm alpha, no march ----
    if (uCirrus > 0.001) {
      vec2 span = shellSpan(camPos, worldDir, uBottomRadius + CIRRUS_KM - 0.35, uBottomRadius + CIRRUS_KM + 0.35);
      if (span.x >= 0.0 && span.y > 0.0) {
        vec3 pC = camPos + worldDir * max(span.x, 0.0);
        vec2 cuv = pC.xz / SHAPE_TILE_KM * 0.5 + uWindOffset * vec2(1.0, 0.35);
        float streak = texture(uShapeTex, vec3(cuv * 2.0, 0.5)).g * 0.625
                     + texture(uShapeTex, vec3(cuv * 4.0, 0.25)).b * 0.375;
        // r13 tune: contrast-normalized streak — the raw worley-fbm sits in ~[0.15,0.8], so the
        // old threshold (1-uCirrus*0.7 ~ 0.75) clipped ~everything: cirrus was invisible.
        // sC^3 keeps it to streak CORES: a thin veil additive over the sky clips to white
        // (the composite adds display-space radiance), so the veil must stay sparse + dim.
        float sC = sat(remap(streak, 0.34, 0.86, 0.0, 1.0));
        float aC = uCirrus * sC * sC * sC * sat(worldDir.y * 6.0 + 0.4);
        vec3 cirrusL = (Lc * (0.22 + 0.28 * phase2(mu)) + msAmb * 0.4) * 0.6;
        L += Tview * cirrusL * aC;
        Tview *= 1.0 - aC;
      }
    }

    if (uSteps > 0) {
      // ---- procedural: distance-scaled thin-shell march ----
      vec2 span = shellSpan(camPos, worldDir, uBottomRadius + uBaseKm, topH);
      if (span.x >= 0.0 && span.y > 0.0) {
        float spanCap = mix(2.0, MARCH_SPAN_KM, sat(worldDir.y * 6.6));            // r13 tune: near-horizontal rays march 2km (fog band + aerial carry the far field)
        float t0 = span.x, t1 = min(span.y, t0 + spanCap);   // r13 fix: cap the marched span (not 30km) — shallow rays' dt would straddle the ~300m noise features
        float nSteps = float(uSteps);
        float dt = (t1 - t0) / nSteps;
        float t = t0 + hash13(vec3(gl_FragCoord.xy, 0.0)) * dt;   // position-only dither (QA-safe)
        for (int i = 0; i < uSteps; i++) {
          vec3 p = camPos + worldDir * t;
          float rho = sampleDensity(p);
          if (rho > 1e-3) {
            float hn = sat((length(p) - uBottomRadius - uBaseKm) / max(uHeightKm, 1e-4));
            float sigmaT = SIGMA_K * rho;
            float sigmaS = ALBEDO * sigmaT;
            float Tlight = lightMarch(p, Ld);
            float powder = 1.0 - uPowderScale * exp(-SIGMA_K * rho * dt * uPowderExponent);
            vec3 E = Lc * Tlight * (0.60 + 0.45 * phase2(mu)) * mix(1.0, powder, sat(mu * 0.5 + 0.5))   // r13 fix: diffuse base like the cirrus/layered tiers (phase-only was ~30x too dark); r13 acceptance: 0.55 left lit tops at 210-225, short of near-white
                   + msAmb * 5.0 * (0.35 + 0.65 * hn);   // r13 fix: MS-LUT values are transfer factors (~0.02) — a deck underside reads ~30/255 without the boost
            vec3 Sint = (E * sigmaS - E * sigmaS * exp(-sigmaT * dt)) / sigmaT;   // Frostbite slide-28
            L += Tview * Sint;
            Tview *= exp(-sigmaT * dt);
            densSum += rho;
            if (Tview < 0.02) break;                                          // early-out
          }
          t += dt;
        }
        distMean = 0.5 * (t0 + t1);
        densSum = densSum / nSteps;
      }
    } else {
      // ---- layered fallback: parallax alpha sheets (atlas rows), Lambert + HG-style glint ----
      for (int i = 0; i < ${CL_SHEET_COUNT}; i++) {
        if (i >= uSheetCount) break;
        float fi = (float(i) + 0.5) / float(uSheetCount);
        float altKm = uBaseKm + uHeightKm * fi;
        vec2 span = shellSpan(camPos, worldDir, uBottomRadius + altKm, uBottomRadius + altKm + 0.01);
        if (span.x < 0.0 || span.y <= 0.0) continue;
        vec3 p = camPos + worldDir * span.y;
        vec2 uv = p.xz / SHAPE_TILE_KM + uWindOffset * (1.0 + fi);
        vec4 sh = texture(uSheetAtlas, vec2(uv.x, (float(i) + fract(uv.y)) / ${CL_SHEET_COUNT.toFixed(1)}));
        float aS = sh.a;
        if (aS < 0.004) continue;
        vec3 N = normalize(vec3((sh.r * 2.0 - 1.0) * ${CL_SHEET_RELIEF.toFixed(2)}, 1.0, (sh.g * 2.0 - 1.0) * ${CL_SHEET_RELIEF.toFixed(2)}));
        float wrap = sat((dot(N, Ld) + 0.35) / 1.35);
        vec3 Hv = normalize(Ld - worldDir);
        vec3 sheetL = (Lc * wrap + msAmb * 0.7) * 0.75            // r13 tune: sheets were full-sun white (Lc*wrap ~0.8 linear saturates the exposure-10 curve) — dim to keep deck texture readable. NOTE: the SKY_EXPOSURE-10 curve saturates at L≈0.35, so the 6-sheet zenith stack clips ~245-253 display regardless of this scale (0.68 tried r13 acceptance — identical display); layered is the FALLBACK tier, zenith clip documented as the known nit
          + Lc * pow(max(mu, 0.0), 8.0) * 0.25           // silver lining
          + Lc * pow(max(dot(N, Hv), 0.0), 24.0) * 0.06; // glint (ice cirrus / wet decks)
        L += Tview * sheetL * aS;
        Tview *= 1.0 - aS;                               // depth-fade between sheets
        if (Tview < 0.02) break;
      }
      distMean = max(distMean, uBaseKm + uHeightKm * 0.5);
    }

    // ---- aerial perspective: blend toward the sky-view LUT sample of the same direction ----
    // weight = 1 - exp(-distance * meanDensity): distant clouds converge into the sky/fog band
    float aerial = min(0.82, 1.0 - exp(-min(distMean, 22.0) * densSum * AERIAL_K));   // r13 fix: clamp slant distance + weight — near-horizon rays march 150km+ of slant and the unclamped term erased the whole deck into sky
    if (aerial > 0.001) {
      float viewZenithCosAngle = dot(worldDir, upVector);
      vec3 sideVector = normalize(cross(upVector, worldDir));
      vec3 forwardVector = normalize(cross(sideVector, upVector));
      vec2 lightOnPlane = normalize(vec2(dot(uSunDir, forwardVector), dot(uSunDir, sideVector)));
      vec2 groundProbe = raySphereTwo(camPos, worldDir, uBottomRadius);
      bool intersectGround = groundProbe.x >= 0.0;
      vec2 uv;
      skyViewLutParamsToUv(intersectGround, viewZenithCosAngle, lightOnPlane.x, viewHeight, uv);
      vec3 skyBehind = texture(uSkyViewLut, uv).rgb;
      L = mix(L, skyBehind, aerial);
    }
    // r13 tune: horizon alpha fade — the lowest ~5° of the deck melts into the dome's fog band
    // instead of ending in a saturated white slab + hard seam where the floor line cuts it.
    // L scales by the same fade so hf=0 is exactly the dome (L=0, alpha=1).
    float hf = smoothstep(0.0, HORIZON_FADE, worldDir.y);
    L *= hf;
    Tview = mix(1.0, Tview, hf);

    // mood ops (same Rec.601 desat + darken as the domes)
    float lum = dot(L, vec3(0.299, 0.587, 0.114));
    L = mix(vec3(lum), L, 1.0 - uWeatherDesat);
    L *= (1.0 - uWeatherDarken);
    if (uToneMap > 0.5 && uCurve > 0.5) L = vec3(1.0) - exp(-max(L, vec3(0.0)) / uWhitePoint * uExposure);
    // horizon fog band — same POST-curve linear mix as the dome (the dome mixes uFogColor into
    // its tonemapped L; matching it here removes the tone-order seam: pre-curve, fogColor 0.83
    // went through exp -> 0.9995 = the white blowout band where the deck met the floor line).
    float band = exp(-max(worldDir.y, 0.0) / 0.06);
    L = mix(L, uFogColor, band * mix(uFogBlend, 1.0, band));
    if (uOutputSRGB > 0.5) L = linearToSrgb(max(L, vec3(0.0)));
    // r13 tune: premultiplied over-composite. The blend is dst' = src.rgb + src.a * dst, so
    // emitting the RAW tonemapped radiance made semi-transparent edges ADD onto the intact
    // sky (exposure-10 tone curve expands a 0.02-linear edge to 0.45 sRGB -> every edge and
    // veil glowed/clipped white). Emitting C * (1 - Tview) turns the blend into a clean
    // display-space crossfade: opaque cores unchanged (Tview~0), edges fade to the dome, and
    // at the horizon dst' = fogColor*(1-T) + T*domeFog = fogColor exactly.
    L *= (1.0 - Tview);
    outColor = vec4(L, Tview);
  }
`;

export function createCloudLayer({ renderer, sky }) {
  if (!renderer || !sky || !sky.sharedUniforms) {
    throw new Error('createCloudLayer requires { renderer, sky } with sky.sharedUniforms');
  }
  const glsl3 = { glslVersion: THREE.GLSL3 };
  const su = sky.sharedUniforms;

  // ---- uniforms: scalars SHARED with sky.js (one-copy updates from sky.setParams/setCamera) ----
  const uniforms = {
    uSunDir: su.uSunDir,
    uSunIlluminance: su.uSunIlluminance,
    uCameraPosKm: su.uCameraPosKm,
    uBottomRadius: su.uBottomRadius,
    uTopRadius: su.uTopRadius,
    uShapeTex: { value: null },
    uTransmitTex: { value: null },
    uSkyViewLut: { value: null },
    uMultiScatTex: { value: null },
    uSheetAtlas: { value: null },
    uCoverage: { value: 0.45 },
    uDensity: { value: 1 },
    uCirrus: { value: 0.15 },
    uBaseKm: { value: 2.5 },
    uHeightKm: { value: 1.2 },
    uWindOffset: { value: new THREE.Vector2(0, 0) },
    uNightAmount: { value: 0 },
    uMoonDir: { value: new THREE.Vector3(0, -1, 0) },
    uSteps: { value: CL_STEPS_DEFAULT },
    uSheetCount: { value: CL_SHEET_COUNT },
    uPowderScale: { value: 1.0 },
    uPowderExponent: { value: 4.0 },
    uExposure: { value: C.SKY_EXPOSURE },
    uWhitePoint: { value: new THREE.Vector3(...C.SKY_WHITE_POINT) },
    uOutputSRGB: { value: 1 },
    uToneMap: { value: 1 },
    uCurve: { value: 1 },
    uWeatherDesat: { value: 0 },
    uWeatherDarken: { value: 0 },
    uFogColor: { value: new THREE.Color(0xffffff) },
    uFogBlend: { value: 0.06 },
  };
  // r13 P0 fix: bind the sky's LUT render targets — these were left null, so the cloud shader
  // sampled black for sun transmittance (direct light = 0), multi-scatter ambient (0) and the
  // aerial sky (0): the deck rendered as a pure transmittance silhouette + fog band (gray/black
  // clouds, no shading, aerial DARKENING). Texture objects are stable for the RT lifetime
  // (bake() renders into the same RTs; the dome's lazy bake always precedes the first frame).
  uniforms.uTransmitTex.value = sky.luts.transmittance.texture;
  uniforms.uSkyViewLut.value = sky.luts.skyView.texture;
  uniforms.uMultiScatTex.value = sky.luts.multiscat.texture;

  const material = new THREE.ShaderMaterial({
    ...glsl3,
    vertexShader: CL_CLOUD_VERT,
    fragmentShader: CL_CLOUD_FRAG,
    side: THREE.BackSide,
    // opaque pass with custom compositing: geometry drawn after (renderOrder >= 0) overdraws
    // the cloud dome, so mountains occlude clouds without a depth-texture read.
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.SrcAlphaFactor,
    transparent: false,
    depthTest: false,
    depthWrite: false,
    fog: false,
    uniforms,
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.raycast = () => {};
  mesh.visible = false;                       // OFF until first enable (never compiles)

  // PMREM twin: registered into the sky.js pmremScene via sky.setCloudTwin (dome-twin pattern)
  const twinMesh = new THREE.Mesh(mesh.geometry, material);
  twinMesh.frustumCulled = false;
  twinMesh.visible = false;

  // ---- lazy noise bake (renderer-level, one-time; shared by both modes) ----
  const bakeScene = new THREE.Scene();
  const bakeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    ...glsl3, vertexShader: CL_BAKE_VERT, fragmentShader: CL_NOISE_FRAG,
    depthTest: false, depthWrite: false, uniforms: { uZ: { value: 0 } },
  }));
  bakeQuad.frustumCulled = false;
  bakeScene.add(bakeQuad);
  const bakeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let shapeTex = null, noiseCPU = null, sheetAtlas = null;

  function bakeNoise3D() {
    const R = CL_SHAPE_RES;
    const rt = new THREE.WebGLRenderTarget(R, R, {
      format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
      wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
    });
    const data = new Uint8Array(R * R * R * 4);
    const slice = new Uint8Array(R * R * 4);
    const u = bakeQuad.material.uniforms;
    const prevRT = renderer.getRenderTarget();
    for (let z = 0; z < R; z++) {
      u.uZ.value = (z + 0.5) / R;
      renderer.setRenderTarget(rt);
      renderer.render(bakeScene, bakeCam);
      renderer.readRenderTargetPixels(rt, 0, 0, R, R, slice);
      data.set(slice, z * R * R * 4);
    }
    renderer.setRenderTarget(prevRT);
    rt.dispose();
    noiseCPU = data;
    const tex = new THREE.Data3DTexture(data, R, R, R);
    tex.format = THREE.RGBAFormat;
    tex.type = THREE.UnsignedByteType;
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
    tex.unpackAlignment = 1;
    tex.needsUpdate = true;
    shapeTex = tex;
    uniforms.uShapeTex.value = tex;
  }

  // ---- layered sheets: coverage-remapped alpha + Sobel normal-from-alpha, from the SAME noise ----
  function buildSheets() {
    const R = CL_SHAPE_RES, N = CL_SHEET_COUNT, W = CL_SHEET_ATLAS_W;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = W * N;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(W, W * N);
    const src = noiseCPU;
    const dens = uniforms.uDensity.value, cov = uniforms.uCoverage.value;
    for (let i = 0; i < N; i++) {
      const z = Math.min(R - 1, Math.round((i + 0.5) * R / N));
      const base = new Float32Array(R * R), worFbm = new Float32Array(R * R);
      for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
        const k = (z * R * R + y * R + x) * 4;
        base[y * R + x] = src[k] / 255;
        worFbm[y * R + x] = (src[k + 1] * 0.625 + src[k + 2] * 0.25 + src[k + 3] * 0.125) / 255;
      }
      const hn = (i + 0.5) / N;
      const prof = satJs(remapJs(hn, 0.0, 0.12, 0.0, 1.0)) * satJs(remapJs(hn, 1.0, 0.30, 0.0, 1.0));
      const alpha = new Float32Array(W * W);
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
        const fx = x / (W - 1) * (R - 1), fy = y / (W - 1) * (R - 1);
        const x0 = fx | 0, y0 = fy | 0, x1 = Math.min(R - 1, x0 + 1), y1 = Math.min(R - 1, y0 + 1);
        const tx = fx - x0, ty = fy - y0;
        const smp = f => f[y0 * R + x0] * (1 - tx) * (1 - ty) + f[y0 * R + x1] * tx * (1 - ty)
                       + f[y1 * R + x0] * (1 - tx) * ty + f[y1 * R + x1] * tx * ty;
        let b = remapJs(smp(base), smp(worFbm) - 1.0, 1.0, 0.0, 1.0);
        b = remapJs(b, 1.0 - Math.pow(Math.min(1, cov), 1.6), 1.0, 0.0, 1.0);   // r13 tune: cov^1.6 — 6 sheets compound their coverage ((1-c)^6), so per-sheet coverage must be sparse at mid user coverage or the fallback reads as a solid white lid (was: 96% sky coverage + h-std 0 at user 0.5)
        alpha[y * W + x] = Math.min(1, dens) * b * prof;
      }
      // Sobel of alpha -> normal (tangent-plane x/z, packed *0.5+0.5), RGBA8 into the atlas row
      const row = img.data.subarray(i * W * W * 4, (i + 1) * W * W * 4);
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
        const a = (dy, dx) => alpha[((y + dy + W) % W) * W + ((x + dx + W) % W)];
        const gx = a(-1, -1) + 2 * a(0, -1) + a(1, -1) - a(-1, 1) - 2 * a(0, 1) - a(1, 1);
        const gy = a(-1, -1) + 2 * a(-1, 0) + a(-1, 1) - a(1, -1) - 2 * a(1, 0) - a(1, 1);
        const k = (y * W + x) * 4;
        row[k] = Math.round(255 * satJs(-gx * 2 * 0.5 + 0.5));
        row[k + 1] = Math.round(255 * satJs(gy * 2 * 0.5 + 0.5));
        row[k + 2] = Math.round(255 * alpha[y * W + x]);
        row[k + 3] = Math.round(255 * alpha[y * W + x]);
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.NoColorSpace;
    sheetAtlas = tex;
    uniforms.uSheetAtlas.value = tex;
  }

  // ---- state ----
  let enabled = false, staticMode = false, mode = 'procedural';
  let paramKey = '', windClock = null, windSpeed = 0.2 * CL_WIND_UV_PER_UNIT;
  let sheetsKey = '';                                 // r13 audit P2: atlas bakes coverage/density — rebuild on change
  let stepsRequested = CL_STEPS_DEFAULT;
  let geoAltitudeM = 0;
  const _cam = new THREE.Vector3();

  function setParams(p = {}) {
    const u = uniforms;
    const next = {
      coverage: p.coverage ?? u.uCoverage.value,
      density: p.density ?? u.uDensity.value,
      cirrus: p.cirrus ?? u.uCirrus.value,
      baseKm: p.baseKm ?? u.uBaseKm.value,
      heightKm: p.heightKm ?? u.uHeightKm.value,
      nightAmt: p.nightAmt ?? u.uNightAmount.value,
      desat: p.weatherDesat ?? u.uWeatherDesat.value,
      darken: p.weatherDarken ?? u.uWeatherDarken.value,
      fogBlend: p.fogBlend ?? u.uFogBlend.value,
      exposure: p.exposure ?? u.uExposure.value,
      steps: p.steps ?? stepsRequested,
      windSpeed: p.windSpeed ?? null,
      geoAltitudeM: p.geoAltitudeM ?? null,
    };
    const key = [next.coverage.toFixed(4), next.density.toFixed(4), next.cirrus.toFixed(4),
      next.baseKm.toFixed(3), next.heightKm.toFixed(3), next.nightAmt.toFixed(4),
      next.desat.toFixed(4), next.darken.toFixed(4), next.fogBlend.toFixed(4),
      next.exposure.toFixed(3), String(next.steps)].join('|');
    const changed = key !== paramKey;
    paramKey = key;
    u.uCoverage.value = next.coverage;
    u.uDensity.value = next.density;
    u.uCirrus.value = next.cirrus;
    u.uBaseKm.value = next.baseKm;
    u.uHeightKm.value = next.heightKm;
    u.uNightAmount.value = next.nightAmt;
    u.uWeatherDesat.value = next.desat;
    u.uWeatherDarken.value = next.darken;
    u.uFogBlend.value = next.fogBlend;
    u.uExposure.value = next.exposure;
    stepsRequested = Math.round(Math.min(CL_STEPS_MAX, Math.max(CL_STEPS_MIN, next.steps)));
    u.uSteps.value = mode === 'layered' ? 0 : stepsRequested;
    if (typeof next.windSpeed === 'number') windSpeed = Math.max(0, next.windSpeed) * CL_WIND_UV_PER_UNIT;
    if (typeof next.geoAltitudeM === 'number') geoAltitudeM = next.geoAltitudeM;
    if (p.fogColor) u.uFogColor.value.copy(p.fogColor);
    if (p.moonDir) u.uMoonDir.value.copy(p.moonDir);
    // r13 audit P2: the layered atlas bakes coverage/density at build time — rebuild when they
    // change in layered mode (CPU-side 256xN, ~2-5 ms; the sliders stay live)
    if (enabled && mode === 'layered' && noiseCPU) {
      const sk = next.coverage.toFixed(4) + '|' + next.density.toFixed(4);
      if (sk !== sheetsKey) { sheetsKey = sk; buildSheets(); }
    }
    return changed;
  }

  function setCamera(camera) {
    // same planet-frame formula as sky.js setCamera (writes the SHARED uCameraPosKm — idempotent)
    const off = su.uBottomRadius.value + geoAltitudeM / 1000;
    _cam.set(camera.position.x / 1000, camera.position.y / 1000 + off, camera.position.z / 1000);
    uniforms.uCameraPosKm.value.copy(_cam);
  }

  function setEnabled(v) {
    enabled = !!v;
    mesh.visible = enabled;
    twinMesh.visible = enabled;
    if (enabled && !shapeTex) {
      bakeNoise3D();                            // one-time renderer-level 128^3 bake
      buildSheets();                            // layered fallback sheets from the same noise
    }
    if (enabled) windClock = performance.now(); // wind animates only while enabled
    else windClock = null;
  }

  function setMode(m) {
    mode = m === 'layered' ? 'layered' : 'procedural';
    u_stepsApply();
    if (enabled && mode === 'layered' && noiseCPU) {   // entering layered: atlas must match current params
      const sk = uniforms.uCoverage.value.toFixed(4) + '|' + uniforms.uDensity.value.toFixed(4);
      if (sk !== sheetsKey) { sheetsKey = sk; buildSheets(); }
    }
  }
  function u_stepsApply() {
    uniforms.uSteps.value = mode === 'layered' ? 0 : stepsRequested;
  }

  function update(camera, outputSRGB, linearHDR = false) {
    if (!enabled) return;
    setCamera(camera);
    uniforms.uOutputSRGB.value = outputSRGB ? 1 : 0;
    uniforms.uToneMap.value = 1;
    uniforms.uCurve.value = linearHDR ? 0 : 1;   // finish+HDR: linear deck in the linear dome (review r13 P1)
    if (!staticMode && windClock !== null) {
      const now = performance.now();
      const dt = Math.min(0.5, (now - windClock) / 1000);
      windClock = now;
      uniforms.uWindOffset.value.x += windSpeed * dt;
      uniforms.uWindOffset.value.y += windSpeed * 0.23 * dt;
    }
  }

  function setStatic(v) { staticMode = !!v; if (staticMode) windClock = null; }

  function dispose() {
    mesh.geometry.dispose();
    material.dispose();
    bakeQuad.material.dispose();
    bakeQuad.geometry.dispose();
    shapeTex?.dispose();
    sheetAtlas?.dispose();
    noiseCPU = null;
  }

  function dumpWeather() {
    if (!noiseCPU) return null;
    return { size: CL_SHAPE_RES, channels: 4, data: noiseCPU.slice() };
  }

  return {
    mesh, twinMesh, setParams, setCamera, update, setEnabled, setMode, setStatic,
    dispose, dumpWeather,
    get mode() { return mode; },
    get enabled() { return enabled; },
    materials: { cloud: material },
    _debug: { get shapeTex() { return shapeTex; }, get noiseCPU() { return noiseCPU; }, uniforms },
  };
}
