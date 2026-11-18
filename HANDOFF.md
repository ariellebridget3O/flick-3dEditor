# HANDOFF — next session (immediate seam)

## State
Round 15 COMPLETE through a0feda4 (GitHub + GitLab retry loop + /home/sync): held-pose family (bake/pending/sample verbatim + onSkeletonReady), person-kind switch (confirm toast + strip + rename + defaultName add-path), shake apply (Dzt/cL on the lens feed; stride family dormant). Dev server :3000 serves this tree.

## First 10 minutes
1. Restore repo if needed (rsync /home/sync -> /home/z/my-project/flick-3dEditor; git log -1 = a0feda4 or later; status clean).
2. `bash /home/z/my-project/scripts/sync-editor.sh`; server at :3000 (`cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)` if dead).
3. Read PLAN.md round-15 + backlog (scope derives from PLAN, not this file).
4. Boot: `agent-browser close` + open `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<bump>` (fresh ?v= every session — ES module cache).

## Env gotchas (still standing + new)
- Node can now resolve `three` from the REPO ROOT (node_modules/three shim — vendored three.module.js + three.core.js copies; scripts/oracle imports editor modules directly). If it goes missing after a sandbox reset: copy editor/js/vendor/three.{module,core}.js into flick-3dEditor/node_modules/three/ + a minimal package.json (main: three.module.js).
- Evals silently fail under SwiftShader load; the agent-browser daemon wedges (~150ms timeouts on a healthy page) — `pkill -9 -f agent-browser` + reopen (budget a restart per long QA session).
- Backbuffer capture dims VARY per session (805×452 vs 805×570 vs 1016×313 seen) — read `renderer.domElement.width/height` before bb.capture_png, don't hardcode.
- Full-frame forced renders at rest are usually byte-deterministic, but an INTERMITTENT ≤0.2% single-pixel transient was observed in the lens view (no time-keyed shader term; localization pass found 0 diffs on rerun) — pixel-equality gates for same-state probes need a small tolerance + a magnitude-based cross-condition comparison (r15_shake_e2e.py diff_stats pattern).
- Backbuffer probes must POSE+RENDER+READ in ONE eval task (renderFrame() does not re-pose the lens camera; the rAF loop re-poses between evals).
- THREE TransformControls detach() sets object = UNDEFINED; window.THREE undefined (ES-module scope). Frame-timing: split mutate/read evals with sleeps (SKILL #45).

## Seam notes (small, do not shrink the round — PLAN backlog outranks these)
- Dormant shake stride path: oEr/iEr/g2r in editor/js/shake.js are oracle-covered but unused — the cameraRig store field + rig picker (PLAN "camera-panel remainder") unlock them; wire via rigShake({rig: C.CAMERA_RIGS[rig], ...}) with the ground-speed stride integrator.
- pendingPoses leak parity: live never clears entries for deleted objects — do NOT add cleanup (would diverge).
- GA rotation-snap objectChange listener (@5641135) still an empty stub (r14 P3 seam); comment-offset drift in some r14/r15 headers (harmless).
