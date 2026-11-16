# HANDOFF — next session (immediate seam)

## State
Round 7 COMPLETE through commit a651073. Two user directives landed: (1) the 2D plan canvas is now an **exact function-level port** of the live bundle (plan.js rewritten from analysis/tmp_plan_exact/ verbatim extractions; **oracle-validated 485/485 non-vacuous** via scripts/oracle/ — the reference side runs the actual bundle code), (2) the upstream flick-3dstage scene format loads lossless (all 9 data/exports scenes) with a Scenes… library popover + drag-drop. Review round: SHIP WITH FIXES → all 15 findings fixed + E2E re-verified. Skybox research durable in PLAN round-8+ backlog (analysis/R7_SKYBOX_RESEARCH.md). Schema still v11.

## First 10 minutes
1. Sandbox may have reset: if `/home/z/my-project/flick-3dEditor` is missing → clone from GitHub `https://github.com/ariellebridget3O/flick-3dEditor.git` (PAT in .env via scripts/env.sh; do NOT trust /home/sync working trees — SKILL #38); verify `git log --oneline -1` = a651073 or later; `git status` must be clean.
2. Serving: `bash /home/z/my-project/scripts/sync-editor.sh` then `curl -s -o /dev/null -w "%{http_code}" localhost:3000/editor/index.html` — 404/dead → `cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)`.
3. Read PLAN.md round-7 outcome + round-8 skybox roadmap; docs/FIDELITY.md round-7 log.
4. Test URL: `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<N>` (bump v; fresh session per code change). `window.__app` only on the direct editor URL.
5. Oracle regression gate: `cd /home/z/my-project/scripts/oracle && node run_oracle.mjs` → must print `485 PASS / 0 FAIL` (needs the three shim at /home/z/node_modules/three — if missing, copy from editor/js/vendor/three.{module,core}.js + the package.json in scripts/oracle/node_modules/three/). Any plan.js change should keep this green.

## Immediate next-session candidates (seam only — derive scope from PLAN, don't stop here)
- Plan canvas remaining gaps vs live (MAP.md §3 rows not yet ported): lens-handle drag is ported at reducer level but kLr/zDe handle hit needs an E2E pass; tap-or-draw focusTip tooltip paints but `Focus on this?` wording is an i18n equivalent; height-curve editor (rDr.heightMove/pressCurve* family — fn_class_rDr.js has the full logic; the eFr curve UI is C-rated, spec ready) is the biggest plan-side feature still missing; component drop (onComponentDrop S1) needs the actions palette first.
- Actions palette M5r (top of ROUND5 backlog) — now the single biggest live-parity gap.
- Skybox P1 (PLAN round-8 backlog has the full phased design; start from sebh/UnrealEngineSkyAtmosphere MIT).
- The three AUDIT_*.md docs should gain a plan-canvas section (the MAP.md DIFF TABLE is the registry now — fold the verdicts in when touching plan.js again).

## Env gotchas (round-7 additions)
- The **watchdog rewrites /home/z/my-project/flick-3dEditor/.git/config** (git remote URLs revert ~2min after edit — host-level snapshot revert; verified twice this round). NEVER rely on the named `gitlab` remote: always push with the FULL URL `git push https://ansgareutychisC:<GL_PAT>@gitlab.com/ansgareutychisC/flick-3dEditor-mirror.git main` (WAF 403 ~1/3 — retry loop in background). GitHub pushes likewise need the PAT URL in a fresh clone.
- Oracle in Node: editor/js/plan.js imports bare 'three' — resolved by the shim at /home/z/node_modules/three (two vendored files + package.json). The generator scripts/r7_make_reference.py has TWO live copies (repo + /home/z/my-project/scripts) — keep them in sync or regenerate from the repo one.
- `setPointerCapture` on synthetic PointerEvents throws NotFoundError and kills the handler BEFORE the reducer runs (SKILL #24 hit again this round — plan.js now guards with try/catch; any new pointer wiring needs the same guard).
- class-field arrow functions extracted from the bundle (e.g. replaceMoveFromSamples) can't be `.call()`-bound as module-level `const` arrows — the generator converts the head to a `function` expression (scripts/r7_make_reference.py handles this; watch for it if extracting more methods).
- The fn_*.js dumps are single-line minified — `wc -l` shows 0; check sizes with `ls -la` or `wc -c` (round-7 false alarm).
- flick-3dstage upstream: /home/sync/flick-3dstage is now current (ee742a4); its scene-viewer/ + most kb/ files are EMPTY 0-byte placeholders on GitHub (nothing to reference there — verified via API). The scene-format truth is the JSONs themselves + docs/DATA_MANUAL.md.
