// schema.js — scene v10 load / migrate / normalize / save.
// Ports: iGt/f6r/prt/c6r/a6r/u6r/h6r/p6r/l6r/o6r/b6r/g6r/m6r (see analysis/TRACK_SYSTEM.md §9).
import { C } from './const.js';
import { buildTangents, polylineOf, arcLength } from './curves.js';

// r20 L3 (audit L3-3): the light-track bump is v12 → v13. The version constant moves HERE —
// const.js (the old home, still 12) is off-limits this round; every writer (emptyScene,
// currentSceneJSON) imports this one. loadScene checks raw numbers, never C.SCHEMA_V.
export const SCHEMA_V = 13;   // round 20: light-transform track items (the Daylight lane)

export const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }));

const clampSpeed = v => Number.isFinite(v) && v > 0 ? Math.max(v, C.SPEED_STORE_FLOOR) : C.SPEED_UI_FLOOR; // bie/i6r
const isPathKind = it => it.kind === 'path' || it.kind === 'cam-path'; // g2

// item duration (yd): path kinds derive from arc/speed
export function itemDuration(it) {
  if (isPathKind(it)) return it.anchors.length < 2 ? 0 : arcLength(polylineOf(it.anchors)) / it.speedUnitsPerS;
  return it.durationS;
}

// ---- v1→v2 (c6r): performances map → single show ----
function v1to2(t) {
  const perfs = t.performances ?? {};
  const active = t.activePerformanceId ? perfs[t.activePerformanceId] : null;
  const show = active ?? Object.values(perfs)[0] ?? { name: 'Show', tracks: [] };
  return { ...t, v: 2, show };
}
// ---- v2→v3 (a6r): legacy points[] → anchors via tangent builder ----
function v2to3(show) {
  if (!show) return { name: 'Show', tracks: [] };
  const tracks = (show.tracks ?? []).map(tr => ({
    ...tr,
    items: (tr.items ?? []).map(it => it.kind === 'path' && it.points
      ? { ...it, anchors: buildTangents(it.points), points: undefined } : it),
  }));
  return { ...show, tracks };
}
// ---- v4→v5 (u6r/d6r): camera shot object → camera fields + one track ----
function v4to5(t) { // u6r — EVERY camera gets focal/shake + a track with a default item
  const objects = { ...t.objects };
  const tracks = [...(t.show?.tracks ?? [])];
  for (const [id, obj] of Object.entries(t.objects)) {
    if (obj.kind !== 'camera') continue;
    const shot = obj.shot;
    const preset = { kind: 'orbit', durationS: 8, angleDeg: 360, heightDeltaUnits: 0, distanceScale: 1, direction: 'ccw', subjectId: null, ...(shot?.preset ?? {}) };
    const rail = { a: null, b: null, speedUnitsPerS: 2, followTarget: true, followObjectId: null, ...(shot?.rail ?? {}) };
    const s = { shotMode: 'still', ...shot, preset, rail, followObjectId: shot?.followObjectId ?? null, focalLengthMm: shot?.focalLengthMm ?? C.FOCAL_DEFAULT, shake: shot?.shake ?? 'off' };
    const show = { name: t.show?.name ?? 'Show', tracks };
    const { shot: _drop, ...rest } = obj;
    objects[id] = { ...rest, focalLengthMm: s.focalLengthMm, shake: s.shake, ...(shot ? { legacyShot: shot } : {}) };
    tracks.push({ id: uuid(), characterId: id, items: [{ ...shotToItem(s, show), id: uuid(), startS: 0 }] });   // d6r: still/default → cam-still
  }
  return { ...t, v: 5, objects, show: { ...t.show, tracks } };
}
function showDuration(show) { // rx-lite for hrt
  let end = 0;
  for (const tr of show?.tracks ?? []) for (const it of tr.items ?? []) end = Math.max(end, it.startS + itemDuration(it));
  return end;
}
function shotToItem(shot, show) { // d6r
  switch (shot.shotMode) {
    case 'preset': return { kind: 'cam-move', durationS: shot.preset.durationS, move: shot.preset.kind, subjectId: shot.preset.subjectId, direction: shot.preset.direction, angleDeg: shot.preset.angleDeg, heightDeltaUnits: shot.preset.heightDeltaUnits, distanceScale: shot.preset.distanceScale };
    case 'rail': {
      const { a, b, speedUnitsPerS } = shot.rail;
      return !a || !b ? { kind: 'cam-still', durationS: shot.preset.durationS }
        : { kind: 'cam-path', anchors: buildTangents([a, b]), speedUnitsPerS: clampSpeed(speedUnitsPerS), aim: shot.rail.followTarget ? 'subject' : 'locked', subjectId: shot.rail.followObjectId };
    }
    case 'follow': return { kind: 'cam-follow', durationS: Math.max(showDuration(show), C.ITEM_DEFAULT_DUR), objectId: shot.followObjectId, ...(shot.followOffset ? { offset: shot.followOffset } : {}) };
    case 'manual': return { kind: 'cam-manual', durationS: Math.max(showDuration(show), C.ITEM_DEFAULT_DUR), samples: [] };
    default: return { kind: 'cam-still', durationS: shot.preset.durationS };
  }
}
// ---- v5→v6 (h6r): prop yawDeg baked into rotation[1] ----
function v5to6(t, propCatalog) {
  const objects = {}; const yawByObject = {};
  for (const [id, obj] of Object.entries(t.objects)) {
    if (obj.kind === 'prop' && obj.propKey && propCatalog[obj.propKey]?.yawDeg) {
      const yaw = propCatalog[obj.propKey].yawDeg * Math.PI / 180;
      yawByObject[id] = yaw;
      objects[id] = { ...obj, rotation: [obj.rotation[0], obj.rotation[1] - yaw, obj.rotation[2]] };
    } else objects[id] = { ...obj };
  }
  const tracks = (t.show?.tracks ?? []).map(tr => ({
    ...tr,
    items: (tr.items ?? []).map(it => {
      if (it.kind !== 'transform' || !yawByObject[tr.characterId]) return it;
      return { ...it, keys: (it.keys ?? []).map(k => ({ ...k, rotation: [k.rotation[0], k.rotation[1] - yawByObject[tr.characterId], k.rotation[2]] })) };
    }),
  }));
  return { ...t, v: 6, objects, show: { ...t.show, tracks } };
}
// ---- v7→v8 (p6r): transform key rotations unwrapped per axis ----
function v7to8(t) { // p6r — chained unwrap: prev = the UNWRAPPED previous key (multi-wrap accumulates)
  const wrapDiff = (c, d) => { let n = (d - c) % (2 * Math.PI); if (n > Math.PI) n -= 2 * Math.PI; if (n < -Math.PI) n += 2 * Math.PI; return n; };
  const unwrap = (c, d) => Math.abs(d - c) <= Math.PI ? d : c + wrapDiff(c, d);   // p6r's o()
  const tracks = (t.show?.tracks ?? []).map(tr => ({
    ...tr,
    items: (tr.items ?? []).map(it => {
      if (it.kind !== 'transform' || !Array.isArray(it.keys)) return it;
      let prev = null;   // l — the chained unwrapped rotation
      const keys = it.keys.map(k => {
        if (!k?.rotation) return k;
        const rot = prev
          ? [unwrap(prev[0], k.rotation[0]), unwrap(prev[1], k.rotation[1]), unwrap(prev[2], k.rotation[2])]
          : k.rotation;
        prev = rot;
        return { ...k, rotation: rot };
      });
      return { ...it, keys };
    }),
  }));
  return { ...t, v: 8, show: { ...t.show, tracks } };
}
export const wrapPi = a => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

// ---- post-normalizers (prt) ----
function normLegacyRail(t) { // l6r
  const tracks = (t.show?.tracks ?? []).map(tr => ({
    ...tr,
    items: (tr.items ?? []).map(it => it.kind !== 'cam-rail' ? it : {
      kind: 'cam-path',
      anchors: buildTangents([it.a, it.b].filter(Boolean)),
      speedUnitsPerS: clampSpeed(it.a && it.b ? dist3(it.a, it.b) / Math.max(0.1, it.durationS) : C.SPEED_DEFAULT),
      aim: it.followTarget === false ? 'locked' : 'subject',
      subjectId: it.followObjectId ?? null,
      startS: it.startS, id: it.id, durationS: undefined,
    }),
  }));
  return { ...t, show: { ...t.show, tracks } };
}
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function normSpeeds(t) { // o6r
  let needs = false;
  for (const tr of t.show?.tracks ?? []) for (const it of tr.items ?? [])
    if (isPathKind(it) && clampSpeed(it.speedUnitsPerS) !== it.speedUnitsPerS) needs = true;
  if (!needs) return t;
  const tracks = (t.show?.tracks ?? []).map(tr => ({
    ...tr,
    items: (tr.items ?? []).map(it => isPathKind(it) ? { ...it, speedUnitsPerS: clampSpeed(it.speedUnitsPerS) } : it),
  }));
  return { ...t, show: { ...t.show, tracks } };
}

function validPace(p) { // X2r — len>=2, first 0, last 1, all in 0..1, non-decreasing
  if (!Array.isArray(p) || p.length < 2 || !p.every(Number.isFinite)) return false;
  if (p[0] !== 0 || p[p.length - 1] !== 1) return false;
  for (const v of p) if (v < 0 || v > 1) return false;
  for (let i = 1; i < p.length; i++) if (p[i] < p[i - 1]) return false;
  return true;
}
const pair2 = v => Array.isArray(v) && v.length === 2 && v.every(Number.isFinite);
function validHeightCurve(c) { // Kzt — len>=2, u 0..1 strictly increasing w/ endpoints, heightM 0..100, in[0]<=0, out[0]>=0
  if (!Array.isArray(c) || c.length < 2) return false;
  for (let i = 0; i < c.length; i++) {
    const p = c[i];
    if (!p || typeof p !== 'object') return false;
    if (typeof p.u !== 'number' || (i === 0 ? p.u !== 0 : p.u <= c[i - 1].u)) return false;
    if (i === c.length - 1 && p.u !== 1) return false;
    if (typeof p.heightM !== 'number' || p.heightM < 0 || p.heightM > C.HEIGHT_CURVE_MAX) return false;
    if (!pair2(p.in) || !pair2(p.out) || p.in[0] > 0 || p.out[0] < 0) return false;
  }
  return true;
}
const LIGHT_KEY_DEDUPE_S = 0.01;   // r20 L3: tS-tolerance dedupe on load (audit L3-6)
function normItems(t) { // b6r
  const ids = new Set(Object.keys(t.objects ?? {}));
  const tracks = (t.show?.tracks ?? []).map(tr => ({
    ...tr,
    items: (tr.items ?? []).map(it => {
      const out = { ...it };
      if (out.pace !== undefined && !validPace(out.pace)) delete out.pace;
      if (out.heightCurve !== undefined && !validHeightCurve(out.heightCurve)) delete out.heightCurve;
      if (out.kind === 'cam-still' && out.subjectId && !ids.has(out.subjectId)) delete out.subjectId;
      // r20 L3: light-transform keys — fUr/dHe imitation: az mod 360, el clamp −30..90,
      // tS finite ≥ 0, nightLights boolean; sorted by tS, deduped within 0.01 s. Keys
      // survive with ANY count (0 = inert shell, 1 = hold — "≥2 to animate" is an
      // evaluation property, not a validity gate; lightAtTime holds the single key).
      if (out.kind === 'light-transform') {
        const keys = [];
        for (const k of Array.isArray(out.keys) ? out.keys : []) {
          if (!k || typeof k !== 'object' || !Number.isFinite(k.tS)
            || !Number.isFinite(k.azimuthDeg) || !Number.isFinite(k.elevationDeg)) continue;
          const key = {
            tS: Math.max(0, k.tS),
            azimuthDeg: ((k.azimuthDeg % 360) + 360) % 360,
            elevationDeg: Math.min(C.ELEV_MAX, Math.max(C.ELEV_MIN, k.elevationDeg)),
          };
          if (typeof k.nightLights === 'boolean') key.nightLights = k.nightLights;
          keys.push(key);
        }
        keys.sort((a, b) => a.tS - b.tS);
        const dedup = [];   // later key of a ≤0.01 s cluster wins (the capture-replace order)
        for (const k of keys) {
          if (dedup.length && k.tS - dedup[dedup.length - 1].tS <= LIGHT_KEY_DEDUPE_S) dedup[dedup.length - 1] = k;
          else dedup.push(k);
        }
        out.keys = dedup;
      }
      return out;
    }),
  }));
  return { ...t, show: { ...t.show, tracks } };
}

function normLight(t) { // g6r/N8r/SDe — round 6: geo/weather/indoor/ambient/mode passthrough (audit P0-3)
  const l = t.light;
  if (!l || typeof l !== 'object' || !Number.isFinite(l.azimuthDeg) || !Number.isFinite(l.elevationDeg)) {
    const out = { ...t }; delete out.light; return out;
  }
  const n = { azimuthDeg: ((l.azimuthDeg % 360) + 360) % 360, elevationDeg: Math.min(C.ELEV_MAX, Math.max(C.ELEV_MIN, l.elevationDeg)) };
  if (l.nightLights === false) n.nightLights = false;
  // round 10 (skybox P1): realistic sky style — absent = classic (migrated scenes unchanged)
  if (l.skyStyle === 'realistic') n.skyStyle = 'realistic';
  // round 13 (P2): cloud layer — emitted ONLY when enabled===true (absence = off =
  // byte-identical scenes); same additive passthrough pattern as skyStyle
  if (l.clouds && typeof l.clouds === 'object' && l.clouds.enabled === true) {
    const c = {};
    c.enabled = true;
    if (Number.isFinite(l.clouds.coverage)) c.coverage = Math.min(1, Math.max(0, l.clouds.coverage));
    if (Number.isFinite(l.clouds.density)) c.density = Math.min(4, Math.max(0.25, l.clouds.density));
    if (Number.isFinite(l.clouds.altitudeM)) c.altitudeM = Math.min(8000, Math.max(500, l.clouds.altitudeM));
    if (Number.isFinite(l.clouds.thicknessM)) c.thicknessM = Math.min(4000, Math.max(200, l.clouds.thicknessM));
    if (Number.isFinite(l.clouds.cirrus)) c.cirrus = Math.min(1, Math.max(0, l.clouds.cirrus));
    if (Number.isFinite(l.clouds.windSpeed)) c.windSpeed = Math.min(3, Math.max(0, l.clouds.windSpeed));
    if (Number.isFinite(l.clouds.seed)) c.seed = Math.min(999, Math.max(0, Math.round(l.clouds.seed)));   // r18: coverage-pattern seed
    n.clouds = c;
  }
  // round 13 (HDR): tone mapping + bloom — emitted ONLY when enabled===true (absence = off =
  // byte-identical scenes); same additive passthrough pattern as clouds
  if (l.hdr && typeof l.hdr === 'object' && l.hdr.enabled === true) {
    const h = {};
    h.enabled = true;
    if (Number.isFinite(l.hdr.exposure)) h.exposure = Math.min(2, Math.max(0.5, l.hdr.exposure));
    if (Number.isFinite(l.hdr.bloom)) h.bloom = Math.min(1, Math.max(0, l.hdr.bloom));
    if (Number.isFinite(l.hdr.bloomThreshold)) h.bloomThreshold = Math.min(2, Math.max(0.6, l.hdr.bloomThreshold));
    if (Number.isFinite(l.hdr.bloomRadius)) h.bloomRadius = Math.min(1, Math.max(0, l.hdr.bloomRadius));
    if (Number.isFinite(l.hdr.shadowBoost)) h.shadowBoost = Math.min(1, Math.max(0, l.hdr.shadowBoost));   // review r13 P2-4 (§4.5 rebalance amount)
    n.hdr = h;
  }
  // round 6 D — extended fields (clamped; unknown → dropped)
  if (l.mode === 'geographic' || l.mode === 'custom') n.mode = l.mode;
  else n.mode = 'custom';                       // audit P0-3: migrated scenes keep their az/el
  if (l.weather && C.WEATHER[l.weather]) n.weather = l.weather;
  if (typeof l.indoor === 'boolean') n.indoor = l.indoor;
  if (Number.isFinite(l.ambientLevel)) n.ambientLevel = Math.min(1, Math.max(0, l.ambientLevel));
  const g = l.geo;
  if (g && typeof g === 'object') {
    const geo = {};
    if (Number.isFinite(g.timeOfDay)) geo.timeOfDay = Math.min(24, Math.max(0, g.timeOfDay));
    if (Number.isFinite(g.dayOfYear)) geo.dayOfYear = Math.min(365, Math.max(1, g.dayOfYear));
    if (Number.isFinite(g.latitudeDeg)) geo.latitudeDeg = Math.min(90, Math.max(-90, g.latitudeDeg));
    if (Number.isFinite(g.longitudeDeg)) geo.longitudeDeg = Math.min(180, Math.max(-180, g.longitudeDeg));
    if (Number.isFinite(g.altitudeM)) geo.altitudeM = Math.min(4000, Math.max(0, g.altitudeM));
    if (Number.isFinite(g.northOffsetDeg)) geo.northOffsetDeg = ((g.northOffsetDeg % 360) + 360) % 360 > 180 ? ((g.northOffsetDeg % 360) + 360) % 360 - 360 : ((g.northOffsetDeg % 360) + 360) % 360;
    if (Object.keys(geo).length) n.geo = geo;
  }
  return { ...t, light: n };
}

function normSpotlight(t) { // m6r/nGt
  const objects = {};
  for (const [id, obj] of Object.entries(t.objects ?? {})) {
    if (!obj.spotlight || typeof obj.spotlight !== 'object') { objects[id] = obj; continue; }
    const s = obj.spotlight;
    const shape = s.shape === 'square' ? 'square' : s.shape === 'round' ? 'round' : null;
    const intensity = Number.isFinite(s.intensity) ? Math.min(100, Math.max(0, s.intensity)) : null;
    const diffusion = Number.isFinite(s.diffusion) ? Math.min(100, Math.max(0, s.diffusion)) : null;
    if (!shape || intensity === null || diffusion === null) {
      const o = { ...obj }; delete o.spotlight; objects[id] = o; continue;
    }
    objects[id] = { ...obj, spotlight: { shape, intensity, diffusion } };
  }
  return { ...t, objects };
}

export function normalizeScene(t, propCatalog = {}) {
  return normSpotlight(normLight(normItems(normSpeeds(normLegacyRail(t)))));
}

export function loadScene(input, propCatalog = {}) {
  // accepts raw scene or {row, scene} wrapper
  let t = input && typeof input === 'object' ? input : null;
  if (t && t.scene && t.scene.v !== undefined) t = t.scene;
  if (!t || typeof t !== 'object') return null;
  try {
    if (t.v === 11) return normalizeScene(v11to12(deepCopy(t)), propCatalog);   // bump in-memory v too (review P3-8)
    if (t.v === 12) return normalizeScene(v12to13(deepCopy(t)), propCatalog);   // r20 L3: the light-track bump
    if (t.v === 13) return normalizeScene(deepCopy(t), propCatalog);
    let n = deepCopy(t);
    if (n.v === 1) { if (!n.performances) return null; n = v1to2(n); }
    if (n.v === 2) n = { ...n, v: 3, show: v2to3(n.show) };
    if (n.v === 3) n = { ...n, v: 4 };
    if (n.v === 4) n = v4to5(n);
    if (n.v === 5) n = v5to6(n, propCatalog);
    if (n.v === 6) n = { ...n, v: 7 };
    if (n.v === 7) n = v7to8(n);
    if (n.v === 8) n = { ...n, v: 9 };
    if (n.v === 9) n = { ...n, v: 10 };
    if (n.v === 10) n = v10to11(n);
    if (n.v === 11) n = v11to12(n);
    if (n.v === 12) n = v12to13(n);
    return n.v === 13 ? normalizeScene(n, propCatalog) : null;
  } catch (e) {
    console.error('Stage: scene migration failed, refusing the row', e);
    return null;
  }
}

function deepCopy(t) { return JSON.parse(JSON.stringify(t)); }

// round 6 (D): v10→v11 — light gains mode/geo/weather/indoor/ambient. Existing az/el are
// PRESERVED via mode:'custom' (audit P0-3: geographic would re-light every existing scene).
function v10to11(n) {
  n = { ...n, v: 11 };
  if (n.light && typeof n.light === 'object') {
    n.light = { ...n.light, mode: n.light.mode === 'geographic' ? 'geographic' : 'custom' };
    if (!n.light.weather || !C.WEATHER[n.light.weather]) n.light = { ...n.light, weather: 'clear' };
    if (typeof n.light.indoor !== 'boolean') n.light = { ...n.light, indoor: false };
    if (!Number.isFinite(n.light.ambientLevel)) n.light = { ...n.light, ambientLevel: 0.35 };
    if (!n.light.geo) n.light = { ...n.light, geo: { ...C.LIGHT_GEO_DEFAULTS } };
    else n.light = { ...n.light, geo: { ...C.LIGHT_GEO_DEFAULTS, ...n.light.geo } };
  }
  return n;
}

// round 10 (skybox P1): v11→v12 — light may carry skyStyle (normalizeLight defaults 'classic').
function v11to12(n) {
  return { ...n, v: 12 };
}

// round 20 (L3): v12→v13 — light-transform track items (the Daylight lane). No data
// migration: the new kind is additive (normItems validates it; older loaders that lack
// the kind simply never see one). Scenes without the track re-light exactly as before.
function v12to13(n) {
  return { ...n, v: 13 };
}

// ---- save: strip undefined + pack items (lje sequential bumping) ----
export function saveScene(scene) {
  const out = JSON.parse(JSON.stringify(scene, (k, v) => v === undefined ? undefined : v));
  for (const tr of out.show?.tracks ?? []) tr.items = packItems(tr.items);
  return out;
}
export function packItems(items) { // lje: sort by startS, bump overlaps
  let cursor = 0;
  return [...items].sort((a, b) => a.startS - b.startS).map(it => {
    const s = Math.max(it.startS, cursor);
    cursor = s + itemDuration(it);
    return s === it.startS ? it : { ...it, startS: s };
  });
}

export function emptyScene() {
  return { v: SCHEMA_V, objects: {}, show: { name: 'Show', tracks: [] }, recordAspect: '16:9' };
}
