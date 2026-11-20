# R20 — Light track on the timeline (ISSUE 3) + sun-position control ground truth (ISSUE 2)

**Ground-truth bundle**: `analysis/index-CaBu3A6T.js` (13,507,616 bytes, one-line minified).
All offsets below are byte offsets into that file. Verbatim excerpts are quoted with `«…»`
(elisions marked `…`). Note on names: the prior docs (`TRACK_SYSTEM.md`, `ENVIRONMENT.md`) were
written against the older `index-DBE17t4T.js` build; minified names reshuffle per build. The
name map for the families cited here (old → CaBu3A6T):

| old (DBE17t4T / prior docs) | CaBu3A6T | meaning |
|---|---|---|
| `TQr` (light popover) | `ots` @5884954 | LightControl component |
| `AQr` (puck) | `lts` @5886438 | sun-position puck component |
| `R8r` | `lSr` @4913088 | light+viewYaw → knob xy |
| `irt` | `Qrt` @4913205 | knob xy → light |
| `fq`/`QA` | `Rq=-30`/`oC=90` @4912331 | elevation clamp |
| `wQr` | `rts` @5884420ish | arrow-key deltas |
| `kQr` | `ats` @5884774 | elevation → phase label |
| `_Qr` | `sts` @5884575 | time presets |
| `$ye` | `pve=8` @5884432 | knob inset px |
| `xQr` | `nts=.5` | view-yaw adoption threshold |
| `HY` (daylight table) | `oQ` @5465244 (+`BDr` full-day @5465098) | 8-stop daylight LUT |
| `$Fr` | `UDr` @5466135 | daylight lerp |
| `wOr` | `kHr` @5470698 | environment ctor (sky dome + sun + floor + applyDaylight) |
| `TOr` (shadow-fit closure) | `CHr` @5472306 | per-frame daylight+shadow-fit+fingerprint closure |
| `AOr` | `EHr` @5474052 | shadowMap.needsUpdate generation bumper |
| `jGr` (performance controller) | `je` object inside `uKr` @5726966 (tick @~5735900) | clocks + tick |
| `ue` | `pe` @5733467 | per-frame characters eval |
| `L` | `O` @5728206 | per-frame object/camera-marker apply |
| `eEe` | `Y` @5730673 | object-items evaluator (rotate/revolve/scale/transform/path/play) |
| `Q` (fold eval part) | inside `Y` | — |
| `dZt`/`ce` | `NKt` @5461831 / `gDr` @5459322 | camera-at-time / per-item cam eval |
| `bP` | `LP` @3927448 | cam-move preset list |
| `_1` | `j1` @3927697 | cam-move default params table |
| `OHr` | `fUr` @5549965 | setCameraItemFields validator |
| — | `mUr` @5551703 | camera item factory |
| `eKt` | `eKt` @5318051 (same name!) | item → agent snake_case |
| `NMr`/agent `set_light` | `re` @5346300ish | set_light tool impl |

Our port's code comments reference the OLD names (`TQr/AQr`, `rCr`, `jGr/ue/L`, `olt/llt`) —
they are semantically the same code; the new build renamed them. (`rCr` in CaBu3A6T is an
unrelated timeline zoom-fit function @5168055; the port's "live rCr Add-track dropdown" name
comes from the live site build.)

---

# PART 1 — ISSUE 3: time-of-day as an animation track (light source on the timeline)

## 1.A Ground truth: the original has NO light/sun/time/environment track

**Verdict: NO.** Exhaustive enumeration of the original's track/item kinds (see §1.A.1–1.A.4)
shows no `light`, `sun`, `sky`, `env`, `time`, `weather`, `day`/`night` item kind, no keyframeable
light property anywhere on the timeline, and no day-night cycling feature anywhere in the stage
editor. The sun is a **scene-level singleton** (`show`-sibling `light` field, see §2.E), set
only by the light popover, the `set_light` agent tool, and scene load.

### 1.A.1 Item-kind sets (CaBu3A6T)

```
@4325275  new Set(["rotate","revolve","scale","transform","rig-transform"])   // object-animation kinds (old $2r)
@4325389  new Set(["cam-still","cam-move","cam-path","cam-follow","cam-transform","cam-manual"])  // camera kinds (old V2r)
@5075381  ["rotate","revolve","scale-up","scale-down","transform","rig-transform"]                // action palette (old YSr)
@5075475  ["still","path","follow","transform","manual",...LP]                                   // camera palette (old xie)
@3927448  const LP=["orbit","dolly_in","dolly_out","dolly_zoom","crane_up","crane_down","spiral","pan_sweep"]
```
Plus motion-source kinds `path`, `play`, `clip` and legacy `cam-rail` (migrated away, `@4919344`).
That is the complete kind universe: **14 current + 1 legacy** (identical to `TRACK_SYSTEM.md` §2,
which was verified for the previous build; re-verified by kind-literal scan for CaBu3A6T — every
`kind==="…"` / `kind:"…"` literal in the stage-editor range 4.32M–5.9M resolves to one of these;
the only "light"-ish kind is the OBJECT kind `spotlight`, and the only "time"-ish kind is the UI
kind `timeline`). No `light`/`sun`/`sky`/`env`/`weather`/`timeOfDay` kind exists.

### 1.A.2 Track ownership: every track is object-bound — no global lane

`addPerformanceTrack` (@5555531, class field of the performance store):

```js
addPerformanceTrack=e=>{const n=this.show.peek(),r=this.objects.peek();
  if(!uGt(r[e]?.kind)||Qu(r,e)||n.tracks.some(a=>a.characterId===e))return null;
  const s=sn();return this.show.set({...n,tracks:[...n.tracks,{id:s,characterId:e,items:[]}]}),s};
addTrackForObject=e=>{this.addPerformanceTrack(e)};
```

- `Track = {id, characterId, items[]}` — a track **must** reference an object id
  (`uGt` @4329083 = valid object-kind check; `Qu` = "used as aim target" check).
- The timeline lane list is exactly `show.tracks`; there is **no** non-object lane.
- The only show-level "global" timing concept is the **take range** — a *field*, not a track:

```js
show = { name, range?: {startS, endS}, tracks: [Track] }     // TRACK_SYSTEM.md §1.1, re-verified
@4329571 function Zhe(show,totalDurationS)  // old She — clamps range to duration, min gap 0.1
```
rendered as a **ruler overlay** (`XAr` @5162816, the `[data-take-range]` draw/drag tool with a
custom crosshair cursor), wired via `onSetTakeRange:t.setTakeRange` (@5193480). It is not a lane
and has no items.
- **No audio/subtitle tracks.** All `audio`/`subtitles` hits in the bundle are in the separate
  video-editor app (offsets ≥9.4M); the stage show has no such lanes.

### 1.A.3 `timeOfDay` strings: screenplay only

The 6 `timeOfDay` hits (9565924, 9573573, 9599191, 10346520 …) are all in the **story/script
subsystem** — screenplay scene-heading (slug-line) formatting, e.g. @9565924:

```js
const e=t.intExt==="EXT"?"EXT":"INT", n=…rawLocation…, r=…t.timeOfDay…
return …`${e}. ${n} - ${r}`…      // "INT. COFFEE SHOP - DAY"
```
i.e. `timeOfDay` is a *text label on a script scene*, completely disconnected from the 3D stage
light. Same for `time_of_day` @9599191 (story row migration).

### 1.A.4 No day-night cycling / environment keyframes anywhere

- `dayNight`: **0 hits**. `sunPosition`: **0 hits**. `Sunrise`: 0 hits.
- `sunrise`/`sunset`/`solar`: hits only in AI-prompt/marketing copy (offsets <4M and >9M);
  **zero** hits inside the stage-editor range (4.3M–6M).
- `daylight` in the stage range: only the help-text sentence @5331417 «In daylight a spotlight is
  subtle; it reads best in a dim scene.» and the `applyDaylight` function names.
- The only writers of the light are: `setLight` @5161034 (called from `adjustLight` @5828432 and
  the `set_light` agent tool @5346366) and `loadCameraSettings` on scene load (@5845971:
  `light:n.light??cHe`). **Nothing mutates the light during playback** — a take renders with a
  static sun unless the user drags mid-take.

## 1.B Closest original patterns to imitate (sanctioned-deviation design inputs)

### 1.B.1 How cam-move segments store per-kind data — structured params, NOT samples

Two storage shapes exist in the original; a light track should copy the **cam-move** one
(structured params) or the **transform** one (keys array), depending on design (see §1.D):

**(a) cam-move — preset table + flat structured params** (`j1` @3927697, factory `mUr` @5551703):

```js
const j1={orbit:{durationS:8,angleDeg:360,heightDeltaUnits:0,distanceScale:1},
          dolly_in:{durationS:4,angleDeg:0,heightDeltaUnits:0,distanceScale:.5},
          dolly_out:{durationS:5,angleDeg:0,heightDeltaUnits:0,distanceScale:2},
          dolly_zoom:{durationS:4,angleDeg:0,heightDeltaUnits:0,distanceScale:.5},
          crane_up:{durationS:5,angleDeg:0,heightDeltaUnits:3,distanceScale:1},
          crane_down:{durationS:5,angleDeg:0,heightDeltaUnits:3,distanceScale:1},
          spiral:{durationS:8,angleDeg:180,heightDeltaUnits:3,distanceScale:1},
          pan_sweep:{durationS:6,angleDeg:90,heightDeltaUnits:0,distanceScale:1}};
// mUr default branch:
default:{const a=j1[t];return{id:e,kind:"cam-move",startS:n,durationS:r,move:t,subjectId:s,
  direction:"ccw",angleDeg:a.angleDeg,heightDeltaUnits:a.heightDeltaUnits,distanceScale:a.distanceScale}}
```
Evaluation is a pure function of `(params, t/duration)` with a smoothstep (`CEe` @3928408:
`BDe(t)=t*t*(3-2*t)` then per-move math). Editing goes through a validator (`fUr` @5549965 =
old `OHr`): switching the `move` preset **resets its params from `j1`**; each param is clamped
only for moves in its class-list (`LDe`/`DDe`/`HDe` = angle/height/distance move classes).

**(b) transform / cam-transform — keyframe arrays** (old `Zzt` keyframed kinds):

```js
cam-transform item: {id, kind:"cam-transform", startS, durationS, keys:[{tS, position:[3], rotation:[3], focalLengthMm}]}
transform item:     keys:[{tS, position:[3], rotation:[3], scale:[3], headRotation?:[3]}]
```
Keyed kinds add keys at the playhead ("capture focused pose": `captureFocusedCameraPose`
@5562520 = `performanceTimeS - item.startS` → `addCameraKeyframe`, dedupe within `tS` tolerance
`_m`, duration auto-extends to the last key: `durationS:Math.max(a.durationS,o[o.length-1].tS)`),
and interpolate with plain lerp + quaternion slerp (`MKt` @5459300ish: position lerp, rotation
slerp, focal lerp). The timeline block then renders **kf diamonds** on the segment (our port
already renders these for `KF_KINDS`).

**(c) play / cam-manual — 20 Hz samples** (`samples:[{p,q,fovDeg}]`) — recorded data only; not
a good model for hand-authored light.

### 1.B.2 How a "global" (non-object) concept attaches: it doesn't — take range is the model

There is no global track. The take range (the only global timing concept) lives as
`show.range {startS,endS}` with: 2-decimal rounding, min gap `eie=0.1`, clamp to duration
(`Zhe` @4329571), ruler-overlay UI (`XAr` @5162816: box + grips + ghost + draw gesture, locked
state hides it), and agent mirror `{from_s, to_s}`. **Design consequence**: a light track either
(a) piggybacks on a reserved pseudo-object (keeps `Track.characterId` invariant — most of the
store/packing/placement code then works untouched), or (b) adds a new show-level field (like
`range`) with a custom lane (most faithful to "global" semantics, most new code).

### 1.B.3 Timeline value rows: the segment inspector (Properties panel) pattern

The original has **no in-lane value rows**; per-parameter editors live in the segment inspector
panel rendered inside the properties dock (`fVr` in the old pretty dump; CaBu3A6T @5598316).
Exact per-kind row vocabulary (cam-move):

```js
t.kind==="cam-move"&&…
  ev (labeled <select>)  Move      options: LP.map(L=>({value:L,label:bHe(L)}))
  ev (labeled <select>)  Subject   options: [{value:"",label:T},...H]   (DP moves only)
  Tot (number input)     Frame offset  value=t.aimOffsetUnits  (step .1, min -15, max 15)
  vh (number input)      Angle     value:t.angleDeg, step:15, min:15, max:360     (LDe moves)
  segmented 2-button     Direction ccw/cw (icons "reset"/"refresh")               (LDe moves)
  vh (number input)      HeightΔ   value:t.heightDeltaUnits, step:.5, min:.5, max:20  (DDe moves)
  vh (number input)      Distance  value:Math.round(t.distanceScale*100), step:10, min:10, max:400,
                                   onChange: L/100  (percent-shown, scalar-stored)  (HDe moves)
```
(`ev`=labeled select, `vh`=labeled number input with `{label, value, step, min, max, onChange}`,
`Tot`=the frame-offset field, `d2`=labeled axis-triplet editor used by transform
position/rotation/scale/headRotation rows.) Rotate/revolve/scale rows use the same `vh`/`ev`
pattern (axis segmented x/y/z, °/s step 10, factor step .1 min .05). CSS classes
(`Gr={rows,fieldRow,label,hint,select,numberBox,numberField,numberInput,unit,segmented,segment,
active,…}` @5581621-adjacent) — our port's `renderActionSection` (ui.js:874) already mirrors
this shape.

### 1.B.4 The playback evaluator per-frame loop — where a light track hooks

Frame loop `te()` inside `qXr` (setAnimationLoop @5791971, body @5792104):

```js
function te(){ …
  const he=Z.getDelta();          // dt
  a.tick(he); o.tick();           // humanoid rigs / rig handles
  B.tick(he);                     // B = uKr playback wrapper → controller je.tick(dt)
  V(); C.tick(he); T.tick(he);    // draw preview, gizmos, focus anims
  A()&&Fot(e.camera,n.orbit); n.tick(); A()&&Fot(e.camera,n.orbit);   // nav
  N.tick(he); w.tick();           // live play, camera mode/markers
  l.tick();                       // fog / near-far fit
  d.tick();                       // spotlight beams (oOr)
  u(e.renderer);                  // ★ EHr(c): c = CHr closure → applyDaylight + shadow fit
  I.tick(); L.tickPreview(he); re(); W.tick(he); L.tickShake(he); U.tick(he); j.tick();
  … e.scene.updateMatrixWorld() / (E.tick(), ae() /*render*/, h.add(he*1e3), Y(), W.render())
}
```

- **Controller** (`je` in `uKr` @5726966; tick @~5735900):
  `tick(dt)`: advance manual clock `l` / record clock `h` / performance clock `d`; if any active →
  `performanceTimeS.set(y())`, `pe(t,dt)` (characters), else reset to base; `poseNow()` forces
  evaluation with instant yaw. **A light track's clock ride-along belongs here.**
- **`pe(time,dt)`** @5733467 (old `ue`): per character track — ground snap, yaw smoothing
  (`tvr` rad/s, `Math.PI` when poseNow), head-look registration, playback clips, ends with
  **`O(we)`**.
- **`O(time)`** @5728206 (old `L`): per track — rig joints (`G` = rig keys at time), figure head
  rotation, then **`Y(track, time, foldMode)`** applied to the mesh (scale when mode!=="base";
  position+rotation when mode!=="walk"), then head-look pass, `setRigOffsets`.
- **`Y`** @5730673 (old `eEe`/fold eval): the per-item kind switch —
  `play` → walk samples; `path` → `te()` (path position+yaw); `rotate` → axis-angle×degPerS×t;
  `scale` → ease to factor; `revolve` → orbit around center; `transform` → `JWt(keys,t)` lerp.
  **A light item kind would add a case here — or, since it has no mesh, a sibling pass.**
- **Cameras** are evaluated per render, not by the controller: `NKt` @5461831 (old `dZt`) walks
  the camera's items sequentially, calling `gDr(item, elapsed, dur, ctx)` @5459322 per item
  (each item's output pose feeds the next — sequential composition), then the filming camera /
  markers use the result.
- **The daylight apply itself** (see §2.D for the full mechanism) is `CHr`'s closure
  (`c=CHr({sun, applyDaylight, light:()=>t.light.peek(), bounds, roots})` @5788089), invoked once
  per frame as `u(e.renderer)`. **If a light track writes `t.light` during playback, the sun,
  sky uniforms, night lamps and shadow fit all follow automatically on the next frame — no
  extra plumbing needed in the original's architecture.**

## 1.C Design constraints for our port

1. **Schema**: scene JSON currently `v11` (`light:{azimuthDeg, elevationDeg, nightLights?,
   skyStyle?, clouds?, hdr?, mode, weather, indoor, ambientLevel?, geo?}`). A light track must be
   additive and must not re-light existing scenes (precedent: round-6 P0-3 migrated scenes keep
   az/el via `mode:'custom'`). Track items must survive `normItems`-style validation
   (unknown/invalid fields dropped, refs to missing objects stripped).
2. **Store invariants** (from the original, already ported): items sorted+packed by `lje`;
   duration `yd` (stored for non-path kinds); `placeItemS` placement solver; duration clamps
   0.1–120; the segment inspector is the ONLY parameter editor (no in-lane rows).
3. **Light schema compatibility (ISSUE 2 overlap)**: the original's light is
   `{azimuthDeg, elevationDeg, nightLights?}` only; elevation clamp −30…90 (`dHe`), azimuth
   mod 360. Whatever the track animates should write through the same normalizer so the static
   popover, agent mirror (`JZt` → `azimuth_deg/elevation_deg/night_lights`) and finish renderer
   stay consistent.
4. **Playback**: our `evaluateAt` (main.js:775, the `jGr/ue/L` port) runs per frame; the frame
   loop already calls `env.applyDaylight(this.light)` at main.js:1407 and
   `shadowFit.tickAOr` at 1422 — i.e. the original's "write the light, the frame loop applies
   it" architecture is already in place. A light track only needs to *write* `app.light` per
   frame during evaluation.
5. **Fidelity rule**: this is a NEW FEATURE (user request). The original has nothing to port —
   so the design should imitate original patterns (below) and be flagged as a sanctioned
   deviation in CONTEXT/parity docs.

## 1.D Recommended approach (maximize bundle fidelity)

**Add a "Daylight" pseudo-object + a `light-transform` item kind** (recommended), imitating the
original's closest patterns piece by piece:

1. **Ownership — reserved pseudo-object** (imitates `addPerformanceTrack`'s object binding):
   register a singleton object of a NEW kind `"light"` (or reuse a reserved id `"sun"`), created
   lazily by `ensureLightTrack()`. `Track = {id, characterId:"sun", items:[…]}` keeps the entire
   existing pipeline (layout, packing, placement, drag, duplicate, undo, serialization) intact —
   exactly how every original track works. Lane head shows a sun icon + "Daylight" (the original
   lane-head is `name + ✕`; our port already has this markup at ui.js:1307).
   - Gate it out of: object pickers/subject dropdowns, `canOwnTrack`-style aim-target logic,
     the 3D hierarchy/selection (it has no mesh), and `uGt`-equivalent kind checks for
     *adding more* tracks of it (singleton).
2. **Item kind `light-transform`** (imitates `cam-transform` keys + `transform` capture flow):
   ```js
   {id, kind:"light-transform", startS, durationS,
    keys:[{tS, azimuthDeg, elevationDeg, nightLights?}]}   // nightLights optional; omitted = keep
   ```
   - Default duration 4 (`Jae`, like all keyed kinds); duration auto-extends to the last key.
   - Validation (imitate `fUr`/`dHe`): `azimuthDeg=((x%360)+360)%360`,
     `elevationDeg=clamp(el,−30,90)` (`Rq`/`oC`), keys sorted by `tS`, dedupe within the `tS`
     tolerance, ≥2 keys required to animate (else the segment renders as a hold).
   - **Capture at the playhead** (imitate `captureFocusedCameraPose` @5562520): while a
     `light-transform` segment is selected, moving the puck / pressing preset / typing az-el
     numbers writes a key at `performanceTimeS − item.startS` instead of (only) mutating the
     global light — the exact "drag the object while the action is selected" pattern our port
     already implements for transform kinds (ui.js key capture hint @927).
   - Interpolation (imitate `MKt` but angle-correct): position-style **lerp per field**, with
     azimuth interpolated over the **shortest arc** (we already port `tDe` shortest-angle);
     `nightLights`/other booleans step at the later key. Evaluator = pure function
     `(keys, tS) → light`, the analogue of `MKt`/`JWt`.
3. **Playback hook** (imitates the `O`/`Y` slot, minus the mesh): in `evaluateAt`, after the
   character pass and before the object pass, resolve the light track:
   ```js
   const l = lightAtTime(layout, timeS);        // null when no active key span
   if (l) this.light = { ...this.light, ...l }; // frame loop applies it (main.js:1407)
   ```
   Hold-before/after semantics: before the first key = first key's value (matches `MKt`'s
   `e<=n.tS → n` first-key hold), after the last = last key. When no light track exists,
   `app.light` stays user-owned (exact original behavior). During *takes*, this makes the sun
   move exactly like any performer — no extra take-renderer work needed since
   `applyDaylight`+shadow fit already run per frame.
4. **UI**:
   - Lane: normal lane (walker-style body), blocks with `KF_KINDS` diamonds (already generic in
     our `blockHTML` via `it.keys`), block label "Daylight".
   - Segment inspector section (imitate the `ev`/`vh` row vocabulary @5598316):
     `Azimuth°` (`vh`: step 5, min 0, max 360), `Elevation°` (`vh`: step 1, min −30, max 90),
     `Night lamps` (checkbox row, only when a glowing object exists — mirrors the original's
     `e&&…nightLights` conditional), plus the existing kf-cluster (◀ ◆ ▶) reused verbatim.
   - Add-track entry: a "Daylight" option in the Add-track dropdown (our `rCr`-port portal)
     that calls `ensureLightTrack()` once.
5. **Schema/migration**: bump `v11→v12`; `normItems` passes the new kind's keys through the
   same validator; the pseudo-object is *derived* on load (not persisted as a mesh object) — or
   persisted like any object row with `kind:"light"` and stripped from 3D sync. Agent-mirror
   (`eKt`-style): `{action:"transform"}` like cam-transform, plus a `light_track` entry in the
   show mirror with per-key `azimuth_deg/elevation_deg` (2-dp rounding, `Eo` precedent).
6. **Do NOT animate** weather/indoor/skyStyle/clouds/hdr on the track (keep them scene-level):
   the original's light object is az/el/nightLights only, the expensive rebakes (PMREM) must not
   ride a per-frame value, and the user ask is specifically sun position ("as a light source,
   with some built-in parameters of the sky light" → az/el + the daylight table's built-in
   colors is exactly that; the original's `UDr` table already derives every sky parameter from
   elevation alone).

**Rejected alternatives**: (a) `light-move`-style preset params (like cam-move's `move` +
angle/delta) — fits "time of day" poorly because time-of-day is a 2-DOF absolute pose, not a
relative move; (b) show-level `lightTrack` field + custom lane — more faithful to "global", but
duplicates the entire track pipeline (layout/packing/drag/duplicate/undo) for one lane;
(c) 20 Hz samples (cam-manual style) — recording-oriented, uneditable by hand.

---

# PART 2 — ISSUE 2: sun-position control (the "day/night globe") ground truth

## 2.A The original's sun-position UI — exact structure

Component family (CaBu3A6T): `ots` (LightControl popover shell) @5884954, `lts` (puck)
@5886438; CSS class map `m1` @5884300-adjacent:
`{lightControl, window, body, hint, puck, horizon, hub, knob, knobGliding, nightLights, times,
time}` (hashed class names `_puck_1da1r_44` etc. — the CSS rules live in a separate stylesheet,
not the JS bundle; geometry facts below come from the JSX math).

**Popover shell (`ots`)** — verbatim (elided):

```js
function ots({light:t,hasNightLights:e,peekViewYawDeg:n,onLightChange:r,onDragStart:s,onDragEnd:a}){
  … Escape/outside-pointerdown close …
  const h=_._({id:"iMaAjz"});                       // button+dialog label ("Light")
  return … button(sun icon, h) … o&&… dialog(hudWindow) …
    i.jsx(lts,{light:t,knobGliding:c,onKnobGlideEnd:…,peekViewYawDeg:n,onLightChange:r,
                onDragStart:s,onDragEnd:a}),
    i.jsx("div",{className:m1.times,children:sts().map(({label:f,elevationDeg:m})=>
      i.jsx("button",{className:m1.time,"aria-pressed":Math.abs(t.elevationDeg-m)<its,
        onClick:()=>{d(m!==t.elevationDeg),s(),r({...t,elevationDeg:m}),a()},children:f},m))}),
    e&&… nightLights row: Ves checkbox {checked:t.nightLights!==!1,
        onCheckedChange:f=>{s(),r({...t,nightLights:f}),a()}} …,
    i.jsx("p",{className:m1.hint,…}) } }
```

Key facts:
- Rendered **only in edit mode, not recording, no play session**
  (`a!=="edit"||o||l?null:…` in `cts` @5887900-adjacent).
- **4 time presets** (`sts` @5884575): elevations `cHe.elevationDeg=57.38` (midday default),
  `nSr=9`, `rSr=−4`, `sSr=−28`; **elevation-only** (`r({...t, elevationDeg:m})` — azimuth
  preserved); `aria-pressed` when |el−preset| < `its=.5`. Clicking a preset sets the
  `knobGliding` class (CSS transition glide), cleared on `transitionend` or pointerdown.
- **Night lamps row** appears only when some object "glows" (`hasNightLights` =
  `Object.values(objects).some(bXt)`; `bXt` @5581621: kind ∈ {cube,sphere,cylinder} AND name
  matches `NUr=tE("lanterns?|lamps?|candles?|windows?|lancets?|stained glass|glass panes?|moons?")`
  AND not `PUr` (frames/mullions/sills/arch…)). Checkbox writes `nightLights` (default true,
  stored only when false).

**Puck (`lts`)** — verbatim (elided), the complete interaction model:

```js
function lts({light:t,knobGliding:e,onKnobGlideEnd:n,peekViewYawDeg:r,onLightChange:s,
              onDragStart:a,onDragEnd:o}){
  const[l,c]=p.useState(r), d=p.useRef(!1), u=()=>{d.current&&(d.current=!1,o())};
  … rAF loop: g=()=>{const b=r(); c(y=>Math.abs(b-y)<nts?y:b), m=requestAnimationFrame(g)} …
  const h=m=>{const g=m.currentTarget.getBoundingClientRect(),b=g.width/2,y=b-pve;
              return{x:(m.clientX-g.left-b)/y, y:(m.clientY-g.top-b)/y}};        // −1..1 disc
  const f=lSr(t,l);
  return i.jsxs("div",{className:m1.puck,role:"slider",tabIndex:0,
    "aria-label":…,"aria-valuemin":Rq,"aria-valuemax":oC,
    "aria-valuenow":Math.round(t.elevationDeg),"aria-valuetext":ats(t.elevationDeg),
    onPointerDown:m=>{m.currentTarget.setPointerCapture(m.pointerId),d.current=!0,n(),a(),
                      s(Qrt(h(m),l))},
    onPointerMove:m=>{m.currentTarget.hasPointerCapture(m.pointerId)&&s(Qrt(h(m),l))},
    onPointerUp:u, onPointerCancel:u,
    onKeyDown:m=>{const g=rts[m.key]; g&&(m.preventDefault(),
        s({azimuthDeg:t.azimuthDeg+g[0], elevationDeg:t.elevationDeg+g[1]}))},
    children:[ i.jsx("span",{className:m1.horizon}), i.jsx("span",{className:m1.hub}),
      i.jsx("span",{className:qe(m1.knob,e&&m1.knobGliding),onTransitionEnd:n,
        style:{left:`calc(50% + (50% - ${pve}px) * ${f.x})`,
               top: `calc(50% + (50% - ${pve}px) * ${f.y})`}}) ] }) }
```

Math + constants (@4912331–4913270):

```js
const Rq=-30, oC=90,            // elevation clamp (aria-valuemin/max)
      eSr=5, oqt=-8, tSr=25,    // sun-direction remap constants (see §2.C)
      nSr=9, rSr=-4, sSr=-28,   // preset elevations (golden/dusk/night)
      cHe={azimuthDeg:128.66,elevationDeg:57.38},   // default light
      qU=Math.PI/180;
const pve=8;                                // knob inset px (disc radius = half-size − 8)
const nts=.5;                               // view-yaw adoption threshold (deg)
const Qlt=10, Jlt=5, rts={ArrowLeft:[-Qlt,0],ArrowRight:[Qlt,0],ArrowUp:[0,Jlt],ArrowDown:[0,-Jlt]};
function lSr(t,e){const n=(t.azimuthDeg-e)*qU, r=(oC-t.elevationDeg)/(oC-Rq);
  return {x:Math.sin(n)*r, y:-Math.cos(n)*r}}                     // light → knob xy
function Qrt(t,e){const n=Math.min(1,Math.hypot(t.x,t.y));
  return dHe({azimuthDeg:Math.atan2(t.x,-t.y)/qU+e, elevationDeg:oC-n*(oC-Rq)})}  // xy → light
function dHe(t){return{azimuthDeg:(t.azimuthDeg%360+360)%360,
  elevationDeg:Math.min(oC,Math.max(Rq,t.elevationDeg)), …nightLights===!1?{nightLights:!1}:{}}}
```

So the original control is exactly what our port implements: a **polar disc** — knob angle =
azimuth (rotated by the live view yaw so "up" = current camera heading, adopted at ≥0.5° via a
rAF loop), knob radius = elevation (center 90°, rim −30°, 120° span, clamped), plus keyboard
arrows (az ±10°, el ±5°), plus a horizon line + hub dot + gliding knob. The knob is positioned
via CSS `calc(50% + (50% − 8px) * x)` — no canvas.

## 2.B Is our puck a faithful port? YES — redesign = user-sanctioned deviation

| aspect | original (CaBu3A6T) | our port (ui.js buildLightPopover) | verdict |
|---|---|---|---|
| polar mapping az=angle, el=radius (center 90, rim −30) | `lSr`/`Qrt` @4913088/4913205 | `knobAt` ui.js:429 + pointermove math ui.js:535-546 | faithful |
| view-yaw-rotated knob, ≥0.5° adoption, rAF loop | `nts=.5`, rAF loop in `lts` | `adoptYaw` 120ms poll + 0.5° ui.js:418-427, yawLoop ui.js:659 | faithful (we poll at 120ms; original rAF — minor) |
| knob inset 8px, CSS calc positioning | `pve=8`, `calc(50% + (50% - 8px)*x)` | same formula ui.js:433 | faithful |
| keyboard az ±10 / el ±5, preventDefault | `rts`/`Qlt`/`Jlt` | ui.js:550-560 | faithful **except** we bracket each keypress in a gesture (`commit()`); the original sets the light directly with no gesture (both builds) |
| 4 elevation-only presets 57.38/9/−4/−28, aria-pressed <0.5, glide class + transitionend | `sts`/`cHe`/`nSr`/`rSr`/`sSr`/`its` | `C.LIGHT_PRESETS` const.js:139, ui.js:562-569 | faithful |
| phase label thresholds 32/12/0/−8/−20 | `ats` @5884774 | `PHASE_OF` ui.js:266 | faithful |
| night-lamps checkbox, conditional on glowing objects, nightLights stored only when false | `Ves` row in `ots`; `bXt` @5581621 | `lpNight` ui.js:411, 649-653 (always shown) | faithful (we don't gate on `bXt` — we have no name-regex glow classifier; sanctioned) |
| popover hidden during recording/playback | `cts` gate | always available | deviation (minor) |
| ghost knob (geo solver preview) | — none | `sunGhost` ui.js:446-451 | **our invention** (round-6 geo feature) |
| geo/weather/indoor/ambient/sky/clouds/HDR sections | — none | ui.js:365-411 | our sanctioned deviations (rounds 6–13) |

**Conclusion**: the puck IS the original's control (a "day/night globe" is an accurate user
description of the original too — the disc spans 90° overhead to −30° night). The requested
redesign (separate 2D direction + separate height + sun-becomes-moon) is a **user-sanctioned
deviation** with no bundle counterpart; §2.F designs it inside the original's interaction
vocabulary.

## 2.C How the original handles NIGHT (elevation < 0)

There is **no moon in the UI** and no night-specific UI beyond the Night-lamps checkbox. Night
is handled entirely in the light rig, via the sun-direction remap `aSr` @4912449:

```js
function aSr(t){const e=t.azimuthDeg*qU,
  n=(t.elevationDeg>oqt ? Math.max(t.elevationDeg,eSr) : tSr-t.elevationDeg)*qU;
  //        el > −8  → direction elevation floored at +5°   (sun never below 5° in direction)
  //        el ≤ −8  → direction elevation = 25 − el        (rises again: the MOON)
  return [Math.sin(e)*Math.cos(n), Math.sin(n), -Math.cos(e)*Math.cos(n)]}
```

- For −8° < el: the shadow-casting light direction keeps a +5° floor (long shadows at dusk,
  never a below-ground key light).
- For el ≤ −8°: the direction becomes `25 − el` degrees — as the sun drops further, the light
  direction **rises again** (el −30 → +55°): the key light silently becomes a moon. This is the
  original's entire "sun becomes moon" mechanic — a direction remap, no visual, no UI state.
- The sky-dome flare direction uses `Math.max(f.elevationDeg,0)` (flare pinned to the horizon at
  night; no disc, no moon glyph — the classic dome is a 3-color gradient + flare term).
- Night lamps: the daylight table's `glow` channel (1.0 at el ≤ −16, 0.8 @−8, 0.35 @−2, 0 @≥5)
  drives emissive intensity per glowing mesh (in the shadow-fit walk @5472905:
  `w.emissive.setHex(uHr=16763274 /*0xFFC98A*/); w.emissiveIntensity=g` where `g` is
  `applyDaylight`'s return, 0 when `nightLights===false`).

(Our port already extends this: realistic sky renders an actual moon disc + stars, and r19 L2
blends the key direction sun→moon with a slerp — sanctioned deviations that the redesign can
lean on.)

## 2.D How the original updates the scene LIVE during drag (and why ours lags)

**The original's high-frequency light update architecture** (the pattern to copy):

1. **Input path is free.** pointermove → `onLightChange` = `adjustLight` @5828432:
   ```js
   adjustLight=e=>{this.cameraStore.setLight(e), this.analytics?.recordLightAdjusted()}
   setLight=e=>{this.light.set(dHe({...this.light.peek(),...e}))}      // @5161034
   ```
   — a **pure atom write** (plus a boolean analytics flag `recordLightAdjusted=()=>{this.lightAdjusted=!0}`
   @5147683). No applyDaylight, no shadow fit, no autosave on the input path. The knob re-render
   is a cheap React render.
2. **Apply once per frame, inside the frame loop.** The `CHr` closure (@5472306) runs every
   frame via `u(e.renderer)` (`EHr` @5474052):
   ```js
   g=t.applyDaylight(t.light());          // table lerp + ~10 color/uniform copies
   … walk objects (fingerprint log) …
   n.fromArray(aSr(k)); … sun.position/target refit …
   (C.right!==w||C.far!==T||…)&&(…updateProjectionMatrix())     // write-gated
   m(e.position),h(w),h(T)                // sun fit enters the fingerprint log
   const E=u||c!==d; …                    // dirty = any logged value changed
   ```
   `applyDaylight` (`kHr` @5470698) is memoized on exactly `(azimuthDeg, elevationDeg)`:
   `if(f.azimuthDeg===c&&f.elevationDeg===d)return m();` — so during a drag it recomputes once
   per frame (microseconds: `UDr` 8-stop table lerp + color copies into hemi/sun/fog/sky
   uniforms + flare direction), and never on pointer-move frequency.
3. **Expensive work is change-gated, not throttled.** The shadow map re-render happens at most
   once per frame and only when the fingerprint (`Float64Array(4096)` log of object
   transforms/visibilities + sun position + fit extents) actually changed:
   `EHr` bumps a generation and sets `renderer.shadowMap.needsUpdate=true` once per change.
   There is **no** LUT/PMREM/IBL in the original (its sky is 3 uniforms), so nothing else can
   stall a drag.
4. **Persistence is reactive, not per-move.** Scene saving subscribes to the light atom
   (`trackSceneJson=()=>{…,this.light.get()}` @5845618) — the watcher snapshots after the fact;
   undo coalescing is the gesture bracket (`beginEditGesture` on pointerdown /
   `endEditGesture` on pointerup — NOT per pointermove).

**Our port's deviations causing the reported lag** (main.js:164-167 + env.js:298-409):

1. `setLightCustom` runs `shadowFit.force()` + **`env.applyDaylight(this.light)` synchronously
   on every pointermove** (ui.js:544 calls it per move; pointermove can fire 120–240×/s) — the
   original applies once per frame. The frame loop ALSO applies at main.js:1407, so during a
   drag we do 2–5× the work per frame, all on the input event.
2. In **realistic sky** mode, every `applyDaylight` → `buildSkyParams` + `realistic.setParams`
   (env.js:357-362). `setParams`'s paramKey includes the sun direction (sky.js:694-700), so a
   drag marks the atmosphere LUTs dirty → `bake()` (3 fullscreen LUT passes) fires at ≥80ms
   cadence and `bakePMREM()` (a `PMREMGenerator.fromScene` cubemap+convolution rebake) at
   ≥250ms cadence (sky.js:809-812) **for as long as the drag lasts**. These mid-drag GPU
   rebakes are the visible hitching. In classic mode none of this exists (matches original
   cost).
3. `markAutosave()` per move is debounced (1s) — cheap, matches the original's reactive save
   in spirit; keep.

**Recommended fix (restore the original pattern — small diff):**
- `setLightCustom`/`setLightGeo`/`setWeather`/`setIndoor` should do the **store write only**
  (normalize + `this.light = {...}`); delete the synchronous `env.applyDaylight` and
  `shadowFit.force()` calls (the per-frame `fit()` at env.js:590 already reads the live light —
  its fingerprint detects the change exactly like `CHr`; `force()` is redundant).
- During an active puck drag, suppress atmosphere rebakes: only *mark* dirty; bake LUTs/PMREM
  when the light has been idle ≥250ms (or on `endEditGesture`). This is the "write uniforms
  directly, defer expensive recomputes" structure: the per-frame `applyDaylight` keeps the
  cheap uniform path (dome colors, sun color/intensity, flare, fog, key direction) live at 60fps
  while the IBL trails by ≤250ms and settles on release.
- Optionally coalesce pointermove → one atom write per rAF (the original doesn't need this
  because its write is trivial; with the realistic-sky defer in place ours becomes trivial too).

## 2.E The original's light-panel schema (keep our redesign compatible)

- **Runtime/persisted light object** (stage scene row, camelCase): `{azimuthDeg:number,
  elevationDeg:number, nightLights?:false}` — nothing else. Parse/normalize `iSr`/`dHe`
  @4912790/@4912632: az mod 360, el clamp [−30,90], `nightLights` stored **only when false**
  (default true); invalid/missing light → dropped on load (`zSr` @4923174-adjacent migration).
  Default `cHe={azimuthDeg:128.66, elevationDeg:57.38}`; camera-store atom `light=Me(cHe)`
  @5153913; on load `light: n.light ?? cHe` @5845971.
- **Agent/canvas JSON** (`JZt` @5317655): `{azimuth_deg:Math.round, elevation_deg:Math.round,
  night_lights?:false}`.
- **`set_light` agent tool** (@5346300-adjacent): `{azimuth_deg?, elevation_deg?, object_id?}`;
  notes «elevation_deg runs from −30 (night) to 90 (overhead)»; optional `object_id` re-derives
  azimuth from a camera's heading (`be+180−az`, reported as `from_camera_deg`).
- Our port's additions (`mode`, `geo{timeOfDay,dayOfYear,latitudeDeg,altitudeM,northOffsetDeg}`,
  `weather`, `indoor`, `ambientLevel`, `skyStyle`, `clouds{…}`, `hdr{…}` — schema.js:180-231)
  are additive sanctioned deviations; the redesign must keep writing `azimuthDeg/elevationDeg/
  nightLights` through `normalizeLight` so scenes stay loadable by both.
- The **daylight table** (`oQ` @5465244 + `BDr` full-day stop @5465098, lerp `UDr` @5466135) —
  8 elevation stops (−30/−16/−8/−2/5/16/32/full) × {zenith,horizon,fillSky,fillGround,fill,
  sunColor,sun,glow,flare} — is the "built-in parameters of the sky light" the user asked for in
  ISSUE 3: every sky/sun/lamp parameter is a pure function of elevation. Already ported
  (`daylightAt`).

## 2.F Recommended redesign (user-sanctioned deviation, original vocabulary)

Split the single polar disc into two controls, keep everything else:

1. **Direction disc (azimuth only)** — a compass rose (N/E/S/W ticks at the rim, no radius
   meaning): knob slides along the rim, or the puck disc becomes a **linear angle picker**
   (drag anywhere → azimuth = atan2 of the pointer from center). Keep: view-yaw rotation
   ("up" = camera heading, 0.5° adoption), pointer capture, keyboard arrows for az (±10°),
   `aria-slider` semantics with `aria-valuemin=0 aria-valuemax=360 aria-valuenow=az`,
   `aria-valuetext` = compass phase (`ats`-style helper on azimuth). This kills the confusing
   "globe" mental model (no more elevation-as-radius).
2. **Height control (elevation only)** — a vertical slider/arc −30…90 (Rq…oC) with the 4
   original preset stops marked (57.38/9/−4/−28), the phase label (`PHASE_OF`/`ats`
   thresholds 32/12/0/−8/−20) and the az/el readout moved next to it. Keyboard: Up/Down ±5°
   (Jlt). Keep the presets row as-is (elevation-only, azimuth preserved, glide transition).
3. **Sun becomes moon at night** — flip the control's iconography when `elevationDeg ≤ −8`
   (the original's exact `oqt` moon-handoff threshold from `aSr`): the height-control handle
   and/or the direction knob render a moon glyph (we already have `MOON_TONE 0xdbe0f2` and
   `moonDirection` from r19 L2/L3); the phase label already reads "Night". Add a subtle
   horizon line across the height control (el 0) with the "moon zone" (−8…−30) shaded — this
   teaches the day→dusk→moon sweep the rig actually performs (`aSr` remap: direction elevation
   floors at +5°, then rises as 25−el for the moon).
4. **Keep** the night-lamps checkbox (now gated like the original when no glowing object
   exists, if we adopt the `bXt` name-regex — optional), the hint line, the geo ghost knob
   (our feature), and all round-6+ sections unchanged. All writes still go through
   `app.setLightCustom(az, el)` → `normalizeLight` (schema parity).
5. **Apply the §2.D live-update fix at the same time** — the redesign's drag must feel instant,
   which the input-path-is-free + deferred-rebake pattern delivers.

---

## Appendix — offset index (CaBu3A6T)

| offset | symbol | what |
|---|---|---|
| 3927448 | `LP` | cam-move preset list |
| 3927697 | `j1` | cam-move default params |
| 3928408 | `CEe` | cam-move evaluator (smoothstep) |
| 4325275/4325389 | Sets | object-animation / camera item kind sets |
| 4329083 | `uGt` | valid object kind check |
| 4329571 | `Zhe` | take-range resolver (old She) |
| 4912331 | `Rq/oC/eSr/oqt/tSr/nSr/rSr/sSr/cHe/qU` | light constants |
| 4912449 | `aSr` | az/el → sun/moon direction (night remap) |
| 4912632/4912790 | `dHe`/`iSr` | light normalize / parse |
| 4913088/4913205 | `lSr`/`Qrt` | knob↔light polar math |
| 5147683 | `recordLightAdjusted` | analytics flag (bool) |
| 5153913 | `light=Me(cHe)` | light atom default |
| 5161034 | `setLight` | pure atom write |
| 5162816 | `XAr` | take-range ruler tool |
| 5317655/5318051 | `JZt`/`eKt` | light/item snake_case mirror |
| 5346300 | `re` (set_light tool) | agent light setter |
| 5465098/5465244/5466135 | `BDr`/`oQ`/`UDr` | daylight table + lerp |
| 5470698 | `kHr` | environment ctor + applyDaylight |
| 5472306 | `CHr` | per-frame daylight+shadow-fit+fingerprint closure |
| 5474052 | `EHr` | shadowMap.needsUpdate generation bumper |
| 5459322/5461831 | `gDr`/`NKt` | per-item / composed camera eval |
| 5549965 | `fUr` | setCameraItemFields validator |
| 5551703 | `mUr` | camera item factory |
| 5555531 | `addPerformanceTrack` | object-bound track creation |
| 5562520 | `captureFocusedCameraPose` | playhead key capture pattern |
| 5581621 | `bXt` | night-lamp object classifier (+`NUr/PUr` regexes) |
| 5598316 | inspector rows | cam-move/rotate/… parameter editors (`ev`/`vh`/`Tot`/`d2`) |
| 5726966 | `uKr` | playback wrapper (controller host) |
| 5728206 | `O` | per-frame object apply (old L) |
| 5730673/5733467 | `Y`/`pe` | object-items eval / characters eval |
| ~5735900 | `je.tick` | performance controller tick |
| 5788089/5788105 | `c=CHr(…)`,`u=EHr(c)` | frame-loop wiring |
| 5791971/5792104 | setAnimationLoop / `te()` | frame loop |
| 5828432 | `adjustLight` | popover onLightChange |
| 5845618 | `trackSceneJson` | reactive save trigger (incl. light) |
| 5884147 | `_puck_1da1r_44`… | light-control CSS class names |
| 5884575 | `sts` | time presets |
| 5884774 | `ats` | phase label |
| 5884954/5886438 | `ots`/`lts` | LightControl / puck components |
