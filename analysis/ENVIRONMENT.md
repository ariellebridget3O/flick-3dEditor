# Environment / Renderer / Daylight — exact extraction (bundle index-DBE17t4T.js)

All code below is de-minified from the live bundle. Names in `backticks` are the bundle's minified ids.

## Viewport construction `COr(t)` @~5,443,700
```js
const FP = 50;  // editor camera fov
function COr(t /*{container}*/) {
  canvas = document.createElement("canvas"); canvas.classList.add("ph-viewport-capture");
  renderer = new WebGLRenderer({canvas, antialias: true});
  fZt(renderer); // shadowMap.enabled = true; shadowMap.type = t$ = 1 (PCFShadowMap; PCFSoft deprecated in r182)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  container.appendChild(renderer.domElement);
  scene = new Scene;
  camera = new PerspectiveCamera(50, w/h || 1, 0.1, 500);   // Khe=.1, RP=500
  camera.position.set(6, 5, 8); camera.lookAt(0, 0, 0);
  return {a:t, renderer, scene, camera, meshById: new Map, disposers: [], planningAids: [],
          pathEditPickables: [], rigJointPickables: [], isDisposed, markDisposed};
}
```

## Environment + controls `Dqr(viewport)` @~5,444,000
```js
Fqr = 3072;  // shadow map px setting (min with renderer.capabilities.maxTextureSize)
function Dqr(t) {
  const {scene, camera, renderer, meshById} = t;
  const {floor, sun, applyDaylight} = wOr(scene, {shadowMapPx: Math.min(3072, maxTextureSize)});
  orbit = new OrbitControls(camera, renderer.domElement);   // _qr = three r182 OrbitControls
  orbit.target.set(0, 1, 0);
  orbit.enableDamping = true;
  orbit.rotateSpeed = 0.75;                                  // Lqr
  orbit.mouseButtons = {LEFT: ROTATE, MIDDLE: PAN, RIGHT: null};
  orbit.enableZoom = false;   // custom zoom below
  // walkableSurfaces(): [floor, ...meshes whose kind NOT in {camera,target,spotlight,humanoid,simple_figure,group}]
  // custom zoom (called from tick): 
  //   pixelsPerUnitAtTarget = (bufH/2) * projMatrix[5] / max(1e-6, cam.position.distanceTo(target))
  //   prev = distance(prevPos) * that;  if (dragging || prev===0 || prev >= 0.05 /*Oqr*/) return;
  //   // else: temporarily disable damping, snap update (keep pos+target) — suppresses orbit jitter on zoom?
  // tick(): orbit.enabled && (orbit.update(), customZoom())
}
```

## Sky dome + lights + floor + daylight apply `wOr(scene, {shadowMapPx})` @~5,439,200
```js
const lOr = 13948377 /*0xD4D4D9 floor*/, $Y = 80000, Fat = 128, nOr = 2895152 /*lamp color 0x2C3430?*/;
function xOr() {  // sky dome mesh
  mesh = new Mesh(SphereGeometry(1, 32, 16), new ShaderMaterial({
    side: BackSide, depthTest: false, depthWrite: false, fog: false,
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = position;
        vec4 clip = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
        gl_Position = clip.xyww;   // sky at infinity, follows view rotation only
      }`,
    fragmentShader: `
      varying vec3 vDirection;
      uniform vec3 zenith; uniform vec3 horizon; uniform vec3 flare; uniform vec3 flareDirection;
      void main() {
        vec3 direction = normalize(vDirection);
        float height = max(direction.y, 0.0);
        vec3 color = mix(horizon, zenith, pow(height, 0.55));
        color += flare * pow(max(dot(direction, flareDirection), 0.0), 7.0) * smoothstep(0.0, 0.06, height);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }`,
    uniforms: {zenith:{value:new Color}, horizon:{value:new Color}, flare:{value:new Color}, flareDirection:{value:new Vector3}}
  }));
  mesh.frustumCulled = false; mesh.renderOrder = -1; mesh.raycast = () => {};
  return mesh;
}
function wOr(scene, e) {
  sky = xOr(); scene.add(sky);
  scene.fog = new FogExp2(0xffffff, 0);          // cq = FogExp2
  hemi = new HemisphereLight(); scene.add(hemi); // VC
  sun = new DirectionalLight();                  // ax
  sun.castShadow = true; sun.shadow.mapSize.set(e.shadowMapPx, e.shadowMapPx); sun.shadow.radius = 2;
  scene.add(sun, sun.target);
  floor = new Mesh(PlaneGeometry(80000, 80000, 128, 128),
                   new MeshStandardMaterial({color: 0xD4D4D9, roughness: .9,
                     polygonOffset: true, polygonOffsetFactor: -1 /*? see 'po...' cut*/, polygonOffsetUnits: 4}));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  // floor raycast proxy: plain PlaneGeometry(80000,80000) shares matrixWorld; hits forwarded to floor
  scene.add(floor);
  let lastAz = NaN, lastEl = NaN, glow = 0;
  return { floor, sun,
    applyDaylight(light) {   // light = {azimuthDeg, elevationDeg, nightLights?}
      glowAmount = () => light.nightLights === false ? 0 : glow;
      if (light.azimuthDeg === lastAz && light.elevationDeg === lastEl) return glowAmount(); // memo
      lastAz = light.azimuthDeg; lastEl = light.elevationDeg;
      const g = $Fr(light.elevationDeg);          // table interpolation (below)
      hemi.color.copy(g.fillSky); hemi.groundColor.copy(g.fillGround); hemi.intensity = g.fill;
      sun.color.copy(g.sunColor); sun.intensity = g.sun;
      scene.fog.color.copy(g.horizon);            // fog color = horizon color
      sky.material.uniforms.zenith.value.copy(g.zenith);
      sky.material.uniforms.horizon.value.copy(g.horizon);
      sky.material.uniforms.flare.value.copy(g.sunColor).multiplyScalar(g.flare);
      const az = light.azimuthDeg * Math.PI/180, el = Math.max(light.elevationDeg, 0) * Math.PI/180;
      sky.material.uniforms.flareDirection.value.set(Math.sin(az)*Math.cos(el), Math.sin(el), -Math.cos(az)*Math.cos(el));
      glow = g.glow;   // night glow (returned; consumed by spotlight/night lamps)
      return glowAmount();
    } };
}
```

## Daylight table `HY` + interpolation `$Fr` @~5,434,400
```js
DFr = {zenith:14673392 /*0xDFDCF0*/, horizon:15264752 /*0xE8B890*/, fillSky:15133691 /*0xE7C39B*/,
       fillGround:13685210 /*0xD0D1D2*/, fill:1.7, sunColor:16775150 /*0xFFD69E*/, sun:2.15, glow:0, flare:0};
Aat = 16747092 /*0xFF8C74*/;
HY = [
 {elevationDeg:-30, zenith: 329487, horizon:  725280, fillSky: 4149120, fillGround: 1185311, fill:0.50, sunColor:11847925, sun:0.55, glow:1.00, flare:0.00},
 {elevationDeg:-16, zenith: 857648, horizon: 2635358, fillSky: 5335213, fillGround: 1909299, fill:0.80, sunColor:11124204, sun:0.30, glow:1.00, flare:0.00},
 {elevationDeg:-8,  zenith:1845064, horizon: 9072524, fillSky: 7568564, fillGround: 3485759, fill:0.95, sunColor:0xFF8C74, sun:0.00, glow:0.80, flare:0.30},
 {elevationDeg:-2,  zenith:3820152, horizon:14719100, fillSky: 9409220, fillGround: 6245460, fill:1.15, sunColor:0xFF8C74, sun:0.75, glow:0.35, flare:0.55},
 {elevationDeg: 5,  zenith:9677260, horizon:16240038, fillSky:13616862, fillGround:12098180, fill:1.45, sunColor:16755044, sun:3.60, glow:0.00, flare:0.60},
 {elevationDeg:16,  zenith:14082028,horizon:15918550, fillSky:14541038, fillGround:13287346, fill:1.55, sunColor:16768180, sun:2.70, glow:0.00, flare:0.12},
 {elevationDeg:32,  ...DFr}   // full day values spread in
];
// color values are DECIMAL ints passed to THREE.Color(number) → hex semantics.
// $Fr(elevationDeg): segment search (stop[i].elev <= t <= stop[i+1].elev), a = clamp(01)
//   colors (zenith,horizon,fillSky,fillGround,sunColor): Color LERP (linear in sRGB number space via Color.lerp)
//   scalars (fill,sun,glow,flare): linear interp
// NOTE (fidelity): HY has 7 stops; values above/below ends clamp (segment search stops at ends).
```

## Sun direction + light normalization @~4,903,000
```js
fq=-30 /*elev min*/, QA=90 /*elev max*/, A8r=5, GWt=-8, C8r=25, kDe={azimuthDeg:128.66, elevationDeg:57.38} /*default light*/;
function M8r(light) {  // sun direction (unit)
  const az = light.azimuthDeg * Math.PI/180;
  const el = (light.elevationDeg > -8 ? Math.max(light.elevationDeg, 5) : 25 - light.elevationDeg) * Math.PI/180;
  return [Math.sin(az)*Math.cos(el), Math.sin(el), -Math.cos(az)*Math.cos(el)];
}
function SDe(light) {  // normalize: azimuth wrap 0..360, elevation clamp -30..90, keep nightLights===false only
  return {azimuthDeg: ((az%360)+360)%360, elevationDeg: min(90, max(-30, el)), ...(nightLights===false ? {nightLights:false} : {})};
}
```

## Sun/shadow frustum fitting @~5,442,700 (per-frame or on-change)
```js
// casters: meshes with userData.kind in fOr={humanoid,simple_figure} ∪ props? (check `has(j.userData.kind)`)
hOr=1.15, pOr=4, uOr=.163, dOr=30, Oat=16, bOr=.3, mOr=1.5, gOr=1/0.15, Lat=.1;
casterBox = union(Box3 of shadow-casting meshes)
focus = bounds.focus (median center) else (0,0,0)
v = (bounds?.spread90 ?? 0) * 1.15
texelWorld = 0.163 * shadow.mapSize.x / 2
if (!casterBox.isEmpty()) {
  casterBox.expandByScalar(4).getBoundingSphere(sph);
  reach = focus.distanceTo(sph.center) + sph.radius;
  if (reach <= texelWorld) v = max(v, reach); else { focus = sph.center; v = sph.radius; }
}
w = min(texelWorld, max(30, ceil(v/16)*16));          // half-extent snapped to 16m
dir = M8r(light); kOr(focus, dir, 2*w/mapSize.x);      // snap dir to texel grid (axis-align-ish, prevents shimmer)
S = 2*w; sun.target.position = focus; sun.position = focus + dir*S;
far = S + w + max(0, (focus.y + w)/dir.y);
normalBias = min(0.3, 1.5 * 2*w/mapSize * min(1/0.15, 1/dir.y));
shadow.camera: left=bottom=-w, right=top=w, near=0.1, far=far; bias = -0.005/(far-0.1...); updateProjectionMatrix();
// kOr/Bat: snap vector t to grid n along basis e: t += e * (round(t·e/n)*n − t·e)
```

## Dynamic fog / near / far `pZt` @~5,433,700
```js
Khe=.1, RP=500, hZt=2e4 /*far cap*/, wFr=1.25, _Fr=400 /*bounds recompute ms*/, Sat=1.1 /*hysteresis*/,
kFr=RP/Khe=5000, Tat=500, TFr=2, EFr=.5, jFr=Set("camera","target","group") /*excluded from box list*/,
IFr=2.5, MFr=.715, NFr=120, PFr=1.5, RFr=3;
function FFr(bounds, camPos) {  // fog density
  n = bounds ? camPos.distanceTo(bounds.focus) : camPos.length();
  r = n + (bounds?.spread95 ?? 0);
  return 0.715 / Math.max(120, r*1.5, n*3);
}
function SFr(radius, dist) { n = (max(0,dist)+max(0,radius))*1.25; return min(2e4, max(500, n)); }  // far
function AFr(t) { return (!isFinite(t)||t<=0) ? 500 : max(500, t*2); }
function CFr(far, minBoxDist=Infinity) { return max(0.1, min(far/5000, minBoxDist*0.5)); }          // near
function vje(meshes) {  // bounds: union Box3 of all meshes w/ parent; boxes list excludes camera/target/group kinds
  sphere = unionBox.getBoundingSphere();
  return {centre, radius, boxes, ...OFr(boxes, centre)};
}
function OFr(boxes, centre) {  // focus = per-axis MEDIAN of box centers; spread90/95 = 90/95th pct of horiz distance
}
function pZt({meshById, camera, scene, now}) {
  let bounds=null, last=-Inf;
  tick() {
    if (now()-last >= 400) { last=now(); bounds=vje(meshById.values()); }
    density = FFr(bounds, camera.position); scene.fog instanceof FogExp2 && (scene.fog.density = density);
    far = min(2e4, max(bounds?SFr(bounds.radius, cam.distanceTo(bounds.centre)):500, 2.5/density));
    near = CFr(far, bounds?minBoxDistanceToCam:Infinity);
    if ((far > cam.far*1.1 || far < cam.far/1.1) || (near > cam.near*1.1 || near < cam.near/1.1)) {
      cam.far=far; cam.near=near; cam.updateProjectionMatrix();
    }
  }
  return {tick, fitNow: ()=>{last=-Inf; tick()}, bounds};
}
```

## Spotlight subsystem @~5,435,700
```js
Cat=1024 /*shadow map*/, VFr=.2 /*near*/, UFr=60 /*far*/, zFr=-4e-4 /*bias*/, WFr=.02 /*normalBias*/,
GFr=1, qFr=6, ZFr=.05, KFr=.9, nre=1/(Math.SQRT2*1.06), Yx=128 /*cookie size*/, Eat=10 /*diffusion steps*/,
XFr=.45, YFr=16769955 /*0xFFEE4B beam color*/, jat=7 /*beam length*/, QFr=.02, JFr=.07;
nOr = 2895152 /*lamp mesh color*/
function rOr() { lamp = new Mesh(CylinderGeometry(.14,.16,.36,20) rotated X+90°, MeshStandardMaterial({color:nOr, roughness:.5})); }
function sOr(lamp=new Group) {  // spotlight object construction
  holder = new Group;
  light = new SpotLight(0xffffff, 0, 0, Rhe(holder.scale) /*angle from scale — frustum marker fn*/, 0 /*penumbra*/, 2 /*decay*/);
  light.position.set(0,0,0); light.target.position.set(0,0,-1);
  light.shadow.mapSize.set(1024,1024); light.shadow.camera.near=.2; far=60; bias=-4e-4; normalBias=.02;
  holder.add(light, light.target, lamp); holder.userData.spotlight = {light, lamp};
}
// diffusion cookie iOr(shape, diffusion 0..100): 128×128 L8 texture; 10 steps; radius XFr=.45·nre;
//   round: radial distance, square: Chebyshev; smoothstep falloff; cached by (shape, step).
// intensity multiplier `_8r`=2.4 (from prior audit; verify), beam cone visual length 7, color 0xFFEE4B.
```

## Selection-related constants seen @~5,438,900 (to chase in UX extraction)
`fOr=Set("humanoid","simple_figure")` (shadow casters?), `dOr=30, uOr=.163, Oat=16, hOr=1.15, pOr=4, mOr=1.5, gOr=1/.15, bOr=.3, Lat=.1`
`kOr/Bat`: snap-to-grid basis alignment. `TOr`: 4096 Float64 buffer + dirty flag (plan canvas path? drag recorder?).

## CORRECTION (verified in live browser round-trip)
The hex comments in the first version of this doc (and the prior audit's full-day hexes
0xdfdcf0/0xe8b890/0xe7c39b/0xd0d1d2/0xffd69e) were WRONG conversions. The DECIMALS from the
bundle are the byte-exact ground truth. Correct hexes:
- DFr full-day: zenith 0xDFE5F0, horizon 0xE8EBF0, fillSky 0xE6EBFB, fillGround 0xD0D1DA, sunColor 0xFFF7EE
- HY stops (zenith): 0x05070F, 0x0D1630, 0x1C2748, 0x3A4A78, 0x93A9CC, 0xD6DFEC, (32°=full-day)
- HY stops (horizon): 0x0B1120, 0x28365E, 0x8A6F8C, 0xE0987C, 0xF7CDA6, 0xF2E5D6, 0xE8EBF0
- HY stops (fillSky): 0x3F4F80, 0x5168AD, 0x737CB4, 0x8F92C4, 0xCFC6DE, 0xDDE0EE, 0xE6EBFB
- HY stops (fillGround): 0x12161F, 0x1D2233, 0x35303F, 0x5F4C54, 0xB89A84, 0xCABFB2, 0xD0D1DA
- HY stops (sunColor): 0xB4C8F5, 0xA9BDEC, 0xFF8A54, 0xFF8A54, 0xFFA964, 0xFFDCB4, 0xFFF7EE
- floor lOr 0xD4D5D9, glow emissive cOr 0xFFC98A, lamp nOr 0x2C2D30, beam YFr 0xFFE3A3, dusk Aat 0xFF8A54
Browser-verified at default light (128.66°/57.38°): sky zenith #dfe5f0, horizon #e8ebf0, hemi 1.7, sun 2.15.
