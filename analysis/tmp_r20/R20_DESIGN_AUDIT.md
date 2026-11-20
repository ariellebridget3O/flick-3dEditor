# R20 DESIGN AUDIT — read-only pre-implementation review

Audited: `docs/R20_DESIGN.md` (7 layers, order L5→L2→L1→L7→L4→L6→L3) against the three
research docs (`analysis/tmp_r20/R20_{DRAWPATH_LOOK,CAMVIEW_HEIGHT,LIGHTTRACK_SUNUI}.md`),
the standing gates (PLAN.md r17–r19: pixel matrix 7/7, plan oracle 485/485, r17 oracle
2501/2501, r18 E2E 18/18, r19 E2E 14/14, r14–r17 suites), and the actual code. Every
finding cites file:line. No code was modified.

**Standing-gate exposure summary** (who can break):

| Gate | Exposed by | Detail |
|---|---|---|
| pixel matrix 7/7 | **L4** (m1_lens, m5_cam_path capture through the lens), L1 (hdr-off arms safe — verified) | findings L4-1, L1-1 |
| r19 E2E 14/14 | L1 (T6a/T6b — planned update), L2a (safe — verified) | findings L1-2 |
| r18 E2E 18/18 | **L1 (T9a — NOT planned, will FAIL)**, L2a (safe only if setClouds keeps its sync apply) | findings L1-1, L2a-1 |
| r17 E2E 31/31 + oracle 2501 | none (verified: no cameras-view / no evaluateAt coverage) | finding L4-6 |
| plan oracle 485/485 | none (heightMove/curve-panel not oracle-covered) | finding L6-5 |
| r14–r16 suites | none (r15=held-pose, r16=segment drag; L7 lines uncovered) | finding L7-3 |

---

## L5 (2D cursor) — verdict: **GO**

The diagnosis and fix are correct and, as far as the DOM allows, complete.

**Verified root cause.** `manipulate.js:697/700/741` write `app.container.style.cursor`
(lasso cursor, lasso clear, hover `cursor:'none'`). `app.container` is `#viewport`
(main.js:76, `boot(document.getElementById('viewport'))` index.html:124), which contains
BOTH canvases: the renderer canvas (main.js:94 `container.appendChild`) and the plan
canvas (`plan.js:1349-1350`, `position:absolute;inset:0;…;z-index:2` on the same host).
The plan canvas overlays the 3D canvas (`plan.js:1390` `setVisible` toggles only its own
`display`), and its own cursor writes use `''` (removes the inline style → inherits):
plan.js:1483-1484 (edge-bubble hover) and plan.js:1533 (`_hoverTip`:
`crosshair` when drawing else `''`). So a container-level `none` leaks into the plan view
exactly as the design says; switching views fires no 3D pointermove, so it sticks.

**Verified completeness of the fix.**
- Grep for cursor writes: the ONLY container writer is manipulate.js (`manipulate.js:697,
  700, 741`; plan.js writes `Z.style.cursor` on the plan canvas itself; takerange.js:240/291
  write on its own draw surfaces). Writing on `el` (`app.renderer.domElement`, already in
  scope at manipulate.js:658) is sufficient.
- No CSS-rule cursor on the canvases/`#viewport` (`css/app.css:80-81` has none; `.grabbing`
  classes exist only on `.blk`, `.nav-ball-pad`, `.tile`, curve handles — none on either
  canvas), so no class-based cursor competes with the inline write.
- The lasso cursor on `el` does not leak into the plan view: while the plan is shown the
  plan canvas covers `el`, and the plan sets its own `crosshair`/`pointer`/`''`.
- Mirror-exactness confirmed against the research (@3880923 `u.style.cursor=a&&!l?"none":""`,
  u = the canvas) — no plan-side change needed; the plan canvas already self-manages.

Findings:
- **L5-1 (P2, accept/no change)**: after the fix, the 3D canvas itself can still carry
  `cursor:'none'` when the user switches 3D→plan→3D without moving the mouse (no
  pointermove fires to re-pick). The original has the same behavior (canvas-level write);
  acceptable. If desired later, `_syncShown` (plan.js:1382-1389) could reset `el` cursor on
  view switches — NOT required this round (it would be a deviation from the live).

---

## L2a (input-path lag: store-write-only setters + rebake deferral) — verdict: **GO-WITH-CHANGES**

**Verified claims (all check out):**
- Frame loop applies daylight EVERY frame unconditionally: `main.js:1407`
  `this.env.applyDaylight(this.light)` sits before every branch — playback (1371-1377),
  scrub (1378-1382), rest (1383-1400), nav (1405) — and BEFORE the plan-view early return
  (`main.js:1452-1457`). Also runs in camera mode. So "the frame loop already applies it
  per frame" is true in edit mode, during playback, when paused, and in the plan view.
- `shadowFit.force()` is genuinely redundant: `tickAOr` → `tick()` → `fit()` runs every
  frame (main.js:1422 → env.js:635/590); `fit()` re-applies daylight internally
  (env.js:592, memo-gated, no double work), reads the LIVE key direction (env.js:609;
  `keyDirection` is the shared `_keyDir` vector, env.js:465 — updated in place by
  applyDaylight at env.js:373-405), and fingerprints `sun.position/w/far` (env.js:629) so
  any az/el change marks the walk dirty and bumps the shadow generation. This is the
  original `CHr` structure. Removing `force()` from the setters is MORE original-exact.
- Boot path: `loadSceneData` (main.js:541-566) never applied daylight synchronously even
  today — the first `_frame` does (main.js:1407). Nothing changes at boot.
- `applyDaylight`'s memo key (env.js:303-306) makes the per-frame call a no-op when the
  light is unchanged — the once-per-frame structure is exactly the live's.

**Harness survey (checklist B/J — "who reads env state synchronously after setLight*")**:
- r19 E2E: T1/T3/T4/T5/T8 all call `a.env.applyDaylight(a.light)` explicitly after the
  setters (r19_light_e2e.py:80, 84, 102, 110, 135, 159, 161, 165) → unaffected.
  T2 (line 192) and T7b (line 247) call bare `setLightCustom` but sleep 1.2-2.5 s before
  capture → ≥60 frames apply in between → unaffected.
- r18 E2E: T5 (188-198), T6 (230-244), T7 (251-258), T9 (263-299), T10 (316-331) all
  sleep after setters → unaffected. **T2/T3/T4/T4b (114-153) rely on `setClouds`'s
  synchronous `env.applyDaylight`** (main.js:191) to push cloud params + stats before the
  `_debug.lastSheetsStats` read — see finding L2a-1.
- In-app callers (ui.js:544-648) read only `app.light` after the setters (render() reads
  the store, never env uniforms) → unaffected.
- The in-eval `a.renderFrame()` calls (r18:119/136/146/151/321, r19:188) render one
  stale frame under L2a, but no assertion reads those frames (captures all happen after
  sleeps). Benign.

Findings:

- **L2a-1 (P1) — the setter list is incomplete/ambiguous; setClouds must KEEP its
  synchronous apply.** The app has 8 light mutators: `setLightGeo` (main.js:156),
  `setLightCustom` (:164), `setWeather` (:168), `setSkyStyle` (:170), `setClouds` (:179),
  `setHdr` (:200), `setIndoor` (:218), `setAmbient` (:219). The design lists only
  `setLightCustom/setLightGeo/setWeather/setIndoor/setHdr`. That is actually the right
  cut (setSkyStyle/setClouds/setAmbient are not part of the issue-2 complaint), but the
  design must SAY so, because r18 T2/T3/T4's synchronous stats reads depend on
  `setClouds` keeping `env.setClouds + env.applyDaylight` (main.js:190-191): their chains
  are `setWeather(wx); setClouds({...})` — under L2a the weather apply defers one frame,
  and only setClouds' own apply covers it inside the same eval. **Required change:** add a
  line "setSkyStyle / setClouds / setAmbient keep their synchronous applies (unchanged);
  only the 5 listed setters become store-write-only" to the design.
- **L2a-2 (P1) — the rebake deferral is drag-gated only; the PLAYBACK case (L3) is
  unhandled.** The design gates on "during an active light drag
  (beginEditGesture..endEditGesture)". sky.js's bakers fire on dirtiness, not gestures:
  `update()` (sky.js:801-817) bakes LUTs when `lutDirty` and `now-lastBakeAt ≥ 80`
  (REBAKE_MIN_MS, sky.js:54/809) and PMREM when `pmremPending` and `≥250`
  (PMREM_MIN_MS, sky.js:55/812). During playback of a light track, applyDaylight's key
  changes EVERY frame → `realistic.setParams` marks `lutDirty` every frame
  (sky.js:694-700) → LUT bake every 80 ms + PMREM every 250 ms for the whole take — the
  exact hitching the user reported, now during playback. Note the r19 T5 "dusk sweep"
  did NOT exercise this: its 41 steps ran inside ONE synchronous eval
  (r19_light_e2e.py:129-141) — no frames render mid-loop, so no rebakes fired during the
  sweep (at most one bake after). **Required change:** key the deferral on LIGHT-IDLE
  (a `_lightChangedAt` stamp written whenever the applied light object changes — the
  frame loop's applyDaylight memo-key change is the natural place), not on gesture depth:
  `deferBake = (now - _lightChangedAt) < 250`. Then define the playback policy explicitly
  (recommended: while `page.playing` AND the light is animating, keep LUT bakes at the
  80 ms throttle only if measured cheap, and defer PMREM until pause/stop/seek-idle;
  flush on stop/pause/endEditGesture). Reuse the same stamp for L3 (see L3-4).
- **L2a-3 (P1) — specify the gating point and API.** The design says "sky.setParams keeps
  writing uniforms but marks LUTs/PMREM dirty WITHOUT baking" — setParams already does
  exactly that split (uniform writes sky.js:701-718; dirty mark :700); the bake decision
  lives in `update()` (sky.js:809-812), which is called from
  `env.updateRealisticSky` (env.js:456-463) in the render path. **Required change:** the
  deferral flag must be threaded `main._frame → env.updateRealisticSky(camera, …, {allowBake})
  → realistic.update(...)` (or a `sky.setBakeAllowed(bool)` set by the frame loop from the
  idle stamp). Do NOT gate inside setParams (it must stay pure-uniform). `endEditGesture`
  flush = set `allowBake` + one forced `bake()`/`bakePMREM()` on the next update.
- **L2a-4 (P2) — endEditGesture reliability.** The puck binds `pointerup` +
  `pointercancel` (ui.js:547-549); the popover is persistent DOM (`#lightPop` toggled by
  class, ui.js:348-352 — never torn down mid-drag), so a stuck gesture is unlikely. But
  if the deferral is keyed to light-idle (L2a-2) a stuck gesture no longer starves the
  bakes, and a stuck gesture would only hold the undo bracket. Cheap safety: also bind
  `lostpointercapture` → `puckUp`. Include in the L2b rewrite.
- **L2a-5 (P2) — document the torn state precisely.** During a deferred-bake drag the
  dome's DIRECT uniforms (`uSunDir`, sun color, flare direction — sky.js:701-718) are
  live, but the LUT-driven sky luminance (transRT/msRT/svRT read by the dome shader,
  baked in sky.js:737-751) AND the PMREM IBL trail by ≤250 ms. So it is not only "the
  IBL" that trails — the sky body gradient lags the disc. Acceptable per design; write it
  down so the VLM QA of the panel doesn't misread it as a bug. Classic mode has no LUTs —
  untouched (verified: `update()` early-returns when `!enabled`, sky.js:802).
- **L2a-6 (P2) — `setHdr` keeps its non-apply side effects.** The design says "delete the
  synchronous env.applyDaylight + shadowFit.force() calls" — in `setHdr`
  (main.js:200-217) the finishPref auto-enable (:210-213) and the `_bloom.dispose`
  interplay must stay; only the `applyDaylight` at :215 goes. The finishOn-flip re-apply
  inside `renderFrame` (main.js:1505-1506) already covers the enable case synchronously
  at render time. State this in the design so the implementer doesn't over-delete.

---

## L2b (day/night control redesign) — verdict: **GO-WITH-CHANGES**

**Verified:** the research basis is solid (R20_LIGHTTRACK_SUNUI §2.F is inside the
original's interaction vocabulary; §2.B confirms our puck is a faithful port, so the
redesign is user-sanctioned).

Findings:

- **L2b-1 (P2) — no external consumers of the puck DOM.** Grep across `editor/` +
  `scripts/`: `sunPuck/sunKnob/sunGhost` appear ONLY in ui.js:355-357/415. No E2E or
  harness touches them; the only UI-dependent harness is r18 T1a which clicks
  `#btnLight` and reads `#lpClouds` (r18_sky_e2e.py:85-88). **Required:** keep `#btnLight`
  and the clouds/sky/hdr/geo sections (with their ids) intact; the disc/rail may use new
  ids. `render()`'s `lpPhase/lpAzEl` ids are internal — free to move.
- **L2b-2 (P2 — must be an explicit design decision) — moon-flip azimuth semantics.**
  `aSr` (our `sunDirection`, env.js:112-118) remaps ONLY elevation at night
  (`el ≤ −8 → 25 − el`); **azimuth is unchanged** (env.js:113/117 — az feeds sin/cos
  directly). So in the classic path the knob's azimuth IS the light's azimuth day and
  night — the disc does not need to "flip meaning". BUT in the realistic style the night
  key light comes from `moonDirection = −sunDir + 0.25·right` (env.js:127-131, applied at
  env.js:379-397) — the anti-solar azimuth: the hard light arrives from ≈az+180 while the
  knob sits at az. **Required:** state the choice in the design: knob position =
  `light.azimuthDeg` (the stored value) always; the moon GLYPH rides the knob; document
  that in realistic style the visible moon/hard light sits opposite the knob azimuth
  (deterministically derived from it). Do NOT flip the rendered knob or the drag math at
  the −8 crossing — a mid-drag 180° jump inverts pointer motion and the stored-value
  meaning between styles.
- **L2b-3 (P2) — the height rail is the SETTING axis.** At night the effective light
  elevation is `25 − el` (classic, env.js:116) or the moon blend (realistic); the rail
  must keep displaying/writing `elevationDeg` (−30..90, presets 57.38/9/−4/−28 =
  const.js:139-144, aria-valuemin/max = the live's `Rq/oC` −30/90). The shaded moon zone
  (−8..−30) is the right teaching affordance. No flip; just document.
- **L2b-4 (P2) — keyboard/aria parity is already right:** current keydown az ±10 / el ±5
  (ui.js:550-560, live `rts` Qlt/Jlt) maps cleanly to disc-L/R ±10 and rail-U/D ±5. Keep
  the one-gesture-per-keypress `commit()` bracket (ui.js:531) — matches our port's
  existing undo semantics (a documented micro-deviation from the live, keep).

---

## L1 (sky bloom retry) — verdict: **GO-WITH-CHANGES**

**Math sanity-check (checklist E):** classic body luma 0.83-0.93 (const.js:110-111
"worst classic horizon luma 0.828") × 1.22 → 1.01-1.13; threshold default 1.0, strength =
bloom 0.35 × `HDR_BLOOM_STRENGTH_K` 1.2 = 0.42, radius 0.4, exposure 1.0
(const.js:103/97). Overflow above thr = 0.01-0.13 (vs ~0.23-0.38 at the r18 lift 1.48
which produced the +20.8 whole-sky wash). A roughly linear scaling puts the sky-region
delta at ≈ +4-7 — inside the +2..+8 target, with the horizon (1.01) barely crossing →
gradient glow, not a lid. Plausible; the threshold-sweep battery (already in the design)
is the arbiter. `HDR_REALISTIC_GAIN` 1.22 → ~1.35 proportional (raw body 0.76-0.81 ×
1.35 = 1.03-1.09) — consistent.

**Classic non-finish path / matrix safety (verified):** the lift is
`light.hdr?.enabled && _finishOn ? C.HDR_SKY_LIFT : 1` (env.js:337; flareLift :348).
All 7 matrix arms are hdr-off (m1/m2/m3/m5/m6… `?finish=0`, fixtures without `light.hdr`)
or finish-without-hdr (m4_finish) → lift = 1 → byte-identity holds. Same for
`HDR_REALISTIC_GAIN` (sky.js:807: applied only in `linearHDR` mode = finish+hdr).

Findings:

- **L1-1 (P0 — gate break the design misses): r18 E2E T9a will FAIL.**
  r18_sky_e2e.py:269-272 asserts the CLASSIC sky sliver (top 30 rows,
  `sky_sliver_luma` :61-63) does NOT bloom: `abs(l10 - l0) < 2.0`. With the body lifted
  above thr 1.0 the sliver delta becomes +2..+8 → FAIL. The design's battery claims
  "r18 18/18" and lists only r19 T6a/T6b for update. **Required:** add r18 T9a to the
  update list — new criterion e.g. sliver delta within [+1,+9] plus the wash guards, or
  re-scope T9a to the floor rows (its real subject — the r19 recalibration story).
- **L1-2 (P1) — T6a/T6b's metric is a whole-frame mean, not a sky region.**
  r19_light_e2e.py:225/233 diff the ENTIRE frame mean. The design's new criterion
  "body bloom within [+1,+9]" must specify a sky-region mask (the calibration item
  already says "sky-region (aimed pose, r19 idiom)") — otherwise the sky +2..+8 dilutes
  to ~+1..+4 whole-frame and the window is ambiguous. **Required:** write the T6a/T6b
  replacement assertions as region-masked (top-N rows at the aimed pose) + separate
  whole-frame p25 ≤ +2 and floor ≤ +1.5 guards.
- **L1-3 (P2) — "flare/disc/moon unchanged" is not exact.** The flare value is
  multiplied by the body lift: env.js:349 `g.flare * w.flare * lift * flareLift` —
  going 1.06 → 1.22 brightens the flare region ≈ +15%. Margins are comfortable (r19 T7a
  sun core +53.8 vs >+20; r18 T9b center-third ≫ +8) but the battery's "flare/disc/moon
  deltas unchanged from r19" should read "within a ±20% tolerance" or re-baseline them.
- **L1-4 (P2) — the ACES guard is self-contradictory as written.** "the 242-243 band
  must not appear — max body luma through ACES < 246": a body max of 243-245 satisfies
  "< 246" while still containing the band. **Required:** define it numerically, e.g.
  "p99 sky-body display luma ≤ 241 AND no connected region ≥ 200 px within ±1 of 243".

---

## L7 (draw-path look) — verdict: **GO**

All six divergences verified against the code; the research (R20_DRAWPATH_LOOK §4-§6) is
accurate and the fix list is byte-traceable:

- D1: split dropdowns confirmed at ui.js:888-893 (path) / :895-899 (cam-path), handlers
  :948-950 (`patch({aim})` / `patch({subjectId})` — the two dead half-states). The
  combined control spec (options, value display, atomic write via `updatePathItemAim`
  store.js:937 — which already keeps `subjectId` on travel) matches the live @5594148.
- D2: main.js:904 `return [split.headPitchRad ?? 0, split.headYawRad, 0]` — the naive
  euler; `ezHeadRotation` exists at figures.js:227 and is already imported in main.js.
- D3: tracks.js:125-136 has NEITHER guard (no `flat < 1e-6` early-out; headYaw clamp at
  :131 lacks the `Math.PI − |dYaw|` term).
- D4: main.js:867-870 merges unconditionally; `this.rigPoseObjectId` already exists
  (main.js:1441) — the gate is a one-line insert.
- D5: main.js:822 `mesh.getWorldQuaternion(...)` — must become `mesh.quaternion` (local).
- D6: main.js:885-906 — step lookup (:895-900) + `if (split) return …` always-wins
  (:904) vs the live's `w2r` lerp + `sinceS >= item.startS` precedence.

Findings:

- **L7-1 (P2) — aim-field consumers beyond the inspector (verified safe, enumerate in
  the design):** `pathLookAt` tracks.js:50; `pathStateAt` tracks.js:411-413 (the
  `locked → yawRad null` semantics — must stay byte-equal); cam eval tracks.js:290-301/
  326-329; the plan fold main.js:700-710; focus readers plan.js:1076/1087,
  store.js:375/925; `updatePathItemAim` store.js:937; the paint-mode gate
  manipulate.js:489 (`(r.aim ?? 'travel') !== 'locked'`). The combobox writes the same
  fields → no consumer changes. The D7 plan-bar gating (draw pill while playing) is NOT
  in this round's scope — fine (cosmetic, R13 P2-8).
- **L7-2 (P2) — cam-path combobox missing the paired-target option.** The live cam-path
  row (@5598816) adds an empty-subject option labeled with the camera's target-marker
  label on top of the KKt-filtered subjects. The design's option list omits it. Include
  it or record a conscious drop.
- **L7-3 (P2) — zero existing gate coverage on the touched lines.** No gate suite
  asserts on main.js:822/858-906 or tracks.js:125-136 (r15 = held-pose baking family,
  r16 = segment drag/dup, r17 = camera mode; plan oracle = painter/plan model only;
  r17 oracle = drive/rig/zoom units — run_oracle_r17.mjs:1-21). The D2 euler change
  silently alters every simple_figure walker's head pose with NO regression net — the
  new walk-look E2E must include the figure-walker + vertical-offset case (research §7
  T6) before the D2 commit lands.

---

## L4 (camera feed wall) — verdict: **GO-WITH-CHANGES** (highest-risk layer)

The research (R20_CAMVIEW_HEIGHT Part A) is thorough and the wall is unambiguously the
original's design. The risks are all in OUR harness/render contracts:

- **L4-1 (P0) — the pixel matrix m1_lens/m5_cam_path capture contract.**
  `run_matrix.py:51-57` (m1_lens) and `:100-106` (m5_cam_path) use `view="cameras"`;
  `ours.py:95-118` enters the lens by selecting the camera + clicking the real
  `#viewSwitch button[data-v=cameras]` radio, then captures via `bb.py` — a forced
  `app.renderFrame()` + `readPixels` of the MAIN canvas at (0,0,805,452)
  (bb.py:26-41), asserting the canvas rect == (0,88,805,452) (ours.py:110-113). The
  live golden for these arms IS the live wall's single-camera feed (README:80-91 —
  "the feed canvas is ~805x452"; our lens matched it 99.09-99.12%). If the wall is
  implemented as per-tile CANVASES (separate WebGL contexts, the live-exact pattern),
  the main canvas keeps rendering the editor view → bb reads the wrong image → m1/m5
  FAIL, and 6 extra SwiftShader contexts are heavy. **Required design change:** implement
  the wall as **per-tile viewport/scissor passes with the MAIN renderer inside
  `renderFrame`** (the design's "one shared wall canvas" option — make it THE canvas),
  with: (a) exactly-one-camera walls rendering that single tile FULL-CANVAS at the record
  aspect (the live's measured geometry), (b) tile pose/fov sourced from
  `mesh.userData.evalPose` (position/quaternion/`fovDeg` — set per frame by
  `updateCameraMarkers` main.js:1300-1316 at the playhead) exactly as the lens did
  (main.js:1267-1273), including the shake branch (main.js:1280-1286) and the editor
  camera's near/far (fogNearFar-ticked) for pixel continuity. Then m1/m5 pass with ZERO
  harness changes. If the per-tile-canvas option is preferred, the design must instead
  specify the ours.py/bb.py retarget (tile canvas testid + per-tile readPixels) — one or
  the other, explicitly.
- **L4-2 (P1) — `updateFrameGuide` is unmentioned and currently touches the EDITOR
  camera from the cameras view.** ui.js:672 gates BOTH the guide div AND the editor-fov
  adoption on `stageView==='cameras' || mode==='camera'`, and :695 writes
  `app.camera.fov = fov`. With the wall, `stageView==='cameras'` must NOT touch the
  editor camera (it stays live behind the wall at EDITOR_FOV) nor show the guide (live
  D10: guide div is camera-mode only). **Required:** change the gate to
  `app.page.mode === 'camera'` only. (Ours.py's "click the radio so updateFrameGuide
  adopts the lens fov" comment becomes obsolete — harmless.)
- **L4-3 (P1) — stale "lens restore" wording in the entry reorder.** With
  `updateCameraThroughLens` deleted (main.js:1208-1289) and its state
  (`_lensActive/_lensSave/_lensHideRestore/_lensObjId`) gone, there IS no lens restore.
  The camera-mode entry (applyMode, main.js:1748-1779) becomes simply: (stageView
  untouched — delete the force at :1752-1755) → gizmo detach (:1756) → orbit off (:1757)
  → save `_editorPoseSave` once (:1758-1764) → takeOver (:1767-1773) → fov (:1774) →
  drive seed (:1775-1777) → hide mesh (:1778). The wall's own visibility gate is
  `stageView==='cameras' && mode==='edit'` (the live's `ne`, @5873244) — it hides in
  camera mode and RETURNS on exit (the D2 fix). Rewrite the design bullet accordingly.
- **L4-4 (P1) — zero-camera and track-less-camera behavior unspecified.**
  `updateCameraMarkers` sets `evalPose` only for cameras WITH tracks (main.js:1300-1316);
  the current lens freezes when no pose exists (main.js:1232-1234). The wall must (a) fall
  back to the camera object's base TRS + `fovFromFocal(focalLengthMm, recordAspect)` for
  track-less cameras (the live's feed resolver: base = the mesh's current world pose
  through `NKt`), and (b) define the 0-camera wall (empty grid + "0 of 0" pager, or hide
  the Cameras segment). Specify both.
- **L4-5 (P2) — per-tile self-occlusion/labels.** The lens hides the selected camera's
  mesh subtree + ALL labels (main.js:1250-1261); the live hides nothing (backface
  culling; the live golden even shows the 'Camera 1' DOM label — README r12 residual
  note). Recommended: hide only the TILE camera's own mesh + frustum child (our frustum
  marker is real geometry that would fill the frame), keep other cameras/labels visible
  (closer to live, shrinks the known m1 residual). Document the choice for m1/m5.
- **L4-6 (P2 — verified safe):** the r17 camera-mode E2E (31/31) never touches the
  cameras stage view (T1-T11: entry/drive/shake/weight/zoom/monitor/exit/WASD/cascade/
  toast — r17_camera_e2e.py:51-480); the r17 oracle covers drive/rig/zoom units only
  (run_oracle_r17.mjs:1-21). Deleting `updateCameraThroughLens` breaks NEITHER. The only
  gate exposure is the matrix (L4-1). `lens_forensics.py`/`lens_smooth.py`/probes are
  reference-only (README:272-278).
- **L4-7 (P2):** viewSwitch state-driven (P1 item) confirmed needed: ui.js:80-92
  toggles the `on` class only inside the click handler; also the camFooter visibility
  ride-along (ui.js:87-91) should move into the same page.subscribe sync.

---

## L6 (height strip on the timeline) — verdict: **GO-WITH-CHANGES**

- **L6-1 (P1) — the strip cannot live inside the rebuilt lanes innerHTML.**
  `refreshTimeline` rewrites `lanes.innerHTML` on every store change (ui.js:1299) and
  skips re-render only during timeline-internal drags (ui.js:1269
  `if (app._tl?.interaction) { updatePlayhead(...); return; }`). A curve drag fires
  `setPathHeightCurve` per pointermove (plan.js:902-905 `writeCurve` → store.changed →
  refreshTimeline) — a strip mounted inside a lane row would be destroyed mid-gesture
  (losing `selIdx`, drag state, pointer capture). **Required:** mount the strip as a
  persistent overlay OUTSIDE `#tlLanes`' rebuilt subtree (absolutely positioned in
  `.tl-body` under the target lane row — the take-range overlay pattern,
  ui.js:1315/renderTakeRange), and/or extend the ui.js:1269 guard to
  `app._tl?.interaction || app.plan.curveDrag` so curve gestures never rebuild the lanes.
- **L6-2 (P1) — `buildCurvePanel` re-host specifics the design must state.** The
  factory (plan.js:1210-1342) is view-agnostic except: (a) `render()`'s gate
  (plan.js:1251) includes `viewportMode === 'plan'` AND `!app.page.playing` — the
  timeline strip must drop BOTH (visible in 3D view; stay-visible-while-playing per the
  original's `locked` disable semantics, research B2/H3); (b) `xOf/toCurve/hitPoint/
  handleAt` (plan.js:1227-1247) map u against the panel's own width — re-target to the
  item's block span (`u ↔ laneX + u·blockWidth`, the SegmentKeyframes @5192233
  coordinate frame); (c) the strip's per-frame playhead tick (the plan.js:1328-1339
  pattern) needs a frame hook in the timeline — `updatePlayhead` already runs per frame;
  piggyback or add a rAF tick like `_curveTick` (plan.js:1375).
- **L6-3 (P2) — heightMove fix details.** Our `heightMove` (plan.js:840-846) has only
  the selected-camera branch (H1 confirmed). Porting @5488432 verbatim also moves the
  `stroking` gate to the TOP (`if (this.stroking()) return null;` first — ours currently
  buries it in the camera-branch condition at :842). Trivial but say it.
- **L6-4 (P2) — plan-side loss.** Removing the plan popout deletes the ONLY plan-view
  heightCurve editor (the original's only placement is the docked plan strip — research
  B2). User-sanctioned for the timeline, but the plan-side drag-to-set-height gesture +
  Height slider stay — consider keeping the docked plan variant too (research B5 #4) or
  explicitly document the divergence. The design currently doesn't mention the loss.
- **L6-5 (P2 — verified safe):** the plan oracle does NOT cover `heightMove`/curve-panel
  ops (run_oracle.mjs imports plan.js but exercises the painter/curve-model via
  curves.js only — grep: no heightMove/pressCurve hits in scripts/oracle). tracks.js
  eval (:324 curve-replaces-Y) is untouched → "playback evaluation unchanged" holds.

---

## L3 (light track) — verdict: **GO-WITH-CHANGES**

- **L3-1 (P0) — the playback hook as specced CORRUPTS the persisted scene light.**
  Design item 6: `this.light = {...this.light, ...l}` — `this.light` is the SERIALIZED
  scene light (`currentSceneJSON` main.js:567-574 writes `light: this.light`; autosave
  1 s debounce :578-586). Playing a dusk sweep once, then autosave/save, persists the
  mid-sweep az/el as the scene's static light. Also on stop nothing resets it
  (`resetToBase` main.js:926-933 resets meshes only; steady-rest doesn't even run
  `evaluateAt` — main.js:1398-1400 — so the last written value sticks forever).
  **Required design change:** keep `this.light` as the user/scene value — NEVER written
  by the track; introduce an evaluated light (e.g. `effLight()` =
  `lightAtTime(layout, playheadS) ?? this.light`) that feeds (a) the frame loop's
  `env.applyDaylight` (main.js:1407), (b) the light-popover render (so the disc/rail
  mirror the animated sun at the playhead — required for the capture UX), and (c) the
  capture reads. Track evaluation must never `markAutosave`.
- **L3-2 (P1) — at-rest/stop semantics unspecified.** With the effLight pipeline:
  playing/scrubbing/rest-eval-at-seek → applied light = track value at the playhead;
  stop (`stopPerformance` main.js:917-925) / load → reverts to the scene light
  automatically (no code needed beyond not-mutating). Paused mid-track (`_restEval`)
  keeps evaluating at the pinned time (main.js:1390-1391) → holds the animated value.
  Write exactly this into the design.
- **L3-3 (P1) — schema version is WRONG in the design: the format is already v12.**
  `loadScene` (schema.js:254-279) accepts v11 → `v11to12` (:298-301, the r10 skyStyle
  bump) → v12 today; `SCHEMA_V` is 12. The light-track bump is **v12 → v13** (new
  `v12to13` no-op migration + `SCHEMA_V: 13` + a `t.v === 12` step at schema.js:273).
  Following the doc literally would collide with the existing v12 semantics.
- **L3-4 (P1) — playback rebake policy missing (the L2a interaction).** See L2a-2. A
  playing light track changes the light every frame; the drag-gated deferral does not
  apply, so a sweeping sun during a take re-creates the r19 drag hitching (LUT 80 ms +
  PMREM 250 ms cadence — sky.js:809-812). The design's claim "L2a makes the apply
  once-per-frame + rebake-deferred, so a playing track animates the sun smoothly" is
  NOT delivered by L2a as specced. **Required:** one shared idle-stamp mechanism
  (`noteLightChanged()` written by both the setters and the track evaluator; bake when
  idle ≥ 250 ms or on pause/stop; explicit PMREM-defer-while-playing decision).
- **L3-5 (P2) — pseudo-object placement: pick the no-object-row option and say so.**
  The design says "singleton object kind 'light'… gated out of pickers/subject lists/3D
  sync/canOwnTrack" but not whether an objects-store ROW exists (persisted or derived).
  Recommended: NO object row at all — a track with `characterId:'sun'` is naturally
  inert in both eval passes (character pass main.js:787 `!obj → continue`; object pass
  :836 `if (!obj) continue`), never enters `objectManager` sync, plan items()
  (plan.js:918+ iterates objects), the hierarchy, or pickers, and the r16 drag/dup
  family auto-refuses it (`duplicateSegment` store.js:548 refuses missing owner;
  `canDropSegmentOnObject` :570 `canDuplicateOnto(unknown kind)` → false). Only the lane
  head needs a special case (refreshTimeline reads `objects.get(tr.characterId)` for the
  name, ui.js:1300-1301 → render "☀ Daylight" for characterId 'sun'). If an object row
  IS chosen, the gating surface (3D sync, plan, hierarchy, delete cascade, saveScene,
  undo snapshots) is much larger — the design must pick one.
- **L3-6 (P2) — capture semantics under-specified.** (a) Per-gesture vs per-move key
  writes: recommend capture on `endEditGesture` (one key per drag, the transform-kind
  commit pattern) + the ◆ Key button, with tS-tolerance dedupe (the research's `_m`;
  the design's validation list omits dedupe). (b) Playhead outside the segment:
  `performanceTimeS − item.startS` can be negative or > duration — clamp to [0,
  duration] or refuse; specify. (c) The design's "puck" wording is stale after L2b —
  say "the L2b direction disc / height rail / presets / az-el fields".
- **L3-7 (P2) — add-track entry point unspecified.** Our timeline has no global
  add-track dropdown — lane `＋` opens the per-object Actions palette
  (ui.js:1360-1363 `revealActionsFor`), and the hierarchy rows have per-object ensureTrack
  (ui.js:1472). With no object row (L3-5) there is no lane to ＋ from. Specify the
  entry: e.g. a "Daylight" item in the timeline empty-state/header (or the Actions
  palette pinned section) calling `ensureLightTrack()` (singleton:
  `tracks.some(t => t.characterId === 'sun')` guard; the lane ✕ may delete — re-add
  re-creates).
- **L3-8 (P2) — undo.** The light itself is NOT undoable today (the undo snapshot is
  {show, objects} — store.js:444-465; `this.light` lives outside). Key capture writes
  the show store → undoable via the existing `_commit` gesture brackets; the
  effLight/this.light split (L3-1) keeps undo from desyncing the rendered sun (undo a
  key → next frame's effLight recomputes → consistent). State this in the design.

---

## Cross-layer interactions (checklist J)

- **L2a × L3 ordering — safe.** Playback `evaluateAt` (main.js:1377) runs BEFORE
  `applyDaylight` (:1407) in the same frame; `shadowFit.tickAOr` (:1422) re-applies
  memo-gated. One apply per frame, no double-apply. With effLight (L3-1) the frame loop
  applies `effLight()` — a single path; the L3 hook must NOT also call applyDaylight.
- **L2a × harnesses — enumerated, no synchronous-read breaks.** r19 T1/T3/T4/T5/T8
  apply explicitly; T2/T7b sleep; r18 T5/T6/T7/T9/T10 sleep; r18 T2/T3/T4 depend on
  setClouds keeping its sync apply (L2a-1). Suites that call setLight* then read sun
  uniforms synchronously: NONE in the gates (verified r19_light_e2e.py:79-90/102-116/
  129-141/155-169/188-198/213-234/247-255; r18_sky_e2e.py:114-153/188-198/230-244/
  251-310/316-331).
- **L1 × L4 — consistent.** Wall tiles render through the same `renderFrame`/finish
  pipeline → bloom affects tiles exactly as the editor view; the matrix arms are
  finish-off so unaffected. No conflict.
- **L4 × L6 — disjoint.** L4 touches main.js camera-view + ui.js viewSwitch/frameGuide;
  L6 touches ui.js timeline + plan.js. Both touch ui.js refresh paths but different
  functions. No conflict.
- **L2b × L3 — ordering is right.** L3 lands LAST; its capture hooks target the final
  control set (fix the "puck" wording). L2a's idle-stamp must be shared with L3 (one
  `noteLightChanged()`).
- **L5 × L4 — no conflict.** The wall's DOM sits above the 3D canvas inside #viewport;
  cursor writes on `el` remain correct (the wall carries its own cursor styles).

---

## Overall verdict: **GO-WITH-CHANGES**

The design is unusually well-grounded (the three research docs are excellent and every
citation I checked resolved correctly), and the layer order (dependencies + risk first,
L3 last) is right. But it is NOT implementable as-written: two P0s and several gate
breaks must be fixed in the doc first.

**Required before any implementation (design-doc edits):**
1. **L4-1** — pin the feed-wall render contract: main-renderer scissor passes inside
   `renderFrame`, single-camera wall = full-canvas tile at record aspect, pose/fov from
   `evalPose` (or, alternatively, the ours.py/bb.py retarget — pick one).
2. **L3-1/L3-2** — the effLight pipeline (never mutate the persisted `this.light` from
   playback; at-rest/stop semantics).
3. **L1-1** — add r18 T9a to the test-update list (it WILL fail otherwise).
4. **L3-3** — schema bump is v12→v13, not v11→v12.
5. **L2a-2/L3-4** — the light-idle deferral must cover playback, not just drags (one
   shared stamp), with an explicit PMREM-while-playing decision.
6. **L2a-1** — record that setSkyStyle/setClouds/setAmbient keep their synchronous
   applies (r18 T2/T3/T4 depend on setClouds').

**Reordered implementation advice (keeping the design's L5→L2→L1→L7→L4→L6→L3 spine):**
- L5 first (trivial, isolated) — as designed.
- L2a before L2b (as designed) — but land the idle-stamp mechanism (`noteLightChanged` +
  sky bake policy) in L2a so L3 reuses it verbatim.
- L1 next — run the threshold-sweep battery BEFORE committing the constant, and update
  r18 T9a + r19 T6a/T6b (region masks) in the same commit as the constant change.
- L7 — self-contained; include the figure-walker E2E case with the D2 commit (no
  existing coverage).
- L4 — the biggest single layer; decide L4-1 (render contract) on paper FIRST, then
  implement wall + entry fix + viewSwitch sync + focusedCameraId together (they all
  touch the same applyMode/viewSwitch lines — one commit, one E2E).
- L6 — needs the L6-1 mount decision (overlay outside #tlLanes + the refresh guard)
  before coding; the heightMove segment-first fix can land independently/first (it is
  good regardless of the strip).
- L3 last — requires L2a's stamp + the effLight design; write `lightAtTime` as a pure
  function (oracle-testable) and add the no-track-scene byte-identity arm to its E2E.

**Gate re-run order after each layer:** matrix 7/7 → plan oracle 485/485 → r17 oracle
2501/2501 → r19 14/14 (updated T6) → r18 18/18 (updated T9a) → r14-r17 suites → the
layer's own new E2E. L4 additionally needs a manual m1/m5 spot-check on the first
wall commit (the capture contract is the one thing the unit tests won't catch).
