// run_oracle.mjs — R7-1 exactness harness: verbatim bundle fns (reference.mjs) vs editor/js/plan.js
// Matrix per analysis/tmp_plan_exact/ORACLE_PLAN.md §7. Numbers rounded to 1e-4 before compare.
import * as R from './reference.mjs';
import * as P from '/home/z/my-project/flick-3dEditor/editor/js/plan.js';
import { buildTangents, polylineOf, arcLength } from '/home/z/my-project/flick-3dEditor/editor/js/curves.js';

let PASS = 0, FAIL = 0; const FAILS = [];
const eq = (a, b, msg) => {
  const da = JSON.stringify(round(a)), db = JSON.stringify(round(b));
  if (da === db) PASS++;
  else { FAIL++; FAILS.push(`${msg}\n    ref: ${da.slice(0, 300)}\n    port: ${db.slice(0, 300)}`); }
};
const round = v => typeof v === 'number' ? (Number.isFinite(v) ? Math.round(v * 1e4) / 1e4 : v)
  : Array.isArray(v) ? v.map(round)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, round(x)]))
  : v;

// ---------------- recording canvas ----------------
function recCtx() {
  const ops = [];
  const num = v => typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v;
  const rec = name => (...args) => { ops.push([name, ...args.map(a => Array.isArray(a) ? a.map(num) : num(a))]); return proxy; };
  const state = {};
  const proxy = new Proxy({}, {
    get(_, k) {
      if (k === '__ops') return ops;
      if (k in state) return state[k];
      if (k === 'measureText') return () => ({ width: 42 });
      if (k === 'canvas') return { width: 800, height: 600 };
      return rec(String(k));
    },
    set(_, k, v) { state[k] = v; ops.push(['set', String(k), num(v)]); return true; },
  });
  return proxy;
}
const diffOps = (a, b, msg) => {
  if (a.length !== b.length) { FAIL++; FAILS.push(`${msg}: op-count ref=${a.length} port=${b.length}`); return; }
  for (let i = 0; i < a.length; i++) {
    if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) { FAIL++; FAILS.push(`${msg}: op[${i}] ref=${JSON.stringify(a[i]).slice(0, 200)} port=${JSON.stringify(b[i]).slice(0, 200)}`); return; }
  }
  PASS++;
};

// ---------------- fixture (ORACLE_PLAN §2) ----------------
const CATALOG = { dungeon_props_chest: { dims: [1.2, 0.8, 0.7] }, doorway: { dims: [1.4, 2.2, 0.3] } };
R.setZh(CATALOG);
const portDims = k => CATALOG[k]?.dims;

const objects = {
  cube1: { kind: 'cube', position: [-3, 0, -2], rotation: [0, 0.6, 0], scale: [1, 1, 1] },
  sph1: { kind: 'sphere', position: [2, 0.5, -3], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.2] },
  cyl1: { kind: 'cylinder', position: [4, 0, 1], rotation: [0, 2.2, 0], scale: [1, 1, 1] },
  prop1: { kind: 'prop', propKey: 'dungeon_props_chest', position: [0, 0, 3], rotation: [0, -1.1, 0], scale: [1, 1, 1] },
  prop2: { kind: 'prop', propKey: 'unknown_key', position: [1.5, 0, 3.5], rotation: [0, 0.3, 0], scale: [1, 1, 1] },
  fig1: { kind: 'simple_figure', position: [1, 0, 2], rotation: [0, 0.9, 0], scale: [1, 1, 1], headRotation: [0, 0.8, 0] },
  hum1: { kind: 'humanoid', position: [-1, 0, 1], rotation: [0, 2.6, 0], scale: [1, 1, 1] },
  hum2: { kind: 'humanoid', position: [-1.4, 0, 1.6], rotation: [0.2, 1.1, -0.3], scale: [1.3, 0.9, 1.1] },
  cam1: { kind: 'camera', position: [0, 1.7, 6], rotation: [-0.35, 3.6, 0], scale: [1, 1, 1], focalLengthMm: 35 },
  cam2: { kind: 'camera', position: [40, 2, -40], rotation: [-0.2, 0.4, 0], scale: [1, 1, 1], focalLengthMm: 85 },
  tgt1: { kind: 'target', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  spot1: { kind: 'spotlight', position: [-2, 4, 2], rotation: [-1.2, 0.5, 0], scale: [1, 1, 1] },
  spot2: { kind: 'spotlight', position: [3, 5, -1], rotation: [-1.0, -0.5, 0], scale: [1, 1, 1], spotlight: { shape: 'square', intensity: 50, diffusion: 20 } },
  spot3: { kind: 'spotlight', position: [2, 3, 2], rotation: [0.4, 0, 0], scale: [1, 1, 1] },        // aims up → no pool
  grp1: { kind: 'group', position: [0, 0, 0], rotation: [0, 0.4, 0], scale: [1, 1, 1] },
  cube2: { kind: 'cube', parentId: 'grp1', position: [0.8, 0, 0.5], rotation: [0, 0, 0], scale: [0.5, 1, 0.5] },
  sph2: { kind: 'sphere', parentId: 'grp1', position: [-0.6, 0, -0.4], rotation: [0, 0, 0], scale: [0.4, 0.4, 0.4] },
};
// pinned poses (the shownPose seam): stored pose + a played-back variant
const storedPose = o => ({ position: o.position, rotation: o.rotation, scale: o.scale });
const playedPose = o => ({ position: [o.position[0] + 0.3, o.position[1], o.position[2] - 0.2], rotation: [o.rotation[0], o.rotation[1] + 0.7, o.rotation[2]], scale: o.scale });
const poses = {}; const played = {};
for (const [id, o] of Object.entries(objects)) { poses[id] = storedPose(o); played[id] = playedPose(o); }
const aspect = 16 / 9, aspect916 = 9 / 16;

function buildItems(poseMap, asp) {
  return Object.entries(objects).filter(([, o]) => o.kind !== 'group').map(([id, o]) => {
    const it = { id, kind: o.kind, parentId: o.parentId, footprint: P.Dst(o, poseMap[id], portDims), label: `${id}-label` };
    if (o.parentId) it.groupLabel = 'grp-label';
    if (o.kind === 'simple_figure') it.headYawRad = P.i9(poseMap[id].headRotation ?? o.headRotation ?? [0, 0, 0]);
    if (o.kind === 'spotlight') { const p = P.TDe(poseMap[id]); if (p) it.pool = { ...p, square: P.BR(o).shape === 'square' }; }
    if (o.kind === 'camera') { it.wedgeHalfRad = P.hqt(P.Z_(o.focalLengthMm, asp), asp); it.tag = id; it.label = `${id} · ${(poseMap[id].position[1]).toFixed(1)}m`; }
    return it;
  }).sort((a, b) => (P.tit ?? titOf)[a.kind] - (P.tit ?? titOf)[b.kind]);
}
const titOf = { prop: 0, cube: 0, sphere: 0, cylinder: 0, group: 0, humanoid: 1, simple_figure: 1, target: 2, spotlight: 3, camera: 3 };

const PALETTE = { background: '#1a1e28', grid: 'rgba(255,255,255,.05)', gridMajor: 'rgba(255,255,255,.12)', human: '#ffd69e', camera: '#7fb2ff', object: '#c9cfdb', light: '#ffe9a8', prop: '#e2e0dc', propEdge: '#b8b6b2', accent: '#f9634e', accentSoft: 'rgba(249,99,78,.14)', panel: '#171a22', text: '#e8eaf0', textDim: '#9aa1b2', fontFamily: 'test-font' };

// ================= T1: view ops =================
{
  const views = [{ centerX: 0, centerZ: 0, pxPerM: 34, widthPx: 800, heightPx: 600 },
    { centerX: -3.2, centerZ: 7.7, pxPerM: 120, widthPx: 1024, heightPx: 313 },
    { centerX: 12, centerZ: -5, pxPerM: 14, widthPx: 300, heightPx: 200 },
    { centerX: 0.5, centerZ: 0.25, pxPerM: 170, widthPx: 1920, heightPx: 1080 }];
  const pts = [{ x: 0, z: 0 }, { x: 3.5, z: -2.25 }, { x: -8, z: 12 }];
  for (const v of views) for (const p of pts) {
    const pxR = R.iu(v, p), pxP = P.iu(v, p); eq(pxR, pxP, `T1 iu ${JSON.stringify(v)} ${JSON.stringify(p)}`);
    const backR = R.S1(v, pxR), backP = P.S1(v, pxP); eq(backR, backP, `T1 S1 roundtrip ${JSON.stringify(p)}`);
  }
  for (const v of views) {
    eq(R.UDe(v, 40, -20), P.UDe(v, 40, -20), 'T1 UDe');
    eq(R.fqt(v, { x: 400, y: 300 }, 1.2), P.fqt(v, { x: 400, y: 300 }, 1.2), 'T1 fqt zoom-in');
    eq(R.fqt(v, { x: 100, y: 500 }, 0.05), P.fqt(v, { x: 100, y: 500 }, 0.05), 'T1 fqt floor .1');
    eq(R.fqt(v, { x: 550, y: 33 }, -0.5), P.fqt(v, { x: 550, y: 33 }, -0.5), 'T1 fqt zoom-out');
  }
  const bboxes = [{ minX: 0, minZ: 0, maxX: 1, maxZ: 1 }, { minX: -2, minZ: -2, maxX: 2, maxZ: 2 },
    { minX: 1, minZ: 1, maxX: 1.0000001, maxZ: 1.0000001 }, { minX: -50, minZ: -30, maxX: 60, maxZ: 40 }];
  for (const bb of bboxes) eq(R.zIr(views[0], bb, 48), P.zIr(views[0], bb, 48), `T1 zIr ${JSON.stringify(bb)}`);
  eq(R.LLr({ view: views[1] }), P.LLr({ view: views[1] }), 'T1 LLr');
}

// ================= T2: footprints =================
{
  for (const [id, o] of Object.entries(objects)) {
    for (const pm of [poses, played]) {
      const r = R.Dst(o, pm[id]); const p = P.Dst(o, pm[id], portDims);
      eq(r, p, `T2 Dst ${id} ${pm === poses ? 'stored' : 'played'}`);
      if (r) { eq(R.dqt(r), P.dqt(r), `T2 dqt ${id}`); eq(R.Rie(r, { centerX: 0, centerZ: 0, pxPerM: 34, widthPx: 800, heightPx: 600 }), P.Rie(r, { centerX: 0, centerZ: 0, pxPerM: 34, widthPx: 800, heightPx: 600 }), `T2 Rie ${id}`); }
    }
  }
  const fps = Object.entries(objects).map(([id, o]) => R.Dst(o, poses[id])).filter(Boolean);
  eq(R.uqt(fps), P.uqt(fps), 'T2 uqt union');
  // pools
  for (const id of ['spot1', 'spot2', 'spot3', 'cube1']) eq(R.TDe(poses[id]), P.TDe(poses[id]), `T2 TDe pool ${id}`);
  eq(R.Rhe({ x: 1, y: 1, z: 1 }), P.Rhe({ x: 1, y: 1, z: 1 }), 'T2 Rhe');
  eq(R.Rhe({ x: 9, y: 9, z: 9 }), P.Rhe({ x: 9, y: 9, z: 9 }), 'T2 Rhe clamp55');
  // yaw/forward/fov chain
  for (const [id, o] of Object.entries(objects)) eq(R.i9(poses[id].rotation), P.i9(poses[id].rotation), `T2 i9 ${id}`);
  for (const a of [0, 0.7, -2.2, Math.PI, 3.05]) eq(R.FU(a), P.FU(a), 'T2 FU');
  for (const f of [14, 24, 35, 50, 85, 200]) for (const asp of [aspect, aspect916, 1]) {
    eq(R.Z_(f, asp), P.Z_(f, asp), `T2 Z_ ${f} ${asp}`);
    eq(R.hqt(R.Z_(f, asp), asp), P.hqt(P.Z_(f, asp), asp), `T2 hqt ${f}`);
  }
}

// ================= T3: painter golden op-streams =================
{
  const itemsA = buildItems(poses, aspect), itemsB = buildItems(played, aspect916);
  const viewA = { centerX: 0, centerZ: 0, pxPerM: 34, widthPx: 800, heightPx: 600 };
  const viewB = { centerX: 2, centerZ: -1, pxPerM: 120, widthPx: 500, heightPx: 400 };
  const paths = [
    { id: 'hum1', kind: 'humanoid', points: [{ x: -1, z: 1 }, { x: 0, z: 2 }, { x: 2, z: 2.5 }], keys: [{ x: 2, z: 2.5 }] },
    { id: 'cam1', kind: 'camera', points: [{ x: 0, z: 6 }, { x: 1, z: 4 }, { x: 3, z: 2 }], keys: [{ x: 3, z: 2 }] },
    { id: 'cube1', kind: 'cube', points: [{ x: -3, z: -2 }, { x: -2, z: -1 }], keys: [{ x: -2, z: -1 }] },
  ];
  const selections = [[], ['cube1'], ['cube2'], ['cam1'], ['hum1', 'sph1'], ['spot2'], ['grp1']];
  const strokes = [null, [{ x: 0, z: 0 }, { x: 1, z: 0.5 }, { x: 2, z: 1.2 }]];
  const focuses = [null, { fromId: 'cam1', subjectId: 'fig1', label: 'Focus' }];
  let n = 0;
  for (const [items, tag] of [[itemsA, 'A'], [itemsB, 'B']]) for (const view of [viewA, viewB])
    for (const sel of selections) for (const stroke of strokes) for (const focus of focuses) {
      const common = { view, items, selection: new Set(sel), paths, palette: PALETTE, marquee: null, dimPathOf: stroke ? 'hum1' : null, stroke, focus };
      const a = recCtx(), b = recCtx();
      R.SDr(a, common); P.SDr(b, common);
      diffOps(a.__ops, b.__ops, `T3 SDr ${tag} sel=${sel} stroke=${!!stroke} focus=${!!focus} n=${n++}`);
    }
  // marquee pass
  const mq = { x0: 40, y0: 60, x1: 220, y1: 180 };
  const a = recCtx(), b = recCtx();
  R.SDr(a, { view: viewA, items: itemsA, selection: new Set(['cube1']), paths, palette: PALETTE, marquee: mq, dimPathOf: null, stroke: null, focus: null });
  P.SDr(b, { view: viewA, items: itemsA, selection: new Set(['cube1']), paths, palette: PALETTE, marquee: mq, dimPathOf: null, stroke: null, focus: null });
  diffOps(a.__ops, b.__ops, 'T3 SDr marquee');
  // edge indicators + FDr
  const eR = R.$Ir(itemsA, viewA), eP = P.$Ir(itemsA, viewA);
  eq(eR, eP, 'T4 $Ir edge');
  const ea = recCtx(), eb = recCtx();
  R.FDr(ea, eR, PALETTE); P.FDr(eb, eP, PALETTE);
  diffOps(ea.__ops, eb.__ops, 'T4 FDr edge painter');
  eq(R.ZIr(itemsA.find(i => i.id === 'cam1'), viewA, { widthPx: 60, heightPx: 20 }), P.ZIr(itemsA.find(i => i.id === 'cam1'), viewA, { widthPx: 60, heightPx: 20 }), 'T4 ZIr label pos');
}

// ================= T5: pointer machine =================
{
  const baseDeps = items => ({ items, selection: [], aspect, locked: false, drawing: false, readOnly: false });
  const runScript = (ref, port, deps, script) => {
    // script: [{type:'down'|'move'|'up', p, shift?, mod?, button?}]
    const log = { ref: [], port: [] };
    let sR = R.ELr(), sP = P.ELr();
    sR = R.jLr(sR, 800, 600); sP = P.jLr(sP, 800, 600);
    for (const step of script) {
      const ev = { p: step.p, shift: !!step.shift, mod: !!step.mod };
      if (step.type === 'down') { const a = R.DLr(sR, deps, ev); sR = a.state; log.ref.push(...a.intents.map(JSON.stringify)); const b = P.DLr(sP, deps, ev); sP = b.state; log.port.push(...b.intents.map(JSON.stringify)); }
      else if (step.type === 'move') { const a = R.DZt(sR, deps, ev); sR = a.state; log.ref.push(...a.intents.map(JSON.stringify)); const b = P.DZt(sP, deps, ev); sP = b.state; log.port.push(...b.intents.map(JSON.stringify)); }
      else { const a = R.HLr(sR, deps); sR = a.state; log.ref.push(...a.intents.map(JSON.stringify)); const b = P.HLr(sP, deps); sP = b.state; log.port.push(...b.intents.map(JSON.stringify)); }
    }
    return { sR, sP, logR: log.ref, logP: log.port };
  };
  const items = buildItems(poses, aspect);
  const v0 = { centerX: 0, centerZ: 0, pxPerM: 34, widthPx: 800, heightPx: 600 };
  const w2p = (x, z) => ({ x: 400 + x * 34, y: 300 + z * 34 });
  const pxOf = id => { const it = items.find(i => i.id === id); return w2p(it.footprint.x, it.footprint.z); };
  const cases = [
    ['click cube', [{ type: 'down', p: pxOf('cube1') }, { type: 'up' }]],
    ['click empty', [{ type: 'down', p: { x: 780, y: 590 } }, { type: 'up' }]],
    ['click grouped child', [{ type: 'down', p: pxOf('cube2') }, { type: 'up' }]],
    ['shift toggle', [{ type: 'down', p: pxOf('cube1') }, { type: 'up' }, { type: 'down', p: pxOf('sph1'), shift: true }, { type: 'up' }, { type: 'down', p: pxOf('cube1'), shift: true }, { type: 'up' }]],
    ['mod cycle child', [{ type: 'down', p: pxOf('cube2'), mod: true }, { type: 'up' }, { type: 'down', p: pxOf('cube2'), mod: true }, { type: 'up' }]],
    ['tiny marquee', [{ type: 'down', p: { x: 100, y: 100 } }, { type: 'move', p: { x: 102, y: 103 } }, { type: 'up' }]],
    ['big marquee', [{ type: 'down', p: { x: 5, y: 5 } }, { type: 'move', p: { x: 700, y: 500 } }, { type: 'up' }]],
    ['marquee shift-base', [{ type: 'down', p: pxOf('cube1') }, { type: 'up' }, { type: 'down', p: { x: 5, y: 5 }, shift: true }, { type: 'move', p: { x: 700, y: 500 } }, { type: 'up' }]],
    ['move no-shift', [{ type: 'down', p: pxOf('cube1') }, { type: 'move', p: { x: pxOf('cube1').x + 37, y: pxOf('cube1').y + 13 } }, { type: 'up' }]],
    ['move shift-snap', [{ type: 'down', p: pxOf('cube1') }, { type: 'move', p: { x: pxOf('cube1').x + 37, y: pxOf('cube1').y + 13 }, shift: true }, { type: 'up' }]],
    ['move under-threshold', [{ type: 'down', p: pxOf('cube1') }, { type: 'move', p: { x: pxOf('cube1').x + 2, y: pxOf('cube1').y + 1 } }, { type: 'up' }]],
    ['wheel zoom', []], // handled below via NLr
  ];
  for (const [name, script] of cases) {
    if (!script.length) continue;
    const { sR, sP, logR, logP } = runScript(R, P, baseDeps(items), script);
    eq(sR, sP, `T5 ${name}: final state`);
    eq(logR, logP, `T5 ${name}: intents`);
  }
  // rotate + lens drags need selected camera deps
  const camDeps = { items, selection: ['cam1'], aspect, locked: false, drawing: false, readOnly: false };
  const camPx = pxOf('cam1');
  const rotScript = [{ type: 'down', p: camPx }, { type: 'up' },
    { type: 'down', p: { x: camPx.x + 60, y: camPx.y - 25 } }, { type: 'move', p: { x: camPx.x + 90, y: camPx.y - 40 } }, { type: 'up' }];
  { const { sR, sP, logR, logP } = runScript(R, P, camDeps, rotScript); eq(sR, sP, 'T5 camera-rotate state'); eq(logR, logP, 'T5 camera-rotate intents'); }
  const lensScript = [{ type: 'down', p: camPx }, { type: 'up' },
    { type: 'down', p: { x: camPx.x + 30, y: camPx.y + 55 } }, { type: 'move', p: { x: camPx.x + 30, y: camPx.y + 75 }, shift: true }, { type: 'up' }];
  { const { sR, sP, logR, logP } = runScript(R, P, camDeps, lensScript); eq(sR, sP, 'T5 lens state'); eq(logR, logP, 'T5 lens intents'); }
  // walker rotate (ellipse ring) with shift 15°
  const walkDeps = { items, selection: ['hum1'], aspect, locked: false, drawing: false, readOnly: false };
  const wPx = pxOf('hum1');
  const wRot = [{ type: 'down', p: wPx }, { type: 'up' },
    { type: 'down', p: { x: wPx.x, y: wPx.y - 30 } }, { type: 'move', p: { x: wPx.x + 40, y: wPx.y - 30 }, shift: true }, { type: 'up' }];
  { const { sR, sP, logR, logP } = runScript(R, P, walkDeps, wRot); eq(sR, sP, 'T5 walker-rotate state'); eq(logR, logP, 'T5 walker-rotate intents'); }
  // tap-or-draw (<3px = focus; ≥3px = stroke-start)
  const drawDeps = { items, selection: ['hum1'], aspect, locked: false, drawing: true, readOnly: false };
  { const { sR, sP, logR, logP } = runScript(R, P, drawDeps, [{ type: 'down', p: pxOf('fig1') }, { type: 'move', p: { x: pxOf('fig1').x + 1, y: pxOf('fig1').y + 1 } }, { type: 'up' }]);
    eq(sR, sP, 'T5 tap-or-draw focus state'); eq(logR, logP, 'T5 tap-or-draw focus intents'); }
  { const { sR, sP, logR, logP } = runScript(R, P, drawDeps, [{ type: 'down', p: pxOf('fig1') }, { type: 'move', p: { x: pxOf('fig1').x + 20, y: pxOf('fig1').y + 8 } }, { type: 'move', p: { x: pxOf('fig1').x + 25, y: pxOf('fig1').y + 12 } }, { type: 'up' }]);
    eq(sR, sP, 'T5 tap-or-draw stroke state'); eq(logR, logP, 'T5 tap-or-draw stroke intents'); }
  // wheel
  for (const w of [{ dx: 0, dy: -100, deltaMode: 0, zoom: true }, { dx: 0, dy: -10, deltaMode: 0, zoom: true }, { dx: 80, dy: 0, deltaMode: 0, zoom: false }, { dx: 0, dy: 3, deltaMode: 1, zoom: false }]) {
    let sR = R.jLr(R.ELr(), 800, 600), sP = P.jLr(P.ELr(), 800, 600);
    sR = R.NLr(sR, { p: { x: 400, y: 300 }, ...w }); sP = P.NLr(sP, { p: { x: 400, y: 300 }, ...w });
    eq(sR, sP, `T5 wheel ${JSON.stringify(w)}`);
  }
  // reducers: ELr/jLr/ILr/MLr/FLr/RLr/OLr/BLr
  eq(R.jLr(R.ELr(), 800, 600), P.jLr(P.ELr(), 800, 600), 'T5 jLr fresh');
  { const s1 = R.jLr(R.ELr(), 800, 600), s2 = R.jLr(s1, 1000, 700); const t1 = P.jLr(P.ELr(), 800, 600), t2 = P.jLr(t1, 1000, 700); eq(s2, t2, 'T5 jLr resize recenter'); }
  { eq(R.ILr(R.jLr(R.ELr(), 800, 600), items), P.ILr(P.jLr(P.ELr(), 800, 600), items), 'T5 ILr fit'); }
  eq(R.MLr(R.jLr(R.ELr(), 800, 600), items, 'cam1'), P.MLr(P.jLr(P.ELr(), 800, 600), items, 'cam1'), 'T5 MLr zoom-to');
  eq(R.FLr(R.jLr(R.ELr(), 800, 600), items, 'cam1'), P.FLr(P.jLr(P.ELr(), 800, 600), items, 'cam1'), 'T5 FLr centerOn');
  eq(R.RLr(R.jLr(R.ELr(), 800, 600), 1), P.RLr(P.jLr(P.ELr(), 800, 600), 1), 'T5 RLr kb-zoom');
  eq(R.OLr(R.ELr()), P.OLr(P.ELr()), 'T5 OLr unfitted');
  { const st = { ...R.jLr(R.ELr(), 800, 600), drag: { kind: 'stroke', lastPx: { x: 780, y: 300 } } };
    const a = R.BLr(st, baseDeps(items), { x: 795, y: 300 }, 16); const b = P.BLr({ ...P.jLr(P.ELr(), 800, 600), drag: { kind: 'stroke', lastPx: { x: 780, y: 300 } } }, baseDeps(items), { x: 795, y: 300 }, 16);
    eq(a.state, b.state, 'T5 BLr autopan state'); eq(a.intents, b.intents, 'T5 BLr autopan intents'); }
  // hit-test helpers directly
  for (const id of ['cube1', 'sph1', 'cyl1', 'prop1', 'fig1', 'hum1', 'cam1', 'tgt1']) {
    const fp = items.find(i => i.id === id).footprint;
    for (const off of [[0, 0], [10, 4], [30, 30], [-8, 0]]) {
      const px = { x: w2p(fp.x, fp.z).x + off[0], y: w2p(fp.x, fp.z).y + off[1] };
      eq(R.xLr(fp, v0, px), P.xLr(fp, v0, px), `T5 xLr ${id} ${off}`);
    }
  }
  eq(R.Qhe(items, v0, w2p(-1, 1)).map(i => i.id), P.Qhe(items, v0, w2p(-1, 1)).map(i => i.id), 'T5 Qhe order');
  eq(R.Xat(items, v0, w2p(0.8, 0.5)), P.Xat(items, v0, w2p(0.8, 0.5)), 'T5 Xat promotion');
  eq(R._Lr(items, v0, { x0: 0, y0: 0, x1: 800, y1: 600 }), P._Lr(items, v0, { x0: 0, y0: 0, x1: 800, y1: 600 }), 'T5 _Lr marquee all');
  eq(R.kLr(items.find(i => i.id === 'cam1'), v0, { x: w2p(0, 6).x, y: w2p(0, 6).y - 36 }), P.kLr(items.find(i => i.id === 'cam1'), v0, { x: w2p(0, 6).x, y: w2p(0, 6).y - 36 }), 'T5 kLr rotate hit');
}

// ================= T6: vHr corpus =================
{
  const mk = (pts, dt = .1) => pts.map((p, i) => ({ x: p[0], z: p[1], t: i * dt }));
  const corpus = [
    ['1 sample', [{ x: 0, z: 0, t: 0 }]],
    ['2 samples', [{ x: 0, z: 0, t: 0 }, { x: 1, z: 0, t: .2 }]],
    ['tiny scribble <.3m', mk([[0, 0], [.1, .05], [.15, .1], [.2, .12]])],
    ['straight line', mk([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]])],
    ['gentle curve', mk([[0, 0], [.8, .3], [1.6, .9], [2.3, 1.8], [2.8, 2.8]])],
    ['zigzag', mk([[0, 0], [.5, 1], [1, 0], [1.5, 1], [2, 0], [2.5, 1], [3, 0]])],
    ['dwell mid (pause .4s)', [{ x: 0, z: 0, t: 0 }, { x: 1, z: 0, t: .2 }, { x: 1, z: 0, t: .3 }, { x: 1, z: 0, t: .6 }, { x: 2, z: .5, t: .9 }, { x: 3, z: 1, t: 1.1 }]],
    ['dwell start+end', [{ x: 0, z: 0, t: 0 }, { x: 0, z: 0, t: .5 }, { x: 2, z: 1, t: 1 }, { x: 4, z: 2, t: 1.5 }, { x: 4, z: 2, t: 2.1 }]],
    ['jittery', mk([[0, 0], [.21, .02], [.4, -.03], [.62, .04], [.8, .01], [1.02, -.02], [1.2, .03]], .04)],
    ['long loop', (() => { const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 1.5; pts.push([Math.cos(a) * 2, Math.sin(a) * 2]); } return mk(pts, .08); })()],
    ['duplicate pts', [{ x: 0, z: 0, t: 0 }, { x: 0, z: 0, t: .1 }, { x: 1, z: 0, t: .2 }, { x: 1, z: 0, t: .3 }, { x: 2, z: 1, t: .5 }]],
    ['fast then slow', [{ x: 0, z: 0, t: 0 }, { x: 1, z: 0, t: .05 }, { x: 2, z: 0, t: .1 }, { x: 2.2, z: .1, t: .5 }, { x: 2.4, z: .2, t: 1.2 }, { x: 2.5, z: .3, t: 2 }]],
  ];
  for (const [name, samples] of corpus) {
    const r = R.vHr(samples), p = P.vHr(samples);
    eq(r, p, `T6 vHr ${name}`);
  }
}

// ================= T7: curves (mT/nx/MR vs curves.js) =================
{
  const sets = [
    [[0, 0, 0], [1, 0, 0], [2, 1, 0]],
    [[0, 0, 0], [2, 0, 1], [4, 0, -1], [6, 1, 0]],
    [[0, 0, 0], [0, 0, 0], [1, 1, 1]],
    (() => { const p = []; for (let i = 0; i < 12; i++) p.push([Math.sin(i * .7) * 2, 0, Math.cos(i * .9) * 2]); return p; })(),
  ];
  for (const pts of sets) {
    const aR = R.mT(pts), aP = buildTangents(pts);
    eq(aR, aP, `T7 mT ${pts.length}pts`);
    const pR = R.nx(aR), pP = polylineOf(aP);
    eq(pR, pP, `T7 nx ${pts.length}pts`);
    eq(R.MR(pR), arcLength(pP), `T7 MR ${pts.length}pts`);
  }
}

// ================= T8: replaceMoveFromSamples matrix =================
{
  const mkFacade = (existingMove) => {
    const tracks = [];
    const facade = {
      objects: {},
      trackIdOf: id => tracks.find(t => t.characterId === id)?.id ?? null,
      addPerformanceTrack: id => { const tr = { id: 'trk-' + id, characterId: id, items: [] }; tracks.push(tr); return tr.id; },
      moveSegmentOf: trackId => tracks.find(t => t.id === trackId)?.items.find(i => (i.kind === 'path' || i.kind === 'cam-path') && i.anchors?.length > 1) ?? null,
      updateTrackItems: (trackId, fn) => { const t = tracks.find(t => t.id === trackId); t.items = fn(t.items); },
      an: (() => { let n = 0; return () => 'new-id-' + (++n); })(),
    };
    return { facade, tracks };
  };
  const samples = [{ x: 0, z: 0, t: 0 }, { x: .5, z: .2, t: .2 }, { x: 1, z: .6, t: .4 }, { x: 1.6, z: 1.1, t: .6 }, { x: 2, z: 1.8, t: .8 }];
  const kinds = ['camera', 'humanoid', 'simple_figure', 'prop', 'cube', 'group', 'target'];
  for (const kind of kinds) for (const steady of [true, false]) for (const focus of [null, 'fig1']) for (const existing of [null, 'move']) {
    const obj = { kind, position: [0, 1, 0], rotation: [0, 0, 0], scale: [1, 1, 1], ...(kind === 'prop' ? { propKey: 'x' } : {}), ...(kind === 'camera' ? { focalLengthMm: 35 } : {}) };
    const old = existing ? { id: 'old-move', kind: kind === 'camera' ? 'cam-path' : 'path', startS: 0, anchors: [{ pos: [0, 1, 0] }, { pos: [1, 1, 1] }], speedUnitsPerS: 1, focalLengthMm: 50 } : null;
    // ref: bind the verbatim method
    const { facade: fr, tracks: tr } = mkFacade(old); fr.objects = { subj: obj, fig1: { kind: 'simple_figure', position: [1, 0, 2], rotation: [0, 0, 0], scale: [1, 1, 1] } }; if (old) { const t = fr.addPerformanceTrack('subj'); fr.updateTrackItems(t, items => [old, ...items]); }
    const rFn = R.replaceMoveFromSamples;
    if (typeof rFn !== 'function') { FAIL++; FAILS.push('T8 FATAL: reference replaceMoveFromSamples not exported — oracle cannot run'); continue; }
    const r = rFn.call({ objects: { peek: () => fr.objects }, trackIdOf: fr.trackIdOf, addPerformanceTrack: fr.addPerformanceTrack, moveSegmentOf: fr.moveSegmentOf, updateTrackItems: fr.updateTrackItems, an: fr.an }, 'subj', 0, samples, { focusId: focus, steady });
    // port
    const { facade: fp, tracks: tp } = mkFacade(old); fp.objects = { subj: obj, fig1: { kind: 'simple_figure', position: [1, 0, 2], rotation: [0, 0, 0], scale: [1, 1, 1] } }; if (old) { const t = fp.addPerformanceTrack('subj'); fp.updateTrackItems(t, items => [old, ...items]); }
    const p = P.replaceMoveFromSamples(fp, 'subj', 0, samples, { focusId: focus, steady });
    const strip = x => JSON.parse(JSON.stringify(x, (k, v) => k === 'id' ? undefined : v));
    // r21 L3c (SANCTIONED DIVERGENCE, ledgered in docs/FIDELITY.md): the port's drawn
    // cam-path defaults aim 'travel' (the camera follows the curve — the user's r20/r21
    // "not auto-adjusting" ask); the live reference emits 'locked'. Normalize BOTH sides'
    // cam-path/no-subject items to 'locked' before comparing so T8 stays byte-strict on
    // everything else replaceMoveFromSamples produces (anchors, tangents, pace, speed).
    const normAim = o => (o && o.kind === 'cam-path' && o.aim === 'travel' && o.subjectId == null) ? { ...o, aim: 'locked' } : o;
    const normItems = trs => trs.map(t => ({ ...t, items: (t.items ?? []).map(normAim) }));
    const L = r !== null ? [strip(p), normItems(strip(tp))] : [p, strip(tp)];
    const Rr = r !== null ? [strip(r), normItems(strip(tr))] : [p ?? false, strip(tp)];
    eq(L, Rr, `T8 replace ${kind} steady=${steady} focus=${focus} existing=${existing}`);
  }
}

// ================= report =================
console.log(`\n==== ORACLE RESULT: ${PASS} PASS / ${FAIL} FAIL ====`);
for (const f of FAILS.slice(0, 25)) console.log('FAIL ' + f);
if (!FAIL) console.log('PLAN CANVAS PORT IS EXACT ACROSS THE FULL ORACLE MATRIX');
process.exit(FAIL ? 1 : 0);
