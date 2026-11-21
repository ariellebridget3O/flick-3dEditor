# HANDOFF — next session (immediate seam)

## State
Round 22 COMPLETE at bbe9f87 (GitHub + GitLab + /home/sync): the auto-fit provenance sweep + BOTH self-added view adaptations removed (the r7 plan setVisible re-fit — every 2D↔3D toggle lost pan+zoom — and the r21 toggleDrawing centerOn; the ORIGINAL does neither). Everything else the user might call "auto-fit" was verified ORIGINAL and kept (focusObject fly-to on add/drop/dblclick/alt-click/cam-tile-click, plan fit-ONCE, the Fit button, goToCamera, edge autopan, resize-keeps-center). BUILD badge bumped r21→r22 (the stale-tab detector). Server restarted via init-fullstack.sh and serving r22.

## First 10 minutes
1. Restore if needed (GitLab mirror clone; the three-shim node_modules/three is GITIGNORED — copy it from /home/sync/flick-3dEditor/node_modules to the repo ROOT or the oracles fail with ERR_MODULE_NOT_FOUND).
2. `bash /home/z/my-project/scripts/sync-editor.sh` (rsync flick-3dEditor/editor/ → public/editor/, 1501 files); the dev server is platform-managed (init-fullstack.sh) — never manual. After a sandbox recycle the stale next-dev tree holds :3000 — kill pids in .zscripts/dev.pid + `ps aux | rg next` before init.
3. Read PLAN round-21/22 + this file.
4. Boot: fresh agent-browser session, `?scene=samples/synthetic_tracks.json&noAutosave=1&v=<bump>`.
5. OPEN ITEM: m5_cam_path 96.89% vs 97.0 (unchanged from r20; the analysis trail is in the r20 L4 commit + scripts/r20_l4_ab_matrix.py).
6. SANCTIONED DIVERGENCES (ledgered in FIDELITY): tDr 1→3 glide; drawn cam-path aim 'locked'→'travel'; dblclick-to-edit; the r13 cloud field (the r18 anchor table + floors + blob masks deleted — r18 sky T2/T3/T2b fail BY DESIGN and must not be "fixed"). REVERSED r22 (now original-faithful): NO re-fit on plan show, NO centerOn on draw start — r21_e2e T7 asserts NO-recenter and T7b asserts view persistence across 2D↔3D toggles.

## Env gotchas (standing + new)
- THE USER'S REVIEWS CAN BE STALE — if a review says "zero changes", ask them to check the r-badge in the stage header BEFORE diagnosing. Current badge: r22.
- Synthetic path-draw strokes in tests need MULTI-EVAL drags (rAF tickStroke between events; a single-eval dispatch leaves samples=1 and the item is refused).
- The pixel matrix's --bump takes an INT. Chrome wedges: pkill agent-browser + chrome --type, re-run.
- r17 camera T5/console can flake on settle-timing under load (SwiftShader) — a clean re-run passes; check the failure DETAIL (f1>f0 + fMin=14 = timing only) before debugging.
- r19 harness rules + the r20 wall/lens capture contract still apply.
