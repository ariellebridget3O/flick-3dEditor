# Actions palette (M5r family) — round 8 port-spec MAP

VERBATIM byte-identical extraction of the flick.art "Actions palette" subsystem
from `analysis/index-DBE17t4T.js` (single-line minified).

- Tool: `scripts/r8_palette_extract.py` (r7 pattern: signature anchors +
  string/regex-aware brace matching + `node --check` per unit).
- Output: `analysis/tmp_palette_exact/fn_<name>.js` (+ `fn_index.json`).
- **All 68 units verified byte-identical to the bundle** (byte ranges computed by
  real UTF-8 prefix length; cross-checked against `grep -bo` — note: r7's
  "+1 per non-ASCII char" byte approximation under-counts 3-byte chars; r8 uses
  exact UTF-8 accumulation. Char offsets below are decode-text offsets as in
  find_ctx.py).
- CSS chunk files are NOT present in analysis/ (only `editor/css/app.css`, which
  lacks the hashes) — CSS-module class-name strings are recorded verbatim from
  the bundle; style rules are unavailable.
- Resolved English UI strings come from the live DOM capture
  `analysis/tmp_b/editor_main_dom.html` (Animate tab active). Ids not present in
  that capture are flagged **IT** (semantic equivalent is a guess).

Entry: `function M5r({...})` — char 5121125, **byte 5137181** (grep -bo verified),
4694 chars. Call site: `i.jsx(M5r,{...})` inside `$5r` at char 5132826
(byte 5148877; `i.jsx(M5r` byte 5149087 per grep).

## 1. Caller wiring (`$5r`, the only call site)

```
$5r(t)  @char 5132739 (byte 5148795)
  e = new D5r   humanoid clip-tile renderer   → drawTile / startTilePreview / stopTilePreview
  n = new H5r   cube object-tile renderer     → drawObjectTile / startObjectPreview / stopObjectPreview
  r = new y5r   camera-move-tile renderer     → drawCameraTile / startCameraPreview / stopCameraPreview
  ActionsPanel = Mt(() =>                     // memo, re-renders on signal reads
    i.jsx(M5r, {
      show:              !he(t.collapsed) && he(t.panelsVisible),
      onClose:           t.toggleCollapsed,
      widthPx:           he(t.widthPx),
      onWidthChange:     t.setWidthPx,
      onActionDragStart: t.setDraggingAction,       // store.draggingAction.set(payload)
      onActionDragEnd:   t.clearDraggingAction,     // store.draggingAction.set(null)
      canAddAction:      d => selectedId!==null && t.canDropActionOnObject(selectedId, d),
      onAddActionClick:  d => { selectedId!==null && t.appendActionToObject(selectedId, d) },
      onPathDragStart:   t.onPathDrag,              // = tips.notify("onPathDrag") (onboarding tip trigger)
      onPlayDragStart:   t.onPlayDrag,              // = tips.notify("onPlayDrag")
      requestedTab:      he(t.requestedTab),        // transient signal; set by selection, cleared via queueMicrotask
      selectedFigureName: selected object is simple_figure ? (name || _("YUAoyO")) : null,
      onSwitchToHumanClick: () => t.pickPersonKind(selectedId, "humanoid", "actions"),
      drawTile:e.drawPose, startTilePreview:e.startLoop, stopTilePreview:e.stopLoop,
      drawObjectTile:n.drawPose, startObjectPreview:n.startLoop, stopObjectPreview:n.stopLoop,
      drawCameraTile:r.drawPose, startCameraPreview:r.startLoop, stopCameraPreview:r.stopLoop }))
  disposeActionsPanel = () => { e.dispose(); n.dispose(); r.dispose() }
```

Actual call site (char ~5876346): passes
`{panelsVisible:L, collapsed:Z.actionsCollapsed, toggleCollapsed:Z.toggleActionsCollapsed,
widthPx:Z.rightWidthPx, setWidthPx:Z.setRightWidthPx, setDraggingAction:n.setDraggingAction,
clearDraggingAction:n.clearDraggingAction, selectedId:n.selectedId, objects:n.objects,
pickPersonKind:n.pickPersonKind, canDropActionOnObject:n.canDropActionOnObject,
appendActionToObject:n.appendActionToObject, onPathDrag:oe.triggers.onPathDrag,
onPlayDrag:oe.triggers.onPlayDrag, requestedTab:we}`.

Side wiring around the call site:
- `Z.actionsCollapsed=Ne(!0)` (palette CLOSED by default); `toggleActionsCollapsed`
  toggles and fires `Z.onActionsOpened` when opening; `Z.openActions/closeActions`.
- `Z.onActionsOpened = n.clearSelectionForWindow`.
- `n.onActionAdded = () => Z.closeActions()` — **adding an action closes the palette**.
- `requestedTab` (`we=Ne(null)`): on selection of object `id`:
  `we.set(kind==="camera" ? "camera" : kind==="humanoid" ? "animate : "move")` then
  `queueMicrotask(() => we.set(null))` (M5r copies it into local state via useEffect).
- `pickPersonKind(id,"humanoid","actions")` (store method @char 5810861): wraps
  `switchPersonKind(id,"humanoid",{source:"actions"})` in begin/endEditGesture, then an
  error-toast with Undo (`_("avAkAt")`) that retries with `removeHumanOnly:true`.
- Width clamp: `rightWidthPx:{min:200,max:520,fallback:260}` via `Xj`.

## 2. Inventory (68 units; byte ranges = grep -bo exact)

| name | byte range | size B | kind | role |
|---|---|---|---|---|
| Ze | 1094689..1094809 | 120 | fn | classnames helper (clsx-like join) |
| consts_bP | 3925085..3925914 | 829 | stmt | cinematic camera moves: bP, YLe, QLe, JLe, yP, _1 presets, s2r=10, a2r=120 |
| eDe | 3925914..3925983 | 69 | fn | smoothstep easing |
| i2r | 3925983..3926036 | 53 | fn | fov clamp 10..120° |
| KCe | 3926036..3927272 | 1236 | fn | camera-move pose evaluator {position,lookAt,fovDeg} |
| UWt | 4908997..4909039 | 42 | fn | ghost hover height: kind==="target" ? zWt(1) : 0 |
| consts_zWt | 4909039..4909064 | 25 | stmt | zWt=1 (+ Jw=6, WWt=1.6 neighbors) |
| consts_Lhe | 5079370..5080961 | 1591 | stmt | 46-clip catalog Lhe + XSr map |
| IDe | 5080961..5080998 | 37 | fn | clip duration lookup (default 1) |
| consts_action_mimes | 5080998..5081204 | 206 | stmt | $v MIME, YSr/QSr object actions, xie/JSr camera actions |
| e3r | 5081204..5081345 | 141 | fn | DRAGSTART payload serializer |
| t3r | 5081345..5081381 | 36 | stmt | Set(Lhe ids) for parse validation |
| n3r | 5081381..5081533 | 152 | fn | DEFAULT DURATION per action kind |
| sje | 5081533..5081630 | 97 | fn | camera action default duration |
| a$ | 5081630..5082077 | 447 | fn | drop-coercion rules payload×object-kind |
| bGt | 5082077..5082843 | 766 | fn | normalize legacy drag kinds (cam-* etc.) |
| Art | 5082843..5082912 | 69 | fn | canAddAction primitive (bGt+a$+yGt) |
| yGt | 5082912..5083103 | 191 | fn | action equality |
| r3r | 5083103..5083236 | 133 | fn | payload → ["object","human","camera"] target tags |
| MDe | 5083236..5083602 | 366 | fn | DROP payload parser (inverse e3r) |
| NDe | 5083602..5083958 | 356 | fn | cinematic move i18n labels (8 ids) |
| s3r | 5083958..5084202 | 244 | fn | camera action i18n labels |
| PDe | 5084202..5084483 | 281 | fn | camera track-item kind labels (timeline) |
| ODe | 5154398..5154444 | 46 | fn | clip label fallback (PU or raw id) |
| consts_PU_vGt_Crt | 5084483..5085863 | 1380 | stmt | PU 46 clip→i18n map; vGt (45 clips); Crt resize CSS strings |
| Dhe | 5085863..5086358 | 495 | fn | resize handle (edge,sign,onSizePx) |
| consts_Zr | 5086358..5087045 | 687 | stmt | Zr CSS module (19 class strings, kwh50) |
| RDe | 5087045..5087278 | 233 | fn | search input |
| FDe | 5087278..5087711 | 433 | fn | tab strip |
| consts_c5r | 5132570..5132641 | 71 | stmt | humanoid glb path, jP=1.75, M_Main |
| $he | 5132641..5132768 | 127 | fn | preview material normalize (roughness 1, M_Main→#f29a5c) |
| u5r | 5132768..5133219 | 451 | fn | mannequin fallback builder (capsules) |
| Rrt | 5133219..5133290 | 71 | fn | skeleton dispose |
| consts_Frt | 5133290..5133466 | 176 | stmt | camera-tile consts Frt=128, Ort=3, h5r, p5r, Lrt=40, f5r="idle", m5r still-t map |
| g5r | 5133466..5133504 | 38 | fn | is cinematic move (bP.includes) |
| b5r | 5133504..5133545 | 41 | fn | triangle wave (camera loop ping-pong) |
| y5r | 5133545..5136111 | 2566 | class | CAMERA TILE PREVIEW renderer |
| consts_ff_IP | 5136111..5137181 | 1070 | stmt | ff CSS module (1a7mk), IP=128, C5r captions, E5r list, j5r, I5r icon map |
| M5r | 5137181..5141875 | 4694 | fn | THE ACTIONS PALETTE component |
| N5r | 5141875..5142134 | 259 | fn | add-button tile |
| P5r | 5142134..5142906 | 772 | fn | camera action tile |
| R5r | 5142906..5143499 | 593 | fn | clip tile (canvas 128²) |
| F5r | 5143499..5143928 | 429 | fn | path tile (spline icon) |
| O5r | 5143928..5144509 | 581 | fn | object action tile (canvas 128²) |
| Drt | 5144509..5144580 | 71 | fn | skeleton dispose (D5r twin) |
| consts_Brt | 5144580..5144602 | 22 | stmt | Brt=128, L5r=.35 (thumb pose at 35% of clip) |
| D5r | 5144602..5146868 | 2266 | class | HUMANOID CLIP TILE renderer |
| consts_Hrt | 5146868..5146949 | 81 | stmt | Hrt=128, h2e=2.4, B5r still fractions |
| $rt | 5146949..5146990 | 41 | fn | triangle wave (H5r) |
| H5r | 5146990..5148795 | 1805 | class | OBJECT-ACTION CUBE TILE renderer |
| $5r | 5148795..5149875 | 1080 | fn | CALLER: ActionsPanel factory (wiring above) |
| consts_V6 | 5376693..5376734 | 41 | stmt | V6="application/x-stage-component" |
| BNr | 5378715..5378745 | 30 | fn | component kind getter |
| LU | 5378745..5378810 | 65 | fn | component cache key (prop:<key> else kind) |
| consts_AHr | 5537056..5537220 | 164 | stmt | shared const chain; relevant: AHr=2, CHr=.5, EHr=15, zj=clamp |
| setDraggingAction | 5543181..5543229 | 48 | method | draggingAction.set(payload) |
| clearDraggingAction | 5543229..5543283 | 54 | method | draggingAction.set(null) |
| resolveActionForObject | 5543283..5543348 | 65 | method | a$(payload, objects[id].kind) |
| canDropActionOnObject | 5543348..5543438 | 90 | method | canOwnTrack && resolveActionForObject≠null |
| canOwnTrack | 5543438..5543480 | 42 | method | !Xu(objects,id) (not a camera target) |
| addActionToTrack | 5543480..5544148 | 668 | method | dispatch resolved action → add*Item |
| appendActionToObject | 5544148..5544343 | 195 | method | THE ADD-ACTION FLOW |
| consts_Bit | 5618938..5619004 | 66 | stmt | drop-glow consts Bit/Hit/OUr/LUr + DUr |
| BUr | 5619004..5621190 | 2186 | fn | VIEWPORT ACTION-DROP controller |
| consts_HUr | 5621190..5621204 | 14 | stmt | HUr=.45 |
| $it | 5621204..5621294 | 90 | fn | ghost material clone |
| $Ur | 5621294..5621422 | 128 | fn | ghost material apply |
| VUr | 5621422..5622682 | 1260 | fn | COMPONENT drop controller (ground ghost) |

Not extracted (generic infra, recorded only): `p` React, `i` jsx factory, `Ne`
signal, `he` signal-reader-for-React, `Mt` memo, `qt` effect+disposer, `Ia` i18n
context hook, `_._` static i18n, `M` i18n text node, `K` icon component, `Ws`
button, three.js aliases (`t0` WebGLRenderer, `Kh` Scene, `Xo` PerspectiveCamera,
`VC` HemisphereLight, `ax` DirectionalLight, `Vt` Mesh, `Io` MeshStandardMaterial,
`mi` BoxGeometry, `Mi` PlaneGeometry, `jU` CapsuleGeometry, `Ku` Sphere-ish
geometry, `Ci` Group, `go` Box3, `Ge` Vector3, `On` Vector2, `Bv` Raycaster,
`r2` Plane, `RR` SkinnedMesh, `Ihe` AnimationMixer, `Bhe` GLTFLoader, `m_` THREE),
`Xqt` component-model loader cache (belongs to the components panel, 2 hops).

## 3. Drag payload model (EXACT)

MIME (dataTransfer.type): **`application/x-stage-action`** (`$v`).
Components palette uses a second MIME `application/x-stage-component` (`V6`).

Serialize (`e3r`, on dragstart):
```js
{kind:"clip",   clip:"dance"}   -> "clip:dance"
{kind:"object", action:"rotate"}-> "object:rotate"
{kind:"camera", action:"still"} -> "camera:still"
{kind:"path"}                   -> "path"
{kind:"play"}                   -> "play"
```
`dataTransfer.effectAllowed="copy"`; payload object also handed to
`onActionDragStart` (stored in `draggingAction` signal).

Parse (`MDe`, on dragover/drop) — with validation sets:
- `"path"` → `{kind:"path"}`
- `"play"` → `{kind:"play"}`
- `"clip:<id>"` → `{kind:"clip",clip:<id>}` iff `t3r.has(id)` (46 catalog ids)
- `"object:<a>"` → `{kind:"object",action:<a>}` iff `QSr.has(a)`;
  QSr = rotate, revolve, scale-up, scale-down, transform, rig-transform (YSr)
- `"camera:<a>"` → `{kind:"camera",action:<a>}` iff `JSr.has(a)`;
  xie = still, path, follow, transform, manual, orbit, dolly_in, dolly_out,
  dolly_zoom, crane_up, crane_down, spiral, pan_sweep
- else `null`.

Legacy/internal kind normalization (`bGt`): rotate→object:rotate, revolve→
object:revolve, `{kind:"scale",factor}` → scale-up (factor≥1) else scale-down,
transform→object:transform, rig-transform→object:rig-transform, cam-still→
camera:still, cam-move{move}→camera:<move>, cam-path→camera:path, cam-follow→
camera:follow, cam-transform→camera:transform, cam-manual→camera:manual.

Drop rules (`a$`, target kind = objects[id].kind):
- target "camera": camera-t → itself; path-t → `{kind:"camera",action:"path"}`;
  object transform-t → `{kind:"camera",action:"transform"}`; else null.
- payload camera: action "path" → `{kind:"path"}` iff `Q0(kind)` (path-drawable);
  action "transform" → `{kind:"object",action:"transform"}` iff Q0(kind); else null.
- payload object: "rig-transform" only onto "humanoid"; other actions onto Q0
  kinds (cube/humanoid/etc.).
- payload path: onto Q0 kinds. Payload clip: only via final `e==="humanoid"`.
`Art(t,e)` = can-add primitive; store's `canDropActionOnObject(id,payload)` =
`canOwnTrack(id)` (not referenced as a camera target — `Xu`) AND
`resolveActionForObject(id,payload)!==null`.

`r3r(payload)` → highlight bucket keys: cube-capable → "object", humanoid →
"human", camera → "camera".

## 4. E5r — object-action tiles (verbatim, char 5120560)

```js
E5r=[
 {action:"rotate",    icon:"rotate",  label:i.jsx(M,{id:"BulyBf"}), color:"var(--stage-action-object)"},
 {action:"revolve",   icon:"orbit",   label:i.jsx(M,{id:"NP8KUz"}), color:"var(--stage-action-object)"},
 {action:"scale-up",  icon:"expand",  label:i.jsx(M,{id:"5DdjZ9"}), color:"var(--stage-action-object)"},
 {action:"scale-down",icon:"collapse",label:i.jsx(M,{id:"8Mw+hK"}), color:"var(--stage-action-object)"},
 {action:"transform", icon:"sliders", label:i.jsx(M,{id:"OCy3k9"}), color:"var(--stage-action-object)"}]
```
All color `var(--stage-action-object)`; camera tiles use `j5r="var(--stage-action-camera)"`;
perform tiles use `var(--stage-action-human)`.

## 5. vGt — animate-tab clip list + 46-catalog reconciliation

`vGt=Lhe.filter(t=>t.id!=="a_tpose")` — **45 of the 46 catalog clips**; absent:
**a_tpose** (T-pose bind pose, rig base only — never offered as an action).
Order = Lhe catalog order (= GLB animation array order, HUMANOID.md §4):
crouch_fwd, crouch_idle, dance, death01, driving, fixing_kneeling, hit_chest,
hit_head, idle, idle_talking, idle_torch, interact, jog_fwd, jump, jump_land,
jump_start, pickup_table, pistol_aim_down, pistol_aim_neutral, pistol_aim_up,
pistol_idle, pistol_reload, pistol_shoot, punch_cross, punch_enter, punch_jab,
push, roll, roll_rm, sitting_enter, sitting_exit, sitting_idle, sitting_talking,
spell_simple_enter, spell_simple_exit, spell_simple_idle, spell_simple_shoot,
sprint, swim_fwd, swim_idle, sword_attack, sword_attack_rm, sword_idle, walk,
walk_formal.
Durations + order verified identical to HUMANOID.md §4 (46 entries, 67.294 s
total; UI list = 45). No grouping inside vGt — the only visual grouping is
section labels "Perform" (play + rig-transform tiles) and "Clips" (vGt).

## 6. PU — clip id → i18n key (verbatim at char 5068427)

```
a_tpose→ivUKpx   crouch_fwd→14O+8x  crouch_idle→EhMmhv dance→1aPnDT
death01→jINBe7   driving→SwaDxZ     fixing_kneeling→92isyX  hit_chest→0V0iWr
hit_head→xxiXpT  idle→QSzGDE        idle_talking→7yxWIj     idle_torch→61NR+o
interact→EVGGg9  jog_fwd→8nFLcY     jump→FYHBjm  jump_land→37TlB+  jump_start→5DgDp+
pickup_table→yKIk+n  pistol_aim_down→LYTCjM  pistol_aim_neutral→74zHww  pistol_aim_up→YHuyPv
pistol_idle→ErWit9   pistol_reload→HAMzB6    pistol_shoot→6Z/SAA
punch_cross→CTrrFE   punch_enter→pl86qu      punch_jab→vruyOQ    push→uO9WLl
roll→g39d9I      roll_rm→7XE2wC     sitting_enter→WajTs+    sitting_exit→IzlCXl
sitting_idle→Un1a9U  sitting_talking→yWdRNF  spell_simple_enter→tyKbA5
spell_simple_exit→h6vxu0  spell_simple_idle→LIXxUH  spell_simple_shoot→oTuKqO
sprint→VNbzs6    swim_fwd→VQ2TmB    swim_idle→3pu8zC   sword_attack→3Rl7LJ
sword_attack_rm→KxmzP0  sword_idle→csjJ5M  walk→SUJByP  walk_formal→kQJKnM
```
Resolved English (DOM capture): Crouch Fwd, Crouch Idle, Dance, Death01,
Driving, Fixing Kneeling, Hit Chest, Hit Head, Idle, Idle Talking, Idle Torch,
Interact, Jog Fwd, Jump, Jump Land, Jump Start, Pickup Table, Pistol Aim Down,
Pistol Aim Neutral, Pistol Aim Up, Pistol Idle, Pistol Reload, Pistol Shoot,
Punch Cross, Punch Enter, Punch Jab, Push, Roll, Roll Rm, Sitting Enter,
Sitting Exit, Sitting Idle, Sitting Talking, Spell Simple Enter, Spell Simple
Exit, Spell Simple Idle, Spell Simple Shoot, Sprint, Swim Fwd, Swim Idle, Sword
Attack, Sword Attack Rm, Sword Idle, Walk, Walk Formal.
Fallback `ODe(t,i18n)`: `t in PU ? i18n._(PU[t]) : t`.

## 7. Camera actions (xie), labels (s3r/NDe), icons (I5r)

- `xie=["still","path","follow","transform","manual",...bP]` (13 actions).
  bP = orbit, dolly_in, dolly_out, dolly_zoom, crane_up, crane_down, spiral,
  pan_sweep. Only bP moves get live canvas tiles (`g5r`=bP.includes); the other
  five render icon thumbs.
- `s3r`: still→6Kqbka, path→I6gXOa, follow→MKEPCY, transform→OCy3k9,
  manual→zmwvG2, else `NDe(t)`.
- `NDe` (cinematic): orbit→k1ojqx, dolly_in→DMQ5rS, dolly_out→i7+TXP,
  dolly_zoom→2HQ6pZ, crane_up→QQHcNA, crane_down→0+8v4P, spiral→d8dJnh,
  pan_sweep→DzL+ir. **IT** (ids; icon-semantic names certain from keys).
- `I5r={still:"stop",path:"spline",follow:"locate",transform:"sliders",manual:"phone-camera"}`
  (K icon names; fallback `"video"` for unmapped).
- `_1` presets (durationS, angleDeg, heightDeltaUnits, distanceScale):
  orbit {8,360°,0,1}; dolly_in {4,0°,0,.5}; dolly_out {5,0°,0,2};
  dolly_zoom {4,0°,0,.5}; crane_up {5,0°,3,1}; crane_down {5,0°,3,1};
  spiral {8,180°,3,1}; pan_sweep {6,90°,0,1}.

## 8. n3r — default durations when dropped on a timeline lane (verbatim)

```js
function n3r(t){return t.kind==="clip"?N8:t.kind==="object"?t.action==="transform"||t.action==="rig-transform"?Jae:N8:t.kind==="camera"?sje(t.action):0}
function sje(t){return t in _1?_1[t].durationS:t==="path"||t==="manual"?0:t==="transform"?Jae:N8}
```
`Jae=4` (transform family), `N8=5` (default clip/object), camera presets use
`_1[action].durationS` (orbit 8, dolly_in 4, dolly_out 5, dolly_zoom 4,
crane_up 5, crane_down 5, spiral 8, pan_sweep 6), path/manual → 0 (open-ended),
unknown camera action → 5. Timeline drag payloads of kind path/play → 0.

## 9. C5r tab captions + all other i18n ids (F = found in DOM dump, IT = catalog unavailable)

| id | where | resolved English / semantic |
|---|---|---|
| 7L01XJ | window title | **"Actions"** (F) |
| aO28Mo | close btn aria+title | **"Hide actions"** (F) |
| sfIXMe | search placeholder+aria | **"Search actions"** (F) |
| QWdKwH / 2qLe/y / rT2cV+ | tab labels | **"Move" / "Animate" / "Camera"** (F) |
| ZHYI6T | C5r.move caption | **IT** (caption under Move tab; instructive sentence, guess "Drag onto an object in the scene") |
| WSviW0 | C5r.animate caption | **"Humans only"** (F) |
| xmwcS8 | C5r.camera caption | **IT** (guess "Cameras only") |
| BulyBf / NP8KUz / 5DdjZ9 / 8Mw+hK / OCy3k9 | E5r labels | Rotate / Revolve / Scale Up / Scale Down / Transform (semantic certain; OCy3k9 shared with camera-transform label) |
| I6gXOa | path tile name + camera "path" label | "Path" (semantic certain) |
| a1QB8W | F5r title | **IT** (guess "Drag into the scene, then draw the path") |
| w2DmPr | O5r + inline transform tile title | **IT** (guess "Drag onto an object") |
| 1YVTmS | P5r title | **IT** (guess "Drag onto the scene to film") |
| rYb0+Q | P5r canvas aria | **IT** (`values:{label}` — "Preview of {label}") |
| BNg2cx | N5r add-button aria (enabled) | **IT** |
| 13Y2lv | N5r add-button aria (disabled) | **"Select an object this can act on"** (F) |
| T91vKp / LXB/N2 | play tile name/title | **"Play"** / **"Drag onto a human, then play the scene like a game and record their moves"** (F) |
| f88wXe / Cd1cVD | rig tile name/title | **"Rig Transform"** / **"Drag onto a human, then pose its joints in the scene"** (F) |
| /z3bKF | section label | **"Perform"** (F) |
| x9NH8y | section label | **"Clips"** (F) |
| LtrDTL | switchNotice text | **IT** (`values:{selectedFigureName}` — "…is a simple figure…", prompt to convert) |
| dvQ5qW | switchNotice button | **IT** (guess "Switch to human") |
| YUAoyO | figure fallback name in $5r | **IT** (guess "Figure") |
| avAkAt | pickPersonKind toast action | **IT** (Undo) |

## 10. CSS-module class strings (rules unavailable — record names)

Zr (actions window, hash `kwh50`):
`_hudWindow_kwh50_15, _hudScroll_kwh50_35, _title_kwh50_58, _close_kwh50_78,
_search_kwh50_96, _tabs_kwh50_135, _tabsHug_kwh50_154, _tab_kwh50_135,
_active_kwh50_185, _tabLabel_kwh50_152, _tabCount_kwh50_202, _scroll_kwh50_210,
_tabPane_kwh50_217, _grid_kwh50_233, _tile_kwh50_244, _tileThumb_kwh50_252,
_iconThumb_kwh50_253, _tileName_kwh50_274, _empty_kwh50_283`.

ff (palette reveal, hash `1a7mk`):
`_reveal_1a7mk_9, _revealCollapsed_1a7mk_24, _actionsWindow_1a7mk_31,
_tile_1a7mk_38, _tileAdd_1a7mk_47, _sectionLabel_1a7mk_97, _tabCaption_1a7mk_107,
_switchNotice_1a7mk_115`.

Crt (resize handles, hash `1pcmd`): `_handle_1pcmd_1, _left_1pcmd_14,
_right_1pcmd_15, _top_1pcmd_30, _bottom_1pcmd_31`.

DOM observations from capture (for port styling): palette width 260px inline;
canvas thumbs 128×128; icon thumbs 32px; add-button icon 12px; close icon 12px;
search icon 14px; collapsed state = wrapper width 0 + aria-hidden + reveal class
pair `_reveal_1a7mk_9 _revealCollapsed_1a7mk_24`.

## 11. Drop targets (viewport side)

**BUr** — action-drop controller (attached to `renderer.domElement` + document):
- Candidates while dragging an action: all mesh ids passing
  `canDropActionOnObject` (or `canDropSegmentOnObject` for segment drags).
  All candidates get emissive glow `Bit=0x3a6fd8, Hit=.4` (blue idle).
- dragover: only reacts if `dataTransfer.types` includes `$v`;
  `dropEffect = hit ? "copy" : "none"`; hover object gets `OUr=0x33cc88, LUr=.9`
  (green). Raycast: NDC from renderer rect, `Raycaster.setFromCamera`,
  `intersectObjects(candidates,true)`, walk up parents to `userData.objectId`.
- drop: `preventDefault`, parse `MDe(dataTransfer.getData($v))`, then
  `appendActionToObject(objectId, payload)`; hover cleared.
- dragleave: clears hover only when relatedTarget outside canvas.
- Segment drag (timeline item onto object): document pointermove/up capture →
  `dropSegmentOnObject`.
- Cleanup via disposers (remove listeners + restore emissive).

**appendActionToObject(id, payload)** (store method):
`if (!canDropActionOnObject(id,payload)) return; trackId = show.tracks.find(t=>t.characterId===id)?.id ?? addPerformanceTrack(id); addActionToTrack(trackId,payload)`.
`addActionToTrack` dispatch: path→addPathItem, play→addPlayItem, clip→
addClipItem(track,clip), camera→addCameraItem(track,action), object rotate/
revolve/scale-up(AHr=2)/scale-down(CHr=.5)/transform/rig-transform → addRotate/
Revolve/Scale/Transform/RigTransformItem. Facade layer additionally fires
`onActionAdded` (which closes the palette).

**VUr** — component-drop controller (components palette → viewport): MIME V6;
`draggingComponent` signal; ray∩plane y=0 (`new r2(new Ge(0,1,0),0)`); ghost =
`Xqt.ensure(kind)` model with `$Ur` ghost materials (opacity HUr=.45,
depthWrite off), positioned `(x, UWt(kind), z)` — UWt: target→1, else 0;
drop → `addComponent(kind,[x,z])` + `showComponentList()`.

**$Ur/$it** — ghost mesh material: clone each mesh material → transparent,
opacity .45, depthWrite=false.

## 12. Tile preview machinery (what renders in the 128×128 thumbs)

All three renderers are the same pattern: private THREE scene + WebGLRenderer
(antialias, alpha) rendering offscreen, then blitted into the tile's 2D canvas
context via `drawImage`. (`IP=Brt=Frt=Hrt=128`.)

- **D5r** (clip tiles): loads `/assets/humanoid-B4Yewrzp.glb` (Hhe; same asset
  as the main stage humanoid), normalized to 1.75 m (jP), camera (.7,1.3,3.1)
  → lookAt(0,.85,0), hemi light 0xffffff/0x445566 ×2.4 + dir light ×2 at (2,4,3).
  AnimationMixer with every GLB clip in `actions` Map. Static thumb =
  `setClip(clip, IDe(clip)*0.35)` (pose at 35% of clip duration). Hover =
  `startLoop` → rAF `mixer.update(dt)`; `stopLoop` drains `pendingPoses`
  (hover during a loop queues a fresh still pose). `drawPose` while looping is
  deferred into pendingPoses. Materials: roughness=1, skin material named
  "M_Main" recolored #f29a5c.
- **H5r** (object-action tiles): no asset — a 1×1×1 BoxGeometry cube,
  MeshStandardMaterial color 0xcc8844 roughness .55 metalness .05; camera
  (2.2,1.9,3) → origin. Static thumb = applyPose(action, B5r[action]*2.4):
  rotate spins y (B5r=.14 of loop), revolve circles radius .7 (B5r=.12),
  scale-up/down animate ±triangle-wave ×.7/.5 (B5r=.5 = mid-scale). Loop = real
  time through 2.4 s pose cycle (`$rt` triangle wave for scale).
- **y5r** (camera tiles): loads the same humanoid glb as the SUBJECT (idle clip
  playing at 40% via mixer.update(duration*.4)), builds a tiny stage set
  (ground plane 60×60 0x8a8a8a, 3 pillars 0xa8a8a8, hemi 2.2 + dir light),
  camera fov Lrt=40. Still thumb = `KCe` pose at m5r[action] (normalized t):
  orbit .28, dolly_in .75, dolly_out .75, dolly_zoom .8, crane_up .7,
  crane_down .7, spiral .35, pan_sweep .45; start= [0,1.6,4.5], target=[0,1.1,0],
  direction "cw". Loop = ping-pong `b5r(t%3/3)` (Ort=3 s).
- Lifecycle: `ensureLoaded`/`ensureRenderer` lazy; `dispose` → stopLoop,
  skeleton+mesh+renderer disposal, forceContextLoss.
- Tiles mount canvases via useEffect once (`drawTile(canvas, clip)`); hover
  in/out switches preview↔still. Only cinematic (bP) camera actions mount
  canvases; still/path/follow/transform/manual show icon thumbs.

## 13. Gotchas / surprises for the port

1. **Palette closes after adding an action** (`n.onActionAdded=()=>Z.closeActions()`)
   — easy to miss; also `onActionsOpened` clears selection.
2. Palette is **collapsed by default** (`actionsCollapsed=Ne(!0)`); width clamp
   200..520 (fallback 260) is separate from left dock (280..480) and chat (280..560).
3. `requestedTab` is one-shot: selection sets it, M5r copies it, then a
   `queueMicrotask` resets to null; M5r keeps its own `useState` tab otherwise.
4. Dragstart writes BOTH the string payload (e3r) AND the structured payload
   into the store (`draggingAction`) — the drop targets rely on the signal, not
   on dataTransfer, for candidate computation.
5. `canOwnTrack` excludes camera-target objects (`Xu`) — targets can't own
   tracks; drop highlight therefore never lights them.
6. Search match is plain `toLowerCase().includes` against localized labels
   (clips use reactive `i18n._`; object actions use static `_._` map B — a
   subtle inconsistency: B is computed once per render with static translation).
7. The M5r transform tile is inlined (not O5r) because transform has no cube
   animation — it renders the sliders iconThumb instead of a canvas; its
   `title`/drag payload are identical to what O5r would emit.
8. `H5r.drawPose` stills use fractions of the 2.4 s loop (B5r) — rotate thumb
   shows the cube at 14% of a spin; scale tiles at 50% (mid scale). D5r stills
   sample at 35% of clip duration — dance thumb ≠ first frame.
9. Camera tiles load the **humanoid** glb (not a camera model) and orbit it —
   thumbnails are mini rehearsals of the actual camera move math (KCe), so the
   port must share KCe between thumbnail and runtime (same is true for _1
   presets and n3r durations).
10. BUr glow is emissive-only (no overlay); candidate set computed per drag
    start via a reactive effect (`qt`) reading `draggingAction` — cheap but
    order-sensitive: candidates frozen while dragging.
11. `IP=128` vs tile CSS — thumbs render at 128 and are CSS-scaled; DPR not
    handled in thumbs (acceptable at 128²).
12. i18n: all ids above; the catalog is unavailable, so semantic English must be
    authored for the flagged **IT** rows; clip labels + all chrome strings are
    known exactly from the DOM capture.
13. Byte offsets: use the byte ranges in this MAP (grep -bo verified). r7-style
    char+nonascii byte math is off by up to ~8 KB in this region.

## 14. r8b additions — aim / seed / lane-drop second pass (extracted by scripts/r8b_extract.py)

All units below live in this directory as `fn_<name>.js` (verbatim slice + header with
**byte ranges**), indexed in `fn_index_r8b.json`, each validated with `node --check`
(wrapped) and **byte-identity-verified** by re-slicing the bundle as raw UTF-8 bytes.
Engine reused from `scripts/r8_palette_extract.py` (correct real-byte UTF-8 math).

### A. TRS compose / validation / lookAt  (camera aim math)
| name | char range | byte range | size | role |
|---|---|---|---|---|
| CP | 4900781..4900993 | 4907712..4907924 | 212 | TRS → Matrix4 (euler XYZ → quat → compose; scratch zb/hie/GB/qB) |
| wDe | 4901053..4901342 | 4907984..4908273 | 289 | Matrix4 → TRS decompose + euler-flip normalization (s2e wraps to (−π,π]) |
| pie | 4901342..4901413 | 4908273..4908344 | 71 | local TRS from parent world TRS: inv(parent)·child (cN dep) |
| VWt | 4901413..4901465 | 4908344..4908396 | 52 | world TRS: parent·child (Zo dep) |
| cN | 4901465..4901598 | 4908396..4908529 | 133 | transform validation/normalization vs parent (turnCameraToward dep) |
| s$ | 4901598..4901685 | 4908529..4908616 | 87 | target-reposition: world pos so target keeps pointing at aim point |
| Zo | 4901839..4902028 | 4908770..4908959 | 189 | BASE TRS compose for an object from the objects store |
| el | 4902133..4902191 | 4909064..4909122 | 58 | is humanoid/simple_figure |
| Xu | 4902336..4902445 | 4909267..4909376 | 109 | object is a target referenced by some camera (canOwnTrack dep) |
| Dj_scratch | 4904646..4904662 | 4911577..4911593 | 16 | `const Dj=new di` — scratch Object3D for kv |
| kv | 4904662..4904808 | 4911593..4911739 | 146 | lookAt rotation pos→target + rotateY(π) (camera faces −Z) |

### B. Camera-item subject predicates
| name | char range | byte range | size | role |
|---|---|---|---|---|
| consts_V2r | 4316085..4316182 | 4323016..4323113 | 97 | V2r = Set of camera-item kinds (cam-still/move/path/follow/transform/manual) |
| Fp | 4316182..4316220 | 4323113..4323151 | 38 | Fp(item) = V2r.has(item.kind) — "is camera item" (NOT needs-subject) |
| XN | 4316220..4316328 | 4323151..4323259 | 108 | item aim point (module form): resolver(subjectId)+aimOffsetUnits |
| $6 | 4316328..4316391 | 4323259..4323322 | 63 | item.aimOffsetUnits ‖ 0 |
| U2r | 4316391..4316425 | 4323322..4323356 | 34 | items.some(YN) |
| YN | 4316425..4316569 | 4323356..4323500 | 144 | needs camera target (subjectlessItem): cam-move ≠ pan_sweep / cam-path aim=subject with subjectId===null |

### C. Subject aim height (NP family)
| name | char range | byte range | size | role |
|---|---|---|---|---|
| consts_MIr | 5247744..5247757 | 5263806..5263819 | 13 | MIr=.7 default aim margin |
| uje | 5247757..5247952 | 5263819..5264014 | 195 | object height units (humanoid jP·scaleY; prop dims; target 0) |
| VDe | 5247952..5248332 | 5264014..5264394 | 380 | vertical extent (minY/maxY) incl. group children via Zo+uje |
| NP | 5248332..5248466 | 5264394..5264528 | 134 | NP(objectId, objects, margin=MIr) = minY − objY + margin·max(0,maxY−minY) |

### D. Timeline magnet / px→time core
| name | char range | byte range | size | role |
|---|---|---|---|---|
| consts_Kne_O8 | 5138388..5138409 | 5154444..5154465 | 21 | Kne=12 MAGNET RADIUS px; O8=1e-6 eps |
| wie | 5138409..5138469 | 5154465..5154525 | 60 | item → {startS, endS:startS+yd} |
| MP | 5138469..5138534 | 5154525..5154590 | 65 | max endS = append position |
| oje | 5138534..5138642 | 5154590..5154698 | 108 | span overlap test (eps) |
| Xne | 5138642..5138853 | 5154698..5154909 | 211 | magnet snap to markers (tries marker & marker−duration) |
| _ie | 5138853..5139339 | 5154909..5155395 | 486 | THE MAGNET PLACER → {startS, guidesS} |
| W5r | 5139339..5139472 | 5155395..5155528 | 133 | collision-free placer (radius 0) — used by placeItemS, NOT the lane drop |
| lje | 5139472..5139627 | 5155528..5155683 | 155 | left-collapse normalize |
| G5r | 5139627..5139667 | 5155683..5155723 | 40 | span center (reorder comparator) |
| q5r | 5139667..5140109 | 5155723..5156165 | 442 | segment-drag plan {kind:"move"/"reorder"} |
| kGt | 5140109..5140383 | 5156165..5156439 | 274 | apply reorder splice |
| consts_timeline_px | 5164648..5164714 | 5180708..5180774 | 66 | UAr=5, zAr=4 drag-threshold px, WAr=.05 min dur, p2e=3 min block px, GAr zoom steps, qAr=80 |
| ZAr | 5164714..5165006 | 5180774..5181066 | 292 | object-action block label |
| s9_mime | 5140383..5140495 | 5156439..5156551 | 112 | s9="application/x-stage-object" (object list → timeline panel MIME) + SGt/kie/TGt |

### E. Lane-drop controller + parents
| name | char range | byte range | size | role |
|---|---|---|---|---|
| nCr | 5170765..5176954 | 5186825..5193014 | 6189 | THE LANE: dragover ghost {startS,durationS,guidesS} via Z()/_ie, drop → MDe(getData($v)) → G() → Z() → onAddAction(trackId,item,startS); ghostBlock/ghostCaret/snapGuide inline JSX; segment pointer drag/duplicate + trim handles |
| KAr | 5165006..5168927 | 5181066..5184987 | 3921 | TIMELINE PANEL: magnet toggle, range tool xTr, ruler VAr, lanes→nCr; panel-level s9 object drop |
| SCr | 5180427..5183715 | 5196487..5199775 | 3288 | BOTTOM-PANEL FACTORY: `n=(c,d,u)=>{t.addActionToTrack(c,d,u),t.dismissActions()}` = onAddAction; keyframe factories |
| gVr | 5572082..5572917 | 5588172..5589007 | 835 | 3rd MDe(getData($v)) consumer: hotkey key-slot drop (clips only) |

### F. Store methods (aim/seed/segment-drop) + transform hook
| name | char range | byte range | size | role |
|---|---|---|---|---|
| updateObjectTransform | 5265294..5265392 | 5281356..5281454 | 98 | DEFAULT objects-store hook: objects[id].set({...obj,...patch}) |
| aimCameraAtSubject | 5531472..5531839 | 5547561..5547928 | 367 | AIM FLOW (guard: existing Fp item with startS<s && kind!=="cam-still") |
| subjectAimPoint | 5531839..5531977 | 5547928..5548066 | 138 | Zo(obj).position + NP + dy |
| turnCameraToward | 5531977..5532187 | 5548066..5548276 | 210 | cN(obj,{...Zo,rotation:kv(pos,target)}).rotation |
| seedPathStart | 5539606..5539708 | 5555695..5555797 | 102 | appendPathAnchor([...Zo(obj,objects).position]) |
| enterPathEdit | 5539708..5539886 | 5555797..5555975 | 178 | selectedSegment+performancePaint+editInteraction="editingPath" |
| appendPathAnchor | 5541210..5541465 | 5557299..5557554 | 255 | anchor Y via anchorPosFor, mT-smooth, select last |
| placeItemS | 5528347..5528395 | 5544436..5544484 | 48 | atS===void 0 ? MP(items) : W5r(items,durationS,atS) |
| canDropSegmentOnObject | 5547519..5547647 | 5563608..5563736 | 128 | draggedSegment && canOwnTrack && Art(segment, kind) |
| dropSegmentOnObject | 5547647..5548018 | 5563736..5564107 | 371 | duplicateItem into track(characterId) at MP(items); segmentDropTaken=true |
| duplicateItem | 5548018..5548375 | 5564107..5564464 | 357 | clone item (an() id, DHr ref-strip) into target track |

### G. updateObjectTransform wiring slices
| name | char range | byte range | size | role |
|---|---|---|---|---|
| wire_BHr_ctor | 5524027..5525186 | 5540116..5541275 | 1159 | BHr performance-store constructor body: 5th ctor arg `a` stored as `this.updateObjectTransform` |
| wire_newBHr | 5788299..5788473 | 5804389..5804563 | 174 | `performanceStore=new BHr(objects, editInteraction, recording, isPreviewPlaying, objectsStore.updateObjectTransform)` |
| wire_facade_uot | 5792185..5792247 | 5808275..5808337 | 62 | facade: `updateObjectTransform=this.objectsStore.updateObjectTransform;` |
| wire_facade_epe | 5804949..5804999 | 5821039..5821089 | 50 | facade: `enterPathEdit=this.performanceStore.enterPathEdit;` |

### r8b gotchas / surprises
1. **Lane drop does NOT use W5r.** The palette→lane drop goes `Z()` → `_ie()` (magnet,
   radius `Kne/ppsPx` = 12 px / px-per-second, bypassed by holding Alt). `W5r` is the
   no-magnet placer used by `placeItemS` (store add flows with explicit atS).
2. **Ghost visuals are inline JSX in nCr** (no separate painter fn): `mr.ghostBlock`
   span when `durationS>0` (left=W.startS*ppsPx, width=max(durationS*ppsPx,p2e)),
   `mr.ghostCaret` span when durationS===0 (n3r→0 payloads: path/play), plus
   `mr.snapGuide` spans at each `guidesS` (magnet guides). Same `ghostBlock` reused
   for the cross-track duplicate ghost (`duplicateGhost` prop).
3. **Magnet markers** for a lane drop = all startS/endS of OTHER tracks' blocks
   (`U(null)` over allBlocks), NOT the lane's own items (obstacles = `V(null)` = own
   lane minus dragged). Snap tries marker and marker−durationS.
4. **Drop duration comes from n3r(item)** (r8 §8) computed inside `Z()` BEFORE the
   snap, so magnet markers also try `marker−durationS` alignment (end-snapping).
5. `onAddAction` chain: nCr `g(trackId,item,startS)` → SCr `n=(c,d,u)=>{t.addActionToTrack(c,d,u);t.dismissActions()}` → store `addActionToTrack(trackId,payload,atS)` (r8 §) → per-kind add*Item. Segment drop instead uses `dropSegmentOnObject`→`duplicateItem` (no addActionToTrack).
6. `aimCameraAtSubject` guard aborts when ANY camera-kind item (Fp) with `startS<s`
   exists and isn't `cam-still` — i.e. never re-aim mid-camera-sequence; it also
   repositions the camera's target object (`s$`) unless another YN (subjectless)
   item references it, then `turnCameraToward` (kv+cN) on the camera itself.
7. `subjectAimPoint` = Zo Y + NP (default margin MIr=.7 of height above minY) + dy.
   The item-level twin is XN (resolver-based, for KCe rendering).
8. `kv` uses a shared scratch `Object3D` (`Dj=new di`) — not reentrant; port must
   instantiate per call or per module like the bundle does (single shared scratch).
9. `wDe` euler flip: after decompose, tries the (x+π, π−y, z+π) variant when
   |x|+|z| is smaller by >1e-9 — needed for gimbal-friendly camera rotations.
10. Three `MDe(getData($v))` consumers total: BUr (viewport, r8), nCr (timeline
    lanes), gVr (hotkey key-slots, clips only). The timeline PANEL root has a
    separate s9 ("application/x-stage-object") drop that creates a track from an
    object (`addTrackForObject`) — different MIME, different flow.
11. Segment pointer-drag magnet: `s && !(metaKey||ctrlKey)` (Alt-drag = duplicate to
    another lane via `document.elementFromPoint(...).closest("[data-track-id]")`).
12. fn_consts_Bit.js hex comments corrected: 3829720=**0x3A6FD8**, 3394696=**0x33CC88**
    (code untouched; same fix applied to the purpose string in fn_index.json).
