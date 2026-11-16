# Round 6 design decisions (for audit)

## D — Lighting / time-of-day system redesign

### State model (extends app.light; schema show.light v11)
```js
light = {
  mode: 'geographic' | 'custom',        // D3: which side owns az/el
  azimuthDeg, elevationDeg,             // ALWAYS present; geographic = derived, custom = hand-set
  geo: {
    timeOfDay: 9.5,                     // hours 0..24, 0.25 steps (local solar time — stated in UI)
    dayOfYear: 166,                     // 1..365 (seasonality; edited via month/day + 4 solstice/equinox presets)
    latitudeDeg: 45,                    // -90..90 (default 45 = north hemisphere mid-latitude)
    altitudeM: 300,                     // 0..4000 (affects extinction only, mild)
    northOffsetDeg: 0,                  // -180..180 — rotation of the scene grid vs true north (0 = -Z is true north, +X east)
  },
  weather: 'clear' | 'cloudy' | 'overcast' | 'rain' | 'fog',   // D5
  indoor: false,                        // D7
  ambientLevel: 0.35,                   // 0..1 indoor indirect base (D7)
  nightLights: true,                    // existing
}
```

### Solar solver (NOAA SPA, ~0.1° accuracy — standard published equations, no invention)
- fractional year: γ = 2π/365 · (N − 1 + (h−12)/24), N=dayOfYear, h=hours
- eqtime (minutes) = 229.18·(0.000075 + 0.001868 cosγ − 0.032077 sinγ − 0.014615 cos2γ − 0.040849 sin2γ)
- declination δ = 0.006918 − 0.399912 cosγ + 0.070257 sinγ − 0.006758 cos2γ + 0.000907 sin2γ − 0.002697 cos3γ + 0.00148 sin3γ (radians)
- We assume the entered clock = LOCAL SOLAR TIME (no timezone/longitude correction; stated in the panel hint) → hour angle H = 15°·(h − 12) + 0 (eqtime unused for solar time; keep for completeness = 0 correction) — SIMPLIFICATION, documented.
- elevation: sin(el) = sin(lat)·sin(δ) + cos(lat)·cos(δ)·cos(H); el° = asin(..)·180/π
- azimuth (compass, clockwise from north): if H < 0 (morning): az = atan2(sinH·cosδ, cosH·sinδ·coslat − sinδ·sinlat)... standard: use the atan2 form that yields N=0,E=90; both hemispheres via the sin/cos formulas (works for negative lat too)
- scene az = solar az + northOffsetDeg (mod 360)
- clamp el to [−30, 90] (ELEV bounds, existing normalizeLight) — solver may produce below −30 at high latitudes in winter night; clamp + the table already handles.
- Elevation feeding the EXISTING daylight system unchanged (DAYLIGHT_STOPS keyed on elevation — verified byte-exact vs bundle). Time-of-day → el → sky/hemi/sun colors + intensities. Elegant: no new color math.

### Weather (D5) — post-table modifiers in applyDaylight (must re-run when weather changes: the az/el early-return key gains weather+indoor+ambient in its change detection)
- clear: sun ×1.0, hemi ×1.0, fog ×0.6
- cloudy: sun ×0.55, hemi ×1.15, fog ×0.8, sky desat 10% toward gray
- overcast: sun ×0.25, hemi ×1.3, fog ×1.0, sky desat 25%
- rain: sun ×0.15, hemi ×1.2, fog ×2.0, sky darkens 15% + desat 30%
- fog: sun ×0.3, hemi ×1.1, fog ×4.0, sky lerps 60% toward fog color
- desat = lerp(color, luma(color), k); darken = multiplyScalar(1−k). Fog density multiplier applies to the pZt-computed density (clamped to its existing caps).

### Indoor (D7)
- indoor=true: sun intensity → 0 (ball/position still set — harmless), hemi fill ×1.2, ADD AmbientLight(0xfff4e6, 0.35·ambientLevel) (warm-neutral bounce floor, exists in env, intensity 0 when indoor=false), fog ×0.5. Theory: hemisphere = sky-dome + ground-bounce GI approximation; ambient = uniform indirect base (indoor scenes have no directional sky contribution); sun = key light.
- ambientLevel slider 0..1 shown only when indoor (default 0.35).

### Mode switching (D3)
- Any geo field edit → recompute → mode='geographic'; knob/puck drag → mode='custom' (az/el hand-set, geo fields RETAIN values — shown dimmed with a "Custom" chip; editing any geo field re-runs the solver → back to geographic).
- 4 phase presets (live-exact: elevation-only 57.38/9/−4/−28, az preserved) — these set el directly → mode='custom' (same as a knob drag).
- The ball (puck+knob) always visible. View-yaw rotation + phase labels + arrow keys (live TQr/AQr spec from R3) ported in the same pass.

### UI (Light popover → panel ~300px, scrollable)
Puck (viewYaw-rotated) + phase label + geo/custom chip / time input (hh:mm + 0.25 steps) / date: [Mar 21, Jun 21, Sep 21, Dec 21 presets + month+day inputs] / latitude ° / altitude m / true-north ° / weather segmented (5) / indoor toggle + ambient slider / 4 phase presets / night-lights switch. Every change wrapped in ONE beginEditGesture/endEditGesture per drag (undo-able as one entry; change-detection keyed on the full light object).

## B5 — Shade modes (beyond original; user-mandated)
Segmented control in viewport overlay (bottom-left, near cam pills) — NOT the stage header (header is for view/mode): Shaded | Flat | Wireframe.
- Shaded: default.
- Flat: material.flatShading = true on all scene materials (needsUpdate) — faceted look, still lit+shadowed.
- Wireframe: material.wireframe = true on all Mesh materials (floor keeps solid, darkened? No — floor too, minus aids/planning layers).
- Implementation: a renderMode walker (like the shadow walk) toggling flags; planning aids, gizmo, navball, stroke excluded. Page pref, persisted in show/page like finish.

## B6 — Snap + ground grid (beyond original; user-mandated; plan-canvas constants as spec source)
- Toggle button in right toolbar (magnet-grid icon) + state in page. ON → gizmo translationSnap=0.25m (Vie), rotationSnap=15° (Yat), scaleSnap=0.1; Shift held during drag = momentary bypass (inverse of the toggle).
- Ground grid: LineSegments at y=0.002, 1m minor (alpha .12) + 5m major (alpha .3), span ±24m, fog:true (fades into distance), polygonOffset −4; visible whenever snap is ON (and a separate small "grid" toggle? NO — one control: snap ON shows grid; user asked "allow a grid view on the ground especially" in the snap context — coupled is cleaner).
- Add-object placement snaps to the grid when ON (spawn position rounds to 0.25m; the 5×6 spawn grid (V2e/rMr/nL=1.5) is a separate fix — spawn grid positions themselves snap to 1.5m lattice which is grid-compatible).

## A — Animation editing UX (live-exact per R2)
- A1: humanoid object inspector: REMOVE Clip/Playing dropdowns + add-action buttons (port inventions). Add: person-kind toggle (Figure|Human) single-person, color row (colorable kinds), drivenBy hint (while item-driven at playhead), authored-value ghosting (defer — P3). Camera object inspector keeps focal/aspect/shake (aspect select = 6 presets — fills the P1 aspect-picker backlog item).
- A3: segment editor moves from `#segInspector` (below timeline) INTO the right dock Properties panel as a titled "Action" section (film-icon h3, kindRow with character name, live field set incl. searchable 46-clip select for clip items, keyframe cluster ◀◆▶, per-move conditional fields, Remove action footer). Closes on: click empty lane area / select any object / Remove action / Esc. tl-inspector div deleted.
- A2: "+ Track" → live rCr dropdown (search input, options = objects without tracks — ALL Xzt kinds incl. groups, minus paired targets; disabled when none). lane-add "+" → keep contextual menu but live-upgraded: per-owner-kind action list (46 clips searchable for the clip entry — a submenu; simpler: after picking "Clip", the Action section opens with the clip select focused), new item becomes selectedSegment + Action section opens + scrolls into view.

## E1 — layout
Right dock = TWO stacked panels with distinct headers (user: "two panels, top down"): [Properties] (object section + action section, contextual) on top; [Scene] below = Add grid (compact 2-col) + hierarchy (with group chevron collapse). No tabs (keeps both visible; "top down" honored literally). Add grid moves INTO the Scene panel (today it's a separate panel between Properties and Objects).

## E2 — remove Default/Unreal modeSwitch entirely (controlMode stays 'default').

## B4 — group editor (live-exact per R2)
- groupOrUngroup: ≥2 → filter groupable (non-group, parentId undefined); <2 groupable → error toast; partial → warning toast; group at child centroid, rot 0 scale 1; children re-based (local = world ∘ inverse(group)) via pie-equivalent (plain matrix math); selection=[gid].
- single group selected → ungroup: children world back (VWt), parentId stripped, delete group, selection=children.
- remove(): group → recursive subtree delete (children, nested, cameras take paired targets); paired targets refuse standalone deletion.
- promotion: add camera/target/spotlight never-promote gate (existing rule otherwise correct).
- hierarchy: group chevron collapse (visual only), children indent; group rows can own tracks (+Track candidates include groups; Move actions apply to group).

## B1/B2/B3 — viewport polish
- B1: delete SelectionFootprints usage (class stays for hover disc? NO — hover disc is separate class HoverDisc; footprints class + tick + pGr removed from main; SEL_TOOLBAR_PAD recalc → use object screen bounds only).
- B2: applyCustomGizmo: REMOVE stock helper/axis/delta lines (found: children of TransformControlsGizmo named AXIS/DELTA/X/Y/Z); wire hover amber (bzr #FFD166) on custom meshes — poll tc.axis per frame (or wrap the internal pointerHover) and recolor affected handle meshes + restore on out. (User offered remove-or-thin; remove chosen — the custom shafts already communicate the axis.)
- B3: toolbar: rgba(panel,.72) + backdrop-filter blur(8px), padding 2px, gap 1px, buttons padding 4px 7px, flat monochrome SVG icons (16px, 1.5 stroke, currentColor) replacing unicode glyphs (✥⟳⤢🗑 → 4 inline SVGs: move-cross, rotate-cw, maximize-corner, trash), color: text-dim → text on hover, active = text + bg rgba(255,255,255,.08) — NO accent colors. Delete separated by hairline divider.
