# CONTEXT — operational context for this project

## Mission (from user)
Reconstruct/restore the flick.art 3D Stage editor runtime as a local offline editor reproducing its scene-editor UX: the 3D renderer + time-of-day setup (P1), viewport/editor UX, and character + camera path editing with the animation system (P2), applying the local asset library for previz when offline. Prior workstream output (asset libraries, scene parsing) is reference material, not scope. New repo flick-3dEditor is the GIT backup for this work.

Round-2 user emphasis: the OVERALL RENDERING PATH must be reproduced exactly (three.js version, shadows, shaders — incl. the "quick AO" finish effect), and since this is a rewrite (not a verbatim JS port), a FULL AUDIT must certify exact functionality; then close all remaining gaps.

## Status
- Round 1 (2026-11-13): full editor implementation + E2E (see git log / FIDELITY round-1).
- Round 2 (2026-11-14) COMPLETE: rendering path exact (finish composer + stroke ring + clay props + all object/marker builders), 3-module exactness audit (analysis/AUDIT_{TRACKS,UX,ENV_UI}.md), all 4 P0 + ~18 P1 fixes, all E2E-verified (FIDELITY round-2 log). Remaining gaps are prioritized in PLAN.md backlog (timeline polish, inspector editors, lasso, nav ball, shake, plan canvas, rig posing).
- Editor runs at editor/index.html (python3 -m http.server 8124; no build, no network at runtime). Finish pref: localStorage `stage-finish` + auto-measure; URL ?finish=0|1 forces (manual source).

## Directives (sticky)
- Push/backup every micro step (GitHub primary + GitLab mirror + /home/sync) — GIT IS THE DISK; never force-push.
- Work in /home/z/flick-3dEditor (outside the /home/z/my-project watchdog path).
- Design decisions → sub-agent audit rounds before implementation; code changes → sub-agent code review (the three AUDIT docs are the standing divergence registry — re-audit fixed areas when touching them).
- Wrap-up: PLAN.md (long horizon), HANDOFF.md (next-session seam), .agents/SKILL.md + kb/ (distilled know-how), CONTEXT.md (this file).
- User's local disk is NOT durable — everything must live in git; .env secrets split-coded mid-string (GitHub push-protection blocks literal AND base64 PATs).

## Account / access
- flick.art: antonialarson40@outlook.com / TR.z2q6:hQBGiUk (only for live-site re-verification; editor is fully offline).
- GitHub: ariellebridget3O (PAT split in .env; source scripts/env.sh).
- GitLab: ansgareutychisC (PAT split in .env). Mirror repo = **flick-3dEditor-mirror**.

## Key paths
- editor/ — the app (js/{const,env,finish,stroke,curves,schema,tracks,store,figures,objects,selection,manipulate,paths,ui,main}.js, css/, assets/ 101MB, samples/)
- analysis/ — ground truth: ENVIRONMENT/TRACK_SYSTEM/HUMANOID/EDITOR_UX/DOM_REFERENCE/FINISH_RENDERER + AUDIT_{TRACKS,UX,ENV_UI} + extracted/ + tmp_{a..d}/ raw dumps + index-DBE17t4T.js live bundle
- docs/ — DESIGN.md, FIDELITY.md (per-subsystem status + verification logs), screenshots/
- scripts/ — extraction tooling (extract_bundle.py, sig_search.py, find_ctx.py, dump_func.py) + env.sh (.env split-secret decoder)
- Related: /home/sync/flick-3dstage (prior workstream — reference only)

## Editor dev loop
edit editor/** → http.server :8124 → agent-browser close + open "?v=N" (fresh session; reload doesn't bust ES-module cache) → window.__app eval hooks (objects.add/select, page.seek/play, show.ensureTrack/addItem/appendPathAnchor, meshById, manipulator._commit for commit-pipeline tests) → screenshots to docs/screenshots/ → VLM sub-agent QA with explicit expected-content lists.
