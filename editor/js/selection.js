// selection.js — ground footprint rounded-box shader (pGr/cGr/dGr port) + hover disc (CGr).
// See analysis/EDITOR_UX.md §1.
import * as THREE from 'three';
import { C } from './const.js';

const FOOTPRINT_VERT = /* glsl */`
  varying vec2 vP;
  uniform vec2 uExtent;
  void main() {
    vP = position.xy * uExtent;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const FOOTPRINT_FRAG = /* glsl */`
  varying vec2 vP;
  uniform vec2 uHalf;
  uniform vec2 uExtent;
  uniform float uRadius;
  uniform float uReach;
  uniform float uPx;
  uniform float uT;      // selection anim progress (0..1); 2 = no anim
  uniform float uFade;   // fade-in 0..1
  uniform vec3 uFill;
  uniform vec3 uLine;
  float boxDistance(vec2 p) {
    vec2 q = abs(p) - uHalf + uRadius;
    return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - uRadius;
  }
  float line(float d, float at, float w, float aa) {
    return 1. - smoothstep(w - aa, w + aa, abs(d - at));
  }
  void main() {
    float d = boxDistance(vP);
    float aa = max(fwidth(d), 1e-5);
    float band = 3.0 * uPx;
    float inset = 0.42 * (1.0 - smoothstep(-aa, aa, d));
    float shade = max(inset, 0.22 * line(d, band + uPx, uPx, aa)) * uFade;
    float white = line(d, band * 0.5, band * 0.5, aa) * uFade;
    float wash = 0.0;
    if (uT >= 0.0 && uT < 1.0) {
      float e = 1.0 - pow(1.0 - uT, 3.0);
      float x = (length(vP) - e * (length(uHalf) + uReach)) / (uReach * 0.45);
      wash = 0.72 * exp(-x * x) * pow(1.0 - uT, 1.1) * (1.0 - smoothstep(uReach * 0.7, uReach, d));
      wash *= smoothstep(0.0, 0.03, uT);
    }
    float a = clamp(shade + white + wash, 0., 1.);
    if (a <= 0.001) discard;
    gl_FragColor = vec4(mix(uFill, uLine, clamp(white + wash, 0., 1.)), a);
    #include <colorspace_fragment>
  }`;

const PLANE_GEO = new THREE.PlaneGeometry(2, 2); // unit quad, scaled by uniforms (uExtent)

export class SelectionFootprints {
  constructor(scene) {
    this.scene = scene;
    this.entries = new Map();   // id → {mesh, selectedAtMs, fadeStart, visible}
    this.group = new THREE.Group();
    scene.add(this.group);
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  }

  // foot computation (lGr): rotated child bboxes ∪ skinned bone positions → {x,z,halfX,halfZ,y,top,yaw}
  static footOf(mesh) {
    const kind = mesh.userData.kind;
    const yaw = new THREE.Euler().setFromQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
    const cos = Math.cos(-yaw), sin = Math.sin(-yaw);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, minY = Infinity, top = -Infinity;
    const addPoint = (wx, wy, wz) => {
      const x = wx * cos - wz * sin, z = wx * sin + wz * cos;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      if (wy < minY) minY = wy; if (wy > top) top = wy;
    };
    const fullTraverse = kind === 'camera' || kind === 'target' || kind === 'spotlight';
    mesh.updateWorldMatrix(true, true);
    mesh.traverse(o => {
      if (o.isSkinnedMesh) {
        for (const bone of o.skeleton.bones) {
          const p = bone.getWorldPosition(new THREE.Vector3());
          addPoint(p.x, p.y, p.z);
        }
        return;
      }
      if (!o.isMesh) return;
      if (!fullTraverse && o.material?.isMeshBasicMaterial) return; // gBe: skip basic-material meshes
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      const mat = o.matrixWorld;
      for (let i = 0; i < 8; i++) {
        const v = new THREE.Vector3(
          i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z);
        v.applyMatrix4(mat);
        addPoint(v.x, v.y, v.z);
      }
    });
    if (!Number.isFinite(minX)) { // empty (e.g. group) → world position point
      const p = mesh.getWorldPosition(new THREE.Vector3());
      addPoint(p.x, p.y, p.z);
    }
    return {
      x: (minX + maxX) / 2, z: (minZ + maxZ) / 2,
      halfX: (maxX - minX) / 2, halfZ: (maxZ - minZ) / 2,
      y: Math.max(minY, 0), top, yaw,
    };
  }

  tick(selectedIds, meshById, camera, clientHeight, now = performance.now()) {
    const want = selectedIds.slice(0, C.SEL_MAX);
    // create/keep entries; mark deselect fade
    for (const id of want) {
      if (!this.entries.has(id) && meshById.has(id)) {
        const mesh = new THREE.Mesh(PLANE_GEO, new THREE.ShaderMaterial({
          vertexShader: FOOTPRINT_VERT, fragmentShader: FOOTPRINT_FRAG,
          transparent: true, depthWrite: false, fog: false,           // [A:F9]
          uniforms: {
            uHalf: { value: new THREE.Vector2() }, uExtent: { value: new THREE.Vector2() },
            uRadius: { value: 0.1 }, uReach: { value: 1 }, uPx: { value: 0.01 },
            uT: { value: 2 }, uFade: { value: 0 },
            uFill: { value: new THREE.Color(C.SEL_FILL) }, uLine: { value: new THREE.Color(C.SEL_LINE) },
          },
        }));
        mesh.rotation.order = 'YXZ';
        mesh.rotation.set(-Math.PI / 2, 0, 0);
        mesh.renderOrder = 5;
        mesh.userData.__selection = true;
        this.group.add(mesh);
        this.entries.set(id, { mesh, selectedAtMs: now, fadeStart: null, dying: false });
      }
    }
    for (const [id, e] of this.entries) {
      if (!want.includes(id)) {
        if (!e.dying) { e.dying = true; e.dieStart = now; }
        if (now - e.dieStart > C.SEL_DESELECT_MS) {
          e.mesh.removeFromParent(); e.mesh.material.dispose();
          this.entries.delete(id);
        }
      }
    }
    // update uniforms
    const dist = new THREE.Vector3();
    for (const [id, e] of this.entries) {
      const obj = meshById.get(id);
      if (!obj) continue;
      const foot = SelectionFootprints.footOf(obj);
      const u = e.mesh.material.uniforms;
      dist.set(foot.x, foot.y, foot.z).sub(camera.position);
      const pxPerM = dist.length() * 2 * Math.tan(camera.fov * Math.PI / 360) / Math.max(1, clientHeight);
      const minHalf = Math.min(foot.halfX, foot.halfZ);
      const W = Math.max(minHalf * C.SEL_PAD_MIN_K, C.SEL_PAD_PX * pxPerM);
      const U = foot.halfX + W, V = foot.halfZ + W;
      const reach = Math.max(minHalf * C.SEL_RIPPLE_K, C.SEL_RIPPLE_PX * pxPerM);
      const margin = reach + 12 * pxPerM;
      u.uHalf.value.set(U, V);
      u.uExtent.value.set(U + margin, V + margin);
      u.uRadius.value = Math.min(Math.min(U, V) * C.SEL_CORNER_K, Math.max(W * 1.6, C.SEL_CORNER_PX * pxPerM));
      u.uReach.value = reach;
      u.uPx.value = pxPerM;
      u.uT.value = this.reducedMotion ? 2 : Math.min(2, (now - e.selectedAtMs) / C.SEL_RIPPLE_MS);
      u.uFade.value = this.reducedMotion ? 1 : Math.min(1, (now - e.selectedAtMs) / C.SEL_FADE_MS);
      e.mesh.position.set(foot.x, foot.y + pxPerM * 0.6, foot.z);
      e.mesh.rotation.set(-Math.PI / 2, foot.yaw, 0);
      e.mesh.scale.set(U + margin, V + margin, 1);
      e.mesh.visible = true;
    }
    // screen bounds (selectionScreenBounds) for the floating toolbar
    let bounds = null;
    if (want.length) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, cx = 0, cy = 0, n = 0;
      for (const id of want) {
        const obj = meshById.get(id);
        if (!obj) continue;
        const foot = SelectionFootprints.footOf(obj);
        const v = new THREE.Vector3(foot.x, foot.y, foot.z).project(camera);
        if (v.z > 1) continue;
        const sx = (v.x * 0.5 + 0.5) * (camera.userData?.viewW ?? 1);
        const sy = (-v.y * 0.5 + 0.5) * (camera.userData?.viewH ?? 1);
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
        cx += sx; cy += sy; n++;
      }
      if (n) {
        cx /= n; cy /= n;
        const pad = C.SEL_TOOLBAR_PAD * (camera.userData?.viewH ?? 1);
        bounds = { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad, cx, cy };
      }
    }
    this.screenBounds = bounds;
  }

  showAll(camera, clientHeight) { // showSelectionRings — used by PIP/record renders
    for (const [, e] of this.entries) e.mesh.visible = true;
    return () => {};
  }
}

// ---------- hover disc (CGr) ----------
const HOVER_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const HOVER_FRAG = /* glsl */`
  varying vec2 vUv;
  uniform float uBig;
  void main() {
    float r = length(vUv * 2.0 - 1.0);
    float ring = smoothstep(0.78, 0.72, r) * smoothstep(0.52, 0.58, r);
    float dot0 = smoothstep(0.16, 0.10, r);
    float halo = smoothstep(1.0, 0.85, r) * 0.18;
    float a = clamp(max(max(ring, dot0) * uBig + halo, 0.0), 0.0, 1.0);
    if (a <= 0.003) discard;
    vec3 col = mix(vec3(0.09, 0.11, 0.18), vec3(1.0), max(ring, dot0) * uBig);
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }`;

export class HoverDisc {
  constructor(scene) {
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      vertexShader: HOVER_VERT, fragmentShader: HOVER_FRAG,
      transparent: true, depthWrite: false, depthTest: false, fog: false,
      uniforms: { uBig: { value: 0 } },
    }));
    this.mesh.renderOrder = 6;
    this.mesh.visible = false;
    this.mesh.userData.__hoverDisc = true;
    scene.add(this.mesh);
    this.weight = 0;
    this.pressed = false;
  }
  setPressed(p) { this.pressed = p; }
  tick(hoverPoint, hoverNormal, camera, clientHeight, dtMs, visible) {
    if (!hoverPoint || !visible) { this.weight = Math.max(0, this.weight - dtMs / 90); }
    else this.weight = Math.min(1, this.weight + dtMs / 90);   // vGr = 90 ms ease
    const u = this.mesh.material.uniforms;
    u.uBig.value = this.weight * (this.pressed ? 0.78 : 1);
    this.mesh.visible = this.weight > 0.01 && !!hoverPoint;
    if (!this.mesh.visible) return;
    // size: 20 px in world units at the hit distance
    const d = camera.position.distanceTo(hoverPoint);
    const pxPerM = d * 2 * Math.tan(camera.fov * Math.PI / 360) / Math.max(1, clientHeight);
    const s = 20 * pxPerM;
    this.mesh.scale.set(s, s, s);
    this.mesh.position.copy(hoverPoint).addScaledVector(hoverNormal, 0.002);
    this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), hoverNormal);
  }
}
