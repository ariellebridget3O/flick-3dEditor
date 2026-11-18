// run_oracle_r15b.mjs — camera-shake exactness: verbatim bundle family
// (reference_r15b.mjs) vs the editor port (editor/js/shake.js).
// Matrix: randomized t/intensity (Dzt), stride integrator trajectories (iEr over
// simulated frames), stride bounce (g2r), composer (oEr incl. off/unknown), apply (cL
// on a real camera with randomized non-zero offsets, including the all-zero skip).
import * as R from './reference_r15b.mjs';
import { shakeSine, shakeOffsets, strideShake, stridePhaseStep, rigShake, applyShakePose } from '/home/z/my-project/flick-3dEditor/editor/js/shake.js';
import { C } from '/home/z/my-project/flick-3dEditor/editor/js/const.js';
import * as THREE from 'three';

let PASS = 0, FAIL = 0; const FAILS = [];
const round = v => typeof v === 'number' ? (Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : v)
  : Array.isArray(v) ? v.map(round)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, round(x)]))
  : v;
const eq = (a, b, msg) => {
  const da = JSON.stringify(round(a)), db = JSON.stringify(round(b));
  if (da === db) PASS++;
  else { FAIL++; FAILS.push(`${msg}\n    ref: ${da.slice(0, 260)}\n    port: ${db.slice(0, 260)}`); }
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = rng(0xC0FFEE);

// constants parity first (assert the port reads the same tables)
eq({ d2r: R.d2r, u2r: R.u2r, h2r: R.h2r, p2r: R.p2r, f2r: R.f2r, m2r: R.m2r, rEr: R.rEr, sEr: R.sEr, aEr: R.aEr },
  { d2r: C.SHAKE_PRESETS, u2r: C.SHAKE_SINES.map(([f, w]) => ({ freqRatio: f, weight: w })), h2r: C.SHAKE_POS_FREQS, p2r: C.SHAKE_ROT_FREQS, f2r: C.SHAKE_POS_PHASES, m2r: C.SHAKE_ROT_PHASES, rEr: C.STRIDE_SPEED_FULL, sEr: C.STRIDE_SPEED_MIN, aEr: C.STRIDE_SPEED_MAX },
  'constant tables');

// 1. gbe / shakeSine
for (let i = 0; i < 30; i++) {
  const t = rand() * 20, f = 0.3 + rand(), ph = rand() * 10;
  eq(R.gbe(t, f, ph), shakeSine(t, f, ph), `gbe case ${i}`);
}

// 2. Dzt / shakeOffsets over all intensities x random t
for (const intensity of ['off', 'subtle', 'medium', 'heavy']) {
  for (let i = 0; i < 10; i++) {
    const t = rand() * 30;
    eq(R.Dzt({ t, intensity }), shakeOffsets({ t, intensity }), `Dzt ${intensity} t=${t.toFixed(3)}`);
  }
}

// 3. iEr / stridePhaseStep: simulated trajectories
for (const speed of [0, 0.04, 0.06, 0.5, 1, 2.9, 3, 5, 14.9, 15.1, 20]) {
  let rp = rand() * 5, pp = rp;
  for (let k = 0; k < 40; k++) {
    const dt = 1 / 30;
    const a = R.iEr(rp, speed, dt); rp = a.phase;
    const b = stridePhaseStep(pp, speed, dt); pp = b.phase;
    eq(a, b, `iEr speed=${speed} frame ${k}`);
  }
}

// 4. g2r / strideShake
for (let i = 0; i < 20; i++) {
  const t = rand() * 30, phase = rand() * 10, amount = rand();
  eq(R.g2r({ t, phase, amount }), strideShake({ t, phase, amount }), `g2r case ${i}`);
}

// 5. oEr / rigShake (incl. stride trajectories + off + preset rigs)
const RIGS = [
  { shake: 'off' }, { shake: 'subtle' }, { shake: 'medium' }, { shake: 'heavy' }, { shake: 'stride' },
];
for (const rig of RIGS) {
  let rp = rand() * 5, pp = rp;
  for (let k = 0; k < 25; k++) {
    const dt = 1 / 30, t = k * dt, speed = rand() * 8;
    const a = R.oEr({ rig, t, stridePhase: rp, groundSpeedMps: speed, dtS: dt }); rp = a.stridePhase;
    const b = rigShake({ rig, t, stridePhase: pp, groundSpeedMps: speed, dtS: dt }); pp = b.stridePhase;
    eq({ pose: a.pose, stridePhase: a.stridePhase }, { pose: b.pose, stridePhase: b.stridePhase }, `oEr shake=${rig.shake} frame ${k}`);
  }
}

// 6. cL / applyShakePose on a real camera — non-zero offsets (SAME pose applied to both)
for (let i = 0; i < 20; i++) {
  const pose = {
    position: [rand() * 4 - 2, 1 + rand(), rand() * 4 - 2],
    quaternion: [rand() - 0.5, rand() - 0.5, rand() - 0.5, rand() - 0.5],
  };
  const offs = {
    positionOffset: [rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1],
    rotationOffsetDeg: [rand() * 20 - 10, rand() * 20 - 10, rand() * 20 - 10],
  };
  const mk = () => {
    const cam = new THREE.PerspectiveCamera(35, 1.7, 0.1, 2000);
    cam.position.set(...pose.position);
    cam.quaternion.set(...pose.quaternion).normalize();
    return cam;
  };
  const cr = mk(), cp = mk();
  R.cL(cr, offs); applyShakePose(cp, offs);
  eq({ p: cr.position.toArray(), q: cr.quaternion.toArray() }, { p: cp.position.toArray(), q: cp.quaternion.toArray() }, `cL case ${i}`);
}
// all-zero skip: camera untouched
{
  const offs = { positionOffset: [0, 0, 0], rotationOffsetDeg: [0, 0, 0] };
  const cr = new THREE.PerspectiveCamera(), cp = new THREE.PerspectiveCamera();
  cr.position.set(1, 2, 3); cp.position.set(1, 2, 3);
  R.cL(cr, offs); applyShakePose(cp, offs);
  eq({ p: cr.position.toArray(), q: cr.quaternion.toArray() }, { p: cp.position.toArray(), q: cp.quaternion.toArray() }, 'cL zero-skip');
}
// real Dzt output through cL: subtle@t has non-zero offsets -> camera must MOVE
{
  const cam = new THREE.PerspectiveCamera();
  cam.position.set(0, 1.6, 6); cam.lookAt(0, 1, 0);
  const before = cam.position.clone();
  applyShakePose(cam, shakeOffsets({ t: 1.234, intensity: 'subtle' }));
  const moved = cam.position.distanceTo(before) > 1e-6;
  if (moved) PASS++; else { FAIL++; FAILS.push('cL subtle@1.234 did not move the camera'); }
}

console.log(`ORACLE R15B shake: PASS=${PASS} FAIL=${FAIL}`);
for (const f of FAILS) console.log('  FAIL ' + f);
process.exit(FAIL ? 1 : 0);
