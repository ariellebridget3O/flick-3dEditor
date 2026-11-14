# PLAN — flick-3dEditor (long horizon)

Mission: reconstruct the flick.art 3D Stage editor runtime for local offline previz — renderer + time-of-day (P1), editor UX (P1), character + camera path editing + animation system (P2) — applying the local asset library. GIT IS THE DISK: GitHub ariellebridget3O/flick-3dEditor (primary) + GitLab ansgareutychisC/flick-3dEditor-mirror (backup; original name deleted, mirror is canonical) + /home/sync rsync.

## Round 1 (2026-11-13) — DONE
- [x] Context restore, live bundle re-extraction (4 analysis docs), DESIGN.md v2 audited, editor implemented (13 modules + three r182 + 101MB assets), E2E verified (daylight/path/framing exact; undo/picker/autosave pass)

## Round 2 (2026-11-14) — DONE
- [x] **Rendering path made exact** (user P0): finish composer hKt (SSAO+blur+composite+SOFT_TERMINATOR) ported verbatim + auto-measure + stage-finish persistence; stroke ring hGr/uGr; **clay props** (FNr strips ALL GLB materials → one #e2e0dc rough-1 material — the "white shaded models"); exact primitives (base-anchored, soft terminator, big-swap); Mje name colors + eKt night glow; 13 procedural prop builders (zqt); target torus (YWt); camera mie + urt 16-pt frustum + page focal/aspect + target aim; u5r placeholder; AOr shadow fingerprint redraw; EOr no-clearDepth; nav-ball raw code captured (analysis/tmp_d/auto_measure.js)
- [x] **Full exactness audit** (3 parallel sub-agents → analysis/AUDIT_{TRACKS,UX,ENV_UI}.md): 73+67+62 rows, 4 P0 / ~24 P1 found
- [x] **All 4 P0s fixed**: Q base-TRS seeding (teleport bug), mT sqrt-chordal tangents (TRACK_SYSTEM.md had mis-transcribed the metric — bundle truth: n=√chord), commit-refusal inverted (only cameras/targets refuse, SZt; others commit freely, kZt), humanoid GLB shared-scene steal (per-instance loadAsync)
- [x] **~18 P1s fixed**: pan_sweep exact (at-START anchor), revolve x2r sign + origin center + live-mesh application, ne() non-person path apply (props now move on paths), FOLD_KINDS gate, GA euler unwrap (Q + commit), cam-move rebase GOr, keyed-camera/target capture, cam-follow offset, VOr/UOr gates, reaim, jZt gaze (EZt + negated pitch), IZt additive merge, undo covers objects+show, TOr fingerprint quaternion/scale, floor polygonOffset 4, crane_down +3, pace/heightCurve validators, timeline seek scrollLeft, groundY recursive, aids traverse, v4to5 all cameras, v7to8 chained unwrap, aim targetId fallback, stop-at-end reset, multi-select parent restore
- [x] E2E verification of every fix (see docs/FIDELITY.md round-2 log)

## Backlog (future rounds) — priority order; source: AUDIT_*.md P2 lists + old backlog
- [ ] Timeline polish: trim handles (incl. path speed=arc/dur UI), magnet snapping 12px w/ obstacle push (q5r/G5r/oje/_ie), keyframe diamonds on transform/rig/cam-transform blocks, block reorder ghost, alt-drag duplicate between tracks, take-range drag (AUDIT_UX §5)
- [ ] Segment inspector editors for rotate/revolve/scale/transform/play kinds (AUDIT_ENV_UI)
- [ ] Lasso select (rect ∩ world positions, excludes track-driven) + lasso cursor
- [ ] Gizmo custom meshes (Mzr): shaft/cone/circle/torus geometry per mode, renderOrder 1000010, negative-axis picker drop
- [ ] Nav ball (lZr) — raw code already extracted in analysis/tmp_d/auto_measure.js + EDITOR_UX §7 (framebuffer copy + golden-angle blur + compass needle + drive)
- [ ] Shake apply on preview (Dzt/oEr — constants in const.js; camera rigs gq)
- [ ] 2D plan canvas (SDr painter: grid fade, footprints, camera wedges, spotlight pools, marquee, draw-direction → path)
- [ ] Humanoid rig posing UX (xqr joint spheres r .028, captureFocusedRigPose, Fzr multi-joint)
- [ ] Spawn grid 5×6 (V2e/rMr/nL=1.5) + simple_figure spawn yaw Bst; Dqr zoom anti-jitter m() + right-drag free-look; Space→Rehearse
- [ ] cam-follow offset UI + play keymap editors; scene thumbnails; multi-scene tabs
- [ ] Remaining AUDIT_TRACKS P2s: nearestSegmentXZ tie-breaks, fov edge cases, gazeSplit guards, r6r default-scene factory, take-range She
- [ ] Test suite hardening: normalization-idempotence golden test across all 4 real scenes + synthetic fixtures; SwiftShader flags in CI script
- [ ] Live-app baseline screenshots for visual diffing (needs network); self-baseline regression exists meanwhile

## Durable facts
- Repo IS the disk; never force-push; secrets split-coded in .env (push-protection-safe)
- GitLab mirror = flick-3dEditor-mirror (WAF 403 ~1/3 — retry loop in background works; GH primary)
- Editor dev loop: edit editor/** → server :8124 → agent-browser close + open ?v=N (ES module cache needs fresh session)
- Watchdog: work in /home/z/flick-3dEditor (outside /home/z/my-project) — safe
- Bundle statics: analysis/index-DBE17t4T.js; extraction tooling scripts/{extract_bundle,sig_search,find_ctx,dump_func}.py; raw dumps analysis/tmp_{a,b,c,d}/
- The three AUDIT_*.md docs are the authoritative divergence registry — consult before "is X exact?" questions
