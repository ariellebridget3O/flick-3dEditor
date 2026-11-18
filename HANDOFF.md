# HANDOFF — next session (immediate seam)

## State
Round 13 through commit 97a22c5 (GitHub + GitLab + /home/sync). Draw-path is COMPLETE (audit + all fixes + oracle 485/485 + matrix 7/7). Clouds: mechanism COMPLETE + VISIBLE (backbuffer-verified), visual tuning OPEN. HDR: research doc COMPLETE, implementation not started. Session ended on context exhaustion mid-delegation (Task tool "context deadline exceeded" — the clouds-tuning + HDR agents could not be dispatched).

## First 10 minutes
1. Restore repo if needed (rsync /home/sync → /home/z/my-project/flick-3dEditor; git log -1 = 97a22c5 or later; status clean).
2. `bash /home/z/my-project/scripts/sync-editor.sh`; server at :3000 (start with `cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)` if dead).
3. Read PLAN.md round-13 + this file + analysis/R13_CLOUDS_AUDIT.md + R13_HDR_RESEARCH.md.
4. Boot: `agent-browser close` + open `http://localhost:3000/editor/index.html?scene=samples/live_oracle_r11_base.json&noAutosave=1&finish=0&cloudsGate=0&v=<N>` (fresh ?v= every session — ES module cache).

## Seam 1 — clouds visual tuning (TOP; acceptance criteria ready)
The tune→capture→QA loop (≤8 iterations), everything documented in the R13-2b PLAN entry + the last commit message. Critical method notes:
- NEVER trust page screenshots (stale compositor, SKILL #83) — capture via backbuffer readPixels→canvas→toDataURL→base64 (harness evals kept in /tmp/bb_cap.js + /tmp/save_png.js; also /tmp/arm2.js overcast arm, /tmp/arm3.js clear arm, /tmp/sky_view.js aim camera up, /tmp/ab5.js on/off A/B — /tmp may not survive recycle; the pattern is in this file's history + the commit message of 97a22c5).
- Agent-browser evals SILENTLY FAIL (return {}) under SwiftShader GPU load — always verify side-effects took effect before reading results (SKILL #88).
- Fix list (VLM 3/10): white sunlit tops (luma ≥0.85), coverage mapping (env.js buildCloudParams weather divisor + sampleDensity remap), horizon blowout/seam/streaks (elevation alpha fade), directional shading verification (2 sun azimuths), cirrus visibility, edge detail (DETAIL_FREQ/STRENGTH). Files: ONLY editor/js/clouds.js + env.js buildCloudParams.
- Regression gate: clouds OFF = byte-identical; layered mode still renders; 0 console errors; classic gate 4/4 (git worktree protocol).

## Seam 2 — HDR implementation (research complete)
analysis/R13_HDR_RESEARCH.md is the design of record: hdr.js new module (HalfFloat MSAA RT → 5-mip CoD-AW dual-filter bloom w/ threshold → NeutralToneMapping composite writing gl_FragDepth), finish.js gains only an `#ifdef HDR` composite tail (character-identical when absent → classic 4/4 green by construction), HDR-only contrast multipliers in applyDaylight (sun ×1.8 / hemi ×0.85 / shadow radius ×1.5 at shadowBoost 0.5 / emissive ×4), schema light.hdr {on, exposure, bloomStrength, bloomThreshold, shadowBoost} additive (coordinate with light.clouds — both additive on v12; NO version bump, ratified r13), realistic dome output-mode 2 (linear ×e/wp), classic dome JS-side lift ×1.10, UI "HDR light" section, ?hdr= QA override, finish-style auto-measure gating. QA: 4-mode matrix (finish × hdr), classic-gate worktree 4/4, clouds interplay.

## Env gotchas (r13 additions)
- `?cloudsGate=0` bypasses the clouds budget probe (SwiftShader always measures over — mandatory for any clouds QA/capture).
- The clouds budget gate is RUNTIME-ONLY (env.setCloudsRuntime) — light.clouds schema state is never mutated by the gate.
- agent-browser eval `{}` returns = silent failure (see SKILL #88) — re-run or assert.
- Sub-agents may implement+commit beyond their stated mandate (r13: the audit agent shipped the draw fixes + clouds implementation while "reporting" no changes) — ALWAYS check `git log` after any sub-agent returns before duplicating work.

## Remaining round-13 debt (best-effort next session)
- Clouds: classic-sky support decision (currently realistic-only + UI-honest), VLM acceptance pass, perf probe on real GPU.
- HDR: full implementation + review round.
- m3_dusk S(y) probe (unchanged from r12), rig posing UX, held-pose baking — PLAN backlog order.
