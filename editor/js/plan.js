// plan.js — round 7 (R7-1): the 2D top-down plan canvas as an EXACT PORT of the live bundle
// subsystem (function-level, from analysis/tmp_plan_exact/fn_*.js verbatim extractions —
// every function below carries its bundle name in a comment and reproduces the bundle math
// 1:1; validated by the oracle harness scripts/r7_plan_oracle.mjs against the raw bundle fns).
//
// Live architecture (MAP.md §0):
//   page-store planShown gate → rDr (PlanStore: items/paths/intents/stroke) → rBr (PlanCanvas:
//   pure reducers DLr/DZt/HLr → intents → store.apply) → SDr painter (+$Ir/FDr edge + ZIr label).
// This file ports all of it with the same names, same math, same pass order.
//
// Round-6 handroll divergences fixed here (see MAP.md §3 DIFF TABLE): rotate-handle mirror,
// figure footprint 2x, wheel-pan sign, marquee either-dim rule, time-based stroke sampling,
// dwell-aware smoothing + mHr re-spread, figure body/stripe/head/face-arc/tick, ellipse -yaw,
// ellipse hit <=1, rotated square pool, callout ellipse case + lens dots + RDr tick, endStroke
// replace semantics (new id + focal carry + aim rules), selection semantics (unconditional
// parentId??id promotion, keep-selection on member click, deselect at pointerdown), paths paint
// order (between non-char and char passes), resize re-center, 3-state pill + delete + person
// toggle + match-speed-only-while-drawing, stroke timer, zoom bar, Esc chain, drawPreview ghost
// + per-tick seekPerformance (show plays while drawing).
import * as THREE from 'three';
import { C } from './const.js';
import { polylineOf, buildTangents, arcLength, pointAtDistance, heightAt } from './curves.js';   // nx / mT / MR (round-2 exact)
import { camTransformKeysAt } from './tracks.js';                      // cZt (round-2 exact)
import { itemDuration, packItems } from './schema.js';

// ============================================================================
// PART A — consts (verbatim from bundle; names in comments)
// ============================================================================
const Uhe = 34, iqt = 14, oqt = Uhe * 5, Fst = .26, Ost = 4.2, lqt = 12, VIr = 34, cqt = 6,   // consts_planview
  yT = [14, 18, 24, 35, 50, 85, 135, 200];
const HZt = 1, oye = 5, sit = 8, iDr = 24, oDr = [[-9, -1], [9, -1], [9, 11], [-9, 11]],     // consts_painter
  lDr = [[-4, -1], [-6.5, -8], [6.5, -8], [4, -1]], cDr = .32, dDr = 6, uDr = 7, hDr = 12,
  pDr = 6, fDr = 12, mDr = 16, gDr = 8, ait = 6, bDr = .14, yDr = .24, ZY = 12, pL = 8,
  KY = 4.5, vDr = .5, xDr = 2.4, wDr = 14, iit = 11, lye = 18, l$ = 12, Cje = 11;
const RIr = 1.299, sA = 1.75 / RIr, PP = [.406 * sA, 1.059 * sA, .289 * sA], Nie = .125 * sA, // consts_figbody (jP=1.75)
  Pie = 72 * Math.PI / 180, Pst = "#ffffff", BIr = "#1c0f09", HIr = .72;
const WIr = 16, GIr = .72, qIr = 28, $2e = 4;                                                  // consts_labelpos
const Rst = 22, uN = 13;                                                                       // consts_edgeind
const Vie = .25, Yat = Math.PI / 12, Qat = 3, Jat = 4, SLr = 4, TLr = 48, ALr = .8, CLr = 720; // consts_state
const eit = 40, VLr = .05, ULr = 4e3, zLr = .05, WLr = 20, GLr = 12, qLr = 4, ZLr = 50,       // consts_drag
  KLr = .18, XLr = .12, YLr = 1.6, QLr = 1.4, JLr = { minX: -3, minZ: -3, maxX: 3, maxZ: 3 },
  tit = { prop: 0, cube: 0, sphere: 0, cylinder: 0, group: 0, humanoid: 1, simple_figure: 1, target: 2, spotlight: 3, camera: 3 },
  eDr = .4, tDr = 1;
const fHr = .3, mHr = .7, gHr = .25, bHr = .1, yHr = .2, Tit = 1e4;                            // consts_stroke
const Aje = .2, pLr = .005, fLr = .02, mLr = 2, gLr = 1;                                       // consts_wheel
const yLr = 2, vLr = 8;                                                                        // consts_hit
const K2r = 32;                                                                                // consts_K2r
const Htt = 1.4, Qae = .01;                                                                    // consts_speeds
const JCe = "walk";                                                                            // consts_gait (default humanoid path gait)
const QWt = { shape: "round", intensity: 70, diffusion: 30 }, JWt = 16, eGt = 3, tGt = 55;     // consts_spotlight
const YZt = 2;                                                                                 // consts_YZt (camera steady speed)
const oit = .35;                                                                               // consts_oit
const nBr = 320;                                                                               // consts_cursor: centerOn ease ms
const Hv = 50;                                                                                 // consts_Hv default focalLengthMm
const Zae = [                                                                                  // consts_aspects
  { key: "16:9", aspect: 16 / 9 }, { key: "9:16", aspect: 9 / 16 }, { key: "1:1", aspect: 1 },
  { key: "4:3", aspect: 4 / 3 }, { key: "1.85:1", aspect: 1.85 }, { key: "2.39:1", aspect: 2.39 }];
const aDr = { background: "--plan-background", grid: "--plan-grid", gridMajor: "--plan-grid-major", // consts_palette
  human: "--plan-human", camera: "--plan-camera", object: "--plan-object", light: "--plan-light",
  prop: "--plan-prop", propEdge: "--plan-prop-edge", accent: "--plan-accent", accentSoft: "--plan-accent-soft",
  panel: "--plan-panel", text: "--plan-text", textDim: "--plan-text-dim" };
const XOr = 70 * Math.PI / 180, YOr = 35 * Math.PI / 180, CZt = 1.6;                           // consts_CZt (walker eye height)

// real three scratch (Lst/H2e/Z8r/K8r/uL/qY/xb/nDr in the bundle)
const Lst = new THREE.Euler(), H2e = new THREE.Vector3();
const Z8r = new THREE.Vector3(), K8r = new THREE.Euler();
const uL = new THREE.Quaternion(), qY = new THREE.Quaternion(), xb = new THREE.Euler(), nDr = new THREE.Vector3(0, 1, 0);

// ============================================================================
// PART B — pure geometry / view helpers (verbatim ports; exported for the oracle)
// ============================================================================
export function Am(t) { return Zae.find(e => e.key === t) ?? Zae[0]; }                         // aspect key → {aspect}
export function Z_(t, e = 16 / 9) { return 2 * Math.atan(35 / Math.max(e, 1) / 2 / t) * 180 / Math.PI; }  // fovDeg(focal, aspect) — XCe(t)=35/max(t,1) @3920783
export function tDe(t, e) { let n = (e - t) % (2 * Math.PI); return n > Math.PI && (n -= 2 * Math.PI), n < -Math.PI && (n += 2 * Math.PI), n; } // signed angle diff
const Ntt = 2 * Math.PI;
function ybe(t, e) { return t - Math.round((t - e) / Ntt) * Ntt; }                             // wrap to 2π near e
export function GA(t, e) {                                                                       // euler flip resolver
  const n = [t, [t[0] + Math.PI, Math.PI - t[1], t[2] + Math.PI]]; let r = e, s = 1 / 0;
  for (const a of n) { const o = [ybe(a[0], e[0]), ybe(a[1], e[1]), ybe(a[2], e[2])],
    l = Math.abs(o[0] - e[0]) + Math.abs(o[1] - e[1]) + Math.abs(o[2] - e[2]); l < s && (s = l, r = o); }
  return r;
}
export function Bzt(t, e) {                                                                      // transform key interp (lerp)
  if (t.length === 0) return null; const n = t[0];
  if (e <= n.tS || t.length === 1) return { position: n.position, rotation: n.rotation, scale: n.scale };
  const r = t[t.length - 1]; if (e >= r.tS) return { position: r.position, rotation: r.rotation, scale: r.scale };
  let s = t.findIndex(d => d.tS >= e); s <= 0 && (s = 1);
  const a = t[s - 1], o = t[s], l = o.tS - a.tS, c = l <= 0 ? 0 : (e - a.tS) / l;
  const L = (p, q) => p.map((v, i) => v + (q[i] - v) * c);
  return { position: L(a.position, o.position), rotation: L(a.rotation, o.rotation), scale: L(a.scale, o.scale) };
}
export function el(t) { return t === "humanoid" || t === "simple_figure"; }                     // is walker
export function fie(t) { return t === "camera" || t === "target" || t === "spotlight"; }        // is stage fixture
export function Q0(t) { return t === "humanoid" || t === "simple_figure" || t === "cube" || t === "sphere" || t === "cylinder" || t === "prop" || t === "group" || t === "target" || t === "spotlight"; } // path-drawable
export function Zo(t, e) {                                                                        // stored pose (VWt parent compose)
  const n = { position: t.position, rotation: t.rotation, scale: t.scale }, r = t.parentId ? e[t.parentId] : void 0;
  return r ? composePose({ position: r.position, rotation: r.rotation, scale: r.scale }, n) : n;
}
const _pm = new THREE.Matrix4(), _pm2 = new THREE.Matrix4(), _pe = new THREE.Euler(), _pq = new THREE.Quaternion(), _pv = new THREE.Vector3(), _pv2 = new THREE.Vector3();
export function composePose(parent, child) {                                                      // VWt: child-local → parent-world
  _pm.compose(_pv.set(...(parent.position ?? [0, 0, 0])), _pq.setFromEuler(_pe.set(...(parent.rotation ?? [0, 0, 0]))), _pv2.set(...(parent.scale ?? [1, 1, 1])));
  _pm2.compose(_pv.set(...(child.position ?? [0, 0, 0])), _pq.setFromEuler(_pe.set(...(child.rotation ?? [0, 0, 0]))), _pv2.set(...(child.scale ?? [1, 1, 1])));
  _pm2.premultiply(_pm); _pm2.decompose(_pv, _pq, _pv2);
  return { position: [_pv.x, _pv.y, _pv.z], rotation: eulerOf(_pq), scale: [_pv2.x, _pv2.y, _pv2.z] };
}
export function pie(t, e) {                                                                        // world → parent-local
  _pm.compose(_pv.set(...(t.position ?? [0, 0, 0])), _pq.setFromEuler(_pe.set(...(t.rotation ?? [0, 0, 0]))), _pv2.set(...(t.scale ?? [1, 1, 1]))).invert();
  _pm2.compose(_pv.set(...(e.position ?? [0, 0, 0])), _pq.setFromEuler(_pe.set(...(e.rotation ?? [0, 0, 0]))), _pv2.set(...(e.scale ?? [1, 1, 1])));
  _pm2.premultiply(_pm); _pm2.decompose(_pv, _pq, _pv2);
  return { position: [_pv.x, _pv.y, _pv.z], rotation: eulerOf(_pq), scale: [_pv2.x, _pv2.y, _pv2.z] };
}
function eulerOf(q) { const e = new THREE.Euler().setFromQuaternion(q, 'XYZ'); return [e.x, e.y, e.z]; }
export function Rhe(t) {                                                                           // pool half-angle rad from scale
  const e = (Math.abs(t.x) + Math.abs(t.y) + Math.abs(t.z)) / 3;
  return Math.min(tGt, Math.max(eGt, JWt * e)) * Math.PI / 180;
}
export function TDe(t) {                                                                           // POOL SOLVER (no min-radius clamp)
  const e = Z8r.set(0, 0, -1).applyEuler(K8r.set(...t.rotation)), n = t.position[1];
  if (n <= 0 || e.y > -.05) return null;
  const r = n / -e.y, [s, a, o] = t.scale;
  return { x: t.position[0] + e.x * r, z: t.position[2] + e.z * r, radiusM: r * Math.tan(Rhe({ x: s, y: a, z: o })) };
}
export function BR(t) { return t.spotlight ?? QWt; }                                               // spotlight cfg accessor
export function i9(t) {                                                                            // plan yaw of euler (screen-up = -Z)
  Lst.set(t[0], t[1], t[2], "XYZ"), H2e.set(0, 0, -1).applyEuler(Lst);
  return Math.atan2(-H2e.x, -H2e.z);
}
export function FU(t) { return { x: -Math.sin(t), z: -Math.cos(t) }; }                              // forward of yaw
export function hqt(t, e) { return Math.atan(Math.tan(t * Math.PI / 360) * e); }                    // horiz half-fov
export function Dst(t, e, propDims) {                                                               // FOOTPRINT (bundle-exact)
  const n = e.position[0], r = e.position[2], s = i9(e.rotation), [a, , o] = e.scale;
  switch (t.kind) {
    case "group": return null;
    case "camera": case "target": case "spotlight": return { shape: "marker", x: n, z: r, yawRad: s };
    case "humanoid": return { shape: "ellipse", x: n, z: r, halfWidthM: Fst * a, halfDepthM: Fst * o, yawRad: s };
    case "simple_figure": return { shape: "rect", x: n, z: r, halfWidthM: PP[0] * a / 2, halfDepthM: PP[2] * o / 2, yawRad: s };
    case "sphere": case "cylinder": return { shape: "ellipse", x: n, z: r, halfWidthM: a / 2, halfDepthM: o / 2, yawRad: s };
    default: {
      const l = t.propKey ? propDims?.(t.propKey) : void 0, [c, , d] = l ?? [1, 1, 1];
      return { shape: "rect", x: n, z: r, halfWidthM: c * a / 2, halfDepthM: d * o / 2, yawRad: s };
    }
  }
}
export function dqt(t) {                                                                            // footprint bbox (m)
  let e = 0, n = 0;
  if (t.shape !== "marker") {
    const r = Math.cos(t.yawRad), s = Math.sin(t.yawRad), a = t.halfWidthM, o = t.halfDepthM;
    t.shape === "rect" ? (e = Math.abs(a * r) + Math.abs(o * s), n = Math.abs(a * s) + Math.abs(o * r))
      : (e = Math.hypot(a * r, o * s), n = Math.hypot(a * s, o * r));
  }
  return { minX: t.x - e, minZ: t.z - n, maxX: t.x + e, maxZ: t.z + n };
}
export function iu(t, e) { return { x: t.widthPx / 2 + (e.x - t.centerX) * t.pxPerM, y: t.heightPx / 2 + (e.z - t.centerZ) * t.pxPerM }; }
export function S1(t, e) { return { x: t.centerX + (e.x - t.widthPx / 2) / t.pxPerM, z: t.centerZ + (e.y - t.heightPx / 2) / t.pxPerM }; }
export function UDe(t, e, n) { return { ...t, centerX: t.centerX - e / t.pxPerM, centerZ: t.centerZ - n / t.pxPerM }; }
export function mqt(t, e, n) { return Math.min(n, Math.max(e, t)); }
export function fqt(t, e, n) {                                                                      // zoom at anchor
  const r = S1(t, e), s = mqt(t.pxPerM * n, iqt, oqt);
  return { ...t, pxPerM: s, centerX: r.x - (e.x - t.widthPx / 2) / s, centerZ: r.z - (e.y - t.heightPx / 2) / s };
}
export function zIr(t, e, n) {                                                                      // fit to bbox (1e-6 floor, NO 2m span)
  const r = Math.max(1e-6, e.maxX - e.minX), s = Math.max(1e-6, e.maxZ - e.minZ),
    a = Math.min((t.widthPx - 2 * n) / r, (t.heightPx - 2 * n) / s);
  return { ...t, centerX: (e.minX + e.maxX) / 2, centerZ: (e.minZ + e.maxZ) / 2, pxPerM: mqt(a, iqt, oqt) };
}
export function uqt(t) {                                                                            // union bbox (m)
  if (!t.length) return null;
  const e = { minX: 1 / 0, minZ: 1 / 0, maxX: -1 / 0, maxZ: -1 / 0 };
  for (const n of t) { const r = dqt(n); e.minX = Math.min(e.minX, r.minX), e.minZ = Math.min(e.minZ, r.minZ), e.maxX = Math.max(e.maxX, r.maxX), e.maxZ = Math.max(e.maxZ, r.maxZ); }
  return e;
}
export function Rie(t, e) {                                                                         // footprint bbox (px, marker pad 12)
  const n = dqt(t), r = iu(e, { x: n.minX, z: n.minZ }), s = iu(e, { x: n.maxX, z: n.maxZ }), a = t.shape === "marker" ? lqt : 0;
  return { minX: r.x - a, minY: r.y - a, maxX: s.x + a, maxY: s.y + a };
}
export function pqt(t, e) {                                                                         // lens endpoints (4.2m ahead)
  const n = r => { const s = FU(r); return { x: t.x + s.x * Ost, z: t.z + s.z * Ost }; };
  return [n(t.yawRad - e), n(t.yawRad + e)];
}
export function UIr(t, e, n = !1) {                                                                 // focal from half-fov (+yT snap)
  const a = 50 * Math.tan(hqt(Z_(50, e), e)) / Math.tan(Math.max(.001, Math.abs(t)));
  if (!n) { const o = yT[0], l = yT[yT.length - 1]; return Math.round(Math.min(l, Math.max(o, a))); }
  return yT.reduce((o, l) => Math.abs(l - a) < Math.abs(o - a) ? l : o);
}
export function zDe(t, e, n) {                                                                      // callout geometry (ellipse +12 case!)
  const r = iu(e, t),
    s = t.shape === "marker" ? VIr : t.shape === "ellipse" ? Math.max(t.halfWidthM, t.halfDepthM) * e.pxPerM + 12 : Math.max(t.halfWidthM, t.halfDepthM) * 1.2 * e.pxPerM + 10,
    a = FU(t.yawRad), o = { x: r.x + a.x * s, y: r.y + a.z * s };
  if (n === void 0) return { center: r, ringRadiusPx: s, rotate: o };
  const [l, c] = pqt(t, n);
  return { center: r, ringRadiusPx: s, rotate: o, lens: [iu(e, l), iu(e, c)] };
}
export function aqt(t) {                                                                            // label contrast color
  const e = Number.parseInt(t.slice(1, 7), 16); if (Number.isNaN(e)) return Pst;
  const n = e >> 16 & 255, r = e >> 8 & 255, s = e & 255;
  return (.2126 * n + .7152 * r + .0722 * s) / 255 > HIr ? BIr : Pst;
}
export function aMr(t, e) {                                                                         // drop children whose parent selected
  const n = new Set(t); return t.filter(r => { const s = e[r]?.parentId; return !s || !n.has(s); });
}
export function hL(t) { return { x: t[0], z: t[2] }; }
export function rit(t, e) {                                                                         // resample keys → 41 pts
  const n = t[0].tS, r = t[t.length - 1].tS;
  return Array.from({ length: eit + 1 }, (s, a) => e(n + (r - n) * a / eit));
}
const QOr = (t, e) => Math.max(-e, Math.min(e, t)), Gat = t => Math.atan2(Math.sin(t), Math.cos(t));
export function xM(t, e, n) {                                                                       // head-look solver (70°/35°)
  const r = n[0] - e[0], s = n[1] - e[1], a = n[2] - e[2], o = Math.hypot(r, a);
  if (o < 1e-6) return { bodyYawRad: t, headPitchRad: 0, headYawRad: 0 };
  const l = Math.atan2(-r, -a), c = Gat(l - t), d = Math.sign(c) * Math.min(Math.abs(c), XOr, Math.PI - Math.abs(c));
  return { bodyYawRad: Gat(t + c - d), headPitchRad: QOr(Math.atan2(s, o), YOr), headYawRad: d };
}
const _lkM = new THREE.Object3D();
export function kv(t, e) {                                                                          // lookAt euler (camera faces −Z)
  _lkM.position.set(t[0], t[1], t[2]); _lkM.lookAt(e[0], e[1], e[2]); _lkM.rotateY(Math.PI);
  return [_lkM.rotation.x, _lkM.rotation.y, _lkM.rotation.z];
}


// ============================================================================
// PART C — painter chain (verbatim ports: SDr pass order is the spec)
// ============================================================================
export function _Dr(t) { const n = (t * HZt - sit) / (iDr - sit); return Math.min(1, Math.max(0, n)); } // grid minor fade
export function kDr(t, e) { return el(t) ? e.human : t === "camera" || t === "target" ? e.camera : t === "spotlight" ? e.light : e.object; } // color by kind
export function TDr(t, e, n) {                                                                     // grid: 1m minors skip 5m, 5m majors
  const r = S1(e, { x: 0, y: 0 }), s = S1(e, { x: e.widthPx, y: e.heightPx }),
    a = (l, c) => {
      t.beginPath();
      for (let d = Math.ceil(r.x / l) * l; d <= s.x; d += l) {
        if (c && d % oye === 0) continue;
        const u = Math.round(iu(e, { x: d, z: 0 }).x) + .5; t.moveTo(u, 0), t.lineTo(u, e.heightPx);
      }
      for (let d = Math.ceil(r.z / l) * l; d <= s.z; d += l) {
        if (c && d % oye === 0) continue;
        const u = Math.round(iu(e, { x: 0, z: d }).y) + .5; t.moveTo(0, u), t.lineTo(e.widthPx, u);
      }
      t.stroke();
    };
  t.lineWidth = 1;
  const o = _Dr(e.pxPerM);
  o > 0 && (t.globalAlpha = o, t.strokeStyle = n.grid, a(HZt, !0), t.globalAlpha = 1),
    t.strokeStyle = n.gridMajor, a(oye, !1);
}
export function q5(t, e, n, r, s) {                                                                // text label
  t.font = `${s.sizePx}px ${s.fontFamily}`, t.fillStyle = s.color, t.textAlign = s.align, t.fillText(e, n, r);
}
export function $Zt(t, e, n) {                                                                     // polyline path (no stroke)
  t.beginPath(), n.forEach((r, s) => { const a = iu(e, r); s === 0 ? t.moveTo(a.x, a.y) : t.lineTo(a.x, a.y); });
}
export function cBe(t, e, n, r) {                                                                  // rotated polygon path
  const s = Math.cos(r), a = Math.sin(r);
  t.beginPath();
  for (const [o, l] of n) t.lineTo(e.x + o * s + l * a, e.y - o * a + l * s);
  t.closePath();
}
export function dBe(t, e, n, r, s) { cBe(t, e, [[-n, -r], [n, -r], [n, r], [-n, r]], s); }         // rotated rect path
export function EDr(t, e, n, r, s, a) {                                                            // simple_figure body painter
  const o = n.footprint; if (o.shape !== "rect") return;
  const l = Math.max(1, uDr / (o.halfWidthM * e.pxPerM)), c = o.halfWidthM * e.pxPerM * l, d = o.halfDepthM * e.pxPerM * l, u = aqt(a.human);
  dBe(t, r, c, d, o.yawRad), t.fillStyle = a.human, t.fill(), s && (t.strokeStyle = a.accent, t.lineWidth = 1.6, t.stroke());
  const h = Math.max(1.5, d * .2);
  cBe(t, r, [[-c, -d], [c, -d], [c, -d + h], [-c, -d + h]], o.yawRad), t.fillStyle = u, t.fill();
  const f = Math.min(Math.abs(o.halfWidthM) / (PP[0] / 2), Math.abs(o.halfDepthM) / (PP[2] / 2)), m = Nie * f * e.pxPerM * l;
  t.beginPath(), t.arc(r.x, r.y, m, 0, Math.PI * 2), t.fillStyle = a.human, t.fill(), t.strokeStyle = a.background, t.lineWidth = 1, t.stroke();
  const g = FU(o.yawRad + (n.headYawRad ?? 0)), b = Math.atan2(g.z, g.x);
  t.beginPath(), t.arc(r.x, r.y, m * .72, b - Pie, b + Pie), t.strokeStyle = u, t.lineWidth = Math.max(1.5, m * .3), t.stroke();
  const y = FU(o.yawRad);
  t.strokeStyle = a.human, t.lineWidth = 1.6, t.lineCap = "round", t.beginPath(),
    t.moveTo(r.x + y.x * (d + 3), r.y + y.z * (d + 3)), t.lineTo(r.x + y.x * (d + 10), r.y + y.z * (d + 10)),
    t.stroke(), t.lineCap = "butt";
}
export function VZt(t, e, n, r) {                                                                  // stick figure (V legs!)
  t.fillStyle = r, t.strokeStyle = r, t.lineWidth = n > 8 ? 2.2 : 1.6, t.lineCap = "round";
  t.beginPath(), t.arc(e.x, e.y - n * .72, n * .3, 0, Math.PI * 2), t.fill();
  t.beginPath(), t.moveTo(e.x, e.y - n * .4), t.lineTo(e.x, e.y + n * .3),
    t.moveTo(e.x - n * .6, e.y - n * .12), t.lineTo(e.x + n * .6, e.y - n * .12),
    t.moveTo(e.x - n * .45, e.y + n), t.lineTo(e.x, e.y + n * .3), t.lineTo(e.x + n * .45, e.y + n),
    t.stroke();
}
export function jDr(t, e, n, r, s, a = !0) {                                                       // per-kind glyph dispatch
  const o = n.footprint, l = iu(e, o);
  if (n.kind === "camera") {
    n.wedgeHalfRad !== void 0 && NDr(t, e, o, n.wedgeHalfRad, r, s);
    t.fillStyle = s.panel, t.strokeStyle = r ? s.accent : s.camera, t.lineWidth = r ? 1.6 : 1.2;
    for (const u of [oDr, lDr]) cBe(t, l, u, o.yawRad), t.fill(), t.stroke();
    n.label && a && q5(t, n.label, l.x + 18, l.y + 26, { sizePx: l$, color: s.textDim, align: "left", fontFamily: s.fontFamily });
    return;
  }
  if (n.kind === "spotlight") {
    if (n.pool) {
      const u = iu(e, n.pool);
      t.strokeStyle = s.light, t.globalAlpha = r ? .9 : .5, t.lineWidth = 1, t.setLineDash([3, 3]),
        t.beginPath(), t.moveTo(l.x, l.y), t.lineTo(u.x, u.y), t.stroke(), t.setLineDash([]), t.globalAlpha = 1;
    }
    t.fillStyle = s.light, t.strokeStyle = r ? s.accent : s.panel, t.lineWidth = r ? 1.6 : 1.2,
      t.beginPath(), t.arc(l.x, l.y, ait, 0, Math.PI * 2), t.fill(), t.stroke();
    n.label && r && a && q5(t, n.label, l.x + ait + 6, l.y + 4, { sizePx: Cje, color: s.textDim, align: "left", fontFamily: s.fontFamily });
    return;
  }
  if (o.shape === "marker") {                                                                       // target
    t.strokeStyle = r ? s.accent : s.camera, t.lineWidth = 1.4, t.beginPath(), t.arc(l.x, l.y, gDr, 0, Math.PI * 2),
      t.moveTo(l.x - ZY, l.y), t.lineTo(l.x + ZY, l.y), t.moveTo(l.x, l.y - ZY), t.lineTo(l.x, l.y + ZY), t.stroke();
    return;
  }
  if (n.kind === "humanoid") {
    const u = MDr(e); VZt(t, l, u, s.human);
    const h = FU(o.yawRad);
    t.lineWidth = 1.6, t.beginPath(), t.moveTo(l.x + h.x * u * 1.35, l.y + h.z * u * 1.35),
      t.lineTo(l.x + h.x * u * 2.1, l.y + h.z * u * 2.1), t.stroke(), t.lineCap = "butt";
    n.label && a && (t.globalAlpha = r ? 1 : oit, q5(t, n.label, l.x + u + 6, l.y + 4, { sizePx: l$, color: s.text, align: "left", fontFamily: s.fontFamily }), t.globalAlpha = 1);
    return;
  }
  if (n.kind === "simple_figure") {
    EDr(t, e, n, l, r, s);
    n.label && a && (t.globalAlpha = r ? 1 : oit, q5(t, n.label, Rie(o, e).maxX + 6, l.y + 4, { sizePx: l$, color: s.text, align: "left", fontFamily: s.fontFamily }), t.globalAlpha = 1);
    return;
  }
  const c = o.halfWidthM * e.pxPerM, d = o.halfDepthM * e.pxPerM;                                   // props: ellipse uses -yaw!
  o.shape === "rect" ? dBe(t, l, c, d, o.yawRad) : (t.beginPath(), t.ellipse(l.x, l.y, c, d, -o.yawRad, 0, Math.PI * 2));
  t.fillStyle = s.prop, t.fill(), t.strokeStyle = r ? s.accent : s.propEdge, t.lineWidth = 1, t.stroke();
  n.label && r && a && q5(t, n.label, l.x, Rie(o, e).maxY + 14, { sizePx: Cje, color: s.textDim, align: "center", fontFamily: s.fontFamily });
}
export function IDr(t, e, n, r, s) {                                                               // pool fill (rotated SQUARE for square shape)
  const a = n.pool, o = iu(e, a), l = a.radiusM * e.pxPerM;
  a.square ? dBe(t, o, l, l, n.footprint.yawRad) : (t.beginPath(), t.arc(o.x, o.y, l, 0, Math.PI * 2));
  t.fillStyle = s.light, t.globalAlpha = r ? yDr : bDr, t.fill(), t.globalAlpha = 1;
}
export function MDr(t) { return Math.min(hDr, Math.max(dDr, t.pxPerM * cDr)); }                     // stick unit size
export function NDr(t, e, n, r, s, a) {                                                            // camera fov wedge
  const o = iu(e, n), [l, c] = pqt(n, r).map(d => iu(e, d));
  t.beginPath(), t.moveTo(o.x, o.y), t.lineTo(l.x, l.y), t.lineTo(c.x, c.y), t.closePath(),
    t.fillStyle = a.camera, t.globalAlpha = s ? .2 : .1, t.fill(),
    t.strokeStyle = a.camera, t.globalAlpha = s ? 1 : .6, t.lineWidth = s ? 1.4 : 1, t.stroke(), t.globalAlpha = 1;
}
export function RDr(t, e, n, r, s) {                                                               // rotate-handle direction tick
  const a = n + pDr, o = Math.atan2(-Math.cos(r), -Math.sin(r)), l = fDr / n, c = mDr / n;
  t.strokeStyle = s.accent, t.fillStyle = s.accent, t.lineWidth = 1.6, t.lineCap = "round";
  for (const d of [1, -1]) {
    const u = o + d * l, h = o + d * (l + c);
    t.beginPath(), t.arc(e.x, e.y, a, Math.min(u, h), Math.max(u, h)), t.stroke();
    const f = { x: e.x + Math.cos(h) * a, y: e.y + Math.sin(h) * a }, m = h + d * Math.PI / 2;
    t.beginPath(), t.moveTo(f.x + Math.cos(m) * 4, f.y + Math.sin(m) * 4),
      t.lineTo(f.x + Math.cos(h) * 3.5, f.y + Math.sin(h) * 3.5),
      t.lineTo(f.x - Math.cos(h) * 3.5, f.y - Math.sin(h) * 3.5), t.closePath(), t.fill();
  }
  t.lineCap = "butt";
}
export function PDr(t, e, n, r) {                                                                  // single-selection callout
  const s = zDe(n.footprint, e, n.wedgeHalfRad);
  t.strokeStyle = r.accent, t.lineWidth = 1, t.beginPath(), t.arc(s.center.x, s.center.y, s.ringRadiusPx, 0, Math.PI * 2), t.stroke();
  t.fillStyle = r.panel, t.lineWidth = 1.4;
  for (const a of [s.rotate, ...s.lens ?? []]) t.beginPath(), t.arc(a.x, a.y, cqt, 0, Math.PI * 2), t.fill(), t.stroke();
  RDr(t, s.center, s.ringRadiusPx, n.footprint.yawRad, r);
}
export function FDr(t, e, n) {                                                                     // edge indicator painter (arrow!)
  for (const r of e)
    t.save(), t.translate(r.x, r.y),
      t.fillStyle = n.panel, t.strokeStyle = n.camera, t.lineWidth = 1.4,
      t.beginPath(), t.arc(0, 0, uN, 0, Math.PI * 2), t.fill(), t.stroke(),
      t.rotate(r.angleRad), t.fillStyle = n.camera, t.beginPath(),
      t.moveTo(uN + 6, 0), t.lineTo(uN, -5), t.lineTo(uN, 5), t.closePath(), t.fill(), t.rotate(-r.angleRad),
      t.fillStyle = n.text, t.font = `${l$}px ${n.fontFamily}`, t.textAlign = "center", t.textBaseline = "middle",
      t.fillText(r.tag, 0, .5), t.restore();
}
export function ADr(t, e, n, r, s) {                                                               // focus overlay
  const a = n.find(d => d.id === r.fromId), o = n.find(d => d.id === r.subjectId);
  if (!a || !o) return;
  const l = iu(e, a.footprint), c = iu(e, o.footprint);
  t.strokeStyle = s.accent, t.lineWidth = 1, t.setLineDash([2, 4]), t.beginPath(), t.moveTo(l.x, l.y), t.lineTo(c.x, c.y), t.stroke(), t.setLineDash([]);
  t.lineWidth = 1.4, t.beginPath(), t.arc(c.x, c.y, wDr, 0, Math.PI * 2);
  for (const [d, u] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) t.moveTo(c.x + d * iit, c.y + u * iit), t.lineTo(c.x + d * lye, c.y + u * lye);
  t.stroke();
  q5(t, r.label, c.x + lye + 2, c.y - 10, { sizePx: l$, color: s.accent, align: "left", fontFamily: s.fontFamily });
}
export function CDr(t, e, n, r) {                                                                  // selected path painter (keys as diamonds)
  $Zt(t, e, n.points), t.strokeStyle = kDr(n.kind, r), t.lineWidth = 1.4, t.setLineDash([2, 4]), t.stroke(), t.setLineDash([]);
  t.fillStyle = r.accent, t.strokeStyle = r.panel, t.lineWidth = 1;
  for (const s of n.keys) {
    const a = iu(e, s);
    t.beginPath(), t.moveTo(a.x, a.y - KY * Math.SQRT2), t.lineTo(a.x + KY * Math.SQRT2, a.y),
      t.lineTo(a.x, a.y + KY * Math.SQRT2), t.lineTo(a.x - KY * Math.SQRT2, a.y), t.closePath(), t.fill(), t.stroke();
  }
}
export function SDr(t, e) {                                                                        // MAIN PAINTER (pass order = spec)
  const { view: n, palette: r, selection: s } = e;
  t.lineJoin = "round", t.fillStyle = r.background, t.fillRect(0, 0, n.widthPx, n.heightPx);
  TDr(t, n, r);
  const a = new Map, o = new Set(["humanoid", "simple_figure", "target", "spotlight", "camera"]),
    l = e.items.filter(h => !o.has(h.kind)), c = e.items.filter(h => o.has(h.kind)),
    d = () => {
      for (const h of e.paths) s.has(h.id) && (t.globalAlpha = h.id === e.dimPathOf ? vDr : 1, CDr(t, n, h, r));
      t.globalAlpha = 1;
      e.stroke && e.stroke.length > 1 && ($Zt(t, n, e.stroke), t.strokeStyle = r.accent, t.lineWidth = xDr, t.lineCap = "round", t.stroke(), t.lineCap = "butt");
    },
    u = h => {
      const f = h.parentId !== void 0 && s.has(h.parentId), m = s.has(h.id);
      if (jDr(t, n, h, m || f, r, !f), !f) return;
      const g = Rie(h.footprint, n), b = a.get(h.parentId);
      a.set(h.parentId, b ? { minX: Math.min(b.minX, g.minX), minY: Math.min(b.minY, g.minY), maxX: Math.max(b.maxX, g.maxX), maxY: Math.max(b.maxY, g.maxY), label: b.label } : { ...g, label: h.groupLabel });
    };
  for (const h of e.items) h.pool && IDr(t, n, h, s.has(h.id), r);
  l.forEach(u), d(), c.forEach(u);                                                                  // paths BETWEEN non-char and char passes
  t.strokeStyle = r.accent, t.lineWidth = 1, t.setLineDash([4, 3]);
  for (const h of a.values()) t.strokeRect(h.minX - pL, h.minY - pL, h.maxX - h.minX + 2 * pL, h.maxY - h.minY + 2 * pL);
  t.setLineDash([]);
  for (const h of a.values()) h.label && q5(t, h.label, (h.minX + h.maxX) / 2, h.maxY + pL + 14, { sizePx: Cje, color: r.textDim, align: "center", fontFamily: r.fontFamily });
  if (e.focus && ADr(t, n, e.items, e.focus, r), s.size === 1 && !e.stroke) {                        // callout suppressed only during active stroke
    const [h] = s, f = e.items.find(m => m.id === h);
    f && PDr(t, n, f, r);
  }
  if (e.marquee) {
    const h = e.marquee, f = Math.min(h.x0, h.x1), m = Math.min(h.y0, h.y1), g = Math.abs(h.x1 - h.x0), b = Math.abs(h.y1 - h.y0);
    t.fillStyle = r.accentSoft, t.fillRect(f, m, g, b), t.strokeStyle = r.accent, t.lineWidth = 1, t.setLineDash([4, 3]), t.strokeRect(f, m, g, b), t.setLineDash([]);
  }
}
export function $Ir(t, e) {                                                                         // edge indicators (offscreen cameras) — RAY-SCALED clamp
  const n = e.widthPx / 2, r = e.heightPx / 2, s = [];
  for (const a of t) {
    if (a.kind !== "camera") continue;
    const o = iu(e, a.footprint);
    if (o.x >= 0 && o.x <= e.widthPx && o.y >= 0 && o.y <= e.heightPx) continue;
    const l = o.x - n, c = o.y - r, d = Math.min((n - Rst) / Math.abs(l || 1e-6), (r - Rst) / Math.abs(c || 1e-6));
    s.push({ id: a.id, tag: a.tag ?? "", x: n + l * d, y: r + c * d, angleRad: Math.atan2(c, l) });
  }
  return s;
}
export function ZIr(t, e, n) {                                                                      // camera label overlay pos
  const { center: r, ringRadiusPx: s } = zDe(t.footprint, e, t.wedgeHalfRad), a = (o, l) => Math.min(Math.max(o, $2e), l);
  return { x: a(r.x + s + WIr, e.widthPx - n.widthPx - $2e), y: a(r.y - s * GIr - qIr, e.heightPx - n.heightPx - $2e) };
}

// ============================================================================
// PART D — interaction reducers (verbatim ports)
// ============================================================================
export function xLr(t, e, n) {                                                                      // point-in-footprint
  const r = iu(e, t), s = Math.hypot(n.x - r.x, n.y - r.y);
  if (t.shape === "marker") return s <= lqt;
  if (s <= vLr) return !0;
  const a = S1(e, n), o = a.x - t.x, l = a.z - t.z, c = Math.cos(t.yawRad), d = Math.sin(t.yawRad),
    u = (o * c - l * d) / t.halfWidthM, h = (o * d + l * c) / t.halfDepthM;
  return t.shape === "rect" ? Math.abs(u) <= 1 && Math.abs(h) <= 1 : u * u + h * h <= 1;
}
export function Qhe(t, e, n) {                                                                      // all hits topmost-first
  const r = []; for (let s = t.length - 1; s >= 0; s--) { const a = t[s]; xLr(a.footprint, e, n) && r.push(a); } return r;
}
export function Xat(t, e, n) { const r = Qhe(t, e, n)[0]; return r ? r.parentId ?? r.id : null; }   // topmost hit + promotion (unconditional!)
export function wLr(t, e, n, r) {                                                                   // mod-click cycle child
  const s = Qhe(t, e, n); if (!s.length) return null;
  const a = s.find(c => c.parentId === r); if (a) return a.id;
  const o = s.findIndex(c => c.id === r), l = o >= 0 ? (o + 1) % s.length : Math.min(1, s.length - 1);
  return s[l].id;
}
export function _Lr(t, e, n) {                                                                      // marquee select
  const r = Math.min(n.x0, n.x1), s = Math.max(n.x0, n.x1), a = Math.min(n.y0, n.y1), o = Math.max(n.y0, n.y1), l = new Set;
  for (const c of t) { const d = Rie(c.footprint, e); d.maxX >= r && d.minX <= s && d.maxY >= a && d.minY <= o && l.add(c.parentId ?? c.id); }
  return [...l];
}
export function kLr(t, e, n) {                                                                      // camera handle hit (rotate | lens)
  const r = zDe(t.footprint, e, t.wedgeHalfRad), s = a => Math.hypot(n.x - a.x, n.y - a.y) <= cqt + yLr;
  return s(r.rotate) ? "rotate" : r.lens?.some(s) ? "lens" : null;
}
export function ELr() { return { view: { centerX: 0, centerZ: 0, pxPerM: Uhe, widthPx: 0, heightPx: 0 }, drag: null, fitted: !1 }; }
export function jLr(t, e, n) {                                                                      // resize keeping world center
  const { view: r } = t; if (r.widthPx === e && r.heightPx === n) return t;
  const s = r.widthPx > 0 && r.heightPx > 0;
  return { ...t, view: { ...r, centerX: s ? r.centerX + (e - r.widthPx) / (2 * r.pxPerM) : r.centerX, centerZ: s ? r.centerZ + (n - r.heightPx) / (2 * r.pxPerM) : r.centerZ, widthPx: e, heightPx: n } };
}
export function ILr(t, e) {                                                                         // zoom-to-fit (once)
  if (t.fitted || t.view.widthPx === 0) return t;
  const n = uqt(e.map(r => r.footprint));
  return n ? { ...t, view: zIr(t.view, n, TLr), fitted: !0 } : t;
}
export function MLr(t, e, n) {                                                                      // zoom to id
  const r = e.find(s => s.id === n)?.footprint;
  return !r || t.view.widthPx === 0 ? t : { ...t, view: { ...t.view, centerX: r.x, centerZ: r.z, pxPerM: Uhe }, fitted: !0 };
}
export function FZt(t) { return Math.max(.1, 1 + t); }
export function PZt(t) {                                                                            // wheel → intent
  if (t.zoom) { const r = Math.abs(t.deltaY) > 20 ? pLr : fLr; return { kind: "zoom", delta: -t.deltaY * r }; }
  const e = t.deltaMode === 0 ? mLr : gLr;
  return { kind: "pan", dx: t.deltaX * e, dy: t.deltaY * e };
}
export function NLr(t, e) {                                                                         // wheel reducer (pan sign: UDe(-dx,-dy))
  const n = PZt({ deltaX: e.dx, deltaY: e.dy, deltaMode: e.deltaMode, zoom: e.zoom }),
    r = n.kind === "zoom" ? fqt(t.view, e.p, FZt(n.delta)) : UDe(t.view, -n.dx, -n.dy);
  return { ...t, view: r };
}
export function PLr(t, e, n) { return { ...t, view: UDe(t.view, e, n) }; }
export function RLr(t, e) {                                                                         // keyboard/button zoom at center
  const n = { x: t.view.widthPx / 2, y: t.view.heightPx / 2 };
  return { ...t, view: fqt(t.view, n, FZt(e * Aje)) };
}
export function FLr(t, e, n) {                                                                      // centerOn (no zoom change)
  const r = e.find(s => s.id === n)?.footprint;
  return !r || t.view.widthPx === 0 ? t : { ...t, view: { ...t.view, centerX: r.x, centerZ: r.z } };
}
export function OLr(t) { return { ...t, fitted: !1 }; }
export function LLr(t) { return Math.round(t.view.pxPerM / Uhe * 100); }
export function LZt(t) { return t.selection.length === 1 ? t.items.find(e => e.id === t.selection[0]) : void 0; }
export function OZt(t, e, n) {                                                                      // tap-or-draw focus probe
  const r = LZt(e); if (!e.drawing || !r || r.kind !== "camera" && !el(r.kind)) return null;
  const s = Qhe(e.items, t.view, n)[0];
  return s && s.id !== r.id && s.kind !== "camera" && s.kind !== "target" ? s.id : null;
}
export function DLr(t, e, n) {                                                                      // pointerdown reducer
  if (e.locked) return { state: t, intents: [] };
  const { view: r } = t;
  if (e.readOnly) {
    const d = Xat(e.items, r, n.p), u = d ? [d] : [], h = u.length === e.selection.length && u[0] === e.selection[0];
    return { state: t, intents: h ? [] : [{ type: "select", ids: u }] };
  }
  const s = LZt(e);
  if (e.drawing && s) {
    const d = OZt(t, e, n.p);
    return d ? { state: { ...t, drag: { kind: "tap-or-draw", downPx: n.p, focusId: d } }, intents: [] }
      : { state: { ...t, drag: { kind: "stroke", lastPx: n.p } }, intents: [{ type: "stroke-start", at: S1(r, n.p) }] };
  }
  const a = s ? kLr(s, r, n.p) : null;
  if (s && a) return { state: { ...t, drag: { kind: a, item: s, last: null } }, intents: [] };
  const o = (d, u) => ({ kind: "move", ids: d, downPx: n.p, downWorld: S1(r, n.p), anchor: u, last: null });
  if (n.mod) {
    const d = wLr(e.items, r, n.p, e.selection.length === 1 ? e.selection[0] : null), u = e.items.find(h => h.id === d);
    if (d && u) return { state: { ...t, drag: o([d], u.footprint) }, intents: [{ type: "select", ids: [d] }] };
  }
  const l = Xat(e.items, r, n.p);
  if (l) {
    const d = Qhe(e.items, r, n.p)[0]; let u = [...e.selection]; const h = [];
    return n.shift ? (u = u.includes(l) ? u.filter(f => f !== l) : [...u, l], h.push({ type: "select", ids: u }))
      : u.includes(l) || (u = [l], h.push({ type: "select", ids: u })),                                     // keep whole selection on member click
      { state: { ...t, drag: u.length ? o(u, d.footprint) : null }, intents: h };
  }
  const c = n.shift ? [...e.selection] : [];
  return { state: { ...t, drag: { kind: "marquee", rect: { x0: n.p.x, y0: n.p.y, x1: n.p.x, y1: n.p.y }, base: c } },
    intents: !n.shift && e.selection.length ? [{ type: "select", ids: [] }] : [] };                          // deselect AT POINTERDOWN
}
export function DZt(t, e, n) {                                                                      // pointermove reducer
  const r = t.drag; if (!r) return { state: t, intents: [] };
  if (r.kind === "tap-or-draw") {
    const { downPx: d } = r;
    return Math.hypot(n.p.x - d.x, n.p.y - d.y) < Qat ? { state: t, intents: [] }
      : { state: { ...t, drag: { kind: "stroke", lastPx: n.p } }, intents: [{ type: "stroke-start", at: S1(t.view, d) }, { type: "stroke-move", at: S1(t.view, n.p) }] };
  }
  if (r.kind === "stroke") {
    const { lastPx: d } = r;
    return Math.hypot(n.p.x - d.x, n.p.y - d.y) < SLr ? { state: t, intents: [] }
      : { state: { ...t, drag: { kind: "stroke", lastPx: n.p } }, intents: [{ type: "stroke-move", at: S1(t.view, n.p) }] };
  }
  if (r.kind === "marquee") return { state: { ...t, drag: { ...r, rect: { ...r.rect, x1: n.p.x, y1: n.p.y } } }, intents: [] };
  const s = S1(t.view, n.p);
  if (r.kind === "move") {
    if (!r.last && Math.hypot(n.p.x - r.downPx.x, n.p.y - r.downPx.y) < Qat) return { state: t, intents: [] };
    const d = m => n.shift ? Math.round(m / Vie) * Vie : m,
      u = d(r.anchor.x + s.x - r.downWorld.x) - r.anchor.x, h = d(r.anchor.z + s.z - r.downWorld.z) - r.anchor.z,
      f = r.last ? [] : [{ type: "begin" }];
    return (!r.last || r.last.dx !== u || r.last.dz !== h) && f.push({ type: "move", ids: r.ids, dx: u, dz: h }),
      { state: { ...t, drag: { ...r, last: { dx: u, dz: h } } }, intents: f };
  }
  const a = r.item.footprint, o = Math.atan2(a.x - s.x, a.z - s.z),                                     // rotate: FACES pointer
    l = r.kind === "rotate" ? n.shift ? Math.round(o / Yat) * Yat : o : UIr(Math.abs(tDe(a.yawRad, o)), e.aspect, n.shift);
  if (l === r.last) return { state: t, intents: [] };
  const c = r.last === null ? [{ type: "begin" }] : [];
  return c.push(r.kind === "rotate" ? { type: "yaw", id: r.item.id, yawRad: l } : { type: "lens", id: r.item.id, focalLengthMm: l }),
    { state: { ...t, drag: { ...r, last: l } }, intents: c };
}
export function BLr(t, e, n, r) {                                                                   // autopan during drag (deadzone .8, 720px/s)
  const s = t.drag;
  if (!s || s.kind !== "stroke" && s.kind !== "move") return { state: t, intents: [] };
  if (s.kind === "move" && !s.last) return { state: t, intents: [] };
  const { widthPx: a, heightPx: o } = t.view,
    l = (f, m) => { const g = m * ALr / 2, b = f - m / 2, y = Math.abs(b) - g; return y <= 0 ? 0 : Math.sign(b) * Math.min(1, y / Math.max(m / 2 - g, 1)); },
    c = CLr * Math.min(r, 100) / 1e3, d = l(n.x, a) * c, u = l(n.y, o) * c;
  if (d === 0 && u === 0) return { state: t, intents: [] };
  const h = { ...t, view: UDe(t.view, -d, -u) };
  return s.kind === "stroke" ? { state: h, intents: [{ type: "stroke-move", at: S1(h.view, n) }] } : DZt(h, e, { p: n, shift: !1 });
}
export function HLr(t, e) {                                                                         // pointerup reducer
  const n = t.drag, r = { ...t, drag: null };
  if (!n) return { state: t, intents: [] };
  if (n.kind === "stroke") return { state: r, intents: [{ type: "stroke-end" }] };
  if (n.kind === "tap-or-draw") return { state: r, intents: [{ type: "focus", id: n.focusId }] };
  if (n.kind === "marquee") {
    const { x0: s, y0: a, x1: o, y1: l } = n.rect;
    if (Math.abs(o - s) <= Jat && Math.abs(l - a) <= Jat) return { state: r, intents: [] };                // EITHER dim >4px commits
    const c = _Lr(e.items, t.view, n.rect);
    return { state: r, intents: [{ type: "select", ids: [...new Set([...n.base, ...c])] }] };
  }
  return { state: r, intents: n.last === null ? [] : [{ type: "commit" }] };
}
export function $Lr(t) {                                                                            // finalize (pointercancel)
  const e = t.drag, n = !!e && e.kind !== "marquee" && e.kind !== "stroke" && e.kind !== "tap-or-draw" && e.last !== null;
  return { state: { ...t, drag: null }, intents: n ? [{ type: "commit" }] : [] };
}

// ============================================================================
// PART E — stroke simplify pipeline (verbatim: Ait/xHr/wHr/vHr)
// ============================================================================
export function Ait(t) { let e = 0; return t.map((n, r) => (r && (e += Math.hypot(n.x - t[r - 1].x, n.z - t[r - 1].z)), e)); }
export function xHr(t) {                                                                            // dwell spans (≥.25s stationary)
  const e = []; let n = 0;
  for (let r = 1; r <= t.length; r++) {
    const s = t[r];
    s && s.x === t[n].x && s.z === t[n].z || (t[r - 1].t - t[n].t >= gHr && e.push([n, r - 1]), n = r);
  }
  return e;
}
export function wHr(t, e) {                                                                         // anchor-aware ¼-smoothing ×2 + time re-zero
  const n = new Set([0, t.length - 1]);
  for (const [o, l] of e) for (let c = o; c <= l; c++) n.add(c);
  const r = t[0].t; let s = 0;
  let a = t.map(o => (s = Math.max(s, o.t - r), { x: o.x, z: o.z, t: s }));
  for (let o = 0; o < 2; o++)
    a = a.map((l, c) => n.has(c) ? l : { x: (a[c - 1].x + l.x * 2 + a[c + 1].x) / 4, z: (a[c - 1].z + l.z * 2 + a[c + 1].z) / 4, t: l.t });
  return a;
}
export function vHr(t) {                                                                            // simplify → {points, pace, durationS}|null
  if (t.length < 3 || Ait(t).at(-1) < fHr) return null;
  const e = xHr(t), n = wHr(t, e), r = Ait(n), s = n.length - 1, a = r[s], o = n[s].t;
  if (!(a > 0) || !(o > 0)) return null;
  const l = n.map(b => b.t), c = [0, ...e.flat(), s];
  for (let b = 0; b < c.length - 1; b += 2) {                                                        // dwell time re-spread (mHr=.7)
    const y = c[b], v = c[b + 1], x = r[v] - r[y], w = l[v] - l[y];
    for (let k = y + 1; k < v; k++) { const S = l[y] + (r[k] - r[y]) / x * w, T = n[k].t; l[k] = Math.max(l[k - 1], T + (S - T) * mHr); }
  }
  const d = Math.max(K2r, Math.ceil(o / bHr) + 1), u = []; let h = 1;                                // pace array (arc-fraction samples)
  for (let b = 0; b < d; b++) {
    const y = b / (d - 1) * o;
    for (; h < s && l[h] < y;) h++;
    const v = l[h - 1], x = l[h], w = x > v ? Math.min(1, Math.max(0, (y - v) / (x - v))) : 1,
      k = r[h - 1] + (r[h] - r[h - 1]) * w, S = Math.round(k / a * Tit) / Tit;
    u.push(Math.max(u[b - 1] ?? 0, S));
  }
  u[0] = 0, u[d - 1] = 1;
  const f = [[n[0].x, n[0].z]], m = (b, y) => Math.hypot(b.x - y[0], b.z - y[1]) >= yHr;            // anchors ≥.2m apart
  for (let b = 1; b < s; b++) { const y = n[b]; m(y, f.at(-1)) && f.push([y.x, y.z]); }
  const g = n[s];
  return f.length > 1 && !m(g, f.at(-1)) && f.pop(), f.push([g.x, g.z]), { points: f, pace: u, durationS: o };
}


// ============================================================================
// PART F — PlanStore (rDr port). Signals → plain cached fields recomputed on store change.
// ============================================================================
const KIND_LABELS = { cube: () => 'Cube', sphere: () => 'Sphere', cylinder: () => 'Cylinder', humanoid: () => 'Person', simple_figure: () => 'Figure', camera: () => 'Camera', target: () => 'Target', spotlight: () => 'Spotlight', prop: () => 'Prop', group: () => 'Group' };
function DDe(t, e) { return t.name || `${KIND_LABELS[t.kind]?.() ?? 'Object'} ${e}`; }               // default label (i18n equiv)

export function replaceMoveFromSamples(facade, e, n, r, s) {                                          // show-store method (verbatim logic)
  const a = facade.objects, o = a[e], l = o?.kind === "camera";
  if (!o || !(l || Q0(o.kind))) return !1;
  const c = vHr(r); if (!c) return !1;
  const d = facade.trackIdOf(e) ?? facade.addPerformanceTrack(e); if (!d) return !1;
  const u = Zo(o, a).position[1], h = buildTangents(c.points.map(([v, x]) => [v, u, x])),
    f = s?.steady ? l ? YZt : Htt : Math.max(Qae, arcLength(polylineOf(h)) / c.durationS),
    m = facade.moveSegmentOf(d, n),
    g = s?.focusId && s.focusId !== e && a[s.focusId] ? s.focusId : null,
    b = { id: facade.an(), startS: Math.max(0, n), anchors: h, speedUnitsPerS: f, ...s?.steady ? {} : { pace: c.pace } },
    y = l ? { ...b, kind: "cam-path", aim: g ? "subject" : "locked", subjectId: g, ...m && "focalLengthMm" in m && m.focalLengthMm !== void 0 ? { focalLengthMm: m.focalLengthMm } : {} }
      : { ...b, kind: "path", ...o.kind === "humanoid" ? { gait: JCe } : {}, ...el(o.kind) ? g ? { aim: "subject", subjectId: g } : {} : { aim: "locked" } };
  return facade.updateTrackItems(d, v => [y, ...v.filter(x => x.id !== m?.id)]), !0;
}

// ---- height-curve family (verbatim: lBe/MZt/Sje/Kat/rre/Yhe/sLr/iLr/oLr/lLr/cLr/dLr/Tje/uLr/NZt/Kzt) ----
const lBe = .2, MZt = 4, eLr = .1, Zat = 1 / eLr, $ie = .02, iye = 9, aLr = .01;   // consts_curve
const rre = (t, e) => ({ u: t, heightM: e, in: [0, 0], out: [0, 0], auto: !0 });   // rre
const Sje = t => Math.round(t * Zat) / Zat;                                         // Sje — round to .1
const NZt = (t, e) => Math.min(e, Math.max(lBe, t));                                // NZt — clamp [.2, maxM]
const Kat = (t, e = MZt) => Sje(Math.max(lBe, Math.min(t, e)));                     // Kat — round+clamp
function Yhe(t) {                                                                   // Yhe — auto tangents ∓Δu/3
  return t.map((e, n) => {
    if (!e.auto) return e;
    const r = t[n - 1], s = t[n + 1];
    return { ...e, in: [r ? -(e.u - r.u) / 3 : 0, 0], out: [s ? (s.u - e.u) / 3 : 0, 0] };
  });
}
function iLr(t, e) {                                                                // iLr — pace remap (piecewise linear)
  if (!t || t.length < 2) return e;
  const n = e * (t.length - 1), r = Math.min(t.length - 2, Math.floor(n));
  return t[r] + (t[r + 1] - t[r]) * (n - r);
}
function sLr(t) {                                                                   // sLr — curve from item (9 samples or stored)
  if (t.heightCurve) return t.heightCurve;
  const e = polylineOf(t.anchors), n = arcLength(e),
    r = l => Math.max(0, pointAtDistance(e, iLr(t.pace, l) * n)[1]),
    s = Array.from({ length: iye }, (l, c) => r(c / (iye - 1))),
    o = s.every(l => Math.abs(l - s[0]) < aLr)
      ? [rre(0, s[0]), rre(1, s[s.length - 1])]
      : s.map((l, c) => rre(c / (iye - 1), l));
  return Yhe(o);
}
function oLr(t, e) {                                                                // oLr — press-on-line insert
  const n = t.findIndex(s => s.u > e);
  if (n <= 0 || e - t[n - 1].u < $ie || t[n].u - e < $ie) return null;
  const r = [...t];
  r.splice(n, 0, rre(e, heightAt(t, e)));
  return { curve: Yhe(r), index: n };
}
function lLr(t, e, n, r) {                                                          // lLr — point move (u neighbor-clamped, ends pinned)
  const s = t.length - 1,
    a = e === 0 ? 0 : e === s ? 1 : Math.min(t[e + 1].u - $ie, Math.max(t[e - 1].u + $ie, n.u)),
    o = t[e],
    l = { ...o, u: a, heightM: n.heightM, in: Tje(o.in, n.heightM, r), out: Tje(o.out, n.heightM, r) };
  return Yhe(t.map((c, d) => d === e ? l : c));
}
function dLr([t, e], n, r) { return [t, NZt(n + e, r) - n]; }                       // dLr — handle delta height-clamped
function Tje([t, e], n, r) {                                                        // Tje — keep handle height within range
  const s = n + e, a = NZt(s, r);
  if (a === s) return [t, e];
  const o = Math.max(0, (a - n) / e) || 0;
  return [t * o, e * o];
}
function cLr(t, e, n, r, s) {                                                       // cLr — handle drag (mirror unless Alt-broken)
  const a = t[e],
    o = n === "in" ? Math.min(r.u - a.u, -.005) : Math.max(r.u - a.u, .005),
    l = r.heightM - a.heightM,
    c = dLr([o, l], a.heightM, s.rangeM),
    d = n === "in" ? "out" : "in";
  let u = a[d];
  if (!s.broken) {
    const f = s.rangeM || 1,
      m = Math.hypot(c[0], c[1] / f) || 1,
      g = Math.hypot(u[0], u[1] / f) || Math.abs(o);
    u = Tje([-c[0] / m * g, -c[1] / m * g], a.heightM, s.rangeM);
  }
  const h = { ...a, [n]: c, [d]: u };
  delete h.auto;
  return t.map((f, m) => m === e ? h : f);
}
function uLr(t, e) {                                                                // uLr — remove interior point
  return e <= 0 || e >= t.length - 1 ? t : Yhe(t.filter((n, r) => r !== e));
}

function ujeH(obj, propDims) {                       // uje — object height (humanoid jP·scaleY / prop dims / aid 0)
  if (obj.kind === 'humanoid' || obj.kind === 'simple_figure') return 1.75 * obj.scale[1];
  const cat = obj.kind === 'prop' && obj.propKey ? propDims?.(obj.propKey) : undefined;
  if (cat) return (cat[1] || 1) * obj.scale[1];
  return obj.kind === 'target' || obj.kind === 'spotlight' ? 0 : obj.scale[1];
}
export class PlanStore {
  constructor(app) {
    this.a = app;
    this.drawingFor = null;
    this.matchDrawSpeed = true;
    this.rehearseTip = false; this.tipTimer = null;
    this.stroke = null; this.pendingWalkerFocus = null;
    this.zoomPercent = 100; this.zoomCommand = null; this._zoomSeq = 0;
    this.centerRequest = null; this._centerSeq = 0;
    this.drag = null;
    this._cache = null;           // {labels, entries, paths, drawnMoveIds, bounds} per store epoch
    this._epoch = 0;
    const bump = () => { this._epoch++; this._cache = null; };
    app.objects.subscribe?.(bump); app.show.subscribe?.(bump);
    // locked → cancel stroke (live disposer): drawing while playing refuses
    app.page.subscribe?.(() => { if (this.locked() && this.stroke) { this.stroke = null; this.strokeClock = null; this.a._drawPreview = null; } if (this.locked()) this.drawingFor = null; });
  }
  // ---- derived (recomputed lazily per epoch) ----
  _c() {
    if (this._cache) return this._cache;
    const objs = this.a.objects.all();
    const kindCount = {}; const labels = {};
    for (const [id, o] of Object.entries(objs)) { kindCount[o.kind] = (kindCount[o.kind] ?? 0) + 1; labels[id] = DDe(o, kindCount[o.kind]); }
    const entries = Object.entries(objs).filter(([, n]) => n.kind !== "group")
      .map(([n, r]) => ({ id: n, obj: r, label: labels[n] })).sort((n, r) => tit[n.obj.kind] - tit[r.obj.kind]);
    const paths = [];
    for (const r of this.a.show.show.tracks) {
      const s = objs[r.characterId]; if (!s) continue;
      for (const a of r.items) {
        if (a.kind === "transform" && a.keys?.length > 1) {
          const o = l => hL(Zo({ ...l, parentId: s.parentId }, objs).position);
          paths.push({ id: r.characterId, kind: s.kind, points: rit(a.keys, l => o(Bzt(a.keys, l))), keys: a.keys.map(o) });
        } else if ((a.kind === "path" || a.kind === "cam-path") && a.anchors?.length > 1) {
          const o = polylineOf(a.anchors).map(hL);
          paths.push({ id: r.characterId, kind: s.kind, points: o, keys: [o[o.length - 1]] });
        } else if (a.kind === "cam-transform" && a.keys?.length > 1) {
          const o = l => hL(camTransformKeysAt(a.keys, l).position);
          paths.push({ id: r.characterId, kind: s.kind, points: rit(a.keys, o), keys: a.keys.map(o => hL(o.position)) });
        }
      }
    }
    const drawnMoveIds = this.a.show.show.tracks.filter(e => e.items.some(n => (n.kind === "path" || n.kind === "cam-path") && n.anchors?.length > 1)).map(e => e.characterId);
    const bounds = uqt(entries.filter(({ obj: n }) => !fie(n.kind)).map(({ obj: n }) => Dst(n, Zo(n, objs), this._propDims())));
    this._cache = { labels, entries, paths, drawnMoveIds, bounds };
    return this._cache;
  }
  _propDims() { return this.a.propCatalogDims ?? (k => undefined); }
  labels() { return this._c().labels; }
  entries() { return this._c().entries; }
  cameraPills() { return this._c().entries.filter(({ obj: e }) => e.kind === "camera").map(({ id: e, label: n }) => ({ id: e, label: n })); }
  drawnMoveIds() { return this._c().drawnMoveIds; }
  paths() { return this._c().paths; }
  setBounds() { return this._c().bounds; }
  aspect() { return Am(this.a.page.recordAspect).aspect; }
  locked() { return !!this.a.page.playing; }                                                          // live: isPerformancePlaying || isRecording
  drawTarget() {
    const e = this.a.objects.selectedIds;
    const kind = e.length === 1 ? this.a.objects.get(e[0])?.kind : void 0;
    return kind === "camera" || (Q0(kind) && kind !== "group" && kind !== "target") ? e[0] : null;
  }
  targetPerson() { const e = this.drawTarget(), n = e ? this.a.objects.get(e)?.kind : void 0; return el(n) ? n : null; }
  drawing() { return !!this.drawingFor; }
  stroking() { return !!this.strokeClock; }
  toggleMatchDrawSpeed() { this.matchDrawSpeed = !this.matchDrawSpeed; this.a.markAutosave?.(); }
  // ---- height-curve editor (rDr heightMove family, verbatim) ----
  heightMaxM() {                                                                                     // rDr.heightMaxM
    const e = this.setBounds(), n = !!e && Math.max(e.maxX - e.minX, e.maxZ - e.minZ) > WLr;
    const objs = this.a.objects.all();
    let s = 0;
    for (const { id: o, obj: l } of this.entries()) {
      if (l.kind === 'camera' || l.kind === 'target' || l.kind === 'spotlight') continue;            // fie
      s = Math.max(s, this._objectMaxY(o, l, objs).maxY);
    }
    const a = n ? GLr : MZt;
    return s <= a ? a : Math.min(ZLr, Math.ceil(s + qLr));
  }
  _objectMaxY(id, obj, objs) {                                                                       // VDe @5264034 (same math as store.js)
    const propDims = this._propDims();
    if (obj.kind !== 'group') {
      const a = Zo(obj, objs);
      return { minY: a.position[1], maxY: a.position[1] + ujeH({ ...obj, scale: a.scale }, propDims) };
    }
    let lo = Infinity, hi = -Infinity;
    for (const [cid, c] of Object.entries(objs)) {
      if (c.parentId !== id || c.kind === 'camera' || c.kind === 'target' || c.kind === 'spotlight') continue;
      const a = Zo(c, objs);
      lo = Math.min(lo, a.position[1]);
      hi = Math.max(hi, a.position[1] + ujeH({ ...c, scale: a.scale }, propDims));
    }
    return lo === Infinity ? { minY: obj.position[1], maxY: obj.position[1] } : { minY: lo, maxY: hi };
  }
  heightMove() {                                                                                     // rDr.heightMove verbatim
    const e = this.a.objects.selectedIds, n = e.length === 1 ? e[0] : null;
    if (!n || this.a.objects.get(n)?.kind !== 'camera' || this.stroking()) return null;
    const r = this.a.show.show.tracks.find(a => a.characterId === n),
      s = r?.items.find(a => a.kind === 'cam-path' && a.anchors?.length > 1);
    if (!r || s?.kind !== 'cam-path') return null;
    return { trackId: r.id, itemId: s.id, startS: s.startS, durationS: itemDuration(s), curve: sLr(s), drawn: !!s.heightCurve, maxM: this.heightMaxM() };
  }
  heightCurveShown() { return !!this.heightMove(); }
  curveDrag = null;
  pressCurveLine(e) {                                                                                // press ON the line inserts a point
    const n = this.heightMove();
    if (this.locked() || !n) return null;
    const r = oLr(n.curve, e.u);
    if (!r) return null;
    this.holdCurve(r.index, null);
    this.writeCurve(r.curve);
    this.curveDrag.changed = !0;
    this.showCurveMoment(r.curve[r.index].u);
    return r.index;
  }
  pressCurvePoint(e, n = null) {
    const r = this.heightMove();
    if (this.locked() || !r?.curve[e]) return;
    this.holdCurve(e, n);
    this.showCurveMoment(r.curve[e].u);
  }
  dragCurve(e, n = !1) {
    const r = this.heightMove(), s = this.curveDrag;
    if (!r || !s) return;
    const a = { u: e.u, heightM: Kat(e.heightM, r.maxM) },
      o = s.side ? cLr(r.curve, s.index, s.side, e, { broken: n, rangeM: r.maxM }) : lLr(r.curve, s.index, a, r.maxM);
    this.writeCurve(o);
    s.changed = !0;
    this.showCurveMoment(o[s.index].u);
  }
  releaseCurve() {
    const e = this.curveDrag;
    if (!e) return;
    this.curveDrag = null;
    this.a.page.seek(e.returnS);
    this.a.show.endEditGesture();
    if (e.changed) this.a.onHeightDrawn?.({ updated: e.redrawn });   // toast hook (live onHeightDrawn)
  }
  scrubCurve(e) {
    if (this.locked()) return;
    this.showCurveMoment(Math.min(1, Math.max(0, e)));
  }
  removeCurvePoint(e) {
    const n = this.heightMove();
    if (this.locked() || !n) return;
    const r = uLr(n.curve, e);
    if (r !== n.curve) {
      this.a.show.beginEditGesture();
      this.writeCurve(r);
      this.a.show.endEditGesture();
    }
  }
  holdCurve(e, n) {
    this.a.show.beginEditGesture();
    this.curveDrag = { index: e, side: n, returnS: this.a.page.playheadS, redrawn: !!this.heightMove()?.drawn, changed: !1 };
  }
  writeCurve(e) {
    const n = this.heightMove();
    if (n) this.a.show.setPathHeightCurve(n.trackId, n.itemId, e);
  }
  showCurveMoment(e) {
    const n = this.heightMove();
    if (n) this.a.page.seek(n.startS + e * n.durationS);
  }
  // ---- zoom / center commands (seq'd like the live signals) ----
  zoomBy(kind) { this.zoomCommand = { kind, seq: ++this._zoomSeq }; }
  zoomIn() { this.zoomBy("in"); } zoomOut() { this.zoomBy("out"); } zoomToFit() { this.zoomBy("fit"); }
  reportZoom(e) { this.zoomPercent = e; this._onZoomPercent?.(e); }
  centerOn(e) { this.centerRequest = { id: e, seq: ++this._centerSeq }; }
  goToCamera(e) { this.a.objects.select([e]); this.centerOn(e); }
  // ---- items() (rDr.items verbatim) ----
  items() {
    const e = this.a.objects.all(), n = this.aspect(), r = this.labels(), propDims = this._propDims();
    return this._c().entries.map(({ id: s, obj: a, label: o }) => {
      const l = this.drag?.riding.get(s) ?? this.a.shownPose(s) ?? Zo(a, e),
        c = { id: s, kind: a.kind, parentId: a.parentId, footprint: Dst(a, l, propDims), label: o };
      if (a.parentId && (c.groupLabel = r[a.parentId]), a.kind === "simple_figure" && (c.headYawRad = i9(l.headRotation ?? a.headRotation ?? [0, 0, 0])), a.kind === "spotlight") {
        const d = TDe(l); d && (c.pool = { ...d, square: BR(a).shape === "square" });
      }
      if (a.kind === "camera") {
        const d = l.fovDeg ?? Z_(a.focalLengthMm ?? Hv, n);
        c.wedgeHalfRad = hqt(d, n);
        const u = l.position[1].toFixed(1);
        c.label = `${o} · ${u}m`;                                                                     // i18n aRvSeS equiv
        c.tag = o.split(" ").pop();
      }
      return c;
    });
  }
  // ---- intents (rDr.apply verbatim) ----
  apply(e) {
    for (const n of e) switch (n.type) {
      case "select": n.ids.length ? this.a.objects.select(n.ids) : this.a.objects.select([]); break;
      case "begin": this.drag = { start: new Map, aimDistance: new Map, carried: new Map, riding: new Map, warned: !1 }; this.a.show.beginEditGesture(); break;
      case "move": this.move(n.ids, n.dx, n.dz); break;
      case "yaw": this.turn(n.id, n.yawRad); break;
      case "lens": this.a.objects.update(n.id, { focalLengthMm: n.focalLengthMm }); this.a.markAutosave?.(); break;
      case "commit": this.drag = null; this.a.show.endEditGesture(); break;
      case "stroke-start": this.startStroke(n.at); break;
      case "stroke-move": if (this.stroke) {
        const { grab: r, pressAt: s } = this.stroke, a = Math.hypot(n.at.x - s.x, n.at.z - s.z), o = Math.max(0, 1 - a / tDr);
        this.stroke.at = { x: n.at.x + r.x * o, z: n.at.z + r.z * o };                                // grab-offset easing
      } break;
      case "stroke-end": this.endStroke(); break;
      case "focus": this.toggleFocus(n.id); break;
    }
  }
  deleteMove() {                                                                                      // update-state delete pill
    const e = this.drawTarget(), n = e ? this.a.show.show.tracks.find(a => a.characterId === e) : void 0,
      r = (n?.items ?? []).filter(a => (a.kind === "path" || a.kind === "cam-path") && a.anchors?.length > 1).sort((a, o) => a.startS - o.startS)[0];
    if (!e || !n || !r) return;
    const s = r.kind === "cam-path" && r.aim === "subject" ? r.subjectId : null;
    this.drawingFor = null;
    this.a.show.beginEditGesture();
    this.a.show.removeItem(n.id, r.id);
    s && this.setCameraFocus(e, s);
    this.a.show.endEditGesture();
  }
  toggleDrawing() { this.pendingWalkerFocus = null; this.drawingFor = this.drawing() ? null : this.drawTarget(); this.a.markAutosave?.(); }
  stopDrawing() { this.endStroke(), this.pendingWalkerFocus = null, this.drawingFor = null, this.hideRehearseTip(); }
  stepBack() {                                                                                         // Esc chain (stroke → drawing → selection)
    return this.stroke ? !0 : this.drawing() ? (this.drawingFor = null, !0) : this.a.objects.selectedIds.length ? (this.a.objects.select([]), !0) : !1;
  }
  drawFrame(e) {                                                                                       // per-frame: tick stroke + focus/dim info
    const n = this.stroke; n && this.tickStroke(n, e);
    const r = this.drawTarget(), s = r ? this.focusOf(r) : null;
    return { stroke: n ? n.samples : null, dimPathOf: this.drawing() ? r : null, focus: r && s ? { fromId: r, subjectId: s } : null };
  }
  restOfShowDurationS(excludeId) {                                                                     // rx over other tracks
    let d = 0;
    for (const t of this.a.show.show.tracks) {
      if (t.characterId === excludeId) continue;
      for (const it of t.items) d = Math.max(d, it.startS + itemDuration(it));
    }
    return d;
  }
  startStroke(e) {
    const n = this.drawTarget(), r = n ? this.a.objects.get(n) : void 0, s = n ? this.shownOrStored(n) : null;
    if (!n || !r || !s || !this.drawing()) return;
    const a = hL(s.position);
    this.hideRehearseTip();
    this.stroke = { id: n, kind: r.kind, at: a, grab: { x: a.x - e.x, z: a.z - e.z }, pressAt: e, startMs: null, samples: [{ ...a, t: 0 }], heightM: s.position[1], rotation: s.rotation, startRotation: s.rotation, facedFrom: a, focusId: this.focusOf(n) };
    this.strokeClock = { nowS: 0, ofS: this.restOfShowDurationS(n) };
    this.a.page.seek(0);                                                                               // rewind show to 0
  }
  tickStroke(e, n) {                                                                                   // time-based sampling (.05s OR any move) + per-tick seek
    e.startMs ??= n;
    const r = (n - e.startMs) / 1e3, s = e.samples[e.samples.length - 1];
    (r - s.t >= VLr || e.at.x !== s.x || e.at.z !== s.z) && e.samples.push({ ...e.at, t: Math.max(r, s.t) });
    this.a.page.seek(r);                                                                               // show plays while you draw
    this.a._drawPreview = this.previewPose(e, r);                                                      // 3D ghost (z port in main.js)
    const a = this.strokeClock, o = Math.floor(r * 10) / 10;
    a && a.nowS !== o && (this.strokeClock = { ...a, nowS: o }, this._onStrokeClock?.(this.strokeClock));
  }
  previewPose(e, n) {
    const r = [e.at.x, e.heightM, e.at.z];
    if (e.kind === "camera" && e.focusId) {
      const s = this.a.resolvers().aim(e.focusId, n);
      if (s) {
        const a = kv(r, s), o = Math.min(1, n / eDr);
        o >= 1 ? e.rotation = a : (uL.setFromEuler(xb.set(...e.startRotation, "XYZ")), qY.setFromEuler(xb.set(...a, "XYZ")), uL.slerp(qY, o * o * (3 - 2 * o)), xb.setFromQuaternion(uL, "XYZ"), e.rotation = [xb.x, xb.y, xb.z]);
      }
    } else if (el(e.kind)) {
      const s = e.at.x - e.facedFrom.x, a = e.at.z - e.facedFrom.z;
      Math.hypot(s, a) >= zLr && (e.rotation = [0, Math.atan2(-s, -a), 0], e.facedFrom = e.at);       // face-turn at .05m
      const o = e.focusId ? this.shownOrStored(e.focusId) : null;
      if (e.focusId && o) {
        const l = this.aimHeightOf(e.focusId), c = xM(i9(e.rotation), [e.at.x, e.heightM + CZt, e.at.z], [o.position[0], o.position[1] + l, o.position[2]]);
        return { id: e.id, position: r, rotation: [0, c.bodyYawRad, 0], look: c };
      }
    }
    return { id: e.id, position: r, rotation: e.rotation };
  }
  aimHeightOf(id) {                                                                                    // NP (VDe + uje + MIr=.5)
    const objs = this.a.objects.all(), o = objs[id]; if (!o) return 0;
    let minY = Infinity, maxY = -Infinity;
    if (o.kind === 'group') {
      for (const c of Object.values(objs)) {
        if (c.parentId !== id || fie(c.kind)) continue;
        const p = Zo(c, objs).position[1]; minY = Math.min(minY, p); maxY = Math.max(maxY, p + this._heightOf(c, objs));
      }
      if (minY === Infinity) { minY = o.position?.[1] ?? 0; maxY = minY; }
    } else { const p = Zo(o, objs).position[1]; minY = p; maxY = p + this._heightOf(o, objs); }
    const org = Zo(o, objs).position[1];
    return minY - org + .5 * Math.max(0, maxY - minY);
  }
  _heightOf(o, objs) {                                                                                 // uje
    if (el(o.kind)) return 1.75 * (o.scale?.[1] ?? 1);
    const e = o.kind === "prop" && o.propKey ? this._propDims()(o.propKey) : void 0;
    return e ? (e.dims?.[1] || 1) * (o.scale?.[1] ?? 1) : o.kind === "target" || o.kind === "spotlight" ? 0 : (o.scale?.[1] ?? 1);
  }
  endStroke() {
    const e = this.stroke; if (!e) return;
    this.stroke = null, this.strokeClock = null, this.a._drawPreview = null, this.a.page.stop();
    const n = this.drawnMoveIds().includes(e.id);
    this.a.show.beginEditGesture();
    const r = this.matchDrawSpeed, s = this._replaceMove(e.id, 0, e.samples, { focusId: e.focusId, steady: !r });
    this.a.show.endEditGesture(), this.drawingFor = null;
    s && (this.showRehearseTip(), this.a.onMoveDrawn?.({ itemKind: e.kind === "camera" ? "camera" : e.kind === "humanoid" ? "human" : e.kind === "simple_figure" ? "figure" : "prop", focus: !!e.focusId, durationS: e.samples[e.samples.length - 1].t, updated: n, matchDrawSpeed: r }));
    this.a.markAutosave?.();
  }
  _replaceMove(id, startS, samples, opts) {                                                            // replaceMoveFromSamples over my facade
    const show = this.a.show;
    const facade = {
      objects: this.a.objects.all(),
      trackIdOf: e => show.trackOf(e)?.id ?? null,
      addPerformanceTrack: e => show.ensureTrack(e)?.id ?? null,
      // live moveSegmentOf: covering-time selection with first-item fallback (incl. anchors≤1 + play items)
      moveSegmentOf: (trackId, s) => {
        const tr = show.show.tracks.find(t => t.id === trackId); if (!tr) return null;
        const cands = (tr.items ?? []).filter(o => o.kind === 'path' || o.kind === 'cam-path' || o.kind === 'play');
        return cands.find(o => s >= o.startS && s < o.startS + itemDuration(o)) ?? cands[0] ?? null;
      },
      updateTrackItems: (trackId, fn) => this._updateTrackItems(trackId, fn),                          // packed (lje)
      an: () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2)),
    };
    return replaceMoveFromSamples(facade, id, startS, samples, opts);
  }
  showRehearseTip() { this.hideRehearseTip(), this.rehearseTip = !0, this._onTip?.(!0), this.tipTimer = setTimeout(this.hideRehearseTip, ULr); }
  hideRehearseTip = () => { this.tipTimer && clearTimeout(this.tipTimer), this.tipTimer = null, this.rehearseTip && (this.rehearseTip = !1, this._onTip?.(!1)); };
  // ---- focus (camera: active cam-item subject / walker: path-item subject) ----
  activeCamItem(camId) {
    const tr = this.a.show.trackOf(camId); if (!tr) return null;
    return tr.items.find(i => (i.kind === 'cam-path' || i.kind === 'cam-move' || i.kind === 'cam-still') && i.aim === 'subject' && i.subjectId) ?? null;
  }
  activePathItem(walkerId) {
    const tr = this.a.show.trackOf(walkerId); if (!tr) return null;
    return tr.items.find(i => i.kind === 'path' && i.aim === 'subject' && i.subjectId) ?? null;
  }
  focusOf(e) {
    const n = this.a.objects.get(e)?.kind;
    if (n === "camera") return this.activeCamItem(e)?.subjectId ?? this.a.objects.get(e)?.targetId ?? null;
    if (!el(n)) return null;
    const r = this.pendingWalkerFocus;
    return this.activePathItem(e)?.subjectId ?? (r?.id === e && this.drawing() ? r.subjectId : null);
  }
  toggleFocus(e) {
    const n = this.drawTarget();
    if (n && el(this.a.objects.get(n)?.kind)) {                                                        // walker: patch path item subject
      const o = this.focusOf(n) === e;
      this.a.show.beginEditGesture();
      const tr = this.a.show.trackOf(n), it = tr?.items.find(i => i.kind === 'path' && i.anchors?.length > 1);
      let ok = false;
      if (it) { this.a.show.patchItem(tr.id, it.id, o ? { aim: 'travel', subjectId: null } : { aim: 'subject', subjectId: e }); ok = true; }
      this.a.show.endEditGesture();
      this.pendingWalkerFocus = ok || o ? null : { id: n, subjectId: e };
      return;
    }
    if (!n || this.a.objects.get(n)?.kind !== "camera") return;
    this.a.show.beginEditGesture();
    const s = this.focusOf(n) === e, tr = this.a.show.trackOf(n), it = tr?.items.find(i => (i.kind === 'cam-path') && i.anchors?.length > 1);
    if (it) this.a.show.patchItem(tr.id, it.id, s ? { aim: 'locked', subjectId: null } : { aim: 'subject', subjectId: e });
    this.a.show.endEditGesture();
  }
  setCameraFocus(camId, subjectId) {
    const tr = this.a.show.trackOf(camId), it = tr?.items.find(i => i.kind === 'cam-path' && i.anchors?.length > 1);
    if (it) this.a.show.patchItem(tr.id, it.id, { aim: 'subject', subjectId });
    else this.a.objects.update(camId, { targetId: subjectId });
  }
  // ---- move / turn / commit (rDr machinery; camera pipeline via manipulator SZt) ----
  startPose(e) { const n = this.drag?.start, r = n?.get(e); if (r) return r; const s = this.shownOrStored(e); return s && n && n.set(e, s), s; }
  _targetReferenced(e) { return this.a.objects.all()[e]?.kind === 'target' && Object.values(this.a.objects.all()).some(c => c.kind === 'camera' && c.targetId === e); } // Xu
  warnOnce(msg) { if (this.drag?.warned) return; if (this.drag) this.drag.warned = true; this.a.toast?.(msg); }
  shownOrStored(e) { const n = this.a.objects.all(), r = n[e]; return r ? this.a.shownPose(e) ?? Zo(r, n) : null; }
  toLocal(e, n) {
    const r = this.a.objects.get(e), s = { position: n.position, rotation: n.rotation, scale: n.scale ?? r?.scale ?? [1, 1, 1] },
      a = r?.parentId ? this.shownOrStored(r.parentId) : null;
    return a ? pie(a, s) : s;
  }
  move(e, n, r) {
    const s = c => { const d = this.startPose(c); return d ? { ...d, position: [d.position[0] + n, d.position[1], d.position[2] + r] } : null; },
      a = this.a.objects.all(), o = e.filter(c => this.carryPaths(c, n, r));
    for (const c of o) {                                                                               // camera-on-path: ride + target follows
      const d = s(c), u = a[c]; if (!d || !u) continue;
      this.drag?.riding.set(c, d);
      this.a.objects.update(c, { position: this.toLocal(c, d).position });
      const h = u.kind === "camera" ? u.targetId : void 0, f = h ? this.startPose(h) : null;
      h && f && this.a.objects.update(h, { position: this.toLocal(h, { ...f, position: [f.position[0] + n, f.position[1], f.position[2] + r] }).position });
    }
    const l = e.filter(c => !o.includes(c));
    if (l.length === 1) { const c = s(l[0]); c && this.commitOne(l[0], c, "translate"); return; }
    for (const c of l) {                                                                               // plain/group children: local compose + GA fold
      const d = s(c), u = a[c]; if (!d || !u) continue;
      const h = this.toLocal(c, d);
      this.a.objects.update(c, { ...h, rotation: GA(h.rotation, u.rotation ?? [0, 0, 0]) });
    }
  }
  carryPaths(e, n, r) {
    if (this.a.objects.get(e)?.kind === "camera") {
      const a = this.a.show.trackOf(e)?.items ?? [], o = this.a.page.playheadS;
      if (this.driveMode(a, o, "translate") !== "path-position") return !1;                            // _je: ONLY path-position cameras carry
    }
    const s = this.drag?.carried.get(e) ?? [0, 0];
    return this.shiftPaths(e, n - s[0], r - s[1]) ? (this.drag?.carried.set(e, [n, r]), !0) : !1;
  }
  driveMode(items, t, mode) {                                                                          // _je port
    let n = null;
    for (const it of items) { if (t < it.startS) break; if (['cam-path', 'cam-manual', 'cam-still', 'cam-move', 'cam-follow'].includes(it.kind)) n = it; if (t < it.startS + itemDuration(it)) break; }
    if (!n || t > n.startS + itemDuration(n)) return null;
    if (n.kind === 'cam-manual') return 'manual';
    if (mode !== 'rotate') return 'path-position';
    if ((n.aim ?? 'travel') !== 'locked') return 'path-look';
    return null;
  }
  shiftPaths(e, dx, dz) {                                                                              // live shiftPaths: path/cam-path anchors ONLY (Eit), zero-delta → true, packed
    if (dx === 0 && dz === 0) return !0;
    const tr = this.a.show.trackOf(e); if (!tr) return !1;
    const Eit = t => (t.kind === "path" || t.kind === "cam-path") && t.anchors?.length > 0;
    if (!tr.items.some(Eit)) return !1;
    this._updateTrackItems(tr.id, o => o.map(l => Eit(l)
      ? { ...l, anchors: l.anchors.map(a => ({ ...a, pos: [a.pos[0] + dx, a.pos[1], a.pos[2] + dz] })) }
      : l));
    return !0;
  }
  _updateTrackItems(trackId, fn) {                                                                     // live updateTrackItems: mutate + lje pack
    const tr = this.a.show.show.tracks.find(t => t.id === trackId);
    if (tr) { tr.items = packItems(fn(tr.items)); this.a.show.changed(); }
  }
  turn(e, n) {                                                                                          // world-Y premultiply (rebase for cameras)
    const r = this.a.objects.get(e), s = this.startPose(e);
    if (!r || !s || (r.kind === "target" && this._targetReferenced(e))) return;                         // Xu: paired targets don't turn
    if (r.kind === "camera") { this.a.manipulator?.commitPlanCamera(e, { ...s, rotation: (() => {
      uL.setFromEuler(xb.set(...s.rotation, "XYZ")), qY.setFromAxisAngle(nDr, n - i9(s.rotation)), xb.setFromQuaternion(uL.premultiply(qY), "XYZ");
      return [xb.x, xb.y, xb.z];
    })() }, "rotate", this); return; }
    uL.setFromEuler(xb.set(...s.rotation, "XYZ")), qY.setFromAxisAngle(nDr, n - i9(s.rotation)), xb.setFromQuaternion(uL.premultiply(qY), "XYZ");
    this.commitOne(e, { ...s, rotation: [xb.x, xb.y, xb.z] }, "rotate");
  }
  dispose() { this.stopDrawing(); }
  commitOne(e, n, r) {
    const a = this.a.objects.get(e); if (!a) return;
    if (a.kind !== "camera" && a.kind !== "target") {                                                    // kZt free commit (local + GA)
      const f = this.toLocal(e, n);
      this.a.manipulator?._commitPlanTransform?.(e, { ...f, rotation: GA(f.rotation, a.rotation ?? [0, 0, 0]) });
      return;
    }
    this.a.manipulator?.commitPlanCamera(e, n, r, this);                                                  // SZt pipeline
  }
}


// ============================================================================
// PART G — PlanCanvas (rBr port): pointer machine + rAF frame sequence + edge/label overlays
// ============================================================================
export function BZt(t) {                                                                              // palette from computed style
  const e = getComputedStyle(t);
  return { ...Object.fromEntries(Object.entries(aDr).map(([r, s]) => [r, e.getPropertyValue(s).trim()])), fontFamily: e.fontFamily };
}
function dye(t, e) {                                                                                  // event → canvas px (css-scale aware)
  const n = t.getBoundingClientRect();
  return { x: (e.clientX - n.left) * (t.clientWidth / Math.max(1e-6, n.width)), y: (e.clientY - n.top) * (t.clientHeight / Math.max(1e-6, n.height)) };
}
const easeCubicOut = Te => 1 - (1 - Te) ** 3;

// ---- height-curve editor panel (eFr @5439371 verbatim constants + interaction model) ----
const hRuler = 14, hChart = 64, hPad = 8, hPointHit = 8, hHandleHit = 7, hRes = 160;   // r8/A5/Lg/QRr/JRr/fat

export function buildCurvePanel(host, store, app) {
  const panel = document.createElement('div');
  panel.className = 'curve-panel';
  panel.style.display = 'none';
  panel.innerHTML = `<div class="curve-head"><span>Height</span><span class="curve-max"></span></div>`;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'curve-chart');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Camera height curve');
  panel.appendChild(svg);
  host.appendChild(panel);

  let drag = null;           // 'scrub' | 'curve'
  let selIdx = null;
  let width = 0;

  const xOf = u => hPad + u * (width - 2 * hPad);
  const yOf = (h, maxM) => hRuler + hChart - hPad - (h / maxM) * (hChart - 2 * hPad);
  const toPx = e => {
    const r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (svg.clientWidth / (r.width || 1)), y: (e.clientY - r.top) * (svg.clientHeight / (r.height || 1)) };
  };
  const toCurve = (px, maxM) => ({
    u: Math.min(1, Math.max(0, (px.x - hPad) / (width - 2 * hPad))),
    heightM: (hRuler + hChart - hPad - px.y) / (hChart - 2 * hPad) * maxM,
  });
  const hitPoint = (px, curve, maxM) => curve.findIndex(p => Math.hypot(px.x - xOf(p.u), px.y - yOf(p.heightM, maxM)) <= hPointHit);
  const sideOk = (i, side, len) => side === 'in' ? i > 0 : i < len - 1;
  const handleAt = (px, curve, maxM, i) => {
    for (const side of ['in', 'out']) {
      if (!sideOk(i, side, curve.length)) continue;               // verbatim C(i,side,len) gates INSIDE the find (review P3-9)
      const p = curve[i];
      const hx = xOf(p.u + p[side][0]), hy = yOf(p.heightM + p[side][1], maxM);
      if (Math.hypot(px.x - hx, px.y - hy) <= hHandleHit) return side;
    }
    return null;
  };

  function render() {
    const hm = store.heightMove();
    const show = !!hm && app.page.viewportMode === 'plan' && app.page.mode === 'edit' && !app.page.playing;
    panel.style.display = show ? 'flex' : 'none';
    if (!show || !hm) { svg.innerHTML = ''; return; }
    const { curve, maxM, startS, durationS, drawn } = hm;
    width = svg.clientWidth || 320;
    svg.setAttribute('viewBox', `0 0 ${width} ${hRuler + hChart}`);
    svg.setAttribute('width', width);
    svg.setAttribute('height', hRuler + hChart);
    panel.classList.toggle('drawn', !!drawn);
    panel.querySelector('.curve-max').textContent = `max ${maxM.toFixed(0)}m`;   // lltqsv equiv
    const parts = [];
    parts.push(`<rect class="curve-ruler" x="0" y="0" width="${width}" height="${hRuler}"/>`);
    for (const f of [.25, .5, .75]) parts.push(`<line class="curve-grid" x1="0" x2="${width}" y1="${hRuler + hPad + f * (hChart - 2 * hPad)}" y2="${hRuler + hPad + f * (hChart - 2 * hPad)}"/>`);
    // polyline (fat=160 ZA samples)
    const pts = [];
    for (let i = 0; i <= hRes; i++) { const u = i / hRes; pts.push(`${xOf(u).toFixed(1)},${yOf(heightAt(curve, u), maxM).toFixed(1)}`); }
    parts.push(`<polyline class="curve-line" points="${pts.join(' ')}"/>`);
    // playhead (tFr): vertical line at the current u when the playhead is inside the item
    const u = durationS > 0 ? (app.page.playheadS - startS) / durationS : -1;
    if (u >= 0 && u <= 1) parts.push(`<line class="curve-playhead" x1="${xOf(u)}" x2="${xOf(u)}" y1="${hRuler}" y2="${hRuler + hChart}"/>`);
    // selected point handles (C gate: in only i>0, out only i<len-1)
    if (selIdx !== null && curve[selIdx]) {
      const p = curve[selIdx];
      for (const side of ['in', 'out']) {
        if (!sideOk(selIdx, side, curve.length)) continue;
        const hx = xOf(p.u + p[side][0]), hy = yOf(p.heightM + p[side][1], maxM);
        parts.push(`<line class="curve-handle-arm" x1="${xOf(p.u)}" y1="${yOf(p.heightM, maxM)}" x2="${hx}" y2="${hy}"/>`);
        parts.push(`<circle class="curve-handle" cx="${hx}" cy="${hy}" r="4"/>`);
      }
      parts.push(`<text class="curve-value" x="${Math.min(xOf(p.u) + 9, width - 40)}" y="${Math.max(yOf(p.heightM, maxM) - 8, 11)}">${p.heightM.toFixed(1)}m</text>`);   // ceZTpI equiv
    }
    curve.forEach((p, i) => parts.push(`<circle class="curve-point${i === selIdx ? ' sel' : ''}" data-i="${i}" cx="${xOf(p.u)}" cy="${yOf(p.heightM, maxM)}" r="5"/>`));
    svg.innerHTML = parts.join('');
    if (store.locked()) svg.dataset.disabled = '';
    else svg.removeAttribute('data-disabled');
  }

  // recover from a lost pointerup BEFORE the main handler opens a fresh drag (review P0-1:
  // same-element listeners fire in registration order — registering after would release the
  // drag the main handler just opened on the same dispatch)
  svg.addEventListener('pointerdown', () => { if (store.curveDrag) store.releaseCurve(); });
  svg.addEventListener('pointerdown', e => {
    if (store.locked() || e.button !== 0) return;
    try { svg.setPointerCapture(e.pointerId); } catch { }
    const px = toPx(e);
    const hm = store.heightMove();
    if (!hm) return;
    if (px.y < hRuler) { drag = 'scrub'; store.scrubCurve(toCurve(px, hm.maxM).u); return; }
    drag = 'curve';
    if (selIdx !== null && hm.curve[selIdx]) {
      const side = handleAt(px, hm.curve, hm.maxM, selIdx);
      if (side) { store.pressCurvePoint(selIdx, side); return; }
    }
    const hit = hitPoint(px, hm.curve, hm.maxM);
    if (hit >= 0) { selIdx = hit; store.pressCurvePoint(hit, null); return; }
    const idx = store.pressCurveLine(toCurve(px, hm.maxM));
    selIdx = idx === null ? null : idx;
    if (idx === null) drag = null;
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const hm = store.heightMove();
    if (!hm) return;
    const px = toPx(e);
    if (drag === 'scrub') store.scrubCurve(toCurve(px, hm.maxM).u);
    else store.dragCurve(toCurve(px, hm.maxM), e.altKey);
  });
  const finish = () => { store.releaseCurve(); drag = null; };   // releaseCurve no-ops when no drag is open — heals lost pointerups
  svg.addEventListener('pointerup', finish);
  svg.addEventListener('pointercancel', finish);
  svg.addEventListener('dblclick', e => {
    const hm = store.heightMove();
    if (!hm || store.locked()) return;
    const hit = hitPoint(toPx(e), hm.curve, hm.maxM);
    if (hit > 0 && hit < hm.curve.length - 1) { selIdx = null; store.removeCurvePoint(hit); render(); }
  });

  function tick() {   // review P2-7: per-frame update touches ONLY the playhead line
    if (panel.style.display === 'none') return;
    const hm = store.heightMove();
    if (!hm) return;
    let line = svg.querySelector('.curve-playhead');
    const u = hm.durationS > 0 ? (app.page.playheadS - hm.startS) / hm.durationS : -1;
    if (u >= 0 && u <= 1) {
      if (!line) { render(); return; }             // rare: appeared — full render once
      line.setAttribute('x1', xOf(u));
      line.setAttribute('x2', xOf(u));
    } else if (line) line.remove();
  }

  return { render, tick };
}

export class PlanCanvas {
  constructor(app, host, store) {
    this.app = app; this.store = store; this.host = host;
    this.canvas = document.createElement('canvas');
    this.canvas.dataset.testid = 'stage-plan';
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:none;z-index:2;touch-action:none;';
    host.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.w = ELr();                    // local view/drag state (per-mount, NOT persisted — live)
    this.palette = null;
    this._panPx = null;                // middle/right pan anchor (N.current)
    this._lastMovePx = null;           // autopan anchor (j.current)
    this._lastFrameMs = null;          // I.current
    this._interacted = false;          // A.current (refit only until first interaction)
    this._centerEase = null;           // B.current {from,to,startMs}
    this._lastZoomSeq = null; this._lastCenterSeq = null;
    this._zoomPct = null; this._items = [];
    this._edge = [];
    this._tip = null;                  // tap-or-draw focus tooltip
    this._bar = null; this._camChip = null;
    this._buildBar();
    this._curve = buildCurvePanel(this.host, store, app);   // r8-2: height-curve editor (eFr port)
    this._wire();
    this._wireEscape();
    app.onViewportMode = () => this._syncShown();
    if (app.page?.subscribe) app.page.subscribe(() => { this._syncShown(); if (this.shown()) this._syncCurvePanel(); });
    if (app.objects?.subscribe) app.objects.subscribe(() => { if (this.shown()) { this._syncBar(true); this._syncCurvePanel(); } });
    if (app.show?.subscribe) app.show.subscribe(() => { if (this.shown()) { this._syncBar(true); this._syncCurvePanel(); } });
    this._onStrokeClock = this._onTip = null;
    store._onZoomPercent = v => { this._zoomPct = v; this._syncZoomBar(); };
    store._onStrokeClock = c => this._syncTimer(c);
    this._curveTick = () => this._curve && this.shown() && this._curve.render();
    store._onTip = on => this._syncBar();
    this.setVisible(app.page?.viewportMode === 'plan');
  }

  shown() { return this.app.page.viewportMode === 'plan' && this.app.page.mode === 'edit' && !this.app.page.playing; }
  _syncShown() {
    const on = this.shown();
    this.setVisible(on);
    if (this._bar) this._bar.style.display = on ? 'flex' : 'none';
    const pad = document.getElementById('navBallPad'), tb = document.getElementById('editToolbar');
    if (pad) pad.style.display = on ? 'none' : '';
    if (tb) tb.style.display = on ? 'none' : (this.app.objects?.selectedIds?.length ? 'flex' : 'none');
  }
  setVisible(v) { this.canvas.style.display = v ? 'block' : 'none'; if (v) { this.w = OLr(this.w); } }
  _syncCurvePanel() { if (this._curve) this._curve.render(); }   // r8-2: height-curve panel

  // ---- deps snapshot for reducers ($()) ----
  _deps() {
    return {
      items: this._items, selection: this.app.objects.selectedIds, aspect: this.store.aspect(),
      locked: this.store.locked(), drawing: this.store.drawing(), readOnly: false,
    };
  }

  // ---- the rBr frame sequence (verbatim order) ----
  tick(nowMs) {
    const Z = this.canvas, se = this.ctx;
    const q = Z.clientWidth, Y = Z.clientHeight;
    if (!se || q === 0 || Y === 0) return;
    if (!this.palette) this.palette = BZt(Z);
    const re = window.devicePixelRatio || 1, ae = Math.round(q * re), ie = Math.round(Y * re);
    (Z.width !== ae || Z.height !== ie) && (Z.width = ae, Z.height = ie);
    const Ee = this.store.drawFrame(nowMs);                                     // ticks the stroke + {stroke, dimPathOf, focus}
    if (this.shown()) this._curve?.tick();                                      // r8-2: playhead-only update (review P2-7: no full innerHTML churn per rAF)
    this._items = this.store.items();
    this.w = ILr(jLr(this.w, q, Y), this._items);                               // resize keeps world center; fit once
    const xe = this._lastFrameMs === null ? 0 : nowMs - this._lastFrameMs; this._lastFrameMs = nowMs;
    if (this._lastMovePx) {                                                     // autopan while dragging near edge
      const Se = BLr(this.w, this._deps(), this._lastMovePx, xe);
      this.w = Se.state, Se.intents.length && this.store.apply(Se.intents);
    }
    const ue = this.store.centerRequest;                                        // centerOn with 320ms cubic-out ease
    if (ue && ue.seq !== this._lastCenterSeq) {
      const Se = FLr(this.w, this._items, ue.id);
      if (Se !== this.w) {
        this._lastCenterSeq = ue.seq, this._interacted = true;
        const { centerX: me, centerZ: Te } = this.w.view;
        this._centerEase = { from: { x: me, z: Te }, to: { x: Se.view.centerX, z: Se.view.centerZ }, startMs: nowMs };
      }
    }
    if (this._centerEase) {
      const Se = this._centerEase, me = Math.min(1, (nowMs - Se.startMs) / nBr), Te = easeCubicOut(me);
      this.w = { ...this.w, view: { ...this.w.view, centerX: Se.from.x + (Se.to.x - Se.from.x) * Te, centerZ: Se.from.z + (Se.to.z - Se.from.z) * Te } };
      me >= 1 && (this._centerEase = null);
    }
    const je = this.store.zoomCommand;                                          // zoom −/fit/+ buttons
    if (je && je.seq !== this._lastZoomSeq) {
      this._lastZoomSeq = je.seq, this._interacted = true, this._centerEase = null;
      this.w = je.kind === "fit" ? OLr(this.w) : RLr(this.w, je.kind === "in" ? 1 : -1);
    }
    const ve = LLr(this.w);
    ve !== this._zoomPct && this.store.reportZoom(ve);
    const { view: oe, drag: ye } = this.w;
    se.setTransform(re, 0, 0, re, 0, 0);
    const focus = Ee.focus && { ...Ee.focus, label: 'Focus' };
    SDr(se, { view: oe, items: this._items, selection: new Set(this.app.objects.selectedIds), paths: this.store.paths(), palette: this.palette, marquee: ye?.kind === "marquee" ? ye.rect : null, dimPathOf: Ee.dimPathOf, stroke: Ee.stroke, focus });
    this._edge = $Ir(this._items, oe);
    FDr(se, this._edge, this.palette);
    this._syncCamChip(oe, Ee);                                                  // camera label overlay (ZIr)
  }

  _syncCamChip(oe, Ee) {
    const sel = this.app.objects.selectedIds, Ae = sel.length === 1 ? this._items.find(Se => Se.id === sel[0]) : void 0;
    if (!this._camChip || !Ae || Ae.kind !== 'camera' || Ee?.stroke) { if (this._camChip) this._camChip.hidden = true; return; }
    const Se = iu(oe, Ae.footprint), vis = Se.x >= 0 && Se.x <= oe.widthPx && Se.y >= 0 && Se.y <= oe.heightPx;
    this._camChip.hidden = !vis;
    if (vis) {
      this._camChip.textContent = Ae.label;
      if (!this._chipW || this._chipLbl !== Ae.label) { this._chipLbl = Ae.label; this._chipW = this._camChip.offsetWidth; this._chipH = this._camChip.offsetHeight; }
      const Te = ZIr(Ae, oe, { widthPx: this._chipW, heightPx: this._chipH });
      this._camChip.style.transform = `translate(${Te.x}px, ${Te.y}px)`;
    }
  }

  // ---- pointer machine (DLr/DZt/HLr via rBr wiring) ----
  _wire() {
    const Z = this.canvas;
    Z.addEventListener('contextmenu', e => e.preventDefault());
    Z.addEventListener('pointerdown', e => {
      if (!this.shown()) return;
      this._centerEase = null, this._interacted = true;
      if (e.button === 1 || e.button === 2) { e.preventDefault(); try { Z.setPointerCapture(e.pointerId); } catch (_) {} this._panPx = this._ev(e); return; }
      if (e.button !== 0) return;
      const p = this._ev(e);
      const X = this._edge.find(te => Math.hypot(p.x - te.x, p.y - te.y) <= uN + 3);   // edge-bubble click → goToCamera
      if (X) { this.store.goToCamera(X.id); return; }
      try { Z.setPointerCapture(e.pointerId); } catch (_) {}
      this._hoverTip(null);
      this._lastMovePx = this._ev(e);
      const U = DLr(this.w, this._deps(), this._evFull(e));
      this.w = U.state, U.intents.length && this.store.apply(U.intents);
    });
    Z.addEventListener('pointermove', e => {
      if (!this.shown()) return;
      if (!this.w.drag && !this._panPx) {                                             // edge-bubble hover cursor
        const p = this._ev(e);
        if (this._edge.some(te => Math.hypot(p.x - te.x, p.y - te.y) <= uN + 3)) { Z.style.cursor = 'pointer'; return; }
        if (Z.style.cursor === 'pointer') Z.style.cursor = this.store.drawing() ? 'crosshair' : '';
      }
      if (this._panPx) { const p = this._ev(e); this.w = PLr(this.w, p.x - this._panPx.x, p.y - this._panPx.y); this._panPx = p; return; }
      this.w.drag || this._hoverTip(this._ev(e));
      this._lastMovePx && (this._lastMovePx = this._ev(e));
      const U = DZt(this.w, this._deps(), this._evFull(e));
      this.w = U.state, U.intents.length && this.store.apply(U.intents);
    });
    Z.addEventListener('pointerleave', () => this._hoverTip(null));
    Z.addEventListener('pointerup', e => {
      if (this._panPx) { this._panPx = null; return; }
      if (e.button === 0) this._finish();
    });
    Z.addEventListener('pointercancel', () => { this._panPx = null; this._finish(); });
    Z.addEventListener('wheel', e => {                                                // NLr (RZt router not needed: no scrollables)
      if (!this.shown()) return;
      e.preventDefault(); e.stopPropagation();
      this._centerEase = null, this._interacted = true;
      this.w = NLr(this.w, { p: this._ev(e), dx: e.deltaX, dy: e.deltaY, deltaMode: e.deltaMode, zoom: e.ctrlKey || e.metaKey });
    }, { passive: false });
  }
  _finish() { this._lastMovePx = null; const U = HLr(this.w, this._deps()); this.w = U.state, U.intents.length && this.store.apply(U.intents); }
  _ev(e) { return dye(this.canvas, e); }
  _evFull(e) { return { p: dye(this.canvas, e), shift: e.shiftKey, mod: e.metaKey || e.ctrlKey }; }

  _hoverTip(p) {                                                                       // tap-or-draw focus tooltip (OZt)
    if (!this._tip) return;
    const te = p && !!this.store.drawing() && OZt(this.w, this._deps(), p);
    this.canvas.style.cursor = this.store.drawing() ? 'crosshair' : '';
    this._tip.hidden = !te;
    te && (this._tip.style.transform = `translate(${p.x + 18}px, ${p.y - 44}px)`);
  }

  _wireEscape() {                                                                      // sBr: Escape → stepBack chain
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || e.defaultPrevented || !this.shown()) return;
      this.store.stepBack() && e.preventDefault();
    });
  }

  // ---- plan bar (sBr layout: camera pills + RRr pill group + LRr timer + iFr zoom bar) ----
  _buildBar() {
    const bar = document.createElement('div');
    bar.className = 'plan-bar2';
    bar.style.display = 'none';
    bar.innerHTML = `
      <div class="pb-pills" id="pbCamPills" role="group" aria-label="Cameras"></div>
      <div class="pb-group" id="pbDrawGroup">
        <div class="pb-pills" id="pbPills">
          <button type="button" class="pb-pill" id="pbDrawBtn" aria-pressed="false"><span class="pb-ico">✎</span><span id="pbDrawLbl">Draw direction</span></button>
          <label class="pb-pill pb-speed" id="pbSpeedWrap" style="display:none"><input type="checkbox" id="pbMatchSpeed" checked> match speed</label>
          <button type="button" class="pb-pill" id="pbDelete" style="display:none"><span class="pb-ico">🗑</span> Delete</button>
          <div class="pb-person" id="pbPerson" role="group" aria-label="Person type" style="display:none">
            <button type="button" data-pk="simple_figure" aria-pressed="false">Figure</button>
            <button type="button" data-pk="humanoid" aria-pressed="false">Human</button>
          </div>
        </div>
        <div class="pb-cam-chip" id="pbCamChip" hidden></div>
      </div>
      <div class="pb-timer" id="pbTimer" role="timer" style="display:none"><i class="pb-dot"></i><span id="pbNow">0.0s</span><span class="pb-of" id="pbOf"></span></div>
      <div class="pb-zoom" role="group" aria-label="Zoom">
        <button type="button" id="pbZoomOut" aria-label="Zoom out">−</button>
        <button type="button" id="pbZoomFit" aria-label="Zoom to fit"><span id="pbZoomPct">100</span>%</button>
        <button type="button" id="pbZoomIn" aria-label="Zoom in">+</button>
      </div>`;
    this.host.appendChild(bar);
    this._bar = bar;
    this._camChip = bar.querySelector('#pbCamChip');
    // focus tip (uit.focusTip): its own element on the canvas host, like the live
    this._tip = document.createElement('div');
    this._tip.className = 'pb-focus-tip';
    this._tip.hidden = true;
    this._tip.textContent = 'Focus on this?';
    this.host.appendChild(this._tip);
    bar.querySelector('#pbDrawBtn').onclick = () => { this.store.toggleDrawing(); this._syncBar(); };
    bar.querySelector('#pbMatchSpeed').onchange = e => { this.store.matchDrawSpeed = e.target.checked; };
    bar.querySelector('#pbDelete').onclick = () => { this.store.deleteMove(); this._syncBar(); };
    bar.querySelectorAll('#pbPerson button').forEach(b => b.onclick = () => {
      const id = this.store.drawTarget(); if (!id) return;
      this.app.pickPersonKind?.(id, b.dataset.pk);
      this._syncBar();
    });
    bar.querySelector('#pbZoomOut').onclick = () => this.store.zoomOut();
    bar.querySelector('#pbZoomIn').onclick = () => this.store.zoomIn();
    bar.querySelector('#pbZoomFit').onclick = () => this.store.zoomToFit();
    this._syncBar();
  }
  _syncBar() {
    if (!this._bar) return;
    const st = this.store, b = this._bar;
    const drawn = st.drawnMoveIds().includes(st.drawTarget());
    const state = st.drawing() ? 'drawing' : drawn ? 'update' : 'draw';
    const btn = b.querySelector('#pbDrawBtn');
    btn.setAttribute('aria-pressed', state === 'drawing' ? 'true' : 'false');
    btn.classList.toggle('on', state === 'drawing');
    b.querySelector('#pbDrawLbl').textContent = state === 'drawing' ? 'Finish' : state === 'update' ? 'Update path' : 'Draw direction';
    b.querySelector('#pbSpeedWrap').style.display = state === 'drawing' ? '' : 'none';      // match-speed only while drawing
    b.querySelector('#pbMatchSpeed').checked = st.matchDrawSpeed;
    b.querySelector('#pbDelete').style.display = state === 'update' ? '' : 'none';
    const person = st.targetPerson();
    const pg = b.querySelector('#pbPerson');
    pg.style.display = person && state !== 'drawing' ? '' : 'none';
    pg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', person === x.dataset.pk ? 'true' : 'false'));
    // camera pills — hash ids+labels (P2: rename updates, no innerHTML when unchanged) + textContent (P2: no HTML injection)
    const pills = b.querySelector('#pbCamPills'), cams = st.cameraPills(), sel = this.app.objects.selectedIds;
    const hash = cams.map(c => c.id + '|' + c.label).join(',');
    if (this._camKeys !== hash) {
      this._camKeys = hash;
      pills.textContent = '';
      for (const c of cams) {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.dataset.cam = c.id; btn.title = c.label;
        const dot = document.createElement('i'); btn.appendChild(dot); btn.appendChild(document.createTextNode(c.label));
        btn.onclick = () => this.store.goToCamera(c.id);
        pills.appendChild(btn);
      }
    }
    pills.querySelectorAll('button').forEach(x => x.classList.toggle('on', sel.length === 1 && sel[0] === x.dataset.cam));
    this._syncZoomBar();
  }
  _syncZoomBar() { if (this._bar) this._bar.querySelector('#pbZoomPct').textContent = String(this._zoomPct ?? 100); }
  _syncTimer(c) {
    if (!this._bar) return;
    const t = this._bar.querySelector('#pbTimer');
    if (!c) { t.style.display = 'none'; return; }
    t.style.display = '';
    this._bar.querySelector('#pbNow').textContent = `${c.nowS.toFixed(1)}s`;
    this._bar.querySelector('#pbOf').textContent = c.ofS > 0 ? ` · of ${c.ofS.toFixed(1)}s` : '';
  }
}
