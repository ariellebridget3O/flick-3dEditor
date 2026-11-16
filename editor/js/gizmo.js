// gizmo.js — exact port of the live custom gizmo meshes (Mzr) + patch (Pzr) applied to the
// vendored stock r182 TransformControls. Geometries/colors/opacities decoded from the bundle:
//   h$ = {X:0xE5534B, Y:0x55B35E, Z:0x4A86E8}; Nje=0xFFFFFF centre; gzr=0x171B26 dark shell;
//   bzr=0xFFD166 hover (live f8 setHex override -> stock materialLib.active).
//   shaft CylinderGeometry(.009,.009,.42,16) y .1→.52 (Jit/eot/Pje); cone ConeGeometry(.03,.115,24)
//   at .52→.635 (yzr/tot); scale box .056³ at .55 (gye/vzr); plane discs CircleGeometry(.045,28) at
//   corner offset .17 (xzr/Kj) opacity .6 double-side; centre sphere .036 20×14 + box .0612 with
//   BackSide dark shell inflated .006 (not/bye); rotate half-tori (.5,.0075) + E torus .75×.8 tube
//   white + XYZE .5×.45 tube white .35; renderOrder 1000010 gizmo / 1e6 shell (Szr/Tzr).
//   Negative-axis pickers dropped (Nzr: bbox centre on that axis < -.01).
import * as THREE from 'three';

const AXIS_COLORS = { X: 0xE5534B, Y: 0x55B35E, Z: 0x4A86E8 };  // h$
const WHITE = 0xFFFFFF;       // Nje
const DARK_SHELL = 0x171B26;  // gzr
const HOVER = 0xFFD166;       // bzr
const SHAFT_R = 0.009;        // Jit
const SHAFT_Y0 = 0.1;         // eot
const SHAFT_Y1 = 0.52;        // Pje
const CONE_R = 0.03;          // yzr
const CONE_H = 0.115;         // tot
const SCALE_BOX = 0.056;      // gye
const SCALE_Y = 0.55;         // vzr
const PLANE_R = 0.045;        // xzr
const PLANE_OFF = 0.17;       // Kj
const PLANE_OPACITY = 0.6;    // wzr
const CENTER_R = 0.036;       // not
const SHELL_GROW = 0.006;     // bye
const RING_R = 0.5;           // rot
const RING_TUBE = 0.0075;     // yye
const E_R = 0.75;             // _zr
const XYZE_OPACITY = 0.35;    // kzr
const GIZMO_RENDER_ORDER = 1000010;  // Szr
const SHELL_RENDER_ORDER = 1e6;      // Tzr
const AXES = ['X', 'Y', 'Z'];
const PLANES = ['XY', 'YZ', 'XZ'];
const MODES = ['translate', 'rotate', 'scale'];
// orientation matrices (Rje/Czr/Ezr/aot — geometry baked, mesh transform identity)
const SHAFT_M = {   // +Y cylinder/cone/box -> axis
  X: new THREE.Matrix4().makeRotationZ(-Math.PI / 2),
  Y: new THREE.Matrix4(),
  Z: new THREE.Matrix4().makeRotationX(Math.PI / 2),
};
const RING_M = {    // base YZ-plane ring -> axis (stock CircleGeometry + gizmoRotate tuples)
  X: new THREE.Matrix4(),
  Y: new THREE.Matrix4().makeRotationZ(-Math.PI / 2),
  Z: new THREE.Matrix4().makeRotationY(Math.PI / 2),
};
const PLANE_M = {   // XY-plane disc -> plane
  XY: new THREE.Matrix4(),
  YZ: new THREE.Matrix4().makeRotationY(Math.PI / 2),
  XZ: new THREE.Matrix4().makeRotationX(-Math.PI / 2),
};
const PLANE_OFF_V = { XY: [PLANE_OFF, PLANE_OFF, 0], YZ: [0, PLANE_OFF, PLANE_OFF], XZ: [PLANE_OFF, 0, PLANE_OFF] };
const PLANE_COLOR_AXIS = { XY: 'Z', YZ: 'X', XZ: 'Y' };   // Izr
const E_M = new THREE.Matrix4().makeRotationY(Math.PI / 2); // aot

// Hw — MeshBasicMaterial w/ depthTest off (visual, always on top)
const mat = (color, opacity = 1, side = THREE.FrontSide) => new THREE.MeshBasicMaterial({
  color, opacity, side, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false,
});

// f8 — named mesh at gizmo renderOrder
function handle(name, geometry, material) {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  m.renderOrder = GIZMO_RENDER_ORDER;
  return m;
}

// iot — centre visual: white core + BackSide dark shell grown along normals by .006
function centre(name, geometry) {
  const core = handle(name, geometry, mat(WHITE));
  const grown = geometry.clone();
  const pos = grown.attributes.position, nor = grown.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i,
      pos.getX(i) + nor.getX(i) * SHELL_GROW,
      pos.getY(i) + nor.getY(i) * SHELL_GROW,
      pos.getZ(i) + nor.getZ(i) * SHELL_GROW);
  }
  const shell = new THREE.Mesh(grown, mat(DARK_SHELL, 1, THREE.BackSide));
  shell.renderOrder = SHELL_RENDER_ORDER;
  core.add(shell);
  return core;
}

// vye — ring geometry: torus arc baked to the stock CircleGeometry convention + axis matrix
function ring(radius, tube, arcTurns, m4) {
  const g = new THREE.TorusGeometry(radius, tube, 8, 72, arcTurns * Math.PI * 2);
  g.rotateY(Math.PI / 2);
  g.rotateX(Math.PI / 2);
  g.applyMatrix4(m4);
  return g;
}

// shaft for one axis (oot): cylinder .009 × [.1,.52]
function shaft(axis) {
  const g = new THREE.CylinderGeometry(SHAFT_R, SHAFT_R, SHAFT_Y1 - SHAFT_Y0, 16);
  g.translate(0, (SHAFT_Y0 + SHAFT_Y1) / 2, 0);
  g.applyMatrix4(SHAFT_M[axis]);
  return handle(axis, g, mat(AXIS_COLORS[axis]));
}

// plane disc (lot): CircleGeometry(.045, 28) at corner offset, coloured by the ⟂ axis
function planeDisc(plane) {
  const g = new THREE.CircleGeometry(PLANE_R, 28);
  g.applyMatrix4(PLANE_M[plane]);
  g.translate(...PLANE_OFF_V[plane]);
  return handle(plane, g, mat(AXIS_COLORS[PLANE_COLOR_AXIS[plane]], PLANE_OPACITY, THREE.DoubleSide));
}

// Mzr — the three mode mesh sets
function buildCustomGizmo() {
  const translate = [], rotate = [], scale = [];
  for (const a of AXES) {
    const coneG = new THREE.ConeGeometry(CONE_R, CONE_H, 24);
    coneG.translate(0, SHAFT_Y1 + CONE_H / 2, 0);
    coneG.applyMatrix4(SHAFT_M[a]);
    translate.push(shaft(a), handle(a, coneG, mat(AXIS_COLORS[a])));
    const boxG = new THREE.BoxGeometry(SCALE_BOX, SCALE_BOX, SCALE_BOX);
    boxG.translate(0, SCALE_Y, 0);
    boxG.applyMatrix4(SHAFT_M[a]);
    scale.push(shaft(a), handle(a, boxG, mat(AXIS_COLORS[a])));
    rotate.push(handle(a, ring(RING_R, RING_TUBE, 0.5, RING_M[a]), mat(AXIS_COLORS[a])));
  }
  for (const p of PLANES) { translate.push(planeDisc(p)); scale.push(planeDisc(p)); }
  translate.push(centre('XYZ', new THREE.SphereGeometry(CENTER_R, 20, 14)));
  const c = CENTER_R * 1.7;
  scale.push(centre('XYZ', new THREE.BoxGeometry(c, c, c)));
  rotate.push(handle('E', ring(E_R, RING_TUBE * 0.8, 1, E_M), mat(WHITE)));
  rotate.push(handle('XYZE', ring(RING_R, RING_TUBE * 0.45, 1, E_M), mat(WHITE, XYZE_OPACITY)));
  return { translate, rotate, scale };
}

// Nzr — negative-axis picker test (name is a single axis, bbox centre on that axis < -.01)
function isNegativePicker(pickerMesh) {
  if (!AXES.includes(pickerMesh.name)) return false;
  pickerMesh.geometry.computeBoundingBox();
  return pickerMesh.geometry.boundingBox.getCenter(new THREE.Vector3())[pickerMesh.name.toLowerCase()] < -0.01;
}

// Pzr — patch the TransformControls: swap gizmo visuals, drop negative-axis pickers, recolor.
// Round-6 additions: (a) the stock helper set (full-length START/END/DELTA/AXIS lines through
// the object, depthTest-off — the "thick axis line" complaint) is REMOVED — the live ozr
// rewrite ships no helper lines either; (b) hover amber (bzr #FFD166) is applied to the custom
// meshes via tickGizmoHover(tc.axis poll) — the stock materialLib recolor can't reach meshes
// that own their materials (the round-5 port left hover dead).
export function applyCustomGizmo(tc) {
  const gizmo = tc._gizmo;
  const sets = buildCustomGizmo();
  for (const mode of MODES) {
    gizmo.gizmo[mode].clear();
    gizmo.gizmo[mode].add(...sets[mode]);
    for (const p of [...gizmo.picker[mode].children]) {
      if (isNegativePicker(p)) gizmo.picker[mode].remove(p);
    }
  }
  // round 6: no stock helper lines (START/END/DELTA full-axis lines + rotate AXIS arcs).
  // Vendor r182 stores helpers as gizmo.helper[mode] GROUPS (an object, not the old array).
  if (gizmo.helper) for (const m of MODES) gizmo.helper[m]?.removeFromParent?.();
  tc.setColors(AXIS_COLORS.X, AXIS_COLORS.Y, AXIS_COLORS.Z, HOVER);
  return tc;
}

// ---- hover highlight on the custom meshes (bzr amber) ----
const hoverLast = new WeakMap();
const handleBase = name => name in AXIS_COLORS ? AXIS_COLORS[name]
  : name === 'XY' ? AXIS_COLORS.Z : name === 'YZ' ? AXIS_COLORS.X : name === 'XZ' ? AXIS_COLORS.Y : WHITE;
export function tickGizmoHover(tc) {
  if (!tc || !tc._gizmo) return;
  const axis = tc.axis || null;
  if (hoverLast.get(tc) === axis) return;
  hoverLast.set(tc, axis);
  const group = tc._gizmo.gizmo[tc.mode];
  if (!group) return;
  for (const m of group.children) {
    if (m.name === 'shell') continue;                       // dark shells stay dark
    m.material?.color?.setHex(axis && m.name === axis ? HOVER : handleBase(m.name));
  }
}
