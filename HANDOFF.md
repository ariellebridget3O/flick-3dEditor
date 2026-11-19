# HANDOFF — next session (immediate seam)

## State
Round 17 COMPLETE through 0c9aa74 (GitHub + GitLab + /home/sync): the camera-mode subsystem (full gq rig table + kIr rig state + the en rig-physics drive + pointer-lock look + the rig shake LIVE via oEr + the Yjr monitor bar + Film/Fly entries with draft-cleanup exits + the delete cascade + lane-head track selection) and 2 seams (plan-canvas component drop, rotation multi-turn snap). Dev server :3000 serves this tree.

## First 10 minutes
1. Restore repo if needed (rsync /home/sync -> /home/z/my-project/flick-3dEditor; git log -1 = 0c9aa74 or later; status clean).
2. `bash /home/z/my-project/scripts/sync-editor.sh`; server at :3000 (`cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)` if dead).
3. Read PLAN.md round-17 + backlog (scope derives from PLAN, not this file).
4. Boot: `agent-browser close` + open `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<bump>` (fresh ?v= every session — ES module cache). The three-shim at the repo root (node_modules/three ← editor/js/vendor/three.{module,core}.js + package.json main) may need recreation after a sandbox reset — the oracles need it.

## Env gotchas (still standing + new)
- SANDBOX RECYCLES WIPE UNCOMMITTED WORK — commit BEFORE launching any review sub-agent and at every green gate (SKILL #95).
- Evals silently fail under SwiftShader load; the agent-browser daemon wedges and CHROME THREAD EXHAUSTION (pthread_create EAGAIN) accumulates across suites — `pkill -9 -f agent-browser; pkill -9 -f chrome` + rerun (budget a recovery per 3-4 suites).
- The `[m[` byte sequence gets EATEN in Write-tool content (r17: `[m[12]` → `[12]` twice — SKILL #9 class extended to file WRITES, not just display) — scan generated scripts for the pattern and use `mw.slice(12,15)`-style avoidance.
- Nested triple-quotes in python patch heredocs break silently — use anchor-based unique-substring replaces, never embed `"""` blocks.
- agent-browser `console_errors` returns '' (empty string) when clean — assert falsy, not == 0.
- Backbuffer capture dims VARY per session; synthetic DragEvents need new DataTransfer + defineProperty per event (SKILL #59).

## Seam notes (small, do not shrink the round — PLAN backlog outranks these)
- The r17 ORACLE's "drive trajectory" test uses a shared hand-transcribed en driver on both sides (composition glue NOT covered — only the family primitives are; the P0-1 bug lived in exactly that glue and the oracle missed it, E2E caught it via review). If the filming arc lands, extract en itself into the reference.
- pendingPoses leak parity: live never clears entries for deleted objects — do NOT add cleanup.
- The E2E suite asserts the eased 1s tripod pan at −0.2311 rad (spring-ramped, reviewer-live-measured); if drive constants change, re-derive.
- updateCameraMarkers now uses the DERIVED focal (BU) — the r16 matrix means shifted (improved) accordingly; the r16-recorded means in FIDELITY are superseded by the r17 values.
