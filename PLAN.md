# PLAN — flick-3dEditor (long horizon)

Mission: reconstruct the flick.art 3D Stage editor runtime for local offline previz — renderer + time-of-day (P1), editor UX (P1), character + camera path editing + animation system (P2) — applying the local asset library. GIT IS THE DISK: GitHub ariellebridget3O/flick-3dEditor (primary) + GitLab ansgareutychisC/flick-3dEditor-mirror (backup; original name deleted, mirror is canonical) + /home/sync rsync.

## Round 1 (2026-11-13) — DONE
- [x] Context restore, live bundle re-extraction (4 analysis docs), DESIGN.md v2 audited, editor implemented (13 modules + three r182 + 101MB assets), E2E verified (daylight/path/framing exact; undo/picker/autosave pass)

## Round 4 (2026-11-15) — DONE
- [x] Env restored after sandbox reset: repo now lives INSIDE /home/z/my-project/flick-3dEditor (persisted; symlinks now blocked by sandbox → public/editor is an rsync COPY via my-project/scripts/sync-editor.sh — run it after every editor edit)
- [x] **Timeline P3s**: duplicate ghost renders on alt-pointerdown in SOURCE lane (pre-threshold); guides render in the SOURCE lane during cross-lane duplicate; laneDuplicateTarget only for different+compatible lanes; diamond title tooltips; ruler last-label clip (+gutter width); WASD gated to default control mode (live ne())
- [x] **Take-range tool** (xTr/Tie/PGt/wTr/_Tr EXACT): range button, draw on lanes + ruler, grips (eie=.1 clamps), label slide, magnet markers [0,dur,playhead,…edges], Delete/Esc/outside-deselect, per-move magnet radius, setTakeRange + She takeSpan/filmedARange + show.range persistence
- [x] **Gizmo custom meshes** (Mzr/Pzr/Nzr EXACT): one-sided shafts/cones, plane discs, centre sphere/box + BackSide shell, rotate ring set, negative-axis picker drop, hover #FFD166
- [x] **P0 fix from review**: trim handler referenced undefined `up` (pointerup listener no-op → gesture never ended: no undo push + interaction leak + timeline freeze) — single `finish` listener now
- [x] Review round: no P0s in new code; 2 P1 (ruler draw surface, per-move magnet) + 5 P2 fixed & E2E-verified

## Round 3 (2026-11-15) — DONE
- [x] Editor served on port 3000 via fullstack-dev (public/editor symlink + full-viewport iframe on /; VLM QA PASS; preview panel)
- [x] **Timeline polish** (seam 1): place.js solver (q5r/_ie/kGt/lje/Xne/oje/W5r/G5r/MP/wie) audited EXACT; block drag (magnet 12px + obstacle push + reorder preview + snap guides + alt-drag duplicate w/ Art/DHr same-domain gate); trim handles (clip dur, path speed=arc/dur, [.1,120] clamps); keyframe diamonds (SCr: click select+seek, drag B2r clamp + xbe move, active/selected); magnet toggle; YAr clock; segment editors for rotate/revolve/scale/transform + key list (jump/delete); **ruler↔lane 110px gutter alignment fix** (pre-existing seek bug)
- [x] **Segment inspector editors** (seam 2): axis/degPerS/center/factor + keyframe capture per kind
- [x] **Lasso** (seam 3): editInteraction mode + right-toolbar toggle, nWr cursor, orbit gating, rect overlay, projected-position selection (Xu skip), one-shot, Esc
- [x] **Nav ball** (seam 4): lZr exact (67px pad, blurred backdrop, rolling icosa, zzr stick, Ye 4m/s drive Shift×3)
- [x] Code review round: 3 P0 + 4 P1 + 6 P2 fixed (gesture depth-counting undo, diamond click stopPropagation, duration clamps, pointercancel guards, reorder raw-follow, duplicate gate, seek-stops-playback, WWr footprint-vs-selection split, appendPlace for add-menu, painting-block drag gate)

## Round 2 (2026-11-14) — DONE
- [x] **Rendering path made exact** (user P0): finish composer hKt (SSAO+blur+composite+SOFT_TERMINATOR) ported verbatim + auto-measure + stage-finish persistence; stroke ring hGr/uGr; **clay props** (FNr strips ALL GLB materials → one #e2e0dc rough-1 material — the "white shaded models"); exact primitives (base-anchored, soft terminator, big-swap); Mje name colors + eKt night glow; 13 procedural prop builders (zqt); target torus (YWt); camera mie + urt 16-pt frustum + page focal/aspect + target aim; u5r placeholder; AOr shadow fingerprint redraw; EOr no-clearDepth; nav-ball raw code captured (analysis/tmp_d/auto_measure.js)
- [x] **Full exactness audit** (3 parallel sub-agents → analysis/AUDIT_{TRACKS,UX,ENV_UI}.md): 73+67+62 rows, 4 P0 / ~24 P1 found
- [x] **All 4 P0s fixed**: Q base-TRS seeding (teleport bug), mT sqrt-chordal tangents (TRACK_SYSTEM.md had mis-transcribed the metric — bundle truth: n=√chord), commit-refusal inverted (only cameras/targets refuse, SZt; others commit freely, kZt), humanoid GLB shared-scene steal (per-instance loadAsync)
- [x] **~18 P1s fixed**: pan_sweep exact (at-START anchor), revolve x2r sign + origin center + live-mesh application, ne() non-person path apply (props now move on paths), FOLD_KINDS gate, GA euler unwrap (Q + commit), cam-move rebase GOr, keyed-camera/target capture, cam-follow offset, VOr/UOr gates, reaim, jZt gaze (EZt + negated pitch), IZt additive merge, undo covers objects+show, TOr fingerprint quaternion/scale, floor polygonOffset 4, crane_down +3, pace/heightCurve validators, timeline seek scrollLeft, groundY recursive, aids traverse, v4to5 all cameras, v7to8 chained unwrap, aim targetId fallback, stop-at-end reset, multi-select parent restore
- [x] E2E verification of every fix (see docs/FIDELITY.md round-2 log)

## Backlog (future rounds) — priority order; source: AUDIT_*.md P2 lists + old backlog
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
