# AUDIT 2-c — Environment · Figures · UI shell (env.js / figures.js / ui.js / main.js / const.js)

**Repo**: `/home/z/flick-3dEditor` (audit only — no files modified except this report)
**Ground truth**: `analysis/index-DBE17t4T.js` (13,457,064 B, live minified bundle) + raw dumps in `analysis/tmp_b/` (`env_wOr.js`, `env_daylight.js`, `env_Dqr.js`, `viewport_ctor.js`, `timeline_ui_pretty.js`, `segment_inspector_pretty.js`, `light_ui.js`, `keyboard_Hzr.js`, `palette.js`, `inspector_dom.html`) + `analysis/extracted/` (`humanoid_raw.js`, `p1_daylight_renderer.js`) + `analysis/ENVIRONMENT.md`, `HUMANOID.md`, `EDITOR_UX.md`, `DOM_REFERENCE.md`.
**Method**: line-by-line comparison of the reconstruction against the de-minified bundle regions; every numeric claim below re-verified against the bundle with targeted python/grep extraction. Daylight math independently re-implemented in python.

**Severity scale**: P0 = core feature broken / data-corrupting · P1 = clearly wrong runtime behavior vs original in common flows · P2 = missing feature / coarse approximation with user-visible effect · P3 = cosmetic / minor.

---

## 0. Checkpoint verification (requested spot checks)

| Check | Result |
|---|---|
| elevation **−28** → sun intensity **0.5143**, hemi **0.5429** | ✅ EXACT (python re-impl of HY lerp: sun=0.5143, fill=0.5429) |
| elevation **57.38** (default `kDe`) → zenith **#dfe5f0**, sun **2.15**, hemi **1.7** | ✅ EXACT (57.38 > last stop 32° ⇒ clamps to `DFr`: #DFE5F0 / 2.15 / 1.7; sun azimuth 128.66° → dir [0.4209, 0.8423, 0.3368]) |
| Lens slider **311 → 32 mm** (log interp) | ✅ EXACT (`v = 1000·ln(f/14)/ln(200/14)`; 311 → 32 mm) |
| sRGB↔linear color management in `$Fr` | ✅ EXACT — both bundle (`HFr = new hr(t).lerp(BFr.set(e), n)`) and reconstruction (`new THREE.Color(a).lerp(_cb.set(b), t)`) interpolate in linear working space (three r182, `ColorManagement` on, `Color(number)`→`setHex`→sRGB→linear) |
| Original **normalBias** formula (task: "find the exact") | **`C = min(bOr .3, mOr 1.5 · 2w/mapSize.x · min(gOr 1/.15, 1/dir.y))`** — from `TOr` in `tmp_b/env_wOr.js` (`Math.min(bOr,mOr*2*w/e.shadow.mapSize.x*Math.min(gOr,1/n.y))`). Reconstruction `env.js:310` matches **EXACTLY**. |
| Shadow bias | `-.005/(far-Lat .1)` ✅ EXACT |
| HY 7-stop decimals + DFr spread | ✅ byte-exact vs `tmp_b/env_daylight.js` |
| Sun elevation remap | `el > −8 ? max(el, 5) : 25 − el` (`GWt/A8r/C8r`) ✅ EXACT |
| Fog color = horizon | ✅ EXACT (`r.color.copy(g.horizon)` on the FogExp2) |

---

## 1. Divergence table

Status: **EXACT** (behaviorally identical, verified) · **NEAR** (functionally equivalent, minor deviation) · **DIVERGENT** · **MISSING**.

### 1.1 env.js

| module.function | original (name, source) | status | details |
|---|---|---|---|
| env.daylightAt | `$Fr` @~5,434,400 (`tmp_b/env_daylight.js`) | **EXACT** | Segment search `n<len-1 && t>HY[n+1].elev` with end-clamp; colors via `Color.lerp` (linear working space), scalars linear. HY decimals byte-exact. |
| env.normalizeLight | `SDe` (ENVIRONMENT.md §sun) | **EXACT** | az `((x%360)+360)%360`, el clamp −30…90, keep `nightLights===false` only. |
| env.sunDirection | `M8r` | **EXACT** | `[sin az·cos el, sin el, −cos az·cos el]`, `el>−8?max(el,5):25−el`. |
| env.makeSkyDome | `xOr` (`tmp_b/env_wOr.js`) | **EXACT** | `SphereGeometry(1,32,16)`; `side:BackSide($p=1), depthTest/depthWrite false, fog:false`; GLSL **verbatim** incl. `gl_Position=clip.xyww`, `pow(height,0.55)` mix, flare `pow(·,7)*smoothstep(0,0.06,·)`, `#include <colorspace_fragment>`; `frustumCulled=false, renderOrder=−1, raycast=noop`; uniforms set match. |
| env.createEnvironment (sky/fog/hemi/sun) | `wOr` | **EXACT** | `FogExp2(0xffffff,0)`; `HemisphereLight`; sun `castShadow`, `mapSize=min(3072,maxTextureSize)`², `radius=2`; adds `sun,sun.target`. |
| env.createEnvironment (floor) | `wOr` floor | **DIVERGENT (P2)** | Reconstruction `polygonOffsetFactor:-1, units:4` (followed the *uncertain* annotation in ENVIRONMENT.md L82). Raw bundle (`env_wOr.js`): **`polygonOffsetFactor:4, polygonOffsetUnits:4`**. Sign flipped ⇒ floor offset toward camera instead of away. Rest EXACT: `PlaneGeometry(80000²,128²)`, color 13948377 (0xD4D5D9), roughness .9, `rotation.x=−π/2`, `receiveShadow`, segment-free raycast proxy with hit relabelling. |
| env.createEnvironment.applyDaylight | `wOr.applyDaylight` | **EXACT** | Memo on (az,el); `glowAmount()` closure honoring `nightLights===false`; hemi color/groundColor/intensity, sun color/intensity, fog=horizon, sky uniforms incl. `flare=sunColor×flare`, `flareDirection` with `el=max(el,0)`; returns glow. |
| env.createEnvironment.walkableSurfaces | `Dqr.d` (`tmp_b/env_Dqr.js`) | **EXACT** | floor + meshes whose kind ∉ {camera,target,spotlight,humanoid,simple_figure,group}. |
| env.diffusionCookie | `iOr` (`tmp_b/env_daylight.js`) | **EXACT** | 128² RGBA, 10 steps, radius `.45·nre`, `nre=1/(√2·1.06)`, square=Chebyshev/round=radial, smoothstep falloff `1−k²(3−2k)`, Nearest filters, cache key `shape:step`. (Consumer side in objects.js diverges — see §1.5 note.) |
| env.computeBounds | `vje` + `OFr`/`sye` (bundle, verified in-place) | **EXACT** | `!parent` skip, empty-box skip, union, boxes exclude {camera,target,group} (`jFr`), bounding sphere + finite guard, per-axis **median** focus, spread90/95 = pct of **XZ** distance `a[min(len−1, floor(len·p))]`. |
| env.createFogNearFar.fogDensity | `FFr` | **EXACT** | `.715/max(120, 1.5r, 3n)`, `r = n + spread95`, `n = dist(cam,focus) ‖ cam.length()`. |
| env.createFogNearFar.farFrom | `SFr` (+`AFr` fallback) | **EXACT** | `min(2e4, max(500, (max(0,dist)+max(0,radius))·1.25))`; non-finite → 500. |
| env.createFogNearFar.nearFrom | `CFr` | **EXACT** | `max(.1, min(far/5000, minBoxDist·.5))` (`kFr=RP/Khe=5000`). |
| env.createFogNearFar.tick | `pZt` | **EXACT** | 400 ms bounds recompute (`_Fr`), FogExp2 density set, far `min(2e4, max(SFr‖500, 2.5/density))`, near via min box distance, update only on 1.1× hysteresis (`Sat`), `fitNow`. |
| env.createShadowFit (fit math) | `TOr` fit body (`tmp_b/env_wOr.js`) | **EXACT** | `spread90×1.15`; casterBox = humanoid+simple_figure (`fOr`) with `parent`, `expandByScalar(4)`; `texelWorld=.163·mapSize/2`; reach≤texelWorld→`v=max(v,reach)` else `focus=sph.center, v=radius`; `w=min(texelWorld, max(30, ceil(v/16)·16))`; `kOr/Bat` texel snap `2w/mapSize` in plane ⟂ sun; `S=2w`; `far=S+w+max(0,(focus.y+w)/dir.y)`; bias/normalBias per §0; guard `(right!==w ‖ far!==T ‖ normalBias!==C)`; target/position updates. |
| env.createShadowFit (fingerprint) | `TOr` walk/f | **DIVERGENT (P1)** | Original fingerprints **id, visible, position, quaternion(x,y,z,w), scale** per object; spotlights additionally castShadow+angle; **skips kinds {camera,target} (`SOr`) and Sprites (`lie`)**; appends `sun.position, w, far` at the end. Reconstruction fingerprints only id/visible/position, does not skip camera/target/Sprite, no quat/scale/sun/w/far. Consequence: **rotate- or scale-only edits never dirty the fingerprint** ⇒ with `shadowMap.autoUpdate=false` the shadow map and camera fit go stale until something else changes. |
| env.createShadowFit.tick | `TOr` closure + `AOr` | **DIVERGENT (P2)** | Original runs the full fingerprint+fit **every frame** (AOr only bumps `shadowMap.needsUpdate` per renderer when changed, with `webglcontextrestored` handling + WeakMap). Reconstruction fits **only when dirty**. Mostly masked by the memoized inputs, but combined with the P1 above stale fits persist. Context-restore handling missing (P3). |

### 1.2 figures.js

| module.function | original (name, source) | status | details |
|---|---|---|---|
| figures.buildSimpleFigure | `Zqt` @5,362,090 (HUMANOID.md §2.2) | **EXACT** | Body `BoxGeometry(PP)` translate(0,H/2,0); band `PlaneGeometry(W, c−l)` `rotateY(π)` @ y=(l+c)/2, z=−D/2−.002; head group @ `OIr` + `SphereGeometry(Nie,32,16)` (fill); visor `SphereGeometry(Nie+.002, 32, 4, 3π/2−Pie, 2·Pie, π/2−f, f−h)` (mark); `roughness 1` both materials; `userData.figure={fill,mark,head}`. Derived consts exact (head top = 1.750000 m). Extra `castShadow/receiveShadow` traverse is redundant (shadowFit.walk sets the same) — harmless. |
| figures.figureMarkColor | `aqt` | **EXACT** | `(.2126r+.7152g+.0722b)/255 > .72 ? #1c0f09 : #ffffff`; default `#f29a5c` luma .6597 → white mark. |
| figures.setFigureColor | `Kqt` | **EXACT** | fill `?? Phe`; mark = contrast of `#${fill.getHexString()}`. |
| figures.getHeadRotation / applyHeadRotation | `nat` / `o$` | **EXACT** | Euler read/set on the head **group** (pivot = head center). |
| figures.makeLabelSprite | label sprite (AWr, HUMANOID.md §3.2) | **EXACT/NEAR** | bold 32px sans-serif, `rgba(0,0,0,.55)` pill, white text, scale `w/64·.22 × .22` (`Tot`), y = `1.75+.25` = 2.0 m (applied in objects.js, figures-only gate ✓), in planningAids ✓. Canvas width formula & roundRect radius not extracted from bundle (unknowable) — plausible. |
| figures.buildHumanoidPlaceholder | `u5r` | **EXACT** | torso capsule .18/.5 @1.15; head sphere .13 @1.62; arms .055/.55 @±.27; legs .07/.65 @±.10; orange, roughness 1. |
| figures.prepareHumanoid | `AWr.y` normalize pipeline | **NEAR** | scale `1.75/bind-bbox-height` (computed, not hardcoded ✓), XZ-centre, feet at min.y, `roughness=1` on every mesh, `M_Main→#f29a5c` (M_Joints untouched → GLB purple ✓), no extra yaw (GLB `Rig` bakes 180°, faces −Z ✓). Deviation: **clones materials** per humanoid (original `$he` mutates in place) and takes no `color`-override param (original `T(F, …color)`); color override handled by objects.js `_applyGlowAndColor` instead. |
| figures.poseHumanoidDefault | `$Nr` | **EXACT** | find "idle", `clipAction().play()`, `mixer.update(0)`. |
| figures.HumanoidRig (actions/crossfade) | `AWr.l/b` | **NEAR** | Lazily creates clip actions (original creates all upfront — same effect); crossfade: original `W.fadeOut(.25); O.reset().fadeIn(W?.25:0).play()` ≈ reconstruction `reset().play(); prev.crossFadeTo(action,.25)` ✓ `.25 s` (`Sot`) ✓; wall-clock wrap `timeS % dur` ✓. Missing `SWr` (`stopFading()` + `enabled = current`) — faded-out actions keep sampling (perf only, P3). |
| figures.HumanoidRig paused semantics | `AWr.b` | **DIVERGENT (P1)** | Original: playback override with `timeS≠null` → `action.paused=true, time=mod`; `object.animation` only → `paused = !playing`, `!playing → time=0`. Reconstruction **never sets `paused`** ⇒ at rest humanoids **continuously animate** (idle loop plays) instead of freezing at t=0; scrubbed clips advance one frame before being reset (correct after re-set, but rest state is wrong). |
| figures.HumanoidRig.applyRigOffsets | `aKt` (additive) | **DIVERGENT (P1)** | Original applies offsets **additively on top of the post-mixer pose**: `bone.position += j.position; bone.quaternion.multiply(euler); bone.scale *= j.scale`. Reconstruction reads the **construction-time bind-pose snapshot** (`b.quaternion.copy(cl.quat).multiply(e)`, `b.position.set(cl.pos+off)`) ⇒ **clobbers the clip animation** on every joint that has an offset (DEF-neck/DEF-head gaze, rig-transform keys) — e.g. idle head motion is replaced by bind pose + gaze. `restoreClipLocal` before `mixer.update` is correct; the apply step is not. |
| figures.headLookOffsets | `jZt` | **DIVERGENT (P1)** | Original: `rotation: EZt(headYaw·n, **−headPitch·n**)` where `EZt(yaw,pitch)` = XYZ-Euler equivalent of `Euler(pitch, yaw, 0, "YXZ")`. Reconstruction: `[pitch·n, yaw·n, 0]` — **pitch not negated** (humanoid gaze looks down when it should look up) and **no YXZ→XYZ conversion**. |
| figures (simple_figure headRotation eval) | `Kae`/`w2r`/`kje` | **DIVERGENT (P2)** | Original lerps keyed `headRotation` per axis (`bbe` shortest-angle) with recursive `from` chain; lookAt wins only when `a.sinceS >= s.startS`; `kje` = exact `EZt` conversion. Reconstruction (main.js `_figureHeadRotation`): nearest-key step value (no interpolation), lookAt always wins, `[pitch, yaw, 0]` without conversion. |

### 1.3 main.js (composition / frame loop / controls — finish/stroke excluded per task)

| module.function | original (name, source) | status | details |
|---|---|---|---|
| main.App ctor viewport | `COr` (`viewport_ctor.js`, bundle) | **EXACT** | canvas `.ph-viewport-capture`; `WebGLRenderer({canvas,antialias:true})`; `fZt` → `shadowMap.enabled=true, type=t$=1 (PCFShadowMap)`; dpr ≤ 2; `setSize(w,h,false)`; `PerspectiveCamera(50, w/h‖1, .1, 500)`; pos (6,5,8) lookAt origin; `shadowMap.autoUpdate=false` (set in `uZr` there, ctor here — equivalent). |
| main orbit setup + control modes | `Dqr` + `iat` remap | **EXACT** | target (0,1,0), damping, `rotateSpeed=.75` (`Lqr`), `enableZoom=false`, base `{LEFT:ROTATE,MIDDLE:PAN,RIGHT:null}`; default mode → `{LEFT:PAN,MIDDLE:PAN,RIGHT:ROTATE}` + `screenSpacePanning=false`; unreal → base + `screenSpacePanning=true`. (`touches.ONE` remap not ported — P3.) |
| main custom wheel zoom | `Vzr`/`xe` (`keyboard_Hzr.js`) | **NEAR** | zoom classification `ctrl ‖ deltaMode≠0 ‖ wheelDeltaY%120===0(‖ mouse)` ≈ reconstruction `ctrl ‖ deltaMode≠0 ‖ (|ΔY|≥50 && ΔY%120===0 && ΔX===0)`; zoom `pos·exp(ΔY·.0036)` clamped `[.5, AFr(radius)]` around orbit target ✓ (non-finite fallback 50 vs original **500** — P3); default-mode trackpad → orbit `2π·.75/clientHeight`, phi clamp .01 ✓; else pan `dist·.0016`/px ✓. |
| main Dqr anti-jitter zoom `m()` | `Dqr.m` (`env_Dqr.js`) | **MISSING (P1)** | Per-tick `pixelsPerUnitAtTarget=(bufH/2)·proj[5]/dist` and, when the previous frame moved < `Oqr=.05` px and not dragging, a damping-disabled snap update keeping pos+target. Not ported at all (sub-pixel orbit jitter differs). |
| main free-look (right-drag) | `te` (`pWr` region) | **MISSING (P1)** | Unreal-mode right button = free-look: pointer capture, YXZ euler, `xot=.0022 rad/px`, pitch clamp ±(π/2−.01), WASD fly `Tye=4·Aye`. `C.FREELOOK_RAD_PER_PX` exists but is unused; right-drag does nothing in unreal mode. |
| main WASD | `bot`/`ne()` | **NEAR** | camera+target move ✓, e/q up/down ✓, shift ×3 ✓; original also requires `playSession===null && !planShown && !sceneNodeOpen` — reconstruction allows WASD during rehearsal (P3). |
| main camera floor clamp | `Uit` | **EXACT (NEAR)** | `y ≥ .1` + `maxPolarAngle=acos((.1−target.y)/dist)` ✓; original calls it twice (before+after orbit tick) — reconstruction once (P3). |
| main focusObject / centerViewOn | `YUr` | **EXACT (NEAR)** | .3 s ease-in-out-cubic, `dist = max(1.2, 1.5·radius/sin(min(fovY,fovX)/2))` ✓; dblclick-empty center: prev-selection restore ✓, ≤3× distance ✓ **plus an extra 20-unit cap** and no `y≥.1` clamp / ripple (P3). |
| main frame loop order | `uZr.ne()` (`viewport_ctor.js`) | **NEAR** | rig tick → playback → manipulation → nav → env → markers → bounds/fog → shadow → selection/hover → render ≈ original order. Missing steps: livePose publish (`se`), frame stats (`Jqr` 250-frame p50/p95), onboarding tick, nav-ball, takes/record (D11-adjacent, P2). Frame-error guard: original try/catch with 3-report cap; reconstruction schedules rAF before `_frame` so a throw doesn't kill the loop — equivalent robustness. |
| main renderFrame planning-aid hiding | `re()` + `Ew()` | **DIVERGENT (P1)** | Original wraps **both** render paths (plain + finish) with `Ew()` — hide all visible planning aids, render, restore — then draws aids only in the overlay pass. Reconstruction renders the scene **with aids visible** and then draws them **again** in the overlay ⇒ aids double-drawn (transparency doubling; footprint quads z-fight the floor in the main pass). `_hidePlanningAids` exists but is only used by auto-measure. |
| main renderPlanningAids | `EOr` | **DIVERGENT (P1)** | Original enables layer `aye=1` on **every aid's full subtree** (`o.traverse(l=>l.layers.enable(aye))`) + **all scene `Line`s**; reconstruction enables the layer only on the **root object** of each aid (path-group anchor/handle spheres, gizmo sub-meshes keep layer 0 and are excluded from the overlay). Lines handled equivalently (`_collectLines`). Combined with the row above, aid children lose the always-on-top behavior. |
| main.evaluateAt characters | `ue` (`extracted/humanoid_raw.js` §jGr) | **NEAR** | exactY / backward-seek ground probe (`Bne=1.2` above base) / `zzt` step clamp `.5` / `Uzt=.22` exp smoothing ✓; parent worldToLocal + parent-yaw subtraction ✓; exact yaw `set(0,yaw−Ue,0)` vs `Wzt` chase `A2r=8·dt` (π on poseNow) ✓; humanoid clips map `{clip, clipTimeS}` ✓; at-rest backward rotation fallback ✓. **Bug (P1): `_groundY` raycasts `intersectObjects(walkableSurfaces(), false)` — original passes `true` (recursive) ⇒ prop GLB child meshes never ground characters walking on props.** |
| main.evaluateAt objects/rig/head | `L` | **NEAR** | Q0 gate (everything but camera) ✓; fold: scale always, position/rotation unless `walk` ✓ (missing `GA` equivalent-Euler pick — documented unsolved, P3); rig offsets from latest rig-transform item ✓; simple_figure headRotation ✓ (see figures P2); head-look loop with `xM` on current forward + eye `y+1.6·scale.y` ✓. **Divergent (P2): gaze + item rig-offset merge is a spread-overwrite; original `IZt` sums rotations element-wise per bone.** |
| main gaze split (via tracks.gazeSplit) | `xM` | **NEAR (P2)** | head ≤±70° (`XOr`), pitch ≤±35° (`YOr`), body remainder ✓; **edge case:** original headYaw = `sign(c)·min(|c|, 70°, 180°−|c|)` — for targets behind (|c|>110°) the head takes **less** than 70°; reconstruction flat-clamps at ±70°. Degenerate `flat<1e-6` guard missing (P3). |
| main stop-at-end | `jGr.tick` at-rest branch | **DIVERGENT (P2)** | Original: preview end → `stopPerformance` → next tick at-rest → `performanceTimeS=0` + `ye()` resets meshes to **stored TRS**. Reconstruction: seek(durationS) + stop + `resetToBase()` **then re-applies the end pose via `evaluateAt(durationS)`** ⇒ objects freeze at end-of-show pose and playhead stays at end. |
| main.updateCameraMarkers | `UGr.v` | **NEAR (P2)** | page focal + recordAspect (`BU`) ✓, frustum distance 3 (`DGr`) / `max(dist,.6)` (`LGr`) ✓; flown-camera markers: original looks the marker at the resolved aim (`LOr`) and drives the mesh — reconstruction stores `evalPose` but **never consumes it** (markers don't move during rehearsal) and approximates aim with the paired target marker only. |
| main resolvers().aim | `Ee`/`NP`/`VDe`/`uje` | **NEAR (P3)** | Uses live bbox `min.y + k·size.y` instead of `NP = (minY−baseY)+k·uje(height)` (figures `1.75·scaleY`, props catalog dims, target/spotlight 0); `.5` spotlight factor applied when the **subject** is a spotlight — original `NIr=.5` applies when the **aiming object** is a spotlight (condition inverted). |
| main autosave | stage persistence | **NEAR (P3)** | 1 s debounce → localStorage (QuotaExceeded-safe). No stage-page autosave found in the extracted bundle sections (canvas persistence service = 2 s debounce + 30 s periodic, Supabase) — the 1 s value is a reconstruction choice, not bundle-verified. |
| main evaluateAt live-play | `aqr` | **MISSING (P2)** | Acknowledged D11 skip (`timeS:null` realtime clip, live-play exemption in `ue`). |

### 1.4 ui.js

| module.function | original (name, source) | status | details |
|---|---|---|---|
| ui DOM shell | DOM_REFERENCE A/B | **DIVERGENT (P2)** | Vanilla shell is by design (DESIGN D1), but structurally missing vs the reference: scene tabs (+Add scene / Send to canvas / Duplicate / Delete), Record button, `3D \| 2D` view switch (plan view), components column (Add Component/My Component tabs + search + hierarchy list with chevrons/drag/delete), Actions window (Move/Animate/Camera tabs, 46 draggable clip tiles, Play/Rig Transform), PIP window, nav ball, right toolbar (Add menu with 2 items, Lasso, Assets, Preferences, Help), chat panel, magnet + take-range toggles, navTrack minimap, keyframe diamonds, path-painting edit row with Finish. Control-mode (Default/Unreal) switch placed in the stage header — original keeps it in preferences/localStorage (`stage-control-mode`). |
| ui buildLightPopover | `TQr/AQr` (`light_ui.js`) | **NEAR (P2/P3)** | ✓ 4 elevation presets (57.38/9/−4/−28, `kDe/E8r/j8r/I8r`), pressed `|Δ|<.5` (`SQr`), puck radius `(90−el)/120`, inverse `az=atan2(x,−y), el=90−r·120` with az wrap, az/el numeric inputs. Missing/incorrect: puck does not rotate with camera view yaw (`peekViewYawDeg` → fixed 0, P2); no phase labels (`kQr` ≥32/≥12/≥0/≥−8/≥≥−20/night); no **night-lights toggle** (`eKt` gate); no arrow-key nudge (±10° az / ±5° el, `olt/llt`); presets force azimuth 128.66 (original keeps current az); knob inset 46% ≈ `(50% − 8px)` approximation; no `beginEditGesture/endEditGesture` undo bracketing. |
| ui updateFrameGuide | `XGt`/`o2r`/`MGr` | **EXACT** | `Mtt=35·min(a,1)`, `XCe=35/max(a,1)`, `maxHeightFraction=(h−2·96)/h (≥0 else 1)`, `r=max(1,e,n/mhf)`, guide centered at `e/r × n/r`; CSS `border 1px solid rgba(255,255,255,.4)` + `box-shadow 0 0 0 9999px rgba(0,0,0,.4)` + z-index 1 + pointer-events none — verbatim. Camera-mode fov adoption `2·atan(r·XCe(viewport)/2/focal)` EXACT (extra 10–120° clamp not in original, P3). |
| ui refreshCameras (height/lens footer) | `hOa` (DOM_REFERENCE B) | **NEAR (P2)** | Lens log interp WFa/GFa EXACT (311→32 mm ✓), label "32 mm" ✓, min 0.2/step 0.1 ✓, hidden without single camera ✓. Height max: original `max(4 MZt, tallest non-camera top VDe) → spread>WLr ? 12 GLr → clamp ≤50 ZLr, +4 slack, ceil` — reconstruction `min(50, max(12, ceil(tallestPosY+4)))` (uses base Y not object top, no spread rule). Commit not gesture-bracketed; `heightM` uses stored Y instead of flown cam-path height. |
| ui timeline scaffold | `VAr` (`timeline_ui_pretty.js`) | **NEAR (P2)** | ✓ ctrl/⌘+wheel zoom `exp(−ΔY·(.02 if |ΔY|<10 else .005))`, min 60 px/s (`$Ar`); ✓ tick steps `[.5,1,2,5,10,15,30,60]` (`GAr`) with `step·pps ≥ 80px` (`qAr`); ✓ seek clamped to span; ✓ blocks min-width 3 px (`p2e`); ✓ 4 px drag threshold (`zAr`). Missing: cursor-anchored zoom + scroll preservation (`ATr`), navTrack minimap (drag/edges), default fit-to-viewport pps (`zrt`). |
| ui timeline span | `KAr` span | **DIVERGENT (P2)** | Original span = `max(5, max item endS)` (`UAr=5`); reconstruction `max(10, durationS+5)`. |
| ui timeline seek | `eCr` | **DIVERGENT (P1)** | **Ruler lives inside the scroller** (`#tlBody` overflow-x; `.tl-ruler` ends up `position:relative` which overrides its `position:sticky`), so `ruler.getBoundingClientRect().left` already includes the scroll offset — the code adds `lanes.parentElement.scrollLeft` **again** ⇒ clicking the ruler seeks `scrollLeft/pps` seconds past the click whenever the timeline is scrolled. Clamp also uses `durationS+5` instead of span. |
| ui timeline blocks: trim | `nCr` trim handle | **MISSING (P2)** | Right-edge trim handle: clip → duration (min .1), path/cam-path → **`speedUnitsPerS = MR(nx(anchors))/dur`** (arc/duration), generic → duration (min .05 `WAr`), camera → `x(...)`; none implemented (duration only via segment inspector). |
| ui timeline blocks: drag | `nCr` pointer handlers | **DIVERGENT (P2)** | Free move only. Missing: magnet snap radius `Kne=12px` (⌘/Ctrl suspends), marker set = other items' start/end, obstacle push + reorder plan (`q5r/kGt/lje`), alt-drag **duplicate** to another track (ghost block + caret + lane highlight), snap-guide lines, drag-ghost previews. Also commits `moveItem` to the store on every pointermove (original previews locally, commits on release). |
| ui timeline blocks: colors/labels | `ZAr`/`PDe`/`ODe` | **NEAR (P3)** | Original: camera items → `blockCamera`; object kinds (or path on non-walker) → `blockObject`; person items (clip/play/path-on-walker) → `blockHuman`. Reconstruction: `.cam` for camera lanes, `.kind-clip/.kind-play` green, everything else blue ⇒ **path on a walker gets the object color**; cam-move labeled "Move" instead of per-preset (Orbit/Dolly In/…), scale labeled "Scale" not Grow/Shrink. |
| ui timeline add track | `rCr` dropdown | **DIVERGENT (P2)** | Original: dropdown with search over animatable objects; reconstruction: "+ Track" adds the first available object, no dropdown. |
| ui refreshSegInspector | segment inspector (`segment_inspector_pretty.js`) | **PARTIAL (P2)** | ✓ path (Gait `Gzt`, Aim travel/locked/subject, Speed step .1 min `Mit=.2`, Edit path), clip (46 minus a_tpose, duration step .1 min `uVr=.1`), cam-move (move/direction/angle 15–360/heightΔ .5–20 step .5/distScale .1–4/duration step .5 min `bL=.1`), cam-still (subject+duration), cam-follow (object), cam-path (aim/subject/speed/Edit path). Missing: **rotate** (axis X/Y/Z segmented `hVr` + deg/s step 10 + duration), **revolve** (centre object + deg/s + duration), **scale** (factor step .1 min .05 + duration), **transform/rig-transform keyframe editors** (per-key position/rotation/scale/headRotation vectors), **play** (Play-again + 6 keymap slots `qzt`), cam-move **dolly_zoom focal** (14–200 step 1), cam-still **vertical aim**, cam-path **aimOffsetUnits** (−15…15). Gait select not gated to humanoids (original `hasGait`). |
| ui add palette | components column / `iMr.addObject` (`palette.js`) | **DIVERGENT (P2)** | Kinds Human/Figure/Camera/Target/Spotlight/Cube/Sphere/Cylinder + props ✓ (1439-entry catalog ✓ verified count). But: **no spawn grid** — original `V2e=5 × rMr=6`, spacing `nL=1.5`, `x=(i%5)·1.5−3, z=floor(i/5)·1.5` (reconstruction: everything at [0,y,0] — objects stack); spotlight not spawned at `[x,3.5,z+3]` aimed at floor (`sGt`, `G8r/q8r`); camera not spawned `[4+n·1.5, 1.6, 4]` aimed `[n·1.5,1,0]` (`rL/sL/kv`); simple_figure default rotation **`[0,π,0]` (`Bst`)** not applied; default names lack per-kind counters ("Cube 1"); `Group` add-button is an addition (original groups only via ⌘G). Palette tiles are not draggable onto the viewport (original: drop with 45% ghost). |
| ui prop picker | `Uh` catalog + picker | **NEAR (P3)** | 1439 props ✓, search + categories ✓; modal instead of components-column picker; list capped at 300 rendered rows. |
| ui keyboard | `Hzr` (`keyboard_Hzr.js`; port lives in manipulate.js `_installKeyboard`) | **PARTIAL (P1/P2)** | ✓ ⌘Z/⇧⌘Z/⌘Y undo-redo, ⌘C/⌘V copy-paste, ⌘G group, Esc/Enter finish path paint, Delete/Backspace deleteFocused, Z/X/C tool modes (default mode), input/textarea/contentEditable skip, keyboardOwner gate. **MISSING (P1): Space → togglePreview (Rehearse).** Missing (P2): **W/E/R tool modes in unreal mode** (`S9r(controlMode,key)`), **Delete while editingPath → deletePathAnchor(selectedAnchor)** (no anchor deletion anywhere in path editor), play-mode HUD keys (live play — D11). P3: no `preventDefault` on ⌘C/⌘V (browser clipboard may clobber), extra `F`→focus shortcut not in original. |
| ui refreshHierarchy | components column hierarchy | **NEAR (P3)** | Rows + selection ✓; no expand chevrons, no per-row delete, not draggable, no icons. |
| ui refreshInspector | Properties window (`inspector_dom.html`) | **NEAR (P2/P3)** | Name ✓, Position/Rotation vectors ✓ (rotation in **radians** — original displays **degrees**), Focal mm + Shake for cameras ✓, spotlight shape/intensity/diffusion ✓, humanoid clip select ✓. Missing: axis **drag-to-scrub** (`cursor:ew-resize`), camera **Aspect ratio** select (`Zae` 6 options) and **Film with phone**, scale row shown for all kinds (original camera panel has none), no i18n labels. |
| ui playhead badge | `QAr`/`YAr`/`JAr` | **NEAR (P2)** | Badge: original `0.00` under 60 s then `m:ss.00` (`YAr`); reconstruction always `t.toFixed(2)` ("60.00" past a minute). Ruler labels: original `"5s"`-style under 60 s then `m:ss` (`JAr`); reconstruction always `m:ss` ("0:05"). Updates via `setInterval(100ms)` instead of per-frame (P3). |

### 1.5 const.js

| item | status | details |
|---|---|---|
| Viewport/renderer block | **EXACT** | FP 50, Khe .1, RP 500, (6,5,8), (0,1,0), Lqr .75, Fqr 3072, Tye 4, Aye 3, wot .0036, _ot .5, xot .0022, UUr .3, zUr 1.5, WUr 1.2, qUr 5, Sye 8, uWr 350, hWr 14 — all verified in bundle. |
| Floor/sky/fog block | **EXACT** | $Y 80000, Fat 128, lOr 13948377, roughness .9, hZt 2e4, wFr 1.25, RP/Tat 500, EFr .5, _Fr 400, Sat 1.1, IFr 2.5, MFr .715, NFr 120, PFr 1.5, RFr 3, jFr {camera,target,group}. |
| Daylight block | **EXACT** | DFr + 7 HY stops byte-exact vs `env_daylight.js`; Aat 16747092; fq −30 / QA 90 / GWt −8 / A8r 5 / C8r 25 / kDe 128.66·57.38; presets E8r 9 / j8r −4 / I8r −28; cOr 16763274 (0xFFC98A). |
| Shadow block | **EXACT** | fOr {humanoid,simple_figure}, hOr 1.15, pOr 4, uOr .163, dOr 30, Oat 16, bOr .3, mOr 1.5, gOr 1/.15, Lat .1, radius 2. |
| Spotlight block | **EXACT** | Cat 1024, VFr .2, UFr 60, zFr −4e-4, WFr .02, decay 2, Yx 128, Eat 10, XFr .45, nre, jat 7, YFr 16769955 (0xFFE3A3), nOr 2895152, defaults {round,70,30} (bundle `QWt` — const.js comment says "XWt", name only), `_8r` 2.4 (`W8r` verified). |
| Figure block | **EXACT** | jP 1.75, RIr 1.299, Phe 0xf29a5c, HIr .72, Pie 72°; derived sA/PP/Nie/FIr/OIr/LIr exact (head top = 1.75 m by construction). |
| Camera block | **EXACT** | 14/200/50, yT [14,18,24,35,50,85,135,200] (verified), sensor 35, aspects `Zae` 6 entries, KGt 96, Rhe 16°/3/55, DGr 3, lBe .2 / MZt 4 / GLr 12 / ZLr 50, Gze 1000. |
| Tracks block | **EXACT** | NU 10, Htt 1.4, Qae .01 (verified), Mit .2 (verified), uVr .1, bL .1 (verified), eie .1 (verified), qA 20, Gzt, qzt, M8/N8 5, Jae 4 (transform default — used by reconstruction), VGt 20 (verified), FIELD_CLAMP (angleDeg 15–360, heightDelta .5–20, distanceScale .1–4, aimOffset −15…15, duration .1–120), Qzr .4 (verified). |
| Motion block | **EXACT** | Bne 1.2, Xae .5, Uzt .22, A2r 8, XOr 70°, YOr 35°, Wat .4, CZt 1.6, MIr .7 (verified), NIr .5 (verified — though misused in main.js, see §1.3), Sot .25, kWr .25, Tot .22 (verified). |
| Path/selection blocks | **EXACT** | anchor .09/1.4×, Not 0xaa55ff / Pot 0x66ddff / Rot 0xffcc55 / NGr 0xffffff, PGr .06, height .075 / ladder .3·.55 / FGr .25 / y+0.02; WWr 32, KWr 160, qWr 1000, ZWr 500, rGr #5f7196, sGr #ffffff, YWr .1, XWr 10, tGr .5, eGr 120, JWr .45, QWr 14, nGr 12 (verified), $Wr 1.5, GWr .18 (all verified in bundle). |
| CLIPS (46) | **EXACT** | All durations match HUMANOID.md §4 / GLB (spot-checked a_tpose .167, idle 2.5, walk 1.333, sword_attack_rm 1.5, spell_simple_* etc.). |
| CAM_MOVE_PRESETS / CAMERA_RIGS / SHAKE_* | **UNVERIFIED** | Sourced from the prior audit (older build); not re-extractable cheaply from this bundle. Plausible; flag for future verification. |
| Comment-level issues | **P3** | `SPOT_DEFAULTS` cites `XWt` (actual `QWt`); `FRUSTUM_K_YAW` duplicates `FRUSTUM_ANGLE_K` with a misleading comment; `HEIGHT_CURVE_MAX:100 // E2r` mislabels (`E2r` is the path cubic helper, not this constant); `FOCAL_DEFAULT // Bv / Hv` — `Bv` is Raycaster in this build (name reuse). Values fine. |
| **Wrong constant values** | **none found** | Every value checked against the bundle matches. The one numeric env divergence (floor `polygonOffsetFactor`) lives in env.js, not const.js. |

### 1.6 Adjacent findings (out-of-scope modules, figure-pipeline relevant)

| location | severity | details |
|---|---|---|
| objects.js `_loadHumanoid` + `_loadGLB` | **P0** | GLB **promise is cached per URL and `gltf.scene` is added without cloning** — a THREE object has one parent, so the 2nd+ humanoid **steals the scene graph from the 1st** (earlier humanoids become invisible; both rigs drive the same stolen bones). The original (`AWr.y`) calls `loadAsync(Hhe)` per humanoid (no cache) and disposes on stale. `_loadProp`/`_loadCameraGlb` do clone — only the humanoid path is broken. Fix: `SkeletonUtils.clone` per instance (or per-instance loadAsync). |
| objects.js `_updateSpotlight` (oOr port) | P2 | No shadow budget (`e6r(gpu)=min((maxTex−4)/2, maxVaryings−8)` first-N spotlights), no cookie application (`iOr` exists in env.js but is never consumed), always penumbra `.05+.9·diffusion` (original: budgeted → `angle=atan(tan(m)/nre)`, penumbra 0; unbudgeted → penumbra formula), beam cone misses the square `√2` radius factor. (Spotlight visuals were ENVIRONMENT.md's §spotlight; env.js itself is exact.) |
| paths.js | P2 | No `deletePathAnchor` (keyboard Delete while editingPath has nothing to call). |

---

## 2. Severity summary

**P0 (1)**
1. Humanoid GLB scene shared across instances — ≥2 humanoids breaks rendering (objects.js, §1.6).

**P1 (10)**
2. `TOr` fingerprint misses quaternion/scale (+ no camera/target/Sprite skip, no sun/w/far) → stale shadow map/fit on rotate/scale-only edits (env.js).
3. HumanoidRig.applyRigOffsets clobbers the animated pose instead of additive `aKt` (figures.js).
4. Humanoid actions never `paused` → figures idle-animate at rest instead of freezing at t=0 (figures.js/main.js).
5. `jZt` head-look offsets: pitch not negated, no YXZ→XYZ Euler conversion → humanoid gaze pitch inverted (figures.js).
6. `_groundY` non-recursive raycast → characters can't ground on prop meshes (main.js).
7. Planning aids not hidden during the main render (`Ew`) — double-drawn (main.js).
8. `renderPlanningAids` doesn't traverse — aid children excluded from the overlay pass (main.js).
9. Dqr custom-zoom anti-jitter `m()` (Oqr .05) missing (main.js).
10. Right-button free-look (`xot` .0022, YXZ, WASD fly) missing (main.js).
11. Space → togglePreview keyboard shortcut missing (ui/manipulate keyboard port).
12. Timeline ruler seek double-counts `scrollLeft` — wrong seek whenever scrolled (ui.js).

*(11 numbered items; #2–#12 are the P1s besides the P0.)*

**P2 (17)**
13. Floor `polygonOffsetFactor` −1 vs bundle **4** (env.js; ENVIRONMENT.md L82 annotation is wrong — raw `env_wOr.js` is authoritative).
14. Shadow fit only runs when dirty (original fits every frame) (env.js).
15. simple_figure keyed headRotation not interpolated; lookAt precedence rule missing (figures/main).
16. Gaze/item rig-offset merge is spread-overwrite, original `IZt` sums rotations (main.js).
17. `xM` behind-target head-yaw rule `min(|c|,70°,180°−|c|)` not ported (tracks.gazeSplit).
18. Stop-at-end leaves end pose + playhead at end (original resets to stored TRS, t=0) (main.js).
19. Flown camera markers never adopt the evaluated pose (`evalPose` unused) (main.js).
20. livePose publish + frame stats + onboarding/nav-ball/takes loop steps missing (main.js).
21. DOM shell: scene tabs, Record, 3D|2D plan, components column, Actions window, PIP, nav ball, right toolbar, chat, magnet/take-range, minimap, kf diamonds all absent (ui.js/index.html).
22. Light popover: fixed viewYaw, no night-lights toggle, no phase labels, no arrow nudge, presets force azimuth, no undo gestures (ui.js).
23. Height slider max model approximation (ui.js).
24. Timeline: span math, trim handles (incl. path speed=arc/dur), magnet drag/duplicate/reorder, add-track dropdown, cursor-anchored zoom, ruler/badge label formats (ui.js).
25. Segment inspector: rotate/revolve/scale/transform/play editors, dolly_zoom focal, vertical aim, aimOffsetUnits missing (ui.js).
26. Add palette: no 5×6 spawn grid (V2e/rMr/nL), no spotlight/camera spawn poses, no simple_figure π yaw default (Bst), no name counters, no drag-to-viewport drops (ui.js/store.js).
27. Inspector: radians vs degrees, no axis scrub, no aspect select / film-with-phone (ui.js).
28. objects.js spotlight: no shadow budget/cookies, always-penumbra, beam √2 (adjacent).
29. paths.js: no anchor deletion (adjacent).

**P3 (14)** — zoom fallback 50 vs 500; fov 10–120 clamp; spotlight aim `.5` condition inverted; Uit called once; WASD allowed during playSession; `touches.ONE` remap; camera-mode page-mode never leaves 'edit' (stroke/footprints gate); playhead 100 ms polling; cam-move label/scale label; path-on-walker block color; ⌘C/⌘V preventDefault; extra F shortcut; `SWr` fade cleanup; AOr context-restore handling; const.js comment mislabels (XWt/QWt, FRUSTUM_K_YAW, E2r); camera GLB/aspect details; centerViewOn 20-cap/ripple.

---

## 3. Verified correct (EXACT) — 43 items

1. `$Fr` daylight interpolation incl. 7-stop decimals, clamping, linear-space Color lerp (python-verified checkpoints).
2. `SDe` light normalization.
3. `M8r` sun direction + elevation remap.
4. `xOr` sky dome (geometry, material flags, GLSL verbatim, uniforms, frustumCulled/renderOrder/raycast).
5. `wOr` scene fog/hemi/sun construction (mapSize min(3072,maxTextureSize), radius 2).
6. Floor geometry/color/roughness/rotation/receiveShadow + raycast proxy (offset factor excepted).
7. `applyDaylight` memoization + glow return + all uniform/light writes + fog=horizon.
8. `walkableSurfaces` kind set.
9. `iOr` diffusion cookie.
10. `vje`/`OFr`/`sye` bounds (median focus, XZ spreads, exclusions).
11. `FFr` fog density.
12. `SFr` far (+ fallback semantics).
13. `CFr` near.
14. `pZt` tick (400 ms, FogExp2, hysteresis 1.1, fitNow).
15. Shadow-fit math: spread90×1.15, caster kinds, expand 4, reach/texel branch, 16-snap min 30, `kOr`/`Bat` texel snap, S=2w, far, bias, **normalBias (exact original formula found & matched)**, update guard.
16. `Zqt` simple_figure (all 4 parts + materials + userData + contrast rule).
17. `aqt`/`Kqt` figure colors.
18. `nat`/`o$` head rotation accessors.
19. Label sprite (font, pill, scale .22, y=2.0, figures-only, planningAid).
20. `u5r` placeholder.
21. Humanoid normalize pipeline (1.75/bind-height, XZ-center, feet minY, roughness 1, M_Main orange / M_Joints purple, no extra yaw).
22. `$Nr` default pose.
23. Crossfade .25 s + wall-clock wrap.
24. `COr` viewport (renderer, PCF, dpr, camera, start pose).
25. Orbit setup + control-mode mouse-button remaps + screenSpacePanning.
26. Camera floor clamp `Uit`.
27. Wheel zoom/nav classification + math (zoom clamp, orbit rate, pan rate).
28. `YUr` focus animation (duration, ease, distance formula).
29. `ue` character evaluation (ground/exactY/step/smoothing/parent-yaw/yaw chase/clips map).
30. `Q0`-style object-fold gate (cameras excluded) + fold semantics.
31. `xM` core split (≤70°/≤35°/body remainder/eye 1.6·scaleY) & `Wzt`/`zzt`/approach.
32. `ye`/resetToBase.
33. Frame-loop render order incl. stroke→planning-aids overlay sequence.
34. `XGt`/`o2r`/`MGr` frame guide math + CSS.
35. Camera-mode fov adoption formula.
36. Lens log interpolation (WFa/GFa + inverse, 311→32 mm).
37. Timeline zoom factors + 60 px/s floor + tick step table (≥80 px) + seek-on-ruler + 3 px min block + 4 px drag threshold.
38. Segment inspector fields for path/clip/cam-move/cam-still/cam-follow/cam-path (with correct clamps).
39. Light popover core (presets, pressed-Δ .5, puck geometry + inverse drag, az/el inputs).
40. Prop picker (1439 catalog, search, categories).
41. Keyboard core (undo/redo/copy/paste/group/Esc/Enter/Delete/Z-X-C, input-skip, owner gate).
42. const.js — **every value checked matches the bundle** (60+ constants verified; only comment mislabels).
43. CLIPS 46-entry duration table.

**Count summary**: 43 EXACT · 8 NEAR · **18 DIVERGENT** · **8 MISSING** (P0 ×1, P1 ×11, P2 ×17, P3 ×14 findings total).

---

## 4. Recommended next actions (priority order)

1. **objects.js**: clone the humanoid GLB per instance (`SkeletonUtils.clone`) or drop the promise cache — fixes the only P0.
2. **env.js**: fix fingerprint to include quaternion+scale (and skip camera/target/Sprites); set floor `polygonOffsetFactor: 4` (and correct ENVIRONMENT.md L82).
3. **figures.js**: make `applyRigOffsets` additive on the post-mixer pose; set `action.paused` per `AWr.b`; negate + Euler-convert pitch in `headLookOffsets` (`EZt`).
4. **main.js**: `_groundY` recursive; hide planning aids around the main render; traverse when enabling the planning layer; port `Dqr.m` anti-jitter and right-drag free-look; reset-to-base on rehearsal end.
5. **ui.js**: fix ruler seek scroll math; add Space→Rehearse; add trim handles (path trim ⇒ `speedUnitsPerS = arcLength/duration`); spawn grid + kind-specific spawn poses; complete segment inspector (rotate/revolve/scale/transform/play) and keyboard (W/E/R unreal, Delete-anchor).
6. Correct the const.js comment mislabels (XWt→QWt, drop FRUSTUM_K_YAW, re-source HEIGHT_CURVE_MAX); re-verify CAMERA_RIGS/SHAKE_* against this build when convenient.
