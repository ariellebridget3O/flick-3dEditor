// shake.js — r15 verbatim port of the camera-shake family (index-DBE17t4T.js):
//   gbe @3921445 (3-octave golden-angle sine), Dzt @3921637 (off/subtle/medium/heavy),
//   g2r @3921871 (stride bounce), iEr @5190524 (stride phase integrator),
//   oEr @5190652 (rig shake composer: off | presets | stride), cL @5446885 (apply).
// The apply surface in the live: preview/output cameras get obj.shake via be/ce/pe
// (@5722716 — eval -> updateProjectionMatrix -> cL); the ACTIVE camera gets the rig-based
// (stride) shake in camera mode and the record-panel cameraShake otherwise (Y/q/re @5722200).
// Our port surfaces obj.shake on the through-the-lens feed (updateCameraThroughLens);
// the stride/rig path ships DORMANT (no cameraRig store state in the port — the live's
// rig picker belongs to the un-ported camera panel; oEr is provided for when it lands).
import * as THREE from 'three';
import { C } from './const.js';

// gbe — one shake channel: sum of 3 octaves with the golden-angle phase step
export function shakeSine(t, freq, phase) {
  let sum = 0;
  C.SHAKE_SINES.forEach((o, i) => { sum += o[1] * Math.sin(2 * Math.PI * freq * o[0] * t + phase + i * C.SHAKE_GOLDEN); });
  return sum;
}

const ZERO = () => ({ positionOffset: [0, 0, 0], rotationOffsetDeg: [0, 0, 0] });   // c2r

// Dzt — shake offsets for an intensity at time t
export function shakeOffsets({ t, intensity }) {
  if (intensity === 'off') return ZERO();
  const preset = C.SHAKE_PRESETS[intensity];
  const vec = (freqs, phases, amp) => [
    amp * shakeSine(t, freqs[0], phases[0]),
    amp * shakeSine(t, freqs[1], phases[1]),
    amp * shakeSine(t, freqs[2], phases[2]),
  ];
  return {
    positionOffset: vec(C.SHAKE_POS_FREQS, C.SHAKE_POS_PHASES, preset.posUnits),
    rotationOffsetDeg: vec(C.SHAKE_ROT_FREQS, C.SHAKE_ROT_PHASES, preset.rotDeg),
  };
}

// iEr — stride phase integrator: amount ramps 0..1 over 0..3 m/s, phase advances
// 1.6+1.4*amount per second while the ground speed exceeds sEr; >15 m/s kills the shake
export function stridePhaseStep(phase, groundSpeedMps, dtS) {
  const speed = groundSpeedMps > C.STRIDE_SPEED_MAX ? 0 : groundSpeedMps;
  const amount = Math.min(1, speed / C.STRIDE_SPEED_FULL);
  return speed <= C.STRIDE_SPEED_MIN
    ? { phase, amount }
    : { phase: phase + (1.6 + 1.4 * amount) * dtS, amount };
}

// g2r — stride bounce: vertical bob + roll/pitch sways keyed to the stride phase
export function strideShake({ t, phase, amount }) {
  const s = Math.sin(Math.PI * phase);
  const a = amount * (0.7 * Math.cos(2 * Math.PI * phase) + 0.25 * Math.sin(2 * Math.PI * 7.3 * t)) + 0.12 * Math.sin(2 * Math.PI * 0.3 * t);
  const o = amount * 0.5 * Math.sin(Math.PI * phase + 0.5);
  const l = amount * 1.3 * s;
  return {
    positionOffset: [0, amount * 0.045 * (Math.abs(s) - 0.64), 0],
    rotationOffsetDeg: [a, o, l],
  };
}

// oEr — the rig composer: off -> null pose; stride -> g2r via the integrator;
// otherwise Dzt at the rig's preset intensity
export function rigShake({ rig, t, stridePhase, groundSpeedMps, dtS }) {
  const shake = rig.shake;
  if (shake === 'off') return { pose: null, stridePhase };
  if (shake !== 'stride') return { pose: shakeOffsets({ t, intensity: shake }), stridePhase };
  const next = stridePhaseStep(stridePhase, groundSpeedMps, dtS);
  return { pose: strideShake({ t, phase: next.phase, amount: next.amount }), stridePhase: next.phase };
}

// cL — apply offsets to a camera: position += offset rotated into camera space,
// quaternion *= XYZ euler of the degree offsets (skipped when all-zero)
const _v = new THREE.Vector3(), _e = new THREE.Euler(), _q = new THREE.Quaternion();
export function applyShakePose(camera, { positionOffset, rotationOffsetDeg }) {
  const [x, y, z] = positionOffset, [a, o, l] = rotationOffsetDeg;
  if (x === 0 && y === 0 && z === 0 && a === 0 && o === 0 && l === 0) return;
  camera.position.add(_v.set(x, y, z).applyQuaternion(camera.quaternion));
  camera.quaternion.multiply(_q.setFromEuler(_e.set(THREE.MathUtils.degToRad(a), THREE.MathUtils.degToRad(o), THREE.MathUtils.degToRad(l))));
}
