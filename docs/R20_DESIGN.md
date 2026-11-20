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

### L2a. Input-path lag (the original's architecture — R20_LIGHTTRACK_SUNUI §2.D)
1. `setLightCustom` / `setLightGeo` / `setWeather` / `setIndoor` / `setHdr` become STORE-WRITE
   ONLY (normalize + `this.light = {...}`): delete the synchronous `env.applyDaylight` +
   `shadowFit.force()` calls. The frame loop already applies `env.applyDaylight(this.light)`
   per frame (main.js:1407) and `shadowFit.fit()` reads the live light with its fingerprint
   change-gate — the original's exact once-per-frame structure.
2. Realistic-sky rebake deferral: during an active light drag (beginEditGesture..endEditGesture),
   `sky.setParams` keeps writing uniforms but marks LUTs/PMREM dirty WITHOUT baking; the bake
   fires when the light has been idle ≥250ms (a `lightIdleAt` timestamp the frame loop checks;
   endEditGesture also flushes). Classic mode is untouched (no LUTs).
3. Autosave stays debounced (already 1s).

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
   `elevationDeg ≤ −8` (the original's exact `aSr` moon-handoff threshold).
4. Keep: presets row (elevation-only), geo ghost (ring marker on the disc + tick on the rail),
   night-lamps checkbox, all r6+ sections. All writes still go through `setLightCustom` →
   `normalizeLight` (schema parity).

## L1 (issue 1) — sky bloom retry

r19 pushed the sky body fully below the bloom threshold (delta +0.0 both styles) — the user sees
no HDR response in the sky at all. The r18 value (1.48) was a whole-sky wash. Target: a VISIBLE,
SOFT sky bloom — the brighter dome regions (near zenith / sun side) cross the threshold, the
horizon mostly doesn't → a gradient glow, not a flat lid.

1. `HDR_SKY_LIFT` 1.06 → calibrated so the classic body's UPPER half sits just above thr 1.0
   (start ~1.22; horizon 0.828×1.22 ≈ 1.01, brighter dome ≈ 1.13).
2. `HDR_REALISTIC_GAIN` 1.22 → proportional (~1.35) so the realistic body does the same.
3. Flare/disc/moon bloom (r19, working) unchanged.
4. Calibration is THROUGH the output transform (SKILL #101): sky-region (aimed pose, r19 idiom)
   bloom-on vs bloom-off delta target **+2..+8 display luma**; wash guards: whole-frame p25
   delta ≤ +2, floor-region delta ≤ +1.5, p99 ≤ 250 display, ACES no flat-lid (the 242-243
   band must not appear — max body luma through ACES < 246).
5. Update r19 E2E T6a/T6b to the new criterion (body bloom within [+1,+9]; wash guards above).
   Matrix byte-identity gate must stay 7/7 (all changes finish+hdr-gated).

## L7 (issue 7) — draw-path "look is locked"

The engine works; the affordance is broken. Fixes (R20_DRAWPATH_LOOK D1 + engine gaps):

1. **P0 D1**: replace the split Aim/Subject dropdowns with the original's ONE "Look at"
   combobox (Gzr @5592450): options = Travel direction + KKt-filtered subjects (no
   cameras/spotlights/paired targets); 'locked' offered ONLY for non-person walkers; picking a
   subject writes `{aim:'subject', subjectId}` atomically; value display = subjectId ?? travel.
   Same control on cam-path sections + add the missing `Tot` Frame-offset (aimOffsetUnits)
   stepper (@5591676, aim!=='locked' only).
2. **P1 D2**: simple_figure walking head-look uses `ezHeadRotation(yaw, pitch)` (figures.js:227)
   instead of naive `[pitch, yaw, 0]` (main.js:904).
3. **P1 D3**: gazeSplit guards verbatim (tracks.js:125-136): the `horiz < 1e-6` early-out +
   the `Math.PI − Math.abs(delta)` headYaw clamp term (@5482972).
4. **P2 D4**: `rigPoseObjectId` gate in the head-look loop (main.js:867-870, @~5728740).
5. **P2 D5**: `curYaw` from LOCAL quaternion (main.js:822, pe @5733467).
6. **P2 D6**: keyed-head `w2r` lerp + `sinceS` precedence (main.js:885-906, xie/Xyr @3933882).
7. E2E: extend the walk-look harness (subject head-tracking through playback; combobox
   round-trip; non-person locked).

## L4 (issue 4) — camera view navigation (the feed wall)

Our "Cameras" stage view is a through-the-lens viewport hijack (orbit off, per-frame re-pin,
frozen when nothing selected) — un-navigable. The original's cameras view is a **monitor wall**
(R20_CAMVIEW_HEIGHT §A1a: NJr @5862984 — paginated grid of 6 live per-camera feed tiles; the
editor camera is NEVER touched; tile click = select + focus + back to editor @5882274).

1. **P0**: rebuild the Cameras view as the feed wall. Grid of aspect-correct tiles (one per
   camera, paginated 6/page + page dots), each rendered from that camera's evaluated pose at
   its own focal + record aspect. Render: per-tile viewport/scissor passes into one shared
   wall canvas (or per-tile canvases), evaluated at the current playhead each frame while the
   wall is open. Tile chrome: camera name + focal; click = select + focus + stageView='editor'.
   Delete `updateCameraThroughLens`. Editor camera + orbit stay live behind the wall (nav ball
   pad per D11 decision: show, matching original).
2. **P0**: stop forcing `stageView='editor'` on camera-mode entry (main.js:1752-1755); reorder
   the exit path explicitly (lens restore → pose save → takeOver).
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
   (already verbatim) as the strip renderer, u-domain = the item's time span, edit semantics
   identical to the plan popout (bezier handles → heightCurve; anchor-Y when no curve). The
   strip stays visible while playing (original disables, never hides — same choice here).
   The plan-canvas floating popout is REMOVED (replaced by the timeline strip); the plan-side
   drag-to-set-height gesture and the Height slider (camera object Y) stay as they are.
3. Undo/gesture brackets reuse the curve-panel's existing ones.

## L3 (issue 3) — time-of-day on the animation track (new feature)

No light track exists in the original — sanctioned deviation per R20_LIGHTTRACK_SUNUI §1.D:

1. **Daylight pseudo-object**: singleton object kind `"light"` (reserved id `"sun"`), created
   lazily by `ensureLightTrack()`; gated out of pickers/subject lists/3D sync/canOwnTrack.
2. **Item kind `light-transform`**: `{id, kind, startS, durationS, keys:[{tS, azimuthDeg,
   elevationDeg, nightLights?}]}` — duration auto-extends to the last key; validation imitates
   fUr/dHe (az mod 360, el clamp −30..90, keys sorted, ≥2 keys to animate).
3. **Lane UI**: normal lane (walker-style body), KF diamonds (generic in blockHTML), block
   label "Daylight". Add-track dropdown gains a "Daylight" entry (singleton).
4. **Inspector**: Azimuth° (step 5, 0..360), Elevation° (step 1, −30..90), Night lamps
   checkbox, + the existing kf-cluster (◀ ◆ ▶) reused.
5. **Capture at the playhead** (imitates captureFocusedCameraPose @5562520): while a
   light-transform segment is selected, puck/preset/az-el edits write a key at
   `performanceTimeS − item.startS` (the transform-kind pattern our port already has).
6. **Playback hook**: in `evaluateAt`, after the character pass: `lightAtTime(layout, tS)`
   (first-key hold before, last-key hold after, shortest-arc az lerp, nightLights steps) →
   `this.light = {...this.light, ...l}` — the frame loop already applies it (L2a makes the
   apply once-per-frame + rebake-deferred, so a playing track animates the sun smoothly).
7. **Schema v11 → v12**: additive; normItems passes the new kind through the validator;
   scenes without the track re-light exactly as today (matrix gate).
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
