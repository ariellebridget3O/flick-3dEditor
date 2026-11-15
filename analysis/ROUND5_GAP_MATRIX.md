# ROUND 5 — COMPLETE FEATURE / API GAP MATRIX
**Original:** flick.art 3D Stage editor — `analysis/index-DBE17t4T.js` (13,483,704 B, single-line bundle, byte offsets cited below)
**Port:** `editor/js/*.js` (15 modules) + `editor/index.html` — evaluated at git HEAD `a55a900` ("round 5 P0s", clean worktree)
**Method:** facade/store class extraction at the given offsets (`analysis/gap5/*.js` dumps), UI-component extraction (actions palette, segment editors, plan painter, height-curve editor, dialogs), cross-checked against `analysis/DOM_REFERENCE.md` (rendered-DOM snapshots) and greps of the port.

Legend — Port status: **P+F** = present & functional · **STUB** = exists but partial/no-op · **MISSING** · **N/A** = editor-external (server/network) by design. Priority: **P1** visible editing-workflow feature · **P2** secondary · **P3** polish/infra.

---

## ⚠️ 0. CRITICAL CONTEXT — the round‑5 commit regressed round‑3/4 features

`a55a900` (current HEAD) was authored from a **stale working copy** that predated rounds 3–4: its diff vs `4e7055d` (round‑4 HEAD) **deletes 1,905 lines** of previously-shipped, E2E-verified features while adding the (excellent) T‑pose/spotlight/shadow fixes. Working tree = HEAD, so these are **live regressions in the port today**:

| Feature (round 3/4, commit) | Was | Now at HEAD |
|---|---|---|
| Lasso select (`fb2b0b4`, br/Nr/ua exact) | wired button + rect select + Xu gate | **dead button** — `index.html:55 btnLasso` + `:52 lassoBox` have **zero JS references** |
| Nav ball (`fb2b0b4`, lZr/zzr/Ye exact) | `editor/js/navball.js` (229 L) | **file deleted**; `index.html:53 navBallPad` is a dead button |
| Take-range tool (`4e7055d`, xTr/Tie/PGt exact) | `takerange.js` (327 L) + range button + `show.range` | **deleted**; `setTakeRange`/`She`/`filmedARange` gone from store.js |
| Timeline placement solver (`bdfe079`, place.js q5r/W5r/MP exact) | magnet 12 px + obstacle push + reorder preview + snap guides + alt-drag duplicate ghost | **deleted**; naive `moveItem` + `packItems` bump (`store.js:198`) remains |
| Keyframe diamonds (`bdfe079`, SCr/xbe/B2r) | kf layer: click=select+seek, drag=move, active/selected states | **deleted** — no keyframe UI at all (only segInspector "⦿ Key at playhead" `ui.js:634`) |
| Trim handles on blocks (`bdfe079`) | drag handles (clip dur / path speed=arc/dur) | **deleted** — duration only via number input (`ui.js:632 segDur`) |
| Magnet toggle + YAr clock | header controls | **deleted** |
| Segment editors rotate/revolve/scale + key list jump/delete (`bdfe079`) | full editors | **deleted** — segInspector covers path/cam-path/clip/cam-move/cam-still/cam-follow only (`ui.js:566-652`) |
| Keyframe store family (`bdfe079`) | add/remove/move for transform/rig/cam + rig joint merge | partial: `addTransformKeyframe`/`addCameraKeyframe` only (`store.js:238-243`); no remove/move, no `addRigKeyframe` |
| Custom gizmo meshes (`4e7055d`, Mzr/Pzr/Nzr exact) | one-sided shafts/cones/discs + BackSide shells | **deleted** — stock TransformControls recolored (`manipulate.js:46-69`) |
| `store.js` richer ops | −146 lines | simplified |

**First action item: restore the round‑4 versions of `ui.js`, `store.js`, `manipulate.js`, `place.js`, `takerange.js`, `navball.js` from git (`git show 4e7055d:…`) and re-apply the round‑5 fixes (T‑pose HumanoidRig, spotTick, shadow walk, path keymap) on top.** Most of the "top gaps" below are restorations, not new work.

---

## 1. OBJECTS & SCENE GRAPH
Original: objects-store class `iMr` @ **5257400–5270000** (dump `gap5/objects_store.js`); facade `oKr` @ **5786083–5816000**.

| Feature | Original evidence (offset + behavior) | Port status | Priority | Notes |
|---|---|---|---|---|
| Object kinds (group/cube/sphere/cylinder/simple_figure/humanoid/camera/target/spotlight/prop) | `iMr.addObject` @~5258700; `addComponent` switch @~5258900 | **P+F** (`objects.js/_create`, `store.js:34`) | — | all 10 kinds render |
| Spawn grid 5×6 @1.5 m (`V2e=5, rMr=6, nL=1.5` @5257398; `spawnIndex++%(V2e*rMr)` in addObject) | new objects walk a 30-slot grid: `x=u%5*1.5−3, z=floor(u/5)*1.5` | **MISSING** | **P1** | port spawns everything at `[0,y,0]` (`ui.js:87`) → objects stack on origin |
| Default names w/ per-kind counters (`defaultName` @~5257900: "Cube 2", "Camera 3"…) | `defaultName(kind)` counts same-kind objects | **STUB** | P3 | port uses fixed names, no counters (`ui.js:86`) |
| simple_figure spawn yaw π (`Bst=()=>({rotation:[0,Math.PI,0]})` @5257406) | figures face +Z at birth | **MISSING** | P3 | port spawns rotation [0,0,0] |
| Camera spawn: grid slot, aimed at origin (`addCameraMarker` @~5258050: `kv(o,[a…])`) | position + lookAt(centre slot) | **MISSING** | P2 | port camera spawns at [0,1,0] facing −Z |
| Select/toggle-select/clear (`selectObject/toggleSelect` @~5258400; aim-pair exclusion in `toggleSelect`) | selecting camera excludes its target from multi-select | **P+F** (store.js:48-56) | — | port `toggleSelect` lacks the aim-pair filter (P3) |
| Group / ungroup / addToGroup (`groupSelection/ungroup/addToGroup` @5258600-5258850; groupOrUngroup facade @5788600) | ≥2 groupable → group at centroid w/ re-parented transforms; group selected → ungroup | **STUB** | P2 | port groups only (`store.js:98`); **no ungroup** path, no per-child transform rebase (port keeps world TRS under group) |
| Copy/paste w/ subgraph + tracks (`copySelectedObject/pasteObject` facade @5788300; `insertClonedTracks` @5525000) | clipboard expands groups + camera-target; pasted offset +1.5,+1.5; tracks cloned | **P+F** (store.js:78-97, cloneTracksFor:338) | — | port paste offset +0.5 only (P3 parity) |
| Duplicate (`duplicateObjectAt` @5258660; alt-drag duplicate w/ `DHr` remap) | duplicate at drag position incl. target + tracks | **P+F** (store.js:57) / drag-dup **MISSING** | P2 | offset +0.5; no alt-drag on canvas/timeline (round-4 loss) |
| Delete object + cascade (`remove` @5258950: group children, camera→target, `unlinkTarget`) | recursive; target unlink | **P+F** (store.js:40, detachReferences store.js:320) | — | |
| Reorder objects (`reorderObject` @5259050; draggable hierarchy rows) | object order matters (spotlight shadow-slot order, spawn naming) | **MISSING** | P3 | port hierarchy is click-select only (`ui.js:341-350`), no drag, no per-row delete button |
| Set name / color / per-kind colorability (`setObjectName/setObjectsColor/previewObjectsColor` @5266600-5266750; color row `R$r` @5553970) | color swatch + clear + live preview + commit timer; colorable kinds incl. group | **STUB** | **P1** | port engine supports color (`objects.js:168-206`) but **inspector has NO color row at all** (grep `color` in ui.js → 0 hits) |
| Spotlight settings `setSpotlight` (`setSpotlight` @5266780: shape/intensity/diffusion w/ `gie` quantize) | shape round/square, intensity, diffusion | **P+F** (ui.js:261-267, objects.js spotTick) | — | port edits use number inputs vs sliders (P3) |
| Person-kind switch (simple_figure ↔ humanoid) (`setPersonKind` @5266820; `pickPersonKind` facade @5810938 w/ conflict dialog; UI `P$r` @5556040 segmented Figure/Humanoid) | converts in place; humanoid-only actions listed in error w/ "remove them" action button | **MISSING** | **P1** | no UI in port; `switchPersonKind` not in store.js |
| Animation record (clip/playing) (`setObjectAnimation/setObjectAnimationPlaying/setObjectPose` @5266660-5266720) | rest-pose state; `setObjectPose` = clip paused (held pose) | **P+F** (ui.js:271-304 → objects.update; main.js objects subscription → `rig.applyClip` at rest) | — | fixed in round 5 (was the "pose doesn't apply" complaint — see §E) |
| Target marker reconcile (`ensureTargetMarker/dropTargetMarker` @5258050; `reconcileTargetMarkers` facade @5793500) | cam-move w/o subject auto-creates target marker; drops it when subject returns | **MISSING** | P3 | port has no auto target creation on cam-move |
| Live-pose inspector readout (`livePose` @5257829; inspector shows live TRS while driven, `authoredValues` ghosting @5554408) | axis fields show evaluated pose; commits capture keyframes (`captureFocused*Pose` via `I()` @~5560100) | **MISSING** | P2 | port inspector edits base TRS only |
| Driven-by hint (`drivenBy` → "Driven by <action>" @5554420) | shows when object driven by active item | **MISSING** | P3 | |

## 2. ADD / COMPONENTS / ACTIONS PALETTES
Original: actions palette `M5r` @ **5120036–5122700** (dump `gap5/action_palette.js`); component tiles @5371757; right-toolbar Add menu (DOM_REFERENCE).

| Feature | Original evidence | Port status | Priority | Notes |
|---|---|---|---|---|
| Actions palette (Move/Animate/Camera tabs + search + tiles) (`M5r` @5120036; `data-onboard-target="actions"` @5122614) | right-dock window: tabs `move/animate/camera`, search filter, tiles per action | **MISSING** | **P1** | port has neither palette; actions only via timeline "+" menu / inspector buttons |
| Clip tiles w/ live animated 128×128 canvas previews (`vGt=Lhe.filter(≠a_tpose)` @5069608; mixer-preview class @5129963 `drawPose/startLoop` w/ `setClip`) | 46 clip tiles, each an animated humanoid preview (dance tile is onboarding target @5127109) | **MISSING** | **P1** | port clip choice = plain `<select>` (ui.js:271, 593) — functional but no previews/search/drag |
| Drag-and-drop actions onto objects/tracks (`$v="application/x-stage-action"`, `onActionDragStart/onPathDragStart/onPlayDragStart` @5120036; `dropSegmentOnObject` @5541000; `appendActionToObject` @5525400) | drag tile → object in viewport or track lane; `resolveActionForObject` gates by kind (`a$` @5065300) | **MISSING** | P2 | port: click-only menus |
| Click-to-add with validity gating (`N5r` tile `+` button, "Select an object this can act on" @DOM_REFERENCE) | `canAddAction`/`onAddActionClick` | **STUB** | P2 | port lane "+" menu gates by kind (ui.js:490-492) — close enough; no empty-state hint |
| Object-action tiles w/ previews (`H5r` class @5132073: rotate/revolve/scale previews) + camera-action tiles (`I5r` icons @5120030: still/path/follow/transform/manual) | Move tab: rotate/revolve/scale-up/scale-down/transform; Camera tab: still/path/follow/transform/manual | **MISSING** | P2 | port timeline "+" covers all except **play / rig-transform / manual** |
| Components column (Add Component/My Component tabs, search, draggable rows w/ canvas thumbnails) (`data-onboard-target="component-window"` @5393675; tiles @5371757) | add-side palette + scene hierarchy in one column | **STUB** | P2 | port: static Add grid (index.html:68-81) + Objects hierarchy; no component thumbnails, no drag-into-viewport at drop point (`dropComponentAt({x,z})` @5865957) |
| Add menu (right toolbar "+" → Add component / Add action) (DOM_REFERENCE `_addMenu_aywtl_268`) | hover menu | **MISSING** (different layout) | P3 | port's always-visible dock panel is a reasonable offline substitute |
| Prop picker w/ categories + search (`zh` catalog, `D2r()` categories @4315236) | 1439 props, categories, search | **P+F** (ui.js:662-705, modal) | — | |

## 3. TRACKS & TIMELINE
Original: performance store `BHr` @ **5524600–5549200** (dump `gap5/perf_store.js`); timeline DOM in DOM_REFERENCE §A.

| Feature | Original evidence | Port status | Priority | Notes |
|---|---|---|---|---|
| Tracks per character (`addPerformanceTrack` @5525080; one track per animatable object) | auto-track on first action; `addDefaultCameraTrack` (still) for new cameras @5525160 | **P+F** (store.js:120 ensureTrack, 183 addItem) | — | port does NOT auto-create camera still track on camera add (P3) |
| 14 item kinds incl. `play`, `rig-transform`, `cam-manual` (`addClipItem…addCameraItem` @5525480-5526200) | clip/play/path/rotate/revolve/scale/transform/rig-transform/cam-still/cam-move/cam-path/cam-follow/cam-transform/cam-manual | **STUB** | **P1** | eval supports all (`tracks.js:437-501`); **UI can only create 11** — no `play`, no `rig-transform`, no `cam-manual` in any menu (ui.js:490-492, 551-563) |
| Block drag w/ magnet + obstacle push + reorder preview + snap guides (place solver `MP/W5r/q5r` — round-4 `place.js`) | 12 px magnet, push aside, ghost | **STUB** (regression) | **P1** | naive drag (`ui.js:513-534`) + `packItems` bump (store.js:179) |
| Alt-drag duplicate across lanes (`duplicateItem` @5541160 w/ `Art` same-domain gate) | ghost + caret, cross-lane | **MISSING** (regression) | P2 | `duplicateItemTo` exists (store.js:218) but no UI |
| Trim handles (`setObjectItemDuration/setCameraItemDuration` @5526260; path trim = speed recompute) | per-block handles | **MISSING** (regression) | **P1** | number-input only; path trim→speed exists in `trimItem` (store.js:209-212) but no handle UI |
| Keyframe diamonds (`kfLayer/kfDiamond`, `selectKeyframe` @5530500, `deleteSelectedKeyframe` @5530600, `moveRigKeyframe` xbe @5536618) | click select+seek, drag move, active/selected, Delete | **MISSING** (regression) | **P1** | the "keyframe cannot adjust" complaint |
| Segment selection (`selectSegment` @5530430; deselect objects when segment selected @facade 5806700) | mutual exclusion object↔segment focus | **P+F** (ui.js:506-512) | — | port doesn't clear object selection (P3) |
| Take-range (`setTakeRange` @5548675; `show.range`; `She` takeSpan) | range tool on ruler+lanes w/ grips & magnet markers | **MISSING** (regression) | **P1** | |
| Magnet toggle (header, `magnetEnabled` persisted) | snap actions to edges, ⌘ suspends | **MISSING** (regression) | P2 | |
| Ruler + playhead + seek + ctrl-wheel zoom (`YAr` clock; playhead badge) | tick labels, drag seek | **P+F** (ui.js:398-419, 654-658) | — | |
| Scroll minimap (`navTrack/navThumb`) | horizontal scroll overview strip | **MISSING** | P3 | lanes scroll (`app.css:156 tl-body overflow`) but there is no overview/minimap or sticky track headers |
| Painting block while drawing path (`blockPainting` class) | live block during path paint | **MISSING** | P3 | port shows nothing in lane until ≥2 anchors (item auto-removed on finish, store path) |
| Track header (name + remove + add action at playhead `laneAdd`) | "Add track" button + per-lane "+" at playhead px | **P+F** (ui.js:471-505) | — | port "+" is lane-left aligned, not at playhead (P3) |
| Per-kind segment editors — see §E/§F rows for contents (`fVr` @5556460) | clip/play/path/rotate/revolve/scale/transform/rig/cam-* editors + Remove | **STUB** | **P1** | port covers path/cam-path/clip/cam-move/cam-still/cam-follow + key button; rotate/revolve/scale editors lost |
| Keyframe cluster (prev ◇ next) (`pVr` @5556440; toggle add/remove at playhead, seek prev/next key) | diamond button in every transform/rig/cam-transform editor | **MISSING** | **P1** | port "⦿ Key at playhead" only (ui.js:634-651); no delete/move/navigate |
| Play performance / stop / seek (`playPerformance/stopPerformance/seekPerformance` @5542300) | space shortcut too | **P+F** (page.play/stop/seek store.js:376-390; ui btnPlay) | — | no Space key binding (P3) |
| Undo/redo (history `nMr` gesture-bracketed, `holdEntry`; facade undo/redo @5807900) | ⌘Z/⇧⌘Z, canRestoreHistory guard | **P+F** (store.js:130-175; manipulate.js:546-548) | — | keyboard only (matches original), no UI button (original has none either) |
| `moveItem/reorderItem` (`kGt` reorder @5541250) | vertical reorder via drag | **STUB** | P3 | |
| `replaceMoveFromSamples` (@5533400 — stroke → path/cam-path item, steady pace option) | draw-to-move creates path item from samples | **P+F** (stroke→? — see §D: port stroke is selection ring only; **path creation via click-anchor paint**, not freehand draw) | **P1** | original ALSO supports freehand draw (plan view "Draw direction" pill + 3D draw); port only click-anchor painting |

## 4. PATH EDITING
Original: `enterPathEdit…deletePathAnchor` @ **5531900–5533050**; height-curve editor @ **5466360–5466900** (dump `gap5/height_curve.js`); plan painter @ **5497600–5502900**.

| Feature | Original evidence | Port status | Priority | Notes |
|---|---|---|---|---|
| Path edit mode (`enterPathEdit` @5531900: selectedSegment + performancePaint + editInteraction="editingPath") | click "Edit path" in segment editor → paint anchors in 3D | **P+F** (paths.js:51 enterPaint; ui.js:633 segEdit) | — | |
| Append/insert/move/delete anchor + auto-select (`appendPathAnchor` @5532200 selects new anchor; delete @5532960) | ground-click appends; insert on segment; delete key on selected | **P+F** (store.js:260-319; paths.js paint; manipulate.js:551-560 delete key) | — | fixed round 5 |
| Flown-vs-walked anchor Y (`anchorPosFor` @5531650: cameras keep Y; walkers clamp to last anchor/owner Y) | camera paths hold altitude; walk paths follow terrain anchor Y | **P+F** (paths.js:41-48 `_anchorPosFor`, store setPathAnchorHeight:289) | — | |
| Tangent handles + break symmetry (`movePathHandle` @5532760 in/out mirror unless break) | drag handles; alt breaks | **P+F** (store.js:297; paths.js handles) | — | |
| Path speed / gait / aim editors (`updatePathItemSpeed/Gait/Aim` @5533050-5533300; gait list `Gzt` @4315179) | gait only for humanoids; aim travel/locked/subject | **P+F** (ui.js:580-584; segAim/subject) | — | |
| Finish-path UX (Finish button in edit row, `<2 anchors → remove item`, `finishPerformancePaint` @5532980) | edit row w/ Finish button under timeline | **STUB** | P2 | port: Esc/Enter finish (manipulate.js:561-562) — no visible Finish button (round-4 had editRow? no — never had; original `_editRow_109if_884`) |
| **Height-curve editor for cam-path** (`heightMove/pressCurvePoint/dragCurve/removeCurvePoint/scrubCurve` @5466360-5466900; `setPathHeightCurve` @5540379; eval `Q2r` 64-pt resample @4318946) | selecting a camera with a cam-path shows a curve editor (record-aspect framed): drag points/handles to shape height-over-time, seek-to-moment while dragging, remove points | **MISSING** | **P1** | the "camera path keyframe cannot adjust" complaint — port has per-anchor Y only, no curve; `heightAt/curveDisplayPoints` exist in curves.js:119-156 (eval side ready) |
| `shiftPaths` (move all paths of an object, @5534100) | nudge paths when object moves | **MISSING** | P3 | |
| 2D top-down plan canvas (`stage-plan` canvas @5502648; painter `SDr` @~5500400: grid, footprints, camera wedges, spotlight pools, paths, marquee, focus tips; viewportMode 3d↔plan @5786130) | full second viewport: pan/zoom/center-on/zoom-fit, click select, drag items, draw strokes → paths, drop components, camera frame rects | **MISSING** | **P1** | backlog item; port has no plan view (no "3D | 2D" switch) |

## 5. POSING & ANIMATION (humanoids)
Original: clip catalog `Lhe` @ **5063320** (46 clips w/ durations); facade pose flow @ **5793176–5793600**; agent `applyPose` @ **5327312**; mixer previews @**5118167-5119500** & **5129963**; rig drag @**5643799**; play session @**5530700-5531000**.

| Feature | Original evidence | Port status | Priority | Notes |
|---|---|---|---|---|
| 46-clip catalog + durations (`Lhe` @5063320, `XSr` map) | names + durations drive defaults | **P+F** (const.js:241 CLIPS — byte-exact list) | — | |
| Clip timeline items (`addClipItem` @5525480; editor: clip select + duration @5556560) | clips are TIMELINE actions; add default dur `N8=5` (@4319860); clip **change resets duration to clip length** `IDe` (updateClipItem @5534330, min `uVr`=.1) | **P+F** (ui.js:554 add, 592-594 editor, 623 resets dur on clip change) | — | parity |
| **How users pose a humanoid (original UX)** | Actions palette → Animate tab → 46 clip tiles w/ animated previews → click adds clip item to selected human / drag onto any human (`M5r` @5120036 + `vGt` @5069608 + tile @5127109) | **MISSING** | **P1** | port's inspector "Clip" dropdown changes the *rest* animation (an invented-but-useful affordance, equivalent to agent's `setObjectPose` path); the original's primary flow is tile→track | |
| Held pose = baked rig keyframe (`bakeRigPoseSegment` @5793269: addPerformanceTrack → addRigTransformItem → addRigKeyframe tS:0 joints; agent `N=` @5327312: sample clip offsets (`sampleClipRigOffsets` via `onSkeletonReady` @5862021) → bake, else `markPosePending` → `bakePendingPose` on rig load) | "make them hold X" → rig-transform item with 1 key at t=0 | **MISSING** | **P1** | port has no rig-transform creation UI, no sampleClipRigOffsets, no pending-pose queue |
| Rig-transform keyframes (`addRigTransformItem` @5526000; `addRigKeyframe` joint-merge @5531170; `addSampledRigKeyframe` samples current pose @5531200; `captureFocusedRigPose` @5536618) | pose keys persist after item end (`T2r` latest-wins) | **STUB** | **P1** | eval present (tracks.js:201-212; main.js:468); no creation/edit UI |
| Rig posing UX — joint spheres + drag (`setLiveRigDrag` @5643799: drag bone → `captureFocusedRigPose` on release; joint pick spheres (backlog: xqr r=.028); multi-joint Fzr) | drag joints in viewport while rig-transform selected | **MISSING** | **P1** | backlog item |
| Play session (gamepad-style control) (`startPlaySession` @5530700: pointer lock, WASD drives humanoid; `setPlayRecording/finishPlayRecording` capture samples @5530900; keymap `qzt=["lmb","rmb","q","e","r","f"]` @4315236; play editor key slots w/ drag-drop clip bind @5557650 `gVr`) | "Play" tile → possess a human, run around, keys trigger clips; recorded as `play` item samples (20 Hz `qA`) | **MISSING** | P2 | eval of play items present (tracks.js:93, 450); no session/keymap/recorder UI |
| Clip fade/rest behaviour at playback & rest (`b()` applyClip wall-clock; rest paused t=0) | exact AWr port | **P+F** (figures.js HumanoidRig — round-5 rewrite) | — | complaint "pose doesn't apply" FIXED at HEAD (was: rest never re-applied; now objects-store subscription applies at rest) |
| Gaze/head aim (jZt gazeSplit; simple_figure headRotation) | head tracks aim subject | **P+F** (tracks.js:125-148, main.js:515-537) | — | |
| Humanoid GLB + label sprites (`humanoid-B4Yewrzp.glb` @bundle; labels) | | **P+F** (objects.js:271-286, 509-533) | — | |

## 6. CAMERA SYSTEM
Original: camera store `nTr` @ **5143823–5147000** (dump `gap5/camera_store.js`); camera settings UI `wVr` @**5556960**; cam-move math @3918160; aspects `Zae` @3920360.

| Feature | Original evidence | Port status | Priority | Notes |
|---|---|---|---|---|
| Camera objects + GLB marker + 16-pt frustum (`mie/urt`) | marker w/ frustum at page focal/aspect | **P+F** (objects.js:289-343; main.js:577-624) | — | |
| Through-the-lens "Cameras" view (stageView cameras → viewfinder render of focused/selected camera via `evalCameraObject`; `startFilming` sets camera mode @5143823) | viewport becomes the camera's evaluated view | **STUB** | **P1** | port "Cameras" only draws the frame guide + sets fov on the ORBIT camera (ui.js:193-220); never adopts evaluated camera pose — no real preview |
| Focal length control (`setFocalLengthMm` @facade 5795300; inspector mm field + PIP slider log-interp 14–200) | page-level focal | **P+F** (ui.js:258 focal per camera + camFooter lens slider log-interp ui.js:371-387) | — | port focal is per-object + page sync — OK |
| Aspect ratio select (`Zae` 16:9/9:16/1:1/4:3/1.85:1/2.39:1 @3920360; UI select @5557420) | page recordAspect | **MISSING** | **P1** | port `page.recordAspect` exists (store.js:365) but **no UI to change it**; guide always renders loaded aspect |
| Handheld shake select (`cameraShake` off/subtle/medium/heavy @5556980 `xVr`; apply `Dzt/oEr` camera rigs `gq` — tripod/gimbal/steadicam/handheld/run/drone @const) | shake applies to camera eval during playback | **STUB** | **P1** | port stores `shake` per camera (ui.js:259) and has rig constants (const.js:202-207) but **never applies it** (backlog: shake apply Dzt/oEr) |
| cam-move items: 8 moves + presets (`bP` @3918160; `_1` defaults; editor move/subject/aimOffset/angle/direction/heightDelta/distanceScale/duration + dolly_zoom focal @5556460-5557120) | full parametric camera moves | **P+F** (tracks.js:233-371 eval; ui.js:596-602 editor) | — | port editor missing **aimOffsetUnits** (Aim height `Nit` @5556440) + dolly_zoom focal field (P2) |
| cam-still w/ subject framing (`Cit`/`subjectAimPoint` + aim offset `$6`) | stills aim at subject | **P+F** (tracks.js eval; ui.js:604-606 subject select) | — | |
| cam-follow (`objectId` + offset UI @5556750; `LHr`/followOffset eval) | follow a walker w/ offset | **STUB** | P2 | eval yes (tracks.js:335); editor has object select only — **no offset UI** (backlog) |
| cam-transform keys (position/rotation/focal; `addCameraKeyframe` @5526330; cluster capture) | keyframed camera moves | **STUB** | **P1** | eval + capture button yes; no diamonds/cluster/navigation (regression) |
| cam-manual ("Film with phone" — fly camera, samples recorded; `armPhoneFlight/flyManualSegment` facade @5795400; `startManualFlight` @5526040) | fly w/ WASD → samples → cam-manual item | **MISSING** | P2 | port cannot create cam-manual items; manual flight ported? — no |
| reaim on subject change (`reaimCamera/reaimCameraItem` @5526500) | subject change → re-aim camera/target | **MISSING** | P3 | |
| `setCameraFocus` (focus subject / clear w/ keep-look @5533700; `cameraFocusId` badge) | "look at" override creating cam-still subject | **MISSING** | P3 | port cam-still subjectId covers most |
| `setWalkerFocus` (walker aim subject @5534150) | | **P+F** via path aim=subject (ui.js:581) | — | |
| Frame guide (record-aspect overlay + fov adoption `o2r/MGr`) | | **P+F** (ui.js:193-220) | — | |
| Camera pills / height+lens footer (canvas scene-editor panel B) | | **P+F** (ui.js:353-389) | — | |
| PIP preview windows (per-camera live canvas, lock, screenshot, record, phone, resize @DOM_REFERENCE `_previewWindow`) | floating live previews in edit view | **MISSING** | P2 | |
| Record → takes (`toggleRecording/startHubRecording/beginRecording/captureRecording/settleRecording/finishRecording` @camera store 5143823+; outputs, review, save/discard `saveVideo/saveAllVideos/discardOutput` facade @5806500-5807100) | MediaRecorder take filming of take-range, multi-cam hub recording, review dialog | **MISSING** | P2 | offline port could record via `MediaRecorder` locally — currently nothing |
| Screenshot (`captureViewport/captureCameraImage` @5143823; `screenshotCamera` saves PNG node @5806770) | PNG export to canvas project | **MISSING** | P3 | could be local download; server-save part N/A |

## 7. LIGHTING
| Feature | Original evidence | Port status | Priority | Notes |
|---|---|---|---|---|
| Sun puck popover (azimuth/elevation, presets, scrub) | | **P+F** (ui.js:126-190) | — | |
| Daylight 8-stop table + sky + fog | | **P+F** (env.js) | — | |
| **Spotlight shadows** (shadow slots `e6r`, cookie `iOr`, cone `Rhe`, beams `oOr` @objects-store region) | first N spotlights cast shaped shadows | **P+F** (objects.js:345-464 — round-5 exact port) | — | **complaint "spotlight doesn't create shadow" FIXED this round** (was: degrees/radians clamp bug + intensity ÷100 → 172° cone, 32× dim; now exact, verified pool + cube shadow) |
| Spotlight "shadowless" hint when out of slots (`jNG72M` @5557810) | hint in inspector | **MISSING** | P3 | port has `spotShadowSlots` count but no hint |
| Night lantern glow (`eKt` name-based emissive) | | **P+F** (finish.js/objects.js glowsByName) | — | |

## 8. VIEWPORT & NAVIGATION
| Feature | Original evidence | Port status | Priority | Notes |
|---|---|---|---|---|
| Orbit/pan/zoom + floor clamp + polar limit | | **P+F** (main.js:787-856) | — | |
| Wheel classify zoom-vs-orbit/pan by control mode (`Vzr`; default=orbit, unreal=pan @5651892) | | **P+F** (main.js:822-856) | — | |
| WASD fly (Q/E up/down, Shift sprint) | | **P+F** (main.js:801-820) | — | |
| Nav ball pad (drag → fly 4 m/s, visual rolling ball `lZr` @facade navBallVector 5788700) | | **MISSING (regression)** | **P1** | dead button at HEAD |
| Lasso box select (right-toolbar toggle `br/Nr/ua`; editInteraction "lasso" @5786260) | | **MISSING (regression)** | **P1** | dead button at HEAD |
| Selection footprints + hover disc | | **P+F** (selection.js) | — | |
| Stroke ring (silhouette outline) | | **P+F** (stroke.js) | — | |
| Finish composer (SSAO/blur/composite) + auto-measure + pref | | **P+F** (finish.js, main.js:702-760) | — | |
| Custom gizmo meshes (Mzr/Pzr/Nzr) | | **MISSING (regression)** — stock gizmo recolored | P3 | |
| Onboarding coach-marks (`onboardHighlightId/ScreenPos` @facade 5806400; onboarding @5417642; data-onboard-target everywhere) | first-run spotlight tour, replay from help | **MISSING** | P3 | port has the data attributes but no system (fine offline) |
| Controls cheatsheet dialog ("?" key @5388727; `bPr` @5384784 — device+controlMode tables, Replay onboarding, Watch tutorial, Copy scene JSON) | help dialog | **MISSING** | P2 | |
| Preferences dialog (`yPr` @5385920 — input device mouse/trackpad, control mode default/unreal, Finish toggle) | settings gear | **STUB** | P2 | port has modeSwitch Default/Unreal (ui.js:42-47) + finish auto-measure; no dialog, no device setting, no finish toggle UI |
| Control-mode prompt (audience picker default/unreal `pPr` @5379856) | first-visit modal | **MISSING** | P3 | |
| Input-device-dependent bindings (`iKr` mouse/trackpad wheel semantics) | | **MISSING** | P3 | |
| Right-drag free-look (backlog; `Dqr` anti-jitter) | | **MISSING** | P3 | |
| Dot cursor / crosshair draw cursor (`mGr`, plan `cye` @5497600) | cursor changes in draw mode | **MISSING** | P3 | |

## 9. SELECTION & MANIPULATION
| Feature | Original evidence | Port status | Priority | Notes |
|---|---|---|---|---|
| Click select, multi-select, click-empty deselect (`ua`) | | **P+F** (manipulate.js) | — | |
| Transform gizmo w/ mode rules (track-driven → translate; camera scale → translate `F()`) | | **P+F** (manipulate.js:62-114) | — | |
| Drag-commit pipeline (`SZt`: refusal for camera/target under manual/path items; `kZt` free commit + transform-key capture; keyed-camera capture) | drags on driven objects become keyframes | **P+F** (manipulate.js _commit) | — | round-2 port |
| Duplicate-on-alt-drag in viewport (`duplicateObjectAt` @5643978) | alt-drag clones object at cursor | **MISSING** | P2 | |
| deleteFocused priority (keyframe→item→track→object @facade 5810960) | context-sensitive Delete | **STUB** | P2 | port: objects only (+path anchor in paint) |
| Keyboard: ⌘Z/⌘⇧Z/⌘Y, ⌘C/⌘V, ⌘G, Del, Esc, F, Z/X/C tools, Space rehearse (`Hzr`) | | **P+F** except Space (manipulate.js:538-576) | P3 | |

## 10. FILE OPS / PERSISTENCE
| Feature | Original evidence | Port status | Priority | Notes |
|---|---|---|---|---|
| Scene JSON save/load (`toSceneJson/loadSceneJson` facade @5807500; `s6r/iGt` codecs + migrations) | server project; migrations v4-v10 (`f6r`) | **P+F** (schema.js normalize/load/save + migrations; ui.js:50-64 file open/save) | — | offline substitute: file + autosave (main.js:219-235) |
| Copy scene JSON to clipboard (help dialog @5807150) | | **MISSING** | P3 | |
| Autosave/restore | (server autosaves) | **P+F** (localStorage) | — | |
| Sample scene loading (`?scene=`) | n/a | **P+F** (index.html:117-121) | — | |
| Scene name editing (top bar editable name) | | **P+F** (ui.js sceneName input) | — | |

## 11. PANELS, DIALOGS, SHELL
| Feature | Original evidence | Port status | Priority | Notes |
|---|---|---|---|---|
| Right dock: Actions + Properties + Components columns, resizable (`ore` panel layout @5812900: leftWidth/rightWidth/chatWidth/bottomHeight, persisted) | drag-resize edges, hide columns (`componentsHidden`) | **STUB** | P3 | port panels fixed; Actions column missing entirely (§2) |
| Inspector = Properties (§1 rows) | | **STUB** | **P1** | missing: color row, person-kind switch, rotation-as-degrees/vertical-aim for cameras, drivenBy hint, live-pose |
| Multi-scene tabs (`_sceneTabs`: + Add scene, per-tab Send to canvas/Duplicate/Delete; `activeSceneId` @facade 5794340; `enterSceneNode/leaveSceneNode` @5786118) | multiple scenes per project | **MISSING** | P2 | single scene in port |
| Scene thumbnails (`screenshotEpoch` @5806400; scene node still img) | auto-captured still per scene | **MISSING** | P3 | |
| Chat/agent panel (`data-testid chat-*`; stage_show/stage_object/stage_camera/stage_read command schemas @5313308; applyPose @5327312) | AI scene editing | **N/A** (offline) | — | store APIs it drives are largely ported; applyPose/bakeRigPoseSegment flow is the posing gap (§5) |
| Top bar: project name, Story/Canvas/3D Stage/Video Editor tabs, Share, credits, notifications, Flickpedia, style button | product shell | **N/A** | — | |
| Assets button (media library drawer @7568677) | server media | **N/A** | — | |
| Toasts/loading/errors (`ot` Q1 @3918160) | | **P+F** (app.toast ui.js:14) | — | |
| Compiling overlay (`stage-compiling-overlay` @5514894 — scene build animation) | AI build feedback | **N/A** | — | |

## 12. MISC / ENGINE PARITY
| Feature | Original evidence | Port status | Priority | Notes |
|---|---|---|---|---|
| Track eval (all 14 kinds, fold modes, pacing `khe`, heightCurve resample `Q2r`, gaze, cam rigs `gq`) | @4318946+ | **P+F** (tracks.js/curves.js) | — | shake apply is the missing piece (§6) |
| Placement solver core (pack/bump `lje/Xne/oje/W5r/MP`) | | **P+F** (schema.js packItems:242) | — | without magnet/preview niceties |
| Migrations v4→v10 | | **P+F** (schema.js) | — | |
| Prop catalog (1439) + clay materials + 13 procedural builders | | **P+F** | — | |

---

## USER COMPLAINTS — VERDICTS

1. **"pose (clip) doesn't apply"** — **FIXED at HEAD** (round 5: HumanoidRig exact AWr port; objects-store subscription applies `animation` record at rest; verified dance@0 held at rest, 0 T-pose frames). *Residual gap:* the original's primary posing UX is the **Actions palette Animate tab** (46 live-preview clip tiles, click/drag onto a human) + **held-pose baking** (`bakeRigPoseSegment` rig-transform w/ tS:0 key) + **play sessions** — none of which exist in the port (§5, P1). The port's inspector Clip/Playing dropdown is an extra affordance, not the original's flow.
2. **"walk path / camera path keyframe cannot adjust"** — **PARTLY REGRESSION, PARTLY NEVER-BUILT**: keyframe diamonds (round 4) were **deleted by the round-5 commit** — restore. The **cam-path height-curve editor** (curve with draggable points + scrub-to-moment, @5466360) **never existed** in the port — build. Path anchor editing itself (move/insert/delete/height/handles) is functional.
3. **"many menu/button no-op"** — at HEAD the **Lasso button and Nav-ball pad are dead** (round-5 regression); Aspect-ratio select, color picker, person-kind switch, undo buttons are absent rather than no-op; everything else in the port's chrome is wired (Light/Rehearse/viewSwitch/modeSwitch/Open/Save/Add grid/hierarchy/timeline/prop picker/cam pills/footer/segment inspector).
4. **"spot light doesn't create shadow"** — **FIXED this round** (exact oOr/iOr/e6r: degree-first clamp, ×2.4 intensity, slot budget, cookie; shadow map verified).

---

## TOP 20 GAPS BY USER IMPACT (ranked)

1. **P0 process: re-merge round-4 timeline/lasso/navball code lost by commit `a55a900`** — restore `place.js`, `takerange.js`, `navball.js`, round-4 `ui.js`/`store.js`/`manipulate.js`, then re-apply round-5 fixes. (Unblocks #2–#6.)
2. **Keyframe diamonds UI** (transform/cam-transform/rig-transform): select+seek, drag-move, delete, prev/next cluster — the direct "cannot adjust keyframe" complaint.
3. **Actions palette** (Move/Animate/Camera tabs, search, 46 clip tiles with animated previews, click/drag-to-add, per-tile gating) — the original's central "make things happen" surface.
4. **Cam-path height-curve editor** (curve points + scrub + remove; writes `heightCurve` — eval already ported).
5. **Through-the-lens Cameras view** — render from the focused camera's evaluated pose (eval already ported; just drive `app.camera` + hide aids).
6. **Aspect-ratio picker** (6 presets, drives frame guide + fov + record size) — trivial UI on existing `page.recordAspect`.
7. **Held-pose baking + rig-transform creation** (`bakeRigPoseSegment` flow + "add rig-transform" menu + key-at-playhead capturing live joints via `addSampledRigKeyframe`).
8. **Rig posing UX** — draggable joint spheres on selected rig-transform segment.
9. **Shake apply** (Dzt/oEr rigs: tripod/gimbal/steadicam/handheld/run/drone; constants already in const.js).
10. **Lasso select** (restore — dead button today).
11. **Nav ball** (restore — dead button today).
12. **Take-range tool** (restore — Record films the range; `show.range` schema still supported).
13. **Trim handles + magnet toggle + alt-drag duplicate** (restore round-4 polish).
14. **Object color picker row** in inspector (engine fully supports it).
15. **Person-kind switch** (Figure ↔ Humanoid) with action-conflict dialog.
16. **Spawn grid 5×6 + default name counters + camera aim-at-origin** (objects stack at origin today).
17. **Play sessions** (possess a human, WASD + keymap clips, record samples — eval already ported).
18. **2D plan canvas** (top-down painter: footprints, camera wedges, draw-direction→path, marquee).
19. **Rotate/revolve/scale segment editors + cam-move aimOffset + dolly_zoom focal + cam-follow offset UI** (fields exist in eval/store, editors missing).
20. **Recording/takes** (local MediaRecorder take of take-range → webm download; PIP preview windows) — the port's biggest "original can do this" delta after editing flows.

*N/A by design (offline):* chat/agent, server auth/billing/projects, Share, scene-node canvas integration, film-with-phone (WebRTC), Assets media library, onboarding analytics.

### Quick port-side inventory (for the next session)
- 15 modules, 6,195 LOC; eval layer (tracks/curves/schema) near-complete incl. play/rig-transform/heightCurve/cam-rigs; render layer (finish/stroke/selection/env/objects) exact; UI layer is where nearly all gaps live (`ui.js` 705 L vs original's ~10 UI subsystems).
- Dead HTML at HEAD: `#btnLasso`, `#lassoBox`, `#navBallPad` (index.html:52-55).
- Missing UI for existing state: `page.recordAspect`, object `color`, `shake` (apply), rig-transform/play/cam-manual creation, `heightCurve`.
