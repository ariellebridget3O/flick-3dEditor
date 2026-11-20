# R20 — Bundle study: camera-view navigation (ISSUE 4) + height editing on the timeline (ISSUE 6)

**Ground-truth bundle: `analysis/index-CaBu3A6T.js`** (decoded length 13,507,616 chars). All offsets in
this file are CaBu byte/char offsets. Names reshuffled vs. the r17 registry (which used
`index-DBE17t4T.js`); a DBE→CaBu name map is included. Prior research (`tmp_r17/EXTRACT.md`) offsets
are DBE and do NOT resolve in CaBu — everything below was re-located in CaBu this round.

DBE (r17) → CaBu name map for the camera-mode subsystem:

| r17 (DBE) name | CaBu name | CaBu offset | role |
|---|---|---|---|
| `$e` applyMode @5655928 | `$e` | 5686144 | mode transition (verbatim re-found) |
| `Ma` nav tick @5663138 | `Ha` | 5693276 | per-frame nav dispatch |
| `en` drive @5664174 | `Qt` | 5694344 | rig-physics drive tick |
| `ha` edit WASD @5663200 | `sa` | 5693916 | edit-mode WASD (bot drive) |
| (nav-ball drive) | `Qe` | 5695417 | nav-ball pad drive |
| `G` drive reset @5649455 | `q` | 5679611 | seed springs from pilot |
| `rzr` look @5609267 | class `OGr` | 5639408 | three PointerLockControls subclass |
| `szr` mousemove @5609864 | `LGr` | ~5641027 | locked mousemove (Oot=.002 rad/px) |
| `Je` click-to-lock @5655723 | `Xe` | 5685869 | canvas click → pointer lock |
| `vZt` takeOver @5445932 | `$Kt` | 5476748 | adopt camera-mesh world pose |
| `iBe` @5444847 | `XHe` | 5475663 | resolve filming camera mesh |
| `BU` fov @5444685 | `t4`/`sz` | 3930061 / ~5153588 | focal→fov |
| `UGr c()` applyCameraModeFov | `TKr.c` | 5736937 | viewfinder fov formula |
| `eIr` controller @5230903 | `MMr` | 5241034 | monitor controller (zoom + keymap) |
| `kIr` rig store @5241461 | `a.rig/cameraSpeedMps/…` | ~5241500+ | rig state (page-store fields) |
| `Yjr` monitor @5225471 | `EMr` | 5235979 | monitor bar JSX |
| `NGt` modifier gate | `qqt` | 5161702 (used @5680080) | `metaKey\|\|ctrlKey\|\|altKey\|\|S9(target)` (S9 = INPUT/TEXTAREA/SELECT/contentEditable) |
| `jCr/ICr` zoom map | `ijr`/`ojr` | 5195053 / 5195100 | focal↔t log map (`ppe`=clamp01 @5194923) |

---

# PART A — ISSUE 4: "the whole camera navigation is incorrect when switching to camera view in 3d view"

## A1. The original has TWO different "camera views" — they are not the same subsystem

### A1a. `stageView === "cameras"` — the **feed wall** (edit-mode-only)

The header view switch is a segmented control (`Mes` @5870159 → `Ylt` @5870350):

```js
function Mes({mode:t,stageView:e,viewportMode:n,hasPlayHud:r,onStageViewChange:s,onViewportModeChange:a}){
  return t!=="edit"||r?null:i.jsxs(i.Fragment,{children:[
    i.jsx(Ylt,{options:[["editor",…],["cameras",…]],value:e,onChange:s}),
    e==="editor"&&a&&i.jsx(Ylt,{options:[["3d",…],["plan",…]],value:n,onChange:a})
  ]})}
```

* It is **hidden outside edit mode** (`t!=="edit"||r → null`). The 3d/plan sub-switch only exists
  while `stageView==="editor"` — the plan is NOT reachable from the cameras view.
* `stageView` is **React local state at the page shell** — `const [A,E]=p.useState("editor")` @~5629300.
  It is **never written by any mode transition** (`$e`/`setMode` don't touch it), so it survives
  camera-mode entry/exit.
* The cameras view itself is a **paginated grid wall of live feed tiles** (`NJr` @5862984;
  paging `MJr` — **6 tiles per page**, `s_=6`; pager chevrons + "x–y of n" label):
  each tile is a `<button class=tile style=aspect-ratio>` containing a `feedHost` div into which a
  **separate per-camera WebGL feed** renders (`Fes` passes `onFeedHost:P` → `YKr`'s `feedViewAt`).
  Feed pose resolver `ce` @~5753600: base = **the camera mesh's current world pose** (so dragging the
  prop updates the feed live) evaluated through `NKt` (evalCameraObject) at the record aspect and the
  camera's own focal (`t4(B(Le),aspect)`); the tile being *filmed* mirrors the editor camera (`se`).
* **The editor orbit camera is never touched by the cameras view.** The wall covers the viewport
  (`Ss.camerasView` @~5868851); edit toolbar/right toolbar hide (`r&&!ne&&!x` in `Fes` @5872506,
  `ne=e==="cameras"&&t==="edit"`). The nav-ball pad STAYS visible over the wall
  (`TXt(t,x!==null)&&!n&&i.jsx(gJr,…)` @5876614, `TXt(t,e){return t==="edit"&&!e}` @5668969).
* **The only tile interaction is a click** — wired @5882274:

```js
onCameraClick:S=>{l("editor"),t.selectObject(S),t.focusObject(S)}
```

  i.e. click a camera tile → **switch back to the editor view + select that camera + focus it.**
  Nothing enters camera mode from the wall. (`onRecordCameraClick` starts a *hub recording* — a
  different, live-only arc; `onPipCameraClick` just selects.)

### A1b. `mode === "camera"` — the **viewfinder / monitor** (filming)

Entry points in the original (exhaustive):

1. **Inspector "Film with phone" button** (camera object properties → `onFilmWithPhoneClick:
   t.filmWithPhone`, wired @5615682 / 5882515). App method @5831408:

```js
filmWithPhone=e=>{this.mode.peek()!=="edit"||this.recording.peek()!==null||
  this.armPhoneFlight(e)&&this.cameraStore.startFilming(e)};
armPhoneFlight=e=>{if(this.objects.peek()[e]?.kind!=="camera")return!1;
  const n=this.show.peek().tracks.find(a=>a.characterId===e)?.id;
  this.history.holdEntry();
  const r=n??this.performanceStore.addPerformanceTrack(e),
        s=r&&this.performanceStore.addCameraItem(r,"manual",this.performanceTimeS.peek(),null);
  return!r||!s?(this.history.releaseEntry(),!1)
    :(this.phoneDraft={trackId:r,itemId:s,madeTrack:!n},
      this.performanceStore.startManualFlight(r,s)!==null)};
```

2. **Action-panel Fly button on a `cam-manual` segment** (`onSegmentFlyClick:C` @5617045 where
   `C=()=>c(Z=>t.flyManualSegment(Z.trackId,Z.itemId))` @5610980; the button JSX @5599960 renders a
   `phone-camera` icon + "Film with phone"/re-fly label depending on `samples.length`):

```js
flyManualSegment=(e,n)=>{const r=this.performanceStore.startManualFlight(e,n);
  r&&this.cameraStore.startFilming(r)};
```

3. Phone/node-phone flows (`toggleNodePhone`, `armNodePhoneFlight` @5832100+) — live-only.

`startFilming` @5154304 (filming store):

```js
startFilming=e=>{const n=e??this.activeCameraId();
  !n||this.a.objects.peek()[n]?.kind!=="camera"||
  (this.filmingCameraId.set(n),this.a.setMode("camera"))};
```

`exitCameraMode` @5154513:

```js
exitCameraMode=()=>{if(this.a.mode.peek()==="camera"){
  if(this.recording.peek()){this.toggleRecording();return}
  this.a.setMode("edit")}};
```

**There is no "camera view" entry from the Cameras view, from a camera lane click on the timeline,
from the camera pills, or from clicking/double-clicking a camera prop in 3D** (those select/focus
only: feed tile → select+focus+back-to-editor @5882274; plan pills → `goToCamera=e=>{this.a.setSelectedIds([e]),this.centerOn(e)}` @5487530; 3D double-click → `focusObject`).

## A2. The takeOver state machine — `$e` applyMode @5686144 (verbatim)

```js
function $e(){const Ve=n.mode.peek();
 Ve==="edit"
  ?(V.isLocked&&V.unlock(),                                  // 1 exit pointer lock
    re&&(r.position.copy(re.position),r.quaternion.copy(re.quaternion),
        o.target.copy(re.target),re=null),                   // 2 restore saved editor pose
    o.enabled=!0,                                            // 3 orbit back on
    r.fov=t7,                                                // 4 fov=t7 (50 @5474251)
    r.updateProjectionMatrix(),
    $())                                                     // 5 B(): gizmo reattach
  :(le(),                                                    // 6 exit right-button free-look
    c.detach(),                                              // 7 gizmo detach
    o.enabled=!1,                                            // 8 orbit off
    Ve==="camera"&&(
      re||(re={position:r.position.clone(),quaternion:r.quaternion.clone(),
               target:o.target.clone()}),                    // 9 save editor pose (once)
      $Kt(t,null,r)||(r.position.y=Math.max(r.position.y,Iqr)),  // 10 TAKEOVER
      e.applyCameraModeFov(),                                // 11 viewfinder fov (TKr.c)
      l.position.copy(r.position),l.quaternion.copy(r.quaternion), // 12 seed pilot
      q(),                                                   // 13 G: seed springs from pilot
      e.captureSpawnPose(r.quaternion,r.position)),          // 14 phone spawn pose (live-only)
    Ve==="review"&&(V.isLocked&&V.unlock(),r.fov=t7,r.updateProjectionMatrix())),
 e.updateFrameGuide()}
$e(),t.disposers.push(Zt(()=>{n.mode.get(),$e()}));          // runs on every mode change
```

* **takeOver** `$Kt` @5476748: `function $Kt(t,e,n){const r=XHe(t);return r?
  (r.getWorldPosition(n.position),r.getWorldQuaternion(n.quaternion),!0):!1}` — position AND
  quaternion adopted from the **filming camera mesh**. Fallback: keep pose, clamp `y≥Iqr(1.6)`
  (@5669921 const block).
* **Camera resolution** `XHe` @5475663:

```js
function XHe(t){const e=t.a.filmingCameraId.peek()??t.a.focusedCameraId.peek()
  ??V8(t.a.objects.peek(),t.a.selectedId.peek());
  return e?t.meshById.get(e)??null:null}
```

  with `focusedCameraId` @5832891 = **selected object is a camera** OR **the camera of the selected
  segment/track on the timeline**, and `V8` @4912200 = selected-is-camera ?? **first camera**.
* `Iqr=1.6` floor guard; `t7=50` editor fov; other module consts @5669921:
  `Iqr=1.6, Mqr=.4, Xye=8(click slop), Yye=4(edit WASD m/s), Qye=3(edit shift×), Nqr=.12(phone
  lerp tau), Pqr=.4(cam-mode shift stick), Rqr=.35(look pointerSpeed), hlt=.0022(free-look rad/px)`.
* The monitor bar renders only `mode==="camera" && pageLive` (`NMr` @5244618:
  `CameraMonitor:It(()=>{const s=fe(t.mode)==="camera",a=fe(t.pageLive);return s&&a?…:null})`);
  the **frame-guide div shows in camera mode regardless of pageLive** (`TKr.u` @5737050:
  `if(n.mode.peek()!=="camera"){d.hide();return} …d.show({...})`).
* `applyCameraModeFov` = `TKr.c` @5736937:

```js
function c(){const C=l(),A=35/Math.max(s.aspect,1);
  s.fov=2*Math.atan(C.fovScale*A/2/n.focalLengthMm.peek())*180/Math.PI,
  s.updateProjectionMatrix()}
```

  (`l()` = `uZt` @5203751 frame geometry: `viewportHeightPx−2·dZt(96)` maxHeightFraction → `Oyr`
  @3930170 e/n/r → fovScale; `35/max(aspect,1)` = `EEe` @3930061 with `YWt=35`.)
  On resize: `mode==="camera" ? c() : s.updateProjectionMatrix()` (`S` @5736912 module tail).
* **The filming camera's own mesh is NOT hidden** in camera mode (rendered from inside; FrontSide
  culling makes the body invisible from its own origin). The original never toggles its visibility.
* `setMode` @5840388 (verbatim): `if(this.recording.peek())return; e!=="edit"&&(editInteraction
  "idle", stopPlaySession); const n=mode==="camera"&&e==="edit"; e==="camera"?clearSelection():
  clearFilmingCamera(); mode.set(e); n&&manualFlight&&finishManualFlight([]); e==="edit"&&
  (lastFlight=null)`.

## A3. The camera-mode input pipeline (original)

All of this lives in one module `Kqr(e,{orbit,pilot,…})` @5670662–5695861. `n`=page store,
`r`=editor camera, `o`=orbit, `c`=gizmo, `H`=aim Object3D, `l`=pilot Object3D, `V`=OGr look,
`Z`=key set, `L/U/W`=yaw/pitch/roll springs, `O/B`=move/pan spring arrays.

1. **Pointer lock (click-to-lock)** — `Xe` @5685869:

```js
const Xe=()=>{n.mode.peek()==="camera"&&!n.phoneStreaming.peek()&&!V.isLocked&&V.lock()};
s.domElement.addEventListener("click",Xe)
```

   On **lock** (`we` @5682947): `if(n.phoneStreaming.peek()){V.unlock();return} n.setFlyLocked(!0)`.
   On **unlock** (`ke` @5683021): `n.setFlyLocked(!1); const Ve=n.mode.peek();
   (Ve==="edit"||Ve==="camera")&&J()` — `J` @5682325 re-aims the orbit target along the current view
   direction (keeping distance) and re-enables orbit per mode.
   `OGr` @5639408 is stock `PointerLockControls` (`minPolarAngle 0, maxPolarAngle π`,
   `pointerSpeed=Rqr(.35)`; mousemove `LGr` @~5641027: `euler.y-=movementX*.002*pointerSpeed;
   euler.x-=movementY*.002*pointerSpeed; clamp; setFromEuler`) — mouse-look writes **H (aim)** only.
2. **Keys** — `G` @5679987 / `X` @5680393 / blur clear:

```js
G=Ve=>{if(!ux()||Ve.repeat)return;          // ux(): typing gate
  const rt=n.mode.peek();
  if(Ve.key==="Shift"&&Z.add("shift"),
     qqt(Ve)||rt!=="camera"&&!ne&&!te()||rt==="camera"&&!n.pageLive.peek())return;
  const Pe=Ve.key.toLowerCase();
  if(Z.add(Pe),Y.set(Ve.code,Pe),rt==="camera"){
    if(Pe==="r"){n.toggleRecording();return}
    Pe==="escape"&&Bqr({pointerLocked:V.isLocked,consumed:Ve.defaultPrevented})
      &&(Ve.preventDefault(),n.exitCameraMode())}}
```

   * In camera mode, WASD/Q/E/Shift are added to `Z` **whether or not the pointer is locked**
     (drive works unlocked too); `qqt` @5161702 = `metaKey||ctrlKey||altKey||S9(target)` (the NGt
     gate — modifier-held and typing-target keys are NOT added).
   * keyup deletes by key AND physical code (`Y.get(Ve.code)`); window blur clears + `le()`.
   * `Bqr` @5670502 = `!pointerLocked && !consumed` — so the first Esc (browser unlock) is eaten,
     the second exits camera mode.
3. **The drive** — `Qt` @5694344 (the `en` port is verbatim-faithful; CaBu confirms):

```js
const Bt=L.value;                                            // yaw before
if(z.setFromQuaternion(H.quaternion),
   B=Ijr(B,{stickX:Re,stickY:at,rig:Pe,panDegPerS:n.cameraPanDegPerS.peek(),dtS:Ve}),
   !jjr(B)){ …pan increments → H… L+=…, U+=… }
L=YU(L,L.value+Ust(L.value,z.y,1),Pe.lookEaseS,Ve);          // yaw spring chases AIM yaw (dt=1!)
U=YU(U,z.x,Pe.lookEaseS,Ve);
Q.set(U.value,L.value,0);l.quaternion.setFromEuler(Q);       // pilot pose = pitch/yaw (no roll)
O=Ejr(O,{…vertical:rt("e")-rt("q"),aim:[…pilot quat…],speedMps:n.cameraSpeedMps.peek()…});
l.position += springValues(O)·dt;                            // world-space move springs
W=Pjr(W,{…turnRadPerS:Ust(Bt,L.value,Ve),sidewaysMps:Njr(…),topMps:n.cameraSpeedMps.peek()…});
W.value&&(Q.z=W.value,l.quaternion.setFromEuler(Q));         // roll last
```

   Helper offsets (CaBu): `Ijr` pan @5200434, `jjr` panIdle @5200380, `Sjr` pitchStep @5199400,
   `YU` spring @5199518, `Bst/$st` spring arrays @5199674/5200230, `Cjr` values @5199737,
   `Ejr` move @5199794, `Ust` turnRate @5200647, `Njr` sideways @5200741, `Pjr` roll @5200800,
   `_jr` rigWithWeight @5198970, rig table `Oq` @5197167 (identical to const.js CAMERA_RIGS),
   speed steps `tZt` @~5197560. **All match our `drive.js` verbatim port — including the fixed
   yaw-spring line (r17 P0-1).**
4. **Per-frame dispatch** — `Ha` @5693276 (the `Ma` equivalent):

```js
function Ha(Ve){
  if(n.mode.peek()==="camera")
    if(n.peekPhoneDelta()){e.applyPhoneAim(),q();
      const rt=1-Math.exp(-Ve/Nqr);
      r.position.lerp(l.position,rt),r.quaternion.slerp(l.quaternion,rt)}   // phone (live-only)
    else Qt(Ve),r.position.copy(l.position),r.quaternion.copy(l.quaternion); // ← the drive owns r
  else if(ne){ …right-button free-look WASD (unreal control mode only)… }
  else sa(Ve),Qe(Ve)}                                                        // edit: WASD + nav ball
```

   So in camera mode **the editor camera is a rigid copy of the pilot every frame** — no orbit, no
   floor clamp (the drive can fly below ground; only the ENTRY clamps y≥1.6), no polar clamp.
   The floor/polar clamp `Fot` @5638676 (`_Xt=.1`) runs only in edit view:
   `A()&&Fot(e.camera,n.orbit)` twice per frame in the loop `te()` @5792104, with
   `A=()=>t.mode.peek()==="edit"&&t.playSession.peek()===null&&!L.isViewportFilming()` @5789743.
   Note `Fot` lifts **camera AND orbit target** together when clamping (our port clamps the camera
   only — see divergences).
5. **Wheel** — `ye` @5681856: `if(n.mode.peek()==="camera"){Ve.preventDefault(),
   n.zoomCameraByWheel(Ve.deltaY,Ve.deltaMode);return}` → `MMr.zoomByWheel` @5243108
   (gates `mode==="camera" && pageLive && !phoneStreaming`; `Xjr` = `{...t,targetT:ppe(t.targetT
   - deltaY·(deltaMode===1?qjr(33):1)·Gjr(6e-4))}`; held-key zoom `Kjr` = targetT±`zjr(.35)·dt`,
   lens spring `Wjr(.15)`, rAF dt clamp `IMr(.05)` — all == our const.js).
6. **Monitor keymap** — `MMr.onKeyDown` @5243679 (gates `ux() && pageLive && mode==="camera"`):
   Esc closes open menu first, else exits; Tab cycles rig (Shift reverse); Z/X speed; [/] weight;
   **O/P held-key zoom** (`if(phoneStreaming)return`); matches our `_camModeKeyDown`.
7. **Canvas picking in camera mode** — pointerup handler `ua` early-returns
   (`if(!et||n.mode.peek()!=="edit"||c.dragging||n.playSession.peek()!==null){et=null;return}`),
   path-handle pickers gate on `editInteraction==="editingPath"`, gizmo is detached. Clicking the
   canvas in camera mode does exactly one thing: request pointer lock.

## A4. What "moving around" in the viewfinder actually is (original)

* **Free-fly rig drive, not orbit and not aim-locked.** Click to lock → mouse-look turns the *aim*
  (H); the pilot yaw/pitch springs chase the aim at the rig's `lookEaseS`; WASD moves in the
  pilot's yawed frame (level rigs use the horizon-projected basis `OCr`-equivalent; drone pitches
  with the camera); Q/E = vertical at `max(.6, speed·.6)` m/s; Shift scales the stick to 40%.
* **Tripod** (`speedMps:0`) is pan-only: WASD pans at `panDegPerS` through the pan springs —
  position never moves.
* **Zoom** = focal 14–200mm on a log scale (O/P keys + wheel); focal is written to the *camera
  object* (`setFocalLengthMm`) and the viewfinder fov recomputes (`TKr.c`).
* **Roll** comes from rig turnRoll/strafeRoll (steadicam/drone), never from input.
* There is **no floor clamp, no collision, no target lock** while driving — the only clamps are the
  polar clamp on the look and the entry floor guard.

## A5. Our port — divergences (file:line vs CaBu offsets)

Port files: `editor/js/main.js` (m), `ui.js`, `monitor.js`, `drive.js`, `manipulate.js`.

| # | Divergence | Port | Original | Impact |
|---|---|---|---|---|
| D1 | **Cameras view is through-the-lens, not a feed wall** | `main.js:1211-1289` `updateCameraThroughLens`: `inCam = stageView==='cameras' && mode!=='camera'`; orbit disabled (`orbit.enabled=!inCam`); camera pose re-pinned from `mesh.userData.evalPose` every frame; labels+mesh hidden; frozen frame when no camera selected/eval | `NJr` @5862984 wall of per-camera feed tiles; editor camera NEVER touched; tile click = `l("editor"), selectObject, focusObject` @5882274 | **This is the complaint.** In our Cameras view you cannot navigate (orbit off; WASD/wheel move the camera but the pin overwrites them — or, with nothing selected, WASD/wheel *do* move a frozen camera). The original's cameras view is a monitoring wall with exactly one interaction (tile click → select+focus+back to editor). |
| D2 | **Camera-mode entry force-quits the cameras view** | `main.js:1752-1755`: `if (stageView==='cameras'){ stageView='editor'; updateCameraThroughLens(); }` | `$e` @5686144 never touches stageView (React local state @~5629300); the wall hides while `mode==='camera'` (`ne=e==="cameras"&&t==="edit"` @5873244) and **returns the moment you exit to edit** | Exiting camera mode lands in the editor view instead of the Cameras view the user was in. Also **desyncs the viewSwitch DOM** (segments only re-sync on click, `ui.js:80-92` — "Cameras" stays highlighted while stageView is 'editor'). |
| D3 | **viewSwitch DOM not state-driven** | `ui.js:80-92` (class toggled only inside the click handler) | `Ylt` renders `aria-checked`/thumb from the `value` prop reactively | After D2's programmatic flip (or scene load), the segmented control can lie. |
| D4 | **takeOver camera resolution misses the selected-segment/track fallback** | `main.js:1663-1670` `activeCameraId` = filming ?? selected-is-camera ?? first | `XHe` @5475663 = filming ?? `focusedCameraId` @5832891 (selected camera **OR camera of selected segment/track**) ?? `V8` first | Wrong camera adopted/focal shown when a camera *track* is selected but no camera object is (monitor focal, marker fov @main.js:1326, takeOver when filming is null). |
| D5 | **Keys: no modifier gate, no code map** | `manipulate.js:815-878`: adds every key regardless of meta/ctrl/alt; keyup deletes by key only | `G` @5679987: `qqt(Ve)` (modifiers) blocks adding; keyup deletes key AND `Y.get(code)` | Ctrl/Cmd-held WASD (undo, copy…) drives the rig in our port; original ignores it. Minor. |
| D6 | **No unlock→`J()` re-aim** | `drive.js:197-202` (createLook has no unlock hook) | `ke` @5683021 → `J()` @5682325 on every unlock (edit or camera) | Cosmetic here (edit-exit restores `re` anyway); matters only if free-look is ever ported. P3. |
| D7 | **Filming camera mesh hidden** | `main.js:1896-1905` `_hideCameraMeshForMonitor` | no hiding anywhere in `$e`/`Ha` (backface culling makes the prop invisible from inside) | Harmless (our prop is FrontSide too) — but it's a deviation to either document or drop. |
| D8 | **`isFlyLocked` signal missing** | not ported (monitor has no keysIdle state) | `we/ke` set `isFlyLocked`; the monitor's focal field shows "keysIdle" while locked | Cosmetic/phone-adjacent. P3. |
| D9 | **Edit-mode floor clamp doesn't lift the orbit target** | `main.js:1621`: `camera.position.y=max(NEAR_MIN, y)` only | `Fot` @5638676: lifts camera **and** `orbit.target` (when orbit enabled), then sets `maxPolarAngle=acos((0.1−target.y)/dist)` | Rare: when the editor camera is dragged below 0.1m, our orbit target stays low → next orbit swing dips. P3. |
| D10 | **guide div shown in the cameras view** | `ui.js:672`: `inCamMode = stageView==='cameras' || mode==='camera'` | `TKr.u` shows the guide div **only in camera mode**; the wall has no editor-viewport guide | Fine under through-the-lens (a tile IS full-frame at record aspect); if D1 is ported as a wall, drop it. |
| D11 | nav-ball pad hidden in the cameras view | `ui.js:1850`: `inEdit = mode==='edit' && stageView!=='cameras' && !playing` | pad shows over the wall (`TXt(t,x!==null)&&!n` @5876614) | Minor; keep-or-match decision. |

Everything else in the port's camera mode checks out against CaBu: `$e` port (`main.js:1731-1781`),
`Ha` dispatch (`_navTick` main.js:1610-1616), `Qt` drive (`drive.js` + `main.js:1803-1819`),
`q` reset, `Xe` click-to-lock (`monitor.js:145-153`), wheel (`main.js:1934`, `zoomByWheel`
1886-1891), zoom family (1861-1884), monitor bar (`monitor.js`), keymap (`main.js:346-380`),
`setMode` (1636-1648), `startFilming` (1651-1656), `exitCameraMode` (1659-1661),
`filmWithPhone`/`flyManualSegment` entries (`ui.js:864-869`, `965-969`), `applyCameraModeFov`
delegation to `updateFrameGuide` (ui.js:667-697 — the `c()` formula matches:
`fov=2·atan(fovScale·(35/max(aspect,1))/2/focal)`), constants (`const.js:276-314`).
`pageLive≡true` and the recording gates are documented port-model assumptions (the original's
`pageLive` gates exist @5243108/5243679/5641186+; on the live site they are true).

## A6. ISSUE 4 — prioritized fix/port list (ordered)

1. **P0 — Rebuild the Cameras stage view as the feed wall** (`NJr` @5862984, `Fes` @5872506,
   feed resolver `ce` @~5753600). Grid of aspect-correct tiles (one per camera, paginated 6/page),
   each rendering that camera's evaluated pose at its own focal + record aspect (scissor/viewport
   renders into one canvas, or a per-tile canvas like the original). Tile click =
   `stageView='editor' + select + focus` (@5882274). Delete `updateCameraThroughLens`
   (`main.js:1208-1289`) — the editor camera is never hijacked; orbit stays live behind the wall
   (the wall covers the canvas; pad may stay per D11). This alone removes "navigation incorrect
   when switching to camera view in the 3d view": the view is not a navigable viewport in the
   original — it's a monitor bank.
   *If a wall is too large a change this round*: minimum-in-original-spirit fix — keep
   through-the-lens but (a) auto-adopt the first/selected camera on entering the cameras view
   (never a frozen editor frame), (b) disable edit-WASD + wheel-nav while `inCam` (they currently
   fight the per-frame re-pin: `main.js:1907-1926`, `1934-1963`), (c) make the view behave like a
   tile: any canvas click = select+focus+`stageView='editor'` (@5882274).
2. **P0 — Stop forcing `stageView='editor'` on camera-mode entry** (`main.js:1752-1755`).
   Keep stageView intact through the mode transition (original `$e` never touches it); on
   `exitCameraMode` the user returns to the cameras wall (or editor view) they came from. Requires
   D1 (or at minimum the compose-order fix: lens restore must run before the pose save, which the
   current force achieves by accident — reorder explicitly: `updateCameraThroughLens` restore →
   save `re` → takeOver).
3. **P1 — viewSwitch segments re-sync from `page.stageView`** (`ui.js:80-92`): make the segmented
   control state-driven (subscribe → set `on` from `page.stageView`), matching `Ylt` @5870350.
4. **P1 — takeOver/activeCameraId segment-track fallback** (`main.js:1663-1670`): add
   `focusedCameraId` = selected camera ?? camera of `page.selectedSegment?.trackId ??
   page.selectedTrack?.trackId` before the first-camera fallback (`XHe` @5475663,
   `focusedCameraId` @5832891). Feeds takeOver + `focalLengthMm` + marker fov.
5. **P2 — key set hygiene** (`manipulate.js:815-878`): add the `qqt` modifier gate (skip adding
   when meta/ctrl/alt held; 'shift' always), and delete by code too (`G`/`X` @5679987/5680393).
6. **P3 — small exactness items**: unlock→`J()` re-aim hook in `createLook` (D6); drop or keep+
   document `_hideCameraMeshForMonitor` (D7); `isFlyLocked` signal for the focal field's idle state
   (D8); lift the orbit target in the edit floor clamp (D9, `Fot` @5638676); pad visibility over
   the wall (D11).

Port-unit shopping list (CaBu offsets): `NJr` @5862984 + `MJr` paging @~5862900 + tile CSS module
`im.*`; `Fes` @5872506 (`camerasView` branch @5874377); feed pose `ce/ve/se/he` @~5753400-5753900 +
`YKr` feedViewAt; `goToCamera` @5487530; `onCameraClick` wiring @5882274; `XHe` @5475663 +
`focusedCameraId` @5832891; `qqt`/`G`/`X` @5679987/5680393; `J` @5682325.

---

# PART B — ISSUE 6: "camera height can be part of the timeline instead of a separate popout?"

## B1. Does the ORIGINAL have a height row/curve ON the timeline? — **No.**

The timeline module (CSS `109if`, factory region @5169400-5192500; `yEr` scroller @5171397,
panel `TEr` @5175487, lane `NEr` @5181246, block render @5185900-5186500, keyframe layer @5192233)
contains **exactly these lane contents**: `block` (+`blockHuman/blockObject/blockCamera/
blockPainting/blockSelected`), `blockLabel`, `trimHandle`, `ghostBlock/ghostCaret/snapGuide`,
`kfLayer`+`kfDiamond` (transform-family keyframes, `cGt(se)&&i.jsx(l,{trackId,item,startS,ppsPx})`
mounted *inside* the block button), `navTrack/navThumb/navEdge*` (the take-range row below the
timeline), `laneAdd`, `editRow` (paint-finish row). **There is no height lane, no curve strip, no
Y-keyframe row, and no height interaction anywhere in the timeline.** Camera blocks carry only a
text label (`yHe(se)` for camera items — move/aim names) + optional keyframe diamonds
(`cam-transform` only) + trim handles. Height for cameras is edited in exactly two places: the
plan-view **Height slider** (camera object Y) and the plan-canvas **height-curve strip** (cam-path
`heightCurve`) — both described below.

## B2. What the height-curve UI in the original actually is (the `eFr`/MOr family)

Two mounts, both **plan-canvas contexts**, never the timeline, never a floating popout:

1. **The stage plan view** — `O$r` (plan module factory) @5532155. The plan canvas component `n`
   renders (@~5532380):

```js
h&&!S&&i.jsx(r,{className:dB.corner}),      // zoom control (standalone only)
h&&i.jsx(a,{className:gm.docked}),          // ← THE HEIGHT-CURVE STRIP, DOCKED
!h&&i.jsx(KFr,{cameras:…,onCameraClick:e.goToCamera}),   // camera pills (node plan only)
```

   `standalone (h)` is true only for the STAGE `PlanView` (@5535065:
   `PlanView:({frameId,…})=><><o …sliders footer…/><div class=F0.plan><n standalone/></div></>`,
   mounted in the shell @5629880 when `planShown && stageView==='editor'`; `planShown` @5817566 =
   `viewportMode==='plan' && mode==='edit' && !playSession`). So the strip is **docked inside the
   stage plan**, full plan width, at the bottom (CSS module `ngzzt`: `row/max/chart/grid/line/
   ruler/playhead/handleArm/handle/point/value/reveal/revealInner/docked` — `gm.docked` is the
   docked variant of the `gm.reveal` wrapper).
2. **The scene-node editor** — `HeightCurve:me` (@5898888 `me=It(()=>i.jsx(Y.HeightCurve,{readOnly:…}))`,
   exported @5911600) rendered in the node panel's `curve` slot (@10145007 `curve:e&&i.jsx(e.HeightCurve,{})`).

The strip component (`a` @5533967) wraps the SVG editor `MOr` @5433856 in a reveal container:

```js
a=It(({className:d,readOnly:u=!1})=>{
  const h=fe(e.heightMove),f=fe(e.locked),m=fe(t.compiling),g=!!h&&!m;
  return i.jsx("div",{className:qe(gm.reveal,d),"data-shown":g?"":void 0,"aria-hidden":!g,
    children:i.jsx("div",{className:gm.revealInner,children:y&&i.jsx(MOr,{
      curve:y.curve,maxM:y.maxM,
      playhead:v=>i.jsx(s,{startS:y.startS,durationS:y.durationS,xOfU:v}),
      disabled:f||u||!g, onLinePress:e.pressCurveLine, onPointPress:e.pressCurvePoint,
      onDrag:e.dragCurve, onRelease:e.releaseCurve, onPointRemove:e.removeCurvePoint,
      onScrub:e.scrubCurve},y.itemId)})})})
```

* **Visibility gate** = `heightMove` non-null (and not compiling) — it *reveals* (animated), it is
  not a popover; **`locked` (playing/recording) DISABLES it (grays), it stays visible** so the
  playhead sweep is watchable.
* **`heightMove`** @5488432 (verbatim):

```js
heightMove=Me(()=>{
  if(this.stroking.get())return null;
  const e=this.a.show.get().tracks,n=this.a.selectedSegment.get();
  let r=n&&e.find(a=>a.id===n.trackId),s=r?.items.find(a=>a.id===n?.itemId);
  if(s?.kind!=="cam-path"){                       // selected segment not a cam-path →
    const a=this.a.selectedIds.get(),o=a.length===1?a[0]:null;
    if(!o||this.a.objects.get()[o]?.kind!=="camera")return null;
    r=e.find(l=>l.characterId===o),               // …fall back to the single selected CAMERA
    s=r?.items.find(l=>l.kind==="cam-path"&&l.anchors.length>1)}
  return!r||s?.kind!=="cam-path"||s.anchors.length<2?null
    :{trackId:r.id,itemId:s.id,startS:s.startS,durationS:vd(s),
      curve:iBr(s),drawn:!!s.heightCurve,maxM:this.heightMaxM.get()}});
```

  i.e. the strip appears when **a cam-path segment is selected**, or when **a camera object is
  selected and its track has a cam-path with ≥2 anchors**.
* **`MOr`** @5433856 — the SVG editor itself: ruler strip (`d8=14px`, scrub on pointerdown in the
  ruler), chart `R5=64px`, gutter `zg=8`, point hit `jOr=8`, handle hit `IOr=7`, polyline
  resolution `iit=160` samples of `rC(curve,u)`, grid lines at .25/.5/.75, points r=5 with
  `data-selected`, in/out handle arms + r=4 handle circles (mirrored unless Alt), a value label
  `ceZTpI {shownHeight}` on the selected point, `max Xm` label in the header row, and the playhead
  marker `NOr` @5436586 (`g.playhead`: vertical line + pentagon badge). Interactions:
  press-line→insert (`cBr`), press-point/side→drag (`dBr`/`uBr`, Alt = break mirror),
  double-click interior point → remove (`pBr`), drag in ruler → scrub (`scrubCurve` → seek).
* **Curve model + editors** (verbatim in our port already): `Ere` point factory @5484366
  (`{u,heightM,in:[0,0],out:[0,0],auto:!0}`), `kpe` auto-tangents ∓Δu/3 @5484412, `iBr`
  default-curve-from-anchors @5484556 (9 samples `Rye=9`, flat threshold `oBr=.01`, pace-remapped
  `lBr`), `rC` cubic-bezier-with-x-binary-search eval @4327811, `cBr` @5485001, `dBr` @5485173,
  `uBr` @5485408, `hBr`/`rIe`/`tXt` clamp helpers @5485812-5485878, `pBr` @5486016, `Wit`/`Kat`
  round+clamp @5484280 (min `QHe=.2`, default max `eXt=4`, rounding `nBr=.1`), validation `dGt`
  @4327433, constants `bBr=20,yBr=12,vBr=4,xBr=50` @5486127-6147.
* **Store op** `setPathHeightCurve` @5569256: cam-path gate + `dGt` validation → updateTrackItems.
  `patchPathAnchors` @~5569256 region drops `heightCurve` when anchor heights change and the curve
  no longer matches (`yUr` test) — our `store.js:1048` has this.
* **`heightMaxM`** @5491469: max over non-prop/camera/target/spotlight object tops (via `CHe`
  bounds), `scene extent>20m ? floor 12 : floor 4`, `+4` headroom, `ceil`, clamp ≤50.
* **3D preview of the curve**: `Avr` @4328132 — cam-path + heightCurve → 64-pt 3D curve (the drawn
  path with Y replaced by the curve); per-anchor **height posts + a draggable height anchor puck on
  the plan/3D path** exist too (`pathHeightAnchor` pickers in `Kqr` @~5686800-5687100:
  `{kind:"height",index}` → `setPathAnchorHeight(index, PHr(y))`), and the 3D path editor renders
  vertical posts above `bKr=.25` (TKr path visuals @5738000+).

**Verdict for our port:** our `plan.js:1207-1342` (`buildCurvePanel`) ports the *interaction model*
of `MOr` verbatim (constants, hit radii, gates, double-click, scrub) but mounts it as a **floating
340px popout** (`css/app.css:559` — `position:absolute; bottom:14px; left:50%; … width:340px`)
over the plan canvas, and it **hides while playing** (`plan.js:1251` gates `!app.page.playing`)
where the original *disables but keeps visible*. The original strip is a **docked full-width reveal
row at the bottom of the plan canvas** (`gm.reveal`/`gm.revealInner`/`gm.docked`), height 78px
(14 ruler + 64 chart).

## B3. How height is represented in scene JSON (original)

* **`cam-path`** — the ONLY item with a curve. App-side item field:
  `heightCurve: [{u, heightM, in:[dx,dy], out:[dx,dy], auto}]` (u strictly 0→1, first=0, last=1;
  `heightM ∈ [0, 20]` per `dGt`'s `Tvr` bound; in.dx≤0, out.dx≥0). While a valid curve exists the
  camera flies `rC(curve, elapsed/duration)` **INSTEAD of the anchors' Y** (eval case @5460405:
  `if(t.heightCurve&&(h[1]=rC(t.heightCurve, n>0?e/n:1)))`). Server-facing serialization @5318178:
  `{action:"path", aim, subject_id?, frame_offset?, speed, speed_units_per_s, points, …,
  t.heightCurve?{heights_m: M9r(t.heightCurve)}:{}}` — `M9r` @5317918 = **9 evenly-spaced
  `rC` samples** at toPrecision(3) (export/telemetry only; "re-creating the path drops
  heights_m" per the embedded agent docs @5327699). Load-side normalization @4923383 drops an
  invalid `heightCurve`.
* **`cam-move`** — a single `height_delta` (units) for `crane_up/crane_down/spiral` only
  (`DDe` @3927582); `direction/angle_deg` for `orbit/spiral/pan_sweep` (`LDe`), `distance_scale`
  for `dolly_in/dolly_out/dolly_zoom` (`HDe`). No curve, no keyframes.
* **`cam-still`** — no height at all; the camera object's base `position[1]` is the height
  (edited by the plan **Height slider** = `setCameraHeight` @5500876 → `setCameraY`: keeps x/z,
  `Wit(n, heightMaxM)` clamp, commits a "translate").
* **`cam-transform`** — `keys: [{tS, position[3](incl. Y), rotation, scale, focalLengthMm}]` —
  this is where **focal keyframes** live (the "dolly-zoom rows" analog); rendered on the timeline
  as `kfDiamond`s only (position/focal values are NOT drawn as curves).
* **`cam-manual`** — `samples: [{p:[x,y,z], q:[x,y,z,w], fovDeg}]` recorded at 20Hz (`NGr`
  @5638776, `Hye=1/nC`); Y is inside `p[1]`. Recorded only while a take is rolling (live-only arc).

## B4. Our port — divergences (file:line vs CaBu offsets)

Port: `editor/js/plan.js` (model + panel), `editor/js/store.js` (persistence), `editor/js/tracks.js`
(eval), `editor/css/app.css`.

| # | Divergence | Port | Original | Impact |
|---|---|---|---|---|
| H1 | **`heightMove` lacks the selected-SEGMENT branch** | `plan.js:840-846`: only "single selected CAMERA → its track's first cam-path"; plus stroking gate | `heightMove` @5488432: **selected segment that is a cam-path FIRST**, then the selected-camera fallback; stroking hides | Selecting a cam-path **segment** on the timeline (the natural thing to do when you want to edit its height) does NOT reveal the editor in our port — you must go select the camera object. Directly feeds the user's request. |
| H2 | **Floating popout vs docked strip** | `plan.js:1207-1342` + `css/app.css:559`: absolute 340px panel, bottom-centered, over the plan canvas | `MOr` in a `gm.reveal`/`gm.revealInner` wrapper with `gm.docked` (@5533226), full plan-canvas width, bottom-docked, 78px tall (14 ruler + 64 chart) | Visual/UX only; the interaction model is verbatim. |
| H3 | **Hide-while-playing vs disable-while-playing** | `plan.js:1251`: `show = … && !app.page.playing` (hides during playback) | `disabled: f||u||!g` where `f=locked` (`isPerformancePlaying\|\|isRecording`) — the strip **stays visible, grayed**, so the playhead sweep is watchable (`a` @5533967) | During rehearsal the height curve vanishes in our port. |
| H4 | **Playhead marker has no badge** | `plan.js:1270`: a bare `<line class=curve-playhead>` | `NOr` @5436586: line + pentagon badge path `M t-5 2 h10 v6 l-5 5 l-5 -5 z` | Cosmetic. |
| H5 | (not ported) **3D per-anchor height pucks** | 3D path editor ports anchors + in/out handles only | `pathHeightAnchor` pickers (`{kind:"height",index}` → `setPathAnchorHeight(i, PHr(y))`) in `Kqr` @~5686800-5687100; plan/3D visuals draw posts + pucks for anchors above `bKr=.25` (`TKr` path visuals @~5738100) | Secondary edit path missing (fine to defer). |

Already verbatim in the port: the whole curve model (`plan.js:665-733` = `Ere/kpe/iBr/cBr/dBr/uBr/
hBr/rIe/pBr/Wit/Kat`), `heightMaxM` (`plan.js:814+`), the store ops (`store.js:1026` `setPathHeightCurve`
incl. the cam-path gate + validation; `store.js:1048` anchor-change drops the curve), schema
validation (`schema.js:172`), eval (`tracks.js:324` curve replaces Y), `MOr` interaction constants +
hit tests + double-click + ruler scrub (`plan.js:1208-1326`).

## B5. If the user wants height ON the timeline — sanctioned deviation, and the closest original patterns

The original has **no timeline height UI**; moving our height editor onto the timeline is a
**sanctioned deviation** (user-mandated). The closest original patterns to imitate, in order of
fit:

1. **`SegmentKeyframes` (`kfLayer`/`kfDiamond`) @5192233** — an absolutely-positioned `<span
   class=kfLayer>` **inside the camera block button**, children positioned by
   `left:S(tS·ppsPx)`, with active/selected states and pointerdown-drag. A height strip should
   mount the same way: **inside (or immediately under) the cam-path block**, full block width
   (`(me-ie)·ppsPx`), so the curve's u-domain == the block's time span — exactly like the plan
   strip's u-domain == the item duration (`MOr` maps u over the item, and its playhead `s`
   computes `(performanceTimeS−startS)/durationS`). Reuse `MOr`'s geometry (14px ruler + 64px
   chart ≈ 78px, gutter 8, points r=5/hit 8, handles r=4/hit 7, 160-sample polyline) so the
   port's existing `buildCurvePanel` SVG guts can be re-hosted almost verbatim — only the
   coordinate frame changes (u↔px against the block, and `maxM` from `heightMaxM`).
2. **The take-range row (`navTrack`/`navThumb`) @5171397-region** — a dedicated full-width row
   docked **below the timeline lanes**; this is the precedent if the height editor should be a
   *timeline row* (one strip bound to the selected cam-path) rather than a per-block overlay.
3. **The `gm.reveal` docked strip** (@5533967) — if the user would accept keeping it near the
   plan, the *original-exact* fix is simply to dock our popout: full plan width, bottom-anchored,
   reveal animation, **stay-visible-but-disabled while playing** (gate on `locked`, not
   `!playing`).

Recommended port plan ( ISSUE 6 ):
1. **P0 — Fix the reveal gate first** (`plan.js:840-846`): port the original `heightMove` order —
   selected **segment** is a cam-path → use it; else single selected camera → its track's first
   cam-path (`@5488432`). This is what makes the strip follow timeline *segment* selection, and it
   is a prerequisite for the timeline placement feeling native.
2. **P0 — Host the curve editor under the cam-path block in the timeline**
   (`ui.js` timeline lane builder ~1306-1340 renders `.lane` blocks; the kfLayer mount point is the
   same render path). Keep `PlanStore.heightMove/dragCurve/…` (`plan.js:813-910`) as the model —
   it is already verbatim — and re-target `buildCurvePanel`'s SVG (plan.js:1249-1286) at the block
   rect; x = blockLeft + u·blockWidth. Show it under the same gate as the original
   (`heightMove` + selected-segment-or-selected-camera), plus `mode==='edit'`.
3. **P0 — Keep the strip visible but disabled while playing** (original `locked` semantics,
   `plan.js:1251` currently hides it).
4. **P1 — Also dock a copy under the stage plan** (the original's only placement): reuse the same
   component in a `gm.docked`-style full-width row at the bottom of the plan canvas
   (`css/app.css:559` becomes `position:absolute; left:0; right:0; bottom:…; width:auto`).
5. **P1 — Playhead badge**: add the `NOr` pentagon badge (@5436586) on the strip's playhead line
   (our port draws only the line, plan.js:1270).
6. **P2 — 3D height anchors**: the original also allows dragging per-anchor height pucks on the
   path in 3D (`pathHeightAnchor` pickers + `setPathAnchorHeight`, TKr visuals with posts above
   0.25m); our 3D path editor already ports anchors+handles — the height puck is the missing
   sibling (bundle: `Sn` @~5686800 `{kind:"height"}`, `qr` height-drag plane math @~5687000,
   visuals @~5738100).

---

## Appendix — verbatim reference block (CaBu, for the next porter)

* `$e` applyMode @5686144; `Ha` tick @5693276; `Qt` drive @5694344; `sa` edit-WASD @5693916;
  `Qe` nav-ball @5695417; `q` seed @5679611; `te` WASD gate @5679838; `G/X` keys
  @5679987/5680393; `ye` wheel @5681856; `J/le/pe/oe` free-look family @5682325-5682950;
  `we/ke` lock/unlock @5682947/5683021; `Xe` click-lock @5685869; consts @5669921; `t7=50` @5474251.
* `XHe` @5475663; `$Kt` @5476748; `V8` @4912200; `focusedCameraId` @5832891;
  `startFilming` @5154304; `exitCameraMode` @5154513; `activeCameraId` @5153489;
  `filmWithPhone`/`flyManualSegment`/`armPhoneFlight` @5831275-5831470; `setMode` @5840388;
  `startManualFlight` @5559457; `finishManualFlight` @5559798; sampler `NGr` @5638776.
* `OGr` @5639408; `Fot`/`_Xt=.1` @5638676/5638621; frame loop `te()` @5792104; `A()` @5789743.
* Frame guide `TKr` @5736912 (`c` @5736937, `u` @~5737050, resize `S` tail);
  `uZt` @5203751; `Oyr`/`knt`/`EEe`/`YWt=35` @3930020-3930246; `dZt=96` @5203744.
* Monitor `MMr` @5241034 (zoom family @5242400-5243300, keymap @5243679); `NMr` @5244618;
  `EMr` @5235979; `SMr` height field @5233126; `TXt` @5668969.
* Feed wall `NJr` @5862984; `Fes` @5872506; tile click wiring @5882274; `goToCamera` @5487530;
  viewSwitch `Mes` @5870159/`Ylt` @5870350; shell state @~5629300-5630700.
* Height curve: `heightMove` @5488432; `heightCurveShown` @5489017; curve ops @5489068-5490561;
  `heightMaxM` @5491469; `selectedCamera`/`flownHeightM` @5491939/5493027; `setCameraHeight`
  @5500876; `setPathHeightCurve` @5569256; model consts @5483853-5484280; `rC` @4327811; `Avr`
  @4328132; `dGt` @4327433; eval @5460405; serialize @5318178 + `M9r` @5317918 (Dat=9);
  normalize @4923383; `MOr` @5433856 (consts @5433801); `NOr` @5436586; `gm` css map @~5433640;
  strip mounts @5533226 (docked, stage plan) + @5898888/@10145007 (node editor).
* Timeline (no height): module @5169400-5192500; `NEr` lane @5181246; block @5185900;
  `kfLayer` @5192233; `navTrack` @5171397.
