# FIDELITY — reconstruction vs live flick.art 3D Stage

How exactly the local editor (`editor/`) reproduces the live app, subsystem by subsystem.
Ground truth: `analysis/{ENVIRONMENT,TRACK_SYSTEM,HUMANOID,EDITOR_UX}.md` (extracted from live bundle
`index-DBE17t4T.js`, 2026-11-13) + `analysis/DOM_REFERENCE.md` (saved DOMs).

Legend: **EXACT** = byte/port-exact from bundle (values verified in headless round-trip) ·
**PORT** = faithful port of extracted code, minor adaptations · **APPROX** = documented approximation ·
**SKIP** = consciously not implemented (DESIGN D11).

## Rendering environment (P1)
| Subsystem | Status | Verification |
|---|---|---|
| WebGLRenderer (antialias, PCFShadowMap, dpr≤2, `.ph-viewport-capture`) | EXACT | `COr`/`fZt` port; r182 PCFSoft→PCF deprecation honored |
| Editor camera 50/.1/500 @ (6,5,8) → origin, orbit target (0,1,0) | EXACT | DOM-verified start pose |
| Sky dome shader (xyww far-plane, pow .55 mix, flare pow 7 · smoothstep .06) | EXACT | `xOr/yOr/vOr` verbatim GLSL incl. comments; `fog:false` |
| Daylight table HY 7 stops + DFr full-day | EXACT | decimals byte-exact; browser round-trip: el 57.38 → zenith #dfe5f0, sun 2.15, hemi 1.7; el −28 → sunI 0.5143, hemi 0.5429 (hand-verified lerp), sky #060a17 |
| applyDaylight (hemi/sun/fog/sky uniforms, memo by az+el, glow return) | EXACT | `wOr` port; fog color = horizon verified |
| Sun direction + elevation remap (el>−8 ? max(el,5) : 25−el) | EXACT | el −28 → dir (28,48,23)@60 — hand-verified = sin/cos of 53° |
| Floor PlaneGeometry(80000², 128²) 0xD4D5D9 rough .9 polygonOffset + raycast proxy | EXACT | `wOr` port |
| Dynamic fog/near/far (pZt: bounds 400ms, density .715/max(120,1.5r,3n), far, near, hysteresis 1.1) | EXACT | `FFr/SFr/CFr/vje/OFr` port |
| Shadow fit (fingerprint, spread90×1.15, casterBox branch, w extent 16-snap, kOr texel snap, bias/normalBias) | EXACT | `TOr` port; casters = humanoid+figure only (bundle-verified) |
| Planning-aids overlay pass (layer 1, clearDepth, autoClear=false) | PORT | audit F1/F17 order honored |
| Silhouette stroke ring (hGr 1.5px + halo) | SKIP (P2 backlog) | footprint + hover disc cover selection visuals |
| Finish composer (SSAO/edges) | SKIP | live auto-enables on fast GPUs; documented divergence |

## Time-of-day UI (P1)
| Sun puck (centre=zenith, rim=−30°, r=(90−el)/120, view-yaw relative), presets (Midday 128.66/57.38, Golden 9°, Dusk −4°, Night −28°), az/el numeric fields | PORT | presets verified live in headless (values above) |

## Scene data (v10)
| Loader (raw or {row,scene}), full v1→v10 migration chain, prt normalizers (speed clamps, pace/heightCurve validation, dangling subjectId, light SDe, spotlight nGt) | PORT | `f6r/prt` chain from TRACK §9; synthetic + 4 real scenes load |
| Save (packItems lje sequential bumping, undefined strip) | PORT | round-trip verified (path item preserved: speed 1.4, 4 anchors, gait walk) |
| recordAspect table (6 values incl. 1.85:1) | EXACT | `Zae` |

## Objects (P1)
| simple_figure (BOX body PP, head sphere, spherical visor zone 72°/−6..14°, band plane, #f29a5c + luma-contrast mark, headRotation pivot) | EXACT | `Zqt` port incl. aqt contrast rule (inverted vs my first attempt — bundle-verified) |
| Humanoid (GLB, scale computed 1.75/bind-height ≈ .956964, XZ-centre, feet minY, M_Main orange, M_Joints purple, wrapper group, crossfade .25s, wall-clock clip wrap) | EXACT | `Hhe/$Nr/Sot` port; 46 clips verified identical to GLB |
| Camera object (GLB camera-DV-hMEYk + frustum wireframe sub-object, fov from focal, distance 3) | PORT | marker via `urt` semantics; GLB vendored from live CDN |
| Target (octahedron marker #dd4466) | APPROX | geometry unextracted (EDITOR_UX §13.5) |
| Spotlight (SpotLight shadow 1024²/near .2/far 60/bias −4e-4/normalBias .02, diffusion cookie 128² 10-step, beam cone 7m 0xFFE3A3 additive, lamp 1/scale counter-scale, intensity ×2.4) | PORT | `sOr/iOr/oOr`; shadow budget e6r simplified to first-come |
| Props (1426 GLB via catalog scale+yawDeg on wrapper; 13 procedural as dims boxes) | PORT | cat/chest verified; procedural = APPROX (bundle builders unextracted) |
| Hierarchy (parentId groups, group delete re-parents), labels (canvas sprites y=1.75+.25), hi-poly swap ≥24 | PORT | `AWr.N` port |

## Selection + manipulation (P1)
| Footprint shader (rounded-rect SDF, 3px line, shade .22, ripple wash 1s cubic, fade 160ms, pad, corner .45, max 32, deselect 500ms) | EXACT | `pGr/cGr/dGr` GLSL verbatim |
| Foot computation (rotated child bboxes ∪ skinned bone positions, kind traversal filters) | PORT | `lGr` |
| Hover disc (90ms ease, 20px, face-normal oriented, cursor none over pickables) | PORT | `CGr` |
| Click selection (slop 8px, group promotion, alt raw, ⌘/ctrl multi, dblclick focus .3s ease-in-out-cubic, empty deselect) | PORT | `ua/JEe/YUr` |
| TransformControls (r182 getHelper, axis colors, translate/rotate/scale, forced translate when track-driven, camera scale→translate) | PORT | gizmo restyle = axis tint only (stock geometry) |
| Wheel zoom (exp(.0036·δ), clamp [.5, 2r] floor 500) + nav classification (ctrl/deltaMode/120-multiples → zoom; trackpad → orbit/pan) | PORT | `Vzr` heuristics approximated |
| WASD fly 4 m/s ×3 shift, Q/E vertical, floor clamp y≥.1, maxPolarAngle recompute | PORT | |
| Commit pipeline (drive refusal toast, camera+target pairing, rotation unwrap) | PORT | `SZt` minimal set (keyed-camera capture + cam-move rebase = backlog) |
| Lasso, multi-select centroid group, alt-drag duplicate | PARTIAL | multi via temporary group; lasso SKIP (backlog) |

## Track system (P2)
| Curve subsystem (mT chordal Catmull-Rom tangents, nx 12-sample beziers w/ WeakMap, MR arc, oq point-at-distance, Yae tangent) | EXACT | painted anchors: out[0]=[0.67,0,0.33] hand-verified = (next−cur)/|·|·f/3; duration 6.44 = arc 9.02/1.4 |
| Character eval eEe (path active/finished, play chaining offset, clip fallback, lookAt $tt, yaw ztt) | EXACT | pos @t2.5 = [3.352,0,1.003] on curve |
| Ground snap (probe +1.2, step .5, τ .22 exp, instant on backward seek), yaw turn 8 rad/s, parents+world→local | EXACT | `ue` port (instant on poseNow) |
| Gaze split xM (head ≤±70°/±35°, body remainder, eye 1.6·scale.y, subject .7·height/.5 spotlight) + DEF-neck .4/DEF-head .6 rig offsets | PORT | `xM/jZt` port |
| cam-move KCe (orbit/spiral radius const, dollies dist×(1→ds), dolly_zoom fov atan formula clamp 10..120, crane ±dh, pan_sweep Y-rotate, smoothstep eDe, orientation-correction slerp qStart⁻¹·qPrev→identity) | EXACT | port incl. pFr 1m-ahead target for pan_sweep |
| cam-path (anchors + heightCurve ZA bezier binary-search + pace khe) + travel look-ahead 5m | EXACT | `ZA/khe/rye` port |
| cam-manual 20Hz nearest sample (no interp), cam-follow offset capture + .45s blend, cam-transform slerp+focal | EXACT | `fFr` port |
| transform keys Bzt (plain lerp, no angle wrap — continuity at write time), rig-transform Vzt (shortest-angle per axis) + T2r latest-wins | EXACT | |
| Item kinds: 12 + rotate/revolve/scale (14 total) | PORT | `evalObjectItems` Q port |
| Playback controller (clocks, stop→reset-to-base, at-rest rig t=0) | PORT | simplified clock (no take/recording clocks) |
| Play-mode WASD recorder, cam-manual flight recorder, flight→cam-path conversion | SKIP | D11 |
| Shake rigs (subtle/medium/heavy/stride, camera rigs tripod..drone) | SKIP (constants extracted in const.js for future) | |

## Path editing (P2)
| Paint mode (click walkableSurfaces → append; nearest-segment <0.4m XZ → insert; seed at object pos; flown keep Y via anchorPosFor) | PORT | anchor drag/height/tangent handle drags ported |
| Visuals (anchor .09 sphere ×1.4 sel white, number sprites +.35, tangent 0x66ddff XZ-plane alt-break mirror, height handle amber ladder .3+h·.55, curve +.02y violet 0xaa55ff, 64-sample heightCurve display) | PORT | `UGr.y` |
| cam-path heightCurve editor (curve UI in scene-node panel) | SKIP (backlog) | curve DATA eval + display supported |

## UI shell
| Layout (top bar, stage header, workspace + right dock, timeline footer, camera pills, height/lens footer) | PORT | DOM_REFERENCE-derived; vanilla DOM |
| Timeline (ruler ticks [0.5..60]≥80px, seek drag, ctrl+wheel zoom ≥60px/s anchored, lanes, blocks w/ kind colors+labels, drag move, trim → speed=arc/dur, segment inspector per kind, playhead) | PORT | trim/magnet 12px simplified (no obstacle push) |
| Inspector (per-kind fields incl. spotlight/camera/animation), Add palette (9 kinds + props picker 1439 searchable w/ categories), hierarchy, selection toolbar (move/rotate/scale/delete at screen bounds) | PORT | |
| Keyboard (⌘Z/⇧⌘Z/⌘Y, ⌘C/⌘V, ⌘G, Del, Esc/Enter finish paint, F focus, Z/X/C tools) | PORT | |
| Autosave (1s debounce, QuotaExceeded-safe, restore on load) | PORT | round-trip verified |
| 2D plan canvas, nav ball, PIP window, recording/takes, multi-scene tabs, chat | SKIP | D11 |

## Runtime verification log (headless Chrome, 2026-11-13)
- Synthetic scene: humanoid path walk @t2.5 pos [3.352, 0, 1.003], rotY −1.88 (tangent), clip 'walk'; playback advances (t 2.08→4.26, actionTime advancing).
- Real scene 27b98b6b: 7 objects (4 props incl GLB chest + 3 procedural, humanoid idle at rest, simple_figure, camera) + cam-move track; dungeon props grounded w/ contact shadows (VLM QA PASS).
- Light presets: night −28° → sky #060a17 / horizon+fog #121a2f / sun .514 / hemi .543 / sun-dir (28,48,23); midday → #dfe5f0 / 2.15. All hand-verified vs table math.
- Framing (camera mode, 1016×304 viewport): e=1, n=1.88, mh=.368, r=5.10, wf=19.6% — exact o2r; fov adopt 56.2°.
- Path paint: 4 anchors, tangent out[0] = [0.67, 0, 0.33] (exact mT), duration 6.44s.
- Undo/redo, prop picker (cat), autosave cross-reload restore — all pass.
- Screenshots: `docs/screenshots/editor_playback.png`, `editor_midwalk.png` (VLM QA PASS), `editor_real_scene.png` (VLM QA PASS-conditional: procedural props are white boxes = documented APPROX).
