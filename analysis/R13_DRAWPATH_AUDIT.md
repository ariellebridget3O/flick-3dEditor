# R13 — DRAW-PATH FULL DIVERGENCE AUDIT (live bundle vs our port)

**Scope:** the entire draw-path subsystem — pointer reducers → stroke intents → PlanStore
(startStroke/tickStroke/endStroke/previewPose) → replaceMoveFromSamples → focus flows →
plan painter stroke/dim/focus passes → 3D drawPreview ghost → ground snap → timeline/undo →
plan bar → the newer deployed bundle (`index-CaBu3A6T.js`) drift.

**Ground truth:** `analysis/index-DBE17t4T.js` (13,457,064 chars; offsets below are char offsets
into the UTF-8-decoded text). Verbatim extractions in `analysis/tmp_plan_exact/`,
`analysis/tmp_palette_exact/`. Our port: `editor/js/plan.js`, `store.js`, `main.js`,
`tracks.js`, `curves.js`, `schema.js`, `ui.js`, `manipulate.js`.

**Method note (tooling):** the Bash/Read tool output filter swallows the two-byte sequence `[h`
(that is why earlier reads of `plan.js` showed dangling `]` — e.g. `l] < y`). `node --check
editor/js/plan.js` passes; `od -c` confirms the file really contains `l[h] < y`. Those were
display artifacts, **not** syntax errors. All exact-code reads below were re-done through a
python dumper that escapes `[`.

---

## 1. Executive summary

| severity | count | headline |
|---|---|---|
| **P0** (wrong behavior on the main flow) | **3** | (1) `moveSegmentOf` filter is wrong → drawn path does not REPLACE existing camera move segments (every stock camera has a `cam-still`!) and stale segments are packed after the new path; (2) `focusOf` is a static find instead of playhead-covering (`cameraFocusId`/`Cit`) plus an invented `targetId` fallback and an extra `aim==='subject'` gate on cam-move/cam-still; (3) `toggleFocus` camera branch is missing the whole live `setCameraFocus` machine (cam-still INSERT on stock cameras, keepLookOnClear, cam-move subject patch, warning toast) — tap-to-focus on a stock camera is a **no-op** in our port. |
| **P1** (wrong edge cases / secondary flows) | **6** | endStroke does not reset playhead/pose to rest (`stopPerformance` semantics); “drawTarget changed → exit drawing” effect missing; drawPreview ghost: humanoid head-look missing entirely + simple_figure head pitch applied as ROLL; plan canvas hidden during playback (live keeps it); toggleFocus walker branch patches the first path item instead of the playhead-covering one; drawPreview rotation not parent-composed. |
| **P2** (cosmetic / perf / masked edge cases) | **8** | stale `_je`/driveMode copy in plan.js (manipulate.js has the correct one); no failure toast; Esc-exit leaves stale “Finish” pill; `aimHeightOf` uses local scale; rehearse tip has no UI; `locked()` lacks isRecording; `ensureTrack` instead of `addPerformanceTrack` gates; plan-bar gating (locked/compiling). |
| **P3** (informational) | ~8 | i18n guesses (unverifiable — locale fetched at runtime), telemetry hooks no-op, undo bracketing model differs but same outcome, autosave extras. |

**Verified EXACT (byte-level) this round:** all draw-path constants; the full reducer chain
(DLr/DZt/HLr/BLr/$Lr/OZt); the simplify pipeline (Ait/xHr/wHr/vHr); `replaceMoveFromSamples`
core math (speeds, anchors, aim rules, id gen, packing, focal carry); stroke lifecycle
(startStroke/tickStroke/drawFrame verbatim); `rx`/`restOfShowDurationS`; painter stroke pass
($Zt + xDr=2.4 accent, vDr=.5 dim, CDr, ADr, callout suppression only during active stroke);
ground snap (Xae/Uzt/Bne/A2r/zzt/Wzt + walkableSurfaces set + exactY); `eEe`/evalCharacterTrack
(pace, held→idle, gait default, lookAt); camera eval cam-path branch (pace/heightCurve/aim/travel
rye=5/$6/XN); the W aim resolver; kv; xM; single undo entry per stroke.

**Newer bundle (`index-CaBu3A6T.js`):** the entire draw-path core is **identical modulo minifier
renames** (`Fp→Lp`, `Cit→xot`, `el→Po`, `Q0→ag`, `vHr→YVr`, `yP→DP`, …) — verified by
identifier-normalized byte comparison. Changes in the newer deployment: **autopan reworked**
(250 ms edge-hold, quadratic ramp, new constants), **new `keepCameraOn(e,n)`** method, and
**new plan-canvas path-anchor editing** (drag kinds `path-point|path-handle|path-tap`, new
painter consts 5/6.5/4/6). See §6.

---

## 2. The intent chain + constants (task item 1)

Pointer events → pure reducers → `rDr.apply(intents)`. Our PART D (plan.js:433–592) is a
**verbatim** port of `DLr` @5458269, `DZt` @5460154, `HLr` @5461596, `BLr` @5459609,
`$Lr` @5462125, `OZt` @5457977 (checked line-by-line against `fn_*.js` extractions + raw bundle
slices): tap-or-draw (down < Qat=3 px → focus intent on up), stroke-start at pointerdown
(`S1(view, p)` world point), stroke-move gated at SLr=4 px between events, grab-offset easing
`max(0, 1−dist/tDr)` (tDr=1 m) applied in `apply`, autopan `BLr` (ALr=.8 deadzone, CLr=720 px/s,
`min(dt,100)` clamp, `UDe(−d,−u)` pan + recomputed stroke-move at the new view), marquee
either-dim>Jat=4 rule, move threshold Qat=3, snap Vie=.25 / Yat=π/12, edge-bubble click at
uN+3. All match.

### 2.1 Constants table (all re-verified in raw bundle bytes this round)

| name | live value @char-offset | ours (plan.js PART A) | match |
|---|---|---|---|
| Qat (move thresh px) | `3` @5456619 (`consts_state`) | `Qat = 3` (line 39) | ✅ |
| SLr (stroke-move px) | `4` @5456619 | `SLr = 4` | ✅ |
| Jat (marquee min px) | `4` @5456619 | `Jat = 4` | ✅ |
| Vie / Yat (snap) | `.25` / `Math.PI/12` @5456619 | same | ✅ |
| TLr (fit margin) | `48` @5456619 | `TLr = 48` | ✅ |
| ALr / CLr (autopan) | `.8` / `720` @5456619 | same (line 39, BLr port 565–575) | ✅ |
| eit (path samples) | `40` @5462302 (`consts_drag`) | `eit = 40` | ✅ |
| VLr (stroke sample s) | `.05` @5462302 | `VLr = .05` | ✅ |
| ULr (tip ms) | `4e3` @5462302 | `ULr = 4e3` | ✅ |
| zLr (face-turn m) | `.05` @5462302 | `zLr = .05` | ✅ |
| eDr (focus ease s) | `.4` @5462302 | `eDr = .4` | ✅ |
| tDr (grab decay m) | `1` @5462302 | `tDr = 1` | ✅ |
| tit (z-order map) | prop/cube/sphere/cylinder/group=0, humanoid/figure=1, target=2, spotlight/camera=3 @5462302 | identical | ✅ |
| WLr/GLr/qLr/ZLr (heightMax) | `20/12/4/50` @5462302 | same | ✅ |
| fHr/mHr/gHr/bHr/yHr/Tit | `.3/.7/.25/.1/.2/1e4` @5519474 (`consts_stroke`) | same (line 44) | ✅ |
| K2r (min pace samples) | `32` @4317858 | `K2r = 32` | ✅ |
| Htt / Qae (walker speed/min) | `1.4` / `.01` @4319832 | same | ✅ |
| YZt (camera steady m/s) | `2` @5520967 | `YZt = 2` | ✅ |
| CZt (walker eye height) | `1.6` @5451436 (XOr=70°, YOr=35°) | same (line 62) | ✅ |
| Ije (cam-still min dur) | `.1` @5520994 | **not in port** (needed by P0-3 fix) | ➖ |
| sje("still") | `N8=5` @4319832 + `sje` @5065477 (`_1` action table @3918403 has no "still" → N8) | n/a (P0-3) | ➖ |
| yP (subjectful cam-moves) | `bP.filter(t=>t!=="pan_sweep")` @3918370, bP @3918100 | n/a (P0-3) | ➖ |
| vDr / xDr (dim/stroke) | `.5` / `2.4` @5480195 (`consts_painter`) | same | ✅ |
| hit/lqt/vLr/cqt/yLr | `12 / 8 / 6+2` @5455477, @5249885 | same | ✅ |
| MIr (NP aim frac) | `.7` @5247744 | `.7` (aimHeightOf) | ✅ |
| Wat (neck/head split) | `.4` @5451436 | `NECK_HEAD_SPLIT=.4` | ✅ |
| jP (figure height) | `1.75` (uje @5247757) | `1.75` | ✅ |
| Xae/Uzt/Bne/A2r (ground) | `.5 / .22 / 1.2 / 8` @3926059 | const.js 183–186 | ✅ |
| rye (travel lookahead) | `5` | `TRAVEL_LOOKAHEAD=5` tracks.js:278 | ✅ |
| qA (play sample hz) | `20` | `SAMPLE_HZ=20` const.js:166 | ✅ |
| Btt (heightCurve resample) | `64` @4318946 (Q2r, cam-path paint) | (paint path — out of draw scope) | ➖ |

---

## 3. Divergence registry

### P0-1 — `moveSegmentOf` filter wrong → replace-move keeps stale camera segments
**Live** @5546275 (verbatim):
```js
moveSegmentOf=(e,n)=>{const r=this.show.peek().tracks.find(o=>o.id===e),
  s=this.objects.peek()[r?.characterId??""]?.kind==="camera",
  a=(r?.items??[]).filter(o=>s?Fp(o):o.kind==="path"||o.kind==="play");
  return a.find(o=>n>=o.startS&&n<o.startS+yd(o))??a[0]}
```
`Fp(t)=V2r.has(t.kind)`, `V2r=new Set(["cam-still","cam-move","cam-path","cam-follow","cam-transform","cam-manual"])` @4316085.
So: **camera tracks** consider ALL six cam-\* kinds (cam-still included); **walker tracks**
consider `path|play`. Covering item at the given time with first-candidate fallback.

**Ours** plan.js:1042–1046 (inside `_replaceMove`):
```js
moveSegmentOf: (trackId, s) => {
  const tr = show.show.tracks.find(t => t.id === trackId); if (!tr) return null;
  const cands = (tr.items ?? []).filter(o => o.kind === 'path' || o.kind === 'cam-path' || o.kind === 'play');
  return cands.find(o => s >= o.startS && s < o.startS + itemDuration(o)) ?? cands[0] ?? null;
}
```
**Divergence:** no per-character-kind filter. For a camera, `cam-still / cam-move / cam-follow /
cam-transform / cam-manual` are NOT candidates → `m = null` (or the wrong item) →
`replaceMoveFromSamples` keeps the old segment and only prepends the new path:
`updateTrackItems(d, v => [y, ...v.filter(x => x.id !== m?.id)])` → `packItems` (lje) bumps the
old segment to **after** the drawn path.

**User-visible:** every stock palette camera gets a `cam-still` at 0 s (schema `shotToItem`
still/default → cam-still, 5 s). Drawing a path over it in the live REPLACES the still
(path occupies 0..T, nothing else). In ours the still survives and plays at T..T+5 (camera
“returns to a still” after the drawn path; timeline shows both; delete-pill state gets
confused). Same for drawing over a camera with orbit/dolly/follow/transform/manual items.
Also skews the focalLengthMm carry (`m?.focalLengthMm` — with the right m the live carries the
old segment’s focal; with m=null ours never carries it for camera-move holders).
**Fix sketch:** port `moveSegmentOf` verbatim onto ShowStore (needs `objects` + track character
kind; camera → `V2r` set, else `path|play`; covering find + `a[0]` fallback; use `yd`≡`itemDuration`),
and make `_replaceMove` + focus flows (P0-2/P0-3) call it.

### P0-2 — `focusOf` camera/walker branches: static first-match instead of playhead-covering; invented targetId fallback; extra aim gate
**Live:** `focusOf` @5473674 delegates:
```js
focusOf=e=>{const n=this.a.objects.peek()[e]?.kind;
  if(n==="camera")return this.a.cameraFocusId(e);
  if(!el(n))return null;
  const r=this.pendingWalkerFocus;
  return this.a.walkerFocusId(e)??(r?.id===e&&this.drawing.peek()?r.subjectId:null)}
```
`cameraFocusId` @5545617: `moveSegmentOf(trackIdOf(e), performanceTimeS.peek()) → Cit(r)`; `Cit`
@5523845:
```js
function Cit(t){return t.kind==="cam-path"?t.aim==="subject"?t.subjectId??null:null
  :t.kind==="cam-move"||t.kind==="cam-still"?t.subjectId??null:null}
```
(cam-move/cam-still take `subjectId` **directly**, no aim gate; cam-follow/cam-transform/cam-manual → null.)
`walkerFocusId` @5545745: covering item must be `kind==="path" && aim==="subject"` → subjectId.

**Ours** plan.js:1055–1069: `activeCamItem` = first item **in track order** with
`(kind cam-path|cam-move|cam-still) && aim==='subject' && subjectId`, then
`?? objects.get(e)?.targetId ?? null`; `activePathItem` = first `path && aim==='subject' && subjectId`.

**Divergences:** (a) ours ignores the playhead — a camera with a subject-aimed cam-path at 0–5 s
and a locked one at 5–10 s reports focus at all times (live: only while covering, first-item
fallback via moveSegmentOf); (b) ours demands `aim==='subject'` on cam-move/cam-still — the live
`Cit` reads `subjectId` directly, so a focus set onto a cam-still (exactly what live
`setCameraFocus` INSERTS — see P0-3) is invisible to our `focusOf` (no focus line, no
`stroke.focusId`, drawn path gets `aim:'locked'` instead of subject); (c) the `?? targetId`
fallback is a **port invention** (live `cameraFocusId` has no targetId path) — paired-target
cameras show a focus line and draw `aim:'subject', subjectId:<target>` where the live draws
`aim:'locked'`.
**Fix sketch:** port `cameraFocusId`/`walkerFocusId`/`Cit` on the shared `moveSegmentOf` (P0-1),
using `page.playheadS` as `performanceTimeS`; delete the targetId fallback.

### P0-3 — `toggleFocus` camera branch: whole `setCameraFocus` machine missing
**Live** `toggleFocus` @5473909 (camera path): `s = cameraFocusId(r)===e; a = s ?
clearFocus(r) : setCameraFocus(r,e); endEditGesture; !a&&!s && ot.warning(sDr())` (i18n AFs0db).
`clearFocus` @5474407: current focus → `foldResolvers().resolveAim(subject, t)` (runtime look
point) → `setCameraFocus(e, null, {lookingAt})`.
`setCameraFocus` @5544109 (verbatim, read in full):
```js
setCameraFocus=(e,n,r)=>{
  const s=this.objects.peek();
  if(s[e]?.kind!=="camera"||n!==null&&(n===e||!s[n]))return!1;
  const o=this.trackIdOf(e)??this.addPerformanceTrack(e); if(!o)return!1;
  const l=this.show.peek().tracks.find(y=>y.id===o).items,
        c=this.moveSegmentOf(o,this.performanceTimeS.peek()),
        d=c?.kind==="cam-path"||c?.kind==="cam-move"&&yP.includes(c.move);
  if(c&&!d&&c.kind!=="cam-still")return!1;               // refuse on follow/transform/manual
  const u=c?Cit(c):null;
  if(n===null){ if(!c||!u)return!1;
    const y=r?.lookingAt??this.subjectAimPoint(u,$6(c)); y&&this.keepLookOnClear(e,c,l,y); }
  if(c&&d)return this.setCameraItemFields(o,c.id,{...c.kind==="cam-path"?{aim:"subject"}:{},subjectId:n}),!0;
  if(c?.kind==="cam-still"&&n===null)return this.setCameraItemFields(o,c.id,{subjectId:null}),!0;
  const h=c?.startS??0,
        f=rx({...this.show.peek(),tracks:this.show.peek().tracks.filter(y=>y.id!==o)}).durationS,
        m=l.find(y=>y.startS>h)?.startS??1/0,
        g=Math.min(m,Math.max(f,h+(c?yd(c):sje("still")))),
        b={id:c?.id??an(),kind:"cam-still",startS:h,
           durationS:Math.max(Ije,g-h),
           ...c&&"focalLengthMm"in c&&c.focalLengthMm!==void 0?{focalLengthMm:c.focalLengthMm}:{},
           subjectId:n};
  return this.updateTrackItems(o,y=>[b,...y.filter(v=>v.id!==c?.id)]),!0};
```
`keepLookOnClear` @5545290: cam-still → `turnCameraToward(e, s)`; paired target → move target to
look point (`s$`/keepAimPoint) unless another subjectless item needs it; else
`updateObjectTransform(e,{lastAimPosition:s})`. Note **clearing** a cam-path focus leaves
`aim:"subject", subjectId:null` (the YN “subjectless” state → aims at the camera’s paired
target) — not `aim:"locked"`.

**Ours** plan.js:1083–1095: camera branch finds the first `cam-path` with anchors>1 and patches
`aim` only; if none found the gesture brackets **nothing** (complete no-op). Our
`setCameraFocus` (1091–1095, used by `deleteMove`) patches the cam-path or falls back to
`objects.update(camId,{targetId})` — a different mechanism.

**User-visible:** tap-to-focus (tap-or-draw probe OZt → `focus` intent) on a stock camera
(cam-still only) does **nothing** in ours; the live inserts a `cam-still` with `subjectId`
(focus works, focus line appears, subsequent drawn cam-path gets `aim:'subject'`). Clearing
focus doesn’t preserve the look, no failure toast.
**Fix sketch:** port `setCameraFocus`/`keepLookOnClear`/`clearFocus` into ShowStore using the
already-ported pieces: `setCameraItemFields` (store.js:718 — also add the live
`reaimCameraItem` follow-up when subjectId/aimOffsetUnits change: `reaimCameraItem` @5546190 →
`aimCameraAtSubject` for cam-move items), `subjectAimPoint` (store.js:609),
`_turnCameraToward` (store.js:631), `rx`≡`showDurationS`-over-other-tracks (see P0-2/P1-4 note),
`sje("still")=5`, `Ije=.1`, `yP = bP minus pan_sweep`. Then rewire `toggleFocus`,
`deleteMove`, and add the warning toast.

### P1-4 — endStroke does not reset the playhead/pose to rest
**Live:** `endStroke` @5472814 calls `this.a.stopPerformance()`; `stopPerformance` @5548587 =
`isPerformancePlaying.set(!1), performanceSeekS.set(null)`. The runtime clock tick (jGr @5696741,
tick @5705649) then takes the at-rest branch: `performanceTimeS.set(0)` + rig offsets at t=0 +
`ye()` — **all meshes reset to stored TRS** (unless livePlay). So after a stroke: playhead = 0,
scene at base poses.
**Ours** plan.js:1027: `this.a.page.stop()` → `playing=false` only; `playheadS` stays at the last
`seek(r)` (stroke end) and `_restEval` keeps re-posing the scene at that time. The drawn object
itself is restored by `tickDrawPreview` (main.js:311–318) but every OTHER character/camera
freezes mid-path and the timeline playhead sits at the stroke duration.
**Fix sketch:** mimic `stopPerformance`: `page.stop(); page.playheadS = 0; page.seekEpoch bump
optional; main._restEval = false; main._restSeekPending = false` (i.e. the same state loadScene
uses) so the steady-rest branch (`_restOffsetsT0`) takes over.

### P1-5 — “drawTarget changed → exit drawing” effect missing
**Live** rDr constructor @5462644:
```js
this.disposers.push(
  qt(()=>{this.drawTarget.get(),this.drawingFor.set(null)}),      // selection change exits draw mode
  qt(()=>{this.locked.get()&&(...cancel stroke/drawing + hideRehearseTip())}))
```
**Ours** plan.js:752 has only the locked disposer. Changing the selection while armed keeps
`drawingFor` set (stale) — the next pointerdown draws for the NEW selection while the pill still
says “Finish”. Live exits draw mode on any drawTarget change.
**Fix sketch:** in PlanStore ctor, track last drawTarget id on `objects.subscribe` and null
`drawingFor` when it changes (also call `hideRehearseTip()` in the locked disposer — P3).

### P1-6 — drawPreview ghost head-look: missing for humanoid; pitch-as-roll for simple_figure
**Live:** `z()` @5759598 (frame loop, every frame):
`Hie(mesh, worldPos, quatFromEuler(preview.rotation))` + `pe.look && kind==="simple_figure" &&
o$(mesh, kje(pe.look))` where `kje=EZt(yaw,pitch)` @5451876/5451988 =
`setFromEuler(Euler(pitch, yaw, 0, "YXZ")) → XYZ` ⇒ head rotation ≈ **(pitch, yaw, 0)**.
Humanoids: head-look goes through **rig offsets** — the `setRigOffsets` callback L @5760011:
`drawPreview.look && kind==="humanoid" && offsets.set(id, IZt(offsets, jZt(look)))` with
`jZt` = DEF-neck 40 % (Wat) / DEF-head 60 % of yaw and **negated** pitch.
**Ours** main.js:296–320: `tickDrawPreview` poses position (parent-aware) and
`m.rotation.set(...d.rotation)`; head: `if (d.look && m.userData.figure)
figure.head.rotation.set(0, yaw, pitch)` — pitch lands on the **Z axis (roll)**. The correct
conversion already exists in the port (figures.js `ezHeadRotation`, used correctly at
main.js:677 `[pitch, yaw, 0]`) but not here. Humanoid preview head-look is not applied at all
(evaluateAt’s headLooks only come from path `lookAt`, which doesn’t exist mid-stroke).
**Fix sketch:** simple_figure: `head.rotation.set(...ezHeadRotation(d.look.headYawRad,
d.look.headPitchRad))`; humanoid: during a stroke, merge `headLookOffsets(d.look)` into
`rigOffsets` for the drawn id (mirroring L/jZt, incl. the negated pitch + Wat split).

### P1-7 — plan canvas hidden during playback (planShown semantics)
**Live** `planShown = viewportMode==="plan" && mode==="edit" && !playSession` @5787136 —
`playSession` is only the humanoid play-item RECORD session (startPlaySession @5538643), NOT
performance playback. PlanView renders whenever planShown && stageView editor (stage page
@5599950). During playback the plan stays visible and animates; the WebGL render is skipped
(frame loop @5761887: `planShown||!pageLive → scene.updateMatrixWorld()`).
**Ours** plan.js:1361 `shown() = plan && edit && !page.playing` → the canvas+bar hide and
main.js:1033 falls through to `renderFrame()` (3D) whenever anything plays; the view “bounces”
to 3D and back.
**Fix sketch:** drop `!playing` from `shown()`; keep the render-skip branch as
`viewportMode==='plan' && mode==='edit' && !playSessionEquivalent` (ours has no play sessions,
so just plan && edit), moving `tickDrawPreview()` + `planView.tick()` into it unconditionally.

### P1-8 — toggleFocus walker branch: first-path-anywhere instead of playhead item; guards missing
**Live** `setWalkerFocus` @5545918:
```js
setWalkerFocus=(e,n)=>{const r=this.objects.peek();
  if(!el(r[e]?.kind)||n!==null&&(n===e||!r[n]))return!1;
  const s=this.trackIdOf(e),a=s?this.moveSegmentOf(s,this.performanceTimeS.peek()):void 0;
  return!s||a?.kind!=="path"?!1:(this.updatePathItemAim(s,a.id,n?"subject":"travel",n),!0)}
```
(`updatePathItemAim` @5542837 — note: switching to `travel` does **not** clear `subjectId`.)
Failing (no track / covering segment is a play item) → `pendingWalkerFocus = {id, subjectId}` so
the NEXT drawn path (endStroke → `stroke.focusId` ← focusOf ← pendingWalkerFocus) picks the
focus up.
**Ours** plan.js:1071–1082: finds the first `path` with anchors>1 anywhere in the track and
patches it (`{aim:'travel', subjectId:null}` on clear); `ok=true` whenever any path exists;
no self/missing-subject guards.
**Divergence:** multi-path walkers get the WRONG item patched; a walker mid-`play` gets its
first path patched instead of deferring to pendingWalkerFocus; stale-subjectId cleared (P3).
**Fix sketch:** port `setWalkerFocus` on the shared `moveSegmentOf` + `updatePathItemAim`
semantics; keep the `pendingWalkerFocus` deferral exactly (`l||o ? null : {id:n,subjectId:e}`).

### P1-9 — drawPreview rotation not parent-composed (Hie)
**Live** `Hie` @5445559: `parent.updateWorldMatrix(); pos = parent.worldToLocal(p);
quat = parent.getWorldQuaternion().invert().multiply(q)`.
**Ours** main.js:303–308: converts position via `worldToLocal` but sets
`m.rotation.set(...d.rotation)` — a WORLD euler written into LOCAL rotation. Ghost is
mis-rotated for objects inside rotated/scaled groups.
**Fix sketch:** compose through the parent world quaternion (three lines with
`parent.getWorldQuaternion`).

### P2 items

| # | item | live | ours | note |
|---|---|---|---|---|
| P2-1 | `_je`/driveMode duplicate stale | `_je` @5447451 + `wZt` @5447714 (chain item must be cam-manual-with-samples or cam-path-anchors≥2; `path-anchored` outcome) | plan.js:1129–1137 `driveMode` (kind list misses `cam-transform`, no wZt gate, no path-anchored) while manipulate.js:308–329 `_driveChainItem/_refusalReason` is the CORRECT port | delete plan.js driveMode, reuse manipulate’s; today mostly masked in `carryPaths` because `shiftPaths` no-ops without path items — except a camera covering cam-still/move/follow WITH an old path item in the track gets its old path shifted on translate (live: free move) |
| P2-2 | no focus-failure toast | `ot.warning(sDr())` (i18n AFs0db) @5474399 | none | add toast on failed setCameraFocus |
| P2-3 | stale “Finish” pill on Esc | reactive signals | push-based `_syncBar`; `stepBack` exits drawing without any store change → pill stays “Finish” until next selection change | sync bar on drawingFor changes (or in `_wireEscape`) |
| P2-4 | aim height uses local scale | `NP`→`VDe`→`uje({...obj, scale:ZoScale})` @5248332/5247952/5247757 (world-composed scale) | plan.js:1007–1024 `_heightOf` uses store-local `scale` | parented+scaled walkers/props aim slightly wrong; store.js `subjectHeightOffset` already correct |
| P2-5 | rehearse tip UI | `rehearseTip` consumed by the scene-node footer `uOa` (class `lOa.tip`), 4 s timeout | state + `_onTip` only, no visible UI | node-editor footer not ported; fine to note |
| P2-6 | `locked()` | `isPerformancePlaying || isRecording` @5466725 | `!!page.playing` (no recording in port); locked disposer also misses `hideRehearseTip()` | scope note |
| P2-7 | track creation guards | `addPerformanceTrack` (BHr) @5542786: `Xzt(kind) && !Xu && no track` | `_replaceMove` facade uses `ensureTrack` (no guards) | masked (drawTarget excludes targets; drawable kinds pass Xzt) |
| P2-8 | plan-bar gating | pill group renders when `drawTarget && !locked && !compiling` (sBr @5504086) | bar shown whenever plan shown; draw group always rendered | ours hides whole bar during playback instead (P1-7) |

### P3 / informational
- i18n strings are fetched at runtime (not in the bundle): pill labels (5TURvb draw, /n/vNv
  update, fI7ZNS finish, Vk78FE match-speed, 47jR/i delete), timer (mZjh1K/xMTvHz), camera label
  (aRvSeS — ours `"{label} · {h}m"`), focus line label (Fsd1Wl — ours "Focus"), tap tip (T2tcdy —
  ours "Focus on this?"), focus toast (AFs0db). Ours uses plausible guesses.
- `updatePathItemAim` keeps `subjectId` when switching to travel in the live; ours nulls it —
  behaviorally equivalent (gates check aim).
- Undo: live history is an open/recorded flag with `dropTopIfUnchanged` (beginGesture @5256604);
  ours is depth-counted with outermost snapshot (store.js:337–354). Both produce ONE undo entry
  per stroke (verified: endStroke brackets begin/end around the single replaceMove mutation).
- `onMoveDrawn`/`onHeightDrawn` are telemetry in the live (`recordMoveDrawn`, @5866022); ours
  are no-op hooks. `markAutosave` extras in ours are port additions (fine).
- person toggle: live passes context `"plan"` to `pickPersonKind`; ours doesn’t (no consumer
  difference found).
- Walker focus line while drawing + tap-or-draw tooltip offsets (+18,−44 = `hit` @5497911) match.
- `ensureTrack`/`addPerformanceTrack` id gen `an()` ≡ `crypto.randomUUID` — match.

---

## 4. Verified EXACT this round (no action)

- **Stroke lifecycle verbatim:** `startStroke` @5471039 (stroke shape, grab/pressAt, heightM =
  shown pose Y, `focusId = focusOf(target)`, `strokeClock = {nowS:0, ofS: rx(show minus this
  track).durationS}`, `seekPerformance(0)` — ours plan.js:970–978 identical incl. read-pose-
  before-seek order); `tickStroke` @5471607 (`startMs??=`, sample when `Δt≥VLr(.05) || pos
  changed`, `t: max(r, last.t)`, per-tick `seekPerformance(r)`, `drawPreview.set(previewPose)`,
  clock 0.1 s granularity) — ours 979–987; `drawFrame` @5470816 (tick + `{stroke, dimPathOf:
  drawing?target, focus}`) — ours 957–961; `previewPose` @5471962 (camera: `resolvers.aim`,
  kv lookAt, `eDr=.4` smoothstep slerp from startRotation; walker: zLr=.05 face-turn
  `[0,atan2(−s,−a),0]`, head-look `xM` + CZt eye height + NP aim height) — ours 988–1006 (only
  the NP scale edge P2-4 and head application P1-6 differ).
- **ofS:** `rx` @4319961 = `{durationS: max(0, …items.map(startS+yd))}` — our
  `restOfShowDurationS` (plan.js:962–968, `itemDuration`≡`yd` schema.js:16) is **exact**
  (resolves confirmed-finding #4: no gap/clip/take-range subtleties; yd = arc(MR(nx))/speed for
  path kinds else durationS).
- **Simplify pipeline:** Ait @5520872, xHr @5520413 (dwell ≥ gHr .25 s), wHr @5520574 (¼-smooth
  ×2 non-anchor pts, t re-zero), vHr @5519524 (min 3 samples + arc ≥ fHr .3 m; mHr=.7 dwell
  time re-spread; pace d=max(K2r 32, ceil(dur/bHr .1)+1), Tit=1e4 quantize, monotone clamp,
  pace[0]=0, pace[-1]=1; anchors ≥ yHr .2 m with exact-last-point force/pop) — plan.js:595–636
  byte-equivalent (the `[h]`-swallowing display artifact notwithstanding).
- **replaceMoveFromSamples** @5542981: guard `camera||Q0(kind)`; `mT` tangents at Y=Zo world Y;
  speed = `steady ? (camera?YZt=2:Htt=1.4) : max(Qae=.01, MR(nx)/durationS)`; `pace` only when
  !steady; id `an()`; startS `max(0,n)`; camera → `cam-path`, `aim = g?"subject":"locked"`,
  subjectId, focalLengthMm carry from replaced item; walker → `path`, humanoid gait JCe="walk",
  `el ? (g?{aim:"subject",subjectId:g}:{}) : {aim:"locked"}`; `updateTrackItems([new, ...w/o
  old])` — plan.js:648–663 exact except the moveSegmentOf input (P0-1).
- **Packing:** `lje` @5139472 ≡ `packItems` (schema.js:283) — sort by startS (stable), bump
  cursor, keep identity when unchanged. `yd` ≡ `itemDuration`.
- **Painter stroke pass:** SDr @5480631 — bg → grid → pools → non-char items → **paths (selected
  only, dimmed vDr=.5 when `id===dimPathOf`) + in-progress stroke ($Zt polyline + accent,
  lineWidth xDr=2.4, round caps)** → char items → group boxes → ADr focus → callout (suppressed
  only while an ACTIVE stroke: `s.size===1 && !e.stroke`) → marquee. Ours plan.js:384–415 exact;
  CDr @5483640, ADr @5483078 (dashed [2,4] line + wDr=14 ring + iit/lye=11/18 cross + label at
  +lye+2,−10) — ours 365–383 exact. No 3D dimming of other paths in either (2D-only dim).
  `dimPathOf` = drawTarget while in draw mode (both).
- **3D ghost plumbing:** the live poses the SAME mesh (`meshById`) each frame; no gait during
  the stroke (the drawn char’s track has no path item yet → idle clip; root overridden by the
  ghost); after endStroke the runtime walks it (gait + ground snap). Ours same flow.
- **Ground snap:** `ue` walker apply @5706965 region — `exactY ? y : backwardSeek ? groundY(x,
  y+Bne, z) ?? y : groundY(x, curY+Bne, z) → null?curY : zzt(curY,g,Xae) smoothed
  1−exp(−dt/Uzt)`; parent worldToLocal + parentYaw via YXZ; yaw `ztt` exact /
  `xM(...).bodyYawRad` − parentYaw / approach `Wzt(cur, want, g?π:A2r·dt)`; else backward-seek
  restores stored rotation. Constants Xae=.5, Uzt=.22, Bne=1.2, A2r=8 @3926059; zzt @3928463,
  Wzt @3928578. `walkableSurfaces` = floor + meshes whose kind ∉ {camera,target,spotlight,
  humanoid,simple_figure,group} @5752939 ≡ env.js:247. Ours main.js:556–603 + tracks.js
  approachAngle/stepClamp — exact. Walker path items: no heightCurve (cam-path only in live —
  `Q2r` @4318946, setPathHeightCurve @5540557), anchors Y ignored via ground snap (exactY=false
  for paths, =true for play) — ours matches (evalCharacterTrack exactY flags).
- **Character eval:** `eEe` @4320814 (first-motion-source start pose; carry end state; active:
  `khe` pace remap @4319124 with `held` → clip idle; gait default JCe; `$tt` lookAt
  {subjectId, sinceS:startS, atS:min(t,endS)}; play items at qA=20 Hz with `off` continuation
  eyr) — tracks.js:54–116 exact (incl. `pacedDistance` ≡ khe, curves.js:108).
- **Camera eval cam-path** @5429589: pace via khe, `heightCurve → h[1]=ZA(curve, e/n)`,
  aim subject → XN(resolvers.aim, $6 aimOffsetUnits) lookAt; travel → tangent·rye=5 lookahead +
  $6; locked keeps previous — tracks.js:318–334 exact. `XN` @4316220, `$6` @4316328.
- **resolvers W:** `t < playhead−ε → evaluated subject pose + NP; else mesh world + NP` (R9
  pixel-oracle-verified) — main.js:386–403.
- **kv** @4904662 ≡ plan.js:214 (lookAt + rotateY π). **xM** @5451532 ≡ plan.js:207.
- **aimCameraAtSubject** @5531472 (note: NOT 5547561 as the brief said — that offset is
  `duplicateItem`) — store.js:616–630 verbatim: `startS<s && Fp && !cam-still` guard, YN
  subjectless check, target move `s$`≡keepAimPoint, `turnCameraToward`≡cN+kv. MATCH.
- **deleteMove** @5469975 (first drawn move by startS, gesture bracket, removeItem, re-set
  focus if subject) — ours plan.js:940–951 matches except it calls our simplified
  setCameraFocus (P0-3).
- **Draw button/plan bar:** 3-state pill (draw/update/drawing), match-speed checkbox ONLY while
  drawing, delete pill in update state, person toggle when person && !drawing, stroke timer
  (nowS/ofS), zoom bar, camera pills — plan.js:1504–1592 matches the live RRr/LRr/sBr wiring
  (i18n wording unverifiable). Esc chain `stepBack` @5470670 (stroke→swallow; drawing→exit;
  selection→deselect) — ours matches. Bar is plan-view-only in both.
- **Tap-or-draw:** DLr stroke-start vs `OZt` probe @5457977 (single-selected camera/walker,
  topmost hit, other non-camera/target id), HLr → `focus` intent on <Qat release, hover tooltip
  at +18/−44 — ours verbatim (plan.js:500–504, 1489–1495).
- **Locked-disposer cancel** (drawing while playing refuses) — ours plan.js:752 ≈ live
  @5462644 disposer #2 (minus hideRehearseTip, P3).

---

## 5. Task-item answers (quick index)

1. Intent chain + constants — §2 (all exact).
2. startStroke/tickStroke/endStroke/previewPose — §4 (exact) + P1-4/P1-6/P2-4 deltas.
3. replaceMoveFromSamples — exact except moveSegmentOf (P0-1); packing/an()/focal carry/speeds/
   pace/gait/aim rules exact.
4. Focus flows — P0-2/P0-3/P1-8; `pendingWalkerFocus` lifecycle (set in toggleFocus walker
   branch on setWalkerFocus failure; cleared in toggleDrawing/stopDrawing/dispose) — ours
   matches the clear sites; OZt probe + ADr paint exact.
5. Stroke paint — exact (§4).
6. 3D side — P1-6/P1-9; ground snap exact; stroke renders per-rAF on the plan canvas in both
   (ours piggybacks the main loop, live has its own rAF — no behavioral difference); no 3D
   path-dimming in either.
7. Draw button/plan bar — matches (P2-8 gating, P2-3 stale pill); locked semantics P2-6.
8. Vertical anchoring — heightM = shown-pose Y at pointerdown (both); walker on props: ground
   raycast vs walkableSurfaces exact (§4); heightCurve is cam-path-only in both.
9. Timeline — new item renders with duration = arc/speed (matchDrawSpeed on ⇒ duration =
   samples’ last t by construction: speed = MR/durationS; off ⇒ steady speed re-derives
   duration, `pace` carried) — exact via itemDuration/lje. Playhead after stroke end: live
   resets to 0 + stored TRS, ours stays at stroke end (P1-4).
10. Undo — one entry per stroke in both (§P3).

## 6. Newer deployed bundle (`index-CaBu3A6T.js`, 13,507,616 chars)

Signature + identifier-normalized byte comparison of the whole draw-path core:
`moveSegmentOf` @5575262, `cameraFocusId` @5574604, `walkerFocusId` @5574732, `setWalkerFocus`
@5574905, `replaceMoveFromSamples` @5571968, `setCameraFocus` @5573096, `startStroke`
@5496484, `tickStroke` @5497052, `endStroke` @5498259, `previewPose` @5497407, `drawFrame`
@5496261, `Cit→xot` @5552679, `V2r→gvr` (Set @4325379), `Fp→Lp`, `el→Po`, `Q0→ag`,
`vHr→YVr`, `yP→DP` — **all
identical modulo minifier renames**; all constants re-verified by value
(GVr=.3,qVr=.7,ZVr=.25,KVr=.1,XVr=.2,yot=1e4; Git=40,fBr=.05,mBr=4e3,…; Nnt=1.4,kie=.01,Sie=4,H8=5;
fXt=2,…,lIe=.1; kvr=32; QHr=70°,Iqr=1.6; gvr Set; painter zBr=.5,rXt=2.4,WBr=14,Qit=11,Fye=18).

Differences in the newer deployment:
- **Autopan reworked** (`JLr`): deadzone `min(half·LLr(.8), half−DLr(28px))`, **quadratic**
  intensity ramp, a **250 ms edge-hold** (`HLr`) before any panning starts, speed `BLr=.6`
  (normalized × dimension), `edgeHeldMs` state on the plan state. Old: immediate linear
  `CLr=720 px/s` from an 80 % deadzone. ⇒ If the port wants to track the CURRENT live, the
  autopan needs a rewrite; against the DBE17t4T snapshot ours is correct.
- **New `keepCameraOn(e,n)`** method (after toggleFocus): gesture-bracketed
  setCameraFocus/clearFocus + warning — new UI hook (timeline/inspector), not in the old
  bundle.
- **Plan-canvas path editing**: new drag kinds `path-point|path-handle|path-tap` in the new DZt
  (`jKt`) + `nDr` handler, and new painter consts (GBr=5, qBr=6.5, Jit=4, ZBr=6) after l$=12 —
  anchor/handle editing on the plan canvas, not present in DBE17t4T.
- Label-declutter configs KHe/OLr (`neighbours:3, fill, maxPxPerM`) — new plan feature.

## 7. Questions for the orchestrator

1. **Snapshot policy:** the port targets DBE17t4T; the deployed app has moved (autopan rework,
   keepCameraOn, plan path editing). Should R14 fix the draw-path P0/P1s against DBE17t4T only
   (recommended — they are pure divergences in both snapshots), and track the newer autopan/
   path-editing as a separate work item?
2. **Clear-focus semantics:** the live leaves cam-path `aim:"subject", subjectId:null`
   (subjectless → aims at the camera’s paired target, with keepLookOnClear moving that target).
   Confirm we want that exact behavior (it is subtle and intentional-looking).
3. **i18n:** can we fetch the live locale JSON (ids 5TURvb, /n/vNv, fI7ZNS, Vk78FE, 47jR/i,
   mZjh1K, xMTvHz, aRvSeS, Fsd1Wl, T2tcdy, AFs0db) to pin the plan-bar strings, or keep the
   current guesses?
4. **P1-7 (plan shown during playback):** fixing `shown()` means the user watches playback on
   the 2D plan with the WebGL render paused — verify that is the desired product behavior
   (it is what the live does).
5. `updatePathItemAim` keeps a stale `subjectId` when switching a walker path to `travel` in
   the live — replicate exactly, or clear it (ours today)? (No behavioral gate reads it.)

## 8. Recommended fix order (R14 sketch)

1. ShowStore: verbatim `moveSegmentOf` (V2r / path|play split) — unblocks 2,3,5.
2. ShowStore: `cameraFocusId`/`walkerFocusId`/`Cit` (+ page.playheadS as performanceTimeS);
   rewire PlanStore.focusOf; delete targetId fallback.
3. ShowStore: `setCameraFocus`+`keepLookOnClear`+`clearFocus` (+reaim follow-up in
   setCameraItemFields); rewire toggleFocus both branches, deleteMove; add failure toast.
4. endStroke: stopPerformance-equivalent reset (playhead 0, `_restEval=false`).
5. PlanStore ctor: drawTarget-change → exit-drawing effect (+hideRehearseTip in locked path).
6. main.js tickDrawPreview: ezHeadRotation for simple_figure; humanoid rig-offset head-look;
   Hie-style parent quaternion compose.
7. shown()/main.js render gate: keep plan visible during playback (drop `!playing`).
8. Cleanup: delete plan.js `driveMode` (reuse manipulate.js `_refusalReason`), sync bar on
   drawingFor change, `_heightOf` world scale.
