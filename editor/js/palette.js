// palette.js — the Actions window (live M5r family, r8 exact port).
// Source: analysis/tmp_palette_exact/ (68 byte-verified units + MAP.md port-spec;
// tile renderers D5r/H5r/y5r @5144602/5146990/5133545, payload model e3r/MDe,
// viewport drop BUr @5619004). Store methods live in store.js (r8 family).
import { C, CLIPS, CAM_MOVE_PRESETS } from './const.js';
import { camMovePose } from './tracks.js';
import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';

// ---- payload model ($v/e3r/MDe @5080998..5083602) ----
export const ACTION_MIME = 'application/x-stage-action';            // $v
const CLIP_IDS = new Set(Object.keys(CLIPS));                       // t3r (46)
const OBJECT_ACTIONS = new Set(['rotate', 'revolve', 'scale-up', 'scale-down', 'transform', 'rig-transform']);  // QSr (+YSr rig-transform)
const CINEMATIC_MOVES = ['orbit', 'dolly_in', 'dolly_out', 'dolly_zoom', 'crane_up', 'crane_down', 'spiral', 'pan_sweep'];  // bP
export const CAMERA_ACTIONS = ['still', 'path', 'follow', 'transform', 'manual', ...CINEMATIC_MOVES];  // xie/JSr
export const isCinematicMove = a => CINEMATIC_MOVES.includes(a);    // g5r

// e3r @5081204 — dragstart payload serializer
export function serializeActionPayload(p) {
  switch (p.kind) {
    case 'clip': return `clip:${p.clip}`;
    case 'object': return `object:${p.action}`;
    case 'camera': return `camera:${p.action}`;
    case 'path': return 'path';
    case 'play': return 'play';
    default: return null;
  }
}
// MDe @5083236 — drop payload parser (validates against the catalog sets)
export function parseActionPayload(s) {
  if (typeof s !== 'string' || !s) return null;
  if (s === 'path') return { kind: 'path' };
  if (s === 'play') return { kind: 'play' };
  const i = s.indexOf(':');
  if (i < 0) return null;
  const kind = s.slice(0, i), rest = s.slice(i + 1);
  if (kind === 'clip') return CLIP_IDS.has(rest) ? { kind: 'clip', clip: rest } : null;
  if (kind === 'object') return OBJECT_ACTIONS.has(rest) ? { kind: 'object', action: rest } : null;
  if (kind === 'camera') return CAMERA_ACTIONS.includes(rest) ? { kind: 'camera', action: rest } : null;
  return null;
}
// n3r @5081381 + sje @5081533 — default duration per payload when dropped on a lane
export function defaultDurationFor(p) {
  if (p.kind === 'clip') return C.ITEM_DEFAULT_DUR;                   // N8=5
  if (p.kind === 'object') return (p.action === 'transform' || p.action === 'rig-transform') ? 4 : C.ITEM_DEFAULT_DUR;  // Jae=4
  if (p.kind === 'camera') return cameraActionDuration(p.action);
  return 0;   // path / play
}
export function cameraActionDuration(a) {                            // sje
  if (a in CAM_MOVE_PRESETS) return CAM_MOVE_PRESETS[a].durationS;
  if (a === 'path' || a === 'manual') return 0;
  if (a === 'transform') return 4;
  return C.ITEM_DEFAULT_DUR;
}

// ---- data tables (E5r @5136560 / PU labels resolved-English MAP §6 / I5r / s3r+NDe / C5r) ----
const OBJECT_TILE_ACTIONS = [                                        // E5r (verbatim order)
  { action: 'rotate', icon: 'rotate', label: 'Rotate' },
  { action: 'revolve', icon: 'orbit', label: 'Revolve' },
  { action: 'scale-up', icon: 'expand', label: 'Scale Up' },
  { action: 'scale-down', icon: 'collapse', label: 'Scale Down' },
  { action: 'transform', icon: 'sliders', label: 'Transform' },
];
export const CLIP_LABELS = {                                         // PU English (MAP §6; a_tpose absent from vGt)
  crouch_fwd: 'Crouch Fwd', crouch_idle: 'Crouch Idle', dance: 'Dance', death01: 'Death01',
  driving: 'Driving', fixing_kneeling: 'Fixing Kneeling', hit_chest: 'Hit Chest', hit_head: 'Hit Head',
  idle: 'Idle', idle_talking: 'Idle Talking', idle_torch: 'Idle Torch', interact: 'Interact',
  jog_fwd: 'Jog Fwd', jump: 'Jump', jump_land: 'Jump Land', jump_start: 'Jump Start',
  pickup_table: 'Pickup Table', pistol_aim_down: 'Pistol Aim Down', pistol_aim_neutral: 'Pistol Aim Neutral',
  pistol_aim_up: 'Pistol Aim Up', pistol_idle: 'Pistol Idle', pistol_reload: 'Pistol Reload',
  pistol_shoot: 'Pistol Shoot', punch_cross: 'Punch Cross', punch_enter: 'Punch Enter', punch_jab: 'Punch Jab',
  push: 'Push', roll: 'Roll', roll_rm: 'Roll Rm', sitting_enter: 'Sitting Enter', sitting_exit: 'Sitting Exit',
  sitting_idle: 'Sitting Idle', sitting_talking: 'Sitting Talking', spell_simple_enter: 'Spell Simple Enter',
  spell_simple_exit: 'Spell Simple Exit', spell_simple_idle: 'Spell Simple Idle', spell_simple_shoot: 'Spell Simple Shoot',
  sprint: 'Sprint', swim_fwd: 'Swim Fwd', swim_idle: 'Swim Idle', sword_attack: 'Sword Attack',
  sword_attack_rm: 'Sword Attack Rm', sword_idle: 'Sword Idle', walk: 'Walk', walk_formal: 'Walk Formal',
};
const PALETTE_CLIPS = Object.keys(CLIPS).filter(id => id !== 'a_tpose');   // vGt = 45, catalog order
const ICON_FALLBACK = 'video';
const CAMERA_ICONS = { still: 'stop', path: 'spline', follow: 'locate', transform: 'sliders', manual: 'phone-camera' };  // I5r
export const CAMERA_LABELS = {                                       // s3r/NDe (cinematic IT-semantic)
  still: 'Still', path: 'Path', follow: 'Follow', transform: 'Transform', manual: 'Manual',
  orbit: 'Orbit', dolly_in: 'Dolly In', dolly_out: 'Dolly Out', dolly_zoom: 'Dolly Zoom',
  crane_up: 'Crane Up', crane_down: 'Crane Down', spiral: 'Spiral', pan_sweep: 'Pan Sweep',
};
const TAB_CAPTIONS = { move: 'Drag onto an object in the scene', animate: 'Humans only', camera: 'Cameras only' };  // C5r (ZHYI6T IT, WSviW0 F, xmwcS8 IT)
const TILE_TITLES = {                                                // MAP §9 (F rows exact, IT rows semantic)
  path: 'Drag into the scene, then draw the path',                   // a1QB8W IT
  object: 'Drag onto an object',                                     // w2DmPr IT
  camera: 'Drag onto the scene to film',                             // 1YVTmS IT
  play: 'Drag onto a human, then play the scene like a game and record their moves',  // T91vKp/Cd1cVD F
  rig: 'Drag onto a human, then pose its joints in the scene',       // f88wXe F
  addDisabled: 'Select an object this can act on',                   // 13Y2lv F
};
const STILL_T = { orbit: .28, dolly_in: .75, dolly_out: .75, dolly_zoom: .8, crane_up: .7, crane_down: .7, spiral: .35, pan_sweep: .45 };  // m5r
const CUBE_FRACTIONS = { rotate: .14, revolve: .12, 'scale-up': .5, 'scale-down': .5 };  // B5r
const CUBE_CYCLE = 2.4;                                              // h2e
const CAM_LOOP = 3;                                                  // Ort
const CAM_TILE_FOV = 40;                                             // Lrt
const CAM_START = [0, 1.6, 4.5], CAM_TARGET = [0, 1.1, 0];           // h5r/p5r
const THUMB = 128;                                                   // IP/Brt/Frt/Hrt
const CLIP_POSE_FRACTION = .35;                                      // L5r
const HUMANOID_URL = C.HUMANOID_URL;                                 // Hhe
const HUMANOID_HEIGHT = 1.75;                                        // jP

// ---- minimal inline icon set (K component equivalents, stroke=currentColor) ----
const ICON_PATHS = {
  add: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M18 6L6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  orbit: '<circle cx="12" cy="12" r="3"/><path d="M19.1 4.9a9 9 0 1 0 2 3.1"/><path d="M19 5V2h3" transform="translate(-1.5 2.5) scale(.9)"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  collapse: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
  spline: '<path d="M3 17c4-8 8 8 12 0 2-4 4-4 6-3"/>',
  locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  'phone-camera': '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  video: '<rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10l7-3v10l-7-3"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  pose: '<circle cx="12" cy="5" r="2.2"/><path d="M12 7.5v6M12 9l-4.5 2.5M12 9l4.5 2.5M12 13.5L9 20M12 13.5L15 20"/>',
};
const iconSVG = (name, size = '2xl') =>
  `<svg class="ico-${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] ?? ICON_PATHS[ICON_FALLBACK]}</svg>`;

// ---- shared preview-material normalize ($he @5132641: roughness=1, M_Main→#f29a5c) ----
function normalizePreviewMaterials(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m) continue;
      m.roughness = 1;
      if (m.name === 'M_Main') m.color.set('#f29a5c');
    }
  });
}
// Drt/Rrt — skeleton dispose
function disposeSkeletons(root) {
  root.traverse(o => { if (o.isSkinnedMesh) o.skeleton?.dispose?.(); });
}
// deep dispose (Kd equivalent)
function deepDispose(root) {
  root.traverse(o => {
    o.geometry?.dispose?.();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) { m?.map?.dispose?.(); m?.dispose?.(); }
  });
}
// u5r @5132768 — mannequin fallback (capsules, #f29a5c roughness 1)
function mannequinFallback() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#f29a5c', roughness: 1 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.18, .5, 4, 12), mat); torso.position.y = 1.15; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), mat); head.position.y = 1.62; g.add(head);
  const limb = (r, h, x, y) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 4, 8), mat); m.position.set(x, y, 0); g.add(m); };
  limb(.055, .55, -.27, 1.15); limb(.055, .55, .27, 1.15);
  limb(.07, .65, -.1, .42); limb(.07, .65, .1, .42);
  return g;
}
// b5r/$rt — triangle waves (camera loop ping-pong / scale mid-point)
const triangleWave = x => Math.abs(x - Math.floor(x) - .5) * 2;

// ================= ClipTileRenderer (D5r @5144602) =================
class ClipTileRenderer {
  constructor() {
    this.renderer = null; this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, .1, 20);
    this.model = null; this.mixer = null; this.actions = new Map();
    this.currentClip = null; this.loadPromise = null;
    this.rafId = null; this.loopToken = 0; this.pendingPoses = []; this.disposed = false;
  }
  ensureLoaded() {
    if (this.loadPromise) return this.loadPromise;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(THUMB, THUMB);
    this.camera.position.set(.7, 1.3, 3.1);
    this.camera.lookAt(0, .85, 0);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.4));
    const dir = new THREE.DirectionalLight(0xffffff, 2); dir.position.set(2, 4, 3); this.scene.add(dir);
    this.loadPromise = new GLTFLoader().loadAsync(HUMANOID_URL).then(gltf => {
      const root = gltf.scene;
      if (this.disposed) { disposeSkeletons(root); deepDispose(root); return; }
      normalizePreviewMaterials(root);
      root.rotation.y = Math.PI;
      const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
      if (size.y > 0) root.scale.multiplyScalar(HUMANOID_HEIGHT / size.y);
      const box = new THREE.Box3().setFromObject(root);
      const center = box.getCenter(new THREE.Vector3());
      root.position.set(-center.x, -box.min.y, -center.z);
      this.model = root;
      this.mixer = new THREE.AnimationMixer(root);
      for (const clip of gltf.animations) this.actions.set(clip.name, this.mixer.clipAction(clip));
      this.scene.add(root);
    }).catch(() => {   // u5r fallback when the GLB is unavailable
      if (!this.disposed && !this.model) this.scene.add(mannequinFallback());
    });
    return this.loadPromise;
  }
  setClip(clip, timeS) {
    if (!this.mixer) return;
    const action = this.actions.get(clip);
    if (!action) return;
    if (this.currentClip !== clip) {
      if (this.currentClip) this.actions.get(this.currentClip)?.stop();
      action.play();
      this.currentClip = clip;
    }
    action.time = timeS % action.getClip().duration;
    this.mixer.update(0);
  }
  renderTo(canvas) {
    if (!this.renderer) return;
    this.renderer.render(this.scene, this.camera);
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(this.renderer.domElement, 0, 0, canvas.width, canvas.height); }
  }
  drawPose(canvas, clip) {
    this.ensureLoaded().then(() => {
      if (this.disposed) return;
      if (this.rafId !== null) { this.pendingPoses.push({ canvas, clip }); return; }
      this.setClip(clip, (CLIPS[clip] ?? 1) * CLIP_POSE_FRACTION);
      this.renderTo(canvas);
    });
  }
  startLoop(canvas, clip) {
    this.stopLoop();
    const token = ++this.loopToken;
    this.ensureLoaded().then(() => {
      if (this.disposed || token !== this.loopToken) return;
      this.setClip(clip, 0);
      let last = performance.now();
      const tick = now => {
        this.mixer?.update((now - last) / 1e3); last = now;
        this.renderTo(canvas);
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    });
  }
  stopLoop() {
    this.loopToken++;
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    const pending = this.pendingPoses; this.pendingPoses = [];
    for (const { canvas, clip } of pending) this.drawPose(canvas, clip);
  }
  dispose() {
    this.disposed = true;
    this.stopLoop();
    if (this.model) { disposeSkeletons(this.model); deepDispose(this.model); }
    this.renderer?.forceContextLoss();
    this.renderer?.dispose();
  }
}

// ================= CubeTileRenderer (H5r @5146990) =================
class CubeTileRenderer {
  constructor() {
    this.renderer = null; this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, .1, 20);
    this.cube = null; this.rafId = null; this.loopToken = 0; this.disposed = false;
  }
  ensureRenderer() {
    if (this.renderer || this.disposed) return;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(THUMB, THUMB);
    this.camera.position.set(2.2, 1.9, 3);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.4));
    const dir = new THREE.DirectionalLight(0xffffff, 2); dir.position.set(2, 4, 3); this.scene.add(dir);
    this.cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xcc8844, roughness: .55, metalness: .05 }));
    this.scene.add(this.cube);
  }
  applyPose(action, timeS) {
    const cube = this.cube;
    if (!cube) return;
    const t = (timeS % CUBE_CYCLE) / CUBE_CYCLE;
    cube.position.set(0, 0, 0);
    cube.rotation.set(.25, .4, 0);
    cube.scale.setScalar(1);
    switch (action) {
      case 'rotate': cube.rotation.set(.25, t * Math.PI * 2, 0); break;
      case 'revolve': {
        const a = t * Math.PI * 2, r = .7;
        cube.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
        break;
      }
      case 'scale-up': cube.scale.setScalar(1 + triangleWave(t) * .7); break;
      case 'scale-down': cube.scale.setScalar(1 - triangleWave(t) * .5); break;
    }
  }
  renderTo(canvas) {
    if (!this.renderer) return;
    this.renderer.render(this.scene, this.camera);
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(this.renderer.domElement, 0, 0, canvas.width, canvas.height); }
  }
  drawPose(canvas, action) {
    this.ensureRenderer();
    if (this.disposed || this.rafId !== null) return;
    this.applyPose(action, (CUBE_FRACTIONS[action] ?? .5) * CUBE_CYCLE);
    this.renderTo(canvas);
  }
  startLoop(canvas, action) {
    this.stopLoop();
    this.ensureRenderer();
    if (this.disposed) return;
    const token = ++this.loopToken;
    let last = performance.now(), acc = 0;
    const tick = now => {
      if (this.disposed || token !== this.loopToken) return;
      acc += (now - last) / 1e3; last = now;
      this.applyPose(action, acc);
      this.renderTo(canvas);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
  stopLoop() {
    this.loopToken++;
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }
  dispose() {
    this.disposed = true;
    this.stopLoop();
    if (this.cube) deepDispose(this.cube);
    this.renderer?.forceContextLoss();
    this.renderer?.dispose();
  }
}

// ================= CameraTileRenderer (y5r @5133545) =================
class CameraTileRenderer {
  constructor() {
    this.renderer = null; this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CAM_TILE_FOV, 1, .1, 100);
    this.set = null; this.subject = null; this.mixer = null; this.loadPromise = null;
    this.rafId = null; this.loopToken = 0; this.disposed = false;
  }
  buildSet() {
    if (this.renderer || this.disposed) return;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(THUMB, THUMB);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.2));
    const dir = new THREE.DirectionalLight(0xffffff, 2); dir.position.set(2, 5, 3); this.scene.add(dir);
    const group = new THREE.Group();
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: .95 }));
    ground.rotation.x = -Math.PI / 2; group.add(ground);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xa8a8a8, roughness: .8 });
    for (const [x, , z, h] of [[-2.2, -1.4, 3], [2.4, -.6, 2.2], [-1.6, 2.2, 1.6]]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(.5, h, .5), pillarMat);
      p.position.set(x, h / 2, z); group.add(p);
    }
    this.set = group; this.scene.add(group);
  }
  ensureLoaded() {
    if (this.loadPromise) return this.loadPromise;
    this.buildSet();
    this.loadPromise = new GLTFLoader().loadAsync(HUMANOID_URL).then(gltf => {
      const root = gltf.scene;
      if (this.disposed || !this.set) { disposeSkeletons(root); deepDispose(root); return; }
      normalizePreviewMaterials(root);
      root.rotation.y = Math.PI;
      const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
      if (size.y > 0) root.scale.multiplyScalar(HUMANOID_HEIGHT / size.y);
      const box = new THREE.Box3().setFromObject(root);
      const center = box.getCenter(new THREE.Vector3());
      root.position.set(-center.x, -box.min.y, -center.z);
      this.subject = root; this.set.add(root);
      const idle = gltf.animations.find(c => c.name === 'idle');   // f5r
      if (idle) {
        this.mixer = new THREE.AnimationMixer(root);
        this.mixer.clipAction(idle).play();
        this.mixer.update(idle.duration * .4);
      }
    }).catch(() => {
      if (!this.disposed && this.set && !this.subject) this.set.add(mannequinFallback());
    });
    return this.loadPromise;
  }
  applyPose(action, t) {
    const pose = camMovePose({ kind: action, t, start: CAM_START, target: CAM_TARGET, direction: 'cw', baseFovDeg: CAM_TILE_FOV });
    this.camera.position.set(...pose.position);
    this.camera.lookAt(...pose.lookAt);
    if (this.camera.fov !== pose.fovDeg) { this.camera.fov = pose.fovDeg; this.camera.updateProjectionMatrix(); }
  }
  renderTo(canvas) {
    if (!this.renderer) return;
    this.renderer.render(this.scene, this.camera);
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(this.renderer.domElement, 0, 0, canvas.width, canvas.height); }
  }
  drawPose(canvas, action) {
    this.ensureLoaded().then(() => {
      if (this.disposed || this.rafId !== null) return;
      this.applyPose(action, STILL_T[action] ?? .5);
      this.renderTo(canvas);
    });
  }
  startLoop(canvas, action) {
    this.stopLoop();
    const token = ++this.loopToken;
    this.ensureLoaded().then(() => {
      if (this.disposed || token !== this.loopToken) return;
      let last = performance.now(), acc = 0;
      const tick = now => {
        if (this.disposed || token !== this.loopToken) return;
        const dt = (now - last) / 1e3; last = now;      // review P2-2: ONE diff — the second read was always 0 (frozen mixer)
        acc += dt;
        this.mixer?.update(dt);
        this.applyPose(action, triangleWave((acc % CAM_LOOP) / CAM_LOOP));
        this.renderTo(canvas);
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    });
  }
  stopLoop() {
    this.loopToken++;
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }
  dispose() {
    this.disposed = true;
    this.stopLoop();
    this.mixer?.stopAllAction();
    if (this.subject) disposeSkeletons(this.subject);
    if (this.set) deepDispose(this.set);
    this.renderer?.forceContextLoss();
    this.renderer?.dispose();
  }
}

// ================= the window (M5r @5137181) =================
const WIDTH_MIN = 200, WIDTH_MAX = 520, WIDTH_DEFAULT = 260;   // Xj clamp

export function createPalette(app) {
  const root = document.createElement('aside');
  root.className = 'palette';
  root.setAttribute('data-onboard-target', 'actions');
  root.innerHTML = `
    <div class="palette-handle" title="Drag to resize"></div>
    <div class="palette-head">
      <span class="palette-title">Actions</span>
      <button class="palette-close" aria-label="Hide actions" title="Hide actions">${iconSVG('close', 'xs')}</button>
    </div>
    <div class="palette-search">
      ${iconSVG('search', 'sm')}
      <input type="text" placeholder="Search actions" aria-label="Search actions"/>
    </div>
    <div class="palette-tabs">
      <button data-tab="move">Move<span class="tab-count"></span></button>
      <button data-tab="animate">Animate<span class="tab-count"></span></button>
      <button data-tab="camera">Camera<span class="tab-count"></span></button>
    </div>
    <div class="palette-caption"></div>
    <div class="palette-scroll"><div class="palette-pane"></div></div>`;
  app.container.appendChild(root);   // the viewport host (App.container)

  const state = {
    open: false, tab: 'move', query: '', requestedTab: null,
    width: WIDTH_DEFAULT, renderers: { clip: new ClipTileRenderer(), cube: new CubeTileRenderer(), camera: new CameraTileRenderer() },
    hoverTile: null,
  };
  app.palette = {
    root, state,
    toggle: () => (state.open ? palette.close() : palette.open()),
    open: null, close: null, revealFor: null,
    dismiss: null,   // set below (SCr n: addActionToTrack → dismissActions)
  };
  const palette = app.palette;

  const q = () => root.querySelector('.palette-search input');
  const pane = () => root.querySelector('.palette-pane');

  const open = () => {
    state.open = true;
    root.classList.remove('collapsed');
    // live onActionsOpened → clearSelectionForWindow: OBJECT selection only (selectedSegment survives)
    app.objects.select([]);
    render();
  };
  const close = () => {
    state.open = false;
    root.classList.add('collapsed');
    stopHoverLoop();
  };
  // revealActionsFor (audit P1-2): lane "+" opens the palette with a one-shot tab by character kind
  const revealFor = characterId => {
    const kind = app.objects.get(characterId)?.kind;
    state.requestedTab = kind === 'camera' ? 'camera' : kind === 'humanoid' ? 'animate' : 'move';
    if (!state.open) open(); else render();
    queueMicrotask(() => { state.requestedTab = null; });
  };
  const dismiss = () => close();     // SCr onAddAction chain ends with dismissActions
  palette.open = open; palette.close = close; palette.revealFor = revealFor; palette.dismiss = dismiss;

  root.querySelector('.palette-close').onclick = () => close();

  // width resize (Dhe port; audit P2-7 geometry decision: left-border handle, drag-left = widen)
  const handle = root.querySelector('.palette-handle');
  handle.addEventListener('pointerdown', e => {
    e.preventDefault();
    let startX = e.clientX, startW = state.width;
    const mv = ev => {
      const dx = startX - ev.clientX;                    // drag-left widens
      state.width = Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, startW + dx));
      root.style.width = `${state.width}px`;
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    try { handle.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });

  root.querySelectorAll('.palette-tabs button').forEach(b => b.onclick = () => { state.tab = b.dataset.tab; render(); });
  q().addEventListener('input', () => { state.query = q().value; render(); });

  // ---- tile factory ----
  const canAdd = payload => {
    const id = app.objects.selectedId;
    return id != null && app.show.canDropActionOnObject(id, payload);
  };
  const stopHoverLoop = () => {
    state.hoverTile = null;
    state.renderers.clip.stopLoop();
    state.renderers.cube.stopLoop();
    state.renderers.camera.stopLoop();
  };
  const addPayload = payload => {
    const id = app.objects.selectedId;
    if (id == null || !app.show.canDropActionOnObject(id, payload)) return;
    app.show.beginEditGesture();                       // audit P1-1: ONE outer bracket per user action
    try { app.show.appendActionToObject(id, payload); }
    finally { app.show.endEditGesture(); }
    palette.dismiss();                                 // n.onActionAdded → closeActions
    app._ui?.refreshInspector();                       // segment selection changed (page.changed alone doesn't refresh)
    app._ui?.refreshTimeline();
  };
  const beginDrag = (e, payload) => {
    e.dataTransfer.setData(ACTION_MIME, serializeActionPayload(payload));
    e.dataTransfer.effectAllowed = 'copy';
    app.show.draggingAction = payload;                 // onActionDragStart (store signal equivalent)
  };
  const endDrag = () => {
    app.show.draggingAction = null;                    // onActionDragEnd — drop-target restore driver
    installActionDrop.restore?.();
  };
  const addButtonHTML = payload => {
    const enabled = canAdd(payload);
    const tip = enabled ? 'Add to selected object' : TILE_TITLES.addDisabled;
    return `<button class="tile-add" draggable="false" aria-disabled="${!enabled}" aria-label="${tip}" title="${tip}" data-add-payload='${JSON.stringify(payload)}'>${iconSVG('add', 'xs')}</button>`;   // review P3-14: N5r aria-label
  };
  const tileHTML = ({ draggable = true, title, thumb, icon, name, payload, colorVar }) => `
    <div class="tile" ${draggable ? 'draggable="true"' : ''} title="${title ?? ''}" data-payload='${JSON.stringify(payload)}'>
      ${addButtonHTML(payload)}
      ${thumb ? `<canvas class="tile-thumb" width="${THUMB}" height="${THUMB}"></canvas>` : `<span class="icon-thumb" style="${colorVar ? `color:${colorVar}` : ''}">${iconSVG(icon, '2xl')}</span>`}
      <span class="tile-name">${name}</span>
    </div>`;

  const wireTile = (el, payload, thumbAction) => {
    if (!el) return;
    if (thumbAction) {
      const canvas = el.querySelector('canvas.tile-thumb');
      if (canvas) {
        el.addEventListener('pointerenter', () => {
          const r = state.renderers;
          (thumbAction.kind === 'clip' ? r.clip : thumbAction.kind === 'cube' ? r.cube : r.camera).startLoop(canvas, thumbAction.action);
        });
        el.addEventListener('pointerleave', () => { stopHoverLoop(); thumbAction.draw(canvas); });   // review P2-3: restore the still thumb
        thumbAction.draw(canvas);   // static still (L5r .35 / B5r / m5r)
      }
    }
    el.addEventListener('dragstart', e => { beginDrag(e, payload); });
    el.addEventListener('dragend', endDrag);
  };
  pane().addEventListener('click', e => {
    const btn = e.target.closest('.tile-add');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    addPayload(JSON.parse(btn.dataset.addPayload));
  });
  // live reactive canAddAction: add-button enable states track the selection (cheap DOM update);
  // full re-render only when the SELECTED OBJECT changes (switch notice + clip gates)
  app.objects.subscribe(() => {
    if (!state.open) return;
    const selChanged = app.objects.selectedId !== state._renderedSelId;
    if (selChanged) { render(); return; }
    pane().querySelectorAll('.tile-add').forEach(btn => {
      let payload;
      try { payload = JSON.parse(btn.dataset.addPayload); } catch { return; }
      const enabled = canAdd(payload);
      btn.setAttribute('aria-disabled', String(!enabled));
      btn.title = enabled ? 'Add to selected object' : TILE_TITLES.addDisabled;
    });
  });

  const drawThumb = (canvas, kind, action) => {
    const r = state.renderers;
    if (kind === 'clip') r.clip.drawPose(canvas, action);
    else if (kind === 'cube') r.cube.drawPose(canvas, action);
    else r.camera.drawPose(canvas, action);
  };

  // ---- render (tab panes; live M5r move/animate/camera structure) ----
  const render = () => {
    stopHoverLoop();                                   // review P2-12: a re-render rebuilds canvases — stop any hover loop first
    const query = state.query.trim().toLowerCase();
    const matches = s => !query || s.toLowerCase().includes(query);
    if (state.requestedTab) state.tab = state.requestedTab;

    // tab filtering (verbatim M5r lists + counts + auto-switch to first non-empty)
    const objectTiles = OBJECT_TILE_ACTIONS.filter(t => matches(t.label));
    const playMatch = matches('Play'), rigMatch = matches('Rig Transform');
    const clipTiles = PALETTE_CLIPS.map(id => ({ id, label: CLIP_LABELS[id] ?? id })).filter(t => matches(t.label));
    const pathMatch = matches('Path');
    const camTiles = CAMERA_ACTIONS.map(a => ({ action: a, label: CAMERA_LABELS[a] ?? a })).filter(t => matches(t.label));
    const counts = {
      move: (pathMatch ? 1 : 0) + objectTiles.length,
      animate: (playMatch ? 1 : 0) + (rigMatch ? 1 : 0) + clipTiles.length,
      camera: camTiles.length,
    };
    root.querySelectorAll('.palette-tabs button').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === state.tab);
      const c = b.querySelector('.tab-count');
      c.textContent = query ? String(counts[b.dataset.tab]) : '';
    });
    if (query && counts[state.tab] === 0) {
      const first = ['move', 'animate', 'camera'].find(t => counts[t] > 0);
      if (first) { state.tab = first; }
    }
    root.querySelector('.palette-caption').textContent = TAB_CAPTIONS[state.tab] ?? '';

    // simple-figure switch notice (animate tab; user-named interpolation → textContent, SKILL #55)
    let notice = null;
    const selId = app.objects.selectedId;
    const selObj = selId != null ? app.objects.get(selId) : null;
    if (state.tab === 'animate' && selObj?.kind === 'simple_figure') {   // review P3-13: verbatim has no query gate
      notice = document.createElement('div');
      notice.className = 'palette-notice';
      const txt = document.createElement('div');
      txt.textContent = `${selObj.name || 'Figure'} is a simple figure — switch to human to add clips`;   // LtrDTL IT
      const btn = document.createElement('button');
      btn.className = 'ghost small';
      btn.textContent = 'Switch to human';   // dvQ5qW IT
      btn.onclick = () => app.pickPersonKind?.(selId, 'humanoid');
      notice.append(txt, btn);
    }

    const sections = [];
    if (state.tab === 'move') {
      const tiles = [];
      if (pathMatch) tiles.push(tileHTML({ draggable: true, title: TILE_TITLES.path, icon: 'spline', name: 'Path', payload: { kind: 'path' }, colorVar: 'var(--stage-action-object)' }));
      for (const t of objectTiles) {
        if (t.action === 'transform') {
          tiles.push(tileHTML({ draggable: true, title: TILE_TITLES.object, icon: t.icon, name: t.label, payload: { kind: 'object', action: t.action }, colorVar: 'var(--stage-action-object)' }));   // inline icon tile (M5r inlines transform)
        } else {
          tiles.push(tileHTML({ draggable: true, title: TILE_TITLES.object, thumb: true, name: t.label, payload: { kind: 'object', action: t.action } }));
        }
      }
      sections.push(`<div class="tile-grid">${tiles.join('')}</div>`);
    } else if (state.tab === 'animate') {
      const perform = [];
      if (playMatch) perform.push(tileHTML({ draggable: true, title: TILE_TITLES.play, icon: 'play', name: 'Play', payload: { kind: 'play' }, colorVar: 'var(--stage-action-human)' }));
      if (rigMatch) perform.push(tileHTML({ draggable: true, title: TILE_TITLES.rig, icon: 'pose', name: 'Rig Transform', payload: { kind: 'object', action: 'rig-transform' }, colorVar: 'var(--stage-action-human)' }));
      const clips = clipTiles.map(t => tileHTML({ draggable: true, title: t.label, thumb: true, name: t.label, payload: { kind: 'clip', clip: t.id } }));
      sections.push(`${perform.length ? `<div class="section-label">Perform</div><div class="tile-grid">${perform.join('')}</div>` : ''}`);
      sections.push(`<div class="section-label">Clips</div><div class="tile-grid">${clips.join('')}</div>`);
    } else {
      const tiles = camTiles.map(t => {
        const payload = { kind: 'camera', action: t.action };
        return isCinematicMove(t.action)
          ? tileHTML({ draggable: true, title: TILE_TITLES.camera, thumb: true, name: t.label, payload })
          : tileHTML({ draggable: true, title: TILE_TITLES.camera, icon: CAMERA_ICONS[t.action] ?? ICON_FALLBACK, name: t.label, payload, colorVar: 'var(--stage-action-camera)' });
      });
      sections.push(`<div class="tile-grid">${tiles.join('')}</div>`);
    }
    state._renderedSelId = app.objects.selectedId;
    pane().innerHTML = sections.join('');
    if (notice) pane().prepend(notice);
    root.style.width = state.open ? `${state.width}px` : '0px';

    // wire tiles + draw stills (build-once DOM per render; canvases are new each render — SKILL #31
    // doesn't apply here because the search input lives OUTSIDE the pane and keeps focus/caret)
    pane().querySelectorAll('.tile').forEach(el => {
      const payload = JSON.parse(el.dataset.payload);
      const canvas = el.querySelector('canvas.tile-thumb');
      if (!canvas) return;
      if (payload.kind === 'clip') wireTile(el, payload, { kind: 'clip', action: payload.clip, draw: c => drawThumb(c, 'clip', payload.clip) });
      else if (payload.kind === 'object') wireTile(el, payload, { kind: 'cube', action: payload.action, draw: c => drawThumb(c, 'cube', payload.action) });
      else if (payload.kind === 'camera' && isCinematicMove(payload.action)) wireTile(el, payload, { kind: 'camera', action: payload.action, draw: c => drawThumb(c, 'camera', payload.action) });
    });
  };

  palette.render = render;
  root.classList.add('collapsed');
  render();
  return {
    dispose: () => { state.renderers.clip.dispose(); state.renderers.cube.dispose(); state.renderers.camera.dispose(); root.remove(); },
  };
}

// ================= viewport action-drop (BUr @5619004 — canvas-scoped) =================
// Glow: idle 0x3a6fd8 @.4 (Bit/Hit), hover 0x33cc88 @.9 (OUr/LUr). Save/restore per material;
// restore DELETES userData.glowAt so the night-lantern walk re-stamps (audit P2-6a).
const GLOW_IDLE = 0x3a6fd8, GLOW_IDLE_I = .4, GLOW_HOVER = 0x33cc88, GLOW_HOVER_I = .9;
let _dropRestore = null;

function applyGlow(app, ids, hex, intensity) {
  for (const id of ids) {
    const mesh = app.meshById.get(id);
    if (!mesh) continue;
    mesh.traverse(o => {
      if (!o.isMesh) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of list) {
        if (!m?.emissive) continue;
        if (!_dropRestore) _dropRestore = new Map();
        if (!_dropRestore.has(m)) _dropRestore.set(m, { hex: m.emissive.getHex(), intensity: m.emissiveIntensity, glowAt: m.userData.glowAt });
        m.emissive.setHex(hex);
        m.emissiveIntensity = intensity;
      }
    });
  }
}
function restoreGlow() {
  if (!_dropRestore) return;
  for (const [m, prev] of _dropRestore) {
    m.emissive.setHex(prev.hex);
    m.emissiveIntensity = prev.intensity;
    if (prev.glowAt !== undefined) m.userData.glowAt = prev.glowAt;
    else delete m.userData.glowAt;
  }
  _dropRestore = null;
}

export function installActionDrop(app) {
  const el = app.renderer.domElement;
  let candidates = null;   // frozen per drag (audit P2-5: computed when draggingAction set)
  let hoverId = null;
  const raycaster = app.raycaster;
  const ndc = new THREE.Vector2();

  const clearHover = () => {
    // live m(k) @5603702: repaint the previous hover to idle only if STILL a candidate
    if (hoverId && (!candidates || candidates.includes(hoverId))) {
      applyGlow(app, [hoverId], GLOW_IDLE, GLOW_IDLE_I);
    }
    hoverId = null;
  };
  const restoreAll = () => { restoreGlow(); candidates = null; hoverId = null; };
  installActionDrop.restore = restoreAll;   // tile dragend driver

  const computeCandidates = payload => {
    const ids = Object.keys(app.objects.all()).filter(id => app.show.canDropActionOnObject(id, payload));
    applyGlow(app, ids, GLOW_IDLE, GLOW_IDLE_I);
    return ids;
  };

  // r16 segment branch (BUr @5603400..5604650): while a timeline segment is dragged,
  // candidates glow idle-blue; document pointermove hovers; pointerup (CAPTURE) over a
  // candidate duplicates the segment into that character's track (dropSegmentOnObject).
  // The live drives this reactively off draggingSegment (its onSegmentDragChange prop);
  // ours registers the same observer on the store.
  const segmentCandidates = () => {
    const ids = Object.keys(app.objects.all()).filter(id => app.show.canDropSegmentOnObject(id));
    applyGlow(app, ids, GLOW_IDLE, GLOW_IDLE_I);
    return ids;
  };
  // f(k) verbatim: bounds check FIRST (pointer outside the canvas → null — the document
  // pointermove must not glow when the drag is over the timeline), then NDC raycast.
  const segmentRaycast = e => {
    const rect = el.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return null;
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, app.camera);
    const meshes = (candidates ?? []).map(id => app.meshById.get(id)).filter(Boolean);   // r16 review P3-2: defensive
    const hits = raycaster.intersectObjects(meshes, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && o.userData?.objectId === undefined) o = o.parent;
    return o?.userData?.objectId ?? null;
  };
  app.show.onSegmentDragChange = payload => {   // reactive effect (qt @5603490 shape)
    restoreAll();
    if (payload) candidates = segmentCandidates();
  };

  el.addEventListener('dragover', e => {
    if (!e.dataTransfer.types.includes(ACTION_MIME)) return;
    const payload = app.show.draggingAction;
    if (!payload) return;
    e.preventDefault();                                // allow drop
    if (!candidates) candidates = computeCandidates(payload);
    // raycast candidates → hovered object (walk up parents for userData.objectId)
    const rect = el.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, app.camera);
    const meshes = candidates.map(id => app.meshById.get(id)).filter(Boolean);
    const hits = raycaster.intersectObjects(meshes, true);
    let hitId = null;
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData?.objectId) o = o.parent;
      if (o?.userData?.objectId) { hitId = o.userData.objectId; break; }
    }
    if (hitId !== hoverId) {
      clearHover();
      if (hitId) applyGlow(app, [hitId], GLOW_HOVER, GLOW_HOVER_I);
      hoverId = hitId;
    }
    e.dataTransfer.dropEffect = hoverId ? 'copy' : 'none';   // review P3-6: verbatim hit-conditional
  });
  el.addEventListener('dragleave', e => {
    if (e.relatedTarget && el.contains(e.relatedTarget)) return;
    clearHover();
  });
  el.addEventListener('drop', e => {
    if (!e.dataTransfer.types.includes(ACTION_MIME)) return;
    e.preventDefault();
    const payload = parseActionPayload(e.dataTransfer.getData(ACTION_MIME));
    const targetId = hoverId;
    restoreAll();
    if (!payload || !targetId) return;
    app.show.beginEditGesture();                       // audit P1-1
    try { app.show.appendActionToObject(targetId, payload); }
    finally { app.show.endEditGesture(); }
    app.palette?.dismiss();
    app._ui?.refreshInspector();
    app._ui?.refreshTimeline();
  });
  // segment branch document listeners (v/x @5604551 — pointermove hovers; pointerup
  // CAPTURE drops; the capture phase runs BEFORE the timeline's bubble-phase up handler,
  // so segmentDropTaken is set before the timeline's wasSegmentDropTaken() gate reads it)
  document.addEventListener('pointermove', e => {
    if (!app.show.draggingSegment) return;
    const hitId = segmentRaycast(e);
    if (hitId !== hoverId) {
      clearHover();
      if (hitId) applyGlow(app, [hitId], GLOW_HOVER, GLOW_HOVER_I);
      hoverId = hitId;
    }
  });
  document.addEventListener('pointerup', e => {
    if (!app.show.draggingSegment) return;
    const hitId = segmentRaycast(e);
    clearHover();
    if (hitId) {
      try { app.show.dropSegmentOnObject(hitId); }
      finally { app._ui?.refreshInspector(); app._ui?.refreshTimeline(); }
    }
  }, true);
  return { restore: restoreAll };
}

// bridge helper used by ui.js (lane + button opens the palette — audit P1-2)
export function revealActionsFor(app, characterId) {
  app.palette?.revealFor?.(characterId);
}
