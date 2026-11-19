# HANDOFF — next session (immediate seam)

## State
Round 19 COMPLETE through b8fb93f (GitHub + GitLab + /home/sync): all five user light/HDR feedback layers shipped (indoor window light; sun/moon hard-light sync via SLERP; moon tune w/ demo-curve-aware halo; HDR body-sub-threshold recalibration — sun/moon/flare bloom, the general sky does NOT; PMREM IBL outdoor-only) + the R19_PARITY_LEDGER (recording = the last L-feature; then 4 M + ~20 S). Classic oracle path byte-identical (matrix 7/7, means identical). Dev server :3000 serves this tree.

## First 10 minutes
1. Restore repo if needed (rsync /home/sync -> /home/z/my-project/flick-3dEditor; git log -1 = b8fb93f or later; status clean).
2. `bash /home/z/my-project/scripts/sync-editor.sh`; server at :3000 (`cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)` if dead).
3. Read PLAN.md round-19 + the R19_PARITY_LEDGER-ranked backlog (scope derives from PLAN).
4. Boot: `agent-browser close` + open `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<bump>`. The three-shim (node_modules/three at the repo root, re-exporting editor/js/vendor/three.module.js) was recreated r19 — check it survives; the oracles need it.
5. Next round per the ledger: the recording arc core (P0, M-L) — the r17 arm/start/finishManualFlight + sample-writer is already ported; the capture loop (fe/B/we @5716545-5729500 + uqr MediaRecorder) + review/outputs UI are the missing parts.

## Env gotchas (still standing + new)
- SANDBOX RECYCLES WIPE UNCOMMITTED WORK — commit BEFORE any review sub-agent and at every green gate.
- Evals silently fail under SwiftShader load; the daemon wedges (thread exhaustion) — `pkill -9 -f agent-browser; pkill -9 -f chrome` + rerun (budget a recovery per 3-4 suites; two r17-suite "failures" this round were wedge flakes, clean on rerun).
- The watchdog rewrites .git/config — ALWAYS push with full PAT URLs (`source scripts/env.sh`).
- Backbuffer captures: 1016x313; `?finish=1` sets the manual localStorage pref (clear it after — it leaks into later sessions).
- NEW r19 (sky/light QA harness rules — cost ~20 calls to learn):
  - The frame loop recomputes `orbit.maxPolarAngle` from the PREVIOUS pose every frame — a fresh aim that looks up more than the old clamp allows gets silently deformed (the boot-pose clamp is ~91deg). Pre-clear: `a.orbit.maxPolarAngle = Math.PI` BEFORE `orbit.update()`, and disable damping in the same eval.
  - Camera-at-origin aims land INSIDE scene figures (the synthetic fixture has a walker at 0,0,0 — the orange "band" was its fill seen from inside). Use the high-vantage idiom: `cam.position.set(-d[0]*40, 40, -d[2]*40); target = cam + d*60`.
  - Verify the aim in the SAME eval (project the subject direction to NDC and return it) — three separate "aim worked" assumptions were wrong this round before the NDC check.
  - ACES saturates discs to ~243 display luma — `>245` blob thresholds MISS them (the "missing" sun disc was there all along). Use >235 or ring-delta metrics; compact sources need RING/CORE deltas, not frame means (a 100px disc blooming reads +0.36 full-frame).
  - The biggest blob in a night frame is the NAV BALL (top-right ~800px) — moon tests must select the CENTER-most blob (the old r18 T5 asserted the nav ball vacuously for two rounds).
  - The PLAIN path's dome demo curve runs uExposure=10 — small linear values (halos!) get ~10x amplification. Calibrate glow constants THROUGH the output transform, not in linear space.

## Seam notes (small, do not shrink the round — PLAN backlog outranks these)
- The r19 room fixture (samples/r19_room.json) has a ceiling + the occupant at (2.5,0,-2.5) — the T2 shaft test depends on both (review P2-1/2).
- env.js applyDaylight: the `_keyDir` stash seam — every blend input (az/el/skyStyle) is inside the memo key, so memo-hits reuse a valid stash; any NEW key-light input must be added to the key (see the review's residual theoretical note about mid-compute throws).
- The L2 blend is a SLERP (sun-x-moon axis) — do not "simplify" it back to a lerp (opposite unit vectors degenerate through zero; the 1deg-resolution T5 sweep guards it at 25deg/deg).
- MOON_TONE lives in const.js (C.MOON_TONE); the sky.js GLSL literal mirrors it — keep in sync (P2-3 note).
- The r18/r19 E2E suites write /tmp fixture scenes + samples (r19_room, r18_mig/r18_seeded) — samples are committed; /tmp fixtures recreate per run.
