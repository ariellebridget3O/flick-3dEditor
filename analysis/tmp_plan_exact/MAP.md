# MAP — live flick.art "2D stage plan canvas" subsystem — verbatim extraction (round 7)

**Bundle:** `analysis/index-DBE17t4T.js` (single-line minified, 13,457,064 chars).
All offsets below are **character offsets** into the UTF-8-decoded bundle text (same convention as
`scripts/find_ctx.py`, `analysis/tmp_plan/lib.py`); each `fn_*.js` header additionally carries the
byte offset. **Regenerate everything:** `python3 scripts/r7_plan_extract.py` → 162 units, every one
passes `node --check` (wrapped in an IIFE, dummy class, or object literal — see `.check/`).
Our current handroll to diff against: `editor/js/plan.js` (+ plan bar bits in `ui.js`, gating in
`main.js`).

Deobfuscation happens **only in these docs + the per-file header comments** — the JS bodies in
`fn_*.js` are byte-for-byte verbatim bundle slices.

---

## 0. Architecture at a glance (who owns what)

```
page store oKr (class, @5786079)                                   [fn_oKr_planbits]
  mode=Ne("edit") · viewportMode=Ne("3d") · setViewportMode
  enterSceneNode/leaveSceneNode (scene-node forces viewportMode "plan")
  planShown = Ne(viewportMode==="plan" && mode==="edit" && !playSession)
        │
        ▼
sBr(facade)  [fn_sBr]  ── new rDr(facade) ── the PLAN STORE (solid signals) [fn_class_rDr]
  │   labels/entries(tit z-order)/cameraPills/paths/heightMove/drawnMoveIds   (derived)
  │   drawTarget/targetPerson/drawingFor/drawing/strokeClock/matchDrawSpeed   (signals)
  │   items()      → plan items (Dst footprint + shownPose + TDe pool + hqt wedge + camera label)
  │   apply(intents) → select/begin/move(HAe batch)/yaw/lens/commit/stroke-start|move|end/focus
  │   startStroke/tickStroke/previewPose/endStroke/stepBack/deleteMove/toggleDrawing
  │   move/turn/commitOne/carryPaths/carryAimPoint (camera rebase machinery, SZt/_je/wje/dZt)
  │   drawFrame(ms) → {stroke, dimPathOf, focus}  ← also TICKS the stroke (sampling!)
  ▼
rBr(props)  [fn_rBr]  ── THE CANVAS COMPONENT (data-testid="stage-plan")
  │   local plan state w.current = ELr() {view{centerX,centerZ,pxPerM,widthPx,heightPx}, drag, fitted}
  │   pointerdown/move/up → pure reducers DLr/DZt/HLr (drag kinds: pan|stroke|tap-or-draw|marquee|move|rotate|lens)
  │   wheel → NLr (PZt zoom/pan classify)   · auto-pan BLr each frame while dragging near edge
  │   per-frame rAF: resize jLr + auto-fit ILr → BLr autopan → MLr zoom-to-frame → FLr centerOn
  │                   (nBr=320ms cubic-out ease) → OLr/RLr zoomCommand → LLr zoom% → SDr paint
  │                   → $Ir edge indicators + FDr → ZIr camera label overlay
  │   drop components at S1(view, px); edge-bubble click (uN+3 slop) → goToCamera
  ▼
SDr(ctx, deps)  [fn_SDr]  ── pure painter pass order:
  bg → TDr grid(1m fade 8→24, 5m majors) → IDr pools → non-char items jDr → CDr selected paths
  (vDr dim) + in-progress stroke ($Zt + accent 2.4px) → char items jDr → group boxes (Rie∪, pad 8,
  label 11px +14 below) → ADr focus overlay → PDr callout (zDe ring + rotate/lens dots + RDr tick)
  → marquee.  Edge indicators painted separately by FDr after SDr.
        │
        ▼
runtime uZr frame loop ne() [fn_ne_frameloop]  — ALL subsystem ticks keep running when
  planShown (rig, playback, preview, bounds, spotlights, record…); only the WebGL render is
  skipped: planShown||!pageLive → scene.updateMatrixWorld() instead of render.
  shownPose(id) [fn_shownPose_impl] = mesh world TRS (Bie) + getWorldScale + fovDeg (cameras,
  from evaluated camera state) + headRotation (simple_figure) → what items() mirrors.
  WASD fly gate ne() [fn_keyboard_gate] disabled while planShown.
```

Intent flow: pointer events → `DLr/DZt/HLr/BLr/$Lr` (pure, return `{state,intents}`) →
`rBr.onIntents` = `rDr.apply` → facade mutations (`setSelectedIds`, `beginEditGesture`,
`updateObjectTransform`, `seekPerformance`, `replaceMoveFromSamples`, …).

---

## 1. Inventory — 162 extracted units

`A/B/C` = oracle feasibility (A = runs standalone in Node with plain data; B = needs small stubs
(three.js classes, solid signals, i18n, canvas ctx…); C = tangled with app/DOM/React — shim
described in §4). Char range = bundle slice. Full auto-derived free-identifier list per function
is in each `fn_*.js` header.

| file | minified | char range | chars | oracle | purpose (deobfuscated) |
|---|---|---|---|---|---|
| `fn_HAe.js` | HAe | 1477648..1477691 | 43 | B | solid-js batch() wrapper (move intents coalesce into one reactive flush) |
| `fn_consts_aspects.js` | consts_aspects | 3920341..3920651 | 310 | A | aspect table Zae (16:9, 9:16, 1:1, 4:3, 1.85:1, 2.39:1), Lzt=35 half-height mm-equiv, Z_(focal,aspect)->fovDeg |
| `fn_Am.js` | Am | 3920651..3920704 | 53 | A | recordAspect key -> {aspect,...} (aspect used for camera fov wedge hqt/Z_) |
| `fn_Z_.js` | Z_ | 3920799..3920864 | 65 | A | fovDeg from focal mm + aspect (2*atan(35/aspect/2/focal)) |
| `fn_tDe.js` | tDe | 3923215..3923319 | 104 | A | signed angular difference (mod 2π, wrapped to ±π) — lens drag: angle between footprint yaw and pointer dir |
| `fn_ybe.js` | ybe | 3923339..3923392 | 53 | A | wrap angle t to nearest 2π multiple around e (euler flip helper) |
| `fn_GA.js` | GA | 3923392..3923635 | 243 | A | euler flip ambiguity resolver: pick euler t or (t+π, π−t, t+π) closest to e (group rotation fold) |
| `fn_Bzt.js` | Bzt | 3923750..3924197 | 447 | A | transform key interpolation at t (position lerp/rotation slerp) |
| `fn_xU.js` | xU | 3926101..3926167 | 66 | A | euclidean distance between two vec3 |
| `fn_E2r.js` | E2r | 3926167..3926331 | 164 | A | cubic bezier eval at t (used by nx) |
| `fn_consts_curve.js` | consts_curve | 3926331..3926344 | 13 | A | curve consts: Ptt=12 bezier steps per span (nx resample density), Rtt WeakMap cache |
| `fn_mT.js` | mT | 3926344..3926873 | 529 | A | anchors with tangents from points (buildTangents; non-uniform Catmull-Rom, bezier in/out at 1/3) |
| `fn_nx.js` | nx | 3927240..3927599 | 359 | A | polyline from anchors (polylineOf, bezier resample) |
| `fn_MR.js` | MR | 3927599..3927677 | 78 | A | arc length of polyline |
| `fn_consts_gait.js` | consts_gait | 4315173..4315276 | 103 | A | gait enum Gzt=[walk_formal,walk,jog_fwd,sprint], default gait JCe="walk" (humanoid path), keymap qzt |
| `fn_consts_K2r.js` | consts_K2r | 4317858..4317871 | 13 | A | K2r=32 minimum pace sample count in vHr (d=max(32, ceil(dur/.1)+1)) |
| `fn_Q0.js` | Q0 | 4319381..4319537 | 156 | A | is path-drawable kind (for replaceMoveFromSamples guard) |
| `fn_consts_speeds.js` | consts_speeds | 4319832..4319865 | 33 | A | Htt=1.4 walker steady speed m/s, Qae=.01 min speed m/s |
| `fn_yd.js` | yd | 4319865..4319961 | 96 | A | item duration: path/cam-path arc(MR(nx))/speedUnitsPerS else durationS |
| `fn_rx.js` | rx | 4319961..4320225 | 264 | B | show duration (max item endS over tracks) |
| `fn_pie.js` | pie | 4901342..4901413 | 71 | B | world pose -> parent-local pose (invert parent matrix, multiply, decompose) |
| `fn_Zo.js` | Zo | 4901839..4902028 | 189 | A | stored pose: position/rotation/scale defaults |
| `fn_el.js` | el | 4902133..4902191 | 58 | A | is walker kind (humanoid\|simple_figure) |
| `fn_fie.js` | fie | 4902191..4902258 | 67 | A | is stage fixture: camera\|target\|spotlight (no group promotion, excluded from setBounds) |
| `fn_consts_Hv.js` | consts_Hv | 4902324..4902336 | 12 | A | Hv=50 default focalLengthMm; Xu target-referenced check |
| `fn_Xu.js` | Xu | 4902336..4902445 | 109 | B | is target id still referenced by some camera (targetId) |
| `fn_kv.js` | kv | 4904662..4904808 | 146 | A | look-at rotation (quaternion) from position to target |
| `fn_XWt.js` | XWt | 4905387..4905540 | 153 | B | camera+target follow: delta target position after camera pose change |
| `fn_consts_spotlight.js` | consts_spotlight | 4906118..4906212 | 94 | A | spotlight defaults: QWt={shape:round,intensity:70,diffusion:30}, JWt=16 deg per unit scale, eGt=3 tGt=55 clamp deg, W8r/G8r/q8r |
| `fn_BR.js` | BR | 4906212..4906251 | 39 | B | spotlight cfg accessor: obj.spotlight ?? QWt |
| `fn_nGt.js` | nGt | 4906251..4906511 | 260 | B | spotlight cfg normalizer |
| `fn_gie.js` | gie | 4906511..4906562 | 51 | A | clamp 0..100 |
| `fn_Rhe.js` | Rhe | 4906562..4906685 | 123 | A | pool half-angle rad from scale: min(55°, max(3°, 16°*avg\|scale\|)) |
| `fn_TDe.js` | TDe | 4906713..4906956 | 243 | B | POOL SOLVER(pose): forward=(0,0,-1).applyEuler(rotation); null unless position.y>0 && forward.y<=-0.05; d=y/-forward.y; pool {x: pos.x+f.x*d, z: pos.z+f.z*d, radiusM: d*tan(Rhe(scale))} — NO min-radius clamp |
| `fn_rGt.js` | rGt | 4906956..4907025 | 69 | A | half-angle in deg from scale (Rhe*360/π) |
| `fn_X8r.js` | X8r | 4907025..4907099 | 74 | A | inverse: scale vector from half-angle deg |
| `fn_DDe.js` | DDe | 5178463..5179152 | 689 | A | default object label: name or "Cube {n}" etc per kind |
| `fn_consts_MIr.js` | consts_MIr | 5247744..5247757 | 13 | A | MIr aim-height fraction (NP default) |
| `fn_uje.js` | uje | 5247757..5247952 | 195 | A | object height m from dims (group recursion?) |
| `fn_VDe.js` | VDe | 5247952..5248332 | 380 | A | vertical bounds {minY,maxY} of object (group=children union, via uje heightOf) |
| `fn_NP.js` | NP | 5248332..5248466 | 134 | A | aim height above object origin: minY-origin + MIr*(maxY-minY) (head-ish aim point) |
| `fn_PIr.js` | PIr | 5248479..5249127 | 648 | B | height-range helper for NP (camera-height UI bounds?) |
| `fn_consts_figbody.js` | consts_figbody | 5249127..5249334 | 207 | A | simple_figure body dims: RIr=1.299 ratio, sA=jP(1.75)/RIr scale, PP=[.406,1.059,.289]*sA (W/H/D), Nie=.125*sA head r, FIr/OIr eye, LIr, Pie=72° head arc, DIr pitch, Pst/BIr/HIr label contrast consts |
| `fn_aqt.js` | aqt | 5249334..5249506 | 172 | A | label contrast color: parse #rrggbb, luma(.2126/.7152/.0722)>.72(HIr) ? #1c0f09(BIr) : #ffffff(Pst) |
| `fn_consts_edgeind.js` | consts_edgeind | 5249506..5249525 | 19 | A | edge indicator consts: Rst=22 margin px, uN=13 bubble radius px |
| `fn_$Ir.js` | $Ir | 5249525..5249885 | 360 | B | edge indicators: cameras offscreen -> clamp to 22px margins along center ray; {id,tag,x,y,angleRad}[] |
| `fn_consts_planview.js` | consts_planview | 5249885..5250004 | 119 | A | plan view consts: Uhe=34 default pxPerM, iqt=14 min, oqt=Uhe*5=170 max, Fst=.26 humanoid half m, Ost=4.2 lens-ahead m, lqt=12 marker hit px, VIr=34 marker ring px, cqt=6 handle radius, yT=[14,18,24,35,50,85,135,200] focal stops, Lst/H2e euler/vec3 scratch |
| `fn_i9.js` | i9 | 5250004..5250114 | 110 | A | plan yaw (rad) of a [x,y,z] euler: forward=(0,0,-1).applyEuler(XYZ), atan2(-fx,-fz) — screen-up = -Z convention |
| `fn_FU.js` | FU | 5250114..5250167 | 53 | A | forward unit vector of yaw: {x:-sin(y), z:-cos(y)} |
| `fn_Dst.js` | Dst | 5250167..5250811 | 644 | B | footprint(obj, pose): group->null; camera/target/spotlight->{shape:marker,x,z,yawRad}; humanoid->ellipse halfW=.26*sx(Fst) halfD=.26*sz; simple_figure->rect halfW=PP[0]*sx/2 halfD=PP[2]*sz/2 (.547/.390 halves); sphere/cylinder->ellipse halfW=sx/2 halfD=sz/2 (NO min clamp); prop->rect from zh[propKey].dims ?? [1,1,1] halves (NO min clamp); yawRad=i9(pose.rotation) |
| `fn_dqt.js` | dqt | 5250811..5251117 | 306 | A | footprint bbox in meters (rotated extents; ellipse=hypot) |
| `fn_Rie.js` | Rie | 5251117..5251285 | 168 | A | footprint bbox in px (marker pad lqt=12px) |
| `fn_uqt.js` | uqt | 5251285..5251540 | 255 | A | union bbox of footprints (meters) |
| `fn_hqt.js` | hqt | 5251540..5251602 | 62 | A | horizontal half-fov rad from vertical fovDeg + aspect: atan(tan(fov/2)*aspect) |
| `fn_UIr.js` | UIr | 5251602..5251840 | 238 | A | focal mm from horizontal half-fov; snap to yT stops when n |
| `fn_pqt.js` | pqt | 5251840..5251957 | 117 | A | lens-handle endpoints: footprint ± halfRad yaw, Ost=4.2m ahead |
| `fn_iu.js` | iu | 5251957..5252061 | 104 | A | world m -> px: {x: w/2+(x-cx)*ppm, y: h/2+(z-cz)*ppm} |
| `fn_S1.js` | S1 | 5252061..5252165 | 104 | A | px -> world m (inverse of iu) |
| `fn_UDe.js` | UDe | 5252165..5252256 | 91 | A | pan view by px delta |
| `fn_fqt.js` | fqt | 5252256..5252405 | 149 | A | zoom view at anchor px keeping world point under cursor; clamps ppm via mqt(14..170) |
| `fn_zIr.js` | zIr | 5252405..5252629 | 224 | A | fit view to bbox with margin px (TLr=48) |
| `fn_zDe.js` | zDe | 5252629..5252992 | 363 | A | camera callout geometry: center px, ringRadiusPx (marker VIr=34 else max(halfW,halfD)*ppm*?+…), rotate handle on -forward, lens handles at pqt endpoints |
| `fn_mqt.js` | mqt | 5252992..5253045 | 53 | A | clamp |
| `fn_consts_labelpos.js` | consts_labelpos | 5253045..5253079 | 34 | A | camera label pos consts: WIr=16, GIr=.72, qIr=28, $2e=4 |
| `fn_ZIr.js` | ZIr | 5253079..5253293 | 214 | B | camera label overlay position: ring center + radius, clamped into viewport |
| `fn_consts_KIr.js` | consts_KIr | 5253293..5253305 | 12 | A | KIr=8 (focus overlay cross arm px?) + neighbors |
| `fn_XIr.js` | XIr | 5253305..5253860 | 555 | B | QR card placement: clamp card rect inside viewport, anchored at phone pill |
| `fn_aMr.js` | aMr | 5257512..5257614 | 102 | A | selection promotion: drop children whose parent is also selected |
| `fn_consts_pillscss.js` | consts_pillscss | 5418497..5418603 | 106 | A | camera pills css class names (Q2e) + draw pill group css (Eh) |
| `fn_yRr.js` | yRr | 5418603..5418950 | 347 | C | camera pills: role=group, buttons aria-pressed when solely selected, swatch dot |
| `fn_RRr.js` | RRr | 5419491..5420755 | 1264 | C | draw-direction pill group: state draw\|update\|drawing; drawing -> Finish + match-speed checkbox (Vk78FE); update -> delete pill; person toggle (figure/humanoid) when person && !drawing |
| `fn_FRr.js` | FRr | 5420755..5421149 | 394 | C | phone-link pill (linked/lost/idle) |
| `fn_ORr.js` | ORr | 5421149..5422441 | 1292 | B | QR card overlay positioned via XIr each frame |
| `fn_LRr.js` | LRr | 5422441..5422748 | 307 | C | stroke timer display: nowS / ofS (draw seconds vs rest-of-show duration) |
| `fn_iFr.js` | iFr | 5426393..5427024 | 631 | C | zoom bar: percent readout + zoom out / zoom-to-fit / zoom in buttons |
| `fn_lZt.js` | lZt | 5427024..5427090 | 66 | A | scratch camera eval out {position:new Ge, quaternion:new qn, fovDeg:0} (nit) |
| `fn_cZt.js` | cZt | 5427958..5428506 | 548 | B | cam-transform key pose at t (position/rotation/focal interpolation) |
| `fn_dZt.js` | dZt | 5431015..5431405 | 390 | B | camera item evaluator: position/quaternion/fovDeg at timeS from base + items (used by flownHeightM + plan commitOne paths) |
| `fn_U6.js` | U6 | 5431405..5431493 | 88 | B | items of a character track (playback evaluator view) |
| `fn_wje.js` | wje | 5447306..5447361 | 55 | B | can camera rotate to aim? (rebase check guard) |
| `fn__je.js` | _je | 5447451..5447673 | 222 | B | camera drag mode classification: manual \| path-position \| path-look \| path-anchored \| null |
| `fn_SZt.js` | SZt | 5449927..5451168 | 1241 | B | camera move/rotate commit with aim rebase solver (GOr) — refuses/unbased/rebased outcomes |
| `fn_consts_CZt.js` | consts_CZt | 5451392..5451532 | 140 | A | CZt=1.6 walker eye height (head-look aim height in previewPose), neighbors (Wat=.4, QOr clamp, Gat wrap) |
| `fn_xM.js` | xM | 5451532..5451849 | 317 | A | head-look solver with 70°/35° limits (used by previewPose focus) |
| `fn_consts_wheel.js` | consts_wheel | 5454651..5454701 | 50 | A | wheel consts: hLr=150 idle ms, Aje=.2 kb-zoom factor, pLr=.005 fine rate, fLr=.02 coarse rate, mLr=2 px-mode pan mult, gLr=1 line-mode |
| `fn_PZt.js` | PZt | 5454701..5454883 | 182 | A | wheel event -> {kind:zoom,delta} (rate .005 fine \|Δ\|<=20 else .02) \| {kind:pan,dx,dy} (×2 deltaMode 0 else ×1) |
| `fn_bLr.js` | bLr | 5454883..5455050 | 167 | A | is inside a scrollable ancestor ([data-scrollable]) |
| `fn_RZt.js` | RZt | 5455050..5455477 | 427 | B | wheel router: 150ms idle timer, scroll vs pan vs zoom(ctrl) routing to onWheel |
| `fn_consts_hit.js` | consts_hit | 5455477..5455495 | 18 | A | handle slop consts: yLr=2, vLr=8 footprint slop px |
| `fn_xLr.js` | xLr | 5455495..5455810 | 315 | A | point-in-footprint: marker dist<=lqt(12px); any footprint within vLr=8px slop; else world-space rotated test rect \|u\|<=1&&\|h\|<=1, ellipse u*u+h*h<=1 (NO 1.2 factor) |
| `fn_Qhe.js` | Qhe | 5455810..5455926 | 116 | A | all hits topmost-first (items sorted by tit z-order) |
| `fn_Xat.js` | Xat | 5455926..5455999 | 73 | A | topmost hit id with parentId??id promotion |
| `fn_wLr.js` | wLr | 5455999..5456209 | 210 | A | mod-click cycle child within group |
| `fn__Lr.js` | _Lr | 5456209..5456459 | 250 | A | marquee rect∩bbox select with parentId??id promotion |
| `fn_kLr.js` | kLr | 5456459..5456619 | 160 | A | camera handle hit: rotate \| lens within cqt(6)+yLr(2) px |
| `fn_consts_state.js` | consts_state | 5456619..5456688 | 69 | A | interaction consts: Vie=.25 snap m, Yat=π/12 (15°), Qat=3 move threshold px, Jat=4 marquee min px, SLr=4?, TLr=48 fit margin, ALr=.8?, CLr=720? |
| `fn_ELr.js` | ELr | 5456688..5456790 | 102 | A | initial plan state {view:{centerX:0,centerZ:0,pxPerM:Uhe=34,widthPx:0,heightPx:0},drag:null,fitted:false} |
| `fn_jLr.js` | jLr | 5456790..5457063 | 273 | A | resize keeping world center |
| `fn_ILr.js` | ILr | 5457063..5457208 | 145 | A | zoom-to-fit: union footprints + TLr margin (once) |
| `fn_MLr.js` | MLr | 5457208..5457367 | 159 | A | zoom to id: center on footprint, pxPerM=Uhe, fitted |
| `fn_NLr.js` | NLr | 5457367..5457549 | 182 | A | wheel: zoom (FZt factor) or pan |
| `fn_PLr.js` | PLr | 5457549..5457603 | 54 | A | pan by px |
| `fn_RLr.js` | RLr | 5457603..5457713 | 110 | A | keyboard zoom at center by e*Aje(.2) |
| `fn_FLr.js` | FLr | 5457713..5457851 | 138 | A | centerOn id (no zoom change) |
| `fn_OLr.js` | OLr | 5457851..5457890 | 39 | A | mark unfitted (re-fit on next frame) |
| `fn_LLr.js` | LLr | 5457890..5457947 | 57 | A | zoom percent readout: round(pxPerM/Uhe*100) |
| `fn_FZt.js` | FZt | 5457947..5457977 | 30 | A | zoom factor from wheel delta: max(.1, 1+delta) |
| `fn_OZt.js` | OZt | 5457977..5458177 | 200 | A | tap-or-draw: hover another non-camera/target object while drawing -> its id (focus) |
| `fn_LZt.js` | LZt | 5458177..5458269 | 92 | A | single selected item or undefined |
| `fn_DLr.js` | DLr | 5458269..5459609 | 1340 | A | pointerdown reducer: middle/right=pan drag; drawing=stroke-start; camera rotate/lens handles; hit select (shift toggle / mod cycle wLr); marquee start; move-drag base |
| `fn_BLr.js` | BLr | 5459609..5460154 | 545 | A | drag move/rotate update (part of DZt; move intents w/ Vie snap, Yat 15° snap) |
| `fn_DZt.js` | DZt | 5460154..5461596 | 1442 | A | pointermove reducer: pan, marquee, stroke-move (grab ease), move/rotate via BLr |
| `fn_HLr.js` | HLr | 5461596..5462125 | 529 | A | pointerup reducer: click vs move vs marquee commit (Jat min 4px), stroke-end, drag end |
| `fn_$Lr.js` | $Lr | 5462125..5462302 | 177 | A | finalize: drain pending intents from state |
| `fn_consts_drag.js` | consts_drag | 5462302..5462610 | 308 | A | plan store consts: eit=40 path sample count, VLr=.05 stroke sample interval s, ULr=4000 tip ms, zLr=.05 face-turn m, WLr=20, GLr=12, qLr=4, ZLr=50 height max, KLr=.18, XLr=.12, YLr=1.6 QLr=1.4 drag rates, JLr=±3m drag clamp box, tit z-order map, eDr=.4 focus ease s, tDr=1 grab decay, nit/uL/qY/xb/nDr scratch |
| `fn_class_rDr.js` | class_rDr | 5462610..5479492 | 16882 | B | THE PLAN STORE: labels(DDe), entries(tit z-order), cameraPills, paths(rit/nx/Bzt/cZt), heightMove, drawTarget, targetPerson, drawingFor/drawing/strokeClock/stroking, matchDrawSpeed, rehearseTip, setBounds(uqt), heightMaxM, selectedCamera(flownHeightM), drag{riding,aimDistance,start}, items() (Dst + shownPose + pool TDe + wedge hqt + camera label), intents reducer (stroke-start/move/end, select, move, rotate, focus...), startStroke, tickStroke (VLr sampling, seekPerformance, previewPose, drawPreview), endStroke (replaceMoveFromSamples steady:!matchDrawSpeed), stepBack (Esc), focusOf/toggleFocus, shownOrStored, zoomCommand/centerRequest handling |
| `fn_sDr.js` | sDr | 5479492..5479533 | 41 | A | i18n id "Draw direction" label |
| `fn_hL.js` | hL | 5479533..5479570 | 37 | A | [x,y,z] -> {x,z} plan point |
| `fn_rit.js` | rit | 5479570..5479681 | 111 | A | resample keys (tS span) into eit+1(40+1) evenly spaced points |
| `fn_consts_palette.js` | consts_palette | 5479681..5480029 | 348 | A | palette CSS var name map (background/grid/gridMajor/human/camera/object/light/prop/propEdge/accent/accentSoft/panel/text/textDim -> --plan-*) |
| `fn_BZt.js` | BZt | 5480029..5480195 | 166 | B | read palette from computed style + fontFamily |
| `fn_consts_painter.js` | consts_painter | 5480195..5480444 | 249 | A | painter consts: HZt=1 grid minor step m, oye=5 grid major step m, sit=8..iDr=24 grid fade pxPerM range, oDr=[[-9,-1],[9,-1],[9,11],[-9,11]] camera body poly, lDr=[[-4,-1],[-6.5,-8],[6.5,-8],[4,-1]] camera lens poly, cDr=.32 stick-fig scale of pxPerM, dDr=6..hDr=12 stick size clamp px, uDr=7 figure min body px, pDr=6 rotate-tick inner inset, fDr=12 rotate-tick angular base, mDr=16 rotate-tick angular length, gDr=8 target-cross circle r, ait=6 spotlight dot r, bDr=.14 pool alpha, yDr=.24 pool alpha selected, ZY=12 target-cross arm, pL=8 group-box pad px, KY=4.5 path-key diamond half, vDr=.5 dimmed-path alpha, xDr=2.4 stroke width, wDr=14 focus cross ring r, iit=11/lye=18 focus cross arms, l$=12 item label px, Cje=11 small label px |
| `fn__Dr.js` | _Dr | 5480444..5480523 | 79 | A | grid minor-line fade alpha: clamp((ppm-8)/(24-8),0,1) |
| `fn_kDr.js` | kDr | 5480523..5480631 | 108 | A | color by kind: walker->human, camera/target->camera, spotlight->light, else object |
| `fn_SDr.js` | SDr | 5480631..5482300 | 1669 | A | MAIN PAINTER: bg fill -> TDr grid -> pools(IDr) -> non-char items(jDr) -> CDr selected paths+dim + stroke(vDr xDr) -> char items(jDr) -> EDr group boxes -> focus ADr -> PDr callout -> marquee |
| `fn_q5.js` | q5 | 5482300..5482420 | 120 | A | text label painter (sizePx/color/align/fontFamily) |
| `fn_TDr.js` | TDr | 5482420..5482966 | 546 | A | grid: 1m minors alpha _Dr skipping oye-5m multiples, 5m majors |
| `fn_$Zt.js` | $Zt | 5482966..5483078 | 112 | A | beginPath + polyline through world points (no stroke) |
| `fn_ADr.js` | ADr | 5483078..5483640 | 562 | A | focus overlay: dashed accent line fromId->subjectId + cross (wDr ring, iit/lye arms) + q5 label |
| `fn_CDr.js` | CDr | 5483640..5484047 | 407 | A | selected paths painter: kDr color by kind, dimmed if dimPathOf; $Zt + dashed stroke [2,4] 1.4px; keys as diamond markers |
| `fn_cBe.js` | cBe | 5484047..5484184 | 137 | A | rotated polygon path (cos/sin yaw) |
| `fn_dBe.js` | dBe | 5484184..5484249 | 65 | A | rotated rect path via cBe |
| `fn_EDr.js` | EDr | 5484249..5485237 | 988 | A | simple_figure body painter: dBe rect (uDr min px), head Nie arc + Pie=72° face arc (aqt contrast), direction tick FU |
| `fn_VZt.js` | VZt | 5485237..5485596 | 359 | A | stick-figure painter: filled head circle (x, y-.72n, r=.3n), torso (x,-.4n)->(x,+.3n), arms single line ±.6n at -.12n, V legs (±.45n,+n)->(x,+.3n)->(±.45n,+n); lineWidth n>8?2.2:1.6 round caps |
| `fn_consts_oit.js` | consts_oit | 5485596..5485610 | 14 | A | oit=.35 unselected label alpha (humanoid/figure labels) |
| `fn_jDr.js` | jDr | 5485610..5487635 | 2025 | A | per-kind glyph painter dispatch (ctx, view, item, selected, palette, drawLabel=true): camera -> NDr wedge + oDr/lDr body polys (cBe yaw) + label at +18/+26 (l$=12); spotlight -> dashed [3,3] line to pool (alpha .9/.5) + ait=6 dot; marker(target) -> gDr=8 circle + ZY=12 cross; humanoid -> MDr size, VZt stick, forward tick 1.35u..2.1u lw1.6, label alpha 1/oit; simple_figure -> EDr body + label at bbox.maxX+6; props -> dBe rect / ellipse(-yaw) + selected label below |
| `fn_IDr.js` | IDr | 5487635..5487860 | 225 | A | spotlight pool fill: circle r=radiusM·ppm, or dBe ROTATED SQUARE half-extent radiusM·ppm (aligned to fixture yaw, NOT √2-scaled); fill light, alpha yDr=.24 selected else bDr=.14, no stroke |
| `fn_MDr.js` | MDr | 5487860..5487924 | 64 | A | stick figure unit size: clamp(dDr=6, hDr=12, ppm*cDr=.32) |
| `fn_NDr.js` | NDr | 5487924..5488222 | 298 | A | camera fov wedge: triangle to pqt lens endpoints 4.2m ahead, alpha .2/.1 fill + .6/1 stroke 1.4/1 |
| `fn_PDr.js` | PDr | 5488222..5488596 | 374 | A | single-selection callout: zDe ring + rotate & lens handle dots (cqt=6) + RDr direction tick |
| `fn_RDr.js` | RDr | 5488596..5489152 | 556 | A | rotate-handle direction tick: arc at r+pDr, angle atan2(-cos,-sin) |
| `fn_FDr.js` | FDr | 5489152..5489619 | 467 | A | offscreen camera edge indicator painter: bubble uN=13 + camera name tag (q5) |
| `fn_consts_cursor.js` | consts_cursor | 5497062..5498039 | 977 | A | pencil "crosshair" cursor data-URI (cye) + plan css classes (uit) + nBr=320 centerOn ease ms + hit/pit label offsets |
| `fn_dye.js` | dye | 5498039..5498215 | 176 | B | pointer event -> canvas-local px (accounts css scale clientWidth/rect.width) |
| `fn_rBr.js` | rBr | 5498215..5504086 | 5871 | C | THE PLAN CANVAS COMPONENT: data-testid stage-plan; pointer handlers (DLr/DZt/HLr reducers, uN+3 edge-bubble click, middle/right pan, tap-or-draw cursor cye + focusTip); wheel -> NLr; dpr resize; SDr paint; $Ir+FDr edge indicators; camera label overlay (ZIr); zoomCommand/centerRequest; onComponentDrop S1; per-frame rAF |
| `fn_sBr.js` | sBr | 5504086..5506850 | 2764 | C | plan page factory: new rDr(t); memo component wiring rBr + yRr + RRr + LRr + iFr; Escape -> stepBack |
| `fn_consts_stroke.js` | consts_stroke | 5519474..5519524 | 50 | A | simplify consts: fHr=.3 min arc m, mHr=.7 dwell time-reblend factor, gHr=.25 dwell-span detect s (stationary >=.25s), bHr=.1 pace sample spacing s, yHr=.2 anchor spacing m, Tit=1e4 pace quantization |
| `fn_vHr.js` | vHr | 5519524..5520413 | 889 | A | simplify stroke samples -> {points, pace, durationS}\|null: reject if <3 samples or arc<fHr(.3m); xHr finds dwell spans (>=gHr .25s stationary); wHr ¼-smooths ×2 ONLY non-anchor points (dwell+endpoints pinned); monotone time re-spread inside dwell spans by mHr=.7; pace = d=max(K2r 32, ceil(dur/bHr .1)+1) arc-fraction samples quantized 1/Tit(1e-4) clamped monotone, pace[0]=0 pace[-1]=1; anchor points >= yHr(.2m) apart, exact last point forced |
| `fn_xHr.js` | xHr | 5520413..5520574 | 161 | A | find dwell spans [startIdx,endIdx] where position unchanged and span >= gHr(.25s) — these become smoothing anchors |
| `fn_wHr.js` | wHr | 5520574..5520872 | 298 | A | anchor-aware smoothing: pins {0,last}+dwell spans, ¼-averages all other points ×2 passes; re-zeroes t to elapsed-since-start (monotone) |
| `fn_Ait.js` | Ait | 5520872..5520967 | 95 | A | cumulative arc length of samples |
| `fn_consts_YZt.js` | consts_YZt | 5520967..5521131 | 164 | A | YZt=2 camera steady speed m/s (+ trailing consts of other subsystems) |
| `fn_replaceMoveFromSamples.js` | replaceMoveFromSamples | 5542981..5543842 | 861 | B | show-store method: vHr simplify -> mT tangents -> speed = steady? (camera YZt=2 : Htt=1.4) : max(Qae=.01, MR(nx)/durationS); REPLACE existing move segment (kind path/cam-path, aim subject-if-focus else locked/camera), focalLengthMm preserved |
| `fn_keyboard_gate.js` | keyboard_gate | 5649676..5650368 | 692 | B | WASD fly gate ne(): controlMode default && mode edit && !playSession && !planShown && !sceneNodeOpen |
| `fn_z_drawPreview.js` | z_drawPreview | 5759598..5759834 | 236 | B | drawPreview ghost tick: pose mesh to preview pose (stroke preview mirrors into 3D) |
| `fn_se_playback.js` | se_playback | 5760688..5761404 | 716 | B | playback ticking gate (isPreviewPlaying \|\| isPerformancePlaying …) |
| `fn_ne_frameloop.js` | ne_frameloop | 5761567..5762032 | 465 | B | RUNTIME FRAME LOOP: rig/handles/playback/preview/bounds/spotlights/record ticks all run; if planShown\|\|!pageLive -> only scene.updateMatrixWorld() — the WebGL render pauses on the plan view |
| `fn_shownPose_impl.js` | shownPose_impl | 5763256..5763526 | 270 | B | runtime facade shownPose(id): mesh world TRS via Bie + getWorldScale; +fovDeg for cameras; used by rDr items() to mirror playback |
| `fn_oKr_planbits.js` | oKr_planbits | 5786089..5787358 | 1269 | B | class oKr fields: mode=Ne("edit"), viewportMode=Ne("3d"), setViewportMode, enterSceneNode (saves mode, setViewportMode("plan"), first-camera wait), leaveSceneNode (restore), planShown=Ne(viewportMode==="plan" && mode==="edit" && !playSession), editInteraction, lassoRect, toggleLasso |
| `fn_KYr.js` | KYr | 5839397..5839824 | 427 | C | topbar switch: stageView editor\|cameras segmented; when editor -> viewportMode 3d\|plan segmented (s7ndfi/WaHG3t) |
| `fn_ilt.js` | ilt | 5839824..5840274 | 450 | C | segmented control primitive |
| `fn_nQr.js` | nQr | 5850012..5852778 | 2766 | C | ViewSwitch/RecordControls factory reading viewportMode/planShown/planView props |

---

## 2. Call graph (plan subsystem only)

```
rBr ─┬─ ELr jLr ILr MLr NLr PLr RLr FLr OLr LLr $Lr BLr   (view/drag state reducers)
     ├─ DLr DZt HLr ─┬─ xLr ─ Qhe ─┬─ Xat (select id)      (hit testing)
     │               │             └─ wLr (mod-cycle)
     │               ├─ kLr ─ zDe (rotate/lens handles)
     │               ├─ OZt ─ LZt (tap-or-draw focus)
     │               └─ _Lr (marquee) ─ Rie ─ dqt
     ├─ NLr ─ PZt FZt ─ fqt ─ S1 mqt(iqt..oqt) / UDe
     ├─ ILr ─ uqt ─ dqt        ├─ MLr/FLr (centerOn)      ├─ LLr (zoom%)
     ├─ SDr ─┬─ TDr ─ _Dr S1 iu
     │       ├─ IDr ─ dBe ─ cBe   (pools)
     │       ├─ jDr ─┬─ NDr ─ pqt (camera wedge)
     │       │       ├─ VZt ─ MDr (humanoid stick)
     │       │       ├─ EDr ─ dBe cBe aqt Nie PP FU (figure body)
     │       │       ├─ q5 (labels)  └─ Rie (label anchor)
     │       ├─ CDr ─ $Zt kDr KY iu (paths + keys)
     │       ├─ ADr ─ q5 wDr iit lye (focus overlay)
     │       ├─ PDr ─ zDe cqt ─ RDr (callout)
     │       └─ Rie pL Cje (group boxes)
     ├─ $Ir (edge indicators) ─ FDr ─ q5 uN l$
     ├─ ZIr ─ zDe WIr GIr qIr $2e (camera label overlay)
     └─ dye (event→px)  S1 (drop→world)

rDr.apply ─┬─ move ─┬─ startPose/shownOrStored ─ shownPose│Zo ─ pie(toLocal)
           │        ├─ carryPaths (shiftPaths) · camera target follow
           │        └─ commitOne ─ SZt(rebase) ─ GOr·_Zt·$Or ─ XWt ─ carryAimPoint ─ oBe
           ├─ turn ─ i9 GA nDr(uL,qY,xb) ─ commitOne
           ├─ lens ─ UIr yT tDe
           ├─ startStroke ─ hL focusOf ─ rx(ofS) ─ seekPerformance(0)
           ├─ (per frame) drawFrame → tickStroke ─ previewPose ─ kv xM NP CZt ─ drawPreview
           │            └─ stroke-move intent → stroke.at easing (grab, tDr)
           ├─ endStroke ─ replaceMoveFromSamples ─ vHr ─ xHr wHr Ait ─ mT ─ nx MR ─ Zo
           │             ─ YZt/Htt/Qae speeds · JCe gait · moveSegmentOf/updateTrackItems
           └─ items() ─ entries(tit) labels(DDe) ─ Dst(i9,PP,Fst,zh) ─ TDe(Rhe) ─ hqt(Z_) ─
                        shownPose(Bie,nat) · drag.riding

paths (derived) ─ rit(eit=40,Bzt,cZt) · nx(Ptt=12,E2r) · hL · Zo(parentId compose)
```

---

## 3. DIFF TABLE — bundle truth vs our `editor/js/plan.js`

Legend: **MATCH** = same value/behavior · **DIVERGES** = same feature, different value/logic ·
**MISSING** = bundle has it, our port doesn't · **EXTRA** = our port invented it (not in bundle).

### 3.1 Constants

| constant | bundle value @char-off | our plan.js | verdict |
|---|---|---|---|
| pxPerM default | `Uhe=34` @5249891 | `PPM_DEFAULT = 34` | MATCH |
| pxPerM min | `iqt=14` @5249898 | `PPM_MIN = 14` | MATCH |
| pxPerM max | `oqt=Uhe*5=170` @5249905 | `PPM_MAX = 170` | MATCH |
| zoom% readout | `LLr: round(pxPerM/34*100)` @5457890 | same formula | MATCH |
| fit margin | `TLr=48` @5456666 | `FIT_MARGIN = 48` | MATCH |
| fit min span | none — `max(1e-6, span)` @zIr 5252461 | `spanX/Z = max(2, …)` | DIVERGES (port forces ≥2m) |
| marker hit radius | `lqt=12` @5249931 | `MARKER_HIT_PX = 12` | MATCH |
| footprint slop | `vLr=8` @5455489 | `FOOT_SLOP_PX = 8` | MATCH |
| handle hit radius | `cqt(6)+yLr(2)=8` @kLr 5456459 | `<= 8` | MATCH |
| move threshold | `Qat=3` px @DZt | `MOVE_THRESH_PX = 3` | MATCH |
| stroke-move threshold | `SLr=4` px between samples @DZt | — (samples by distance) | MISSING |
| marquee min | `Jat=4` — select if **either** dim >4 (@HLr) | `w>=4 && h>=4` (**both**) | DIVERGES |
| snap (Shift move) | `Vie=.25` m | `SNAP_M = 0.25` | MATCH |
| rotate snap (Shift) | `Yat=π/12` =15° | `SNAP_DEG = 15` | MATCH |
| wheel zoom rates | `pLr=.005` fine (\|ΔY\|≤20) @5454672, `fLr=.02` coarse @5454681 | `> 20 ? .005 : .02` | MATCH |
| wheel pan multiplier | `mLr=2` (deltaMode 0) / `gLr=1` | `deltaMode===0 ? 2 : 1` | MATCH |
| wheel pan sign | `UDe(view, −dx, −dy)` @NLr | `cx += deltaX*k/ppm` (**+**) | DIVERGES (inverted) |
| zoom factor floor | `FZt = max(.1, 1+δ)` | `max(0.1, 1 − deltaY*rate)` | MATCH |
| kb/button zoom step | `Aje=.2` → factor `max(.1, 1±.2)` at center @RLr | — (no buttons) | MISSING |
| autopan deadzone/speed | `ALr=.8` deadzone, `CLr=720` px/s @5456619 | — | MISSING |
| centerOn ease | `nBr=320` ms cubic-out (`1−(1−t)³`) @rBr | — (instant) | MISSING |
| grid minor step / majors | `HZt=1` m skip `oye=5` multiples; majors 5 m | same | MATCH |
| grid fade range | `sit=8 → iDr=24` (`_Dr=(ppm−8)/16` clamp) | `(pxPerM−8)/16` | MATCH |
| stick figure size | `MDr=clamp(6,12, ppm*.32)` (`cDr=.32`) | `max(6, min(12, ppm*0.32))` | MATCH |
| humanoid label alpha (unsel) | `oit=.35` | `0.35` | MATCH |
| pool alpha | `bDr=.14` / `yDr=.24` sel | `POOL_A/.POOL_A_SEL` | MATCH |
| pool min radius | **none** @TDe | `max(0.4, d*tan)` | EXTRA (port clamps) |
| pool half-angle | `Rhe`: `min(55°, max(3°, 16°·avg\|scale\|))` (`JWt=16,eGt=3,tGt=55` @4906170) | same formula | MATCH |
| pool gate | `y>0 && fwd.y ≤ −.05` | `y<=0 \|\| fy>-0.05 → null` | MATCH |
| spotlight default cfg | `QWt={shape:"round",intensity:70,diffusion:30}` | — | MISSING (n/a in port) |
| camera body/lens polys | `oDr=[[-9,-1],[9,-1],[9,11],[-9,11]]`, `lDr=[[-4,-1],[-6.5,-8],[6.5,-8],[4,-1]]` @5480195 | identical arrays | MATCH |
| wedge fill/stroke | α `.2/.1` fill, `.6/1` stroke `1.4/1` | same | MATCH |
| lens ahead dist | `Ost=4.2` m (`pqt`) | `LENS_AHEAD_M = 4.2` | MATCH |
| focal stops | `yT=[14,18,24,35,50,85,135,200]` @5249951 | — | MISSING (lens drag absent) |
| default focal | `Hv=50` @4902324 | `?? 50` | MATCH |
| fov→wedge | `Z_: 2·atan(35/max(aspect,1)/2/focal)·180/π` (`Lzt=35`), `hqt: atan(tan(fov/2)·aspect)` | same formulas | MATCH |
| aspect table | `Zae` 16:9, 9:16, 1:1, 4:3, 1.85:1, 2.39:1 @3920341 | `C.ASPECTS` | MATCH |
| humanoid footprint half | `Fst=.26·sx / .26·sz` | `0.26*sx/sz` | MATCH |
| figure footprint halves | `PP[0]·sx/2 = .547·sx` (PP=[.406,1.059,.289]·sA, sA=1.75/1.299) | `0.406·sA·sx` (**full width, 2×**) | **DIVERGES (2× too big)** |
| sphere/cyl footprint | `sx/2, sz/2`, **no min** | `max(sx,0.2)/2` | DIVERGES (port clamps) |
| prop footprint | `zh[propKey].dims ?? [1,1,1]` halves, **no min** | `max(0.15, dims/2)` | DIVERGES (port clamps) |
| z-order map | `tit` prop/cube/sphere/cylinder/group=0, humanoid/figure=1, target=2, spotlight/camera=3 @5462434 | identical | MATCH |
| stroke width (in-progress) | `xDr=2.4` | `2.4` | MATCH |
| dimmed path alpha | `vDr=.5` | — | MISSING |
| path dash/width | `[2,4]`, `1.4` | same | MATCH |
| path key diamond | `KY=4.5` (half-diag `4.5·√2≈6.36`) | `6.4` | MATCH |
| group box | dash `[4,3]`, pad `pL=8` (+16 total), label `Cje=11`px `textDim` at `maxY+8+14` | same | MATCH |
| group label source | first member item's `groupLabel` (labels map of parent) | group object `name` | MATCH (equivalent) |
| callout ring radius | marker `VIr=34`; **ellipse `max(hw,hd)·ppm+12`**; rect `max(hw,hd)·1.2·ppm+10` @zDe | `marker?34: max·1.2·ppm+10` | DIVERGES (ellipse case missing) |
| callout handle dot | `cqt=6` for rotate **and lens** dots + `RDr` direction tick arc/chevrons | rotate dot only, no tick | DIVERGES |
| callout condition | `selection.size===1 && !stroke` (active stroke only) | `sel.size===1 && !drawing` (whole draw mode) | DIVERGES |
| target cross | circle `gDr=8`, arms `ZY=12` | `8` / `12` | MATCH |
| spotlight dot | `ait=6`; pool line dashed `[3,3]` α `.9/.5` | `6`; same line | MATCH |
| camera label pos | `+18/+26`, `l$=12`px | same | MATCH |
| edge indicator | margin `Rst=22`, radius `uN=13`, click slop `uN+3`, arrow + name tag, `camera` colors @FDr | 22/13, no arrow, `panel/camera/textDim` | DIVERGES (port partial) |
| stroke sample rule | `tickStroke`: push if `Δt≥VLr=.05s` **or** position changed (per rAF frame) | pointermove `dist>0.04m` | **DIVERGES** |
| stroke min arc | `fHr=.3` m | `arc < 0.3 → discard` | MATCH |
| ¼-smoothing | `wHr`: ×2 passes, **only non-anchor pts** (dwell spans `≥gHr=.25s` + endpoints pinned) | ×2 passes on **all** interior pts | DIVERGES |
| dwell time re-blend | `mHr=.7` monotone re-spread inside dwell spans | — | MISSING |
| anchor spacing | `yHr=.2` m; exact last point forced (pop if `<.2m`) | `≥0.2m`; `<2 anchors → abort` | DIVERGES (end handling) |
| pace array | `d=max(K2r=32, ceil(dur/bHr=.1)+1)` arc-fraction samples, `Tit=1e4` quantization | — | MISSING |
| steady speeds | `YZt=2` (camera), `Htt=1.4` (walker) | `2 / 1.4` | MATCH |
| min drawn speed | `Qae=.01` | `0.01` | MATCH |
| speed arc basis | `MR(nx(mT(points)))` — resampled **bezier** polyline | raw sample arc | DIVERGES |
| bezier resample density | `Ptt=12` steps/span (`nx`) | curves.js (check) | verify |
| match-speed semantics | `steady:!matchDrawSpeed` (checked ⇒ match your speed + `pace`) | same idea, no `pace` | MATCH (pace MISSING) |
| path sample count | `eit=40` (`rit` resamples to 41 pts) | `i<=40` (41 pts) | MATCH |
| rehearse tip timeout | `ULr=4000` ms | — | MISSING |
| focus ease | `eDr=.4` s (smoothstep slerp) | — | MISSING |
| face-turn threshold | `zLr=.05` m | — | MISSING |
| grab decay | `tDr=1` (offset `grab·max(0,1−dist/1m)`) | — | MISSING |
| stroke timer | `{nowS, ofS=rest-of-show duration}` (`rx`), 0.1 s granularity | — | MISSING |
| drag clamp box | `JLr={±3m}` (only for addCamera default bounds) | — | n/a |
| addCamera placement | `XLr=.12, YLr=1.6, KLr=.18, QLr=1.4`, snap `.25` | — | MISSING |
| figure body dims | `PP=[.406,1.059,.289]·sA` (sA=1.75/1.299), head `Nie=.125·sA`, arc `Pie=72°`, `DIr=[−6°,14°]` | partial (see 3.2) | DIVERGES |
| label contrast | `aqt`: luma `.2126/.7152/.0722 > HIr=.72 → BIr="#1c0f09"` else `#fff` | — | MISSING |
| i18n pill labels | draw `"Draw direction"`(5TURvb), update `"/n/vNv"`, finish `"fI7ZNS"`, match-speed `"Vk78FE"`, delete `"47jR/i"` | "✎ Draw path"/"✎ Redraw"/"✓ Finish"/"match speed" | DIVERGES (wording) |
| pill match-speed visibility | only while `state==="drawing"` | always | DIVERGES |
| pill delete (update state) | delete-pill button → `deleteMove` | — | MISSING |
| person toggle | figure/humanoid switcher while person && !drawing | — | MISSING |
| plan bar position | pill group + camera pills + zoom bar are separate docked widgets (sBr) | single left-top bar | DIVERGES (layout) |
| Esc chain | `stepBack`: stroke→swallow; drawing→exit; selection→deselect; else false | Escape exits drawing only | DIVERGES |
| selection promotion | `Xat/_Lr`: **unconditional** `parentId??id` | exempts camera/target/spotlight | DIVERGES (port adds exemption) |
| shift-click toggle | toggles in selection (DLr) | same | MATCH |
| plain click on selected member | keeps whole selection, drags all (DLr) | collapses to `[id]` | DIVERGES |
| click on empty space | deselects at pointer**down** (marquee branch emits `select:[]`) | keeps selection (deselect only via ≥4px marquee) | DIVERGES |
| drawing while playing | `locked = isPerformancePlaying||isRecording` blocks drawing (disposer cancels stroke) | `startDrawing` calls `setPlaying(false)` | DIVERGES |
| ⌘/ctrl click | `wLr` cycles child within overlapping group | — | MISSING |
| move intent coords | world Δ from anchor, Shift-snap `.25`; `updateObjectTransform` + `pie` toLocal (group-relative!) + `GA` euler fold | writes `position:[base+Δ]` directly (no parent compose) | DIVERGES |
| move side effects | camera `targetId` target follows; `carryPaths` shifts the camera's path (`shiftPaths`) | — | MISSING |
| move ids | **whole selection** at pointerdown | selected ids (≈same) | MATCH-ish |
| rotate handle drag | `o=atan2(fp.x−p.x, fp.z−p.z)` (pointer→center ⇒ faces pointer); turn() = quaternion premultiply world-Y Δ; rebase for cameras (SZt) | `atan2(px−cx, −(py−cy))` → euler Y (**mirrored on X**) | **DIVERGES (port bug)** |
| lens handle drag | focal = `UIr(\|tDe(yaw, o)\|, aspect, shift→snap to yT)` | — | MISSING |
| tap-or-draw | pointerdown on other object while drawing = `focus` intent on release (<3px); focusTip tooltip at pointer+{18,−44} | — | MISSING |
| stroke start point | object's current plan position + grab-offset easing toward pointer | first pointer position | DIVERGES |
| stroke rewind | `startStroke` seeks playhead to 0; each tick `seekPerformance(elapsed)` (show plays while you draw) | seek(0) once | DIVERGES (partial) |
| stroke preview ghost | `drawPreview.set(previewPose)` → frame loop `z()` poses the mesh | — | MISSING |
| endStroke replace | `updateTrackItems(track,[new,…rest w/o old move])` — new id, old removed, focalLengthMm preserved, `startS=max(0,0)` | `patchItem` existing (same id) | DIVERGES |
| path aim rules | camera: `focus?"subject":"locked"`; walker: `subject` if focus else **undefined**; prop: `"locked"` | cam-path `'travel'`, humanoid `'travel'`, prop `'locked'` | DIVERGES |
| humanoid gait | `gait:JCe="walk"` | `'walk'` | MATCH |
| cam-transform paths | `cam-transform` keys → `cZt` interpolation | — | MISSING |
| transform paths | `Bzt` key interp + **Zo world-compose with parentId** | manual lerp, no parent compose | DIVERGES |
| resize behavior | `jLr` keeps world center (adjusts center by Δpx/2/ppm) | center unchanged (px-anchored) | DIVERGES |
| refit after interaction | re-fit only if user hasn't interacted (`A.current` flag) | refits whenever `!fitted` | DIVERGES (minor) |
| drop components | `onDrop → S1(view, px)` (V6 drag type) | — | MISSING |
| dpr handling | `canvas.width=round(w·dpr)`, `setTransform(dpr,0,0,dpr,0,0)` | same | MATCH |
| event→px | `dye` accounts CSS scale (`clientWidth/rect.width`) | plain rect offset | DIVERGES (minor) |
| planShown | `viewportMode==="plan" && mode==="edit" && !playSession` | same w/ `!playing` | MATCH |
| frame loop pause | all ticks; `planShown→updateMatrixWorld()` only (render skipped) | main.js does this | MATCH |
| WASD gate | disabled while planShown (`ne()` in kbd controller) | n/a (no WASD) | n/a |
| viewportMode UI | `KYr`: stageView editor\|cameras segmented; when editor → 3d\|plan segmented (`ilt`) | ui.js segmented | MATCH-ish |
| pxPerM persistence | **none found** in plan code (view state is per-mount `useRef`, resets) | not persisted | MATCH |

### 3.2 Geometry/painter divergences in detail

1. **simple_figure footprint** — bundle halves (`PP[0]·sx/2`); port full width. Fix port to
   `halfWidthM = 0.406·sA·sx/2`, `halfDepthM = 0.289·sA·sz/2`.
2. **figure body painter (EDr)** — min-size handling: bundle scales BOTH half-extents by common
   `l = max(1, uDr=7 / (halfW·ppm))`; port clamps each dim to ≥3px. Shoulder stripe height
   `max(1.5, d·0.2)` (port `D·0.4` — 2× too tall). Head radius `Nie·f·ppm·l` with
   `f=min(halfW/(PP[0]/2), halfD/(PP[2]/2))` (port `max(2, .168·sx·ppm)`). Face arc centered on
   `atan2` of `FU(yaw+headYaw)` ±`Pie=72°` (port: fixed up-direction ±1.257 rad). Direction tick
   from `d+3` to `d+10` px beyond the body along `FU(yaw)` (port: none). Body fill `human`,
   head ring stroke `background`, face-arc color `aqt(human)` (port: fixed rgba blacks).
3. **humanoid legs** — bundle draws a V `[(±.45n, n), (0, .3n)]` (two segments meeting at hip);
   port draws two parallel verticals. Forward tick lineWidth fixed `1.6` (port `n>8?2.2:1.6`).
4. **ellipse props orientation** — bundle `ctx.ellipse(x,y,rx,ry, −yawRad, …)` (mirror vs port's
   `rotate(+yaw)`) — differs for spheres/cylinders at yaw ∉ {0°,±90°,180°}.
5. **ellipse hit-test** — `u²+h² ≤ 1` (port `≤ 1.2`).
6. **pool square** — `dBe` rotated square of half-extent `r` (side 2r); port draws unrotated
   `1.414·r` square.
7. **edge indicators** — bundle FDr draws bubble + **arrow triangle** rotated toward
   `angleRad` + camera-colored name tag (`l$=12`, middle baseline); port draws plain circle+text.
8. **callout** — missing lens-handle dots and the `RDr` rotate-tick (arc at `r+pDr(6)` with
   `fDr=12/mDr=16` angular extent + chevron arrowheads, lineWidth 1.6).
9. **rotate handle direction** — see table: bundle `atan2(fp.x−p.x, fp.z−p.z)`; port's
   `atan2(px−cx, −(py−cy))` mirrors horizontally (**real port bug**: dragging the handle right
   of center faces the object left).
10. **paths draw order** — bundle paints pools → **non-char items** → paths+stroke → char items
    (paths between the two item passes); port paints paths before all items.

### 3.3 Things our port has that the bundle does NOT (EXTRA)

- `Foot_slop` min 3px prop box (`Math.max(3, …)` on prop W/D) — bundle paints raw half-extent px.
- `.04m` stroke sampling distance (bundle: time-based `.05s`/any-move per frame).
- Pool radius `.4m` floor; sphere `.2` scale floor; prop `.15` half floor.
- `hasPathFor` pill text distinction "✎ Redraw" (bundle has a 3-state pill + delete + person
  toggle instead).
- Keyboard Escape exits drawing mid-stroke (bundle swallows Esc while a stroke is active).

---

## 4. Oracle feasibility (per function)

**A — fully standalone** (plain data in → plain data out; zero stubs):
`aqt i9 FU hqt iu S1 UDe fqt zIr mqt dqt Rie uqt Xat Qhe xLr wLr _Lr kLr ELr jLr ILr MLr NLr PLr
RLr FLr OLr LLr FZt OZt LZt PZt bLr DLr DZt HLr BLr $Lr Ait vHr xHr wHr mT nx MR xU E2r tDe ybe
GA Bzt Zo el fie Q0 Rhe rGt X8r gie _Dr kDr TDr q5 $Zt cBe dBe VZt MDr NDr IDr PDr RDr FDr EDr ADr
CDr SDr jDr zDe pqt UIr aMr DDe sDr hL rit Z_ yd Am uje NP kv xM lZt` + all `consts_*` files.
(DLr/DZt/HLr/BLr/$Lr are pure but call the A-rated helpers — provide them, still Node-runnable.)

**B — needs small stubs:**
- Painter fns (SDr, jDr, …): a **recording Canvas2D proxy** (see ORACLE_PLAN.md) — no real canvas.
- `TDe/Rhe/rGt/X8r`: three.js `Vector3/Euler` (Ge/va) or 6-line math shims (`applyEuler` of
  (0,0,−1)).
- `pie/XWt/dZt/SZt/wje/_je/Xu/HAe`: three.js `Matrix4/Quaternion/Vector3` + solid `batch`
  (`HAe` = `fn()` immediately is a faithful shim).
- `replaceMoveFromSamples`: extracted as a class method; needs `this.{objects,trackIdOf,
  addPerformanceTrack,moveSegmentOf,updateTrackItems}` — a ~20-line recording stub.
- `class rDr`: needs the whole app facade (`this.a.*`) — for the oracle, drive only
  `apply/items/startStroke/tickStroke/endStroke/stepBack` with a scripted facade (see
  ORACLE_PLAN.md §fixture).
- `shownPose_impl/se_playback/z_drawPreview/ne_frameloop/keyboard_gate`: read-only slices — run
  as documentation, not as oracle (C in practice).
- `RZt` (wheel router): needs `window.setTimeout` + DOM `closest` — 5-line stub.

**C — React/DOM-bound (shim = jsdom or mock jsx):**
`rBr sBr yRr RRr FRr ORr LRr iFr ilt KYr nQr oKr_planbits`. rBr's *reducer wiring* is testable
by calling DLr/DZt/HLr directly (A-rated); only the DOM/rAF shell is C.

---

## 5. NOT FOUND / out-of-scope (with search log)

- **"plan-canvas"** css class name: 0 hits (classes are `_plan_1sdme_20 _palette_1sdme_3`,
  `uit.plan`, in `consts_cursor`). The canvas element itself is `<canvas data-testid="stage-plan">`
  inside `rBr` @5498215 — found, extracted.
- **pxPerM persistence across sessions**: searched `pxPerM` (25 hits, all in-plan local state),
  `localStorage` near plan code — the plan view state lives in a `useRef` inside rBr and is NOT
  persisted; only `controlMode`/`inputDevice` (`aKr/iKr` @5785767) persist. The mission's
  "page store fields for plan (zoom/pan/pxPerM persistence per session)" is therefore **not a
  thing in the bundle** — closest is `rDr.zoomPercent` signal (display only) and `zoomCommand`/
  `centerRequest` signals.
- **`polylineOf` name**: bundle name is `nx` @3927240 (extracted); `buildTangents` = `mT`
  @3926344; `arcLength` = `MR` @3927599. Port's `curves.js` names map 1:1.
- **'cameras' stageView interaction**: the segmented control (`KYr` @5839397) switches
  `stageView` editor↔cameras; the cameras view itself renders camera PIP feeds — outside the
  plan canvas (the plan only reacts via `enterSceneNode` forcing `viewportMode="plan"`).
  Extracted the control + `oKr` wiring; no further plan-side behavior found.
- **`vHr` "anchors ≥.2m apart"** exists, but the mission's "min .3m arc (fHr)" is an *arc-length
  gate*, and "¼-smoothing ×2" applies only to non-anchor samples — the distilled spec in
  ROUND6/EDITOR_UX was directionally right but imprecise (see DIFF TABLE).
- Onboarding tutorial mini-canvases (`UDr/zDr/WDr/GDr/$Dr/QDr` @5491631-5496000, help/focus/
  height demos with `cit/$u/UZt/z6/zZt/Eje/XB/lit/fL` helpers @5489771-5491631): **not extracted**
  (self-contained animated demos, no plan-state interaction). Say the word and they can be added
  with the same script (one slice).
