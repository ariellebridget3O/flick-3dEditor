# CONTEXT — operational context for this project

## Mission (from user)
Study a free cloud-only 3D stage editor (flick.art 3D Stage) used for previz: (a) document implementation, (b) export 3D scenes (geometry, character location, camera, metadata), (c) export the 3D asset library, (d) export basic animation data, (e) verify agent chat image→3D scene e2e automation, (f) bonus: restore a local offline runtime replica for offline edits.

## Status
- (a)–(f) COMPLETE + rounds 2-3 deepened: real GLB props, glTF export, chat-loop automation, asset audit COMPLETE (humanoid 46 clips embedded), v10 schema fully audited, DATA_MANUAL + agent-kit + asset-browser delivered.
- Round-3 leftovers in PLAN.md: parallel-session probe (500 retry), session resume e2e, app.js fidelity fixes (daylight/aspects/spotlight).

## Directives (sticky)
- Push/backup every micro step (GitHub + GitLab mirror) — GIT IS THE DISK; no force-push ever.
- Work in /home/z/flick-3dstage clone (watchdog resets /home/z/my-project to main every ~20s; my-project/scripts is the Write-tool mirror only; run assemble.py from there to rebuild offline-editor/index.html).
- GitLab user: ansgareutychisC (different from GH user ariellebridget3O!); WAF 403 ~1/3 → retry 2-3×.
- Design decisions go through sub-agent audit rounds before implementation (done this round for GLB wiring — audit report summarized in repo history).
- Wrap-up: PLAN.md (long horizon), HANDOFF.md (next-session seam), .agents/SKILL.md + kb/ (distilled know-how), CONTEXT.md (this file). Revise in place, no lossy rewrites.

## Account / access
- flick.art: antonialarson40@outlook.com / TR.z2q6:hQBGiUk (free tier, 100 credits).
- Supabase project ref swpiwkmqyvoczzbummin via custom domain auth.flick.art; anon JWT byte-exact at data/anon_apikey.txt.
- GH PAT [REDACTED:github_token] / GitLab PAT [REDACTED:gitlab_token].

## Key repo paths
- docs/FINDINGS.md (start), docs/js_analysis_report.md, docs/har_endpoint_inventory.md
- data/props/ (1439 catalog + variants), data/exports/ (live data, e2e, chat loop, gltf/)
- assets/props/ (1426 GLBs) + assets/prop_manifest.json
- scripts/ (all tools; mirror in my-project/scripts for Write tool)
- offline-editor/index.html + offline-editor/props/ + prop_catalog_slim.json
- .agents/SKILL.md + kb/ | PLAN.md | HANDOFF.md

## Editor dev loop (round 2 established)
edit my-project/scripts/{app,glb_loader,prop_store}.js → python3 assemble.py →
cd offline-editor && python3 -m http.server 8123 → agent-browser open/eval to verify.
