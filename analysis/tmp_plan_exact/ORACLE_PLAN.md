# ORACLE_PLAN.md — validating an exact port of the flick 2D plan canvas against the bundle

Goal: rewrite `editor/js/plan.js` as a **code-logic port** of the extracted bundle functions
(`analysis/tmp_plan_exact/fn_*.js`), then prove behavioral equivalence by running the **bundle's
own functions** as the reference implementation ("oracle") against our port in Node, with
identical inputs and a recorded draw-call diff.

## 1. What runs as the oracle (and what doesn't)

Run these bundle functions **verbatim** as the oracle (all A-rated, pure):

| oracle area | bundle fns | our port counterparts |
|---|---|---|
| view projection | `iu`, `S1`, `UDe`, `fqt`, `zIr`, `mqt` | `toPx/toWorldAt/zoomAt/fit` |
| state reducers | `ELr jLr ILr MLr NLr PLr RLr FLr OLr LLr FZt PZt $Lr` | view/drag handling |
| pointer machine | `DLr DZt HLr BLr` (+`xLr Qhe Xat wLr _Lr kLr OZt LZt`) | `_down/_move/_up` |
| footprints | `Dst dqt Rie uqt i9 FU` (+consts `PP Fst tit`) | `footprint/items` |
| painter | `SDr` + `TDr CDr jDr EDr VZt MDr NDr IDr PDr RDr FDr ADr cBe dBe $Zt q5 _Dr kDr` (+`zDe pqt hqt UIr Z_ aqt`) | `draw/drawItem` |
| edge indicators | `$Ir FDr` | edge loop |
| pool | `TDe Rhe` (+`Z8r/K8r` scratch — replace with plain math or three) | `poolOf` |
| stroke pipeline | `Ait xHr wHr vHr` (+consts), `mT nx MR xU E2r` (+`Ptt=12`) | `finishStroke`/`curves.js` |
| paths derivation | `rit Bzt cZt hL Zo nx` (+`eit=40`) | `paths()` |
| speeds/replace | `replaceMoveFromSamples` (method; see §4) | `finishStroke` tail |

Do **not** oracle the React/DOM layer (`rBr sBr yRr RRr iFr KYr nQr`) or the runtime slices
(`shownPose_impl ne_frameloop se_playback z_drawPreview`) — read them as spec, port their
behavior, and cover with hand-written assertions instead.

## 2. Scene fixture (plain data — no three.js needed at the oracle layer)

Synthesize one scene exercising every glyph/branch (objects map, `id → obj`):

```js
const objects = {
  cube1:   { kind:'cube',   position:[-3,0,-2], rotation:[0,0.6,0], scale:[1,1,1] },
  sph1:    { kind:'sphere', position:[ 2,0.5,-3], rotation:[0,0,0],  scale:[1.6,1.6,1.2] }, // ellipse fp, yaw≠0
  cyl1:    { kind:'cylinder', position:[4,0,1], rotation:[0,2.2,0], scale:[1,1,1] },
  prop1:   { kind:'prop', propKey:'<catalog key>', position:[0,0,3], rotation:[0,-1.1,0], scale:[1,1,1] },
  fig1:    { kind:'simple_figure', position:[1,0,2], rotation:[0,0.9,0], scale:[1,1,1],
             headRotation:[0,0.8,0] },                     // face-arc branch (headYawRad)
  hum1:    { kind:'humanoid', position:[-1,0,1], rotation:[0,2.6,0], scale:[1,1,1] },
  cam1:    { kind:'camera', position:[0,1.7,6], rotation:[-0.35,3.6,0], scale:[1,1,1], focalLengthMm:35 },
  cam2:    { kind:'camera', position:[40,2,-40], rotation:[-0.2,0.4,0], focalLengthMm:85 }, // offscreen → edge indicator
  tgt1:    { kind:'target', position:[0,0,0], rotation:[0,0,0], scale:[1,1,1] },
  spot1:   { kind:'spotlight', position:[-2,4,2], rotation:[-1.2,0.5,0], scale:[1,1,1] },        // pool round
  spot2:   { kind:'spotlight', position:[3,5,-1], rotation:[-1.0,-0.5,0], scale:[1,1,1], spotlight:{shape:'square'} },
  grp1:    { kind:'group', position:[0,0,0], rotation:[0,0.4,0], scale:[1,1,1] },
  cube2:   { kind:'cube', parentId:'grp1', position:[0.8,0,0.5], rotation:[0,0,0], scale:[0.5,1,0.5] }, // group box + promotion
  sph2:    { kind:'sphere', parentId:'grp1', position:[-0.6,0,-0.4], rotation:[0,0,0], scale:[0.4,0.4,0.4] },
};
```

Plus show tracks for path drawing (`rDr.paths` oracle): one track with a `path` item (2+ anchors
from `mT`), one with `cam-path`, one with `transform` (2+ keys), one with `cam-transform`.
Aspect fixture: `recordAspect:'16:9'` and `'9:16'` (wedge math differs).

Poses: the bundle's `items()` consumes `shownPose(id)` — for the oracle, feed **pinned synthetic
poses** `{position, rotation, scale, fovDeg?, headRotation?}` per object (one "stored" set and one
"played-back" set). This is exactly the seam where the live app reads per-frame state — pinning
it makes the oracle deterministic.

## 3. Recording canvas (Proxy-based ctx)

```js
function recordingCtx() {
  const ops = [];
  const num = v => typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v;   // see §5
  const rec = (name) => (...args) => { ops.push([name, ...args.map(num)]); return proxy; };
  const state = {};                                                          // settable attrs
  const proxy = new Proxy({}, {
    get(_, k) {
      if (k === '__ops') return ops;
      if (k in state) return state[k];
      if (typeof k === 'string' && /^[a-zA-Z]+$/.test(k)) {
        // gradient/measure stubs
        if (k === 'createLinearGradient' || k === 'createRadialGradient')
          return (...a) => ({ addColorStop: rec2 => { ops.push(['grad-stop', ...a.map(num), rec2]); } });
        if (k === 'measureText') return () => ({ width: 42 });
        if (k === 'getTransform') return () => ({ a:1,b:0,c:0,d:1,e:0,f:0 });
        return rec(k);
      }
    },
    set(_, k, v) { state[k] = v; ops.push(['set', k, num(v)]); return true; },
  });
  return proxy;
}
```

`SDr` and every glyph fn only use the Canvas2D API surface (paths/arc/ellipse/fill/stroke/
setLineDash/globalAlpha/…), so a Proxy records the exact command stream. Our port gets the same
proxy; diff the two op lists.

## 4. Harness structure

```
editor/js/plan.js (new port)                analysis/tmp_plan_exact/fn_*.js (oracle, verbatim)
        │                                            │
        └──────────── shared test driver ────────────┘
  1. build items:   port.items(fixture)  vs  rDr-items-replay: entries → Dst + TDe + hqt + labels
                    (re-implement rDr.items() 1:1 as plain fn over the fixture; both sides call
                     the SAME bundle Dst/TDe/hqt? NO — port must use its own copies; the oracle
                     uses bundle copies. Diff the item arrays.)
  2. painter:       port.draw(recCtx, view, items, …) vs SDr(recCtx, {…same…})
  3. interactions:  feed scripted pointer sequences (arrays of {p:{x,y}, shift, mod, button}):
                    down → moves → up; run port handlers vs DLr/DZt/HLr (+BLr autopan with fake
                    dt), compare (a) final view/drag state, (b) intent sequences, applying both
                    to identical mock facades and diffing the facade call log.
  4. stroke:        feed sample arrays [{x,z,t}] → vHr vs port.simplify → diff {points, pace,
                    durationS}; then replaceMoveFromSamples via a mock show-store (see below) vs
                    port.finishStroke tail → diff produced item objects (kind, anchors, speed,
                    pace, aim, subjectId, gait, focalLengthMm).
  5. view ops:      zoom/pan/fit/centerOn sequences → diff view objects exactly.
```

`replaceMoveFromSamples` oracle shim (it's a class method over the show store):

```js
const mockShowStore = {
  objects: { peek: () => objects },
  trackIdOf: (id) => tracks.find(t => t.characterId === id)?.id ?? null,
  addPerformanceTrack: (id) => (tracks.push({ id: 'trk-' + id, characterId: id, items: [] }), 'trk-' + id),
  moveSegmentOf: (trackId, startS) => tracks.find(t => t.id === trackId).items
      .find(i => (i.kind === 'path' || i.kind === 'cam-path') && i.anchors.length > 1) ?? null,
  updateTrackItems: (trackId, fn) => { const t = tracks.find(t => t.id === trackId); t.items = fn(t.items); },
  _an: 0, an: function () { return 'id-' + (++this._an); },   // bundle id generator `an()`
};
oracle = replaceMoveFromSamples.bind(mockShowStore);
```

`rDr.items()` oracle: replicate the 12-line body (in `fn_class_rDr.js`) over the fixture with
`shownPose` = pinned poses, `labels` = `DDe` outputs (or pinned strings), `aspect` = `Am(...)`.
The rDr methods worth driving directly (scripted facade, see §6): `apply`, `startStroke`,
`tickStroke`, `endStroke`, `stepBack`, `move`, `turn`.

## 5. Diffing rules (floats & ordering)

- Round all numbers to **1e-4** (`Math.round(v*1e4)/1e4`) before compare — matches the bundle's
  own `Tit=1e4` pace quantization and is well below any visual threshold.
- Painter op streams: compare **exactly in order** (order is the spec). One caveat: a port is
  free to merge/split `beginPath/moveTo/lineTo` runs only if the final geometry commands match —
  do NOT allow it; port must emit the same command sequence (this is what "exact port" means).
- Sets (selection) → sort before diff. `Map`s (drag.riding) → compare entries sorted by key.
- NaN never appears (guards in-bundle); if it does, that's a port bug — fail loudly.
- Painter palette: both sides must use the SAME palette object (feed the bundle's `BZt` output —
  hardcode the 14 `--plan-*` values + `fontFamily` from a live session into the fixture).
- Path/degenerate inputs to test explicitly: empty scene (fit→default 34), single object,
  overlapping group children (promotion order), 1-sample stroke (reject), straight-line stroke
  (dwell spans), stroke with a ≥.25s pause (anchor pinning + mHr re-spread), tiny scribble
  (<.3m → null), zero-height spotlight (pool null), spotlight aiming up (fwd.y > −.05 → null).

## 6. Pinning per-frame app state (the playhead seam)

The live system reads, per frame: `shownPose(id)` (mesh world TRS + fovDeg + headRotation),
`performanceTimeS`, `drawPreview`, `dimPathOf`, `focus`. For the oracle:

1. **Snapshot pinning**: run the port's own 3D scene (or a scripted pose timeline) and record
   `{id → pose}` at fixed timestamps `t ∈ {0, 0.5, 1.2, …}`; freeze those into the fixture. Both
   sides consume the frozen map — the frame-dependent seam disappears.
2. For `rDr.tickStroke` (the only true per-frame producer): drive it with **monotonic fake frame
   timestamps** (e.g. 16.67 ms steps, plus a jittered variant) and a scripted `stroke.at` path;
   the bundle's sampling rule (`Δt≥.05s || moved`) is timestamp-sensitive, so the port must be
   fed the identical timestamp sequence.
3. `drawPreview`/`seekPerformance` calls: capture into the mock facade's call log; diff logs,
   not effects.

## 7. Suggested test matrix (priority order)

1. `iu/S1/UDe/fqt/zIr` round-trips + clamps (14..170, factor floor .1) — trivial, catches sign bugs.
2. `Dst` over the full fixture (esp. figure halves, sphere no-clamp, prop dims) + `dqt/Rie/uqt`.
3. `SDr` golden op-stream per fixture scene × 3 views (default 34, zoomed 120, fit) × selection
   states (none, cube1, grp1, cam1, multi) × stroke on/off × focus on/off.
4. `$Ir/FDr` edge indicators with cam2 offscreen (margin clamp + arrow).
5. Pointer scripts: click empty/select member/select group/shift-toggle/mod-cycle/marquee small
   (≤4px both dims → deselect only)/marquee large/move with+without Shift (snap .25)/rotate with
   Shift (15° grid)/lens drag (focal stops yT)/pan (middle button)/wheel zoom at cursor/wheel
   pan (sign!)/tap-or-draw (<3px tap = focus; ≥3px = stroke start).
6. `vHr` corpus: ~12 synthetic sample sets incl. dwells; diff `points+pace+durationS`.
7. `mT/nx/MR` vs port curves.js (incl. `Ptt=12` density and Rtt caching behavior — port may
   cache too, or not, as long as output matches).
8. `replaceMoveFromSamples` matrix: camera/humanoid/figure/prop × steady on/off × focus yes/no ×
   existing move item yes/no (replace semantics + focalLengthMm carry-over).
9. `rDr.apply` move scripts incl. grouped child (parent-local compose via `pie`) and camera with
   `targetId` (target follows) + camera on a path (`carryPaths`/`shiftPaths` mock).

## 8. Known traps for the port (from the DIFF TABLE — top correctness risks)

1. rotate-handle yaw sign (`atan2(fp.x−p.x, fp.z−p.z)` — our current port is mirrored).
2. simple_figure footprint is **half** extents (`PP/2`).
3. wheel pan sign (`UDe(−dx, −dy)`).
4. marquee commits when **either** dim > 4px.
5. stroke sampling is **time-based per frame** (`.05s` or any move), not distance-based.
6. `wHr` smoothing skips dwell-anchor points; dwell spans also re-spread time by `mHr=.7`.
7. `pace` array must be produced (match-speed profile) — currently absent from our port.
8. figure body/head/face-arc constants (uDr=7 min scale, stripe d*.2, Nie·f head, ±72° arc on
   yaw+headYaw, tick d+3..d+10).
9. ellipse props: `ctx.ellipse(…, −yawRad, …)`; square pool: rotated `dBe` square half-extent r.
10. callout: ellipse ring `+12` case, lens dots, RDr tick; callout suppressed only while an
    active `stroke` exists (not the whole drawing mode).
11. cam-path default aim is **"locked"** (not travel); walker path aim undefined unless focused.
12. endStroke **replaces** the move item (new id, old filtered out), keeping focalLengthMm.
