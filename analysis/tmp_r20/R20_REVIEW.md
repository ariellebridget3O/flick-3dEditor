# R20 CODE REVIEW — read-only

Scope: `git log 2e9c5ce..HEAD` (L5 cursor, L2a light-setter deferral + sky bake split, L2b
sun disc/rail redesign, L1 sky bloom, L7 walk-look family, L4 feed wall, L6 height strip,
L3 Daylight track). ~2500 changed lines across editor/js/{main,ui,manipulate,env,sky,tracks,
figures,schema,store,plan}.js + css. All line numbers from HEAD (d014f53).

## VERDICT: **SHIP-WITH-FIXES**

The core pipelines are sound and, in several places, exemplary: the effLight purity contract
(L3-1) holds everywhere I could attack it; the schema v13 round-trip and the no-track
byte-identity hold; the svDirty/lutDirty split and the PMREM stillness gate are correct in
every ordering I traced; the L1 gains are correctly excluded from the PMREM bake (critical
now that the realistic gain is 80×); the L6 strip's mount/guard design and the L7 composed
look path match their bundle references. The fixes required before ship are all in the two
newest surfaces — the feed wall's render/DOM state machine (4 findings) and one carried-over
CSS transition that still makes the redesigned sun control *visually* lag — plus two
authoring-semantics issues in the Daylight track.

---

## P1 — fix before ship

### P1-1. Feed wall: EMPTY GRID CELLS are never dark-cleared — the editor scene shows through (4 or 5 cameras)
`editor/js/main.js:1497-1516` (`renderCamWallTiles`, gap-band loop)

The dark "letterbox" clear is computed **per tile**, around that tile's own cell
(`cx/cy` from the tile's center). With `pageIds.length === 4` the layout is 3 cols × 2 rows
(`cols = 3` for length > 2, `rows = ceil(4/3) = 2`) → 6 cells, 4 tiles → **cells (r1,c1) and
(r1,c2) have no tile and are never cleared**. The full-canvas editor render from earlier in
`renderFrame` (line 1809) remains visible there: the "monitor bank" shows the live editor
scene through two empty slots. Same with 5 cameras (1 empty cell). Counts 1, 2, 3, 6 are
full grids — which is exactly what every probe used (r20_l4_probe* only ever built 1–3
cameras), so no gate saw it.

**Required fix:** replace the per-cell band math with one full-canvas dark clear before the
tile loop (this also fixes the fractional-`setScissor` 1px seam risk from the
`Math.round`-ed tile rects vs fractional `cellW`):
```js
r.setScissorTest(true);
r.setClearColor(0x0a0d14, 1);
r.setScissor(0, 0, size.x, size.y);
r.clear(true, false, false);   // whole bank dark; tiles overwrite their rects next
```
then delete the `cellW/cols/rows/cx/cy/gaps` block. Nothing else on the canvas needs
preserving (the nav ball draws after, `drawOverlays` at main.js:1815).

### P1-2. Feed wall not gated on the 2D plan view — wall chrome overlays and click-blocks the plan
`editor/js/main.js:1332` (`camWallActive`), `1334-1341` (`updateCamWall`), `editor/css/app.css:679`

`camWallActive()` gates only on `stageView==='cameras' && mode==='edit'`. `viewportMode` is
an independent axis (`planSwitch`, ui.js:70-80), so **stageView 'cameras' + 2D plan** is a
reachable state with no writer hiding the wall: `_frame` returns early at main.js:1702
before `renderFrame`, but `updateCamWall` (step 6b, main.js:1666) has already run, leaving
`#camWall` (`z-index: 30`, above the plan canvas's `z-index: 2`) visible over the plan with
frozen tiles, the pager, the count and the "No cameras" text. Worse than cosmetic: the tiles
keep `pointer-events: auto` (app.css:680), so plan drags/clicks inside tile rects are
swallowed by the tile click handler (select camera + flip stageView to 'editor') instead of
reaching the plan canvas. No E2E covers this combination.

**Required fix:** hide the wall in plan view the same way the inactive branch does — in
`updateCamWall`, treat `this.page.viewportMode === 'plan'` like `!active` (display:none +
`this._wallLayout = null`), or add the viewportMode term to `camWallActive()` (then also
guard `renderFrame`'s `wall` read at main.js:1779, which already null-checks via
`camWallActive()`). One line + a state-machine comment.

### P1-3. Wall render state machine is not exception-safe — renderer/GL state and hidden labels leak on throw
`editor/js/main.js:1531-1535` (tail of `renderCamWallTiles`), `1803-1810` (`wallRestore` in `renderFrame`)

Both wall passes hide objects and mutate renderer state, then restore **only on the success
path**:
- `renderCamWallTiles`: `setScissorTest(true)`, per-tile `setViewport/setScissor`, optional
  ACES toneMapping override, dark clearColor, plus ALL label sprites + TransformControls
  hidden (main.js:1491-1498). If any `r.render` throws (shader/material error, context
  loss mid-pass), the next frames render with scissor test ON, a tile-local viewport, the
  wrong tone mapping and — worst — **labels and the gizmo permanently invisible** (they are
  re-hidden each frame by the wall pass, which then throws again).
- `renderFrame` single-tile path: `wallRestore` (mesh/labels/gizmo) runs after
  `updateRealisticSky` + `finish.render`/`renderer.render` (1806-1810) with no `finally`;
  the frame loop's `try { renderFrame() } finally { restoreShake() }` (main.js:1711) covers
  only the shake.

**Required fix:** wrap each pass body in `try { … } finally { <existing restore block> }`.
For `renderCamWallTiles` move lines 1531-1535 into a `finally`; for `renderFrame` change
`if (wallRestore) wallRestore();` to a `finally` around the render calls (or set
`wallRestore` before the first render and call it in a `finally`).

### P1-4. Sun disc/rail knob still *visually* lags the drag ~220 ms — the base CSS transition was carried into the redesign
`editor/css/app.css:125` (`.light-panel .knob { … transition: left .22s ease, top .22s ease; }`),
`app.css:136` (`.rail-handle { … transition: top .22s ease; }`), `editor/js/ui.js:479-497` (`render()`), `667` (preset glide)

L2a freed the input path and the bake path, but the knob/handle glyph itself eases: every
pointermove writes `style.left/top` (ui.js:462-471) against an **always-on** `.22s`
transition, so the control low-pass-filters the pointer and trails by roughly its time
constant — on the exact control the round was scoped to de-lag ("lags behind severely").
The `.gliding` class (ui.js:667) proves instant tracking was the intent (a transition
*added* for presets only); it is also broken by the base transition: `render()` removes
`gliding` on the very next yawLoop frame (ui.js:497), which retargets the running preset
animation, and a preset that lands on the same elevation never fires `transitionend` at
all. The transition is an r6 leftover (`git show 2e9c5ce:editor/css/app.css:127`) that L2b
copied forward into the rebuilt controls. The E2E asserts values ("disc drag az 129→233"),
not glyph tracking, so no gate can see it.

**Required fix:** remove the `transition` from the base `.knob` and `.rail-handle` rules;
keep it only under `.gliding`. Additionally, since `render()` strips `gliding` per frame,
gate that strip on the drag state (`if (!dragging) dirKnob.classList.remove('gliding')`)
and also clear `gliding` on `dragStart` so a preset glide never bleeds into the next drag.

---

## P2 — fix soon (edge cases, missing restores, semantics)

### P2-1. `lightAtTime` nightLights steps at the *interval start*, not "at the later key" — lamp keys act retroactively
`editor/js/tracks.js:275` (`…(b.nightLights !== undefined ? { nightLights: b.nightLights } : {})`)

Inside an interpolation interval (a, b) the function returns **b**'s nightLights, so the
value changes at **a.tS** — the *previous* key's time. Keys: `k0(t=0, nl unset)`,
`k1(t=4, nl:false)` → lamps read OFF from t≈0, not from t=4. The doc comment
("nightLights STEPS at the later key", tracks.js:258) and the capture flow both describe
the opposite: `captureLightKey` (main.js:1132-1141) writes a key AT the playhead carrying
the current lamp state, and the natural reading of "I toggled lamps off here" is that the
step happens when the playhead reaches that key. Since `captureLightKey` always writes
`nightLights` explicitly, every captured lamp toggle also flips the lamps for the whole
preceding interval. No E2E exercises a two-key lamp sweep (r20_lighttrack_e2e has no
nightLights playback assertion).

**Required fix:** in the interval branch return the *earlier* key's value:
`…(a.nightLights !== undefined ? { nightLights: a.nightLights } : {})`. (First-key hold
before `first.tS` and the last-key hold after `last.tS` already behave correctly.)

### P2-2. Wall view leaves editor chrome rendered-but-dead under the tiles (and draws an un-draggable nav ball on the feed)
`editor/js/ui.js:2123-2126` (pad/lasso gating — the only stageView-aware hide), `editor/js/navball.js:150` (`visible()`), `editor/css/app.css:679` vs `.right-toolbar`/`.cam-pills`/`.shade-switch` (z 5-6)

The wall container sits at `z-index: 30`, above the right toolbar (Actions/Snap, z6), the
camera pills (z5) and the shade switch (z5). In the wall view those stay rendered but are
covered and **click-blocked** by tiles (pointer-events auto) — with 6 cameras or a single
full-canvas tile they are entirely unreachable, and clicks on them select a camera and exit
the view instead. Meanwhile the nav ball's DOM pad IS hidden in the wall (ui.js:2124-2125)
but `navBall.render()` still draws the ball on the canvas every frame (navball.js:150
gates only on `mode==='edit' && !playing`; called unconditionally from `drawOverlays`,
main.js:1827) — a dead, un-draggable ball composited over the top-right tile, contradicting
the "multi-tile monitor feeds are clean" contract in the renderFrame comment (main.js:1813).

**Required fix:** (a) add `page.stageView !== 'cameras'` to `visible()` in navball.js:150;
(b) extend the ui.js:2123 subscribe block to also hide `#rightToolbar` (Actions + Snap),
`#camPills` and `#shadeSwitch` while `stageView === 'cameras'` (the same pattern the plan
view uses in `_syncShown`, plan.js:1410-1417).

### P2-3. `beginLightGesture`'s adopt silently mutates the persisted scene light (no autosave, no undo)
`editor/js/main.js:1114-1123`, callers `editor/js/ui.js:599/612` (disc/rail), `1108` (inspector)

With a light-transform segment selected, *every* disc/rail `pointerdown` first copies the
track's playhead az/el into `this.light` (the documented "knob never jumps" snap). If the
gesture then writes nothing — a click without movement, or an aborted drag — the scene
light keeps the adopted values with **no `markAutosave` and no undo entry** (this.light is
outside the show store, so the gesture bracket can't revert it). The next unrelated
autosave or a manual Save persists the adopted sun as the scene's rest light, silently
diverging from what the user last authored. Undoing the captured key likewise leaves the
adopted scene light behind (undo covers only the show store).

**Required fix:** in `beginLightGesture`, stash the pre-adopt `this.light`; in
`endLightGesture`, restore it when the gesture produced neither a `setLightCustom` write
nor a captured key (e.g. track a `_lightWrote` flag set by the setters while
`_lightLive`, or compare az/el against the adopted snapshot). Minimum acceptable: call
`markAutosave()` in `beginLightGesture` when the adopt actually changes a value so the
mutation is at least persisted deliberately.

### P2-4. The synchronous light setters apply the SCENE light, not effLight — one-frame sun snap while a Daylight track plays
`editor/js/main.js:195` (`setClouds`), `224` (`setAmbient`), `232` (`setNightLights`)

L2a kept these three synchronous (`applyDaylight(this.light)`, by design L2a-1). During
playback/scrub/rest-eval of a Daylight track, `effLight()` differs from `this.light` in
az/el; every `input` event on the ambient slider / a clouds toggle / a night-lamps toggle
applies the scene az/el — the memo key flips, the sun/disc/shadows jump to the scene value
for one frame — then the frame loop's step-5 `applyDaylight(this.effLight())`
(main.js:1657) flips it back. Visible flicker of the animated sun on each slider tick.

**Required fix:** pass the effective light in the three synchronous applies:
`this.env.applyDaylight(this.effLight())`. (During a light gesture `_lightLive` makes
effLight === this.light, so the capture path is unaffected; the r18 T2/T3/T4 synchronous
reads are stats-only and identical in both.)

---

## P3 — nits / polish (non-blocking)

1. **Stray-click key capture** — `dragEnd` (ui.js:616-623) calls `captureLightKey`
   unconditionally: a click-without-move on the disc/rail with a light segment selected
   lands a redundant key holding the interpolated value (visually a no-op, but it pins
   `nightLights` explicitly and clutters the key list). Consider a movement threshold
   (≥1° az or el delta) before capturing.
2. **Wall tile names go stale on rename** — `_syncCamWallDom` writes `name.textContent`
   only inside the rebuild-key branch (ui.js:1400-1409); a renamed camera keeps the old
   label until the page/tile set changes. Also `focal`/`count` `textContent` are rewritten
   every frame even when unchanged (per-frame DOM churn) — early-out on value equality.
3. **Wall per-frame allocations** — `renderCamWallTiles` allocates a `new THREE.Color()`
   per call for `getClearColor` (main.js:1483); hoist to a module scratch like `_bufSize`.
4. **Track-less single-tile fov aspect inconsistency** — `_wallCameraFor`'s fallback
   branch recomputes fov at the CANVAS aspect (main.js:1450) while the evalPose branch uses
   the RECORD-aspect-evaluated `pose.fovDeg` (main.js:1446). Both match certified behavior
   individually (the fallback mirrors the base TRS contract; the pose branch is the old
   lens / m1 contract), but they disagree when canvas ≠ record aspect. Worth a comment at
   minimum.
5. **Keys beyond a trimmed duration** — trimming a light-transform (or any KF kind) below
   the last key tS leaves the keys in place; the lane diamonds clamp to the block's right
   edge (`clampPx`, ui.js:1609) and pile up. Pre-existing pattern for all KF kinds — noting
   because light segments are new and frequently trimmed.
6. **`deleteSelectedKeyframe` vs the dead half-state** — `detachReferences`
   (store.js:1112) nulls `subjectId` without resetting `aim`, recreating
   `{aim:'subject', subjectId:null}` — inert (all gates read aim ∧ subjectId; the combobox
   displays Travel) but it is the exact byte-pattern D1 set out to kill. A one-word patch
   (`patch = { ...patch, subjectId: null, aim: 'travel' }` for path kinds, or leave as
   live-verbatim) plus a comment would close the loop.

---

## Verified sound (attacked, not just read)

- **L3 effLight purity (L3-1):** `effLight` (main.js:1086-1097) never writes `this.light`;
  the frame loop (1657), shadowFit (`getLight: () => this.effLight()`, 251), the popover
  render (ui.js:484) and `captureLightKey` all read it. The track evaluation path has no
  `markAutosave`, no apply. No-track → `lightKeysAt` null → byte-identical `this.light`.
  Gates (`playing || scrubbing || _restEval`) exactly mirror `evaluateAt`'s call sites;
  steady rest / stop / load revert to the scene light with nothing to reset.
- **L3 capture bracket:** keys land once per gesture on `endEditGesture`/`dragEnd`, not
  per-move; `_replaceKeyAt` (store.js:830-846) gives KEY_EPS replace-dedupe, sorted keys,
  duration auto-extend; undo rides the show-store gesture (the key write is the only
  show-store mutation in the bracket). `addLightKeyframe` (862-869) re-normalizes az/el.
  Schema v13: v12→v13 no-op + the `t.v===12/13` accept arms, `normItems` az-mod-360 /
  el-clamp / sort / 0.01 s dedupe with later-key-wins, keys survive at any count.
- **L2a bake policy:** the 5 setters are store-write-only; the single per-frame apply at
  main.js:1657 runs before the plan early-return (so plan/paused/camera-mode all covered);
  `loadSceneData`/autosave-restore need no apply (next frame covers, memo-key correct on
  identical reloads); the finishOn flip is re-applied inside renderFrame (1756). The
  svDirty/lutDirty split (sky.js:694-715) is correct for first-call (atmK null → full
  bake), sun-only (svDirty), atmosphere-after-sun (atmK differs → full), and
  disable/enable cycles; `_lightChangedAt` init −1e9 makes the first PMREM immediate;
  idle-gated PMREM never misses a pending rebake (bakeSkyView re-arms `pmremPending`).
- **L1:** the 80× body gain applies at the LUT sample only; disc/moon/stars stay absolute;
  `bakePMREM` forces uHdrGain=1 for dome + cloud twin and saves/restores (sky.js:773-779) —
  essential at 80×; the classic `uHdrGain` is memo-key-covered (hdr fields + `|f` finishOn).
- **L4 happy-path state machine:** `renderCamWallTiles` restores scissor/viewport/
  toneMapping/exposure/clearColor and label/gizmo visibility on success; per-tile
  self-occlusion pairs `wasVisible` correctly; `_wallCam` is a single reused camera (no
  per-frame alloc); the DOM is one persistent root with delegated listeners (no leak), the
  rebuild key covers page flips and add/delete; `_wallPage` clamps on shrink;
  `_autoMeasure` threads `frameCam` for both drawPlain and drawFinished and keeps its
  aids-restore in a `finally`; `updateFrameGuide` writes the editor camera only in camera
  mode; `activeCameraId`'s selected-segment/track fallback is null-safe; the qqt modifier
  gate + keyup-by-key-and-code close the stuck-key holes; `syncViewSwitch` is state-driven
  off `page.subscribe`.
- **L7 composed path:** the combobox writes `{aim:'subject', subjectId}` atomically
  (`updatePathItemAim` for path kinds, `patchItem` for cam-path), travel keeps subjectId,
  cam-path's `value=""` maps to the paired target via `subjectlessItem`; `keyedHeadRotation`'s
  recursion strictly decreases startS (terminates on same-startS ties); the head-look loop
  passes the current split as the `t===timeS` override while the objects loop resolves J at
  any time; the D4 rigPoseObjectId gate, D5 local-quaternion curYaw, D3 gazeSplit guards
  (flat<1e-6 passthrough, π−|Δ| head clamp) and D2's explicit 'XYZ' extraction order all
  match their bundle citations; `headLooks` is cleared per evaluateAt.
- **L6:** the strip panel lives outside the rebuilt `#tlLanes` subtree; the
  `refreshTimeline` guard covers `_tl.interaction` and `plan.curveDrag`; content-space
  positioning survives scroll; `tick()` touches only the playhead line + disabled flag
  (page.changed does not fire during playback ticks); the lost-pointerup recovery listener
  is registered before the main handler; `holdCurve/releaseCurve` bracket one undo beat.
- **L5:** canvas-scoped cursor writes only (manipulate.js:697/700/741); plan sets its own
  cursor. No debug leftovers, no console noise; all changed files pass `node --check`.

## Test gaps worth adding (what the gates can't see)
1. A 4- and 5-camera wall frame (pixel assert: NO canvas pixel outside tile rects keeps the
   editor render — catches P1-1).
2. stageView 'cameras' + viewportMode 'plan' (assert `#camWall` hidden / plan clickable —
   catches P1-2).
3. A disc-drag glyph-tracking probe (knob style.left equals the pointer-implied position
   within one frame — catches P1-4).
4. A two-key nightLights playback sweep (assert the lamp value holds key-a's value until
   key-b's tS — catches P2-1).
5. An ambient-slider drag during Daylight playback (assert no sun az/el frame where
   `effLight` ≠ applied light — catches P2-4).
