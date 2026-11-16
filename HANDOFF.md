# HANDOFF — next session (immediate seam)

## State
Round 9 COMPLETE through commit (GitHub primary; GitLab mirror + /home/sync). Landed: pixel oracle vs live flick.art — live access path + scene fixture + through-the-lens render made pixel-exact (97.81% ≤8, mean 1.3). Review round SHIP WITH FIXES → all P1/P2 applied + re-verified. Schema v11; plan-canvas oracle gate untouched (485/485 — run it if plan.js changes; plan.js aimHeightOf k changed .5→.7 this round).

## First 10 minutes
1. Sandbox may have reset: restore `/home/z/my-project/flick-3dEditor` (rsync from /home/sync, else clone from GitHub via scripts/env.sh PAT); `git log --oneline -1` should be the round-9 review-fixes commit or later; `git checkout -- . && git reset --hard HEAD` if dirty (mode-noise from rsync is normal — 0 insertions).
2. `bash /home/z/my-project/scripts/sync-editor.sh`; server dead → `cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)`.
3. three shim for the oracle: `cd /home/z && npm install three@0.182.0 --no-save` (sandbox resets lose /home/z/node_modules).
4. Read PLAN.md round-9 + Backlog (ranked); docs/FIDELITY.md round-9 log (Known divergences ledger at the end).
5. Test URL: `http://localhost:3000/editor/index.html?scene=samples/live_oracle_scene1.json&noAutosave=1&v=<N>`; `window.__app` on the direct URL.

## Seam candidates (derive scope from PLAN — don't stop here)
- **Pixel oracle round 2**: widen coverage (editor default framing, daylight stops, finish composer forced manual on both sides, cam-path feed). The live-session flow (login → flag override → deep link → REST scene read) is documented in FIDELITY round-9 and PLAN round-9 — script it into scripts/pixel_oracle/ as a re-runnable harness (the r9_*.py pieces exist but are one-shot).
- Skybox P1 (analysis/R7_SKYBOX_RESEARCH.md design; sebh/UnrealEngineSkyAtmosphere MIT).
- Rig posing UX / held-pose baking (P2s).

## Env gotchas (this round's additions)
- PostHog feature-flag override: inject `{"stage-3d":true,"stage-scene-node":true}` under `$override_feature_flags` INTO the `ph_phc_*_posthog` JSON blob in localStorage, then navigate — the app merges overrides over server flags at load. Live deep link: `/canvas/<projectId>?view=stage&scene=<sceneId>`.
- flick.art scenes: supabase REST `GET /rest/v1/stage_scenes?project_id=eq.<pid>&select=scene` with headers `apikey: <anon key from bundle zDn literal>` + `Authorization: Bearer <session JWT from sb-auth-auth-token>`. Do NOT print the JWT — read it page-side (`window.__sbtok`) and fetch from the page context.
- Pixel-matching the live app: hide our DOM HUD (#camFooter) before capture; crop the 16:9 inner region; SwiftShader auto-disables finish on BOTH sides identically (auto-measure), so plain-render diffs are valid.
- agent-browser sessions do NOT survive sandbox recycle — the flick.art login, token, and captured screenshots all die with it; re-login is cheap (~4 evals, turnstile passes headless).
- Commit BEFORE any risky exploration: this round lost its first two fixes to a mid-round sandbox recycle because they were uncommitted.
