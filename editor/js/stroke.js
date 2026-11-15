// stroke.js — silhouette stroke ring for selection/hover (pGr's stroke part, C/E/j).
// Exact port of uGr/hGr shaders + mask-RT pipeline (analysis/tmp_b/sel_pGr_full.js,
// analysis/FINISH_RENDERER.md §3). Gated on the SAME predicate as the finish composer
// (strokeEnabled = m); footprint shader is independent and lives in selection.js.
import * as THREE from 'three';

const STROKE_PX = 1.5;            // $Wr
const MASK_MAX_H = 1080;          // VWr
const MASK_MSAA = 4;              // UWr
const MASK_STEP = 16;             // lQ — RT dims rounded up to 16px multiples
const REALLOC_DEBOUNCE_MS = 150;  // zWr
const STROKE_LAYER = 2;           // cQ
const HELPER_KINDS = new Set(['camera', 'target', 'spotlight']);  // _De

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`;
const RING_FRAG = `
  varying vec2 vUv;
  uniform sampler2D tMask;
  uniform vec2 uTexel;
  uniform float uWidth;
  float ringMax(float r) {
    float m = 0.0;
    for (int i = 0; i < 8; i++) {
      float a = float(i) / 8.0 * 6.2831853;
      m = max(m, textureLod(tMask, vUv + vec2(cos(a), sin(a)) * r * uTexel, 0.0).r);
    }
    return m;
  }
  void main() {
    // Most of the frame is nowhere near the mask, and a coarse mip says so in one read.
    if (textureLod(tMask, vUv, 4.0).r == 0.0) discard;
    float inside = textureLod(tMask, vUv, 0.0).r;
    if (inside >= 0.999) discard;
    float s = max(ringMax(uWidth), ringMax(uWidth * 0.5)) * (1.0 - inside);
    float h = 0.26 * ringMax(uWidth + 2.0) * (1.0 - inside) * (1.0 - s);
    float a = s + h;
    if (a <= 0.002) discard;
    gl_FragColor = vec4(mix(vec3(0.09, 0.11, 0.18), vec3(1.0), s / max(a, 1e-3)), a);
  }`;

// gBe/aGr: collect meshes for the mask — helper kinds contribute ALL Mesh+Line children
// (frustum wireframes, cones); other kinds only non-basic Meshes.
function collectMeshes(obj, out) {
  if (!HELPER_KINDS.has(obj.userData.kind)) {
    if (obj.isMesh && !obj.material?.isMeshBasicMaterial) out.push(obj);
    for (const c of obj.children) collectMeshes(c, out);
    return;
  }
  obj.traverse(o => { if (o.isMesh || o.isLine) out.push(o); });
}

// dKt-equivalent size latch (same as finish.js but self-contained here)
function makeSizeLatch(intervalMs, now = () => performance.now()) {
  let lastW = 0, lastH = 0, lastChange = -Infinity;
  return (w, h, exists) => {
    if (w !== lastW || h !== lastH) { lastW = w; lastH = h; lastChange = now(); }
    return !exists || now() - lastChange >= intervalMs;
  };
}

export function strokeRing(renderer, scene, strokeEnabled) {
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, side: THREE.DoubleSide });
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const ringMat = new THREE.ShaderMaterial({
    uniforms: { tMask: { value: null }, uTexel: { value: new THREE.Vector2() }, uWidth: { value: 1 } },
    vertexShader: VERT, fragmentShader: RING_FRAG,
    transparent: true, depthTest: false, depthWrite: false,
  });
  const quadScene = new THREE.Scene();
  const quad = new THREE.Mesh(quadGeo, ringMat);
  quad.frustumCulled = false;
  quadScene.add(quad);
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // per-renderer target cache (v Map) — we only ever drive the main renderer here
  let target = null;
  const sizeLatch = makeSizeLatch(REALLOC_DEBOUNCE_MS);
  const bufSize = new THREE.Vector2();
  const clearColor = new THREE.Color();

  function forget() {   // I
    target?.dispose();
    target = null;
  }

  // C(renderer, camera, ids)
  function drawFor(renderer2, camera, ids, meshById) {
    if (!strokeEnabled()) { forget(); return; }
    const meshes = [];
    for (const id of ids) {
      const m = meshById.get(id);
      if (m) collectMeshes(m, meshes);
    }
    if (meshes.length === 0) return;
    renderer2.getDrawingBufferSize(bufSize);
    const scale = Math.min(1, MASK_MAX_H / bufSize.y);
    const w = Math.ceil(bufSize.x * scale / MASK_STEP) * MASK_STEP;
    const h = Math.ceil(bufSize.y * scale / MASK_STEP) * MASK_STEP;
    const ok = sizeLatch(w, h, target !== null);
    if (!target || (ok && (target.width !== w || target.height !== h))) {
      target?.dispose();
      target = new THREE.WebGLRenderTarget(w, h, {
        samples: MASK_MSAA, depthBuffer: false, generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
      });
    }
    const rt = target;
    for (const m of meshes) m.layers.enable(STROKE_LAYER);
    scene.traverse(o => { if (o.isLine) o.layers.enable(STROKE_LAYER); });
    const prevFog = scene.fog, prevAutoClear = renderer2.autoClear;
    const prevAlpha = renderer2.getClearAlpha(), prevLayers = camera.layers.mask;
    renderer2.getClearColor(clearColor);
    scene.fog = null;
    scene.overrideMaterial = whiteMat;
    camera.layers.set(STROKE_LAYER);
    try {
      renderer2.setRenderTarget(rt);
      renderer2.setClearColor(0, 0);
      renderer2.autoClear = true;
      renderer2.render(scene, camera);
      const u = ringMat.uniforms;
      u.tMask.value = rt.texture;
      u.uTexel.value.set(1 / rt.width, 1 / rt.height);
      u.uWidth.value = STROKE_PX * renderer2.getPixelRatio() * (rt.height / bufSize.y);
      renderer2.setRenderTarget(null);
      renderer2.setClearColor(clearColor, prevAlpha);
      renderer2.autoClear = false;
      renderer2.render(quadScene, ortho);
    } finally {
      camera.layers.mask = prevLayers;
      scene.overrideMaterial = null;
      scene.fog = prevFog;
      renderer2.setRenderTarget(null);
      renderer2.setClearColor(clearColor, prevAlpha);
      renderer2.autoClear = prevAutoClear;
      for (const m of meshes) m.layers.disable(STROKE_LAYER);
    }
  }

  return {
    // E — drawStroke: selected + hovered (edit view only)
    drawStroke(camera, isEditView, selectedIds, hoveredId, meshById) {
      if (!isEditView()) return;
      const ids = [...selectedIds];
      if (hoveredId && !ids.includes(hoveredId)) ids.push(hoveredId);
      drawFor(renderer, camera, ids, meshById ?? _emptyMap);
    },
    // j — strokeSelection for record/PIP cameras (selected only)
    strokeSelection(camera, ids, meshById) { drawFor(renderer, camera, ids, meshById); },
    forget,
    dispose() { forget(); quadGeo.dispose(); ringMat.dispose(); whiteMat.dispose(); },
  };
}
const _emptyMap = new Map();
