# AUDIT 2-b — Editor UX / Manipulation modules (reconstruction vs `index-DBE17t4T.js`)

Audit of `editor/js/{store,manipulate,selection,paths}.js` (+ their direct helpers
`curves.js`, `const.js`, `stroke.js`, `schema.js`, wiring in `main.js`/`ui.js`) against the
minified originals: `tmp_b/sel_pGr_full.js`, `tmp_b/manip_pWr{,_pretty}.js`,
`tmp_b/drag_commit_SZt.js`, `tmp_b/path_store.js`, `tmp_b/path_store_impl.js`,
`tmp_b/path_edit.js` (UGr), `tmp_b/hover_shaders.js`, `tmp_b/gizmo_ozr.js`,
`tmp_b/gizmo_custom_Mzr.js`, `tmp_b/keyboard_Hzr.js`, `tmp_b/gizmo_Pzr_iat.js`, and the full
bundle. Bundle offsets cited as `@NNNN` (byte offset in `index-DBE17t4T.js`).
**No reconstruction files were modified.**

Status legend: EXACT (semantically identical) · NEAR (works, small deltas) ·
PARTIAL (present but incomplete) · DIVERGENT (wrong behavior) · MISSING.

---

## 0. Headline findings

| # | Finding | Sev |
|---|---|---|
| H1 | `_commit` refusal rule is inverted vs `SZt`/`kZt`: recon refuses **any** object driven by `path/play/cam-*` items; the original only refuses **cameras** under `cam-manual`/`cam-path` (reason-dependent) — regular objects on walking paths commit freely via `kZt` (`@5449844`, `@5447451`) | **P0** |
| H2 | Commit pipeline is "minimal SZt": no keyed-camera, no keyed-target, no cam-follow offset, no cam-move rebase, no VOr/UOr rules, no reaim, no unbased warning/dup-delete — see §3 checklist | **P1** |
| H3 | Undo architecture: recon snapshots only the show store and brackets every micro-op → gizmo drags are **not undoable at all** (`objects.update` runs after `endEditGesture`), and path/handle drags create one undo entry **per pointermove** (original: observer history over objects+show with 300 ms coalescing `gqt`, `nMr` class `@5256604`) | **P1** |
| H4 | `SelectionFootprints.footOf` rotates world points by **+yaw** (original `lGr` `@5683686` rotates by **−yaw**) and never rotates the footprint center back to world → footprints misplaced/mis-oriented for every rotated object | **P1** |
| H5 | Footprints are drawn for `camera/target/spotlight` kinds; in the original `lGr`→`gBe` **skips `_De` kinds entirely** → `null` → no ground footprint (those kinds get only the silhouette stroke) | **P1** |
| H6 | Lasso selection (editInteraction/lassoRect/marquee/`Xu` exclusion/lasso cursor `nWr`) is entirely missing | **P1** |
| H7 | `nearestSegmentXZ` (j2r port) returns the wrong anchor index + measures against the bezier polyline instead of anchor chords → `insertPathAnchor` inserts after the wrong anchor | **P1** |
| H8 | Gizmo is stock three.js TransformControls with a name-regex tint; original swaps in the full custom `Mzr` mesh set (colors per-axis incl. plane-normal coloring `Izr`, custom cones/tori/center sphere, `renderOrder 1000010`, negative-axis picker removal `Nzr`) | **P1** |

---

## 1. Function-by-function table

### 1.1 `editor/js/store.js`

| module.function | original (name + file) | status | details |
|---|---|---|---|
| `StoreBase` (subscribe/changed) | signal stores (`Ne`) | NEAR | structural port, fine |
| `ObjectStore.setObjects/update/add` | `iMr` object store (bundle `@5792xxx` class) | NEAR | — |
| `ObjectStore.remove` | `remove`/`deleteObject` (`@5263999` region) | **DIVERGENT** | Original: group delete **recursively deletes the whole subtree**; camera delete also removes its paired target; paired targets (`Xu`, `@4902336`) **refuse** deletion. Recon: group delete re-parents children to root and keeps them; targets freely deletable; camera delete orphans the target |
| `ObjectStore.select` | `setSelection` (`@5792xxx`) | **DIVERGENT** | Recon caps the *selection* at 32 (`SEL_MAX`); original caps only the *footprint visuals* (`WWr=32` slice in `pGr` tick) |
| `ObjectStore.toggleSelect` | `toggleSelect` | EXACT | — |
| `ObjectStore.duplicate` | `duplicateObjectAt` (`@5263324`) | **DIVERGENT** | Recon offsets copy +0.5 X and names "` copy`"; original places the duplicate at the **exact given position** (required by alt-drag) and clones the full subgraph (`expandForClone`). Camera+target pairing (`Die`) ✓ present |
| `ObjectStore.copy` | `copySelectedObject` | **DIVERGENT** | Original stores `{sub: expandForClone(ids), roots}` (subgraph) and filters out paired targets (`Xu`); recon clones only the selected objects themselves |
| `ObjectStore.paste` | `pasteObject` | **DIVERGENT** | Original offsets **roots only** by `+1.5 X and Z` (`nL=1.5`); recon offsets **every** pasted object by +0.5 X |
| `ObjectStore.groupOrUngroup` | `groupSelection`/`ungroup` (`@5261615`) | **PARTIAL** | Missing: **ungroup** (⌘G on a single group → ungroup + select children, `VWt` world-transform recompute); group placed at fixed `[0,0,0]` instead of child-position **centroid**; children not re-based relative to group (`pie`); no `isGroupable` filter / "skipped" warning toast (`S/KZeT`, `33c0Wh`) |
| `ShowStore.beginEditGesture/endEditGesture/undo/redo` | history class `nMr` (`@5256604`) | **DIVERGENT** | (a) snapshots **show only** — objects-store changes (gizmo commits) are not in undo; (b) no time coalescing: every bracketed `_commit` = one entry (per-pointermove granularity); (c) stack cap 200 vs original 50 (`tMr`); (d) original also has command-entries + `holdEntry/releaseEntry` |
| `ShowStore._commit` → `packItems` | `lje` (`@5139472`) | EXACT | sort by startS + push-forward (schema.js) |
| `ShowStore.addItem` (startS placement) | `placeItemS`/`W5r`/`MP` | NEAR | recon stores at playhead and lets `packItems` push forward; original computes a free slot up-front — same net result |
| `ShowStore.addPathItem` | `addPathItem` (`path_store_impl.js`) | NEAR | `gait:'walk'` added **unconditionally** (original: humanoid tracks only, `isHumanoidTrack`); no `isAnimatableTrack` gate; `speedUnitsPerS:1.4` ✓ (`Htt`); enter-edit+seed done by caller (ui.js) ✓ |
| `ShowStore.appendPathAnchor` | `appendPathAnchor` | **PARTIAL** | `mT` rebuild ✓, but missing: `selectPathAnchor(new)` auto-select (original selects each new anchor → tangent handles appear), `exactHeight` option, cam-path `heightCurve` drop when anchor Y changes (`HHr` `@5549847`) |
| `ShowStore.insertPathAnchor` | `insertPathAnchor` | **PARTIAL** | splice-after-index ✓ + rebuild ✓; missing auto-select `index+1`, heightCurve drop; (index semantics broken by caller — see paths.js) |
| `ShowStore.movePathAnchor` | `movePathAnchor` | EXACT | keeps `in/out` handles, replaces pos only ✓ |
| `ShowStore.setPathAnchorHeight` | `setPathAnchorHeight` | NEAR | unconditional heightCurve drop ≈ original (Y always changes); missing `editingFlownPath()` guard (harmless — handle only exists when flown) |
| `ShowStore.movePathHandle` | `movePathHandle` | NEAR | mirror in↔out negated ✓, alt-break ✓; recon produces `-0` components (original guards `0→0`) |
| `ShowStore.deletePathAnchor` | `deletePathAnchor` | **PARTIAL** | rebuild via `mT` ✓; missing `selectPathAnchor(null)` (recon leaves stale `paint.selectedAnchor` index) |
| `ShowStore.trimItem` | timeline trim (`@5174202`) | NEAR | path/cam-path speed = `arc/duration` ✓; recon adds floors the original trim lacks (speed ≥0.01, duration ≥0.05 vs `WAr` min) |
| `ShowStore.duplicateItemTo` | timeline alt-drag duplicate | NEAR | — |
| `ShowStore.detachReferences` | `remove`/`unlinkTarget` + track cleanup | NEAR | recon patches `subjectId`/`objectId`/`centerObjectId` and drops the character's tracks ✓; original semantics differ per kind (cam-still `subjectId:null` vs recon `undefined`) |
| `ShowStore.cloneTracksFor` | `tracksFor`/`insertClonedTracks` (`@5525702`) | NEAR | recon remaps subject/object/center ids on all kinds; original remaps `subjectId` only for path/revolve/cam-move/cam-path kinds |
| `PageStore` | page store `oKr` | **PARTIAL** | missing `editInteraction` (idle/lasso/editingPath), `lassoRect`, `playSession`, `navBallVector`, keyboard-owner suspension; `mode` lacks `review` |

### 1.2 `editor/js/manipulate.js`

| module.function | original | status | details |
|---|---|---|---|
| `_installTransformControls` | `ozr` + `Pzr`/`Mzr` (`gizmo_custom_Mzr.js`) | **PARTIAL** | Stock gizmo + tint-by-name-regex. Missing entire custom mesh set (shaft `.009` cyl `.42`, cone `.03/.115`, plane circles `.045` @ `Kj=.17` op `.6`, center sphere `.036`+dark back copy `bye=.006`, half-tori `.5/.0075`, `E` ring `.75`, `XYZE` op `.35`, `renderOrder 1000010`, all `depthTest:false`); tint regex colors XY plane red (original: plane takes the **normal-axis** color via `Izr={XY:"Z",YZ:"X",XZ:"Y"}`); no negative-axis picker removal (`Nzr`) |
| `dragging-changed` handler | `pWr` dragging-changed (`manip_pWr_pretty.js` L157–423) | **PARTIAL** | orbit disable ✓; missing: **alt-drag duplicate** (`j` flag → `duplicateObjectAt`, re-attach to duplicate, cameras duplicate with target), camera+target pair capture (`f`), rig-joint drag paths (`w`/`v`, `Rzr/Dzr/Fzr`), live rotation unwrap in `objectChange` (`GA`), drag-start rotation stash (`y`) |
| `attachToSelection` | `B()` (L476–509) | **PARTIAL** | multi-select temp group at centroid ✓; missing gating (`mode==="edit" && editInteraction==="idle" && playSession===null`), rig joints (multi-joint group `x`), `transformPoseObjectId`, target-visibility rule (`uZt` — targets attach only when visible), re-attach on show/playhead/mode changes (recon: only selection change) |
| `_isTrackDriven` | `_je`/`wZt` (`@5447451`) | **DIVERGENT (P0)** | Original refusal applies **only to cameras**: driven item = `cam-manual`(with samples) or `cam-path`(≥2 anchors); reason by mode: translate/scale→`path-position`, rotate→`path-look` (unless `aim:"locked"`), else `path-anchored` if earlier camera items exist. Non-camera objects take the `kZt` path (`captureFocusedTransformPose(...) || updateObjectTransform(full TRS)`) with **no refusal**. Recon refuses every object on `path/play/cam-path/cam-move/cam-manual/cam-follow` with one generic toast |
| `_commit` | `SZt` + release handler | **PARTIAL** | See §3 checklist. Present: driven-refusal idea, revert-on-refuse, rotation unwrap attempt, camera+target translate pairing. Wrong/missing: everything keyed/rebased/ruled; multi-group commit loses original parents (restores to scene) and drops `scale`; scale written for cameras (original never writes camera scale) |
| `_unwrapRotation` | `GA` (`@3923392`) | **DIVERGENT** | Recon: per-component ±2π nearest. Original also tries the **antipodal Euler** `[x+π, π−y, z+π]` and picks whichever representation is closer to the reference |
| `_pick` | `CGr.P` (`sel_pGr_full.js`) + `ua` raycast | NEAR | pathEdit pickables first (original: only while editingPath); object-vs-floor decided by order, original compares **hit distance** (`U.distance<=V.distance`); no `JEe` promotion for the hovered id |
| `_groupPromotion` | `JEe` (`@4902336`) | **EXACT** | incl. `_De` kinds never promote, parent-group check, "click again for the part" rule, ⌘-variant re-promotion |
| pointerdown/up click selection | `br`/`Nr`/`ua` | **PARTIAL** | slop `Sye=8` ✓, dblclick window `uWr=350ms`/`hWr=14px` ✓, ⌘/alt variants ✓, empty→deselect ✓. Missing/wrong: **lasso** (whole branch `qe/jt/dt` + `Xu` exclusion + `editInteraction` reset), `pointercancel` reset (`Qs`), gizmo-dragging guard (`c.dragging`), dblclick detector reset (`atMs=-∞` — recon re-triggers on 3rd click), `_prevSelection` captured **after** the first click (original captures selection *before* click 1 → double-click-on-empty fails to restore), dblclick-object focuses the raw picked id (original: `selectedId`, i.e. the promoted group), dblclick-empty: missing `y≥0.1` clamp + `rippleAt` (recon caps distance at 20 vs "≤3×"), no focus restore (`restoreFocus`) |
| hover pick + budget | `CGr` (`_Gr=2ms`, `kGr=33ms`) | NEAR | budget logic ✓; missing: staleness gating (re-pick only when camera matrix/scene changed), `gizmoHot()` suppression, `editInteraction==='idle'` gate, touch exclusion |
| hover cursor | `fGr/mGr/gGr` (`sel_pGr_full.js` tail) | **MISSING** | Original: SVG dot cursor `mGr` (18×18 circle r5, hotspot 9 9) as default, `"none"` over pickables, guarded "only when current matches last-set or empty". Recon: binary `none`/`""` on the container |
| `_installKeyboard` | `Hzr`/`Bzr`/`S9r` (`keyboard_Hzr.js`) | **PARTIAL** | ✓ ⌘Z/⇧⌘Z/⌘Y (Bzr), ⌘C/⌘V, ⌘G, Esc/Enter→finishPaint, Z/X/C tools, INPUT/TEXTAREA/contentEditable skip, keyboardOwner. Missing: **Space→togglePreview**, Delete→`deletePathAnchor(selectedAnchor)` while editingPath (recon always deletes objects), `deleteFocused` cascade (keyframe→segment→track→objects), **W/E/R unreal-mode tools** (`Jqt`), `playSession`/mode/free-look gating, `preventDefault` on successful copy/paste. **`F`→focusObject is an invention** (no such key in `Hzr`) |
| iat alt-remap on pointerdown | `I` + `iat` (`gizmo_Pzr_iat.js`) | **MISSING** | default-mode Alt-held → LEFT=ROTATE re-map per pointerdown (recon sets mouseButtons once in main.js) |
| right-button free-look | `ue/oe/ye` (`te`, `xot=.0022`, pitch clamp ±(π/2−.01)) | **MISSING** | — |
| two-finger touch (pinch/orbit) | `pWr` touch block | **MISSING** | — |
| tick / camera-mode apply | `Ma`/`$e` | **MISSING** | camera-mode fov swap, pose save/restore, pointer-lock — out of module scope, unwired |

### 1.3 `editor/js/selection.js`

| module.function | original | status | details |
|---|---|---|---|
| `FOOTPRINT_VERT/FRAG` | `cGr`/`dGr` (bundle `@5684xxx`) | **EXACT** | verbatim GLSL incl. `#include <colorspace_fragment>`; original adds `precision highp float;` (auto-prepended by three) |
| footprint material setup | `pGr` ctor | **DIVERGENT** | missing `polygonOffset:true, factor:-2, units:-2` (z-fight risk vs floor) and `frustumCulled=false` |
| `footOf` | `lGr` (`@5683686`) | **DIVERGENT (P1)** | (a) point rotation uses **+yaw** (original `−yaw`): extents measured along wrong axes; (b) center left in rotated frame — original back-rotates `x:n*h+r*f, z:-r*h+n*f` → footprint at wrong world position for any yaw≠0; (c) `_De` kinds (camera/target/spotlight): original `gBe` skips them → `lGr`→`null` → **no footprint** (screen-bounds falls back to mesh world position); recon full-traverses them → footprint drawn; (d) group footprints include camera/target/spotlight children (original `gBe` prunes those subtrees); (e) empty traverse → point fallback (original: `null` → hidden) |
| entry lifecycle (`tick` create/expire) | `b()` | NEAR | 500 ms retention ✓, re-select keeps `selectedAtMs` (no re-ripple) ✓; original hides the mesh **immediately** on deselect (recon keeps it visible for the 500 ms window); no `isEditView()` gate (`mode==="edit" && playSession===null && !filming`) — footprints stay up during preview |
| per-frame uniform math | `f()` | **EXACT** | px formula, `W/U/V/G/Z`, corner radius, `y+px*0.6`, `rotation.set(-π/2,yaw,0)`, `scale(U+Z,V+Z,1)`, `uT`/`uFade` + reduced-motion — all match; constants `YWr .1, XWr 10, tGr .5, eGr 120, nGr 12, JWr .45, QWr 14, qWr 1000, KWr 160, ZWr 500, WWr 32` all verified `@5683288` |
| screen bounds | `m()` | **DIVERGENT (P1)** | Original projects the **8 rotated foot corners** (fallback: mesh world position for null feet) then unions with the projected **selection centroid ±0.18·clientHeight**; recon projects only foot centers and pads the point-bbox. Returns unrounded `{x0..}` vs original rounded `{left,right,top,bottom}` |
| `showAll` | `N` showSelectionRings | **PARTIAL** | doesn't re-run uniform updates for the passed (PIP) camera; restore fn doesn't hide |
| `HOVER_VERT/FRAG` | `SGr`/`TGr` (`hover_shaders.js`) | **DIVERGENT (P1)** | Different shader: original has `fwidth` AA, ring radius `R=mix(0.62,0.86,uBig)` (hover *grows* the ring), halo+dotHalo terms `0.3*…`, outer rim `0.1*…`; recon uses uv-based radius with fixed rings and `uBig` scaling alpha only |
| click ripple quad | `AGr`/`rippleAt` (`jot=900ms`, `wGr=70`) | **MISSING** | expanding-ring shader + trigger after double-click center-view |
| `HoverDisc.tick` | `CGr.F` | NEAR | weight ease is linear `±dt/90` vs original exponential `k+=(target−k)*min(1,dt/90)` (`vGr=90`); `pressed` multiplies `uBig` (original scales size ×`yGr=0.78`); `setPressed` never wired; +0.002 normal offset is an addition (original none); size `20px·pxPerM` ✓ |
| hover gating | `V = isEditView && editInteraction==="idle" && !draggingAction && !draggingComponent` | PARTIAL | recon gates via main.js `!playing && !dragging`; no editInteraction (paint mode still shows disc in recon) |
| (adjacent, `stroke.js`) | `uGr`/`hGr` + mask pipeline | **EXACT** | verbatim ring shader, `$Wr 1.5, VWr 1080, UWr 4, lQ 16, zWr 150`, `gBe/aGr` collectors, layer `cQ=2`, size latch, MSAA RT + mips — bonus check outside the 4 modules |

### 1.4 `editor/js/paths.js`

| module.function | original | status | details |
|---|---|---|---|
| `enterPaint` | `enterPathEdit` (`path_store_impl.js`) | **PARTIAL** | doesn't set `selectedSegment` (timeline block stays unselected); no `editInteraction="editingPath"`; sets `keyboardOwner='stage'` unconditionally (original doesn't touch it) |
| `finishPaint` | `finishPerformancePaint` | NEAR | <2 anchors → remove item ✓; clear paint + pickables ✓; original also resets editInteraction |
| `seedFirstAnchor` | `seedPathStart` | NEAR | mesh world position vs original `Zo(obj, objects).position` (store-based, parent-aware) |
| `_isFlown`/`_anchorPosFor` | `editingFlownPath`/`anchorPosFor` | NEAR | missing owner → recon treats as flown (original: not flown → takes raycast Y); fallback Y from `mesh.position.y` (local) vs stored position; idx not clamped to `[0, len-1]` |
| `onFloorClick` | `ua` editingPath branch (`j2r`/`Qzr`) | **DIVERGENT (P1)** | via `curves.nearestSegmentXZ`: (a) returns `ceil(denseIdx/12)` = **end anchor** of the nearest segment — original `j2r` returns the **start anchor** of the nearest **anchor-to-anchor chord** (recon inserts after the wrong anchor; for a 2-anchor path it appends instead of inserting between); (b) distance measured against the 12-sample bezier polyline, not chords; (c) anchor Y for inserts taken from the **last** anchor (original: the anchor at the insert index). Threshold `Qzr=0.4` ✓ |
| `rebuild` (visuals) | `UGr.y` (`path_edit.js`) | NEAR | curve `+y.02` violet ✓, selected anchor ×1.4 white ✓, number sprites bold 40px scale .35 at +0.35 ✓, height ladder `IOr=0.3+h·0.55` ✓, tangent handles sky-blue r.06 ✓, pickables only while painting ✓. Deltas: only the **painted** item is shown (original also shows the **selected path segment**'s curve); sphere segments 16×12/12×8 vs original 12×8/10×6; height line drawn ground→**ladder height** (original: ground→**anchor+0.02**); sprite has an extra black stroke (original: fill only); tangent tip Y misses `+0.02`; sprite textures not disposed on rebuild |
| `_installDrag` (anchor drag) | `Hn`/`Gr`/`zn` | NEAR | walkable raycast ✓ (but `intersectObjects(..., false)` — original `recursive:true`, misses prop child meshes); 3px slop invented (original: none); `movePathAnchor` keeps handles ✓ |
| height-handle drag | `Gr` height branch | **EXACT** | plane ⟂ (camera→anchor, y=0) through anchor, `MOr(y)=max(0,(y−0.3)/0.55)` ✓ (`bZt=.3, gZt=.55` `@5444767`) |
| tangent-handle drag | `Gr` handle branch | **EXACT** | plane `normal=(0,1,0), constant=−pos.y`; vec `[dx,0,dz]`; `{break: altKey}` ✓ |
| click-without-move | `zn` | **PARTIAL** | anchor click selects ✓; **height-handle click** should also `selectPathAnchor` (recon doesn't) |
| drag undo bracketing | history coalescing | **DIVERGENT** | `snapshot()` at drag end is redundant/harmless, but each pointermove already pushed its own entry (H3) |
| `curveDisplayPoints` | `Q2r` (`@4318881`) | NEAR | 64 samples ✓, height replaces Y ✓, pace mapping ✓; recon samples uniform in **arc length**, original in **time** (`o·duration·speed`, clamped by `oq`) — differs when `duration·speed ≠ arcLength` |
| `buildTangents` (curves.js) | `mT` (`@3926344`) | **EXACT** | chordal tangents, endpoint zero handles, `±h/3 · f/3` |
| `polylineOf` | `nx` (`Ptt=12`) | EXACT | 12 samples/segment, WeakMap cache |
| `itemDuration` (schema.js) | `yd` (`@4319914`) | EXACT | path = arc/speed, <2 anchors → 0 |

---

## 2. Severity-ranked divergences

**P0 (1)**
1. **Driven-object refusal semantics** (`manipulate._isTrackDriven`/`_commit`): blocks and toasts on dragging any object whose track has `path/play/cam-*` items at the playhead. Original `pWr` release: non-camera/target objects go through `kZt` (keyframe-or-update, no refusal); only **cameras** can be refused, with 4 distinct reasons. Dragging a walking human or a path-driven prop is a core flow and is currently impossible.

**P1 (12)**
1. Commit pipeline gaps (H2) — full checklist §3.
2. Undo architecture (H3): object transforms not undoable; per-move undo entries.
3. `footOf` rotation inversion + missing center back-rotation (H4).
4. Footprints shown for `_De` kinds / camera children in groups (H5).
5. `selectionScreenBounds` corner projection + centroid padding (H6 in table 1.3).
6. Lasso missing (H6).
7. `nearestSegmentXZ` wrong index + polyline-vs-chord distance (H7) → inserts land after the wrong anchor.
8. Custom gizmo mesh set missing (H8) + plane coloring wrong.
9. Alt-drag duplicate missing (incl. duplicate-then-refused delete, `Die` target dup, `targetPosition`).
10. Group delete semantics (recon re-parents, original deletes subtree) + no ungroup + camera-delete leaves orphan target.
11. Multi-select commit: children restored to scene root (original: original parents) and `scale` dropped.
12. Camera+target pairing: original rotates the target around the camera live during drag (`XWt`+`POr`) and commits the followed position; recon translates target by the camera delta post-commit only (rotation drags don't move the target at all).

**P2 (24)**
selection: missing `polygonOffset −2/−2` + `frustumCulled=false`; deselect keeps footprint visible 500 ms; no edit-view gate; hover-disc shader divergence + press-scale + linear-vs-exp ease; click ripple missing; hover staleness/gizmo-hot gating; cursor dot SVG missing; hover lacks `JEe` promotion and distance-compared floor hit.
manipulate: `GA` antipodal unwrap; dblclick triple-fire + prev-selection restore + raw-id focus + missing ripple/y-clamp; keyboard gaps (Space, Delete-anchor, W/E/R, deleteFocused cascade, playSession gate, invented F key); pointercancel; no re-attach on show/mode changes; iat alt-remap; free-look; touch.
store: selection 32-cap; copy/paste/duplicate offsets+subgraph; gait on all kinds; delete-anchor deselect; append/insert auto-select; heightCurve drop rule; `movePathHandle` −0; stack cap 200; clone-track id remap breadth.
paths: selected-segment curve display; sphere segment counts; height line endpoint; sprite stroke; tangent tip +0.02; sprite texture leak; walkable non-recursive raycast; 3px slop; height-click select; `_isFlown` missing-owner; `curveDisplayPoints` time-vs-arc sampling.

---

## 3. MISSING-FEATURE checklist — commit pipeline (`SZt` + release handler)

Implementation order suggested; every line cites the original.

1. **Branch split by kind** — `mZt(mesh)` (`@5444767`): camera/target → full `SZt`; **everything else** → `kZt(n,id,{position,rotation,scale})` = `captureFocusedTransformPose(pose) || updateObjectTransform(id,pose)` (`@5449844`). Recon must stop refusing non-camera objects (fixes the P0).
2. **Keyed camera** — `captureFocusedCameraPose(world)` (`@5263xxx`): selectedSegment item `kind==="cam-transform"` AND playhead inside it → `addCameraKeyframe(trackId,itemId,{tS: playhead−startS, position, rotation, focalLengthMm})`, return `{outcome:"keyed"}`; on keyed, sync the paired target mesh from the store.
3. **Keyed target** — object `kind==="target"` && `captureFocusedTransformPose(toLocal(id, world))` (selected `transform` item inside playhead) → transform keyframe, `{outcome:"keyed"}`.
4. **Cam-follow offset capture** — `bFr(t,id)` (`@5431935`): cam-follow item at playhead → `V8r(worldPose, worldPoseOf(item.objectId))` (position/quaternion relative to follow subject, `@4904869`) → `setCameraItemFields(trackId,itemId,{offset})`.
5. **Cam-move rebase `_Zt`/`GOr`** (`@5448338`, `@5449660`): find `cam-move` item covering playhead (`zOr`); all earlier camera items must be `cam-move`/`cam-still` (`WOr`) else `{refused,"anchored"}`; chain-inverse the preset stack (`zat`/`WY`, pan_sweep special case) else `{refused,"not-invertible"}`; success → `{rebased, position, rotation: "keep"|"turn"|"framing"|{aimAt}}`; rebased rotation `{aimAt}` → `kv(position, aimAt)` lookAt-Euler (`@4904662`).
6. **Unbased outcome** — rebase refused (≠ no-move) → `{outcome:"unbased", reason}`; if the drag was an alt-duplicate → `deleteObject(duplicate)` + toast `euVfNP` (anchored) / `UWeJnj` (other) and stop; else restore meshes from store (`zt()`) + toast `AZt(reason)` (`1gJooS`/`LvEoJv`).
7. **Refused outcome** — 4-reason i18n toast `TZt` (`KZlC+a` manual, `OFFVJO` path-position, `uUVmom` path-look, `FpnVEp` path-anchored); if duplicate → delete the duplicate; else `zt()` restore (mesh position+rotation only, no scale).
8. **VOr rotation rule** (`@5447361`): write rotation iff `(outcome≠rebased || rotation==="free") ? allowRotate : rotation!=="keep"`, where `allowRotate = !xq(t,id)` (camera not paired-with-driven-target, `@5431405`).
9. **UOr position rule** (`@5447451`): write position iff NOT under a `cam-manual`(samples)/`cam-path`(≥2 anchors) item (`wZt`).
10. **GA unwrap with `windFrom`** — commit rotation as `GA(local.rotation, windFrom)`; port the antipodal-candidate `GA` (`@3923392`).
11. **reaimCamera after refused translate** — `c.refused && reason==="no-move" && mode==="translate"` → `reaimCamera(id)`.
12. **Paired-target commit** — during drag: `objectChange` → `POr(targetMesh, XWt(startPose, currentWorldPose))` (target rotated around camera by delta quaternion, `@4905387`/`@5445792`); at release: `updateObjectTransform(target.id, {position: target.position-live})`.
13. **toLocal with parent awareness** — `Hie`/local conversion for objects parented under groups (recon assumes mesh-local == store).
14. **F() mode rules on attach + mode change** — forced `translate` for paired targets (`Xu`), camera-rotate refusal (`wje`) with `setRotateAvailable` + warning toast (`bqt` = i18n `4e78ft`), camera scale→translate; re-run on transformMode/playhead/show changes.
15. **Multi-select release** — restore each child to its **pre-drag parent** with `GA` unwrap **and scale**; re-center the temp group (`E(g)`).
16. **Alt-drag duplicate wiring** — `pointerdown` alt stash (`j`), duplicate before drag (`duplicateObjectAt` incl. `Die` target + `targetPosition`), re-attach gizmo to duplicate, `m`/`Dt` tracking for refused/unbased delete.

---

## 4. Verified correct (20 verification groups ≈ 50 individual constants/formulas)

1. Footprint GLSL `cGr`/`dGr` verbatim (incl. `colorspace_fragment`).
2. All 16 selection constants (`WWr 32, KWr 160, qWr 1000, ZWr 500, XWr 10, YWr .1, QWr 14, JWr .45, eGr 120, tGr .5, nGr 12, GWr .18, rGr #5f7196, sGr #ffffff`, `$Wr 1.5`).
3. Footprint uniform math `f()` — px-per-meter, pad, ripple reach, extent margin, corner radius, y+px·0.6, `rotation.set(-π/2,yaw,0)`, `scale(U+Z,V+Z,1)`.
4. `uT`/`uFade` reduced-motion forcing; no re-ripple on quick re-select; 500 ms entry retention.
5. Hover budget 2 ms / 33 ms.
6. Stroke ring (`stroke.js`): `uGr/hGr` verbatim, RT pipeline (1080 cap, 16 px step, 4× MSAA, mips, 150 ms realloc latch), `gBe/aGr` collectors, layer 2.
7. Click slop 8 px (`Sye`); dblclick 350 ms / 14 px (`uWr/hWr`).
8. `JEe` group promotion — exact incl. `_De` non-promotion, alt-raw, ⌘-toggle variant, "click again for the part".
9. ⌘Z/⇧⌘Z/⌘Y undo keys (`Bzr`), ⌘C/⌘V, ⌘G, Z/X/C tool keys, Esc/Enter finish-paint, INPUT/TEXTAREA/contentEditable guards.
10. `mT` tangent builder exact (`buildTangents`).
11. `nx` polyline (12 samples/seg, WeakMap) and `yd` path duration (arc/speed).
12. `lje` packing (`packItems`).
13. Path colors/sizes: `Not 0xaa55ff`, `NGr 0xffffff`, `Pot 0x66ddff`, `Rot 0xffcc55`, anchor r .09 ×1.4, handle r .06, height r .075, +0.02 offsets, sprite bold 40px @ scale .35 (+0.35).
14. Height ladder + inverse `IOr/MOr` (0.3 / 0.55) and both drag-plane constructions (⟂ camera-anchor plane; y=−pos.y plane) and alt-break mirroring.
15. Insert threshold `Qzr 0.4`.
16. Speed defaults/floors: `Htt 1.4`, `Qae 0.01`.
17. `isPersonKind` = `el` (humanoid|simple_figure); `isCameraItem` = `Fp` set matches.
18. Camera+target duplicate pairing (`Die` concept), track cloning on duplicate.
19. `detachReferences` drops the deleted character's tracks.
20. Focus animation constants (0.3 s ease-in-out-cubic, 1.5×radius/sin(min fov), min 1.2) — main.js.

**Count summary:** 67 audited table rows → **EXACT 12 · NEAR 20 · PARTIAL 15 · DIVERGENT 14 · MISSING 6**.
Severity: **P0 ×1 · P1 ×12 · P2 ×24**.

---

## 5. Recommended next round (priority order)

1. Fix `_commit`/`_isTrackDriven` branch split (checklist §3.1) — unblocks core dragging.
2. Port the real undo history (objects+show observer, 300 ms coalesce, gesture hold) — checklist §3 depends on it.
3. `footOf` rotation/center fix + `_De` no-footprint rule + screen-bounds corners.
4. `nearestSegmentXZ` → chord-based `j2r` with start-anchor index.
5. `SZt` items §3.2–3.12 (keyed camera/target, cam-follow offset, rebase, VOr/UOr, reaim, unbased).
6. Lasso subsystem + iat alt-remap + hover cursor/ripple polish.
