# HANDOFF — next session (immediate seam)

## State
Round 14 COMPLETE through 289e3eb (GitHub + GitLab + /home/sync): clouds final nits reworked to acceptance-grade optics (view extinction + powder + knee re-anchor; layered shoulder), HDR research doc reconciled, m3_dusk 3 suspects eliminated (camera/IBL/el-sensitivity — grazing-sheen characterization), rig posing UX shipped verbatim (xqr spheres + drag/capture + review-fixed). Dev server :3000 serves this tree.

## First 10 minutes
1. Restore repo if needed (rsync /home/sync -> /home/z/my-project/flick-3dEditor; git log -1 = 289e3eb or later; status clean).
2. `bash /home/z/my-project/scripts/sync-editor.sh`; server at :3000 (`cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)` if dead).
3. Read PLAN.md round-14 + backlog (scope derives from PLAN, not this file).
4. Boot: `agent-browser close` + open `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<bump>` (fresh ?v= every session — ES module cache).

## Env gotchas (still standing + new)
- Evals silently fail/hang under SwiftShader GPU load (SKILL #88): the clouds 128^3 bake BLOCKS the main thread — fire-and-forget + poll (scripts/r13_clouds_tune.py). THE AGENT-BROWSER DAEMON ITSELF WEDGES sometimes (evals "time out" at ~150ms with 'page may still be loading' on a healthy page, or returns os-error-11): `pkill -9 -f agent-browser` + reopen fixes it — budget a restart in any long QA session.
- Page screenshots are STALE under SwiftShader (SKILL #83) — all WebGL QA via bb.py backbuffer capture.
- FRAME-TIMING in E2E: anything the frame loop does (sphere build, pose restore after undo, rigOffsets rebuild) needs a frame — split mutate and read into separate evals with a sleep. Same-eval reads see stale state (SKILL #45 pattern, hit 5x this round).
- THREE TransformControls detach() sets object = UNDEFINED, not null — assert falsy, never === null. Also window.THREE is undefined (ES-module scope) — E2E math must use plain arrays or app accessors.
- Clouds QA: `?cloudsGate=0` bypass; captures via scripts/r13_clouds_tune.py (45deg camera); metrics scripts/r14_cloud_metrics.py; interplay scripts/clouds_hdr_check.py (recreated r14 — was referenced but never committed).
- Rig posing E2E: scripts/r14_rig_e2e.py + r14_rig_e2e2.py (both green; joint names are 'DEF-upper_armL' style — the GLB node names from HUMANOID.md §7 are NOT the bone-map keys).

## Seam notes (small, do not shrink the round — PLAN backlog outranks these)
- Held-pose baking is the TOP backlog item — the bundle extraction is done (offsets + flow shape in the PLAN backlog entry); our port lacks setObjectPose + the pose-picker UI.
- Reading bundle text with [m sequences: plain python prints through Bash EAT the brackets in DISPLAY (SKILL #9) — write to a file and Read it, or base64 (the r14 reviewer's method).
- Rig posing remaining verbatim seams (P3-tier, from the review): the GA rotation-snap objectChange listener (@5641135) is still an empty stub; comment offset drift in a few r14 headers (harmless).
