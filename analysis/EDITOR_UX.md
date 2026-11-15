# EDITOR UX RUNTIME — flick.art 3D Stage (bundle `index-DBE17t4T.js`)

Complete extraction of the editor's runtime UX logic from the minified bundle + saved DOMs, cross-checked against `SCENE_FIDELITY_AUDIT.md` §3 (older build `index-T1E-AuVS.js`). Raw de-minified excerpts: `extracted/ux_raw.js` (sections referenced below as `§n`). UI spec: `DOM_REFERENCE.md`.

**Name map old→new build** (audit §3 names → this bundle):

| Old (T1E-AuVS) | New (DBE17t4T) | What |
|---|---|---|
| `HWr`/`$Wr` (rounded-box selection shader) | **gone** — replaced by `pGr` footprint shader `cGr/dGr` + stroke mask `hGr`; `HWr` now = finish-composer fragment, `$Wr` = 1.5 (stroke px) | selection visuals (see §1) |
| `Nhe` (frustum angle) | `Rhe` | `clamp(avg(|scale|)*16°, 3°, 55°)` |
| `sOr/rOr/iOr` | same (`sOr` light ctor, `iOr` cookie, `oOr` beams) | spotlights |
| `HY/mFr` daylight | `HY` stops + `DFr` full-day anchor | daylight table |
| `KFr/XFr` sky shader | `yOr/vOr` | sky dome |
| `dBe/jZt/kLr/TLr` slider consts | `lBe=.2`, `MZt=4`, `GLr=12`, `ZLr=50`, `qLr=4` | height slider 0.2–12(→50) |
| `_Fa/kFa` lens log interp | `WFa/GFa` (+`Gze=1000`) | 0..1000 ⇄ 14..200 mm |
| `Gae` aspect map | `Zae` (same 6 entries; `Am()` accessor) | recordAspect |
| `qGt` chrome px | `KGt=96` | frame guide inset |
| `ZGt/Dbr` record framing | `XGt` + `o2r` + `MGr` DOM overlay | frame guide math |
| `gq` camera rigs | same | tripod/gimbal/steadicam/handheld/run/drone |
| `HGt` pan deg/s | `VGt=20` | camera pan speed |
| `NU=10` schema | unchanged (v10) | scene JSON |
| `TOr` (new) | shadow **fingerprint** buffer (not drag recorder) | see §2.8 |
| `kOr/Bat` (new) | **shadow-camera** grid snap (not object snapping) | see §2.8 |

New-in-this-build subsystems with no old-build counterpart: **Finish** SSAO/edge composer (`hKt`), **stroke** selection outline (`hGr`), hover disc (`CGr`), nav-ball minimap (`lZr`), PIP window, take/hub recording pipeline (`mqr`), plan-canvas intent system (`rDr/rBr`), rig-handle picking (`xqr`).

---

## 1. Selection visuals (P1)

Selection is now **three layered systems**, all driven by `planningAids` + a post-render pass `EOr`:

### 1.1 Ground footprint — rounded-box shader (`pGr`, `§12`)
One `PlaneGeometry(2,2)` mesh per selected object id (max `WWr=32`), rotated flat (rotation order YXZ, `rotation.set(-π/2, yaw, 0)`), `polygonOffset -2/-2`, `depthWrite:false`, transparent, `fog:false`, in `planningAids`.

- **Foot computation `lGr(mesh)`** (before `cGr`): rotate each child's `geometry.boundingBox` 8 corners (and every `SkinnedMesh` bone position, via `RR`=SkinnedMesh) by parent yaw into world XZ; result `{x, z, halfX, halfZ, y=max(minY,0), top, yaw}`. Kinds `camera|target|spotlight` (`_De` set) use full `traverse`; other kinds skip non-Mesh children and basic-material meshes (`gBe`).
- **Uniforms per frame** (`f(entry, foot, now, camera, clientHeight)`):
  - `px` = pixels-per-meter at foot = `dist(footCenter, camera.pos) * 2*tan(fov/2) / clientHeight`
  - pad `W = max(min(halfX,halfZ)*YWr(0.1), XWr(10)*px)`; `U=halfX+W`, `V=halfZ+W`
  - ripple reach `G = max(min(halfX,halfZ)*tGr(0.5), eGr(120)*px)`; extent margin `Z = G + nGr(12)*px`
  - corner radius `= min(min(U,V)*JWr(0.45), max(W*1.6, QWr(14)*px))`
  - `uHalf=(U,V)`, `uExtent=(U+Z,V+Z)`, `uReach=G`, `uPx=px`
  - animation: `uT = (now-selectedAtMs)/qWr(1000ms)` (2 = "no anim"), `uFade = min(1, dt/KWr(160ms))`; both forced final under `prefers-reduced-motion`
  - position `foot.x, foot.y + px*0.6, foot.z`; scale `(U+Z, V+Z, 1)`
- **Shaders** `cGr` (vertex: `vP = position.xy * uExtent`) and `dGr` (fragment):
  ```glsl
  float boxDistance(vec2 p){ vec2 q = abs(p)-uHalf+uRadius;
    return length(max(q,0.)) + min(max(q.x,q.y),0.) - uRadius; }        // rounded-rect SDF
  float line(float d,float at,float w,float aa){ return 1.-smoothstep(w-aa,w+aa,abs(d-at)); }
  // main:
  float d = boxDistance(vP); float aa = max(fwidth(d),1e-5);
  float band = 3.0 * uPx;                       // white stroke = 3px band centred at d≈1.5px inside edge
  float inset = 0.42 * (1.0 - smoothstep(-aa,aa,d));
  float shade = max(inset, 0.22*line(d,band+uPx,uPx,aa)) * uFade;   // soft dark shadow just outside
  float white = line(d, band*0.5, band*0.5, aa) * uFade;            // crisp white 3px line
  float wash = 0.0;                                                 // selection "pulse" ripple
  if (uT>=0.0 && uT<1.0){
    float e = 1.0-pow(1.0-uT,3.0);
    float x = (length(vP)-e*(length(uHalf)+uReach))/(uReach*0.45);
    wash = 0.72*exp(-x*x)*pow(1.0-uT,1.1)*(1.0-smoothstep(uReach*0.7,uReach,d));
    wash *= smoothstep(0.0,0.03,uT);
  }
  float a = clamp(shade+white+wash,0.,1.); if(a<=0.001) discard;
  gl_FragColor = vec4(mix(uFill,uLine,clamp(white+wash,0.,1.)), a);
  ```
  `uFill = rGr = #5f7196` (muted blue), `uLine = sGr = #ffffff`.
- **Lifecycle** (`tick` = `b`): selected ids (`selectedIds.peek().slice(0,32)`) get/keep entries; deselected stay visible for `ZWr=500ms` then removed. Also computes **`selectionScreenBounds`** store (`m`): project the 8 foot corners (fallback mesh world position) to screen px, union, then extend by `GWr=0.18*clientHeight` around the selection centroid — this is what positions the floating transform toolbar (`QXr` clamps it into the viewport).
- `showSelectionRings(camera, clientHeight)` — shows all footprints (they're planning aids, normally hidden during playback/filming) and returns a restore fn; used by PIP feed renders.

### 1.2 Silhouette stroke — mask ring shader (`hGr`, `§12`)
`drawStroke()` runs **after every main render** (and `strokeSelection(renderer, camera)` for record/PIP cameras):
1. Collect meshes of selected ids (+ hovered id) via `aGr` (kind-aware traversal incl. skinned bones).
2. Render them into an offscreen RT (`stroke target`): scale `L=min(1, 1080/viewportHeight)`, dims rounded up to `lQ=16` px multiples, `samples=UWr=4` MSAA, `minFilter=LinearMipmap` (mips required by the shader). `scene.overrideMaterial = MeshBasicMaterial(white, DoubleSide, fog:false)`; selected subtree meshes get `layers.enable(2)` plus all `Line` objects (`yS`); camera renders **layer 2 only**.
3. Fullscreen quad with `hGr`:
  ```glsl
  if (textureLod(tMask, vUv, 4.0).r == 0.0) discard;     // coarse-mip early-out
  float inside = textureLod(tMask, vUv, 0.0).r; if (inside >= 0.999) discard;
  float s = max(ringMax(uWidth), ringMax(uWidth*0.5)) * (1.0-inside);   // 8-tap ring max
  float h = 0.26 * ringMax(uWidth + 2.0) * (1.0-inside) * (1.0-s);      // dark halo
  gl_FragColor = vec4(mix(vec3(0.09,0.11,0.18), vec3(1.0), s/max(a,1e-3)), s+h);
  ```
  `ringMax(r)` = max of 8 samples on a circle radius `r*uTexel`. `uWidth = $Wr(1.5) * pixelRatio * (targetH/viewportH)` → **1.5 px white outline + ~0.26-alpha dark-navy halo** around the selected/hovered silhouette. `depthTest:false`, transparent, rendered with an `OrthographicCamera(-1,1,1,-1,0,1)`.

### 1.3 Hover indicator + cursor (`CGr`, `§14`)
- Throttled raycast on pointer move: re-pick only when camera `matrixWorld` changed or scene changed, and only if last pick took <`_Gr(2ms)` or `kGr(33ms)` elapsed. Raycasts `[...meshById.values()]` + `floor`; nearest wins; walked up to `userData.objectId`, then `JEe()` group-promotion.
- Hover disc quad (`Mot(TGr)`): white ring + centre dot on dark halo, `uBig` = smoothed hover weight (ease `vGr=90ms`), scale `bGr(20)px * pxPerUnit * (pressed? yGr(0.78):1)`, oriented to hit face normal (`setFromUnitVectors((0,0,1), normal)`). Click ripple quad (`AGr`): expanding ring, `jot=900ms`, triggered by `rippleAt(intersection)` (e.g. after double-click center-view).
- Cursor: default = SVG dot `fGr` (18×18 circle r5 white, stroke `#141824` 60%, hotspot 9 9); over pickable object cursor is **hidden** (`gGr="none"`) while the disc shows; lasso mode uses the lasso cursor `nWr` (28×28 lasso, hotspot 6 24). Cursor only updated when current value matches last-set or `""` (avoids fighting other UI).

### 1.4 Finish composer (`hKt`, `§13`) — "Finish" stylized render
When `finishEnabled` (localStorage `stage-finish` `{enabled, source:auto|manual}`; auto-measured: cost budget `Bqr=11ms` at 1080p, GPU-timed via `qqr` 2 warm + 5 measured frames): the scene is rendered through 3 fullscreen passes — golden-angle SSAO `DWr` (`RADIUS=Lje(0.05)`, `SAMPLES=IWr(12)`, self-bias .2), separable 3-tap gaussian blur `BWr` (depth-aware), composite `HWr`: occlusion tint `MWr=0x626a8c`, edge (crease) tint `NWr=rgb(0.1,0.11,0.16)=0x1a1c28`, crease = second difference of 1/z, `smoothstep(0.004,0.03) * PWr(0.15)`, sRGB + triangular dither, `gl_FragDepth` preserved. Half-res occlusion buffer (max height `EWr=1080`, scale `jWr=0.5`). MSAA `cKt=4`. Also patches `lights_physical_pars_fragment` with `SOFT_TERMINATOR` (`dotNL = (dotNL<0.3 ? dotNL*dotNL/0.6 : dotNL-0.15)/0.85`) — enabled for sphere/cylinder materials (`oKt`).

### 1.5 Planning-aids pass (`EOr`)
After the main render (and after stroke): enable layer `aye=1` on every planning aid + all lines, set `camera.layers.set(1)`, `autoClear=false`, render again — footprints, gizmo, path lines, labels, beams always draw on top.

---

## 2. Object picking + manipulation (`pWr`, `§8`)

### 2.1 Gizmo = bundled three.js `TransformControls` (`ozr`) with **custom meshes** (`Mzr`, `§9`)
- Axis colors `h$={X:0xe5534b, Y:0x55b35e, Z:0x4a86e8}`; centre white `Nje=0xffffff` + inner dark `gzr=0x171b26`; renderOrder `Szr=1000010` (on top), all `MeshBasicMaterial`-like `Hw(color, opacity, side)` with `depthTest:false`.
- Translate: per axis shaft `CylinderGeometry(.009,.009,.42,16)` from y=.1→.52 + cone head `ConeGeometry(.03,.115,24)` at .52→.635; plane widgets = `CircleGeometry(.045,28)` at corner offset `Kj=.17` of each plane (XY/YZ/XZ), opacity .6 doubleSide; centre = sphere `.036` (20×14) white with back-side dark copy offset `bye=.006`.
- Rotate: half-torus per axis `TorusGeometry(.5,.0075,8,72,arc=π)`; `E` (screen-space ring) full torus radius `.75` tube `.8×`; `XYZE` ring tube `.45×` opacity `kzr=.35`.
- Scale: per axis cone + small box `.056³` at `.55`.
- Negative-axis pickers removed (`Nzr`: drop picker if bbox centre on that axis < -0.01).
- Mode mapping `F()`: `transformMode` store (translate/rotate/scale). Forced `translate` when the object is track-driven (`Xu`) or camera+rotate-refused; camera `scale` → translate; `setRotateAvailable(!driven && !aimLocked)` (camera rotate refused when `wje()` — an aim-locked/flown camera can't be rotated, only re-aimed via its item).
- Attach logic `B()`: ≥2 selected → temporary `Group g` at centroid (multi-transform); rig joints selected (`rigPoseObjectId` + selected joints, filtered to bones whose parent is a `Bone`, deduped via `Rzr`) → joint bone or a multi-joint group `x`; else single mesh; else detach. Re-runs on selection/editInteraction/playSession/show changes.
- `dragging-changed`: orbit disabled while dragging; multi-select children `attach()`ed into `g` and restored to parents on release; **alt-drag duplicates** the object(s) first (`duplicateObjectAt` — cameras duplicate with their target: `Die` resolves `targetId`); rig multi-joint drag builds offsets via `Dzr` and commits `captureFocusedRigPose`; camera+target pairs rotate together (`XWt`: target position rotated by the camera's delta quaternion, applied via `POr`).
- Rotation continuity: on release (and for the group case) `GA(euler, from)` unwraps ±2π (`sDe`-equivalent).
- **Commit `SZt`** (`§3`): refused if object is driven at playhead by `manual/path-position/path-look/path-anchored` items (i18n toast `TZt`); `captureFocusedCameraPose(world)` → writes a camera item key ("keyed"); target objects → `captureFocusedTransformPose`; cameras on cam-move chains are **rebased** (`_Zt`/`GOr`: recompute item position, rotation `keep|turn|framing`); else `updateObjectTransform` — position only when not under cam-path, rotation only when allowed (`VOr`); `reaimCamera` after refused translate; paired target moved too. "unbased" outcomes warn (`AZt`) and (for a duplicate) delete the duplicate.

### 2.2 Click selection (`ua` in `§8/§20`)
- Click slop `Sye=8px`; drag ≥ slop ⇒ no select. Double-click window `uWr=350ms` / `hWr=14px` (`h(e)`).
- Raycast `[...meshById.values()]`; walk `parent` to `userData.objectId`; `JEe(objects, id, selectedId)` — **group promotion**: if object's parent is a `group` and the current selection isn't already that group/sibling, select the **group**; kinds `camera|target|spotlight` never promote. Alt-click selects the raw object; ⌘/Ctrl toggles multi (`toggleSelect`, alt variant bypasses promotion); click empty → `selectObject(null)`.
- Double-click: on object → `focusObject(selectedId)`; on empty → restore previous selection + `centerViewOn(point)` (orbit target pans, ≤3× distance, y≥0.1; ripple at point).
- **Lasso** (`editInteraction==="lasso"`): drag rect → `lassoRect` store (screen px, drawn by React `._lassoBox`); on release project every mesh's world position, select those inside rect (excludes track-driven objects `Xu`); sets editInteraction back to idle. Cursor = lasso svg.
- **Rig joints**: `rigJointPickables` (`xqr`, `§27`) — spheres r `.028` (12×8), color `0x44a1ff` / selected `0xffd1e4`, `depthTest:false`, only when a `rig-transform` segment is selected AND playhead inside it; ⌘/Ctrl/Shift multi-toggles joints (`Fzr`).

### 2.3 Drag-on-floor / navigation
- Orbit (`Dqr`, `§7`): `OrbitControls` (`_qr`), target `(0,1,0)`, damping on, `rotateSpeed=Lqr(.75)`, `enableZoom=false` (custom zoom below), base `mouseButtons {LEFT:ROTATE, MIDDLE:PAN, RIGHT:null}` — but `iat(controlMode, alt)` re-maps per pointerdown: **Default mode → LEFT=PAN, MIDDLE=PAN, RIGHT=ROTATE; Unreal/Unity mode (or Alt held) → LEFT=ROTATE, MIDDLE=PAN, RIGHT=null** (right = free-look). `screenSpacePanning = mode!=="default"`, `touches.ONE = default ? PAN : ROTATE`. `o.enabled = mode==="edit"`.
- **Custom wheel** (`xe`): camera mode → `zoomCameraByWheel`; edit mode → `Vzr(deltaY, inputDevice)` classifies ctrl / deltaMode / `wheelDeltaY%120===0` (mouse) as **zoom**, trackpad 2-finger as **nav**: zoom = `pos *= exp(deltaY*wot(.0036))` clamped `[_ot(.5), AFr(sceneBounds.radius)]` around orbit target; default mode → orbit `we(dx,dy)` (spherical, `2π*rotateSpeed/clientHeight`, phi clamp `kot(.01)`); else pan `Ee` (`distance * rWr(.0016)` per px).
- Two-finger touch: pinch → zoom; default mode rotates (else pans).
- Right-button free-look (`te`): pointer capture, YXZ euler, `xot(.0022) rad/px`, pitch clamp ±(π/2−.01); WASD flies at `Tye=4 m/s` ×`Aye=3` (Shift), Q/E down/up. Release restores orbit.
- **WASD always** (edit mode, `ne()` = default control mode + edit + no playSession + !planShown + !sceneNodeOpen): `bot({forward,strafe}, speed, camera.position, camera.quaternion, orbit.target)` moves camera **and** orbit target; e/q adjust y.
- Nav ball (`lZr` = `U` in the runtime, 67×67 px pad top-right, `§7`): renders a **copy of the main framebuffer** into a corner scissor rect (67px + `zie=12` margin), radial-blur shader (12 golden-angle taps, radius `.085`, dim `.82`, edge fade `.68→1`) + a flat-shaded compass needle (`fot` geometry) that counter-rotates with camera yaw (`Kzr/Xzr`, roll `Uzr=.6` factor) — a minimap you can **drag** (`navBallVector {forward, strafe}` with `.12` deadzone via `zzr`) to fly the camera; `onNavBallDrive` wiring; only in edit mode without play HUD.
- Camera floor clamp `Uit`: `camera.position.y ≥ Khe(.1)`; `maxPolarAngle = acos((.1 − target.y)/distance)` recomputed per frame.
- Focus/center animation (`YUr`): ease-in-out-cubic over `UUr=.3s`; distance = `1.5 × bounds.radius / sin(min(fovY,fovX)/2)` (min `1.2`); pending id waits ≤ `qUr(5s)` (immediate: `GUr=2s`) for async meshes.

### 2.4 Keyboard (all through `ix()` = keyboardOwner==="stage" && !suspended; skipped in INPUT/TEXTAREA/contentEditable/playSession) (`Hzr`, `§11`)
| Key | Action |
|---|---|
| ⌘/Ctrl+Z / +Shift+Z / Ctrl+Y | undo / redo (`Bzr`) |
| ⌘/Ctrl+C, +V | copySelectedObject / pasteObject |
| ⌘/Ctrl+G | groupOrUngroup |
| Esc | finishPerformancePaint (exit path paint); lasso → idle |
| Enter (while editingPath) | finishPerformancePaint |
| Z / X / C (default) or W / E / R (unreal mode) | transformMode translate/rotate/scale (`Jqt`) |
| Space | togglePreview (play/pause rehearsal) |
| Delete / Backspace | path editing → deletePathAnchor(selectedAnchor); else deleteFocused |
| R (camera mode) | toggleRecording; Esc exits camera mode (if not pointer-locked/consumed) |
| WASDQE, Shift | fly/move (see §2.3) |
| Play mode HUD | WASD move · Shift run · C camera · Space jump · keymap slots (lmb,rmb,q,e,r,f → clips) · Enter record/stop · Esc/Done |

### 2.5 Object add palette (`§21` + DOM)
`Add component` opens the components column (Add Component tab): Human (humanoid), Figure (simple_figure), Camera, Target, Spotlight, Cube/Sphere/Cylinder, props (1439-item catalog `Uh`; prop picker with search/categories). `Add action` opens the Actions window. Palette/Actions tiles are **draggable onto the viewport**: components drop on the floor plane (ghost preview mesh at 45% opacity via `$Ur`, placed at `UWt(kind)` height — target=1, else 0; `VUr`), actions drop onto objects (`BUr`: raycast objects, highlight target via `u(id, OUr, LUr)` colors, `appendActionToObject`).
- **Spawn slots** (`addObject` without position): grid 5×6 (`V2e=5`, `rMr=6`), spacing `nL=1.5`, x = `(i%5)*1.5−3`, z = `floor(i/5)*1.5`, sequential `spawnIndex`.
- Spotlight spawns at `[x, 3.5, z+3]` aimed at `[x,0,z]` (`sGt`); target at height `zWt=1`; camera via `addCameraMarker`: `[4+n*1.5, 1.6, 4]` aimed at `[n*1.5, 1, 0]` (`rL=[4,1.6,4]`, `sL=[0,1,0]`, `kv` = lookAt+rotateY(π)).
- Default names: "Cube/Sphere/Cylinder/Human/Figure/Camera/Target/Spotlight N" (`defaultName`), props → catalog name.

### 2.6 Context menu
None — right-drag is orbit/free-look; `contextmenu` is preventDefault'd on the canvas.

### 2.7 Mesh ↔ object sync (`AWr.N`, `§15`)
For each store object: create mesh by kind — humanoid: Group + placeholder box, async-load `humanoid-B4Yewrzp.glb` (`Hhe`), scale to `jP=1.75m` height, center XZ, sit on minY, `AnimationMixer` + clipActions per `Fhe` clip, bone map; simple_figure: procedural `Zqt()`; camera: placeholder `$8r()` + `camera-DV-hMEYk.glb` (`qWt`, frustum sub-object "camera-frustum"); target: `YWt()` marker; spotlight: `sOr(rOr())` SpotLight rig + `spotlight-Cs6bAwrT.glb` (`ZWt`) lamp swap; prop: GLB by `Uh[key].url` (scale/yawDeg from catalog) or procedural; primitives `wWr(xWr(kind))`. `mesh.userData.objectId/kind`; `parentId` → reparent to `meshById.get(parentId) ?? scene`; TRS applied unless the object is the live play character; `_Wr` swaps primitive geometry to hi-poly when `max|scale| ≥ 24`. Name labels (humanoid/figure): canvas sprite, bold 32px sans-serif on `rgba(0,0,0,.55)` 64px-tall rounded rect, scale `w/64*.22`, y = `1.75+.25`; in planningAids. Camera/target meshes and spotlight lamps are planning aids (invisible in takes). Group delete re-parents children to scene (`TWr`).

### 2.8 `TOr` shadow fingerprint + `kOr/Bat` (corrections to the brief)
`TOr({sun, applyDaylight, light, bounds, roots, settingsOf})` returns a closure that: resets a `Float64Array(4096)` (grows ×2), fingerprints every mesh (id, visible, pos, quat, scale, castShadow/angle for spotlights, sun position, shadow extents) and **re-fits the sun shadow camera** only when the fingerprint changes (`AOr` bumps `shadowMap.needsUpdate`; `renderer.shadowMap.autoUpdate=false`). Fit: scene bounds focus + `spread90*1.15`; include humanoid/figure boxes (`fOr`) expanded `pOr=4`; extent `w = min(uOr(.163)*mapSize/2, max(30, ceil(v/16)*16))`; ortho `[-w,w]²`, near `.1`, far `S+w+max(0,(focus.y+w)/sunDir.y)`, bias `-0.005/(far-near)`, normalBias `min(.3, 1.5*2w/mapSize*min(6.67, 1/sunDir.y))`. **`kOr(v, dir, step)`/`Bat(v, axis, step)` snap the shadow-camera centre onto a grid of `step = 2w/mapSize` in the plane ⟂ sun** — anti-shimmer, *not* object drag snapping. (No object grid-snap exists in this build; gizmo `translationSnap` is never set.)
- Sun: `M8r(light)` dir = `az → rad`; elevation remap `el > −8 ? max(el, 5°) : 25−el` (light geometry stays above horizon); `wOr` builds HemisphereLight fill + DirectionalLight sun (shadow map `min(3072, maxTextureSize)`², radius 2) + sky dome `xOr` (vertex `xyww` far-plane trick) + `FogExp2(0xffffff, 0)` + floor `PlaneGeometry(80000², 128²)` `0xd4d4d9`, roughness .9, polygonOffset 4/4, receiveShadow — floor `raycast` overridden to a **segment-free PlaneGeometry proxy** with hits relabelled to the floor (fast floor picking).
- Daylight `applyDaylight(light)` (`$Fr(elevation)` interpolates `HY` stops at −30/−16/−8/−2/5/16/32° + `DFr` full-day: zenith `0xdfdcf0`, horizon `0xe8b890`, fillSky `0xe7c39b`, fillGround `0xd0d1d2`, fill 1.7, sunColor `0xffd69e`, sun 2.15): sets hemi colors/intensity, sun color/intensity, fog color=horizon, sky uniforms (zenith/horizon/flare=sunColor×flare), flare dir; returns **glow** (nightLights===false → 0). Sky fragment: `mix(horizon, zenith, pow(max(dir.y,0), .55)) + flare*pow(max(dot(dir,flareDir),0),7)*smoothstep(0,.06,height)`.
- Spotlight per-frame (`oOr.tick`): `Rhe(scale)` beam half-angle; shadow-budgeted first `e6r(gpu)=min((maxTextures−4)/2, maxVaryings−8)` spotlights get shadows (cookie `iOr(shape, diffusion)` 128² 10-step profile, angle `atan(tan(m)/nre)` with `nre=1/(√2·1.06)`, penumbra 0) others no-shadow (penumbra `.05+.9·diffusion`); intensity `setting.intensity × 2.4`; lamp scaled `1/scale`; beam cone mesh (`jat=7` long, round=40-seg cone / square=4-seg rotated 45°, radius `7·tan(m)·(√2 if square)`, opacity `.02+.07·intensity/100·(1−diffusion/2)`, additive) in planningAids.

---

## 3. Path editing UX (P2)

### 3.1 Store actions (class `rDr`-adjacent store, `§19`)
- `addPathItem(trackId, atS)` → item `{kind:"path", anchors:[], speedUnitsPerS:Htt(1.4), gait:JCe("walk") (humanoid only), startS}` then `enterPathEdit` + `seedPathStart` (anchor at object's world position).
- `enterPathEdit(trackId, itemId)`: `selectedSegment={trackId,itemId}`, `performancePaint={trackId,itemId,selectedAnchor:null}`, `editInteraction="editingPath"`.
- `anchorPosFor(pos, idx)`: **flown paths (cameras, `!el(kind)`) keep the existing anchor's Y** (or object base Y) — walking paths take the raycast Y directly.
- `appendPathAnchor(pos)` / `insertPathAnchor(segmentIndex, pos)` (splice after index) → both rebuild anchors through `mT(points)` (Catmull-Rom tangent builder: `in/out` per anchor) and `selectPathAnchor(new index)`.
- `movePathAnchor(i, pos)` → `{...a, pos: anchorPosFor(...)}`.
- `setPathAnchorHeight(i, h)` (flown only) → sets `pos[1]`.
- `movePathHandle(i, handle, vec, {break})` → sets `[i][handle]=vec`, mirrors opposite (`in↔out`, negated) **unless break (Alt)**.
- `deletePathAnchor(i)` → filter + rebuild via `mT`, deselect.
- `finishPerformancePaint()` → clears paint, editInteraction→idle; **<2 anchors ⇒ removePerformanceItem**.
- `setPathHeightCurve(trackId, itemId, curve)` — cam-path heightCurve; points `{u, heightM, in:[2], out:[2], auto:true}` (`rre`), `Yhe` auto-tangents = `∓(Δu)/3`; `Kat(v)=round(v,0.1) clamp 0.2..maxM`.
- `replaceMoveFromSamples` — "Play" samples → path conversion (`vHr` simplifier; steady ⇒ even speed `YZt`, else arc/speed + pace).
- `setCameraFocus/setWalkerFocus` — aim subject wiring (adds/replaces `cam-still` with `subjectId`, or sets cam-path `aim:"subject"`).

### 3.2 Viewport visuals (`UGr.y()`, `§16`)
Built per show-change for the **painted item** (`performancePaint.itemId`) **or the selected path segment**:
- anchors: `SphereGeometry(0.09, 12, 8)` at `pos + y0.02`; selected anchor radius ×1.4 and white (`NGr=0xffffff`) vs curve color `Not=0xaa55ff` (violet); `userData.pathAnchorIndex` → pickable (only while painting).
- **anchor number sprites** (canvas, bold 40px, scale .35) at `+0.35` above each anchor.
- **height handle** (flown paths only, when selected or `pos.y > FGr(.25)`): vertical line ground→anchor (`LineBasicMaterial` `Rot=0xffcc55` amber), sphere r `.075` at `y = IOr(h) = 0.3 + h·0.55` (**compressed ladder**: handle sits lower than the anchor; inverse `MOr(y)=max(0,(y−.3)/.55)` on drag), `userData.pathHeightAnchor` → pickable.
- **tangent handles** (selected anchor only): line anchor→`pos+handle` (`Pot=0x66ddff` sky blue) + sphere r `PGr(.06)` at handle tip, `userData.pathHandle="in"|"out"`, `pathHandleAnchor=idx` → pickable.
- **curve**: `BufferGeometry.setFromPoints(Q2r(item))` polyline (+y.02, color `Not=0xaa55ff`). `Q2r` = `nx(anchors)` base points; cam-path with heightCurve → 64 samples (`Btt`) with height resampled from the curve (heightCurve **replaces** point Ys).
- The path group + all camera/target meshes are pushed into `planningAids`.

### 3.3 Drag interaction (`pWr` `Hn/Gr/zn`, `§20`)
- pointerdown (capture phase) raycasts `pathEditPickables`: `pathHandle` → handle drag; `pathHeightAnchor` → height drag; `pathAnchorIndex` → anchor drag. Disables orbit, captures pointer.
- anchor: raycast `walkableSurfaces()` → `movePathAnchor(i, hit.point)` (walkable = floor + non-camera/target/spotlight/humanoid/figure/group meshes — `Dqr.walkableSurfaces`).
- height: plane ⟂ (camera→anchor, y-flattened) through anchor → `setPathAnchorHeight(i, MOr(hit.y))`.
- handle: plane `normal=(0,1,0), constant=−pos.y` → `movePathHandle(i, handle, [hit.x−pos.x, 0, hit.z−pos.z], {break: altKey})` (handles are XZ-only).
- click-without-move on anchor/height → `selectPathAnchor(i)` (shows tangent handles).
- **floor clicks while editingPath** (editInteraction ≠ idle): nearest segment `j2r(anchors, p)` (2D XZ point-segment distance); `< Qzr(0.4m)` → `insertPathAnchor(segIdx, p)` else `appendPathAnchor(p)`. Esc/Enter/Done finishes.
- The **plan canvas** also draws paths and supports "Draw direction" (stroke drawing → path), see §7.

\* colors (verified hex): `Not=0xaa55ff` path/anchor violet, `Pot=0x66ddff` tangent handles, `Rot=0xffcc55` height handles, `NGr=0xffffff` selected anchor, `yqr=0x44aaff`/`vqr=0xffcc44` rig joints, `YFr=0xffe3a3` beam, `nOr=0x2c2d30` lamp, `Aat=0xff8a54` dusk sun, `D8r=0x44ddaa`/`B8r=0xdd4466` camera/target spawn dyes.

---

## 4. Camera footer controls (Height / Lens)

**Scene-node panel footer** (`hOa`, `§23`) — DOM-verified:
- **Height**: `range min=0.2 max=heightMaxM step=0.1`, value = `selectedCamera.heightM` (label `"{h} m"`). `heightMaxM` = max(4 (`MZt`), tallest non-camera-object top `VDe`) → if scene spread > `WLr` use 12 (`GLr`), clamp ≤ 50 (`ZLr`), `+4` slack, ceil. `heightM` = `flownHeightM` — for a camera driven by items at the playhead, the **evaluated cam-path height** (rounded 0.1 via `Sje`), else its stored Y. Commit: `setCameraHeight` → `commitOne(pose, position:[x, Kat(v), z], "translate")` (gesture begin/end).
- **Lens**: `range min=0 max=Gze(1000) value=GFa(lensMm, [14,200])`; onChange `WFa(v, [14,200]) = round(exp(ln14 + ln(200/14)·v/1000))` — **log interpolation**, DOM-verified 311 → 32 mm. Steps `yT=[14,18,24,35,50,85,135,200]`; default `Hv=50`. Commit `setLens(id, mm)` → plan-store op `{type:"lens", id, focalLengthMm}`.
- Both hidden (`aria-hidden`) when no single camera selected.
- **Editor camera vs record camera**: in edit mode the editor camera keeps `fov=OP(50)`; switching to **camera mode** (`applyCameraModeFov c()`) makes the editor camera adopt the record framing: `fov = 2·atan(fovScale·(35/max(aspect,1))/2/focalLengthMm)°` where `fovScale` comes from the record framing (§5). Mode change also saves/restores the orbit pose, engages the pilot object, `captureSpawnPose`, pointer-lock on click; `updateFrameGuide()` shows the letterbox div.
- **Stage page header** has Rehearse (togglePreview → playback through editor camera) + Record (hub record of every camera) instead of the footer; the PIP window shows the focused/locked camera feed.

---

## 5. Time-of-day UI (Light)

`TQr/AQr` (`§24`): "Light" button (sun icon) in the stage header → popover (`hudWindow`):
- **Sun puck** (`role="slider"`, `aria-valuemin=-30 (fq)`, `aria-valuemax=90 (QA)`, `aria-valuenow=round(elevation)`, `aria-valuetext` = phase label): a circular disc where **centre = zenith (90°), rim = −30°**; knob position `R8r(light, viewYaw) = {sin((az−viewYaw)·rad)·r, −cos(...)·r}` with `r=(90−el)/(90−(−30))` — the "up" of the widget always faces the current view yaw. Drag (pointer capture) → `irt(pos, viewYaw)`: `r=min(1,hypot)`, `az = atan2(x,−y)° + viewYaw`, `el = 90 − r·120`. Knob glides between presets (CSS transition, `knobGliding` until transitionend).
- Arrow keys: azimuth ±`olt(10°)`, elevation ±`llt(5°)` (`wQr`); knob inset `$ye=8px`.
- **Presets** (elevation buttons, pressed when |Δ|<0.5): default `kDe` 128.66°/57.38° ("Midday"), `E8r=9°` (golden hour), `j8r=−4°` (dusk), `I8r=−28°` (night). Phase labels `kQr`: ≥32 Midday · ≥12 · ≥0 · ≥−8 · ≥−20 · else night.
- **Night lights toggle** — only rendered when some object "has night lights": `eKt(obj)` = kind in a spotlight-adjacent set AND name matches the lamp-name regexes (window/lamp/lantern/candle/moon — see help text). Sets `light.nightLights` (default true; `nightLights===false` → glow 0).
- Commit: `adjustLight(light)` (=`cameraStore.setLight`) wrapped in `beginEditGesture/endEditGesture` (undoable).
- Elevation −30..90 (`c8r` clamp); azimuth `((x%360)+360)%360`.

---

## 6. Record framing / aspect guides

- Aspect table `Zae` (accessor `Am(key)`, fallback first): `16:9` 1920×1080 · `9:16` 1080×1920 · `1:1` 1080×1080 · `4:3` 1440×1080 · `1.85:1` 1920×1038 · `2.39:1` 1920×804. Sensor model: `Mtt(a)=35·min(a,1)` (narrow dim), `XCe(a)=35/max(a,1)` (vertical dim); vfov `Z_(f, a)=2·atan(XCe(a)/2/f)°`.
- **Framing math `XGt({viewportAspect, viewportHeightPx, recordAspect})`**: `maxHeightFraction = (viewportHeightPx − 2·KGt(96px chrome))/viewportHeightPx` (≥0 else 1); then `o2r`:
  ```
  e = Mtt(record)/Mtt(viewport)   // relative width
  n = XCe(record)/XCe(viewport)   // relative height
  r = max(1, e, n/maxHeightFraction)   // fovScale
  → {widthFraction: e/r, heightFraction: n/r, fovScale: r}
  ```
  Interpretation: the record frame **fits inside** the viewport unless its height would exceed the chrome-adjusted max, in which case it scales up (fovScale>1 — the frame extends past the viewport sides and the editor camera fov widens to match, so what you see inside the guide is exactly what gets filmed).
- **Overlay `MGr(container)`**: absolute div, `border:1px solid rgba(255,255,255,.4)`, `box-shadow:0 0 0 9999px rgba(0,0,0,.4)` (letterbox darkening), `pointer-events:none`, zIndex 1; `show({left,top,width,height})` in fractions ×100%. Only in **camera mode**; recomputed on focalLength/recordAspect/mode change and resize (`S()`: `camera.aspect = clientW/clientH`; in camera mode `c()` re-derives fov).
- Camera **marker** visuals (`v()`): flown cameras (item active at playhead with aim) → look at resolved aim (`LOr`), distance ≥ `LGr(.6)`; else frustum marker `urt(mesh, {fovDeg:BU(store)=Z_(focal, recordAspect), aspect, distance:DGr(3)})` updating the "camera-frustum" sub-object (wireframe quad at −distance, halfWidth=tan(fov/2)·distance·aspect). New cameras with an aim target auto-lookAt once (`w()`). Target markers visible only when selected/focused or their camera is aim-driven (`uZt`).
- **Recording pipeline** (`mqr`, `§26`): per-take offscreen `WebGLRenderer` (antialias, pixelRatio 1, own `pZt` near/far fitter, optional finish composer, deterministic clock `fqr=1000/24` for offline) + capture canvas at **full recordAspect resolution**; `renderFrame()` = aim(camera) (editor cam pose in camera mode, else item evaluation `dZt`) → fitPlanes → render → 2d drawImage; `MediaRecorder(canvas.captureStream(60))` mime `avc1→mp4→vp9→webm` (list `iqr`), 12 Mbps (`lqr`); stop → `{videoBlob, videoMimeType, width, height, durationS, framesRendered}`. Hub records N cameras (sessions start when `performanceTimeS ≥ camera track startS`, `rollingCameraIds` published); offline path re-renders deterministically at `Qne=24fps` through mediabunny MP4 encoder (`avc`, Quality high preferBitrate, keyframe interval 2). PIP feeds (`attachFeed`) render per-frame at host size, with special "plan" (reveal hidden cameras) and "selection" (footprints + stroke) aim modes. Screenshots: `captureViewport` ≤768px PNG; `captureCamera(id, fullRes)` 768 or full res.
- Shake (`tickShake/restoreShake`): editor camera pose saved/restored around the shake pose (`Dzt({t, intensity})` presets `$br` subtle/medium/heavy, `"stride"` from ground speed `oEr`), plus `nLr` pitch clamp ±60°.

---

## 7. 2D plan canvas (stage-plan)

**View model** (`§31`): `{view: {centerX, centerZ (m), pxPerM (default Uhe=34), widthPx, heightPx}, drag, fitted}`. Fit = union of footprints + `TLr=48px` margin; zoom `fqt(view, anchorPx, factor≥0.1×)`; pan `UDe`; wheel → ctrl/⌘ = zoom else pan; middle/right drag = pan; zoom % = `pxPerM/34·100` (drives the "100%" zoom-to-fit button); `centerOn(id)` eased 320 ms (cubic-out).
**Items** (`§22 items()`): `{id, kind, parentId, footprint: Dst(obj, shownPose) = {x, z, yawRad, halfWidthM, halfDepthM, shape:"rect"|"ellipse"}, label, groupLabel, headYawRad (figures), pool: {…, square} (spotlights), wedge (cameras: fovDeg from focal, aim, view cone)}`; `shownPose` prefers the 3D runtime's live pose (playback/preview) so the plan mirrors the show.
**Painter `SDr`** (`§32`): background → **grid** (1 m lines fading in as `pxPerM` passes 8→24; 5 m major lines) → pools (spotlight light pools) → non-character items → **selected paths** (only selected paths draw, `CDr`; dimmed if `dimPathOf`) + in-progress stroke (accent 2.4 px) → characters/cameras/targets/spotlights → group boxes (dashed 4-3, +8px pad, label 11px below) → focus overlay → single-selection callout (`PDr`) → marquee (accentSoft fill + dashed). Palette from CSS vars `--plan-*` (background, grid, grid-major, human, camera, object, light, prop, prop-edge, accent, accent-soft, panel, text, text-dim).
**Interaction** (pointer state machine `DLr`/`DZt`/`BLr`/`HLr`, `§30/§31`): hit test = topmost footprint containing point (rotated rect/ellipse; groups promote like `JEe`; ⌘/Ctrl cycles child within group; Shift toggles multi); selected **camera** drags its **rotate wedge handle** or **lens handle** (`kLr`, handles from `zDe(footprint, view, wedgeHalfRad)`, hit radius `cqt(6)+yLr(2)`px); drag moves emit move intents with anchor; empty drag = marquee (`_Lr` rect∩bbox select); **drawing mode** ("Draw direction" pill): pencil cursor; pointer over another object = "tap-or-draw" (tap focuses it), else **stroke-start/move intents** in world coords (`S1(view, px)`) → builds a path for the selected camera/character; Esc steps back (undo last stroke segment); drop **components** from the palette at cursor (`onComponentDrop(S1(view, px))`).
**Cam-path height curve editor** (scene node): when a cam-path item is selected, a height-vs-u curve editor appears (`heightMove`; press line adds point, drag point/handle with Alt break, `Kat` rounding, scrubbing seeks the playhead `startS+u·durationS`, release commits `setPathHeightCurve`; "drawn" curves update, hand-made ones replace).
**Footer "Camera pills"** list the cameras (swatch color, `aria-pressed` = focused).

---

## 8. Timeline UI

- **Scaffold `VAr`**: horizontal scroller with sticky header+ruler; **zoom** = ctrl/⌘+wheel on the scroller (`pps ×= exp(−deltaY·0.005)`, fine `0.02` when |Δ|<10), anchored at cursor, min `60px/s`, default fit; `navTrack` minimap thumb (drag = scroll, edges = zoom that side, min thumb 2%). Ruler ticks: step from `[.5,1,2,5,10,15,30,60]`s so that `step·pps ≥ 80px`; label `m:ss`; **click/drag ruler seeks** (clamped 0..span, span = max end + 5s pad). Playhead: absolute `left=px` line + badge `0.00`/`m:ss.00` (`--playhead-x` var).
- **Tracks**: sidebar header per track (name or "Human", selected states, Remove track, double-click focuses object), `Add track` button → dropdown of animatable objects with search. Lanes `data-track-id`.
- **Blocks**: color class by kind (human/object/camera/painting/selected); label per kind (Still, Orbit/…, Walk, clip names, Grow/Shrink, Revolve, Transform, Rig Transform, Play…); min width 3px; **trim handle** right edge: `clip` → duration (min .1s), path/cam-path → recomputes `speedUnitsPerS = arcLength/duration` (`MR(nx(anchors))/dur`), generic → duration (min .05s); **drag block** = move with **magnet snapping** (radius `Kne=12px`→s, markers = every other item's start/end, obstacles pushed after, snapGuide lines drawn); **reorder** within track when overlapping (ghost preview of shifted items); **alt-drag = duplicate** to another track (ghost block + caret, lane highlights as duplicate target); drop **action tiles** from the Actions window onto lanes at snapped start (`n3r(action)` default durations: clip 5s, transform/rig 4s, camera preset durations, path/manual derived).
- **Path painting row** (`editRow`) with **Finish** button while editingPath; `laneAdd` ("Add action") sits at the end of the last item.
- **Take-range tool** (`xTr`, "Take range: what Record films"): drag on the ruler to set `show.range` (from/to), locked during recording; Record films the range or whole show.
- **Segment inspector** (below/beside timeline when a block is selected, `§29`): per kind —
  - `path`: Gait select (`Gzt` walk_formal/walk/jog_fwd/sprint, humanoid only), Aim select (travel/locked/subject→object), Speed number (step .1, min `Mit=.2`), **Edit path** button (enters viewport path paint).
  - `clip`: Clip select (46-clip catalog minus a_tpose), Duration (step .1, min .1).
  - `play`: "Play again" (gamepad) button, duration/"Not recorded yet", 6 keymap slots (lmb,rmb,q,e,r,f) each bindable to a clip.
  - `rotate`: axis X/Y/Z segmented (+deg/s), `revolve`: centre object + deg/s, `scale`: factor, `transform`/`rig-transform`: keyframe editors (position/rotation vectors per key; rig = joint poses).
  - `cam-move`: preset select (orbit/dolly_in/dolly_out/dolly_zoom/crane_up/crane_down/spiral/pan_sweep), direction ccw/cw segmented, angle, heightDelta (step .5, .5–20, crane/spiral only), distanceScale % (10–400 step 10, dollies only), duration (step .5 min .1), dolly_zoom focal (14–200 step 1).
  - `cam-still`: duration, subject select, vertical aim deg; `cam-follow`: object select; `cam-path`: aim (travel/locked/subject), aimOffsetUnits, speed (step .1 min .2), Edit path; `cam-transform`: per-key position/rotation/focal.
  - Aim/subject selects list eligible objects (`$` props = object options).

---

## 9. Object kinds & add palette
11 kinds (`group, cube, sphere, cylinder, simple_figure, humanoid, camera, target, spotlight, prop`) — same as audit §1.3. UI add paths: components column (Add Component tab: Human, Figure, Camera, primitives, props catalog), Actions-window tiles dragged onto objects, plan-canvas drops, chat tools (`stage_object create`), scene tabs (duplicate scene). Colors: object `color` field (chat-settable); default `pq=#e2e0dc` (figures `Phe`).

## 10. Keyboard shortcuts — see §2.4 table (complete).

## 11. Stage store / runtime wiring (summary)

- **Runtime root `uZr(pageStore)`** (`§1`): `COr` env (canvas `.ph-viewport-capture`, renderer antialias dpr≤2, `shadowMap PCFSoft`, scene, editor camera `fov 50, near .1, far 500`, start `(6,5,8)` lookAt origin; `meshById` Map; `planningAids` array of generators; `pathEditPickables`/`rigJointPickables` arrays; `disposers`) → `Dqr` orbit env → subsystems in order: `AWr` mesh/rig sync, `xqr` rig handles, `pZt` bounds (recompute every `_Fr=400ms`; fog density `.715/max(120, 1.5·spread, 3·dist)`; far `min(2e4, max(sceneRadius·1.25+dist, 2.5/fogDensity))`; near `clamp(far/500, .1..nearest·.5)`), `TOr` shadow fingerprint, `oOr` spotlights, `AOr` shadow redraw, `Jqr` frame stats (250-frame p50/p95), `hKt` finish composer (+`Dje` capability probe, `Xqr` auto-measure), `UGr` camera markers/frame guide, `FUr` phone aim, `YUr` focus, `pWr` manipulation, `CGr` hover, `pGr` selection, `BUr/VUr/CWr` dnd + onboarding, `aqr` live play, `jGr` playback evaluator, `mqr` record, `JUr` manual-flight recorder (20 Hz), `lZr` nav ball.
- **Frame loop**: rig tick → handles → playback → drawPreview → manipulation → nav → env → liveplay → markers → bounds → spotlights → shadow redraw → onboarding → record preview → **livePose publish** (`shownPose`: selected object's world TRS → store, `+fovDeg` for cameras, `+headRotation` for figures) → nav ball render (only when plan hidden & page live; when `planShown` only `updateMatrixWorld` — the 3D render pauses on the 2D plan view) → record shake → takes → selection tick.
- **Store layers**: base object store `iMr` (objects/selection/transformMode/clipboard/spawn), show store (tracks/items/undo via `apply`-ops and `beginEditGesture/endEditGesture`), page store `oKr` (mode edit|camera|review, controlMode default|unreal, recordAspect, focalLengthMm, cameraRig/cameraSpeedMps/cameraPanDegPerS (steps `.3..50` m/s / `5..90°/s`), playSession, performancePaint/TimeS/SeekS, lassoRect, navBallVector, keyboard owner), plan/scene-node store `rDr` (plan intents, footer camera, height curve), runtime facade passing ~60 methods into `uZr`.
- **Undo/redo**: `undo()/redo()` on the page store (⌘Z/⇧⌘Z/⌿Y); gesture bracketing (`beginEditGesture/endEditGesture`) groups drags/slider moves; camera drags that hit items become item keys (`captureFocusedCameraPose`), objects on transforms become keyframes (`captureFocusedTransformPose`), rig poses via `captureFocusedRigPose`.
- **livePose ↔ playback**: while previewing/seeking, `jGr` evaluates track items per frame (path arc position with ground raycast unless exactY, play samples, transform/rotate/scale/revolve folding, cam-item evaluation for camera meshes, head-look `xM` with 70°/35° head limits and DEF-neck 40%/DEF-head 60% split, rig-transform offsets) and writes meshes; when stopped, meshes reset to stored TRS (`ye`).

## 12. i18n note
All UI strings are i18n ids (`_._({id:"…"})`); the human-readable labels cited here come from the saved DOM snapshots (en). Ids relevant for reimplementation are preserved inline in `ux_raw.js`.

## 13. Unsolved / low-confidence
1. **`QXr`** (edit-toolbar anchor placement from `selectionScreenBounds`) — usage seen, body not extracted (clamps toolbar inside viewport; reconstructable).
2. Plan painter details for `jDr` (per-kind item glyph drawing: human figure path, camera wedge geometry constants `oDr/lDr` point arrays, spotlight pool gradient) — raw code captured in `plan_painter.js` but not fully annotated; the palette + geometry tables are there.
3. `dZt` (cam-item evaluator producing position/quaternion/fovDeg at time) — the big shared evaluator used by playback, record, framing; body not excerpted (it's the same math as the offline editor's cam presets; audit §1.4 documents the item params it consumes).
4. Take **save targets** ('canvas' vs 'review' flows) and thumbnail upload — service-layer, outside this bundle section.
5. `Zqt`/`YWt`/`u5r`/`eat`/`Wqt` simple_figure/target/placeholder/procedural-prop mesh builders — not excerpted (procedural geometry; sizes recoverable from live DOM/GLB assets).
6. Exact RGB of `Not/Pot/Rot` path-edit colors — decimal ints extracted (`11163135/6741503/16763989`); hex conversions left as-is to avoid transcription error.
