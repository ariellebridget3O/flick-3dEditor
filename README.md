# flick-3dEditor

Local offline reconstruction of the **flick.art 3D Stage** editor runtime — viewport renderer with the exact time-of-day/daylight system, scene editor UX (selection/manipulation/inspector), character + camera path editing, and the animation/show-track system — for previz work without internet access.

Ground truth: static extraction of the live bundle (`analysis/index-DBE17t4T.js`) → `analysis/{ENVIRONMENT,TRACK_SYSTEM,HUMANOID,EDITOR_UX}.md` + `analysis/DOM_REFERENCE.md`; design audited in `analysis/DESIGN_AUDIT.md`; per-subsystem fidelity status (EXACT/PORT/APPROX/SKIP) in `docs/FIDELITY.md`.

Related repo: `flick-3dstage` (asset library export, scene capture, API automation).

## Run it (offline, zero build)
```
cd editor
python3 -m http.server 8124     # any static server works
# open http://localhost:8124/
```
No Node, no bundler, no network at runtime. three.js r182 is vendored (`editor/js/vendor/`), the full 1439-prop asset library (101MB) and humanoid/camera/spotlight GLBs are in `editor/assets/`.

## What works (verified headless — see docs/FIDELITY.md)
- **Renderer + time-of-day (P1)**: exact daylight table (7 stops + full-day), sky dome shader, hemisphere+sun+PCF shadows with fingerprint-fitted shadow camera, dynamic fog/near/far, 80000² floor. Light popover with sun puck + presets (Midday/Golden/Dusk/Night) — interpolated values verified exact.
- **Scene editing**: all 11 object kinds (humanoid w/ 46 embedded clips, simple_figure exact geometry, camera + frustum, spotlight w/ diffusion cookies, 1426 GLB props + 13 procedural), click/alt/multi selection with rounded-box footprint shader, TransformControls, inspector, hierarchy, add palette + searchable prop picker, undo/redo, autosave.
- **Paths + animation (P2)**: paint-mode path editing (anchors + tangent/height handles, chordal Catmull-Rom tangents exact), walk playback with ground snap + gait clips + gaze split, cam-move presets (orbit/dolly/crane/spiral/pan) with exact math, cam-path with heightCurve + pace, cam-manual 20Hz, cam-follow, transform/rig keyframes; timeline with drag/trim/zoom/seek + per-kind segment inspectors; camera-mode record framing (exact o2r letterbox + fov adoption).
- v10 scene JSON in/out (full migration chain v1→v10) — round-trips the real captured scenes.

## Layout
- `editor/` — the app (index.html, js/, css/, assets/, samples/)
- `analysis/` — extraction ground truth from the live bundle
- `docs/` — DESIGN.md, FIDELITY.md, screenshots/
- `.agents/` — agent meta docs (SKILL.md + kb/)
- PLAN.md / HANDOFF.md / CONTEXT.md — durable task tracker / session seam / operational context

## Status & next steps
See PLAN.md backlog (stroke outline ring, keyed-camera capture, timeline magnet snapping, heightCurve editor UI, plan canvas, shake system).
