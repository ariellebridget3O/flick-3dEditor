// tracks.js — show layout + item evaluation engine.
// Ports: rx/yd/Fp/_he/lje (layout), eEe/tyr/ztt (character), fFr/dZt/KCe (camera),
// Bzt/cZt/Vzt/T2r (keys), xM/Wzt/zzt (gaze/turn) — analysis/TRACK_SYSTEM.md §4/§7/§8.
import * as THREE from 'three';
import { C, CLIPS, CAM_MOVE_PRESETS, smoothstep } from './const.js';
import { polylineOf, arcLength, pointAtDistance, tangentAtDistance, pacedDistance, heightAt } from './curves.js';
import { itemDuration, wrapPi } from './schema.js';

const CAMERA_ITEM_KINDS = new Set(['cam-still', 'cam-move', 'cam-path', 'cam-follow', 'cam-transform', 'cam-manual', 'cam-rail']);
const isCameraItem = it => CAMERA_ITEM_KINDS.has(it.kind);            // Fp (V2r)
const isPersonKind = k => k === 'humanoid' || k === 'simple_figure'; // el()
export { isPersonKind };
const isNonCameraKind = k => k !== 'camera';                          // Q0 inverse — Q0 = non-camera kinds
const clipDur = id => CLIPS[id] ?? 1;                                 // IDe

// ---------- layout (rx) ----------
export function showLayout(show) {
  const tracks = (show?.tracks ?? []).map(tr => ({
    trackId: tr.id,
    characterId: tr.characterId,
    startS: tr.items[0]?.startS ?? 0,
    items: tr.items.map(it => ({ item: it, startS: it.startS, endS: it.startS + itemDuration(it) })),
  }));
  let durationS = 0;
  for (const tr of tracks) for (const u of tr.items) durationS = Math.max(durationS, u.endS);
  return { tracks, durationS };
}

export function itemAtTime(items, timeS) { // _he — containing/last-started camera item
  let n = null;
  for (const it of items) {
    if (timeS < it.startS) break;
    if (isCameraItem(it)) n = it;
    if (timeS < it.startS + itemDuration(it)) break;
  }
  return n;
}

export function itemsOfTrack(show, characterId) { // U6
  return show?.tracks?.find(t => t.characterId === characterId)?.items ?? [];
}

// ---------- character track eval (eEe/tyr/ztt) ----------
const motionSource = it => it.kind === 'path' ? it.anchors.length >= 2
  : it.kind === 'play' ? it.samples.length > 0 : false;               // Vtt
const v3add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const v3sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

function pathLookAt(item, u, timeS) { // $tt
  return item.aim !== 'subject' || !item.subjectId ? null
    : { subjectId: item.subjectId, sinceS: u.startS, atS: Math.min(timeS, u.endS) };
}

export function evalCharacterTrack(track, timeS) { // eEe
  const first = track.items.find(u => motionSource(u.item));
  let position = null, tangent = null, yawRad = null, exactY = false, lookAt = null;
  if (first) {
    if (first.item.kind === 'path') position = [...first.item.anchors[0].pos];
    else { const s = first.item.samples[0]; position = [...s.p]; yawRad = s.yaw; exactY = true; }
  }
  let prevEnd = null;
  for (const u of track.items) {
    const h = u.item;
    if (!motionSource(h)) continue;
    const off = h.kind === 'play' && prevEnd ? v3sub(prevEnd, h.samples[0].p) : [0, 0, 0];
    if (timeS >= u.endS) {                                            // finished → carry end state
      if (h.kind === 'path') {
        const pts = polylineOf(h.anchors);
        position = [...h.anchors[h.anchors.length - 1].pos];
        tangent = tangentAtDistance(pts, arcLength(pts));
        yawRad = null; exactY = false;
        lookAt = pathLookAt(h, u, timeS);
      } else {
        const s = h.samples[h.samples.length - 1];
        position = v3add(s.p, off); yawRad = s.yaw; exactY = true; lookAt = null;
      }
      prevEnd = position; continue;
    }
    if (timeS >= u.startS && u.endS > u.startS) {                     // active
      if (h.kind === 'path') {
        const pts = polylineOf(h.anchors);
        const { distance, held } = pacedDistance(h, pts, timeS - u.startS);
        return {
          characterId: track.characterId,
          clip: held ? 'idle' : (h.gait ?? 'walk'),
          clipTimeS: held ? 0 : timeS - u.startS,
          position: pointAtDistance(pts, distance),
          tangent: tangentAtDistance(pts, distance),
          walking: !held, yawRad: null, exactY: false,
          lookAt: pathLookAt(h, u, timeS),
        };
      }
      if (h.kind === 'play') {
        const i = Math.min(h.samples.length - 1, Math.floor((timeS - u.startS) * C.SAMPLE_HZ));
        const s = h.samples[i];
        return {
          characterId: track.characterId,
          clip: s.clip,
          clipTimeS: timeS - u.startS,
          position: v3add(s.p, off),
          tangent: null, walking: false,
          yawRad: s.yaw, exactY: true, lookAt: null,
        };
      }
    }
    break;                                                            // gap before this item
  }
  const clipU = track.items.find(u => u.item.kind === 'clip'
    && timeS >= u.startS && timeS < u.endS && u.endS > u.startS);
  return {
    characterId: track.characterId,
    clip: clipU ? clipU.item.clip : 'idle',
    clipTimeS: clipU ? timeS - clipU.startS : 0,
    position, tangent, walking: false, yawRad, exactY, lookAt,
  };
}

export function yawOf(state) { // ztt
  if (state.yawRad !== null && state.yawRad !== undefined) return { yawRad: state.yawRad, exact: true };
  if (state.tangent) return { yawRad: Math.atan2(-state.tangent[0], -state.tangent[2]), exact: false };
  return null;
}

// ---------- gaze solver (xM): head ≤±70°/±35°, body takes remainder ----------
export function gazeSplit(bodyYawRad, ownAim, target) {
  const dx = target[0] - ownAim[0], dy = target[1] - ownAim[1], dz = target[2] - ownAim[2];
  const flat = Math.hypot(dx, dz);
  // GUARD 1 (HM @5482972): target (nearly) straight above/below → return the input pose
  // unchanged — no yaw-to-0, no pitch
  if (flat < 1e-6) return { bodyYawRad: bodyYawRad, headYawRad: 0, headPitchRad: 0 };
  const pitch = Math.atan2(dy, flat);
  const yaw = Math.atan2(-dx, -dz);
  const dYaw = wrapPi(yaw - bodyYawRad);
  // GUARD 2: the π−|Δ| term — for |Δ| > 110° the head takes π−|Δ| (< 70°) and the body
  // the rest; total gaze identical, head pose different (behind-target look: less head,
  // more body). Ours previously clamped at ±70° only → over-yawed the head there.
  const headYaw = Math.sign(dYaw) * Math.min(Math.abs(dYaw), C.HEAD_YAW_LIMIT, Math.PI - Math.abs(dYaw));
  const bodyYaw = wrapPi(bodyYawRad + dYaw - headYaw);
  const headPitch = Math.max(-C.HEAD_PITCH_LIMIT, Math.min(C.HEAD_PITCH_LIMIT, pitch));
  return { bodyYawRad: bodyYaw, headYawRad: headYaw, headPitchRad: headPitch };
}

// ---------- turn-rate approach (Wzt) ----------
export function approachAngle(from, to, maxStep) {
  const d = wrapPi(to - from);
  if (Math.abs(d) <= maxStep) return wrapPi(to);
  return wrapPi(from + Math.sign(d) * maxStep);
}
// step-up clamp (zzt)
export const stepClamp = (y, g) => (g - y > C.STEP_CLAMP ? y : g);

// ---------- keys eval (Bzt/cZt/Vzt/T2r) ----------
const lerp3 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];

// ---------- keyed headRotation resolver (Kae family: xie/Xyr/Yyr @3933882/@3933491/@3934122) ----------
// _2r (Yyr): the latest-starting transform item at/before t whose keys carry headRotation
function headKeyedItemAt(items, tS) {
  let n = null;
  for (const it of items) {
    if (it.kind !== 'transform' || !(it.keys ?? []).some(k => k.headRotation) || it.startS > tS) continue;
    if (!n || it.startS >= n.startS) n = it;
  }
  return n;
}
// w2r (Xyr): lerped headRotation over the keys — keys WITHOUT headRotation BEFORE the
// first headRotation key inherit prevValue (smooth transition in); after it they drop
function headKeysLerp(keys, tS, prevValue) {
  const first = keys.findIndex(k => k.headRotation);
  if (first < 0) return prevValue;
  const s = keys.flatMap((k, i) => k.headRotation ? [k] : i < first ? [{ ...k, headRotation: prevValue }] : []);
  const a = s[0];
  if (tS <= a.tS || s.length === 1) return a.headRotation;
  const o = s[s.length - 1];
  if (tS >= o.tS) return o.headRotation;
  const l = Math.max(1, s.findIndex(k => k.tS >= tS));
  const c = s[l - 1], d = s[l], u = d.tS - c.tS;
  return lerp3(c.headRotation, d.headRotation, u <= 0 ? 0 : (tS - c.tS) / u);
}
// Kae (xie): keyed headRotation with the live-look precedence — the subject look
// (liveAt(t) → {sinceS, headRotation} | null) wins ONLY when it started at/after the
// keyed item's startS; the previous value at the item start resolves RECURSIVELY
export function keyedHeadRotation(items, timeS, fallback, liveAt) {
  const s = headKeyedItemAt(items, timeS);
  const live = liveAt?.(timeS);
  if (live && (!s || live.sinceS >= s.startS)) return live.headRotation;
  if (!s) return fallback ?? [0, 0, 0];
  const t = Math.min(timeS - s.startS, s.durationS);
  const prev = keyedHeadRotation(items.filter(it => it.startS < s.startS), s.startS, fallback, liveAt);
  return headKeysLerp(s.keys ?? [], t, prev);
}

export function transformKeysAt(keys, tS) { // Bzt — plain lerp
  if (!keys || keys.length === 0) return null;
  const first = keys[0];
  if (tS <= first.tS || keys.length === 1) return { position: first.position, rotation: first.rotation, scale: first.scale, headRotation: first.headRotation };
  const last = keys[keys.length - 1];
  if (tS >= last.tS) return { position: last.position, rotation: last.rotation, scale: last.scale, headRotation: last.headRotation };
  let i = keys.findIndex(k => k.tS >= tS); if (i <= 0) i = 1;
  const a = keys[i - 1], b = keys[i];
  const f = (b.tS - a.tS) <= 0 ? 0 : (tS - a.tS) / (b.tS - a.tS);
  return { position: lerp3(a.position, b.position, f), rotation: lerp3(a.rotation, b.rotation, f), scale: lerp3(a.scale, b.scale, f), headRotation: a.headRotation };
}

const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _eu = new THREE.Euler();
export function camTransformKeysAt(keys, tS) { // cZt — slerp + focal lerp
  if (!keys || keys.length === 0) return null;
  const first = keys[0];
  if (tS <= first.tS || keys.length === 1) return first;
  const last = keys[keys.length - 1];
  if (tS >= last.tS) return last;
  let i = keys.findIndex(k => k.tS >= tS); if (i <= 0) i = 1;
  const a = keys[i - 1], b = keys[i];
  const f = (b.tS - a.tS) <= 0 ? 0 : (tS - a.tS) / (b.tS - a.tS);
  _qa.setFromEuler(_eu.set(a.rotation[0], a.rotation[1], a.rotation[2]));
  _qb.setFromEuler(_eu.set(b.rotation[0], b.rotation[1], b.rotation[2]));
  _qa.slerp(_qb, f);
  const e = new THREE.Euler().setFromQuaternion(_qa);
  return { position: lerp3(a.position, b.position, f), rotation: [e.x, e.y, e.z], focalLengthMm: a.focalLengthMm + (b.focalLengthMm - a.focalLengthMm) * f };
}

const JOINT_DEFAULT = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }; // QCe
const angLerp = (a, b, f) => a + wrapPi(b - a) * f; // bbe
export function rigKeysAt(keys, tS) { // Vzt
  if (!keys || keys.length === 0) return null;
  const first = keys[0];
  if (tS <= first.tS || keys.length === 1) return first.joints;
  const last = keys[keys.length - 1];
  if (tS >= last.tS) return last.joints;
  let i = keys.findIndex(k => k.tS >= tS); if (i <= 0) i = 1;
  const a = keys[i - 1], b = keys[i];
  const f = (b.tS - a.tS) <= 0 ? 0 : (tS - a.tS) / (b.tS - a.tS);
  const joints = {};
  for (const name of new Set([...Object.keys(a.joints ?? {}), ...Object.keys(b.joints ?? {})])) {
    const ja = a.joints?.[name] ?? JOINT_DEFAULT, jb = b.joints?.[name] ?? JOINT_DEFAULT;
    joints[name] = {
      position: lerp3(ja.position, jb.position, f),
      rotation: [angLerp(ja.rotation[0], jb.rotation[0], f), angLerp(ja.rotation[1], jb.rotation[1], f), angLerp(ja.rotation[2], jb.rotation[2], f)],
      scale: lerp3(ja.scale, jb.scale, f),
    };
  }
  return joints;
}
export function rigJointsAtTime(items, timeS) { // T2r — latest rig-transform wins, persists after end
  let joints = null;
  for (const it of items) {
    if (timeS < it.startS) break;
    if (it.kind === 'rig-transform') {
      const t = Math.min(timeS - it.startS, it.durationS);
      joints = rigKeysAt(it.keys, t) ?? joints;
    }
  }
  return joints;
}

// ---------- r20 L3: light-transform keys (the Daylight lane) ----------
// lightAtTime — the MKt analogue, PURE (oracle-testable): first-key hold before, last-key
// hold after, per-field lerp with SHORTEST-ARC azimuth (wrapPi on the degree delta),
// nightLights STEPS AT THE LATER KEY's OWN TIME (r20 review P2-1: a key's nightLights
// takes effect when the playhead REACHES it — never retroactively across the interval;
// a key that omits it doesn't control it — the caller's base value shows through). null
// only for an empty key list (the segment is an inert shell; effLight falls back to the
// scene light).
export function lightAtTime(keys, tS) {
  if (!keys || keys.length === 0) return null;
  const held = k => ({ azimuthDeg: k.azimuthDeg, elevationDeg: k.elevationDeg, ...(k.nightLights !== undefined ? { nightLights: k.nightLights } : {}) });
  const first = keys[0];
  if (keys.length === 1 || tS <= first.tS) return held(first);
  const last = keys[keys.length - 1];
  if (tS >= last.tS) return held(last);
  let i = keys.findIndex(k => k.tS >= tS); if (i <= 0) i = 1;
  const a = keys[i - 1], b = keys[i];
  const f = (b.tS - a.tS) <= 0 ? 0 : (tS - a.tS) / (b.tS - a.tS);
  const azDelta = wrapPi((b.azimuthDeg - a.azimuthDeg) * Math.PI / 180) * 180 / Math.PI;   // shortest arc
  return {
    azimuthDeg: ((a.azimuthDeg + azDelta * f) % 360 + 360) % 360,
    elevationDeg: a.elevationDeg + (b.elevationDeg - a.elevationDeg) * f,
    // P2-1: the step happens at b's own tS (strict <) — mid-interval the PREVIOUS key's
    // value (or the base, when a omits it) holds, exactly like a step function
    ...(tS < b.tS && a.nightLights !== undefined ? { nightLights: a.nightLights } : {}),
    ...(tS >= b.tS && b.nightLights !== undefined ? { nightLights: b.nightLights } : {}),
  };
}

// lightKeysAt — the layout lookup for the 'sun' track: the light-transform item covering
// / last-started at timeS (the itemAtTime semantics — persists after the item's end, which
// IS the last-key hold). Null when the track/item/keys don't exist (before the first item
// or an empty shell) — effLight then applies the scene light.
export function lightKeysAt(layout, timeS) {
  const tr = (layout?.tracks ?? []).find(t => t.characterId === 'sun');
  if (!tr) return null;
  let n = null;
  for (const u of tr.items) {
    if (timeS < u.startS) break;
    if (u.item.kind === 'light-transform') n = u;
    if (timeS < u.endS) break;
  }
  return n && (n.item.keys?.length ?? 0) > 0 ? { keys: n.item.keys, startS: n.startS } : null;
}

// ---------- fov (Z_) ----------
export const sensorV = aspect => C.SENSOR_W / Math.max(aspect, 1); // XCe
export const fovFromFocal = (focalLengthMm, aspect = 16 / 9) =>
  2 * Math.atan(sensorV(aspect) / 2 / focalLengthMm) * 180 / Math.PI;

// ---------- subject aim points (XN/NP) ----------
export function subjectAimPoint(obj, worldBox, extraOffset = 0, k = C.SUBJECT_AIM_K) {
  // NP: [centre.x, minY + k*height + extra, centre.z]
  const cx = (worldBox.min.x + worldBox.max.x) / 2, cz = (worldBox.min.z + worldBox.max.z) / 2;
  return [cx, worldBox.min.y + k * (worldBox.max.y - worldBox.min.y) + extraOffset, cz];
}

// V2r/Fp: camera item kinds; YN: item that needs the camera's target object
export const CAM_ITEM_KINDS = new Set(['cam-still', 'cam-move', 'cam-path', 'cam-follow', 'cam-transform', 'cam-manual']);
export function subjectlessItem(it) { // YN
  return (it.kind === 'cam-move' && it.move !== 'pan_sweep' && it.subjectId === null)
    || (it.kind === 'cam-path' && it.aim === 'subject' && it.subjectId === null);
}

// ---------- cam-move math (KCe) ----------
export function camMovePose({ kind, t, start, target, direction, baseFovDeg, angleDeg, heightDeltaUnits, distanceScale }) {
  const p = CAM_MOVE_PRESETS[kind];
  const ang = (angleDeg ?? p.angleDeg) * Math.PI / 180 * (direction === 'ccw' ? 1 : -1);
  const dh = heightDeltaUnits ?? p.heightDeltaUnits;
  const ds = distanceScale ?? p.distanceScale;
  const a = smoothstep(t);
  const [ox, oy, oz] = start, [tx, ty, tz] = target;
  switch (kind) {
    case 'crane_up': case 'crane_down': {
      const dy = (kind === 'crane_up' ? 1 : -1) * dh * a;
      return { position: [ox, oy + dy, oz], lookAt: target, fovDeg: baseFovDeg };
    }
    case 'dolly_in': case 'dolly_out': case 'dolly_zoom': {
      const fx = ox - tx, fy = oy - ty, fz = oz - tz, dist = Math.hypot(fx, fy, fz);
      if (dist === 0) return { position: start, lookAt: target, fovDeg: baseFovDeg };
      const nd = dist * (1 + (ds - 1) * a);
      const k = nd / dist;
      const pos = [tx + fx * k, ty + fy * k, tz + fz * k];
      if (kind !== 'dolly_zoom') return { position: pos, lookAt: target, fovDeg: baseFovDeg };
      const half = baseFovDeg / 2 * Math.PI / 180;
      const newHalf = Math.atan(dist * Math.tan(half) / nd);
      return { position: pos, lookAt: target, fovDeg: Math.min(120, Math.max(10, 2 * newHalf * 180 / Math.PI)) };
    }
    case 'orbit': case 'spiral': {
      const r = Math.hypot(ox - tx, oz - tz);
      const ang2 = Math.atan2(oz - tz, ox - tx) + ang * a;
      const y = oy + (kind === 'spiral' ? dh * a : 0);
      return { position: [tx + Math.cos(ang2) * r, y, tz + Math.sin(ang2) * r], lookAt: target, fovDeg: baseFovDeg };
    }
    case 'pan_sweep': {
      // exact KCe: f = TARGET − START; lookAt = START + (f·cos + g·sin, m, −f·sin + g·cos)
      const fx = tx - ox, fy = ty - oy, fz = tz - oz;
      if (fx === 0 && fz === 0) return { position: start, lookAt: target, fovDeg: baseFovDeg };
      const b = ang * a, c = Math.cos(b), s = Math.sin(b);
      return { position: start, lookAt: [ox + fx * c + fz * s, oy + fy, oz - fx * s + fz * c], fovDeg: baseFovDeg };
    }
  }
  return { position: start, lookAt: target, fovDeg: baseFovDeg };
}

// ---------- camera item dispatcher (fFr) + object eval (dZt) ----------
const _m = new THREE.Matrix4(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _qi = new THREE.Quaternion();
const lookQuat = (q, eye, target) => q.setFromRotationMatrix(_m.lookAt(
  new THREE.Vector3(...eye), new THREE.Vector3(...target), new THREE.Vector3(0, 1, 0)));
const FOLLOW_BLEND = 0.45;   // hFr
const TRAVEL_LOOKAHEAD = 5;  // rye

export function evalCameraItem(item, elapsedS, durationS, ctx) { // fFr
  const out = ctx.out;
  const absT = item.startS + elapsedS;
  const p = durationS > 0 ? Math.min(1, elapsedS / durationS) : 1;
  const focal = item.focalLengthMm !== undefined ? item.focalLengthMm : ctx.base.focalLengthMm;
  const fovDeg = fovFromFocal(focal, ctx.aspect);
  const aimOffset = item.aimOffsetUnits || 0;
  switch (item.kind) {
    case 'cam-still': {
      out.fovDeg = fovDeg;
      const subj = item.subjectId ? ctx.resolvers.aim(item.subjectId, absT, aimOffset) : null;
      if (subj) lookQuat(out.quaternion, [out.position.x, out.position.y, out.position.z], subj);
      return;
    }
    case 'cam-move': {
      const startPos = [out.position.x, out.position.y, out.position.z];
      const target = item.move === 'pan_sweep'
        ? (() => { // 1 m ahead of current forward
          const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(out.quaternion);
          return [startPos[0] + fwd.x, startPos[1] + fwd.y, startPos[2] + fwd.z];
        })()
        : ctx.resolvers.aim(item.subjectId || null, absT, aimOffset, ctx.cameraId);   // subject-less → camera's targetId
      if (!target) { out.fovDeg = fovDeg; return; }
      const h = {
        kind: item.move, start: startPos, target, direction: item.direction, baseFovDeg: fovDeg,
        angleDeg: item.angleDeg, heightDeltaUnits: item.heightDeltaUnits, distanceScale: item.distanceScale,
      };
      const end = camMovePose({ ...h, t: p });
      out.position.set(...end.position);
      const startState = p > 0 ? camMovePose({ ...h, t: 0 }) : end;
      lookQuat(_q1, startState.position, startState.lookAt);           // qStart
      _q2.copy(_q1).invert().multiply(out.quaternion);                  // correction = qStart⁻¹ · qPrev
      _q2.slerp(_qi.identity(), smoothstep(p));                         // fade to identity
      lookQuat(_q1, end.position, end.lookAt);                          // qEnd
      out.quaternion.copy(_q1).multiply(_q2);                           // q = qEnd · correction
      out.fovDeg = end.fovDeg;
      return;
    }
    case 'cam-path': {
      out.fovDeg = fovDeg;
      if (item.anchors.length < 2) return;
      const pts = polylineOf(item.anchors);
      const { distance } = pacedDistance(item, pts, elapsedS);
      const pos = pointAtDistance(pts, distance);
      if (item.heightCurve) pos[1] = heightAt(item.heightCurve, durationS > 0 ? elapsedS / durationS : 1);
      out.position.set(pos[0], pos[1], pos[2]);
      if (item.aim === 'subject') {
        const subj = ctx.resolvers.aim(item.subjectId, absT, aimOffset);
        if (subj) lookQuat(out.quaternion, pos, subj);
      } else if (item.aim === 'travel') {
        const tan = tangentAtDistance(pts, distance);
        lookQuat(out.quaternion, pos, [pos[0] + tan[0] * TRAVEL_LOOKAHEAD, pos[1] + tan[1] * TRAVEL_LOOKAHEAD + aimOffset, pos[2] + tan[2] * TRAVEL_LOOKAHEAD]);
      } // "locked": keep previous orientation
      return;
    }
    case 'cam-follow': {
      const subj = item.objectId ? ctx.resolvers.follow(item.objectId, absT) : null;
      if (subj) {
        const defOff = item.offset ? null : ctx.resolvers.followOffset(item, out);
        const off = item.offset ?? defOff;
        if (off) {
          const blend = defOff ? smoothstep(Math.min(elapsedS / Math.min(FOLLOW_BLEND, durationS), 1)) : 1;
          const prevPos = out.position.clone(), prevQuat = out.quaternion.clone();
          out.position.set(...off.position).applyQuaternion(subj.quaternion).add(subj.position);
          out.quaternion.multiplyQuaternions(subj.quaternion, new THREE.Quaternion(...off.quaternion));
          if (blend < 1) {
            out.position.lerpVectors(prevPos, out.position, blend);
            out.quaternion.copy(prevQuat).slerp(out.quaternion, blend);
          }
        }
      }
      out.fovDeg = fovDeg;
      return;
    }
    case 'cam-transform': {
      const k = camTransformKeysAt(item.keys, elapsedS);
      if (!k) { out.fovDeg = fovDeg; return; }
      out.position.set(...k.position);
      out.quaternion.setFromEuler(new THREE.Euler(...k.rotation));
      out.fovDeg = fovFromFocal(k.focalLengthMm, ctx.aspect);
      return;
    }
    case 'cam-manual': {
      if (item.samples.length === 0) { out.fovDeg = fovDeg; return; }
      const i = Math.min(item.samples.length - 1, Math.floor(elapsedS * C.SAMPLE_HZ));
      const s = item.samples[i];
      out.position.set(...s.p); out.quaternion.set(...s.q); out.fovDeg = s.fovDeg;
      return;
    }
  }
}

export function evalCameraObject({ base, out, items, timeS, aspect, resolvers, cameraId }) { // dZt
  out.position.set(...base.position);
  out.quaternion.setFromEuler(new THREE.Euler(...base.rotation));
  out.fovDeg = fovFromFocal(base.focalLengthMm, aspect);
  let any = false;
  for (const item of items) {
    if (!isCameraItem(item)) continue;
    if (timeS < item.startS) break;
    any = true;
    const dur = itemDuration(item);
    evalCameraItem(item, Math.min(timeS - item.startS, dur), dur, { base, out, timeS, aspect, resolvers, items, cameraId });
    if (timeS < item.startS + dur) break;
  }
  return any;
}

// ---------- object item application (Q) for non-camera, non-rig kinds ----------
// Accepts a LAYOUT track (items = {item, startS, endS}) like evalCharacterTrack.
const AXES = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const FOLD_KINDS = new Set(['rotate', 'revolve', 'scale', 'transform']);   // aN ($2r; rig-transform handled separately)

// ybe: wrap t to within ±π of e; GA: euler flip-unwrap vs base (rotation continuity at write time)
const wrapNear = (t, e) => t - Math.round((t - e) / (2 * Math.PI)) * 2 * Math.PI;
export function unwrapEulerVs(euler, base) { // GA
  const candidates = [euler, [euler[0] + Math.PI, Math.PI - euler[1], euler[2] + Math.PI]];
  let best = base, bestCost = Infinity;
  for (const c of candidates) {
    const o = [wrapNear(c[0], base[0]), wrapNear(c[1], base[1]), wrapNear(c[2], base[2])];
    const cost = Math.abs(o[0] - base[0]) + Math.abs(o[1] - base[1]) + Math.abs(o[2] - base[2]);
    if (cost < bestCost) { bestCost = cost; best = o; }
  }
  return best;
}

// q2r — generic path eval (position + yaw/pitch by aim mode) for ne()/cam-path
export function pathStateAt(item, elapsedS, subjectPos) {
  const pts = polylineOf(item.anchors);
  const { distance } = pacedDistance(item, pts, elapsedS);
  const pos = pointAtDistance(pts, distance);
  const aim = item.aim ?? 'travel';
  if (aim === 'locked') return { position: pos, yawRad: null, pitchRad: null };
  if (aim === 'travel') {
    const t = tangentAtDistance(pts, distance);
    return { position: pos, yawRad: Math.atan2(-t[0], -t[2]), pitchRad: null };
  }
  if (!subjectPos) return { position: pos, yawRad: null, pitchRad: null };
  const dx = subjectPos[0] - pos[0], dz = subjectPos[2] - pos[2];
  return {
    position: pos,
    yawRad: Math.atan2(-dx, -dz),
    pitchRad: Math.atan2(subjectPos[1] - pos[1], Math.hypot(dx, dz)),
  };
}
// Z2r — path rotation euler: [pitch (or preserved x), yaw−parentYaw, 0]
export function pathRotation(pathState, parentYaw, preservedEuler) {
  if (pathState.yawRad === null) return null;
  const yaw = pathState.yawRad - parentYaw;
  if (preservedEuler) {
    return pathState.pitchRad !== null
      ? [pathState.pitchRad, yaw, 0]
      : [preservedEuler[0], yaw, preservedEuler[2]];
  }
  return [0, yaw, 0];
}

export function evalObjectItems(track, timeS, foldMode, resolvers, base) { // Q + L seeding + ne path apply
  // base = the OBJECT record's TRS (position/rotation/scale arrays). The original seeds the
  // accumulators from it in L() before folding — without this, rotate/revolve/scale/transform
  // items teleport objects to the origin. ne() folds paths (parent-local + yaw).
  const T = new THREE.Vector3(...(base?.position ?? [0, 0, 0]));
  const E = new THREE.Euler(...(base?.rotation ?? [0, 0, 0]));
  const A = new THREE.Quaternion().setFromEuler(E);
  const S = new THREE.Vector3(...(base?.scale ?? [1, 1, 1]));
  let mode = 'base';
  const q = new THREE.Quaternion();
  for (const u of track.items) {
    const it = u.item;
    const endS = u.endS ?? (it.startS + itemDuration(it));
    if (it.kind === 'play' && !foldMode) {
      if (it.samples.length === 0) continue;
      if (timeS < u.startS) break;
      mode = 'walk';
      if (timeS < endS) break;
      continue;
    }
    if (it.kind === 'path') {
      if (it.anchors.length < 2) continue;
      if (timeS < u.startS) break;
      mode = foldMode ? 'fold' : 'walk';
      // ne(): fold the path into the accumulators (parent-local + yaw); for persons the
      // character apply (ue) supersedes the mesh write, but T/A stay seeded for later items.
      if (resolvers?.pathApply) {
        resolvers.pathApply(it, Math.min(timeS - u.startS, endS - u.startS), Math.min(timeS, endS), track.characterId, { T, E, A });
      }
      if (timeS < endS) break;
      continue;
    }
    if (!FOLD_KINDS.has(it.kind)) continue;   // aN gate: clip / cam-* / rig-transform skip (no fold mode)
    if (timeS < u.startS) break;
    mode = 'fold';
    const t = Math.min(timeS - u.startS, it.durationS);
    if (it.kind === 'rotate') {
      q.setFromAxisAngle(AXES[it.axis] ?? AXES.y, it.degPerS * t * Math.PI / 180);
      A.multiply(q);
    } else if (it.kind === 'scale') {
      S.multiplyScalar(1 + (it.factor - 1) * smoothstep(it.durationS > 0 ? t / it.durationS : 1));
    } else if (it.kind === 'revolve') {
      // z(): P = store TRS of the center object (parent-composed) or WORLD ORIGIN;
      // N = the center's LIVE mesh world pos. Offset from T−P rotated by x2r, applied at N.
      const c = resolvers?.revolveCenter?.(it.centerObjectId);
      if (c) {
        const ang = it.degPerS * t * Math.PI / 180;
        const dx = T.x - c.P.x, dy = T.y - c.P.y, dz = T.z - c.P.z;
        const cos = Math.cos(ang), sin = Math.sin(ang);
        T.set(c.N.x + dx * cos + dz * sin, c.N.y + dy, c.N.z - dx * sin + dz * cos);
      }
    } else if (it.kind === 'transform') {
      const s = transformKeysAt(it.keys, t);
      if (s) {
        T.set(...s.position); E.set(...s.rotation); A.setFromEuler(E); S.set(...(s.scale ?? [1, 1, 1]));
      }
    }
    if (timeS < endS) break;
  }
  const eu = new THREE.Euler().setFromQuaternion(A);   // j
  // GA: unwrap the folded euler vs the BASE rotation (continuity at write time)
  const unwrapped = unwrapEulerVs([eu.x, eu.y, eu.z], base?.rotation ?? [0, 0, 0]);
  return { mode, position: T, quaternion: A, scale: S, rotation: unwrapped };
}

// ---------- item display names ----------
export const ITEM_LABELS = {
  path: 'Walk', play: 'Play', clip: 'Clip', transform: 'Transform', 'rig-transform': 'Rig Transform',
  rotate: 'Rotate', revolve: 'Revolve', scale: 'Scale', 'light-transform': 'Daylight',
  'cam-still': 'Still', 'cam-move': 'Move', 'cam-path': 'Path', 'cam-follow': 'Follow',
  'cam-transform': 'Transform', 'cam-manual': 'Manual',
};
