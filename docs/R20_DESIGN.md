# R20 DESIGN — 7 user-feedback items

Research inputs (this round's ground truth, all in analysis/tmp_r20/):
- R20_DRAWPATH_LOOK.md — the walking-orientation pipeline + our D1–D7 divergences (issue 7)
- R20_CAMVIEW_HEIGHT.md — the two camera views + feed wall (issue 4); height ground truth (issue 6)
- R20_LIGHTTRACK_SUNUI.md — no light track in the original + the imitation design (issue 3); puck
  ground truth + lag root cause + redesign (issue 2)

Scope order below is implementation order (dependencies + risk first). Each layer ships with its
own E2E + commit + push. Classic-path byte-identity (pixel matrix 7/7) must hold through every
layer that touches render-affecting code.

---

## L5 (issue 5) — 2D view cursor disappears [trivial]

Root cause: `manipulate.js:741` writes the object-hover `cursor:'none'` on `app.container` (the
shared ancestor of BOTH the 3D canvas and the plan canvas). The original writes it on the 3D
canvas element itself (`@3880923 u.style.cursor=a&&!l?"none":""` — u = canvas ref). Switching to
the plan view never fires another 3D pointermove, so the container stays `none` and the plan
canvas (`cursor:''` = inherit) shows nothing.

Fix: write the hover cursor AND the lasso cursor on `el` (`app.renderer.domElement`) instead of
`app.container` (manipulate.js:697/700/741). Mirror-exact to the original; no plan-side change
needed (plan canvas already sets crosshair/pointer/'' itself).

## L2 (issue 2) — "day/night globe": redesign + lag fix

Two parts, both user-sanctioned deviations from the (faithfully-ported) polar puck.

### L2a. Input-path lag (the original's architecture — R20_LIGHTTRACK_SUNUI §2.D; audit-fixed)
1. `setLightCustom` / `setLightGeo` / `setWeather` / `setIndoor` / `setHdr` become STORE-WRITE
   ONLY (normalize + `this.light = {...}`): delete the synchronous `env.applyDaylight` +
   `shadowFit.force()` calls. The frame loop already applies `env.applyDaylight(this.light)`
   per frame (main.js:1407, unconditional incl. plan view/paused/camera mode) and
   `shadowFit.fit()` reads the live light with its fingerprint change-gate — the original's
   exact once-per-frame structure (audit-verified). `setHdr` keeps its finishPref/_bloom
   side effects (only the applyDaylight goes). **setSkyStyle / setClouds / setAmbient keep
   their synchronous applies unchanged** (r18 T2/T3/T4's synchronous stats reads depend on
   setClouds' chain — audit L2a-1).
2. Realistic-sky rebake deferral keyed on LIGHT-IDLE, not gestures (audit L2a-2/L3-4): a
   `noteLightChanged()` stamp written by applyDaylight's memo-key change (and callable from
   the setters/L3's evaluator); the bake gate becomes `now - _lightChangedAt >= 250` in
   `sky.update()` (threaded `main._frame → env.updateRealisticSky → realistic.update(...,
   {allowBake})` — setParams stays pure-uniform; audit L2a-3). Covers BOTH drags and L3
   playback; explicit playback policy: LUT bakes keep the 80ms throttle only when the sweep
   is measured cheap; PMREM defers while the light is animating and flushes on idle ≥250ms /
   pause / stop / endEditGesture. Classic mode is untouched (no LUTs). Torn state documented
   (audit L2a-5): during deferral the dome's direct uniforms are live; the LUT-driven body
   gradient + IBL trail ≤250ms.
3. Autosave stays debounced (already 1s). `lostpointercapture` → puckUp added in L2b
   (audit L2a-4).

### L2b. Control redesign (R20_LIGHTTRACK_SUNUI §2.F)
Replace the polar puck row with:
1. **Direction disc** (azimuth only): compass ring (N/E/S/W ticks), knob slides along the RIM
   (drag anywhere → az = atan2 from center; radius ignored). Keeps view-yaw rotation
   ("up" = camera heading, 0.5° adoption), pointer capture, Left/Right ±10°, aria-slider
   semantics on 0..360 with compass phase text.
2. **Height rail** (elevation only): vertical control −30..90 with a horizon line at 0, the
   moon zone (−8..−30) shaded, the 4 original preset stops marked (57.38/9/−4/−28), Up/Down ±5°.
   Phase label + az/el readout sit next to it.
3. **Sun → moon**: the direction knob + height handle flip to a moon glyph when
   `elevationDeg ≤ −8` (the original's exact `aSr` moon-handoff threshold). Knob position =
   `light.azimuthDeg` (the STORED value) always — `aSr` remaps elevation only, azimuth
   unchanged (audit L2b-2/3); no drag-math flip at the crossing. In realistic style the night
   key light arrives from the anti-solar azimuth (≈az+180, deterministic from az) —
   documented; the glyph flips, the knob does not jump.
4. Keep: presets row (elevation-only), geo ghost (ring marker on the disc + tick on the rail),
   night-lamps checkbox, `#btnLight` + the clouds/sky/hdr/geo section ids (harness contract,
   audit L2b-1). All writes still go through `setLightCustom` → `normalizeLight` (schema
   parity). Height rail displays/writes raw `elevationDeg` −30..90 always (the SETTING axis,
   not the remapped effective elevation).

## L1 (issue 1) — sky bloom retry

r19 pushed the sky body fully below the bloom threshold (delta +0.0 both styles) — the user sees
no HDR response in the sky at all. The r18 value (1.48) was a whole-sky wash. Target: a VISIBLE,
SOFT sky bloom — the brighter dome regions (near zenith / sun side) cross the threshold, the
horizon mostly doesn't → a gradient glow, not a flat lid.

1. `HDR_SKY_LIFT` 1.06 → calibrated so the classic body's UPPER half sits just above thr 1.0
   (start ~1.22; horizon 0.828×1.22 ≈ 1.01, brighter dome ≈ 1.13).
2. `HDR_REALISTIC_GAIN` 1.22 → proportional (~1.35) so the realistic body does the same.
3. Flare/disc/moon bloom (r19, working) unchanged.
4. Calibration is THROUGH the output transform (SKILL #101): sky-region (aimed pose, r19
   idiom) bloom-on vs bloom-off delta target **+2..+8 display luma**; wash guards: whole-frame
   p25 delta ≤ +2, floor-region delta ≤ +1.5. ACES flat-lid guard NUMERIC (audit L1-4):
   p99 sky-body display luma ≤ 241 AND no connected region ≥200px within ±1 of 243.
5. Update r19 E2E T6a/T6b to REGION-MASKED assertions (top-N rows at the aimed pose, not
   whole-frame means — audit L1-2) + the wash guards. **r18 T9a also updates** (audit L1-1,
   P0: it asserts classic sliver |Δ|<2 and WILL fail): same [+1,+9] window + guards. Flare/
   disc/moon re-baselined within ±20% (the flare value scales with the body lift — audit
   L1-3). Run the threshold sweep BEFORE committing the constant; constant + test updates in
   one commit. Matrix byte-identity gate must stay 7/7 (all changes finish+hdr-gated,
   audit-verified env.js:337/sky.js:807).

## L7 (issue 7) — draw-path "look is locked"

The engine works; the affordance is broken. Fixes (R20_DRAWPATH_LOOK D1 + engine gaps):

1. **P0 D1**: replace the split Aim/Subject dropdowns with the original's ONE "Look at"
   combobox (Gzr @5592450): options = Travel direction + KKt-filtered subjects (no
   cameras/spotlights/paired targets); 'locked' offered ONLY for non-person walkers; picking a
   subject writes `{aim:'subject', subjectId}` atomically; value display = subjectId ?? travel.
   Same control on cam-path sections (its subject list ADDITIONALLY offers the camera's
   paired-target marker — audit L7-2) + add the missing `Tot` Frame-offset (aimOffsetUnits)
   stepper (@5591676, aim!=='locked' only).
2. **P1 D2**: simple_figure walking head-look uses `ezHeadRotation(yaw, pitch)` (figures.js:227)
   instead of naive `[pitch, yaw, 0]` (main.js:904).
3. **P1 D3**: gazeSplit guards verbatim (tracks.js:125-136): the `horiz < 1e-6` early-out +
   the `Math.PI − Math.abs(delta)` headYaw clamp term (@5482972).
4. **P2 D4**: `rigPoseObjectId` gate in the head-look loop (main.js:867-870, @~5728740).
5. **P2 D5**: `curYaw` from LOCAL quaternion (main.js:822, pe @5733467).
6. **P2 D6**: keyed-head `w2r` lerp + `sinceS` precedence (main.js:885-906, xie/Xyr @3933882).
7. E2E: extend the walk-look harness (subject head-tracking through playback; combobox
   round-trip; non-person locked) + the figure-walker vertical-offset case BEFORE the D2
   commit (no existing coverage on those lines — audit L7-3).

## L4 (issue 4) — camera view navigation (the feed wall)

Our "Cameras" stage view is a through-the-lens viewport hijack (orbit off, per-frame re-pin,
frozen when nothing selected) — un-navigable. The original's cameras view is a **monitor wall**
(R20_CAMVIEW_HEIGHT §A1a: NJr @5862984 — paginated grid of 6 live per-camera feed tiles; the
editor camera is NEVER touched; tile click = select + focus + back to editor @5882274).

1. **P0**: rebuild the Cameras view as the feed wall. Grid of aspect-correct tiles (one per
   camera, paginated 6/page + page dots), each rendered from that camera's evaluated pose at
   its own focal + record aspect. **RENDER CONTRACT (audit L4-1, P0): per-tile viewport/scissor
   passes with the MAIN renderer INSIDE `renderFrame`** — no per-tile canvases/contexts;
   exactly-one-camera walls render that single tile FULL-CANVAS at the record aspect (the
   live's measured geometry, keeps pixel-oracle m1/m5 green with ZERO harness changes);
   pose/fov from `mesh.userData.evalPose` exactly as the lens did (incl. the shake branch +
   the editor camera's near/far), track-less cameras fall back to base TRS +
   fovFromFocal(focalLengthMm, recordAspect); 0-camera wall = empty grid + "0 of 0" pager.
   Tile chrome (DOM): camera name + focal; click = select + focus + stageView='editor'.
   Per-tile self-occlusion (audit L4-5): hide ONLY the tile camera's own mesh + frustum
   child; other cameras/labels stay visible (shrinks the known m1 residual). Delete
   `updateCameraThroughLens`. Editor camera + orbit stay live behind the wall (nav ball pad
   shows, matching original D11).
2. **P0**: stop forcing `stageView='editor'` on camera-mode entry (main.js:1752-1755). With
   the lens gone the entry is simply: (stageView untouched) → gizmo detach → orbit off → save
   `_editorPoseSave` → takeOver → fov → drive seed → hide mesh (audit L4-3). The wall's
   visibility gate = `stageView==='cameras' && mode==='edit'` (the live's `ne`) — hides in
   camera mode, RETURNS on exit. `updateFrameGuide`'s cameras-view branch is REMOVED (gate
   becomes `mode==='camera'` only — it must not touch the editor camera/fov from the wall;
   audit L4-2).
3. **P1**: viewSwitch segments become state-driven (subscribe to page.stageView).
4. **P1**: `focusedCameraId` fallback = selected camera ?? camera of selected segment/track
   (XHe @5475663) → feeds takeOver, focal readout, marker fov.
5. **P2**: key-set modifier gate (qqt) + delete-by-code (G/X @5679987/5680393).
6. **P3 batch**: unlock→J() re-aim hook; document/drop `_hideCameraMeshForMonitor`; edit floor
   clamp lifts orbit target (Fot @5638676).

## L6 (issue 6) — camera height into the timeline

The original has NO height row on the timeline (height = plan Height slider + the cam-path
height curve docked on the PLAN canvas, R20_CAMVIEW_HEIGHT §B1-B2). The user asks for the
timeline — sanctioned deviation; closest original pattern = the SegmentKeyframes layer
(@5192233) mounted inside the camera block.

1. **P0 fix regardless**: `heightMove` gains the selected-SEGMENT-first branch (@5488432) —
   selecting a cam-path segment on the timeline must reveal/adopt the height editor.
2. **The move**: when a cam-path item (or its lane) is selected, reveal a height-curve strip
   docked under that lane on the timeline — reusing the r8 `buildCurvePanel` SVG guts
   (already verbatim) as the strip renderer. **Mount OUTSIDE the rebuilt `#tlLanes` innerHTML**
   (a persistent absolutely-positioned overlay in `.tl-body` under the target lane row — the
   take-range overlay pattern; audit L6-1) + extend the refreshTimeline guard to
   `app._tl?.interaction || app.plan.curveDrag` so curve gestures never rebuild the lanes.
   Re-host specifics (audit L6-2): drop buildCurvePanel's `viewportMode==='plan'` AND
   `!playing` gates; u-domain retargeted to the item's block span (`u ↔ laneX + u·blockWidth`,
   the SegmentKeyframes @5192233 frame); playhead tick piggybacks updatePlayhead's per-frame
   run. Edit semantics identical (bezier handles → heightCurve; anchor-Y when no curve); the
   strip stays visible while playing (original disables, never hides). The plan-canvas
   floating popout is REMOVED (replaced by the timeline strip) — the plan-side loss is a
   documented divergence (audit L6-4); the plan drag-to-set-height gesture and the Height
   slider (camera object Y) stay as they are.
3. Undo/gesture brackets reuse the curve-panel's existing ones. The `heightMove` fix moves
   the `stroking()` gate to the TOP of the function (audit L6-3).

## L3 (issue 3) — time-of-day on the animation track (new feature)

No light track exists in the original — sanctioned deviation per R20_LIGHTTRACK_SUNUI §1.D:

1. **Daylight pseudo-object — NO object row** (audit L3-5): a singleton TRACK with
   `characterId:'sun'` (no objects-store row at all — naturally inert in both eval passes,
   never enters objectManager sync / plan items / hierarchy / pickers; the r16 drag/dup
   family auto-refuses). Created lazily by `ensureLightTrack()`; the lane head renders
   "☀ Daylight" for characterId 'sun' (the one special case in refreshTimeline). Add-track
   entry: a "Daylight" item in the timeline header/empty-state (audit L3-7).
2. **Item kind `light-transform`**: `{id, kind, startS, durationS, keys:[{tS, azimuthDeg,
   elevationDeg, nightLights?}]}` — duration auto-extends to the last key; validation imitates
   fUr/dHe (az mod 360, el clamp −30..90, keys sorted, ≥2 keys to animate).
3. **Lane UI**: normal lane (walker-style body), KF diamonds (generic in blockHTML), block
   label "Daylight". Add-track dropdown gains a "Daylight" entry (singleton).
4. **Inspector**: Azimuth° (step 5, 0..360), Elevation° (step 1, −30..90), Night lamps
   checkbox, + the existing kf-cluster (◀ ◆ ▶) reused.
5. **Capture at the playhead** (imitates captureFocusedCameraPose @5562520): while a
   light-transform segment is selected, the L2b direction disc / height rail / presets /
   az-el fields write a key at `performanceTimeS − item.startS` — capture lands on
   endEditGesture (one key per drag, the transform-kind commit pattern) + the ◆ Key button;
   tS clamped to [0, duration]; tS-tolerance dedupe (audit L3-6).
6. **Playback hook — effLight pipeline (audit L3-1, P0: the track NEVER writes `this.light`)**:
   `lightAtTime(layout, tS)` is a pure function (first-key hold before, last-key hold after,
   shortest-arc az lerp, nightLights steps; oracle-testable). `effLight()` =
   `lightAtTime(...) ?? this.light` feeds (a) the frame loop's applyDaylight (main.js:1407
   becomes `env.applyDaylight(this.effLight())`), (b) the light-popover render (the disc/rail
   mirror the animated sun at the playhead — required for capture), (c) capture reads. Track
   evaluation never markAutosaves. At-rest/stop semantics (audit L3-2): playing/scrubbing/
   paused-at-t apply the track value at t; stop/load reverts to the scene light automatically
   (nothing to reset — this.light was never touched). The L3 hook does NOT call applyDaylight
   itself (the frame loop is the single apply path — audit J).
7. **Schema v12 → v13** (v12 already exists — audit L3-3): `SCHEMA_V: 13` + a no-op `v12to13`
   step + the `t.v===12` accept arm. normItems passes the new kind through the validator
   (keys array survives; tS dedupe within tolerance — audit L3-6); scenes without the track
   re-light exactly as today (matrix gate + a no-track byte-identity arm in the E2E).
8. NOT on the track (stay scene-level): weather/indoor/skyStyle/clouds/hdr — the daylight
   table derives every sky parameter from elevation alone (the "built-in parameters" the user
   asked for).

---

## Verification plan (per layer + battery)

- L5: plan-view cursor E2E (hover an object in 3D → switch to 2D → cursor visible; lasso on →
  switch → cursor visible).
- L2a: drag-latency probe (pointermove → uniform applied ≤ 1 frame; no LUT bake during drag;
  bake lands ≤ 300ms after release; classic mode unchanged). L2b: control E2E + VLM screenshot
  QA of the redesigned panel; az/el round-trip; moon flip at −8.
- L1: threshold-sweep battery (both styles): sky-region delta in [+2,+8], wash guards, flare/
  disc/moon deltas unchanged from r19; matrix 7/7.
- L7: walk-look E2E (subject tracking through playback ±; combobox round-trip; guards'
  edge cases: target-above, |Δ|>110°, rig-posed walker, parented walker).
- L4: feed-wall E2E (tiles render per camera at playhead; paging; tile click = select+focus+
  back; orbit untouched; camera-mode entry/exit preserves stageView; viewSwitch state sync).
- L6: height-strip E2E (reveal on segment select; bezier edit round-trips to heightCurve;
  playback evaluation unchanged — oracle cover exists via plan tests).
- L3: light-track E2E (add track; keys; capture at playhead; playback moves the sun — probe
  sun elevation over time; scene save/load round-trip; no-track scenes byte-identical).
- Battery: r19 14/14 (updated T6), r18 18/18, matrix 7/7, plan oracle 485/485, r17 oracle
  2501/2501, r14–r17 E2Es.

## Explicitly NOT this round
- Recording arc (backlog P0) — deferred by this feedback round.
- Porting the hub-level recording/PIP windows (separate backlog Ms).
- Animating weather/clouds/hdr on the track (scene-level by design).
- The `bXt` night-lamps gating on object names (optional, skip).
