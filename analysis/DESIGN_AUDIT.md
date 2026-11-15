# DESIGN AUDIT — `docs/DESIGN.md` (flick-3dEditor offline reconstruction)

**Auditor role**: graphics/engine architect, research + critique only. No implementation changed.
**Evidence base**: `docs/DESIGN.md` (audited artifact) · `analysis/ENVIRONMENT.md` · `analysis/TRACK_SYSTEM.md` (§1–8, §10–11, §15) · `analysis/HUMANOID.md` · `analysis/EDITOR_UX.md` · `analysis/DOM_REFERENCE.md` · direct greps of `analysis/index-DBE17t4T.js` (r182 API surface) · sample scenes in `/home/sync/flick-3dstage/data/exports/` · asset inventory in `/home/sync/flick-3dstage/assets/`.

**Citations** like `EDITOR_UX §1.5` refer to sections of the extraction docs; minified ids in backticks refer to bundle symbols as documented there.

---

## VERDICT: **APPROVE-WITH-CHANGES**

The design is unusually well-grounded: I spot-checked ~40 constants and formulas against the extractions and nearly all are exact (see §"Verified correct"). The port-first strategy (copy `HY`, `pGr`, `mT`, `KCe`, `pZt` verbatim) is the right call for a fidelity target. However, **three P0 spec errors** would produce a non-loading app or visibly broken behavior if implemented as written (F1 render-pass order, F2 ES-module resolution, F3 floor-only path paint), and the P2 track/timeline block — the largest chunk of work — is missing its hardest subsystems (lookAt split F4, manipulation commit pipeline F6, undo architecture F7, migration normalizers F11). Fix the P0s and fold the P1s into the design text before implementation starts.

---

## Findings index

| # | Sev | Area | Summary |
|---|-----|------|---------|
| F1 | P0 | D2.7 | Frame-loop / render-pass order is wrong (planning-aids before main render; rig-tick and spotlights missing) |
| F2 | P0 | D1/D13 | No importmap; `three.module.js` alone won't resolve (r167+ splits `three.core.js`) |
| F3 | P0 | D7 | Path paint/drag on "floor" instead of `walkableSurfaces()`; flown-vs-walked anchor-Y semantics missing |
| F4 | P1 | D6 | Humanoid lookAt body/head split + rig-offset pipeline absent |
| F5 | P1 | D4 | Footprint *foot computation* (`lGr`) unspecified — needs SkinnedMesh **bone positions**, not geometry bbox |
| F6 | P1 | D4/D6 | Manipulation commit pipeline (`SZt`) missing — drags on track-driven cameras/targets will fight playback |
| F7 | P1 | D1/D13 | Undo + store architecture unspecified (gesture bracketing, store split, clipboard) |
| F8 | P1 | D1/D4 | Right-dock UI (Properties inspector, Actions window, hierarchy), selection toolbar, add-palette are absent |
| F9 | P1 | D2/D4 | Every custom ShaderMaterial needs `fog:false` (scene always has FogExp2) or the renderer crashes |
| F10 | P1 | D4/open-q1 | TransformControls r169+ API: `getHelper()` required; custom-mesh plan needs a concrete mechanism |
| F11 | P1 | D1/D12 | Migration chain + `prt` normalizers not designed; they run on **every** load, including v10 |
| F12 | P1 | D2.5/D3 | Shadow-fit `casterBox` branch missing; spotlight shadow budget / ×2.4 intensity unspecified |
| F13 | P1 | D12 | Test plan has concrete blockers: SwiftShader flags, missing reference screenshots, byte-diff, fixtures |
| F14 | P2 | D6/D8 | Speed-floor conflation (.01 vs .2 vs migration .2); timeline keyframe diamonds + affordances missing |
| F15 | P2 | D1 | localStorage autosave unguarded (quota, debounce); measured sizes say mostly OK but recordings blow it |
| F16 | P2 | D3/D13 | GLB lifecycle: cache + clone-on-instantiate, disposal, placeholder figure, Draco check for props |
| F17 | P2 | D2.7 | Planning-aids overlay pass under-specified (layers, depth clear, gizmo as planning aid) |
| F18 | P2 | D4/D7 | Selection/path-edit detail set: stroke covers hover too; deselect fade; seed anchor; toolbar anchor |
| F19 | P2 | D10 | Camera-mode fov aspect ambiguity; pull D10 earlier within P2 |
| F20 | P2 | D2.2 | Zoom clamp is `max(500, 2·radius)`; zoom-vs-nav classification (trackpad/ctrl) missing |
| F21 | P2 | D3 | Misc object-system omissions (target marker unknown, placeholder, hi-poly swap, glow consumer) |
| F22 | P2 | D13 | Repo-layout inconsistencies (vendor location, module slots, `{row,scene}` export wrapper) |
| F23 | P2 | all | Port hygiene: don't chase minified names across builds; semantic names + one constants module |

---

## P0 findings

### F1 — Frame-loop and render-pass order is wrong as specified (D2.7)
**Severity: P0.** D2.7 states: *"playback eval → manipulation → env tick → bounds → shadow fit → planning-aids pass (render layer 1 on top) → main render → stroke selection pass."*

**Issue (two distinct errors):**

1. **Render-pass order inverted.** EDITOR_UX §1.2: `drawStroke()` runs **after every main render**; §1.5: the planning-aids pass runs "**after the main render (and after stroke)**": enable layer 1 on every planning aid + all lines, `camera.layers.set(1)`, `autoClear=false`, render again. If the layer-1 pass runs *before* the main render as D2.7 specifies, the main render clears/overwrites it — with default `autoClear=true` the aids simply vanish; with `autoClear=false` they'd be depth-occluded. Either way, selection footprints, gizmo, path lines, labels and beams would be invisible or wrongly occluded.
2. **Tick order incomplete.** The live loop (EDITOR_UX §11 "Frame loop") is: **rig tick** (HUMANOID §5.1: `m()` restore bones from `clipLocal` → `mixer.update(dt)` → `g()` apply rig offsets — must precede playback eval or offsets lag/double-apply) → rig handles → **playback** → drawPreview → manipulation → nav → env → liveplay → markers → **bounds → spotlights → shadow redraw** → … → takes → **selection tick last** (footprint uniforms + `selectionScreenBounds`). D2.7 omits the leading rig tick, the spotlights tick between bounds and shadow redraw, and the trailing selection tick. The design's relative order "bounds → shadow fit" is correct (the `TOr` fingerprint closure reads bounds), but spotlights feed the fingerprint (`castShadow/angle for spotlights`, EDITOR_UX §2.8) so they must tick before the shadow step.

**Recommendation:** Rewrite D2.7 as two separate lists:
- *Update ticks (per frame, in order)*: rig tick (restore→mixer→rig offsets) → rig handles → playback eval (`jGr`) → manipulation (`pWr`) → nav/controls tick → env (`applyDaylight` memo + orbit) → liveplay → camera markers → bounds (≤400ms recompute, `pZt` fog/near/far every frame) → spotlights (`oOr`) → shadow fingerprint/redraw (`TOr`/`AOr`) → selection tick (footprint uniforms, `selectionScreenBounds`).
- *Render passes (in order)*: main render (layer 0) → stroke RT pass (`hGr`) → planning-aids overlay pass (layer 1, `autoClear=false`, see F17).

### F2 — ES-module no-build plan cannot resolve: no importmap, and `three.module.js` is not self-contained (D1, D13)
**Severity: P0.** D1 vendors `three.module.js`, `OrbitControls.js`, `GLTFLoader.js`, `TransformControls.js` as plain ES modules with zero build step, but specifies no import map.

**Issue:**
1. All `examples/jsm` addons import from the bare specifier `'three'` (verified pattern for OrbitControls/TransformControls/GLTFLoader). In a no-build browser app, bare specifiers fail without an `<script type="importmap">`.
2. Since three r167, `build/three.module.js` is a thin re-export over `build/three.core.js`. Vendoring only `three.module.js` produces an unresolvable `./three.core.js` import. Vendor **both** files (this is the single most common r16x+ vendoring mistake).
3. **GLTFLoader is not self-contained**: `examples/jsm/loaders/GLTFLoader.js` has a *relative* import of `../utils/BufferGeometryUtils.js` (the `toTrianglesDrawMode` helper, stable across r12x–r18x — verify on vendoring). D1's four-file vendor list is missing it. Either preserve the jsm directory layout (`vendor/loaders/GLTFLoader.js` + `vendor/utils/BufferGeometryUtils.js`) or patch that one import. OrbitControls/TransformControls import only `'three'`.
4. Repo inconsistency: README describes a top-level `vendor/` ("three.js r182 module build + GLTFLoader") while D13 puts vendor under `editor/js/vendor/`. The top-level `vendor/`, `editor/`, `assets/`, `data/` dirs currently exist but are empty — pick one location now (self-contained `editor/` is better for the "copy the folder, run a static server" promise).

**Recommendation:** In D1, specify verbatim:
```html
<script type="importmap">
{ "imports": { "three": "./js/vendor/three.module.js" } }
</script>
```
with `editor/js/vendor/{three.core.js, three.module.js, OrbitControls.js, TransformControls.js, GLTFLoader.js}` (addons keep importing only `'three'`, so no `three/addons/` mapping is needed — but adding `"three/addons/": "./js/vendor/"` costs nothing and future-proofs). Verify on vendoring that `three.module.js`'s first line imports `./three.core.js`; if a future r182 patch changed this, adjust. Fix D13/README to agree on one vendor path.

### F3 — Path paint and anchor drag restricted to the floor; flown-path Y semantics missing (D7)
**Severity: P0** for the stated workflow. D7 says *"Paint mode: click **floor** to append/insert anchors"*.

**Issue:** The live system raycasts **`walkableSurfaces()`**, not the floor: `[floor, ...meshes whose kind NOT in {camera, target, spotlight, humanoid, simple_figure, group}]` (ENVIRONMENT `Dqr`; EDITOR_UX §2.3, §3.3). Anchor *drags* also raycast `walkableSurfaces()`. This is not a nicety — the actual previz scenes are prop terraces: `e2e_scene_full.json` (v10) is **689 objects: 545 cubes + 114 cylinders + 21 spheres** (Palace Stone Terrace style), and `scene_6e38…json` is 375 objects of terrace geometry. Floor-only paint places every anchor at y=0 *underneath* the terrace, defeating character blocking — one of the four stated uses.

Additionally missing from D7:
- **`anchorPosFor(pos, idx)` semantics** (EDITOR_UX §3.1): *flown* paths (owners that are not persons — i.e. cameras and other non-character objects) **keep the existing anchor's Y** (or the object's base Y) when appending/inserting/moving; *walking* paths (persons) take the raycast Y directly. Without this, painted cam-paths collapse to the ground and character paths snap to prop tops incorrectly.
- `addPathItem` **seeds the first anchor at the object's world position** (`seedPathStart`, TRACK §10.3).
- Insert-vs-append decision uses nearest-segment XZ distance `j2r(anchors, p)` with the 0.4 m threshold (D7 has the threshold ✓ but frames it as "click floor").

**Recommendation:** Change D7 to: "Paint mode: clicks/drag raycasts against `walkableSurfaces()` (floor + non-camera/target/spotlight/humanoid/figure/group meshes); persons take hit.point verbatim; flown paths keep existing/base Y via `anchorPosFor`; first anchor seeded at the object's world position; nearest-segment < 0.4 m inserts, else appends." Add walkable-surface maintenance to the object-sync module (recompute the list on scene change, cheap: filter by `userData.kind`).

---

## P1 findings

### F4 — Humanoid lookAt split and rig-offset application pipeline absent from D6 (character blocking fidelity)
**Severity: P1.** D6 covers path aim modes (`travel/subject/locked` + aimOffset) but never describes what "aim subject" *does to the character*, and D3's humanoid entry stops at "mixer, 46 clips, crossfade .25s".

**Evidence (TRACK §4.2–4.6, HUMANOID §5.3–5.4, §6.3):**
- Gaze solver `xM(bodyYaw, ownAim, target)`: head takes ≤ **±70° yaw / ±35° pitch** (`XOr`/`YOr`), body turns by the remainder; character's own aim point is `y + 1.6·scale.y` (`CZt`); subject aim height is `minY + 0.7·height` (`NP`, `MIr=.7`; spotlights use `0.5`).
- Humanoid head-look becomes **additive rig offsets on `DEF-neck` (40%) / `DEF-head` (60%)** (`jZt`, `Wat=.4`), merged with rig-transform item offsets (`IZt`), applied per-frame *on top of* the clip pose after `mixer.update` (restore `clipLocal` → mixer → offsets — HUMANOID §5.1). simple_figure instead sets the head group rotation via `o$` with `Kae` precedence: **subject look wins over keyed `headRotation` when `sinceS >= item.startS`**.
- Yaw is chased at ≤8 rad/s (`A2r`, instant on `poseNow`), with parent-yaw compensation for parented objects.
- At rest (not playing), the director still applies **rig-transform keys at t=0** (TRACK §11 `tick` else-branch, HUMANOID §5.3) — otherwise posed characters snap back.
- `ue()` skips objects currently dragged (`isMeshDragged`) and live-play characters; play items use `exactY` (no ground snap).

**Why it matters:** a character walking a path while looking at a subject is the bread-and-butter of character blocking; without the split you get either spinning bodies or dead necks, and rig-transform items (`rotate/revolve/scale` fold-mode application via `Q`, Euler unwrap `GA`) are listed in D6's 14 kinds but their application path is undescribed.

**Recommendation:** Add a D6 subsection "character application pipeline" porting `ue`/`L`/`xM`/`jZt`/`Kae` verbatim (they're fully extracted), and add the per-frame rig tick order (see F1) to D2.7. Include the at-rest t=0 rig offsets and the `isMeshDragged`/live-play guards.

### F5 — Footprint foot computation (`lGr`) is unspecified; humanoid/prop footprints must use bone positions (D4)
**Severity: P1.** D4 ports the footprint *shader* (`pGr` — constants check out) but says nothing about how `halfX/halfZ/yaw` are computed per selection.

**Evidence:** EDITOR_UX §1.1: foot computation rotates each child's `geometry.boundingBox` 8 corners **and every `SkinnedMesh` bone position** by parent yaw into world XZ; kinds `camera|target|spotlight` use full `traverse`; other kinds skip non-Mesh children and basic-material meshes (`gBe`). HUMANOID §5.4 gives the plan-canvas mirror: humanoid = ellipse `.26·sx/.26·sz` (`Fst`), simple_figure = rect `PP[0]·sx/2 × PP[2]·sz/2`.

**Issue:** a SkinnedMesh's `geometry.boundingBox` is the **bind-pose** box — useless once the character is animated (walk cycle spreads limbs). Using it produces footprints that don't cover the posed character, and the audit criteria's note "agent extraction says bones used" is exactly this. Props and groups need the child-bbox union path with the kind-specific traversal rules.

**Recommendation:** Specify `lGr` in D4 as its own function (it's small): per selected object, union of (rotated child geometry-bbox corners) ∪ (skinned bone world positions), per-kind traversal filters, output `{x, z, halfX, halfZ, y, top, yaw}` feeding the shader uniforms (pad `max(min(halfX,halfZ)·0.1, 10px·pxPerM)`, corner radius, ripple reach `max(min·0.5, 120px·px)`). Note bone positions require `updateWorldMatrix`/`getWorldPosition` on bones after the rig tick — order it after the rig tick in the frame loop (F1).

### F6 — Manipulation commit pipeline (`SZt`) is missing: drags on track-driven cameras/targets will fight the evaluator (D4 ↔ D6 boundary)
**Severity: P1.** D4 treats manipulation as plain TRS writes ("Alt-drag duplicates; camera+target pairs move/rotate together; rotation continuity unwrap"). The live commit path is substantially more complex and is *the* mechanism that makes camera blocking against tracks usable.

**Evidence (EDITOR_UX §2.1 `SZt`, raw `tmp_b/drag_commit_SZt.js`):**
- Commit is **refused** (i18n toast `TZt`) if the object is driven at the playhead by `manual/path-position/path-look/path-anchored` items.
- Dragging a **keyed camera** writes a camera item key (`captureFocusedCameraPose` → "keyed" outcome); cameras on **cam-move chains are rebased** (`_Zt`/`GOr`: recompute item position, rotation mode `keep|turn|framing`); "unbased" outcomes warn (`AZt`) and delete the duplicate.
- Target objects commit via `captureFocusedTransformPose` (→ transform keyframe).
- Position-only vs rotation-only commits when under cam-path / aim-locked (`VOr`); `reaimCamera` after a refused translate; paired target moved with the camera.
- Gizmo attach rules: ≥2 selected → temporary centroid group; rig joints → bone or multi-joint group; **forced translate for track-driven objects and refused rotate for aim-locked cameras** (D4 has the first, not the second); camera `scale` mode → translate; negative-axis pickers removed.

**Recommendation:** Split D4 into "drag mechanics" (P1, as designed) and "commit semantics" (new subsection). For the previz goal, the minimum viable commit set is: drive-refusal toast for path-driven characters, keyed-camera capture (`cam-transform` key), camera rebase `keep|turn|framing` for cam-move, target-follows-camera, position/rotation-only rules. Without at least the refusal + key capture, dragging a camera that has any track item silently no-ops or snaps back on the next eval frame (`ce` re-derives base pose per EDITOR_UX/TRACK §7.5), which reads as "the editor is broken" during camera blocking.

### F7 — Undo and state-management architecture is unspecified (D1, D13)
**Severity: P1.** D4 lists ⌘Z/⇧⌘Z and D5 says the light gesture is "undoable", but no D-section defines the undo model, and `store.js` is a single module in D13.

**Evidence (EDITOR_UX §11 "Store layers", "Undo/redo"):** the live app has **three stores** — base object store (`iMr`: objects/selection/transformMode/clipboard/spawn), show store (tracks/items, undo via apply-ops + `beginEditGesture`/`endEditGesture`), page store (`oKr`: mode/controlMode/recordAspect/focal/playSession/lasso/etc. — *not* undoable) — plus gesture bracketing that groups drag sequences and slider moves into one undo step, and manipulation outcomes that write **track items** (see F6), so undo must span object and show stores coherently.

**Recommendation:** Add a D subsection: (a) split `store.js` into `objectStore` + `showStore` (undoable, gesture-bracketed op log) + `uiStore` (transient); (b) define the gesture API (`beginEditGesture/endEditGesture`) and make every pointer-drag/slider path use it (light drag, path anchor drags, timeline drags, property scrubs); (c) clipboard is store state, not OS clipboard (⌘C/⌘V in-app, `insertClonedTracks` id-remap semantics incl. subject remap, TRACK §10.5); (d) autosave serializes object+show stores only.

### F8 — Three of the four dock UIs are absent from the design (Properties inspector, Actions window, Components column) plus the add-palette and selection toolbar
**Severity: P1** (goal-relevant). D1 promises "CSS mimics the extracted class layout (… right dock …)" but no D-section specifies the right dock's contents, and the add-menu/hierarchy/inspector interactions appear nowhere.

**Evidence (DOM_REFERENCE A):**
- **Properties window**: Name, Position/Rotation axis fields with **drag-to-scrub** (`cursor:ew-resize`), Focal length (mm, scrub-able), Aspect ratio select (6 entries), Handheld shake select. Driven by the runtime's **`livePose` publish** (EDITOR_UX §11: selected object's world TRS → store, +fovDeg for cameras, +headRotation for figures) — without that publish loop the inspector can't stay live during playback/drag.
- **Actions window**: tabs Move/Animate/Camera, **46 clip tiles with 128×128 canvas thumbnails** (`D5r.setClip` poses at 35% of clip duration — HUMANOID §3.2), draggable onto objects/lanes; "Humans only" gating.
- **Components column**: hierarchy list (drag rows, expand chevrons, delete) — the only way to navigate a 689-object scene.
- **Add palette** (EDITOR_UX §2.5): Add component → Human/Figure/Camera/Target/Spotlight/Cube/Sphere/Cylinder + **props picker with search/categories over the 1439-item catalog**; drag-onto-viewport with 45%-opacity ghost (`VUr`), spawn-slot grid 5×6 spacing 1.5 m, spotlight spawn `[x,3.5,z+3]` aimed at `[x,0,z]`, camera marker spawn + auto-lookAt.
- **Floating selection toolbar** (Move/Rotate/Scale/Delete) anchored via `selectionScreenBounds` + `0.18·clientHeight` extension, clamped into the viewport (`QXr`) — the mouse-user's tool switcher; D4 only specifies keyboard X/Z/C.

**Why it matters:** two stated goals — "scene editing" and "applying the local asset library" — are exercised *through these panels*. The props picker especially: without it the 101 MB library is unreachable.

**Recommendation:** Add one D-section "D14 — Dock UIs (P1/P2)": Properties inspector + livePose publish (P1), add palette + props picker + ghost drop + spawn slots (P1 for library access), hierarchy column (P2, simple list), Actions window (P2 — needed once D6 lands; clip thumbnails can be plain colored tiles initially, canvas thumbnails later), selection toolbar (P1, cheap: anchor to `selectionScreenBounds` math from EDITOR_UX §1.1).

### F9 — Custom ShaderMaterials must set `fog:false` — runtime crash otherwise (D2, D4)
**Severity: P1** (crash-level if missed, mechanical to fix). The scene always carries `FogExp2` (density 0, ENVIRONMENT `wOr`). In three r1xx, if `material.fog === true` (default) and `scene.fog` is set, the renderer refreshes fog uniforms against the material's uniform map; a ShaderMaterial without fog uniforms/chunks throws. The live code sets `fog:false` on every custom material: sky (`xOr`: `fog:false` — ENVIRONMENT), footprint (`pGr` — EDITOR_UX §1.1), stroke quad, hover disc, beams, labels.

**Recommendation:** Add a port rule to D2/D4: *every* custom ShaderMaterial gets `fog:false` (plus the sky's full flag set: `depthTest:false, depthWrite:false, fog:false`, `frustumCulled=false`, `renderOrder=-1`, `raycast=()=>{}` — the xyww trick is only correct with depth writes off and the dome rendered first). Do **not** "improve" shaders by adding/removing `#include <colorspace_fragment>` — copy each shader verbatim (the sky uses it; a shader authored without it outputs in a different space; both appear in the live code and both are correct *as authored*). Keep `renderer.outputColorSpace` at the r182 default (live never overrides it) and default tone mapping (none).

### F10 — TransformControls in r182 is the r169+ refactored API — `getHelper()` is mandatory; custom gizmo meshes need a stated mechanism (D4, open question 1)
**Severity: P1.** Open question 1 says the risk is "TransformControls API changes in r182 (it's now in examples/jsm/controls, fine)" — that understates it.

**Evidence (bundle greps, this audit):** the vendored TransformControls defines `getHelper(){return this._root}` and `getRaycaster(){…}`, and the live editor wiring is literally:
```js
const c = new ozr(camera, domElement); Pzr(c);          // style/customize
const d = c.getHelper(); scene.add(d); planningAids.push(()=>[d]);
```
i.e. the control is **not** an Object3D; `scene.add(controls)` (the pre-r169 pattern) throws. The helper is also registered as a **planning aid** (so the gizmo draws in the layer-1 overlay pass — see F17).

**Recommendation:** Endorse stock r182 + the live wiring exactly. For the custom meshes (D4's axis colors/sizes — verified correct vs `Mzr`), specify the mechanism: after `getHelper()`, traverse the helper's gizmo subtree and **replace `geometry`/`material` in place on the named children** (translate/rotate/scale axis groups), pinning r182 so the internal child names are stable; do not attempt to substitute a custom gizmo object (internals are private). Also port: `dragging-changed` → orbit disable (D4 ✓), no `translationSnap` (live never sets it — there is no object grid-snap in this build, EDITOR_UX §2.8), `setRotateAvailable` gating for aim-locked cameras (F6). Note `OrbitControls` in this same bundle is the `Controls`-base-class version with `zoomToCursor`/`minTargetRadius`/`maxTargetRadius` present but **unused** by the editor (verified by grep: `targetRadius` 0 hits, `minTargetRadius` only in class defaults) — the design's "stock controls + `enableZoom=false` + external wheel zoom" matches live exactly; just don't cargo-cult pre-r16x OrbitControls snippets.

### F11 — Migration chain and `prt` normalizers are required, not optional (D1, D12)
**Severity: P1.** D1 says "Scene data: v10 JSON" and D12 plans a golden-file round-trip, but the design never mentions `f6r`/`prt`.

**Evidence (TRACK §9):** the reader is `iGt(row) → f6r(row)`, and `f6r(t) { if (t.v === 10) return prt(t); … }` — **`prt` runs on every v10 load too**: `l6r` (legacy cam-rail), `o6r` (speed clamp via `bie`: valid>0 → `max(v,0.01)`, invalid → **0.2** `i6r`), `b6r` (drop invalid `pace`/`heightCurve`, drop dangling `cam-still.subjectId`), `g6r` (light normalization `SDe`: azimuth wrap, elevation clamp −30…90, `nightLights` only when `false`), `m6r` (spotlight field validation). Older exports in the wild are v1–v9 and need the full chain (v4→v5 camera-shot conversion, v5→v6 prop yaw subtraction, v7→v8 key rotation unwrap…).

**Consequences if skipped:** (a) scenes exported from the live app load with subtly wrong behavior (unclamped speeds, invalid pace crashing `khe`'s monotonic assumption, dangling subjectIds); (b) the D12 round-trip test fails confusingly, because the live *save* path writes post-normalization data — a scene containing an invalid field is **not** byte-identical after load→save even in the live app.

**Recommendation:** Port `f6r` + `prt` verbatim (fully extracted, ~150 lines). Make the golden test: `load(v10) → normalize → save → load → save` and diff the *second* save against the first (idempotence after one normalization pass), comparing structurally (see F13). Also: the prior repo's scene exports are wrapped `{row, scene}` — the loader should accept both raw scene objects and the wrapper.

### F12 — Shadow fit is missing the caster-box branch; spotlight shadow budgeting unspecified (D2.5, D3)
**Severity: P1.** D2.5 ports the bounds path of the fit but omits the `casterBox` logic entirely.

**Evidence (ENVIRONMENT "Sun/shadow frustum fitting"):** `casterBox = union(Box3 of shadow-casting meshes)`; if non-empty: `expandByScalar(4)` (`pOr`) → bounding sphere; `reach = focus.distanceTo(center)+radius`; if `reach <= texelWorld` then `v = max(v, reach)`, **else `focus = sphere.center; v = sphere.radius`** (the shadow frame re-centers on the casters when they're bigger/offset vs scene spread). Note the extraction itself flags the caster set as lower-confidence (`fOr={humanoid,simple_figure} ∪ props?` — "check `has(j.userData.kind)`"); resolve this once against the bundle before porting, because for the 689-object terrace scenes the answer decides whether props are in the box.

Also unspecified in D3 (spotlight): shadow budget `e6r(gpu) = min((maxTextures−4)/2, maxVaryings−8)` — only the first N spotlights get 1024² shadows, the rest fall back to penumbra `.05+.9·diffusion` (EDITOR_UX §2.8); intensity multiplier **×2.4** (`_8r`, flagged "verify" in ENVIRONMENT); lamp scaled `1/scale`; beam cone constants (7 m, opacity formula) are in D3 as "beam cone" ✓.

**Recommendation:** Add the casterBox branch + snap `kOr` (D2.5 has the snap ✓) to the fit spec; add the spotlight budget + ×2.4 + penumbra fallback to D3. For time-of-day work, shadows are a primary visual — get the fit right or terraces will have clipped/misaligned shadows at dusk elevations (where `M8r`'s remap `el>−8 ? max(el,5) : 25−el` pushes the light geometry around, exercising the fit hard).

### F13 — D12 test plan: concrete blockers to fix before the assertions are checkable
**Severity: P1.** The *assertions* are mostly sound; the *harness* has four gaps:

1. **Headless WebGL flags.** Plain `--use-gl=swiftshader` is dead in current Chrome (removed ~M13x for default software GL). Launch headless Chrome with `--use-angle=swiftshader --enable-unsafe-swiftshader` (software WebGL2 is otherwise blocked). three r182 requires WebGL2 — SwiftShader provides it, but expect 10–50× slower frames: keep fixtures small (see 4).
2. **Reference screenshots don't exist.** D12 says "visual comparison vs live app reference screenshots (from prior repo browser_test.png etc.)" — I searched the prior repo: **zero PNGs** anywhere. Either capture fresh baselines from the live app while network access exists (one-time, scripted, several elevations × the sample scenes) or make the first local run the self-baseline and diff subsequent runs (regression testing, not fidelity testing). Be explicit about which it is.
3. **"Byte-diff structural equality" is contradictory.** Byte equality requires replicating the live serializer's key order and number formatting, which the extractions don't document. Use: `JSON.parse` → deep-equal with **sorted keys** (structural), plus the F11 idempotence rule. Numeric fidelity is safe: JS round-trips float64 via shortest-representation.
4. **Fixtures lack track coverage.** The available sample scenes contain **only `cam-still` items** (`scene_6e38…`: 1 item; `e2e_scene_full.json`: 689 objects, 0 items). D12's "path eval positions at times" and "clip playback advancing" need synthetic fixtures: author 3–5 small hand-built scenes exercising path (with pace holds), play (20 Hz samples), clip, transform, cam-move, cam-path (+heightCurve), cam-follow. Additional checkables worth adding: fog/near/far hysteresis (read `camera.near/far`, `scene.fog.density` after seeking), shadow-fit fingerprint (expose `sun.shadow.camera` extents on `window` for the test; assert they change only when the fingerprint changes), footprint SDF uniforms, `lje` packing, migration idempotence.

Also endorse open-question 4's `?stroke=0` (see F17/F18): the stroke RT is MSAA×4 + mipmap-dependent — SwiftShader supports it but slowly; keep stroke disabled in CI and enabled in one optional visual test.

---

## P2 findings

### F14 — Speed-floor conflation + timeline affordances (D6, D8)
- D6 says "speed default 1.4, **floor .2**". There are **three** different constants: store edit clamp `max(0.01, v)` (`Qae`, TRACK §2.1/§13), timeline UI field min **0.2** step 0.1 (`Mit`, EDITOR_UX §8), migration fallback for *invalid* values **0.2** (`i6r` via `bie`). Port all three at their correct layers; as written D6 would clamp store edits at 0.2 (diverging on data authored elsewhere).
- D8 misses: **keyframe diamonds** (`_kfLayer_`/`_kfDiamond_`, DOM_REFERENCE) on transform/rig-transform/cam-transform blocks — the visible affordance for keyframed camera work; block reorder-within-track ghost; per-lane "Add action" button (`laneAdd`); dropping action tiles onto lanes; block min width 3 px; nav minimap thumb; fine zoom threshold (|Δ|<10 → 0.005 step); take-range lock during recording (recording is skipped anyway — D11).
- Trim-handle semantics are right (path/cam-path trim recomputes `speed = arc/duration`) ✓.

### F15 — localStorage autosave needs guards (D1)
Measured: the 689-object v10 scene is **~146 KB** — fine. But `play`/`cam-manual` items at 20 Hz (up to 120 s ⇒ 2400 samples) add ~100–200 KB *per recorded item*, and a track-heavy scene can exceed the ~5 MB origin quota (and stringify of MBs on every keystroke janks). The design skips recorders (D11) so most scenes stay small, but imported live scenes may contain recordings. Recommendation: wrap writes in try/catch (QuotaExceeded → keep last-good + warn), debounce autosave ≥1 s, and store `stage-finish`-style prefs separately. Optional: IndexedDB fallback for >2 MB scenes. Also persist `uiStore` prefs (control mode, view) like live's localStorage keys.

### F16 — GLB lifecycle and memory (D3, D13)
The design lists the asset set but not the loading discipline. Recommendation: (a) **per-key GLB cache** — load each prop GLB once, instantiate via `scene.clone(true)` (shares geometry/materials by default — critical for terrace scenes reusing the same prop dozens of times); (b) disposal on object delete (`Kd`-equivalent: geometry+material dispose, `disposeSkeleton` for skinned) — HUMANOID §3.1 has the exact functions; (c) humanoid **placeholder stick figure** (`u5r`) while the 2.5 MB GLB loads, else characters pop in; (d) `_Wr` hi-poly geometry swap for primitives at `max|scale| ≥ 24` (proxy-terrain cubes are exactly this case); (e) verify prop GLBs' `extensionsUsed` — the humanoid needs no Draco (verified `extensionsUsed: []`), but if any of the 1426 prop GLBs use Draco/KTX2, GLTFLoader will fail offline without a vendored decoder — audit once via script and either vendor the decoder or re-encode offenders.

### F17 — Planning-aids overlay pass under-specified (D2.7)
EDITOR_UX §1.5: enable layer 1 on every planning aid **plus all `Line` objects**, `camera.layers.set(1)`, `autoClear=false`, render again — "always draw on top". Two unstated details: (a) the pass needs a **depth clear** (or every aid material `depthTest:false`) or aids depth-test against the main pass and are *not* on top — verify `clearDepth()` in the bundle region when porting; (b) the TransformControls helper is itself a planning aid (F10 evidence) so the gizmo rides this pass; gizmo materials are `depthTest:false` anyway. Also port `showSelectionRings(camera, clientHeight)` (footprints normally hidden during playback/PIP renders) if camera-mode preview renders ever hide aids.

### F18 — Selection + path-edit detail deltas (D4, D7)
Verified-correct core noted; missing details worth listing in the design so the implementer doesn't improvise:
- **Stroke covers hover too** (mask includes hovered id — EDITOR_UX §1.2). Since D4 defers stroke to P2, the interim hover affordance is the disc + hidden cursor — acceptable divergence, but the cursor *is* hidden over pickables in live (`gGr="none"`), so the disc must ship P1 (it does ✓). Keep stroke's hovered-id inclusion in the P2 scope.
- Deselect fade-out **500 ms** (`ZWr`), ripple params (reach `max(min·0.5, 120px·px)`), footprint fill `#5f7196`/line white, plane `rotation.set(-π/2, yaw, 0)` YXZ + `polygonOffset -2/-2` + `depthWrite:false`, y offset `foot.y + px·0.6`, `prefers-reduced-motion` forcing final animation states.
- `selectionScreenBounds` → floating toolbar anchor (+0.18·h, clamped) — needed by F8's toolbar.
- Lasso excludes track-driven objects; double-click on empty restores previous selection + `centerViewOn` (≤3× distance, y≥0.1, ripple); focus distance min 1.2; async-mesh wait 2–5 s.
- Path-edit: anchor number sprites at +0.35, selected ×1.4 white, tangent handles `0x66ddff` sky-blue, height handle `0xffcc55` amber + inverse ladder `MOr(y)=max(0,(y−.3)/.55)`, height handle shown when selected or `pos.y > 0.25`, curve `+0.02 y` violet, camera/target meshes + path group into planningAids.
- Copy/duplicate: cameras duplicate **with their target**; cloned tracks remap ids + subject refs.

### F19 — Camera-mode fov adoption: aspect ambiguity + priority (D10)
D10's framing math checks out (`maxHeightFraction=(h−192)/h`, `fovScale`, letterbox div with 9999px shadow ✓ vs EDITOR_UX §5/§6). One ambiguity: `applyCameraModeFov` computes `fov = 2·atan(fovScale·(35/max(aspect,1))/2/focalLengthMm)` — the doc doesn't say whether `aspect` is the viewport or record aspect; resolve against `ux_raw.js` §23 before implementing (my reading: record aspect via `BU(store)`, scaled by fovScale, but verify). Also: mode change saves/restores the orbit pose and engages the pilot object; `updateFrameGuide` recomputes on focal/aspect/resize. **Priority note:** D10 is small (fov adopt + overlay div + pose save/restore) and is *the* "what does the camera see" tool for camera blocking — schedule it first inside P2, before the timeline UI.

### F20 — Wheel zoom clamp + input classification (D2.2)
Upper zoom clamp is `AFr(radius) = max(500, 2·radius)` (ENVIRONMENT `AFr`, with isFinite guard) — D2.2's "2×boundsRadius" drops the 500 floor. Also missing: `Vzr` input classification (ctrl / deltaMode / `wheelDeltaY%120===0` ⇒ zoom; trackpad 2-finger ⇒ nav: default-mode orbit `we`, else pan), two-finger pinch → zoom, and the anti-jitter damping-suppression snap in `Dqr`'s customZoom (`pixelsPerUnitAtTarget` check, ENVIRONMENT `Dqr`). These heuristics are what make the live editor feel right on laptops; port them.

### F21 — Object-system misc (D3)
- **Target marker geometry is not in the extraction** (EDITOR_UX §13.5 lists `YWt` as unextracted) — reconstruct approximately; it's a planning aid, low risk, but note it as an accepted divergence.
- Humanoid loading placeholder (`u5r` stick figure) — see F16.
- Night glow consumer: `applyDaylight` returns glow (0 when `nightLights===false`) "consumed by spotlight/night lamps" (ENVIRONMENT) — the exact consumption path isn't extracted; approximate (lamp emissive boost) and document.
- `_8r=2.4` spotlight intensity multiplier is flagged "verify" in ENVIRONMENT — resolve before porting.
- Spotlight defaults (from prior audit `XWt`): intensity 70, diffusion 30, shape round/square; `nGt` validator (D3 says "real SpotLight" ✓).
- `Jw=6` unsolved constant (HUMANOID §9) — irrelevant to porting, ignore.
- Group delete re-parents children to scene (`TWr`); "13 procedural" props confirmed (1426 GLB + 13 procedural, prior audit §1.3) — but the procedural builders themselves are unextracted; ship the 13 as simple stand-ins or skip with a note.
- Catalog `dims` are available (`prop_catalog_slim.json`: all 1439 entries have dims/scale/yawDeg) — **required** for `NP` subject-aim height on props (TRACK §4.6); D3 should state the catalog must carry dims.

### F22 — Repo/layout inconsistencies (D13)
- `vendor/` location conflict with README (see F2).
- Module list lacks slots for the systems the P1s add: `playback.js` (jGr port), `undo.js` (or store split), `inspector.js`/`addui.js` (F8), `migration.js` (F11). Suggest adding rather than overloading `tracks.js`/`store.js`.
- `samples/*.json`: source scenes live in the prior repo wrapped as `{row, scene}` (F11); document the unwrapping.
- README mentions `docs/FIDELITY.md (reconstruction audit)` — fine as a future artifact; also `PLAN.md`/`HANDOFF.md` are referenced by README but absent here (carry-over from prior repo; harmless).

### F23 — Port hygiene: minified names are build-local (all sections)
TRACK §14 and EDITOR_UX's name-map show heavy reshuffling between builds (`Qae` meant 0.1 in the old build, 0.01 now; `eEe`, `Kae`, `Bzt`, `nx` all changed meaning). The design cites minified ids as anchors — fine for tracing, but the implementation should use semantic names with the minified id in a comment, and all constants should live in one `const.js` with values + source citations. This prevents the classic failure of porting a *name* instead of a *value* when cross-referencing the older SCENE_FIDELITY_AUDIT.

---

## Verified correct (spot-checks passed — no action)

For audit completeness, these D-claims were checked against the extractions and are **exact**; implementers can trust them:

- **D2.1** renderer flags: PCFShadowMap (grep-confirmed live never uses PCFSoft), dpr≤2, canvas class.
- **D2.2** editor camera 50/.1/500 @ (6,5,8); orbit target (0,1,0), damping, rotateSpeed .75; default-mode LEFT=PAN/MIDDLE=PAN/RIGHT=ROTATE + Unreal remap; WASD 4 m/s ×3; floor clamp y≥.1 + `maxPolarAngle` recompute; focus `1.5·radius/sin(min(fovY,fovX)/2)`, .3 s ease (min 1.2 omitted — trivial).
- **D2.3** sky shader (xyww, pow .55, flare pow 7, smoothstep .06), FogExp2, hemi+sun (mapSize min(3072,maxTex)², radius 2), floor 80000²/128² 0xd4d4d9 rough .9 polygonOffset + raycast proxy.
- **D2.4** `HY` 7 stops + `DFr`, Color.lerp, (az,el) memo, glow return; presets/labels in D5 all match (128.66/57.38, 9°, −4°, −28°, knob r=(90−el)/120, arrows 10°/5°).
- **D2.5** `M8r` elevation remap, spread90×1.15, `w` extent + 16 m snapping, `kOr` texel snap, ortho ±w, far `3w+max(0,(focus.y+w)/dir.y)`, bias/normalBias formulas, fingerprint + `autoUpdate=false` (the design gets the fingerprint-vs-autoUpdate relationship right).
- **D2.6** fog `.715/max(120, 1.5·r, 3·n)`, `SFr` far, `CFr` near, 400 ms bounds, ×1.1 hysteresis — and the subtle spread90 (shadow) vs spread95 (fog) distinction is correct.
- **D3** simple_figure `Zqt` constants (PP, Nie, OIr, visor 72°/−6..14°, band, #f29a5c + contrast); humanoid ×0.956964 (bind-pose bbox — recommend computing 1.75/measured rather than hardcoding), 46 clips + .25 s crossfade, camera GLB + frustum sub-object, prop catalog scale/yawDeg; "13 procedural" confirmed.
- **D4** footprint shader constants (3px line, 160 ms fade, 1 s ripple, pad formula, max 32); hover disc 2 ms/33 ms budget; slop 8 px; group promotion; alt-click raw; lasso rect∩positions; gizmo axis colors/dims.
- **D6** `mT` tangents, arc-length duration, gait default walk, ground snap constants (+1.2 probe, .5 step, τ .22 s, instant on backward seek — all four match), yaw rate 8 rad/s, pace hold→idle, cam-move smoothstep + orientation-correction slerp + dolly_zoom fov, cam-path heightCurve (64 resample/100 m/replaces Y), cam-manual nearest-sample 20 Hz, `NP` .7, `rx`/`lje`/take-range, restore-TRS-on-stop.
- **D7** anchor sizes/colors/thresholds, tangent mirror + alt-break, height ladder .3+h·.55, finish keys, <2 anchors removal.
- **D8** magnet 12 px, trim→speed recompute, zoom min 60 px/s, ruler seek.
- **D9** plan canvas constants (34 px/m, +48 px, grid fade 8→24, 5 m major).
- **D10** letterbox overlay spec; skip-list D11 is reasonable (see triage below).
- **D12** daylight test elevations (−30/−8/5/32/90) all land on or clamp to table stops — good choices for exact assertions.

---

## Fidelity triage for the stated workflow (criteria 1)

| Divergence source | Visible? | Matters for previz? | Disposition |
|---|---|---|---|
| Finish composer (SSAO/edges/soft-terminator) skipped (D11) | Yes — live auto-enables it on fast GPUs (11 ms budget), so primitives/props shade differently | Marginal — time-of-day *look* comparisons at screenshot level will differ in ambient occlusion; blocking/geometric reads are unaffected | Accept, document (already in D11). Keep a `stage-finish` localStorage key placeholder for later |
| Stroke outline deferred to P2 (D4) | Yes — live selection = footprint + silhouette ring simultaneously; hover shows stroke too | Acceptable interim (disc + footprint remain); matters in dense prop scenes where footprints overlap | Accept as P2; include hovered-id in the P2 scope (F18) |
| Nav ball, PIP windows, recording pipeline, chat, play-mode recorder skipped (D11) | Yes | No — none are on the previz critical path; view-only playback covers rehearsal | Accept (explicitly endorsed) |
| React → vanilla DOM | Structure/interaction only if class names + behaviors copied | DOM_REFERENCE gives the classes; interaction fidelity is what matters | Accept (D1's framing is right) |
| Planning-aids/footprint/gizmo render order (F1/F17) | Yes — broken, not just different | Yes — selection/path/gizmo visibility is core editor function | Fix (P0/P2) |
| Path paint on floor only (F3) | Yes — anchors under terraces | **Yes — defeats character blocking on proxy scenes** | Fix (P0) |
| LookAt split / rig pipeline (F4) | Yes — head-dead characters | Yes — character blocking quality | Fix (P1) |
| Shadow fit caster branch (F12) | Yes — clipped shadows at low sun | Yes — time-of-day is a stated core use | Fix (P1) |
| Target marker geometry unextracted (F21) | Yes (minor) | No | Accept, approximate, document |
| Procedural-prop geometry (13) unextracted | Yes (minor) | Low | Accept or simple stand-ins |

## Scope/priority sanity (criteria 4)

- **P1 is right** for D2/D3/D4-core/D5: time-of-day and the viewport are the daily-drivers and the design ports them at near-exact fidelity.
- **P2 is overloaded** (D6+D7+D8+D10 ≈ the majority of total effort) and internally unordered. Suggested sequence inside P2: **(1) D10 camera-mode framing (small, high value — see F19), (2) D7 path paint + D6 path/clip eval (character blocking), (3) D6 cam-move/cam-path + F6 commit pipeline (camera blocking), (4) D8 timeline, (5) cam-follow/transform/manual + rig-transform editor.**
- **Under-scoped**: the dock UIs (F8) — "applying the local asset library" is a stated goal with no UI designed for it; undo (F7); migration (F11). The Actions-window clip tiles can start as plain tiles (thumbnails later).
- **Over-scoped / deferrable**: full custom gizmo reskin (F10 — stock look first, reskin once wired); D9 plan canvas could stay a P3 static view (no marquee/drag) if time squeezes; multi-select centroid gizmo can follow single-select manipulation.
- **D11 skip-list**: endorse entirely; the only amendment is shake — "apply-on-preview if time" is fine since camera rigs/`Dzt` constants are fully extracted if wanted later.

## Architecture assessment (criteria 2)

- **Module boundaries (D1–D13)**: reasonable granularity; missing modules for playback/undo/inspector/migration (F22). The riskiest boundary is D4↔D6 (manipulation vs evaluation ownership of mesh transforms): define explicit ownership rules — *store→sync owns meshes at rest; playback owns them while performing; manipulation owns them while dragging (`isMeshDragged` guards in both consumers); on stop, `ye()` reset from store* (F6/F4).
- **Data flow** store → `AWr.N`-sync → `jGr` eval matches live; add `livePose` publish (selected-object TRS → store) for the inspector (F8).
- **Frame loop**: see F1 — the single most important architectural correction.
- **No-build constraints**: solvable with importmap + dual-file three (F2); keep everything same-origin relative paths; no dynamic `import()` of remote anything.
- **Vendoring pitfalls**: three.core.js split (F2), TransformControls getHelper (F10), PCFShadowMap (already right), colorspace_fragment verbatim-copy rule (F9), interleaved GLB buffers are a non-issue for GLTFLoader (the humanoid GLB's byteStride-44 interleaving is handled natively — only a hand-rolled parser would break).

---

## Must change before implementation (prioritized)

1. **F1** — Correct D2.7: separate update-tick order (rig-tick first, spotlights before shadow redraw, selection tick last) from render-pass order (main → stroke → planning-aids overlay). *One-paragraph design fix; prevents a visibly broken editor.*
2. **F2** — Add the importmap + vendor `three.core.js` alongside `three.module.js`; reconcile `vendor/` location between D13 and README. *Prevents a non-loading app.*
3. **F3** — Path paint/drag against `walkableSurfaces()` + `anchorPosFor` flown/walked Y semantics + first-anchor seeding. *Prevents broken character blocking on the actual sample scenes.*
4. **F7** — Specify the store split + gesture-bracketed undo model. *Blocks correct implementation of D4/D5/D7/D8 interactions.*
5. **F6** — Add the manipulation commit pipeline (refusal, keyed-camera capture, cam-move rebase, target pairing) to D4/D6. *Blocks usable camera blocking.*
6. **F4** — Add the character application pipeline (lookAt split `xM`/`jZt`/`Kae`, rig offsets, at-rest t=0 rig pose, `isMeshDragged`). *Blocks character-blocking fidelity.*
7. **F5** — Specify `lGr` foot computation incl. SkinnedMesh bones. *Footprints would be wrong on every posed character.*
8. **F11** — Port `f6r`+`prt` in the loader; redefine the golden test as normalization-idempotence. *Blocks correct scene loading and D12.*
9. **F9/F10** — Write the two port rules into the design: ShaderMaterial `fog:false` + verbatim-shader policy; TransformControls `getHelper()` wiring + in-place gizmo restyle. *Prevents two guaranteed runtime crashes.*
10. **F8** — Add the dock-UI section (inspector + livePose, add-palette + props picker, hierarchy, selection toolbar). *Blocks the "apply the asset library" goal.*
11. **F13** — Fix the test harness specifics (SwiftShader flags, baseline strategy, structural diff, synthetic fixtures).
12. **F12** — Complete the shadow-fit spec (casterBox branch; resolve the caster-set ambiguity) + spotlight budget.

---

## Answers to the design's Open questions

**1. Stock three r182 OrbitControls/TransformControls vs backporting live customizations?**
**Stock, with the live wiring copied exactly.** Verified against the bundle: live uses stock r182 OrbitControls (`enableZoom=false` + external wheel zoom — D2's plan is precisely live's approach) and stock TransformControls via `getHelper()` (F10). The only "backport" needed is the small `Pzr` styling pass (in-place geometry/material replacement on the helper's gizmo children) and the `Dqr` zoom-jitter suppression wrapper (F20). Do not subclass; pin r182 byte-exact to the live engine and mirror usage. Residual risk is stale-API cargo-culting (pre-r169 `scene.add(controls)`; note OrbitControls in this build has `zoomToCursor`/`min`/`maxTargetRadius` — all unused by the editor).

**2. Props library 101 MB in-repo vs side-reference?**
**In-repo is right for the offline goal — with three conditions:** (a) on-demand per-key loading with a GLB cache + clone-on-instantiate and real disposal (F16) — never eager-load; (b) verify prop GLBs' `extensionsUsed` for Draco/KTX2 once (humanoid is clean; 1426 props unaudited here) and vendor a decoder or re-encode if needed; (c) accept the repo-weight cost consciously (git-LFS optional; the prior repo already carries 98 MB of the same GLBs). The catalog file must include `dims` (subject-aim math needs it — F21).

**3. Humanoid GLB `M_Joints` visual spheres stay purple?**
**Yes, keep exact.** HUMANOID §3.1: `$he` sets roughness 1 on every mesh but only recolors `M_Main` → #f29a5c; `M_Joints` keeps the GLB's #6722B5. The purple joint spheres are part of the mannequin look, and the *click* targets for rig editing are the separate `xqr` handle spheres (r .028, #44aaff/#ffcc44, `depthTest:false`, renderOrder 1) — don't conflate them if rig-transform editing is ever built out (currently P2 "rig-transform" is in D6's kind list; the joint-handle UI isn't designed — if it slips, say so explicitly).

**4. Stroke-ring post pass cost in headless testing?**
**Implement, gate with `?stroke=0`, and default it off in CI.** The pass needs an MSAA×4 (`UWr=4`) mipmapped mask RT — SwiftShader handles WebGL2 multisample renderbuffers but slowly. Keep one optional local visual test with stroke on; CI asserts geometry/eval logic with it off. Also gate on `WebGL2` + `renderbufferStorageMultisample` support rather than UA sniffing. (SwiftShader launch flags: F13.)

**5. Scene JSON save: keep v10 verbatim fields (lossless round-trip)?**
**Yes — with the normalization caveat.** Keep unknown fields opaque and never reorder/round-trip-drop known ones, but the load path runs `prt` (F11), which legitimately drops invalid `pace`/`heightCurve`/dangling `subjectId` and clamps speeds — live does this too. So define round-trip fidelity as: *load→normalize→save is idempotent, and save preserves every field `prt` preserves*, verified structurally (sorted-key deep-equal), not byte-wise (F13).

---

*Audit complete. Recommend updating DESIGN.md in place with the P0/P1 changes above (or an addendum section referencing F1–F13), then proceeding to implementation in the P2 order suggested in "Scope/priority sanity".*
