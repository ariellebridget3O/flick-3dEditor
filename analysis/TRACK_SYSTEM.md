# flick.art 3D Stage — Track / Show / Animation Evaluation System

**Bundle analyzed**: `/home/z/flick-3dEditor/analysis/index-DBE17t4T.js` (13,483,704 bytes, one-line minified React+three.js build).
**Method**: static extraction by data-shape (minified names reshuffle between builds). Raw excerpts with byte offsets: `analysis/extracted/tracks_raw.js`. Scripts: `analysis/tmp_a/`.
**Prior audit cross-ref**: `/home/sync/flick-3dstage/docs/SCENE_FIDELITY_AUDIT.md` §1.4/§3 — see §14 of this doc for the name map and behavior changes.

All code below is de-minified reconstruction. Brackets shown normally; in `tracks_raw.js` they are `【】` to survive tooling. Semantics were verified by reading every call site of each function.

---

## 1. Data model

### 1.1 Show

```js
show = {
  name: string,                       // default "Show"
  range?: { startS: number, endS: number },   // take range, 2-decimal rounded, min gap 0.1 s
  tracks: [ Track ]
}
Track = { id: uuid, characterId: uuid /* object id, any non-target-referenced object */, items: Item[] }
```

- New scenes: `r6r({figure, camera, show})` creates simple_figure + camera at fixed poses + one orbit cam-move track; `aGt({show})` creates an empty scene. Both set `v: 10`, `recordAspect: "16:9"`.
- A track is owned by one object (`characterId`). `addPerformanceTrack(objectId)` requires: kind is a valid object kind (`Xzt` = `Q0(kind) || kind==="camera"` — 10 kinds: humanoid, simple_figure, cube, sphere, cylinder, prop, group, target, spotlight, camera), the object is **not used as an aim target** (`Xu(objects,id)` = kind==="target" && some camera has `targetId===id`), and no existing track for it.
- **Items are stored sorted and packed** — `lje()` (see §1.3) re-sorts by `startS` and bumps overlapping items to the end of the previous one. Items on a track are therefore strictly sequential and never overlap.

### 1.2 Show layout & duration (`rx`, old audit `nx`)

```js
function rx(show) {                                  // layout: attach endS to each item
  const tracks = show.tracks.map(r => ({
    trackId: r.id,
    characterId: r.characterId,
    startS: r.items[0]?.startS ?? 0,
    items: r.items.map(s => ({ item: s, startS: s.startS, endS: s.startS + yd(s) })),
  }));
  const durationS = Math.max(0, ...tracks.flatMap(r => r.items.map(s => s.endS)));
  return { tracks, durationS };
}
```

### 1.3 Item list normalizer (`lje`) — CRITICAL, not in old audit

```js
function lje(items) {
  let prevEnd = 0;
  return [...items].sort((a, b) => a.startS - b.startS).map(n => {
    const start = Math.max(n.startS, prevEnd);
    prevEnd = start + yd(n);
    return start === n.startS ? n : { ...n, startS: start };   // overlapping item is pushed after
  });
}
```
Every `updateTrackItems(trackId, fn)` in the store applies `fn` then `lje`. Consequence: writing `startS` directly is a *request*; the packer may move it later. UI drag uses the placement solver (`_ie`, §10.2) which avoids overlaps.

### 1.4 Item duration (`yd`, old audit `bd`)

```js
const Htt = 1.4;   // default speedUnitsPerS (m/s)
function yd(item) {
  return (item.kind === "path" || item.kind === "cam-path")     // g2(item)
    ? (item.anchors.length < 2 ? 0 : MR(nx(item.anchors)) / item.speedUnitsPerS)
    : item.durationS;
}
```
`MR(nx(anchors))` = polyline arc length (§3). So path/cam-path duration is **always derived**; `durationS` is ignored for them (cam-path validator even refuses to patch durationS: `OHr` skips `durationS` for `kind!=="cam-path"`… i.e. only non-cam-path kinds get duration patches — cam-path speed edits change duration implicitly).

### 1.5 Take range (`She`, old audit min-gap `Qae=0.1` — value unchanged, renamed `eie`)

```js
const eie = 0.1;
function tie(fromS, toS) { return toS - fromS >= eie - 1e-6; }
function She(show, totalDurationS) {
  const r = show.range;
  if (r) {
    const from = clamp(r.startS, 0, totalDurationS);
    const to   = clamp(r.endS,   0, totalDurationS);
    if (tie(from, to)) return { fromS: from, toS: to };
  }
  return { fromS: 0, toS: totalDurationS };
}
```
`setTakeRange({startS,endS})` rounds to 2 decimals, requires `tie`, stores `{startS, endS}` (persisted names are `startS/endS`; runtime/serializer expose `fromS/toS`).

### 1.6 Item-at-time (`_he`, name unchanged from audit) & current-subject helpers

```js
function _he(items, timeS) {          // "camera item at time" (with carry-through gaps)
  let n = null;
  for (const r of items)
    if (timeS < r.startS || (Fp(r) && (n = r), timeS < r.startS + yd(r))) break;
  return n;
}
function G2r(items, timeS) {          // subjectId the camera is aiming at, at timeS
  let n = null;
  for (const r of items)
    if (timeS < r.startS ||
        (r.kind === "cam-move" ? n = r.subjectId
       : r.kind === "cam-path"  ? n = (r.aim === "subject" ? r.subjectId : null)
       : r.kind === "cam-still" && r.subjectId && (n = r.subjectId),
         timeS < r.startS + yd(r))) break;
  return n;
}
function YN(item) {   // "needs a subject": cam-move (not pan_sweep) with null subjectId,
                      // or cam-path with aim==="subject" && null subjectId
function lq(cameraObject, items) { return cameraObject?.targetId ? items.some(YN) : false; }
```
Note `_he` only tracks **camera** items (`Fp`) but breaks on *any* active item.

---

## 2. Item kinds (14 current + 1 legacy) — full reference

Kinds sets:
```js
const V2r = new Set(["cam-still","cam-move","cam-path","cam-follow","cam-transform","cam-manual"]);
function Fp(item) { return V2r.has(item.kind); }                 // is camera item
const $2r = new Set(["rotate","revolve","scale","transform","rig-transform"]);
function aN(item) { return $2r.has(item.kind); }                 // is object-animation item
function g2(item) { return item.kind === "path" || item.kind === "cam-path"; }  // is path item
function Zzt(item){ return ["transform","rig-transform","cam-transform"].includes(item.kind); } // keyframed
function Vtt(item){ return item.kind==="path" ? item.anchors.length>=2
                    : item.kind==="play" ? item.samples.length>0 : false; }     // is motion source
```

| Kind | Fields (defaults) | Owner | Duration |
|---|---|---|---|
| `path` | `anchors:[{pos:[3],in:[3],out:[3]}]` (start with `anchors:[]`), `speedUnitsPerS` **1.4** (`Htt`; floor **0.01** `Qae`), `aim` `"travel"|"subject"|"locked"` (default `"travel"` via `??`), `subjectId?`, `aimOffsetUnits?`, `gait?` (`"walk_formal"|"walk"|"jog_fwd"|"sprint"`, default `"walk"` `JCe`) — gait only on humanoid tracks | person or any Q0 object (props/spotlights too) | derived: arclen/speed |
| `play` | `samples:[{p:[3],yaw,clip}]` (20 Hz), `keymap:{lmb\|rmb\|q\|e\|r\|f → clipId}` (`qzt`), `durationS` = samples.length/20 (set on finish) | humanoid only | stored |
| `clip` | `clip` (46-clip catalog `Lhe`), `durationS` default **5** (`N8`); on clip change default = catalog duration `IDe(clip)`; explicit edits clamp 0.1–120 | humanoid only | stored |
| `transform` | `keys:[{tS, position:[3], rotation:[3], scale:[3], headRotation?:[3]}]`, `durationS` default **4** (`Jae`) | any Q0 object | stored (extends to last key tS when keys added) |
| `rig-transform` | `keys:[{tS, joints: map<boneName,{position,rotation,scale}>}]`, `durationS` default 4 | humanoid only | stored |
| `rotate` ★new vs audit | `axis` `"x"|"y"|"z"` (default `"y"`), `degPerS` default **90** (`SHr`), `durationS` default 5 | any Q0 object | stored |
| `revolve` ★new | `centerObjectId` (default: first other non-spotlight object), `degPerS` default **60** (`THr`), `durationS` default 5 | any Q0 object | stored |
| `scale` ★new | `factor` (scale-up default **2** `AHr`, scale-down **0.5** `CHr`), `durationS` default 5 | any Q0 object | stored |
| `cam-still` | `subjectId?`, `focalLengthMm?` (default object's, else 50 `Hv`), `durationS` default 5 (`sje("still")`) | camera | stored |
| `cam-move` | `move` (`bP`: orbit/dolly_in/dolly_out/dolly_zoom/crane_up/crane_down/spiral/pan_sweep), `subjectId?`, `direction` `"cw"|"ccw"` (default `"ccw"`), `angleDeg`, `heightDeltaUnits`, `distanceScale`, `aimOffsetUnits?`, `focalLengthMm?`, `durationS` (preset default, see §7.2) | camera | stored |
| `cam-path` | `anchors` (start `[]`, speed default **2** `YZt` for cameras), `aim` (stored; default `"travel"`), `subjectId?`, `speedUnitsPerS`, `heightCurve?:[{u,heightM,in:[2],out:[2]}]`, `pace?: number[]`, `aimOffsetUnits?`, `focalLengthMm?` | camera | derived |
| `cam-follow` | `objectId` (followed object), `offset?: {position:[3], quaternion:[4]}` (object-local; default = captured from current camera, §7.6), `focalLengthMm?`, `durationS` (palette-created items: 5; **v4→v5 migrated shots**: `hrt` = max(show duration, 5)) | camera | stored |
| `cam-transform` | `keys:[{tS, position, rotation, focalLengthMm}]`, `durationS` default 4 | camera | stored |
| `cam-manual` | `samples:[{p:[3], q:[4] quat xyzw, fovDeg}]` (20 Hz), `shakeBaked?: true` (set when recorded during a take with rig shake), `durationS` = len/20 | camera | stored |
| *(legacy `cam-rail`)* | `a,b:[3]`, `followTarget:bool`, `followObjectId`, `durationS`, `speedUnitsPerS` → converted by `l6r` | camera | — |

★ `rotate`/`revolve`/`scale` are **not** in the old audit's kind table — they exist in this build as first-class items (action palette `YSr=["rotate","revolve","scale-up","scale-down","transform","rig-transform"]`, camera palette `xie=["still","path","follow","transform","manual",...bP]`).

### 2.1 Field validators / clamps (camera items, `OHr` = `setCameraItemFields`)

```js
const Ije = 0.1, QZt = 120;          // durationS clamp
const q_ = 14, WA = 200;             // focalLengthMm clamp (same values as old G_/zA)
const RHr = -15, FHr = 15;           // aimOffsetUnits clamp   ★ not in audit
const EHr = 15, jHr = 360;           // angleDeg clamp (angle moves) ★
const IHr = 0.5, MHr = 20;           // heightDeltaUnits clamp (height moves) ★
const NHr = 0.1, PHr = 4;            // distanceScale clamp (distance moves) ★

function OHr(item, patch) {
  let n = { ...item };
  if (patch.durationS != null && !isNaN(patch.durationS) && n.kind !== "cam-path")
    n.durationS = clamp(patch.durationS, 0.1, 120);
  if (patch.focalLengthMm !== undefined && n.kind !== "cam-transform" && n.kind !== "cam-manual")
    n.focalLengthMm = patch.focalLengthMm === null ? undefined : clamp(patch.focalLengthMm, 14, 200);
  if (patch.aimOffsetUnits != null && !isNaN(patch.aimOffsetUnits) && (n.kind==="cam-move"||n.kind==="cam-path"))
    n.aimOffsetUnits = clamp(patch.aimOffsetUnits, -15, 15);
  if (n.kind === "cam-move") {
    if (patch.move !== undefined && patch.move !== n.move) {       // switching preset resets its params
      const p = _1[patch.move];
      n = { ...n, move: patch.move, durationS: patch.durationS ?? p.durationS,
            angleDeg: p.angleDeg, heightDeltaUnits: p.heightDeltaUnits, distanceScale: p.distanceScale };
    }
    if (patch.subjectId !== undefined && yP.includes(n.move)) n.subjectId = patch.subjectId;
    if (patch.direction !== undefined) n.direction = patch.direction;
    if (patch.angleDeg != null && ... && YLe.includes(n.move)) n.angleDeg = clamp(patch.angleDeg, 15, 360);
    if (patch.heightDeltaUnits != null && ... && QLe.includes(n.move)) n.heightDeltaUnits = clamp(patch.heightDeltaUnits, 0.5, 20);
    if (patch.distanceScale != null && ... && JLe.includes(n.move)) n.distanceScale = clamp(patch.distanceScale, 0.1, 4);
  }
  if (n.kind === "cam-still" && patch.subjectId !== undefined)      // replace/remove subjectId
    n = patch.subjectId ? { ...n, subjectId: patch.subjectId } : omit(n, "subjectId");
  if (n.kind === "cam-follow") {
    if (patch.objectId !== undefined && patch.objectId !== n.objectId)  // changing target drops offset
      n = { ...omit(n, "offset"), objectId: patch.objectId };
    if (patch.offset !== undefined) n.offset = patch.offset;
  }
  if (n.kind === "cam-path") {
    if (patch.aim !== undefined) n.aim = patch.aim;
    if (patch.subjectId !== undefined) n.subjectId = patch.subjectId;
    if (patch.speedUnitsPerS != null && !isNaN(patch.speedUnitsPerS)) n.speedUnitsPerS = Math.max(0.01, patch.speedUnitsPerS);
  }
  return n;
}
```
Move-class lists: `YLe=["orbit","spiral","pan_sweep"]` (angle), `QLe=["crane_up","crane_down","spiral"]` (height), `JLe=["dolly_in","dolly_out","dolly_zoom"]` (distance), `yP = bP.filter(m => m !== "pan_sweep")` (subject moves).

Other validators: object items `clampObjectDuration` = clamp(0.1, 120); path speed edits `Math.max(0.01, v)`; `clip` duration clamp (0.1, 120) on explicit edit; `pace` `X2r`, `heightCurve` `Kzt` (§3.4); `gait` restricted to `Gzt` by UI.

---

## 3. Curve subsystem (paths)

### 3.1 Anchor tangent builder (`mT`, old audit `fT`)

```js
function mT(points) {                 // [[x,y,z],...] → anchors [{pos, in, out}]
  const n = points.length;
  if (n === 0) return [];
  if (n === 1) return [{ pos: [...points[0]], in: [0,0,0], out: [0,0,0] }];
  const dist  = (a,b) => Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]);
  const mul   = (v,k) => [v[0]*k, v[1]*k, v[2]*k];
  const sub   = (a,b,k) => [(a[0]-b[0])*k, (a[1]-b[1])*k, (a[2]-b[2])*k];
  const add   = (a,b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
  const out = [];
  for (let i = 0; i < n; i++) {
    const prev = points[i-1] ?? points[i], cur = points[i], next = points[i+1] ?? points[i];
    const h = dist(prev, cur) || 1;                 // chord to previous
    const f = dist(cur, next) || 1;                 // chord to next
    // chordal Catmull-Rom tangent:
    const m = i === 0     ? sub(next, cur, 1/f)                                // (next-cur)/|..|
            : i === n-1   ? sub(cur, prev, 1/h)                                // (cur-prev)/|..|
            : add(add(sub(next, cur, 1/f), sub(next, prev, -1/(h+f))), sub(cur, prev, 1/h));
              // middle: (next-cur)/f − (next-prev)/(h+f) + (cur-prev)/h
    out.push({
      pos: [...cur],
      in:  i === 0   ? [0,0,0] : mul(m, -h/3),   // handle = −tangent · (chord/3)
      out: i === n-1 ? [0,0,0] : mul(m,  f/3),
    });
  }
  return out;
}
```
Algebraically the middle tangent = `[h²·(next−cur) + f²·(cur−prev)] / (h·f·(h+f))` — the **chordal Catmull-Rom** tangent. First/last anchors get zero handles. Every structural edit (append/insert/delete anchor) rebuilds **all** tangents via `mT`; direct handle drags (`movePathHandle`) set `in`/`out` explicitly and mirror the opposite side (negated) unless `break` is set.

### 3.2 Anchor polyline (`nx`) + arc length (`MR`) + position (`oq`) + tangent (`Yae`)

```js
const Ptt = 12;                       // cubic-bezier samples per segment
const C2r = [0,0,-1];                 // fallback tangent (−Z)

function nx(anchors) {                // anchors → dense polyline (WeakMap-cached per anchor array)
  if (anchors.length < 2) return anchors.map(a => [...a.pos]);
  const pts = [[...anchors[0].pos]];
  for (let i = 0; i < anchors.length - 1; i++) {
    const s = anchors[i], a = anchors[i+1];
    const c1 = [s.pos[0]+s.out[0], s.pos[1]+s.out[1], s.pos[2]+s.out[2]];   // ctrl1 = pos+out
    const c2 = [a.pos[0]+a.in[0],  a.pos[1]+a.in[1],  a.pos[2]+a.in[2]];    // ctrl2 = pos+in
    for (let j = 1; j <= 12; j++) pts.push(E2r(s.pos, c1, c2, a.pos, j/12)); // cubic bezier
  }
  return pts;   // cached in WeakMap keyed by the anchors array
}
function MR(pts)  { let L=0; for (let i=1;i<pts.length;i++) L += xU(pts[i-1],pts[i]); return L; }
function oq(pts, d) {                  // position at arc distance d (linear within segments)
  if (!pts[0]) return [0,0,0];
  if (pts.length === 1 || d <= 0) return [...pts[0]];
  let r = d;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i-1], b = pts[i], seg = xU(a,b);
    if (r <= seg && seg > 0) { const f = r/seg; return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f]; }
    r -= seg;
  }
  return [...pts[pts.length-1]];
}
function Yae(pts, d) {                 // unit tangent at arc distance d (interp of adjacent segment tangents)
  const segT = i => { const a=pts[i-1], b=pts[i], L=xU(a,b); return L===0?null:[(b[0]-a[0])/L,(b[1]-a[1])/L,(b[2]-a[2])/L]; };
  const nextNZ = i => { for (let l=i;l<pts.length;l++){const t=segT(l);if(t)return t;} return null; };
  let s = Math.max(0, d), last = null;
  for (let i = 1; i < pts.length; i++) {
    const L = xU(pts[i-1], pts[i]); if (L === 0) continue;
    const u = segT(i); last = u;
    if (s <= L) {
      const nxt = nextNZ(i+1) ?? u, f = s/L;
      const v = [u[0]+(nxt[0]-u[0])*f, u[1]+(nxt[1]-u[1])*f, u[2]+(nxt[2]-u[2])*f];
      const n = Math.hypot(v[0],v[1],v[2]) || 1;
      return [v[0]/n, v[1]/n, v[2]/n];
    }
    s -= L;
  }
  return last ?? [0,0,-1];
}
// xU(a,b) = 3D distance; E2r(p0,c1,c2,p1,t) = cubic bezier point (t)
```
`j2r(anchors, point)` finds the nearest segment (XZ distance) for hit-testing.

### 3.3 Distance vs time with `pace` (`khe`)

```js
function khe(item, pts, elapsedS) {
  const base = elapsedS * item.speedUnitsPerS;              // uniform-speed distance
  const pace = item.pace, total = pace ? MR(pts) : 0;
  if (!pace || !(total > 0)) return { distance: base, held: false };
  const o = clamp(base/total, 0, 1) * (pace.length - 1);    // linear time → pace index space
  const l = Math.min(pace.length-2, Math.floor(o));
  const c = pace[l], d = pace[l+1];
  return { distance: (c + (d-c)*(o-l)) * total, held: c === d };
}
```
`pace` re-shapes timing: the array maps linear progress (as fraction of total time) to **distance fraction**; equal consecutive values = character/camera **holds** (characters switch to `idle` clip, `walking:false`). Validator:

```js
const K2r = 32;                        // min length when auto-generating pace (vHr)
function X2r(pace) {                   // pace validator (invalid → field dropped by b6r)
  return !Array.isArray(pace) || pace.length < 2 ? undefined
    : pace[0] === 0 && pace[pace.length-1] === 1 &&
      pace.every((v,i) => typeof v === "number" && v >= 0 && v <= 1 && (i === 0 || v >= pace[i-1]))
      ? pace : undefined;
}
```

### 3.4 heightCurve (`Kzt` validator, `ZA` evaluation, `Q2r` resample)

```js
const Y2r = 100;                       // heightM cap (old E2r=100)
const Ltt = v => Array.isArray(v) && v.length === 2 && v.every(Number.isFinite);
function Kzt(curve) {                  // validator: strict u 0→1 monotonic, heightM 0..100, in/out [2] with in[0]<=0<=out[0]
  return !Array.isArray(curve) || curve.length < 2 ? undefined
    : curve.every((p,i) => {
        if (!p || typeof p !== "object") return false;
        const {u, heightM, in: i_, out: o_} = p;
        return typeof u === "number" && (i===0 ? u===0 : u>curve[i-1].u) && (i<curve.length-1 || u===1)
          && typeof heightM === "number" && heightM >= 0 && heightM <= 100
          && Ltt(i_) && Ltt(o_) && i_[0] <= 0 && o_[0] >= 0;
      }) ? curve : undefined;
}
const Dtt = (a,b,c,d,t) => { const s=1-t; return s*s*s*a + 3*s*s*t*b + 3*s*t*t*c + t*t*t*d; }; // 1D bezier

function ZA(curve, u01) {              // height at normalized path position (0..1)
  const t = clamp(u01, 0, 1);
  let seg = 0;
  while (seg < curve.length-2 && t > curve[seg+1].u) seg++;
  const s = curve[seg], a = curve[seg+1];
  const c1u = Math.min(s.u + s.out[0], a.u);       // clamp ctrl u into [s.u, a.u]
  const c2u = Math.max(a.u + a.in[0],  s.u);
  let lo = 0, hi = 1;                               // 30-step bisection for bezier parameter
  for (let i = 0; i < 30; i++) { const m = (lo+hi)/2; Dtt(s.u, c1u, c2u, a.u, m) < t ? lo = m : hi = m; }
  const m = (lo+hi)/2;
  return Math.max(0, Dtt(s.heightM, s.heightM + s.out[1], a.heightM + a.in[1], a.heightM, m));
}

const Btt = 64;                        // resample count (same name as old build!)
function Q2r(item) {                   // plan-view resample: 64 points, y := heightCurve
  const pts = nx(item.anchors);
  if (item.kind !== "cam-path" || !item.heightCurve || pts.length < 2) return pts;
  const curve = item.heightCurve, dur = yd(item);
  return Array.from({length: 64}, (_, i) => {
    const u = i/63;
    const p = oq(pts, khe(item, pts, u*dur).distance);   // horizontal position at paced distance
    return [p[0], ZA(curve, u), p[2]];
  });
}
```
At evaluation time (`fFr` cam-path) the height override is applied directly: `pos[1] = ZA(heightCurve, elapsed/duration)` — note it uses **time fraction**, not arc fraction. `HHr(oldAnchors, newAnchors)` keeps heightCurve through anchor edits iff y values are unchanged.

### 3.5 Path position + yaw (`q2r`) and Euler construction (`Z2r`)

```js
function q2r(item, elapsedS, subjectPos) {   // subjectPos = resolved subject world pos (or null)
  const pts = nx(item.anchors);
  const { distance } = khe(item, pts, elapsedS);
  const pos = oq(pts, distance);
  const aim = item.aim ?? "travel";
  if (aim === "locked")  return { position: pos, yawRad: null, pitchRad: null };
  if (aim === "travel") {
    const tan = Yae(pts, distance);
    return { position: pos, yawRad: Math.atan2(-tan[0], -tan[2]), pitchRad: null };
  }
  if (!subjectPos) return { position: pos, yawRad: null, pitchRad: null };   // subject aim without subject
  const dx = subjectPos[0]-pos[0], dz = subjectPos[2]-pos[2];
  return { position: pos,
           yawRad: Math.atan2(-dx, -dz),
           pitchRad: Math.atan2(subjectPos[1]-pos[1], Math.hypot(dx, dz)) };
}
function Z2r(res, parentYawRad, preserveEuler) {   // → Euler [x,y,z] ("YXZ" applied by caller)
  if (res.yawRad === null) return null;            // keep current rotation
  const yaw = res.yawRad - parentYawRad;
  return preserveEuler
    ? (res.pitchRad !== null ? [res.pitchRad, yaw, 0] : [preserveEuler[0], yaw, preserveEuler[2]])
    : [0, yaw, 0];
}
```
Caller for path items (`ne`, §5.3): person + aim==="subject" → evaluate as `travel`, then split body/head look via `xM` (body takes the sub-70° part); spotlight → preserve current pitch/roll (only yaw changes); camera paths don't use this (handled in `fFr`).

---

## 4. Character (humanoid / simple_figure) evaluation

### 4.1 Track evaluation (`eEe`, old audit's `eEe` was the default-pose fn — name now means track eval)

```js
const JCe = "walk";                    // default gait
function tyr(showLayout, timeS) { return showLayout.tracks.map(t => eEe(t, timeS)); }

function eEe(track, timeS) {           // → character state at timeS
  const first = track.items.find(u => Vtt(u.item));          // first motion-source item
  let position = null, tangent = null, yawRad = null, exactY = false, lookAt = null;
  if (first) {
    if (first.item.kind === "path") position = [...first.item.anchors[0].pos];
    else { const s = first.item.samples[0]; position = [...s.p]; yawRad = s.yaw; exactY = true; }
  }
  let prevEnd = null;
  for (const u of track.items) {                              // u = {item, startS, endS}
    const h = u.item;
    if (!Vtt(h)) continue;
    // chaining offset: play items are relative to their own first sample, shifted by previous end
    const off = h.kind === "play" && prevEnd ? sub(prevEnd, h.samples[0].p) : [0,0,0];
    if (timeS >= u.endS) {                                    // item finished → carry end state
      if (h.kind === "path") {
        const pts = nx(h.anchors);
        position = [...h.anchors[h.anchors.length-1].pos];
        tangent = Yae(pts, MR(pts));                          // tangent at end
        yawRad = null; exactY = false;
        lookAt = $tt(h, u, timeS);                            // {subjectId, sinceS, atS} if aim==="subject"
      } else {                                                // play
        const s = h.samples[h.samples.length-1];
        position = add(s.p, off); yawRad = s.yaw; exactY = true; lookAt = null;
      }
      prevEnd = position; continue;
    }
    if (timeS >= u.startS && u.endS > u.startS) {             // item active
      if (h.kind === "path") {
        const pts = nx(h.anchors), { distance, held } = khe(h, pts, timeS - u.startS);
        return {
          characterId: track.characterId,
          clip: held ? "idle" : (h.gait ?? "walk"),
          clipTimeS: held ? 0 : timeS - u.startS,              // wall-clock; wrapped by clip duration later
          position: oq(pts, distance),
          tangent: Yae(pts, distance),
          walking: !held,
          yawRad: null, exactY: false,
          lookAt: $tt(h, u, timeS),
        };
      }
      if (h.kind === "play") {
        const i = Math.min(h.samples.length-1, Math.floor((timeS - u.startS) * 20));  // qA=20 Hz
        const s = h.samples[i];
        return {
          characterId: track.characterId,
          clip: s.clip,
          clipTimeS: timeS - u.startS,                         // continuous across clip switches
          position: add(s.p, off),
          tangent: null, walking: false,
          yawRad: s.yaw, exactY: true,                         // play y is used verbatim (no ground snap)
          lookAt: null,
        };
      }
    }
    break;                                                    // gap before this item → stop scanning
  }
  const clipItem = track.items.find(u => u.item.kind === "clip"
    && timeS >= u.startS && timeS < u.endS && u.endS > u.startS);
  return {
    characterId: track.characterId,
    clip: clipItem ? clipItem.item.clip : "idle",
    clipTimeS: clipItem ? timeS - clipItem.startS : 0,
    position, tangent, walking: false, yawRad, exactY, lookAt,
  };
}
function $tt(pathItem, u, timeS) {      // lookAt descriptor for path aim==="subject"
  return pathItem.aim !== "subject" || !pathItem.subjectId ? null
    : { subjectId: pathItem.subjectId, sinceS: u.startS, atS: Math.min(timeS, u.endS) };
}
function ztt(state) {                   // yaw resolution: exact (play) > tangent (path)
  return state.yawRad !== null ? { yawRad: state.yawRad, exact: true }
    : state.tangent ? { yawRad: Math.atan2(-state.tangent[0], -state.tangent[2]), exact: false }
    : null;
}
```
**Key semantics**: gait clip plays at **wall-clock rate** (`timeScale=1`, wrapped modulo clip duration — see §4.4); there is **no speed→rate retiming** (old audit's "playback rate = speed/gait-speed" hypothesis is disproved). Pace holds switch to `idle` with `clipTimeS=0`. Path anchors are **absolute**; play samples are **chained** (offset = previous motion item's end − own first sample). `clip` items only supply the clip when no motion item is active.

### 4.2 Per-frame application (`ue` in the performance controller) — ground snap, yaw smoothing, parents

```js
const Xae = 0.5;    // max instant ground step-up (m) / fall-off threshold
const Uzt = 0.22;   // ground-follow smoothing time constant (s)
const Bne = 1.2;    // ground raycast origin offset above target y (m)
const A2r = 8;      // max yaw turn rate (rad/s) while walking
function k(x, y, z) { ray.set(origin(x, y, z), (0,-1,0)); const hit = ray.intersectObjects(walkableSurfaces)[0]; return hit ? hit.point.y : null; }

function ue(timeS, dt) {
  headLooks.clear();
  const backwardSeek = lastTime === null || timeS < lastTime;  lastTime = timeS;
  const live = store.livePlay();
  const clips = new Map();                                      // → setPlaybackClips
  for (const st of tyr(layout, timeS)) {                        // layout = rx(show)
    if (live?.characterId === st.characterId) continue;         // live play session overrides
    const obj3d = meshById.get(st.characterId), obj = objects[st.characterId];
    if (!obj3d || !obj || !el(obj.kind)) continue;              // el(): humanoid || simple_figure
    if (obj.kind === "humanoid") clips.set(st.characterId, { clip: st.clip, timeS: st.clipTimeS });
    if (isMeshDragged(obj3d)) continue;
    const p = st.position; if (!p) continue;
    const curY = obj3d.getWorldPosition().y;
    let y;
    if (st.exactY) y = p[1];                                    // play: exact sample y
    else if (backwardSeek) y = k(p[0], p[1]+Bne, p[2]) ?? p[1]; // seek backward → snap instantly
    else {                                                      // forward: exp-smooth toward ground
      const g = k(p[0], curY+Bne, p[2]);
      if (g === null) y = curY;                                 // no ground below → keep
      else { const target = zzt(curY, g, Xae);                  // step-up clamp 0.5 m
             y = curY + (target - curY) * (1 - Math.exp(-dt/Uzt)); }
    }
    let parentYaw = 0;
    if (obj3d.parent && obj3d.parent !== scene) {               // parented: world→local + yaw comp
      v.set(p[0], y, p[2]); obj3d.parent.worldToLocal(v); obj3d.position.copy(v);
      parentYaw = eulerYXZ(parentWorldQuat).y;
    } else obj3d.position.set(p[0], y, p[2]);
    const yaw = ztt(st);
    if (yaw?.exact) obj3d.rotation.set(0, yaw.yawRad - parentYaw, 0);
    else if (yaw) {
      const aimTarget = st.lookAt ? resolveSubject(st.lookAt) : null;          // subject pos + NP height
      const ownAim = [p[0], y + 1.6*obj.scale[1], p[2]];                       // CZt=1.6 eye height
      const wantYaw = (aimTarget ? xM(yaw.yawRad, ownAim, aimTarget).bodyYawRad : yaw.yawRad) - parentYaw;
      const curYaw = Math.atan2(-fwd.x, -fwd.z);                                // current visual yaw
      const newYaw = Wzt(curYaw, wantYaw, poseNow ? Math.PI : A2r*dt);          // ≤8 rad/s (instant on poseNow)
      obj3d.rotation.set(0, newYaw, 0);
      if (aimTarget) headLooks.set(st.characterId, { target: aimTarget, sinceS: st.lookAt.sinceS });
    } else if (backwardSeek) obj3d.rotation.set(...obj.rotation);              // restore base on seek
  }
  if (live) clips.set(live.characterId, { clip: live.clip, timeS: null });     // real-time playback
  setPlaybackClips(clips);
  L(timeS);                                                      // objects + rigs + head look (§4.3)
}
```
`Wzt(from, to, maxStep)` = approach with shortest-angle wrap (§8.3). `zzt(y, g, 0.5)` = `g - y > 0.5 ? y : g`.

### 4.3 Non-person objects, rig-transform, head look (`L`)

```js
function L(timeS) {
  const rigOffsets = new Map();                                  // characterId → joints map
  for (const tr of layout.tracks) {
    const obj = objects[tr.characterId];
    if (!obj || !Q0(obj.kind)) continue;                         // Q0 = non-camera kinds
    const joints = q(tr, timeS);                                 // rig-transform joints at time (T2r equiv.)
    if (joints) rigOffsets.set(tr.characterId, joints);
    const o3d = meshById.get(tr.characterId);
    if (!o3d || isMeshDragged(o3d)) continue;
    if (obj.kind === "simple_figure")
      o$(o3d, Kae(tr.items.map(u => u.item), timeS, obj.headRotation, t => J(obj, tr, t)));  // headRotation
    T/E/A/C ← base TRS of obj;                                   // temps: position/rotation-euler/quaternion/scale
    const mode = Q(tr, timeS, !el(obj.kind));                    // apply items; "base"|"walk"|"fold"
    if (mode !== "base") {
      o3d.scale.copy(C);
      if (mode !== "walk") {                                     // "walk" position/yaw applied by ue()
        o3d.position.copy(T);
        o3d.rotation.set(...GA(quatEuler(A), E));                // unwrap euler continuity (flip π reps)
      }
    }
  }
  for (const [id, { target, sinceS }] of headLooks) {            // head look (registered by ue)
    const obj = objects[id], o3d = meshById.get(id);
    o3d.updateWorldMatrix(); const pos = worldPos(o3d);
    const split = xM(currentYaw(o3d), [pos.x, pos.y + 1.6*obj.scale[1], pos.z], target);
    if (obj.kind === "humanoid") {                               // head look → neck/head bone offsets
      if (id !== rigPoseObjectId()) rigOffsets.set(id, IZt(rigOffsets.get(id) ?? {}, jZt(split)));
      continue;
    }
    const tr = layout.tracks.find(t => t.characterId === id);
    o$(o3d, Kae(tr.items.map(u => u.item), timeS, obj.headRotation,
                t => t === timeS ? { sinceS, headRotation: kje(split) } : J(obj, tr, t)));
  }
  setRigOffsets(rigOffsets);
}
```

`Q(track, timeS, foldMode)` — object item application (shared TRS temps T/E/A/C):
```js
const EGr = Math.PI/180;
function Q(track, timeS, foldMode) {
  let mode = "base";
  for (const u of track.items) {
    const it = u.item;
    if (it.kind === "play" && !foldMode) {                        // play ignored for non-persons
      if (it.samples.length === 0) continue;
      if (timeS < u.startS || (mode = "walk", timeS < u.endS)) break;
      continue;
    }
    if (it.kind === "path") {
      if (it.anchors.length < 2) continue;
      if (timeS < u.startS || (mode = foldMode ? "fold" : "walk",
          ne(it, Math.min(timeS-u.startS, u.endS-u.startS), Math.min(timeS, u.endS), track.characterId),
          timeS < u.endS)) break;
      continue;
    }
    if (!aN(it) || it.kind === "rig-transform") continue;         // rig handled separately (q)
    if (timeS < u.startS) break;
    mode = "fold";
    const t = Math.min(timeS - u.startS, it.durationS);
    if (it.kind === "rotate")       quat.multiply(setFromAxisAngle(AXES[it.axis], it.degPerS * t * π/180));
    else if (it.kind === "scale")   scale.multiplyScalar(v2r(it.factor, t, it.durationS));  // 1→factor smoothstep
    else if (it.kind === "revolve") { resolveCenter(it.centerObjectId);                     // world center N
                                      const r = x2r(T−center, it.degPerS * t); T = center + r; }
    else if (it.kind === "transform") {
      const s = Bzt(it.keys, t);                                   // §8.1 key eval
      if (s) { T.set(...s.position); E.set(...s.rotation); A.setFromEuler(E); C.set(...s.scale); }
    }
    if (timeS < u.endS) break;
  }
  return mode;
}
```
`ne(pathItem, clampedElapsed, absTime, characterId)` — path item application: resolves subject (if the owner is a person with aim subject → force `travel` then split look via `xM`; spotlights aim with `NP(…, 0.5)`), calls `q2r`, world→local if parented, applies `Z2r` euler with parent-yaw compensation (spotlights preserve pitch/roll).

### 4.4 Humanoid clip playback (humanoid manager `b()`)

```js
const Sot = 0.25;                       // crossfade seconds
function applyPlaybackClips() {         // b(): d = setPlaybackClips map, object.animation = scene state
  for (const [id, rig] of rigs) {
    const playback = d.get(id), anim = objects[id]?.animation;    // {clip, playing}
    const clip = playback?.clip ?? anim?.clip;
    if (clip === undefined) continue;
    if (rig.currentClip !== clip) {                                // switch with crossfade
      const next = rig.actions.get(clip); if (!next) continue;
      const prev = rig.currentClip ? rig.actions.get(rig.currentClip) : undefined;
      prev?.fadeOut(0.25);
      next.reset().fadeIn(prev ? 0.25 : 0).play();
      rig.currentClip = clip;
    }
    const action = rig.actions.get(clip);
    if (action) {
      if (playback && playback.timeS !== null) {                   // performance: exact wrapped time
        const dur = action.getClip().duration;
        action.paused = true; action.time = dur > 0 ? ((playback.timeS % dur) + dur) % dur : 0;
      } else if (playback) action.paused = false;                  // live play: real time
      else { action.paused = !anim?.playing; if (!anim?.playing) action.time = 0; }  // object idle state
    }
  }
}
```
Rig offsets (`setRigOffsets`) are **additive** on top of the clip pose: per tick the manager restores each bone's clip-local TRS (`clipLocal` cache) then applies `aKt(bone, joint)`: `bone.position += joint.position; bone.quaternion *= Euler(joint.rotation); bone.scale *= joint.scale`. Humanoid model `/assets/humanoid-B4Yewrzp.glb`, scaled to height `jP=1.75`, material `M_Main` (roughness 1). Head-look offsets target bones `DEF-neck` / `DEF-head`.

### 4.5 Head rotation (simple_figure) — `Kae`/`w2r`

```js
function w2r(keys, tS, fallback) {       // interpolate headRotation between transform keys
  const first = keys.findIndex(k => k.headRotation);
  if (first < 0) return fallback;
  const ks = keys.flatMap((k, i) => k.headRotation ? [k] : i < first ? [{...k, headRotation: fallback}] : []);
  const a = ks[0];
  if (tS <= a.tS || ks.length === 1) return a.headRotation;
  const z = ks[ks.length-1];
  if (tS >= z.tS) return z.headRotation;
  let i = Math.max(1, ks.findIndex(k => k.tS >= tS));
  const p = ks[i-1], n = ks[i], span = n.tS - p.tS;
  return tA(p.headRotation, n.headRotation, span <= 0 ? 0 : (tS - p.tS)/span);   // plain lerp
}
function _2r(items, timeS) {            // latest transform item with headRotation keys, startS ≤ timeS
  let best = null;
  for (const it of items)
    if (it.kind === "transform" && it.keys.some(k => k.headRotation) && it.startS <= timeS
        && (!best || it.startS >= best.startS)) best = it;
  return best;
}
function Kae(items, timeS, fallback, subjectLookAtTime) {   // headRotation at time
  const item = _2r(items, timeS);
  const live = subjectLookAtTime?.(timeS);                   // {sinceS, headRotation} if looking at a subject NOW
  if (live && (!item || live.sinceS >= item.startS)) return live.headRotation;   // subject look wins
  if (!item) return fallback ?? [0,0,0];
  const t = Math.min(timeS - item.startS, item.durationS);
  const before = Kae(items.filter(i => i.startS < item.startS), item.startS, fallback, subjectLookAtTime); // recurse
  return w2r(item.keys, t, before);
}
```

### 4.6 Look-at body/head split (`xM`) — used by characters, cameras' subjects, spotlights

```js
const XOr = 70*π/180, YOr = 35*π/180;   // max head yaw / pitch
const CZt = 1.6;                        // own aim height factor (·scale.y)
const Wat = 0.4;                        // neck share of head look
function xM(bodyYawRad, ownAim, target) {
  const dx = target[0]-ownAim[0], dy = target[1]-ownAim[1], dz = target[2]-ownAim[2];
  const horiz = Math.hypot(dx, dz);
  if (horiz < 1e-6) return { bodyYawRad, headPitchRad: 0, headYawRad: 0 };
  const wantYaw = Math.atan2(-dx, -dz);
  const delta = wrapPi(wantYaw - bodyYawRad);
  const headYaw = Math.sign(delta) * Math.min(Math.abs(delta), XOr, Math.PI - Math.abs(delta));
  return { bodyYawRad: wrapPi(bodyYawRad + delta - headYaw),      // body turns by remainder beyond ±70°
           headPitchRad: clamp(Math.atan2(dy, horiz), -YOr, YOr),
           headYawRad: headYaw };
}
function EZt(yaw, pitch) { /* (headYaw,−headPitch) as YXZ quat → XYZ euler [x,y,z] */ }
function kje(split) { return EZt(split.headYawRad, split.headPitchRad); }
function jZt(split) {   // humanoid rig offsets: neck 40% / head 60% of the head rotation
  const j = w => ({ position: [0,0,0], rotation: EZt(split.headYawRad*w, -split.headPitchRad*w), scale: [1,1,1] });
  return { "DEF-neck": j(0.4), "DEF-head": j(0.6) };
}
```
Subject aim height: `NP(subjectId, objects, fraction=MIr=0.7)` = `minY − worldY + fraction · max(0, maxY − minY)` from the subject's world bounds (`VDe`: persons = 1.75·scale.y tall; props = catalog dims·scale; groups = children bounds; target/spotlight = 0). So cameras/characters aim **70% up** the subject's bounds; spotlights use the middle (`NIr=0.5`); a character's *own* head point is `y + 1.6·scale.y`.

---

## 5. Clip catalog (`Lhe`, old `Fhe`) — 46 clips, durations identical to audit

```
a_tpose .167   crouch_fwd 2    crouch_idle 2.917  dance 1        death01 2.375
driving 1.667  fixing_kneeling 5.167   hit_chest .333  hit_head .417
idle 2.5       idle_talking 2.917      idle_torch 1.25  interact 2
jog_fwd .917   jump 2.5        jump_land 1.25   jump_start 1.333
pickup_table .833
pistol_aim_down .167  pistol_aim_neutral .167  pistol_aim_up .167
pistol_idle 1.667  pistol_reload 1.667  pistol_shoot .625
punch_cross 1  punch_enter .833  punch_jab .833  push 2.667
roll 1.458     roll_rm 1.458
sitting_enter 1.292  sitting_exit 1  sitting_idle 1.667  sitting_talking 2.917
spell_simple_enter .5  spell_simple_exit .417  spell_simple_idle 2.083  spell_simple_shoot .5
sprint .667    swim_fwd 1.333   swim_idle 3.333
sword_attack 1.5  sword_attack_rm 1.5  sword_idle 1.667
walk 1.333     walk_formal 1.333
```
`XSr = new Map(Lhe.map(c => [c.id, c.durationS]))`; `IDe(id) = XSr.get(id) ?? 1`. Selectable list `vGt` excludes `a_tpose`. Gait list `Gzt = ["walk_formal","walk","jog_fwd","sprint"]`, default `JCe = "walk"`.

---

## 6. Play-mode recording (the `play` item source) — driver `aqr`

Pointer-locked third-person session over a `play` item on a humanoid track (`startPlaySession(trackId,itemId)`).

Constants: walk **1.6** m/s (`zGr`), sprint **4.2** (`WGr`), crouch **0.7** (`GGr`), gravity **18** (`qGr`), jump velocity **6** (`ZGr`), mouse sens **0.0025** rad/px (`Oot`), pitch clamp **−0.35…1.25** rad (`KGr/XGr`), yaw turn rate **12** rad/s (`eqr`), collision radius **0.3** (`Dot`), horizontal probe heights **[0.6, 1.3]** (`tqr=[Xae+0.1, 1.3]`), max slide iterations **2** (`nqr`), recording cap **120 s** (`rqr`, → 2400 samples), buttons `{0:"lmb", 2:"rmb"}` (`sqr`).

- Input: WASD (+shift sprint, "c" crouch toggle, space jump, Enter toggles recording, Esc stops session); q/e/r/f/lmb/rmb trigger `keymap` clips for the clip's catalog duration (`{clip, untilS: t+IDe(clip)}`).
- Movement: camera-relative, normalized; collision via 2-height raycasts + `I2r` slide (advance up to hit, slide along normal).
- Ground: raycast down from `y+1.2`; grounded if within **0.5** (`Xae`); step-up clamp 0.5, exp smoothing τ=**0.22** (`Uzt`); falls with gravity; jump sets vy=6.
- Clip state machine: `keymap-clip ? keymap-clip : grounded ? (crouch ? (moving?"crouch_fwd":"crouch_idle") : (moving ? (sprint?"sprint":"walk") : "idle")) : "jump"`.
- Follow camera: from head (`+1.4` `YGr`) along view dir, clamped `max(hit−0.2, 0.6)`…`3.4` (`QGr/JGr/Lot`), lookAt head.
- Sampling at **20 Hz** (`qA`): first sample immediately on record start, then every 1/20 s: `samples.push({p:[x,y,z], yaw: rotation.y, clip})`; auto-stops at 120 s. `finishPlayRecording(samples)` writes `{...item, samples, durationS: samples.length/20}`.

## 6b. cam-manual recording — manual flight (`JUr`) and path conversion (`vHr`)

- `startManualFlight(trackId, itemId)` on a cam-manual item in camera mode; while a **take is rolling** (`isTakeRolling()`), the main camera pose is sampled at 20 Hz: `{p:[x,y,z], q:[x,y,z,w], fovDeg: BU(store)}` where `BU = Z_(focalLengthMm, recordAspect)`. On finish: `{...item, samples, durationS: len/20, shakeBaked: true}` — `shakeBaked` means live shake is skipped for this item (`z2r` + `ie()`), because the recorded samples already contain the rig shake.
- **Convert flight → cam-path** (`replaceMoveFromSamples(objectId, startS, samples{x,z,t}, {steady, focusId})`): `vHr` fits the samples:
  - Reject if <3 samples or path <**0.3 m** (`fHr`).
  - Find stationary runs (same x,z for ≥**0.25 s** `gHr`) → keep-set; smooth x/z 2 passes of kernel `[1,2,1]/4` skipping kept samples; recompute cumulative arc length (`Ait`).
  - Within each stationary segment, re-time toward arc-length-proportional time by **0.7** (`mHr`), monotonic.
  - Build **pace** array of length `max(32, ceil(duration/0.1)+1)` (`K2r`, `bHr`): distance fraction at uniform time steps, rounded to 4 decimals, monotonic-clamped, first=0 last=1.
  - Simplify points: keep first, then any sample ≥**0.2 m** (`yHr`) from last kept; drop near-duplicate before the final point; append final.
  - Result `{points, pace, durationS}` → anchors = `mT(points.map(([x,z]) => [x, y, z]))` (y = object's current y); `speedUnitsPerS = steady ? (camera ? 2 : 1.4) : max(0.01, arclen/durationS)`; camera → `cam-path` (aim subject if focusId else locked, inherits focalLengthMm); person → `path` (gait "walk", aim subject if focusId); others → aim locked. Replaces the current move segment; drops `pace` when `steady`.

---

## 7. Camera item evaluation

### 7.1 fov (`Z_`), aspect table, focal clamps

```js
const Lzt = 35;                                    // full-frame sensor width (mm)
const XCe = aspect => 35 / Math.max(aspect, 1);    // vertical half-sensor
function Z_(focalLengthMm, aspect = 16/9) {        // vertical fovDeg
  return 2 * Math.atan(XCe(aspect) / 2 / focalLengthMm) * 180/Math.PI;
}
const q_ = 14, WA = 200;                           // focalLengthMm clamps
const Zae = [ {key:"16:9",aspect:16/9,width:1920,height:1080}, {key:"9:16",aspect:9/16,width:1080,height:1920},
              {key:"1:1",aspect:1,width:1080,height:1080}, {key:"4:3",aspect:4/3,width:1440,height:1080},
              {key:"1.85:1",aspect:1.85,width:1920,height:1038}, {key:"2.39:1",aspect:2.39,width:1920,height:804} ];
```

### 7.2 cam-move presets (`_1`, old `w1`) and easing

```js
const bP = ["orbit","dolly_in","dolly_out","dolly_zoom","crane_up","crane_down","spiral","pan_sweep"];
const _1 = {
  orbit:      { durationS: 8, angleDeg: 360, heightDeltaUnits: 0, distanceScale: 1 },
  dolly_in:   { durationS: 4, angleDeg: 0,   heightDeltaUnits: 0, distanceScale: .5 },
  dolly_out:  { durationS: 5, angleDeg: 0,   heightDeltaUnits: 0, distanceScale: 2 },
  dolly_zoom: { durationS: 4, angleDeg: 0,   heightDeltaUnits: 0, distanceScale: .5 },
  crane_up:   { durationS: 5, angleDeg: 0,   heightDeltaUnits: 3, distanceScale: 1 },
  crane_down: { durationS: 5, angleDeg: 0,   heightDeltaUnits: 3, distanceScale: 1 },   // sign flips in code
  spiral:     { durationS: 8, angleDeg: 180, heightDeltaUnits: 3, distanceScale: 1 },
  pan_sweep:  { durationS: 6, angleDeg: 90,  heightDeltaUnits: 0, distanceScale: 1 },
};
function eDe(t) { const e = clamp(t, 0, 1); return e*e*(3 - 2*e); }   // smoothstep (old rDe; YCe is a twin)
const s2r = 10, a2r = 120;                                            // dolly_zoom fov clamp (deg) ★
function i2r(fovDeg) { return clamp(fovDeg, 10, 120); }
```

### 7.3 cam-move math (`KCe`) — exact

```js
function KCe({ kind, t, start, target, direction, baseFovDeg, angleDeg, heightDeltaUnits, distanceScale }) {
  const p = _1[kind];
  const ang = (angleDeg ?? p.angleDeg) * Math.PI/180 * (direction === "ccw" ? 1 : -1);
  const dh  = heightDeltaUnits ?? p.heightDeltaUnits;
  const ds  = distanceScale  ?? p.distanceScale;
  const a   = eDe(t);                                  // eased progress 0..1
  const [ox,oy,oz] = start, [tx,ty,tz] = target;
  switch (kind) {
    case "crane_up": case "crane_down": {
      const dy = (kind === "crane_up" ? 1 : -1) * dh * a;
      return { position: [ox, oy + dy, oz], lookAt: target, fovDeg: baseFovDeg };
    }
    case "dolly_in": case "dolly_out": case "dolly_zoom": {
      const fx = ox-tx, fy = oy-ty, fz = oz-tz, dist = Math.hypot(fx,fy,fz);
      if (dist === 0) return { position: start, lookAt: target, fovDeg: baseFovDeg };
      const nd = dist * (1 + (ds-1)*a);                 // distance ×(1→ds)
      const k = nd/dist;
      const pos = [tx + fx*k, ty + fy*k, tz + fz*k];
      if (kind !== "dolly_zoom") return { position: pos, lookAt: target, fovDeg: baseFovDeg };
      const half = baseFovDeg/2 * Math.PI/180;          // dolly zoom: keep subject size
      const newHalf = Math.atan(dist * Math.tan(half) / nd);
      return { position: pos, lookAt: target, fovDeg: clamp(2*newHalf*180/Math.PI, 10, 120) };
    }
    case "orbit": case "spiral": {
      const r = Math.hypot(ox-tx, oz-tz);               // horizontal radius (constant)
      const ang2 = Math.atan2(oz-tz, ox-tx) + ang*a;
      const y = oy + (kind === "spiral" ? dh*a : 0);
      return { position: [tx + Math.cos(ang2)*r, y, tz + Math.sin(ang2)*r], lookAt: target, fovDeg: baseFovDeg };
    }
    case "pan_sweep": {                                  // rotate lookAt direction around Y
      const fx = tx-ox, fy = ty-oy, fz = tz-oz;
      if (fx === 0 && fz === 0) return { position: start, lookAt: target, fovDeg: baseFovDeg };
      const b = ang*a, c = Math.cos(b), s = Math.sin(b);
      return { position: start,
               lookAt: [ox + fx*c + fz*s, oy + fy, oz - fx*s + fz*c],
               fovDeg: baseFovDeg };
    }
  }
}
```
(The 2D plan canvas has a parallel variant `y2r` returning position only, spiral sign flipped.)

### 7.4 The dispatcher (`fFr`) and camera object eval (`dZt`) — exact

```js
const hFr = 0.45;   // cam-follow blend-in seconds
const rye = 5;      // cam-path "travel" aim look-ahead distance (m)
const uFr = new Quaternion();  // identity

function fFr(item, elapsedS, durationS, ctx) {
  const out = ctx.out;                                   // {position: Vector3, quaternion, fovDeg}
  const absT = item.startS + elapsedS;
  const p = durationS > 0 ? Math.min(1, elapsedS/durationS) : 1;
  const focal = item.focalLengthMm !== undefined ? item.focalLengthMm : ctx.base.focalLengthMm;
  const fovDeg = Z_(focal, ctx.aspect);
  switch (item.kind) {
    case "cam-still": {
      out.fovDeg = fovDeg;
      const subj = item.subjectId ? XN(item, ctx.resolvers.resolveAim, absT) : null;
      if (subj) oL(out.quaternion, [out.position.x, out.position.y, out.position.z], subj);  // look at subject
      return;
    }
    case "cam-move": {
      const startPos = [out.position.x, out.position.y, out.position.z];        // state so far (base or prev item)
      const target = item.move === "pan_sweep"
        ? pFr(out.position, out.quaternion)                                      // 1 m ahead of current forward
        : XN(item, ctx.resolvers.resolveAim, absT);                              // subject (+aimOffsetUnits) or camera target object
      if (!target) { out.fovDeg = fovDeg; return; }                              // no subject → no-op
      const h = { kind: item.move, start: startPos, target, direction: item.direction,
                  baseFovDeg: fovDeg, angleDeg: item.angleDeg,
                  heightDeltaUnits: item.heightDeltaUnits, distanceScale: item.distanceScale };
      const end = KCe({ ...h, t: p });
      out.position.set(...end.position);
      const startState = p > 0 ? KCe({ ...h, t: 0 }) : end;
      oL(BY, startState.position, startState.lookAt);              // qStart
      nye.copy(BY).invert().multiply(out.quaternion);              // correction = qStart⁻¹ · qPrev
      nye.slerp(uFr, eDe(p));                                      // fade correction to identity (smoothstep)
      oL(BY, end.position, end.lookAt);                            // qEnd
      out.quaternion.copy(BY).multiply(nye);                       // q = qEnd · correction
      out.fovDeg = end.fovDeg;
      return;
    }
    case "cam-path": {
      out.fovDeg = fovDeg;
      if (item.anchors.length < 2) return;
      const pts = nx(item.anchors);
      const { distance } = khe(item, pts, elapsedS);
      const pos = oq(pts, distance);
      if (item.heightCurve) pos[1] = ZA(item.heightCurve, durationS > 0 ? elapsedS/durationS : 1);
      out.position.set(pos[0], pos[1], pos[2]);
      if (item.aim === "subject") {
        const subj = XN(item, ctx.resolvers.resolveAim, absT);
        if (subj) oL(out.quaternion, pos, subj);
      } else if (item.aim === "travel") {
        const tan = Yae(pts, distance);
        oL(out.quaternion, pos, [pos[0]+tan[0]*5, pos[1]+tan[1]*5 + (item.aimOffsetUnits||0), pos[2]+tan[2]*5]);
      }   // "locked": keep base/previous orientation
      return;
    }
    case "cam-follow": {
      const subj = item.objectId ? ctx.resolvers.resolveFollowObject(item.objectId, absT) : null;
      if (subj) {
        const defOff = item.offset ? null : lFr(item, ctx, out);   // capture offset from current pose if absent
        const off = item.offset ?? defOff;
        if (off) {
          const blend = defOff ? eDe(Math.min(elapsedS / Math.min(0.45, durationS), 1)) : 1;  // 0.45 s ease-in
          prevPos.copy(out.position); prevQuat.copy(out.quaternion);
          subjPos.set(...subj.position); subjQuat.set(...subj.quaternion);
          out.position.set(...off.position).applyQuaternion(subjQuat).add(subjPos);
          offQuat.set(...off.quaternion);
          out.quaternion.multiplyQuaternions(subjQuat, offQuat);
          if (blend < 1) { out.position.lerpVectors(prevPos, out.position, blend);
                           out.quaternion.copy(prevQuat).slerp(out.quaternion, blend); }
        }
      }
      out.fovDeg = fovDeg;
      return;
    }
    case "cam-transform": {
      const k = cZt(item.keys, elapsedS);                          // §8.2
      if (!k) return;
      out.position.set(...k.position);
      out.quaternion.setFromEuler(new Euler(...k.rotation));
      out.fovDeg = Z_(k.focalLengthMm, ctx.aspect);
      return;
    }
    case "cam-manual": {
      if (item.samples.length === 0) return;
      const i = Math.min(item.samples.length-1, Math.floor(elapsedS * 20));   // 20 Hz nearest sample
      const s = item.samples[i];                                  // NO interpolation: nearest sample
      out.position.set(...s.p); out.quaternion.set(...s.q); out.fovDeg = s.fovDeg;
      return;
    }
  }
}

function dZt({ base, out, items, timeS, aspect, resolvers }) {
  out.position.set(...base.position);
  out.quaternion.setFromEuler(new Euler(...base.rotation));
  out.fovDeg = Z_(base.focalLengthMm, aspect);
  let any = false;
  for (const item of items) {
    if (!Fp(item)) continue;
    if (timeS < item.startS) break;
    any = true;
    const dur = yd(item);
    fFr(item, Math.min(timeS - item.startS, dur), dur, { base, out, timeS, aspect, resolvers, items });
    if (timeS < item.startS + dur) break;      // stop at the item containing timeS (earlier items re-applied clamped)
  }
  return any;
}
```
Helpers: `oL(quat, eye, target)` = `quat.setFromRotationMatrix(Matrix4.lookAt(eye, target, (0,1,0)))`; `XN(item, resolveAim, t)` = `resolveAim(item.subjectId || null, t)` then `+[0, aimOffsetUnits||0, 0]`; `lFr(item, ctx, out)` = default follow offset = `inv(subjectQuat) · (camPos − subjPos)` / `inv(subjectQuat) · camQuat` at `item.startS`.

**Resolvers** (camera controller `W(cameraId, timeS)`):
```js
resolveAim: (subjectId, atS) => {
  if (subjectId) {
    if (atS > timeS + 1e-6) {                       // future time → evaluate playback pose
      const pose = playback.objectPoseAt(subjectId, atS);      // full character/object state at time
      if (pose) return [pose.position[0], pose.position[1] + NP(subjectId, objects), pose.position[2]];
    }
    return currentWorldPos(subjectId) + [0, NP(subjectId, objects), 0];     // live mesh position
  }
  return cameraTargetLine(cameraId)?.target ?? null;             // camera's targetId object
},
resolveFollowObject: (objectId, atS) => atS > timeS + 1e-6
  ? playback.objectPoseAt(objectId, atS)                          // {position, quaternion}
  : { position: worldPos(mesh), quaternion: worldQuat(mesh) },
```
Note `cam-move`/`cam-still` with **no** subjectId aim at the camera object's **target object** (`targetId`); if that is missing too, the item is a no-op (fov only).

### 7.5 Camera base pose

`ce(cameraId, out)`: base = world TRS of the camera object (`Zo`), **except** when not performing and a live mesh exists — then base = the mesh's current world pose (so hand-moved cameras animate from where you left them). Items = `U6(store, cameraId)` (track items by characterId). During preview/record the marker mesh follows the evaluated pose; `filmingCameraId` uses the main renderer.

### 7.6 Camera shake (applied outside `dZt`)

Presets `d2r` (old `$br`): subtle {posUnits .005, rotDeg .15}, medium {.015, .4}, heavy {.03, .9}. Three sines `u2r` (old `Vbr`) = [{freqRatio 1, w .55}, {2.618, .3}, {6.854, .15}], phase offset per axis index `i·2.399` (golden angle); pos freqs `h2r=[.43,.53,.61]`, rot freqs `p2r=[.47,.59,.71]`, pos seeds `f2r=[0,1.7,3.4]`, rot seeds `m2r=[5.1,.9,2.6]` — identical values to the audit. `Dzt({t, intensity})` → {positionOffset (camera-local, applied via quaternion), rotationOffsetDeg}. Stride (rig `run`) = `g2r` walk-bob with phase advance `(1.6+1.4·ramp)·dt` (`iEr`; ramp over 3 s, floor 0.05 m/s, cap 15 m/s). Camera rigs `gq` (name unchanged): tripod(0 m/s, off), gimbal(1.8, off), steadicam(1.8, subtle, turnRoll .06, strafeRoll .04), handheld(1.8, medium), run(5, stride), drone(7.5, off, level=false, .2/.12) — identical to audit; speed steps `HGt=[.3,.6,.9,1.2,1.8,2.4,3.6,5,7.5,11,16,24,36,50]`, pan steps `[5,10,15,20,30,45,60,90]`, default pan 20°/s. In camera mode the rig shake uses ground speed measured from the fly camera position deltas.

---

## 8. Keyframe evaluation (transform / rig-transform / cam-transform)

### 8.1 `transform` keys (`Bzt`) — plain lerp, angle-blind

```js
function Bzt(keys, tS) {
  if (keys.length === 0) return null;
  const first = keys[0];
  if (tS <= first.tS || keys.length === 1) return {position: first.position, rotation: first.rotation, scale: first.scale};
  const last = keys[keys.length-1];
  if (tS >= last.tS) return {position: last.position, rotation: last.rotation, scale: last.scale};
  let i = keys.findIndex(k => k.tS >= tS); if (i <= 0) i = 1;
  const a = keys[i-1], b = keys[i], f = (b.tS-a.tS) <= 0 ? 0 : (tS-a.tS)/(b.tS-a.tS);
  return { position: tA(a.position, b.position, f),          // componentwise lerp
           rotation:  tA(a.rotation,  b.rotation,  f),        // linear (no angle wrap!)
           scale:    tA(a.scale,    b.scale,    f) };
}
```
Rotation continuity is instead guaranteed **at write time**: migration v7→v8 (`p6r`) unwraps stored key rotations per axis (each key rotation moved to within π of the previous), and the runtime `GA(eulerA, eulerB)` picks the flipped-equivalent Euler (`[x,y,z]` vs `[x±π, π−y, z±π]`) nearest the target when applying folded quats to meshes.

### 8.2 `cam-transform` keys (`cZt`) — quaternion slerp + focal lerp

```js
function cZt(keys, tS) {
  if (keys.length === 0) return null;
  const first = keys[0];
  if (tS <= first.tS || keys.length === 1) return first;
  const last = keys[keys.length-1];
  if (tS >= last.tS) return last;
  let i = keys.findIndex(k => k.tS >= tS); if (i <= 0) i = 1;
  const a = keys[i-1], b = keys[i], f = (b.tS-a.tS) <= 0 ? 0 : (tS-a.tS)/(b.tS-a.tS);
  qa.setFromEuler(new Euler(...a.rotation)); qb.setFromEuler(new Euler(...b.rotation));
  qa.slerp(qb, f);                                          // SLERP
  const e = new Euler().setFromQuaternion(qa);
  return { position: tA(a.position, b.position, f),
           rotation: [e.x, e.y, e.z],
           focalLengthMm: a.focalLengthMm + (b.focalLengthMm - a.focalLengthMm) * f };
}
```

### 8.3 `rig-transform` keys (`Vzt` + `T2r` + `S2r`) — angle-aware joint lerp

```js
const QCe = { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] };       // default joint
function S2r(a, b, f) {   // joint interpolation (bbe = shortest-angle lerp per axis)
  return { position: tA(a.position, b.position, f),
           rotation: [bbe(a.rotation[0], b.rotation[0], f), bbe(a.rotation[1], b.rotation[1], f), bbe(a.rotation[2], b.rotation[2], f)],
           scale: tA(a.scale, b.scale, f) };
}
function Vzt(keys, tS) {
  if (keys.length === 0) return null;
  const first = keys[0];
  if (tS <= first.tS || keys.length === 1) return first.joints;
  const last = keys[keys.length-1];
  if (tS >= last.tS) return last.joints;
  let i = keys.findIndex(k => k.tS >= tS); if (i <= 0) i = 1;
  const a = keys[i-1], b = keys[i], f = (b.tS-a.tS) <= 0 ? 0 : (tS-a.tS)/(b.tS-a.tS);
  const joints = {};
  for (const name of new Set([...Object.keys(a.joints), ...Object.keys(b.joints)]))
    joints[name] = S2r(a.joints[name] ?? QCe, b.joints[name] ?? QCe, f);
  return joints;
}
function T2r(items, timeS) {           // scan rig-transform items (latest wins, persists after end)
  let joints = null;
  for (const it of items) {
    if (timeS < it.startS) break;
    if (it.kind === "rig-transform") {
      const t = Math.min(timeS - it.startS, it.durationS);
      joints = Vzt(it.keys, t) ?? joints;
    }
  }
  return joints;
}
```
`bbe(a, b, f) = a + wrapPi(b − a) · f` (shortest-path per axis). Joints map to humanoid GLB bones by name (`rig.bones`); offsets applied additively post-clip (§4.4). `cot(name)` marks "major" joints for the UI: `name !== "root" && !/^DEF-(f_|thumb)/.test(name)`.

### 8.4 Keyframe edit helpers

`ym = 0.001` (tS tolerance), `Ott = 0.01` (min gap): `xbe(keys, fromT, toT)` moves/clones the key at `fromT` to `toT` (dedupe); `B2r(keys, fromT, wantT, itemEnd)` clamps a moved key between neighbors ±0.01; `wbe(keys, t)` returns {currentTS, prevTS, nextTS}. Adding any keyframe extends `durationS = max(durationS, lastKey.tS)`; `addRigKeyframe` **merges** joints into an existing key at the same tS; `addTransformKeyframe` carries `headRotation` over when replacing a key. Capture commands snapshot the focused object (`captureFocusedTransformPose`/`captureFocusedRigPose`/`captureFocusedCameraPose`) at `performanceTimeS − item.startS`.

---

## 9. Migration chain v1 → v10 (entry `f6r`, old `W8r`)

```js
function iGt(row) {                                    // reader (DB row → scene)
  if (!row || typeof row !== "object") return null;
  try { return f6r(row); }
  catch (e) { console.error("Stage: scene migration failed, refusing the row", e); return null; }
}
function f6r(t) {
  if (t.v === 10) return prt(t);
  let n = t;
  if (n.v === 1) { if (!t.performances) return null; n = c6r(n); }   // v1→v2
  if (n.v === 2) n = { ...n, v: 3, show: a6r(n.show) };              // v2→v3 points→anchors
  if (n.v === 3) n = { ...n, v: 4 };                                 // no-op
  if (n.v === 4) n = u6r(n);                                         // v4→v5 camera shot → track
  if (n.v === 5) n = h6r(n);                                         // v5→v6 prop yawDeg
  if (n.v === 6) n = { ...n, v: 7 };                                 // no-op
  if (n.v === 7) n = p6r(n);                                         // v7→v8 transform-key rotation unwrap
  if (n.v === 8) n = { ...n, v: 9 };                                 // no-op
  if (n.v === 9) n = { ...n, v: 10 };                                // no-op
  return n.v === 10 ? prt(n) : null;
}
function prt(t) { return m6r(g6r(b6r(o6r(l6r(t))))); }               // old: G8r(q8r(Z8r(D8r(B8r(t)))))
```

Per step:
- **`c6r` v1→v2** (old `H8r`): `{performances, activePerformanceId, ...rest}` → show = active ?? first performance ?? `{name:"Show", tracks:[]}`; drops the rest; `v:2`.
- **`a6r` v2→v3** (old `O8r`): path items with legacy `points[]` → `anchors: mT(points)` (drops `points`).
- **`u6r` v4→v5** (old `V8r`): for every camera object with `shot`: normalize via `n6r` (defaults: `shotMode:"still"`, `preset` = orbit defaults + `kind` validated against `_1` (invalid → "orbit"), `rail` = {a:null, b:null, speedUnitsPerS:2, followTarget:true, followObjectId:null}, `followObjectId:null`, `focalLengthMm: Hv=50`, `shake:"off"`); camera object gets `focalLengthMm`+`shake`+`legacyShot` (original shot); **one new track** `{id: uuid, characterId: cameraId, items: [{...d6r(shot, show), id: uuid, startS: 0}]}`.
- **`d6r` shot→item** (old `$8r`): preset → cam-move (full preset fields); rail → cam-path from a/b via `mT` (or cam-still if missing); follow → cam-follow {objectId, offset?, durationS: hrt(show)}; manual → cam-manual {durationS: hrt(show), samples: []}; still → cam-still {durationS: preset.durationS}. `hrt(show) = max(rx(show).durationS, 5)`.
- **`h6r` v5→v6** (old `U8r`): prop `yawDeg` (catalog `zh[propKey].yawDeg`, radians) subtracted from object `rotation[1]` **and** from that prop's track `transform` item key `rotation[1]`.
- **`p6r` v7→v8** (old `z8r`): transform keys' rotations unwrapped per axis for continuity (each key within π of the previous, via `tDe` shortest-angle).
- **Post-normalizers `prt`**:
  - `l6r` (old `B8r`): legacy `cam-rail` items → `cam-path` with `anchors = mT([a,b])`, `speedUnitsPerS = bie(dist(a,b) / max(0.1, durationS))` (★ new: `max(.1,·)` guard + `bie` clamp), `aim = followTarget===false ? "locked" : "subject"`, `subjectId = followObjectId ?? null`.
  - `o6r` (old `D8r`): if any path/cam-path item has `bie(speed) !== speed` → rewrite all with `bie` (valid>0 → max(v, 0.01); else **0.2** `i6r`).
  - `b6r` (old `Z8r`): per item — invalid `pace` (`!X2r`) dropped (recursively, i.e. re-checks after removal); invalid `heightCurve` (`!Kzt`) dropped; `cam-still.subjectId` not a live object id → dropped.
  - `g6r` (old `q8r`): `light` re-normalized (`N8r`: finite azimuth/elevation → `SDe` {azimuth wrapped mod 360, elevation clamp −30…90, nightLights omitted unless false}; else `light` removed).
  - `m6r` (old `G8r`): objects with a `spotlight` field → validate `nGt`; invalid → remove the field.

---

## 10. Store / editing API summary (class `BHr`)

### 10.1 Item factories (all push through `lje`; uuids via `an()`)

| Factory | Item created |
|---|---|
| `addPathItem` | `{kind:"path", anchors:[], speedUnitsPerS:1.4, gait:"walk"(humanoid only), startS:place}` + enters path-edit + seeds first anchor at object's world position |
| `addPlayItem` | `{kind:"play", durationS:0, samples:[], keymap:{}, startS:place}` |
| `addClipItem(clip)` | `{kind:"clip", clip, durationS:5}` (humanoid only) |
| `addRotateItem` | `{kind:"rotate", axis:"y", degPerS:90, durationS:5}` |
| `addRevolveItem` | `{kind:"revolve", centerObjectId:firstOther, degPerS:60, durationS:5}` |
| `addScaleItem(factor)` | `{kind:"scale", factor (2 or .5), durationS:5}` |
| `addTransformItem` | `{kind:"transform", durationS:4, keys:[]}` |
| `addRigTransformItem` | `{kind:"rig-transform", durationS:4, keys:[]}` (humanoid only) |
| `appendCameraItem(action, at, subjectId)` | `LHr(action,…)` → cam-still {5}; cam-path {anchors:[], speed 2, aim:"travel", subjectId}; cam-follow {durationS:sje, objectId}; cam-transform {4, keys:[]}; cam-manual {0, samples:[]}; cam-move {preset defaults, direction:"ccw", subjectId:default=first person??first object}; then `aimCameraAtSubject` (turn camera + move its target marker to the subject) for subject moves; `"path"` enters path-edit. |

Default durations `sje`: preset moves → `_1[move].durationS`; path/manual → 0 (derived); transform → 4; else 5.

### 10.2 Placement (`placeItemS = W5r`)

`desiredS === undefined` → `MP(items)` (end of last item). Else `_ie` solver: start at `max(0, desired)` (snapped to markers within radius if given); if the interval `[s, s+dur)` overlaps an existing item (`oje`, ε=1e-6), try `obstacle.startS − dur` and `obstacle.endS` for every overlapped obstacle (sorted by distance to desired, must be ≥0 and free), else fallback `MP(items)`.

### 10.3 Path editing (paint mode)

`enterPathEdit` sets `performancePaint={trackId,itemId,selectedAnchor:null}` + `editInteraction="editingPath"`. `appendPathAnchor/insertPathAnchor/deletePathAnchor` rebuild **all** tangents via `mT(positions)`; `movePathAnchor` moves only `pos`; `movePathAnchor` for "flown" paths (owners that are persons) keeps the anchor's y (ground-following paths — `anchorPosFor` substitutes the existing/owner y); `setPathAnchorHeight` sets y directly; `movePathHandle(idx, "in"|"out", v, {break})` sets one handle and mirrors the other (`−v`) unless broken. `patchPathAnchors` drops a cam-path's `heightCurve` if anchor heights changed (`HHr`). `finishPerformancePaint` deletes the item if <2 anchors. `updatePathItemSpeed` clamps ≥0.01; `updatePathItemGait` (humanoid tracks); `updatePathItemAim(aim, subjectId?)` (subject adds subjectId).

### 10.4 Subject / focus UX

`setCameraFocus(cameraId, focusId|null, {lookingAt?})`: current move segment (`moveSegmentOf`: containing item at `performanceTimeS`, camera tracks filter `Fp`, others filter path/play); cam-path/cam-move-with-subject → set aim/subjectId; cam-still → set/clear subjectId; else **create/extend a cam-still** from the current time to the next item (min duration 0.1, duration default `sje("still")`), inheriting focalLengthMm. On clear: `keepLookOnClear` turns the camera toward the last aim point (`turnCameraToward`), stores `lastAimPosition` on the camera, and moves the camera's target object to the aim point (`s$`). `walkerFocusId`/`setWalkerFocus` do the same for path items (aim subject/travel). `aimCameraAtSubject(cameraId, items, itemId, startS, subjectId, aimOffset=0)`: turns the camera object toward `subjectAimPoint` (world pos + NP + offset) and moves the camera's target marker there — unless earlier camera items exist before startS.

### 10.5 Deleting objects

`DHr(item, deletedId)` — detach references: revolve.centerObjectId→null; path/cam-move/cam-path.subjectId→null; cam-still.subjectId removed; cam-follow.objectId→null. `removeCharacterTracks(id)` drops the whole track. Duplicate/copy remaps ids and subject references via an id map (`insertClonedTracks`).

---

## 11. Performance controller (`jGr`) — clocks and per-frame pipeline

- Layout `s = rx(show)`, recomputed on show change.
- Time source `y()`: play-recording clock (`f + h`, h accumulates dt while recording) → manual scrub clock `l` (started by `startManualClock({fromS, bounded})`, bounded stops at `She(show).toS` and auto-stops recording) → performance clock `d` (runs while `isPerformancePlaying`; stops the performance at `d >= s.durationS`) → `performanceSeekS`.
- `tick(dt)`: advance clocks; if any active → `performanceTimeS.set(t); ue(t, dt)` (characters); else reset objects to base (`ye()`), apply rig offsets at t=0. `poseNow()` forces an evaluation at the current time with instant yaw (for thumbnails/export).
- Cameras are evaluated per-render via `ce`/`dZt` (markers in edit mode, filming camera during takes).
- **Takes** (`fe`/`oe`): per selected camera, an offscreen WebGL canvas at `recordAspect` resolution (e.g. 1920×1080); playback resets to start, `deferStart` until the playhead reaches the camera's first item `startsAtS` (`z(cameraId) = first item startS`), then MediaRecorder (`uqr`, mp4) captures frames rendered with that camera's `be(cameraId, cam)` aim (dZt pose + shake unless shakeBaked). Stop returns `{videoBlob, videoMimeType, width, height, durationS, framesRendered}` per camera.

---

## 12. Agent-facing snake_case mirror (`$qt`/`tNr`, old `NMr`/`Bqt`)

Rounding: `Co = ·→2 decimals`, `Wst = ·→3 decimals` (rotations), `JMr = 3 significant digits` (scale). Per item: `{item_id, kind, ...params, at_s: Co(startS), duration_s: Co(yd(item))}` with params:
- cam-move: `{action: move, subject_id?, frame_offset: Co(aimOffsetUnits) (subject moves), direction?, angle_deg? (angle moves), height_delta? (height moves), distance_scale? (distance moves), focal_length_mm?}`
- cam-still: `{action:"still", subject_id?, focal_length_mm?}`
- cam-path: `{action:"path", aim, subject_id, frame_offset?(subject), speed, speed_units_per_s, points:[[x,y,z]…2dp], heights_m?: 9 samples of ZA(u=i/8) 2dp, focal_length_mm?}`
- cam-follow: `{action:"follow", object_id, focal_length_mm?}`; cam-transform `{action:"transform"}`; cam-manual `{action:"manual"}`
- path: `{aim: aim??"travel", subject_id: ??null, points, speed_units_per_s, gait?}` (gait removed for non-humanoid tracks)
- clip/play/transform/rig-transform/rotate/revolve/scale: `{}` (only at_s/duration_s).
Show: `{name, range?: {from_s, to_s} (via She), tracks: [{track_id, object_id, object_name, items}]}`, plus objects (TRS with rotation in radians 3dp, `head_rotation` for figures, `camera{focal_length_mm, shake, target_id}`, `spotlight{shape, intensity, diffusion, beam_deg, lands_at}`), `light{azimuth_deg, elevation_deg, night_lights?}`, `playhead_s`, `prop_categories`.

---

## 13. Constants quick-reference (exact values)

| Constant | Value | Meaning |
|---|---|---|
| `MU` | 10 | scene schema version |
| `qA` | 20 | sample rate Hz (play + cam-manual recording) |
| `Ptt` | 12 | bezier samples per anchor segment |
| `Btt` | 64 | heightCurve plan resample count |
| `K2r` | 32 | min pace array length (generated) |
| `Y2r` | 100 | heightCurve heightM cap (m) |
| `Htt` | 1.4 | default path speedUnitsPerS (m/s) |
| `YZt` | 2 | default cam-path speedUnitsPerS |
| `Qae` | 0.01 | speedUnitsPerS floor (edits) |
| `i6r` | 0.2 | speed fallback for invalid values (migration `bie`) |
| `N8` | 5 | default durationS (clip/play-session/rotate/revolve/scale/cam-still/…) |
| `Jae` | 4 | default durationS (transform/rig-transform/cam-transform) |
| `eie` | 0.1 | show.range min gap (s) |
| `Ije`/`QZt` | 0.1 / 120 | durationS clamp |
| `q_`/`WA` | 14 / 200 | focalLengthMm clamp |
| `Hv` | 50 | default focalLengthMm |
| `Lzt` | 35 | sensor width mm (fov math) |
| `s2r`/`a2r` | 10 / 120 | dolly_zoom fovDeg clamp |
| `EHr`/`jHr` | 15 / 360 | cam-move angleDeg clamp |
| `IHr`/`MHr` | 0.5 / 20 | heightDeltaUnits clamp |
| `NHr`/`PHr` | 0.1 / 4 | distanceScale clamp |
| `RHr`/`FHr` | −15 / 15 | aimOffsetUnits clamp |
| `rye` | 5 | cam-path travel aim look-ahead (m) |
| `hFr` | 0.45 | cam-follow blend-in (s) |
| `ym`/`Ott` | 0.001 / 0.01 | keyframe tS tolerance / min gap |
| `Xae` | 0.5 | ground snap step-up / fall threshold (m) |
| `Uzt` | 0.22 | ground-follow smoothing τ (s) |
| `Bne` | 1.2 | ground raycast origin offset (m) |
| `A2r` | 8 | character yaw turn rate (rad/s) |
| `CZt` | 1.6 | own head aim height (·scale.y) |
| `MIr` | 0.7 | subject aim height fraction (NP) |
| `NIr` | 0.5 | spotlight subject aim fraction |
| `XOr`/`YOr` | 70° / 35° | head yaw / pitch limits |
| `Wat` | 0.4 | neck share of head look |
| `Sot` | 0.25 | clip crossfade (s) |
| `jP` | 1.75 | humanoid height (m) |
| play driver | 1.6 / 4.2 / 0.7 / 18 / 6 / 12 / 0.3 / 120 | walk/sprint/crouch m/s, gravity, jump vy, turn rad/s, collision radius, record cap s |
| vHr fit | 0.3 / 0.7 / 0.25 / 0.1 / 0.2 | min length m, hold retime blend, stationary gap s, pace spacing s, point spacing m |

---

## 14. Cross-check vs SCENE_FIDELITY_AUDIT §1.4 — name map & changes

| Old audit name | New bundle name | Notes |
|---|---|---|
| `NU=10` | `MU=10` | |
| `W8r` | `f6r` | migration entry |
| `prt=G8r(q8r(Z8r(D8r(B8r(t))))` | `prt=m6r(g6r(b6r(o6r(l6r(t))))` | same order/semantics |
| `H8r`/`O8r`/`V8r`/`U8r`/`z8r`/`$8r` | `c6r`/`a6r`/`u6r`/`h6r`/`p6r`/`d6r` | v-steps; shot normalizer `n6r` |
| `F8r` | `s6r` | show deep-copy |
| `eGt`/`c8r` | `nGt`/`N8r`(+`SDe`) | spotlight/light normalizers |
| `fT` | `mT` | anchor tangent builder |
| `bd` | `yd` | item duration |
| `Fhe` | `Lhe` | clip catalog (46, durations identical) |
| `GA=20` | `qA=20` | 20 Hz (⚠ new `GA` = Euler flip-unwrap fn) |
| `Wzt` keymap keys | `qzt` | ⚠ new `Wzt` = angle-approach fn |
| `zzt` gaits | `Gzt` | ⚠ new `zzt` = clamp fn |
| `b2r` aims | `H2r` | ⚠ new `b2r` = pan_sweep rotator |
| `Htt=1.4` | `Htt` | same name/value |
| `E2r=100` | `Y2r=100` | ⚠ new `E2r` = cubic-bezier-3D fn |
| `qzt` heightCurve validator | `Kzt` | |
| `C2r` pace validator | `X2r` | |
| `Btt=64` | `Btt` | same name/value |
| `rDe` smoothstep | `eDe` (twin `YCe`) | ⚠ new `rDe` = three.js constant 1013 |
| `w1` presets | `_1` | values identical |
| `yP` | `yP` (+`bP` full list) | same name |
| `Qae=0.1` range gap | `eie=0.1` (`tie`) | ⚠ new `Qae=0.01` = speed floor |
| `Xae=0.01` speed clamp | `Qae=0.01` | renamed |
| `mie`/`L8r=0.2` | `bie`/`i6r=0.2` | |
| `nx()` show duration | `rx()` | ⚠ new `nx` = anchors→polyline |
| `_he` | `_he` | same name |
| `U6` | `U6` | same name |
| `bd`… `hrt` | `hrt` | same name (max(showDur, 5)) |
| `Kae` (walk yaw from tangent) | *(inlined in `ztt`/`q2r`)* | ⚠ new `Kae` = headRotation resolver |
| `eEe` (humanoid default pose) | *(in humanoid manager)* | ⚠ new `eEe` = character track eval |
| `whe` (pace hold→idle) | `held` in `khe`/`eEe` | |
| `Bzt` (rig normalizer) | `Vzt`/`S2r`/`QCe` | ⚠ new `Bzt` = transform-keys eval |
| `Fzt=35` | `Lzt=35` | |
| `G_=14`/`zA=200` | `q_=14`/`WA=200` | |
| `Gae` aspects | `Zae` | |
| `Bv=50` | `Hv=50` | |
| `M8=5` | `N8=5` | |
| `sDe` | `tDe` | shortest-angle |
| `$br`/`Vbr` shake | `d2r`/`u2r` | values identical |
| `gq` camera rigs | `gq` | same name, values identical |
| `Uh` prop catalog | `zh` | |
| `HY` daylight table | `HY` | untouched per instructions (present at ~5,434,427) |

**Behavioral changes / additions vs the audit:**
1. **3 new item kinds**: `rotate` (axis/degPerS), `revolve` (centerObjectId/degPerS), `scale` (factor) — full eval in `Q`; also the action-palette lists (`YSr`/`xie`) and item→action mapping (`bGt`/`a$`/`Art`).
2. **`lje` sequential packing** — items on a track are sorted by startS and never overlap (bumped). Not documented in the audit.
3. **`cam-manual.shakeBaked`** — recorded flights carry baked shake; live shake skipped.
4. **Validators/clamps added**: durationS 0.1–120, angleDeg 15–360, heightDeltaUnits 0.5–20, distanceScale 0.1–4, aimOffsetUnits ±15, dolly_zoom fov 10–120°.
5. **cam-rail conversion** now guards `durationS ≥ 0.1` and clamps speed via `bie`.
6. **Play-mode controller** (the `play` item producer) fully mapped: WASD/pointer-lock, speeds 1.6/4.2/0.7, gravity 18, jump 6, crouch/sprint clips, keymap clips, 120 s cap, ground snap (same constants as playback).
7. **Gait playback rate** — audit's hypothesis "playback rate = speed/gait-speed" is **disproved**: gait clips play at wall-clock rate (`action.time = (elapsed % clipDuration)`, `timeScale` untouched); movement speed is independent (`speedUnitsPerS`).
8. **cam-move orientation**: eased correction blend (`qStart⁻¹·qPrev` slerped to identity by smoothstep) — camera starts from its incoming orientation, not snapped.
9. **cam-move without subject** aims at the camera's **target object** (targetId); with neither → no-op.
10. **cam-follow** default offset captured from the camera's current relative pose at item start; 0.45 s smooth blend-in; changing `objectId` resets the offset.
11. **Play-sample chaining** (offset = previous end − first sample) and **path-anchored absolute** positions — mixed semantics documented.
12. **cam-manual eval = nearest sample** (no slerp/lerp between samples) at `floor(elapsed·20)`.
13. **Head-look system** (xM split ±70°/±35°, neck/head 40/60, DEF-neck/DEF-head bone offsets, subject-overrides-keyed-headRotation precedence by `sinceS`) — new detail.
14. **Subject aim height** `NP` = minY + 0.7·height from world bounds (persons 1.75·sy) — new detail.
15. **Ground snapping** parameters (0.5 m step, τ=0.22 s, ray from +1.2 m, exactY for play, instant on backward seek/poseNow) — new detail.
16. **Range persisted as `{startS, endS}`** (mirror exposes from_s/to_s) — matches audit's arrow notation.
17. Clip catalog, cam-move presets, shake tables, camera rigs, aspect table, focal clamps, 20 Hz, 64-point resample, 100 m height cap, 1.4 m/s default — **all values identical** to the audit.

---

## 15. Unsolved / lower-confidence pieces

- `COr` ({pathEditPickables, rigJointPickables, planningAids}) — confirmed to exist (def at offset ~5,443,447) but not dumped; it's the editor's pickable-registry aggregator, not part of evaluation math.
- `_Zt`/`wje`/"rebase outcome" logic (camera fly-mode repositioning UX) — partially read; not part of track evaluation.
- MediaRecorder wrapper `uqr` (mime/codec negotiation) and the deterministic-render wrapper `Ew(t)` — not extracted (export pipeline plumbing).
- `nBe` (simple_figure internal rig accessor used by `o$`) — solved during final pass: `nBe = t => t.userData.figure`, and `o$(figure, rot)` = `figure.userData.figure.head.rotation.set(...rot)` (head is the visor sub-group; `nat` reads it back).
- The exact `objectPoseAt` re-entrancy guard (`te`'s `V` flag save/restore) is documented but its interaction with nested subject chains (A aims at B aims at A) was not runtime-tested.
- Whether `rotate`/`revolve`/`scale`/`transform` items can coexist with `path`/`play` on the same humanoid track in practice: the packer prevents temporal overlap, and `Q`'s scan order means the *last started* item wins for TRS while path position overrides for persons — verified by code reading only.
- The 2D plan canvas (`y2r` variant of cam-move, spiral sign flipped, and the `Q2r` 64-point heightCurve resample) — extracted but the plan-view drawing code itself was not fully audited.
