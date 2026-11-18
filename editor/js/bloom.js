// bloom.js — the HDR bloom chain (round 13): clean-room port of the three.js
// UnrealBloomPass recipe (examples/jsm/postprocessing/UnrealBloomPass.js +
// shaders/LuminosityHighPassShader.js, © 2010-2025 three.js authors, MIT —
// recipe values cited per-function below; the pass is NOT imported, per the
// offline-port house style). Deviations from the pass (design-of-record):
//   · the chain WRITES a ½-res bloom texture consumed by the finish composite —
//     no additive blend-to-screen pass (the composite owns the tone map);
//   · the strength multiply happens in the finish composite (uBloomStrength) —
//     the recipe's composite-level `bloomStrength` and its "3.0 for backwards
//     compatibility with previous alpha-based intensity" factor are dropped
//     because the UI-facing `bloom` slider is a direct 0..1 amount;
//   · kernel radii 3/5/7/9/11 (the recipe's pre-r182 kernelSizeArray) per the
//     design-of-record, keeping the chain ≈2.7 half-res equivalents.
// Cost: 1 high-pass + 5×2 separable Gaussian + 1 composite = 12 draws.
import * as THREE from 'three';
import { C } from './const.js';

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`;

// Pass 1 — luminance high-pass (LuminosityHighPassShader fragment, MIT recipe:
// `float v = luminance( texel.xyz );` with three's common luminance = dot(rgb,
// vec3(0.2126, 0.7152, 0.0722)); `float alpha = smoothstep( luminosityThreshold,
// luminosityThreshold + smoothWidth, v );` `gl_FragColor = mix( vec4( 0.0 ), texel, alpha );`
// with smoothWidth 0.01 (UnrealBloomPass constructor). The input is the finish
// HalfFloat scene RT, so the threshold compares LINEAR luminance.
// NAME: three r182 injects `float luminance( const in vec3 rgb )` (getLuminanceFunction)
// UNCONDITIONALLY into every ShaderMaterial fragment prefix — our own `luminance`
// collides (duplicate body → VALIDATE_STATUS false → the whole pass renders nothing,
// found r13: the "HDR look" was silently ACES-only). Renamed luminance → hpLum.
const HIGH_PASS_FRAG = `
  varying vec2 vUv;
  uniform sampler2D tSrc;
  uniform float uThreshold;
  float hpLum(vec3 rgb) {
    return dot(rgb, vec3(0.2126, 0.7152, 0.0722));
  }
  void main() {
    vec4 texel = texture2D(tSrc, vUv);
    float v = hpLum(texel.xyz);
    float alpha = smoothstep(uThreshold, uThreshold + 0.01, v);
    gl_FragColor = mix(vec4(0.0), texel, alpha);
  }`;

// Pass 2 — separable Gaussian (UnrealBloomPass._getSeparableBlurMaterial, MIT
// recipe): coefficients precomputed on the CPU as
//   `const sigma = kernelRadius / 3;`
//   `coefficients.push( 0.39894 * Math.exp( - 0.5 * i * i / ( sigma * sigma ) ) / sigma );`
// then `weightSum = gaussianCoefficients[0]`, and for i in 1..KERNEL_RADIUS-1:
//   `vec2 uvOffset = direction * invSize * x;` with mirrored taps summed.
// KERNEL_RADIUS = 3/5/7/9/11 across the mips (kernelSizeArray).
const BLUR_FRAG = `
  varying vec2 vUv;
  uniform sampler2D tSrc;
  uniform vec2 invSize;
  uniform vec2 direction;
  uniform float gaussianCoefficients[KERNEL_RADIUS];
  void main() {
    float weightSum = gaussianCoefficients[0];
    vec3 diffuseSum = texture2D(tSrc, vUv).rgb * weightSum;
    for (int i = 1; i < KERNEL_RADIUS; i++) {
      float x = float(i);
      float w = gaussianCoefficients[i];
      vec2 uvOffset = direction * invSize * x;
      vec3 sample1 = texture2D(tSrc, vUv + uvOffset).rgb;
      vec3 sample2 = texture2D(tSrc, vUv - uvOffset).rgb;
      diffuseSum += (sample1 + sample2) * w;
    }
    gl_FragColor = vec4(diffuseSum, 1.0);
  }`;

// Pass 3 — mip composite (UnrealBloomPass._getCompositeMaterial, MIT recipe):
//   `float mirrorFactor = 1.2 - factor; return mix( factor, mirrorFactor, bloomRadius );`
//   factors [1.0, 0.8, 0.6, 0.4, 0.2] (recipe bloomFactors), summed over the 5
//   blurred mips. bloomTintColors omitted (all-white default); strength applied
//   downstream by the finish composite (see header note).
const COMPOSITE_FRAG = `
  varying vec2 vUv;
  uniform sampler2D blurTexture1;
  uniform sampler2D blurTexture2;
  uniform sampler2D blurTexture3;
  uniform sampler2D blurTexture4;
  uniform sampler2D blurTexture5;
  uniform float uRadius;
  float lerpBloomFactor(const in float factor) {
    float mirrorFactor = 1.2 - factor;
    return mix(factor, mirrorFactor, uRadius);
  }
  void main() {
    vec3 bloom =
      lerpBloomFactor(1.0) * texture2D(blurTexture1, vUv).rgb +
      lerpBloomFactor(0.8) * texture2D(blurTexture2, vUv).rgb +
      lerpBloomFactor(0.6) * texture2D(blurTexture3, vUv).rgb +
      lerpBloomFactor(0.4) * texture2D(blurTexture4, vUv).rgb +
      lerpBloomFactor(0.2) * texture2D(blurTexture5, vUv).rgb;
    gl_FragColor = vec4(bloom, 1.0);
  }`;

const KERNELS = [3, 5, 7, 9, 11];       // recipe kernelSizeArray (design-of-record)
const DIR_X = new THREE.Vector2(1, 0);  // UnrealBloomPass.BlurDirectionX
const DIR_Y = new THREE.Vector2(0, 1);  // UnrealBloomPass.BlurDirectionY

export function createBloom({ renderer }) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  scene.add(quad);

  const mips = C.BLOOM_MIPS;             // 5 (design-of-record)
  const highPass = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: HIGH_PASS_FRAG,
    depthTest: false, depthWrite: false,
    uniforms: { tSrc: { value: null }, uThreshold: { value: 1.0 } },
  });
  const blurMats = KERNELS.slice(0, mips).map(k => {
    // recipe coefficient generation (sigma = kernelRadius / 3, 0.39894 = 1/sqrt(2π))
    const sigma = k / 3;
    const coefficients = [];
    for (let i = 0; i < k; i++) coefficients.push(0.39894 * Math.exp(-0.5 * i * i / (sigma * sigma)) / sigma);
    return new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: BLUR_FRAG,
      depthTest: false, depthWrite: false,
      defines: { KERNEL_RADIUS: k },
      uniforms: {
        tSrc: { value: null },
        invSize: { value: new THREE.Vector2(0.5, 0.5) },  // inverse texture size (recipe default)
        direction: { value: new THREE.Vector2(0.5, 0.5) },
        gaussianCoefficients: { value: coefficients },
      },
    });
  });
  const composite = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: COMPOSITE_FRAG,
    depthTest: false, depthWrite: false,
    uniforms: {
      blurTexture1: { value: null }, blurTexture2: { value: null },
      blurTexture3: { value: null }, blurTexture4: { value: null },
      blurTexture5: { value: null },
      uRadius: { value: 0.4 },
    },
  });

  // HalfFloat RTs (recipe: `new WebGLRenderTarget( resx, resy, { type: HalfFloatType } )`),
  // mip 0 at ½ resolution, each next mip halves again (recipe setSize loop).
  let bright = null;
  const hRT = [], vRT = [];
  // strength is accepted here for API parity but applied by the finish composite
  // (uBloomStrength) — single application point (design-of-record).
  const params = { threshold: 1.0, radius: 0.4, strength: 0.42 };

  const makeRT = (w, h) => new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    generateMipmaps: false,
  });
  const disposeTargets = () => {
    bright?.dispose();
    for (const rt of hRT) rt?.dispose();
    for (const rt of vRT) rt?.dispose();
    hRT.length = 0; vRT.length = 0;
    bright = null;
  };

  const blit = (material, target) => {  // finish.js house-style blit
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
  };

  return {
    render(tSrc, bloomTex, dt) {
      if (!bright || !tSrc || !bloomTex) return;
      // 1. extract bright areas (recipe: high-pass into renderTargetBright)
      highPass.uniforms.tSrc.value = tSrc;
      blit(highPass, bright);
      // 2. blur all the mips progressively (recipe: per mip H→h[i] then V→v[i],
      //    each mip's input the previous mip's vertical output)
      let input = bright;
      for (let i = 0; i < mips; i++) {
        const mat = blurMats[i];
        mat.uniforms.tSrc.value = input.texture;
        mat.uniforms.direction.value = DIR_X;
        blit(mat, hRT[i]);
        mat.uniforms.tSrc.value = hRT[i].texture;
        mat.uniforms.direction.value = DIR_Y;
        blit(mat, vRT[i]);
        input = vRT[i];
      }
      // 3. composite all the mips → bloomTex (½ res; recipe renders into
      //    renderTargetsHorizontal[0], ours into the caller-owned bloom texture)
      const u = composite.uniforms;
      u.blurTexture1.value = vRT[0].texture;
      u.blurTexture2.value = vRT[1].texture;
      u.blurTexture3.value = vRT[2].texture;
      u.blurTexture4.value = vRT[3].texture;
      u.blurTexture5.value = vRT[4].texture;
      blit(composite, bloomTex);
    },
    setSize(width, height) {
      const hw = Math.max(1, Math.round(width / 2));
      const hh = Math.max(1, Math.round(height / 2));
      if (bright && bright.width === hw && bright.height === hh) return;
      disposeTargets();
      bright = makeRT(hw, hh);
      let rx = hw, ry = hh;
      for (let i = 0; i < mips; i++) {
        hRT.push(makeRT(rx, ry));
        vRT.push(makeRT(rx, ry));
        blurMats[i].uniforms.invSize.value.set(1 / rx, 1 / ry);
        rx = Math.max(1, Math.round(rx / 2));
        ry = Math.max(1, Math.round(ry / 2));
      }
    },
    setParams(p) {
      if (Number.isFinite(p.threshold)) { params.threshold = p.threshold; highPass.uniforms.uThreshold.value = p.threshold; }
      if (Number.isFinite(p.radius)) { params.radius = p.radius; composite.uniforms.uRadius.value = p.radius; }
      if (Number.isFinite(p.strength)) params.strength = p.strength;  // applied by finish (uBloomStrength)
      return params;
    },
    dispose() {
      disposeTargets();
      highPass.dispose();
      for (const m of blurMats) m.dispose();
      composite.dispose();
      quad.geometry.dispose();
    },
  };
}
