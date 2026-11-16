// viewport-modes.js — round 6 B5 (shade modes) + B6 (snap + ground grid).
// B5 is BEYOND the original (R3 verified: the live has no shading/wireframe toggle anywhere);
// B6 is user-mandated ("snap seems not working… allow a grid view on the ground") — the plan
// canvas's Shift-snap constants (Vie .25m / Yat 15°) are used as the 3D snap spec.
import * as THREE from 'three';

const SNAP_STEP = 0.25;        // Vie (plan-canvas move-snap grid, m)
const ROT_STEP = Math.PI / 12; // Yat 15° — RADIANS (TransformControls API is radians!)
const SCALE_STEP = 0.1;
const GRID_HALF = 24;         // ±24 m ground grid
const GRID_MINOR_ALPHA = 0.12, GRID_MAJOR_ALPHA = 0.3;

// ---------------- B6: ground grid ----------------
export function createGroundGrid(scene) {
  const group = new THREE.Group();
  group.name = 'groundGrid';
  const minor = [], major = [];
  for (let i = -GRID_HALF; i <= GRID_HALF; i++) {
    if (i === 0) continue;
    (i % 5 === 0 ? major : minor).push(
      -GRID_HALF, 0.01, i, GRID_HALF, 0.01, i,     // line along X at z=i
      i, 0.01, -GRID_HALF, i, 0.01, GRID_HALF);    // line along Z at x=i
  }
  const mk = (arr, alpha) => {
    if (!arr.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      color: 0x9aa3b8, transparent: true, opacity: alpha, depthWrite: false,
    }));
    m.renderOrder = 1;
    m.frustumCulled = false;
    m.raycast = () => {};      // grid must never intercept picking
    return m;
  };
  const a = mk(minor, GRID_MINOR_ALPHA), b = mk(major, GRID_MAJOR_ALPHA);
  if (a) group.add(a);
  if (b) group.add(b);
  group.visible = false;
  scene.add(group);
  return group;
}

// ---------------- B6: snap sync (per-frame; Shift = momentary inverse of the toggle) ----------------
export function syncSnap(tc, snapOn, shiftHeld) {
  if (!tc) return;
  const effective = snapOn !== shiftHeld;    // XOR — hold Shift to invert either way
  const t = effective ? SNAP_STEP : null;
  const r = effective ? ROT_STEP : null;
  const s = effective ? SCALE_STEP : null;
  if (tc.translationSnap !== t) tc.setTranslationSnap(t);
  if (tc.rotationSnap !== r) tc.setRotationSnap(r);
  if (tc.scaleSnap !== s) tc.setScaleSnap(s);
}

// ---------------- B5: shade modes ----------------
// shaded (default) | flat (flatShading facets, still lit + shadowed) | wireframe (tri wire,
// floor stays solid — an 80000²/128² plane in wireframe is pure moiré).
let applied = new WeakSet();
let currentMode = 'shaded';

function skipMesh(o, floor) {
  if (o === floor) return 'floor';                          // handled by the caller
  if (o.isSprite) return true;                              // name labels
  if (o.userData?.__hoverDisc) return true;                 // cursor indicator
  if (o.name === 'groundGrid') return true;
  let p = o.parent;
  while (p) { if (p.name === 'TransformControlsGizmo') return true; p = p.parent; }  // gizmo
  if (o.userData?.__selection) return true;
  return false;
}

export function applyRenderMode(root, floor, mode) {
  if (mode !== currentMode) {
    currentMode = mode;
    applied = new WeakSet();      // re-apply to every mesh (toggle both directions)
  }
  const seen = applied;
  const visit = o => {
    if (o.isMesh && !skipMesh(o, floor) && !seen.has(o)) {
      seen.add(o);
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m || m.isMeshBasicMaterial) continue;          // basic overlays stay clean
        if (m.flatShading !== undefined) m.flatShading = mode === 'flat';
        m.wireframe = mode === 'wireframe';
        m.needsUpdate = true;                               // one-time recompile hitch (100–300 ms) — expected
      }
    }
    for (const c of o.children) visit(c);
  };
  visit(root);
  // the floor keeps a solid material in every mode (wireframe floor = moiré)
  if (floor?.material && !floor.material.isMeshBasicMaterial) {
    if (floor.material.flatShading !== undefined) floor.material.flatShading = mode === 'flat';
    floor.material.wireframe = false;
    floor.material.needsUpdate = true;
  }
}
