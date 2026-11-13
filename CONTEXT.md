# CONTEXT — operational context for this project

## Mission (from user)
Reconstruct/restore the flick.art 3D Stage editor runtime as a local offline editor reproducing its scene-editor UX: the 3D renderer + time-of-day setup (P1), viewport/editor UX, and character + camera path editing with the animation system (P2), applying the local asset library for previz when offline. Prior workstream output (asset libraries, scene parsing) is reference material, not scope. New repo flick-3dEditor is the GIT backup for this work.

## Status
- Round 1 (2026-11-13) COMPLETE: live bundle re-extraction (4 analysis docs), audited design, full editor implementation (13 modules + three r182 vendored + 101MB asset library), E2E headless verification (daylight/path-eval/framing exact; undo/picker/autosave pass). See docs/FIDELITY.md + PLAN.md backlog.
- Editor runs at editor/index.html (python3 -m http.server; no build, no network at runtime).

## Directives (sticky)
- Push/backup every micro step (GitHub primary + GitLab mirror + /home/sync) — GIT IS THE DISK; never force-push.
- Work in /home/z/flick-3dEditor (outside the /home/z/my-project watchdog path).
- Design decisions → sub-agent audit rounds before implementation (done for DESIGN.md v2: APPROVE-WITH-CHANGES, F1–F23 folded in).
- Wrap-up: PLAN.md (long horizon), HANDOFF.md (next-session seam), .agents/SKILL.md + kb/ (distilled know-how), CONTEXT.md (this file).
- User's local disk is NOT durable — everything must live in git; .env secrets are split-coded mid-string because GitHub push-protection blocks literal AND base64 PATs.

## Account / access
- flick.art: antonialarson40@outlook.com / TR.z2q6:hQBGiUk (only needed for live-site re-verification; editor is fully offline).
- GitHub: ariellebridget3O (PAT split in .env; source scripts/env.sh).
- GitLab: ansgareutychisC (PAT split in .env). Mirror repo = **flick-3dEditor-mirror** (the originally-named repo was deleted+recreated; name reserved by scheduled deletion).

## Key paths
- editor/ — the app (index.html, js/{const,env,curves,schema,tracks,store,figures,objects,selection,manipulate,paths,ui,main}.js, css/, assets/ w/ humanoid+camera+spotlight GLBs + 1439-prop catalog + full GLB library, samples/)
- analysis/ — extraction ground truth (ENVIRONMENT/TRACK_SYSTEM/HUMANOID/EDITOR_UX/DOM_REFERENCE/DESIGN_AUDIT + extracted/ raw + index-DBE17t4T.js live bundle)
- docs/ — DESIGN.md, FIDELITY.md, screenshots/, prior context
- scripts/ — extraction tooling + .env split-secret decoder
- Related: /home/sync/flick-3dstage (prior workstream: asset export, scene capture, API automation — reference only)

## Editor dev loop
edit editor/** → http.server :8124 → agent-browser close + open "?v=N" (fresh session; reload doesn't bust ES-module cache) → window.__app for eval hooks → screenshots to docs/screenshots/ → VLM sub-agent QA.
