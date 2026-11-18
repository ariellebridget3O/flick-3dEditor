// finish.js — the "Finish" stylized render: golden-angle SSAO + separable blur + fog-aware
// composite (occlusion tint + crease edges + sRGB + triangular dither), SOFT_TERMINATOR
// light patch, capability probe, auto-measure, localStorage persistence.
// Exact port of hKt/DWr/BWr/HWr/Dje/qqr/Xqr/$ot/Hqr/Fje/oKt/wWr/lKt/_Wr/xWr/Mje/eKt
// (analysis/FINISH_RENDERER.md, raw: analysis/tmp_d/{finish_raw,finish_raw2,auto_measure}.js).
import * as THREE from 'three';

// ---------- constants (EWr…FWr, yKt, Bqr, $qr, Vqr, Wqr, Gqr, Zqr, Kqr) ----------
const OCCLUSION_MAX_H = 540;      // EWr
const OCCLUSION_SCALE = 0.5;      // jWr
const SSAO_RADIUS = 0.05;         // Lje
const SSAO_SAMPLES = 12;          // IWr
const OCCLUSION_TINT = new THREE.Color(0x626a8c);  // MWr (=6449804)
const EDGE_TINT = new THREE.Color(0.1, 0.11, 0.16); // NWr
const CREASE_STRENGTH = 0.15;     // PWr
const MSAA = 4;                   // cKt
const REALLOC_DEBOUNCE_MS = 150;  // RWr
const REPAINT_ASPECT_TOL = 0.05;  // FWr
const STORAGE_KEY = 'stage-finish'; // yKt
const COST_BUDGET_MS = 11;        // Bqr
const REFERENCE_PIXELS = 1920 * 1080; // $qr
const MIN_MEASURE_PIXELS = 320 * 200; // Vqr
const MEASURE_FRAMES = 5;         // Wqr
const MEASURE_WARM = 2;           // Gqr
const FIRST_CHECK_FRAME = 30;     // Zqr
const RETRY_INTERVAL_FRAMES = 300; // Kqr
const MAX_RETRIES = 2;

// name-hint color sets (qHr/ZHr/KHr/XHr/YHr/QHr/JHr)
const GC = t => new RegExp(`(^|[_\\s-])(${t})([_\\s-]|\\d|$)`, 'i');
const GREEN = '#b7cbb6', BLUE = '#a9bbd8'; // qHr / ZHr
const PLANT_RE = GC('trees?|pines?|conifers?|shrubs?|bush(es)?|foliage|woodland|forest|grass|lawn|meadow|hedges?|moss|ivy|vines?|lea(f|ves)|ferns?|palms?|bamboo');
const PLANT_NOT_RE = GC('trunks?|branch(es)?|posts?|foundations?|stakes?|stumps?|logs?|dead|snow|snowy|rocks?');
const WATER_RE = GC('water|lake|river|sea|ocean|pond|pool|moat|canal|stream');
const WATER_NOT_RE = GC('edges?|rims?|walls?|banks?|embankments?|bridges?|decks?|decking|sides?|boats?|boathouses?|piers?|rails?|railings?|towers?|tables?|rocks?');
const NAME_COLOR_KINDS = new Set(['cube', 'sphere', 'cylinder', 'prop']); // JHr

// glow detection (e$r/t$r/n$r/r$r + eKt)
const GLOW_RE = GC('lanterns?|lamps?|candles?|windows?|lancets?|stained[_\\s-]glass|glass[_\\s-]panes?|moons?');
const GLOW_NOT_RE = GC('frames?|mullions?|sills?|arch(es)?|recess(es)?|jambs?|posts?|poles?|bases?|caps?|roofs?|brackets?|stone|tracery|hoods?|moldings?|holders?|sticks?|wine');
const GLOW_TAIL_NOT_RE = GC('tables?|seats?|walls?|blinds?|cords?|chains?|handles?|feet|foot');
const GLOW_KINDS = new Set(['cube', 'sphere', 'cylinder']);
const GLOW_EMISSIVE = 16763274;   // cOr = 0xFFB90A
const PRIM_DEFAULT_COLOR = '#e2e0dc'; // pq
const PRIM_ROUGHNESS = 1;         // X_

// ---------- SOFT_TERMINATOR (Fje patch + oKt) ----------
const DOT_NL = 'float dotNL = saturate( dot( geometryNormal, directLight.direction ) );';
let patched = false;
export function patchSoftTerminator() {
  if (patched) return;
  const chunk = THREE.ShaderChunk.lights_physical_pars_fragment;
  if (!chunk.includes(DOT_NL)) { console.warn('SOFT_TERMINATOR: anchor not found in lights_physical_pars_fragment'); patched = true; return; }
  THREE.ShaderChunk.lights_physical_pars_fragment = chunk.replace(DOT_NL, `${DOT_NL}
    #ifdef SOFT_TERMINATOR
      dotNL = ( dotNL < 0.3 ? dotNL * dotNL / 0.6 : dotNL - 0.15 ) / 0.85;
    #endif`);
  patched = true;
}
export function applySoftTerminator(material) {  // oKt
  material.defines = { ...material.defines, SOFT_TERMINATOR: '' };
}

// ---------- primitives (xWr/wWr/lKt/_Wr) ----------
const BIG_THRESHOLD = 24;         // bWr
export function primitiveFamily(kind) {  // xWr
  return kind === 'sphere' || kind === 'cylinder' ? kind : 'cube';
}
export function primitiveGeometry(kind, big) {  // lKt
  let g;
  if (kind === 'sphere') g = new THREE.SphereGeometry(0.5, big ? 64 : 32, big ? 32 : 16); // yWr=[64,32]
  else if (kind === 'cylinder') g = new THREE.CylinderGeometry(0.5, 0.5, 1, big ? 96 : 24); // vWr=96, gWr=24
  else g = new THREE.BoxGeometry(1, 1, 1);
  return g.translate(0, 0.5, 0); // mWr=.5 — primitives are BASE-anchored
}
export function makePrimitive(kind, color) {  // wWr
  const mat = new THREE.MeshStandardMaterial({ color: color ?? PRIM_DEFAULT_COLOR, roughness: PRIM_ROUGHNESS });
  const soft = kind !== 'cube';
  if (soft) applySoftTerminator(mat);
  const mesh = new THREE.Mesh(primitiveGeometry(kind, false), mat);
  mesh.userData.softTerminator = soft;
  mesh.userData.primitiveKind = kind;
  return mesh;
}
export function bigPrimitiveSwap(mesh, scale) {  // _Wr
  const kind = mesh.userData.primitiveKind;
  if (!mesh.isMesh || !kind || kind === 'cube') return;
  const big = Math.max(...scale.map(Math.abs)) >= BIG_THRESHOLD;
  if (big !== !!mesh.userData.bigPrimitive) {
    mesh.userData.bigPrimitive = big;
    mesh.geometry.dispose();
    mesh.geometry = primitiveGeometry(kind, big);
  }
}

// ---------- name-based color / glow (Mje / eKt) ----------
export function nameColor(obj) {  // Mje
  if (!NAME_COLOR_KINDS.has(obj.kind)) return undefined;
  const name = obj.propKey ?? obj.name;
  if (!name) return undefined;
  const n = name.replace(/([a-z])([A-Z])/g, '$1_$2');
  if (PLANT_RE.test(n) && !PLANT_NOT_RE.test(n)) return GREEN;
  if (WATER_RE.test(n) && !WATER_NOT_RE.test(n)) return BLUE;
  return undefined;
}
export function glowsByName(obj) {  // eKt
  const { kind, name } = obj;
  if (!name || !GLOW_KINDS.has(kind) || GLOW_NOT_RE.test(name)) return false;
  const m = GLOW_RE.exec(name);
  return m ? !GLOW_TAIL_NOT_RE.test(name.slice(m.index + m[0].length - 1)) : false;
}
export const GLOW_EMISSIVE_HEX = GLOW_EMISSIVE;

// ---------- shared uniforms + shaders (LWr/uKt/DWr/BWr/HWr) ----------
const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`;
const VIEW_POS = `
  uniform sampler2D tDepth;
  uniform mat4 invProjection;
  vec3 viewPosition(vec2 uv) {
    float depth = texture2D(tDepth, uv).r;
    vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 view = invProjection * clip;
    return view.xyz / view.w;
  }`;
const SSAO_FRAG = `
  varying vec2 vUv;
  ${VIEW_POS}
  uniform vec2 texel;
  uniform vec2 radiusUv;
  const float RADIUS = ${SSAO_RADIUS.toFixed(3)};
  const int SAMPLES = ${SSAO_SAMPLES};
  const float GOLDEN_ANGLE = 2.39996323;
  // Below this, a sample is the surface's own curve, not something occluding it.
  const float SELF_BIAS = 0.2;

  float interleavedNoise(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
  }

  void main() {
    if (texture2D(tDepth, vUv).r >= 1.0) {
      gl_FragColor = vec4(1.0);
      return;
    }
    vec3 p = viewPosition(vUv);
    // Of the two neighbours on each axis, the nearer: the far one may be across an edge.
    vec3 left = p - viewPosition(vUv - vec2(texel.x, 0.0));
    vec3 right = viewPosition(vUv + vec2(texel.x, 0.0)) - p;
    vec3 down = p - viewPosition(vUv - vec2(0.0, texel.y));
    vec3 up = viewPosition(vUv + vec2(0.0, texel.y)) - p;
    vec3 normal = normalize(cross(
      dot(left, left) < dot(right, right) ? left : right,
      dot(down, down) < dot(up, up) ? down : up
    ));
    float reach = RADIUS * -p.z;
    float reachSquared = reach * reach;
    float angle = interleavedNoise(gl_FragCoord.xy) * 6.2831853;
    float occlusion = 0.0;
    for (int i = 0; i < SAMPLES; i++) {
      float along = (float(i) + 0.5) / float(SAMPLES);
      float a = float(i) * GOLDEN_ANGLE + angle;
      vec3 toSample = viewPosition(vUv + vec2(cos(a), sin(a)) * sqrt(along) * radiusUv) - p;
      float distanceSquared = dot(toSample, toSample);
      float falloff = clamp(1.0 - distanceSquared / reachSquared, 0.0, 1.0);
      occlusion += falloff * max(0.0, dot(toSample, normal) / sqrt(distanceSquared + 1e-6) - SELF_BIAS);
    }
    gl_FragColor = vec4(vec3(clamp(1.0 - 2.0 * occlusion / float(SAMPLES), 0.0, 1.0)), 1.0);
  }`;
const BLUR_FRAG = `
  varying vec2 vUv;
  ${VIEW_POS}
  uniform sampler2D tOcclusion;
  uniform vec2 direction;
  void main() {
    float depth0 = -viewPosition(vUv).z;
    float sum = texture2D(tOcclusion, vUv).r;
    float weight = 1.0;
    for (int i = 1; i <= 3; i++) {
      float gaussian = exp(-float(i * i) / 5.0);
      for (int side = -1; side <= 1; side += 2) {
        vec2 uv = vUv + direction * float(i * side);
        // Never across a depth edge, or occlusion bleeds onto what is behind.
        float w = gaussian * max(0.0, 1.0 - abs(-viewPosition(uv).z - depth0) / (depth0 * 0.03));
        sum += texture2D(tOcclusion, uv).r * w;
        weight += w;
      }
    }
    gl_FragColor = vec4(vec3(sum / weight), 1.0);
  }`;
const COMPOSITE_FRAG = `
  varying vec2 vUv;
  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform sampler2D tOcclusion;
  uniform sampler2D tBloom;      // round 13 (HDR): ½-res mip-composited bloom (bloom.js)
  uniform vec2 texel;
  uniform vec2 occlusionTexel;
  uniform float fogDensity;
  uniform float near;
  uniform float far;
  uniform vec3 occlusionTint;
  uniform vec3 edgeTint;
  uniform float uHdr;            // 1 = HDR path (linear add + ACES), 0 = exact SDR path
  uniform float uExposure;       // light.hdr.exposure (linear pre-tonemap multiplier)
  uniform float uBloomStrength;  // strength = light.hdr.bloom × C.HDR_BLOOM_STRENGTH_K

  // 1/z runs straight across any flat face in screen space, so its second difference
  // is zero on a face and non-zero only on a crease or a silhouette.
  float inverseZ(float depth) {
    return (far + depth * (near - far)) / (near * far);
  }

  vec3 toSrgb(vec3 c) {
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  }

  // round 13 (HDR): ACES filmic tone map — Stephen Hill's RRT+ODT fit, constants
  // verbatim from three r182 tonemapping_pars_fragment ACESFilmicToneMapping
  // (MIT, © three.js authors; the vendored build's chunk is the source of record).
  vec3 RRTAndODTFit(vec3 v) {
    vec3 a = v * (v + 0.0245786) - 0.000090537;
    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return a / b;
  }
  vec3 acesHill(vec3 color) {
    const mat3 ACESInputMat = mat3(
      vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
    const mat3 ACESOutputMat = mat3(
      vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
    color = ACESInputMat * color;
    color = RRTAndODTFit(color);
    color = ACESOutputMat * color;
    return clamp(color, 0.0, 1.0);
  }

  // One 8-bit level of triangular noise, per channel. Pale gradients change by less
  // than a level across many pixels and would show as coloured stripes; anything less
  // than this lets a step's edge show through as a change of texture.
  vec3 hash32(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
  }
  vec3 dither() {
    return (hash32(gl_FragCoord.xy) + hash32(gl_FragCoord.xy + 17.17) - 1.0) / 255.0;
  }

  void main() {
    vec3 color = texture2D(tColor, vUv).rgb;
    float depth = texture2D(tDepth, vUv).r;
    if (depth < 1.0) {
      float i0 = inverseZ(depth);
      float optical = fogDensity / i0;
      // Haze is in front of whatever is darkened, so the finish fades with it.
      float clearAir = exp(-optical * optical);

      float sum = 0.0;
      float weight = 0.0;
      for (int y = 0; y < 2; y++) for (int x = 0; x < 2; x++) {
        vec2 uv = vUv + (vec2(float(x), float(y)) - 0.5) * occlusionTexel;
        // Upsampled along surfaces, not across a depth edge.
        float w = 1.0 / (1e-3 + abs(inverseZ(texture2D(tDepth, uv).r) - i0) / i0);
        sum += texture2D(tOcclusion, uv).r * w;
        weight += w;
      }
      color *= mix(vec3(1.0), mix(occlusionTint, vec3(1.0), sum / weight), clearAir);

      float left = inverseZ(texture2D(tDepth, vUv - vec2(texel.x, 0.0)).r);
      float right = inverseZ(texture2D(tDepth, vUv + vec2(texel.x, 0.0)).r);
      float down = inverseZ(texture2D(tDepth, vUv - vec2(0.0, texel.y)).r);
      float up = inverseZ(texture2D(tDepth, vUv + vec2(0.0, texel.y)).r);
      float crease = max(abs(left + right - 2.0 * i0), abs(down + up - 2.0 * i0)) / i0;
      float line = smoothstep(0.004, 0.03, crease) * ${CREASE_STRENGTH.toFixed(3)};
      color *= mix(vec3(1.0), edgeTint, line * clearAir);
    }
    // round 13 (HDR): with uHdr the occlusion tint / crease edges above ran on the
    // linear HalfFloat scene color as before; bloom adds in LINEAR (mip-composited,
    // pre-scaled by strength in bloom.js's chain), then ACES × exposure rolls the
    // highlights off instead of clipping. uHdr = 0 keeps the exact SDR path below.
    if (uHdr > 0.5) {
      color += texture2D(tBloom, vUv).rgb * uBloomStrength;
      color = acesHill(color * uExposure);
    }
    gl_FragColor = vec4(toSrgb(clamp(color, 0.0, 1.0)) + dither(), 1.0);
    // Kept for whatever draws after this, depth tested against the set.
    gl_FragDepth = depth;
  }`;

// ---------- resize debounce (dKt) ----------
function makeSizeLatch(intervalMs, now = () => performance.now()) {  // dKt
  let lastW = 0, lastH = 0, lastChange = -Infinity;
  return (w, h, exists) => {
    if (w !== lastW || h !== lastH) { lastW = w; lastH = h; lastChange = now(); }
    return !exists || now() - lastChange >= intervalMs;
  };
}
function occlusionSize(w, h) {  // OWr
  const n = Math.min(OCCLUSION_SCALE, OCCLUSION_MAX_H / h);
  return [Math.max(1, Math.round(w * n)), Math.max(1, Math.round(h * n))];
}

// ---------- composer (hKt) ----------
export function createFinishComposer(renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  scene.add(quad);

  const shared = { tDepth: { value: null }, invProjection: { value: new THREE.Matrix4() } };
  const makeMat = (frag, uniforms, extra = {}) => new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: frag,
    depthTest: false, depthWrite: false,
    uniforms: { ...shared, ...uniforms }, ...extra,
  });
  const ssao = makeMat(SSAO_FRAG, { texel: { value: new THREE.Vector2() }, radiusUv: { value: new THREE.Vector2() } });
  const blur = makeMat(BLUR_FRAG, { tOcclusion: { value: null }, direction: { value: new THREE.Vector2() } });
  const composite = makeMat(COMPOSITE_FRAG, {
    tColor: { value: null }, tOcclusion: { value: null },
    texel: { value: new THREE.Vector2() }, occlusionTexel: { value: new THREE.Vector2() },
    fogDensity: { value: 0 }, near: { value: 0.1 }, far: { value: 500 },
    occlusionTint: { value: OCCLUSION_TINT }, edgeTint: { value: EDGE_TINT },
    tBloom: { value: null }, uHdr: { value: 0 }, uExposure: { value: 1 }, uBloomStrength: { value: 0 },
  }, { depthTest: true, depthFunc: THREE.AlwaysDepth, depthWrite: true });

  let rtScene = null, rtA = null, rtB = null, rtBloom = null;
  let lastAspect = 0;
  const sizeLatch = makeSizeLatch(REALLOC_DEBOUNCE_MS);

  const release = () => {  // f
    rtScene?.depthTexture?.dispose();
    rtScene?.dispose();
    rtA?.dispose(); rtB?.dispose();
    rtBloom?.dispose();
    rtScene = rtA = rtB = rtBloom = null;
  };
  const alloc = (w, h) => {  // g
    const needResize = !rtScene || rtScene.width !== w || rtScene.height !== h;
    if (!sizeLatch(w, h, rtScene !== null) || !needResize) return;
    release();
    rtScene = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType, samples: Math.min(MSAA, renderer.capabilities.maxSamples),
      depthTexture: new THREE.DepthTexture(w, h, THREE.UnsignedIntType),
    });
    const [ow, oh] = occlusionSize(w, h);
    const opt = { format: THREE.RedFormat, type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    rtA = new THREE.WebGLRenderTarget(ow, oh, opt);
    rtB = new THREE.WebGLRenderTarget(ow, oh, opt);
    // round 13 (HDR): the ½-res bloom texture is allocated LAZILY ONLY when hdr is on
    // (see ensureBloom) so the default path never pays for it; release() frees all.
  };
  const bloomSize = (w, h) => [Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2))];
  const ensureBloom = (w, h) => {
    const [bw, bh] = bloomSize(w, h);
    if (rtBloom && rtBloom.width === bw && rtBloom.height === bh) return;
    rtBloom?.dispose();
    rtBloom = new THREE.WebGLRenderTarget(bw, bh, {
      type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false,
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    });
  };
  const blit = (material, target) => {  // b
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
  };
  const bufSize = new THREE.Vector2();

  return {
    // hdrHook (round 13, optional): { run(tSrc, bloomTex, dt), strength, exposure } —
    // runs the bloom pre-pass over the resolved scene RT before the composite.
    render(mainScene, mainCamera, hdrHook = null) {
      renderer.getDrawingBufferSize(bufSize);
      if (bufSize.x === 0 || bufSize.y === 0) return;
      alloc(bufSize.x, bufSize.y);
      if (hdrHook) ensureBloom(bufSize.x, bufSize.y);
      else if (rtBloom) { rtBloom.dispose(); rtBloom = null; }   // hdr off → release lazily
      const k = rtScene, S = rtA, T = rtB;
      renderer.setRenderTarget(k);
      renderer.render(mainScene, mainCamera);
      lastAspect = mainCamera.aspect;
      let hdrTex = null;
      if (hdrHook && rtBloom) {
        renderer.setRenderTarget(rtBloom);
        renderer.clear();                     // deterministic even if the chain hasn't sized yet
        hdrHook.run(k.texture, rtBloom, 0);   // bloom pre-pass (dt unused — no temporal term)
        hdrTex = rtBloom.texture;
      }
      shared.tDepth.value = k.depthTexture;
      shared.invProjection.value.copy(mainCamera.projectionMatrixInverse);
      ssao.uniforms.texel.value.set(1 / S.width, 1 / S.height);
      const pe = mainCamera.projectionMatrix.elements;
      ssao.uniforms.radiusUv.value.set(SSAO_RADIUS * pe[0] * 0.5, SSAO_RADIUS * pe[5] * 0.5);
      blit(ssao, S);
      blur.uniforms.tOcclusion.value = S.texture;
      blur.uniforms.direction.value.set(1 / S.width, 0);
      blit(blur, T);
      blur.uniforms.tOcclusion.value = T.texture;
      blur.uniforms.direction.value.set(0, 1 / S.height);
      blit(blur, S);
      const cu = composite.uniforms;
      cu.tColor.value = k.texture;
      cu.tOcclusion.value = S.texture;
      cu.texel.value.set(1 / k.width, 1 / k.height);
      cu.occlusionTexel.value.set(1 / S.width, 1 / S.height);
      cu.fogDensity.value = mainScene.fog instanceof THREE.FogExp2 ? mainScene.fog.density : 0;
      cu.near.value = mainCamera.near;
      cu.far.value = mainCamera.far;
      cu.tBloom.value = hdrTex;
      cu.uHdr.value = hdrTex ? 1 : 0;
      cu.uBloomStrength.value = hdrTex ? hdrHook.strength : 0;
      cu.uExposure.value = hdrTex ? hdrHook.exposure : 1;
      blit(composite, null);
    },
    repaint(mainCamera) {  // re-composite only (aspect-stable)
      if (!rtScene || Math.abs(mainCamera.aspect / lastAspect - 1) > REPAINT_ASPECT_TOL) return false;
      blit(composite, null);
      return true;
    },
    release,
    dispose() { release(); ssao.dispose(); blur.dispose(); composite.dispose(); quad.geometry.dispose(); },
  };
}

// ---------- capability probe (Dje) ----------
const capabilityCache = new WeakMap();
export function finishCapable(renderer) {
  const cached = capabilityCache.get(renderer);
  if (cached !== undefined) return cached;
  const gl = renderer.getContext();
  if (gl.isContextLost()) return false;
  const rts = [
    new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: Math.min(MSAA, renderer.capabilities.maxSamples), depthTexture: new THREE.DepthTexture(4, 4, THREE.UnsignedIntType) }),
    new THREE.WebGLRenderTarget(4, 4, { format: THREE.RedFormat, type: THREE.HalfFloatType, depthBuffer: false }),
  ];
  const prev = renderer.getRenderTarget();
  let ok = true;
  try {
    ok = rts.every(rt => { renderer.setRenderTarget(rt); return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE; });
  } catch { ok = false; }
  renderer.setRenderTarget(prev);
  for (const rt of rts) { rt.depthTexture?.dispose(); rt.dispose(); }
  capabilityCache.set(renderer, ok);
  return ok;
}

// ---------- persistence ($ot / Hqr) ----------
export function readFinishPref(storage = window.localStorage) {  // $ot
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { enabled, source } = JSON.parse(raw);
    if (typeof enabled !== 'boolean' || (source !== 'auto' && source !== 'manual')) return null;
    return { enabled, source };
  } catch { return null; }
}
export function writeFinishPref(pref, storage = window.localStorage) {  // Hqr
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(pref)); } catch { /* ignore */ }
}

// ---------- auto-measure (qqr + zqr + Xqr) ----------
export function measureFinish({ drawPlain, drawFinished, finishGpu, pixels, now = () => performance.now() }) {  // qqr
  const time = fn => { const t0 = now(); fn(); finishGpu(); return now() - t0; };
  for (let i = 0; i < MEASURE_WARM; i++) { time(drawPlain); time(drawFinished); }
  const plain = [], finished = [];
  for (let i = 0; i < MEASURE_FRAMES; i++) { plain.push(time(drawPlain)); finished.push(time(drawFinished)); }
  const median = a => a.sort((x, y) => x - y)[a.length >> 1];
  const plainMs = median(plain);
  return { costMs: Math.max(0, median(finished) - plainMs), plainMs, pixels };
}
export function costWithinBudget(m) {  // zqr
  return m.costMs * Math.max(1, REFERENCE_PIXELS / m.pixels) <= COST_BUDGET_MS;
}
export function validMeasurementSize(pixels) {  // Uqr
  return pixels >= MIN_MEASURE_PIXELS;
}
export function createAutoMeasureScheduler() {  // Xqr
  let frame = 0, next = FIRST_CHECK_FRAME, failures = 0;
  return {
    frame: () => ++frame >= next,
    report: m => costWithinBudget(m) ? true : (++failures >= MAX_RETRIES ? false : (next = frame + RETRY_INTERVAL_FRAMES, null)),
  };
}
