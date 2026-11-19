# R19 PARITY LEDGER — the definitive functionality-parity inventory (flick-3dEditor port vs live bundle)

**Date**: 2026-11-19 (round 19, design item L6) · **Auditor**: parity-audit sub-agent · **Mode**: read-only (this file is the only write)
**Port**: `editor/js/*.js` (28 modules + vendor, 16,350 LOC) @ git `2c2d28b` (r18 wrap-up)
**Ground truth**: `analysis/index-DBE17t4T.js` (13,483,704 B minified bundle; offsets = byte positions) + `analysis/index-CaBu3A6T.js` (redeploy, lighting-stack byte-identical per r12)
**Method**: started from the existing registries (AUDIT_TRACKS/UX/ENV_UI r2, ROUND5_GAP_MATRIX r5, FIDELITY per-round logs, PLAN r1-r18, HANDOFF, CONTEXT, R19_DESIGN), then signature-anchored bundle scans (`MediaRecorder`, `beginRecording/toggleRecording/finishRecording`, `screenshotCamera`, `playSession`, `gamepad`, `keymap/gVr/qzt`, `sceneTabs`, `screenshotEpoch`, `previewWindow/pip*`, `outputs`, `"review"`, `onboard*`, `navTrack/navThumb`, `stage_*` chat schemas, `posthog`, `supabase`) with offset-context dumps, cross-checked against our modules. ≥15 EXACT claims spot-checked against round logs (appendix C).

**Status legend**: EXACT (oracle/E2E-certified) · PORTED (works, not oracle-verified) · APPROX (deliberate simplification, cited) · MISSING (bundle has it, we don't; sized S/M/L) · DORMANT (ported, no caller — owner cited) · OUR-EXT (our addition) · OUT-OF-SCOPE (cloud/SaaS).

---

## 1. Executive summary — is recording the last feature?

**Answer: the filming/recording arc is the last L-sized arc, and it is the last *feature* in the sense that its absence is the only thing that breaks a core previz workflow (Film button → toast, monitor REC → toast, cam-manual items un-creatable by flight, no takes, no outputs). But it is NOT the only remaining un-ported surface of notable size.** After it, the map to "full functionality parity" contains three more M-sized editor-runtime surfaces and a tail of S-sized polish:

| Remaining surface | Size | Class |
|---|---|---|
| **Recording arc core**: per-camera offscreen renderer + MediaRecorder (fe/B/we @5722400+, uqr @5717108), manual REC path + TC run state, samples→cam-manual, review mode, outputs panel, local take download, screenshotCamera | **L** (>2d; decomposes into M manual-core + M hub + S screenshot) | P0 |
| **Play sessions**: possess a humanoid, pointer-lock WASD, keymap clip bindings (qzt/gVr), 20 Hz sample recording → play items (startPlaySession @5538271, play controller @5716100+, finishPlayRecording @5539035) | **M** | P1 |
| **PIP preview windows**: floating per-camera live feeds in edit view, lock/screenshot/record/phone buttons, resize (CSS+logic @5835648-5845987, QXr placement math) | **M** | P1 |
| **Hub recording** ("Record" = film ALL cameras, batches of Jw=6, finalizing overlay w/ progress, offline-render path via the separate mp4-encoder chunk `index-CJPCiUUN.js`) | **M** (realtime path; offline/mp4 = defer or SKIP) | P1 |
| **Multi-scene tabs**: sceneTabs ZVr @5589187 (add/duplicate/rename/delete per tab; activeSceneId) — partially covered by our Scenes popover (load/library) | **M** (local-scene version) | P1 |
| Everything else (23 S-sized items: segment-editor fields, gazeSplit guards, Space key, Zae aspects, minimap, help dialog, thumbnails, r6r default scene, m3_dusk probe, icon semantics, …) | **S each** | P2 |

**What "full functionality parity" means here**: all editor-runtime surfaces above ported (or explicitly APPROX-ledgered), with the permanently out-of-scope set = cloud/SaaS shell (auth, projects/supabase persistence, Share/publish, canvas nodes, chat/AI agent, posthog analytics, phone WebRTC, video editor, media library, social notifications). Two user-mandated OUR-EXT surfaces (indoor lighting, realistic sky/clouds/HDR; plus shade modes, snap/grid, geo solar solver) are beyond-parity additions with no bundle counterpart.

**Recommendation**: the recording arc is correctly the next round (R20) and is the natural completion of camera-mode (as the r17 ledger anticipated). Do it as the manual-core first (REC in the monitor + samples + review + outputs + local webm download + screenshotCamera = one M-L round), then R21 play sessions, R22 PIP + hub, R23 multi-scene tabs, R24 the S-batch polish. After R24 the port is at functional parity for previz; residual APPROX rows (feed wall vs single lens, objectPoseAt folding, m3_dusk band, i18n labels) are ledgered or probe-scoped.

---

## 2. Full row table, grouped by subsystem

### A. Rendering & environment (P1) — 21 rows
| Functionality | Bundle evidence | Port status | Notes / our file:line |
|---|---|---|---|
| WebGLRenderer setup, shadowMap.autoUpdate + AOr fingerprint redraw | COr/fZt/AOr | **EXACT** | r2 log; fingerprint hashes full TRS (quaternion+scale) |
| Finish composer hKt (SSAO/blur/composite/dither, auto-measure) | hKt | **EXACT** | r2 VLM QA day PASS + night glow pixel-verified; finish.js |
| SOFT_TERMINATOR light patch | lights_physical_pars_fragment patch | **EXACT** | r2 defines verified in-browser |
| Stroke ring mask pipeline | hGr/uGr | **EXACT** | stroke.js 159 L; r2 VLM-confirmed |
| Clay props (all GLB mats → #e2e0dc rough-1) | FNr/qqt | **EXACT** | 21/21 clay verified r2 |
| Primitives + big-swap + base-anchor | wWr/lKt/_Wr | **EXACT** | r2 |
| Name colors Mje + night glow eKt | Mje/eKt | **EXACT** | r2 pixel-verified |
| Editor camera + orbit defaults | COr | **EXACT** | DOM-verified start pose |
| Classic sky dome shader (xyww, pow .55, flare) | xOr/yOr/vOr | **EXACT** | verbatim GLSL r2 |
| Daylight 7-stop table + DFr | HY/DFr | **EXACT** | byte-exact decimals; r2 round-trip |
| applyDaylight + memo + fog=horizon | wOr | **EXACT** | r2 |
| Sun direction + EL_REMAP −8/5/25 | M8r | **EXACT** | r2 hand-verified |
| Floor 80000²/128², polygonOffset 4/4 | wOr | **EXACT** | corrected r2 from raw dump |
| Dynamic fog near/far (pZt 400 ms, hysteresis) | FFr/SFr/CFr/pZt | **EXACT** | r2 |
| Shadow fit TOr | TOr | **EXACT** | r2 (exact normalBias formula found) |
| Planning-aids overlay pass (layer 1 traverse, no clearDepth) | EOr | **EXACT** | r2 corrected |
| Procedural props 13 | zqt | **EXACT** | r2 |
| Target/camera markers (torus, mie+urt 16-pt frustum) | YWt/mie/urt | **EXACT** | r9/r17: markers use derived active-camera focal |
| Humanoid/prop placeholders | u5r/eat | **EXACT** | r2 |
| Realistic sky (3-LUT Hillaire atmosphere), moon, stars, PMREM IBL, weather/altitude coupling | none (our addition) | **OUR-EXT** | sky.js 847 L (r10/r18); skyStyle 'realistic', schema v12 |
| Layered clouds (dome UV, weather-driven coverage, seed) + HDR (bloom + ACES + sky-lift) | none | **OUR-EXT** | clouds.js/bloom.js/finish.js (r13/r14/r18); classic path byte-identical (matrix 7/7) |
| m3_dusk near-horizon floor-brightness term S(y)×(1−f(y)) | live-only term (bundle cause unidentified) | **APPROX (open)** | r12/r14 forensics: fog validated exact; 3 suspects eliminated; residual ≤2.0 mean relax; next = live el sweep −2/−6/−8 |

### B. Objects & scene graph — 19 rows
| Functionality | Bundle evidence | Port status | Notes |
|---|---|---|---|
| 10 object kinds render + hierarchy parentId groups | iMr @5257400+ | **PORTED** | objects.js/store.js |
| Spawn grid 5×6 @1.5 m + default name counters + camera aimed at origin | addObject @5260119, V2e/rMr/nL | **EXACT** | r16 verbatim (spawn grid, sGt spotlight placement, defaultName numbered) |
| Select/toggle/multi/clear (+aim-pair exclusion) | setSelection @5792xxx | **PORTED** | r2/r6 |
| Group/ungroup (centroid, VWt world recompute, recursive delete) | groupSelection/ungroup @5261615 | **EXACT** | r6 live-exact rebuild; group@centroid+90° child world verified |
| Copy/paste w/ subgraph + tracks (+1.5 offset, roots only) | copySelectedObject/pasteObject @5788300 | **PORTED** | r5 UI-sweep id-keyed track cloning |
| Duplicate at position incl. paired target | duplicateObjectAt @5263324 | **PORTED** | r2 Die pairing |
| Delete cascade (subtree, camera→target, unlink) | remove @5263961 | **EXACT** | r6 (recursive + paired-target refusal) |
| reorderObject (draggable hierarchy rows) | @5265001 | **MISSING (S)** | P3; hierarchy is click-select only |
| Name/color rows (colorable kinds, live preview) | R$r @5553970 | **PORTED** | r6 (color row + clear) |
| Spotlight settings (shape/intensity/diffusion + cookie + slot budget) | setSpotlight @5266780 | **EXACT** | r5 exact oOr/iOr/e6r; shadow verified |
| Spotlight "shadowless" hint when out of slots | jNG72M @5557810 | **MISSING (S)** | P3 |
| Person-kind switch + conflict confirm + strip + rename | pickPersonKind @5810535 | **EXACT** | r15 verbatim (UNr/Yqt/toast/removeHumanOnly) |
| Animation record (clip/playing/held pose) | setObjectAnimation/setObjectPose @5266660+ | **EXACT** | r15 held-pose family, oracle 124/124 |
| Target marker reconcile (auto-create on subject-less cam-move) | ensureTargetMarker/dropTargetMarker @5258485 | **MISSING (S)** | P3 |
| Live-pose inspector readout (evaluated TRS + authoredValues ghosting) | livePose @5257829, @5554408 | **MISSING (S-M)** | P2; inspector shows stored TRS |
| drivenBy hint | @5554420 | **PORTED** | r6 (ui.js:779-784) |
| Prop catalog 1426 GLB + 13 procedural | zh catalog | **EXACT** | r2; catalog verified |
| Upstream flick-3dstage scene format (9 scenes lossless) | n/a | **OUR-EXT** | r7 (v10→v11 migration) |
| Humanoid per-instance GLB (no scene steal), 46 clips, crossfade .25 | AWr | **EXACT** | r2 P0 fix + r5 AWr exact port |

### C. Palettes & add surfaces — 8 rows
| Functionality | Bundle evidence | Port status | Notes |
|---|---|---|---|
| Actions palette M5r (3 tabs, search, tiles, click/drag-add, gating, close-after-add) | @5120036-5122700 | **EXACT** | r8 verbatim (tmp_palette_exact 122 units); animated clip-tile previews (drawPose) included |
| Components column (drag rows, canvas thumbnails, ghost cache) | Xqt/VUr @5363293/5621422 | **EXACT** | r16 verbatim, E2E 34/34 |
| Prop picker (1439, categories, search) | zh/D2r | **PORTED** | modal instead of column (documented) |
| Viewport drop (BUr candidates/glow/hover/capture) | BUr @5603400+ | **EXACT** | r8/r16 (incl. segment-drag-to-object c21540e) |
| Lane drop (nCr magnet _ie) | nCr | **EXACT** | r8 |
| Plan-canvas component drop | @5498370 + dropComponentAt @5866176 | **EXACT** | r17 seam, E2E 3/3 |
| Play/rig tile icon semantics ('gamepad'/'person' vs our 'play'/'pose') | K name="gamepad"/"person" @5124718 | **APPROX** | r8 ledger; cosmetic |
| gVr key-slot drop (3rd MDe consumer — play keymap binding) | gVr @5572082 | **MISSING (S)** | extracted (tmp_palette_exact/fn_gVr.js); needs play editor (see F) |

### D. Tracks & timeline — 22 rows
| Functionality | Bundle evidence | Port status | Notes |
|---|---|---|---|
| 14 item kinds + eval (path/clip/play/rotate/revolve/scale/transform/rig-transform/cam-still/move/path/follow/transform/manual) | BHr @5524600+ | **PORTED** | tracks.js; play/cam-manual evals exact (r1/r17) |
| Block drag: magnet 12 px + obstacle push + reorder preview + snap guides | q5r/kGt/lje/W5r/MP | **EXACT** | r3 place.js audited EXACT; ui.js:1585-1620 |
| Alt-drag duplicate (ghost, cross-lane, Art gate) | Art/DHr | **EXACT** | r4 P3 batch verified |
| Trim handles (clip dur, path speed=arc/dur, clamps) | nCr trim | **EXACT** | r3 |
| Keyframe diamonds (click select+seek, drag move, active/selected, delete) | SCr/xbe/B2r | **EXACT** | r3/r4; + key list jump/delete in inspector |
| Segment selection + mutual exclusion | selectSegment @5530430 | **PORTED** | |
| Take-range tool (draw/grips/label/magnet/persistence; refuse while filming) | xTr/Tie/PGt/setTakeRange @5548675, She @4320286 | **EXACT** | r4 E2E; "disabled while filming — never offline" |
| Magnet toggle (header) | magnetEnabled | **PORTED** | btnSnap (r6) |
| Ruler seek + ctrl-wheel zoom + tick table | eCr/YAr/VAr | **PORTED** | r2 P1 scroll fix; span = max(10,dur+5) vs live UAr=max(5,maxEnd) — **open P3** |
| Scroll minimap (navTrack/navThumb) | @5158926 | **MISSING (S)** | P3 |
| Painting block during path paint (blockPainting) | CSS class | **MISSING (S)** | P3; lane shows item only ≥2 anchors |
| Track headers (name, remove, lane "+", lane-head select) | QTr/laneAdd | **PORTED** | r17 lane-head click/dblclick + selectedTrack |
| Per-kind segment editors | fVr @5556460 | **PORTED (partial)** | path/cam-path/clip/rotate/revolve/scale/transform-family ✓; **missing**: cam-move Subject select + Nit aimOffset + dolly_zoom focal (S), cam-still Subject select (S), play editor (see F) |
| Keyframe cluster (prev/next/toggle) | pVr @5556440 | **PORTED** | ◆ Key + ◀/▶ + key list |
| Play/stop/seek + Space togglePreview | playPerformance @5542300; Space @5638104 | **PORTED (Space MISSING, S)** | btnPlay = Rehearse; no Space binding |
| Undo/redo (gesture brackets, coalescing, canRestoreHistory gate) | nMr @5256604 | **PORTED (APPROX gate)** | r5 rewrite; live gates on review/recording/manualFlight (recording-arc rows inert offline) |
| moveItem/reorderItem | kGt @5541250 | **PORTED** | |
| replaceMoveFromSamples (stroke→path, steady pace) | @5533400 | **EXACT** | r7 oracle (485/485 incl. it) |
| Lane +track dropdown (rCr search) | rCr | **PORTED** | r6 (search dropdown, precedence+caret fixed) |
| Samples→path conversion (points/pace/durationS from samples) | vHr family @5519212 region | **PORTED** | consumed by play recording (dormant until play sessions) |
| Undo coverage (objects+show observers) | history class | **PORTED** | r5/r6 |
| packItems lje | @5139400 | **EXACT** | r2 byte-equivalent |

### E. Path editing — 8 rows
| Functionality | Bundle evidence | Port status | Notes |
|---|---|---|---|
| Paint mode (append/insert-after-start j2r, ground snap, flown-vs-walked Y) | enterPathEdit family | **EXACT** | r13 draw-path audit (3 P0 + 6 P1 all fixed, oracle 485/485) |
| Path visuals (anchors, numbers, tangents, height ladder, violet curve) | UGr | **PORTED** | paths.js |
| Height-curve editor (points/handles/insert/remove/scrub, Kzt validation) | sLr/oLr/lLr/cLr/uLr @5466360+ | **EXACT** | r8 verbatim |
| Anchor ops (move/set-height/handles/delete + auto-select) | @5531900-5533050 | **PORTED** | delete key wired (manipulate.js) |
| Finish-path UX (Esc/Enter + <2 anchors → remove) | finishPerformancePaint | **EXACT** | r13 (setCameraFocus/gates verbatim) |
| shiftPaths (nudge paths when object moves) | @5534100 | **PORTED** | r7 (3-way divergence fixed in review) |
| Draw-direction strokes → paths (2D plan + 3D) | stroke pipeline | **EXACT** | r7/r13 |
| curveDisplayPoints 64-pt resample | Q2r | **PORTED** | time-fraction mapping fixed r7 |

### F. Posing & animation (humanoids) — 9 rows
| Functionality | Bundle evidence | Port status | Notes |
|---|---|---|---|
| 46-clip catalog + durations | Lhe @5063320 | **EXACT** | byte-exact r2 |
| Clip timeline items (change resets duration, IDe min .1) | addClipItem N8=5 | **EXACT** | r8 (N8=5 FIXED) |
| Posing UX = actions palette Animate tab (tiles + drag/click-add) | M5r/vGt | **EXACT** | r8 (the r5 "MISSING" is closed) |
| Held-pose baking (setObjectPose → bakeRigPoseSegment → rig keys) | @5266864/@5793269 | **EXACT** | r15 oracle 124/124; no user-facing pose picker in live (AI-ops-only N @5327100 — verified) |
| Rig-transform keyframes (add/remove/move/merge, latest-wins T2r) | @5526000+/5531170 | **EXACT** | r14/r15 |
| Rig posing UX (22 joint spheres, single/multi-joint drag, capture) | xqr/mBe/Dzr/Fzr @5731200+ | **EXACT** | r14 verbatim, 2 E2E suites |
| Gaze/head aim (gazeSplit xM, DEF neck .4/head .6, jZt/EZt/IZt) | @5451500+ | **EXACT (2 guards MISSING, S)** | pitch/axis fixed r2; open: horiz<1e-6 early-out + headYaw π−\|c\| behind-target term (r2 P2s, still absent — verified tracks.js:125-138) |
| **Play sessions** (possess humanoid, pointer lock, WASD + keymap clips qzt, 20 Hz samples → play item, cap rqr) | startPlaySession @5538271, play controller @5716100-5716600, finishPlayRecording @5539035, play editor + gVr key slots @5566159 | **MISSING (M)** | the "gamepad mode"; eval side exact (play items eval since r1); icons: gamepad/person |
| Clip fade/rest at playback & rest (paused semantics) | AWr.b | **EXACT** | r5 (T-pose flicker root-caused, 0 flashes) |

### G. Camera system — 20 rows
| Functionality | Bundle evidence | Port status | Notes |
|---|---|---|---|
| Camera object + GLB marker + 16-pt frustum (page focal + record aspect) | mie/urt | **EXACT** | r2; r17 derived active-camera focal |
| Through-the-lens cameras view (adopt evaluated pose, hide own mesh, fov=Z_ per frame) | stageView cameras | **EXACT (pixel)** | r8 + r9 oracle: mean 1.3/255, 97.81% ≤8; feed-WALL vs our single lens = **APPROX (M if ported)** — live XXr wall @5831607 (grid/wall/pager/tiles/filming/waiting) |
| Item-less camera in cameras view | live renders mesh-pose feed | **APPROX** | ours freezes (r9 ledger) |
| Focal length control (inspector mm + footer slider log-interp 14-200) | wVr/hOa | **PORTED** | r17 setFocalLengthMm writes the object |
| Aspect picker (Zae 6 presets) | Zae @3920360 | **PORTED (APPROX)** | decimal literals 1.85/2.39 vs our w/h → 0.0045° fov delta (r9 ledger, still open — const.js:185) |
| Handheld shake select (off/subtle/medium/heavy + rigs) | xVr/setCameraShake @5150412 | **EXACT** | r15 apply (oracle 678/678) + r17 rig stride live in viewfinder; global cameraShake/active-camera surfaces = recording-arc-only (ledgered dormant) |
| cam-move items (8 moves + presets + orientation-correction blend) | KCe/fFr | **EXACT** | r2 (crane_down sign, pan_sweep anchor fixed) |
| cam-still w/ subject framing | Cit/NP | **PORTED (editor S)** | eval exact (r9 W-resolver); inspector lacks Subject select |
| cam-follow (objectId + offset captured on drag) | LHr/V8r | **PORTED** | offset via drag-commit (r2); live editor = Object select only — **at parity** (backlog item moot) |
| cam-transform keys (slerp + focal lerp, cluster capture) | cZt @5428400+ | **EXACT** | r2 |
| cam-manual items (eval nearest sample, shakeBaked gate z2r) | @4316695 | **EXACT** | r15/r17; **creation via flight**: arm/start/finishManualFlight ported (r17, draft cleanup verbatim @5799950) — but no sampler feeds real samples (see recording arc) |
| reaim on subject change | reaimCamera @5526500 | **PORTED** | r2 |
| setCameraFocus (focus/clear + keepLook + refusal + toast) | @5544109 | **EXACT** | r13 verbatim |
| Frame guide (record-aspect overlay + fov adoption) | XGt/o2r/MGr | **EXACT** | r2 checkpoint |
| Camera pills + height/lens footer | hOa | **PORTED** | ui.js:1111-1124 |
| **Manual recording (REC)**: per-camera offscreen renderer (B: WebGLRenderer+finish hKt + pZt fog), 2D canvas composite, uqr MediaRecorder (60 fps, 12 Mbps, mp4→webm codec pref), tickCapture, startRecording/stopRecording + startManualClock, toggleRecording @5146387 (mode camera gate), beginRecording/finishRecording/settleRecording @5144289-5147886, REC state + TC run (Zjr), short-take warning (Sie=3s) | fe/B/we @5722400-5725500, uqr @5717108, camera store @5144117+ | **MISSING (M-L)** | monitor.js:67 REC button = toast; TC frozen 00:00:00:00; main.js:1699 finishManualFlight already writes samples (qA=20, shakeBaked) — the capture loop is the gap |
| **Hub recording** (Record-all, batches Jw=6, finalizing overlay w/ progress, offline render + mp4 encode via chunk index-CJPCiUUN.js, repair Z5r, capture-rate failure analytics) | startHubRecording/finalizeHub/renderHubTakes/repairHubTakes @5146700-5148300 | **MISSING (M; offline-encode path deferrable)** | header recordControls/recordButton @5834851; finalizingScrim/Card CSS |
| **Outputs + review mode**: outputs/outputCameraLabels/outputCameraIds, manualReviewCameraId, setMode("review") @5146092, ReviewPanel hHr @5519212 (outputs list, saveVideo/saveAllVideos @5812773+, goToCanvas, discardOutput), savedVideos/savingTake, discardOutput re-arms lastFlight | @5143549+/5519212/5812773 | **MISSING (M)** | page.mode = edit|camera only (store.js:1119); canRestoreHistory review gate inert |
| screenshotCamera (captureCameraImage → PNG; live saves to project via videoSaver) | @5811461/5144223 | **MISSING (S)** | cloud-save part OUT-OF-SCOPE; local PNG download is the offline substitute |
| **PIP preview windows** (per-camera floating live canvas, resize QXr, lock, screenshot, record, phone; 340×180 default) | previewWindow/pip* CSS + logic @5835648-5845987 | **MISSING (M)** | edit-view surface |
| be/ae (aimHubCamera + capture-pose path) | be = aimHubCamera @5729062 region | **MISSING (with recording arc)** | ledgered dormant r15/r17 — recording-arc-only, correct to defer |

### H. Lighting UI — 4 rows
| Functionality | Bundle evidence | Port status | Notes |
|---|---|---|---|
| Sun puck popover (az/el scrub, 4 presets, numeric) | TQr/AQr | **PORTED** | r6 polish |
| Geo solar solver (time/date/lat/alt → az/el; true-north) + weather 5 states + indoor ambient | none | **OUR-EXT** | r6 D2-D7 (user-mandated beyond-parity); live = manual az/el only |
| Spotlight shadows (slot budget, cookie, beam) | e6r/iOr/oOr | **EXACT** | r5 |
| Night lantern glow | eKt | **EXACT** | r2 |

### I. Viewport & navigation — 14 rows
| Functionality | Bundle evidence | Port status | Notes |
|---|---|---|---|
| Orbit/pan/zoom + floor clamp + polar limit | Dqr/Uit | **PORTED** | |
| Wheel zoom-vs-nav classification + ctrl-wheel timeline zoom | Vzr | **PORTED** | r6 cursor-anchored zoom |
| WASD fly (Q/E, Shift ×3, gates) | bot/ne() | **PORTED (EXACT gates r17)** | ha verbatim incl. full ne() gates |
| Dqr zoom anti-jitter m() (Oqr .05 px) | Dqr.m | **MISSING (S)** | P3 (edge polish) |
| Right-drag free-look (unreal mode) | te/xot .0022 | **OUT-OF-SCOPE (moot)** | unreal control-mode removed by user directive E2 |
| Nav ball pad (rolling icosa, drive 4 m/s) | lZr/zzr/Ye | **EXACT** | r3 (constants+math review-EXACT) |
| Lasso box select | br/Nr/ua/qe | **EXACT** | r3 |
| Selection footprints + hover disc | pGr/cGr/dGr/CGr | **EXACT/PORTED** | r2 fixes (rotation sign, screen bounds) |
| Stroke ring | hGr/uGr | **EXACT** | r2 |
| Custom gizmo meshes (Mzr/Pzr/Nzr + amber hover) | Mzr @5641xxx | **EXACT** | r4 |
| Shade modes (Shaded/Flat/Wire) + snap + ground grid | none | **OUR-EXT** | r6 B5/B6 (live has neither — verified) |
| Help/cheatsheet dialog ("?" — device+mode tables, Watch tutorial, Replay onboarding, Copy scene JSON) | bPr @5384784 | **MISSING (S-M)** | P3; copy-scene-JSON trivial locally |
| Preferences dialog (input device, control mode) + audience picker prompt | yPr @5385920, pPr @5379856 | **OUT-OF-SCOPE (moot)** | control-mode switch removed by user E2; device bindings default-only |
| Onboarding coach-mark tour (steps pick/nav-choice/orbit/pan/zoom/ball/camera/timeline/record/save/chat, dwell timers, progress) | l7r @5401965+, data-onboard-target | **MISSING (M, non-goal)** | P3 non-goal offline; our hooks: data-onboard-target (palette) + addNavProgress DORMANT (store.js:1139, no consumer) |

### J. Selection & manipulation — 7 rows
| Functionality | Bundle evidence | Port status | Notes |
|---|---|---|---|
| Click select/multi/dblclick focus/empty deselect (slop 8, 350 ms/14 px) | ua/JEe/YUr | **PORTED** | r2 |
| Commit pipeline SZt/kZt (keyed camera/target, cam-follow offset V8r, cam-move rebase GOr, VOr/UOr gates, reaim, unbased/dup-delete, paired-target POr) | SZt @5448338 | **EXACT** | r2 (the full checklist) |
| Alt-drag duplicate in viewport | @5643978 | **PORTED** | r2/r4 |
| deleteFocused cascade (keyframe→item→track→objects) | @5811133 | **EXACT** | r17 |
| Keyboard core (⌘Z/⇧⌘Z/⌘Y, ⌘C/V, ⌘G, Del, Esc/Enter, Z/X/C tools, F focus) | Hzr/Bzr/S9r @5375752 | **PORTED** | default-mode Z/X/C correct; unreal W/E/R moot |
| Rotation multi-turn snap (GA/ybe antipodal unwrap) | GA @3923339 | **EXACT** | r17 seam (objectChange wiring) |
| Hover cursor (SVG dot) + click ripple | mGr/AGr | **MISSING (S)** | P3 cosmetic |

### K. File ops & persistence — 8 rows
| Functionality | Bundle evidence | Port status | Notes |
|---|---|---|---|
| Scene JSON save/load + migrations v1→v10 (+v11/v12 ours) | f6r/iGt/s6r | **PORTED** | schema.js; r9: f6r chain byte-matches |
| Autosave | server autosave | **OUR-EXT** | localStorage 1 s debounce substitute |
| ?scene= param + samples | n/a | **OUR-EXT** | |
| Scene name editing | top bar | **PORTED** | r5 |
| Copy scene JSON to clipboard | help dialog @5807150 | **MISSING (S)** | P3 (trivial locally) |
| **Multi-scene tabs** (add/duplicate/rename/delete, activeSceneId; send-to-canvas = cloud) | ZVr @5589187, activeSceneId @5794340 | **MISSING (M local version)** | our Scenes popover covers load/library/new-empty/open-file (r7) — no in-project scene switching |
| Scene thumbnails (screenshotEpoch → scene node still) | @5401965/5807072 | **MISSING (S-P3)** | cloud-tied (save to project); local cache possible post-recording-arc |
| enterSceneNode/leaveSceneNode (canvas integration) | @5786267 | **OUT-OF-SCOPE** | cloud canvas |

### L. Shell / cloud surfaces — classified, not ported by design
| Functionality | Bundle evidence | Verdict |
|---|---|---|
| Chat/AI agent panel (stage_show/stage_object/stage_camera/stage_read command schemas, applyPose agent) | @5313308+, applyPose @5327312 | **OUT-OF-SCOPE** (cloud AI) — but the store APIs it drives are ported; the applyPose/bakeRigPoseSegment flow shipped r15 (scene-compat path) |
| Auth/projects/supabase persistence (stage_scenes REST) | @4914562+ | **OUT-OF-SCOPE** (R9 harness uses it read-only for the oracle) |
| posthog analytics + feature flags | ph_* blobs | **OUT-OF-SCOPE** (harness-only) |
| Share/publish/notifications/Flickpedia/credits/top-bar tabs | product shell | **OUT-OF-SCOPE** |
| Video editor surface (waveform AudioContext @5765587, mediabunny mp4 muxing) | separate app surface | **OUT-OF-SCOPE** (the stage recording arc reuses its encoder chunk only) |
| Phone filming (WebRTC, phone status card) | handlePhoneRecord/armNodePhoneFlight | **OUT-OF-SCOPE** (live-only; r17 monitor omits by design) |
| User onboarding questionnaire/social tips | supabase profiles @1422456, tips @9757913 | **OUT-OF-SCOPE** (SaaS) |
| i18n catalog (all UI strings) | `_._({id})` everywhere | **APPROX** — semantic English labels (SKILL #34/#41, ledgered r17) |

### M. Engine/misc — 5 rows
| Functionality | Bundle evidence | Port status | Notes |
|---|---|---|---|
| Curve subsystem (mT sqrt-chordal, beziers, polyline, arc, pace, heightAt) | @3926329+ | **EXACT** | r2 (mT P0 fixed, verified [1.149,0,.456]) |
| Character eval eEe / object fold Q/L/ne / camera eval dZt/fFr | @5699800+ | **EXACT** | r2 (base-TRS seeding P0 fixed) |
| objectPoseAt (rig quaternion/yaw folding at t) | le @5705000 region | **APPROX** | ours returns position only (r9 ledger); aim uses position only → inert for aim; matters for follow parity (S-M) |
| nearestSegmentXZ (chord distance + tie-breaks) | j2r @3926460 | **PORTED (tie-break open, S)** | chords + start-anchor index fixed r2; equal-distance tie-break preference remains |
| r6r populated default scene (figure+camera+orbit item) | r6r | **MISSING (S)** | ours: emptyScene only |
| fov edge cases (empty-keys/samples override in cam item editors) | r2 audit P2s | **MISSING (S)** | open P2 pair |

---

## 3. Ranked gap list (re-ranked)

### P0 — breaks/limits the core previz flow
1. **Recording arc — manual core** (M-L): fe/B/we offscreen per-camera renderer + 2D canvas + uqr MediaRecorder + tickCapture/manual clock + toggleRecording (REC in monitor: run state + live TC + R key) + samples→finishManualFlight (already wired to write cam-manual items) + review mode + outputs panel + **local take download** (webm) + discardOutput re-film + screenshotCamera PNG download. Everything else in the camera-mode port (r17) is in place and oracle-certified — this is the natural completion.

### P1 — visible feature gaps users will hit
2. **Play sessions** (M): possess-humanoid mode (pointer lock, WASD drive, keymap clip bindings qzt/gVr key slots, jump/crouch/sprint/walk/idle clip selection, 20 Hz sample recording with rqr cap) + the play segment editor (gamepad button + key slots + samples count). Blocked-ish on nothing; shares the sample→item plumbing with the recording arc.
3. **PIP preview windows** (M): floating per-camera live previews in edit view (resize, lock, screenshot, record, phone-omitted), QXr placement math.
4. **Hub recording** (M, can trail): Record-all cameras (batches of 6), finalizing overlay with progress, realtime path only; offline mp4-encode path (separate chunk) = defer/SKIP offline.
5. **Multi-scene tabs** (M local): in-project scene list + tabs (add/duplicate/rename/delete); cloud sync out of scope.
6. **Screenshot** (S — fold into R20): screenshotCamera → local PNG.
7. **Segment editor remainder** (S): cam-move Subject select + aimOffset (Nit) + dolly_zoom focal field; cam-still Subject select.

### P2 — polish
8. AUDIT_TRACKS P2 remainder batch (S): gazeSplit horiz-guard + π−|c| head-yaw term; nearestSegmentXZ tie-break; the 2 fov edge cases; r6r default-scene factory.
9. Space→Rehearse keybinding (S).
10. Zae decimal aspect literals (S, 0.0045° fov delta).
11. objectPoseAt quaternion folding (S-M; inert for aim, follow-parity).
12. Cameras-view feed wall XXR (M, optional — single-lens APPROX is pixel-certified for 1 camera).
13. Inspector batch (S): rotation in degrees (live shows degrees, ours radians), live-pose readout + authoredValues ghosting.
14. Timeline batch (S): span = max(5, maxEnd) (UAr); scroll minimap; painting-block live ghost.
15. Help/cheatsheet dialog + copy-scene-JSON (S-M).
16. Palette icon semantics gamepad/person (S, cosmetic).
17. m3_dusk S(y) residual — live el sweep probe (S; analysis only).
18. reorderObject drag rows + target-marker reconcile + spotlight shadowless hint (S each, P3).
19. Onboarding coach-mark tour (M, **non-goal** — recommend keep as non-goal; hooks dormant).
20. Scene thumbnails (S, after recording arc; local cache).

### Permanently ledgered APPROX (no action recommended)
- i18n semantic-English labels · modal prop picker vs column · drop-raycast scans all hits (improvement) · item-less-camera freeze · feed wall vs single lens (unless #12) · markSegmentDropTaken dead on both sides (parity) · m3_dusk mean≤2.0 relax · Zae (unless #10).

---

## 4. Recommended round-20+ backlog order

1. **R20 — recording arc core (P0 #1 + #6)**: manual REC (offscreen renderer + uqr + TC run state + R key), samples→cam-manual (un-dormant finishManualFlight), review mode + outputs panel + local webm/PNG download, screenshotCamera. Oracle: port fe/B/we/uqr verbatim from @5716545-5725500 + camera-store @5144117-5150500; adapt videoSaver→local blob download. E2E: REC→review→download round-trip; take-short warning; discard re-film; matrix 7/7 must stay green (app-level).
2. **R21 — play sessions (P1 #2)**: play controller + startPlaySession + keymap editor + gVr key-slot drop + gamepad/person icon semantics (closes the r8 ledger row). Shares samples plumbing with R20.
3. **R22 — PIP previews + hub recording (P1 #3/#4)**: PIP windows (lock/screenshot/record ride on R20 capture primitives); hub Record-all realtime + finalizing overlay; skip/defer the offline mp4-encode chunk path.
4. **R23 — multi-scene tabs (P1 #5)**: local scene registry + tabs + add/duplicate/rename/delete + thumbnails (#20) — the last M surface.
5. **R24 — parity polish batch (P2 #7-#18)**: segment-editor fields, AUDIT_TRACKS P2 remainder, Space, Zae, degrees, span, minimap, help dialog, live-pose readout, m3_dusk el sweep probe, feed-wall decision (port or ledger-final).
6. **Rolling gates**: pixel matrix 7/7, plan oracle 485/485, r17 oracle 2501/2501, r15/r16 suites; any recording-arc render change must re-run the classic-identity gate.

**Full-parity checkpoint**: after R23 (+R24 polish), every editor-runtime bundle surface is ported or explicitly ledgered; remaining deltas are the APPROX ledger + OUT-OF-SCOPE cloud shell. Recording is therefore the last L, and R20-R23 (≈4 focused rounds) is the full remaining map.

---

## 5. Appendix A — bundle offset index (for R20-R23 implementers)
- Camera store nTr (recording state machine): `@5143823-5150500` — captureViewport @5144167, captureCameraImage @5144223, beginRecording @5144289, toggleRecording @5146387, finishRecording @5147886, settleRecording/finalizeHub/renderHubTakes/repairHubTakes @5146700-5148300, discardOutput @5149652, setCameraShake @5150412, canPreview/togglePreview @5150112, outputs/outputCameraLabels @5143549+, setMode("review") @5146092.
- Scene adapter (capture/render): `@5722400-5729500` — B renderer factory, we singleton, xe 1×1 scratch, oe hub start, ye hub stop, uqr MediaRecorder @5717108, iqr codec list @5716545 (mp4→webm), oqr=60 fps, lqr=12e6 bps, gKt/mKt mp4 encoder (chunk import), fe manual start, tickCapture ve, aimHubCamera be, W resolver (objectPoseAt folding) @5720166.
- Play controller: `@5716100-5716700` (crouch/sprint/walk/jump clip select, qA=20 sampling, rqr cap); store startPlaySession @5538271, setPlayRecording @5538919, finishPlayRecording @5539035; keymap qzt @4315236; gVr key-slot @5572082; play editor @5566159.
- Review/outputs UI: ReviewPanel hHr @5519212; saveVideo/saveAllVideos @5519368/5812773; discardOutput facade @5795331.
- PIP: previewWindow/pip* CSS + QXr placement @5834851-5845987 (HYr=340, $Yr=180, VYr=560, UYr=4).
- Feed wall: XXr CSS @5831607 (wall/pager/tiles/filming/waiting, Hje=14).
- Scene tabs: ZVr @5589187; activeSceneId @5794340; screenshotEpoch @5401965/5807072.
- Help dialog: bPr @5384784; onboarding tour l7r @5401965+ (bje step list).
- Misc: reorderObject @5265001; ensureTargetMarker @5258485; Jw=6 hub batch @4902120.

## 6. Appendix B — our-side dormant/extension inventory
- DORMANT: addNavProgress (store.js:1139, onboarding signal, no consumer) · monitor TC (frozen until recording) · REC button (toast) · markSegmentDropTaken (dead on both sides — parity) · cam-manual sample-writer (main.js:1699 — fires only with samples; no sampler yet) · vHr-style samples→path conversion consumers (plan.js replaceMoveFromSamples is live; the play-samples consumer awaits play sessions).
- OUR-EXT: realistic sky + moon + stars + PMREM IBL (sky.js), layered clouds (clouds.js), HDR/bloom (bloom.js/finish.js), indoor lighting + geo solar solver + weather 5 states (env.js), shade modes + snap/ground grid (viewport-modes.js/main.js), Scenes popover + upstream scene library (schema r7), localStorage autosave, file save/load.
- Verified-absent in bundle (so OUR-EXT is safe): indoor lighting (2 content-string hits only), shade/wireframe toggle, snap grid, geo/time-of-day solver — r6 R3 verdicts re-confirmed this round.

## 7. Appendix C — EXACT-claim spot-checks against round logs (15 checked, all certified)
1. Finish composer hKt EXACT — FIDELITY r2 log: VLM QA day PASS + night-glow pixel-verified ✓
2. Plan canvas exact port — r7: oracle 485/485 non-vacuous, reference = verbatim bundle fns ✓
3. Actions palette M5r — r8: 122 byte-verified units + 2-agent review (REJECT→applied) ✓
4. Take-range tool — r4 log: grips/magnet/per-move radius/undo E2E-verified ✓
5. Gizmo custom meshes Mzr — r4 log: 3-mode VLM PASS, X-drag commit +1.838 ✓
6. Lasso — r3 log: rect select + Xu skip + Esc E2E ✓
7. Nav ball — r3 log: rim stick −0.99997, 4 m/s drive math exact ✓
8. mT sqrt-chordal — r2 log: middle-anchor [1.149,0,0.456] hand-computed ✓
9. Camera-mode subsystem — r17: ORACLE 2501/2501 + E2E 31/31 (REC-toast divergence explicitly ledgered — the EXACT claim is correctly scoped to drive/rig/monitor sans filming) ✓
10. Shake apply — r15: oracle 678/678 ✓
11. Rig posing UX — r14: verbatim xqr/Dzr/Fzr + 2 E2E suites ✓
12. Component family — r16: E2E 34/34 + segment 16/16 ✓
13. Pixel matrix 7/7 — r12 (means 0.353-1.630) re-verified identical r18 ✓
14. Draw-path exact — r13: audit 3P0+6P1 fixed, oracle 485/485 ✓
15. Held-pose family — r15: oracle 124/124 ✓
16. (bonus) Person-kind switch — r15 verbatim + P1 fix re-verified ✓

**Honesty note**: no EXACT row in this ledger relies on r5-matrix-era status; every EXACT row above traces to a round log with an oracle/E2E number or an in-browser verification note. PORTED rows are believed-working from round logs but lack per-function oracles (the r2 audit's residual P2s — gazeSplit guards, fov edges, tie-breaks — are carried in the gap list, not silently upgraded).
