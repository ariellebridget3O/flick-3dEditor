// run_oracle_r15.mjs — held-pose sampling exactness: verbatim bundle family
// (reference_r15.mjs) vs the editor port (editor/js/figures.js joint family).
// Matrix: randomized synthetic AnimationClips + bones, full/missing-track fallback
// paths, identity-pose degenerate case, scale-zero guard. 1e-4 rounding before compare.
import * as R from './reference_r15.mjs';
import {
  clipTrackSample, sampleBonePose, diffRigPose, jointOffset, jointSnapshot,
} from '/home/z/my-project/flick-3dEditor/editor/js/figures.js';
import * as THREE from 'three';

let PASS = 0, FAIL = 0; const FAILS = [];
const round = v => typeof v === 'number' ? (Number.isFinite(v) ? Math.round(v * 1e4) / 1e4 : v)
  : Array.isArray(v) ? v.map(round)
  : v && typeof v === 'object' && v.isVector3 || v && v.isQuaternion || v && v.isEuler ? { x: round(v.x), y: round(v.y), z: round(v.z), w: v.w !== undefined ? round(v.w) : undefined }
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, round(x)]))
  : v;
const eq = (a, b, msg) => {
  const da = JSON.stringify(round(a)), db = JSON.stringify(round(b));
  if (da === db) PASS++;
  else { FAIL++; FAILS.push(`${msg}\n    ref: ${da.slice(0, 300)}\n    port: ${db.slice(0, 300)}`); }
};

// deterministic PRNG (mulberry32)
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const BONES = ['DEF-hips', 'DEF-spine', 'DEF-upper_armL', 'DEF-head', 'DEF-footR'];

function makeClipClean(rand, opts = {}) {
  const tracks = [];
  for (const b of BONES) {
    if (opts.drop === b) continue;
    const n = 1 + Math.floor(rand() * 3);
    const times = Array.from({ length: n }, (_, i) => n === 1 ? 0 : i / (n - 1) * 2);
    const pos = new Float32Array(n * 3), scl = new Float32Array(n * 3), qua = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = rand() * 2 - 1; pos[i * 3 + 1] = rand() * 2 - 1; pos[i * 3 + 2] = rand() * 2 - 1;
      scl[i * 3] = 0.2 + rand(); scl[i * 3 + 1] = 0.2 + rand(); scl[i * 3 + 2] = 0.2 + rand();
      const x = rand() * 2 - 1, y = rand() * 2 - 1, z = rand() * 2 - 1, w = rand() * 2 - 1;
      const m = Math.hypot(x, y, z, w) || 1;
      qua[i * 4] = x / m; qua[i * 4 + 1] = y / m; qua[i * 4 + 2] = z / m; qua[i * 4 + 3] = w / m;
    }
    tracks.push(new THREE.VectorKeyframeTrack(`${b}.position`, times, [...pos]));
    tracks.push(new THREE.QuaternionKeyframeTrack(`${b}.quaternion`, times, [...qua]));
    tracks.push(new THREE.VectorKeyframeTrack(`${b}.scale`, times, [...scl]));
  }
  return new THREE.AnimationClip('synth', 2, tracks);
}

function makeBone(rand) {
  const o = new THREE.Object3D();
  o.position.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1);
  o.quaternion.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
  o.scale.set(0.2 + rand(), 0.2 + rand(), 0.2 + rand());
  return o;
}

// ---- 1. sampleBonePose vs Aot: 40 randomized cases (full tracks + per-channel drops) ----
const rand = rng(7151);
for (let i = 0; i < 40; i++) {
  const clip = makeClipClean(rand, { drop: i % 7 === 0 ? BONES[i % BONES.length] : null });
  const bone = makeBone(rand);
  const t = rand() * 2;
  const name = BONES[i % BONES.length];
  eq(R.Aot(clip, name, bone, t), sampleBonePose(clip, name, bone, t), `Aot case ${i} (${name} t=${t.toFixed(3)})`);
}

// ---- 2. missing-bone track entirely → Uie fallback for ALL channels ----
{
  const clip = new THREE.AnimationClip('empty', 1, []);
  const bone = makeBone(rand);
  eq(R.Aot(clip, 'DEF-hips', bone, 0.5), sampleBonePose(clip, 'DEF-hips', bone, 0.5), 'Aot empty-clip fallback');
}

// ---- 3. diffRigPose vs fWr composition (pose vs idle, incl. idle-missing joints) ----
for (let i = 0; i < 30; i++) {
  const idleClip = makeClipClean(rand), poseClip = makeClipClean(rand, { drop: i % 5 === 0 ? 'DEF-spine' : null });
  const bones = new Map(BONES.map(b => [b, makeBone(rand)]));
  const idle = {}, pose = {};
  for (const [name, bone] of bones) {
    idle[name] = R.Aot(idleClip, name, bone, 0);
    pose[name] = R.Aot(poseClip, name, bone, 0);
  }
  delete pose[BONES[1]];                       // fWr skips pose joints absent from... (actually skips when IDLE lacks it — mirror by deleting idle side in a variant)
  eq(R.fWr(idle, pose), diffRigPose(idle, pose), `fWr case ${i}`);
}
// fWr skips joints missing from the IDLE map:
{
  const idleClip = makeClipClean(rand), poseClip = makeClipClean(rand);
  const bone = makeBone(rand);
  const idle = { 'DEF-hips': R.Aot(idleClip, 'DEF-hips', bone, 0) };
  const pose = { 'DEF-hips': R.Aot(poseClip, 'DEF-hips', bone, 0), 'DEF-head': R.Aot(poseClip, 'DEF-head', bone, 0) };
  eq(R.fWr(idle, pose), diffRigPose(idle, pose), 'fWr idle-missing joint skip');
}

// ---- 4. mBe vs jointOffset direct (incl. zero-scale guard) ----
for (let i = 0; i < 20; i++) {
  const pose = makeBone(rand);
  const ref = makeBone(rand);
  if (i % 5 === 0) ref.scale.set(0, 1, 1);     // zero-scale guard branch
  eq(R.mBe(pose, ref), jointOffset(pose, ref), `mBe case ${i}`);
}

// ---- 5. identity/degenerate: pose === idle → empty diff; empty pose map → empty diff ----
{
  const bone = makeBone(rand);
  const p = R.Aot(makeClipClean(rand), 'DEF-hips', bone, 0);
  eq(R.fWr({ 'DEF-hips': p }, { 'DEF-hips': p }), diffRigPose({ 'DEF-hips': p }, { 'DEF-hips': p }), 'fWr identical pose');
  eq(R.fWr({}, {}), diffRigPose({}, {}), 'fWr empty maps');
}

// ---- 6. Cye direct: track-name lookup + interpolant value ----
for (let i = 0; i < 15; i++) {
  const clip = makeClipClean(rand);
  const name = BONES[i % BONES.length];
  const t = rand() * 2;
  eq(R.Cye(clip, name, 'position', t), clipTrackSample(clip, name, 'position', t), `Cye case ${i}`);
  eq(R.Cye(clip, 'DEF-nope', 'position', t), clipTrackSample(clip, 'DEF-nope', 'position', t), `Cye missing case ${i}`);
}

console.log(`ORACLE R15 held-pose: PASS=${PASS} FAIL=${FAIL}`);
for (const f of FAILS) console.log('  FAIL ' + f);
process.exit(FAIL ? 1 : 0);
