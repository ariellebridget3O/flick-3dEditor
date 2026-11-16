# HANDOFF — next session (immediate seam)

## State
Round 6 COMPLETE through commit d2a8e51. All five workstreams (A animation-UX, B viewport polish, C top-down plan canvas, D lighting/time-of-day, E layout) implemented, design-audited, code-reviewed (0 P0; 6 P1 + 5 P2 found → all fixed + E2E-verified). Schema is now v11 (light geo/weather/indoor/ambient + mode). See PLAN.md round-6 outcome + FIDELITY.md round-6 log + commit messages 7108d3f..d2a8e51 for per-fix E2E evidence.

## First 10 minutes
1. Sandbox may have reset: if `/home/z/my-project/flick-3dEditor` is missing → `rsync -a --delete /home/sync/flick-3dEditor/ /home/z/my-project/flick-3dEditor/`; verify `git log --oneline -1` = d2a8e51 or later; `git status` must be clean (stale-tree guard: SKILL #38).
2. Serving: `curl -s -o /dev/null -w "%{http_code}" localhost:3000/editor/index.html` — 404 → `bash /home/z/my-project/scripts/sync-editor.sh`; dev server died → `cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)`.
3. Read PLAN.md round-6 outcome + backlog; docs/FIDELITY.md round-6 log.
4. Test URL: `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<N>` (bump v; fresh session per code change). `window.__app` only on the direct editor URL.

## Round-6 review P3 leftovers (small, good first tasks)
- cam-still: verify Subject select vs live fVr (R2 report says cam-still = Duration + Remove only in live — our port currently matches that; double-check the cam-still aim flow via setCameraFocus).
- drivenBy hint paused-state semantics (convoluted ternary in ui.js renderObjectSection).
- plan canvas vs stageView 'cameras': shown() ignores stageView (plan covers Cameras view too — decide gate).
- Plan height-curve editor (R1 §8 spec ready in analysis/ROUND6_DESIGN.md + tmp_plan/) — P1 backlog.
- Actions palette M5r (P1 backlog, biggest remaining live gap), spawn grid 5×6, aspect-ratio picker UI done (in camera inspector now).

## Env gotchas (round-6 additions)
- MultiEdit/Edit tools are NOT atomic across all edits — a "No replacement" can leave PARTIAL edits applied (the env.js fogK double-declaration incident). After any failed MultiEdit: grep for duplicate identifiers + node --check before proceeding. Prefer python assert-scripts (scripts/r6_*.py pattern).
- Read-frame timing in E2E evals: values read in the SAME eval tick as the mutation see stale per-frame state (fog density, undoStack, rotateHandlePx) — sleep 0.3-0.6s between mutate and read.
- `getWorldPosition/getWorldDirection` need REAL THREE scratch objects (plain objects lack .set/.copy → TypeError). Compute from matrixWorld.elements ([8],[9],[10] = forward; [12..14] = position) when THREE isn't in scope.
- TransformControls vendor r182: helpers are `gizmo.helper[mode]` GROUPS (an object), not arrays; `tc.axis` is the hover state (poll it per frame for custom-mesh hover recolor — materialLib can't reach meshes that own materials).
- Store rotations are XYZ euler radians; composeMatrix/decomposeTRS in store.js is the canonical group math (pie/VWt).
- The `?v=N` bump needs a fresh browser session (ES-module cache) — `agent-browser --session X close` first.
- Paired targets: our port doesn't CREATE camera+target pairs yet (spawn adds cameras without targets) — the refusal logic (deleteObjects) is in place and tested via direct store calls.
