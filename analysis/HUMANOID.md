# Humanoid + simple_figure character system — complete extraction

**Live bundle**: `/home/z/flick-3dEditor/analysis/index-DBE17t4T.js` (13,457,064 bytes, minified single line, three.js r182 bundled + renamed)
**Humanoid GLB**: `/home/sync/flick-3dstage/assets/app-shell/humanoid-B4Yewrzp.glb` (2,551,836 bytes; bundle URL `/assets/humanoid-B4Yewrzp.glb`)
**Prior audit**: `/home/sync/flick-3dstage/docs/SCENE_FIDELITY_AUDIT.md` (older build `index-T1E-AuVS.js`, names reshuffled)
**Raw excerpts**: `extracted/humanoid_raw.js` (byte-offset labeled) · scripts in `tmp_c/`
**Environment constants** (renderer/floor/sun/shadows): `analysis/ENVIRONMENT.md`

All code below is de-minified from the live bundle. Backticked ids are the bundle's minified names. three.js classes are bundled under renamed ids: `Ci`=Group/Object3D, `Vt`=Mesh, `Io`=MeshStandardMaterial, `tl`=MeshBasicMaterial, `mi`=BoxGeometry, `Mi`=PlaneGeometry, `Ku`=SphereGeometry, `Al`=CylinderGeometry, `jU`=CapsuleGeometry, `Ihe`=AnimationMixer, `Bhe`=GLTFLoader, `bT`=Bone, `RR`=SkinnedMesh, `go`=Box3, `Ge`=Vector3, `qn`=Quaternion, `va`=Euler, `Bv`=Raycaster, `lie`=Sprite.

---

## 1. Shared base constants (`@4,902,034`)

```js
const pq  = "#e2e0dc";   // default color for cube/sphere/cylinder/prop (k8r)
const Phe = "#f29a5c";   // default color for humanoid + simple_figure (k8r)
const X_  = 1;           // roughness used for every figure/prop material
const zWt = 1, Jw = 6, WWt = 1.6;              // target y=1, Jw=6?, camera model y=1.6
const zWtHeight = t => t === "target" ? zWt : 0;   // UWt
const el  = t => t === "humanoid" || t === "simple_figure";      // isPerson
const fie = t => t === "camera" || t === "target" || t === "spotlight";
const k8r = t => el(t) ? Phe : pq;            // default color by kind
const ere = { animation: { clip: "idle", playing: false } };     // default humanoid animation (`@5,257,404`)
```

Person height used by ALL elevation/label math: `jP = 1.75` (`@5,116,564`, next to the GLB URL). `uje(o)` = person height = `jP * o.scale[1]` for figures.

---

## 2. simple_figure — exact geometry construction

### 2.1 Constants (`@5,249,127`)

```js
const RIr = 1.299;                       // old uIr
const sA  = jP / RIr;                    // = 1.75/1.299 = 1.347190  (old rA)
const PP  = [.406*sA, 1.059*sA, .289*sA];// body box W×H×D (old RP)
const Nie = .125*sA;                     // head sphere radius (old Iie)
const FIr = .01*sA;                      // neck gap (old .01·rA)
const OIr = PP[1] - FIr + Nie;           // head group Y (old HEAD_Y)
const LIr = [.8*sA, .88*sA];             // visor band Y bounds (old fIr)
const Pie = 72*Math.PI/180;              // visor half-arc (old Mie)
const DIr = [-6*Math.PI/180, 14*Math.PI/180];  // visor pitch range (old mIr)
const Pst = "#ffffff", BIr = "#1c0f09", HIr = .72;   // contrast colors + luma threshold
```

| Derived | Value |
|---|---|
| `sA` | 1.347190 |
| `PP` (box) | W .546959 × H 1.426674 × D .389338 m |
| `Nie` | .168399 m |
| `FIr` | .013472 m |
| `OIr` | 1.581601 m — head top `OIr+Nie` = **1.750000 m exactly** (= jP by construction) |
| `LIr` | band bottom 1.077752, top 1.185527 (height .107775, center 1.131640) |
| visor arc | ±72° (144° total) |
| visor pitch band | elevation −6°…+14° (thetaLength 20°) |

Contrast picker (band/visor color vs body fill):
```js
function aqt(hex) {                       // returns readable mark color for a body color
  const n = parseInt(hex.slice(1,7), 16);
  const luma = (.2126*(n>>16&255) + .7152*(n>>8&255) + .0722*(n&255))/255;
  return luma > HIr ? BIr : Pst;          // > .72 → dark #1c0f09, else white #ffffff
}
```
Default fill `Phe #f29a5c` → luma .6597 ≤ .72 → **mark = #ffffff** (white band + visor on orange body).

### 2.2 Mesh construction `Zqt()` (`@5,362,090`, verbatim, de-minified)

```js
const tat = .002;                          // z-fight epsilon
const nBe = t => t.userData.figure;        // figure accessor

function Zqt() {
  const [t, e, n] = PP;                              // .546959, 1.426674, .389338
  const r = new Io({ roughness: X_ });               // fill material (MeshStandardMaterial, roughness 1)
  const s = new Io({ roughness: X_ });               // mark material (band + visor)
  const a = new Ci;                                  // root group
  const o = new mi(t, e, n);                         // BoxGeometry(W, H, D)
  o.translate(0, e/2, 0);                            // feet at y=0, top at 1.426674
  a.add(new Vt(o, r));                               // BODY (box, not capsule!)
  const [l, c] = LIr;                                // 1.077752, 1.185527
  const d = new Mi(t, c - l);                        // PlaneGeometry(W, .107775)
  d.rotateY(Math.PI);                                // face -Z (local front)
  d.translate(0, (l+c)/2, -n/2 - tat);               // y=1.131640, z=-.196669 (2mm in front of body front face)
  a.add(new Vt(d, s));                               // BAND (chest stripe on the front face)
  const u = new Ci; u.position.y = OIr;              // HEAD group at 1.581601
  u.add(new Vt(new Ku(Nie, 32, 16), r));             // head sphere r=.168399, 32×16
  const [h, f] = DIr;                                // h=-6°, f=+14° (radians)
  u.add(new Vt(new Ku(Nie + tat, 32, 4,              // VISOR: sphere zone r=.170399
        3*Math.PI/2 - Pie,                           // phiStart   = 198.000°
        2*Pie,                                       // phiLength  = 144.0°   (±72° about -Z)
        Math.PI/2 - f,                               // thetaStart = 76.000° (14° above equator)
        f - h), s));                                 // thetaLength= 20.000° (down to 6° below equator)
  a.add(u);
  a.userData.figure = { fill: r, mark: s, head: u };
  Kqt(a, void 0);
  return a;
}

function Kqt(t, e) {           // setFigureColors(root, colorOverride?)
  const { fill: n, mark: r } = nBe(t);
  n.color.set(e ?? Phe);       // body fill: override or #f29a5c
  r.color.set(aqt(`#${n.color.getHexString()}`));   // band+visor: contrast color
}
function nat(t) { const {x:e, y:n, z:r} = nBe(t).head.rotation; return [e, n, r]; }   // getHeadRotation
function o$(t, e) { const [n, r, s] = e ?? [0, 0, 0]; nBe(t).head.rotation.set(n, r, s); }  // applyHeadRotation
```

Geometry summary (local space, feet at origin, **local front = −Z**):
1. **Body**: `BoxGeometry(PP)` translated up H/2 — the old audit's "capsule" assumption is wrong in both builds; it is a box (old audit §3 offline app.js matched "BODY" dims as a box too).
2. **Band**: `PlaneGeometry(PP[0], .08·sA)`, `rotateY(π)` (faces −Z), at y=(l+c)/2=1.13164, z=−(D/2+.002) — 2 mm in front of the body's −Z face.
3. **Head**: group at y=OIr=1.581601 containing `SphereGeometry(Nie, 32, 16)`.
4. **Visor**: `SphereGeometry(Nie+.002, 32, 4, 198°, 144°, 76°, 20°)` — spherical zone on the head sphere's −Z side (front), from 14° above to 6° below the equator, ±72° wide. Mark material.
5. `headRotation` field ([rx,ry,rz] radians, Euler XYZ) is applied to the head GROUP (`figure.head.rotation.set`) via `o$` — pivot = head center (sphere center at OIr).
6. Colors: fill `#f29a5c` (or per-object color override `T()`/`Kqt`), mark = contrast (white on default). Both materials `roughness 1`. No metalness set (0 default).

### 2.3 Where the figure is built (3 surfaces)

| Surface | Builder | Yaw | Notes |
|---|---|---|---|
| **Main 3D stage** `AWr.k()` (`@5,669,5…`) | `F.kind==="simple_figure" ? Zqt() : …` | **none** — figure faces −Z at object rotation 0 (matches app forward convention `i9`/`FU`: forward −Z) | object TRS applied to the per-object wrapper group (see §4.4) |
| Library tile preview `Xqt.build` (`@5,363,3…`) | `n=new Ci; r=Zqt(); r.rotation.y=Math.PI; n.add(r)` | +180° inside wrapper | 128px thumbnails (asset panel) |
| Drop ghost `VUr` (`@5,605,4…`) | `l.ensure(kind)` (Xqt) + ghost materials (opacity .45, `HUr=.45`, depthWrite false) | +180° (from Xqt) | drag & drop preview only |

### 2.4 2D plan-canvas mirror `EDr` (`@5,484,249`)

Draws the figure on the top-down plan canvas from the same constants: body rect `PP[0]×PP[2]`, head circle radius `Nie·f` (f = min(w/PP[0], d/PP[2]) scale factor), head arc `arc(…, yaw−Pie, yaw+Pie)` stroked with contrast color `u=aqt(a.human)` where `a.human` is the fill; a nose tick at `FU(yaw + headYawRad)`; scale factor `uDr=7` guarantees minimum pixel size. Footprint (`Dst`): `simple_figure → rect(PP[0]·sx/2 × PP[2]·sz/2)`, `humanoid → ellipse(.26·sx, .26·sz)` (`Fst=.26`).

---

## 3. Humanoid — loading pipeline

### 3.1 Constants (`@5,116,514`)

```js
const c5r = "/assets/humanoid-B4Yewrzp.glb";   // Hhe = c5r — GLB URL (GLTFLoader, same origin)
const jP  = 1.75;                              // nominal person height (m)
const d5r = "M_Main";                          // material name to recolor

function $he(t) {                              // applyHumanoidMaterials(scene)
  t.traverse(e => {
    if (!(e instanceof Vt)) return;            // Vt = Mesh
    const n = e.material;
    n.roughness = X_;                          // roughness = 1 on EVERY mesh (M_Main AND M_Joints)
    n.name === d5r && n.color.set(Phe);        // M_Main → #f29a5c; M_Joints keeps GLB purple #6722B5
  });
}

function u5r() {                               // loading placeholder (orange stick figure)
  const t = new Ci, e = new Io({ color: Phe, roughness: X_ });
  const n = new Vt(new jU(.18, .5, 4, 12), e); n.position.y = 1.15; t.add(n);   // torso capsule r=.18 len=.5
  const r = new Vt(new Ku(.13, 16, 12), e);    r.position.y = 1.62; t.add(r);   // head sphere r=.13
  const s = (d, u) => new Vt(new jU(d, u, 4, 8), e);                            // limb capsule factory
  const a = s(.055, .55); a.position.set(-.27, 1.15, 0); t.add(a);              // arm L
  const o = s(.055, .55); o.position.set( .27, 1.15, 0); t.add(o);              // arm R
  const l = s(.07, .65);  l.position.set(-.10, .42, 0);  t.add(l);              // leg L
  const c = s(.07, .65);  c.position.set( .10, .42, 0);  t.add(c);              // leg R
  return t;
}

function Rrt/Oje/Drt(t) { t.traverse(e => { e instanceof RR && e.skeleton.dispose(); }); }  // disposeSkeleton
function rat(t) { … }   // same as above (older copy in Xqt module)
function Kd(t) { … }    // disposeObject: dispose geometries + materials (arrays), SkinnedMesh via Prt
```

### 3.2 Main-stage humanoid build `AWr.y(objectId)` (`@5,669,5…` region, de-minified)

```js
function y(P) {                       // buildHumanoid(objectId) → wrapper group
  const F = new Ci;                   // WRAPPER group (this is what meshById stores)
  const B = u5r();                    // placeholder stick figure while GLB loads
  F.add(B);
  a.loadAsync(Hhe).then(H => {        // a = new Bhe (GLTFLoader)
    if (s.get(P) !== F) { Oje(H.scene); Kd(H.scene); return; }    // stale (object deleted)
    const z = H.scene;                                  // GLB scene group ('Rig' root child)
    const $ = new go().setFromObject(z).getSize(new Ge); // bbox in BIND pose (a_tpose): height 1.8287
    $.y > 0 && z.scale.multiplyScalar(jP / $.y);         // SCALE TO 1.75 m  (×0.956964)
    const O = new go().setFromObject(z);                 // re-measure after scale
    const W = O.getCenter(new Ge);
    z.position.x -= W.x; z.position.z -= W.z;            // center XZ
    z.position.y -= O.min.y;                            // FEET ON FLOOR (y=0)
    F.remove(B); Kd(B);                                  // drop placeholder
    $he(z);                                             // materials (roughness 1, M_Main → #f29a5c)
    F.add(z);                                           // NO extra yaw on main stage
    T(F, n.objects.peek()[P]?.color);                   // optional color override
    l(P, z, H.animations);                              // mixer + actions + bones (see §5)
    b();                                                // apply current animation state
  }).catch(H => console.error("Failed to load bundled humanoid model", H));
  return F;
}
```

- **Scale**: measured from the **bind-pose bbox** (GLTFLoader hands back nodes at rest TRS = bind pose; `Box3.setFromObject` uses geometry bboxes of the SkinnedMesh) → `scale = 1.75 / 1.8287 = 0.956964`. The default **idle@t=0** body then stands **≈1.706 m** tall (raw 1.7829 × scale); the nominal 1.75 is the bind-pose target used by all math (`uje`, labels, footprint).
- **Facing**: the GLB's own root node `Rig` bakes a 180° Y rotation, so in GLB scene space the character **faces −Z** (verified: `DEF-toe.*` world z=−0.113, forward convention `FU(0)=(0,−1)`). The main stage adds **no** extra rotation — at `object.rotation=[0,0,0]` the humanoid faces −Z, exactly like `i9`'s forward. (The library-panel `Xqt.build` DOES add `r.rotation.y=Math.PI` — panel thumbnails face +Z.)
- **Wrapper**: object TRS (`position/rotation/scale` from the scene record) is applied to the wrapper `F` in `N()` — never baked into the GLB scene. During a play session the driven character is exempt (`H!==F` guard).
- **Shadows**: the per-frame proxy pass `TOr` sets `castShadow = receiveShadow = !material.isMeshBasicMaterial` on every Mesh in the stage (so both figures + GLB meshes cast and receive; sprites (name labels) and camera/target markers are excluded).
- **Name labels** (`E`/`I`): canvas-texture Sprite (`bold 32px sans-serif`, pill bg `rgba(0,0,0,.55)`, white text, sprite scale height `Tot=.22`), positioned `y = jP + kWr = 2.0 m`, only for figures (`el(kind)`). `kWr=.25`.
- Library preview classes `y5r` (orbit tile) and `D5r` (clip tiles, `setClip(clip, IDe(clip)*.35)` — pose at 35% of duration) repeat the same normalize-to-1.75 pipeline; `D5r.setClip` seeks `action.time = t % duration` then `mixer.update(0)`.

### 3.3 Humanoid default pose `$Nr` (`@5,363,090`) — old `eEe`

```js
const DNr = "idle";
function $Nr(t, e) {                 // setDefaultPose(sceneRoot, animations)
  const n = e.find(s => s.name === DNr);      // find clip named "idle"
  if (!n) return;
  const r = new Ihe(t);                      // AnimationMixer(sceneRoot)
  r.clipAction(n).play();
  r.update(0);                               // sample at t=0
}
```
Used by `Xqt.build` (library tiles). The main stage instead goes through `AWr.l()/b()` which achieves the same (idle action, `time=0`, paused when not playing).

---

## 4. Animation catalog — 46 clips (bundle `Lhe` `@5,063,314`)

`Lhe` = array `{id, durationS}`; `XSr = new Map(Lhe.map(t=>[t.id,t.durationS]))`; `IDe(id) = XSr.get(id) ?? 1`; `t3r = new Set(ids)`. **All 46 durations verified identical** between the bundle (`Lhe`) and the GLB's embedded `animations` (accessor `input.max`), and identical to the old audit list:

| # | clip | durationS | # | clip | durationS | # | clip | durationS |
|---|---|---|---|---|---|---|---|---|
| 1 | a_tpose | 0.167 | 17 | jump_start | 1.333 | 33 | sitting_idle | 1.667 |
| 2 | crouch_fwd | 2.000 | 18 | pickup_table | 0.833 | 34 | sitting_talking | 2.917 |
| 3 | crouch_idle | 2.917 | 19 | pistol_aim_down | 0.167 | 35 | spell_simple_enter | 0.500 |
| 4 | dance | 1.000 | 20 | pistol_aim_neutral | 0.167 | 36 | spell_simple_exit | 0.417 |
| 5 | death01 | 2.375 | 21 | pistol_aim_up | 0.167 | 37 | spell_simple_idle | 2.083 |
| 6 | driving | 1.667 | 22 | pistol_idle | 1.667 | 38 | spell_simple_shoot | 0.500 |
| 7 | fixing_kneeling | 5.167 | 23 | pistol_reload | 1.667 | 39 | sprint | 0.667 |
| 8 | hit_chest | 0.333 | 24 | pistol_shoot | 0.625 | 40 | swim_fwd | 1.333 |
| 9 | hit_head | 0.417 | 25 | punch_cross | 1.000 | 41 | swim_idle | 3.333 |
| 10 | idle | 2.500 | 26 | punch_enter | 0.833 | 42 | sword_attack | 1.500 |
| 11 | idle_talking | 2.917 | 27 | punch_jab | 0.833 | 43 | sword_attack_rm | 1.500 |
| 12 | idle_torch | 1.250 | 28 | push | 2.667 | 44 | sword_idle | 1.667 |
| 13 | interact | 2.000 | 29 | roll | 1.458 | 45 | walk | 1.333 |
| 14 | jog_fwd | 0.917 | 30 | roll_rm | 1.458 | 46 | walk_formal | 1.333 |
| 15 | jump | 2.500 | 31 | sitting_enter | 1.292 | | | |
| 16 | jump_land | 1.250 | 32 | sitting_exit | 1.000 | | | |

(46 clips, total 67.294 s; order above = bundle/Glb array order. Old-audit entry "spell_simple_enter 0.5, exit 0.417, idle 2.083, shoot 0.5, sprint 0.667" = spell_simple_exit/idle/shoot + sprint ✓.)

- `clip` item validation: `n3r`-style checks; UI labels via i18n map `PU` (ids → label ids).
- Gait enum `Gzt=["walk_formal","walk","jog_fwd","sprint"]`, default `JCe="walk"`; play-sample Hz `qA=20`; keymap keys `qzt=["lmb","rmb","q","e","r","f"]`; default clip-item duration `N8=5`; path speed default `Htt=1.4` m/s.

---

## 5. Playback engine

### 5.1 Per-humanoid mixer state (`AWr.l/b/g/m`)

```js
function l(P, F, B) {                     // setupMixer(objectId, sceneRoot, animations)
  const H = new Ihe(F);                   // AnimationMixer(sceneRoot)
  const z = new Map();                    // actions: clipName -> AnimationAction
  for (const O of B) z.set(O.name, H.clipAction(O));
  const L = new Map();                    // bones: boneName -> Bone   (traverse, instanceof bT)
  F.traverse(O => { O instanceof bT && L.set(O.name, O); });
  const $ = { mixer: H, actions: z, currentClip: null, bones: L, clipLocal: new Map };
  o.set(P, $); n.onSkeletonReady?.(P); return $;
}

function b() {                            // syncAnimations — called on objects/playback change
  const P = n.objects.peek();
  for (const [F, B] of o) {               // per humanoid
    const H = d.get(F);                   // playback override state {clip, timeS} (setPlaybackClips)
    const z = P[F]?.animation;            // object.animation {clip, playing}
    const L = H?.clip ?? z?.clip;         // effective clip
    if (L === void 0) continue;
    if (B.currentClip !== L) {            // clip switch → CROSSFADE
      const O = B.actions.get(L); if (!O) continue;
      const W = B.currentClip ? B.actions.get(B.currentClip) : void 0;
      W && W.fadeOut(Sot);                // Sot = .25 s
      O.reset().fadeIn(W ? Sot : 0).play();
      B.currentClip = L;
    }
    const $ = B.actions.get(L);
    if ($)
      if (H && H.timeS !== null) {        // scrubbed/seek: paused at modulo time
        const O = $.getClip().duration;
        $.paused = true;
        $.time = O > 0 ? (H.timeS % O + O) % O : 0;
      } else if (H) $.paused = false;     // playing (play session / item)
      else {                              // object.animation only (no items)
        $.paused = !z?.playing;
        z?.playing || ($.time = 0);       // not playing → pose at t=0
      }
  }
}

// per-frame order — AWr.tick(dt):
tick: P => {
  m();                                     // (1) restore every bone from clipLocal snapshot
  for (const F of o.values()) F.mixer.update(P);  // (2) mixer overwrites bones (clip pose)
  g();                                     // (3) apply rig offsets on top
}

function m() {                            // restoreBones
  for (const F of o.values())
    for (const [B, H] of F.clipLocal) {
      const L = F.bones.get(B);
      L && (L.position.copy(H.position), L.quaternion.copy(H.quaternion), L.scale.copy(H.scale));
    }
}
function g() {                            // applyRigOffsets (d=playbackClips, u=rigOffsets, h=liveDrag)
  for (const [P, F] of o) {
    const B = f(P);                        // merged: u.get(P) + live drag offsets
    if (F.clipLocal.clear(), !!B)
      for (const [H, z] of Object.entries(B)) {
        const L = F.bones.get(H);
        L && (F.clipLocal.set(H, Uie(L)), aKt(L, z));   // snapshot then add offset
      }
  }
}
function f(P) {                           // merge store offsets with live-drag
  const F = u.get(P) ?? null;
  return h?.objectId !== P ? F : { ...F, ...h.offsets };
}
function SWr(t, e) { for (const [n, r] of t) r.stopFading(), r.enabled = n === e; }  // finishFades
```

- `Sot = .25` crossfade seconds. `IDe(clip)` = catalog duration (fallback 1).
- No `timeScale` anywhere — clip time advances 1× real time; gait clip chosen by kind, position follows `speedUnitsPerS` independently.

### 5.2 Performer state sampler `tyr/eEe` (`@4,320,763`) — per track at time t

```js
function tyr(show, t) { return show.tracks.map(n => eEe(n, t)); }

function eEe(track, timeS) {
  // r=position, s=tangent, a=yaw, o=exactY; l=last end pos (play-relative origin), c=lookAt
  // (full de-minified body in extracted/humanoid_raw.js §performer sampler)
  // ACTIVE item:
  //   path  → { clip: held ? "idle" : h.gait ?? "walk",   // JCe
  //              clipTimeS: held ? 0 : timeS - item.startS,
  //              position: oq(resampledAnchors, distance), tangent: Yae(…, distance),
  //              walking: !held, yawRad: null, exactY: false, lookAt: $tt(h, item, timeS) }
  //   play  → { clip: sample.clip, clipTimeS: timeS - item.startS,
  //              position: sample.p + prevEndOffset, yawRad: sample.yaw, exactY: true }
  //   after all items / no mover → clip item window:
  //              { clip: clipItem?.clip ?? "idle", clipTimeS: t - clipItem.startS, … }
}
function ztt(t) {   // yaw target: exact play yaw, else tangent yaw atan2(-tx,-tz), else null
  return t.yawRad !== null ? { yawRad: t.yawRad, exact: true }
       : t.tangent ? { yawRad: Math.atan2(-t.tangent[0], -t.tangent[2]), exact: false } : null;
}
```

- `khe(path, resampled, tS)` — pacing: distance = `tS·speedUnitsPerS`; with `pace` array (0..1 monotonic): `u=clamp(dist/totalLen,0,1)·(pace.length−1)`; `distance=(pace[l]+(pace[l+1]−pace[l])·frac)·totalLen`; `held = pace[l]===pace[l+1]` → **clip "idle", clipTimeS 0, walking false** while held.
- Anchors → polyline: `mT` (old `fT`) builds `{pos,in,out}` tangents; `nx` resamples to 12 pts/segment (`Ptt=12`, cubic `E2r`); `MR` total length; `oq` point-at-distance; `Yae` unit tangent-at-distance (fallback `[0,0,-1]` `C2r`).

### 5.3 Show director `jGr(t, e)` (`@5,696,741`) — returns `je`

Clocks: manual `l` (fromS..toS), recording `h` (from item start), playing `d` (seek). `y()` = current time. `je.tick(dt)`:

```js
tick: dt => {
  if (l!==null||h!==null||d!==null||seek!==null) {
    const t = y(); n.performanceTimeS.set(t);
    ue(t, dt);            // updatePerformers
    oe = true;
  } else {                // AT REST
    n.performanceTimeS.set(0);
    const rigMap = new Map;
    for (const tr of s.tracks) { const j = q(tr, 0); j && rigMap.set(tr.characterId, j); }
    e.setRigOffsets(rigMap);        // rig-transform keys at t=0 (ONLY rig offsets)
    if (oe || livePlay) { ye(); oe = livePlay !== null; }   // reset meshes once
  }
}
```

`ue(t, dt)` — per performer: position/ground/yaw/lookAt (below), sets `e.setPlaybackClips(Te)` (humanoid: `{clip, timeS}`; live-play character: `{clip, timeS:null}` = play realtime), then `L(t)` (rig/head sync). `ye()` — reset: meshes ← store TRS (+`o$` headRotation for simple_figure), `setPlaybackClips(A)` with livePlay only.

`poseNow()` = `m=null; g=snap; tick(0)` — g flag makes yaw smoothing jump instantly (`g?Math.PI:A2r*dt`).

### 5.4 Ground / height handling (in `ue`, constants `@3,926,053`)

```js
const Xae = .5;    // max step-up per target (zzt clamp: if ground-cur > .5 keep current)
const Uzt = .22;   // ground smoothing time constant (63% per .22 s): y += (tgt-y)*(1-exp(-dt/Uzt))
const Bne = 1.2;   // probe offset above the character base (ray origin = feet+1.2 m)
const A2r = 8;     // yaw chase rate rad/s (lookAt smoothing, Wzt)
```
```js
function k(x, y, z) {                     // groundYAt — Raycaster down from (x, y, z)
  v.set(w.set(x, y, z), new Ge(0,-1,0));
  const hit = v.intersectObjects(e.walkableSurfaces(), true)[0];
  return hit ? hit.point.y : null;
}
// walkableSurfaces (ENVIRONMENT.md): [floor, ...meshes whose kind NOT in
//   {camera, target, spotlight, humanoid, simple_figure, group}]  — figures never ground for others

// in ue(), per performer state Le (mesh Fe, current world Y Je):
if (Le.exactY) y = Le.position[1];                       // play samples: exact
else if (atStart) y = k(px, Le.position[1]+Bne, pz) ?? Le.position[1];
else {
  const He = k(px, Je + Bne, pz);
  if (He === null) y = Je;                                // no ground below → keep
  else { const qe = zzt(Je, He, Xae); y = Je + (qe-Je)*(1-Math.exp(-dt/Uzt)); }
}
// parented objects: worldToLocal applied, parent yaw Ue subtracted from target yaw.
// Yaw: exact → set(0, yaw-Ue, 0); tangent/lookAt → Wzt chase at A2r·dt (instant on poseNow);
//      at start with no yaw source → object's own rotation.
```

Elevation for OTHER systems (camera aim, spotlight landing): `NP(id, objects, n=.7)` = `VDe` bounds: figures use `uje` = `jP·scale[1]`; `MIr=.7` default extra; aim height `xe(vel,pos) = pos.y + CZt·scale[1]` with `CZt=1.6` (eye line 1.6·scale). Selection/bbox for figures: plan footprint `Dst` (humanoid ellipse .26·sx/.26·sz `Fst`, simple_figure rect PP·sx/2 × PP·sz/2).

### 5.5 Object-level animation API (store, `@5,266,572`)

```js
setObjectAnimation   = (id, clip)    => set({ animation: { clip, playing: prev?.playing ?? true } });
setObjectAnimationPlaying = (id, p)  => set({ animation: { clip: prev?.clip ?? "idle", playing: p } });
setObjectPose        = (id, clip)    => set({ animation: { clip, playing: false } });  // frozen at t=0
setPersonKind(id, kind)  // humanoid ↔ simple_figure switch (adds ere when becoming humanoid)
```
Old names retained. `b()` consumes it: `playing` → realtime loop; else paused at `time=0` (default pose = idle t=0 when no items).

---

## 6. Rig posing (`rig-transform` items)

### 6.1 Data + interpolation (`@3,925,067`)

```js
const QCe = { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] };   // identity joint
function S2r(a, b, n) {     // joint lerp (n∈0..1)
  return { position: tA(a.position, b.position, n),                       // linear
           rotation: [bbe(a.rotation[0],b.rotation[0],n), …],              // shortest-angle per Euler axis (tDe wrap)
           scale: tA(a.scale, b.scale, n) };
}
function Vzt(keys, tS) {    // joints at time tS: clamp before first / after last; lerp between neighbors;
}                          // missing joints default QCe (union of key joints)
function T2r(items, tS) {   // latest rig-transform item with startS ≤ tS (el ≤ startS+durationS) → Vzt(keys, el)
}
function q(track, tS) {     // same as T2r (used in director): last started rig item, time clamped to its window
}
```
Normalizer (`F8r` deep copy) uses `$zt(joints)` — deep-copies every joint `{position, rotation, scale}` (old `Bzt`).

### 6.2 Application to bones `aKt` (`@5,635,739` + `@5,636,132`)

```js
function cot(name) { return name === "root" ? false : !/^DEF-(f_|thumb)/.test(name); }  // major joint?
// majorJointsOf(id) = bones whose name passes cot  (53 joints minus root, fingers (DEF-f_*), thumbs (DEF-thumb*))

function Uie(o) { return { position: o.position.clone(), quaternion: o.quaternion.clone(), scale: o.scale.clone() }; }

function aKt(bone, j) {                    // applyJoint — LOCAL ADDITIVE offsets
  bone.position.x += j.position[0]; bone.position.y += j.position[1]; bone.position.z += j.position[2];
  bone.quaternion.multiply(Ozr.setFromEuler(dot.set(j.rotation[0], j.rotation[1], j.rotation[2]))); // post-multiply local Euler
  bone.scale.x *= j.scale[0]; bone.scale.y *= j.scale[1]; bone.scale.z *= j.scale[2];
}

function mBe(a, b) {  // delta(a relative b) — position diff; rotation = inv(b.q)·a.q → Euler; scale = a.s/b.s (0→1)
}
```
Order per frame: restore `clipLocal` → `mixer.update` → `g()` applies merged offsets (rig items at current time + live drag) — always ADDITIVE on top of the animated pose. `sampleClipRigOffsets(id, clip)` = per major joint `mBe(clipLocal@0, idleLocal@0)` — diff of a clip's t=0 pose vs idle t=0 (used to author rig keys from clips).

### 6.3 lookAt → rig/head (gaze solver `@5,451,392`)

```js
const XOr = 70° rad, YOr = 35° rad, CZt = 1.6, Wat = .4;
function xM(bodyYaw, eye, target) {       // {bodyYawRad, headPitchRad, headYawRad}
  const l = atan2(-(t.x-e.x), -(t.z-e.z));            // desired yaw (forward −Z)
  const c = wrap(l - bodyYaw);
  const d = sign(c)·min(|c|, 70°, 180°-|c|);          // head takes ≤70°
  return { bodyYawRad: wrap(bodyYaw + c - d),         // body takes the remainder (in ue() yaw chase)
           headPitchRad: clamp(atan2(dy, hypot(dx,dz)), ±35°), headYawRad: d };
}
function EZt(yaw, pitch) { /* Euler YXZ(y=pitch? see raw) → XYZ */ return [x, y, z]; }
function kje(g)  { return EZt(g.headYawRad, g.headPitchRad); }        // → headRotation
function jZt(g) { // humanoid lookAt → rig offsets, split neck 40% / head 60%, pitch negated:
  const e = n => ({ position:[0,0,0], rotation: EZt(g.headYawRad*n, -g.headPitchRad*n), scale:[1,1,1] });
  return { "DEF-neck": e(.4), "DEF-head": e(.6) };
}
function IZt(map, add) { /* merge: sum rotations element-wise per bone */ }
```
In `L(t)`: humanoids get `setRigOffsets(IZt(rigFromItems, jZt(gaze)))`; simple_figures get `o$(mesh, Kae(items, t, object.headRotation, lookAtResolver))`:

```js
function Kae(items, t, base, lookAtFn) {   // headRotation at time t (old name was Kae=walk yaw — reshuffled)
  const s = _2r(items, t);                 // latest transform item having headRotation keys, started ≤ t
  const a = lookAtFn?.(t);                 // {sinceS, headRotation} from active lookAt
  if (a && (!s || a.sinceS >= s.startS)) return a.headRotation;    // lookAt wins if more recent
  if (!s) return base ?? [0,0,0];          // fall back to object.headRotation field
  const el = min(t - s.startS, s.durationS);
  const from = Kae(items.filter(c => c.startS < s.startS), s.startS, base, lookAtFn);
  return w2r(s.keys, el, from);            // lerp headRotation keys (bbe per axis), `from` fills pre-first gap
}
```
`transform` item keys (`Bzt` interp): position/rotation(Euler)/scale + optional `headRotation` per key.

### 6.4 Rig editing UI

- **Joint spheres** `xqr` (`@5,731,515`): `SphereGeometry(.028, 12, 8)` (`bqr=.028`), `MeshBasicMaterial` `depthTest:false`, idle `#44AAFF` (`yqr=4500223`), selected `#FFCC44` (`vqr=16763972`); renderOrder 1; one sphere per **major joint** (`cot`), `userData={rigJoint, rigObjectId}`; pushed to `viewport.rigJointPickables`; visible only while a rig-transform item is selected and the playhead is inside its window; spheres track `bone.getWorldPosition`.
- **Live drag** (`pWr`/`Dzr` `@5,636,846`): TransformControls attached to Bone or the handle group; on drag start `setLiveRigDrag({objectId, offsets})` where offsets are computed by `Dzr` (world-space delta → local joint offsets via parent world quaternion); on release `captureFocusedRigPose(offsets)` → store action bakes rig-transform keys (`addRigKeyframe`), or `setObjectPose` via `bakePendingPose`.
- The GLB's **M_Joints primitive** (5157 verts, 49 joints, purple #6722B5) is a permanent part of the mannequin look (skinned joint spheres that follow the bones) — NOT the click target (those are the `xqr` spheres above).

---

## 7. Humanoid GLB inventory (ground truth)

`/home/sync/flick-3dstage/assets/app-shell/humanoid-B4Yewrzp.glb` — glTF 2.0 GLB, 2,551,836 B; JSON chunk 1,357,600 B; BIN 1,194,208 B (bufferViews 0/2 interleaved, byteStride 44 for vertex data; animations tightly packed). `extensionsUsed: []` (no Draco/morph). Full JSON dump: `tmp_c/humanoid_glb.json`.

- **55 nodes**, 1 scene `Scene` (root=[54]):
  - `Rig` [54] (ROOT, quaternion (0,1,0,0) = **180° Y baked**) → children `root` [52] (quaternion (−.7071,0,0,.7071) = −90° X) and `Mannequin` [53] (SkinnedMesh holder, mesh 0, skin 0).
  - `root` → `DEF-hips` [51] → spine.001 [42] → spine.002 [41] → spine.003 [40] → {DEF-neck [1] → DEF-head [0]; DEF-shoulder.L [20] → upper_arm.L [19] → forearm.L [18] → hand.L [17] → 15 finger joints; DEF-shoulder.R [39] → …R chain}; DEF-hips → thigh.L [46] → shin.L [45] → foot.L [44] → toe.L [43]; thigh.R [50] → …R chain.
  - All 53 skin joints carry full TRS in the GLB (bind pose); translations are bone-local offsets (e.g. DEF-hips t=[0,.0501,.9167] with a large baked rotation).
- **1 skin** `Rig`: 53 joints (root, DEF-hips + 51 DEF-*), `skeleton` attribute absent (GLTFLoader falls back to first joint), `inverseBindMatrices` accessor 10. Joint order (skin array): root, DEF-hips, spine.001/002/003, neck, head, then shoulder/arm/hand/fingers ×L, ×R, then thigh/shin/foot/toe ×L, ×R.
- **Mesh** `Mannequin` — 2 primitives:
  - prim 0 → material 0 `M_Main` (baseColor #CC670B ≈ (0.799,0.402,0.042), metallic 0, roughness .5 glTF → forced 1 at runtime; doubleSided) — body, 3390 verts, bind bbox x[−.972,.972] y[.0005,1.8292] z[−.205,.164] (**1.8287 m tall, feet at 0**).
  - prim 1 → material 1 `M_Joints` (baseColor #6722B5, roughness .5→1 runtime) — 5157 verts / 49 distinct joints — the purple joint-sphere visual skinned to the bones.
- **46 animations** — every clip 159 channels = 53 joints × {translation, rotation, scale}; interpolation mix LINEAR (3909) / STEP (3405) per channel sampler. Durations: exactly the `Lhe` table (§4) — e.g. a_tpose .166667, idle 2.5, walk 1.33333, sword_attack_rm 1.5.
- **Pose math verified** (python re-implementation, `tmp_c/glb_pose.py`): with IBM skinning, bind pose (a_tpose@0) height 1.8287 m; **idle@t=0** height 1.7829 m, feet ~0; walk@0 1.7754; sprint@0 1.6215. Runtime scale = 1.75/1.8287 = 0.956964 → default idle stance ≈ 1.706 m.
- No morph targets, no images/textures, no cameras/lights in GLB.

---

## 8. Old → new name mapping (audit build `T1E-AuVS` → `DBE17t4T`)

| Old (audit) | New (this bundle) | Meaning |
|---|---|---|
| `IP=1.75` | `jP` | person height |
| `uIr=1.299` | `RIr` | figure divisor |
| `rA=IP/uIr` | `sA=jP/RIr` | figure scale unit |
| `RP=[.406,1.059,.289]·rA` | `PP` | body box dims |
| `Iie=.125·rA` | `Nie` | head radius |
| HEAD_Y | `OIr=PP[1]−FIr+Nie` | head Y |
| — | `FIr=.01·sA` | neck gap (new explicit const) |
| `fIr=[.8,.88]·rA` | `LIr` | band bounds |
| `Mie=72°` | `Pie` | visor arc |
| `mIr=[−6°,14°]` | `DIr` | visor pitch range |
| `eEe` (default pose) | `$Nr` (+`b()`); **new `eEe` = performer state sampler** | idle@0 mixer |
| `Fhe` (46-clip catalog) | `Lhe` (+`XSr` map, `IDe` getter, `t3r` set) | clip catalog |
| `H3r` (rig/GLB) | `Hhe` (GLB URL) + `AWr.l()` bones map | rig source |
| `M_Main` | `d5r="M_Main"` (same string) | material name |
| `ere` | `ere` (unchanged) | default animation |
| `Bzt` (rig-transform normalizer) | `$zt` (deep copy); **new `Bzt` = transform-keys interpolator** | |
| `whe` (pace hold→idle) | `khe` `{held}` + `eEe` clip choice | |
| `Kae` (walk yaw from tangent) | `ztt`/`Yae`; **new `Kae` = headRotation evaluator** | |
| `fT` (tangent builder) | `mT` (+`nx` resample) | |
| `setObjectAnimation(Playing)/setObjectPose` | same names (store `@5,266,572`) | |
| `zzt`,`…` | `zzt` step clamp (same) | |
| (no name) | `jGr` show director, `AWr` mesh manager, `eEe` sampler, `aKt` joint apply, `xM` gaze, `jZt` lookAt→bones | new in this extraction |

---

## 9. Unsolved / open pieces

1. **`onSkeletonReady`** — `n.onSkeletonReady?.(P)` optional hook on the store; caller not found in this pass (probably the rig editor wiring). Cosmetic.
2. **`Jw=6`** — defined beside `zWt/WWt`; usage not traced (camera-related marker constant).
3. **`IZt` merge semantics for multiple concurrent lookAt rig offsets** — verified additive, but only one `ce` (lookAt) entry per character is ever active.
4. **`L()` fold-mode position quirk** — in `L`, when object items (`rotate/revolve/scale/transform`) apply (`mode==="fold"`), only `mesh.scale` is copied; position/rotation for fold pose appear to be applied via `le()` path in the director's other consumers (objectPoseAt for cameras). The exact mesh-visible result of a `transform` item on a **figure** (non-camera) during playback deserves a runtime test.
5. **`GA([j…],[E…])`** — Euler equivalent-representation picker used when writing mesh rotations (prevents ±π spin); extracted in raw file, semantics clear, but its two candidate forms (`[x,y,z]` vs `[x+π, π−y, z+π]`) pick the closest — reimplementers should copy it verbatim (`tmp_c` raw §rig-math).
6. **Runtime visual confirmation** — all numbers here are static-analysis derived (plus GLB pose math re-implemented in python); a headless three.js render comparison against flick.art screenshots was not done (out of scope, no app built).

## 10. Files

- `analysis/HUMANOID.md` — this document
- `analysis/extracted/humanoid_raw.js` — 16 labeled raw regions (byte offsets), 94 KB
- `analysis/tmp_c/` — scripts: `dump.py` (regex ctx dump), `at.py` (offset dump), `glb_parse.py` (GLB inventory), `glb_pose.py` (IBM skinning + pose bbox), `extract_raw.py` (region extractor), `clips_bundle.json`, `humanoid_glb.json` (full GLB JSON)
- Inputs: `analysis/index-DBE17t4T.js`, `/home/sync/flick-3dstage/assets/app-shell/humanoid-B4Yewrzp.glb`, `/home/sync/flick-3dstage/docs/SCENE_FIDELITY_AUDIT.md`, `analysis/ENVIRONMENT.md`
