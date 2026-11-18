// reference_r15.mjs — held-pose sampling family VERBATIM from the bundle (index-DBE17t4T.js):
//   Cye @5667050, Aot @5667128, fWr @5665638 (with oQ scratch @5665635), mBe @5636460
//   (+ Uie @5635998). Assembled with the vendored three (same build the editor ships).
// Byte-checked against the raw bundle before assembling (SKILL #37).
import * as THREE from 'three';

const Ge = THREE.Vector3, qn = THREE.Quaternion, va = THREE.Euler, di = THREE.Object3D;

// Uie (verbatim @5635998)
function Uie(t) { return { position: t.position.clone(), quaternion: t.quaternion.clone(), scale: t.scale.clone() }; }

// mBe (verbatim @5636460) — scratch: uot/hot quaternions, sQ euler
const uot = new qn, hot = new qn, sQ = new va;
function mBe(t, e) {
  return uot.copy(e.quaternion).invert(),
    hot.copy(uot).multiply(t.quaternion),
    sQ.setFromQuaternion(hot),
    {
      position: [t.position.x - e.position.x, t.position.y - e.position.y, t.position.z - e.position.z],
      rotation: [sQ.x, sQ.y, sQ.z],
      scale: [e.scale.x === 0 ? 1 : t.scale.x / e.scale.x, e.scale.y === 0 ? 1 : t.scale.y / e.scale.y, e.scale.z === 0 ? 1 : t.scale.z / e.scale.z],
    };
}

// Cye (verbatim @5667050)
function Cye(t, e, n, r) {
  const s = `${e}.${n}`, a = t.tracks.find(l => l.name === s);
  return a ? a.createInterpolant().evaluate(r) : null;
}

// Aot (verbatim @5667128)
function Aot(t, e, n, r) {
  const s = Uie(n), a = Cye(t, e, "position", r), o = Cye(t, e, "quaternion", r), l = Cye(t, e, "scale", r);
  return {
    position: a ? new Ge(a[0], a[1], a[2]) : s.position,
    quaternion: o ? new qn(o[0], o[1], o[2], o[3]) : s.quaternion,
    scale: l ? new Ge(l[0], l[1], l[2]) : s.scale,
  };
}

// fWr (verbatim @5665638) — oQ scratch Object3D @5665635
const oQ = new di;
function fWr(t, e) {
  const n = {};
  for (const [r, s] of Object.entries(e)) {
    const a = t[r];
    a && (oQ.position.copy(s.position), oQ.quaternion.copy(s.quaternion), oQ.scale.copy(s.scale), n[r] = mBe(oQ, a));
  }
  return n;
}

export { Uie, mBe, Cye, Aot, fWr };
