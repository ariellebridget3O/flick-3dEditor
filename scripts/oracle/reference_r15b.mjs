// reference_r15b.mjs — camera-shake family VERBATIM from the bundle (index-DBE17t4T.js):
//   gbe @3921445, Dzt @3921637 (c2r/d2r/u2r/h2r/p2r/f2r/m2r @3921310-3921637),
//   g2r @3921871, iEr @5190524 (rEr/sEr/aEr), oEr @5190652, cL @5446885.
import * as THREE from 'three';

const Ge = THREE.Vector3, qn = THREE.Quaternion, va = THREE.Euler;

const c2r = { positionOffset: [0, 0, 0], rotationOffsetDeg: [0, 0, 0] },
  d2r = { subtle: { posUnits: .005, rotDeg: .15 }, medium: { posUnits: .015, rotDeg: .4 }, heavy: { posUnits: .03, rotDeg: .9 } },
  u2r = [{ freqRatio: 1, weight: .55 }, { freqRatio: 2.618, weight: .3 }, { freqRatio: 6.854, weight: .15 }];
function gbe(t, e, n) {
  let r = 0;
  return u2r.forEach((s, a) => { r += s.weight * Math.sin(2 * Math.PI * e * s.freqRatio * t + n + a * 2.399) }), r;
}
const h2r = [.43, .53, .61], p2r = [.47, .59, .71], f2r = [0, 1.7, 3.4], m2r = [5.1, .9, 2.6];
function Dzt(t) {
  if (t.intensity === "off") return c2r;
  const e = d2r[t.intensity], n = (r, s, a) => [a * gbe(t.t, r[0], s[0]), a * gbe(t.t, r[1], s[1]), a * gbe(t.t, r[2], s[2])];
  return { positionOffset: n(h2r, f2r, e.posUnits), rotationOffsetDeg: n(p2r, m2r, e.rotDeg) };
}
function g2r(t) {
  const { t: e, phase: n, amount: r } = t, s = Math.sin(Math.PI * n),
    a = r * (.7 * Math.cos(2 * Math.PI * n) + .25 * Math.sin(2 * Math.PI * 7.3 * e)) + .12 * Math.sin(2 * Math.PI * .3 * e),
    o = r * .5 * Math.sin(Math.PI * n + .5), l = r * 1.3 * s;
  return { positionOffset: [0, r * .045 * (Math.abs(s) - .64), 0], rotationOffsetDeg: [a, o, l] };
}
const rEr = 3, sEr = .05, aEr = 15;
function iEr(t, e, n) {
  const r = e > aEr ? 0 : e, s = Math.min(1, r / rEr);
  return r <= sEr ? { phase: t, amount: s } : { phase: t + (1.6 + 1.4 * s) * n, amount: s };
}
function oEr(t) {
  const { shake: e } = t.rig;
  if (e === "off") return { pose: null, stridePhase: t.stridePhase };
  if (e !== "stride") return { pose: Dzt({ t: t.t, intensity: e }), stridePhase: t.stridePhase };
  const n = iEr(t.stridePhase, t.groundSpeedMps, t.dtS);
  return { pose: g2r({ t: t.t, phase: n.phase, amount: n.amount }), stridePhase: n.phase };
}
const DOr = new Ge, BOr = new va, HOr = new qn;
function cL(t, e) {
  const [n, r, s] = e.positionOffset, [a, o, l] = e.rotationOffsetDeg;
  n === 0 && r === 0 && s === 0 && a === 0 && o === 0 && l === 0 ||
    (t.position.add(DOr.set(n, r, s).applyQuaternion(t.quaternion)),
      t.quaternion.multiply(HOr.setFromEuler(BOr.set(THREE.MathUtils.degToRad(a), THREE.MathUtils.degToRad(o), THREE.MathUtils.degToRad(l)))));
}
const degToRad = THREE.MathUtils.degToRad;
export { gbe, Dzt, g2r, iEr, oEr, cL, degToRad, d2r, u2r, h2r, p2r, f2r, m2r, rEr, sEr, aEr };
