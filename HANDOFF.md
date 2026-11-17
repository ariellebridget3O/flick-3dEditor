# HANDOFF — next session (immediate seam)

## State
Round 10 COMPLETE through commit (GitHub primary; GitLab mirror + /home/sync). Landed: skybox P1 — realistic Hillaire-2020 atmosphere (sky.js 3-LUT + GLSL3 dome + night stars/moon + weather/altitude coupling + PMREM IBL) as light.skyStyle:'realistic' (schema v12; classic default byte-identical, gate GREEN 4/4). Review round fixed P0 (LUT orientation) + P1 (Mie phase) — verified via GPU LUT dumps. Reference registry: analysis/tmp_skybox/.

## First 10 minutes
1. Sandbox may have reset: restore `/home/z/my-project/flick-3dEditor` (rsync from /home/sync, else clone from GitHub via scripts/env.sh PAT); `git log --oneline -1` should be the round-10 review-fixes commit or later; mode-noise from rsync is normal (0 insertions) — `git checkout -- .` cleans it.
2. `bash /home/z/my-project/scripts/sync-editor.sh`; server dead → `cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)`.
3. three shim for the oracle: `cd /home/z && npm install three@0.182.0 --no-save` (sandbox resets lose /home/z/node_modules).
4. Read PLAN.md round-10 + Backlog (ranked); docs/FIDELITY.md round-10 log.
5. Test URL: `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<N>`; `window.__app` on the direct URL.

## Seam candidates (derive scope from PLAN — don't stop here)
- **Pixel oracle round 2** (top backlog): script the live-session flow (login → flag override → deep link → REST scene read — all documented in FIDELITY round-9 + SKILL #65) into scripts/pixel_oracle/; widen coverage beyond the lens view (editor default framing, daylight stops, finish forced manual both sides, cam-path feed).
- Skybox P2 clouds (design table ready in R7_SKYBOX_RESEARCH.md §6.3).
- Rig posing UX / held-pose baking (P2s).

## Env gotchas (this round's additions)
- Screenshot capture protocol: WAIT for the scene-load marker before mutating light/camera (poll `app.light.azimuthDeg === 128.66` + rigs ≥1) — a light set during loadSceneData gets overwritten; ?finish=0/1 PERSISTS the pref in localStorage (fresh browser profile per daemon launch).
- Classic-vs-new regression gate recipe: `git worktree add /tmp/<old> <sha>` + `python3 -m http.server 8125` on the old tree, capture baselines there, diff vs :3000 — deterministic with ?finish=0.
- Realistic-sky E2E hooks: `app.env.realisticSky()` → `.dumpLut(name)` (half-float decoded), `._debug` dirty flags, `.materials.*.uniforms`; aim-at-sky shots need `app.orbit.enabled = false` + camera.lookAt (orbit has residual momentum in headless otherwise).
- agent-browser eval vars persist between evals (const redeclare errors — wrap in IIFE); multi-line evals: `import()` for module access (THREE is not global).
- Commit BEFORE risky exploration: this workstream lost a full uncommitted sky.js implementation to a mid-session service interruption (recovered from transcript + reference set in one round).
