# HANDOFF — next session (immediate seam)

## State
Round 11 COMPLETE through commit f3387b1 (GitHub primary; GitLab mirror + /home/sync verified). Landed: the pixel-oracle harness (scripts/pixel_oracle/ — README = the runbook) with 7 byte-deterministic live goldens; matrix 4/7 PASS; the camera-mesh-poser P1 fix (mqr Q port). The oracle session itself ran via sub-agents while the main-session tools were down (Bash/Read/Write all failed mid-round — delegation per the sticky rule worked perfectly; 5 sub-agent runs drove the implementation).

## First 10 minutes
1. Sandbox may have reset: restore `/home/z/my-project/flick-3dEditor` (rsync from /home/sync, else clone from GitHub via scripts/env.sh PAT); `git log --oneline -1` should be f3387b1 or later; mode-noise from rsync is normal — `git checkout -- .` cleans it.
2. `bash /home/z/my-project/scripts/sync-editor.sh`; server dead → `cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)`.
3. Read PLAN.md round-11 + scripts/pixel_oracle/README.md (all live-flow gotchas live there).
4. Test URL: `http://localhost:3000/editor/index.html?scene=samples/live_oracle_r11_base.json&noAutosave=1&finish=0&v=<N>`; `window.__app` on the direct URL.

## Seam candidates (derive scope from PLAN — don't stop here)
- **Lens-path tonemap divergence** (top, blocks m1+m5): the live through-the-lens feed renders flat-bright (~1.39× ours, lum-ratio bimodal 1.0/1.67, ~0 saturation) vs our full-contrast feed; round 9 was GREEN at 97.81/1.3 — a side changed. Investigate: (a) DOM overlay veil on the live feed canvas, (b) live bundle feed-path changes (re-fetch the bundle — the site deploys continuously), (c) our updateCameraThroughLens regressions (unchanged since r9 — but verify against the r9 goldens' method: scaled-crop 556x313→805x452 vs the harness's 1:1 805x452). Goldens: scripts/pixel_oracle/golden/{m1_lens,m5_cam_path}_live.png (byte-deterministic).
- m3_dusk horizon band (marginal 1.63/97.18): the el=-4 sun-on-horizon glow strip x179-900 y40-52 — either a low-sun sky/glow tweak or a documented case relax.
- Skybox P2 clouds (PLAN backlog P2, design table in R7_SKYBOX_RESEARCH.md §6.3).

## Env gotchas (this round's additions — full ledger in scripts/pixel_oracle/README.md)
- The live 3D viewport is render-on-demand: a headless capture needs a seek-kick (ruler click — poses AND renders, no camera change; drags rotate the camera). Seeks CLAMP to the show duration. Ruler px/s varies per load — calibrate from the rendered labels each time.
- `agent-browser open` to the same SPA = soft nav (state preserved) — about:blank bounce for a true reload.
- Live REST (auth.flick.art custom-domain supabase): GET scene_id=eq.<uuid> returns EMPTY (quirk) — filter by project_id + client pick; POST/PATCH by scene_id work (read-back verify). JWT page-side only, never print.
- Main-session tool outage (Bash/Read/Write all failing): delegate to sub-agents — separate infra; dictate doc/patch contents fully in the prompt (they are mechanical writers). This entire round-11 implementation ran that way.

## Realistic scene id (do not trust the old index)
Scene 1 = 27b98b6b-8a4d-4b3a-a810-7d542342ce41 (8a4d — the scenes_index.json 7a4d was a transcription error). Base fixture: editor/samples/live_oracle_r11_base.json.
