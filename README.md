# flick-3dEditor

Local offline reconstruction of the **flick.art 3D Stage** editor runtime — the viewport renderer, time-of-day/daylight system, scene editor UX, character + camera path editing, and the animation/show-track system — for previz work without internet access.

Ground truth: live bundle static analysis (`analysis/index-DBE17t4T.js`, r182-era), saved DOM (`flick-canvas-3dView.html` in flick-3dstage repo), scene v10 schema audit (docs/SCENE_FIDELITY_AUDIT.md in flick-3dstage).

Related repo: `flick-3dstage` (asset library export, scene capture, API automation, offline editor v2).

## Layout
- `editor/` — the local editor app (static HTML/JS, vendor three.js, zero network)
- `analysis/` — extracted runtime subsystem code + notes from the live bundle
- `vendor/` — three.js r182 module build + GLTFLoader
- `docs/` — design docs, runtime extraction notes, fidelity audit of the reconstruction
- `.agents/` — agent meta docs (SKILL.md + kb/)

## Status
See PLAN.md / HANDOFF.md.
