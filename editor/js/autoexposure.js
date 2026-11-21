// autoexposure.js — r23 L1 (the AAA step the user asked for): EYE ADAPTATION.
// "no auto tone-map from outdoor to indoor" — the finish pipeline rendered at a FIXED
// uExposure, so an interior framed after a bright exterior stayed under-exposed (and
// vice versa). This module meters the scene and adapts exposure over ~0.8 s.
//
// DESIGN (GPU-only, ZERO CPU readback — the UE-style architecture):
//   · meter the LINEAR HalfFloat scene RT (the same buffer the bloom high-pass reads);
//   · reduction chain 64→16→4→1: pass 1 computes CENTER-WEIGHTED log-luminance
//     (log-average is robust to the sun disc blowing out the meter; the radial weight
//     ~2·(1−r²) favors the middle of the frame over the edges, like a camera's
//     evaluative metering), the rest average down, the tail exp()s back to luminance;
//   · ADAPTATION pass: ping-pong 1×1 — adapted = mix(prev, target, 1 − exp(−dt·speed))
//     (exponential time constant 1/speed; speed 1.2 ≈ 0.8 s to ~63% — responsive in
//     previz, slow enough to READ as adaptation when walking in/out of a building);
//   · the finish composite samples the 1×1 texture and derives
//       exposureAuto = clamp(KEY / max(adaptedLum, 1e-4), EVMIN, EVMAX)
//     multiplied by the MANUAL exposure slider (the slider becomes the bias).
//   · KEY is calibrated so the default outdoor scene meters exposure ≈ 1.0 (the fixed
//     default) — the look does not jump when auto turns on outdoors; interiors gain
//     up to ~2 stops. EVMIN/EVMAX bound the adaptation (a pitch-black night never
//     amplifies to full grey — night stays night).
// The plain fallback path (hdr on, finish off — three's own ACES) keeps the MANUAL
// exposure: the renderer's toneMappingExposure is a CPU number; a GPU-texture exposure
// would need a readback stall (documented divergence between the two HDR paths).
import * as THREE from 'three';

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`;

// pass 1 (64×64): center-weighted log-luminance from the scene RT
const METER_FRAG = `
  varying vec2 vUv;
  uniform sampler2D tSrc;
  void main() {
    vec3 c = max(texture2D(tSrc, vUv).rgb, vec3(0.0));
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float r = length(vUv - vec2(0.5));
    float w = 1.0 - 0.6 * min(r * r * 2.0, 1.0);     // 1.0 center → 0.4 corners
    gl_FragColor = vec4(w * log(lum + 1e-4), 1.0, 1.0, 1.0);
  }`;

// reduction: plain average of the (already weighted) log-luminance
const REDUCE_FRAG = `
  varying vec2 vUv;
  uniform sampler2D tSrc;
  void main() {
    vec4 a = texture2D(tSrc, vUv + vec2(-1.0, -1.0) * 0.25);
    vec4 b = texture2D(tSrc, vUv + vec2( 1.0, -1.0) * 0.25);
    vec4 c = texture2D(tSrc, vUv + vec2(-1.0,  1.0) * 0.25);
    vec4 d = texture2D(tSrc, vUv + vec2( 1.0,  1.0) * 0.25);
    gl_FragColor = 0.25 * (a + b + c + d);
  }`;

// tail: exp back to luminance (log-average), then the temporal blend with the previous
// adapted value (1×1 ping-pong) — both in one draw: out = mix(prev, exp(avgLog), k)
const ADAPT_FRAG = `
  varying vec2 vUv;
  uniform sampler2D tSrc;       // the 1×1 log-average
  uniform sampler2D tPrev;      // the previous adapted luminance (ping-pong)
  uniform float uK;             // 1 - exp(-dt * speed)
  void main() {
    float avgLog = texture2D(tSrc, vUv).r;
    float target = exp(avgLog);
    float prev = texture2D(tPrev, vUv).r;
    gl_FragColor = vec4(mix(prev, target, uK), 1.0, 1.0, 1.0);
  }`;

export function createAutoExposure({ renderer, speed = 1.2 }) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  scene.add(quad);

  const meter = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: METER_FRAG,
    depthTest: false, depthWrite: false,
    uniforms: { tSrc: { value: null } },
  });
  const reduce = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: REDUCE_FRAG,
    depthTest: false, depthWrite: false,
    uniforms: { tSrc: { value: null } },
  });
  const adapt = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: ADAPT_FRAG,
    depthTest: false, depthWrite: false,
    uniforms: { tSrc: { value: null }, tPrev: { value: null }, uK: { value: 1.0 } },
  });

  const makeRT = (w, h) => new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false,
  });
  // 64 → 16 → 4 → 1
  const SIZES = [64, 16, 4, 1];
  let chain = [];          // [64, 16, 4] reduction targets (the 1×1 is the log-average)
  let lum1 = null;         // 1×1 log-average
  let adapted = [null, null];  // 1×1 ping-pong
  let which = 0;
  let primed = false;      // first frame: snap (k=1) so a fresh session starts adapted
  let lastT = -1;

  const alloc = () => {
    if (chain.length) return;
    chain = SIZES.slice(0, 3).map(s => makeRT(s, s));
    lum1 = makeRT(1, 1);
    adapted = [makeRT(1, 1), makeRT(1, 1)];
    primed = false;
  };
  const release = () => {
    for (const rt of [...chain, lum1, ...adapted]) rt?.dispose();
    chain = []; lum1 = null; adapted = [null, null]; primed = false;
  };
  const blit = (material, target) => {
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
  };

  return {
    // meters tSrc (the LINEAR HalfFloat scene RT) and advances the adaptation.
    // dt seconds; dt <= 0 (the finish hook's legacy hardcoded 0) → SELF-CLOCK from the
    // previous call, so the temporal blend works without touching the finish call sites.
    render(tSrc, dt) {
      if (!tSrc) return;
      alloc();
      const now = performance.now();
      if (!(dt > 0)) dt = lastT > 0 ? (now - lastT) / 1000 : 0;
      lastT = now;
      // 1. meter at 64×64 (center-weighted log-lum)
      meter.uniforms.tSrc.value = tSrc;
      blit(meter, chain[0]);
      // 2. reduce 64→16→4
      for (let i = 1; i < chain.length; i++) {
        reduce.uniforms.tSrc.value = chain[i - 1].texture;
        blit(reduce, chain[i]);
      }
      // 3. 4×4 log-average → the 1×1 log target
      reduce.uniforms.tSrc.value = chain[chain.length - 1].texture;
      blit(reduce, lum1);
      // 4. temporal adaptation (first frame snaps so a fresh boot is already adapted)
      const k = !primed || !(dt > 0) ? 1.0 : 1.0 - Math.exp(-dt * speed);
      primed = true;
      adapt.uniforms.tSrc.value = lum1.texture;
      adapt.uniforms.tPrev.value = adapted[which].texture;
      adapt.uniforms.uK.value = k;
      blit(adapt, adapted[1 - which]);
      which = 1 - which;
    },
    // debug readback for the E2E/calibration harness: the current adapted luminance as a
    // JS number (1×1 HalfFloat → RGBA8 /16 encode → readRenderTargetPixels). Not in the
    // frame path — call explicitly from tests.
    debugRead() {
      if (!adapted[which]) return null;
      const dbg = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: 'varying vec2 vUv; uniform sampler2D tSrc; void main() { float v = texture2D(tSrc, vUv).r; gl_FragColor = vec4(v / 16.0, 0.0, 0.0, 1.0); }',
        depthTest: false, depthWrite: false,
        uniforms: { tSrc: { value: adapted[which].texture } },
      });
      blit(mat, dbg);
      const px = new Uint8Array(4);
      renderer.readRenderTargetPixels(dbg, 0, 0, 1, 1, px);
      dbg.dispose(); mat.dispose();
      return px[0] * 16 / 255;   // ≈ the adapted luminance (8-bit precision, /16 range)
    },
    // the adapted-luminance texture (bind in the finish composite; 1×1 HalfFloat)
    get texture() { return adapted[which]?.texture ?? null; },
    dispose() {
      release();
      meter.dispose(); reduce.dispose(); adapt.dispose();
      quad.geometry.dispose();
    },
  };
}
