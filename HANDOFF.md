# HANDOFF — next session (immediate seam)

## State
Round 13 COMPLETE through ad463f3 (GitHub + GitLab + /home/sync): draw-path verbatim (oracle 485/485, matrix 7/7), clouds tuned to acceptance (remaining nits in PLAN backlog), HDR implemented + reviewed + all P1/P2 fixed (matrix 7/7 unchanged, hdr_qa.py ALL PASS). Dev server :3000 serves this tree.

## First 10 minutes
1. Restore repo if needed (rsync /home/sync → /home/z/my-project/flick-3dEditor; git log -1 = ad463f3 or later; status clean).
2. `bash /home/z/my-project/scripts/sync-editor.sh`; server at :3000 (`cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)` if dead).
3. Read PLAN.md round-13 + backlog (scope derives from PLAN, not this file).
4. Boot: `agent-browser close` + open `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<bump>` (fresh ?v= every session — ES module cache).

## Env gotchas (still standing + new)
- Evals SILENTLY FAIL or HANG under SwiftShader GPU load (SKILL #88): the clouds 128³ bake BLOCKS the main thread — the setClouds eval never returns; use the fire-and-forget + poll pattern (scripts/r13_clouds_tune.py + scripts/clouds_hdr_check.py show it).
- Page screenshots are STALE under SwiftShader (SKILL #83) — all WebGL QA via bb.py backbuffer capture (scripts/pixel_oracle/bb.py).
- `?cloudsGate=0` bypasses the clouds budget probe (mandatory for clouds QA); the gate is runtime-only (env.setCloudsRuntime), never mutates light.clouds.
- HDR QA: `scripts/hdr_qa.py` (full E2E matrix), `scripts/bloom_verify.py` (bloom-contribution sweep), `scripts/clouds_hdr_check.py` (realistic+clouds+hdr interplay). Clouds captures: `scripts/r13_clouds_tune.py base "cov25={\"coverage\":0.25}" layered` (camera = 45° sky view).
- QA harness GEOMETRY can drift silently — verify WHAT the camera looks at before believing a capture (SKILL #90: the tune harness once captured the floor for a whole session while claiming sky QA).

## Seam notes (small, do not shrink the round — PLAN backlog outranks these)
- Clouds nits: cov75 internal contrast; layered zenith clip needs a display-space cap (per-sheet dim does NOT work — curve saturates at L≈0.35, see the clouds.js sheetL comment).
- R13_HDR_RESEARCH.md still specs Neutral + CoD-AW while the ship is ACES + UnrealBloomPass-recipe — reconcile the doc when touching HDR next (behavior is ratified + E2E'd).
- m3_dusk S(y) probe (unchanged from r12), rig posing UX, held-pose baking — PLAN backlog order.
