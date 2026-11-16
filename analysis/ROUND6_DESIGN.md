# Round 6 design decisions — REVISED after audit (P0/P1 fixes applied)

## D — Lighting / time-of-day system redesign

### State model (scene.light; SCHEMA_V 10→11; env.normalizeLight + schema.normLight BOTH extended to pass through: mode enum, geo{timeOfDay 0-24, dayOfYear 1-365, latitudeDeg ±90, altitudeM 0-4000, northOffsetDeg ±180}, weather enum, indoor bool, ambientLevel 0-1; clamps per field. Migrated/new scenes default: mode:'custom' (preserves existing az/el — geographic would re-light every existing scene), weather:'clear', indoor:false, ambientLevel:0.35, geo defaults {9.5, 166, 45, 300, 0}.)
```js
light = { mode:'geographic'|'custom', azimuthDeg, elevationDeg,
  geo:{timeOfDay, dayOfYear, latitudeDeg, altitudeM, northOffsetDeg},
  weather:'clear'|'cloudy'|'overcast'|'rain'|'fog', indoor:false, ambientLevel:0.35, nightLights:true }
```

### Solar solver (Spencer 1971 / NOAA solar worksheet — cite as such, NOT "SPA")
- γ = 2π/365·(N−1+(h−12)/24); declination δ (Spencer coefficients, radians) — as drafted, correct.
- Local SOLAR time assumed (no eqtime/longitude correction) — hint in panel quantifies: "≈ civil time ± ~30 min". eqtime computed but unused (documented hook for future civil-time mode).
- H = 15°·(h−12). Elevation: sin(el) = sin(lat)sin(δ)+cos(lat)cos(δ)cos(H) (works for negative lat).
- **Azimuth (branch-free, atan2 of the sun vector's East/North components — finite at zenith, correct at poles):**
```js
function solarAzimuthDeg(H, dec, lat) {        // degrees in/out; N=0, E=90 clockwise
  const h=H*DEG, d=dec*DEG, p=lat*DEG;
  const east  = -Math.cos(d)*Math.sin(h);
  const north =  Math.sin(d)*Math.cos(p) - Math.cos(d)*Math.cos(h)*Math.sin(p);
  return (Math.atan2(east, north)*180/Math.PI + 360) % 360;
}
```
- Unit tests to encode: lat45/δ0: 06:00→90(E), 12:00→180(S), 18:00→270(W); lat−45/δ0 noon→0(N); lat0/δ23.44 noon→0 (sun north of zenith); polar night el<−30 pre-clamp → panel hint "sun below horizon all day"; az at exact zenith = atan2(0,0)=0 (harmless, noted).
- northOffsetDeg DEFINITION: compass bearing of the scene's −Z axis (0 = −Z is true north, +X east — matches existing sunDirection mapping). Conversion: **az_scene = (az_true − northOffsetDeg) mod 360**. Worked example: scene −Z points east (offset 90) → sun due true-north (az_true 0) must land at scene az 270. (Sign corrected from draft.)
- el clamped to [−30, 90] post-solve (existing ELEV bounds); el<−30 pre-clamp → hint.
- altitudeM: **sun.intensity ×= 1 + min(altitudeM,4000)/4000 × 0.06** (air-mass thinning, capped — real physics, mild by design). Position unaffected (horizon dip at 4km ≈ 0.6° — ignored).
- Feb 29 unrepresentable (dayOfYear 1..365) — one-liner documented.

### Weather (D5) — clear = IDENTITY (all ×1.0, desat 0, darken 0); ladder re-scaled: cloudy 1.15 / overcast 1.4 / rain 2.0 / fog 3.5 (fog multipliers on FOG base; the draft's relative sun/hemi spreads kept: cloudy sun .55, overcast .25, rain .15, fog .3)
- Applies INSIDE the daylight application to: sun.intensity ×k_sun, hemi.intensity ×k_hemi, **sky flare uniform ×k_flare (overcast/rain ≈ .1, fog 0)**, fog COLOR; desat (lerp toward luma, Rec.601 .299/.587/.114, linear-sRGB working space — documented) applies to zenith+horizon+fillSky+**fog color**; darken multiplies sky zenith/horizon (rain .85).
- **Fog DENSITY multiplier lives INSIDE createFogNearFar.tick: d = min(FOG_DENSITY_CAP=.05, fogDensity(bounds,cam) × weatherK × (indoor? .5 : 1)); scene.fog.density = d; far = min(FOG_FAR_CAP, max(far_geom, C.FOG_DENSITY_K / d))** — preserves density↔far coupling. New const FOG_DENSITY_CAP. applyDaylight keeps only fog COLOR.
- Composition order: d = base × weatherK × (indoor ? 0.5 : 1) — product, single definition.
- fog-day sun ×0.3 is artistic (label it so), not physical.

### Indoor (D7)
- indoor=true: sun.intensity → 0 AND **sun.visible=false** (saves the 3072² shadow pass); hemi fill ×1.2; **AmbientLight(0xfff4e6) added to createEnvironment (intensity 0 when indoor=false), indoor intensity = ambientLevel (SINGLE scale — no double attenuation; default 0.35)**; fog ×0.5 (in the product above). Non-indoor night unchanged (live keeps sun .55 at el −30).
- Fixed warm ambient (NOT sky-tracking) — window sky-light already carried by hemisphere; avoids blue-tinted indoor ambient by day.

### Mode switching (D3)
- Any geo edit → recompute → mode='geographic'; knob/puck drag → mode='custom'; geo fields RETAIN values (dimmed + "Custom" chip). **Ghost knob**: in custom mode, a faint second knob renders on the puck at the solar solver's position (from current geo params) — bridges "time says 09:30 but sun is elsewhere".
- 4 phase presets = live-exact: **elevation-only, azimuth PRESERVED** (fix current set() bug that forces az=128.66; C.LIGHT_PRESETS az fields ignored). Presets enter custom mode (like a knob drag).
- Undo: one gesture per pointer-drag (sliders pointerdown→up), one per input commit, one per discrete flip, one per preset. Change-detection keys on the full light object (az/el/weather/indoor/ambient all participate in the applyDaylight early-return key).

### UI (Light popover → panel ~300px, scrollable)
Puck (viewYaw-rotated, live TQr/AQr spec: arrow keys az ±10°/el ±5°, phase labels kQr thresholds, knob inset 50%−8px, gliding CSS transition) + geo/custom chip + ghost knob + time hh:mm + date (Mar 21/Jun 21/Sep 21/Dec 21 presets + month+day) + latitude + altitude + true-north + weather segmented + indoor + ambient slider (when indoor) + 4 phase presets (elevation-only) + night-lights switch + live az/el readout + "sun below horizon all day" hint when solver el < −30 pre-clamp.

## D6 — quick GI / sky-light (scoped)
- Hemisphere = sky-dome GI approximation (sky color above / ground bounce below) — already the architecture; D6 = coupling refinements: hemi.intensity/color now also weather/indoor-coupled (above); sky zenith/horizon drive fog color (existing) + flare (existing) — with weather modulation.
- SSAO (finish composer hKt) exists for TAKES; add nothing new in the editor viewport this round (declared; a full-viewport AO pass would need a second composer — deferred with rationale: previz clarity beats ambient occlusion in the edit view; takes carry the AO).

## C — top-down plan canvas (scoped — full R1 spec in analysis/tmp_plan/ + ROUND6 research)
- viewportMode segmented "3D | 2D" (page store, persisted; live i8r/s7ndfi); planShown = mode edit && !playing && viewportMode==='plan'.
- PlanView canvas replaces the 3D host (host hidden, kept mounted); frame loop keeps ALL ticks (rig/playback/livePose) but skips WebGL render + navball (only updateMatrixWorld) — meshes keep moving; shownPose mirrors playback.
- Painter SDr exact (R1 §4 pass order + constants); items() projection (R1 §3) with shownPose = mesh world TRS (+fovDeg cameras, +headRotation figures); paths from track items (R1 §3 paths).
- Interactions (R1 §6): click select (parentId??id promotion — simpler than JEe), shift toggle, marquee, move drag (Shift snap .25m), rotate handle (Shift 15°), lens handles (cameras, snap yT), wheel zoom (14–170 pxPerM, default 34) + middle/right pan, zoom-fit + % display, centerOn 320ms cubic-out, edge indicators + goToCamera, auto-pan deadzone.
- Draw-direction (R1 §7): pill (draw/update/drawing states + match-speed checkbox + person-kind toggle), stroke lifecycle with performance rewind+play, vHr simplification, replaceMoveFromSamples (cam-path aim subject/locked), Esc chain (stroke→no-op; drawing→exit; selection→deselect), focus tap-or-draw, focus tip, stroke timer.
- Height-curve editor (R1 §8) for cam-path selection: SVG ruler scrub + point drag (u clamp, .1 height rounding, Alt handle-break) + dblclick remove + value bubble.
- Group boxes/labels, spotlight pools, camera wedges (fovDeg from focal+aspect), humanoid stick figures + figure body/head arcs, marquee, callout, focus overlay, edge indicators — all per R1 §4.
- CSS vars --plan-* (14) defined in app.css.

## B5 — shade modes
Segmented (viewport overlay, bottom-left): Shaded | Flat | Wireframe.
- Flat: flatShading=true + needsUpdate on all scene PBR materials (one-time 100–300ms shader-recompile hitch — noted, not a hang).
- Wireframe: material.wireframe=true on all Mesh materials EXCEPT the floor (stays solid — 80000²/128² wireframe = moiré) and except planning aids/gizmo/stroke/navball.
- Walker (per-frame piggyback on the shadow walk) re-applies flags to NEW objects (objects subscription) — no per-object leaks across mode flips.

## B6 — snap + ground grid
- Toggle (right toolbar). ON: gizmo setTranslationSnap(0.25) [m], **setRotationSnap(Math.PI/12) [RADIAN API — unit test: π/12=15°]**, setScaleSnap(0.1); Shift during drag = momentary inverse of toggle.
- Grid: LineSegments at **y=0.01** (not 0.002 — depth precision), 1m minor alpha .12 + 5m major alpha .3, span ±24m, transparent, **depthWrite:false, renderOrder 1 above floor; NO polygonOffset (no-op for lines in three.js — dropped from draft)**, fog:true. Visible when snap ON.
- Add-object placement snaps to .25m when ON (spawn grid 5×6 @1.5m stays as the separate spawn fix — 1.5m lattice ⊂ .25m grid).

## A — animation editing UX (live-exact per R2)
- A1: REMOVE Clip/Playing + add-action buttons from object inspector (port inventions). ADD: person-kind toggle (single person), color row (colorable kinds: cube/sphere/cylinder/prop/humanoid/simple_figure/group; initial group swatch = first child color), drivenBy hint (item name while driven at playhead), camera extras incl. **Aspect ratio select (6 presets) in camera inspector — live wVr does place it there though it edits page.recordAspect (page-level state, as live does)**; spotlight extras unchanged.
- A3: segment editor → right Properties panel "Action" section (film-icon h3 + kindRow char name + live field set: searchable 46-clip select for clip, gait/aim/subject/speed for path, per-move conditionals for cam-move, keyframe cluster ◀◆▶, Remove action footer). Closes on: empty-lane click / select object / Remove action / Esc. `#segInspector` below-timeline div DELETED.
- **Keyframe diamonds (lane layer) — round-4 system verified intact post-repair; re-verify in E2E this round (audit P1-12): select+seek, drag-move with clamp, delete.**
- A2: "+ Track" → live rCr dropdown (search, options = objects without tracks — ALL animatable kinds incl. groups, minus paired targets; disabled state when none). lane-add "+" → per-owner-kind menu (46-clip searchable picker for the Clip entry via the Action section select); new item becomes selectedSegment → Action section opens + scrolls into view.

## E1 — layout
Right dock = TWO stacked panels, each with COLLAPSIBLE header (min-heights: Properties 120px, Scene 140px — live ore resizable-panel precedent): [Properties] object section + action section (contextual); [Scene] = Add grid (compact) + hierarchy (group chevron collapse). No tabs.

## E2 — remove Default/Unreal modeSwitch (controlMode stays 'default').

## B4 — group editor (live-exact)
- groupOrUngroup: ≥2 → groupable filter (non-group, parentId undefined); <2 groupable → error toast; partial skips → warning toast; group at child centroid, rot 0, scale 1; children re-based (local = world ∘ inv(group)); selection=[gid].
- single group selected → ungroup (children world back, parentId stripped, group deleted, selection=children).
- remove(): group → RECURSIVE subtree delete; camera delete takes paired target; **paired target standalone deletion REFUSES (live Xu — cite: R2 §4 verified)**.
- promotion: add never-promote gate for camera|target|spotlight (live _De) — rest of JEe rule already correct.
- hierarchy: group chevron collapse; children indent; groups join +Track candidates; Move actions apply to group (owner-kind semantics unchanged).

## B1/B2/B3 — viewport polish
- B1: SelectionFootprints removed (class + tick + SEL bounds pad recalc → object bounds only; HoverDisc stays).
- B2: applyCustomGizmo: remove stock helper/axis/delta lines (children named AXIS/DELTA/X/Y/Z under TransformControlsGizmo); hover amber #FFD166 wired to custom meshes via tc.axis poll each frame (stock materialLib can't reach them — they own materials); restore on out.
- B3: toolbar: rgba(panel,.72) + backdrop-filter blur(8px), padding 2px gap 1px, buttons 4px 7px, flat monochrome SVG icons (16px, 1.5 stroke, currentColor; move/rotate/scale/trash), text-dim → text on hover, active = text + bg rgba(255,255,255,.08) — NO color accents.
