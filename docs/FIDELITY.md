# FIDELITY — reconstruction vs live flick.art 3D Stage

How exactly the local editor (`editor/`) reproduces the live app, subsystem by subsystem.
Ground truth: `analysis/{ENVIRONMENT,TRACK_SYSTEM,HUMANOID,EDITOR_UX,FINISH_RENDERER}.md` (extracted from live bundle
`index-DBE17t4T.js`, 2026-11-13/14) + `analysis/DOM_REFERENCE.md` (saved DOMs) +
`analysis/{AUDIT_TRACKS,AUDIT_UX,AUDIT_ENV_UI}.md` (round-2 module-by-module audits).

Legend: **EXACT** = byte/port-exact from bundle (values verified in headless round-trip) ·
**PORT** = faithful port of extracted code, minor adaptations · **APPROX** = documented approximation ·
**SKIP** = consciously not implemented (DESIGN D11).

## Rendering environment (P1)
| Subsystem | Status | Verification |
|---|---|---|
| WebGLRenderer (antialias, PCFShadowMap, dpr≤2, `.ph-viewport-capture`, shadowMap.autoUpdate=false + AOr fingerprint redraw) | EXACT | `COr`/`fZt`/`AOr` port; fingerprint now hashes full TRS (quaternion+scale) |
| **Finish composer (hKt)** — scene→MSAA-4 HalfFloat RT w/ depth texture → golden-angle SSAO (12 taps, R .05, self-bias .2, half-res max-540 RedFormat ping-pong) → separable 3-tap depth-aware blur → composite (occlusion tint 0x626a8c, crease tint .1/.11/.16, smoothstep(.004,.03)·.15, fog-aware clearAir, sRGB + triangular dither, gl_FragDepth preserved, AlwaysDepth) | EXACT | shaders verbatim; VLM QA day PASS (contact + crease AO on clay); auto-measure port (2 warm + 5 median, readPixels GPU fence, ≤11ms @1080p, 30-frame schedule, 2 retries @300) |
| **SOFT_TERMINATOR light patch** (ShaderChunk lights_physical_pars_fragment; dotNL=(dotNL<.3 ? dotNL²/.6 : dotNL−.15)/.85) on sphere/cylinder primitives + their color overrides | EXACT | defines verified in-browser |
| **Stroke ring (hGr/uGr)** — mipmapped mask RT (MSAA 4, 16px-multiples, ≤1080) with white overrideMaterial (layer 2 + all Lines), ring shader (ringMax 8-tap, 1.5px·dpr·scale, halo .26, navy .09/.11/.18→white) | EXACT | gated on finish (same predicate as live); VLM confirmed ring around selected cube |
| **Clay props (FNr/qqt/ONr)** — ALL prop GLB materials stripped to ONE shared MeshStandardMaterial #e2e0dc roughness 1; per-instance geometry clone; catalog scale+yaw; XZ-centre + feet minY | EXACT | 21/21 prop meshes clay in-browser |
| Primitives (wWr/lKt/_Wr): base-anchored (translate 0,.5,0), clay pq roughness 1 (X_), sphere(64,32)/cyl(96) big-swap ≥24 (cube never), soft terminator sphere/cylinder | EXACT | geometry/material flags verified in-browser |
| Name colors (Mje) + glow (eKt) — plant/water name tints on cube/sphere/cylinder/prop; lantern-name emissive 0xFFC98A × daylight glow (TOr walk) | EXACT | 'Big Pond' → #a9bbd8 + big-swap; 'Lantern' glow → emissive ffc98a i=1, pixel-verified amber at projected screen pos |
| Editor camera 50/.1/500 @ (6,5,8) → origin, orbit target (0,1,0) | EXACT | DOM-verified start pose |
| Sky dome shader (xyww far-plane, pow .55 mix, flare pow 7 · smoothstep .06) | EXACT | `xOr/yOr/vOr` verbatim GLSL incl. comments; `fog:false` |
| Daylight table HY 7 stops + DFr full-day | EXACT | decimals byte-exact; browser round-trip: el 57.38 → zenith #dfe5f0, sun 2.15, hemi 1.7; el −28 → sunI 0.5143, hemi 0.5429, sky #060a17 |
| applyDaylight (hemi/sun/fog/sky uniforms, memo by az+el, glow return) | EXACT | `wOr` port; fog color = horizon verified |
| Sun direction + elevation remap (el>−8 ? max(el,5) : 25−el) | EXACT | el −28 → dir (28,48,23)@60 — hand-verified = sin/cos of 53° |
| Floor PlaneGeometry(80000², 128²) 0xD4D5D9 rough .9 polygonOffset **factor 4** units 4 + raycast proxy | EXACT | `wOr` port (factor corrected from raw dump) |
| Dynamic fog/near/far (pZt: bounds 400ms, density .715/max(120,1.5r,3n), far, near, hysteresis 1.1) | EXACT | `FFr/SFr/CFr/vje/OFr` port |
| Shadow fit (fingerprint incl. quaternion/scale, spread90×1.15, casterBox branch, w extent 16-snap, kOr texel snap, bias/normalBias) | EXACT | `TOr` port; casters = humanoid+figure only |
| Planning-aids overlay pass (layer 1 + traverse, autoClear=false, **no clearDepth** — aids occlude behind scene geometry) | EXACT | EOr port corrected (audit 2-c) |
| Procedural props (zqt 13 exact: doorway/stairs/wall/wall_corner/pillar/table/chair/mountain/tree/rock/plane/pyramid/capsule) | EXACT | WC/Uqt/tBe builders; tree trunk r .12 verified |
| Target marker (YWt torus .3/.03 + sphere .06, 0xDD4466, opacity .45, depthWrite off) | EXACT | geometry verified in-browser |
| Camera marker (mie scale .55/yaw π/centre; urt 16-pt frustum: 4 apex edges + 4 quad edges; page focal + record aspect (BU); target-aim + distance max(d,.6) (yFr)) | EXACT | teal frustum VLM-confirmed; frustum vertex layout exact |
| Humanoid placeholder (u5r: capsule body .18/.5@1.15, head .13@1.62, limb capsules) | EXACT | 6 parts |
| Prop placeholder (eat: gray 0x888888 wireframe dims box, base-anchored) | EXACT | |

## Time-of-day UI (P1)
| Sun puck (centre=zenith, rim=−30°, r=(90−el)/120, view-yaw relative), presets (Midday 128.66/57.38, Golden 9°, Dusk −4°, Night −28°), az/el numeric fields | PORT | presets verified live in headless (values above) |

## Scene data (v10)
| Loader (raw or {row,scene}), full v1→v10 migration chain, prt normalizers | PORT | `f6r/prt` chain; v4→5 now processes EVERY camera (u6r: shot-less get focal 50 + cam-still track — verified); v7→8 chained unwrap (p6r); pace/heightCurve validators exact (X2r/Kzt) |
| Save (packItems lje sequential bumping, undefined strip) | PORT | round-trip verified (path item preserved: speed 1.4, 4 anchors, gait walk) |
| recordAspect table (6 values incl. 1.85:1) | EXACT | `Zae` |

## Objects (P1)
| simple_figure (BOX body PP, head sphere, spherical visor zone 72°/−6..14°, band plane, #f29a5c + luma-contrast mark, headRotation pivot) | EXACT | `Zqt` port incl. aqt contrast rule |
| Humanoid (per-instance GLB load (original y(P) — no shared scene steal), scale 1.75/bind-height, XZ-centre, feet minY, M_Main orange, crossfade .25s, wall-clock wrap) | EXACT | 2-instance load verified; 46 clips identical |
| Camera object (GLB + 16-pt frustum sub-object, fov from page focal, distance 3) | EXACT | see rendering table |
| Spotlight (SpotLight shadow 1024²/near .2/far 60/bias −4e-4/normalBias .02, diffusion cookie, beam cone, lamp counter-scale, intensity ×2.4) | PORT | `sOr/iOr/oOr` |
| Props (1426 GLB clay + 13 procedural exact) | EXACT | clay 21/21 in real scene |
| Hierarchy (parentId groups, group delete re-parents), labels (canvas sprites y=1.75+.25), hi-poly swap ≥24 | PORT | `AWr.N` port |
| Color system (T override w/ softTerminator propagation, Kqt figure, Mje names, eKt glow) | EXACT | flags + colors verified |

## Selection + manipulation (P1)
| Footprint shader (rounded-rect SDF, 3px line, shade .22, ripple wash 1s cubic, fade 160ms, pad, corner .45, max 32, deselect 500ms) | EXACT | `pGr/cGr/dGr` GLSL verbatim |
| Foot computation (rotated child bboxes ∪ skinned bone positions) | PORT | `lGr` (rotation sign fixed per audit 2-b) |
| Hover disc (90ms ease, 20px, face-normal oriented) | PORT | `CGr` |
| Click selection (slop 8px, group promotion, alt raw, ⌘/ctrl multi, dblclick focus .3s, empty deselect) | PORT | `ua/JEe/YUr` |
| TransformControls (r182 getHelper, axis colors, forced translate when track-driven, camera scale→translate) | PORT | gizmo custom meshes (Mzr) = backlog |
| Wheel zoom + nav classification | PORT | `Vzr` heuristics approximated |
| WASD fly 4 m/s ×3 shift, Q/E vertical, floor clamp, maxPolarAngle recompute | PORT | |
| **Commit pipeline (SZt/kZt)** — mZt split: cameras/targets only take SZt (refusal under cam-manual/cam-path w/ 4 mode reasons (TZt), keyed-camera capture (cam-transform segment + playhead → key at tS), keyed-target, cam-follow offset (V8r), cam-move rebase (GOr: chain inversion via zat/y2r, keep/turn/framing), VOr/UOr gates, GA unwrap, reaim on no-move, paired target); everything else kZt (focused transform key capture (Bzt) OR full TRS, NO refusal) | PORT | walking-human drag commits (verified), keyed camera (key tS 1.5 pos [5,2,5] focal 35, verified), undo covers objects+show (restore verified); multi-select parents captured/restored |
| Lasso, alt-drag duplicate | PARTIAL | lasso backlog |
| Stroke ring | EXACT | see rendering table |

## Track system (P2)
| Curve subsystem (mT **sqrt-chordal** tangents (sqrt metric — cancels at end anchors only; middle verified [1.149,0,.456] on uneven anchors), nx 12-sample beziers, MR arc, oq, Yae) | EXACT | painted-anchor round-trip |
| Character eval eEe (path active/finished, play chaining, clip fallback, lookAt, yaw) | EXACT | |
| Ground snap, yaw turn 8 rad/s, parents+world→local | EXACT | `ue` port |
| Gaze split xM + DEF-neck .4/DEF-head .6 (jZt: EZt YXZ→XYZ + negated pitch; IZt additive merge) | EXACT | flags verified |
| cam-move KCe (orbit/spiral/dollies/crane/pan_sweep exact incl. dolly_zoom atan clamp; presets crane_down +3) | EXACT | pan_sweep at-START anchor corrected |
| cam-path (q2r + heightCurve ZA + pace khe) + travel look-ahead | EXACT | |
| **Object folding (Q/L/ne)** — base-TRS seeding (no teleport), FOLD_KINDS gate, revolve around store-center-or-origin with live-mesh application (x2r sign), ne() path apply for non-persons (parent-local + Z2r yaw + spotlight pitch preserve), GA euler unwrap | EXACT | rotate at [3,0,2] stays + rotY −2.642 (=3.642−2π unwrapped vs base .5); prop path mid [4.5,0,2] |
| transform keys Bzt, rig-transform Vzt + T2r | EXACT | |
| Item kinds: 14 | PORT | `evalObjectItems` |
| Playback (stop → reset to stored TRS) | PORT | verified: position restored exactly |
| Aim fallback: subject-less camera items aim at the camera's targetId | PORT | wired via resolvers.aim(cameraId) |
| Play-mode recorders, flight→path conversion | SKIP | D11 |
| Shake rigs | SKIP (constants extracted) | backlog |

## Path editing (P2)
| Paint mode (append; nearest CHORD <0.4m XZ → insert AFTER start anchor (j2r exact)) | EXACT | j2r rewritten to chord projection |
| Visuals (anchor .09 ×1.4 sel, number sprites, tangent 0x66ddff, height ladder, curve violet, 64-sample heightCurve) | PORT | |
| cam-path heightCurve editor UI | SKIP (backlog) | data eval + display work |

## UI shell
| Layout, timeline (ruler seek, gutter-aligned), lanes, blocks, **solver drag (q5r/_ie/kGt/lje exact)**, trim handles → speed=arc/dur, **keyframe diamonds (SCr exact)**, magnet + guides, alt-drag duplicate (Art/DHr), segment inspector (rotate/revolve/scale/transform editors), add palette, hierarchy, selection toolbar | EXACT | place.js solver audited EXACT by review |
| Keyboard (⌘Z/⇧⌘Z/⌘Y, ⌘C/⌘V, ⌘G, Del, Esc/Enter, F, Z/X/C) | PORT | Space→Rehearse backlog |
| Autosave (1s debounce, restore on load) | PORT | round-trip verified |
| 2D plan canvas, PIP, recording/takes, multi-scene tabs, chat | SKIP | D11/backlog |
| **Nav ball (lZr/RXr/zzr/Ye exact)**: 67px pad, blurred backdrop (golden-angle 12-tap), rolling icosahedron, drag-drive 4m/s | EXACT | review: constants + math EXACT |
| **Take-range tool (xTr/Tie/PGt/wTr/_Tr exact)**: range button (disabled while filming), draw on lanes + RULER, grips w/ eie=.1 clamps, label slide (durationS=w magnet), markers [0,dur,playhead,…edges], 3px threshold, guides on real snaps (bTr=1e-6), Delete/Esc/outside-deselect (form-gated), commit→tool-off+select, Ctrl mid-drag suspends magnet | EXACT | review: no P0; P1s (ruler draw surface, per-move magnet) + P2s fixed & verified |
| setTakeRange (@5548675): refuse while filming, null clears, 2dp round, tie validate; She takeSpan/filmedARange; range persists in show.range (v10 round-trip) | EXACT | undo: 1 entry per gesture; round-trip verified |
| **Gizmo custom meshes (Mzr/Pzr/Nzr exact)**: one-sided shafts (.009×.42 y .1→.52) + cones (.03/.115/24), plane discs (.045/28 @.17 op .6 2-side, ⟂-axis color), centre sphere .036 + box .0612 w/ BackSide #171b26 shell grown .006 (ro 1e6), rotate half-tori + E .75/.006 + XYZE op .35, renderOrder 1000010, negative-axis pickers dropped, hover #FFD166 via setColors | EXACT | 3-mode VLM PASS; X-drag commit +1.838; hover amber + restore |
| Duplicate ghost P3s: ghost on alt-pointerdown (source lane, own position), guides in SOURCE lane, laneDuplicateTarget only for different+compatible lane | EXACT | cross-lane snap-to-4.0 w/ guides [4,8] in source lane |
| **Lasso (br/Nr/ua/jt exact)**: editInteraction mode, nWr cursor, rect overlay, projected selection (Xu aimed-target skip), one-shot >8px, Esc | EXACT | review: EXACT (P3s fixed) |

## Runtime verification log (headless Chrome)
### Round 4 (2026-11-15)
- Take-range draw (lanes + ruler): [1,3.5] committed, tool auto-off, selected, ghost during draw, **1 undo entry**; short label "min 3s" (< Sie 3s); label chip repositioned INSIDE the ruler strip (VLM caught scroll-container clip).
- Grips: start 2.83→**snap 2.0** (marker, guide rendered); end→past-start clamps to **start+.1** (eie); slide start 2→**snap 4.0** (guide [4], width preserved 2.83).
- Ctrl/Cmd mid-drag suspends magnet (per-move radius like live `I = x(C,pps)`): no-Ctrl end snaps 4.15→**4.00**, with-Ctrl end stays **4.15** raw.
- Delete: selected-only guard (unselected Delete = no-op), removes range + undo; **Delete mid-grip-drag cancels the drag (no re-commit on release)** — live effect [e,y] mirrored.
- Escape exits tool (form-element gated: typing in an input keeps the tool on); outside-pointerdown deselects.
- Undo: gesture-by-gesture (draw/grip/slide/delete each = 1 entry); undo×2 restores [4,6.83]; saveScene→loadScene round-trip keeps show.range; filmedARange/takeSpan exact.
- Duplicate P3s: ghost in SOURCE lane on alt-pointerdown (before 3px threshold, own position/width); cross-lane (walker→walker2) ghost in TARGET lane at magnet-snapped 4.000 + **guides [4.00,8.00] in SOURCE lane** + dup-target class; incompatible lane (clip→camera) renders NOTHING (live se() gate) — verified identical.
- Gizmo: attach → one-sided shafts/cones exact colors, discs (XY blue/YZ red/XZ green .6), centre sphere+shell, rotate 3 half-tori+E+XYZE, scale boxes; **negative-axis pickers dropped** (bbox test, none remaining); hover X → **#ffd166** (bzr), leave → axis color restored; native-mouse X-drag commits +1.838 (1 undo). 3-mode VLM PASS (box tips pixel-verified vs cones).
- **P0 found in review: trim handler referenced undefined `up`** — addEventListener('pointerup', undefined) no-op'd → gesture never ended (no undo push, interaction='trim' leak, timeline freeze). Fixed via single `finish`; 5-move trim = 1 undo entry (re-verified).
- WASD control-mode gate (live ne()): default moves 2m/s-equiv, unreal mode 0 (unreal WASD = pointer-locked free-look, not ported).
- Ruler last-tick label no longer clipped (ruler/lanes width +gutter).
- Regression: block drag reorder (dance→0.9 ⇒ dance@0, walk repacked @4, transform@6), diamond no-move click selects+seeks (startS+tS), playback advances, undo/redo round-trip, lasso one-shot, navball 4m drive, lane-heads clickable above tr-overlay when scrolled (z7>z5). Zero page errors (fresh session).
- VLM final showcase: 3/3 real findings cleared — humanoid orange = live Phe #f29a5c (prompt misdescribed), chip dark = unverifiable live CSS (design choice), round ball = icosahedron fills 67px pad (round-3 verified).
### Round 3 (2026-11-15)
- Timeline solver: reorder drag dance→desired 6.47 (overlap) → kGt insertion toIndex 1 + lje pack → [walk@0, dance@8.47, transform@12.47] exact; free move dance→desired 21.14 **magnet-snapped to 20.944** (transform end marker, guide rendered at px 1257); alt-drag path Alpha→Beta lane: ghost + snap to 4.47 + duplicate committed (speed preserved); path→camera lane refused (Art same-domain gate, no ghost).
- Trim: dance +2s drag → durationS 6.0 w/ live width; walk +2s → speed 0.3455 = arc(2.236)/6.472 exact (speed=arc/dur).
- Diamonds: click tS 2 → seek 14.472 (12.472+2) + seg {tS:2} **survives the block click** (stopPropagation, real click event tested); drag tS 2→3 keys [0,3,4]; clamp tS 0→+3.33 stops at 2.99 (B2r neighbor −0.01); active/selected classes verified.
- Trim undo: 5-move drag = **1 undo entry** (gesture depth-counting); duration clamps 500→120, 0.01→0.1 (Ije/QZt).
- add-menu: addItem at 0.5 w/ obstacles [0,4],[6,126] → placed in the free gap **[4,6)** (W5r appendPlace nearest-candidate).
- Lasso: tight rect 480-530×240-280 → [Walker, Podium] (OrbitCam excluded, outside); 6.4px drag stays in lasso (no select); Esc exits; orbit disabled during, restored after.
- Nav ball: pad drag (971,134→195) stick forward −0.99997 at rim; camera −2m along view axis exact (driveTick 0.5s manual [7.11,5.74,9.49]→[8.23,6.49,10.97]); roll: 0.9rad orbit → pad region 20.2% pixel change; pixel palette = white icosa facets + frosted backdrop.
- Regression: playback moves walker; moveItem → 1 undo; undo restores; lasso toggle; navTick. Final VLM: 6/6 ACCEPT (playhead-through-gold-diamond pixel-exact).
### Round 2 (2026-11-14)
- Finish composer: day clay+SSAO VLM PASS (contact + crease AO, uniform clay, no artifacts); night lantern glow pixel-verified at mathematically projected screen pos (255,210,164); stroke ring VLM-confirmed (white silhouette loop); auto-measure 99ms software cost → disabled + persisted {enabled:false,source:"auto"}.
- Clay props 21/21; primitives: soft-terminator defines, name colors, big-swap (scale 30), glow flags all verified.
- sqrt-chordal mT: painted uneven anchors → middle out [1.149,0,0.456] = hand-computed sqrt metric (plain-chordal would be [1.028,0,0.43]).
- Q base-TRS: rotate item on cube at [3,0,2] → stays at [3,0,2], rotY −2.642 (GA-unwrapped 3.642 vs base .5); after finish → base restored.
- ne(): prop path mid-point [4.5,0,2] exact.
- Commit: walking humanoid drag → commits (kZt, no refusal); keyed camera (cam-transform segment) → key tS 1.5 [5,2,5] focal 35; undo restores objects+show.
- Multi-select: parents captured and restored.
- Stop-at-end: position restored to stored TRS exactly.
- v4 migration: shot-less camera → focal 50 + cam-still track (u6r exact).
### Round 1 (2026-11-13)
- Synthetic scene: humanoid path walk @t2.5 pos [3.352, 0, 1.003], rotY −1.88 (tangent), clip 'walk'.
- Real scene 27b98b6b: 7 objects + cam-move track; daylight presets hand-verified vs table math.
- Framing (camera mode): e=1, n=1.88, mh=.368, r=5.10, wf=19.6% — exact o2r; fov adopt 56.2°.
- Path paint: 4 anchors, tangent out[0] = [0.67, 0, 0.33], duration 6.44s.
- Undo/redo, prop picker, autosave cross-reload — pass.
