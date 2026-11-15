# DESIGN — flick-3dEditor (local offline reconstruction of flick.art 3D Stage editor)

> **REVISION 2 (post-audit)** — incorporates DESIGN_AUDIT.md F1–F23. Changes marked **[A:Fn]**.
> P2 internal order: (1) D10 camera-mode framing, (2) D7 path paint + D6 path/clip eval, (3) D6 cam-move/cam-path + D4 commit pipeline, (4) D8 timeline, (5) cam-follow/transform/manual + rig editor.

Goal: reproduce the 3D Stage **scene editor UX** locally for offline previz: viewport renderer with time-of-day, scene editing, character + camera path editing, animation/show tracks, applying the local asset library. Fidelity targets come from `analysis/{ENVIRONMENT,TRACK_SYSTEM,HUMANOID,EDITOR_UX}.md` + `analysis/DOM_REFERENCE.md` (extraction from live bundle `index-DBE17t4T.js`).

## D1 — Delivery shape: static no-build web app (DECIDED)
- `editor/` directory, plain ES modules, zero build step, zero network at runtime.
- Serve with any static server (`python3 -m http.server`). No Node dependency for the user.
- **[A:F2] importmap required** (bare specifier `'three'` used by all addons):
  ```html
  <script type="importmap">{ "imports": {
    "three": "./js/vendor/three.module.js",
    "three/addons/": "./js/vendor/" } }</script>
  ```
  Vendor layout `editor/js/vendor/{three.core.js, three.module.js, controls/OrbitControls.js, controls/TransformControls.js, loaders/GLTFLoader.js, utils/BufferGeometryUtils.js}` — r182 `three.module.js` re-exports `three.core.js` (vendored ✓), GLTFLoader needs `../utils/BufferGeometryUtils.js` (vendored ✓).
- **[A:F23] Port hygiene**: semantic names in code, minified id in comment; ALL extracted constants live in one `const.js` with values + source citations. Never port a *name* across builds — port values.
- **[A:F9] Shader rule**: every custom ShaderMaterial gets `fog:false` (scene always carries FogExp2; without it the renderer injects fog uniforms that don't exist → crash). Sky/footprint/hover shaders copy GLSL verbatim incl. `#include <colorspace_fragment>`.
- **[A:F7] Store architecture**: three stores mirroring live — `objectStore` (objects/selection/transformMode/clipboard/spawn), `showStore` (tracks/items, undo via apply-ops), `pageStore` (mode edit|camera, controlMode default|unreal, recordAspect, focalLengthMm, playhead, paint state). Undo: op-based stack with `beginEditGesture()/endEditGesture()` bracketing (drags/slider moves group); clipboard for copy/paste; cameras duplicate with their target; cloned tracks remap ids + subject refs.
- **[A:F15] localStorage**: debounce autosave ≥1s, try/catch QuotaExceeded (keep last-good + toast), separate prefs key.
- three.js r182 vendored (`editor/js/vendor/`): `three.module.js`, `OrbitControls.js`, `GLTFLoader.js`, `TransformControls.js` (the live app's engine is three r182 — DOM snapshot says `data-engine="three.js r182"`).
- Vanilla-DOM UI (live app is React, but UI fidelity is about layout/interaction/DOM structure per DOM_REFERENCE.md, not the framework). CSS mimics the extracted class layout (top bar, scene tabs, header, workspace, right dock, timeline footer).
- Scene data: v10 JSON (same schema as live `stage_scenes.scene`); localStorage autosave + File open/save buttons + sample scenes bundled.

## D2 — Rendering pipeline (P1) — exact port
1. `WebGLRenderer({canvas: .ph-viewport-capture, antialias})`, `shadowMap.enabled=true, type=PCFShadowMap`, `pixelRatio=min(dpr,2)`.
2. Editor camera `PerspectiveCamera(50, w/h, .1, 500)` @ (6,5,8) lookAt origin. OrbitControls: target (0,1,0), damping, rotateSpeed .75, default mode LEFT=PAN/MIDDLE=PAN/RIGHT=ROTATE + Unreal mode mapping, custom wheel zoom `pos *= exp(deltaY*.0036)` clamped [.5, 2×boundsRadius], WASD fly 4 m/s (×3 shift), camera floor clamp y≥.1 + maxPolarAngle recompute.
3. Environment (`wOr` port): sky dome (xyww trick + zenith/horizon pow .55 + flare), `FogExp2(0xffffff,0)`, HemisphereLight, DirectionalLight (shadow `min(3072,maxTex)²`, radius 2), floor `PlaneGeometry(80000²,128²)` 0xd4d4d9 rough .9 polygonOffset receiveShadow + raycast proxy.
4. `applyDaylight(light)` — exact `HY` 7-stop table + `DFr` full-day anchor, `Color.lerp` for color fields, memoized by (az,el), returns glow.
5. Sun placement + shadow fit (`TOr` fingerprint + fit math): `M8r` dir with elevation remap (el>−8?max(el,5):25−el), spread90×1.15, **[A:F12] casterBox branch**: union Box3 of casters (humanoid/figure + resolve casters set against bundle once) expand 4 → sphere; reach≤texelWorld → v=max(v,reach) else {focus=sphere.center; v=sphere.radius}; extent `w=min(.163·mapSize/2, max(30,ceil(v/16)·16))`, texel-grid snap `kOr`, ortho [−w,w]², near .1, far `2w+w+max(0,(focus.y+w)/dir.y)`, bias `−.005/(far−near)`, normalBias `min(.3, 1.5·2w/mapSize·min(6.67,1/dir.y))`. Recompute only on fingerprint change (`shadowMap.autoUpdate=false` + needsUpdate).
6. Dynamic fog/near/far (`pZt`): bounds every 400ms (`vje`/`OFr` median focus + spread95), density `.715/max(120, 1.5·(dist+spread95), 3·dist)`, far `min(2e4, max(SFr(radius,dist), 2.5/density))`, near `max(.1, min(far/5000, minBoxDist·.5))`, hysteresis ×1.1.
7. **[A:F1] Frame loop — SEPARATED update ticks from render passes**:
   - *Update ticks (per frame, in order)*: rig tick (restore clipLocal → mixer.update → apply rig offsets) → rig handles → playback eval (`jGr` port) → manipulation (`pWr`) → nav/controls tick (orbit.update + customZoom + WASD + floor clamp) → env (`applyDaylight` memo) → camera markers → bounds (≤400ms recompute; `pZt` fog/near/far EVERY frame) → spotlights (`oOr` — feeds shadow fingerprint) → shadow fingerprint/redraw (`TOr`: fingerprint → fit → `shadowMap.needsUpdate`) → selection tick LAST (footprint uniforms + `selectionScreenBounds`).
   - *Render passes (in order)*: **main render (layer 0) → stroke RT pass → planning-aids overlay pass** (enable layer 1 on planning aids + all Line objects, `camera.layers.set(1)`, `renderer.autoClear=false`, `clearDepth()` before the overlay so aids are never occluded [A:F17]).
- Mesh ownership rules [A:F6]: store→sync owns meshes at rest; playback owns while performing; manipulation owns while dragging (`isMeshDragged` guards both); on stop, reset from store.

## D3 — Object system (P1)
- All 11 kinds: group/cube/sphere/cylinder (procedural `wWr`), simple_figure (exact `Zqt`: BOX body PP=[.406,1.059,.289]·sA, head sphere Nie=.125·sA at OIr, visor spherical zone 72° arc ±, elevation −6..14°, band plane, colors #f29a5c fill + contrast mark), humanoid (GLB scale = 1.75/measured-bind-height (≈.956964, compute not hardcode), mixer, 46 clips, crossfade .25s, wrapper group, placeholder stick figure while loading [A:F16]), camera (GLB `camera-DV-hMEYk.glb` + frustum sub-object, wireframe quad via `urt`), target (approximate marker — geometry unextracted, accepted divergence [A:F21]), spotlight (real SpotLight `sOr` + cookie `iOr` + lamp + beam cone; **[A:F12] shadow budget `e6r=min((maxTextures−4)/2, maxVaryings−8)`** first-N get 1024² shadows, rest penumbra `.05+.9·diffusion`; intensity ×2.4 (verify `_8r` once against bundle); defaults intensity 70/diffusion 30; night glow → lamp emissive boost approximation [A:F21]), prop (GLB from local `assets/props/<category>/<key>.glb` + catalog scale/yawDeg + dims (needed for subject-aim height); 13 procedural as simple stand-ins [A:F21]), hierarchy via parentId groups, name-label sprites for figures.
- Object sync `AWr.N`-equivalent: create/update/dispose on store changes; TRS applied unless live-play character. **[A:F16] GLB lifecycle**: per-key cache + `clone(true)` (shares geometry/materials — critical for terrace scenes), disposal on delete, `_Wr` hi-poly swap at `max|scale|≥24`, Draco/KTX2 audit of prop GLBs (vendor decoder or re-encode offenders).
- **[A:F5] Footprint foot computation `lGr`**: union of (child geometry-bbox corners rotated by parent yaw) ∪ (SkinnedMesh bone world positions); kinds camera/target/spotlight use full traverse, others skip non-Mesh + basic-material meshes; output `{x,z,halfX,halfZ,y,top,yaw}`; ordered after rig tick in frame loop (bones current).

## D4 — Selection + manipulation (P1)
- Footprint selection shader (exact `pGr` port: rounded-rect SDF, 3px white line, dark shade, ripple wash on select 1s, fade 160ms, pad `max(min(halfX,halfZ)·.1, 10px·pxPerM)`, corner radius, max 32 selections).
- Hover disc + dot cursor (throttled raycast 2ms/33ms budget).
- Silhouette stroke ring (post-render RT pass, 1.5px white + navy halo) — P2 (implemented after core works).
- TransformControls with custom meshes (axis colors e5534b/55b35e/4a86e8, shaft .009/.42, cone .03/.115, plane circles .045, centre sphere .036; translate/rotate/scale modes; forced translate for track-driven objects; refused rotate for aim-locked cameras; camera scale→translate). **[A:F10] r182 wiring**: `const c = new TransformControls(camera, dom); scene.add(c.getHelper())` (control is NOT an Object3D since r169); restyle = traverse helper subtree, replace geometry/material in place on named children; helper registered as planning aid. No translationSnap (live never sets it).
- **[A:F6] Commit pipeline `SZt`**: refused (toast) when object driven at playhead by manual/path-position/path-look/path-anchored items; keyed camera drag → `cam-transform` key capture (`captureFocusedCameraPose`); cameras on cam-move chains rebase (position recompute, rotation keep|turn|framing); targets commit as transform keyframes; position-only/rotation-only rules under cam-path/aim-lock; `reaimCamera` after refused translate; paired target moves with camera.
- Click selection with slop 8px, group promotion, alt-click raw, ⌘/ctrl multi, double-click focus (`.3s` ease, dist `1.5·radius/sin(min(fovY,fovX)/2)`), empty-click deselect, lasso (rect ∩ world positions).
- Alt-drag duplicates; camera+target pairs move/rotate together; rotation continuity unwrap on release.
- Keyboard: ⌘Z/⇧⌘Z undo/redo, ⌘C/⌘V copy/paste, ⌘G group/ungroup, Del delete, X/Z/C tool modes, Esc exits paint, F focus.

## D5 — Time-of-day UI (P1)
- "Light" button → popover: sun puck disc (centre=zenith 90°, rim=−30°, knob radius (90−el)/120, view-yaw relative), drag → az/el, arrow keys ±10°/±5°, presets Midday 128.66/57.38 · Golden hour 9° · Dusk −4° · Night −28°, phase labels, night-lights toggle (when lamp-like objects exist), undoable gesture.

## D6 — Track system + playback (P2)
- Exact item evaluation port from TRACK_SYSTEM.md: `fFr` dispatcher + all 14 kinds (path/play/clip/transform/rig-transform/rotate/revolve/scale/cam-still/cam-move/cam-path/cam-follow/cam-transform/cam-manual).
- Path: `mT` Catmull-Rom tangent builder (in/out), arc-length `MR(nx(anchors))`, duration = arc/speed (speed default 1.4, floor .2), gait clip + ground raycast (probe +1.2m, step .5m, τ.22s smoothing, instant on backward seek), yaw turn rate 8 rad/s, aim travel/subject/locked + aimOffset, pace hold→idle.
- cam-move presets with smoothstep easing + orientation-correction slerp + dolly_zoom fov formula; cam-path heightCurve (64 resample, 100m cap, replaces Ys) + pace; cam-manual 20Hz nearest-sample; cam-follow offset; subject aim height minY+.7·height.
- Playback loop at playhead: evaluate per frame (jGr port), restore stored TRS on stop.
- Show range validation, duration `rx()`, sequential packing `lje`.
- **[A:F4] Character application pipeline** (ported verbatim from TRACK §4/HUMANOID §5): gaze solver `xM(bodyYaw, ownAim, target)` — head ≤±70° yaw/±35° pitch, body takes remainder; character own-aim height `y+1.6·scale.y`; subject aim height `minY+.7·height` (.5 for spotlights); humanoid head-look = additive rig offsets DEF-neck 40%/DEF-head 60% merged with rig-transform offsets, applied per-frame on top of clip pose (restore clipLocal → mixer.update → offsets); simple_figure head-look = head group rotation, subject look wins over keyed headRotation when `sinceS≥item.startS`; yaw chase ≤8 rad/s (instant on poseNow); at-rest t=0 rig-transform keys still applied; `isMeshDragged`/live-play guards; play items use exactY (no ground snap).
- **[A:F14] Speed floors at correct layers**: store edit clamp `max(0.01, v)`; timeline UI field min 0.2 step 0.1; migration invalid→0.2.
- **[A:F11] Loader**: accept raw scene or `{row, scene}` wrapper; run `f6r` (version dispatch) + `prt` normalizers on EVERY load incl. v10 (`l6r` legacy cam-rail → `o6r` speed clamps → `b6r` invalid pace/heightCurve/dangling subjectId → `g6r` light normalize `SDe` → `m6r` spotlight validation); full v1→v10 migration chain for older exports.

## D7 — Path editing UX (P2)
- Paint mode: **[A:F3] clicks/drags raycast `walkableSurfaces()`** (floor + meshes whose kind NOT in {camera,target,spotlight,humanoid,simple_figure,group} — maintained by object-sync on scene change); persons take hit.point verbatim; **flown paths (cameras/non-persons) keep existing anchor Y (or object base Y) via `anchorPosFor`**; first anchor seeded at object's world position (`seedPathStart`); nearest-segment XZ distance <.4m (`j2r`) → insert, else append; anchors SphereGeometry(.09) + number sprites, selected anchor ×1.4 white, tangent handles (in/out, XZ plane drag, alt=break, mirrored), height handle for flown paths (compressed ladder .3+h·.55, amber), curve polyline +.02y violet 0xaa55ff, finish (Esc/Enter/Done), <2 anchors removes item.
- `pathEditPickables` raycast layer; orbit disabled while dragging handles; camera/target meshes + path group in planningAids.

## D8 — Timeline UI (P2)
- Tracks sidebar (per-object lanes, add/remove), blocks with kind labels + colors, drag with magnet snapping (12px) + push obstacles, trim handles (path/cam-path → recompute speed = arc/duration), alt-drag duplicate, ruler seek + zoom (ctrl+wheel anchored, min 60px/s), playhead, take-range drag, segment inspector per kind (exact field sets from EDITOR_UX §8). **[A:F14]** keyframe diamonds on transform/rig-transform/cam-transform blocks; block min width 3px; per-lane Add action; fine zoom 0.02 step when |Δ|<10.

## D8b — Dock UI (P1 for asset application) [A:F8]
- **Selection toolbar** (floating at `selectionScreenBounds` +0.18·h, clamped): Move/Rotate/Scale/Delete buttons.
- **Right dock**: Properties inspector (per-kind fields: name, position/rotation/scale numeric inputs, camera focal/shake/target, spotlight shape/intensity/diffusion, prop key, animation clip picker for humanoids — driven by livePose publish), **Add palette** (Human, Figure, Camera, primitives + props picker: searchable 1439 catalog with category tabs → spawn at viewport center/floor), **Actions window** (clip tiles draggable to timeline lanes; start as plain tiles), hierarchy tree (objects list with group nesting, select/rename/delete).
- **Footer**: camera pills (when cameras exist) + Height/Lens sliders when single camera selected (Height 0.2–max(4,tallest+4) ceil clamp 50, lens log-interp 0..1000 → 14..200mm, steps [14,18,24,35,50,85,135,200]).

## D9 — 2D plan canvas (P3)
- Top-down view: 1m grid (fade 8→24 px/m, 5m major), footprints (rect/ellipse + yaw), spotlight pools, camera wedges (fov from focal + aim), paths, marquee select, drag-move, draw-direction stroke → path anchors. pxPerM 34 default, fit +48px margin.

## D10 — Camera mode + framing (P2)
- Scene/Cameras view switch + 3D/2D. Camera mode: editor camera adopts record framing (`XGt` math: maxHeightFraction (h−192)/h, fovScale, letterbox overlay div with 9999px shadow), pose saved/restored, PIP-like preview of focused camera (simplified: main viewport shows framing guide instead of full PIP window — P3 refinement).

## D11 — What we consciously skip (documented gaps)
- Finish composer (SSAO/edges — off-path stylized render), nav ball minimap, PIP live feed windows, recording/MediaRecorder pipeline, play-mode WASD recorder (view-only playback instead), shake rigs (subtle/medium/heavy/stride constants extracted; apply-on-preview if time), LLM/chat, undo of mesh-level ops beyond store ops, multi-scene tabs (single scene + JSON import), gptengineer telemetry.

## D12 — Testing
- **[A:F13] Harness**: headless Chrome `--use-angle=swiftshader --enable-unsafe-swiftshader` (three r182 needs WebGL2); SwiftShader 10–50× slower — keep fixtures small; stroke pass disabled in CI (`?stroke=0`), one optional visual test with it on. Baseline strategy: **self-baseline regression** (first local run is the baseline; diff subsequent runs) + optional fresh live-app captures while network exists. Round-trip test = normalization IDEMPOTENCE: load → normalize → save → load → save; deep-equal with sorted keys on the two saves.
- **Synthetic fixtures** (available samples only exercise cam-still): hand-authored scenes for path (with pace holds), play (20Hz samples), clip, transform, cam-move, cam-path (+heightCurve), cam-follow; plus the real samples (`scene_27b98b6b.json` etc. from flick-3dstage data/exports).
- Assertions: object count/meshes; daylight values at elevations (−30/−8/5/32/90 → exact colors); fog density/near/far after seek (+ hysteresis — read camera.near/far & fog.density); path eval positions at times; clip playback advancing; shadow-fit extents exposed on `window` for tests (change only when fingerprint changes); `lje` packing; migration idempotence.

## D13 — Repo layout
```
editor/               # the app (D1) — self-contained, copy-folder-and-serve
  index.html  css/  js/{vendor, const, store, schema(+migration), env, figures, props,
                       objects, selection, manipulate, paths, tracks(+playback),
                       timeline, plan, lightui, cameraui, inspector, addui, undo, main}.js
  assets/{humanoid-B4Yewrzp.glb, camera-DV-hMEYk.glb, spotlight-Cs6bAwrT.glb,
          prop_catalog.json, props/<category>/<key>.glb (full library, 101MB one-time)}
  samples/*.json       # real + synthetic fixtures [A:F13]
analysis/             # extraction ground truth (done)
scripts/              # extraction tooling (done) + test helpers
docs/                 # DESIGN.md (this), DESIGN_AUDIT.md, FIDELITY.md (reconstruction audit), prior context
```

## Open questions for audit
1. Stock three r182 `OrbitControls`/`TransformControls` vs backporting the live customizations (custom gizmo meshes, zoom clamp) — plan: stock + restyle/custom meshes (D4), custom wheel zoom logic (D2). Risk: TransformControls API changes in r182 (it's now in examples/jsm/controls, fine).
2. Props library 101MB in-repo vs side-reference — decided: in-repo (self-contained offline; one-time push).
3. Humanoid GLB `M_Joints` visual spheres stay purple (live keeps GLB purple) — keep exact.
4. Stroke-ring post pass cost in headless testing (software GL) — implement but allow disabling via ?stroke=0.
5. Scene JSON save: keep v10 verbatim fields we don't edit (lossless round-trip).
