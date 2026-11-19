// rigs.js — r17 verbatim port of the camera-rig state family (index-DBE17t4T.js):
//   i$ @5186537 (rig keys), BGt (default), gq @5186601 (rig table — see const.js C.CAMERA_RIGS),
//   HGt/$Gt/VGt (speed/pan steps + default), Grt (default speeds), jie (default weights),
//   Eie/zCr/UCr (weight clamp/deadzone/step), nqt (storage key — origin-prefixed),
//   DCr/UGt/BCr/HCr/qrt/$Cr/VCr (step/carry/validate helpers) @5187489..5188160,
//   HDe/zGt/WCr/WGt/GCr (weight math) @5188464..5188719, hEr (cycle) @5193533,
//   qGt/ZGt/Qrt/Jrt/ECr (display) @5190908..5191365,
//   kIr state subset @5241461 (rig/speedMps/panDegPerS/weights/weight + setters; the phone-link
//   fields are live-only network — excluded). WCr powers the drive's ease scaling (Layer B).
import { C } from './const.js';

// DCr — is a valid rig key
export const isRigKey = t => C.RIG_KEYS.includes(t);

// UGt — tripod test (speedMps 0 → pan-only rig)
export const isPanOnly = t => C.CAMERA_RIGS[t].speedMps === 0;

// BCr — which speed field + step list applies to a rig
export function speedPicker(rig) {   // BCr
  return isPanOnly(rig)
    ? { key: 'panDegPerS', steps: C.RIG_PAN_STEPS }
    : { key: 'speedMps', steps: C.RIG_SPEED_STEPS };
}

// HCr — carry the speeds across a rig switch (pan-only rigs reset pan; movers reset speed)
export function carrySpeeds(rig, speeds) {
  return isPanOnly(rig)
    ? { ...speeds, panDegPerS: C.RIG_PAN_DEFAULT }
    : { ...speeds, speedMps: C.CAMERA_RIGS[rig].speedMps };
}

// $Cr — clamp into a step list's range
export const clampToSteps = (steps, v) => Math.min(Math.max(v, steps[0]), steps[steps.length - 1]);

// qrt — step the active speed field up/down through its steps (wrap only when wrap=true)
export function stepSpeed(rig, speeds, dir, wrap = false) {
  const { key, steps } = speedPicker(rig);
  const cur = speeds[key];
  const next = dir > 0
    ? steps.find(d => d > cur + 1e-6)
    : [...steps].reverse().find(d => d < cur - 1e-6);
  const edge = dir > 0 ? steps[0] : steps[steps.length - 1];
  return { ...speeds, [key]: next ?? (wrap ? edge : cur) };
}

// VCr — validate persisted/remote speeds (finite numbers clamp into the step ranges)
export function validateSpeeds(t, fallback) {
  const pick = (v, steps, fb) => typeof v === 'number' && Number.isFinite(v) ? clampToSteps(steps, v) : fb;
  return {
    speedMps: pick(t.speedMps, C.RIG_SPEED_STEPS, fallback.speedMps),
    panDegPerS: pick(t.panDegPerS, C.RIG_PAN_STEPS, fallback.panDegPerS),
  };
}

// HDe — weight clamp ±log2(3) with the ±.08 deadzone snapped to 0
export function clampWeight(t) {
  const e = Math.min(C.RIG_WEIGHT_MAX, Math.max(-C.RIG_WEIGHT_MAX, t));
  return Math.abs(e) < C.RIG_WEIGHT_DEADZONE ? 0 : e;
}

// zGt — the weight multiplier (ease speeds scale by 2^weight)
export const weightScale = t => Math.pow(2, t);

// WCr — a rig with the weight applied (all ease fields × 2^weight)
export function rigWithWeight(rig, weight) {
  if (!weight) return rig;
  const n = weightScale(weight);
  return {
    ...rig,
    startEaseS: rig.startEaseS * n,
    stopEaseS: rig.stopEaseS * n,
    lookEaseS: rig.lookEaseS * n,
    rollEaseS: rig.rollEaseS * n,
  };
}

// WGt — validate a single weight value
export const validateWeight = t => (typeof t === 'number' && Number.isFinite(t) ? clampWeight(t) : null);

// GCr — validate a persisted weights object (missing/invalid → 0)
export function validateWeights(t) {
  const e = {};
  for (const k of C.RIG_KEYS) e[k] = 0;
  if (typeof t !== 'object' || t === null) return e;
  for (const k of C.RIG_KEYS) e[k] = validateWeight(t[k]) ?? 0;
  return e;
}

// hEr — cycle a rig key by ±n
export function cycleRigKey(t, e) {
  const n = C.RIG_KEYS.length;
  return C.RIG_KEYS[(C.RIG_KEYS.indexOf(t) + e + n) % n];
}

// ---- display (labels are i18n keys in the live — semantic equivalents, SKILL #34) ----
export function rigName(t) {           // qGt — capitalized key
  return t.charAt(0).toUpperCase() + t.slice(1);
}
export function weightMultiplier(t) {  // ZGt — 2^t, 2 decimals under 1
  const e = weightScale(t);
  return e.toFixed(e < 1 ? 2 : 1);
}
export function weightLabel(t) {       // Qrt
  if (!t) return 'Normal';
  const e = weightMultiplier(t);
  return t < 0 ? `${e}× slower` : `${e}× faster`;
}
export function weightButtonLabel(t) { // Jrt
  return t ? `${weightMultiplier(t)}×` : 'Normal';
}
export function speedValueLabel(t) {   // ECr
  return t >= 10 ? t.toFixed(0) : t.toFixed(1);
}

// ============ the rig store (kIr state subset — no phone link) ============
const loadWeights = storage => {       // _Ir
  try {
    const e = storage?.getItem(C.RIG_WEIGHT_STORAGE);
    return e ? validateWeights(JSON.parse(e)) : validateWeights(null);
  } catch { return validateWeights(null); }
};

export class RigStore {
  constructor() {
    this.rig = C.RIG_DEFAULT;                                  // Ne(BGt)
    this.speedMps = C.CAMERA_RIGS[C.RIG_DEFAULT].speedMps;     // Ne(Grt.speedMps)
    this.panDegPerS = C.RIG_PAN_DEFAULT;                       // Ne(Grt.panDegPerS)
    this.weights = loadWeights(typeof localStorage !== 'undefined' ? localStorage : null);
    this.listeners = new Set();
  }
  get weight() { return this.weights[this.rig] ?? 0; }         // Ne(()=>weights[rig])
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { for (const fn of this.listeners) fn(); }
  setSpeeds(e) {                                                // setSpeeds
    this.speedMps = e.speedMps;
    this.panDegPerS = e.panDegPerS;
    this.emit();
  }
  setRig(rig, speeds) {                                         // setRig(e,n)
    this.rig = rig;
    this.setSpeeds(speeds);
  }
  saveWeight(rig, w) {                                          // saveWeight
    if (this.weights[rig] !== w) {
      this.weights = { ...this.weights, [rig]: w };
      try { localStorage?.setItem(C.RIG_WEIGHT_STORAGE, JSON.stringify(this.weights)); } catch { /* ignore */ }
      this.emit();
    }
  }
  setWeight(w) { this.saveWeight(this.rig, clampWeight(w)); }   // setWeight
  peekSpeeds() { return { speedMps: this.speedMps, panDegPerS: this.panDegPerS }; }  // controller.peekSpeeds
}
