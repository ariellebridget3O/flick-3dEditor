# HANDOFF — next session (immediate seam)

## State
Round 18 COMPLETE through 23a7c74 (GitHub + GitLab + /home/sync): all four user sky/HDR feedback items shipped (procedural clouds removed; layered rework w/ weather-driven coverage + dome UV + seed; moon x1.9; sky into the HDR high-illumination area; interior-lighting continuity across the style switch) + the review fixes. The classic oracle path is byte-identical (matrix 7/7, means identical to r17). Dev server :3000 serves this tree.

## First 10 minutes
1. Restore repo if needed (rsync /home/sync -> /home/z/my-project/flick-3dEditor; git log -1 = 23a7c74 or later; status clean).
2. `bash /home/z/my-project/scripts/sync-editor.sh`; server at :3000 (`cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)` if dead).
3. Read PLAN.md round-18 + backlog (scope derives from PLAN, not this file).
4. Boot: `agent-browser close` + open `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<bump>` (fresh ?v= every session). The three-shim at the repo root (node_modules/three) may need recreation after a sandbox reset — the oracles need it.

## Env gotchas (still standing + new)
- SANDBOX RECYCLES WIPE UNCOMMITTED WORK — commit BEFORE launching any review sub-agent and at every green gate (SKILL #95).
- Evals silently fail under SwiftShader load; the agent-browser daemon wedges (CHROME THREAD EXHAUSTION) — `pkill -9 -f agent-browser; pkill -9 -f chrome` + rerun (budget a recovery per 3-4 suites).
- NEW r18: big multi-file python patch HEREDOCS can silently mangle (one run failed mid-way and the shell still printed ALL-OK from the follow-on commands — check the traceback goes with YOUR patch, run per-file patch scripts with per-hunk asserts, and `node --check` every touched file).
- NEW r18: the default editor camera pose (21deg down) shows only 0-4deg of sky — SKY QA needs an explicitly aimed-up pose (see r18_sky_e2e.py T4/T10 for the idiom) or you will debug a working feature for hours (SKILL #98).
- The watchdog rewrites .git/config ~2min after edits — ALWAYS push with full PAT URLs (`source scripts/env.sh` first).
- Backbuffer captures: 1016x313 this environment; sky QA = rows 0-26 in the default pose; cloud-mask metrics that include the fogged floor lie (use diff-vs-clouds-off, not neutral-brightness masks).

## Seam notes (small, do not shrink the round — PLAN backlog outranks these)
- The clouds atlas rebuild is DEBOUNCED 120ms (review P1-2) — E2E reads of lastSheetsStats must happen in a SECOND eval after a >=0.5s wait (the r18 E2E T2/T2b pattern); immediate same-eval reads lag one step.
- Shader edits in LAZILY-COMPILED materials (the cloud material compiles only when clouds are enabled) are only exercised by tests that enable them — the r18 uHdrGain GLSL-decl omission shipped green through 3 probe sessions and was caught only by the E2E (SKILL #99).
- Orbit damping drifts ~1.5-2.5 luma between captures seconds apart — same-scene render-equality assertions need a <=2.5 allowance, not exact.
- The r18 sky E2E writes /tmp fixture scenes into public/editor/samples/ (r18_mig/r18_seeded) — they are .gitignored-adjacent (deleted post-run); recreate if re-running.
