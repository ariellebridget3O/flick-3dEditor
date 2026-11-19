// clouds.js — sky-dome cloud layer (P2), layered sheets only (r18: the procedural
// thin-shell raymarch was removed — 'unusably slow' per user feedback; the budget
// auto-gate went with it, its reason-to-exist being the procedural tier).
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
const CL_HORIZON_FADE = 0.10;   // r18: cloud-alpha fade over the lowest ~5.7° — melts the deck into the dome's fog band at the horizon itself. (0.09 was the r13 value; a 0.16 trial ate the whole low-sky sliver a previz camera actually sees when looking down — measured invisible at default pose.)
const CL_CIRRUS_KM = 7.0;        // cirrus sheet altitude (6-8 km band)
const CL_SHEET_COUNT = 6;        // layered fallback sheets (4-6; atlas rows)
const CL_SHEET_ATLAS_W = 256;
const CL_SHEET_RELIEF = 1.8;     // layered normal strength (r13 tune: 1.4 read as a washed sheet — the VLM acceptance pass wanted more veil modulation)
const CL_WIND_UV_PER_UNIT = 0.02; // windSpeed 0..3 -> uv drift per second

const satJs = x => Math.min(1, Math.max(0, x));
// r18: seed -> offsets over the tileable fields (irrational multipliers keep successive seeds
// decorrelated; any translate of the stationary field is an equally-valid new pattern draw).
function seedOffset(seed) {
  const s = Math.min(999, Math.max(0, Math.round(seed)));
  return [s * 37.7192 % 128, s * 61.8384 % 128, s * 29.5504 % 128];
}
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
// r18: layered sheets only (the procedural march was removed).
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
  uniform sampler2D uMultiScatTex;       // sky.js multi-scatter LUT (ambient)
  uniform sampler2D uSheetAtlas;         // layered fallback: CL_SHEET_COUNT rows, RGBA8
  uniform float uCoverage;               // 0..1 (weather-coupled user coverage)
  uniform float uDensity;                // density multiplier 0.25..4
  uniform float uCirrus;                 // thin high sheet alpha 0..1
  uniform float uBaseKm;                 // slab base altitude above the planet surface
  uniform float uHeightKm;               // slab thickness
  uniform vec2 uWindOffset;              // wind uv offset (CPU-animated; frozen when static)
  uniform vec2 uSeedOffset;              // r18 seed: cirrus pattern translate (tile units)
  uniform float uWeatherSun;             // r18: cloud direct light follows the scene weather sun
  uniform float uWeatherHemi;            // r18: cloud ambient follows the scene weather hemi
  uniform float uCloudDarken;            // r18: residual per-weather cloud darken (gray-lid look)
  uniform float uNightAmount;            // 0 day .. 1 night (sun -> moon)
  uniform vec3 uMoonDir;
  uniform int uSheetCount;               // layered sheets
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
    // r18 (audit P1-10): cloud direct light follows the scene weather attenuation — the scene
    // sun drops to 0.25/0.15 under overcast/rain; the clouds must dim with it or they read as
    // a bright lid over a dark rainy scene.
    vec3 Lc = uSunIlluminance * uWeatherSun * mix(vec3(1.0), vec3(0.42, 0.52, 0.75) * 0.05, uNightAmount);
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
      msAmb = texture(uMultiScatTex, muv).rgb * uSunIlluminance * uWeatherHemi;
    }

    vec3 L = vec3(0.0);
    float Tview = 1.0;

    // ---- cirrus: thin high sheet (6-8 km), pure fbm alpha, no march ----
    if (uCirrus > 0.001) {
      vec2 span = shellSpan(camPos, worldDir, uBottomRadius + CIRRUS_KM - 0.35, uBottomRadius + CIRRUS_KM + 0.35);
      if (span.x >= 0.0 && span.y > 0.0) {
        vec3 pC = camPos + worldDir * max(span.x, 0.0);
        vec2 cuv = pC.xz / SHAPE_TILE_KM * 0.5 + uWindOffset * vec2(1.0, 0.35) + uSeedOffset;
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

    {
      // ---- layered sheets on the DOME (r18): direction-based UV — the pattern wraps the full
      // sky at constant angular texel density instead of smearing on a planar XZ projection
      // (the old mapping sampled thousands of km of slant at grazing angles -> textureless lid,
      // 'the world is flat'). Per-sheet INTEGER azimuth repeats (seam-safe under RepeatWrapping:
      // the atan2 wrap jumps u by exactly the repeat) + per-sheet phase offsets (no aligned seam
      // columns) + differing repeats (parallax/depth illusion). Camera-translation parallax is
      // intentionally dropped: negligible at 2.5 km for a stage-scale editor camera.
      float uAz = atan(worldDir.x, worldDir.z) / 6.2831853;    // -0.5..0.5, wrap at azimuth seam
      float vEl = pow(1.0 - max(worldDir.y, 0.0), 0.6);        // 0 zenith .. 1 horizon (dome curve)
      for (int i = 0; i < ${CL_SHEET_COUNT}; i++) {
        if (i >= uSheetCount) break;
        float fi = (float(i) + 0.5) / float(uSheetCount);
        float ru = 4.0 + float(i);                             // integer repeats: 4..9
        float ph = fract(float(i) * 0.318);                    // per-sheet phase (seam stagger)
        vec2 uv = vec2((uAz + ph) * ru + uWindOffset.x * (1.0 + 0.3 * fi),
                       vEl * (2.0 + 0.4 * fi) + uWindOffset.y * (0.2 + 0.1 * fi));
        // r18: textureGrad with CLAMPED gradients — the dome mapping compresses v near the
        // horizon (and u converges at the zenith), so the automatic LOD picks coarse mips where
        // the sparse near-binary blobs average to NOTHING (measured: effective 18% rendered
        // invisible; 40% rendered). Capping the per-pixel uv delta at 1/16 tile limits the mip
        // chain to ~level 4 (16px/row) where the ~40px blobs still exist; mild minification
        // aliasing beats vanishing clouds (the soft smoothstep edge keeps it clean).
        // v inset: sampling exactly at the row boundary cross-bleeds the adjacent atlas row
        // through the mip chain (thin dark horizontal streaks + razor-straight cloud bottoms —
        // VLM r18 QA). Keep 2% inside the row on both ends.
        float fv = 0.02 + 0.96 * fract(uv.y);
        vec2 suv = vec2(uv.x, (float(i) + fv) / ${CL_SHEET_COUNT.toFixed(1)});
        // cap in TEXEL space per axis: the atlas is 256 x (256*6), so the v axis has 6x the
        // texel density of u — a symmetric uv cap let the v axis select mip ~6.6 (rows crushed
        // to ~2.6px; the 40px blobs averaged back into the invisible veil — the r18 it3 bug).
        // 16 texels/px on both axes caps the chain at level 4 (16px rows) where blobs live.
        vec2 gcap = vec2(16.0 / ${CL_SHEET_ATLAS_W.toFixed(1)}, 16.0 / (${CL_SHEET_ATLAS_W.toFixed(1)} * ${CL_SHEET_COUNT.toFixed(1)}));
        vec2 gdx = clamp(dFdx(uv), -gcap, gcap);
        vec2 gdy = clamp(dFdy(uv), -gcap, gcap);
        vec4 sh = textureGrad(uSheetAtlas, suv, gdx, gdy);
        float aS = sh.a;
        if (aS < 0.004) continue;
        vec3 N = normalize(vec3((sh.r * 2.0 - 1.0) * ${CL_SHEET_RELIEF.toFixed(2)}, 1.0, (sh.g * 2.0 - 1.0) * ${CL_SHEET_RELIEF.toFixed(2)}));
        float wrap = sat((dot(N, Ld) + 0.35) / 1.35);
        vec3 Hv = normalize(Ld - worldDir);
        // r18 QA it2: WIDER directional dynamic — the old Lc*wrap kept every sun-facing face
        // above the exposure-curve knee (~231 display plateau = flat cumulus). Dim the
        // ambient floor + square the wrap so undersides drop below the knee.
        vec3 sheetL = (Lc * (0.32 + 0.85 * wrap * wrap) + msAmb * 0.55) * 0.75            // r13 tune: sheets were full-sun white (Lc*wrap ~0.8 linear saturates the exposure-10 curve) — dim to keep deck texture readable. NOTE: the SKY_EXPOSURE-10 curve saturates at L≈0.35, so the 6-sheet zenith stack clips ~245-253 display regardless of this scale (0.68 tried r13 acceptance — identical display); layered is the FALLBACK tier, zenith clip documented as the known nit
          + Lc * pow(max(mu, 0.0), 8.0) * 0.25           // silver lining
          + Lc * pow(max(dot(N, Hv), 0.0), 24.0) * 0.06; // glint (ice cirrus / wet decks)
        L += Tview * sheetL * aS;
        Tview *= 1.0 - aS;                               // depth-fade between sheets
        if (Tview < 0.02) break;
      }
    }

    // r18: horizon fade (~5.7°) — the deck CONVERGES into the dome's fog band like a
    // receding dome instead of ending in a hard ceiling edge (the 'world is flat' tell).
    // L scales by the same fade so hf=0 is exactly the dome (L=0, alpha=1).
    float hf = smoothstep(0.0, HORIZON_FADE, worldDir.y);
    L *= hf;
    Tview = mix(1.0, Tview, hf);

    L *= uHdrGain;   // r18 (P1-6): clouds stay white against the lifted sky (pre-curve, pre-shoulder)
    // mood ops (same Rec.601 desat + darken as the domes) + the r18 residual cloud darken
    // (overcast/rain gray-lid on top of the Lc×w.sun weather dimming)
    float lum = dot(L, vec3(0.299, 0.587, 0.114));
    L = mix(vec3(lum), L, 1.0 - uWeatherDesat);
    L *= (1.0 - uWeatherDarken) * (1.0 - uCloudDarken);
    if (uToneMap > 0.5 && uCurve > 0.5) L = vec3(1.0) - exp(-max(L, vec3(0.0)) / uWhitePoint * uExposure);
    // r14: layered-tier display-space shoulder. The 6-sheet zenith stack accumulates
    // tone-curved radiance to 0.90-0.96 pre-OETF (245-253 display; >50% of a zenith-view
    // deck clipped). Per-sheet dimming CANNOT fix it — the exposure-10 curve saturates
    // (any linear sum >=0.35 curves to >=0.96; proven r13: the 0.68 dim gave identical
    // display). Soft order-preserving shoulder in tone-curved space instead: identity
    // below the 0.70 knee, asymptote 0.85 (237 display — just above the 235 fog band,
    // below the procedural tier's lit cores). Linear-HDR out (uCurve=0) and PMREM
    // (uToneMap=0) are exempt: ACES handles those (clouds_hdr_check.py verified).
    if (uToneMap > 0.5 && uCurve > 0.5) {
      vec3 over = max(L - vec3(0.78), vec3(0.0));
      L = min(L, vec3(0.78)) + vec3(0.18) * over / (over + vec3(0.18));
    }
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
    uMultiScatTex: { value: null },
    uSheetAtlas: { value: null },
    uCoverage: { value: 0.45 },
    uDensity: { value: 1 },
    uCirrus: { value: 0.15 },
    uBaseKm: { value: 2.5 },
    uHeightKm: { value: 1.2 },
    uWindOffset: { value: new THREE.Vector2(0, 0) },
    uSeedOffset: { value: new THREE.Vector2(0, 0) },
    uWeatherSun: { value: 1 },
    uWeatherHemi: { value: 1 },
    uCloudDarken: { value: 0 },
    uHdrGain: { value: 1 },               // r18 (P1-6): the deck gains with the sky under finish+HDR
    uNightAmount: { value: 0 },
    uMoonDir: { value: new THREE.Vector3(0, -1, 0) },
    uSheetCount: { value: CL_SHEET_COUNT },
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

  // ---- r18 buildSheets: coverage EXACT BY CONSTRUCTION (audit P0-4) ----
  // The r13/r14 knee-tuning iterations could not fix the solid-lid (6 sheets compound (1-c)^6
  // and soft veils are amplified to near-white by the exposure curve + premultiplied composite).
  // Now: (1) per-sheet MEAN coverage target c_s = 1-(1-C)^(1/6) so the composite 1-prod(1-a_i)
  // equals the weather-anchored C by construction; (2) the threshold comes from the ACTUAL
  // field histogram (quantile), not a hand-tuned constant; (3) near-binary masks with a soft
  // edge (soft veils were the amplifier); (4) mean normalized to exactly c_s after build.
  // Instrumented: lastSheetsStats records per-sheet mean + composite for the E2E gate.
  let lastSheetsStats = null;
  function buildSheets() {
    const R = CL_SHAPE_RES, N = CL_SHEET_COUNT, W = CL_SHEET_ATLAS_W;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = W * N;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(W, W * N);
    const src = noiseCPU;
    const dens = uniforms.uDensity.value, cov = uniforms.uCoverage.value;
    const so = seedOffset(currentSeed);
    const cSheet = 1 - Math.pow(1 - Math.min(0.98, cov), 1 / N);   // per-sheet mean target
    const stats = { coverage: cov, cSheet, sheets: [], composite: 1 };
    for (let i = 0; i < N; i++) {
      const z = Math.min(R - 1, Math.round(((i + 0.5) * R / N + so[2]) % R));
      const base = new Float32Array(R * R), worFbm = new Float32Array(R * R);
      for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
        const k = (z * R * R + y * R + x) * 4;
        base[y * R + x] = src[k] / 255;
        worFbm[y * R + x] = (src[k + 1] * 0.625 + src[k + 2] * 0.25 + src[k + 3] * 0.125) / 255;
      }
      // coverage field on the W-res grid (seed-translated coords, bilinear from the 128^3 tile)
      const field = new Float32Array(W * W);
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
        const fx = (x / (W - 1) * (R - 1) + so[0]) % R, fy = (y / (W - 1) * (R - 1) + so[1]) % R;
        const x0 = fx | 0, y0 = fy | 0, x1 = (x0 + 1) % R, y1 = (y0 + 1) % R;
        const tx = fx - x0, ty = fy - y0;
        const smp = f => f[y0 * R + x0] * (1 - tx) * (1 - ty) + f[y0 * R + x1] * tx * (1 - ty)
                       + f[y1 * R + x0] * (1 - tx) * ty + f[y1 * R + x1] * tx * ty;
        field[y * W + x] = remapJs(smp(base), smp(worFbm) - 1.0, 1.0, 0.0, 1.0);
      }
      // LOW-PASS the field first (r18 it2): thresholding the raw perlin-worley at the 97%
      // quantile yields the field's TIPS — a dust of 4-12px specks that no mip level holds
      // (measured: effective 18% rendered as an invisible ~5/255 veil even with the textureGrad
      // clamp). Real scattered cumulus = FEW BIG solid blobs: blur, then threshold -> a few
      // large islands whose size survives the mip chain. Two wrapped box passes ~= triangular.
      const RB = 10;
      let blurred = field;
      for (let pass = 0; pass < 2; pass++) {
        const out = new Float32Array(W * W);
        for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
          let acc = 0;
          for (let k = -RB; k <= RB; k++) {
            acc += blurred[y * W + ((x + k + W) % W)];
          }
          out[y * W + x] = acc / (2 * RB + 1);
        }
        const out2 = new Float32Array(W * W);
        for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
          let acc = 0;
          for (let k = -RB; k <= RB; k++) {
            acc += out[((y + k + W) % W) * W + x];
          }
          out2[y * W + x] = acc / (2 * RB + 1);
        }
        blurred = out2;
      }
      // histogram threshold at the (1-c_s) quantile of the ACTUAL (blurred) field
      const sorted = Float32Array.from(blurred).sort();
      const thr = sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((1 - cSheet) * (sorted.length - 1))))];
      const edge = Math.max(0.015, 0.045 * (1 - cSheet));            // soft edge widens with sparsity (r18 QA: crisper masses)
      // near-binary mask; scale solved by BISECTION so the CLAMPED mean is exactly the target
      // (a plain normalize-then-clamp loses mass when the sparse field's scale overshoots 1.0 —
      // measured 0.021 vs the 0.0325 target on the first r18 build)
      const target = Math.min(0.98, cSheet * Math.min(1.5, Math.max(0.25, dens)));
      let alpha = new Float32Array(W * W);
      for (let k = 0; k < alpha.length; k++) alpha[k] = satJs((blurred[k] - thr) / edge);
      // morphological OPEN (erode+dilate 3x3) — kills the 1-6px speck fragments the VLM QA
      // flagged; wrapped so the tile stays seamless
      {
        const er = new Float32Array(W * W);
        for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
          let m = 1;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
            m = Math.min(m, alpha[((y + dy + W) % W) * W + ((x + dx + W) % W)]);
          er[y * W + x] = m;
        }
        const di = new Float32Array(W * W);
        for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
          let m = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
            m = Math.max(m, er[((y + dy + W) % W) * W + ((x + dx + W) % W)]);
          di[y * W + x] = m;
        }
        alpha = di;
      }
      let lo = 0, hi = 16;
      for (let it = 0; it < 28; it++) {
        const mid = (lo + hi) / 2;
        let m = 0;
        for (let k = 0; k < alpha.length; k++) m += Math.min(1, alpha[k] * mid);
        m /= alpha.length;
        if (m < target) lo = mid; else hi = mid;
      }
      const scale = (lo + hi) / 2;
      for (let k = 0; k < alpha.length; k++) alpha[k] = Math.min(1, alpha[k] * scale);
      const got = alpha.reduce((a, b) => a + b, 0) / alpha.length;
      stats.sheets.push(+got.toFixed(4));
      stats.composite *= (1 - got);
      // normals from the SHARP field mask (pre-blur): the blurred alpha's Sobel is too smooth —
      // the sheets rendered as flat un-shaded blobs (VLM r18 QA). Coverage stays blurred; the
      // relief detail comes from the sharp field edges.
      const detail = new Float32Array(W * W);
      for (let k = 0; k < detail.length; k++) detail[k] = satJs((field[k] - thr) / edge);
      const row = img.data.subarray(i * W * W * 4, (i + 1) * W * W * 4);
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
        const a = (dy, dx) => detail[((y + dy + W) % W) * W + ((x + dx + W) % W)];
        const gx = a(-1, -1) + 2 * a(0, -1) + a(1, -1) - a(-1, 1) - 2 * a(0, 1) - a(1, 1);
        const gy = a(-1, -1) + 2 * a(-1, 0) + a(-1, 1) - a(1, -1) - 2 * a(1, 0) - a(1, 1);
        const k = (y * W + x) * 4;
        row[k] = Math.round(255 * satJs(-gx * 2 * 0.5 + 0.5));
        row[k + 1] = Math.round(255 * satJs(gy * 2 * 0.5 + 0.5));
        row[k + 2] = Math.round(255 * alpha[y * W + x]);
        row[k + 3] = Math.round(255 * alpha[y * W + x]);
      }
    }
    stats.composite = 1 - stats.composite;
    lastSheetsStats = stats;
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;   // r18: mipmaps + the textureGrad texel clamp
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.colorSpace = THREE.NoColorSpace;
    sheetAtlas = tex;
    uniforms.uSheetAtlas.value = tex;
  }

  // ---- state ----
  let enabled = false, staticMode = false;
  let paramKey = '', windClock = null, windSpeed = 0.2 * CL_WIND_UV_PER_UNIT;
  let sheetsKey = '';                                 // r13 audit P2: atlas bakes coverage/density — rebuild on change
  let geoAltitudeM = 0;
  let currentSeed = 0;
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
      seed: p.seed ?? 0,
      weatherSun: p.weatherSun ?? 1,
      weatherHemi: p.weatherHemi ?? 1,
      cloudDarken: p.cloudDarken ?? 0,
      fogBlend: p.fogBlend ?? u.uFogBlend.value,
      exposure: p.exposure ?? u.uExposure.value,
      windSpeed: p.windSpeed ?? null,
      geoAltitudeM: p.geoAltitudeM ?? null,
    };
    const key = [next.coverage.toFixed(4), next.density.toFixed(4), next.cirrus.toFixed(4),
      next.baseKm.toFixed(3), next.heightKm.toFixed(3), next.nightAmt.toFixed(4),
      next.desat.toFixed(4), next.darken.toFixed(4), next.fogBlend.toFixed(4),
      next.exposure.toFixed(3), next.seed, next.weatherSun.toFixed(3),
      next.weatherHemi.toFixed(3), next.cloudDarken.toFixed(3)].join('|');
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
    if (typeof next.windSpeed === 'number') windSpeed = Math.max(0, next.windSpeed) * CL_WIND_UV_PER_UNIT;
    // r18 seed: translate the tileable pattern family (statistically equivalent new draw).
    // Sheets bake it into the atlas coordinates (CPU); cirrus samples it directly (GPU).
    const so = seedOffset(next.seed);
    u.uSeedOffset.value.set(so[0], so[1]);
    u.uWeatherSun.value = next.weatherSun;
    u.uWeatherHemi.value = next.weatherHemi;
    u.uCloudDarken.value = next.cloudDarken;
    if (typeof next.geoAltitudeM === 'number') geoAltitudeM = next.geoAltitudeM;
    if (p.fogColor) u.uFogColor.value.copy(p.fogColor);
    if (p.moonDir) u.uMoonDir.value.copy(p.moonDir);
    // r13 audit P2: the layered atlas bakes coverage/density at build time — rebuild when they
    // change in layered mode (CPU-side 256xN, ~2-5 ms; the sliders stay live)
    currentSeed = next.seed;
    if (enabled && noiseCPU) {
      const sk = next.coverage.toFixed(4) + '|' + next.density.toFixed(4) + '|' + next.seed;
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

  function update(camera, outputSRGB, linearHDR = false) {
    if (!enabled) return;
    setCamera(camera);
    uniforms.uOutputSRGB.value = outputSRGB ? 1 : 0;
    uniforms.uToneMap.value = 1;
    uniforms.uCurve.value = linearHDR ? 0 : 1;   // finish+HDR: linear deck in the linear dome (review r13 P1)
    uniforms.uHdrGain.value = linearHDR ? C.HDR_REALISTIC_GAIN : 1;   // r18 P1-6 (PMREM bake forces 1 via sky.js bakePMREM)
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
    mesh, twinMesh, setParams, setCamera, update, setEnabled, setStatic,
    dispose, dumpWeather,
    get enabled() { return enabled; },
    materials: { cloud: material },
    _debug: { get shapeTex() { return shapeTex; }, get noiseCPU() { return noiseCPU; }, uniforms,
      get lastSheetsStats() { return lastSheetsStats; }, get seed() { return currentSeed; } },
  };
}
