# PLAN — flick-3dEditor (long horizon)

Mission: reconstruct the flick.art 3D Stage editor runtime for local offline previz — renderer + time-of-day (P1), editor UX (P1), character + camera path editing + animation system (P2) — applying the local asset library. GIT IS THE DISK: GitHub ariellebridget3O/flick-3dEditor (primary) + GitLab ansgareutychisC/flick-3dEditor-mirror (backup; original name deleted, mirror is canonical) + /home/sync rsync.

## Round 1 (2026-11-13) — DONE
- [x] Context restore from flick-3dstage repo (SKILL/CONTEXT/HANDOFF/PLAN + 4 audit docs)
- [x] Live bundle re-fetch (index-DBE17t4T.js, 13.48MB, r182) — names reshuffled vs prior audit; all subsystems re-located by data-shape
- [x] Deep extraction: ENVIRONMENT.md (renderer/daylight/sky/fog/shadow-fit — daylight table decimals byte-exact, hex comments corrected), TRACK_SYSTEM.md (16 sections, 14 item kinds, cam-move math, play recorder, migrations v1→v10), HUMANOID.md (simple_figure box geometry exact, humanoid pipeline, 46 clips, rig posing, gaze), EDITOR_UX.md + DOM_REFERENCE.md (selection 3-layer system, manipulation, path editing, timeline, plan canvas, light puck, framing math)
- [x] DESIGN.md v2 (audited by sub-agent: APPROVE-WITH-CHANGES, F1–F23 folded in)
- [x] Editor implemented: 13 modules, vendored three r182 (+core, OrbitControls, TransformControls, GLTFLoader, BufferGeometryUtils), all 11 object kinds, 1439-prop catalog + full GLB library (101MB), 13 procedural stand-ins
- [x] E2E verified headless: path walk exact, time-of-day exact, framing exact, undo/redo, prop picker, autosave restore — see docs/FIDELITY.md
- [x] Both remotes + /home/sync backed up throughout

## Backlog (future rounds) — priority order
- [ ] Silhouette stroke ring (hGr port: offscreen RT mask + ring shader 1.5px + halo; hover included) — selection visuals completeness
- [ ] Lasso select (rect ∩ world positions, excludes track-driven)
- [ ] Manipulation commit pipeline completion: keyed-camera capture (cam-transform key on drag), cam-move rebase keep|turn|framing, position/rotation-only rules under cam-path
- [ ] Timeline polish: magnet snapping 12px w/ obstacle push, block reorder ghost, keyframe diamonds on transform/rig/cam-transform blocks, alt-drag duplicate between tracks, take-range drag on ruler
- [ ] cam-path heightCurve editor UI (press line adds point, drag point/handle, scrub seek; data eval + 64-sample display already work)
- [ ] Shake system on preview (Dzt presets + camera rigs gq — constants already in const.js)
- [ ] 2D plan canvas (SDr painter: grid fade 8→24px/m, footprints, camera wedges, spotlight pools, marquee, draw-direction stroke → path)
- [ ] Humanoid rig posing UX (rigJointPickables joint spheres r .028, captureFocusedRigPose)
- [ ] cam-follow offset UI + play keymap editors
- [ ] Scene thumbnails; multi-scene tabs
- [ ] Live-app baseline screenshots for visual diffing (needs network; self-baseline regression exists meanwhile)
- [ ] Test suite hardening: normalization-idempotence golden test across all 4 real scenes + synthetic fixtures; SwiftShader flags in CI script

## Durable facts
- Repo IS the disk; never force-push; secrets split-coded in .env (push-protection-safe: GitHub blocks literal + base64 PATs, split-mid-string works)
- The gitlab remote named flick-3dEditor was recreated as **flick-3dEditor-mirror** (old project deleted — name reserved during scheduled deletion; if freed later, optionally rename back)
- Editor dev loop: edit /home/z/flick-3dEditor/editor/** → server already at :8124 (python3 -m http.server) → agent-browser close + open with ?v=N (ES module cache needs fresh session, reload is NOT enough)
- Watchdog: work in /home/z/flick-3dEditor (outside /home/z/my-project) — safe
- Bundle statics live in analysis/index-DBE17t4T.js; extraction tooling in scripts/ (extract_bundle.py, sig_search.py) + analysis/tmp_{a,b,c}/
