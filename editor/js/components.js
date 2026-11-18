// components.js — r16 component-drag family, verbatim from the bundle:
//   V6  MIME            @5376693  'application/x-stage-component'
//   RNr payload         @5376734  prop → `prop:<propKey>` else kind (identical shape to LU cache key)
//   LU cache key        @5376742  componentCacheKey
//   Xqt loader cache    @5363293  subjects/pending/disposed + ensure/build switch
//   VNr ghost primitive @5363250  sphere(.5,32,16) / cylinder(.5,.5,1,24) / box(1,1,1), pq/X_
//   YWt target ghost    @4905918  torus(.3,.03,8,32)+sphere(.06,12,8), B8r=0xdd4466, .45, no depthWrite
//   mie normalize       @4904430  max-dim → L8r=.55, yaw π, centre at origin
//   $Nr idle snapshot   @5362730  mixer idle clip, update(0) (static pose; mixer then droppable)
//   $it/$Ur ghosts      @5621204  clone → transparent HUr=.45, depthWrite false (subtree)
//   VUr viewport drop   @5621422  ray∩plane y=0, ghost at (x, UWt(kind), z), token invalidation,
//                                 drop → facade addComponent + showComponentList
// UWt @4902049: hover/drop height — target → zWt=1, else 0 (camera ghost carries y=WWt=1.6
// inside its subject; spotlight ghost carries the sGt [0,3.5,3] inner offset; the target ghost
// bakes y=zWt INSIDE the subject (Xqt case"target" @5363293) AND the root sits at UWt=1 —
// byte-verbatim, do not "fix" the apparent double-bake).
// Ghost parked after a drag stays in-scene INVISIBLE (live VUr never removes it — only the
// teardown disposer clears the cache). It has no userData.objectId; picking paths filter on
// that flag (verified r16: selection/manipulate/hover all walk to userData.objectId or
// raycast explicit candidate lists).
import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { C } from './const.js';
import { buildSimpleFigure } from './figures.js';
import { PROC_BUILDERS, applyClay, centerAndGround } from './objects.js';

export const COMPONENT_MIME = 'application/x-stage-component';   // V6
const HUr = .45;                                                  // ghost opacity
const CLAY = '#e2e0dc', ROUGH = 1;                                // pq / X_
const GHOST_MODEL_SCALE = .55;                                    // L8r (mie)
const TARGET_COLOR = 0xdd4466;                                    // B8r @4904124

export const serializeComponent = spec =>                         // RNr @5376734
  spec.kind === 'prop' ? `prop:${spec.propKey}` : spec.kind;
export const componentCacheKey = serializeComponent;              // LU @5376742 (same shape)
const UWt = kind => kind === 'target' ? 1 : 0;                    // @4902049 (zWt=1)

// $it @5621204 — ghost material clone
function ghostMaterial(m) {
  const c = m.clone();
  c.transparent = true; c.opacity = HUr; c.depthWrite = false;
  return c;
}
// $Ur @5621294 — ghost materials on the whole subtree
function applyGhostMaterials(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    o.material = Array.isArray(o.material) ? o.material.map(ghostMaterial) : ghostMaterial(o.material);
  });
}
// mie @4904430 — scale so max dim = .55, yaw π, centre at origin (Box3 recomputed AFTER
// the rotation, byte-order verbatim)
function normalizeModel(t) {
  const size = new THREE.Box3().setFromObject(t).getSize(new THREE.Vector3());
  const m = Math.max(size.x, size.y, size.z);
  if (m > 0) t.scale.multiplyScalar(GHOST_MODEL_SCALE / m);
  t.rotation.y = Math.PI;
  const box = new THREE.Box3().setFromObject(t);
  t.position.sub(box.getCenter(new THREE.Vector3()));
}
// $he @5116585 — humanoid material normalize (roughness 1, M_Main → Phe #f29a5c; the
// name check is on the MATERIAL, verbatim; array materials skip — net-identical to the
// live's harmless no-op write on arrays)
function normalizeHumanoidMaterials(t) {
  t.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material;
    if (Array.isArray(m)) return;
    m.roughness = ROUGH;
    if (m.name === 'M_Main') m.color.set('#f29a5c');
  });
}
// $Nr @5362730 — pose the model at idle t=0 (mixer discarded; pose persists)
function poseIdle(model, animations) {
  const clip = animations.find(a => a.name === 'idle');
  if (!clip) return;
  const mixer = new THREE.AnimationMixer(model);
  mixer.clipAction(clip).play();
  mixer.update(0);
}
// YWt @4905918 — target ghost
function buildTargetGhost() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: TARGET_COLOR, roughness: .5, transparent: true, opacity: .45, depthWrite: false });
  g.add(new THREE.Mesh(new THREE.TorusGeometry(.3, .03, 8, 32), mat));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 8), mat));
  return g;
}
// VNr @5363250 — primitive ghost
function buildPrimitiveGhost(kind) {
  const geo = kind === 'sphere' ? new THREE.SphereGeometry(.5, 32, 16)
    : kind === 'cylinder' ? new THREE.CylinderGeometry(.5, .5, 1, 24)
    : new THREE.BoxGeometry(1, 1, 1);
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: CLAY, roughness: ROUGH }));
}
// rat @5362534 — SkinnedMesh skeleton dispose (Xqt.dispose walk)
function disposeSkeletons(t) {
  t.traverse(o => { if (o.isSkinnedMesh) o.skeleton?.dispose(); });
}
// Kd @5116272 (mesh/material branch) — dispose walk
function disposeTree(t) {
  t.traverse(o => {
    if (o.isMesh) {
      o.geometry?.dispose();
      const m = o.material;
      Array.isArray(m) ? m.forEach(x => x.dispose()) : m?.dispose();
    } else if (o.isLine || o.isSprite) {
      o.geometry?.dispose(); o.material?.dispose();
    }
  });
}

// Xqt @5363293 — component-model loader cache. build() maps onto our exact builders
// (camera/spotlight GLBs = the placed-object models; humanoid = raw GLB + $he + yaw π +
// idle@0 — NO jP rescale, unlike the placed path; the simple_figure yaw π is applied to
// the FIGURE return (r=Zqt(); r.rotation.y=π — verbatim shape), not the wrapper).
export class ComponentSubjects {
  constructor() {
    this.loader = new GLTFLoader();
    this.subjects = new Map();
    this.pending = new Map();
    this.disposed = false;
  }
  ensure(spec) {                                       // ensure @5363293
    const key = componentCacheKey(spec);
    const have = this.subjects.get(key);
    if (have) return Promise.resolve(have);
    const inflight = this.pending.get(key);
    if (inflight) return inflight;
    const p = this.build(spec)
      .then(model => {
        this.pending.delete(key);
        if (!model) return null;
        if (this.disposed) { disposeSkeletons(model); disposeTree(model); return null; }
        this.subjects.set(key, model);
        return model;
      })
      .catch(err => {                                  // verbatim catch: log + null
        this.pending.delete(key);
        console.error('Failed to build component subject', key, err);
        return null;
      });
    this.pending.set(key, p);
    return p;
  }
  async build(spec) {                                  // build @5363293
    switch (spec.kind) {
      case 'cube': case 'sphere': case 'cylinder':
        return buildPrimitiveGhost(spec.kind);
      case 'camera': {
        const gltf = await this.loader.loadAsync(C.CAMERA_GLB_URL);
        const model = gltf.scene;
        normalizeModel(model);                          // mie
        model.position.y = 1.6;                         // WWt @5257398
        const g = new THREE.Group();
        g.add(model);
        return g;
      }
      case 'target': {
        const g = new THREE.Group();
        const t = buildTargetGhost();
        t.position.y = 1;                               // zWt — verbatim inner bake (Xqt case"target")
        g.add(t);
        return g;
      }
      case 'spotlight': {
        const gltf = await this.loader.loadAsync(C.SPOTLIGHT_GLB_URL);
        const g = new THREE.Group();
        normalizeModel(gltf.scene);                     // mie
        g.add(gltf.scene);
        // sGt([0,0]) @4907099: inner offset [0, G8r=3.5, q8r=3] aimed at the drop point
        const p = [0, 3.5, 3];
        const _kv = new THREE.Object3D();
        _kv.position.set(...p); _kv.lookAt(0, 0, 0); _kv.rotateY(Math.PI);   // kv @4904662
        g.position.set(...p);
        g.rotation.set(_kv.rotation.x, _kv.rotation.y, _kv.rotation.z);
        const outer = new THREE.Group();
        outer.add(g);
        return outer;
      }
      case 'prop': {
        // zh gate @5363293: url → qqt GLB path, else Wqt procedural (unknown key → null =
        // no ghost — the live ensure resolves null and the next dragover stays empty).
        // Our catalog derives the GLB url (PROP_GLB_DIR/category/key.glb) — same shape
        // the placed-prop path (_loadProp) loads; procedural keys route to Wqt. Gate order
        // matches our certified _loadProp (PROC_BUILDERS first) — the live's zh.url gate is
        // equivalent on our catalog data (proc keys carry no url there).
        if (PROC_BUILDERS[spec.propKey]) return buildProceduralProp(spec.propKey);
        const cat = app_propCatalog?.[spec.propKey];
        if (!cat?.category) return null;
        const url = C.PROP_GLB_DIR + cat.category + '/' + spec.propKey + '.glb';
        const gltf = await this.loader.loadAsync(url);
        const model = gltf.scene.clone(true);
        model.traverse(o => { if (o.isMesh) o.geometry = o.geometry.clone(); });
        applyClay(model);                             // FNr
        if ((cat.scale ?? 1) !== 1) model.scale.multiplyScalar(cat.scale);
        centerAndGround(model);                       // ONr
        return model;
      }
      case 'simple_figure': {
        const g = new THREE.Group();
        const fig = buildSimpleFigure();
        fig.rotation.y = Math.PI;                     // verbatim: r=Zqt(); r.rotation.y=π (the FIGURE, not the wrapper)
        g.add(fig);
        return g;
      }
      case 'humanoid': {
        const gltf = await this.loader.loadAsync(C.HUMANOID_URL);
        const model = gltf.scene;
        normalizeHumanoidMaterials(model);              // $he — materials only, NO jP rescale
        model.rotation.y = Math.PI;
        poseIdle(model, gltf.animations);               // $Nr — idle @ t=0
        return model;
      }
      default:
        return null;
    }
  }
  dispose() {
    this.disposed = true;
    for (const model of this.subjects.values()) { disposeSkeletons(model); disposeTree(model); }
    this.subjects.clear();
  }
}

// module-level catalog hook (mirrors the bundle's zh global; main.js boot wires it)
let app_propCatalog = null;
export function wireComponentCatalog(catalog) { app_propCatalog = catalog; }
function buildProceduralProp(propKey) {               // Wqt @5360465
  const builder = PROC_BUILDERS[propKey];
  if (!builder) return null;
  const mat = new THREE.MeshStandardMaterial({ color: CLAY, roughness: ROUGH });
  const g = new THREE.Group();
  for (const mesh of builder(mat)) g.add(mesh);
  return g;
}

// VUr @5621422 — component-drop controller (components palette → viewport).
// Ghost preview: ray∩plane y=0 → (x, UWt(kind), z); cache per LU key; token (u)
// invalidates in-flight loads on dragleave/drop; drop → facade addComponent + showComponentList.
export function installComponentDrop(app) {
  const el = app.renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);   // r2(new Ge(0,1,0), 0)
  const subjects = new ComponentSubjects();
  const cache = new Map();
  let ghost = null, token = 0, disposed = false;
  const ndc = new THREE.Vector2();

  const groundPoint = w => {                                       // h(w)
    const rect = el.getBoundingClientRect();
    ndc.set((w.clientX - rect.left) / rect.width * 2 - 1, -((w.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, app.camera);
    const hit = new THREE.Vector3();
    return raycaster.ray.intersectPlane(plane, hit) ? hit : null;
  };
  const clearGhost = () => { if (ghost) ghost.visible = false; ghost = null; };   // f(w)
  const showGhost = (spec, pt) => {                                // m(w,k)
    const key = componentCacheKey(spec);
    const cached = cache.get(key);
    if (cached) {
      if (ghost && ghost !== cached) ghost.visible = false;
      cached.position.set(pt.x, UWt(spec.kind), pt.z);
      cached.visible = true;
      ghost = cached;
      return;
    }
    const at = token;
    subjects.ensure(spec).then(model => {
      if (!model || disposed || at !== token || cache.has(key)) return;
      applyGhostMaterials(model);                                  // $Ur
      model.visible = false;
      app.scene.add(model);
      cache.set(key, model);
    });
  };
  const payloadOf = w =>                                           // g(w)
    w.dataTransfer?.types.includes(COMPONENT_MIME) ? app.objects.draggingComponent : null;

  const onDragOver = w => {                                        // b(w)
    const spec = payloadOf(w);
    if (!spec) return;
    w.preventDefault();
    const pt = groundPoint(w);
    w.dataTransfer.dropEffect = pt ? 'copy' : 'none';
    if (pt) showGhost(spec, pt); else clearGhost();
  };
  const onDragLeave = w => {                                       // y(w)
    const to = w.relatedTarget;
    if (to && el.contains(to)) return;
    token++; clearGhost();
  };
  const onDrop = w => {                                            // v(w)
    const spec = payloadOf(w);
    token++; clearGhost();
    if (!spec) return;
    w.preventDefault();
    const pt = groundPoint(w);
    if (pt) {
      app.addComponent(spec, [pt.x, pt.z]);
      app.showComponentList();
    }
  };

  el.addEventListener('dragover', onDragOver);
  el.addEventListener('dragleave', onDragLeave);
  el.addEventListener('drop', onDrop);
  return {
    restore: () => { token++; clearGhost(); },
    dispose: () => {
      disposed = true;
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('drop', onDrop);
      for (const model of cache.values()) { model.removeFromParent(); disposeTree(model); }
      cache.clear();
      subjects.dispose();
    },
  };
}
