// objects.js — object store ↔ three.js mesh sync (AWr.N port).
// Kinds: group, cube, sphere, cylinder, simple_figure, humanoid, camera, target, spotlight, prop.
import * as THREE from 'three';
import { C } from './const.js';
import { buildSimpleFigure, setFigureColor, applyHeadRotation, makeLabelSprite, buildHumanoidPlaceholder, prepareHumanoid, HumanoidRig } from './figures.js';
import { fovFromFocal } from './tracks.js';
import {
  makePrimitive, bigPrimitiveSwap, nameColor, glowsByName, GLOW_EMISSIVE_HEX, applySoftTerminator,
} from './finish.js';

const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3();

// ---------- procedural prop builders (zqt — exact) ----------
const WALL_H = 2.5, THICK = 0.15;   // vT, s2
const boxSpec = specs => material => specs.map(s => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...s.size), material);
  m.position.set(...(s.at ?? [0, s.size[1] / 2, 0]));
  return m;
});                                     // WC
const legs = ({ legX, legZ, height, thickness }) =>   // Uqt
  [[legX, legZ], [legX, -legZ], [-legX, legZ], [-legX, -legZ]]
    .map(([x, z]) => ({ size: [thickness, height, thickness], at: [x, height / 2, z] }));
const cone = (material, radius, height, segs) => {   // tBe — flat-shaded cone
  const g = new THREE.ConeGeometry(radius, height, segs).toNonIndexed();
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.position.y = height / 2;
  return m;
};
const PROC_BUILDERS = {
  doorway: boxSpec([{ size: [THICK, 2.1, THICK], at: [-0.575, 1.05, 0] }, { size: [THICK, 2.1, THICK], at: [0.575, 1.05, 0] }, { size: [1.3, THICK, THICK], at: [0, 2.175, 0] }]),
  stairs: boxSpec(Array.from({ length: 6 }, (_, i) => ({ size: [1.2, (i + 1) * 0.2, 0.3], at: [0, (i + 1) * 0.2 / 2, 0.75 - (i + 0.5) * 0.3] }))),
  wall: boxSpec([{ size: [3, WALL_H, THICK] }]),
  wall_corner: boxSpec([{ size: [1.5, WALL_H, THICK], at: [0.75 - THICK / 2, WALL_H / 2, 0] }, { size: [THICK, WALL_H, 1.5], at: [-THICK / 2, WALL_H / 2, 0.75] }]),
  pillar: material => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, WALL_H, 16), material); m.position.y = WALL_H / 2; return [m]; },
  table: boxSpec([{ size: [1.4, 0.06, 0.8], at: [0, 0.72 + 0.03, 0] }, ...legs({ legX: 0.64, legZ: 0.34, height: 0.72, thickness: 0.06 })]),
  chair: boxSpec([{ size: [0.45, 0.05, 0.45], at: [0, 0.45, 0] }, { size: [0.45, 0.5, 0.05], at: [0, 0.45 + 0.25, 0.2] }, ...legs({ legX: 0.19, legZ: 0.19, height: 0.45, thickness: 0.04 })]),
  mountain: material => [cone(material, 4, 6, 5)],
  tree: material => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 6), material);
    trunk.position.y = 0.6;
    const crown = cone(material, 1.2, 3, 6);
    crown.position.y = 1.2 + 1.5;
    return [trunk, crown];
  },
  rock: material => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), material);
    m.scale.set(1, 0.65, 1);
    const box = new THREE.Box3().setFromObject(m);
    m.position.y = -box.min.y;
    return [m];
  },
  plane: boxSpec([{ size: [2, 0.05, 2] }]),
  pyramid: material => [cone(material, 0.85, 1.3, 4)],
  capsule: material => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1, 4, 12), material); m.position.y = 0.4 + 1 / 2; return [m]; },
};
// eat — gray wireframe dims box placeholder (base-anchored)
const propPlaceholder = (dims = [0.8, 0.8, 0.8]) => {
  const [w, h, d] = dims;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: 0x888888, wireframe: true }));
  m.position.y = h / 2;
  return m;
};
// FNr — strip materials to ONE shared clay material; ONr — center XZ + feet minY
const CLAY_COLOR = '#e2e0dc';   // pq
const clayMaterial = () => new THREE.MeshStandardMaterial({ color: CLAY_COLOR, roughness: 1 });
function applyClay(root) {
  const mat = clayMaterial();
  root.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material;
    (Array.isArray(m) ? m : [m]).forEach(x => x.dispose());
    o.material = mat;
  });
}
function centerAndGround(root) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const c = box.getCenter(new THREE.Vector3());
  root.position.x -= c.x; root.position.z -= c.z;
  root.position.y -= box.min.y;
}

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
    if (obj.kind === 'camera') this._updateFrustum(mesh);   // basic; main.js tick refines w/ page focal + aim
    if (obj.kind === 'spotlight') this._updateSpotlight(mesh, obj);
    this._applyGlowAndColor(mesh, obj);
    if (obj.kind === 'humanoid' && obj.animation) {
      const rig = this.humanoidRigs.get(id);
      if (rig && obj.animation.playing) rig.playClip(obj.animation.clip);
    }
    this._hiPolySwap(mesh, obj);
  }

  _applyGlowAndColor(mesh, obj) {
    // eKt glow flag (primitive lantern names) + emissive clear on un-glow (AWr.N port)
    const glows = glowsByName(obj);
    if (mesh.userData.glows && !glows && mesh.isMesh) {
      for (const m of [mesh.material, mesh.userData.originalMaterial]) {
        if (m) { m.emissive?.setHex(0); delete m.userData.glowAt; }
      }
    }
    mesh.userData.glows = glows;
    const primChild = mesh.children?.find(c => c.userData?.__prim);
    if (primChild) primChild.userData.glows = glows;   // shadow walk reads it on the mesh
    // A(): color = obj.color ?? Mje(obj); simple_figure → Kqt, group/spotlight skip, else T()
    const color = obj.color ?? nameColor(obj);
    if (obj.kind === 'simple_figure') setFigureColor(mesh, color);
    else if (obj.kind !== 'group' && obj.kind !== 'spotlight') this._applyObjectColor(mesh, color);
  }

  _applyObjectColor(root, color) {   // T() port — subtree override material, soft-terminator aware
    const prev = root.userData.colorOverride;
    if (color === undefined || color === null) {
      if (!prev) return;
      root.traverse(o => {
        if (o.isMesh && o.userData.originalMaterial) { o.material = o.userData.originalMaterial; delete o.userData.originalMaterial; }
      });
      prev.dispose();
      delete root.userData.colorOverride;
      return;
    }
    const mat = prev ?? new THREE.MeshStandardMaterial({ roughness: 1 });
    if (!prev && root.userData.softTerminator) applySoftTerminator(mat);
    mat.color.set(color);
    root.userData.colorOverride = mat;
    root.traverse(o => {
      if (o.isMesh) {
        if (!o.userData.originalMaterial) o.userData.originalMaterial = o.material;
        o.material = mat;
      }
    });
  }

  _hiPolySwap(mesh, obj) { // _Wr: sphere/cylinder → more segments when max|scale| ≥ 24 (cube never)
    if (!['cube', 'sphere', 'cylinder'].includes(obj.kind)) return;
    const child = mesh.children.find(c => c.isMesh && c.userData.__prim) ?? (mesh.userData.__prim ? mesh : null);
    if (!child) return;
    bigPrimitiveSwap(child, obj.scale ?? [1, 1, 1]);
  }

  _create(id, obj) {
    const g = new THREE.Group();
    g.userData.objectId = id;
    g.userData.kind = obj.kind;
    switch (obj.kind) {
      case 'group': break;   // invisible parent
      case 'cube': case 'sphere': case 'cylinder': {
        const mesh = makePrimitive(obj.kind);          // wWr: clay + soft terminator (sphere/cylinder), base-anchored
        mesh.userData.__prim = true;
        mesh.castShadow = mesh.receiveShadow = true;
        g.add(mesh);
        // live primitives ARE the mesh; our wrapper is a Group — mirror the flags the
        // color-override / glow / shadow-walk code reads (softTerminator, primitiveKind)
        g.userData.softTerminator = mesh.userData.softTerminator;
        g.userData.primitiveKind = mesh.userData.primitiveKind;
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
        // YWt: torus(.3,.03) ring + sphere(.06), pink, semi-transparent, depthWrite off
        const mat = new THREE.MeshStandardMaterial({ color: 0xdd4466, roughness: 0.5, transparent: true, opacity: 0.45, depthWrite: false });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 32), mat);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), mat);
        ring.userData.__marker = true;
        g.add(ring, dot);
        break;
      }
      case 'spotlight': {
        this._buildSpotlight(g, obj);
        break;
      }
      case 'prop': {
        g.userData.propKey = obj.propKey;
        this._loadProp(g, obj);
        break;
      }
    }
    return g;
  }

  // ---- humanoid ----
  async _loadHumanoid(id, group, placeholder) {
    try {
      // per-instance loadAsync (original y(P) loads Hhe fresh each time — a shared cached
      // gltf.scene would be STOLEN by the 2nd instance; browser HTTP cache keeps this cheap)
      const gltf = await this.gltfLoader.loadAsync(C.HUMANOID_URL);
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

  // ---- camera object (GLB mie-normalized + urt 16-point frustum) ----
  async _loadCameraGlb(group) {
    if (!this.cameraGlbPromise) this.cameraGlbPromise = this._loadGLB(C.CAMERA_GLB_URL);
    try {
      const gltf = await this.cameraGlbPromise;
      const model = gltf.scene.clone(true);
      // mie: scale so max dim = .55, yaw π, centre at origin
      const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
      const m = Math.max(size.x, size.y, size.z);
      if (m > 0) model.scale.multiplyScalar(0.55 / m);
      model.rotation.y = Math.PI;
      const box2 = new THREE.Box3().setFromObject(model);
      model.position.sub(box2.getCenter(new THREE.Vector3()));
      group.add(model);
    } catch (e) {
      console.warn('camera GLB failed', e.message);
    }
  }
  _buildFrustum(group) {
    // $8r/urt: 16-point frustum wireframe ("camera-frustum" sub-object)
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
    const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x44ddaa, transparent: true, opacity: 0.7, fog: false })); // D8r teal
    lines.name = 'camera-frustum';
    lines.userData.__frustum = true;
    lines.frustumCulled = false;
    lines.raycast = () => {};
    group.add(lines);
  }
  _updateFrustum(group, opts = {}) {
    // urt: 16-point frustum. fov/aspect from PAGE focal + recordAspect (BU), distance 3
    // or max(dist-to-target, .6) when framing (yFr: framesMarkerNow && !meshDragged).
    const lines = group.children.find(c => c.userData.__frustum);
    if (!lines) return;
    const aspect = opts.aspect ?? 16 / 9;
    const fovDeg = opts.fovDeg ?? 50;
    let distance = opts.distance ?? C.MARKER_DISTANCE;  // DGr=3
    if (opts.targetPos) {
      const d = group.getWorldPosition(_v1).distanceTo(_v2.set(...opts.targetPos));
      if (d < 1e-4) return;
      distance = Math.max(d, 0.6);   // LGr
      if (!opts.meshDragged) { group.lookAt(_v2); group.rotateY(Math.PI); }
    }
    const hh = Math.tan(fovDeg / 2 * Math.PI / 180) * distance;   // l2r
    const hw = hh * aspect;
    const z = -distance;
    const corners = [[-hw, -hh, z], [hw, -hh, z], [hw, hh, z], [-hw, hh, z]];
    const seq = [
      [0, 0, 0], corners[0], [0, 0, 0], corners[1], [0, 0, 0], corners[2], [0, 0, 0], corners[3],
      corners[0], corners[1], corners[1], corners[2], corners[2], corners[3], corners[3], corners[0],
    ];
    const pos = lines.geometry.attributes.position;
    seq.forEach(([x, y, zz], i) => pos.setXYZ(i, x, y, zz));
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

  // ---- props (v/qqt/Wqt/eat — clay materials, catalog scale/yaw, grounded) ----
  _loadProp(group, obj) {
    const cat = this.propCatalog[obj.propKey];
    const builder = PROC_BUILDERS[obj.propKey];
    if (builder) {
      // procedural props (zqt): exact builders, clay material
      const mat = new THREE.MeshStandardMaterial({ color: CLAY_COLOR, roughness: 1 });
      for (const m of builder(mat)) group.add(m);
      group.userData.propBuilt = true;
      return;
    }
    if (!cat || !cat.category) {
      group.add(propPlaceholder());      // eat() — unknown prop
      return;
    }
    const url = C.PROP_GLB_DIR + cat.category + '/' + obj.propKey + '.glb';
    const holder = new THREE.Group();
    const ph = propPlaceholder(cat.dims);
    holder.add(ph);
    group.add(holder);
    this._loadGLB(url).then(gltf => {
      if (!group.userData || group.userData.propKey !== obj.propKey) return;
      const model = gltf.scene.clone(true);
      model.traverse(o => { if (o.isMesh) o.geometry = o.geometry.clone(); });
      applyClay(model);                   // FNr — ONE shared clay material (roughness 1)
      const s = cat.scale ?? 1;
      if (s !== 1) model.scale.multiplyScalar(s);
      const yaw = cat.yawDeg ?? 0;
      if (yaw !== 0) model.rotateY(yaw * Math.PI / 180);
      centerAndGround(model);             // ONr — XZ-centre + feet minY
      holder.remove(ph);
      ph.geometry.dispose(); ph.material.dispose();
      holder.add(model);
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
