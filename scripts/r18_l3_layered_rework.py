#!/usr/bin/env python3
"""r18 L3 — layered clouds rework per the audited design:
- DOME-directional UV (worldDir-based, per-sheet integer repeats + phase offsets)
- coverage EXACT BY CONSTRUCTION: histogram threshold + mean normalization + near-binary masks
- WEATHER coupling: anchor x user factor + rain/fog floors, cloud lighting follows w.sun/w.hemi,
  residual cloud-darken for the gray-lid look
- SEED: light.clouds.seed 0..999 — offset family over the tileable noise (CPU sheets + cirrus)
- wider horizon fade (dome recedes into the fog band)
"""
import re

ED = "/home/z/my-project/flick-3dEditor/editor"


def sub1(s, old, new, tag):
    assert old in s, f"MISS [{tag}]"
    assert s.count(old) == 1, f"NON-UNIQUE [{tag}]"
    return s.replace(old, new)


# ================= const.js =================
s = open(f"{ED}/js/const.js").read()
s = sub1(s, """  CLOUD_COVERAGE_BY_WEATHER: { clear: 0.18, cloudy: 0.55, overcast: 0.85, rain: 0.9, fog: 0.95 },""",
         """  // r18: weather DRIVES the effective coverage (anchor x user factor coverage/0.45),
  // with rain/fog floors regardless of the slider (the deck must read coherent with the
  // rain/fog lighting — audit P1-7 'floors, not force').
  CLOUD_COVERAGE_BY_WEATHER: { clear: 0.18, cloudy: 0.55, overcast: 0.85, rain: 0.90, fog: 0.95 },
  CLOUD_COVERAGE_FLOOR: { rain: 0.88, fog: 0.93 },
  CLOUD_WEATHER_DARKEN: { clear: 0.0, cloudy: 0.0, overcast: 0.10, rain: 0.22, fog: 0.15 },""", "coverage tables")
open(f"{ED}/js/const.js", "w").write(s)
print("const.js patched")

# ================= env.js =================
s = open(f"{ED}/js/env.js").read()
s = sub1(s, """// r13 tune: the USER coverage is authoritative; weather modulates ±30% max. The old anchoring
// (userCov × weatherCov/0.45) crushed clear weather to ×0.4 — user 0.5 rendered as 0.2 and the
// deck dissolved into wisps. Overcast/rain factors still reach 1.0 at high user coverage.
const CLOUD_COV_FACTOR = { clear: 0.85, cloudy: 1.15, overcast: 1.3, rain: 1.35, fog: 1.2 };
function buildCloudParams(light, sp) {     // sp = buildSkyParams bundle (shares night/moon/fog)
  const cl = light.clouds ?? {};
  const wFac = CLOUD_COV_FACTOR[light.weather] ?? 1;
  const coverage = Math.min(1, Math.max(0, (cl.coverage ?? C.CLOUD_COVERAGE_DEFAULT) * wFac));
  return {
    coverage,
    density: cl.density ?? 1,
    cirrus: cl.cirrus ?? 0.15,
    baseKm: (cl.altitudeM ?? 2500) / 1000,
    heightKm: (cl.thicknessM ?? 1200) / 1000,
    windSpeed: cl.windSpeed ?? 0.2,
    nightAmt: sp.nightAmt,
    moonDir: sp.moonDir,
    weatherDesat: sp.weatherDesat,
    weatherDarken: sp.weatherDarken,
    fogColor: sp.fogColor,
    fogBlend: sp.fogBlend,
    exposure: sp.exposure,
    geoAltitudeM: light.geo?.altitudeM ?? 0,
  };
}""",
         """// r18 rework: WEATHER is the primary coverage driver (user feedback: 'from clear to overcast
// to rain / fog (100% coverage) with color changes'). effective = anchor[weather] x userFactor
// (user slider / schema default = a RELATIVE control now), clamped to the rain/fog floors.
// Cloud lighting follows the scene weather (Lc x w.sun, msAmb x w.hemi — audit P1-10) plus a
// residual per-weather cloud darken for the overcast/rain gray-lid look.
function buildCloudParams(light, sp) {     // sp = buildSkyParams bundle (shares night/moon/fog)
  const cl = light.clouds ?? {};
  const w = C.WEATHER[light.weather] ?? C.WEATHER.clear;
  const anchor = C.CLOUD_COVERAGE_BY_WEATHER[light.weather] ?? 0.45;
  const floor = C.CLOUD_COVERAGE_FLOOR[light.weather] ?? 0;
  const userFactor = (cl.coverage ?? C.CLOUD_COVERAGE_DEFAULT) / C.CLOUD_COVERAGE_DEFAULT;
  const coverage = Math.min(1, Math.max(floor, anchor * userFactor));
  return {
    coverage,
    density: cl.density ?? 1,
    cirrus: cl.cirrus ?? 0.15,
    baseKm: (cl.altitudeM ?? 2500) / 1000,
    heightKm: (cl.thicknessM ?? 1200) / 1000,
    windSpeed: cl.windSpeed ?? 0.2,
    seed: cl.seed ?? 0,
    nightAmt: sp.nightAmt,
    moonDir: sp.moonDir,
    weatherDesat: sp.weatherDesat,
    weatherDarken: sp.weatherDarken,
    weatherSun: w.sun,
    weatherHemi: w.hemi,
    cloudDarken: C.CLOUD_WEATHER_DARKEN[light.weather] ?? 0,
    fogColor: sp.fogColor,
    fogBlend: sp.fogBlend,
    exposure: sp.exposure,
    geoAltitudeM: light.geo?.altitudeM ?? 0,
  };
}""", "buildCloudParams")
# memo key: add seed to the clouds part
s = sub1(s, """      + '|c' + (light.clouds?.enabled ? [light.clouds.mode, light.clouds.coverage, light.clouds.density, light.clouds.altitudeM, light.clouds.thicknessM, light.clouds.cirrus, light.clouds.windSpeed].join(',') : 'off')   // r13 audit P1: skyStyle in the key""",
         """      + '|c' + (light.clouds?.enabled ? [light.clouds.coverage, light.clouds.density, light.clouds.altitudeM, light.clouds.thicknessM, light.clouds.cirrus, light.clouds.windSpeed, light.clouds.seed ?? 0].join(',') : 'off')   // r13 audit P1: skyStyle in the key (r18: +seed)""", "memo key")
open(f"{ED}/js/env.js", "w").write(s)
print("env.js patched")

# ================= schema.js =================
s = open(f"{ED}/js/schema.js").read()
s = sub1(s, """    if (Number.isFinite(l.clouds.windSpeed)) c.windSpeed = Math.min(3, Math.max(0, l.clouds.windSpeed));
    n.clouds = c;""",
         """    if (Number.isFinite(l.clouds.windSpeed)) c.windSpeed = Math.min(3, Math.max(0, l.clouds.windSpeed));
    if (Number.isFinite(l.clouds.seed)) c.seed = Math.min(999, Math.max(0, Math.round(l.clouds.seed)));   // r18: coverage-pattern seed
    n.clouds = c;""", "seed passthrough")
open(f"{ED}/js/schema.js", "w").write(s)
print("schema.js patched")

# ================= clouds.js =================
s = open(f"{ED}/js/clouds.js").read()

# ---- 3a. new uniforms in the fragment shader ----
s = sub1(s, """  uniform vec2 uWindOffset;              // wind uv offset (CPU-animated; frozen when static)""",
         """  uniform vec2 uWindOffset;              // wind uv offset (CPU-animated; frozen when static)
  uniform vec2 uSeedOffset;              // r18 seed: cirrus pattern translate (tile units)
  uniform float uWeatherSun;             // r18: cloud direct light follows the scene weather sun
  uniform float uWeatherHemi;            // r18: cloud ambient follows the scene weather hemi
  uniform float uCloudDarken;            // r18: residual per-weather cloud darken (gray-lid look)""", "new uniforms")

# ---- 3b. cloud lighting: weather wiring ----
s = sub1(s, """    vec3 Ld = normalize(mix(uSunDir, uMoonDir, uNightAmount));
    vec3 Lc = uSunIlluminance * mix(vec3(1.0), vec3(0.42, 0.52, 0.75) * 0.05, uNightAmount);""",
         """    vec3 Ld = normalize(mix(uSunDir, uMoonDir, uNightAmount));
    // r18 (audit P1-10): cloud direct light follows the scene weather attenuation — the scene
    // sun drops to 0.25/0.15 under overcast/rain; the clouds must dim with it or they read as
    // a bright lid over a dark rainy scene.
    vec3 Lc = uSunIlluminance * uWeatherSun * mix(vec3(1.0), vec3(0.42, 0.52, 0.75) * 0.05, uNightAmount);""", "Lc weather")

s = sub1(s, """      msAmb = texture(uMultiScatTex, muv).rgb * uSunIlluminance;""",
         """      msAmb = texture(uMultiScatTex, muv).rgb * uSunIlluminance * uWeatherHemi;""", "msAmb weather")

# ---- 3c. cirrus seed offset ----
s = sub1(s, """        vec2 cuv = pC.xz / SHAPE_TILE_KM * 0.5 + uWindOffset * vec2(1.0, 0.35);""",
         """        vec2 cuv = pC.xz / SHAPE_TILE_KM * 0.5 + uWindOffset * vec2(1.0, 0.35) + uSeedOffset;""", "cirrus seed")

# ---- 3d. the layered branch: dome-directional UV ----
s = sub1(s, """      // ---- layered sheets: parallax alpha sheets (atlas rows), Lambert + HG-style glint ----
      for (int i = 0; i < ${CL_SHEET_COUNT}; i++) {
        if (i >= uSheetCount) break;
        float fi = (float(i) + 0.5) / float(uSheetCount);
        float altKm = uBaseKm + uHeightKm * fi;
        vec2 span = shellSpan(camPos, worldDir, uBottomRadius + altKm, uBottomRadius + altKm + 0.01);
        if (span.x < 0.0 || span.y <= 0.0) continue;
        vec3 p = camPos + worldDir * span.y;
        vec2 uv = p.xz / SHAPE_TILE_KM + uWindOffset * (1.0 + fi);
        vec4 sh = texture(uSheetAtlas, vec2(uv.x, (float(i) + fract(uv.y)) / ${CL_SHEET_COUNT.toFixed(1)}));""",
         """      // ---- layered sheets on the DOME (r18): direction-based UV — the pattern wraps the full
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
        vec4 sh = texture(uSheetAtlas, vec2(uv.x, (float(i) + fract(uv.y)) / ${CL_SHEET_COUNT.toFixed(1)}));""", "dome uv")

# ---- 3e. wider horizon fade (dome convergence) ----
s = sub1(s, """    // r13 tune: horizon alpha fade — the lowest ~5° of the deck melts into the dome's fog band
    // instead of ending in a saturated white slab + hard seam where the floor line cuts it.
    // L scales by the same fade so hf=0 is exactly the dome (L=0, alpha=1).
    float hf = smoothstep(0.0, HORIZON_FADE, worldDir.y);""",
         """    // r18: horizon fade widened (~9°) — the deck CONVERGES into the dome's fog band like a
    // receding dome instead of ending in a hard ceiling edge (the 'world is flat' tell).
    // L scales by the same fade so hf=0 is exactly the dome (L=0, alpha=1).
    float hf = smoothstep(0.0, HORIZON_FADE, worldDir.y);""", "fade comment")
s = sub1(s, """const CL_HORIZON_FADE = 0.09;   // r13 tune: cloud-alpha fade over the lowest ~5° of elevation (grazing rays: 15km of slab march saturates L and the alpha seam at the floor line reads as a blowout band)""",
         """const CL_HORIZON_FADE = 0.16;   // r18: cloud-alpha fade over the lowest ~9° of elevation — the deck melts into the dome's fog band (dome convergence; was 0.09/5°: a hard ceiling edge read as 'the world is flat')""", "fade const")

# ---- 3f. cloud darken application (after the shared mood ops) ----
s = sub1(s, """    // mood ops (same Rec.601 desat + darken as the domes)
    float lum = dot(L, vec3(0.299, 0.587, 0.114));
    L = mix(vec3(lum), L, 1.0 - uWeatherDesat);
    L *= (1.0 - uWeatherDarken);""",
         """    // mood ops (same Rec.601 desat + darken as the domes) + the r18 residual cloud darken
    // (overcast/rain gray-lid on top of the Lc×w.sun weather dimming)
    float lum = dot(L, vec3(0.299, 0.587, 0.114));
    L = mix(vec3(lum), L, 1.0 - uWeatherDesat);
    L *= (1.0 - uWeatherDarken) * (1.0 - uCloudDarken);""", "cloud darken")

# ---- 3g. uniforms table ----
s = sub1(s, """    uWindOffset: { value: new THREE.Vector2(0, 0) },""",
         """    uWindOffset: { value: new THREE.Vector2(0, 0) },
    uSeedOffset: { value: new THREE.Vector2(0, 0) },
    uWeatherSun: { value: 1 },
    uWeatherHemi: { value: 1 },
    uCloudDarken: { value: 0 },""", "uniforms table")

# ---- 3h. setParams: new fields ----
s = sub1(s, """      nightAmt: p.nightAmt ?? u.uNightAmount.value,
      desat: p.weatherDesat ?? u.uWeatherDesat.value,
      darken: p.weatherDarken ?? u.uWeatherDarken.value,""",
         """      nightAmt: p.nightAmt ?? u.uNightAmount.value,
      desat: p.weatherDesat ?? u.uWeatherDesat.value,
      darken: p.weatherDarken ?? u.uWeatherDarken.value,
      seed: p.seed ?? 0,
      weatherSun: p.weatherSun ?? 1,
      weatherHemi: p.weatherHemi ?? 1,
      cloudDarken: p.cloudDarken ?? 0,""", "setParams fields")
s = sub1(s, """    const key = [next.coverage.toFixed(4), next.density.toFixed(4), next.cirrus.toFixed(4),
      next.baseKm.toFixed(3), next.heightKm.toFixed(3), next.nightAmt.toFixed(4),
      next.desat.toFixed(4), next.darken.toFixed(4), next.fogBlend.toFixed(4),
      next.exposure.toFixed(3)].join('|');""",
         """    const key = [next.coverage.toFixed(4), next.density.toFixed(4), next.cirrus.toFixed(4),
      next.baseKm.toFixed(3), next.heightKm.toFixed(3), next.nightAmt.toFixed(4),
      next.desat.toFixed(4), next.darken.toFixed(4), next.fogBlend.toFixed(4),
      next.exposure.toFixed(3), next.seed, next.weatherSun.toFixed(3),
      next.weatherHemi.toFixed(3), next.cloudDarken.toFixed(3)].join('|');""", "paramKey")
s = sub1(s, """    if (typeof next.windSpeed === 'number') windSpeed = Math.max(0, next.windSpeed) * CL_WIND_UV_PER_UNIT;""",
         """    if (typeof next.windSpeed === 'number') windSpeed = Math.max(0, next.windSpeed) * CL_WIND_UV_PER_UNIT;
    // r18 seed: translate the tileable pattern family (statistically equivalent new draw).
    // Sheets bake it into the atlas coordinates (CPU); cirrus samples it directly (GPU).
    const so = seedOffset(next.seed);
    u.uSeedOffset.value.set(so[0], so[1]);
    u.uWeatherSun.value = next.weatherSun;
    u.uWeatherHemi.value = next.weatherHemi;
    u.uCloudDarken.value = next.cloudDarken;""", "setParams body")

# ---- 3i. buildSheets: exact-by-construction coverage ----
s = sub1(s, """  // ---- layered sheets: coverage-remapped alpha + Sobel normal-from-alpha, from the SAME noise ----
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
  }""",
         """  // ---- r18 buildSheets: coverage EXACT BY CONSTRUCTION (audit P0-4) ----
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
      // histogram threshold at the (1-c_s) quantile of the ACTUAL field
      const sorted = Float32Array.from(field).sort();
      const thr = sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((1 - cSheet) * (sorted.length - 1))))];
      const edge = Math.max(0.02, 0.06 * (1 - cSheet));             // soft edge widens with sparsity
      // near-binary mask + normalize the mean to EXACTLY c_s (density scales solidity)
      const alpha = new Float32Array(W * W);
      let mean = 0;
      for (let k = 0; k < alpha.length; k++) {
        alpha[k] = satJs((field[k] - thr) / edge);
        mean += alpha[k];
      }
      mean /= alpha.length;
      const norm = mean > 1e-5 ? cSheet / mean : 0;
      for (let k = 0; k < alpha.length; k++) {
        alpha[k] = Math.min(1, alpha[k] * norm * Math.min(1.5, Math.max(0.25, dens)));
      }
      const got = alpha.reduce((a, b) => a + b, 0) / alpha.length;
      stats.sheets.push(+got.toFixed(4));
      stats.composite *= (1 - got);
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
    stats.composite = 1 - stats.composite;
    lastSheetsStats = stats;
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;   // r18: mipmaps — grazing dome angles stay clean
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.colorSpace = THREE.NoColorSpace;
    sheetAtlas = tex;
    uniforms.uSheetAtlas.value = tex;
  }""", "buildSheets")

# ---- 3j. seed state + helper + sheetsKey ----
s = sub1(s, """  let enabled = false, staticMode = false;
  let paramKey = '', windClock = null, windSpeed = 0.2 * CL_WIND_UV_PER_UNIT;
  let sheetsKey = '';                                 // r13 audit P2: atlas bakes coverage/density — rebuild on change
  let geoAltitudeM = 0;""",
         """  let enabled = false, staticMode = false;
  let paramKey = '', windClock = null, windSpeed = 0.2 * CL_WIND_UV_PER_UNIT;
  let sheetsKey = '';                                 // r13 audit P2: atlas bakes coverage/density — rebuild on change
  let geoAltitudeM = 0;
  let currentSeed = 0;""", "seed state")
s = sub1(s, """const satJs = x => Math.min(1, Math.max(0, x));""",
         """const satJs = x => Math.min(1, Math.max(0, x));
// r18: seed -> offsets over the tileable fields (irrational multipliers keep successive seeds
// decorrelated; any translate of the stationary field is an equally-valid new pattern draw).
function seedOffset(seed) {
  const s = Math.min(999, Math.max(0, Math.round(seed)));
  return [s * 37.7192 % 128, s * 61.8384 % 128, s * 29.5504 % 128];
}""", "seedOffset helper")
s = sub1(s, """    if (enabled && noiseCPU) {
      const sk = next.coverage.toFixed(4) + '|' + next.density.toFixed(4);
      if (sk !== sheetsKey) { sheetsKey = sk; buildSheets(); }
    }
    return changed;""",
         """    currentSeed = next.seed;
    if (enabled && noiseCPU) {
      const sk = next.coverage.toFixed(4) + '|' + next.density.toFixed(4) + '|' + next.seed;
      if (sk !== sheetsKey) { sheetsKey = sk; buildSheets(); }
    }
    return changed;""", "sheetsKey seed")
# setEnabled: first-enable buildSheets uses currentSeed path automatically (uniforms already set)

# ---- 3k. _debug: expose stats + seed ----
s = sub1(s, """    _debug: { get shapeTex() { return shapeTex; }, get noiseCPU() { return noiseCPU; }, uniforms },""",
         """    _debug: { get shapeTex() { return shapeTex; }, get noiseCPU() { return noiseCPU; }, uniforms,
      get lastSheetsStats() { return lastSheetsStats; }, get seed() { return currentSeed; } },""", "debug stats")

open(f"{ED}/js/clouds.js", "w").write(s)
print("clouds.js patched")

# ================= ui.js — seed input + effective-coverage hint =================
s = open(f"{ED}/js/ui.js").read()
s = sub1(s, """      <div class="lp-date" id="lpCloudDims">Alt m<input id="lpCAlt" type="number" min="500" max="8000" step="100"> Thick m<input id="lpCThk" type="number" min="200" max="4000" step="100"></div>
      <div class="lp-hint" id="lpCloudsHint"></div>""",
         """      <div class="lp-date" id="lpCloudDims">Alt m<input id="lpCAlt" type="number" min="500" max="8000" step="100"> Thick m<input id="lpCThk" type="number" min="200" max="4000" step="100"></div>
      <label class="lp-row" id="lpSeedRow">Seed<input id="lpCSeed" type="number" min="0" max="999" step="1" style="width:4em"><span></span></label>
      <div class="lp-hint" id="lpCloudsHint"></div>""", "seed row")
s = sub1(s, """    const cloudRows = [['lpCovRow', cl.enabled && cloudsUsable], ['lpDenRow', cl.enabled && cloudsUsable], ['lpCirRow', cl.enabled && cloudsUsable], ['lpCloudDims', cl.enabled && cloudsUsable]];""",
         """    const cloudRows = [['lpCovRow', cl.enabled && cloudsUsable], ['lpDenRow', cl.enabled && cloudsUsable], ['lpCirRow', cl.enabled && cloudsUsable], ['lpCloudDims', cl.enabled && cloudsUsable], ['lpSeedRow', cl.enabled && cloudsUsable]];""", "seed row vis")
s = sub1(s, """    setVal($id('lpCAlt'), cl.altitudeM ?? 2500);
    setVal($id('lpCThk'), cl.thicknessM ?? 1200);""",
         """    setVal($id('lpCAlt'), cl.altitudeM ?? 2500);
    setVal($id('lpCThk'), cl.thicknessM ?? 1200);
    setVal($id('lpCSeed'), cl.seed ?? 0);""", "seed setVal")
s = sub1(s, """      : 'Parallax sheet clouds, weather-coupled (r18).';""",
         """      : 'Sheets on the dome; weather drives coverage: now ' + Math.round(100 * effCoverage(l)) + '% (' + (l.weather ?? 'clear') + ').';""", "hint effective")
s = sub1(s, """    const cloudsUsable = l.skyStyle === 'realistic';     // clouds are a realistic-sky feature — classic stays byte-identical""",
         """    const cloudsUsable = l.skyStyle === 'realistic';     // clouds are a realistic-sky feature — classic stays byte-identical
    // r18: the effective coverage the engine will use (weather anchor x user factor, floored)
    const effCoverage = ll => {
      const anchor = C.CLOUD_COVERAGE_BY_WEATHER[ll.weather ?? 'clear'] ?? 0.45;
      const floor = C.CLOUD_COVERAGE_FLOOR[ll.weather ?? 'clear'] ?? 0;
      const factor = (ll.clouds?.coverage ?? C.CLOUD_COVERAGE_DEFAULT) / C.CLOUD_COVERAGE_DEFAULT;
      return Math.min(1, Math.max(floor, anchor * factor));
    };""", "effCoverage fn")
# seed input wiring (next to the other cloud inputs' commit handlers)
s = sub1(s, """      app.setClouds({ [key]: Math.min(max, Math.max(min, +$id(id).value || min)) });""",
         """      app.setClouds({ [key]: Math.min(max, Math.max(min, +$id(id).value || min)) });
    };
    $id('lpCSeed').onchange = () => {
      app.setClouds({ seed: Math.min(999, Math.max(0, Math.round(+$id('lpCSeed').value || 0))) });""", "seed commit")
open(f"{ED}/js/ui.js", "w").write(s)
print("ui.js patched")
print("ALL L3 PATCHES APPLIED")
