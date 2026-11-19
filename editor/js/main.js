// main.js — app composition: viewport, environment, controls, frame loop (tick order per
// DESIGN D2.7 [A:F1]), playback evaluator (jGr/ue/L port), picking, manipulation, path paint.
import * as THREE from 'three';
import { OrbitControls } from './vendor/controls/OrbitControls.js';
import { TransformControls } from './vendor/controls/TransformControls.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { C, CLIPS } from './const.js';
import { createEnvironment, createFogNearFar, createShadowFit, normalizeLight, sunDirection, geoToSceneLight } from './env.js';
import { ObjectManager } from './objects.js';
import { SelectionTracker, HoverDisc } from './selection.js';
import { ObjectStore, ShowStore, PageStore } from './store.js';
import { loadScene, saveScene, itemDuration } from './schema.js';
import {
  showLayout, evalCharacterTrack, yawOf, gazeSplit, approachAngle, stepClamp,
  evalCameraObject, rigJointsAtTime, evalObjectItems, fovFromFocal, itemsOfTrack, isPersonKind, itemAtTime,
  pathStateAt, pathRotation,
} from './tracks.js';
import { headLookOffsets, mergeRigOffsets, applyHeadRotation, getHeadRotation, ezHeadRotation, isMajorJoint, sampleBonePose, diffRigPose } from './figures.js';
const _hoeV = new THREE.Vector3(), _hoeE = new THREE.Euler(), _hoeQ = new THREE.Quaternion(), _hoePQ = new THREE.Quaternion(); // hoe scratch (verbatim units, SKILL #46)

// ---- person-kind switch helpers (verbatim: UNr @5364733 / Yqt @5364968 / zNr @5365000) ----
// UNr: a person's removable performance actions (clip/play/rig-transform items) + whether
// a HELD pose exists (animation.clip set and not 'idle')
function collectPersonActions(id, tracks, obj) {
  const items = [];
  for (const tr of tracks) {
    if (tr.characterId !== id) continue;
    for (const it of tr.items) {
      if (it.kind === 'clip' || it.kind === 'play' || it.kind === 'rig-transform') items.push({ trackId: tr.id, itemId: it.id, kind: it.kind });
    }
  }
  const clip = obj.animation?.clip;
  return { items, pose: !!clip && clip !== 'idle' };
}
const countRemovedActions = info => info.items.length + (info.pose ? 1 : 0);   // Yqt
// zNr — the confirmation message; i18n catalog unavailable (SKILL #34) → semantic English
function personSwitchMessage(name, info, kind) {
  const n = k => info.items.filter(i => i.kind === k).length;
  const parts = [
    n('clip') > 0 && `${n('clip')} clip${n('clip') === 1 ? '' : 's'}`,
    n('play') > 0 && `${n('play')} play segment${n('play') === 1 ? '' : 's'}`,
    n('rig-transform') > 0 && `${n('rig-transform')} pose segment${n('rig-transform') === 1 ? '' : 's'}`,
    info.pose && 'a held pose',
  ].filter(Boolean);
  const list = new Intl.ListFormat('en', { type: 'conjunction' }).format(parts);
  return `Switching ${name ?? 'this person'} to ${kind === 'simple_figure' ? 'Figure' : 'Human'} removes ${list}.`;
}

import { PathEditor } from './paths.js';
import { Manipulator } from './manipulate.js';
import { tickGizmoHover } from './gizmo.js';
import { createGroundGrid, syncSnap, applyRenderMode } from './viewport-modes.js';
import { PlanStore, PlanCanvas } from './plan.js';
import { buildUI } from './ui.js';
import { createMonitor } from './monitor.js';   // r17 viewfinder
import { installComponentDrop, wireComponentCatalog } from './components.js';   // r16 component family
import {
  patchSoftTerminator, createFinishComposer, finishCapable,
  readFinishPref, writeFinishPref, measureFinish, validMeasurementSize,
  createAutoMeasureScheduler,
} from './finish.js';
import { createBloom } from './bloom.js';   // round 13 (HDR): UnrealBloomPass recipe port
import { shakeOffsets, applyShakePose, rigShake } from './shake.js';   // r15 Dzt/cL + r17 the rig path (oEr) wakes in camera mode
import { RigStore, rigWithWeight, cycleRigKey, stepSpeed, carrySpeeds, isRigKey } from './rigs.js';   // r17 kIr state subset + helpers
import { createDrive, createLook, springStep, zoomMm, zoomLog } from './drive.js';   // r17 en/szr + jCr/ICr zoom map
import { strokeRing } from './stroke.js';
import { createNavBall, moveByStick } from './navball.js';

const PLANNING_LAYER = 1;   // aye

const _bufSize = new THREE.Vector2();
const _q1 = new THREE.Quaternion();   // scratch quaternion (poser _camHie)

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
    this.rigJointPickables = [];      // xqr pickables (r14 rig posing)
    this.liveRigDrag = null;          // h — {objectId, offsets} while a joint drag is live (setLiveRigDrag)
    this._rigSelectedJoints = [];     // xqr closure `l` — selected joint names
    this._rigSpheres = new Map();     // xqr `c` — joint name → sphere mesh
    this._rigSpheresFor = null;       // xqr `d` — object id the spheres were built for
    this._lastRigPoseId = undefined;  // frame watcher: reseat the gizmo when rigPoseObjectId flips
    this._lastTransformPoseId = undefined;

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
    this.navBall = createNavBall({ renderer: this.renderer, camera: this.camera, page: this.page, getOrbit: () => this.orbit, keys: () => this._keys });

    // ---- environment (Dqr/wOr) ----
    this.env = createEnvironment(this.scene, { renderer: this.renderer, getMeshById: () => this.objectManager.meshById });
    // round 6 B5/B6: ground grid + shade mode + snap state
    this.groundGrid = createGroundGrid(this.scene);
    this.renderMode = localStorage.getItem('stage-shademode') || 'shaded';
    this.snapOn = localStorage.getItem('stage-snap') === '1';
    this.groundGrid.visible = this.snapOn;
    this.setRenderMode = mode => {
      this.renderMode = mode; localStorage.setItem('stage-shademode', mode);
      applyRenderMode(this.scene, this.env.floor, mode);
    };
    this.setSnapOn = v => { this.snapOn = v; localStorage.setItem('stage-snap', v ? '1' : '0'); this.groundGrid.visible = v; };
    if (this.renderMode !== 'shaded') this.setRenderMode(this.renderMode);
    // round 7 (R7-1): top-down plan canvas — exact port (rDr store + rBr canvas)
    this.propCatalogDims = key => this.objectManager?.propCatalog?.[key]?.dims;
    this.plan = new PlanStore(this);
    this.planView = new PlanCanvas(this, document.getElementById('viewport'), this.plan);
    this._drawPreview = null; this._drawPreviewId = null;
    this.light = normalizeLight(null);
    // round 6 (D): light mutators — every write is one undo gesture at the UI layer.
    // geo edits (re)enter geographic mode; a knob/drag/preset edit enters custom mode.
    this.setLightGeo = (patch, opts = {}) => {
      const geo = { ...this.light.geo, ...patch };
      const next = geoToSceneLight(geo, this.light);
      delete next._rawElevation;
      this.light = { ...this.light, ...next, geo, mode: 'geographic', _rawElevation: next.elevationDeg };
      if (opts.silent !== true) { this.shadowFit.force(); this.env.applyDaylight(this.light); this.markAutosave?.(); }
      return this.light;
    };
    this.setLightCustom = (azimuthDeg, elevationDeg) => {
      this.light = { ...this.light, mode: 'custom', azimuthDeg: ((azimuthDeg % 360) + 360) % 360, elevationDeg: Math.min(90, Math.max(-30, elevationDeg)) };
      this.shadowFit.force(); this.env.applyDaylight(this.light); this.markAutosave?.();
    };
    this.setWeather = weather => { if (!C.WEATHER[weather]) return; this.light = { ...this.light, weather }; this.shadowFit.force(); this.env.applyDaylight(this.light); this.markAutosave?.(); };
    // round 10 (skybox P1): sky style — classic (byte-identical flick dome) | realistic (Hillaire atmosphere)
    this.setSkyStyle = style => {
      const v = style === 'realistic' ? 'realistic' : 'classic';
      this.light = { ...this.light, skyStyle: v };
      this.env.setSkyStyle(v, this.light);
      this.markAutosave?.();
    };
    // round 13 (P2): cloud layer mutator — mirrors setSkyStyle (light object owns the state;
    // absence = off, same parity as schema). patch: {enabled, mode, coverage, density,
    // altitudeM, thicknessM, cirrus, windSpeed}
    this.setClouds = patch => {
      const cur = this.light.clouds ?? { enabled: false };
      const next = { ...cur, ...patch };
      const wasEnabled = !!cur.enabled;
      if (!next.enabled) {
        if (!wasEnabled) return;                       // no-op off → off
        const l = { ...this.light }; delete l.clouds;  // canonical off = absent (schema parity)
        this.light = l;
      } else {
        this.light = { ...this.light, clouds: next };
      }
      this.env.setClouds(this.light);
      this.env.applyDaylight(this.light);
      this.markAutosave?.();
    };
    // round 13 (HDR): bloom chain (idle until hdr enables the finish path — no RTs, no cost)
    this._bloom = createBloom({ renderer: this.renderer });
    // round 13 (HDR): tone mapping + bloom mutator — mirrors setClouds (light.hdr owns the
    // state; absence = off, schema parity). patch: {enabled, exposure, bloom, bloomThreshold,
    // bloomRadius}. HDR ON auto-enables the finish composer (capability-probed) so the
    // composite path carries ACES + bloom; the plain fallback is renderer-level ACES only.
    this.setHdr = patch => {
      const cur = this.light.hdr ?? { enabled: false };
      const next = { ...C.HDR_DEFAULTS, ...cur, ...patch };
      const wasEnabled = !!cur.enabled;
      if (!next.enabled) {
        if (!wasEnabled) return;                   // no-op off → off
        const l = { ...this.light }; delete l.hdr; // canonical off = absent (schema parity)
        this.light = l;
      } else {
        this.light = { ...this.light, hdr: next };
        if (finishCapable(this.renderer) && !this.finishPref?.enabled) {
          this.finishPref = { enabled: true, source: 'manual' };   // survives reload like ?finish=1
          writeFinishPref(this.finishPref);
        }
      }
      this.env.applyDaylight(this.light);          // memo-key parity (key includes |h…)
      this.markAutosave?.();
    };
    this.setIndoor = indoor => { this.light = { ...this.light, indoor: !!indoor }; this.shadowFit.force(); this.env.applyDaylight(this.light); this.markAutosave?.(); };
    this.setAmbient = v => { this.light = { ...this.light, ambientLevel: Math.min(1, Math.max(0, v)) }; this.env.applyDaylight(this.light); this.markAutosave?.(); };
    this.recomputeGeoLight = () => this.setLightGeo({});

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
    this.fogNearFar = createFogNearFar({ getMeshes: () => this.objectManager.meshById.values(), camera: this.camera, scene: this.scene, renderer: this.renderer, getLight: () => this.light });
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
      gpu: this.renderer.capabilities,                 // e6r: spotlight shadow-slot budget
      onRigReady: (id, rig) => {
        const obj = this.objects.get(id);
        rig.applyClip(this.playbackClips.get(id) ?? null, obj?.animation ?? { clip: 'idle', playing: false }); // $Nr: idle@0 at rest
        this.shadowFit.force();
      },
      // onSkeletonReady (shell @5862067): resolve any pose marked pending while the
      // skeleton was loading — solver = sampleClipRigOffsets ?? null
      onSkeletonReady: id => this.bakePendingPose(id, (oid, pose) => this.sampleClipRigOffsets(oid, pose) ?? null),
    });
    // share its map
    this._wireMeshMap();
    this.show.setUndoCompanion(this.objects);   // undo covers objects + show (observer-history parity)

    // ---- selection + hover ----
    // round 6: ground pad removed (user direction) — SelectionTracker anchors the toolbar only
    this.selection = new SelectionTracker();
    this.hover = new HoverDisc(this.scene);

    // ---- manipulation + path editor ----
    this.manipulator = new Manipulator(this);
    this.pathEditor = new PathEditor(this);
    this._setupRigHandles();          // xqr joint-sphere overlay (r14)

    // ---- palette store hooks (live BHr ctor wiring: objects.updateObjectTransform as 5th arg;
    // our store split routes segment selection/paint through PageStore + PathEditor) ----
    this.show._hooks = {
      page: this.page,
      updateObjectTransform: (id, patch) => this.objects.update(id, patch),
      enterPathEdit: (trackId, itemId) => this.pathEditor.enterPaint(trackId, itemId),
      finishPerformancePaint: () => this.pathEditor.finishPaint(),   // removePerformanceItem paint gate (@5546806)
      seedAnchorY: (trackId, itemId, pos, idx) => this.pathEditor._anchorPosFor({ x: pos[0], y: pos[1], z: pos[2] }, idx),
      propDims: key => this.objectManager?.propCatalog?.[key]?.dims,
      playheadS: () => this.page.playheadS,                     // performanceTimeS for the focus family
      resolveAim: (id, t, off) => this.resolvers().aim(id, t, off),
    };

    // ---- raycaster ----
    this.raycaster = new THREE.Raycaster();

    // ---- playback state ----
    this.lastEvalTime = null;
    this.headLooks = new Map();
    this.rigOffsets = new Map();
    this.playbackClips = new Map();   // id → {clip, timeS}
    this.pendingPoses = new Map();    // facade pendingPoses @5793128 — id → pose awaiting skeleton
    this._shakeT = 0;                 // mqr shake clock (T+=dt, Y @5722298) — advances every frame
    // ---- r17 camera mode (kIr/eIr/$e/Ma port) ----
    this.rigs = new RigStore();               // kIr state subset (rig/speeds/weights + stage-rig-weights)
    this.filmingCameraId = null;              // filmingCameraId (startFilming sets; setMode edit clears)
    this._manualFlight = null;                // {trackId,itemId} while a manual-flight session is armed
    this._draft = null;                       // phoneDraft equivalent: the auto-created track/item on film-entry
    this._lastFlight = null;                  // lastFlight (set only after real samples — always null offline)
    this._editorPoseSave = null;              // $e 'se': editor camera pose saved on camera-mode entry
    this._driveAim = new THREE.Object3D();    // H: yaw/pitch holder (mouse-look writes it)
    this._driveCam = new THREE.Object3D();    // l: the drive camera (yaw/pitch springs + roll)
    this._drive = createDrive(this._driveAim, this._driveCam);
    this._look = null;                        // rzr port — created once the canvas exists
    this._shakeApply = null;                  // Y: the current editor-camera shake pose (A)
    this._shakeSaved = false;                 // I: pose saved (N/P) awaiting restoreShake
    this._shakeSavePos = new THREE.Vector3();
    this._shakeSaveQuat = new THREE.Quaternion();
    this._stridePhase = 0;                    // E: oEr stride-phase carry
    this._shakeGroundPos = null;              // j: last editor-camera position (ground-speed delta)
    this._zoom = null; this._zoomKeys = new Set(); this._zoomFrame = 0; this._zoomLastMs = 0;  // eIr zoom state
    this._restEval = false;           // live performanceSeekS model: seek-posed rest keeps evaluating (pinned)
    this._posedCams = new Set();      // live mqr Q(): camera ids posed by a previous frame (v set)
    this._restSeekPending = false;    // a seek was observed at rest — pose it even when t is unchanged
    this._seenSeekEpoch = 0;          // last PageStore.seekEpoch consumed

    // ---- clock ----
    this.clock = new THREE.Clock();
    this.disposed = false;

    // resize
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(container);

    // store subscriptions → resync + autosave
    this.objects.subscribe(() => { this._syncObjects(); this.markAutosave(); });
    this.show.subscribe(() => { this._layoutDirty = true; this.pathEditor.onShowChanged(); this.markAutosave(); });
    this.page.subscribe(() => {
      this.markAutosave();
      // live performanceSeekS model: ANY seek at rest (ruler click, diamond click, keyframe jump)
      // poses the scene — even when the playhead VALUE is unchanged (e.g. clicking the ruler
      // gutter at t=0 after load). Detected via the seek epoch, NOT page.changed (paint-exit
      // and mode switches also fire changed() but must not pose the scene).
      if (this.page.seekEpoch !== this._seenSeekEpoch) {
        this._seenSeekEpoch = this.page.seekEpoch;
        if (!this.page.playing) this._restSeekPending = true;
      }
      // r17 $e applyMode: mode transitions (edit ↔ camera) re-pose/restore the editor camera
      if (this.page.mode !== this._appliedMode) { this._appliedMode = this.page.mode; this.applyMode(); }
    });
    this._appliedMode = this.page.mode;   // initial state — no transition on boot
    // eIr keymap @5232092 (camera mode only — pageLive ≡ true offline; typing gate = ix()):
    // Tab cycles rig, Z/X step speed, [/] step weight, O/P held-key zoom. Escape: menu first,
    // then exit (pointer-locked → the browser unlocks first).
    this._camModeKeyDown = e => {
      const k = e.key.toLowerCase();
      const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable);
      if (typing || this.page.mode !== 'camera' || this.page.keyboardOwner !== 'stage') return;
      if (k === 'escape') {
        if (this._monitorMenuOpen) { e.preventDefault(); this._monitorMenuOpen = null; this.page.changed(); return; }
        if (!document.pointerLockElement) { e.preventDefault(); this.exitCameraMode(); }
        return;
      }
      // NGt @5151221: the rig keys are plain-key only (meta/ctrl/alt belong to the app shortcuts)
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (k === 'tab') {
        if (this._monitorMenuOpen) return;
        e.preventDefault();
        if (!e.repeat) this.cycleRig(e.shiftKey ? -1 : 1);
        return;
      }
      if (!e.repeat) {
        if (k === 'z') this.changeSpeed(-1);
        else if (k === 'x') this.changeSpeed(1);
        else if (k === '[') this.stepWeight(-1);
        else if (k === ']') this.stepWeight(1);
        else if (k === 'r') this.toast?.('Video recording ships with the filming subsystem — not available offline');
      }
      if (k === 'o' || k === 'p') { this._zoomKeys.add(k); this._startZoom(); e.preventDefault(); }
    };
    // eIr.onBlur @5233480: focus loss stops a held-key zoom (else focal rails at a bound forever)
    this._camModeBlur = () => this._stopZoom();
    window.addEventListener('blur', this._camModeBlur);
    this._camModeKeyUp = e => {
      const k = e.key.toLowerCase();
      if (k === 'o' || k === 'p') this._zoomKeys.delete(k);
    };
    window.addEventListener('keydown', this._camModeKeyDown);
    window.addEventListener('keyup', this._camModeKeyUp);
    // eIr controller ops (cycleRig/changeSpeed/cycleSpeed/stepWeight @5231937..5232109)
    this.cycleRig = (dir = 1) => {
      const n = cycleRigKey(this.rigs.rig, dir);
      this.rigs.setRig(n, carrySpeeds(n, this.rigs.peekSpeeds()));
    };
    this.changeSpeed = dir => { this.rigs.setRig(this.rigs.rig, stepSpeed(this.rigs.rig, this.rigs.peekSpeeds(), dir)); };
    this.cycleSpeed = () => { this.rigs.setRig(this.rigs.rig, stepSpeed(this.rigs.rig, this.rigs.peekSpeeds(), 1, true)); };
    this.stepWeight = dir => { this.rigs.setWeight(this.rigs.weight + dir * C.RIG_WEIGHT_STEP); };
    // live AWr: objects-store mutation → b() — UNCONDITIONAL (live qt(()=>{objects.get(), b()})):
    // always consults the current playbackClips map, so pinned playback state survives edits
    // (mid-playback object edits don't restart clips) and rest-state records apply immediately.
    this.objects.subscribe(() => {
      for (const [id, rig] of this.objectManager.humanoidRigs) {
        rig.applyClip(this.playbackClips.get(id) ?? null, this.objects.get(id)?.animation ?? null);
      }
    });
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

  // ================= plan facade (round 7 R7-1) =================
  shownPose(id) {  // live shownPose_impl: mesh world TRS (Bie) + fovDeg (cameras) + headRotation (figures)
    const mesh = this.meshById.get(id);
    if (!mesh) return null;
    mesh.updateWorldMatrix(true, false);
    const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
    mesh.matrixWorld.decompose(pos, quat, scl);
    const e = new THREE.Euler().setFromQuaternion(quat, 'XYZ');
    const out = { position: [pos.x, pos.y, pos.z], rotation: [e.x, e.y, e.z], scale: [scl.x, scl.y, scl.z] };
    const kind = this.objects.get(id)?.kind;
    if (kind === 'camera') {
      // evaluated fov at the playhead (live O.cameraFovDeg): run dZt over the camera's items
      const obj = this.objects.get(id);
      const track = this.show.trackOf(id);
      const aspect = this.page.aspectOf?.() ?? (() => { const k = this.page.recordAspect ?? '16:9'; return { '16:9': 16/9, '9:16': 9/16, '1:1': 1, '4:3': 4/3, '1.85:1': 1.85, '2.39:1': 2.39 }[k] ?? 16/9; })();
      let fovDeg = fovFromFocal(obj.focalLengthMm ?? 50, aspect);
      if (track) {
        const o = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), fovDeg: 0 };
        evalCameraObject({ base: { position: obj.position ?? [0, 1.6, 0], rotation: obj.rotation ?? [0, 0, 0], focalLengthMm: obj.focalLengthMm ?? 50 }, out: o, items: track.items, timeS: this.page.playheadS, aspect, resolvers: this.resolvers() });
        if (o.fovDeg > 0) fovDeg = o.fovDeg;
      }
      out.fovDeg = fovDeg;
    }
    if (kind === 'simple_figure') out.headRotation = getHeadRotation(mesh);
    return out;
  }
  // switchPersonKind (verbatim @5810535) — person-kind switch: collecting the person's
  // performance actions + held pose (UNr) gates a CONFIRMATION (first call returns the
  // info, caller shows the action toast); the confirmed run (removeHumanOnly) strips
  // the items, clears any pending pose, and setPersonKind (strip animation/rename).
  // analytics omitted (offline port). UNr @5364733 / Yqt @5364968 / zNr @5365000.
  switchPersonKind(id, kind, opts = {}) {
    const s = this.objects.get(id);
    if (!s || !isPersonKind(s.kind) || s.kind === kind) return null;
    const info = kind === 'simple_figure' ? collectPersonActions(id, this.show.show.tracks, s) : null;
    const removed = info ? countRemovedActions(info) : 0;
    if (removed > 0 && !opts.removeHumanOnly) return info;
    for (const it of info?.items ?? []) this.show.removePerformanceItem(it.trackId, it.itemId);
    this.pendingPoses.delete(id);
    this.objects.setPersonKind(id, kind);
    return null;
  }
  // pickPersonKind (verbatim @5810696) — gesture-bracketed; a first-run info result
  // shows the confirm toast with the "remove & switch" action (label = i18n-equivalent).
  // The live re-renders the palette via its store subscription (selected-object change);
  // ours renders on selectedId only, so the confirmed switch re-renders explicitly (r8).
  pickPersonKind(id, kind, source) {
    const run = removeHumanOnly => {
      this.show.beginEditGesture();
      try {
        const res = this.switchPersonKind(id, kind, { source, removeHumanOnly });
        if (res === null) this.palette?.render?.();
        return res;
      } finally { this.show.endEditGesture(); }
    };
    const info = run(false);
    if (info) {
      const name = this.objects.get(id)?.name;
      this.toast(personSwitchMessage(name, info, kind), {
        label: 'Remove & switch',
        onClick: () => run(true),
      });
    }
  }
  // ---- component family (r16): facade addComponent @5790071 (store addComponent +
  // camera → addDefaultCameraTrack), addDefaultCameraTrack @5526993 (addPerformanceTrack +
  // appendCameraItem 'still'), showComponentList @5817658. Gesture brackets are ours (the
  // drop/click UI layer, matching our r8 undo contract for adds — SKILL #39).
  addComponent(spec, pos2) {
    this.show.beginEditGesture();
    let id;
    try {
      id = this.objects.addComponent(spec, pos2);
      if (id && this.objects.get(id)?.kind === 'camera') this.addDefaultCameraTrack(id);
    } finally { this.show.endEditGesture(); }
    return id;
  }
  addDefaultCameraTrack(id) {                            // @5526993
    const trackId = this.show.addPerformanceTrack(id);
    if (trackId) this.show.addCameraItem(trackId, 'still');
  }
  showComponentList() {                                  // @5817658 — semantic equivalent: the
    // live reveals its components panel on the "mine" tab; our scene list is permanent —
    // flash the Scene panel so the added component is visible.
    const panel = document.getElementById('panelScene');
    panel?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    this._ui?.refreshInspector?.();
  }
  tickDrawPreview() {  // z port: pose the mesh to the stroke preview ghost; restore on end (hoe verbatim @5476375)
    const d = this._drawPreview;
    if (d) {
      const m = this.meshById.get(d.id);
      if (m) {
        this._drawPreviewId = d.id;
        // world pose → mesh-local: verbatim hoe @5476375 (worldToLocal + parent world quat invert)
        if (m.parent) {
          m.parent.updateWorldMatrix(true, false);
          const v = _hoeV.set(...d.position);
          m.position.copy(m.parent.worldToLocal(v));
          m.parent.getWorldQuaternion(_hoePQ);
          m.quaternion.copy(_hoePQ.invert().multiply(_hoeQ.setFromEuler(_hoeE.set(...d.rotation))));
        } else { m.position.set(...d.position); m.quaternion.setFromEuler(_hoeE.set(...d.rotation)); }
        if (d.look && m.userData.figure) m.userData.figure.head.rotation.set(...ezHeadRotation(d.look.headYawRad, d.look.headPitchRad));   // kje=EZt(yaw,pitch) — audit P1-6b
      }
    } else if (this._drawPreviewId) {
      const id = this._drawPreviewId; this._drawPreviewId = null;
      const obj = this.objects.get(id); const m = this.meshById.get(id);
      if (obj && m) {  // restore stored pose (+ head)
        m.position.set(...(obj.position ?? [0, 0, 0]));
        m.rotation.set(...(obj.rotation ?? [0, 0, 0]));
        if (m.userData.figure?.head) m.userData.figure.head.rotation.set(...(obj.headRotation ?? [0, 0, 0]));
      }
    }
  }

  // ================= scene load/save =================
  async loadSceneData(data) {
    const scene = loadScene(data, this.propCatalog);
    if (!scene) { console.error('scene load failed'); return false; }
    this.objects.setObjects(scene.objects ?? {});
    this.show.setShow(scene.show ?? { name: 'Show', tracks: [] });
    this.light = normalizeLight(scene.light ?? null);
    this.env.setSkyStyle(this.light.skyStyle === 'realistic' ? 'realistic' : 'classic', this.light);
    // P2: a scene restored with clouds enabled goes through the same budget probe as a manual enable
    // review r13 P2: a scene restored with hdr enabled needs the SAME finish force-on as the
    // setHdr mutator — otherwise hdr loads into the plain+hdr fallback (no bloom + the ACES
    // wrapper scale), a materially different look than the authoring session.
    if (this.light.hdr?.enabled && finishCapable(this.renderer) && !this.finishPref?.enabled) {
      this.finishPref = { enabled: true, source: 'manual' };
      writeFinishPref(this.finishPref);
    }
    if (!this.light.hdr?.enabled) this._bloom.dispose?.();   // review r13 P3: no mip RTs resident while hdr is off
    this.page.recordAspect = scene.recordAspect ?? '16:9';
    this._syncObjects();
    this.shadowFit.force();
    this.fogNearFar.fitNow();
    this._restEval = false;                          // loadShow: seek pose cleared
    this._restSeekPending = false;
    this._seenSeekEpoch = this.page.seekEpoch ?? 0;
    this.playbackClips = new Map();                  // no stale playback state across loads
    return true;
  }
  currentSceneJSON() {
    return saveScene({
      v: C.SCHEMA_V,
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
      aim(subjectId, t, offset = 0, cameraId = null) {
        // fallback (W resolver): a subject-less camera item aims at the CAMERA's target object
        if (!subjectId && cameraId) subjectId = self.objects.get(cameraId)?.targetId ?? null;
        if (!subjectId) return null;
        // pixel-oracle R9: verbatim W @5720107 — tt < playhead-1e-6 → evaluated subject pose
        // + NP; else ROr (mesh world pos) + NP. NP = store NP @5264414 (VDe/uje catalog
        // height: figure 1.75·scaleY — NOT the mesh bbox, which measures ~2.11 with the head
        // sphere and aimed ~0.25m too high: live pitch 13.4° down measured vs 13.86 predicted).
        const np = self.show.subjectHeightOffset(subjectId, self.objects.objects);
        if (t < self.page.playheadS - 1e-6) {
          const pose = self._subjectPos(subjectId, t);
          if (pose) return [pose[0], pose[1] + np + offset, pose[2]];
        }
        const m = self.meshById.get(subjectId);
        if (!m) return null;
        const p = m.getWorldPosition(new THREE.Vector3());
        return [p.x, p.y + np + offset, p.z];
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
      // z(): revolve center — P = parent-composed STORE TRS (world origin when null id),
      // N = the center's LIVE mesh world pos (falls back to P when no mesh)
      revolveCenter(centerId) {
        const objects = self.objects.all();
        let P = new THREE.Vector3();
        const rec = centerId ? objects[centerId] : undefined;
        if (rec) {
          // Zo: compose store TRS up the parentId chain (VWt)
          let pos = [...(rec.position ?? [0, 0, 0])];
          let rot = [...(rec.rotation ?? [0, 0, 0])];
          let scl = [...(rec.scale ?? [1, 1, 1])];
          let parent = rec.parentId ? objects[rec.parentId] : undefined;
          while (parent) {
            const pm = new THREE.Matrix4().compose(
              new THREE.Vector3(...(parent.position ?? [0, 0, 0])),
              new THREE.Quaternion().setFromEuler(new THREE.Euler(...(parent.rotation ?? [0, 0, 0]))),
              new THREE.Vector3(...(parent.scale ?? [1, 1, 1])));
            const m2 = new THREE.Matrix4().compose(
              new THREE.Vector3(...pos),
              new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
              new THREE.Vector3(...scl));
            pm.multiply(m2);
            const p2 = new THREE.Vector3(), q2 = new THREE.Quaternion(), s2 = new THREE.Vector3();
            pm.decompose(p2, q2, s2);
            pos = [p2.x, p2.y, p2.z];
            const e2 = new THREE.Euler().setFromQuaternion(q2);
            rot = [e2.x, e2.y, e2.z];
            scl = [s2.x, s2.y, s2.z];
            parent = parent.parentId ? objects[parent.parentId] : undefined;
          }
          P.set(...pos);
        }
        const mesh = centerId ? self.meshById.get(centerId) : undefined;
        const N = mesh ? mesh.getWorldPosition(new THREE.Vector3()) : P.clone();
        return { P, N };
      },
      // ne(): fold a path into the caller's accumulators {T, E, A} — parent-local position +
      // yaw (Z2r); person+subject-aim splits yaw via xM; spotlight aims at subject+offset.
      pathApply(item, elapsedInItem, absTime, trackCharacterId, acc) {
        const objects = self.objects.all();
        const me = objects[trackCharacterId];
        if (!me) return;
        const isPerson = isPersonKind(me.kind);
        const isSpot = me.kind === 'spotlight';
        const personSubjectAim = isPerson && item.aim === 'subject' && !!item.subjectId;
        let subjectPos = personSubjectAim ? null : self._subjectPos(item.subjectId, absTime);
        if (isSpot && subjectPos) {
          // review P2-1: verbatim spotlight branch @5715687 — te(subj) + NP(subj, ·, NIr=.5)
          // with the CATALOG height (VDe/uje), not the mesh bbox
          const np = self.show.subjectHeightOffset(item.subjectId, objects, 0.5);
          subjectPos = [subjectPos[0], subjectPos[1] + np, subjectPos[2]];
        }
        const st = pathStateAt(personSubjectAim ? { ...item, aim: 'travel' } : item, elapsedInItem, subjectPos);
        if (personSubjectAim && st.yawRad !== null) {
          const aimPt = self.resolvers().aim(item.subjectId, absTime);
          if (aimPt) {
            const ownAim = [st.position[0], st.position[1] + C.EYE_HEIGHT_K * (me.scale?.[1] ?? 1), st.position[2]];
            st.yawRad = gazeSplit(st.yawRad, ownAim, aimPt).bodyYawRad;
          }
        }
        const mesh = self.meshById.get(trackCharacterId);
        const parent = mesh?.parent && mesh.parent !== self.scene ? mesh.parent : null;
        const v = new THREE.Vector3(...st.position);
        if (parent) parent.worldToLocal(v);
        acc.T.copy(v);
        let parentYaw = 0;
        let preserved = null;
        if (parent) {
          parentYaw = new THREE.Euler().setFromQuaternion(parent.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
          if (isSpot) {
            const se = new THREE.Euler().setFromQuaternion(acc.A, 'YXZ');
            preserved = [se.x, se.y, se.z];
          }
        }
        const rot = pathRotation(st, parentYaw, preserved);
        if (rot) {
          const e = new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ');
          acc.A.setFromEuler(e);
        }
      },
    };
  }

  // te(): subject position at time — persons evaluate their track (eEe), others use the
  // live mesh world pos, falling back to the stored base position.
  _subjectPos(subjectId, t) {
    if (!subjectId) return null;
    const obj = this.objects.get(subjectId);
    if (obj && isPersonKind(obj.kind)) {
      const track = this.layout().tracks.find(tr => tr.characterId === subjectId);
      if (track) {
        const state = evalCharacterTrack(track, t);
        if (state?.position) return state.position;
      }
    } else if (obj) {
      // review P1-2: live objectPoseAt (te @5715449 / le @5718434) evaluates ANY kind at t —
      // non-persons fold their track items (Q + ne path apply) onto the base TRS. Props/
      // targets on paths aimed at by preceding cam items at past t need the folded pose.
      const track = this.layout().tracks.find(tr => tr.characterId === subjectId);
      if (track && track.items.length) {
        const state = evalObjectItems(track, t, true, this.resolvers(), obj);
        if (state && state.mode !== 'base' && state.position) return state.position.toArray();
      }
    }
    const m = this.meshById.get(subjectId);
    if (m) { const p = m.getWorldPosition(new THREE.Vector3()); return [p.x, p.y, p.z]; }
    const rec = this.objects.get(subjectId);
    return rec ? [...(rec.position ?? [0, 0, 0])] : null;
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

    // --- non-person objects + camera markers + rig offsets + head look (L) ---
    this.rigOffsets.clear();
    for (const track of layout.tracks) {
      const obj = this.objects.get(track.characterId);
      if (!obj) continue;   // L applies to ALL animatable kinds incl. camera markers
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
      const r = evalObjectItems(track, timeS, foldMode, this.resolvers(), obj);
      if (r.mode !== 'base') {
        mesh.scale.copy(r.scale);
        if (r.mode !== 'walk') {
          mesh.position.copy(r.position);
          mesh.rotation.set(...r.rotation);   // GA-unwrapped vs base rotation
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
        const merged = mergeRigOffsets(this.rigOffsets.get(id), headLookOffsets(split));   // IZt additive
        this.rigOffsets.set(id, merged);
        continue;
      }
      const track = this.layout().tracks.find(t => t.characterId === id);
      const hr = this._figureHeadRotation(track, timeS, obj, split);
      if (hr) applyHeadRotation(mesh, hr);
    }

    // humanoid rigs: apply clip + offsets (b())
    this.playbackClips = clips;
    for (const [id, rig] of this.objectManager.humanoidRigs) {
      const c = clips.get(id);
      rig.applyClip(c ?? null, this.objects.get(id)?.animation ?? null);
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
    const hits = this._groundRC.intersectObjects(this.walkableSurfaces(), true);   // recursive — props ground too
    return hits[0]?.point?.y ?? null;
  }

  stopPerformance() { // live stopPerformance @5548587: playing=false + performanceSeekS=null -> at-rest tick resets (timeS 0 + stored TRS)
    this.page.stop();
    this.page.playheadS = 0;
    this.page.seekEpoch = (this.page.seekEpoch ?? 0) + 1;
    this.page.changed();
    this._restEval = false;
    this._restSeekPending = false;
    this.resetToBase();
  }
  resetToBase() { // ye(): meshes back to stored TRS + rigs to their animation record (rest)
    for (const [id, obj] of Object.entries(this.objects.all())) {
      const mesh = this.meshById.get(id);
      if (!mesh) continue;
      mesh.position.set(...(obj.position ?? [0, 0, 0]));
      mesh.rotation.set(...(obj.rotation ?? [0, 0, 0]));
      mesh.scale.set(...(obj.scale ?? [1, 1, 1]));
      if (obj.kind === 'simple_figure') applyHeadRotation(mesh, obj.headRotation);
    }
    // live stopPerformance: playbackClips cleared → b() falls to obj.animation (paused clip@0)
    this.playbackClips = new Map();
    for (const [id, rig] of this.objectManager.humanoidRigs) {
      const obj = this.objects.get(id);
      rig.applyClip(null, obj?.animation ?? null);
    }
    // steady rest also recomputes rig offsets at t=0 (live else-branch: setRigOffsets(q(track,0)))
    this._restOffsetsT0();
    this._restEval = false;
    this._restSeekPending = false;
  }

  _restOffsetsT0() { // rig offsets evaluated at t=0 for every track (live rest branch)
    this.rigOffsets.clear();
    for (const track of this.layout().tracks) {
      const joints = rigJointsAtTime(track.items.map(u => u.item), 0);
      if (joints) this.rigOffsets.set(track.characterId, joints);
    }
  }

  // ================= rig posing facade (r14 verbatim) =================
  // rigPoseObjectId (computed @5804170): the character of the SELECTED rig-transform
  // segment, null while playing — drives the joint spheres + the gizmo rig branches.
  get rigPoseObjectId() {
    if (this.page.playing) return null;
    const seg = this.page.selectedSegment;
    if (!seg) return null;
    const track = this.show.show.tracks.find(t => t.id === seg.trackId);
    return track?.items.find(x => x.id === seg.itemId)?.kind === 'rig-transform'
      ? track.characterId ?? null : null;
  }
  // transformPoseObjectId (computed @5804140): same for transform/cam-transform — the
  // gizmo prefers this object over the plain selection (B() `ct`).
  get transformPoseObjectId() {   // computed @5803870
    if (this.page.playing) return null;
    const seg = this.page.selectedSegment;
    if (!seg) return null;
    const track = this.show.show.tracks.find(t => t.id === seg.trackId);
    return track?.items.find(x => x.id === seg.itemId)?.kind === 'transform' || track?.items.find(x => x.id === seg.itemId)?.kind === 'cam-transform'
      ? track.characterId ?? null : null;
  }
  // env accessors (verbatim shapes @5673270): boneOf / majorJointsOf / clipLocalOf
  boneOf(id, name) { return this.objectManager.humanoidRigs.get(id)?.bones.get(name) ?? null; }
  majorJointsOf(id) {
    const r = this.objectManager.humanoidRigs.get(id);
    return r ? [...r.bones.entries()].filter(([n]) => isMajorJoint(n)).map(([, b]) => b) : [];
  }
  clipLocalOf(id, name) { return this.objectManager.humanoidRigs.get(id)?.clipLocal.get(name) ?? null; }
  setLiveRigDrag(state) { this.liveRigDrag = state; }

  // ---- held-pose family (r15 verbatim port) ----
  // facade setObjectPose wrapper @5793108 — clears any pending pose, then the store's
  // un-baked representation (animation {clip, playing:false})
  setObjectPose(id, pose) {
    this.pendingPoses.delete(id);
    this.objects.setObjectPose(id, pose);
  }
  // markPosePending @5793217
  markPosePending(id, pose) { this.pendingPoses.set(id, pose); }
  // bakeRigPoseSegment @5793269 — fresh performance track + unselected rig-transform
  // item + a joints key at tS:0. false propagates to the caller's setObjectPose fallback.
  bakeRigPoseSegment(id, joints) {
    const trackId = this.show.addPerformanceTrack(id);
    if (!trackId) return false;
    const itemId = this.show.addRigTransformItem(trackId, undefined, false);
    return itemId ? (this.show.addRigKeyframe(trackId, itemId, { tS: 0, joints }), true) : false;
  }
  // bakePendingPose @5793452 — onSkeletonReady resolver: re-run the solver; a truthy
  // joints map bakes (fallback setObjectPose on failure), null leaves the pose pending
  bakePendingPose(id, solver) {
    const pose = this.pendingPoses.get(id);
    if (!pose) return;
    const joints = solver(id, pose);
    if (joints) {
      this.pendingPoses.delete(id);
      if (!this.bakeRigPoseSegment(id, joints)) this.setObjectPose(id, pose);
    }
  }
  // sampleClipRigOffsets (verbatim @5673437): sample pose + idle clips at t=0 over the
  // major joints (cot), diff vs idle (fWr) — null when the rig/clip is missing or the
  // pose is idle-identical
  sampleClipRigOffsets(id, poseName) {
    const rig = this.objectManager.humanoidRigs.get(id);
    if (!rig) return null;
    const poseClip = rig.actions.get(poseName)?.getClip();
    const idleClip = rig.actions.get('idle')?.getClip();
    if (!poseClip || !idleClip) return null;
    const idle = {}, pose = {};
    for (const [name, bone] of rig.bones) {
      if (!isMajorJoint(name)) continue;
      idle[name] = sampleBonePose(idleClip, name, bone, 0);
      pose[name] = sampleBonePose(poseClip, name, bone, 0);
    }
    const joints = diffRigPose(idle, pose);
    return Object.keys(joints).length > 0 ? joints : null;
  }

  // captureFocusedRigPose (verbatim @5536618): bake the dragged offsets as a rig key at
  // the playhead inside the SELECTED rig-transform segment.
  captureFocusedRigPose(offsets) {
    const seg = this.page.selectedSegment;
    if (!seg) return;
    const track = this.show.show.tracks.find(t => t.id === seg.trackId);
    const item = track?.items.find(x => x.id === seg.itemId);
    if (!item || item.kind !== 'rig-transform') return;
    const tS = this.page.playheadS - item.startS;
    if (tS < 0 || tS > itemDuration(item)) return;
    this.show.addSampledRigKeyframe(seg.trackId, seg.itemId, tS, offsets);
  }

  // ---- xqr joint-sphere overlay (verbatim @5731200) ----
  _setupRigHandles() {
    const RIG_JOINT_R = 0.028;                       // bqr
    this.rigJointGroup = new THREE.Group();          // r: renderOrder 1
    this.rigJointGroup.renderOrder = 1;
    this.scene.add(this.rigJointGroup);
    this.planningAids.push(this.rigJointGroup);
    this._rigSphereGeo = new THREE.SphereGeometry(RIG_JOINT_R, 12, 8);
    this._rigMatIdle = new THREE.MeshBasicMaterial({ color: 0x44AAFF, depthTest: false });   // yqr 4500223
    this._rigMatSel = new THREE.MeshBasicMaterial({ color: 0xFFCC44, depthTest: false });    // vqr 16763972
  }
  rigHandlesSelectedJoints() { return this._rigSelectedJoints; }
  rigHandlesSetSelectedJoints(list) { this._rigSelectedJoints = list; }
  _rigSpheresClear() {                               // u()
    for (const m of this._rigSpheres.values()) this.rigJointGroup.remove(m);
    this._rigSpheres.clear();
    this.rigJointPickables.length = 0;
    this._rigSpheresFor = null;
  }
  _rigSpheresBuild(id) {                             // h(m)
    this._rigSpheresClear();
    for (const bone of this.majorJointsOf(id)) {
      const m = new THREE.Mesh(this._rigSphereGeo, this._rigMatIdle);
      m.userData.rigJoint = bone.name;
      m.userData.rigObjectId = id;
      this.rigJointGroup.add(m);
      this._rigSpheres.set(bone.name, m);
      this.rigJointPickables.push(m);
    }
    this._rigSpheresFor = this._rigSpheres.size > 0 ? id : null;
  }
  _rigWindowActive() {                               // f(): selected segment is rig-transform AND playhead inside its window
    const seg = this.page.selectedSegment;
    if (!seg) return false;
    const track = this.show.show.tracks.find(t => t.id === seg.trackId);
    const item = track?.items.find(x => x.id === seg.itemId);
    if (item?.kind !== 'rig-transform') return false;
    const t = this.page.playheadS - item.startS;
    return t >= 0 && t <= itemDuration(item);
  }
  _rigHandlesTick() {                                // xqr.tick()
    const id = this.rigPoseObjectId;
    if (!id || !this._rigWindowActive()) {
      this.rigJointGroup.visible = false;
      if (this._rigSpheresFor !== null || this._rigSpheres.size > 0) this._rigSpheresClear();
      this._rigSelectedJoints = [];
      return;
    }
    this.rigJointGroup.visible = true;
    if (this._rigSpheresFor !== id) this._rigSpheresBuild(id);
    for (const [name, m] of this._rigSpheres) {
      const bone = this.boneOf(id, name);
      if (bone) {
        bone.getWorldPosition(m.position);
        m.material = this._rigSelectedJoints.includes(name) ? this._rigMatSel : this._rigMatIdle;
      }
    }
  }

  // ================= camera mesh poser (live mqr Q @5720949) =================
  // Pixel-oracle R11 M2: the live camera PROP sits at its evaluated orbit pose at t=2.51
  // while ours stayed at store TRS — the live poses camera meshes every frame (edit mode,
  // performance active) via dZt + Hie. vFr @5432235 skip: meshDragged always, selected at
  // rest. xFr @5432334: v-loop resets previously-posed cameras to store TRS when no longer
  // animated. Static cam-follow at rest poses via U8r @4905083; selected+previously-animated
  // cameras bake their mesh pose to the store (updateObjectTransform).
  _storeWorldTRS(obj) {  // Zo @4901839 — store TRS -> world (single-level parent compose, VWt/CP/wDe)
    const objs = this.objects.all();
    const p = obj.parentId ? objs[obj.parentId] : undefined;
    if (!p) return { position: obj.position ?? [0, 0, 0], rotation: obj.rotation ?? [0, 0, 0] };
    const pm = new THREE.Matrix4().compose(
      new THREE.Vector3(...(p.position ?? [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(p.rotation ?? [0, 0, 0]), 'XYZ')),
      new THREE.Vector3(...(p.scale ?? [1, 1, 1])));
    const cm = new THREE.Matrix4().compose(
      new THREE.Vector3(...(obj.position ?? [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(obj.rotation ?? [0, 0, 0]), 'XYZ')),
      new THREE.Vector3(...(obj.scale ?? [1, 1, 1])));
    const m = pm.multiply(cm);
    const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
    m.decompose(pos, quat, scl);
    const e = new THREE.Euler().setFromQuaternion(quat, 'XYZ');
    return { position: [pos.x, pos.y, pos.z], rotation: [e.x, e.y, e.z] };
  }
  _camHie(mesh, worldPos, worldQuat) {  // Hie @5445559 — world pose -> parent-local
    const parent = mesh.parent;
    if (!parent) { mesh.position.copy(worldPos); mesh.quaternion.copy(worldQuat); return; }
    parent.updateWorldMatrix(true, false);
    mesh.position.copy(parent.worldToLocal(worldPos.clone()));
    parent.getWorldQuaternion(_q1);
    mesh.quaternion.copy(_q1.invert().multiply(worldQuat));
  }
  tickCameraMeshPoses() {  // Q @5720949 (mqr.tickPreview)
    if (this.page.mode !== undefined && this.page.mode !== 'edit') { this._posedCams.clear(); return; }
    // G(): isPreviewPlaying || capturing || performanceSeekS!==null -> playing || _restEval (no hub capture)
    const active = !!this.page.playing || this._restEval;
    const animatedNow = new Set();
    const objs = this.objects.all();
    const [rw, rh] = C.ASPECTS[this.page.recordAspect] ?? C.ASPECTS['16:9'];
    const aspect = rw / rh;
    if (active) {
      for (const [id, obj] of Object.entries(objs)) {
        if (obj.kind !== 'camera') continue;
        const mesh = this.meshById.get(id);
        if (!mesh) continue;
        if (this.manipulator?.isMeshDragged(mesh)) continue;   // vFr: dragged cameras keep their drag pose
        const track = this.show.trackOf(id);
        if (!track) continue;
        const base = this._storeWorldTRS(obj);   // ce(): base = Zo world-resolved store TRS
        const out = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), fovDeg: 0 };
        const any = evalCameraObject({
          base: { position: base.position, rotation: base.rotation, focalLengthMm: obj.focalLengthMm ?? C.FOCAL_DEFAULT },
          out, items: track.items, timeS: this.page.playheadS, aspect,
          resolvers: this.resolvers(), cameraId: id,
        });
        if (any) { this._camHie(mesh, out.position, out.quaternion); animatedNow.add(id); }
      }
    } else {
      // at rest: only static cam-follow stays posed (O @5719948: first item cam-follow w/ offset+objectId, startS<=0)
      for (const [id, obj] of Object.entries(objs)) {
        if (obj.kind !== 'camera') continue;
        const track = this.show.trackOf(id);
        const first = track?.items?.[0];
        if (!(first?.kind === 'cam-follow' && first.offset && first.objectId && first.startS <= 0)) continue;
        const mesh = this.meshById.get(id);
        const followed = this.meshById.get(first.objectId);
        if (!mesh || !followed) continue;
        // vFr at rest: skip selected/dragged — bake the mesh pose to the store if it was animated
        const dragged = !!this.manipulator?.isMeshDragged?.(mesh);
        if (dragged || this.objects.selectedId === id) {
          if (this._posedCams.has(id)) {
            this.objects.update(id, {
              position: [mesh.position.x, mesh.position.y, mesh.position.z],
              rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
            });
          }
          continue;
        }
        // U8r @4905083: Eye = followedWorld composed with offset
        const fp = followed.getWorldPosition(new THREE.Vector3());
        const fq = followed.getWorldQuaternion(new THREE.Quaternion());
        const eyePos = new THREE.Vector3(...(first.offset.position ?? [0, 0, 0])).applyQuaternion(fq).add(fp);
        const eyeQuat = fq.clone().multiply(new THREE.Quaternion(...(first.offset.quaternion ?? [0, 0, 0, 1])));
        this._camHie(mesh, eyePos, eyeQuat);
        animatedNow.add(id);
      }
    }
    // v-loop: previously posed, not animated now, not dragging -> store TRS
    for (const id of this._posedCams) {
      if (animatedNow.has(id)) continue;
      const obj = objs[id];
      const mesh = this.meshById.get(id);
      if (!obj || !mesh) continue;
      if (this.manipulator?.isMeshDragged(mesh)) continue;
      mesh.position.set(...(obj.position ?? [0, 0, 0]));
      mesh.rotation.set(...(obj.rotation ?? [0, 0, 0]));
    }
    this._posedCams = new Set([...animatedNow, ...[...this._posedCams].filter(id => {
      const m = this.meshById.get(id);
      return m && this.manipulator?.isMeshDragged(m);
    })]);
  }

  // r8-3: through-the-lens cameras view — the editor camera adopts the selected camera's
  // evaluated pose (evalPose set every frame by updateCameraMarkers). Orbit disabled while
  // active; fov keeps the record-aspect frame-guide value (updateFrameGuide).
  updateCameraThroughLens() {
    const inCam = this.page.stageView === 'cameras' && this.page.mode !== 'camera';   // camera mode owns the editor camera (review P1)
    if (this.orbit) this.orbit.enabled = !inCam;
    const id = this.objects.selectedId;
    const obj = id ? this.objects.get(id) : null;
    const mesh = id ? this.meshById.get(id) : null;
    const pose = mesh?.userData?.evalPose;
    if (!inCam || obj?.kind !== 'camera' || !pose) {
      if (this._lensActive && !inCam) {
        // review P1-4: restore the SAVED editor viewpoint (position + quaternion + orbit target)
        const save = this._lensSave;
        if (save) {
          this.camera.position.copy(save.position);
          this.camera.quaternion.copy(save.quaternion);
          if (this.orbit) this.orbit.target.copy(save.target);
        }
        this.camera.fov = C.EDITOR_FOV;
        this.camera.updateProjectionMatrix();
        this._lensActive = false;
        this._lensSave = null;
      }
      // still inside cameras view but no pose (deselection): freeze the last lens frame (review P3-11)
      // review P2-2: the freeze must KEEP the mesh/labels hidden (restoring them re-shoots the
      // lens interior for the freeze duration) — restore only when actually leaving cameras view
      if (!inCam) {
        this._lensHideRestore?.();
        this._lensHideRestore = null;
        this._lensObjId = null;
      }
      return;
    }
    if (!this._lensActive) {
      // first activation: save the editor viewpoint
      this._lensSave = {
        position: this.camera.position.clone(),
        quaternion: this.camera.quaternion.clone(),
        target: this.orbit ? this.orbit.target.clone() : null,
      };
    }
    if (this._lensObjId !== id || !this._lensHideRestore) {
      // hide (or re-hide for a newly adopted camera): mesh subtree (incl. its frustum child)
      // + every name-label sprite. Restored on deactivate / re-adopt.
      this._lensHideRestore?.();
      const hidden = [];
      if (mesh.visible) { mesh.visible = false; hidden.push([mesh, true]); }
      for (const sprite of this.objectManager.labels.values()) {
        if (sprite.visible) { sprite.visible = false; hidden.push([sprite, true]); }
      }
      this._lensHideRestore = () => { for (const [o, v] of hidden) { o.visible = v; } };
      this._lensObjId = id;
    }
    // pixel-oracle R9: the feed renders at the camera's EVALUATED lens fov (live measured
    // 31.32° = Z_(35mm, 16/9)) — not the editor fov (was 50: figure 1.66× too small in frame).
    // review P1-1: applied EVERY frame (live ce() sets Te.fov=x.fovDeg per-frame; the aspect
    // picker's updateFrameGuide overwrites camera.fov mid-lens and scrubbing crosses items
    // with different focal/fov)
    const fov = pose.fovDeg ?? C.EDITOR_FOV;
    if (this.camera.fov !== fov) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.position.copy(pose.position);
    this.camera.quaternion.copy(pose.quaternion);
    // pe (verbatim @5722716): the preview camera carries obj.shake — eval -> fov -> cL.
    // Gate ie=z2r @4316695: the ACTIVE item being a cam-manual with shakeBaked (a live
    // recording replays its baked shake) suppresses the live shake. shakeBaked survives
    // normalization (normItems spread), so live-recorded rows keep the gate working;
    // offline-created items never carry it. The pose is re-set from evalPose every
    // frame, so the shake is self-restoring (live: explicit restoreShake @5722450).
    const shake = obj.shake ?? 'off';
    if (shake !== 'off') {
      // _he @itemAtTime: the containing/last-started camera item governs the gate
      const items = (this.layout().tracks.find(t => t.characterId === id)?.items ?? []).map(u => u.item);
      const active = itemAtTime(items, this.page.playheadS);
      const baked = active?.kind === 'cam-manual' && !!active.shakeBaked;
      if (!baked) applyShakePose(this.camera, shakeOffsets({ t: this._shakeT, intensity: shake }));
    }
    this._lensActive = true;
  }

  // ================= camera marker evaluation (edit mode) =================
  updateCameraMarkers() {
    const layout = this.layout();
    const resolvers = this.resolvers();
    const activeByCam = new Map();   // cameraId → { targetPos } (framesMarkerNow ≈ xq)
    // pixel-oracle R9: the eval aspect is the RECORD aspect (live feed renders at the record
    // aspect — verified: lens fov measured 31.32° = Z_(35, 16/9) with recordAspect 16:9)
    const [rwa, rha] = C.ASPECTS[this.page.recordAspect] ?? C.ASPECTS['16:9'];
    const recordAspect = rwa / rha;
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
        aspect: recordAspect, resolvers, cameraId: track.characterId,
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
    const fovDeg = fovFromFocal(this.focalLengthMm, aspect);   // BU: DERIVED active-camera focal (F8+Hv 50) — r17
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
          meshDragged: !!this.manipulator?.isMeshDragged?.(mesh),
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
    // (r17: the shake clock moved into tickShake — one increment, after the mode branch)

    // --- update ticks (D2.7 order) ---
    // 1. rig tick: restore → mixer → rig offsets (ghost head-look merged: bundle O @5790417 — rigOffsets rebuilt every frame, no accumulation)
    const _ghost = this._drawPreview;
    const _ghostLook = _ghost?.look && this.objects.get(_ghost.id)?.kind === 'humanoid' ? headLookOffsets(_ghost.look) : null;
    for (const [id, rig] of this.objectManager.humanoidRigs) {
      let off = this.rigOffsets.get(id);
      if (_ghostLook && id === _ghost.id) off = mergeRigOffsets(off ?? {}, _ghostLook);
      // f() verbatim: the live drag SPREAD-REPLACES the per-joint entries of the rig-item
      // offsets (NOT rotation-summed like the ghost head-look IZt merge above)
      if (this.liveRigDrag && this.liveRigDrag.objectId === id) off = { ...off, ...this.liveRigDrag.offsets };
      rig.tick(dt, off);
    }
    // 2. playback
    if (this.page.playing) {
      this._restEval = false;
      this._restSeekPending = false;
      const t = this.page.tickClock();
      const layout = this.layout();
      if (t >= layout.durationS) { this.page.seek(layout.durationS); this.page.stop(); this.resetToBase(); }   // stop → stored TRS (no end pose)
      else this.evaluateAt(t, dt);
    } else if (this.manipulator?.scrubbing) {
      // live scrub: seekPerformance per pointermove → tick ue(t, dt) — rate-limited yaw (Wzt 8rad/s),
      // NOT the capture-path instant snap; clips pinned by b()
      this.evaluateAt(this.page.playheadS, dt, false);
      this._restEval = true;                          // pose persists after scrub release (pinned)
    } else {
      // at rest — live performanceSeekS model:
      //  · a seek at rest (page change: ruler click, diamond click, keyframe jump) → poseNow
      //    (evaluate + SWr finishFades + rig.tick(0)), then the scene KEEPS evaluating at the
      //    seek time every tick with PINNED clip times (frozen poses) until stop/load clears it;
      //  · steady rest (no page events) → only rig offsets recompute at t=0; meshes stay at store TRS.
      const t = this.page.playheadS;
      if (this._restEval) {
        this.evaluateAt(t, dt, false);
      } else if (this._restSeekPending) {
        this._restSeekPending = false;
        this._restEval = true;
        this.evaluateAt(t, 0, true);
        for (const [, rig] of this.objectManager.humanoidRigs) rig.finishFades();
        for (const [id, rig] of this.objectManager.humanoidRigs) rig.tick(0, this.rigOffsets.get(id));
      } else {
        this._restOffsetsT0();
      }
    }
    // 3. manipulation
    this.manipulator?.tick();
    // 4. nav/controls
    this._navTick(dt);
    // 5. env
    this.env.applyDaylight(this.light);
    // 6. camera markers (UGr.v-equivalent: page focal + record aspect + target aim)
    this.updateCameraMarkers();
    // 6a. camera mesh poser (live mqr Q @5720949, tickPreview — runs after the marker tick
    // like the live frame order): pose camera MESHES to their evaluated track pose while
    // performance is active; at rest only static cam-follow; v-loop resets others to store TRS
    this.tickCameraMeshPoses();
    // 6b. r8-3: through-the-lens — cameras view renders THROUGH the selected camera
    // (position+quaternion from mesh.userData.evalPose; fov stays the record-aspect guide fov)
    this.updateCameraThroughLens();
    // 7. bounds + fog/near/far
    this.fogNearFar.tick(now);
    // 8. spotlight tick (oOr): light params, shadow slots, cookies, beams — every frame
    this.objectManager.spotTick(this.objects.all());
    // 9. shadow fit (AOr: redraw only on fingerprint change)
    this.shadowFit.tickAOr(this.renderer);
    // 10. path editor visuals
    this.pathEditor.tick();
    // 11. selection bounds (toolbar anchor) LAST — pad removed, bounds only
    this.selection.tick(this.objects.selectedIds, this.meshByIdProxy, this.camera);
    tickGizmoHover(this.manipulator?.transform);   // round 6: amber hover on the custom gizmo meshes
    // round 6 B6: snap (Shift = momentary inverse) + B5 walker (new meshes inherit flat/wire)
    syncSnap(this.manipulator?.transform, this.snapOn, !!this._keys?.has?.('shift'));
    if (this.renderMode !== 'shaded') applyRenderMode(this.scene, this.env.floor, this.renderMode);
    this.hover.tick(this.hoverPoint, this.hoverNormal, this.camera, this.container.clientHeight, dt * 1000,
      !this.page.playing && !this.manipulator?.dragging);

    // 12. nav ball roll (lZr.tick) — after selection so camera state is final
    this.navBall?.tick(dt);

    // 12a. r14 rig posing: joint spheres track the posed bones; the gizmo reseats when
    // rigPoseObjectId flips (segment change / play state / window crossing) — the live
    // subscribes B() to the same signals incl. performanceTimeS
    this._rigHandlesTick();
    const _rpid = this.rigPoseObjectId;
    const _tpid = this.transformPoseObjectId;      // transform/cam-transform segment flips reseat too (B() dep @5649052)
    if (this._lastRigPoseId !== _rpid || this._lastTransformPoseId !== _tpid) {
      this._lastRigPoseId = _rpid;
      this._lastTransformPoseId = _tpid;
      this.manipulator?.attachToSelection();
    }

    // --- render passes (re/ae port) ---
    // round 6 (C): plan shown → the 3D render pauses (live NUr gating: updateMatrixWorld only);
    // rigs/playback/livePose ticks above keep running so shownPose mirrors the show on the plan.
    if (this.page.viewportMode === 'plan' && this.page.mode === 'edit') {   // planShown @5787136: gates on playSession (recording) only — audit P1-7
      this.scene.updateMatrixWorld();
      this.tickDrawPreview();
      this.planView?.tick(performance.now());
      return;
    }
    // r17 Y/re @5722298/@5722357: the editor-camera shake brackets the render (apply → render →
    // restore). In camera mode this is the RIG shake (oEr — the dormant r15 family wakes here).
    this.tickShake(dt);
    try { this.renderFrame(); } finally { this.restoreShake(); }
    this._monitorRender?.();   // r17 monitor bar (polled fields only — SKILL #63)
  }

  finishOn() {   // m(): capability && pref
    return finishCapable(this.renderer) && !!this.finishPref?.enabled;
  }

  // round 13 (HDR): current hdr params for the finish render path — null when off.
  // strength = light.hdr.bloom × C.HDR_BLOOM_STRENGTH_K (design-of-record).
  _hdrHook() {
    const hdr = this.light.hdr;
    if (!hdr?.enabled) return null;
    const strength = (hdr.bloom ?? C.HDR_DEFAULTS.bloom) * C.HDR_BLOOM_STRENGTH_K;
    return {
      run: (tSrc, bloomTex, dt) => this._bloom.render(tSrc, bloomTex, dt),
      strength,
      exposure: hdr.exposure ?? C.HDR_DEFAULTS.exposure,
    };
  }

  // round 13 (HDR): the finish draw WITH the bloom pre-pass when hdr is on — shared by
  // renderFrame AND _autoMeasure so the auto-measure's cost includes the bloom chain
  // (HDR_BUDGET reuse: the finish gate covers the whole composite, no new scheduler).
  _renderFinishWithHdr() {
    const hook = this._hdrHook();
    if (hook) {
      const size = this.renderer.getDrawingBufferSize(_bufSize);
      const hdr = this.light.hdr;
      this._bloom.setSize(size.x, size.y);
      this._bloom.setParams({
        threshold: hdr.bloomThreshold ?? C.HDR_DEFAULTS.bloomThreshold,
        radius: hdr.bloomRadius ?? C.HDR_DEFAULTS.bloomRadius,
        strength: (hdr.bloom ?? C.HDR_DEFAULTS.bloom) * C.HDR_BLOOM_STRENGTH_K,
      });
    }
    this.finish.render(this.scene, this.camera, hook);
  }

  renderFrame() {
    const size = this.renderer.getDrawingBufferSize(_bufSize);
    if (size.x === 0 || size.y === 0) return;
    const finishOn = this.finishOn();
    // round 13 (HDR): plain fallback — three injects the tone map ONLY when drawing to the
    // canvas (vendor three.module.js WebGLPrograms.getParameters: toneMapping applies when
    // `currentRenderTarget === null`), so while hdr is on and finish is off the renderer
    // itself provides ACES × exposure; RT renders (finish path) stay linear and the finish
    // composite does its own ACES. Restored to NoToneMapping when hdr is off (default look).
    const hdrOn = !!this.light.hdr?.enabled;
    if (hdrOn && !finishOn) {
      if (this.renderer.toneMapping !== THREE.ACESFilmicToneMapping) this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      // review r13 P2 parity: three's ACESFilmicToneMapping chunk applies
      // `color *= toneMappingExposure / 0.6` (three.module.js tonemapping_pars_fragment) —
      // pre-scaling by 0.6 makes the fallback's effective exposure IDENTICAL to the finish
      // composite's pure Hill fit (acesHill(color * uExposure)); the exposure slider then
      // means the same thing in both paths.
      this.renderer.toneMappingExposure = (this.light.hdr.exposure ?? C.HDR_DEFAULTS.exposure) * 0.6;
    } else if (this.renderer.toneMapping !== THREE.NoToneMapping) {
      this.renderer.toneMapping = THREE.NoToneMapping;
      this.renderer.toneMappingExposure = 1;
    }
    // finish+HDR: the realistic dome outputs LINEAR HDR (uCurve=0, uOutputSRGB=0) so the
    // sun disc / stars cross the bloom threshold; plain+HDR keeps the legacy demo curve.
    this.env.updateRealisticSky(this.camera, !finishOn, hdrOn && finishOn);   // round 10: bakes + IBL + sRGB mode (P2: clouds ride the same pass)
    if (!finishOn) this.finish.release();
    if (finishOn) this._renderFinishWithHdr();
    else this.renderer.render(this.scene, this.camera);
    this._autoMeasure();
    this.drawOverlays();
  }

  drawOverlays() {   // ae(): stroke ring THEN planning aids — both depth-test against scene depth
    this.stroke.drawStroke(this.camera, () => this.editView(),
      this.objects.selectedIds ?? [], this.hoverId, this.meshById);
    this.renderPlanningAids();
    this.navBall?.render();   // lZr.S(): scissored pad w/ blurred backdrop + ball
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
        drawPlain: () => { this.env.updateRealisticSky(this.camera, true); this.renderer.setRenderTarget(null); this.renderer.render(this.scene, this.camera); },
        drawFinished: () => this._renderFinishWithHdr(),   // HDR: bloom cost rides inside the measured composite
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
    for (const a of aids) { if (a.traverse) a.traverse(o => o.layers.enable(PLANNING_LAYER)); else a.layers?.enable?.(PLANNING_LAYER); }
    const prevAuto = this.renderer.autoClear;
    this.renderer.autoClear = false;
    this.camera.layers.set(PLANNING_LAYER);
    this.renderer.render(this.scene, this.camera);
    this.camera.layers.set(0);
    for (const a of aids) { if (a.traverse) a.traverse(o => o.layers.disable(PLANNING_LAYER)); else a.layers?.disable?.(PLANNING_LAYER); }
    this.renderer.autoClear = prevAuto;
  }

  _collectLines() {
    const lines = [];
    this.scene.traverse(o => { if (o.isLine && o.visible) lines.push(o); });
    return lines;
  }

  _navTick(dt) {
    // Ma @5663138: camera mode → the rig drive owns the editor camera (orbit/nav-ball idle);
    // the floor clamp + polar recompute run ONLY in edit view (live C()&&Uit, review P1)
    if (this.page.mode === 'camera') {
      this.driveTick(dt);
      return;
    }
    this.navBall?.driveTick(dt);   // Ye: nav ball pad drag drives the camera
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


  // ================= r17 camera mode (kIr/eIr/$e/filmWithPhone port) =================
  // setMode @5809963 VERBATIM (recording gate dropped — no recording offline):
  // non-edit → editInteraction idle + stop playback; camera→edit → clearFilmingCamera +
  // finishManualFlight([]) draft cleanup; camera → clearSelection.
  setMode(m) {
    if (m !== 'edit') {
      if (this.page.editInteraction !== 'idle') this.page.setEditInteraction('idle');
      if (this.page.playing) this.page.stop();
    }
    const wasCamera = this.page.mode === 'camera' && m === 'edit';
    if (m === 'camera') this.objects.select([]);
    else this.filmingCameraId = null;
    this.page.mode = m;
    this.page.changed();
    if (wasCamera && this._manualFlight) this.finishManualFlight([]);
    if (m === 'edit') this._lastFlight = null;
  }

  // startFilming @5143823: filmingCameraId + mode camera (gate: kind camera)
  startFilming(id) {
    const n = id ?? this.activeCameraId();
    if (!n || this.objects.get(n)?.kind !== 'camera') return;
    this.filmingCameraId = n;
    this.setMode('camera');
  }

  // exitCameraMode @5143990: recording → toggleRecording (N/A offline); else back to edit
  exitCameraMode() {
    if (this.page.mode === 'camera') this.setMode('edit');
  }

  // activeCameraId @5143008: filming ?? selected-is-camera ?? first camera
  activeCameraId() {
    if (this.filmingCameraId) return this.filmingCameraId;
    const sel = this.objects.get(this.objects.selectedId);
    if (sel?.kind === 'camera') return this.objects.selectedId;
    for (const [id, o] of Object.entries(this.objects.all())) if (o.kind === 'camera') return id;
    return null;
  }

  // armPhoneFlight @5800667 non-phone body (r17): find-or-create the camera's track, add a
  // cam-manual item at the playhead, record the draft, start the manual flight. The whole
  // arm→cleanup span holds ONE gesture bracket (live history.holdEntry) so an un-recorded
  // enter/exit leaves no undo entry and no scene residue.
  armManualFlight(cameraId) {
    if (this.objects.get(cameraId)?.kind !== 'camera') return false;
    const existing = this.show.show.tracks.find(t => t.characterId === cameraId)?.id;
    this.show.beginEditGesture();          // held until finishManualFlight
    const trackId = existing ?? this.show.addPerformanceTrack(cameraId);
    const itemId = trackId && this.show.addCameraItem(trackId, 'manual', this.page.playheadS, null);
    if (!trackId || !itemId) { this.show.endEditGesture(); return false; }
    this._draft = { trackId, itemId, madeTrack: !existing };
    return this.startManualFlight(trackId, itemId) !== null;
  }

  // startManualFlight @5531164: validate cam-manual on a camera; stop playback; arm the session
  startManualFlight(trackId, itemId) {
    const tr = this.show.show.tracks.find(t => t.id === trackId);
    const it = tr?.items.find(i => i.id === itemId);
    if (!tr || it?.kind !== 'cam-manual' || this.objects.get(tr.characterId)?.kind !== 'camera') return null;
    if (this.page.playing) this.page.stop();
    this._manualFlight = { trackId, itemId };
    return tr.characterId;
  }

  // finishManualFlight @5799950 (app level): clears the session; NO samples offline → the
  // draft track/item is REMOVED (madeTrack → whole track; else the item) and a selectedSegment
  // pointing at it clears. With samples (filming arc, future) the item keeps them.
  finishManualFlight(samples) {
    const draft = this._draft;
    this._draft = null;
    const session = this._manualFlight;
    this._manualFlight = null;   // manualFlight.set(null) @5800128
    try {
      // performanceStore.finishManualFlight @5800128: samples land in the cam-manual item
      if (session && samples.length > 0) {
        this.show.updateTrackItems(session.trackId, items => items.map(it =>
          it.id === session.itemId && it.kind === 'cam-manual'
            ? { ...it, samples, durationS: samples.length / 20, shakeBaked: true }   // qA=20 @4315270
            : it));
        this._lastFlight = session;
      }
      if (!draft || samples.length > 0 || session?.itemId !== draft.itemId) return;
      // draft cleanup — the un-recorded entry leaves no residue
      draft.madeTrack ? this.show.removeTrack(draft.trackId)
        : this.show.removePerformanceItem(draft.trackId, draft.itemId);
      if (this.page.selectedSegment?.itemId === draft.itemId) {
        this.page.selectedSegment = null;
        this.page.changed();
      }
    } finally {
      if (draft) this.show.endEditGesture();   // history.releaseEntry — the held arm bracket
    }
  }

  // $e applyMode @5655928: mode transitions. camera → save editor pose (once), gizmo detach,
  // orbit off, takeOver the filming camera mesh pose (vZt @5445932; fallback floor guard),
  // camera-mode fov, drive cam seeded + reset. edit → restore pose, orbit on, fov FP,
  // gizmo reattach, updateFrameGuide.
  applyMode() {
    const m = this.page.mode;
    if (m === 'edit') {
      if (this._look?.isLocked) this._look.unlock();
      if (this._editorPoseSave) {
        this.camera.position.copy(this._editorPoseSave.position);
        this.camera.quaternion.copy(this._editorPoseSave.quaternion);
        this.orbit.target.copy(this._editorPoseSave.target);
        this._editorPoseSave = null;
      }
      this.orbit.enabled = true;
      this.camera.fov = C.EDITOR_FOV;
      this.camera.updateProjectionMatrix();
      this._stopZoom();                        // eIr: mode change stops held-key zoom + closeMenu
      this._monitorToggleMenu?.(null);         // eIr mode.onChange → closeMenu (P3-7)
      this.manipulator?.attachToSelection?.(); // $e edit branch: B() re-attaches the gizmo (P3-4)
      this._restoreCameraMeshForMonitor();
    } else if (m === 'camera') {
      // port-model: our through-the-lens drives the editor camera (the live's feed wall uses
      // separate render cameras) — leave the cameras view FIRST so the lens restore + takeOver
      // compose in the right order (live parity of OBSERVABLE: the monitor owns the viewport)
      if (this.page.stageView === 'cameras') {
        this.page.stageView = 'editor';
        this.updateCameraThroughLens();   // runs the lens restore branch (inCam now false)
      }
      this.manipulator?.transform?.detach();
      this.orbit.enabled = false;
      if (!this._editorPoseSave) {
        this._editorPoseSave = {
          position: this.camera.position.clone(),
          quaternion: this.camera.quaternion.clone(),
          target: this.orbit.target.clone(),
        };
      }
      // vZt takeOver: the filming camera mesh's world pose (iBe: filming ?? focused ?? F8 —
      // our activeCameraId covers focused/F8: selected-is-camera ?? first camera)
      const mesh = this.meshById.get(this.filmingCameraId ?? this.activeCameraId() ?? '');
      if (mesh) {
        mesh.getWorldPosition(this.camera.position);
        mesh.getWorldQuaternion(this.camera.quaternion);
      } else {
        this.camera.position.y = Math.max(this.camera.position.y, C.CAM_FLOOR_GUARD);
      }
      this.applyCameraModeFov();
      this._driveCam.position.copy(this.camera.position);
      this._driveCam.quaternion.copy(this.camera.quaternion);
      this._drive.reset();                     // G @5649455 — springs seeded from the takeOver pose
      this._hideCameraMeshForMonitor();
    }
    this.updateFrameGuide?.();
  }

  // BU @5444685: camera-mode fov = Z_(focalLengthMm, recordAspect) — the filming camera's
  // focal (derived F8+Hv default 50) at the record aspect
  applyCameraModeFov() {
    // UGr c() (= the live's applyCameraModeFov — NOT BU): the viewfinder fov adopts the guide
    // formula 2·atan(fovScale·XCe(viewportAspect)/2/focal). updateFrameGuide implements exactly
    // this — delegate (audit P0-2 correction).
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.updateFrameGuide?.();
  }

  // setFocalLengthMm @5150107: writes the ACTIVE CAMERA OBJECT (zoom persists into the scene)
  setFocalLengthMm(v) {
    const id = this.activeCameraId();
    if (id) { this.objects.update(id, { focalLengthMm: v }); this.objects.changed(); }
  }
  get focalLengthMm() {   // derived read side (focalLengthMm signal)
    return this.objects.get(this.activeCameraId())?.focalLengthMm ?? 50;
  }

  // Ma camera branch + en @5664174: the rig-physics drive owns the editor camera
  driveTick(dt) {
    const k = this._keys;
    const has = key => k?.has(key) ? 1 : 0;
    const rig = rigWithWeight(C.CAMERA_RIGS[this.rigs.rig], this.rigs.weight);
    this._drive.tick(dt, {
      rig,
      stickX: has('d') - has('a'),
      stickY: has('w') - has('s'),
      vertical: has('e') - has('q'),
      shift: !!k?.has('shift'),
      speedMps: this.rigs.speedMps,
      panDegPerS: this.rigs.panDegPerS,
    });
    this.camera.position.copy(this._driveCam.position);
    this.camera.quaternion.copy(this._driveCam.quaternion);
    // held-key zoom runs its own rAF loop (tickZoom) — wheel handled in attachWheel
  }

  // Y @5722298: the editor-camera shake pose. Camera mode → the rig shake (oEr with the
  // ground speed from the position delta); edit mode → the filming camera's obj.shake (the
  // live's A is only consumed by camera-mode surfaces — ae/be belong to the filming arc).
  tickShake(dt) {
    this._shakeT += dt;
    if (this.page.mode === 'camera') {
      this._shakeApply = this._rigShakePose(dt);
    } else {
      this._shakeGroundPos = null;
      this._shakeApply = null;
    }
    if (this._shakeApply) {
      this._shakeSavePos.copy(this.camera.position);
      this._shakeSaveQuat.copy(this.camera.quaternion);
      this._shakeSaved = true;
      applyShakePose(this.camera, this._shakeApply);
    }
  }
  // q @5722035: ground speed from the editor-camera position delta → oEr (the dormant r15 family)
  _rigShakePose(dt) {
    let speed = 0;
    if (this._shakeGroundPos && dt > 0) {
      const dx = this.camera.position.x - this._shakeGroundPos.x;
      const dz = this.camera.position.z - this._shakeGroundPos.z;
      speed = Math.hypot(dx, dz) / dt;
    }
    (this._shakeGroundPos ??= new THREE.Vector3()).copy(this.camera.position);
    const rig = C.CAMERA_RIGS[this.rigs.rig];
    const r = rigShake({ rig, t: this._shakeT, stridePhase: this._stridePhase, groundSpeedMps: speed, dtS: dt });
    this._stridePhase = r.stridePhase;
    return r.pose;
  }
  // re @5722357: restore the saved pose after the render (the drive re-poses next tick anyway)
  restoreShake() {
    if (!this._shakeSaved) return;
    this.camera.position.copy(this._shakeSavePos);
    this.camera.quaternion.copy(this._shakeSaveQuat);
    this._shakeSaved = false;
  }

  // ---- eIr zoom family @5232040 (bEr/yEr/vEr/xEr + jCr/ICr log map) ----
  _startZoom() {
    if (!this._zoom) this._zoom = { targetT: zoomLog(this.focalLengthMm), lens: { value: zoomLog(this.focalLengthMm), rate: 0 } };
    if (!this._zoomFrame) { this._zoomLastMs = performance.now(); this._zoomFrame = requestAnimationFrame(this._onZoomFrame); }
  }
  _onZoomFrame = e => {
    const n = Math.min(C.ZOOM_DT_MAX, (e - this._zoomLastMs) / 1e3);
    this._zoomLastMs = e;
    this._tickZoom(Math.max(0, n));
    this._zoomFrame = this._zoom ? requestAnimationFrame(this._onZoomFrame) : 0;
  };
  _tickZoom(dt) {
    if (!this._zoom) return;
    const dir = (this._zoomKeys.has('p') ? 1 : 0) - (this._zoomKeys.has('o') ? 1 : 0);
    // yEr: target steps by dir·pEr·dt (clamped 0..1); lens springs toward it (fEr tau)
    this._zoom.targetT = Math.min(1, Math.max(0, this._zoom.targetT + dir * C.ZOOM_STEP * dt));
    this._zoom.lens = springStep(this._zoom.lens, this._zoom.targetT, C.ZOOM_LENS_TAU, dt);
    this.setFocalLengthMm(zoomMm(this._zoom.lens.value));
    this.updateFrameGuide?.();   // P1-1: the UGr reactive effect re-runs the fov formula on every focal change
    if (dir === 0 && Math.abs(this._zoom.lens.value - this._zoom.targetT) < 1e-4 && Math.abs(this._zoom.lens.rate) < .001) {
      this._zoom = null;   // xEr — settled
    }
  }
  _stopZoom() { this._zoomKeys.clear(); this._zoom = null; if (this._zoomFrame) cancelAnimationFrame(this._zoomFrame); this._zoomFrame = 0; }
  // zoomByWheel @5232085 (vEr): wheel target -= deltaY·mEr (deltaMode 1 → ÷gEr)
  zoomByWheel(e, n) {
    if (this.page.mode !== 'camera') return;
    this._startZoom();
    const r = e * (n === 1 ? C.ZOOM_WHEEL_DIV : 1);
    this._zoom = { ...this._zoom, targetT: Math.min(1, Math.max(0, this._zoom.targetT - r * C.ZOOM_WHEEL_RATE)) };
  }

  // ---- monitor helpers ----
  // the filming camera's own mesh would clip the viewfinder — hide it for the session
  // (divergence: the live renders through it with the capture renderer; we hide + restore)
  _hideCameraMeshForMonitor() {
    const id = this.filmingCameraId ?? this.activeCameraId();
    const mesh = id ? this.meshById.get(id) : null;
    if (!mesh) return;
    this._monitorHidden = mesh;
    mesh.visible = false;
  }
  _restoreCameraMeshForMonitor() {
    if (this._monitorHidden) { this._monitorHidden.visible = true; this._monitorHidden = null; }
  }

  _wasd(dt) {
    // ha @5663200 VERBATIM (r17): edit-mode WASD = the nav-ball bot drive + q/e vertical +
    // pan nav-progress. Gates (ne() live): default control mode + edit + no playback +
    // plan hidden + no gizmo drag. (The live also gates !sceneNodeOpen — no scene nodes offline.)
    const keys = this._keys;
    const ne = () => this.page.controlMode === 'default' && this.page.mode === 'edit' &&
      !this.page.playing && this.page.viewportMode !== 'plan' && !this.manipulator?.transform?.dragging;
    if (!ne() || !keys) return;
    const f = Number(keys.has('w')) - Number(keys.has('s'));
    const r = Number(keys.has('d')) - Number(keys.has('a'));
    const u = Number(keys.has('e')) - Number(keys.has('q'));
    if (f === 0 && r === 0 && u === 0) return;
    const shift = keys.has('shift') ? C.EDIT_DRIVE_SPRINT : 1;
    const dist = C.EDIT_DRIVE_SPEED * shift * dt;
    moveByStick({ forward: f, strafe: r }, dist, this.camera.position, this.camera.quaternion, this.orbit.target);
    this.camera.position.y += u * dist;
    this.orbit.target.y += u * dist;
    const d = this.camera.position.distanceTo(this.orbit.target);
    d > 0 && this.page.addNavProgress('pan', dist / d);   // addNavProgress @5788885
  }

  // custom wheel zoom (Vzr/Dqr): classify zoom vs nav; zoom = pos *= exp(deltaY*k) around orbit target
  attachWheel() {
    const el = this.renderer.domElement;
    el.addEventListener('wheel', e => {
      e.preventDefault();
      // xe @5651667: camera mode → the monitor wheel zoom (before the edit-mode classification)
      if (this.page.mode === 'camera') { this.zoomByWheel(e.deltaY, e.deltaMode); return; }
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
  app.objects.propCatalog = app.propCatalog;      // r16: addComponent prop gate + prop defaultName
  wireComponentCatalog(app.propCatalog);          // r16: Xqt prop ghost builds
  app._componentDrop = installComponentDrop(app); // r16: VUr viewport drop (ghost preview)
  // r17: pointer-lock look (rzr — the look drives the drive's AIM holder) + the monitor bar
  app._look = createLook(app._driveAim, app.renderer.domElement);
  app._monitor = createMonitor(app);
  app.attachWheel();
  app.start();
  return app;
}
