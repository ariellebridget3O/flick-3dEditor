# R13 — Cloud Layer Design Audit (spec vs. actual code)

Audit of `analysis/R13_CLOUDS_RESEARCH.md` §2–§6 (the design of record) against the actual
editor code. **Research-only — no editor files were modified by this audit.**

**Situational note (important):** while this audit was running, the implementation landed in
three commits — `f49154b` (clouds.js + sky.js accessors), `93e44bb` (const/schema/env wiring),
`141089b` (main.js + ui.js). The audit therefore covers two things:
1. **Spec claims vs. the pre-existing engine code** (sky.js, env.js, finish.js, vendored
   three r182) — the 10 verification items requested.
2. **A divergence register + bug list for the shipped implementation**, since several spec
   bugs found here are *not* in the shipped code (it took a different design), and several
   shipped bugs are *not* in the spec. Line numbers cite the tree at `141089b`.

---

## Verdict summary

| # | Item | Verdict |
|---|---|---|
| 1 | sky.js dome conventions / LUT access | **CONFIRMED** (one spec inconsistency: DOME_VERT is not exported) |
| 2 | Blending math + render order | **CONFIRMED** (exact three r182 semantics verified; both domes are OPAQUE) |
| 3 | Depth behavior (xyww / LEQUAL / finish RT) | **CONFIRMED** (all four sub-claims check out) |
| 4 | Frame state (rAF, wind, plan-view freeze) | **CONFIRMED** (freeze-on-plan is real and consistent) |
| 5 | GLSL density/lighting §3.4–3.5 | **BLOCKER** (§3.4 layer-index branch renders only cirrus) + 4 CORRECTIONS |
| 6 | env.js integration seams | **CORRECTION** (memo key must include `skyStyle`; env `normalizeLight` trap was real — impl caught it; impl now has a related P1 bug, see §Impl) |
| 7 | Schema v12→v13 | **CONFIRMED** pattern (impl deviated: no version bump — decision needed) |
| 8 | Layered tier horizon behavior | **CORRECTION** (no horizon fade in spec; only fog band, too weak in clear weather) |
| 9 | PMREM isolation | **CONFIRMED** for the pre-impl code (impl changed it — twin added, with a fragility) |
| 10 | Performance claim | **CORRECTION** (45-fetch/0.8–1.8 ms arithmetic is right for the *spec's* shader; the "11 ms finish budget" framing is the wrong metric; the impl's shader is ~5× the fetch count and ships a gate) |

**Overall: SHIP-WITH-FIXES.** The architecture (dome + ONE/SRC_ALPHA custom blend, occlusion
via depth/order, LUT reuse, additive schema, structural off-byte-identity) is sound and
verified against the engine. The spec needs the §3.4 blocker fixed plus the corrections
below before it can serve as the design of record; the shipped implementation needs the P1
fixes in the implementation register (it is *not* the spec's design — classic-style clouds
were descoped and the parameter model differs).

---

## 1. sky.js dome conventions — CONFIRMED (one spec-text fix)

| Spec claim | Code reality | Verdict |
|---|---|---|
| Cloud dome can reuse DOME_VERT (xyww) | `sky.js` DOME_VERT exists (view-rotation-only, `clip.xyww`) — **but it is not exported**; sky.js's only export is `createRealisticSky`. §4 also says "sky.js: NONE. Not a single line moves." Both cannot hold: clouds.js must **copy** the 7-line vertex shader (this is what the impl did as `CL_CLOUD_VERT`). | spec-text inconsistency, trivial fix |
| Demo tone curve `1−exp(−c/wp·e)` | `sky.js` DOME_FRAG: `if (uToneMap > 0.5) L = vec3(1.0) - exp(-max(L, vec3(0.0)) / uWhitePoint * uExposure);` — exact match; `uExposure = C.SKY_EXPOSURE (10.0)`, `uWhitePoint = C.SKY_WHITE_POINT [1.08241, 0.96756, 0.95003]` (const.js:80–81) | CONFIRMED |
| `uOutputSRGB` gating | `domeMat.uniforms.uOutputSRGB` set every frame in `update()` (1 = plain OETF, 0 = finish RT / PMREM linear); `linearToSrgb` helper present in DOME_FRAG (also unexported — copy it) | CONFIRMED |
| Planet-frame camera (uCameraPosKm) | `setCamera()`: `off = bottomRadius + altitudeM/1000; cam = (x/1000, y/1000+off, z/1000)` — 4 lines, shareable | CONFIRMED |
| raySphere helpers | `raySphereIntersectNearest` in GLSL_COMMON (near root only); "plus the far root" must be written new in clouds.js — as the spec already says | CONFIRMED |
| `realistic.luts.skyView.texture` / `.transmittance.texture` accessible | `luts: { transmittance: transRT, multiscat: msRT, skyView: svRT }` returned; env holds `realistic` via `realisticSky()`. All three are HalfFloat RT textures, samplable by any material (16F sampling is core WebGL2) | CONFIRMED |
| No feedback hazard | LUT RTs are rendered **only** by `bakeScene` (a quad, `renderPass`); the dome/cloud materials only *read* them while rendering to canvas/rtScene. No read-write cycle | CONFIRMED |
| Fog band convention | **Order differs from the spec — see CORRECTION C2 (§3.7)**: sky.js applies tone curve *before* the fog mix; the spec §3.7 has it after | CORRECTION |

---

## 2. Blending math + render order — CONFIRMED

**CustomBlending semantics (vendored `three.module.js` `setBlending`, lines 10001–10130):**

```
blendEquationAlpha = blendEquationAlpha || blendEquation   // -> AddEquation
blendSrcAlpha      = blendSrcAlpha      || blendSrc        // -> OneFactor
blendDstAlpha      = blendDstAlpha      || blendDst        // -> SrcAlphaFactor
gl.blendEquationSeparate(FUNC_ADD, FUNC_ADD)
gl.blendFuncSeparate(ONE, SRC_ALPHA, ONE, SRC_ALPHA)
```

- **RGB:** `dst.rgb' = src.rgb·1 + dst.rgb·src.a = L_cloud + T·sky` — exactly the spec's
  composite. ✔
- **ALPHA:** `dst.a' = src.a + src.a·dst.a` (garbage-ish accumulation). Harmless: the canvas
  is an **opaque** context (`new THREE.WebGLRenderer({ canvas, antialias: true })` — no
  `alpha`, main.js:52), the finish composite reads only `tColor.rgb` (finish.js:231), and
  PMREM ignores alpha. No consumer of dst alpha exists. ✔
- **Premultiplied concerns:** none. `material.premultipliedAlpha` only affects the
  Normal/Additive/Subtractive/Multiply presets — the CustomBlending branch never reads it.
  HalfFloat RT blending is core WebGL2 (`EXT_float_blend` is only required for 32F); the
  finish `rtScene` is `HalfFloatType` + `samples: 4` (finish.js:313–316) — MSAA renderbuffer
  blending with these factors is fine. ✔
- **Render order:** both sky domes are **OPAQUE** (`ShaderMaterial` default
  `transparent:false`; env.js `makeSkyDome` line ~200, sky.js `domeMat` line ~605). They
  render in the opaque pass (renderOrder −1 first via `painterSortStable`), so *any*
  transparent cloud dome — the spec's −0.5 — draws after both, before other transparents
  (reverse-painter sort: renderOrder ascending, then z descending). The spec's diagram and
  reasoning are correct; the prompt's doubt ("is the classic dome transparent?") resolves to
  **no, it is opaque**. ✔

The shipped implementation took a *different but also valid* route: cloud dome in the
**opaque** pass at renderOrder −1 with the realistic dome flipped to −2
(`sky.setCloudTwin`), `depthTest:false`, relying on renderOrder-0 opaque geometry to
overdraw clouds. Opaque occluders overdraw, transparents blend over, finish/SSAO unaffected
(no depth written). Equivalent outcomes; see the divergence register for its specific risks.

---

## 3. Depth behavior — CONFIRMED

- three r182 depth clear = 1.0 (`depthBuffer.setClear(1)`, three.module.js:9839);
  `LessEqualDepth → gl.LEQUAL` (line 9554); `clip.xyww` → NDC z=1 → window depth exactly
  1.0. LEQUAL passes 1 ≤ 1 against cleared depth; fails against any geometry depth < 1.
  The spec's occlusion reasoning is exactly right. ✔
- Both domes are `depthWrite:false` (and the impl cloud dome too), so the finish RT's
  `DepthTexture` never sees cloud fragments: stays 1.0. ✔
- `finish.js:146`: `if (texture2D(tDepth, vUv).r >= 1.0) { gl_FragColor = vec4(1.0); return; }`
  — SSAO skips cloud pixels (the spec's `finish.js:146` citation is exact). ✔
- `finish.js:233`: `if (depth < 1.0) { …fog/occlusion… }` — fog pass skips cloud pixels;
  `finish.js:258` applies `toSrgb(clamp(color)) + dither()` to all pixels (exact citation).
  The in-shader fog band is therefore the only horizon-seam mechanism — which is why
  CORRECTION C2 (band order) matters. ✔
- Edge case worth noting (spec risk acceptable): geometry at exactly the far plane writes
  depth 1.0 and would tie with cloud depth under LEQUAL — unreachable in practice (far is
  fog-capped at 20 km, such geometry is fully fogged).

---

## 4. Frame state — CONFIRMED

- `main.js start()` → `requestAnimationFrame(loop)` unconditionally; `_frame()` runs every
  frame. The app is **not** render-on-demand. ✔
- `renderFrame()` is called from `_frame` **except** when the plan view is shown
  (`viewportMode === 'plan' && mode === 'edit'` → early return, main.js ~1075). So clouds
  animate in 3D view and **freeze in plan view** — both in the spec design (`uWind` advanced
  in `update()`) and the impl (internal `windClock` in `clouds.js update()`). This matches
  the sky LUT rebake pause-on-plan behavior from FIDELITY round-10 — **consistent and
  acceptable; note it in the round log** (a user staring at the plan sees stationary clouds;
  the 3D view resumes drift on return). ✔
- `renderFrame` has **no dt parameter** (main.js ~1086): the spec's
  `updateClouds(camera, outputSRGB, dt)` needs dt sourced either by passing it through
  `_frame → renderFrame` or — what the impl did — an internal `performance.now()` clock in
  clouds.js. Both fine; the spec text should say which. (Minor.)
- The `_autoMeasure` `drawPlain` hook calls `updateRealisticSky(camera, true)` directly — a
  cloud layer driven only from `renderFrame` would render the measurement frames with a
  stale `uOutputSRGB`. Harmless for timing (measurement only measures ms, canvas never
  presents the transient plain draws) — the impl's probe manages its own update. Optional
  one-liner for symmetry. (Minor.)

---

## 5. GLSL density/lighting §3.4–§3.5 — 1 BLOCKER + 4 CORRECTIONS

### B1 (BLOCKER) — §3.4 layer-index branch is wrong for gapped bands

```glsl
int i = (h > uLayers[1].x) ? 0 /*cirrus*/ : (h > uLayers[2].x) ? 1 /*cumulus*/ : 2 /*stratus*/;
```
With the spec's own bands (cirrus 6.5–7.5, cumulus 1.4–2.6, stratus 0.35–1.1; gaps
1.1–1.4 and 2.6–6.5), `uLayers[1].x` = cumulus MIN = 1.4, `uLayers[2].x` = stratus MIN = 0.35:

| h in band | branch picks | picked layer's hn | profile | result |
|---|---|---|---|---|
| 6.5–7.5 (cirrus) | i=0 cirrus ✔ | 0..1 | >0 | renders ✔ |
| 1.4–2.6 (cumulus) | h>1.4 → **i=0 cirrus** | (h−6.5)/1.0 < 0 | `sat(remap(hn,0,0.12,…))=0` | **density 0 — cumulus never renders** |
| 0.35–1.1 (stratus) | h≤1.4, h>0.35 → **i=1 cumulus** | (h−1.4)/1.2 < 0 | 0 | **density 0 — stratus never renders** |
| gaps | wrong layer | <0 | 0 | 0 (accidentally correct) |

Only cirrus survives. The threshold test implicitly assumes contiguous, stacked bands.
**Fix (spec §3.4):** containment test —

```glsl
int i = -1;
for (int k = 0; k < 3; k++) { if (h >= uLayers[k].x && h <= uLayers[k].y) { i = k; break; } }
if (i < 0) return 0.0;            // gap between bands = clear air
```

(The shipped implementation dropped the 3-band model entirely — one `uBaseKm/uHeightKm`
slab + a separate cirrus sheet — so this bug does not exist in the code. It must still be
fixed in the doc: the doc is the design of record and §3.1/§3.4 describe the 3-band model.)

### C1 — march span "union of the bands" wastes >50% of steps and starves the bands

A single 14-step march across 0.35→7.5 km gives ~0.51 km/step: the cumulus band (1.2 km)
gets ~2.3 effective samples (banding), while 3.9 km of gap (2.6→6.5, 54% of the span)
samples zero density — and the 2-step light march triples that waste. **Fix:** per-layer
sub-marches (e.g. 6/5/3 steps within each band's entry/exit) at the same total budget, or
the impl's single-slab redesign. Flag as quality+perf correction to §3.4.

### C2 — §3.7 output order: fog band must come AFTER the tone curve

sky.js DOME_FRAG (the convention the spec says it mirrors):

```glsl
float band = exp(-max(worldDir.y, 0.0) / 0.06);
if (uToneMap > 0.5) L = vec3(1.0) - exp(-max(L, vec3(0.0)) / uWhitePoint * uExposure);  // curve FIRST
L = mix(L, uFogColor, band * mix(uFogBlend, 1.0, band));                                // fog SECOND
if (uOutputSRGB > 0.5) L = linearToSrgb(max(L, vec3(0.0)));
```

The spec §3.7 does fog-mix **before** the curve → the fog color gets tone-mapped → the
horizon no longer equals the linear fog color → seam vs the FogExp2 ground (exactly R7
risk #4 that §3.7 cites as the thing to avoid). Keep the spec's `uFogColor·(1−Tview)`
alpha-aware term (it is self-consistent: at the horizon the dome behind is already ≈ fog
color, so `fog·(1−T) + T·fog = fog`), but move the mix after the curve. **The shipped
implementation already has the correct order** (clouds.js:428–431).

### C3 — ambient LUT fetch must be hoisted out of the march

§3.5's `ambient(hn)` contains `texture(uSkyViewLut, uZenithUv)` and is called per step →
14 extra fetches/px the §3.8 cost table doesn't count (44 → 58). The fetch is
hn-independent (only the scalar `(0.25+0.75·hn)` varies). Hoist to one fetch before the
loop. Same for the transmittance-tinted `Lc` (already per-fragment in the spec's layout —
keep it out of the loop). The impl hoists both (`msAmb`, transmittance tint computed once,
clouds.js:318–331).

### C4 — `dl` naming collision + dead variable

§3.5's `lightMarch` declares `const float dl = 0.45` while the view-march integration block
uses `dl` for the view step length — a redeclaration/ambiguity once merged into one shader.
Rename: `dlL` (light-march step) vs `stepDt` (view step) — and specify which one the powder
term uses (light-march `dl` is the stable choice). Also delete the dead `sunZen` line in
§3.5 (computed, never used). The impl has no collision (`lightMarch` local `dl`, view loop
`dt`).

### Confirmed sub-items

- **(c) transmittance-uv CPU port:** `lutTransmittanceParamsToUv(viewHeight,
  viewZenithCosAngle)` is 6 lines of math (H, rho, discriminant, d, d_min/d_max, uv) — a
  JS port for "sun transmittance at cloud altitude" is indeed **~8 lines**. ✔ (The impl
  instead ports the function into GLSL and computes it per-fragment at cloud-top height —
  always in sync with sky.js, no CPU mirror. Better.)
- **(d) dynamic loop:** `for (int j = 0; j < uMarchSteps; j++)` with a uniform bound is
  legal in GLSL ES 3.0 (WebGL2 dropped ES 2.0's appendix-A constant-bound restriction);
  SwiftShader handles it. ✔

---

## 6. env.js integration — CONFIRMED shape, 3 CORRECTIONS

- `applyDaylight` shape confirmed (env.js:257–298): memo key at :262, per-frame call from
  `_frame` step 5, plus every light mutator. The spec's "extend the memo key with clouds
  state" is **necessary and implemented** (env.js:263). ✔
- **CORRECTION C5 — the memo key must also include `skyStyle`.** `skyStyle` is not in the
  key, and `setSkyStyle` does not call `applyDaylight`. Cloud params (sun dir TRUE vs
  remapped, tone map, uSkySource) differ per style: switching classic→realistic with
  clouds already enabled leaves `cloudLayer.setParams` un-run (see Impl-bug P1 below — the
  shipped code hits this). Fix: append `skyStyle` to the key, or push cloud params in
  `setSkyStyle`'s realistic branch (mirroring `realistic.setParams` there).
- **The env.js `normalizeLight` trap is real and was confirmed:** env.js:69–97 rebuilds the
  light object from a whitelist; without a clouds passthrough, `loadSceneData`
  (main.js:332 `this.light = normalizeLight(scene.light ?? null)`) would strip `l.clouds`
  on load and autosave would then persist the stripped state. The spec §4/§5 **omitted this
  passthrough** (it only patched schema.js `normLight`). The shipped implementation caught
  it (env.js:82–95). Spec must add it to §4.
- `setSkyStyle` exists (env.js:310–324); scene-add order irrelevant (renderOrder governs);
  fog color: `applyDaylight` owns `scene.fog.color` (daylight horizon × weather desat),
  `createFogNearFar` owns only **density** — so `buildCloudParams` reading
  `scene.fog.color` is safe at any time. ✔ `SKY_FOG_BLEND` lives in env.js. ✔
- `DAYLIGHT_STOPS` colors: `THREE.Color(intHex)` with default `ColorManagement.enabled`
  (nothing disables it; renderer created bare, main.js:52) → **linear working space**.
  The spec's "classic: DAYLIGHT_STOPS sunColor (linear working space)" claim is correct
  (moot in the impl — classic clouds descoped). ✔
- `sunDirection(light)` remap exists (env.js:100–106); TRUE direction for realistic in
  `buildSkyParams` (env.js:120–121); night ramp `(-el-3)/11` (env.js:125). ✔

---

## 7. Schema — CONFIRMED pattern, one deviation decision

- `v11to12(n) = { ...n, v: 12 }` (schema.js:287–289) — the spec's `v12to13` additive
  no-op matches the pattern exactly. ✔ `normLight` whitelist confirmed (schema.js:180–206,
  now + clouds at :189–203). `emptyScene()` carries no light key → no clouds key needed. ✔
  `loadScene` early-return branch table confirmed (:248–249) — adding v13 means: new
  `t.v === 12 → normalizeScene(v12to13(deepCopy(t)))` early return, new `t.v === 13` direct
  return, **and** the fallback chain's final `n.v === 12` check (:262) must become 13 with
  `if (n.v === 12) n = v12to13(n)` inserted. The spec's one-line description misses the
  chain edit. (Minor.)
- **Deviation (impl):** `C.SCHEMA_V` is still **12** (const.js:169); clouds shipped as an
  optional v12 field with no migration. Forward/backward-compatible (old loaders drop the
  unknown field gracefully via normLight whitelists), but it breaks the repo's own round-10
  precedent (skyStyle *did* get the 11→12 bump for the same class of change). Either bump
  to 13 per the spec or record the no-bump rationale in HANDOFF/CONTEXT. Also note the
  shipped field shape diverges from §5.1 (`{on, style, coverage}` →
  `{enabled, mode, coverage, density, altitudeM, thicknessM, cirrus, windSpeed}`) — the
  "deliberately minimal" schema grew 6 knobs; acceptable, but the spec is no longer the
  description of what ships.

---

## 8. Layered tier horizon (§3.6) — CORRECTION

For a dome direction V, the ray–plane hit t = Δh/V.y → ∞ as |V.y|→0. Cirrus at 7 km seen
at 2° elevation hits ~200 km away: outside the 40 km tile (uv wraps — fine, tileable) but
the parallax claim breaks and the sampling becomes extremely anisotropic (smeared streaks,
visible tile repetition). The fog band does **not** cover this in clear weather:
`band·mix(uFogBlend,1,band)` at V.y=0.035 (2°) with `uFogBlend.clear = 0.06` is only
≈0.33 blend — one third fogged, two thirds stretched tiling. **Fix (spec §3.6 and the
impl's sheet path):** an explicit horizon fade on layered coverage/alpha, e.g.
`a *= smoothstep(0.0, 0.08, V.y)` — the impl's *cirrus* path already does exactly this
(`sat(worldDir.y * 6.0 + 0.4)`, clouds.js:346); the sheet loop has none. The volumetric
tier's 40 km (spec) / 30 km (impl) tMax clamp fades grazing rays by truncation — acceptable
(spec §7 risk #1), but expect a subtle "clouds thin at the horizon" ring in clear weather;
the impl's aerial-perspective mix (below) masks it reasonably.

---

## 9. PMREM — CONFIRMED (pre-impl), changed by the impl

- Pre-existing code: `bakePMREM` renders `pmremScene` containing **only** `domeTwin`
  (sky.js:649–652) — the spec's "cloud dome is NOT in sky.js's pmremScene → IBL stays
  clear-sky" was accurate. ✔
- The impl **changed this**: `setCloudTwin(mesh)` adds the cloud twin to `pmremScene` and
  flips the visible dome to renderOrder −2 (sky.js additive block). IBL now includes clouds
  (uToneMap/uOutputSRGB forced 0 during the bake, same as the dome — correct linear-HDR
  convention), and `markPMREMDirty()` rebakes on cloud param changes. This is the spec's
  §7 risk #12 "future work" pulled into round 1 — richer (overcast genuinely dims the
  scene's IBL) but at PMREM-rebake cost on every cloud knob drag (debounced 250 ms).
  **Fragility found:** in `pmremScene` both twins have default `renderOrder = 0`, so the
  dome-before-clouds compositing order relies on `painterSortStable`'s material-id
  tiebreak (domeMat is constructed before the cloud material — holds today, silently).
  Fix: `domeTwin.renderOrder = -1` or `cloudTwin.renderOrder = 1` (one line).

---

## 10. Performance claim — CORRECTION (metric + arithmetic)

- The **11 ms `COST_BUDGET_MS` is a finish-delta metric** (`costMs = finished − plain`,
  finish.js:414–418): the cloud dome renders in *both* the plain and the finish path, so
  its cost largely **cancels** in the gate (SSAO even runs *cheaper* on cloud pixels —
  `depth >= 1.0` early-out). "Fits the 11 ms finish budget" is therefore the wrong
  argument; the real constraint is **plain-frame latency**. The spec's tier system was the
  right mitigation; the impl ships a dedicated one-shot gate (`_measureCloudsBudget`:
  median of 5 plain-with vs plain-without, 1080p-normalized vs `C.CLOUD_BUDGET_MS = 11`,
  auto-fallback procedural→layered→off) — a better metric, default-on, one-time ~14 extra
  scene renders per enable.
- **Arithmetic:** spec shader = 14 view steps × (1 weather + 2 light-march fetches) + 2 LUT
  ≈ 44–45 fetches/px — consistent, and 0.8–1.8 ms @1080p is a plausible mid-GPU estimate
  for it. But hoisting bug C3 makes the spec's own code 58, and the **shipped** shader is
  32–48 steps × 6 fetches (2 per `sampleDensity`: base + detail) + 3 LUT ≈ **200–290
  fetches/px on a 128³ 3D texture** — ~5× the spec's number; expect ~2–5 ms @1080p
  upper-half on mid GPUs. Not a blocker (the gate + layered fallback cover it), but the
  spec's §3.8 table should not be read as describing the shipped cost, and QA (SwiftShader)
  should keep cloud cases small-resolution/stills-only (spec §7 risk #5 already says so).

---

## Corrected spec delta list (edits to R13_CLOUDS_RESEARCH.md)

1. **§3.4 (BLOCKER B1):** replace the 3-way threshold branch with the containment loop
   (`if (h >= uLayers[k].x && h <= uLayers[k].y)`), returning 0 in the gaps.
2. **§3.4 (C1):** replace "march spans the union of the bands" with per-layer sub-marches
   (6/5/3 steps) or restate as the shipped single-slab + cirrus-sheet model.
3. **§3.7 (C2):** reorder output ops to mood → tone curve → fog band → OETF (match
   DOME_FRAG); keep `uFogColor·(1−Tview)` inside the mix.
4. **§3.5 (C3):** hoist the sky-view-LUT ambient fetch and the transmittance-tinted `Lc`
   out of the march loop; recount §3.8 as 14×3 + 2 = 44.
5. **§3.5 (C4):** rename light-march `dl` → `dlL` (view step → `stepDt`); specify powder
   uses `dlL`; delete the dead `sunZen` line.
6. **§2.3/§3.2:** DOME_VERT and `linearToSrgb` are **not exported** from sky.js — spec must
   say "copy the 7-line vertex + helper into clouds.js" (or export them, which contradicts
   "sky.js: NONE").
7. **§4 env.js row (C5):** memo key extension must include **skyStyle** (or
   `setSkyStyle` must re-push cloud params); add the **env.js `normalizeLight` clouds
   passthrough** to the change list (the round-10 skyStyle trap — confirmed real).
8. **§4 main.js row:** `renderFrame` has no dt — specify the dt source (pass-through or
   internal clock); optionally add the cloud update to `_autoMeasure`'s `drawPlain`.
9. **§5.1/loadScene:** note the migration chain edit (`n.v === 12` final check → 13) and
   decide the version-bump question (spec says bump; impl didn't).
10. **§3.6 (§8):** add an explicit horizon fade (`smoothstep(0.0, 0.08, V.y)` on layered
    alpha) — the fog band alone is too weak in clear weather (0.06 blend).
11. **§3.8/§0:** reframe the budget claim around plain-frame latency (finish-delta cancels
    cloud cost); note the shipped shader is ~5× the spec's fetch count and is gated.
12. **§4 PMREM row:** no longer true of the shipped code (cloud twin added) — either amend
    the spec to describe the twin + `markPMREMDirty` design or record the divergence.

---

## Implementation register (shipped code at `141089b` — spec is §2–§6)

### Divergences from the spec (decisions to ratify or revert)

| # | Divergence | Assessment |
|---|---|---|
| D1 | **Classic-sky clouds descoped** — clouds are realistic-only (`setSkyStyle` gates them off in classic; UI hint says so, but the controls are still clickable in classic). Spec §0/§2.1/§5.3 promise both styles. | Product decision needed; if permanent, amend spec §2.1/§5.3 and HANDOFF. If not, the spec's `uSkySource`/classic-uniform design (§3.3) is the missing work. |
| D2 | Density model: single slab (`uBaseKm/uHeightKm` + separate cirrus sheet) instead of 3 weather bands | Sidesteps spec BLOCKER B1 — acceptable |
| D3 | 128³ RGBA8 3D shape texture (spec's "not round 1" upgrade path) + 32–48 steps (spec 14) + 6-sheet layered tier (spec 2 samples) | Quality up, cost ~5×; gated (see §10) |
| D4 | Opaque-pass compositing (cloud renderOrder −1, dome flipped to −2, `depthTest:false`, geometry overdraw) instead of transparent-pass −0.5/LEQUAL | Equivalent outcomes; spec §2.3's depth-occlusion rationale is moot in this design |
| D5 | PMREM cloud twin + IBL rebake on cloud changes (spec: no cloud IBL round 1) | See §9 — works, one fragility (P3 below) |
| D6 | Schema: no v13 bump; richer field set (`enabled/mode/coverage/density/altitudeM/thicknessM/cirrus/windSpeed`) | See §7 — ratify or bump |
| D7 | Ambient from the **multi-scatter LUT** instead of sky-view zenith; aerial perspective blends toward the sky-view sample of the same direction | Both valid LUT reuses; aerial mix is a nice horizon-convergence mechanism |
| D8 | sky.js grew additive accessors (`sharedUniforms`, `setCloudTwin`, `markPMREMDirty`) — spec said "not a single line moves" | Over-strict spec claim; the additions are behavior-neutral when clouds are off (off-byte-identity structurally holds: mesh hidden → never compiled; dome renderOrder restored) |

### Bugs found in the shipped code (this audit)

| # | Severity | Bug | Fix |
|---|---|---|---|
| P1 | **high** | **Stale cloud uniforms after classic→realistic switch.** `applyDaylight`'s memo key (env.js:262–263) includes clouds state but **not `skyStyle`**, and `setSkyStyle` (env.js:310–324) never calls `cloudLayer.setParams`/`setMode`. Sequence: enable clouds while classic (possible — UI rows are visible in classic; params never pushed because the realistic branch is skipped) → switch sky to Realistic → key unchanged → early-return forever → clouds render with constructor defaults: `uFogColor` **white**, `uFogBlend` 0.06, `uNightAmount` 0 (no moon at night), no weather desat/darken, wrong mode. Same staleness applies to any weather/az/el edit made while classic with clouds enabled in `light`. | Add `skyStyle` to the memo key (one token), or call `cloudLayer.setMode(...)` + `cloudLayer.setParams(buildCloudParams(...))` in `setSkyStyle`'s realistic branch (mirroring the existing `realistic.setParams` call there). |
| P2 | med | **Layered tier ignores coverage/density edits.** `buildSheets()` (clouds.js:552) bakes the atlas once at first enable from the *then-current* `uCoverage/uDensity`; `setParams` never rebuilds it. In `layered` mode the Coverage/Density sliders are dead (Cirrus still responds — it's in-shader). | Rebuild the atlas when coverage/density change while `mode === 'layered'` (debounce ~150 ms like the finish realloc latch), or move the coverage remap into the shader (spec's original design). |
| P3 | low | **PMREM twin order is implicit.** In `pmremScene` both twins have `renderOrder = 0`; dome-before-clouds compositing relies on the material-id tiebreak in `painterSortStable` (domeMat constructed first). Holds today, breaks silently if construction order changes. | `domeTwin.renderOrder = -1` (or `cloudTwin.renderOrder = 1`) in sky.js `setCloudTwin`. |
| P4 | low | Clouds clickable in classic UI do nothing visible (state persists, shows later in realistic) — with P1 this is the path into the stale-uniform bug. | Either hide/disable the Clouds section when `skyStyle !== 'realistic'`, or keep it and rely on the P1 fix. |
| P5 | note | QA per spec §6 step 7 not yet present: no `r13_clouds_qa.py`, no clouds-off byte-equal regression, no pixel-oracle cloud cases, no `setStatic` QA hook-up in scripts. | Add before round close (the deterministic pieces exist: `setStatic`, position-only dither `hash13(vec3(gl_FragCoord.xy, 0.0))`, `dumpWeather`). |

### Verified-good in the shipped code (spot checks)

Off-byte-identity structure (hidden mesh never compiles; `setCloudTwin(null)` restores
dome renderOrder −1); blending factors identical to spec (CustomBlending ONE/SRC_ALPHA,
`outColor = (L, Tview)`); tone→fog→OETF order matches DOME_FRAG (clouds.js:428–432 — the
spec's C2 bug was *not* reproduced); shared uniform objects with sky.js (sun/camera/radius
can't drift); wind freeze in plan view consistent with sky LUT behavior; the budget probe
restores visibility in `finally` and re-probes the fallback tier; `normalizeLight` (env)
and `normLight` (schema) both pass clouds through with identical clamps; canonical off =
field absent (setClouds deletes the key).

---

## Final verdict

**SHIP-WITH-FIXES.**

- **The spec (§2–§6):** architecturally sound — every load-bearing engine claim I could
  test (blending semantics, opaque-pass ordering, depth/finish interplay, LUT access,
  tone/OETF conventions, rAF/wind behavior, additive schema pattern) checked out against
  the real code. It must not be implemented as-written until B1 (layer branch) is fixed,
  and should absorb C1–C5 + the delta list above.
- **The shipped implementation:** a defensible redesign that already avoids B1/C2, but it
  is not the spec (classic clouds descoped, different parameter/schema model, PMREM twin)
  and it carries one high-severity integration bug (P1 stale params) plus the P2–P4 items.
  Fix P1 (+P2 for layered usability) and either ratify the divergences in the research doc
  and HANDOFF or schedule the classic-style tier as follow-up, then run the §6-step-7 QA
  (clouds-off byte-equal regression first).
