// main.js — app composition: viewport, environment, controls, frame loop (tick order per
// DESIGN D2.7 [A:F1]), playback evaluator (jGr/ue/L port), picking, manipulation, path paint.
import * as THREE from 'three';
import { OrbitControls } from './vendor/controls/OrbitControls.js';
import { TransformControls } from './vendor/controls/TransformControls.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { C, CLIPS } from './const.js';
import { createEnvironment, createFogNearFar, createShadowFit, normalizeLight, sunDirection } from './env.js';
import { ObjectManager } from './objects.js';
import { SelectionFootprints, HoverDisc } from './selection.js';
import { ObjectStore, ShowStore, PageStore } from './store.js';
import { loadScene, saveScene, itemDuration } from './schema.js';
import {
  showLayout, evalCharacterTrack, yawOf, gazeSplit, approachAngle, stepClamp,
  evalCameraObject, rigJointsAtTime, evalObjectItems, fovFromFocal, itemsOfTrack, isPersonKind,
} from './tracks.js';
import { headLookOffsets, applyHeadRotation, getHeadRotation } from './figures.js';
import { PathEditor } from './paths.js';
import { Manipulator } from './manipulate.js';
import { buildUI } from './ui.js';
import {
  patchSoftTerminator, createFinishComposer, finishCapable,
  readFinishPref, writeFinishPref, measureFinish, validMeasurementSize,
  createAutoMeasureScheduler,
} from './finish.js';
import { strokeRing } from './stroke.js';

const PLANNING_LAYER = 1;   // aye
const _bufSize = new THREE.Vector2();

export class App {
  constructor(container, opts = {}) {
    this.container = container;
    this.opts = opts;
    // ---- stores ----
    this.objects = new ObjectStore();
    this.show = new ShowStore();
    this.page = new PageStore();
    this.propCatalog = {};
    this.stores = { objects: this.objects, show: this.show, page: this.page, app: this };

    // ---- viewport (COr) ----
    const canvas = document.createElement('canvas');
    canvas.classList.add('ph-viewport-capture');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;          // t$=1 (PCFSoft deprecated in r182)
    this.renderer.shadowMap.autoUpdate = false;                // AOr: redraw on fingerprint change only
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight, false);
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(C.EDITOR_FOV, container.clientWidth / container.clientHeight || 1, C.NEAR, C.FAR);
    this.camera.position.set(...C.CAM_START);
    this.camera.lookAt(0, 0, 0);
    this.camera.userData.viewW = container.clientWidth;
    this.camera.userData.viewH = container.clientHeight;
    this.meshById = new Map();
    this.planningAids = [];      // objects rendered on layer-1 overlay pass
    this.pathEditPickables = [];
    this.rigJointPickables = [];

    // ---- Finish composer (hKt) + stroke ring (pGr part) ----
    patchSoftTerminator();      // ShaderChunk patch (module-load equivalent)
    this.finish = createFinishComposer(this.renderer);
    this.finishPref = readFinishPref();
    this.finishNeedsMeasuring = this.finishPref === null;
    // ?finish=0|1 → manual override (persisted, mirrors a hypothetical settings toggle;
    // the live app has no visible toggle — localStorage + auto-measure only)
    const urlFinish = new URLSearchParams(location.search).get('finish');
    if (urlFinish === '0' || urlFinish === '1') {
      this.finishPref = { enabled: urlFinish === '1', source: 'manual' };
      writeFinishPref(this.finishPref);
      this.finishNeedsMeasuring = false;
    }
    this._finishScheduler = createAutoMeasureScheduler();
    this._frameCount = 0;
    this._pointerHeld = false;
    this._lastWheel = -Infinity;
    for (const t of ['pointerdown', 'pointerup', 'dragend'])
      window.addEventListener(t, e => { this._pointerHeld = e.type === 'pointerdown'; }, true);
    window.addEventListener('wheel', () => { this._lastWheel = performance.now(); }, { capture: true, passive: true });
    this.stroke = strokeRing(this.renderer, this.scene, () => this.finishOn());   // strokeEnabled = m (same predicate as finish)

    // ---- environment (Dqr/wOr) ----
    this.env = createEnvironment(this.scene, { renderer: this.renderer, getMeshById: () => this.objectManager.meshById });
    this.light = normalizeLight(null);

    // ---- orbit controls ----
    this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbit.target.set(...C.ORBIT_TARGET);
    this.orbit.enableDamping = true;
    this.orbit.rotateSpeed = C.ROTATE_SPEED;
    this.orbit.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: null };
    this.orbit.enableZoom = false;
    this._applyControlMode();
    this.orbit.addEventListener('start', () => { this.orbited = true; });

    // ---- fog/near-far + shadow fit ----
    this.fogNearFar = createFogNearFar({ getMeshes: () => this.objectManager.meshById.values(), camera: this.camera, scene: this.scene, renderer: this.renderer });
    this.shadowFit = createShadowFit({
      sun: this.env.sun, applyDaylight: this.env.applyDaylight,
      getLight: () => this.light,
      bounds: () => this.fogNearFar.bounds(),
      roots: () => this.objectManager ? this.objectManager.roots() : [],
      meshById: this.meshById,
    });

    // ---- object manager ----
    this.objectManager = new ObjectManager(this.scene, {
      gltfLoader: new GLTFLoader(),
      propCatalog: this.propCatalog,
      planningAids: this.planningAids,
      onRigReady: (id, rig) => {
        const obj = this.objects.get(id);
        rig.playClip(obj?.animation?.clip ?? 'idle', obj?.animation?.playing ? undefined : 0); // $Nr: idle@0 at rest
        this.shadowFit.force();
      },
    });
    // share its map
    this._wireMeshMap();

    // ---- selection + hover ----
    this.selection = new SelectionFootprints(this.scene);
    this.hover = new HoverDisc(this.scene);

    // ---- manipulation + path editor ----
    this.manipulator = new Manipulator(this);
    this.pathEditor = new PathEditor(this);

    // ---- raycaster ----
    this.raycaster = new THREE.Raycaster();

    // ---- playback state ----
    this.lastEvalTime = null;
    this.headLooks = new Map();
    this.rigOffsets = new Map();
    this.playbackClips = new Map();   // id → {clip, timeS}

    // ---- clock ----
    this.clock = new THREE.Clock();
    this.disposed = false;

    // resize
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(container);

    // store subscriptions → resync + autosave
    this.objects.subscribe(() => { this._syncObjects(); this.markAutosave(); });
    this.show.subscribe(() => { this._layoutDirty = true; this.pathEditor.onShowChanged(); this.markAutosave(); });
    this.page.subscribe(() => this.markAutosave());
  }

  _wireMeshMap() {
    // objectManager owns the authoritative map; mirror it here
    this.meshByIdProxy = {
      get: k => this.objectManager.meshById.get(k),
      set: (k, v) => this.objectManager.meshById.set(k, v),
      has: k => this.objectManager.meshById.has(k),
      delete: k => this.objectManager.meshById.delete(k),
      values: () => this.objectManager.meshById.values(),
      entries: () => this.objectManager.meshById.entries(),
      keys: () => this.objectManager.meshById.keys(),
      [Symbol.iterator]: () => this.objectManager.meshById[Symbol.iterator](),
    };
    this.meshById = this.meshByIdProxy;
  }

  _applyControlMode() {
    const unreal = this.page.controlMode === 'unreal';
    if (unreal) {
      this.orbit.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: null };
      this.orbit.screenSpacePanning = true;
    } else {
      this.orbit.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };
      this.orbit.screenSpacePanning = false;
    }
  }

  // ================= scene load/save =================
  async loadSceneData(data) {
    const scene = loadScene(data, this.propCatalog);
    if (!scene) { console.error('scene load failed'); return false; }
    this.objects.setObjects(scene.objects ?? {});
    this.show.setShow(scene.show ?? { name: 'Show', tracks: [] });
    this.light = normalizeLight(scene.light ?? null);
    this.page.recordAspect = scene.recordAspect ?? '16:9';
    this._syncObjects();
    this.shadowFit.force();
    this.fogNearFar.fitNow();
    return true;
  }
  currentSceneJSON() {
    return saveScene({
      v: 10,
      objects: this.objects.all(),
      show: this.show.show,
      recordAspect: this.page.recordAspect,
      light: this.light,
    });
  }

  // ---- autosave (debounced ≥1s, QuotaExceeded-safe [A:F15]) ----
  markAutosave() {
    clearTimeout(this._autosaveT);
    this._autosaveT = setTimeout(() => {
      try {
        localStorage.setItem('flick3dEditor.autosave', JSON.stringify(this.currentSceneJSON()));
        localStorage.setItem('flick3dEditor.aspect', this.page.recordAspect);
      } catch (e) { /* quota — keep last-good */ }
    }, 1000);
  }
  restoreAutosave() {
    try {
      const raw = localStorage.getItem('flick3dEditor.autosave');
      if (!raw) return false;
      return this.loadSceneData(JSON.parse(raw));
    } catch (e) { return false; }
  }

  // ================= object sync =================
  _syncObjects() {
    this.objectManager.syncAll(this.objects.all());
    this._layoutDirty = true;
  }

  walkableSurfaces() { return this.env.walkableSurfaces(); }

  // ================= resolvers for track evaluation =================
  _boxOf(id) {
    const m = this.meshById.get(id);
    if (!m) return null;
    const b = new THREE.Box3().setFromObject(m);
    return b.isEmpty() ? null : b;
  }
  resolvers() {
    const self = this;
    return {
      aim(subjectId, t, offset = 0) {
        if (!subjectId) return null;
        const m = self.meshById.get(subjectId);
        if (!m) return null;
        const box = self._boxOf(subjectId);
        if (!box) return null;
        const k = self.objects.get(subjectId)?.kind === 'spotlight' ? 0.5 : C.SUBJECT_AIM_K;
        const p = m.getWorldPosition(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        return [p.x, box.min.y + k * size.y + offset, p.z];
      },
      follow(objectId, t) {
        const m = self.meshById.get(objectId);
        if (!m) return null;
        m.updateWorldMatrix(true, false);
        return {
          position: m.getWorldPosition(new THREE.Vector3()),
          quaternion: m.getWorldQuaternion(new THREE.Quaternion()),
        };
      },
      followOffset(item, out) {
        // default offset captured at item.startS from current relative pose (lFr)
        const m = self.meshById.get(item.objectId);
        if (!m) return null;
        m.updateWorldMatrix(true, false);
        const sp = m.getWorldPosition(new THREE.Vector3());
        const sq = m.getWorldQuaternion(new THREE.Quaternion());
        const inv = sq.clone().invert();
        const dp = out.position.clone().sub(sp).applyQuaternion(inv);
        const dq = inv.multiply(out.quaternion);
        return { position: [dp.x, dp.y, dp.z], quaternion: [dq.x, dq.y, dq.z, dq.w] };
      },
      worldPos(id) {
        const m = self.meshById.get(id);
        return m ? m.getWorldPosition(new THREE.Vector3()) : null;
      },
    };
  }

  // ================= playback evaluation (jGr/ue/L port) =================
  layout() {
    if (this._layoutDirty || !this._layout) {
      this._layout = showLayout(this.show.show);
      this._layoutDirty = false;
    }
    return this._layout;
  }

  evaluateAt(timeS, dt = 1 / 60, poseNow = false) {
    const layout = this.layout();
    const backwardSeek = this.lastEvalTime === null || timeS < this.lastEvalTime;
    this.lastEvalTime = timeS;
    const clips = new Map();
    this.headLooks.clear();

    // --- characters (ue) ---
    for (const track of layout.tracks) {
      const state = evalCharacterTrack(track, timeS);
      const obj = this.objects.get(track.characterId);
      const mesh = this.meshById.get(track.characterId);
      if (!obj || !mesh || !isPersonKind(obj.kind)) continue;
      if (obj.kind === 'humanoid') clips.set(track.characterId, { clip: state.clip, timeS: state.clipTimeS });
      if (this.manipulator?.isMeshDragged(mesh)) continue;
      const p = state.position;
      if (!p) continue;
      const curY = mesh.getWorldPosition(new THREE.Vector3()).y;
      let y;
      if (state.exactY) y = p[1];
      else if (backwardSeek) y = this._groundY(p[0], p[1] + C.GROUND_PROBE, p[2]) ?? p[1];
      else {
        const g = this._groundY(p[0], curY + C.GROUND_PROBE, p[2]);
        if (g === null) y = curY;
        else {
          const target = stepClamp(curY, g);
          y = curY + (target - curY) * (1 - Math.exp(-dt / C.GROUND_SMOOTH_TAU));
        }
      }
      let parentYaw = 0;
      const v = new THREE.Vector3(p[0], y, p[2]);
      if (mesh.parent && mesh.parent !== this.scene) {
        mesh.parent.worldToLocal(v);
        mesh.position.copy(v);
        parentYaw = new THREE.Euler().setFromQuaternion(mesh.parent.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
      } else mesh.position.copy(v);

      const yaw = yawOf(state);
      if (yaw?.exact) mesh.rotation.set(0, yaw.yawRad - parentYaw, 0);
      else if (yaw) {
        let aimTarget = null;
        if (state.lookAt) {
          const rp = this.resolvers().aim(state.lookAt.subjectId, timeS, 0);
          if (rp) aimTarget = rp;
        }
        const ownAim = [p[0], y + C.EYE_HEIGHT_K * (obj.scale?.[1] ?? 1), p[2]];
        const wantYaw = (aimTarget ? gazeSplit(yaw.yawRad, ownAim, aimTarget).bodyYawRad : yaw.yawRad) - parentYaw;
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()));
        const curYaw = Math.atan2(-fwd.x, -fwd.z);
        const newYaw = approachAngle(curYaw, wantYaw, poseNow ? Math.PI : C.YAW_TURN_RATE * dt);
        mesh.rotation.set(0, newYaw, 0);
        if (aimTarget) this.headLooks.set(track.characterId, { target: aimTarget, sinceS: state.lookAt.sinceS });
      } else if (backwardSeek) {
        mesh.rotation.set(...(obj.rotation ?? [0, 0, 0]));
      }
    }
    if (this.page.playing) { /* live-play not implemented (D11 skip) */ }

    // --- non-person objects + rig offsets + head look (L) ---
    this.rigOffsets.clear();
    for (const track of layout.tracks) {
      const obj = this.objects.get(track.characterId);
      if (!obj || obj.kind === 'camera') continue;
      const joints = rigJointsAtTime(track.items.map(u => u.item), timeS);
      if (joints) this.rigOffsets.set(track.characterId, joints);
      const mesh = this.meshById.get(track.characterId);
      if (!mesh || this.manipulator?.isMeshDragged(mesh)) continue;
      if (obj.kind === 'simple_figure') {
        // headRotation from transform keys (Kae) or head look (o$)
        const hr = this._figureHeadRotation(track, timeS, obj);
        if (hr) applyHeadRotation(mesh, hr);
      }
      const foldMode = !isPersonKind(obj.kind);
      const r = evalObjectItems(track, timeS, foldMode, this.resolvers());
      if (r.mode !== 'base') {
        mesh.scale.copy(r.scale);
        if (r.mode !== 'walk') {
          mesh.position.copy(r.position);
          const e = new THREE.Euler().setFromQuaternion(r.quaternion);
          mesh.rotation.set(e.x, e.y, e.z);
        }
      }
    }
    // head look application
    for (const [id, look] of this.headLooks) {
      const obj = this.objects.get(id);
      const mesh = this.meshById.get(id);
      if (!obj || !mesh) continue;
      mesh.updateWorldMatrix(true, true);
      const pos = mesh.getWorldPosition(new THREE.Vector3());
      const curYaw = new THREE.Euler().setFromQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
      const ownAim = [pos.x, pos.y + C.EYE_HEIGHT_K * (obj.scale?.[1] ?? 1), pos.z];
      const split = gazeSplit(curYaw, ownAim, look.target);
      if (obj.kind === 'humanoid') {
        const merged = { ...(this.rigOffsets.get(id) ?? {}), ...headLookOffsets(split) };
        this.rigOffsets.set(id, merged);
        continue;
      }
      const track = this.layout().tracks.find(t => t.characterId === id);
      const hr = this._figureHeadRotation(track, timeS, obj, split);
      if (hr) applyHeadRotation(mesh, hr);
    }

    // humanoid rigs: apply clip + offsets
    for (const [id, rig] of this.objectManager.humanoidRigs) {
      const c = clips.get(id);
      if (c) rig.playClip(c.clip, c.timeS);
      else {
        const obj = this.objects.get(id);
        rig.playClip(obj?.animation?.clip ?? 'idle', obj?.animation?.playing ? undefined : 0);
      }
    }
  }

  _figureHeadRotation(track, timeS, obj, split) {
    // Kae: keyed headRotation from transform items (latest key at t); subject look wins when sinceS >= item.startS
    let keyed = null;
    if (track) for (const u of track.items) {
      const it = u.item;
      if (it.kind !== 'transform' || timeS < u.startS) continue;
      const t = Math.min(timeS - u.startS, it.durationS);
      const keys = it.keys ?? [];
      let v = null;
      if (keys.length) {
        const last = keys[keys.length - 1];
        v = last.headRotation;
        for (let i = 0; i < keys.length; i++) if (keys[i].tS >= t) {
          v = (i === 0 ? keys[0] : keys[i - 1]).headRotation ?? keys[Math.max(0, i - 1)].headRotation;
          break;
        }
      }
      if (v) keyed = v;
    }
    if (split) return [split.headPitchRad ?? 0, split.headYawRad, 0];
    return keyed ?? obj.headRotation ?? [0, 0, 0];
  }

  _groundY(x, fromY, z) {
    this._groundRC = this._groundRC || new THREE.Raycaster();
    this._groundRC.ray.origin.set(x, fromY, z);
    this._groundRC.ray.direction.set(0, -1, 0);
    this._groundRC.near = 0; this._groundRC.far = Infinity;
    const hits = this._groundRC.intersectObjects(this.walkableSurfaces(), false);
    return hits[0]?.point?.y ?? null;
  }

  resetToBase() { // ye(): meshes back to stored TRS
    for (const [id, obj] of Object.entries(this.objects.all())) {
      const mesh = this.meshById.get(id);
      if (!mesh) continue;
      mesh.position.set(...(obj.position ?? [0, 0, 0]));
      mesh.rotation.set(...(obj.rotation ?? [0, 0, 0]));
      mesh.scale.set(...(obj.scale ?? [1, 1, 1]));
      if (obj.kind === 'simple_figure') applyHeadRotation(mesh, obj.headRotation);
    }
    // reset rigs to stored animation state
    for (const [id, rig] of this.objectManager.humanoidRigs) {
      const obj = this.objects.get(id);
      rig.playClip(obj?.animation?.clip ?? 'idle', 0);
    }
  }

  // ================= camera marker evaluation (edit mode) =================
  updateCameraMarkers() {
    const layout = this.layout();
    const resolvers = this.resolvers();
    const activeByCam = new Map();   // cameraId → { targetPos } (framesMarkerNow ≈ xq)
    for (const track of layout.tracks) {
      const obj = this.objects.get(track.characterId);
      if (!obj || obj.kind !== 'camera') continue;
      const mesh = this.meshById.get(track.characterId);
      if (!mesh) continue;
      const out = {
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        fovDeg: 50,
      };
      const any = evalCameraObject({
        base: { position: obj.position ?? [0, 0, 0], rotation: obj.rotation ?? [0, 0, 0], focalLengthMm: obj.focalLengthMm ?? C.FOCAL_DEFAULT },
        out, items: track.items.map(u => u.item), timeS: this.page.playheadS,
        aspect: 16 / 9, resolvers,
      });
      // drive marker: while item active, show aim pose (position + quaternion) on the wrapper
      mesh.userData.evalPose = any ? out : null;
      if (any && obj.targetId) {
        const t = this.meshById.get(obj.targetId);
        if (t) activeByCam.set(track.characterId, { targetPos: t.getWorldPosition(new THREE.Vector3()).toArray() });
      }
    }
    // UGr.v(): every camera marker — frustum at PAGE focal + record aspect (BU), aim at
    // target + distance = max(dist, .6) when framing (yFr), distance 3 otherwise.
    const [rw, rh] = C.ASPECTS[this.page.recordAspect] ?? C.ASPECTS['16:9'];
    const aspect = rw / rh;
    const fovDeg = fovFromFocal(this.page.focalLengthMm ?? C.FOCAL_DEFAULT, aspect);
    for (const [id, obj] of Object.entries(this.objects.all())) {
      if (obj.kind !== 'camera') continue;
      const mesh = this.meshById.get(id);
      if (!mesh) continue;
      const active = activeByCam.get(id);
      if (!active) {
        this.objectManager._updateFrustum(mesh, { aspect, fovDeg });
      } else {
        this.objectManager._updateFrustum(mesh, {
          aspect, fovDeg, targetPos: active.targetPos,
          meshDragged: !!this.manipulator?.isMeshDragged?.(id),
        });
      }
    }
  }

  // ================= frame loop =================
  start() {
    const loop = () => {
      if (this.disposed) return;
      requestAnimationFrame(loop);
      this._frame();
    };
    requestAnimationFrame(loop);
  }

  _frame() {
    const dt = Math.min(0.1, this.clock.getDelta());
    const now = performance.now();

    // --- update ticks (D2.7 order) ---
    // 1. rig tick: restore → mixer → rig offsets
    for (const [id, rig] of this.objectManager.humanoidRigs) {
      rig.tick(dt, this.rigOffsets.get(id));
    }
    // 2. playback
    if (this.page.playing) {
      const t = this.page.tickClock();
      const layout = this.layout();
      if (t >= layout.durationS) { this.page.seek(layout.durationS); this.page.stop(); this.resetToBase(); this.evaluateAt(layout.durationS, dt); }
      else this.evaluateAt(t, dt);
    } else if (this.manipulator?.scrubbing) {
      this.evaluateAt(this.page.playheadS, dt, true);
    }
    // 3. manipulation
    this.manipulator?.tick();
    // 4. nav/controls
    this._navTick(dt);
    // 5. env
    this.env.applyDaylight(this.light);
    // 6. camera markers (UGr.v-equivalent: page focal + record aspect + target aim)
    this.updateCameraMarkers();
    // 7. bounds + fog/near/far
    this.fogNearFar.tick(now);
    // 8. spotlights already updated in sync; 9. shadow fit (AOr: redraw only on fingerprint change)
    this.shadowFit.tickAOr(this.renderer);
    // 10. path editor visuals
    this.pathEditor.tick();
    // 11. selection tick LAST
    this.selection.tick(this.objects.selectedIds, this.meshByIdProxy, this.camera, this.container.clientHeight, now);
    this.hover.tick(this.hoverPoint, this.hoverNormal, this.camera, this.container.clientHeight, dt * 1000,
      !this.page.playing && !this.manipulator?.dragging);

    // --- render passes (re/ae port) ---
    this.renderFrame();
  }

  finishOn() {   // m(): capability && pref
    return finishCapable(this.renderer) && !!this.finishPref?.enabled;
  }

  renderFrame() {
    const size = this.renderer.getDrawingBufferSize(_bufSize);
    if (size.x === 0 || size.y === 0) return;
    const finishOn = this.finishOn();
    if (!finishOn) this.finish.release();
    if (finishOn) this.finish.render(this.scene, this.camera);
    else this.renderer.render(this.scene, this.camera);
    this._autoMeasure();
    this.drawOverlays();
  }

  drawOverlays() {   // ae(): stroke ring THEN planning aids — both depth-test against scene depth
    this.stroke.drawStroke(this.camera, () => this.editView(),
      this.objects.selectedIds ?? [], this.hoverId, this.meshById);
    this.renderPlanningAids();
  }

  editView() { return this.page.mode === 'edit'; }   // isEditView (C) — stroke/footprints gate

  // Q(): auto-measure after 30 frames, retries every 300 up to 2, skipped while interacting
  _autoMeasure() {
    this._frameCount++;
    if (!this._finishScheduler.frame() || !this.finishNeedsMeasuring) return;
    if (this.renderer.getContext().isContextLost()) return;
    if (!finishCapable(this.renderer)) {
      this._onFinishMeasured(false, { costMs: 0, plainMs: 0, pixels: 0 });
      return;
    }
    if (this.page.playing || this._pointerHeld || performance.now() - this._lastWheel < 500) return;
    const gl = this.renderer.getContext();
    const w = this.renderer.domElement.width, h = this.renderer.domElement.height;
    const pixels = w * h;
    if (!validMeasurementSize(pixels)) return;
    const px = new Uint8Array(4);
    const aidsHidden = this._hidePlanningAids();
    let m;
    try {
      m = measureFinish({
        drawPlain: () => { this.renderer.setRenderTarget(null); this.renderer.render(this.scene, this.camera); },
        drawFinished: () => this.finish.render(this.scene, this.camera),
        finishGpu: () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px),
        pixels,
      });
    } finally { aidsHidden(); }
    const result = this._finishScheduler.report(m);
    if (result !== null) this._onFinishMeasured(result, m);
  }

  _onFinishMeasured(enabled, measurement) {
    this.finishNeedsMeasuring = false;
    this.finishPref = { enabled, source: 'auto' };
    writeFinishPref(this.finishPref);
    this.finishMeasurement = measurement;
  }

  _hidePlanningAids() {   // Ew: hide visible planning aids, return restore fn
    const hidden = [];
    for (const gen of this.planningAids) {
      const objs = typeof gen === 'function' ? gen() : [gen];
      for (const o of objs || []) {
        if (o && o.visible) { o.visible = false; hidden.push(o); }
      }
    }
    return () => { for (const o of hidden) o.visible = true; };
  }

  renderPlanningAids() {   // EOr: layer-1 pass, autoClear=false, NO depth clear (aids occlude behind scene geometry)
    const aids = [...this.planningAids, ...this._collectLines()];
    if (!aids.length) return;
    for (const a of aids) a.layers?.enable?.(PLANNING_LAYER);
    const prevAuto = this.renderer.autoClear;
    this.renderer.autoClear = false;
    this.camera.layers.set(PLANNING_LAYER);
    this.renderer.render(this.scene, this.camera);
    this.camera.layers.set(0);
    for (const a of aids) a.layers?.disable?.(PLANNING_LAYER);
    this.renderer.autoClear = prevAuto;
  }

  _collectLines() {
    const lines = [];
    this.scene.traverse(o => { if (o.isLine && o.visible) lines.push(o); });
    return lines;
  }

  _navTick(dt) {
    // orbit
    if (this.orbit.enabled) this.orbit.update();
    // camera floor clamp + polar recompute
    this.camera.position.y = Math.max(C.NEAR_MIN, this.camera.position.y);
    const d = this.camera.position.distanceTo(this.orbit.target);
    if (d > 1e-6) {
      const maxPolar = Math.acos(Math.min(1, Math.max(-1, (0.1 - this.orbit.target.y) / d)));
      this.orbit.maxPolarAngle = maxPolar;
    }
    // WASD
    this._wasd(dt);
  }

  _wasd(dt) {
    if (!this._keys || this.page.mode !== 'edit' || this.page.keyboardOwner !== 'stage') return;
    const k = this._keys;
    let f = 0, s = 0, u = 0;
    if (k.has('w')) f += 1; if (k.has('s')) f -= 1;
    if (k.has('a')) s -= 1; if (k.has('d')) s += 1;
    if (k.has('e')) u += 1; if (k.has('q')) u -= 1;
    if (!f && !s && !u) return;
    const speed = C.FLY_SPEED * (k.has('shift') ? C.FLY_SPRINT : 1) * dt;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const move = new THREE.Vector3().addScaledVector(fwd, f).addScaledVector(right, s);
    move.y += u;
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed);
      this.camera.position.add(move);
      this.orbit.target.add(move);
    }
  }

  // custom wheel zoom (Vzr/Dqr): classify zoom vs nav; zoom = pos *= exp(deltaY*k) around orbit target
  attachWheel() {
    const el = this.renderer.domElement;
    el.addEventListener('wheel', e => {
      e.preventDefault();
      const isZoom = e.ctrlKey || e.deltaMode !== 0 ||
        (Math.abs(e.deltaY) >= 50 && e.deltaY % 120 === 0 && e.deltaX === 0);
      if (isZoom) {
        const b = this.fogNearFar.bounds();
        const maxD = Number.isFinite(b?.radius) ? Math.max(C.FAR_FALLBACK, 2 * b.radius) : 50;
        const k = Math.exp(e.deltaY * C.WHEEL_ZOOM_K);
        const target = this.orbit.target;
        const p = this.camera.position.clone().sub(target);
        const dist = p.length() * k;
        const clamped = Math.min(maxD, Math.max(C.ZOOM_MIN, dist));
        this.camera.position.copy(target).addScaledVector(p.normalize(), clamped);
      } else {
        // nav: default mode → orbit, unreal → pan
        const dx = e.deltaX, dy = e.deltaY;
        if (this.page.controlMode === 'default') {
          const k = 2 * Math.PI * C.ROTATE_SPEED / this.container.clientHeight;
          const off = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.orbit.target));
          off.theta -= dx * k;
          off.phi = Math.min(Math.PI - 0.01, Math.max(0.01, off.phi - dy * k));
          this.camera.position.setFromSpherical(off).add(this.orbit.target);
        } else {
          const d = this.camera.position.distanceTo(this.orbit.target);
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
          const up = new THREE.Vector3(0, 1, 0);
          const kk = d * 0.0016;
          this.camera.position.addScaledVector(right, dx * kk).addScaledVector(up, -dy * kk);
          this.orbit.target.addScaledVector(right, dx * kk).addScaledVector(up, -dy * kk);
        }
      }
    }, { passive: false });
  }

  _resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.userData.viewW = w;
    this.camera.userData.viewH = h;
    this.camera.updateProjectionMatrix();
  }

  focusObject(id, immediate = false) {
    const mesh = this.meshById.get(id);
    if (!mesh) return;
    const box = new THREE.Box3().setFromObject(mesh);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const bounds = this.fogNearFar.bounds();
    const dist = Math.max(C.FOCUS_DISTANCE_MIN,
      1.5 * (sphere?.radius ?? 1) / Math.sin(Math.min(this.camera.fov, this._fovX()) * Math.PI / 360));
    const center = sphere?.center ?? mesh.getWorldPosition(new THREE.Vector3());
    this._animateFocus(center, dist, immediate);
  }
  _fovX() {
    return 2 * Math.atan(Math.tan(this.camera.fov * Math.PI / 360) * this.camera.aspect) * 180 / Math.PI;
  }
  _animateFocus(center, dist, immediate) {
    const startPos = this.camera.position.clone();
    const startTarget = this.orbit.target.clone();
    const dir = startPos.clone().sub(center).normalize();
    if (dir.lengthSq() < 1e-8) dir.set(0.5, 0.5, 0.5).normalize();
    const endPos = center.clone().addScaledVector(dir, dist);
    if (immediate) {
      this.camera.position.copy(endPos); this.orbit.target.copy(center);
      return;
    }
    const t0 = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / (C.FOCUS_DURATION * 1000));
      const e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease-in-out-cubic
      this.camera.position.lerpVectors(startPos, endPos, e);
      this.orbit.target.lerpVectors(startTarget, center, e);
      if (t < 1) requestAnimationFrame(step);
    };
    step();
  }
}

// ================= boot =================
export async function boot(container, opts = {}) {
  const app = new App(container, opts);
  // prop catalog
  try {
    app.propCatalog = Object.fromEntries(
      (await (await fetch(C.PROP_CATALOG_URL)).json()).map(e => [e.key, e]));
    app.objectManager.propCatalog = app.propCatalog;
  } catch (e) { console.warn('prop catalog unavailable', e); }
  app.attachWheel();
  app.start();
  return app;
}
