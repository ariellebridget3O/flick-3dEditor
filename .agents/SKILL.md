# flick-3dEditor project skill (meta know-how for future agents)

## Ground truth sources (in this repo)
- `analysis/ENVIRONMENT.md` — renderer/sky/daylight/fog/shadow-fit extractions
- `analysis/FINISH_RENDERER.md` — finish composer (SSAO/edges/soft-terminator), stroke ring, primitives/glow/name-colors, nav-ball raw, alias table
- `analysis/TRACK_SYSTEM.md` — 16-section track/animation eval (NOTE §3.1 mis-transcribed mT's chord metric — bundle truth is **sqrt-chordal**, see AUDIT_TRACKS)
- `analysis/HUMANOID.md` — simple_figure, humanoid pipeline, 46 clips, rig posing, gaze
- `analysis/EDITOR_UX.md` + `analysis/DOM_REFERENCE.md` — selection/manipulation/path/timeline + DOM spec
- `analysis/AUDIT_{TRACKS,UX,ENV_UI}.md` — **round-2 module-by-module divergence registry** (the "is X exact?" authority; includes the verified-correct lists)
- `analysis/index-DBE17t4T.js` — the live bundle itself (13.48MB); extraction: scripts/{sig_search,find_ctx,dump_func}.py + tmp_{a..d}/ raw dumps
- `docs/FIDELITY.md` — EXACT/PORT/APPROX/SKIP per subsystem + runtime verification logs

## Recurring operational know-how
1. **Minified names reshuffle per build** — port VALUES/data-shapes, never names. Locate subsystems by signature strings ("cam-move", 1.299, PlaneGeometry(80000...), GC regex shapes).
2. **Analysis docs can MIS-TRANSCRIBE** — always re-verify a formula against the raw bundle bytes before porting (round-2 examples: mT sqrt metric, floor polygonOffsetFactor 4, pan_sweep anchor). The audit agents found these by re-reading raw, not the docs.
3. **y2r vs KCe**: same cam-move family, OPPOSITE directions — KCe is the forward eval (start→end), y2r the rebase inverse (end→start). Signs intentionally flip; don't "fix" one to match the other.
4. **Baked vs computed state**: saved scenes carry anchor in/out tangents (eval uses as-is); painting/editing recomputes via buildTangents. Test tangent math by APPENDING anchors, not by reading fixtures.
5. **Rendering-path architecture** (flick "look"): plain render OR finish composer (hKt: MSAA HalfFloat RT + depth texture → half-res RedFormat SSAO ping-pong → composite w/ occlusion tint + crease edges + dither + gl_FragDepth) — chosen by `finishOn()` = capability && localStorage pref (auto-measured, ≤11ms @1080p). Stroke ring shares the SAME predicate. ALL props are clay (one shared #e2e0dc rough-1 material — FNr strips GLB materials). Planning-aids pass has NO clearDepth (aids occlude behind geometry).
6. **ES-module cache in headless Chrome**: reload does NOT refetch — `agent-browser close` + open with fresh `?v=N`. Serve with `python3 -m http.server`.
7. **three r182 pitfalls**: TransformControls not an Object3D (`getHelper()`); PCFSoftShadowMap deprecated → PCFShadowMap; custom ShaderMaterials need `fog:false` under FogExp2; `THREE.Ray` has no intersectObjects; vendor three.core.js + three.module.js + GLTFLoader needs utils/BufferGeometryUtils.js; r182 WebGLRenderTarget supports `samples` + depthTexture (the finish composer relies on both).
8. **Layout-track wrappers** `{item, startS, endS}` — every consumer must unwrap (`u.item`).
9. **Bash pipelines eat literal `[h`** in OUTPUT display (sed/grep) — files are fine; verify with Read. Same class of gotcha: sub-agent dumps sanitize `[`→`【】`.
10. **VLM QA loop**: screenshot → sub-agent visual check with explicit expected-content list → verdict + nits. Catches real bugs; but VERIFY pixel-level claims programmatically when a "FAIL" is surprising (round-2: VLM called the lantern glow missing — pixel scan at the mathematically projected position proved it rendered).
11. **Watchdog** force-checkouts /home/z/my-project only — /home/z/flick-3dEditor is safe. /home/sync as third backup (background rsync for 100MB+).
12. **GitLab WAF** 403 ~1/3 of pushes — retry loop in background (`nohup for i in 1..5; sleep 15; git push ...`); GH is primary.
13. **Edit-tool discipline**: long old_str blocks fail on invisible whitespace — use short anchors or python `replace` scripts with `assert old in s` (guarantees the match, fails loudly).
14. **Commit-pipeline testing without a mouse**: set `manip._attached`, `manip.dragging`, `manip._dragStartObj`, `app.show.beginEditGesture()`, mutate mesh/store, call `manip._commit()`, then inspect store + read the undo round-trip. Remember `addItem` PACKS items (sequential bumping) — the playhead must be sought INSIDE the packed startS, not the requested one.
15. **Undo parity**: the gesture snapshot must cover objects+show (setUndoCompanion) and endEditGesture must run AFTER the commit writes — otherwise drags aren't undoable.

## Editor architecture (quick map)
`main.js` App: viewport (COr) + env (wOr) + finish (hKt, finish.js) + stroke (stroke.js) + navBall (lZr, navball.js — tick/driveTick/render) + orbit + fogNearFar (pZt) + shadowFit (TOr + AOr needsUpdate) + objectManager (AWr) + selection (pGr footprints) + hover (CGr) + manipulator (pWr+ozr, SZt/kZt commit + lasso br/Nr/ua/jt) + pathEditor (UGr) + frame loop (ticks → renderFrame: finishOn ? finish.render : renderer.render → _autoMeasure → drawOverlays: stroke → aids (no clearDepth) → navBall.render).
`tracks.js` eval: showLayout (rx) → evalCharacterTrack (eEe) / evalObjectItems (Q: base-TRS seeded + ne path apply + GA unwrap) / evalCameraObject (dZt→fFr, aim falls back to camera.targetId); `curves.js` mT (sqrt-chordal)/nx/MR/oq/Yae/khe/ZA + j2r (chord projection); `place.js` timeline placement solver (q5r/_ie/kGt/lje/Xne/oje/W5r + B2r/xbe + bGt/a$/yGt/Art/DHr — review-certified EXACT); `schema.js` f6r migrations + prt + lje packing; `store.js` 3 stores + DEPTH-COUNTED gesture undo (nestable brackets; push at depth 0) + keyframe family; `ui.js` timeline (solver drag/trim/diamonds/magnet/duplicate) + viewport overlays (lasso button/box, nav ball pad).
Mesh ownership: store→sync at rest; playback while performing; manipulator while dragging; reset from store on stop.

## kb/
- `kb/porting-notes.md` — detailed port gotchas (browser eval patterns, prop library quirks).

## Round-4 additions
29. **Synthetic PointerEvents need `pointerType:'mouse'`** for anything that switches on pointerType (stock TransformControls onPointerHover) — default '' falls through silently; also stock vendor setPointerCapture is NOT try/catch'd, so use agent-browser NATIVE `mouse` commands for vendor-control drags (synthetic pointerIds throw NotFoundError).
30. **A reload does NOT bust the ES-module cache** even with a bumped ?v= on the page URL (import URLs are unversioned) — close the browser session and reopen. Symptom: error stack line numbers that don't match the current file.
31. **In-place DOM updates for capture-holding overlays** — a React-equivalent re-render via innerHTML destroys the element holding pointer capture mid-drag. Update styles/classes on persistent elements; only rebuild elements that never hold capture (guides/ghosts).
32. **Interaction-flag discipline**: every early return inside a gesture must still be reachable for cleanup — the round-4 P0 was `addEventListener('pointerup', undefined)` (a silent no-op) leaving `app._tl.interaction='trim'` set forever: no undo push AND refreshTimeline permanently suppressed. Use ONE `finish` listener for up+cancel and reference only names that exist in scope.
33. **Live setHex-override tricks are for THEIR codebase** — the live f8 material intercepts `color.setHex` to force the hover color, but stock r182 highlights via `color.copy(materialLib.active.color)`; the equivalent is `tc.setColors(x, y, z, hoverColor)`. Port the OBSERVABLE, not the mechanism.
34. **Decode i18n keys as unavailable** — the message catalog is a separate compiled asset, not in the JS bundle; use semantic English strings and note them as equivalents (never invent "exact" wording).
35. **Sandbox policy drifts between sessions** — `ln -s` and bind mounts worked in round 3, blocked in round 4. Detection: tool errors on previously-working commands; fallback = rsync copy + sync script.

## Round-3 additions
21. **Gesture undo is depth-counted** — beginEditGesture++ / endEditGesture-- and the undo push happens at depth 0. `_commit` self-brackets, so an outer bracket (drag pointerdown→up) swallows per-move commits into ONE entry. Any new drag flow: bracket it AND handle pointercancel (an uncleared `app._tl.interaction` freezes timeline re-render).
22. **WWr=32 is the footprint-DRAW cap, not a selection cap** — live setSelection is unclamped. Constants can serve a DIFFERENT subsystem than their name suggests; always check the consumer.
23. **Browsers fire `click` after `pointerup`** — synthetic-event tests must dispatch BOTH, and inner-gesture targets (diamonds, trim handles) need their own `onclick stopPropagation` or the parent block's click handler clobbers state (a P0 that pure pointer-event tests were blind to).
24. **agent-browser mouse events don't carry held modifiers** — for Alt-drag etc., dispatch PointerEvents with `altKey:true` on the element; guard `setPointerCapture` with try/catch (synthetic pointerIds throw).
25. **Ruler/lane gutter alignment**: lanes have a sticky N-px header gutter — EVERY absolutely-positioned timeline child (ticks, playhead, guides) and EVERY px→time conversion must add the gutter. A pre-existing 110px misalignment hid for two rounds because tests only checked numbers, not visual alignment.
26. **Port-3000 review serving**: Next.js at /home/z/my-project (fullstack-dev skill init) + `public/editor` SYMLINK to this repo + full-viewport iframe on `/`. Editor edits are instantly live (no copy). `window.__app` is inside the iframe — test the direct `/editor/index.html` URL instead.
27. **`updateTrackItems` in the live app ALWAYS repacks (lje) after mutation** — that's the collision resolver; reorder = kGt (slot-start inheritance, gaps preserved) + lje. My `_commit`'s packItems is the same contract — keep it.
28. **The live alt-drag duplicate is SAME-DOMAIN only** (yGt requires the a$ remap to preserve the action): walker→walker yes, path→camera NO (remap exists only for the actions palette). Missing destination owner → refuse everything.

## Round-2 additions
16. **Procedural props** are the zqt builders (exact, in objects.js); only these 13 keys have no GLB; everything with a catalog URL is clay-rendered; `eat()` is the gray wireframe placeholder (dims box, base-anchored).
17. **Object color pipeline**: obj.color ?? Mje(name) → T() override (roughness 1, soft-terminator propagated); eKt lantern-names → userData.glows → TOr walk sets emissive 0xFFC98A × daylight-glow (night only). Primitives are BASE-anchored (geometry translated +.5y).
18. **Humanoids must load per-instance** (fresh loadAsync like the original) — a cached gltf.scene added twice steals the scene graph (verified: distinct mixers after fix).
19. **The live app's stroke mask includes ALL scene Lines** (camera frustums, path curves) whenever anything is selected — port quirk-for-quirk, don't filter.
20. **Auto-measure in headless**: SwiftShader cost (~99ms) always exceeds the 11ms budget → finish auto-DISABLES; pass `?finish=1` for visual QA (persists manual pref — clear localStorage afterwards).
