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
`main.js` App: viewport (COr) + env (wOr) + finish (hKt, finish.js) + stroke (stroke.js) + orbit + fogNearFar (pZt) + shadowFit (TOr + AOr needsUpdate) + objectManager (AWr) + selection (pGr footprints) + hover (CGr) + manipulator (pWr+ozr, SZt/kZt commit) + pathEditor (UGr) + frame loop (ticks → renderFrame: finishOn ? finish.render : renderer.render → _autoMeasure → drawOverlays: stroke → aids (no clearDepth)).
`tracks.js` eval: showLayout (rx) → evalCharacterTrack (eEe) / evalObjectItems (Q: base-TRS seeded + ne path apply + GA unwrap) / evalCameraObject (dZt→fFr, aim falls back to camera.targetId); `curves.js` mT (sqrt-chordal)/nx/MR/oq/Yae/khe/ZA + j2r (chord projection); `schema.js` f6r migrations + prt + lje packing; `store.js` 3 stores + gesture undo (objects+show companion).
Mesh ownership: store→sync at rest; playback while performing; manipulator while dragging; reset from store on stop.

## kb/
- `kb/porting-notes.md` — detailed port gotchas (browser eval patterns, prop library quirks).

## Round-2 additions
16. **Procedural props** are the zqt builders (exact, in objects.js); only these 13 keys have no GLB; everything with a catalog URL is clay-rendered; `eat()` is the gray wireframe placeholder (dims box, base-anchored).
17. **Object color pipeline**: obj.color ?? Mje(name) → T() override (roughness 1, soft-terminator propagated); eKt lantern-names → userData.glows → TOr walk sets emissive 0xFFC98A × daylight-glow (night only). Primitives are BASE-anchored (geometry translated +.5y).
18. **Humanoids must load per-instance** (fresh loadAsync like the original) — a cached gltf.scene added twice steals the scene graph (verified: distinct mixers after fix).
19. **The live app's stroke mask includes ALL scene Lines** (camera frustums, path curves) whenever anything is selected — port quirk-for-quirk, don't filter.
20. **Auto-measure in headless**: SwiftShader cost (~99ms) always exceeds the 11ms budget → finish auto-DISABLES; pass `?finish=1` for visual QA (persists manual pref — clear localStorage afterwards).
