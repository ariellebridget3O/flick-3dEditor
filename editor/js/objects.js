// objects.js — object store ↔ three.js mesh sync (AWr.N port).
// Kinds: group, cube, sphere, cylinder, simple_figure, humanoid, camera, target, spotlight, prop.
import * as THREE from 'three';
import { C } from './const.js';
import { buildSimpleFigure, applyHeadRotation, makeLabelSprite, buildHumanoidPlaceholder, prepareHumanoid, HumanoidRig } from './figures.js';
import { fovFromFocal } from './tracks.js';

const PRIMS = { cube: () => new THREE.BoxGeometry(1, 1, 1), sphere: () => new THREE.SphereGeometry(0.5, 32, 16), cylinder: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 24) };

export class ObjectManager {
  constructor(scene, opts) {
    this.scene = scene;
    this.meshById = new Map();
    this.gltfLoader = opts.gltfLoader;
    this.propCatalog = opts.propCatalog ?? {};
    this.glbCache = new Map();       // url → Promise<gltf>
    this.humanoidClips = null;
    this.humanoidRigs = new Map();   // id → HumanoidRig
    this.labels = new Map();         // id → sprite
    this.planningAids = opts.planningAids;
    this.cameraGlbPromise = null;
    this.spotGlbPromise = null;
    this.onRigReady = opts.onRigReady ?? (() => {});
  }

  roots() { return [...this.meshById.values()].filter(m => !m.userData.__childOf); }

  // ---- full resync ----
  syncAll(objects) {
    const seen = new Set();
    for (const [id, obj] of Object.entries(objects)) {
      seen.add(id);
      this.syncOne(id, obj);
    }
    for (const [id, mesh] of this.meshById) {
      if (!seen.has(id)) this.dispose(id, mesh);
    }
    // hierarchy: reparent to parent mesh ?? scene
    for (const [id, obj] of Object.entries(objects)) {
      const mesh = this.meshById.get(id);
      if (!mesh) continue;
      const target = obj.parentId ? (this.meshById.get(obj.parentId) ?? this.scene) : this.scene;
      if (mesh.parent !== target) target.add(mesh);
    }
  }

  syncOne(id, obj) {
    let mesh = this.meshById.get(id);
    const needKind = !mesh || mesh.userData.kind !== obj.kind || (obj.kind === 'prop' && mesh.userData.propKey !== obj.propKey);
    if (needKind) {
      if (mesh) this.dispose(id, mesh);
      mesh = this._create(id, obj);
      this.meshById.set(id, mesh);
      this.scene.add(mesh);
    }
    // TRS
    mesh.position.set(...(obj.position ?? [0, 0, 0]));
    mesh.rotation.set(...(obj.rotation ?? [0, 0, 0]));
    mesh.scale.set(...(obj.scale ?? [1, 1, 1]));
    mesh.userData.objectId = id;
    mesh.userData.kind = obj.kind;
    if (obj.kind === 'simple_figure') applyHeadRotation(mesh, obj.headRotation);
    if (obj.kind === 'humanoid' || obj.kind === 'simple_figure') this._updateLabel(id, obj);
    if (obj.kind === 'camera') this._updateFrustum(mesh, obj);
    if (obj.kind === 'spotlight') this._updateSpotlight(mesh, obj);
    if (obj.kind === 'humanoid' && obj.animation) {
      const rig = this.humanoidRigs.get(id);
      if (rig && obj.animation.playing) rig.playClip(obj.animation.clip);
    }
    this._hiPolySwap(mesh, obj);
  }

  _hiPolySwap(mesh, obj) { // _Wr: primitives → more segments when max|scale| ≥ 24
    if (!['cube', 'sphere', 'cylinder'].includes(obj.kind)) return;
    const big = Math.max(...(obj.scale ?? [1, 1, 1]).map(Math.abs)) >= 24;
    if (mesh.userData.hiPoly === big) return;
    mesh.userData.hiPoly = big;
    const child = mesh.children.find(c => c.isMesh && c.userData.__prim);
    if (!child) return;
    child.geometry.dispose();
    child.geometry = big
      ? (obj.kind === 'cube' ? new THREE.BoxGeometry(1, 1, 1, 4, 4, 4)
        : obj.kind === 'sphere' ? new THREE.SphereGeometry(0.5, 48, 24)
          : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 2))
      : PRIMS[obj.kind]();
  }

  _create(id, obj) {
    const g = new THREE.Group();
    g.userData.objectId = id;
    g.userData.kind = obj.kind;
    switch (obj.kind) {
      case 'group': break;   // invisible parent
      case 'cube': case 'sphere': case 'cylinder': {
        const mesh = new THREE.Mesh(PRIMS[obj.kind](),
          new THREE.MeshStandardMaterial({ color: 0xe2e0dc, roughness: 0.9 })); // pq default
        mesh.userData.__prim = true;
        mesh.castShadow = mesh.receiveShadow = true;
        g.add(mesh);
        break;
      }
      case 'simple_figure': {
        g.add(buildSimpleFigure());
        break;
      }
      case 'humanoid': {
        const ph = buildHumanoidPlaceholder();
        ph.userData.__placeholder = true;
        g.add(ph);
        this._loadHumanoid(id, g, ph);
        break;
      }
      case 'camera': {
        this._loadCameraGlb(g);
        this._buildFrustum(g);
        break;
      }
      case 'target': {
        const t = new THREE.Mesh(new THREE.OctahedronGeometry(0.12),
          new THREE.MeshBasicMaterial({ color: 0xdd4466, wireframe: true, fog: false })); // B8r dye
        t.userData.__marker = true;
        g.add(t);
        break;
      }
      case 'spotlight': {
        this._buildSpotlight(g, obj);
        break;
      }
      case 'prop': {
        this._loadProp(g, obj);
        break;
      }
    }
    return g;
  }

  // ---- humanoid ----
  async _loadHumanoid(id, group, placeholder) {
    try {
      const gltf = await this._loadGLB(C.HUMANOID_URL);
      if (!this.meshById.has(id) || this.meshById.get(id) !== group) return; // replaced meanwhile
      const model = prepareHumanoid(gltf.scene);
      group.remove(placeholder);
      placeholder.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      group.add(model);
      this.humanoidClips = gltf.animations;
      const rig = new HumanoidRig(model, gltf.animations);
      this.humanoidRigs.set(id, rig);
      this.onRigReady(id, rig, gltf.animations);
    } catch (e) { console.error('humanoid load failed', e); }
  }

  // ---- camera object (GLB + frustum sub-object) ----
  async _loadCameraGlb(group) {
    if (!this.cameraGlbPromise) this.cameraGlbPromise = this._loadGLB(C.CAMERA_GLB_URL);
    try {
      const gltf = await this.cameraGlbPromise;
      const model = gltf.scene.clone(true);
      model.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
      group.add(model);
    } catch (e) {
      // fallback: simple box cam
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x444a55, roughness: .6 }));
      group.add(box);
    }
  }
  _buildFrustum(group) {
    // wireframe quad at −distance ("camera-frustum" sub-object), updated per focal/aspect
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(15), 3));
    const lines = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x44aaff, fog: false }));
    lines.userData.__frustum = true;
    lines.frustumCulled = false;
    group.add(lines);
  }
  _updateFrustum(group, obj) {
    const lines = group.children.find(c => c.userData.__frustum);
    if (!lines) return;
    const focal = obj.focalLengthMm ?? C.FOCAL_DEFAULT;
    const fovDeg = fovFromFocal(focal, 16 / 9);
    const dist = C.MARKER_DISTANCE;
    const hh = Math.tan(fovDeg / 2 * Math.PI / 180) * dist;
    const hw = hh * 16 / 9;
    const pos = lines.geometry.attributes.position;
    // apex (camera origin local) → 4 corners at z = −dist
    pos.setXYZ(0, 0, 0, 0);
    pos.setXYZ(1, -hw, -hh, -dist); pos.setXYZ(2, hw, -hh, -dist); pos.setXYZ(3, hw, hh, -dist);
    pos.setXYZ(4, -hw, hh, -dist); pos.setXYZ(5, -hw, -hh, -dist);
    pos.needsUpdate = true;
    lines.geometry.computeBoundingSphere();
  }

  // ---- spotlight (sOr + oOr) ----
  _buildSpotlight(group, obj) {
    const light = new THREE.SpotLight(0xffffff, 0, 0, this._beamAngle(obj.scale), 0, C.SPOT_DECAY);
    light.position.set(0, 0, 0);
    light.target.position.set(0, 0, -1);
    light.shadow.mapSize.set(C.SPOT_SHADOW_MAP, C.SPOT_SHADOW_MAP);
    light.shadow.camera.near = C.SPOT_NEAR;
    light.shadow.camera.far = C.SPOT_FAR;
    light.shadow.bias = C.SPOT_BIAS;
    light.shadow.normalBias = C.SPOT_NORMALBIAS;
    group.add(light, light.target);
    // lamp: GLB or fallback cylinder
    const lampHolder = new THREE.Group();
    lampHolder.userData.__lamp = true;
    group.add(lampHolder);
    this._loadSpotGlb(lampHolder);
    // beam cone (planning aid)
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 40, 1, true).rotateX(-Math.PI / 2).translate(0, 0, -0.5),
      new THREE.MeshBasicMaterial({ color: C.SPOT_BEAM_COLOR, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide, fog: false, blending: THREE.AdditiveBlending }));
    beam.userData.__beam = true;
    beam.visible = false;
    group.add(beam);
    group.userData.spotlight = { light, lamp: lampHolder, beam };
  }
  async _loadSpotGlb(holder) {
    if (!this.spotGlbPromise) this.spotGlbPromise = this._loadGLB(C.SPOTLIGHT_GLB_URL);
    try {
      const gltf = await this.spotGlbPromise;
      const model = gltf.scene.clone(true);
      model.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
      holder.add(model);
    } catch (e) {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.36, 20).rotateX(Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: C.SPOT_LAMP_COLOR, roughness: 0.5 }));
      holder.add(lamp);
    }
  }
  _beamAngle(scale) { // Rhe: clamp(avg(|scale|)·16°, 3°, 55°)
    const s = (Math.abs(scale?.[0] ?? 1) + Math.abs(scale?.[1] ?? 1) + Math.abs(scale?.[2] ?? 1)) / 3;
    return Math.min(C.FRUSTUM_ANGLE_MAX, Math.max(C.FRUSTUM_ANGLE_MIN, s * C.FRUSTUM_ANGLE_K * Math.PI / 180));
  }
  _updateSpotlight(group, obj) {
    const sp = group.userData.spotlight;
    if (!sp) return;
    const s = obj.spotlight ?? C.SPOT_DEFAULTS;
    sp.light.angle = this._beamAngle(obj.scale);
    sp.light.intensity = (s.intensity ?? 70) / 100 * C.SPOT_INTENSITY_K * Math.PI; // ×2.4; three r155+ physical units
    sp.light.penumbra = 0.05 + 0.9 * ((s.diffusion ?? 30) / 100);
    sp.light.castShadow = (s.intensity ?? 70) > 0;
    // beam cone visual: length 7, radius 7·tan(m), opacity by intensity/diffusion
    const beam = sp.beam;
    beam.visible = (s.intensity ?? 70) > 0;
    const half = sp.light.angle;
    const L = C.SPOT_BEAM_LEN;
    beam.scale.set(Math.tan(half) * L, Math.tan(half) * L, L);
    beam.material.opacity = 0.02 + 0.07 * ((s.intensity ?? 70) / 100) * (1 - (s.diffusion ?? 30) / 200);
    // lamp counter-scaled by object scale
    sp.lamp.scale.setScalar(1 / Math.max(1e-6, Math.max(...(obj.scale ?? [1, 1, 1]))));
  }

  // ---- props ----
  _loadProp(group, obj) {
    const cat = this.propCatalog[obj.propKey];
    if (!cat) return;
    if (cat.dims && cat.scale === undefined && /primitive/.test(cat.category)) {
      // 13 procedural prims — stand-in box from dims
      const m = new THREE.Mesh(new THREE.BoxGeometry(...cat.dims),
        new THREE.MeshStandardMaterial({ color: 0xe2e0dc, roughness: .9 }));
      m.castShadow = m.receiveShadow = true;
      group.add(m);
      return;
    }
    const url = C.PROP_GLB_DIR + cat.category + '/' + obj.propKey + '.glb';
    const holder = new THREE.Group();
    holder.userData.__propHolder = true;
    group.add(holder);
    this._loadGLB(url).then(gltf => {
      if (!group.userData || group.userData.propKey !== obj.propKey) return;
      const model = gltf.scene.clone(true);
      model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      // catalog scale (Uh scale ?? 1) + yaw on a wrapper group (never baked)
      const s = cat.scale ?? 1;
      model.scale.setScalar(s);
      const wrapper = new THREE.Group();
      wrapper.add(model);
      wrapper.rotation.y = (cat.yawDeg ?? 0) * Math.PI / 180;
      holder.add(wrapper);
    }).catch(e => console.warn('prop load failed', obj.propKey, e.message));
  }

  _loadGLB(url) {
    if (!this.glbCache.has(url)) {
      this.glbCache.set(url, this.gltfLoader.loadAsync(url));
    }
    return this.glbCache.get(url);
  }

  // ---- labels ----
  _updateLabel(id, obj) {
    const mesh = this.meshById.get(id);
    if (!mesh) return;
    let sprite = this.labels.get(id);
    if (!sprite) {
      sprite = makeLabelSprite(obj.name ?? 'Human');
      sprite.position.y = C.FIG_HEIGHT + 0.25;
      this.labels.set(id, sprite);
      this.planningAids?.push(sprite);
      mesh.add(sprite);
    }
    // redraw when name changes
    if (sprite.userData.text !== (obj.name ?? 'Human')) {
      mesh.remove(sprite);
      sprite.material.map.dispose(); sprite.material.dispose();
      this.labels.delete(id);
      sprite = makeLabelSprite(obj.name ?? 'Human');
      sprite.position.y = C.FIG_HEIGHT + 0.25;
      sprite.userData.text = obj.name ?? 'Human';
      this.labels.set(id, sprite);
      this.planningAids?.push(sprite);
      mesh.add(sprite);
    } else sprite.userData.text = obj.name ?? 'Human';
  }

  dispose(id, mesh) {
    // detach from parent; dispose geometries/materials (Kd-equiv); keep shared GLB cache
    mesh.removeFromParent();
    mesh.traverse(o => {
      if (o.isMesh || o.isLine || o.isSprite) {
        if (!o.userData.__shared) o.geometry?.dispose?.();
        // materials may be shared across clones — only dispose non-GLB-built ones
        if (!o.userData.__fromGlb) o.material?.dispose?.();
      }
    });
    this.humanoidRigs.delete(id);
    const lbl = this.labels.get(id);
    if (lbl) { lbl.material.map?.dispose(); lbl.material.dispose(); this.labels.delete(id); }
    this.meshById.delete(id);
  }
}
