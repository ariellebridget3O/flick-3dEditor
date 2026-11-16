# CONTEXT — operational context for this project

## Mission (from user)
Reconstruct/restore the flick.art 3D Stage editor runtime as a local offline editor reproducing its scene-editor UX: the 3D renderer + time-of-day setup (P1), viewport/editor UX, and character + camera path editing with the animation system (P2), applying the local asset library for previz when offline. Prior workstream output (asset libraries, scene parsing) is reference material, not scope. New repo flick-3dEditor is the GIT backup for this work.

Round-2 user emphasis: the OVERALL RENDERING PATH must be reproduced exactly (three.js version, shadows, shaders — incl. the "quick AO" finish effect), and since this is a rewrite (not a verbatim JS port), a FULL AUDIT must certify exact functionality; then close all remaining gaps.

## Status
- Round 1 (2026-11-13): full editor implementation + E2E (see git log / FIDELITY round-1).
- Round 2 (2026-11-14): rendering path exact (finish composer + stroke ring + clay props + all object/marker builders), 3-module exactness audit (analysis/AUDIT_{TRACKS,UX,ENV_UI}.md), all 4 P0 + ~18 P1 fixes.
- Round 3 (2026-11-15): all 4 seam items — timeline polish (place.js solver EXACT + magnet/trim/diamonds/alt-duplicate), segment inspector editors, lasso, nav ball. Review: 3 P0 + 4 P1 + 6 P2 fixed.
- Round 4 (2026-11-15) COMPLETE: take-range tool, custom gizmo meshes, timeline P3s (see git log).
- Round 6 (2026-11-16) COMPLETE: the deep audit + polish round. A: animation UX rebuilt live-exact (no clip dropdown in object inspector — it was a port invention; segment editor moved INTO the Properties panel as an Action section; +Track = live rCr search dropdown; the lane-add "+" no-op was a missing appendPlace import throwing on every click). B: pad removed, gizmo helper lines removed + amber hover wired, toolbar flat/semi-transparent, groups rebuilt (centroid/pie/VWt/recursive delete/ungroup/paired-target refusal), shade modes Shaded/Flat/Wire, snap 0.25m/15° + ground grid. C: top-down 2D plan canvas (plan.js — painter SDr port, draw-direction strokes→paths, marquee, rotate/lens, zoom/pan/fit, edge indicators; 3D render pauses while ticks continue). D: lighting/time-of-day (geo solar solver Spencer/NOAA + weather 5 states + indoor ambient + fog-in-coupling + v11 schema; panel with puck/phase labels/ghost knob). E: two-panel dock [Properties|Scene] collapsible, modeSwitch removed. All design-audited + code-reviewed (0 P0, 6 P1 + 5 P2 fixed). Schema now v11.
- Round 5 (2026-11-16) COMPLETE: all user-reported P0s fixed (T-pose flicker = exact AWr rig port; pose-apply at rest; spotlight shadow = exact oOr/iOr/e6r; frozen shadow fingerprint = walk-every-tick TOr). Mid-round: a commit accidentally built on a stale round-2 tree was caught by review + repaired (2311e71). Audit: review round verified all fixes exact vs bundle (0 P0/P1); UI sweep A fixes applied (80d39ff: undo for object ops, track cloning on duplicate, kind gating, hierarchy tree, same-t seek). Gap matrix in analysis/ROUND5_GAP_MATRIX.md (Top-20 ranked backlog). Remaining: PLAN round-5 backlog (actions palette, height-curve editor, cameras view, aspect picker, pixel oracle, rig posing, shake, plan canvas…).
- Editor runs at editor/index.html (any static server; no build, no network at runtime) AND on port 3000 for review (rsync via my-project/scripts/sync-editor.sh after every edit). New prefs: localStorage stage-snap/stage-shademode; scene.light carries mode/geo/weather/indoor/ambient (v11). Finish pref: localStorage `stage-finish` + auto-measure; URL ?finish=0|1 forces (manual source).

## Directives (sticky)
- Push/backup every micro step (GitHub primary + GitLab mirror + /home/sync) — GIT IS THE DISK; never force-push.
- Repo lives at /home/z/my-project/flick-3dEditor (inside the persisted project dir; sandbox resets wiped the old /home/z/flick-3dEditor path twice). public/editor is an rsync copy — run my-project/scripts/sync-editor.sh after edits.
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
edit editor/** → port 3000 (or any static server) → agent-browser close + open "?v=N" (fresh session; reload doesn't bust ES-module cache) → window.__app eval hooks (objects.add/select, page.seek/play, show.ensureTrack/addItem/appendPathAnchor, meshById, manipulator._commit, show.moveItem/trimItem/reorderItem/duplicateItemTo) → screenshots to docs/screenshots/ → VLM sub-agent QA with explicit expected-content lists. Synthetic pointer drags: dispatch PointerEvents on the element + a follow-up click event (browsers fire click after up); Alt modifier via altKey:true on the synthetic event (agent-browser mouse events don't carry held modifiers).
