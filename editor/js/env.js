// env.js — environment port from live bundle (wOr/xOr/yOr/vOr/$Fr/M8r/SDe/pZt/vje/OFr/TOr).
// See analysis/ENVIRONMENT.md for the de-minified originals.
import * as THREE from 'three';
import { C } from './const.js';

const DEG = Math.PI / 180;

// ================= round 6 (D): geographic sun solver (Spencer 1971 / NOAA worksheet) =================
// Local SOLAR time assumed (no eqtime/longitude correction — documented ± ~30 min vs civil time).
// Branch-free azimuth = atan2 of the sun vector's East/North components (finite at zenith, correct at poles).
// round 10 (skybox P1): realistic atmosphere dome (sebh/UnrealEngineSkyAtmosphere port)
import { createRealisticSky } from './sky.js';
// round 13 (P2): sky-dome cloud layer — realistic-sky feature (classic stays byte-identical)
import { createCloudLayer } from './clouds.js';

export function solarPositionDeg(geo) {
  const N = geo.dayOfYear ?? 166, h = geo.timeOfDay ?? 9.5, lat = geo.latitudeDeg ?? 45;
  const g = 2 * Math.PI / 365 * (N - 1 + (h - 12) / 24);            // fractional year
  const decl = 0.006918                                              // Spencer declination (rad)
    - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
    - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const H = 15 * (h - 12);                                           // hour angle (solar time)
  const rad = x => x * DEG;
  const sinEl = Math.sin(rad(lat)) * Math.sin(decl) + Math.cos(rad(lat)) * Math.cos(decl) * Math.cos(rad(H));
  const el = Math.asin(THREE.MathUtils.clamp(sinEl, -1, 1)) / DEG;
  const east = -Math.cos(decl) * Math.sin(rad(H));
  const north = Math.sin(decl) * Math.cos(rad(lat)) - Math.cos(decl) * Math.cos(rad(H)) * Math.sin(rad(lat));
  const az = (Math.atan2(east, north) / DEG + 360) % 360;              // compass, clockwise from north
  return { elevationDeg: el, azimuthDeg: az, rawElevationDeg: el, declRad: decl };
}
// northOffsetDeg = compass bearing of the scene's −Z axis (0 = −Z is true north, +X east).
// az_scene = az_true − northOffsetDeg (a sun due true-north with −Z pointing east → scene az 270).
export function geoToSceneLight(geo, base) {
  const s = solarPositionDeg(geo);
  const off = geo.northOffsetDeg ?? 0;
  const az = ((s.azimuthDeg - off) % 360 + 360) % 360;
  return {
    ...base,
    mode: 'geographic',
    azimuthDeg: az,
    elevationDeg: Math.min(C.ELEV_MAX, Math.max(C.ELEV_MIN, s.elevationDeg)),
    _rawElevation: s.elevationDeg,
  };
}
const luma = c => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;   // Rec.601 (linear-sRGB working space — documented)
const _wc = new THREE.Color();
function desat(color, k) { if (k <= 0) return color; _wc.setRGB(luma(color), luma(color), luma(color)); return color.lerp(_wc, k); }

// ---------- daylight table interpolation ($Fr) ----------
const _ca = new THREE.Color(), _cb = new THREE.Color();
function lerpColor(a, b, t) { return new THREE.Color(a).lerp(_cb.set(b), t); }
export function daylightAt(elevationDeg) {
  const stops = C.DAYLIGHT_STOPS;
  let i = 0;
  while (i < stops.length - 2 && elevationDeg > stops[i + 1].elevationDeg) i++;
  const a = stops[i], b = stops[i + 1];
  const t = THREE.MathUtils.clamp((elevationDeg - a.elevationDeg) / (b.elevationDeg - a.elevationDeg), 0, 1);
  const lin = k => a[k] + (b[k] - a[k]) * t;
  const col = k => lerpColor(a[k], b[k], t);
  return {
    zenith: col('zenith'), horizon: col('horizon'), fillSky: col('fillSky'),
    fillGround: col('fillGround'), fill: lin('fill'), sunColor: col('sunColor'),
    sun: lin('sun'), glow: lin('glow'), flare: lin('flare'),
  };
}

// ---------- light normalize (SDe) — round 6: extended passthrough (audit P0-3) ----------
export function normalizeLight(l) {
  if (!l) return { ...C.LIGHT_DEFAULT, mode: 'custom', weather: 'clear', indoor: false, ambientLevel: 0.35, geo: { ...C.LIGHT_GEO_DEFAULTS } };
  const out = {
    mode: l.mode === 'geographic' ? 'geographic' : 'custom',
    azimuthDeg: ((l.azimuthDeg % 360) + 360) % 360,
    elevationDeg: Math.min(C.ELEV_MAX, Math.max(C.ELEV_MIN, l.elevationDeg)),
    weather: C.WEATHER[l.weather] ? l.weather : 'clear',
    indoor: !!l.indoor,
    ambientLevel: Number.isFinite(l.ambientLevel) ? Math.min(1, Math.max(0, l.ambientLevel)) : 0.35,
    geo: { ...C.LIGHT_GEO_DEFAULTS, ...(l.geo ?? {}) },
  };
  if (l.nightLights === false) out.nightLights = false;
  if (l.skyStyle === 'realistic') out.skyStyle = 'realistic';   // round 10: classic default when absent
  // round 13 (HDR): tone mapping + bloom passthrough — only when enabled (absence = off),
  // same clamps/defaults as the schema normLight passthrough
  if (l.hdr && typeof l.hdr === 'object' && l.hdr.enabled === true) {
    const h = l.hdr;
    out.hdr = {
      enabled: true,
      exposure: Number.isFinite(h.exposure) ? Math.min(2, Math.max(0.5, h.exposure)) : C.HDR_DEFAULTS.exposure,
      bloom: Number.isFinite(h.bloom) ? Math.min(1, Math.max(0, h.bloom)) : C.HDR_DEFAULTS.bloom,
      bloomThreshold: Number.isFinite(h.bloomThreshold) ? Math.min(2, Math.max(0.6, h.bloomThreshold)) : C.HDR_DEFAULTS.bloomThreshold,
      bloomRadius: Number.isFinite(h.bloomRadius) ? Math.min(1, Math.max(0, h.bloomRadius)) : C.HDR_DEFAULTS.bloomRadius,
    };
  }
  // round 13 (P2): clouds passthrough — only when enabled (absence = off), same clamps as schema
  if (l.clouds && typeof l.clouds === 'object' && l.clouds.enabled === true) {
    const c = l.clouds;
    out.clouds = {
      enabled: true,
      coverage: Number.isFinite(c.coverage) ? Math.min(1, Math.max(0, c.coverage)) : C.CLOUD_COVERAGE_DEFAULT,
      density: Number.isFinite(c.density) ? Math.min(4, Math.max(0.25, c.density)) : 1,
      altitudeM: Number.isFinite(c.altitudeM) ? Math.min(8000, Math.max(500, c.altitudeM)) : 2500,
      thicknessM: Number.isFinite(c.thicknessM) ? Math.min(4000, Math.max(200, c.thicknessM)) : 1200,
      cirrus: Number.isFinite(c.cirrus) ? Math.min(1, Math.max(0, c.cirrus)) : 0.15,
      windSpeed: Number.isFinite(c.windSpeed) ? Math.min(3, Math.max(0, c.windSpeed)) : 0.2,
      seed: Number.isFinite(c.seed) ? Math.min(999, Math.max(0, Math.round(c.seed))) : 0,   // r18 review P0-1: schema kept it, this normalize dropped it on every load
    };
  }
  return out;
}

// ---------- sun direction (M8r) ----------
export function sunDirection(light) {
  const az = light.azimuthDeg * DEG;
  const el = (light.elevationDeg > C.EL_REMAP_EDGE
    ? Math.max(light.elevationDeg, C.EL_REMAP_MIN)
    : C.EL_REMAP_K - light.elevationDeg) * DEG;
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
}

// r19 L2: TRUE sun direction (no EL_REMAP) and the moon direction — SHARED by the visible
// disc (buildSkyParams) and the night key-light blend (applyDaylight) so the hard light can
// never desync from the sky visuals again (one formula, one place).
export function trueSunDirection(light, out = new THREE.Vector3()) {
  const az = light.azimuthDeg * DEG, el = light.elevationDeg * DEG;
  return out.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
}
export function moonDirection(sunDir, out = new THREE.Vector3()) {
  out.copy(sunDir).multiplyScalar(-1);       // anti-solar full moon
  _moonRight.set(-sunDir.z, 0, sunDir.x).normalize();
  out.addScaledVector(_moonRight, 0.25).normalize();
  return out;
}
const MOON_TONE = new THREE.Color(C.MOON_TONE);   // r19: hoisted to C (the sky.js disc literal cites it)
// r19: the night-amount ramp — ONE formula shared by buildSkyParams and the key-light blend
const nightAmountOf = elDeg => Math.min(1, Math.max(0, (-elDeg - 3) / 11));

// round 10 (skybox P1): realistic-sky parameter bundle from the light state.
// Sun direction follows sunDirection(light) so the disc, shadows and flare always agree;
// the atmosphere illuminance is reference-normalized (1.0) with a mild daylight sun tint.
const _tint = new THREE.Color(), _white = new THREE.Color(1, 1, 1);
const _moonRight = new THREE.Vector3();
const SKY_FOG_BLEND = { clear: 0.06, cloudy: 0.2, overcast: 0.32, rain: 0.45, fog: 0.85 };
const SKY_FOG_WEATHER_DIM = { clear: 0, cloudy: 0.01, overcast: 0.03, rain: 0.05, fog: 0.04 };   // r18: realistic-dome horizon band only (sub-notice: a larger dim showed a hard seam vs the un-dimmed floor fog at the horizon line — the floor fog must stay classic-exact)
function buildSkyParams(light, fogColor, g) {
  const w = C.WEATHER[light.weather] ?? C.WEATHER.clear;
  const gg = g ?? daylightAt(light.elevationDeg);
  // TRUE sun direction for the atmosphere (no EL_REMAP): the sky is physical — the disc sets
  // below the horizon. Scene lighting keeps the classic remapped sunDirection (P1 design:
  // object lighting identical to classic; at night sun.intensity is 0 so no disagreement).
  const sunDir = trueSunDirection(light);
  _tint.copy(gg.sunColor);
  const mx = Math.max(_tint.r, _tint.g, _tint.b, 1e-6);
  _tint.multiplyScalar(1 / mx).lerp(_white, 0.5);          // hue only, halved toward white
  const nightAmt = nightAmountOf(light.elevationDeg);
  const moonDir = moonDirection(sunDir);
  return {
    sunDir,
    sunIlluminance: [_tint.r, _tint.g, _tint.b],
    altitudeM: light.geo?.altitudeM ?? 0,
    weather: light.weather,
    nightAmt, moonDir,
    weatherDesat: w.desat, weatherDarken: w.darken,
    // r18 (VLM QA): the realistic dome's horizon band dims with the weather (the shared
    // scene.fog.color stays byte-exact for the classic oracle path — this is dome-only)
    fogColor: (fogColor ? fogColor.clone() : new THREE.Color(0xffffff))
      .multiplyScalar(1 - (SKY_FOG_WEATHER_DIM[light.weather] ?? 0)),
    fogBlend: SKY_FOG_BLEND[light.weather] ?? 0.06,
    sunDiscL: new THREE.Vector3(30, 30, 30),
    exposure: C.SKY_EXPOSURE,
  };
}

// ---------- clouds (P2): params from light.clouds + weather coupling (realistic branch only) ----------
// r21 revert (user: 'COMPLETELY revert to the earlier approach'): the r13 coupling is back —
// the USER coverage is authoritative; weather modulates ±30% max. The r18 anchor×factor+floors
// table (weather DRIVES coverage, user slider relative, rain/fog floors) went with the blob
// rework it was built for. The old anchoring (userCov × weatherCov/0.45) crushed clear weather
// to ×0.4 — user 0.5 rendered as 0.2 and the deck dissolved into wisps. Overcast/rain factors
// still reach 1.0 at high user coverage. The r18 weather COLOR coupling stays (weatherSun/
// weatherHemi/cloudDarken below — an explicit r18 user ask, shape-neutral).
function buildCloudParams(light, sp) {     // sp = buildSkyParams bundle (shares night/moon/fog)
  const cl = light.clouds ?? {};
  const w = C.WEATHER[light.weather] ?? C.WEATHER.clear;
  const wFac = C.CLOUD_COV_FACTOR[light.weather] ?? 1;
  const coverage = Math.min(1, Math.max(0, (cl.coverage ?? C.CLOUD_COVERAGE_DEFAULT) * wFac));
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
}

// ---------- sky dome (xOr) ----------
const SKY_VERT = /* glsl */`
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    // Rotated with the view, never moved: the sky is at infinity. xyww puts it on
    // the far plane whatever the clip range is.
    vec4 clip = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
    gl_Position = clip.xyww;
  }`;
const SKY_FRAG = /* glsl */`
  varying vec3 vDirection;
  uniform vec3 zenith;
  uniform vec3 horizon;
  uniform vec3 flare;
  uniform vec3 flareDirection;
  uniform float uHdrGain;   // r20 L1: dome-BODY-only HDR gain (1 = byte-inert). The dome
                            // horizon is LOCKED to the fog color by design (continuity), so a
                            // shared lift can never bloom the sky without washing the fog —
                            // the gain lifts only the body; the flare keeps its own lifts.
  void main() {
    vec3 direction = normalize(vDirection);
    float height = max(direction.y, 0.0);
    vec3 body = mix(horizon, zenith, pow(height, 0.55));
    // Kept off the horizon itself, where the sky has to match the haze exactly.
    vec3 flareTerm = flare * pow(max(dot(direction, flareDirection), 0.0), 7.0) * smoothstep(0.0, 0.06, height);
    gl_FragColor = vec4(body * uHdrGain + flareTerm, 1.0);
    #include <colorspace_fragment>
  }`;

function makeSkyDome() {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false, // [A:F9] fog:false
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
      uniforms: {
        zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() },
        flare: { value: new THREE.Color() }, flareDirection: { value: new THREE.Vector3() },
        uHdrGain: { value: 1 },
      },
    }));
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.raycast = () => {};
  return mesh;
}

// ---------- environment (wOr) ----------
export function createEnvironment(scene, settings) {
  const sky = makeSkyDome();
  scene.add(sky);
  // round 10 (skybox P1): realistic dome — hidden until light.skyStyle === 'realistic'
  const realistic = createRealisticSky({ renderer: settings.renderer });
  scene.add(realistic.mesh);
  // round 13 (P2): cloud dome — hidden until realistic + light.clouds.enabled (never compiles off)
  const cloudLayer = createCloudLayer({ renderer: settings.renderer, sky: realistic });
  scene.add(cloudLayer.mesh);
  let skyStyle = 'classic';
  let _finishOn = false;                   // r18 P0-2: the HDR sky lift is gated hdr && finishOn
  let _lastLight = null;
  const _keyDir = new THREE.Vector3(0, 1, 0);   // r19 L2: effective hard-light dir (see applyDaylight)
  const _blendAxis = new THREE.Vector3(), _blendQuat = new THREE.Quaternion();   // r19 L2 slerp scratch
  scene.fog = new THREE.FogExp2(0xffffff, 0);
  const hemi = new THREE.HemisphereLight();
  scene.add(hemi);
  // round 6 (D7): indoor indirect base — warm-neutral AmbientLight, intensity 0 unless indoor
  const ambient = new THREE.AmbientLight(0xfff4e6, 0);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight();
  sun.castShadow = true;
  const mapPx = Math.min(C.SHADOW_MAP_PX, settings.renderer.capabilities.maxTextureSize);
  sun.shadow.mapSize.set(mapPx, mapPx);
  sun.shadow.radius = C.SUN_RADIUS;
  scene.add(sun, sun.target);

  // Floor: PlaneGeometry(80000², 128²) — raycast via a segment-free proxy (fast floor picking).
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(C.FLOOR_SIZE, C.FLOOR_SIZE, C.FLOOR_SEGS, C.FLOOR_SEGS),
    new THREE.MeshStandardMaterial({
      color: C.FLOOR_COLOR, roughness: C.FLOOR_ROUGHNESS,
      polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4,   // bundle: factor 4 (audit 2-c)
    }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const floorProxy = new THREE.Mesh(new THREE.PlaneGeometry(C.FLOOR_SIZE, C.FLOOR_SIZE));
  floor.raycast = (raycaster, intersects) => {
    floorProxy.matrixWorld.copy(floor.matrixWorld);
    const n = intersects.length;
    floorProxy.raycast(raycaster, intersects);
    for (let i = n; i < intersects.length; i++) intersects[i].object = floor;
  };
  scene.add(floor);

  let _lastKey = '', glow = 0;
  let _lightChangedAt = -1e9;   // r20 L2a: light-idle stamp — written on every memo-key change
                                // (drags, L3 playback, any light edit). Feeds the realistic-sky
                                // PMREM deferral: the IBL rebake waits for ≥PMREM_IDLE_MS of
                                // light stillness so a sun drag/sweep never hitched the frame.
  function applyDaylight(light) {
    const glowAmount = () => light.nightLights === false ? 0 : glow;
    _lastLight = light;
    const w = C.WEATHER[light.weather] ?? C.WEATHER.clear;      // round 6 (D5)
    const indoor = !!light.indoor;                              // round 6 (D7)
    const key = light.azimuthDeg + '|' + light.elevationDeg + '|' + light.weather + '|' + indoor + '|' + (light.ambientLevel ?? '') + '|' + (light.geo?.altitudeM ?? 0) + '|s' + skyStyle
      + '|f' + (_finishOn ? 1 : 0)
      + '|c' + (light.clouds?.enabled ? [light.clouds.coverage, light.clouds.density, light.clouds.altitudeM, light.clouds.thicknessM, light.clouds.cirrus, light.clouds.windSpeed, light.clouds.seed ?? 0].join(',') : 'off')   // r13 audit P1: skyStyle in the key (r18: +seed)
      + '|h' + (light.hdr?.enabled ? [light.hdr.exposure, light.hdr.bloom, light.hdr.bloomThreshold, light.hdr.bloomRadius, light.hdr.shadowBoost].join(',') : 'off');   // r13 HDR: memo-key parity with setHdr (shadowBoost r13 review)
    if (key === _lastKey) return glowAmount();
    _lastKey = key;
    _lightChangedAt = performance.now();   // r20 L2a: the stamp (drags + playback + edits)
    const g = daylightAt(light.elevationDeg);
    const alt = light.geo?.altitudeM ?? 0;
    const altK = 1 + Math.min(alt, 4000) / 4000 * 0.06;         // air-mass thinning (audit P1-7)
    // round 13 (§4.5, review P2-4): HDR-only contrast rebalance — the "more obvious light and
    // shadow" ask. shadowBoost ∈ [0,1] (default .5); multipliers are ZERO when hdr is off, so
    // the byte-exact daylight stack is untouched (matrix 7/7 gate).
    const sb = light.hdr?.enabled ? (light.hdr.shadowBoost ?? C.HDR_DEFAULTS.shadowBoost) : 0;
    const sunBoostK = 1 + C.HDR_SHADOW_BOOST_SUN_K * sb;
    const fillK = 1 - C.HDR_SHADOW_BOOST_FILL_K * sb;
    // sun (key light): table × weather × altitude × hdr sunBoost.
    // r19 L1 (user feedback): indoor NO LONGER kills the sun — walls block it via the shadow
    // map and windows pass real shafts that follow the time-of-day. The warm ambient stays as
    // the indirect base; a real shaft through a window IS full sun (attenuating it here would
    // re-create the dead-room look the feedback was about — the shadow map is the attenuation).
    sun.color.copy(g.sunColor);
    sun.intensity = g.sun * w.sun * altK * sunBoostK;
    sun.visible = sun.intensity > 0;
    sun.shadow.radius = C.SUN_RADIUS * (1 + C.HDR_SHADOW_BOOST_RADIUS_K * sb);   // softer penumbra under hdr
    // hemi = sky-light GI (sky dome above, ground bounce below): table × weather × hdr fillK.
    // r19 L1: the old ×1.2 indoor boost was sized for a DEAD sun (D7 'window light is the
    // hemi's job') — with real shafts through windows it double-dipped; indoor is now the
    // same sky GI as outdoor (audit P1-1).
    hemi.intensity = g.fill * w.hemi * fillK;
    // ambient (D7): SINGLE scale — intensity = ambientLevel; warm neutral bounce base
    ambient.intensity = indoor ? (light.ambientLevel ?? 0.35) * fillK : 0;
    // weather color ops: desat fillSky/fillGround/zenith/horizon/fog; darken the sky dome
    // (§4.6 classic lift ×1.10 under hdr: sRGB-derived dome values ≤1.15 would otherwise sit
    // BELOW the bloom threshold and read darker through ACES — the lift keeps the sky scale)
    const lift = light.hdr?.enabled && _finishOn ? C.HDR_SKY_LIFT : 1;   // r18: both styles (fog + domes); finishOn-gated
    hemi.color.copy(g.fillSky); desat(hemi.color, w.desat);
    hemi.groundColor.copy(g.fillGround); desat(hemi.groundColor, w.desat);
    const u = sky.material.uniforms;
    // r20 L1: the dome BODY gets its own gain on top of the lift (the fog keeps the lift
    // only) — the shared lift alone could never bloom the sky without washing the fog band
    // (the dome horizon == fog color by construction; the cliff is structural). Byte-inert
    // at 1 (x*1.0) — the classic non-finish path and every hdr-off arm are untouched.
    u.uHdrGain.value = light.hdr?.enabled && _finishOn ? C.HDR_CLASSIC_BODY_GAIN : 1;
    u.zenith.value.copy(g.zenith).multiplyScalar((1 - w.darken) * lift); desat(u.zenith.value, w.desat);
    u.horizon.value.copy(g.horizon).multiplyScalar((1 - w.darken) * lift); desat(u.horizon.value, w.desat);
    scene.fog.color.copy(g.horizon); desat(scene.fog.color, w.desat);   // fog matches the weathered horizon
    scene.fog.color.multiplyScalar(lift);
    // r19 L4: the flare (sun glow) gets its OWN lift under hdr+finish — the region around the
    // sun crosses the bloom threshold while the body stays below (audit P0: gated like the
    // body lift; ungated it would clip a broad cone of sky to white on the plain+HDR fallback).
    const flareLift = light.hdr?.enabled && _finishOn ? C.HDR_CLASSIC_FLARE_LIFT : 1;
    u.flare.value.copy(g.sunColor).multiplyScalar(g.flare * w.flare * lift * flareLift);
    if (skyStyle === 'realistic') {
      // r18 (feedback #1): keep the IBL's directional/color character at a reduced magnitude so
      // the total indirect stays ~continuous with classic (the hemi is identical in both styles).
      // r19 L5 (feedback #2): OUTDOOR ONLY — indoor drops the IBL entirely (0): the sun/moon
      // shafts through windows + the warm ambient carry the interior, and the through-walls
      // fake bounce goes away (classic indoor has no IBL either -> style-switch delta ~0).
      scene.environmentIntensity = indoor ? 0 : C.SKY_IBL_INTENSITY;
      const sp = buildSkyParams(light, scene.fog.color, g);
      realistic.setParams(sp);
      // P2: cloud params ride the same daylight pass; changed params rebake the IBL only
      if (cloudLayer.setParams(buildCloudParams(light, sp))) {
        realistic.markPMREMDirty();
      }
    }
    const az = light.azimuthDeg * DEG, el = Math.max(light.elevationDeg, 0) * DEG;
    u.flareDirection.value.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    // r19 L2: the HARD light direction. Classic keeps the live-exact remapped sunDirection
    // (byte-identity; the classic dome has no disc to contradict it). Realistic style syncs
    // to what is VISIBLE: the true sun disc by day, sliding to the moon (anti-solar + 0.25
    // right — the exact uMoonDir the dome renders) as nightAmt 0→1. The slide happens inside
    // the table's intensity trough (g.sun ≈ 0 near el −8) so the swing is masked; the y-floor
    // keeps the shadow camera above ground when the disc sits at/below the horizon. The
    // color slides sunColor → the moon tone so lit surfaces and the disc agree.
    _keyDir.copy(sunDirection(light));
    if (skyStyle === 'realistic') {
      // r19 review P1-1: blend from the TRUE sun dir on BOTH branches — seeding from the
      // remapped sunDirection imported the EL_REMAP 5->33deg discontinuity at el -8 into the
      // dusk sweep (a 74deg key swing in 2deg of elevation while the table still read 0.25).
      // The true dir is continuous in el; the whole handoff is then the smooth sun->moon slide.
      const nightAmt = nightAmountOf(light.elevationDeg);
      const _tsd = trueSunDirection(light);
      if (nightAmt > 0) {
        // SLERP, not lerp: the sun and moon are nearly OPPOSITE unit vectors — a linear blend
        // passes through the zero vector at the midpoint (horizontal components cancel) and
        // the normalize amplifies the cancellation into a wild direction (the r19 T5 sweep
        // measured 68deg/deg swings around el -8.5). Rotating around the sun x moon axis has
        // uniform angular rate (~15deg per degree of elevation) and never degenerates.
        const _md = moonDirection(_tsd);
        _blendAxis.crossVectors(_tsd, _md);
        if (_blendAxis.lengthSq() > 1e-10) {
          _blendAxis.normalize();
          const _ang = Math.acos(Math.max(-1, Math.min(1, _tsd.dot(_md)))) * nightAmt;
          _blendQuat.setFromAxisAngle(_blendAxis, _ang);
          _keyDir.copy(_tsd).applyQuaternion(_blendQuat);
        } else {
          _keyDir.copy(_tsd);
        }
        sun.color.copy(g.sunColor).lerp(MOON_TONE, nightAmt);
      } else {
        _keyDir.copy(_tsd);   // day: match the visible disc, not the remap
      }
      // the y-floor covers BOTH branches (E2E T5: the day branch at el 0..-3 copied the true
      // sub-horizon dir — a below-ground key light with the table still at ~0.5 intensity);
      // ~+3deg keeps the shadow camera above the floor while the disc sits at the horizon.
      _keyDir.y = Math.max(_keyDir.y, 0.05);
      _keyDir.normalize();
    }
    glow = g.glow * (light.hdr?.enabled ? C.HDR_EMISSIVE_BOOST : 1);   // §4.5: night lamps cross the bloom threshold
    return glowAmount();
  }

  // walkableSurfaces (Dqr.d): floor + meshes not in {camera,target,spotlight,humanoid,simple_figure,group}
  const NOT_WALKABLE = new Set(['camera', 'target', 'spotlight', 'humanoid', 'simple_figure', 'group']);
  function walkableSurfaces() {
    const list = [floor];
    const map = settings.getMeshById ? settings.getMeshById() : settings.meshById;
    for (const m of map.values())
      if (!NOT_WALKABLE.has(m.userData.kind)) list.push(m);
    return list;
  }

  function setSkyStyle(style, light) {
    skyStyle = style === 'realistic' ? 'realistic' : 'classic';
    sky.visible = skyStyle === 'classic';
    if (skyStyle !== 'realistic' && scene.environment) scene.environment = null;  // drop IBL BEFORE the RT dispose
    // r18 review P1-1: resetting to 1 here + the 0.30 restore living inside applyDaylight's
    // memoized branch left the IBL at 1.0 when a key-identical applyDaylight followed (clicking
    // the active style seg, re-opening the same scene). Set the STYLE-correct value directly.
    // r19 L5 (audit P0): the value must also read INDOOR (0) or the style re-click clobbers it.
    scene.environmentIntensity = skyStyle === 'realistic'
      ? ((light ?? _lastLight)?.indoor ? 0 : C.SKY_IBL_INTENSITY) : 1;
    realistic.setEnabled(skyStyle === 'realistic');
    // P2: clouds are a realistic-sky feature — classic look stays byte-identical (mesh hidden,
    // twin removed, dome.renderOrder restored to -1 by setCloudTwin(null))
    const wantClouds = skyStyle === 'realistic' && (light ?? _lastLight)?.clouds?.enabled === true;
    cloudLayer.setEnabled(wantClouds);
    realistic.setCloudTwin(wantClouds ? cloudLayer.twinMesh : null);
    if (skyStyle === 'realistic') {
      const l = light ?? _lastLight;
      if (l) {                                        // r13 audit P1: push clouds on the style switch too
        const sp = buildSkyParams(l, scene.fog.color);
        realistic.setParams(sp);
        if (wantClouds) cloudLayer.setParams(buildCloudParams(l, sp));
      }
    }
  }
  // P2: after light.clouds mutations (main.js setClouds) — mesh + PMREM twin + renderOrder sync
  function setClouds(light) {
    const want = skyStyle === 'realistic' && light?.clouds?.enabled === true;
    cloudLayer.setEnabled(want);
    realistic.setCloudTwin(want ? cloudLayer.twinMesh : null);
  }
  // linearHDR (round 13): finish+HDR — the dome outputs LINEAR HDR so the sun
  // disc / stars / moon cross the bloom threshold (sky.js update uCurve=0 + uOutputSRGB=0);
  // the cloud deck rides the SAME split (review r13 P1: the premultiplied over-composite
  // crossfades deck and dome — they must share the output space or the deck blows out).
  function updateRealisticSky(camera, outputSRGB, linearHDR = false) {
    if (skyStyle !== 'realistic') return;
    // r19 L5: indoor skips the PMREM rebake entirely (the IBL contributes 0 there; the stale
    // texture stays bound at intensity 0 — no material recompiles on toggle). pmremPending is
    // left set, so the FIRST outdoor frame rebakes fresh.
    // r20 L2a: sunIdleFor — ms since the light last changed; realistic.update gates the PMREM
    // on ≥250ms of stillness so drags + L3 sweeps never bake mid-motion (LUT/sky-view bakes
    // keep their own 80ms throttle — cheap and keep the atmosphere gradient live).
    const indoor = !!(_lastLight?.indoor);
    realistic.update(camera, outputSRGB, scene, linearHDR, !indoor, performance.now() - _lightChangedAt);
    if (cloudLayer.enabled) cloudLayer.update(camera, outputSRGB, linearHDR);   // P2: wind drift + camera + sRGB gate
  }
  return { sky, floor, sun, hemi, ambient, applyDaylight, walkableSurfaces, shadowMapPx: mapPx, keyDirection: _keyDir,
    setSkyStyle, updateRealisticSky, realisticSky: () => realistic, getSkyStyle: () => skyStyle,
    setFinishOn: v => { _finishOn = !!v; }, getFinishOn: () => _finishOn,
    clouds: () => cloudLayer, setClouds };
}

// ---------- bounds (vje/OFr) ----------
const median = arr => arr[arr.length >> 1];
export function computeBounds(meshes) {
  const union = new THREE.Box3(); const boxes = [];
  const exclude = new Set(C.BOUNDS_EXCLUDE_KINDS);
  for (const m of meshes) {
    if (!m.parent) continue;
    const box = new THREE.Box3().setFromObject(m);
    if (box.isEmpty()) continue;
    union.union(box);
    if (!exclude.has(m.userData.kind)) boxes.push(box);
  }
  if (union.isEmpty()) return null;
  const sphere = union.getBoundingSphere(new THREE.Sphere());
  if (!Number.isFinite(sphere.radius)) return null;
  return { centre: sphere.center, radius: sphere.radius, boxes, ...spreadStats(boxes, sphere.center) };
}
function spreadStats(boxes, centre) {
  if (boxes.length === 0) return { focus: centre.clone(), spread90: 0, spread95: 0 };
  const centers = boxes.map(b => b.getCenter(new THREE.Vector3()));
  const axis = a => centers.map(c => c[a]).sort((x, y) => x - y);
  const focus = new THREE.Vector3(median(axis('x')), median(axis('y')), median(axis('z')));
  const dists = centers.map(c => Math.hypot(c.x - focus.x, c.z - focus.z)).sort((a, b) => a - b);
  const pct = p => dists[Math.min(dists.length - 1, Math.floor(dists.length * p))];
  return { focus, spread90: pct(0.9), spread95: pct(0.95) };
}

// ---------- dynamic fog / near / far (pZt + FFr/SFr/CFr) — round 6: weather multiplier INSIDE ----------
// (audit P0-4: the density↔far coupling must stay intact; d = min(FOG_DENSITY_CAP, base × weatherK × indoor))
export function createFogNearFar({ getMeshes, camera, scene, renderer, getLight }) {
  let bounds = null, last = -Infinity;
  const density = () => fogDensity(bounds, camera.position);
  const fogK = () => {
    const l = getLight?.();
    if (!l) return 1;
    const w = C.WEATHER[l.weather] ?? C.WEATHER.clear;
    return w.fog * (l.indoor ? 0.5 : 1);
  };
  function fogDensity(b, camPos) {
    const n = b ? camPos.distanceTo(b.focus) : camPos.length();
    const r = n + (b?.spread95 ?? 0);
    return C.FOG_DENSITY_NUM / Math.max(C.FOG_D1, r * C.FOG_D2, n * C.FOG_D3);
  }
  function farFrom(b, camPos) {
    const n = (Math.max(0, camPos.distanceTo(b.centre)) + Math.max(0, b.radius)) * C.FOG_K;
    return Number.isFinite(n) ? Math.min(C.FOG_FAR_CAP, Math.max(C.FAR_FALLBACK, n)) : C.FAR_FALLBACK;
  }
  function nearFrom(far, minBoxDist = Infinity) {
    return Math.max(C.NEAR_MIN, Math.min(far / (C.FAR_FALLBACK / C.NEAR_MIN), minBoxDist * C.NEAR_CAP_K));
  }
  function tick(now = performance.now()) {
    if (now - last >= C.BOUNDS_INTERVAL_MS) { last = now; bounds = computeBounds(getMeshes()); }
    const d = Math.min(C.FOG_DENSITY_CAP, fogDensity(bounds, camera.position) * fogK());
    if (scene.fog && scene.fog.isFogExp2) scene.fog.density = d;
    let far = bounds ? farFrom(bounds, camera.position) : C.FAR_FALLBACK;
    far = Math.min(C.FOG_FAR_CAP, Math.max(far, C.FAR_DENSITY_K / d));
    let minBox = Infinity;
    if (bounds) for (const b of bounds.boxes) minBox = Math.min(minBox, b.distanceToPoint(camera.position));
    const near = nearFrom(far, minBox);
    const h = (v, ref) => v > ref * C.HYSTERESIS || v < ref / C.HYSTERESIS;
    if (h(far, camera.far) || h(near, camera.near)) {
      camera.far = far; camera.near = near; camera.updateProjectionMatrix();
    }
  }
  return {
    tick, density,
    fitNow() { last = -Infinity; tick(); },
    bounds: () => bounds,
  };
}

// ---------- shadow fingerprint + fit (TOr/kOr/Bat) ----------
export function createShadowFit({ sun, applyDaylight, getLight, bounds, roots, meshById, keyDirection }) {
  let buf = new Float64Array(4096), n = 0, dirty = true, lastN = -1;
  const push = v => {
    if (n === buf.length) { const b = new Float64Array(buf.length * 2); b.set(buf); buf = b; }
    if (buf[n] !== v) { buf[n] = v; dirty = true; }
    n++;
  };
  const casterKinds = new Set(C.SHADOW_CASTER_KINDS);
  const FINGERPRINT_SKIP_KINDS = new Set(['camera', 'target']);   // live SOr — markers excluded from the walk
  const box = new THREE.Box3(), tmpBox = new THREE.Box3();
  function walk(obj, glow) {
    // f(): id, visible, position(3), quaternion(4 incl w), scale(3) — full TRS or stale shadows
    // live: camera/target kinds and Sprites are excluded (no fingerprint churn while dragging markers)
    if (!obj) return;
    if (FINGERPRINT_SKIP_KINDS.has(obj.userData?.kind) || obj.isSprite) return;
    push(obj.id); push(obj.visible ? 1 : 0);
    if (obj.position) { push(obj.position.x); push(obj.position.y); push(obj.position.z); }
    if (obj.quaternion) { push(obj.quaternion.x); push(obj.quaternion.y); push(obj.quaternion.z); push(obj.quaternion.w); }
    if (obj.scale) { push(obj.scale.x); push(obj.scale.y); push(obj.scale.z); }
    const spot = obj.userData?.spotlight;
    if (spot) { push(spot.light.castShadow ? 1 : 0); push(spot.light.angle); return; }
    if (obj.isMesh) {
      const notBasic = !obj.material?.isMeshBasicMaterial;
      obj.castShadow = notBasic; obj.receiveShadow = notBasic;
      if (obj.userData.glows && obj.material) {
        const m = obj.material;
        if (m.userData.glowAt !== glow) {
          m.userData.glowAt = glow;
          m.emissive?.setHex(C.GLOW_EMISSIVE); m.emissiveIntensity = glow;
        }
      }
    }
    for (const c of obj.children) walk(c, glow);
  }
  const _up = new THREE.Vector3(0, 1, 0), _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3();
  function snapToGrid(v, dir, step) { // kOr: snap centre onto texel grid in plane ⟂ sun
    _e1.crossVectors(_up, dir);
    if (_e1.lengthSq() < 1e-8) _e1.set(1, 0, 0);
    _e1.normalize();
    _e2.crossVectors(dir, _e1).normalize();
    snapAxis(v, _e1, step); snapAxis(v, _e2, step);
  }
  function snapAxis(v, e, step) { // Bat
    const d = v.dot(e);
    v.addScaledVector(e, Math.round(d / step) * step - d);
  }
  const focus = new THREE.Vector3(), dir = new THREE.Vector3(), sphere = new THREE.Sphere();
  function fit() {
    n = 0; box.makeEmpty();
    const glow = applyDaylight(getLight());
    for (const root of roots()) {
      walk(root, glow);
      if (casterKinds.has(root.userData.kind) && root.parent) box.union(tmpBox.setFromObject(root));
    }
    const b = bounds();
    focus.copy(b ? b.focus : new THREE.Vector3(0, 0, 0));
    let v = (b?.spread90 ?? 0) * C.SHADOW_SPREAD_K;
    const mapSize = sun.shadow.mapSize.x;
    const texelWorld = C.SHADOW_TEXEL_K * mapSize / 2;
    if (!box.isEmpty()) {
      box.expandByScalar(C.SHADOW_EXPAND).getBoundingSphere(sphere);
      const reach = focus.distanceTo(sphere.center) + sphere.radius;
      if (reach <= texelWorld) v = Math.max(v, reach);
      else { focus.copy(sphere.center); v = sphere.radius; }
    }
    const w = Math.min(texelWorld, Math.max(C.SHADOW_MIN_EXTENT, Math.ceil(v / C.SHADOW_SNAP) * C.SHADOW_SNAP));
    dir.copy(keyDirection ?? sunDirection(getLight()));   // r19 L2: blended effective dir
    snapToGrid(focus, dir, 2 * w / mapSize);
    const S = w * 2;
    sun.target.position.copy(focus); sun.target.updateMatrixWorld();
    sun.position.copy(focus).addScaledVector(dir, S);
    const far = S + w + Math.max(0, (focus.y + w) / dir.y);
    const cam = sun.shadow.camera;
    const normalBias = Math.min(C.SHADOW_NORMALBIAS_MAX,
      C.SHADOW_NORMALBIAS_K * 2 * w / mapSize * Math.min(C.SHADOW_NORMALBIAS_K2, 1 / dir.y));
    if (cam.right !== w || cam.far !== far || sun.shadow.normalBias !== normalBias) {
      cam.left = cam.bottom = -w; cam.right = cam.top = w;
      cam.near = C.SHADOW_NEAR; cam.far = far;
      sun.shadow.bias = -0.005 / (far - C.SHADOW_NEAR);
      sun.shadow.normalBias = normalBias;
      cam.updateProjectionMatrix();
    }
    // TOr tail: fingerprint the sun fit itself, then report changed = dirty || count-changed.
    // NOTE (live parity): the WALK RUNS EVERY CALL — `dirty` only means "values changed since
    // last walk", never "walk pending". Gating the walk behind dirty (our old bug) meant scene
    // changes were never detected at all after the first steady frame — shadows never updated.
    push(sun.position.x); push(sun.position.y); push(sun.position.z); push(w); push(far);   // m(e.position) + w + far
    const changed = dirty || n !== lastN;
    dirty = false; lastN = n;
    return changed;
  }
  return {
    tick() { return fit(); },          // walk + fit EVERY frame (live TOr closure)
    force() { dirty = true; },         // next tick reports changed (bump AOr generation)
    // AOr: generation bump on change → renderer.shadowMap.needsUpdate (+ context-restored)
    tickAOr(renderer) {
      if (this.tick()) this._gen = (this._gen ?? 0) + 1;
      if (this._aorGen?.get(renderer) !== this._gen) {
        if (!this._aorGen) {
          this._aorGen = new WeakMap();
          renderer.domElement.addEventListener('webglcontextrestored', () => this._aorGen.delete(renderer));
        }
        this._aorGen.set(renderer, this._gen);
        renderer.shadowMap.needsUpdate = true;
      }
    },
  };
}
