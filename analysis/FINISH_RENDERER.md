# Finish composer + stroke ring + primitives — raw extraction (round 2)

Ground truth offsets refer to `analysis/index-DBE17t4T.js`. Extracted 2026-11-14.
Raw dumps: `analysis/tmp_d/{finish_raw.js, finish_raw2.js, auto_measure.js, runtime_root.js}`, `analysis/tmp_b/sel_pGr_full.js`.

## 1. Rendering dispatch (uZr runtime root)

```
frame(dt): navBall.tick, playback.tickShake, flightRecorder.tick, strokeRing.tick,
  planShown || !pageLive ? scene.updateMatrixWorld()
  : (gizmo.tick, re(), frameStats.add(dt*1e3), Q(), navBall.render()),
  playback.restoreShake, playback.tickCapture

re() = main render:
  if drawingBufferSize == 0 return
  pe = finishOn()                      // Dje(renderer) && finishEnabled.peek()
  pe || finish.release()               // free RTs when off
  aids = Ew(env)                       // hide planningAids (visible=false), restore fn
  try { pe ? finish.render(scene, camera) : renderer.render(scene, camera) }
  finally { aids() }
  playback.isViewportFilming() || ae()

ae() = overlays: strokeRing.drawStroke(); EOr(env)   // planning-aids pass (layer 1)
```

`Ew(env)`: hide all visible planningAids, return restore fn.
`jOr(env)`: temporarily SHOW hidden camera meshes (for filming) — inverse helper.

**Key: stroke ring (`drawStroke`) is gated on the SAME finish predicate** (`strokeEnabled: m`)
— finish off ⇒ no ring, footprint shader still always on.

## 2. Finish composer `hKt(renderer)` — "the quick AO"

### 2.1 SOFT_TERMINATOR patch (module load)
```js
Fje = "float dotNL = saturate( dot( geometryNormal, directLight.direction ) );";
ShaderChunk.lights_physical_pars_fragment = ShaderChunk.lights_physical_pars_fragment
  .replace(Fje, `${Fje}
    #ifdef SOFT_TERMINATOR
      dotNL = ( dotNL < 0.3 ? dotNL * dotNL / 0.6 : dotNL - 0.15 ) / 0.85;
    #endif`);
oKt(material) => material.defines = {...material.defines, SOFT_TERMINATOR: ""}
```
Applied to: sphere/cylinder primitive materials (`wWr`), and any colorOverride material
created for a mesh with `userData.softTerminator` (prop GLBs that are sphere/cylinder
primitives — `_Wr` big-primitive swap keeps userData).

### 2.2 Primitives (exact)
- `xWr(kind)`: "sphere"|"cylinder" pass through; anything else → "cube".
- `wWr(kind, color)`: `MeshStandardMaterial({color: color ?? pq, roughness: X_})`,
  softTerminator = kind !== "cube"; `pq = "#e2e0dc"`, `X_ = 1`.
- `lKt(kind, big)`: sphere → `SphereGeometry(.5, big?64:32, big?32:16)`;
  cylinder → `CylinderGeometry(.5,.5,1, big?96:24)`; cube → `BoxGeometry(1,1,1)`;
  all `.translate(0, .5, 0)`. (yWr=[64,32], vWr=96, gWr=24)
- `_Wr(mesh, scale)`: big = max(|sx|,|sy|,|sz|) >= 24 (bWr) → swap to big geometry
  (disposes old), memoized via userData.bigPrimitive.
- Mesh gets `userData.primitiveKind`, `userData.softTerminator`.

### 2.3 Name-based auto color/ glow (Mje / eKt)
- `Mje(obj)`: kind ∈ {cube,sphere,cylinder,prop}; name = propKey ?? name, camel→snake;
  green `#b7cbb6` if matches trees|pines|conifers|shrubs|bushes|foliage|woodland|forest|
  grass|lawn|meadow|hedges|moss|ivy|vines|leaf|leaves|ferns|palms|bamboo AND NOT
  trunks|branches|posts|foundations|stakes|stumps|logs|dead|snow|snowy|rocks;
  blue `#a9bbd8` if matches water|lake|river|sea|ocean|pond|pool|moat|canal|stream AND
  NOT edges|rims|walls|banks|embankments|bridges|decks|decking|sides|boats|boathouses|
  piers|rails|railings|towers|tables|rocks.
- `eKt(obj)` glow: kind ∈ {cube,sphere,cylinder} AND name NOT frames|mullions|sills|
  arches|recesses|jambs|posts|poles|bases|caps|roofs|brackets|stone|tracery|hoods|
  moldings|holders|sticks|wine AND matches lantern|lamp|candle|window|lancet|
  stained_glass|glass_pane|moon with the remainder NOT tables|seats|walls|blinds|cords|
  chains|handles|feet|foot → `glows`.
- Glow render (AWr sync): `emissive.setHex(cOr)`, `cOr = 16763274` (0xFFB90A warm amber),
  `emissiveIntensity = g` = applyDaylight glow return (elevation-based); material AND
  originalMaterial both. Cleared when glow ends.

### 2.4 Composer internals
Constants: `EWr=540` (occlusion max height — NOT 1080), `jWr=.5` (occlusion scale),
`Lje=.05` (RADIUS), `IWr=12` (SAMPLES), `MWr=0x626a8c` (occlusion tint, =6449804),
`NWr=(.1,.11,.16)` (edge tint), `PWr=.15` (crease strength), `cKt=4` (MSAA),
`RWr=150` (realloc debounce ms), `FWr=.05` (repaint aspect tolerance).

- Scene + OrthographicCamera + fullscreen `Mesh(PlaneGeometry(2,2))` (frustumCulled=false).
- Materials: `ShaderMaterial({vertexShader: LWr, fragmentShader, depthTest:false,
  depthWrite:false, uniforms})`; composite additionally `depthTest:true, depthFunc: nie=1
  (AlwaysDepth), depthWrite:true`.
- RT alloc `g(w,h)` (debounced 150ms by dKt, or size-mismatch):
  - scene RT `d = WebGLRenderTarget(w,h,{type: qm=1016 HalfFloat, samples:
    min(4, renderer.capabilities.maxSamples), depthTexture: new DepthTexture(w,h,
    V1=1014 UnsignedIntType)})`
  - occlusion ping-pong u,h at `[S,T] = OWr(w,h)`:
    `S = round(w*min(.5, 540/h))` etc., min 1px; `{format: NR=1028 RedFormat,
    type: HalfFloat, depthBuffer:false, minFilter/magFilter: $i=1006 Linear}`.
- `render(scene, camera)`:
  1. alloc at drawingBufferSize; render MAIN SCENE → d (MSAA RT); `v = camera.aspect`.
  2. tDepth = d.depthTexture; invProjection = camera.projectionMatrixInverse.
  3. SSAO (o): texel = 1/(S.w,S.h) (occlusion-res!), radiusUv =
     (Lje*proj[0]*.5, Lje*proj[5]*.5) → render quad → S.
  4. blur (l): tOcclusion=S, direction=(1/S.w,0) → T; then tOcclusion=T,
     direction=(0,1/S.h) → S.
  5. composite (c): tColor=d.texture, tOcclusion=S, texel=1/d.wh, occlusionTexel=1/S.wh,
     fogDensity = scene.fog instanceof FogExp2 ? density : 0, near, far → screen (null).
- `repaint(camera)`: `!d || |camera.aspect/v - 1| > .05 ? false : (composite→screen, true)`
  — re-composite only (used on daylight change).
- `release()` frees RTs; `dispose()` frees all.

### 2.5 Shaders (verbatim)
Vertex `LWr`: `vUv=uv; gl_Position=vec4(position.xy,0.,1.);`
Shared `uKt`: viewPosition(uv) from tDepth + invProjection.
SSAO `DWr`: golden-angle 12 taps, RADIUS .05, SELF_BIAS .2, interleavedNoise, normal from
nearest of ±x/±y neighbor diffs (cross), reach=RADIUS*-p.z, `occlusion += falloff *
max(0, dot(toSample, normal)/sqrt(d2+1e-6) - .2)`, out `clamp(1-2*occ/12)`; sky (depth>=1)
→ 1.0.
Blur `BWr`: 3-tap-per-side separable gaussian `exp(-i²/5)`, depth-aware weight
`max(0, 1-|z-z0|/(z0*.03))`.
Composite `HWr`: occlusion upsample 2×2 depth-weighted (`w=1/(1e-3+|invZ-i0|/i0)`),
`color *= mix(1, mix(occlusionTint, 1, occ), clearAir)`; crease =
`max(|lx+rx-2i0|,|dy+uy-2i0|)/i0`, line = `smoothstep(.004,.03,crease)*.15`,
`color *= mix(1, edgeTint, line*clearAir)`; `clearAir = exp(-(fogDensity/i0)²)`
(fade with haze); `toSrgb(clamp(color)) + triangular dither (hash32 pair - 1)/255`;
`gl_FragDepth = depth` (preserved for later passes).
`inverseZ(depth) = (far + depth*(near-far))/(near*far)`.

### 2.6 Capability probe `Dje(renderer)` (WeakMap memo)
Two 4×4 RTs (one `{type:HalfFloat, samples:min(4,maxSamples), depthTexture:UnsignedInt}`,
one `{format:Red, type:HalfFloat, depthBuffer:false}`) — both must be
FRAMEBUFFER_COMPLETE.

### 2.7 Auto-measure + persistence
- localStorage `stage-finish` = `{enabled: bool, source: "auto"|"manual"}` ($ot read,
  Hqr write).
- `qqr({drawPlain, drawFinished, finishGpu, pixels})`: 2 warm + 5 measured of each
  (median), `finishGpu` = `gl.readPixels(0,0,1,1,RGBA,UBYTE)` as GPU fence;
  costMs = median(finished) − median(plain).
- Enable rule `zqr`: `costMs * max(1, 1920*1080/pixels) <= 11ms` (Bqr=11).
- Schedule `Xqr`: first try at frame 30 (Zqr), on fail retry ≤2 more every 300 frames
  (Kqr); min canvas 320×200 (Vqr); skipped while pointer held / wheel <500ms (dZr) /
  preview playing / performance playing / filming / capturing.
- `finishNeedsMeasuring()` store flag; `onFinishMeasured(result, measurement)` callback.
- drawPlain for measurement: `renderer.setRenderTarget(null); renderer.render(scene,
  camera)` (aids hidden via Ew).

## 3. Stroke ring (`pGr` selection system part)

Per-renderer RT cache `v: Map<renderer, {target, shouldRealloc}>`.
`C(renderer, camera, ids)`:
1. `strokeEnabled()` false → dispose target, return.
2. Collect meshes: per id `aGr(mesh, cb)` — kind ∉ {camera,target,spotlight} (_De) →
   `gBe` (Mesh non-MeshBasicMaterial, recursive); kind ∈ _De → traverse ALL
   Mesh + Lines (frustum wireframes etc.).
3. Size: `L = min(1, 1080/drawH)`; W,H = ceil(drawW*L/16)*16, ceil(drawH*L/16)*16 (lQ=16).
   RT: `{samples: 4, depthBuffer: false, generateMipmaps: true,
   minFilter: wv=1008 LinearMipmapLinearFilter}` (alloc debounced 150ms).
4. Mask render: enable layer 2 (cQ) on collected meshes + ALL Lines in scene;
   save fog/autoClear/clearAlpha/clearColor/camera.layers; `scene.fog=null`,
   `scene.overrideMaterial = MeshBasicMaterial({color: 0xffffff, fog:false,
   side: DoubleSide})`, `camera.layers.set(2)`; `setRenderTarget(rt); setClearColor(0,0);
   autoClear=true; render(scene, camera)` → white silhouette mask (mipmapped).
5. Ring pass: `tMask=rt.texture, uTexel=1/rt.wh, uWidth = 1.5($Wr) * pixelRatio *
   (rt.height/drawH)`; `setRenderTarget(null); restore clearColor; autoClear=false;
   render(quadScene, orthoCamera)`.
6. Finally: restore camera layers mask, overrideMaterial=null, fog, autoClear; disable
   layer 2 on collected meshes.

`drawStroke()` = ids = selected (edit view only) + hovered (if not selected);
`strokeSelection(renderer, camera)` (for record/PIP cameras) = selected only;
`forgetStroke(renderer)` disposes its RT.

### hGr ring shader (verbatim in sel_pGr_full.js)
```glsl
if (textureLod(tMask, vUv, 4.0).r == 0.0) discard;   // coarse mip early-out
float inside = textureLod(tMask, vUv, 0.0).r;
if (inside >= 0.999) discard;
float s = max(ringMax(uWidth), ringMax(uWidth * 0.5)) * (1.0 - inside);
float h = 0.26 * ringMax(uWidth + 2.0) * (1.0 - inside) * (1.0 - s);
float a = s + h;
if (a <= 0.002) discard;
gl_FragColor = vec4(mix(vec3(0.09,0.11,0.18), vec3(1.0), s / max(a, 1e-3)), a);
```
`ringMax(r)` = max of 8 textureLod taps at radius `r*uTexel`.

## 4. Nav ball (`lZr`) — captured in auto_measure.js (backlog port)
67×67 (jw) pad at top-right with zie=12 margin; copies main framebuffer via
`copyFramebufferToTexture` into 67·dpr texture; golden-angle 12-tap radial blur
(radius .085, dim .82, edge fade .68→1) over ortho quad scene; plus separate mini scene:
PerspectiveCamera(30, 1, .1, 20) at (0,.42,5.1), HemisphereLight(0xffffff, 0x4473924?=
0x4473924 hmm 4473924 = 0x445964), DirectionalLight(0xffffff, 4) at (5,10,4), compass
needle mesh (fot geometry) flatShading roughness .52 white; needle counter-rotates by
camera yaw delta (Kzr/Xzr, roll factor .6, smoothing 12/s), navBallVector drive
(strafe/forward ×.17, deadzone .12 via zzr). Rendered inside scissor, autoClear=false,
then clearDepth + render mini scene. Only when `mode==="edit" && !playSession`.
(NOTE: jw/zie/Kzr/Xzr/fot/zzr/Ew(vot?) consts live elsewhere — see auto_measure.js
dump + EDITOR_UX §7.)

## 5. Alias table (verified values)
`t$=1` PCFShadowMap · `qm=1016` HalfFloatType · `NR=1028` RedFormat · `$i=1006`
LinearFilter · `V1=1014` UnsignedIntType · `nie=1` AlwaysDepth · `wv=1008`
LinearMipmapLinearFilter · `z0=1009` UnsignedByteType · `pq="#e2e0dc"` · `X_=1`
roughness · `Phe="#f29a5c"` · `lOr=13948377` floor 0xD4D5D9 · `cOr=16763274` glow
0xFFB90A · `$Y=8e4` floor size · `Fat=128` floor segs.
