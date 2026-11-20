# R20 — Draw-path walking LOOK / orientation (ISSUE 7): the original's exact system vs our port

**User complaint (round 20, issue 7):** *"fully study how the draw path logic works exactly in the
original version, esp. relating to orientation / focus etc. currently your 'look' is locked while
it is walking the path, not usable at all."*

**Ground-truth bundle:** `analysis/index-CaBu3A6T.js` (13,507,616 bytes, one-line minified). All
offsets below are byte offsets into that file. Name map old (DBE17t4T / prior docs) → CaBu3A6T:

| old name | CaBu3A6T | meaning |
|---|---|---|
| `eEe` (char track eval) | `NEe` @4330108 | character state at time (path/play/clip) |
| `tyr` | `jvr` @4330057 | layout → per-track states |
| `$tt` (pathLookAt) | `Pnt` @4329741 | `{subjectId, sinceS, atS}` for aim==='subject' |
| `ztt` (yawOf) | `Ont` @4331504 | exact(play) > tangent(path) yaw resolution |
| `xM` (gazeSplit) | `HM` @5482972 | body/head gaze split (±70°/±35°) |
| `XOr/YOr/CZt/Wat` | `QHr/JHr/XKt/$it` @5482832 | 70°/35° head limits, 1.6 eye height, .4 neck split |
| `EZt` (euler conv) | `YKt` @5483316 | YXZ(pitch,yaw) → XYZ euler |
| `kje` | `tIe` @5483428 | `EZt(headYaw, headPitch)` — simple_figure head look |
| `jZt` (headLookOffsets) | `QKt` @5483484 | DEF-neck .4 / DEF-head .6, pitch NEGATED |
| `IZt` (merge) | `JKt` @5483601 | additive per-bone rotation merge |
| `Kae`/`_2r`/`w2r` | `xie` @3933882 / `Yyr` @3934122 / `Xyr` @3933491 | keyed headRotation resolver |
| `ue` (walker apply) | `pe` @5733467 | per-frame character apply (ground+yaw+headLooks) |
| `L` (objects+rigs+headlook) | `O` @5728206 | per-frame object apply + head-look application |
| `Q` (fold items) | `Y` @5730673ish (path branch @5731000) | rotate/scale/revolve/transform + path fold |
| `ne` (path fold apply) | `te` @5729909 | q2r fold + person-subject body split |
| `resolveSubject` | `Ee` @5732100 | lookAt → subject pos + NP height |
| (ownAim) | `ye` @5732167 | `[x, y+1.6·scale.y, z]` |
| (subjectLookAtTime) | `J` @5732291 | Kae live-look callback |
| `objectPoseAt` | `le` @5732569 | full pose fold at time (V-guard) |
| (subject pos at time) | `ne` @5729584 | evaluated → mesh → record fallbacks |
| `Wzt`/`zzt`/wrapPi | `iGt` @3937872 / `aGt` @3937757 / `Cnt` @3937791 | turn approach / step clamp / wrap |
| `Xae/Uzt/Bne/A2r` | `wie/rGt/dre/tvr` @3935347 | .5/.22/1.2/8 ground+turn consts |
| `JCe` | `MEe` @4324598 | default gait "walk" |
| `NP` (+`VDe`/`uje`) | `QP` @5258859 (+`CHe`) | subject aim height (default fraction `lNr`=.7; `cNr`=.5 spotlight) |
| `moveSegmentOf` | @5575262 | covering move item at playhead |
| `cameraFocusId`/`walkerFocusId`/`setWalkerFocus` | @5574604 / @5574732 / @5574905 | focus family |
| `updatePathItemAim` | @5571824 | aim(+subjectId) writer |
| `Cit` | `xot` @5552679 | cam-item → focus subjectId |
| `rDr.focusOf/toggleFocus` | @5499119 / @5499354 | plan-store focus intents |
| `startStroke/tickStroke/previewPose/endStroke` | @5496484 / @5497052 / @5497407 / @5498259 | stroke lifecycle |
| `OZt` (tap-or-draw probe) | `CKt` @5451022 | tap-to-focus hit test |
| `DLr/DZt/HLr` (pointer reducers) | `QLr` @5451433 / `jKt` @5453438 / (up in `_finish`-equiv) | plan pointer machine |
| `BLr` (autopan) | `JLr` @5452693 | 250 ms dwell + quadratic ramp |
| `Kae`-UI `Gzr` (segment inspector) | @5592450 | per-kind segment editors (path rows @5594148) |
| (cam-path aim rows) | @5598816 (+`Tot` frame-offset @5591676) | cam-path aim + aimOffsetUnits |
| (subject options) | `KKt` @5482208 | labeled objects minus camera/spotlight/paired-target |
| `keepCameraOn` (new in this build) | @5499479 | gesture camera focus (timeline/inspector hook) |

Prior docs (`TRACK_SYSTEM.md` §4/§7, `R13_DRAWPATH_AUDIT.md`) were written against DBE17t4T; every
function above was re-located in CaBu3A6T this round and is **identical modulo minifier renames**
(byte-checked on the excerpts quoted here).

---

## 0. TL;DR — what "look is locked" actually is

The **engine** is ported and works: with a path item `{kind:'path', aim:'subject', subjectId:X}`,
our port turns the walker's body toward X (sub-70° remainder), turns DEF-neck (.4) / DEF-head (.6)
toward X every frame, re-targets live during playback, and falls back to travel-facing (path
tangent) when no focus covers the playhead. Verified end-to-end with real pointer events + playback
(probes in §5).

The **usability failure** is in the *editing affordance*. The original has **one** "Look at"
control on the path segment (a searchable combobox: *Travel direction* / *subject objects* —
'locked' only for non-person walkers). Picking a subject sets `aim:'subject'` **and** `subjectId`
atomically. Our port split this into **two independent dropdowns — `Aim` (travel/subject/locked)
and `Subject`** (`editor/js/ui.js:888-893`, handlers `:948-950`) — and **neither one alone activates
the look**:

* pick **Subject only** → item `{aim:'travel', subjectId:X}` → `pathLookAt` gate (`aim!=='subject'`)
  → lookAt `null` → walker keeps facing the path. **Reproduced**: head stays at walk-cycle wiggle
  (±0.03 rad) the whole walk (§5.3).
* pick **Aim='subject' only** → item `{aim:'subject'}` (no subjectId) → `!item.subjectId` → lookAt
  `null` → same locked look.
* our port also offers **'locked'** for person paths (the live never does — `...a?[]:[locked]` where
  `a = walksPath`), which reads like a "lock the look" switch.

So a user who tries the obvious control(s) gets a permanently forward-locked walker — *"look is
locked while it is walking the path, not usable at all."* The only working affordance in our port
(tap-to-focus on the plan canvas) is a hidden gesture that additionally requires arming draw mode.

Remaining byte-level gaps in the walk-look engine (all small, all listed in §4): the two
`gazeSplit` guards (backlog, still missing — re-verified), the simple_figure head-look **euler
conversion** (ours is a naive `[pitch, yaw, 0]`, the live runs `EZt` which produces roll — up to
0.72 rad divergence for combined yaw+pitch), the `rigPoseObjectId` skip in the head-look loop,
`curYaw` from world- instead of local-quaternion, and the `Kae` keyed-head lerp.

---

## 1. The original's walking-orientation pipeline (end-to-end)

### 1.1 Per-frame clock & entry (`je.tick`)

The performance controller (DBE `jGr` → CaBu `je` object, tail of the `pe` dump @5736132+):

```js
tick: we => {
  let ke = !1;
  if (l !== null && (l += we, c !== null && l >= c && (l = c, c = null, ke = !0)),   // manual scrub clock
      h !== null && (h += we),                                                        // play-record clock
      d !== null && (d += we, d >= u && (n.stopPerformance(), n.isPreviewPlaying.set(!1))),  // performance clock
      l !== null || h !== null || d !== null || n.performanceSeekS.peek() !== null) {
    const Ce = y();                       // current time (record > manual > performance > seekS)
    n.performanceTimeS.set(Ce), pe(Ce, we), oe = !0;      // ← pe = ue(timeS, dt)
  } else {
    n.performanceTimeS.set(0);            // at rest: rig offsets at t=0, meshes reset once (be)
    ...
  }
},
poseNow: () => { const we = a || y() !== m; we && (m = null), g = we; try { je.tick(0) } finally { g = !1 } return we }
```

`g` is the `poseNow` flag → in `pe` it makes the yaw approach step `Math.PI` (instant snap) instead
of `tvr·dt` (8 rad/s). Our port: `evaluateAt(t, dt, poseNow)` (main.js:775, 824) ✓.

### 1.2 Character state: where the walker is + what it looks at (`NEe` = eEe @4330108)

For a track's **active path item** (verbatim, path branch):

```js
if (h.kind === "path") {
  const m = Q2(h.anchors), { distance: g, held: b } = qhe(h, m, e - u.startS);   // nx + khe (pace)
  return { characterId: t.characterId, clip: b ? "idle" : h.gait ?? MEe,          // MEe = "walk"
           clipTimeS: b ? 0 : e - u.startS,
           position: Cq(m, g),                                                    // oq: pos at arc distance
           tangent: _ie(m, g),                                                    // Yae: unit tangent
           walking: !b, yawRad: null, exactY: !1,
           lookAt: Pnt(h, u, e) };                                                // ← THE LOOK DESCRIPTOR
}
```

`Pnt` ($tt) @4329741 — **the only source of head-look while walking**:

```js
function Pnt(t, e, n) {
  return t.aim !== "subject" || !t.subjectId ? null
    : { subjectId: t.subjectId, sinceS: e.startS, atS: Math.min(n, e.endS) };
}
```

* `aim` is **absent** on default (drawn) person paths → `?? "travel"` everywhere → lookAt `null`
  → the walker faces the **path tangent** (see 1.4). The head follows the body (walk-clip pose).
* `aim==='subject' && subjectId` → the walker gets a per-frame look target.
* The **carry branch** (path finished, `e >= u.endS`) returns the same `Pnt(h, u, e)` — the walker
  **keeps looking at the subject after arriving** and the body keeps turning toward it (§5.1 probe:
  body yaw continues rotating ~100° after path end).
* `held` (pace hold) swaps to `idle` clip with `clipTimeS 0` but **keeps the lookAt**.

Our port: tracks.js:49-52 (`pathLookAt`) and :80-91 — **exact**.

### 1.3 Yaw resolution (`Ont` = ztt @4331504)

```js
function Ont(t) {
  return t.yawRad !== null ? { yawRad: t.yawRad, exact: !0 }              // play samples: exact
       : t.tangent ? { yawRad: Math.atan2(-t.tangent[0], -t.tangent[2]), exact: !1 } : null;
}
```

Path walkers always resolve through the **tangent** (`yawRad: null`); `exact` is only for `play`
items (manual recordings). Our port: tracks.js:118-122 ✓.

### 1.4 The walker apply (`pe` = ue @5733467) — ground snap, body yaw, headLooks registration

Verbatim (elisions `…`):

```js
function pe(we, ke) {                                     // ue(timeS, dt)
  const Ae = n.objects.peek(); ce.clear();                // headLooks.clear()
  const Ce = m === null || we < m; m = we;                // backwardSeek
  const ge = e.livePlay(), Se = new Map;                  // clips
  for (const Le of jvr(s, we)) {                          // tyr(layout, t)
    if (ge?.characterId === Le.characterId) continue;     // live-play session owns its char
    const Oe = r.get(Le.characterId), tt = Ae[Le.characterId];
    if (!Oe || !tt || !Po(tt.kind) ||
        (tt.kind === "humanoid" && Se.set(Le.characterId, { clip: Le.clip, timeS: Le.clipTimeS }),
         e.isMeshDragged(Oe))) continue;
    const Fe = Le.position; if (!Fe) continue;
    const Xe = Oe.getWorldPosition(F).y;                  // curY
    let $e;
    if (Le.exactY) $e = Fe[1];                            // play: exact y
    else if (Ce) $e = k(Fe[0], Fe[1] + dre, Fe[2]) ?? Fe[1];      // backward seek: snap
    else { const De = k(Fe[0], Xe + dre, Fe[2]);          // ground probe from +1.2 (dre)
           if (De === null) $e = Xe;
           else { const Ze = aGt(Xe, De, wie);            // step-up clamp .5 (aGt=zzt, wie=Xae)
                  $e = Xe + (Ze - Xe) * (1 - Math.exp(-ke / rGt)); } }   // τ=.22 (rGt=Uzt)
    let Ue = 0;                                           // parentYaw
    Oe.parent && Oe.parent !== t.scene
      ? (F.set(Fe[0], $e, Fe[2]), Oe.parent.worldToLocal(F), Oe.position.copy(F),
         Oe.parent.getWorldQuaternion($), H.setFromQuaternion($, "YXZ"), Ue = H.y)
      : Oe.position.set(Fe[0], $e, Fe[2]);
    const et = Ont(Le);                                   // ztt
    if (et?.exact) Oe.rotation.set(0, et.yawRad - Ue, 0);
    else if (et) {
      const De = Le.lookAt ? Ee(Le.lookAt) : null,        // ← resolveSubject (1.5)
            Ze = ye(tt, Fe[0], $e, Fe[2]),                // ownAim: [x, y+1.6·scale.y, z]
            ze = (De ? HM(et.yawRad, Ze, De).bodyYawRad   // ← gazeSplit: body takes the sub-70° part
                     : et.yawRad) - Ue;                   //   (no lookAt → plain tangent yaw)
      F.set(0, 0, -1).applyQuaternion(Oe.quaternion);     // NOTE: LOCAL quaternion
      const ct = Math.atan2(-F.x, -F.z),                  // current visual yaw
            bt = iGt(ct, ze, g ? Math.PI : tvr * ke);     // Wzt: ≤8 rad/s (π on poseNow)
      Oe.rotation.set(0, bt, 0);
      De && ce.set(Le.characterId, { target: De, sinceS: Le.lookAt.sinceS });   // headLooks.set
    } else Ce && Oe.rotation.set(tt.rotation[0], tt.rotation[1], tt.rotation[2]);  // restore on seek-back
  }
  ge && Se.set(ge.characterId, { clip: ge.clip, timeS: null });
  e.setPlaybackClips(Se);
  O(we);                                                  // ← L(timeS): objects + rigs + head look
}
```

Key semantics:
* **Body facing while walking without focus** = `atan2(-tan.x, -tan.z)` (path tangent), rate-limited
  to 8 rad/s with shortest-angle wrap (`iGt`), parent-yaw compensated.
* **Body facing with a subject focus** = `gazeSplit(tangentYaw, ownAim, subject).bodyYawRad` — the
  body *adds* the part of the gaze beyond ±70° (i.e. the body turns to bring the target within head
  range), still rate-limited.
* `aim:'locked'` on a **person** path is indistinguishable from `'travel'` at this level — `Pnt`
  returns null either way and the tangent yaw drives the body (verified in our port too, §5.4).
  'locked' only freezes **non-person** path walkers (via `te`/q2r → `yawRad:null` → keep rotation).
* `curYaw` is read from the mesh's **local** quaternion (`Oe.quaternion`), not the world quaternion.

Our port: main.js:782-830 — matches, **except** `curYaw` uses `mesh.getWorldQuaternion()`
(main.js:822; P2, parented+rotated-parent walkers drift).

### 1.5 The look target resolver (`Ee` = resolveSubject @5732100) + ownAim (`ye` @5732167)

```js
function Ee(we) {                                   // resolveSubject(lookAt)
  const ke = ne(we.subjectId, we.atS);              // subject position AT the lookAt time…
  if (!ke) return null;
  const Ae = QP(we.subjectId, n.objects.peek());    // …+ NP(subjectId) aim height (70% up bounds)
  return [ke[0], ke[1] + Ae, ke[2]];
}
const ye = (we, ke, Ae, Ce) => [ke, Ae + XKt * we.scale[1], Ce];   // ownAim: eye at 1.6·scale.y
```

`ne(subjectId, atS)` (@5729584) resolves the subject's position **deterministically**: first
`le(subjectId, atS)` (full `objectPoseAt` fold at that time — ground snap + recursive gaze split,
guarded by a re-entrancy flag `z`), then the live mesh world pos, then the stored record. So a
walker looking at **another walker** aims at that walker's *evaluated* pose (same-frame, no
staleness), and the aim point is the subject's **NP height** (`QP` @5258859, default fraction
`lNr=.7` @5258272, spotlight `cNr=.5`; bounds via `CHe`/`Vje` — figures 1.75·scale.y, props
catalog dims, groups child bounds).

Our port: main.js:610-630 (`resolvers().aim`) — at playhead time uses the **live mesh** world pos +
`subjectHeightOffset` (store NP port). During playback the mesh is the just-posed pose → equivalent
in practice (≤1 frame ordering lag vs the live's deterministic fold; `_subjectPos` returns position
only, which is all `Ee` consumes — the ledgered "objectPoseAt APPROX" is inert for aim).

### 1.6 The gaze split (`HM` = xM @5482972) — verbatim, with both guards

```js
const QHr = 70 * Math.PI / 180, JHr = 35 * Math.PI / 180, XKt = 1.6, $it = .4,   // @5482832
      eBr = (t, e) => Math.max(-e, Math.min(e, t)), Vit = t => Math.atan2(Math.sin(t), Math.cos(t));
function HM(t, e, n) {                       // gazeSplit(bodyYawRad, ownAim, target)
  const r = n[0] - e[0], s = n[1] - e[1], a = n[2] - e[2], o = Math.hypot(r, a);
  if (o < 1e-6) return { bodyYawRad: t, headPitchRad: 0, headYawRad: 0 };   // GUARD 1: straight up/down
  const l = Math.atan2(-r, -a), c = Vit(l - t),
        d = Math.sign(c) * Math.min(Math.abs(c), QHr, Math.PI - Math.abs(c));  // GUARD 2: π−|c| term
  return { bodyYawRad: Vit(t + c - d),
           headPitchRad: eBr(Math.atan2(s, o), JHr),
           headYawRad: d };
}
```

* GUARD 1: target (nearly) straight above/below → return the input pose unchanged (no yaw-to-0).
* GUARD 2: for `|Δyaw| > 110°` (i.e. π−|c| < 70°) the head takes `π−|c|` and the body takes the
  rest — total gaze identical, head pose different (behind-target look uses less head, more body).
* Pitch clamps at ±35°.

**Our port (tracks.js:125-136) has NEITHER guard** (backlog "gazeSplit guards — verified still
missing", re-verified this round): no `horiz<1e-6` early-out, and
`headYaw = clamp(dYaw, ±70°)` without the `π−|dYaw|` term.

### 1.7 Head-look application (`O` = L @5728206, loop @~5728740)

```js
for (const [Ce, { target: ge, sinceS: Se }] of ce) {              // headLooks (registered by pe)
  const Le = ke[Ce], Oe = r.get(Ce);
  if (!Le || !Oe || e.isMeshDragged(Oe)) continue;
  Oe.updateWorldMatrix(!0, !1); Oe.getWorldPosition(ve);
  ue.set(0, 0, -1).applyQuaternion(Oe.getWorldQuaternion(xe));    // current visual yaw (WORLD here)
  const tt = HM(Math.atan2(-ue.x, -ue.z), ye(Le, ve.x, ve.y, ve.z), ge);   // re-split vs the FINAL body
  if (Le.kind === "humanoid") {
    Ce !== e.rigPoseObjectId() && Ae.set(Ce, JKt(Ae.get(Ce) ?? {}, QKt(tt)));   // ← rigPose gate!
    continue;
  }
  const Fe = s.tracks.find($e => $e.characterId === Ce); if (!Fe) continue;
  const Xe = { sinceS: Se, headRotation: tIe(tt) };               // kje(split) — EZt(yaw, pitch), NOT negated
  k$(Oe, xie(Fe.items.map($e => $e.item), we, Le.headRotation,
             $e => $e === we ? Xe : J(Le, Fe, $e)));              // Kae with live-look override at t
}
e.setRigOffsets(Ae);
```

* **humanoid**: neck/head get **additive bone offsets** `JKt(existing, QKt(split))`
  (`IZt` merge: rotations summed per bone; `QKt`=jZt: `DEF-neck` ×.4, `DEF-head` ×.6, rotation built
  as `YKt(headYaw·w, −headPitch·w)` — **pitch negated**, YXZ→XYZ). Applied by the rig manager
  additively on top of the walk clip every frame (no smoothing — the offsets ARE the instantaneous
  split). The head yaw therefore re-composes from the *final* body yaw each frame, so the ±70°
  budget is always exact.
* **humanoid gate**: `Ce !== e.rigPoseObjectId()` — while this character is the active rig-pose
  object (a rig-transform segment is selected at the playhead), the head look is **skipped** so it
  doesn't stomp the rig edit. (During playback `rigPoseObjectId()` is null — the live computes it
  `playing → null`.)
* **simple_figure**: the whole look lands on the single head group via `kje = tIe = YKt(yaw, pitch)`
  — the **same YXZ→XYZ conversion** (produces roll for combined yaw+pitch), pitch **not** negated —
  fed into `Kae` (`xie`) as the live override, with **precedence** `a.sinceS >= s.startS` (the
  subject look only overrides keyed headRotations when it started at/after the latest keyed
  transform item).

`YKt` (EZt) @5483316 and `QKt`/`JKt` @5483484/@5483601:

```js
function YKt(t, e) { return Uit.setFromEuler(AL.set(e, t, 0, "YXZ")), AL.setFromQuaternion(Uit, "XYZ"), [AL.x, AL.y, AL.z] }
function tIe(t) { return YKt(t.headYawRad, t.headPitchRad) }
function QKt(t) { const e = n => ({ position: [0,0,0], rotation: YKt(t.headYawRad * n, -t.headPitchRad * n), scale: [1,1,1] });
                  return { "DEF-neck": e($it), "DEF-head": e(1 - $it) } }
function JKt(t, e) { const n = { ...t }; for (const [r, s] of Object.entries(e)) { const a = n[r];
  n[r] = a ? { ...a, rotation: [a.rotation[0]+s.rotation[0], a.rotation[1]+s.rotation[1], a.rotation[2]+s.rotation[2]] } : s } return n }
```

Our port: figures.js:226-248 (`ezHeadRotation`/`headLookOffsets`/`mergeRigOffsets`) — **exact**.
main.js:858-875 applies them — **but** (a) no `rigPoseObjectId` gate, (b) the simple_figure path
calls `_figureHeadRotation(track, timeS, obj, split)` which returns the **naive**
`[split.headPitchRad ?? 0, split.headYawRad, 0]` (main.js:904) instead of
`ezHeadRotation(split.headYawRad, split.headPitchRad)` — numerically different whenever yaw∧pitch
≠ 0 (measured: up to 0.72 rad divergence at yaw −1.2/pitch .35; 0.13 rad at typical walk pitch).

### 1.8 The fold-time twin (`te` = ne @5729909) — same split inside `Y`/`Q`

When the character's path is folded by the object-items evaluator (matters for **non-person**
walkers, parented cases, and subject-pose folds), the person+subject branch **re-evaluates as
travel and re-splits the body yaw** — the same `HM` split as `pe`:

```js
function te(we, ke, Ae, Ce) {                 // ne(pathItem, clampedElapsed, absTime, characterId)
  const ge = n.objects.peek()[Ce],
        Se = !!ge && Po(ge.kind) && we.aim === "subject" && !!we.subjectId,   // person+subject
        Le = ge?.kind === "spotlight";
  let Oe = Se ? null : ne(we.subjectId, Ae);
  if (Le && Oe) { const De = QP(we.subjectId, n.objects.peek(), cNr); Oe = [Oe[0], Oe[1] + De, Oe[2]]; }  // NP .5
  const tt = wvr(Se ? { ...we, aim: "travel" } : we, ke, Oe);                 // q2r
  if (Se && tt.yawRad !== null) {
    const De = Ee({ subjectId: we.subjectId, atS: Ae });
    De && (tt.yawRad = HM(tt.yawRad, ye(ge, ...tt.position), De).bodyYawRad);
  }
  … parent world→local, parentYaw (YXZ), Z2r euler (spotlight preserves pitch/roll) …
}
```

Our port: main.js:694-735 (`resolvers().pathApply`) ✓ (used by `evalObjectItems`, tracks.js:457-467).

### 1.9 Where the facing comes from for non-person path walkers

`q2r` (`wvr`): `locked → yawRad null` (keep current rotation — the prop **translates without
turning**), `travel → tangent yaw`, `subject → yaw+pitch toward the subject`. Drawn paths for
non-persons get `aim:'locked'` **by construction** (`replaceMoveFromSamples` walker branch below),
so props/cameras need an explicit focus to turn. Our port: tracks.js:407-424 ✓.

### 1.10 What a drawn path is born with (`replaceMoveFromSamples` @5571968)

```js
… const g = s?.focusId && s.focusId !== e && a[s.focusId] ? s.focusId : null,
      b = { id: an(), startS: Math.max(0, n), anchors: h, speedUnitsPerS: f, ...steady ? {} : { pace: c.pace } },
      y = l ? { ...b, kind: "cam-path", aim: g ? "subject" : "locked", subjectId: g, …focal carry… }
        : { ...b, kind: "path", ...o.kind === "humanoid" ? { gait: MEe } : {},
            ...Po(o.kind) ? g ? { aim: "subject", subjectId: g } : {}     // person: aim UNSET → travel
                          : { aim: "locked" } };                          // non-person: locked
```

**Person paths with no focus are born with NO `aim` field** (defaults to 'travel' via `??`) — the
walker faces where it walks. `focusId` comes from `startStroke`'s `focusOf(drawTarget)` (captured at
pointerdown; §3). Our port: plan.js:650-663 ✓.

---

## 2. The focus system taxonomy (who looks at what, when)

### 2.1 The covering item (`moveSegmentOf` @5575262)

```js
moveSegmentOf = (e, n) => {          // (trackId, timeS)
  const r = this.show.peek().tracks.find(o => o.id === e),
        s = this.objects.peek()[r?.characterId ?? ""]?.kind === "camera",
        a = (r?.items ?? []).filter(o => s ? Lp(o) : o.kind === "path" || o.kind === "play");
  return a.find(o => n >= o.startS && n < o.startS + vd(o)) ?? a[0];   // covering, else FIRST candidate
};
```

* **camera tracks**: any cam-* item (`Lp` = Fp over `cam-still/cam-move/cam-path/cam-follow/
  cam-transform/cam-manual`).
* **walker tracks**: `path` or `play` items only.
* Evaluated at `performanceTimeS` (the playhead) — the focus is **time-scoped**: a subject-aimed
  path at 0-5 s and a travel path at 5-10 s report focus only while covering; outside all items the
  **first candidate** is the fallback (`?? a[0]`).

Our port: store.js:910-916 + plan.js:1069-1074 ✓ verbatim.

### 2.2 Focus readers

* `walkerFocusId` @5574732: covering item `kind==='path' && aim==='subject'` → `subjectId ?? null`.
* `cameraFocusId` @5574604: covering cam item → `xot(item)` @5552679:
  `cam-path → aim==='subject' ? subjectId??null : null; cam-move|cam-still → subjectId??null;
  follow|transform|manual → null` (cam-move/cam-still take `subjectId` **directly**, no aim gate).
* `focusOf` (plan-store @5499119): `camera → cameraFocusId; person → walkerFocusId ??
  (pendingWalkerFocus while drawing); else null`.

### 2.3 Focus writers

* `setWalkerFocus` @5574905 (verbatim): guards (`isPersonKind`, `subjectId!==self`, subject exists)
  → **covering path item at the playhead** gets `updatePathItemAim(trackId, itemId,
  subjectId ? 'subject' : 'travel', subjectId)`; fails (returns false) when there is no track or
  the covering item is a `play` item → the caller defers via `pendingWalkerFocus`.
* `updatePathItemAim` @5571824: `{...item, aim, ...aim==='subject' ? {subjectId} : {}}` —
  switching to travel **keeps** the old `subjectId` (gates only read `aim`).
* `setCameraFocus` @5573096 + `keepLookOnClear` @5574277 + `clearFocus` (r13 P0-3 — ported
  verbatim, store.js:940-981) — camera-only machinery: patch cam-path/cam-move(yP)/cam-still or
  INSERT a cam-still; on clear, keep the look point (turn camera / move paired target /
  `lastAimPosition`).
* `keepCameraOn(e, n)` @5499479 — **new in CaBu3A6T** (not in DBE17t4T): gesture-bracketed
  `setCameraFocus`/`clearFocus` + warning toast — a timeline/inspector hook for cameras. Not ported
  (camera-side; note for the backlog).

### 2.4 Priority & fallbacks (walker look)

| playhead state | body facing | head |
|---|---|---|
| inside `path` with `aim:'subject'`+subject | tangent **+ sub-70° remainder toward subject** (8 rad/s) | DEF-neck .4 / DEF-head .6 toward subject (humanoid); kje on the head group (simple_figure); re-split every frame |
| inside `path` with `aim:'travel'` **or absent** (default) | path tangent (8 rad/s) | none — walk-clip pose (+ keyed transform `headRotation` for simple_figure via Kae) |
| inside `path` with `aim:'locked'` (person) | **same as travel** (Pnt null → tangent) | none |
| inside `play` item | exact recorded yaw (instant) | none (samples carry yaw only) |
| after path end (carry) | keeps turning toward subject if aim subject; else end tangent | keeps tracking subject if aim subject |
| no item covering / gap | unchanged (restore stored rotation only on backward seek) | none |
| subject deleted | `Ee` → `ne` → mesh/record fallbacks; aim falls to store-record position | same |

There is **no smoothing** on the head itself — only the body's yaw is rate-limited (`iGt`, 8 rad/s;
instant on `poseNow`); the head offsets re-compose from the final body yaw every frame.

---

## 3. User-editing affordances for look/focus (the original)

### 3.1 Tap-to-focus (plan canvas, hidden gesture)

Pointer machine: pointerdown `QLr` @5451433 (`if (e.locked) return …` — **all plan intents are
locked while playing/recording**), probe `CKt` (OZt) @5451022:

```js
function CKt(t, e, n) {                    // (view-state, deps, px)
  const r = EKt(e);                        // single-selected item
  if (!e.drawing || !r || r.kind !== "camera" && !Po(r.kind)) return null;   // must be ARMED + camera/person
  const s = Bq(e.items, t.view, n)[0];     // topmost footprint hit (chars paint ABOVE props)
  return s && s.id !== r.id && s.kind !== "camera" && s.kind !== "target" ? s.id : null;
}
```

→ `tap-or-draw` drag → pointerup <3 px → `focus` intent → `toggleFocus` @5499354 (verbatim in
§2.3/§1.10 dump): walker branch → `setWalkerFocus` (covering path at playhead) or defer
`pendingWalkerFocus = {id, subjectId}` (picked up by the NEXT `startStroke` via `focusOf` — the
live captures `focusId` at stroke START, `endStroke` reuses it). Camera branch → the full
`setCameraFocus` machine + failure toast. **Requires arming draw mode first** (the "Draw direction"
pill) — after every stroke the live disarms (`endStroke → drawingFor.set(null)`), so the user must
re-arm before each tap.

Our port: plan.js:502-506 (OZt), 507-537 (DLr), 580-592 (HLr), 1096-1120 (toggleFocus) — verbatim;
the hover tooltip ("Focus on this?") at +18/−44 ✓. Verified working end-to-end this round (§5.2).

### 3.2 The segment inspector — ONE "Look at" combobox (the primary affordance)

`Gzr` @5592450 (segment rows; caller `uWr` @5610303 computes `walksPath: Po(kind)`,
`hasGait: kind==='humanoid'`, `subjectOptions: KKt(objects) filtered !== owner`). Path rows
@5594148:

```js
t.kind === "path" && <>
  {t.anchors.length < 2 && <div className={Gr.hint}>WTCZcf</div>}
  {a && o && <ev label=X44slE value={t.gait ?? "walk"} options={oGt…} onChange={l}/>}    {/* Gait (humanoid) */}
  <ev label=Zc4YKz {...B}                                                                  {/* "Look at" — SEARCHABLE */}
     value={t.aim === "subject" ? t.subjectId ?? "" : a ? "travel" : t.aim ?? "travel"}
     options={[{ value: "travel", label: DeTbo5 },                                         {/* Travel direction */}
               ...a ? [] : [{ value: "locked", label: 7dJlqT }],                           {/* locked: NON-persons only */}
               ...H]}                                                                      {/* subject objects */}
     onChange={L => { L === "travel" || L === "locked" ? c(L) : c("subject", L || null) }}/>
  <vh label=l9wI00 value={t.speedUnitsPerS} step=.1 min=Sot onChange={s}/>                 {/* Speed */}
  {!d && <Ws onClick={u}>TLO3rY</Ws>}                                                      {/* Edit path */}>
```

* **One control**: picking a subject writes `updatePathItemAim(trackId, itemId, 'subject', id)` —
  aim+subjectId **atomically**; picking "Travel direction" writes `aim:'travel'`. The dead half-
  states (`aim:'subject'` without subjectId, or a subjectId without `aim:'subject'`) are
  **unreachable from this UI**.
* **'locked' is not offered for person paths** (`a = walksPath` gates it out); for persons the
  value display maps any non-subject state to "travel".
* Subjects = `KKt(objects)` @5482208 minus the track owner: **excludes cameras, spotlights and
  targets paired to a camera** (`Qu`), with numbered fallback labels.
* cam-path rows @5598816: same combined combobox (+ `locked` allowed, + an empty-subject option
  labeled with the camera's target-marker label) **plus `Tot`** @5591676 — the
  `aimOffsetUnits` stepper (−15..15, step .1, label hHhnPW), rendered only when `aim!=='locked'`.
* The inspector is **usable during playback** (`updatePathItemAim` has no playing gate; the
  plan-canvas lock does not apply to the side panel) — the intended way to retarget a look *while
  the character walks*.

### 3.3 While drawing (the ghost)

`previewPose` @5497407 (verbatim, walker branch): face-turn at ≥.05 m
(`gBr`), then `HM(T9(rotation), [at.x, heightM+XKt, at.z], [subject + QP height])` → the ghost
gets `rotation: [0, bodyYawRad, 0]` **and `look: split`** — the ghost shows the split (head-look)
live while you draw. The 3D ghost applier (`hoe`-family) poses the same mesh parent-composed and,
for humanoids, merges `jZt(look)` into the rig offsets each frame (the live's frame-loop callback
L; our main.js:1359-1368 `_ghostLook` merge + main.js:513-538 tickDrawPreview ✓, incl.
`ezHeadRotation` for the simple_figure ghost @main.js:527).

### 3.4 What does NOT exist (no port needed)

* No mouse-look / click-to-redirect gaze during playback — plan intents are hard-locked while
  playing (`QLr`), and there is no 3D-viewport focus gesture. Retargeting while playing goes
  through the segment inspector (3.2).
* No "look lane" on the timeline — look is a property of the path item (`aim`/`subjectId`), not a
  separate track.
* Head look during `play` (possessed recordings) doesn't exist — samples carry `yaw` only.

---

## 4. OUR port's divergences (file:line, exact diff)

### D1 — **[P0, the complaint] Split Aim/Subject inspector controls**
`editor/js/ui.js:888-893` (path) and `:895-899` (cam-path) render **two** rows:

```js
<label class="row">Aim<select data-actf="aim">${['travel','subject','locked'].map(a => `<option ${it.aim === a ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
<label class="row">Subject<select data-actf="subject"><option value="">—</option>${objOpts(it.subjectId)}</select></label>
```

handlers `:948-950`: `aim → patch({aim})`, `subject → patch({subjectId})`. Consequences vs the
live (@5594148):
* **Subject-only** → `{aim:'travel', subjectId:X}` → `pathLookAt` gate → NO look (reproduced §5.3).
* **Aim-only** → `{aim:'subject'}` → `!subjectId` → NO look.
* 'locked' is offered for **person** paths (live: non-persons only) — a user selecting it sees the
  (person) walker still face travel, while a **prop** path walker freezes facing — and the label
  reads like "lock the look".
* Subject options list **cameras/spotlights/paired targets** (`objOpts` :881-882 lists everything);
  live `KKt` @5482208 excludes them (a camera/spotlight subject can't be tapped, and NP height for
  them is 0 — visually the walker stares at the floor).
* cam-path section additionally misses the `Tot` `aimOffsetUnits` "Frame offset" stepper (live
  @5591676, `aim!=='locked'` only) — ledgered in R19_PARITY_LEDGER §"segment editor remainder".
* The aim **value display** doesn't map (live shows `subjectId ?? ''` when subject, `travel` for
  persons, `aim ?? 'travel'` otherwise); ours leaves `selected` unset when `aim` is undefined
  (browser shows 'travel' — cosmetically OK) and shows raw 'locked' for persons.

Everything downstream is ported and correct — this is purely the affordance.

### D2 — **[P1] simple_figure walking head-look uses the wrong euler**
`main.js:904`: `if (split) return [split.headPitchRad ?? 0, split.headYawRad, 0];` — the naive
XYZ. The live runs `tIe = YKt(headYaw, headPitch)` (@5483428) — YXZ(pitch,yaw,0) re-extracted as
XYZ, which yields a **roll** component and shifted x/y (measured on our three build:
yaw .5/pitch .2 → EZt `[.227, .489, −.108]` vs naive `[.2, .5, 0]`; yaw −1.2/pitch .35 → diff
0.72 rad). The correct helper already exists: `ezHeadRotation(yaw, pitch)` (figures.js:227) — used
for the ghost (main.js:527) but not here. Head look for Figure walkers tilts wrong whenever
yaw∧pitch ≠ 0.

### D3 — **[P1] gazeSplit guards (backlog item, still missing)** — `tracks.js:125-136`
Missing (a) the `horiz < 1e-6` early-out (target straight above/below yaws the body toward 0 in
ours; live returns the pose unchanged) and (b) the `Math.PI − Math.abs(delta)` term in the headYaw
clamp (for `|Δ| > 110°` ours over-yaws the head and under-turns the body; total gaze identical,
head pose differs). Live verbatim in §1.6 (@5482972).

### D4 — **[P2] rigPoseObjectId gate missing in the head-look loop**
`main.js:867-870` merges head look into rig offsets unconditionally. Live: `Ce !==
e.rigPoseObjectId() && Ae.set(...)` (@~5728740) — a humanoid being rig-posed (rig-transform segment
selected at the playhead, at rest) keeps its manual rig pose unstomped. Ours fights the rig edit
whenever a subject-aimed walk exists on the same character and a seek poses the scene at rest.

### D5 — **[P2] curYaw from world quaternion** — `main.js:822`
`mesh.getWorldQuaternion(...)` vs the live's **local** `Oe.quaternion` (pe @5733467:
`F.set(0,0,-1).applyQuaternion(Oe.quaternion)`). Parented walkers under rotated parents get a
wrong current-yaw → wrong 8 rad/s approach direction. (AUDIT_TRACKS P2, still present.)

### D6 — **[P2] `_figureHeadRotation` keyed-head lookup + precedence** — `main.js:885-906`
Step-function key lookup (last key ≤ t) vs the live's `w2r` lerp with recursive previous-item
fallback (`xie`/`Xyr` @3933882/@3933491); and the subject-split always wins in ours vs the live's
`live.sinceS >= item.startS` gate (a keyed headRotation that starts AFTER the look began wins in
the live). AUDIT_TRACKS P2, still present.

### D7 — **[P3] cosmetic/UX nits**
* Subject options unfiltered (part of D1).
* Plan-bar draw group not gated on `locked`/compiling (R13 P2-8) — shows "Draw direction" while
  playing (clicking it while locked cancels via the locked disposer, so no corruption — just noisy).
* Our inspector labels are guesses ("Aim", "Subject"); live i18n ids for the record: walker look
  label `Zc4YKz`, travel option `DeTbo5`, locked `7dJlqT`/`JBYQjd`, gait `X44slE`, speed `l9wI00`,
  edit-path `TLO3rY`, anchors<2 hint `WTCZcf`, cam-path aim label `52VY2S`, frame-offset `hHhnPW`,
  focus toast `Kit` (CaBu) / `AFs0db` (DBE), tap tip `T2tcdy`, focus-line label `Fsd1Wl`.
* `deleteObjects` (ui.js:717-736) detaches subject references on delete ✓ (store.js:1073-1093 ≡
  live @5552429 region: path/cam-move/cam-path `subjectId→null`, cam-still key removed, cam-follow
  `objectId→null`) — no divergence; the stale-subject state seen in early probes was test-harness
  only (direct `objects.remove` bypasses detach, same as calling store internals directly).

### Verified-correct (no action) — walk-look engine
`pathLookAt` (tracks.js:49-52 ≡ Pnt), `evalCharacterTrack` (:54-116 ≡ NEe incl. carry-lookAt),
`yawOf` (:118-122 ≡ Ont), `pathStateAt`/`pathRotation` (:407-435 ≡ wvr/_vr), `approachAngle`/
`stepClamp` (:139-145 ≡ iGt/aGt), ground snap + parent yaw (main.js:792-810), head-look registration
(:815-826), humanoid jZt/IZt application (figures.js:226-248 + main.js:867-869),
`resolvers().aim` NP height (store `subjectHeightOffset`), ghost look while drawing
(plan.js:1000-1018 ≡ previewPose; main.js:513-538 + :1359-1368), focus family (store.js:906-981 ≡
@5574604-5575262 + setCameraFocus machine), pointer machine (plan.js:502-596 ≡ CKt/QLr/jKt/JLr),
`replaceMoveFromSamples` aim rules (plan.js:650-663 ≡ @5571968), `updatePathItemAim` keeping
subjectId on travel (store.js:935-939 ≡ @5571824), `pendingWalkerFocus` lifecycle
(plan.js:964-965, 1094, 1103). `paths.js` (paint mode/anchors/handles) and `place.js` (placement
solver) are not implicated in look/orientation.

---

## 5. Live evidence captured this round (agent-browser E2E on our port)

Boot: `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1`
(session r20a; humanoid + camera + cube; walker path 0-10 s).

### 5.1 Focus set → look works (fixture path + `setWalkerFocus`)
`{aim:'subject', subjectId:B}`: during playback body yaw −1.82→−1.44 (turning toward B while
walking), **neck −0.29→−0.53, head −0.45→−0.93** (tracking; after path end the body keeps turning
to face B and the head settles at the split). Machinery works.

### 5.2 Real-pointer tap-to-focus (plan canvas)
Plan view, walker selected, Draw armed, synthetic PointerEvents on the plan canvas: stroke
(0,0)→(4,−4) created a path (17 anchors after autopan — note the canvas is only 313 px tall in the
harness; keep strokes on-canvas), then re-arm + tap on a **relocated** cube → `OZt` hit →
`focus` intent → item became `{aim:'subject', subjectId:cube}` → playback tracked it
(body −0.4→−2.06, neck −0.2→−0.5, head −0.15→−0.76 while walking). ⚠ Fixture note: the sample's
cube sits at the SAME XZ as the walker — the walker paints on top, so tapping "the cube" hits the
walker and silently starts a stroke instead. Same in the live (painter order); move the cube in
look-test fixtures.

### 5.3 **The complaint, reproduced** (Subject-dropdown-only)
Inspector Subject → B (ui.js:950 `patch({subjectId})`) → item `{aim:'travel', subjectId:B}` →
playback: body follows travel yaw (−1.107), **head stays at the walk cycle (|headY| ≤ 0.03)** the
entire walk. The dead state is stable and invisible to the user (Aim row still reads 'travel',
Subject row shows B). Symmetrically Aim='subject' alone is equally dead.

### 5.4 aim:'locked' on a person ≡ travel
Both runs face the tangent (yaw −1.107) — confirming §2.4 (locked only freezes non-person path
walkers); the dangerous reading of our 'locked' option is that users expect it to freeze the
*look* and it does nothing for persons.

### 5.5 Live retarget during playback
Playing at t≈0.8, `updatePathItemAim(...,'subject',B)` → within one evaluation the head swings to
−0.72 rad while mid-walk. The engine retargets live; only the UI affordance is missing.

### 5.6 simple_figure walker
Figure + subject: head yaw pegged at −70° (correct clamp) while the body turns — works, but via
the naive euler (D2): with pitch ≠ 0 the head rolls/tilts differently than the live.

---

## 6. Prioritized fix list (what to port, in order)

1. **D1 (P0) — port the combined "Look at" control** into `renderActionSection`
   (ui.js:888-899 + handlers :948-950): replace the Aim+Subject pair for `path` **and** `cam-path`
   with ONE select: options `[{travel,'Travel direction'}] + (walksPath ? [] : [{locked,'Locked'}])
   + subjects(KKt-filtered)`; value `it.aim==='subject' ? it.subjectId ?? '' : walksPath ? 'travel'
   : it.aim ?? 'travel'`; onChange → `app.show.updatePathItemAim(seg.trackId, seg.itemId,
   v==='travel'||v==='locked' ? v : 'subject', v || null)`. Source: live JSX @5594148 (path) /
   @5598816 (cam-path), props @5615903 (`walksPath = isPersonKind(owner.kind)`), `KKt` filter
   @5482208 (exclude camera/spotlight/paired-target), `updatePathItemAim` @5571824. This kills both
   dead states, removes 'locked' for persons, and makes look-editing-during-playback discoverable
   (the inspector stays mounted while playing — verified).
2. **D2 (P1) — one-line euler fix**: main.js:904 `return ezHeadRotation(split.headYawRad,
   split.headPitchRad)` (import already present, figures.js:227). Source: `tIe` @5483428 + `YKt`
   @5483316.
3. **D3 (P1) — gazeSplit guards** (tracks.js:125-136): add `if (flat < 1e-6) return { bodyYawRad,
   headYawRad: 0, headPitchRad: 0 };` and change the head clamp to
   `const headYaw = Math.sign(dYaw) * Math.min(Math.abs(dYaw), C.HEAD_YAW_LIMIT, Math.PI -
   Math.abs(dYaw)); const bodyYaw = wrapPi(bodyYawRad + dYaw - headYaw);` (source: `HM` @5482972;
   consts @5482832). Closes the backlog item.
4. **D4 (P2) — rigPoseObjectId gate**: main.js:867 `if (id === this.rigPoseObjectId) continue;`
   before the humanoid merge (source: `O` loop @~5728740). Matches the live's rig-edit protection.
5. **D5 (P2) — curYaw local quaternion**: main.js:822 use `mesh.quaternion` (no world compose)
   (source: `pe` @5733467).
6. **D6 (P2) — `_figureHeadRotation`**: port `w2r` lerp (`Xyr` @3933491) + recursive fallback +
   the `sinceS >= item.startS` precedence from `xie` @3933882 (replaces the step lookup at
   main.js:888-903).
7. **D7 (P3) — batch**: KKt-filtered subject options (comes free with fix 1), cam-path "Frame
   offset" (`Tot` @5591676, `aimOffsetUnits` stepper −15..15 step .1, only when `aim!=='locked'` —
   also fixes the R19 ledger's "segment editor remainder" item), plan-bar draw-group gating
   (`locked`/compiling), `keepCameraOn` (@5499479) if the camera timeline/inspector hook is wanted.

Do **not** "fix" these non-divergences: aim-'locked' ≡ travel for person walkers (live behavior);
body-keeps-turning after path end toward the subject (live `Pnt` in the carry branch); head-look
target = live mesh pos during playback (equivalent to the live's evaluated pose at the playhead);
plan locked during playback (live `QLr` gate).

---

## 7. Harness suggestions (E2E look-during-walk)

Reuse `scripts/pixel_oracle/ab.py` + `agent-browser` (session-per-suite), fixture
`samples/synthetic_tracks.json` **with the cube moved off the walker's XZ** (or a dedicated
`/tmp/r20_look.json` fixture: humanoid A + humanoid B at (2,0,4) + cube at (3,0,-3)).

* **T1 inspector atomicity (the fix's core):** select A's path segment
  (`app.page.selectedSegment = {trackId, itemId}` + `app._ui.refreshInspector()`), pick subject B
  in the combined control → assert item `{aim:'subject', subjectId:B}` after ONE change; assert
  no 'locked' option for a humanoid-owned path; assert cameras/spotlights absent from options;
  assert picking "Travel direction" yields `{aim:'travel'}` with subjectId retained.
* **T2 dead-state regression:** through the NEW UI only, assert no reachable sequence produces
  `aim==='subject' && !subjectId` or `aim!=='subject' && subjectId` (read the item after each
  interaction).
* **T3 walking head-look E2E:** `a.page.play()`; sample every ~60 ms:
  `mesh.quaternion` yaw (manual quaternion math — THREE isn't global in eval), plus
  `mesh.getObjectByName('DEF-neck'/'DEF-head').quaternion` yaw, and for simple_figure
  `mesh.userData.figure.head.rotation`. Expect (subject at 90° to the path): body yaw deviates
  from the travel yaw by the >70° remainder; neck ≈ 0.4·split + bind, head ≈ 0.6·split + bind;
  after path end the body continues rotating toward the subject. Assert `|headYaw| ≤ 70°+ε`.
* **T4 live retarget during playback:** while playing mid-walk, `updatePathItemAim(…,'subject',B)`
  → within 2 frames the head yaw changes by >0.3 rad (regression for fix 1's discoverability; the
  engine already passes).
* **T5 gazeSplit unit probes (fix 3):** in-eval `import('/editor/js/tracks.js')`:
  `gazeSplit(1.0, [0,1,0], [0,3,0])` → `{bodyYawRad:1.0, headYawRad:0, headPitchRad:0}` (horiz
  guard); `gazeSplit(0, [0,0,0], [0.05,0,1])` (target ~straight BEHIND, |Δ|≈3.09 rad) → headYaw
  ≈ −0.05 (the π−|c| term), body takes the rest; compare against a reference implementation of
  `HM` pasted from the bundle.
* **T6 figure head euler (fix 2):** simple_figure walker + subject with vertical offset (pitch
  ≈0.3, yaw ≈1.0): assert `figure.head.rotation` equals `ezHeadRotation(headYaw, headPitch)`
  (roll ≠ 0 in general), not `[pitch, yaw, 0]`.
* **T7 tap-to-focus regression (existing behavior):** plan view + arm + synthetic PointerEvent
  tap on the relocated cube → item aim/subject; keep as a guard for the pointer machine.
  (Watch the 313-px harness canvas: strokes that leave the canvas trigger autopan and stretch the
  path — keep test strokes well inside, or set the viewport larger.)
* **T8 prop-path 'locked' guard:** a prop walker with a drawn path (aim:'locked' by construction)
  translates WITHOUT rotating (regression that fix 1's 'locked' option still works for
  non-persons).

---

## 8. Source-index (CaBu3A6T offsets, for the fix commits)

| unit | offset | unit | offset |
|---|---|---|---|
| `HM` gazeSplit | 5482972 | consts QHr/JHr/XKt/$it | 5482832 |
| `YKt` EZt | 5483316 | `tIe` kje | 5483428 |
| `QKt` jZt | 5483484 | `JKt` IZt | 5483601 |
| `xie` Kae | 3933882 | `Yyr` _2r / `Xyr` w2r | 3934122 / 3933491 |
| `NEe` eEe | 4330108 | `Pnt` $tt | 4329741 |
| `Ont` ztt | 4331504 | `jvr` tyr | 4330057 |
| `MEe` walk | 4324598 | `iGt`/`aGt`/`Cnt` | 3937872 / 3937757 / 3937791 |
| `wie/rGt/dre/tvr` | 3935347 | `QP` NP | 5258859 |
| `pe` ue | 5733467 | `O` L | 5728206 |
| `Ee` resolveSubject | 5732100 | `ye` ownAim | 5732167 |
| `J` subjectLookAtTime | 5732291 | `le` objectPoseAt | 5732569 |
| `ne` subjectPosAt | 5729584 | `te` path-fold | 5729909 |
| `Y` object items | 5730673 | head-look loop (in O) | ~5728740 |
| `moveSegmentOf` | 5575262 | `cameraFocusId` | 5574604 |
| `walkerFocusId` | 5574732 | `setWalkerFocus` | 5574905 |
| `updatePathItemAim` | 5571824 | `xot` Cit | 5552679 |
| `setCameraFocus` | 5573096 | `keepCameraOn` | 5499479 |
| `focusOf` / `toggleFocus` | 5499119 / 5499354 | `startStroke`/`previewPose`/`endStroke` | 5496484 / 5497407 / 5498259 |
| `CKt` OZt | 5451022 | `QLr`/`jKt`/`JLr` | 5451433 / 5453438 / 5452693 |
| `Gzr` inspector | 5592450 | path "Look at" rows | 5594148 |
| cam-path aim rows | 5598816 | `Tot` frame-offset | 5591676 |
| `KKt` subject options | 5482208 | inspector props (uWr) | 5610303 |
