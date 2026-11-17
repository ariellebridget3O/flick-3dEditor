# HANDOFF — next session (immediate seam)

## State
Round 12 COMPLETE through commit (see git log; GitHub primary + GitLab mirror + /home/sync verified). The pixel-oracle matrix is **7/7 PASS**: m1_lens + m5_cam_path GREEN (the r11 "lens tonemap divergence" was a CAPTURE ARTIFACT — Chrome's compositor present freezes for the WebGL canvas once the cameras view activates under headless SwiftShader), m3_dusk MARGINAL-PASS with a documented mean relax. Landed: bb.py backbuffer capture (ours.py uses it for EVERY case now), the dusk forensics, and the deployed-bundle verification (index-CaBu3A6T.js saved in analysis/ — the lighting stack is byte-identical to our extraction).

## First 10 minutes
1. Sandbox may have reset: restore `/home/z/my-project/flick-3dEditor` (rsync from /home/sync, else clone via scripts/env.sh PAT); `git log --oneline -1` should be the r12 wrap-up or later; `git status --short` must be clean.
2. `bash /home/z/my-project/scripts/sync-editor.sh`; server dead → `cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)`.
3. Read PLAN.md round-12 + scripts/pixel_oracle/README.md (the runbook — esp. the r12 capture-method note and the dusk S(y) ledger).
4. Test URL: `http://localhost:3000/editor/index.html?scene=samples/live_oracle_r11_base.json&noAutosave=1&finish=0&v=<N>`; `window.__app` on the direct URL.
5. Fast gate: `python3 scripts/pixel_oracle/run_matrix.py --diff` → expect 7/7 PASS (exit 0).

## Env gotchas (r12 additions — full ledger in scripts/pixel_oracle/README.md)
- **OURS-side canvas captures MUST go through bb.py** (force renderFrame + readPixels chunks) — the page screenshot freezes at the last pre-cameras-view frame once the lens activates, and DOM/DPR environments recycle the compositor state unpredictably. Never trust `ab.screenshot` for WebGL content.
- **The live bundle REDEPLOYED** (CaBu3A6T): all minified names in the docs are for the OLD bundle — re-extract by signature strings, never by offset.
- The fog-zeroing probe pattern (disable `a.fogNearFar.tick`, set density, capture, restore) generalizes to isolating any per-frame-written renderer state.

## Seam candidates (derive scope from PLAN — don't stop here)
- **Skybox P2 clouds** (top backlog): weather-driven cloud layers, 3 altitudes, runtime fbm/Worley — design table ready in analysis/R7_SKYBOX_RESEARCH.md §6.3; integrate additively into sky.js like r10 did (classic default byte-identical, gate 4/4 via the worktree protocol).
- **m3_dusk S(y) term** (open): probe the live's editor camera pose directly page-side (orbit target/position from their JS) and compare against ours (6,5,8) pitch 21.80° — a ~0.3-0.5° pitch drift would explain the whole residual; then either fix the capture flow or re-attribute.
- Rig posing UX, held-pose baking, shake apply — PLAN backlog order.
