// env.js — environment port from live bundle (wOr/xOr/yOr/vOr/$Fr/M8r/SDe/pZt/vje/OFr/TOr).
// See analysis/ENVIRONMENT.md for the de-minified originals.
import * as THREE from 'three';
import { C } from './const.js';

const DEG = Math.PI / 180;

// ---------- daylight table interpolation ($Fr) ----------
const _ca = new THREE.Color(), _cb = new THREE.Color();
function lerpColor(a, b, t) { return new THREE.Color(a).lerp(_cb.set(b), t); }
export function daylightAt(elevationDeg) {
  const stops = C.DAYLIGHT_STOPS;
  let i = 0;
  while (i < stops.length - 2 && elevationDeg > stops[i + 1].elevationDeg) i++;
  const a = stops[i], b = stops[i + 1];
  const t = THREE.MathUtils.clamp((elevationDeg - a.elevationDeg) / (b.elevationDeg - a.elevationDeg), 0, 1);
  const lin = k => a[k] + (b[k] - a[k]) * t;
  const col = k => lerpColor(a[k], b[k], t);
  return {
    zenith: col('zenith'), horizon: col('horizon'), fillSky: col('fillSky'),
    fillGround: col('fillGround'), fill: lin('fill'), sunColor: col('sunColor'),
    sun: lin('sun'), glow: lin('glow'), flare: lin('flare'),
  };
}

// ---------- light normalize (SDe) ----------
export function normalizeLight(l) {
  if (!l) return { ...C.LIGHT_DEFAULT };
  const out = {
    azimuthDeg: ((l.azimuthDeg % 360) + 360) % 360,
    elevationDeg: Math.min(C.ELEV_MAX, Math.max(C.ELEV_MIN, l.elevationDeg)),
  };
  if (l.nightLights === false) out.nightLights = false;
  return out;
}

// ---------- sun direction (M8r) ----------
export function sunDirection(light) {
  const az = light.azimuthDeg * DEG;
  const el = (light.elevationDeg > C.EL_REMAP_EDGE
    ? Math.max(light.elevationDeg, C.EL_REMAP_MIN)
    : C.EL_REMAP_K - light.elevationDeg) * DEG;
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
}

// ---------- sky dome (xOr) ----------
const SKY_VERT = /* glsl */`
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    // Rotated with the view, never moved: the sky is at infinity. xyww puts it on
    // the far plane whatever the clip range is.
    vec4 clip = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
    gl_Position = clip.xyww;
  }`;
const SKY_FRAG = /* glsl */`
  varying vec3 vDirection;
  uniform vec3 zenith;
  uniform vec3 horizon;
  uniform vec3 flare;
  uniform vec3 flareDirection;
  void main() {
    vec3 direction = normalize(vDirection);
    float height = max(direction.y, 0.0);
    vec3 color = mix(horizon, zenith, pow(height, 0.55));
    // Kept off the horizon itself, where the sky has to match the haze exactly.
    color += flare * pow(max(dot(direction, flareDirection), 0.0), 7.0) * smoothstep(0.0, 0.06, height);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }`;

function makeSkyDome() {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false, // [A:F9] fog:false
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
      uniforms: {
        zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() },
        flare: { value: new THREE.Color() }, flareDirection: { value: new THREE.Vector3() },
      },
    }));
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.raycast = () => {};
  return mesh;
}

// ---------- spotlight diffusion cookie (iOr) ----------
const cookieCache = new Map();
export function diffusionCookie(shape, diffusion) {
  const step = Math.round(diffusion / 100 * C.SPOT_DIFFUSION_STEPS);
  const key = `${shape}:${step}`;
  if (cookieCache.has(key)) return cookieCache.get(key);
  const S = C.SPOT_COOKIE_SIZE, data = new Uint8Array(S * S * 4);
  const r0 = step / C.SPOT_DIFFUSION_STEPS * C.SPOT_COOKIE_RADIUS_K * C.SPOT_NRE;
  const lo = C.SPOT_NRE - r0 / 2, hi = C.SPOT_NRE + r0 / 2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = (x + .5) / S * 2 - 1, v = (y + .5) / S * 2 - 1;
    const d = shape === 'square' ? Math.max(Math.abs(u), Math.abs(v)) : Math.hypot(u, v);
    const raw = hi > lo ? (d - lo) / (hi - lo) : (d < lo ? 0 : 1);
    const k = Math.min(1, Math.max(0, raw));
    const val = Math.round(255 * (1 - k * k * (3 - 2 * k)));
    const i = (y * S + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = val; data[i + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, S, S);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  cookieCache.set(key, tex);
  return tex;
}

// ---------- environment (wOr) ----------
export function createEnvironment(scene, settings) {
  const sky = makeSkyDome();
  scene.add(sky);
  scene.fog = new THREE.FogExp2(0xffffff, 0);
  const hemi = new THREE.HemisphereLight();
  scene.add(hemi);
  const sun = new THREE.DirectionalLight();
  sun.castShadow = true;
  const mapPx = Math.min(C.SHADOW_MAP_PX, settings.renderer.capabilities.maxTextureSize);
  sun.shadow.mapSize.set(mapPx, mapPx);
  sun.shadow.radius = C.SUN_RADIUS;
  scene.add(sun, sun.target);

  // Floor: PlaneGeometry(80000², 128²) — raycast via a segment-free proxy (fast floor picking).
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(C.FLOOR_SIZE, C.FLOOR_SIZE, C.FLOOR_SEGS, C.FLOOR_SEGS),
    new THREE.MeshStandardMaterial({
      color: C.FLOOR_COLOR, roughness: C.FLOOR_ROUGHNESS,
      polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4,   // bundle: factor 4 (audit 2-c)
    }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const floorProxy = new THREE.Mesh(new THREE.PlaneGeometry(C.FLOOR_SIZE, C.FLOOR_SIZE));
  floor.raycast = (raycaster, intersects) => {
    floorProxy.matrixWorld.copy(floor.matrixWorld);
    const n = intersects.length;
    floorProxy.raycast(raycaster, intersects);
    for (let i = n; i < intersects.length; i++) intersects[i].object = floor;
  };
  scene.add(floor);

  let lastAz = NaN, lastEl = NaN, glow = 0;
  function applyDaylight(light) {
    const glowAmount = () => light.nightLights === false ? 0 : glow;
    if (light.azimuthDeg === lastAz && light.elevationDeg === lastEl) return glowAmount();
    lastAz = light.azimuthDeg; lastEl = light.elevationDeg;
    const g = daylightAt(light.elevationDeg);
    hemi.color.copy(g.fillSky); hemi.groundColor.copy(g.fillGround); hemi.intensity = g.fill;
    sun.color.copy(g.sunColor); sun.intensity = g.sun;
    scene.fog.color.copy(g.horizon);
    const u = sky.material.uniforms;
    u.zenith.value.copy(g.zenith); u.horizon.value.copy(g.horizon);
    u.flare.value.copy(g.sunColor).multiplyScalar(g.flare);
    const az = light.azimuthDeg * DEG, el = Math.max(light.elevationDeg, 0) * DEG;
    u.flareDirection.value.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    glow = g.glow;
    return glowAmount();
  }

  // walkableSurfaces (Dqr.d): floor + meshes not in {camera,target,spotlight,humanoid,simple_figure,group}
  const NOT_WALKABLE = new Set(['camera', 'target', 'spotlight', 'humanoid', 'simple_figure', 'group']);
  function walkableSurfaces() {
    const list = [floor];
    const map = settings.getMeshById ? settings.getMeshById() : settings.meshById;
    for (const m of map.values())
      if (!NOT_WALKABLE.has(m.userData.kind)) list.push(m);
    return list;
  }

  return { sky, floor, sun, hemi, applyDaylight, walkableSurfaces, shadowMapPx: mapPx };
}

// ---------- bounds (vje/OFr) ----------
const median = arr => arr[arr.length >> 1];
export function computeBounds(meshes) {
  const union = new THREE.Box3(); const boxes = [];
  const exclude = new Set(C.BOUNDS_EXCLUDE_KINDS);
  for (const m of meshes) {
    if (!m.parent) continue;
    const box = new THREE.Box3().setFromObject(m);
    if (box.isEmpty()) continue;
    union.union(box);
    if (!exclude.has(m.userData.kind)) boxes.push(box);
  }
  if (union.isEmpty()) return null;
  const sphere = union.getBoundingSphere(new THREE.Sphere());
  if (!Number.isFinite(sphere.radius)) return null;
  return { centre: sphere.center, radius: sphere.radius, boxes, ...spreadStats(boxes, sphere.center) };
}
function spreadStats(boxes, centre) {
  if (boxes.length === 0) return { focus: centre.clone(), spread90: 0, spread95: 0 };
  const centers = boxes.map(b => b.getCenter(new THREE.Vector3()));
  const axis = a => centers.map(c => c[a]).sort((x, y) => x - y);
  const focus = new THREE.Vector3(median(axis('x')), median(axis('y')), median(axis('z')));
  const dists = centers.map(c => Math.hypot(c.x - focus.x, c.z - focus.z)).sort((a, b) => a - b);
  const pct = p => dists[Math.min(dists.length - 1, Math.floor(dists.length * p))];
  return { focus, spread90: pct(0.9), spread95: pct(0.95) };
}

// ---------- dynamic fog / near / far (pZt + FFr/SFr/CFr) ----------
export function createFogNearFar({ getMeshes, camera, scene, renderer }) {
  let bounds = null, last = -Infinity;
  const density = () => fogDensity(bounds, camera.position);
  function fogDensity(b, camPos) {
    const n = b ? camPos.distanceTo(b.focus) : camPos.length();
    const r = n + (b?.spread95 ?? 0);
    return C.FOG_DENSITY_NUM / Math.max(C.FOG_D1, r * C.FOG_D2, n * C.FOG_D3);
  }
  function farFrom(b, camPos) {
    const n = (Math.max(0, camPos.distanceTo(b.centre)) + Math.max(0, b.radius)) * C.FOG_K;
    return Number.isFinite(n) ? Math.min(C.FOG_FAR_CAP, Math.max(C.FAR_FALLBACK, n)) : C.FAR_FALLBACK;
  }
  function nearFrom(far, minBoxDist = Infinity) {
    return Math.max(C.NEAR_MIN, Math.min(far / (C.FAR_FALLBACK / C.NEAR_MIN), minBoxDist * C.NEAR_CAP_K));
  }
  function tick(now = performance.now()) {
    if (now - last >= C.BOUNDS_INTERVAL_MS) { last = now; bounds = computeBounds(getMeshes()); }
    const d = fogDensity(bounds, camera.position);
    if (scene.fog && scene.fog.isFogExp2) scene.fog.density = d;
    let far = bounds ? farFrom(bounds, camera.position) : C.FAR_FALLBACK;
    far = Math.min(C.FOG_FAR_CAP, Math.max(far, C.FAR_DENSITY_K / d));
    let minBox = Infinity;
    if (bounds) for (const b of bounds.boxes) minBox = Math.min(minBox, b.distanceToPoint(camera.position));
    const near = nearFrom(far, minBox);
    const h = (v, ref) => v > ref * C.HYSTERESIS || v < ref / C.HYSTERESIS;
    if (h(far, camera.far) || h(near, camera.near)) {
      camera.far = far; camera.near = near; camera.updateProjectionMatrix();
    }
  }
  return {
    tick, density,
    fitNow() { last = -Infinity; tick(); },
    bounds: () => bounds,
  };
}

// ---------- shadow fingerprint + fit (TOr/kOr/Bat) ----------
export function createShadowFit({ sun, applyDaylight, getLight, bounds, roots, meshById }) {
  let buf = new Float64Array(4096), n = 0, dirty = true, lastN = -1;
  const push = v => {
    if (n === buf.length) { const b = new Float64Array(buf.length * 2); b.set(buf); buf = b; }
    if (buf[n] !== v) { buf[n] = v; dirty = true; }
    n++;
  };
  const casterKinds = new Set(C.SHADOW_CASTER_KINDS);
  const box = new THREE.Box3(), tmpBox = new THREE.Box3();
  function walk(obj, glow) {
    // fingerprint every mesh; set cast/receive; apply night glow emissive
    if (!obj) return;
    // f(): id, visible, position(3), quaternion(4 incl w), scale(3) — full TRS or stale shadows
    push(obj.id); push(obj.visible ? 1 : 0);
    if (obj.position) { push(obj.position.x); push(obj.position.y); push(obj.position.z); }
    if (obj.quaternion) { push(obj.quaternion.x); push(obj.quaternion.y); push(obj.quaternion.z); push(obj.quaternion.w); }
    if (obj.scale) { push(obj.scale.x); push(obj.scale.y); push(obj.scale.z); }
    const spot = obj.userData?.spotlight;
    if (spot) { push(spot.light.castShadow ? 1 : 0); push(spot.light.angle); return; }
    if (obj.isMesh) {
      const notBasic = !obj.material?.isMeshBasicMaterial;
      obj.castShadow = notBasic; obj.receiveShadow = notBasic;
      if (obj.userData.glows && obj.material) {
        const m = obj.material;
        if (m.userData.glowAt !== glow) {
          m.userData.glowAt = glow;
          m.emissive?.setHex(C.GLOW_EMISSIVE); m.emissiveIntensity = glow;
        }
      }
    }
    for (const c of obj.children) walk(c, glow);
  }
  const _up = new THREE.Vector3(0, 1, 0), _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3();
  function snapToGrid(v, dir, step) { // kOr: snap centre onto texel grid in plane ⟂ sun
    _e1.crossVectors(_up, dir);
    if (_e1.lengthSq() < 1e-8) _e1.set(1, 0, 0);
    _e1.normalize();
    _e2.crossVectors(dir, _e1).normalize();
    snapAxis(v, _e1, step); snapAxis(v, _e2, step);
  }
  function snapAxis(v, e, step) { // Bat
    const d = v.dot(e);
    v.addScaledVector(e, Math.round(d / step) * step - d);
  }
  const focus = new THREE.Vector3(), dir = new THREE.Vector3(), sphere = new THREE.Sphere();
  function fit() {
    n = 0; box.makeEmpty();
    const glow = applyDaylight(getLight());
    for (const root of roots()) {
      walk(root, glow);
      if (casterKinds.has(root.userData.kind) && root.parent) box.union(tmpBox.setFromObject(root));
    }
    const b = bounds();
    focus.copy(b ? b.focus : new THREE.Vector3(0, 0, 0));
    let v = (b?.spread90 ?? 0) * C.SHADOW_SPREAD_K;
    const mapSize = sun.shadow.mapSize.x;
    const texelWorld = C.SHADOW_TEXEL_K * mapSize / 2;
    if (!box.isEmpty()) {
      box.expandByScalar(C.SHADOW_EXPAND).getBoundingSphere(sphere);
      const reach = focus.distanceTo(sphere.center) + sphere.radius;
      if (reach <= texelWorld) v = Math.max(v, reach);
      else { focus.copy(sphere.center); v = sphere.radius; }
    }
    const w = Math.min(texelWorld, Math.max(C.SHADOW_MIN_EXTENT, Math.ceil(v / C.SHADOW_SNAP) * C.SHADOW_SNAP));
    dir.copy(sunDirection(getLight()));
    snapToGrid(focus, dir, 2 * w / mapSize);
    const S = w * 2;
    sun.target.position.copy(focus); sun.target.updateMatrixWorld();
    sun.position.copy(focus).addScaledVector(dir, S);
    const far = S + w + Math.max(0, (focus.y + w) / dir.y);
    const cam = sun.shadow.camera;
    const normalBias = Math.min(C.SHADOW_NORMALBIAS_MAX,
      C.SHADOW_NORMALBIAS_K * 2 * w / mapSize * Math.min(C.SHADOW_NORMALBIAS_K2, 1 / dir.y));
    if (cam.right !== w || cam.far !== far || sun.shadow.normalBias !== normalBias) {
      cam.left = cam.bottom = -w; cam.right = cam.top = w;
      cam.near = C.SHADOW_NEAR; cam.far = far;
      sun.shadow.bias = -0.005 / (far - C.SHADOW_NEAR);
      sun.shadow.normalBias = normalBias;
      cam.updateProjectionMatrix();
    }
    // TOr tail: fingerprint the sun fit itself, then report changed = dirty || count-changed.
    // NOTE (live parity): the WALK RUNS EVERY CALL — `dirty` only means "values changed since
    // last walk", never "walk pending". Gating the walk behind dirty (our old bug) meant scene
    // changes were never detected at all after the first steady frame — shadows never updated.
    push(sun.position.x); push(sun.position.z); push(w); push(far);
    const changed = dirty || n !== lastN;
    dirty = false; lastN = n;
    return changed;
  }
  return {
    tick() { return fit(); },          // walk + fit EVERY frame (live TOr closure)
    force() { dirty = true; },         // next tick reports changed (bump AOr generation)
    // AOr: generation bump on change → renderer.shadowMap.needsUpdate (+ context-restored)
    tickAOr(renderer) {
      if (this.tick()) this._gen = (this._gen ?? 0) + 1;
      if (this._aorGen?.get(renderer) !== this._gen) {
        if (!this._aorGen) {
          this._aorGen = new WeakMap();
          renderer.domElement.addEventListener('webglcontextrestored', () => this._aorGen.delete(renderer));
        }
        this._aorGen.set(renderer, this._gen);
        renderer.shadowMap.needsUpdate = true;
      }
    },
  };
}
