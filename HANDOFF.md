# HANDOFF — next session (immediate seam)

## State
Round 20 COMPLETE through the review-fix commit (GitHub + GitLab + /home/sync): ALL SEVEN user feedback items — sky bloom (2 root causes: the realistic body BLACK under finish since r18 behind a vacuous assertion; the classic fog cliff), the sun control redesign (direction disc + height rail + moon glyph) + the input-path lag fix (store-write-only setters + the LUT-dirt split + the PMREM stillness gate), the Daylight track (effLight pipeline, schema v13), the cameras FEED WALL (the editor camera never touched), the 2D cursor fix, the height strip on the timeline, and the draw-path look unlock (the ONE Look-at combobox + 5 engine gaps). 17 suites + 2 oracles green; the matrix 6/7 (m5 known issue). Dev server :3000 serves this tree.

## First 10 minutes
1. Restore if needed (rsync /home/sync -> /home/z/my-project/flick-3dEditor; git log -1 = the r20 review-fix commit or later; status clean).
2. `bash /home/z/my-project/scripts/sync-editor.sh`; the dev server runs via the platform (`curl localhost:3000/editor/index.html` — if dead, the platform manages it; do NOT manage it manually).
3. Read PLAN round-20 + this file.
4. Boot: `agent-browser close` + open `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<bump>`. The three-shim (node_modules/three at the repo root) survived r20 — the oracles need it.
5. THE OPEN ITEM: m5_cam_path matrix arm FAIL 2.058/96.89% (threshold 97.0 — SO CLOSE). The full analysis trail: scripts/r20_l4_ab_matrix.py + the notes in the L4 commit. Facts: the wall == the old lens at 0.17 mean in synchronous A/B; the humanoid's world pos/scale/evalPose/fov byte-identical at the capture moment between the passing f3111be tree and HEAD; the failure is TIME-DEPENDENT (a 60s bb-capture window shows the humanoid darker/higher than the golden); hiding the humanoid clears the hot pixel. Suspects not yet ruled out: a rest-eval/rig-settling difference that only manifests over ~60s of frames, or an evalPose/aim re-evaluation drift during the long capture. Start from scripts/r20_l4_ab_matrix.py (add a time-series: capture the hot pixel every 5s for 60s at HEAD vs f3111be).

## Env gotchas (standing + new)
- SANDBOX RECYCLES WIPE UNCOMMITTED WORK — commit before any review sub-agent and at every green gate. THE TASK TOOL TIMES OUT on long agents but the agent KEEPS RUNNING — poll `git log` + `git status` instead of assuming failure (r20's L6/L3 both landed this way).
- The watchdog rewrites .git/config — ALWAYS push with full PAT URLs (`source scripts/env.sh`).
- Backbuffer captures 1016x313 (or the matrix's 805x452); `?finish=1` persists in localStorage (clear after).
- r19 harness rules ALL STILL APPLY (the aim clamp pre-clear, high-vantage aims, NDC in-eval verify, >235 blob thresholds, ring/core deltas, center-most blob).
- NEW r20: the cameras view is THE WALL — any lens-style capture now enters stageView='cameras' + renderFrame (r15_shake's ported probes are the template). The wall hides the gizmo/labels/mesh during feed renders — don't re-add them.
- The sun control ids are NEW (#sunDir disc, #sunRail, knobs #sunDirKnob/#sunRailHandle) — old sunPuck probes are dead.
- The m1/m5 pixel contract: the single-camera wall renders through the NORMAL renderFrame path with the wall cam (this.camera.aspect, evalPose, the editor's near/far) — any change to renderFrame's wall branch re-runs the matrix.

## Seam notes (small — PLAN backlog outranks)
- The light-track LUT/PMREM interplay: a playing Daylight track re-dirties sky-view every frame; the 80ms throttle keeps the gradient live, the PMREM defers (trails by design). If a future ask needs IBL accuracy during sweeps, revisit the PMREM_IDLE gate.
- HDR_CLASSIC_BODY_GAIN (1.20) and HDR_REALISTIC_GAIN (80 — BODY-SAMPLE-only in the shader) are the r20 calibrations; the r18/r19 pendulum was ONE cliff (the dome horizon == fog color) — do not "simplify" the body-only gain back into the shared lift.
- m5's analysis scripts (r20_l1_sweep*.py, r20_l4_ab_matrix.py) double as the harness-regression canaries for the wall.
