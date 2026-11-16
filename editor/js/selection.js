// selection.js — screen-bounds tracker for the floating toolbar + hover disc (CGr).
// Round-6: the ground footprint pad (pGr rounded-box quad) was REMOVED by user direction
// (visual clutter, often misread); the live ozr rewrite ships no helper lines either.
// What remains: SelectionTracker (toolbar anchoring bounds) + HoverDisc (cursor indicator).
import * as THREE from 'three';
import { C } from './const.js';

const _v = new THREE.Vector3();

// Screen-bounds tracker for the floating edit toolbar (replaces the removed footprint pad).
// Bounds = projected world positions of the selected meshes (+ a px pad for the toolbar).
export class SelectionTracker {
  constructor() { this.screenBounds = null; }
  tick(selectedIds, meshById, camera) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, cx = 0, cy = 0, n = 0;
    for (const id of selectedIds) {
      const mesh = meshById.get(id);
      if (!mesh) continue;
      _v.setFromMatrixPosition(mesh.matrixWorld).project(camera);
      if (_v.z > 1) continue;
      const sx = (_v.x * 0.5 + 0.5) * (camera.userData?.viewW ?? 1);
      const sy = (-_v.y * 0.5 + 0.5) * (camera.userData?.viewH ?? 1);
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
      cx += sx; cy += sy; n++;
    }
    if (!n) { this.screenBounds = null; return; }
    cx /= n; cy /= n;
    const pad = C.SEL_TOOLBAR_PAD * (camera.userData?.viewH ?? 1);
    this.screenBounds = { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad, cx, cy };
  }
}

// SelectionFootprints (ground rounded-box pad, pGr port) removed in round 6 by user direction.
// Retrievable from git history at the round-5 HEAD if ever needed.

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
