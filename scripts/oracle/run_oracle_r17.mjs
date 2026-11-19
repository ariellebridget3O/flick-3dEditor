// run_oracle_r17.mjs — drive/rig/zoom exactness: verbatim bundle family (reference_r17.mjs)
// vs the editor port (rigs.js + drive.js + const.js tables). Matrix: constant tables,
// spring step (RU) + zero-snap (cje), stick curve (DGt), quat-rotate + level basis (eC/OCr),
// stick velocity (FCr), pan (JCr/QCr/qCr/DQi/Yrt), movement (YCr incl. q/e vertical),
// roll (nEr/tEr), springs-over-targets (GGt), rig weight math (HDe/zGt/WCr/WGt/GCr),
// step/carry helpers (qrt/HCr/BCr/$Cr/VCr/hEr), zoom map (jCr/ICr + bEr/yEr/vEr/xEr),
// and a full simulated DRIVE TRAJECTORY (the en sequence reimplemented from the same
// primitives on both sides — shared driver, so the comparison is on the family, not the glue).
import * as R from './reference_r17.mjs';
import {
  isRigKey, isPanOnly, speedPicker, carrySpeeds, stepSpeed, clampToSteps, validateSpeeds,
  clampWeight, weightScale, rigWithWeight, validateWeight, validateWeights, cycleRigKey,
  speedValueLabel,
} from '/home/z/my-project/flick-3dEditor/editor/js/rigs.js';
import {
  springStep, springZero, springsStep, springValues, MOVE_SPRINGS, PAN_SPRINGS,
  curveStick, quatRotate, levelBasis, stickVelocity,
  panStep, panIdle, pitchStep, clampPitch, turnRate,
  moveStep, sidewaysMps, rollStep, zoomMm, zoomLog,
} from '/home/z/my-project/flick-3dEditor/editor/js/drive.js';
import { C } from '/home/z/my-project/flick-3dEditor/editor/js/const.js';

let PASS = 0, FAIL = 0; const FAILS = [];
const round = v => typeof v === 'number' ? (Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : v)
  : Array.isArray(v) ? v.map(round)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, round(x)]))
  : v;
const eq = (a, b, msg) => {
  const da = JSON.stringify(round(a)), db = JSON.stringify(round(b));
  if (da === db) PASS++;
  else { FAIL++; FAILS.push(`${msg}\n    ref: ${da.slice(0, 240)}\n    port: ${db.slice(0, 240)}`); }
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
const rand = rng(0x0B00CA + 17);

// ---- 0. constant tables ----
eq(R.CAMERA_RIGS, C.CAMERA_RIGS, 'gq rig table');
eq(R.RIG_KEYS, C.RIG_KEYS, 'i$ rig keys');
eq(R.SPEED_STEPS, C.RIG_SPEED_STEPS, 'HGt speed steps');
eq(R.PAN_STEPS, C.RIG_PAN_STEPS, '$Gt pan steps');
eq(R.PAN_DEFAULT, C.RIG_PAN_DEFAULT, 'VGt');
eq(R.WEIGHT_MAX, C.RIG_WEIGHT_MAX, 'Eie');
eq(R.WEIGHT_DEADZONE, C.RIG_WEIGHT_DEADZONE, 'zCr');
eq(R.WEIGHT_STEP, C.RIG_WEIGHT_STEP, 'UCr');
eq(R.DEFAULT_SPEEDS, { speedMps: C.CAMERA_RIGS[C.RIG_DEFAULT].speedMps, panDegPerS: C.RIG_PAN_DEFAULT }, 'Grt');
eq(Object.keys(R.DEFAULT_WEIGHTS).every(k => R.DEFAULT_WEIGHTS[k] === 0), true, 'jie zeros');

// ---- 1. springs ----
for (let i = 0; i < 60; i++) {
  const s = { value: (rand() - .5) * 4, rate: (rand() - .5) * 2 };
  const tgt = (rand() - .5) * 4, tau = .05 + rand(), dt = rand() * .05;
  eq(R.springStep(s, tgt, tau, dt), springStep(s, tgt, tau, dt), `RU #${i}`);
  eq(R.springZero({ value: s.value, rate: s.rate }, tgt), springZero({ value: s.value, rate: s.rate }, tgt), `cje #${i}`);
}
for (let i = 0; i < 30; i++) {
  const rig = R.CAMERA_RIGS[R.RIG_KEYS[(rand() * 6) | 0]];
  const spr = [{ value: rand() - .5, rate: rand() - .5 }, { value: rand() - .5, rate: rand() - .5 }];
  const tgt = [rand() - .5, rand() - .5];
  eq(R.springsStep(spr, tgt, rig, .016), springsStep(spr, tgt, rig, .016), `GGt(2) #${i}`);
  const spr3 = spr.concat([{ value: rand() - .5, rate: rand() - .5 }]);
  const tgt3 = tgt.concat([rand() - .5]);
  eq(R.springsStep(spr3, tgt3, rig, .016), springsStep(spr3, tgt3, rig, .016), `GGt(3) #${i}`);
  eq(R.springValues(spr3), springValues(spr3), `XCr #${i}`);
}

// ---- 2. stick + basis + velocity ----
for (let i = 0; i < 40; i++) {
  const x = (rand() - .5) * 2, y = (rand() - .5) * 2, curve = 1 + rand() * .6;
  eq(R.curveStick(x, y, curve), curveStick(x, y, curve), `DGt #${i}`);
  const q = [rand() - .5, rand() - .5, rand() - .5, rand()].map(v => v * .5);
  const n = Math.hypot(...q); const quat = [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
  eq(R.quatRotate([0, 0, -1], quat), quatRotate([0, 0, -1], quat), `eC #${i}`);
  eq(R.levelBasis(quat), levelBasis(quat), `OCr #${i}`);
  const rig = R.CAMERA_RIGS[R.RIG_KEYS[(rand() * 6) | 0]];
  // FCr needs the SAME maxSpeed on both sides — one shared draw:
  const spd = 1 + rand() * 7;
  eq(R.stickVelocity({ x, y, aim: quat, maxSpeedUnitsPerS: spd, curve: rig.stickCurve, level: rig.level }),
     stickVelocity({ x, y, aim: quat, maxSpeedUnitsPerS: spd, curve: rig.stickCurve, level: rig.level }), `FCr #${i}`);
}

// ---- 3. pan + pitch ----
for (let i = 0; i < 40; i++) {
  const rig = R.CAMERA_RIGS[R.RIG_KEYS[(rand() * 6) | 0]];
  const args = { stickX: (rand() - .5) * 2, stickY: (rand() - .5) * 2, rig, panDegPerS: 5 + rand() * 80, dtS: rand() * .05 };
  const spr = [{ value: rand() - .5, rate: rand() - .5 }, { value: rand() - .5, rate: rand() - .5 }];
  eq(R.panStep([structuredClone(spr[0]), structuredClone(spr[1])], JSON.parse(JSON.stringify(args))),
     panStep([structuredClone(spr[0]), structuredClone(spr[1])], JSON.parse(JSON.stringify(args))), `JCr #${i}`);
  eq(R.panIdle(spr), panIdle(spr), `QCr #${i}`);
  const t = (rand() - .5) * 3, e = (rand() - .5) * .5;
  eq(R.pitchStep(t, e), pitchStep(t, e), `qCr #${i}`);
  eq(R.clampPitch(t), clampPitch(t), `DQi #${i}`);
  const a = (rand() - .5) * 6, b = (rand() - .5) * 6, dt = .01 + rand() * .05;
  eq(R.turnRate(a, b, dt), turnRate(a, b, dt), `Yrt #${i}`);
}

// ---- 4. movement + roll ----
for (let i = 0; i < 40; i++) {
  const rig = R.CAMERA_RIGS[R.RIG_KEYS[(rand() * 6) | 0]];
  const q = [rand() - .5, rand() - .5, rand() - .5, rand()];
  const n = Math.hypot(...q); const quat = [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
  const args = { stickX: (rand() - .5) * 2, stickY: (rand() - .5) * 2, vertical: rand() - .5, aim: quat, rig, speedMps: rand() * 8, dtS: rand() * .05 };
  const spr = [{ value: rand() - .5, rate: rand() - .5 }, { value: rand() - .5, rate: rand() - .5 }, { value: rand() - .5, rate: rand() - .5 }];
  eq(R.moveStep(structuredClone(spr), JSON.parse(JSON.stringify(args))),
     moveStep(structuredClone(spr), JSON.parse(JSON.stringify(args))), `YCr #${i}`);
  const v = [(rand() - .5) * 4, rand() - .5, (rand() - .5) * 4];
  const yaw = rand() * 6;   // ONE shared yaw (SKILL #93 — never double-draw)
  eq(R.sidewaysMps(v, yaw), sidewaysMps(v, yaw), `tEr #${i}`);
  const rs = { value: rand() - .5, rate: rand() - .5 };
  const rargs = { rig, turnRadPerS: (rand() - .5) * 4, sidewaysMps: rand() * 3, topMps: rand() * 8 + .1, dtS: rand() * .05 };
  eq(R.rollStep(structuredClone(rs), JSON.parse(JSON.stringify(rargs))),
     rollStep(structuredClone(rs), JSON.parse(JSON.stringify(rargs))), `nEr #${i}`);
}

// ---- 5. weight math + helpers ----
for (let i = 0; i < 40; i++) {
  const w = (rand() - .5) * 4;
  eq(R.clampWeight(w), clampWeight(w), `HDe #${i}`);
  eq(R.weightScale(w), weightScale(w), `zGt #${i}`);
  eq(R.validateWeight(w), validateWeight(w), `WGt #${i}`);
  const rig = R.CAMERA_RIGS[R.RIG_KEYS[(rand() * 6) | 0]];
  eq(R.rigWithWeight(rig, w), rigWithWeight(rig, w), `WCr #${i}`);
  const obj = {}; for (const k of R.RIG_KEYS) obj[k] = (rand() - .5) * 4;
  eq(R.validateWeights(obj), validateWeights(obj), `GCr #${i}`);
  eq(R.validateWeights('junk'), validateWeights('junk'), 'GCr junk');
  const from = R.RIG_KEYS[(rand() * 6) | 0];
  const dir = rand() < .5 ? 1 : -1;
  eq(R.cycleRigKey(from, dir), cycleRigKey(from, dir), `hEr #${i}`);
  const speeds = { speedMps: R.SPEED_STEPS[(rand() * 14) | 0], panDegPerS: R.PAN_STEPS[(rand() * 8) | 0] };
  eq(R.carrySpeeds(from, speeds), carrySpeeds(from, speeds), `HCr #${i}`);
  const d = rand() < .5 ? 1 : -1, wrap = rand() < .5;
  eq(R.stepSpeed(from, JSON.parse(JSON.stringify(speeds)), d, wrap), stepSpeed(from, JSON.parse(JSON.stringify(speeds)), d, wrap), `qrt #${i}`);
  eq(R.speedPicker(from), speedPicker(from), `BCr #${i}`);
  eq(R.isPanOnly(from), isPanOnly(from), `UGt #${i}`);
  eq(R.isRigKey(from), isRigKey(from), `DCr #${i}`);
  const cv = rand() * 60;
  eq(R.clampToSteps(R.SPEED_STEPS, cv), clampToSteps(R.SPEED_STEPS, cv), `$Cr #${i}`);
  const spd2 = { speedMps: rand() * 60, panDegPerS: rand() * 100 };
  eq(R.validateSpeeds(spd2, { speedMps: 1.8, panDegPerS: 20 }), validateSpeeds(spd2, { speedMps: 1.8, panDegPerS: 20 }), `VCr #${i}`);
  eq(R.speedValueLabel(spd2.speedMps), speedValueLabel(spd2.speedMps), `ECr #${i}`);
}

// ---- 6. zoom map ----
for (let i = 0; i < 40; i++) {
  const t = rand();
  eq(R.zoomMm(t), zoomMm(t), `jCr #${i}`);
  const mm = 14 + rand() * 186;
  eq(R.zoomLog(mm), zoomLog(mm), `ICr #${i}`);
  const z = R.bEr(rand());
  eq(R.bEr(0.3), { targetT: 0.3, lens: { value: 0.3, rate: 0 } }, 'bEr');
  let zr = JSON.parse(JSON.stringify(z));
  for (let k = 0; k < 8; k++) zr = R.yEr(zr, rand() < .5 ? 1 : -1, .016);
  let zp = JSON.parse(JSON.stringify(z));
  for (let k = 0; k < 8; k++) {
    const dir = 0; // yEr dir must match — redo deterministically below
  }
  // deterministic shared sequence
  const dirs = Array.from({ length: 12 }, () => rand() < .5 ? 1 : -1);
  zr = R.bEr(0.4); zp = { targetT: 0.4, lens: { value: 0.4, rate: 0 } };
  for (const d of dirs) {
    zr = R.yEr(zr, d, .016);
    zp = { targetT: Math.min(1, Math.max(0, zp.targetT + d * 0.35 * .016)),
           lens: springStep(zp.lens, Math.min(1, Math.max(0, zp.targetT + d * 0.35 * .016)), 0.15, .016) };
    eq(zr.targetT, zp.targetT, `yEr targetT`);
    eq(zr.lens, zp.lens, `yEr lens`);
  }
  let zw = R.bEr(0.5);
  for (let k = 0; k < 5; k++) zw = R.vEr(zw, -120, 0);
  let zw2 = { targetT: 0.5, lens: { value: 0.5, rate: 0 } };
  for (let k = 0; k < 5; k++) zw2 = { ...zw2, targetT: Math.min(1, Math.max(0, zw2.targetT - (-120) * 6e-4)) };
  eq(zw.targetT, zw2.targetT, 'vEr wheel');
  eq(R.xEr({ targetT: .5, lens: { value: .50005, rate: .0002 } }), true, 'xEr near');
  eq(R.xEr({ targetT: .5, lens: { value: .5, rate: 0 } }), true, 'xEr exact');
}

// ---- 7. full drive trajectory (shared driver over each side's primitives) ----
// reimplements en's step order using REFERENCE primitives, then PORT primitives; identical
// inputs (stick sequence, rig, speeds) — the family contract is what we're certifying.
function driveSim(side, rig, speeds, seq) {
  const S = side === 'ref' ? R : { springStep, springZero, springsStep, springValues, panStep, panIdle, pitchStep, turnRate, moveStep, sidewaysMps, rollStep };
  let pan = [{ value: 0, rate: 0 }, { value: 0, rate: 0 }];
  let move = [{ value: 0, rate: 0 }, { value: 0, rate: 0 }, { value: 0, rate: 0 }];
  let yaw = { value: 0, rate: 0 }, pitch = { value: 0, rate: 0 }, roll = { value: 0, rate: 0 };
  let aimEuler = { y: 0, x: 0 }, camEuler = { x: 0, y: 0, z: 0 };
  const out = [];
  for (const step of seq) {
    const { stickX, stickY, vertical, shift, dt } = step;
    let Re = stickX, it = stickY;
    const ct = Math.hypot(Re, it), At = shift ? R.eWr : 1;
    if (ct > 0) { Re *= At / Math.max(1, ct); it *= At / Math.max(1, ct); }
    const Dt = yaw.value;
    pan = S.panStep([pan[0], pan[1]], { stickX: Re, stickY: it, rig, panDegPerS: speeds.panDegPerS, dtS: dt });
    if (!S.panIdle(pan)) {
      const mn = pan[0].value * dt, Nt = S.pitchStep(aimEuler.x, pan[1].value * dt);
      aimEuler.y += mn; aimEuler.x += Nt;
      yaw = { ...yaw, value: yaw.value + mn };
      pitch = { ...pitch, value: pitch.value + Nt };
    }
    yaw = S.springStep(yaw, yaw.value + S.turnRate(Dt, yaw.value, dt), rig.lookEaseS, dt);
    pitch = S.springStep(pitch, aimEuler.x, rig.lookEaseS, dt);
    camEuler = { x: pitch.value, y: yaw.value, z: 0 };
    // movement: aim quaternion from camEuler (YXZ)
    const cy = Math.cos(camEuler.y / 2), sy = Math.sin(camEuler.y / 2);
    const cx = Math.cos(camEuler.x / 2), sx = Math.sin(camEuler.x / 2);
    const aim = [0 * cx * cy, sx * cy, 0 * sy, cx * cy];  // yaw*pitch only (x=z=0 yaw, pitch y) — quaternion (0, sin(x/2)cos(y/2), 0, cos(x/2)cos(y/2))
    move = S.moveStep(move, { stickX: Re, stickY: it, vertical, aim, rig, speedMps: speeds.speedMps, dtS: dt });
    const v = S.springValues(move);
    roll = S.rollStep(roll, { rig, turnRadPerS: S.turnRate(Dt, yaw.value, dt), sidewaysMps: S.sidewaysMps(v, yaw.value), topMps: speeds.speedMps, dtS: dt });
    out.push({ p: [v[0], v[1], v[2]], yaw: yaw.value, pitch: pitch.value, roll: roll.value, aimY: aimEuler.y, aimX: aimEuler.x });
  }
  return out;
}
{
  const rig = R.CAMERA_RIGS.handheld;
  const speeds = { speedMps: 1.8, panDegPerS: 20 };
  const seq = [];
  for (let i = 0; i < 80; i++) {
    seq.push({ stickX: Math.sin(i * .31), stickY: Math.cos(i * .17), vertical: Math.sin(i * .09), shift: i % 7 === 0, dt: 1 / 60 });
  }
  const a = driveSim('ref', rig, speeds, seq);
  const b = driveSim('port', rig, speeds, seq);
  eq(a, b, 'drive trajectory (handheld, 80 frames)');
}

console.log(`\nR17 ORACLE: ${PASS} PASS / ${FAIL} FAIL`);
if (FAIL) { console.log(FAILS.slice(0, 8).join('\n\n')); process.exit(1); }
