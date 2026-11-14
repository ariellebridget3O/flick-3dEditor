# HANDOFF — next session (immediate seam)

## State
Round 2 complete through commit (see git log). The editor's RENDERING PATH is now exact end-to-end: finish composer (SSAO/edges/soft-terminator, auto-measured + `stage-finish` localStorage), stroke ring, clay props, exact primitives/procedurals/markers. All 4 audit P0s + ~18 P1s fixed and E2E-verified (docs/FIDELITY.md round-2 log). Both remotes + /home/sync synced. Server may be down (sandbox processes die) — restart: `cd /home/z/flick-3dEditor/editor && nohup python3 -m http.server 8124 &`.

## First 10 minutes
1. `cd /home/z && git clone https://<GH_PAT>@github.com/ariellebridget3O/flick-3dEditor.git` (PAT split-coded in .env: `source scripts/env.sh`) — or resume /home/z/flick-3dEditor if the sandbox survived.
2. Read PLAN.md backlog (priority-ordered, sourced from the audit docs) + docs/FIDELITY.md.
3. Start server (above), verify: `agent-browser open "http://localhost:8124/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&finish=1"` → no errors, `window.__app` truthy. Finish note: `?finish=1|0` forces the pref (persisted, source manual); otherwise auto-measure decides (SwiftShader = always off → for visual finish QA always pass finish=1).

## Seam items (only these)
1. **Timeline polish** — the largest remaining UX gap (AUDIT_UX §5 has the 16-item checklist; raw code in analysis/tmp_b/timeline_ui_pretty.js + tracks_raw.js PLACEMENT section @42077: q5r magnet 12px + obstacle push, oje overlap, _ie solver, W5r place, trim → speed=arc/dur, keyframe diamonds on transform/rig/cam-transform blocks).
2. **Segment inspector editors** for rotate/revolve/scale/transform/play (store setters exist: setRotateAxis/setObjectItemSpeed/setRevolveCenter/setScaleFactor/addTransformKeyframe — wire the DOM in ui.js; raw: segment_inspector_pretty.js).
3. **Lasso** (manipulate.js — rect ∩ world positions, excludes track-driven; lasso cursor nWr 28×28 hotspot 6 24).
4. **Nav ball** — raw code ALREADY EXTRACTED in analysis/tmp_d/auto_measure.js (lZr complete: 67px pad + zie=12 margin, copyFramebufferToTexture, golden-angle 12-tap blur, compass needle, navBallVector drive) — needs its own module + wiring in main.js frame loop (tick + render, edit-mode only).

## Env gotchas (round-2 additions)
- MultiEdit/long old_str: line-exact matching fails on invisible whitespace — prefer python replace scripts with assert, or Edit with short anchors.
- Bash pipelines EAT literal "[h" sequences in OUTPUT (sed/grep display) — the FILES are fine; verify with Read before "fixing" mangled-looking code.
- agent-browser eval: no THREE global — import('/js/vendor/three.module.js') inside eval, or use plain math / app APIs.
- Template-literal regexes: `[[_\\s-]]` is WRONG (char class + literal ]); correct: `[_\\s-]` — see finish.js GC.
- The stroke ring + finish are ONE predicate (strokeEnabled = finishOn) — matching the live app; footprint shader is independent.
- Saved scenes carry BAKED anchor tangents (in/out) — eval uses them as-is; only painting/editing recomputes via buildTangents. Don't "fix" a fixture's tangents.
- ?finish=1 on a fresh profile: localStorage gets {enabled:true,source:"manual"} — clear it (agent-browser eval localStorage.clear()) before testing auto-measure.
