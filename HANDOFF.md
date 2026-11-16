# HANDOFF — next session (immediate seam)

## State
Round 8 COMPLETE through commit (see git log; pushes to GitHub primary + GitLab mirror + /home/sync). Landed: Actions palette M5r exact port (store family + tile previews + drag-drop + lane drop), cam-path height-curve editor (verbatim family + eFr panel), through-the-lens cameras view, aspect picker. Two review agents (1 P0 + 3 P1 + 4 P2 + P3 batch) all fixed + re-verified. Schema still v11. Oracle gate still 485/485 (plan canvas untouched this round — run it if plan.js changes).

## First 10 minutes
1. Sandbox may have reset: if /home/z/my-project/flick-3dEditor is missing → clone from GitHub (PAT via scripts/env.sh — its $0 bug is FIXED, works from bash -c now); verify `git log --oneline -1` = the round-8 review-fixes commit or later; `git status` clean.
2. Serving: `bash /home/z/my-project/scripts/sync-editor.sh` then `curl -s -o /dev/null -w "%{http_code}" localhost:3000/editor/index.html` — dead → `cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)`.
3. Read PLAN.md round-8 outcome + Backlog (ranked); docs/FIDELITY.md round-8 log (Known divergences ledger at the end).
4. Test URL: `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<N>` (bump v; fresh session per code change). `window.__app` on the direct editor URL.
5. If plan.js touched: `cd scripts/oracle && node run_oracle.mjs` → 485/485 (three shim at /home/z/node_modules/three).

## Immediate next-session candidates (seam only — derive scope from PLAN, don't stop here)
- Pixel oracle vs live flick.art (top of ranked backlog) — the R7/R8 oracle pattern (verbatim-fn reference + ordered diffs) generalizes to a pixel harness.
- Skybox P1 (roadmap in analysis/R7_SKYBOX_RESEARCH.md; sebh/UnrealEngineSkyAtmosphere MIT).
- Component column drag-UX (Xqt/VUr/$Ur verbatim units already extracted in tmp_palette_exact/ MAP §11) + segment-drag drop (MAP §14) + palette hotkey key-slot drop (gVr, MAP §14).
- Palette follow-ups: null/NaN-height curves were observed once in a stale session (probe artifact suspected — add a finite-height guard in the panel toCurve if it reproduces); app._paletteDispose wired but unused (call on any future teardown path).

## Env gotchas (this round's additions)
- agent-browser eval has a ~1.5KB transport limit — write longer probes to a file and pass via `$(cat file)`; split >1.4KB evals into setup+result phases with window globals.
- HTML5 DnD E2E: synthetic DragEvent + ONE shared `new DataTransfer()` works in Chromium; dropEffect readback is unreliable on synthetic events (browser-normalized) — assert the glow/store effects instead.
- Same-element listeners fire in REGISTRATION order — a "recover" guard registered AFTER the main handler runs after it and kills what the handler just opened (review P0-1). Register guards FIRST.
- getWorldPosition needs a REAL THREE.Vector3 (SKILL #46 again) — `import('./js/vendor/three.module.js')` in eval for T3.
- objects.add REQUIRES rotation/scale (store TRS invariant — plan Zo passes raw fields per verbatim); omitting them crashes plan Dst/i9. Probe objects with {rotation:[0,0,0], scale:[1,1,1]}.
- Undo round-trips: after undo(), re-read store state FRESH (track/item refs are stale objects of the pre-undo snapshot).
