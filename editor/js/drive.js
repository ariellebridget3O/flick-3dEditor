// drive.js — r17 verbatim port of the camera-drive family (index-DBE17t4T.js):
//   RU @5188990 (critically-damped spring: o=1/(1+a+.48a²+.235a³)), cje @5189757 (zero-snap),
//   GGt @5189518 (multi-axis spring w/ start/stop ease), XCr @5189209, Zrt/Krt initial states,
//   DGt @5185685 (stick deadzone .1 + pow curve), eC @5185527 (quat-rotate vec), OCr @5186081
//   (level basis), FCr @5185820 (stick → world velocity), JCr @5189906 (pan spring, tripod-only
//   panDegPerS), QCr @5189852 (pan idle test), qCr @5188742 (pitch clamp step), DQi @5188724
//   (pitch clamp), Yrt @5190119 (shortest-angle rate), YCr @5189298 (movement springs + q/e
//   vertical), tEr @5190213 (sideways speed), nEr @5190272 (roll: turnRoll·turn − strafeRoll·
//   sideways/top, clamp ±25°, spring, zero-snap), en @5664174 (the camera-mode drive tick),
//   G reset @5649455, rzr look @5609267 (PointerLockControls subclass; szr mouse-look with
//   zit=.002 rad/px × pointerSpeed, polar clamp), click-to-lock Je @5655723.
//   The drive camera pair: `aim` (yaw/pitch holder — mouse-look writes it) and `cam` (the
//   actual drive camera: yaw/pitch from the pan springs + roll from the roll spring).
import * as THREE from 'three';
import { C } from './const.js';

// ---- springs ----
export function springStep(t, target, tau, dt) {   // RU
  const s = 2 / Math.max(1e-4, tau);
  const a = s * dt;
  const o = 1 / (1 + a + .48 * a * a + .235 * a * a * a);
  const l = t.value - target;
  const c = (t.rate + s * l) * dt;
  return { value: target + (l + c) * o, rate: (t.rate - s * c) * o };
}
export const springZero = (t, target) =>   // cje(t, e) — snap to rest when target 0 + both parts tiny
  target === 0 && Math.abs(t.value) < C.SPRING_ZERO_EPS && Math.abs(t.rate) < C.SPRING_ZERO_EPS
    ? { value: 0, rate: 0 } : t;
export const ZERO_SPRING = () => ({ value: 0, rate: 0 });
export const MOVE_SPRINGS = () => [ZERO_SPRING(), ZERO_SPRING(), ZERO_SPRING()];   // Zrt
export const PAN_SPRINGS = () => [ZERO_SPRING(), ZERO_SPRING()];                   // Krt

// GGt — spring each axis toward the target vector; ease constant flips on decel/turn-back
export function springsStep(springs, target, rig, dt) {
  let s = 0, a = 0, o = 0;
  springs.forEach((d, u) => { s += d.value * d.value; a += target[u] * target[u]; o += d.value * target[u]; });
  const c = (a < s || o < 0) ? rig.stopEaseS : rig.startEaseS;
  return springs.map((d, u) => springStep(d, target[u], c, dt));
}
export const springValues = t => t.map(d => d.value);   // XCr

// ---- stick ----
export function curveStick(t, e, n) {    // DGt — deadzone + (s)^curve response
  const r = Math.hypot(t, e);
  if (r < C.STICK_DEADZONE) return [0, 0];
  const s = (Math.min(1, r) - C.STICK_DEADZONE) / (1 - C.STICK_DEADZONE);
  const a = Math.pow(s, n) / r;
  return [t * a, e * a];
}
export function quatRotate(t, e) {       // eC — rotate vec3 [x,y,z] by quat [x,y,z,w]
  const [n, r, s] = t, [a, o, l, c] = e;
  const d = 2 * (o * s - l * r), u = 2 * (l * n - a * s), h = 2 * (a * r - o * n);
  return [n + c * d + o * h - l * u, r + c * u + l * d - a * h, s + c * h + a * u - o * d];
}
export function levelBasis(t) {          // OCr — yaw-only forward/right (level rigs); null near vertical
  const e = quatRotate([0, 0, -1], t), n = quatRotate([0, 1, 0], t);
  let r = e[0] - n[0] * e[1], s = e[2] - n[2] * e[1];
  const a = Math.hypot(r, s);
  if (a < C.STICK_LEVEL_MIN) return null;
  r /= a; s /= a;
  return [[r, 0, s], [-s, 0, r]];
}
export function stickVelocity(t) {       // FCr — stick + aim → world velocity at max speed
  const [e, n] = curveStick(t.x, t.y, t.curve);
  if (e === 0 && n === 0) return [0, 0, 0];
  const r = t.level ? levelBasis(t.aim) : [quatRotate([0, 0, -1], t.aim), quatRotate([1, 0, 0], t.aim)];
  if (!r) return [0, 0, 0];
  const [s, a] = r, o = t.maxSpeedUnitsPerS;
  return [(a[0] * e + s[0] * n) * o, (a[1] * e + s[1] * n) * o, (a[2] * e + s[2] * n) * o];
}

// ---- pan (look) ----
export function panStep(t, e) {          // JCr — tripod-only pan: ±stick × panDegPerS rad/s
  const n = e.rig.speedMps === 0 ? e.panDegPerS * Math.PI / 180 : 0;
  const [r, s] = curveStick(e.stickX, e.stickY, e.rig.stickCurve);
  const a = -r * n, o = s * n;
  const [l, c] = springsStep(t, [a, o], e.rig, e.dtS);
  return [springZero(l, a), springZero(c, o)];
}
export const panIdle = t => t[0].value === 0 && t[1].value === 0;   // QCr
export function clampPitch(t) { return Math.max(-C.PITCH_MAX, Math.min(C.PITCH_MAX, t)); }  // DQi
export function pitchStep(t, e) {        // qCr — one clamped pitch increment
  const n = Math.min(-C.PITCH_MAX, t), r = Math.max(C.PITCH_MAX, t);
  return Math.min(r, Math.max(n, t + e)) - t;
}
export function turnRate(t, e, n) {      // Yrt — shortest-angle signed rate over dt
  if (n <= 0) return 0;
  const r = e - t;
  return Math.atan2(Math.sin(r), Math.cos(r)) / n;
}

// ---- movement + roll ----
export function moveStep(t, e) {         // YCr — springs toward the stick velocity (+ q/e vertical)
  const n = e.rig.speedMps === 0 ? 0 : e.speedMps;
  let r = stickVelocity({ x: e.stickX, y: e.stickY, aim: e.aim, maxSpeedUnitsPerS: n, curve: e.rig.stickCurve, level: e.rig.level });
  n > 0 && (r[1] += e.vertical * Math.max(C.VERTICAL_SPEED_FLOOR, n * C.VERTICAL_SPEED_FLOOR));
  const [s, a, o] = springsStep(t, r, e.rig, e.dtS);
  return [s, a, o];
}
export function sidewaysMps(t, e) {      // tEr — the right-axis speed at yaw e
  return t[0] * Math.cos(e) - t[2] * Math.sin(e);
}
export function rollStep(t, e) {         // nEr
  const n = e.rig.turnRoll * e.turnRadPerS - e.rig.strafeRoll * e.sidewaysMps / Math.max(.5, e.topMps);
  const r = Math.max(-1, Math.min(1, n)) * C.ROLL_MAX;
  return springZero(springStep(t, r, e.rig.rollEaseS, e.dtS), r);
}

// ---- the camera-mode drive (en @5664174) ----
// state: { aim (Object3D yaw/pitch), cam (Object3D yaw/pitch/roll), moveSprings, panSprings,
//          yaw/pitch/roll scalar mirrors, euler (YXZ scratch) }  — created by createDrive()
export function createDrive(aim, cam) {
  const st = {
    aim, cam,
    move: MOVE_SPRINGS(), pan: PAN_SPRINGS(),
    yaw: ZERO_SPRING(), pitch: ZERO_SPRING(), roll: ZERO_SPRING(),
    euler: new THREE.Euler(0, 0, 0, 'YXZ'),
  };
  st.reset = () => {                    // G @5649455 — seed from the drive cam, roll stripped
    st.euler.setFromQuaternion(st.cam.quaternion);
    st.euler.z = 0;
    st.aim.quaternion.setFromEuler(st.euler);
    st.yaw = { value: st.euler.y, rate: 0 };
    st.pitch = { value: st.euler.x, rate: 0 };
    st.roll = ZERO_SPRING();
    st.move = MOVE_SPRINGS();
    st.pan = PAN_SPRINGS();
  };
  st.tick = (dt, { rig, stickX, stickY, vertical, shift, speedMps, panDegPerS }) => {   // en
    let Re = stickX, it = stickY;
    const ct = Math.hypot(Re, it), At = shift ? C.CAM_DRIVE_SHIFT_STICK : 1;
    ct > 0 && (Re *= At / Math.max(1, ct), it *= At / Math.max(1, ct));
    const Dt = st.yaw.value;
    if (st.euler.setFromQuaternion(st.aim.quaternion), st.pan = panStep(st.pan, { stickX: Re, stickY: it, rig, panDegPerS, dtS: dt }), !panIdle(st.pan)) {
      const [Ht, Yt] = st.pan;
      const mn = Ht.value * dt, Nt = pitchStep(st.euler.x, Yt.value * dt);
      st.euler.y += mn; st.euler.x += Nt;
      st.aim.quaternion.setFromEuler(st.euler);
      st.yaw = { ...st.yaw, value: st.yaw.value + mn };
      st.pitch = { ...st.pitch, value: st.pitch.value + Nt };
    }
    // VERBATIM @5664119: O=RU(O, O.value+Yrt(O.value,V.y,1), lookEaseS, Ve) — the cam yaw
    // springs toward the AIM's euler yaw (mouse-look follows at the look-ease rate);
    // Yrt(a,b,1) = the wrapped delta. (r17 review P0-1: was mistranscribed as
    // turnRate(Dt, yaw, dt) — dead horizontal look + 5x tripod pan overshoot.)
    st.yaw = springStep(st.yaw, st.yaw.value + turnRate(st.yaw.value, st.euler.y, 1), rig.lookEaseS, dt);
    st.pitch = springStep(st.pitch, st.euler.x, rig.lookEaseS, dt);
    st.euler.set(st.pitch.value, st.yaw.value, 0);
    st.cam.quaternion.setFromEuler(st.euler);
    const zt = st.cam.quaternion;
    st.move = moveStep(st.move, { stickX: Re, stickY: it, vertical, aim: [zt.x, zt.y, zt.z, zt.w], rig, speedMps, dtS: dt });
    const Zt = springValues(st.move);
    st.cam.position.x += Zt[0] * dt;
    st.cam.position.y += Zt[1] * dt;
    st.cam.position.z += Zt[2] * dt;
    st.roll = rollStep(st.roll, { rig, turnRadPerS: turnRate(Dt, st.yaw.value, dt), sidewaysMps: sidewaysMps(Zt, st.yaw.value), topMps: speedMps, dtS: dt });
    st.roll.value && (st.euler.set(st.pitch.value, st.yaw.value, st.roll.value), st.cam.quaternion.setFromEuler(st.euler));
  };
  return st;
}

// ---- zoom log map (jCr/ICr/OGt @5184395..5184572): focal 14..200 ↔ t 0..1 (log scale) ----
const ZOOM_LOG_RANGE = Math.log(C.FOCAL_MM_MAX / C.FOCAL_MM_MIN);   // OGt
const clamp01 = t => Math.min(1, Math.max(0, t));                   // Vhe
export const zoomMm = t => C.FOCAL_MM_MIN * Math.exp(clamp01(t) * ZOOM_LOG_RANGE);   // jCr
export const zoomLog = t => clamp01(Math.log(t / C.FOCAL_MM_MIN) / ZOOM_LOG_RANGE);  // ICr

// ---- pointer-lock look (rzr @5609267 + szr @5609864) ----
// Minimal port: YXZ euler look on mousemove while locked; polar clamp [π/2−max, π/2−min];
// no base-class event plumbing — the editor polls isLocked via document.pointerLockElement.
const _e = new THREE.Euler(0, 0, 0, 'YXZ');
export function createLook(object, domElement, { onChange } = {}) {
  const look = {
    object, domElement,
    enabled: true,
    isLocked: false,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
    pointerSpeed: C.LOOK_POINTER_SPEED,
    lock() { domElement.requestPointerLock(); },
    unlock() { domElement.ownerDocument.exitPointerLock(); },
    dispose() {
      domElement.ownerDocument.removeEventListener('mousemove', look._onMove);
      domElement.ownerDocument.removeEventListener('pointerlockchange', look._onLockChange);
    },
  };
  look._onMove = t => {                 // szr
    if (look.enabled === false || look.isLocked === false) return;
    const e = look.object;
    _e.setFromQuaternion(e.quaternion);
    _e.y -= t.movementX * C.LOOK_RAD_PER_PX * look.pointerSpeed;
    _e.x -= t.movementY * C.LOOK_RAD_PER_PX * look.pointerSpeed;
    _e.x = Math.max(Math.PI / 2 - look.maxPolarAngle, Math.min(Math.PI / 2 - look.minPolarAngle, _e.x));
    e.quaternion.setFromEuler(_e);
    onChange?.();
  };
  look._onLockChange = () => {
    look.isLocked = look.domElement.ownerDocument.pointerLockElement === look.domElement;
  };
  domElement.ownerDocument.addEventListener('mousemove', look._onMove);
  domElement.ownerDocument.addEventListener('pointerlockchange', look._onLockChange);
  return look;
}
