# R13 — Sky-Dome Cloud Layer: Research + Integration Design

Research-only doc (no editor code was modified). Purpose: pick and spec a cloud layer that draws
**on top of the existing clear-sky rendering** (both `classic` and `realistic` styles), reacts to
sun direction / sun color / weather / time-of-day (moonlit at night), is toggleable as a setting,
and is license-safe for an offline shipped artifact. This doc supersedes the preliminary cloud
sketch in `R7_SKYBOX_RESEARCH.md` §6.3 (P2 column) — R7's "3 concentric dome shells" idea is
refined here into a **single cloud dome with a thin-shell raymarch** (same controllable layers,
better lighting, fewer draw calls).

Verification marks: **[V]** = fetched/verified from this research sandbox (raw.githubusercontent,
npm registry, GitHub HTML, HTTP probes). **[V-R7]** = verified in the round-7 session (see R7 doc).
**[UV]** = unverified from sandbox (blocked/Cloudflare/SPA) — re-verify from a browser before
relying on it. GitHub REST API was rate-limited (403) this session; repo existence + licenses were
verified via raw file fetches and GitHub HTML pages instead.

---

## §0 TL;DR recommendation

**Build a "CloudSlab" hybrid: one extra BackSide cloud dome mesh (`renderOrder -0.5`) whose GLSL3
fragment shader raymarches a thin spherical cloud shell (2.5D, 14 steps + 2-step light march)
against a procedurally baked, tileable 2D "weather" LUT (256² RGBA8), with a 2-sample
parallax-layered fast tier.** No post-processing pass, no temporal reprojection, no 3D textures
required in round 1 — it composites over whatever sky dome already rendered using
`blendSrc=ONE, blendDst=SRC_ALPHA` (radiance-add + transmittance-attenuate), so it works
identically for the classic flick dome and the realistic Hillaire dome, in both the plain render
and the finish composer RT, with zero changes to `sky.js`'s dome shader or the classic dome.

- **Volumetric quality** comes from a real raymarch through the shell (dark undersides, silver
  lining, forward-scatter glow, horizon compression) — the technique of MIT-licensed
  `SebLague/Clouds` [V] + the lighting model of the Frostbite/Nubis/takram papers-and-MIT-refs.
- **Lighting inputs we already own**: sun direction (true for realistic / remapped for classic),
  atmosphere sun tint via the existing **transmittance LUT** (warm sunset clouds), sky ambient via
  the existing **sky-view LUT**, night amount + moon direction already flow through
  `buildSkyParams()`.
- **Weather coupling**: the 5 existing states (`clear/cloudy/overcast/rain/fog`) map to cloud
  presets (per-layer coverage/density/ambient/wind) in `const.js` — clouds become the *visual*
  counterpart of the existing mood multipliers.
- **Classic stays byte-identical** when the toggle is off: the cloud mesh is `visible=false`
  (never enters the render list, never compiles), and no existing shader text changes.
- **Cost**: ≈0.8–1.8 ms @1080p for the volumetric tier, ≈0.1 ms for the layered tier — well under
  the 11 ms finish budget; auto-downgrade probe optional (§9).

Rejected alternatives and why (details §1/§3): full takram-style post-effect raymarch (needs a
composer + temporal upscaling in *both* render paths, BSM cascade machinery — 3+ rounds, gated
quality on integrated GPUs); pure texture-dome layers (no volumetric shading, wastes the LUTs we
already bake); adopting `three-volumetric-clouds` / Shadertoy / UE shader code (license-unsafe or
no license).

---

## §1 Technique survey (WebGL2 / three r182 era, 2025–2026)

| # | Name | What it is | License | Quality | Perf | WebGL2-feasible for us? | Link (fetched this session unless noted) |
|---|---|---|---|---|---|---|---|
| 1 | **`@takram/three-clouds`** (takram-design-engineering/three-geospatial, packages/clouds) | Geospatial volumetric clouds as a `postprocessing` EffectComposer effect: 3-layer local-weather 2D RGBA texture, 128³ RGBA shape + 32³ detail 3D textures, 200–500-step primary march, secondary marches to sun/ground, **Beer shadow maps (3×512² cascades)**, temporal upscaling + variance clipping + Catmull-Rom resolve, STBN blue noise, light shafts, haze. Sun/sky light sampled from the atmosphere **transmittance LUT**; Wrenninge-style multi-scatter octaves; powder term; Frostbite slide-28 analytic segment integration | **MIT ©2024 Shota Matsuda** [V: LICENSE + npm `license: MIT`, v0.7.6] | Reference-grade (closest OSS equivalent of UE5 Volumetric Cloud) | Heavy (half-res + temporal; peers: `postprocessing>=6.36.7`, R3F stack [V]) | ⚠ Architecture not directly: post-effect + composer + R3F wrappers; GLSL itself is WebGL2. **Technique + formulas are portable (the primary design source)** | `raw.githubusercontent.com/takram-design-engineering/three-geospatial/main/packages/clouds/{LICENSE,README.md,src/qualityPresets.ts,src/CloudLayer.ts,src/Procedural3DTexture.ts,src/shaders/{clouds.frag,clouds.glsl,localWeather.frag}}` [V] |
| 2 | **`SebLague/Clouds`** | Unity "Coding Adventure: Clouds" — fullscreen slab raymarch: camera→cloud-box intersection, depth-aware march limit, blue-noise start dither, HG phase, 6-step light march, Beer-Lambert, early-out at T<0.01 | **MIT ©2019 Sebastian Lague** [V: LICENSE fetched — this settles the task prompt's uncertainty] | High (the classic "cloud layer box" look) | Moderate (fixed 11 m steps in a bounded box) | ✅ **The chosen march skeleton** (ported to a spherical shell on the dome, no depth texture needed — sky pixels only) | `raw.githubusercontent.com/SebLague/Clouds/master/Assets/Scripts/Clouds/Shaders/Clouds.shader` [V, 341 lines] |
| 3 | **`CK42BB/procedural-clouds-threejs`** | Skill/cookbook: complete GLSL+WGSL for 3 paths (volumetric raymarch w/ Beer+HG+light-march, **mesh-cluster**, **billboard**), all 10 cloud genera with density/lighting params, silver linings, 2-lobe phase, Beer-powder, time-of-day palettes, god rays, tileable noise gen | **MIT ©2026 Kingsley** [V: LICENSE] | Good (stylized→semi-real) | Light–heavy per path | ✅ GLSL paths usable directly; the genera parameter table feeds our presets | `github.com/CK42BB/procedural-clouds-threejs` + `raw.../main/README.md` [V] |
| 4 | **`repalash/Open-Shaders`** (UE5 `VolumetricCloud.usf` mirror) | The actual UE5 engine volumetric cloud shader (readable HLSL) | ❌ **Epic EULA — Epic copyright header re-verified this session** ("// Copyright Epic Games, Inc. All Rights Reserved.") | Production | Production | ❌ not shippable — **read for understanding only** | `raw.githubusercontent.com/repalash/Open-Shaders/master/Engines/Unreal/Private/VolumetricCloud.usf` [V] |
| 5 | **`FarazzShaikh/three-volumetric-clouds`** | Nubis "Evolved" envelope-model volumetric clouds in three.js | ❌ **NO LICENSE** (LICENSE 404 on both `main` and `master` — re-verified this session) | Good | Moderate | ❌ unusable (all rights reserved) | `github.com/FarazzShaikh/three-volumetric-clouds` [V-R7 + this session] |
| 6 | **`fogleman/Cloud`** | (task prompt candidate) | — | — | — | ❌ **Does not exist**: `fogleman/Cloud`, `/cloud`, `/clouds` all 404; no cloud repo on the profile page [V] | — |
| 7 | **Shadertoy clouds** (iq "Clouds", BigWings "Rainier", sebh's shaders, "Cloudscape" demos) | Raymarched clouds in browser | ❌ **CC BY-NC-SA 3.0 default** (non-commercial) — and the site is Cloudflare-blocked from the sandbox [UV-R7] | Excellent | Varies | ❌ unusable for shipping (unless an individual author grants a license in writing) | `shadertoy.com` [UV-R7] |
| 8 | **`xiaxiangfeng/sky-cloud-3d`** | Physically based sky + volumetric cloud mesh | ❌ Non-commercial [V-R7] | Good | — | ❌ excluded | R7 §2 [V-R7] |
| 9 | **`sebh/TileableVolumeNoise`** | Tileable Perlin/Worley 2D+3D noise generation (the noise source of the Frostbite course) | **MIT** [V-R7] | — (utility) | Bake-time | ✅ reference for our noise-bake shader (round-1 uses 2D tileable; 3D upgrade path) | `github.com/sebh/TileableVolumeNoise` [V-R7] |
| 10 | **`Prograda/Skybolt`** (clouds shader) | Aerospace sim; `Clouds.h` coverage remap | **MPL-2.0** [V: License.txt] — takram cites its coverage formula | Good | Light (skybolt uses layered clouds + 2.5D) | ✅ (permissive; file-level copyleft if copied — we only cite the formula) | `raw.githubusercontent.com/Prograda/Skybolt/master/License.txt` [V] |
| 11 | **Frostbite course (Hillaire 2016)** "Physically Based Sky, Atmosphere and Cloud Rendering" + **Hillaire 2020 EGSR** | Cloud lighting model (Beer, multi-scatter octaves, ambient), sky LUTs — the basis of our existing sky.js | Papers/slides — algorithm knowledge, freely implementable [V-R7] | Reference | — | ✅ already implemented for atmosphere in `sky.js` | `blog.selfshadow.com/publications/s2016-shading-course/hillaire/s2016_pbs_frostbite_sky_clouds.pptx` [V-R7] |
| 12 | **Nubis (Schneider 2015) + Nubis Evolved (2017)**, **Wrenninge "Production Volume Rendering"** | Volumetric cloudscapes: coverage remap, Beer-powder, type blending, multi-scatter octaves | Talks/books — algorithm knowledge [V-R7 / UV-R7 for Wrenninge site] | Reference | — | ✅ formulas (coverage remap, powder, 2-lobe phase) | `advances.realtimerendering.com/s2015/`, `guerrilla-games.com/read/nubis-evolved` [V-R7] |
| 13 | **Guérin et al. 2020 "Interactive Clouds"** (Ubisoft) | Hybrid cloud rendering | — | Reference | — | (page unreachable [UV-R7]) — skip | `artifacts.montreal.ubisoft.com/interactive-clouds/` [UV-R7] |
| 14 | **three.js `Sky`/`SkyMesh` addons (r182)** | Preetham sky | MIT [V-R7] | No clouds | — | n/a (no cloud support) | R7 §2 [V-R7] |
| 15 | **`@pmndrs/sky`, `SkyeShark/Eanpa-Sky`, `JolifantoBambla/webgpu-sky-atmosphere`** | Modern sky systems w/ weather | MIT — **but WebGPU/TSL only** [V-R7] | High | — | ❌ (we are classic `WebGLRenderer`, WebGL2 GLSL ES 3.0, SwiftShader QA) | R7 §2 [V-R7] |
| 16 | **ambientCG** (texture route) | CC0 texture library | CC0 — **[UV]** (site unreachable from sandbox: HTTP 000, consistent with R7) | Static plates | Free | ⚠ usable but static; procedural (chosen) gives weather control + no assets to ship | `ambientcg.com` [UV] |
| 17 | **Poly Haven** | CC0 textures + HDRIs | CC0 [V API] | — | — | ❌ for cloud *textures*: API lists **870 textures, zero cloud matches** (clouds exist only as HDRIs) | `api.polyhaven.com/assets?t=textures` [V] |
| 18 | **NASA Blue Marble cloud maps** | Whole-earth cloud composite maps | Public domain (imagery guidelines) | Planet maps, not cumulus | Free | ⚠ only for a planet-dome variant (not this feature) | `visibleearth.nasa.gov/collection/1484/blue-marble` [301/UV] |
| 19 | **UE SkySphere / "Creating a Skydome" docs** | The classic prior art: static dome mesh + scrolling cloud texture material driven by sun direction | Epic content — **EULA, reference only**; docs page exists but is a JS SPA (content not fetchable) [UV] | 2010-era | Free | ⚠ prior-art reference only (the "sky dome cloud layer" the user described) | `dev.epicgames.com/documentation/en-us/unreal-engine/creating-a-skydome-in-unreal-engine` [200/UV content] |
| 20 | **Unity HDRP volumetric sky/clouds** | Built-in volumetric cloud | ❌ proprietary — reference only | High | Heavy | ❌ | general knowledge |
| 21 | **drei `<Cloud>/<Clouds>`** | Instanced billboard clouds (texture `cloud.png`) | MIT [V-R7] | Stylized | Cheap | ⚠ fallback idea only (billboards break the "sky at infinity" invariant; depth/fog interactions) | R7 §2 [V-R7] |
| 22 | **`ZyFou/ProceduralTerrains`, `Token-Gremlin/natural-disasters`, `leoawen/volumetric-clouds`** | Misc MIT WebGL cloud subsystems | MIT [V-R7 / API-R7] | Medium | Varies | ⚠ secondary references | R7 §2 |
| 23 | **`pmndrs/postprocessing`** | Effect composer (takram's runtime base) | zlib-style permissive (© Raoul van Rüschen) [V: LICENSE.md] | — | — | Only relevant if we ever adopt takram wholesale (P3+) | `raw.githubusercontent.com/pmndrs/postprocessing/main/LICENSE.md` [V] |
| 24 | **nimbUS / "cloudscape" demos** (task-prompt candidates) | — | could not locate/verify from sandbox (search engines blocked, no repo found) | — | — | **[UV]** — not load-bearing for this design | — |

**License bottom line**: everything we *implement from* is MIT (takram, SebLague, CK42BB,
TileableVolumeNoise) or public papers/talks (Hillaire, Schneider, Wrenninge, Frostbite course).
Nothing is copied verbatim; `clouds.js` will be written from scratch in this repo (values and
data-shapes informed by the references, like `sky.js` did for the atmosphere) with an attribution
header. Excluded on license: UE engine shaders (EULA), Shadertoy (NC), FarazzShaikh (no license),
xiaxiangfeng (NC), Unity (proprietary). `fogleman/Cloud` does not exist.

---

## §2 Chosen architecture

### 2.1 Decision

**One cloud dome mesh, one GLSL3 ShaderMaterial, two quality tiers, two sky sources** — inserted
between the sky domes and the scene, compositing with custom blending. Rationale vs alternatives:

| Option | Verdict | Why |
|---|---|---|
| **A. Full volumetric post-effect** (takram/UE style: half-res march + temporal upscaling + BSM cloud shadows) | Rejected for round 1 (P3 stretch) | Needs an effect composer in *both* render paths (plain render currently goes straight to canvas); temporal reprojection is fragile under orbit-cam editing; 200+ steps gated to unusability on integrated GPUs; 3+ rounds of work. Revisit if a general composer ever lands (then `@takram/three-clouds` is MIT and directly portable). |
| **B. Pure layered texture domes** (2–3 alpha shells, albedo+normal+coverage textures) | Rejected as primary | Meets the letter of "layered textures" but cannot produce dark-underside/silver-lining volumetric shading without fake ramps; wastes the physically-based light (transmittance/sky-view LUTs) we already bake; 3 draw calls of nearly-identical logic. Kept as the **`layered` fast tier** (2 parallax samples + normal-diffuse shading, ~0.1 ms). |
| **C. Hybrid 2.5D thin-shell raymarch on a cloud dome** (chosen) | ✅ | Real raymarch → volumetric look (Beer, phase, light march, horizon compression) at 14 steps ≈ 1–2 ms; no post pass, no temporal, no depth-buffer reads; deterministic (QA-friendly); works unchanged for classic + realistic, plain + finish; one mesh, one material. |

The 2.5D trick: instead of marching a fat 3D volume, we march only the **thin cloud shell**
(0.3–7.5 km altitude band, three sub-layers) along the view ray. Each sample's density comes from
a 2D tileable "weather" LUT indexed by the sample's horizontal position (parallax-correct via the
ray-sphere intersection) and its vertical profile comes from an analytic per-layer height
gradient. This is the Sebastian-Lague slab march [V] lifted onto a spherical shell (planet frame
already exists in `sky.js`), with the takram/Frostbite lighting model [V] driven by our existing
atmosphere LUTs.

### 2.2 Diagram-in-text

```
                     per frame (renderFrame, main.js)
                                      │
        ┌─────────────────────────────┼──────────────────────────────┐
        │                             │                              │
  sky domes (unchanged)         CLOUD DOME (new)                scene geometry
  classic (SKY_FRAG)           editor/js/clouds.js              floor/figures/props
  realistic (sky.js dome)      BackSide sphere, renderOrder -0.5
  renderOrder -1               transparent:true, depthTest:LEQUAL,
  depthWrite:false             depthWrite:false, fog:false, xyww vert
        │                             │                              │
        ▼                             ▼                              ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │ OPAQUE pass:  sky dome (classic or realistic) writes sky pixels, no depth │
  │               scene geometry writes color + depth                          │
  ├───────────────────────────────────────────────────────────────────────────┤
  │ TRANSPARENT pass (three sorts; our dome is the only member at rO -0.5):   │
  │   cloud frag:                                                              │
  │     V = normalize(vDirection)             (dome dir)                       │
  │     march shell [rBot..rTop] (planet frame, uCameraPosKm — shared)         │
  │       per step: density = weatherLUT(uv(p.xz, wind, layer)) × profile(h)   │
  │                  × coverageRemap(cov(weather, user))  − erosion(detail)    │
  │       light march (2 steps to sun): TL = exp(-Σ σρ dl)   [Beer]            │
  │       E = sunColor·TL·(HG2-lobe(V·L)·powder)  +  ambient(h, skyLUT/`uAmb`) │
  │       L += Tview · E·σs·(1−e^(−σt·dl))/σt   [Frostbite slide-28, as sky.js]│
  │       Tview *= e^(−σt·dl)                                                  │
  │     night: L_dir mix sun→moon, color→cool dim (uNightAmount)               │
  │     mood: desat/darken (same as domes), horizon fog band → uFogColor       │
  │     tone: realistic → 1−exp(−c/wp·e) demo curve; classic → passthrough     │
  │     OETF: uOutputSRGB (plain=1 / finish RT=0)                              │
  │     out = vec4(L_cloud, Tview)  ──blend──►  dst.rgb ×= src.a; += src.rgb   │
  │            (CustomBlending: src=ONE, dst=SRC_ALPHA, eq=ADD)                │
  └───────────────────────────────────────────────────────────────────────────┘
        │
        ▼
  finish path: rtScene (HalfFloat, linear) → SSAO skips clouds (depth==1) →
               composite: toSrgb+dither to ALL pixels; fog pass skips depth==1
               (cloud shader already self-fogs at the horizon → seam-free)
  plain path: canvas (sRGB via cloud shader's own OETF — same gate as sky.js)

  LUT bake (lazy, first enable, ~3 ms, one-time):
    256² RGBA8 tileable weather texture (R cumulus Worley-fbm, G anisotropic
    cirrus, B stratus, A erosion detail) via the sky.js bake-quad pattern.

  PMREM/IBL: cloud dome is NOT in sky.js's pmremScene → IBL stays clear-sky
             (weather dimming already handled by C.WEATHER hemi multipliers).
```

### 2.3 Why a separate mesh (not extending the dome shaders)

1. **Classic byte-identity is structural**: `env.js makeSkyDome()`'s material and `sky.js`
   DOME_FRAG stay untouched; with `light.clouds.on` false (default) the cloud mesh is
   `visible=false` → never in a render list → its material never compiles → the classic pipeline
   is bit-for-bit the current one (golden/pixel-oracle cases unchanged).
2. **One implementation serves both styles** via `uSkySource` (which sun dir / sun color /
   ambient source to use) — no duplicated cloud code in two dome shaders.
3. **The blend does the compositing**: `out = L_cloud + T·dst` needs no knowledge of the sky
   behind — the already-rendered dome supplies it. (The one thing we must re-derive per style is
   the *tone mapping* of `L_cloud` — realistic applies the demo exposure curve, classic doesn't —
   handled by `uToneMap`.)
4. **Occlusion correctness comes free**: `depthTest:true, depthFunc:LEQUAL` + the xyww far-plane
   trick (fragment depth exactly 1.0) → cloud pixels are discarded wherever geometry wrote depth,
   pass over sky/empty depth — mountains occlude clouds, clouds never occlude geometry (correct:
   clouds are at infinity behind the stage). No depth-texture reads, no post pass.

---

## §3 Shader spec (exact uniforms, LUTs, formulas)

### 3.1 Assets baked at load (lazy) — `clouds.js`

**`tWeather` — 256×256 RGBA8, tileable (RepeatWrapping), LinearFilter, deterministic seed.**
Generated by a GLSL3 fullscreen bake (reuses `sky.js`'s `BAKE_VERT` + OrthoCamera + RT pattern).
Channels (all tileable via wrapped-cell hashing, `mod` on the integer lattice):

| Ch | Layer | Noise (informed by takram `localWeather.frag` [V], TileableVolumeNoise [V-R7]) |
|---|---|---|
| R | cumulus (1.4–2.6 km) | Worley-fbm, 4 octaves, lacunarity 2.0, gain 0.85, base freq 4 (per 40 km tile), `smoothstep(0.32, 0.9, ·)` |
| G | cirrus (6.5–7.5 km) | anisotropic Perlin-fbm, 3 octaves, uv pre-scaled (6:1 stretch along wind), freq 3 |
| B | stratus (0.35–1.1 km) | low-freq Perlin-fbm, 2 octaves, freq 2, heavy smoothstep (flat deck) |
| A | erosion/detail (all) | Worley 2 octaves, freq 24 (high-frequency billow erosion) |

Cost ≈2–4 ms once (256² × ~10 octaves). RGBA8 not HDR — coverage/density only. Exposed for QA via
`dumpWeather()` (readRenderTargetPixels → Uint8Array; mirrors `sky.js dumpLut`).

*Upgrade path (not round 1):* a 64³ RGBA8 **3D shape LUT** via three r182's `WebGL3DRenderTarget`
(verified present in our vendored `three.module.js` — `texImage3D`/`TEXTURE_3D` framebuffer
attachments) exactly as takram's `Procedural3DTexture` does [V]; replaces the 2D weather map with
true 3D variation. SwiftShader (ES 3.0) supports 3D textures and layered rendering, so QA stays
valid.

### 3.2 Geometry & vertex

Same as both domes: `SphereGeometry(1, 32, 16)`, `side:BackSide`, `frustumCulled:false`,
`raycast:()=>{}`, `renderOrder:-0.5`, vertex = `sky.js` DOME_VERT (view-rotation-only, `clip.xyww`).

### 3.3 Uniforms (`clouds.js` CLOUD_FRAG, GLSL ES 3.0)

```glsl
// --- planet frame + lighting (values shared with sky.js where possible) ---
uniform vec3  uSunDir;          // realistic: TRUE dir (buildSkyParams) / classic: sunDirection(light) remapped
uniform vec3  uMoonDir;         // anti-solar, offset (buildSkyParams)
uniform float uNightAmount;     // 0 day .. 1 night (same ramp as dome: (-el-3)/11)
uniform vec3  uSunColor;        // realistic: uSunIlluminance tint × (shader-side transmittance LUT);
                                // classic: DAYLIGHT_STOPS sunColor (linear working space)
uniform vec3  uAmbientColor;    // classic-only ambient (fillSky×0.45 + fillGround×0.15), CPU-side
uniform float uSkySource;       // 1 = realistic (sample sky-view/transmittance LUTs), 0 = classic (uniforms)
uniform sampler2D uSkyViewLut;  // sky.js svRT.texture (realistic only)
uniform sampler2D uTransmitTex; // sky.js transRT.texture (realistic only; sun tint at cloud altitude)
uniform vec2  uZenithUv;        // CPU-precomputed sky-view LUT uv for the zenith (ambient fetch)

// --- cloud state ---
uniform sampler2D uWeatherTex;  // §3.1 bake
uniform vec4  uLayers[3];       // per layer i: (minH_km, maxH_km, coverage, densityScale)
uniform vec2  uWind[3];         // per layer wind uv offset (animated) — uWind[i] += dir·speed·dt on CPU
uniform float uCoverageMul;     // user coverage multiplier (schema light.clouds.coverage)
uniform float uAmbientScale;    // weather preset ambient multiplier
uniform float uPowderK;         // powder strength (weather preset; rain/overcast lower)
uniform int   uMarchSteps;      // tier: 2 = layered fast path, 14 = volumetric (dynamic loop OK in ES 3.0)

// --- output/tone (mirror sky.js dome conventions exactly) ---
uniform float uExposure;        // C.SKY_EXPOSURE (10)
uniform vec3  uWhitePoint;      // C.SKY_WHITE_POINT
uniform float uOutputSRGB;      // 1 plain render, 0 finish RT (linear)
uniform float uToneMap;         // 1 = apply demo curve (realistic), 0 = passthrough (classic)
uniform float uWeatherDesat, uWeatherDarken;  // mood ops, same values as the domes
uniform vec3  uFogColor;        // linear, === scene.fog.color
uniform float uFogBlend;        // SKY_FOG_BLEND[weather]
uniform float uTime;            // seconds; frozen when uStatic=1 (QA)
uniform float uStatic;          // QA: freeze wind + dither jitter
uniform vec3  uCameraPosKm;     // planet-frame camera (shared formula with sky.js setCamera)
uniform float uBottomRadius;    // 6360 (planet frame)
in vec3 vDirection;
layout(location = 0) out vec4 outColor;
```

### 3.4 Density model (per march step)

Frame: planet-centered, km. Camera `C = uCameraPosKm`, ray `V = normalize(vDirection)`.
Shell = 3 spherical layers; per layer i, altitude band `[uLayers[i].x, uLayers[i].y]` (km above
`uBottomRadius`). Ray/shell entry/exit via a 2-hit `raySphere` helper (near/far solutions of the
quadratic — same math as `sky.js raySphereIntersectNearest` plus the far root). The march spans the
union of the bands, clamped `tMax = min(tExit, 40 km)` (grazing rays at the horizon; the fog band
fades them anyway).

```glsl
// helpers (Schneider remap + height gradient — algorithm knowledge, Nubis talks [V-R7])
float remap(float v, float l0, float h0, float l1, float h1)
  { return l1 + saturate((v - l0) / (h0 - l0)) * (h1 - l1); }

float sampleDensity(vec3 p) {
  float h = length(p) - uBottomRadius;                 // km altitude
  // pick layer by altitude band (3-way branch on uLayers)
  int i = (h > uLayers[1].x) ? 0 /*cirrus*/ : (h > uLayers[2].x) ? 1 /*cumulus*/ : 2 /*stratus*/;
  vec4 L = uLayers[i];
  float hn = (h - L.x) / (L.y - L.x);                  // 0..1 in-band
  // parallax-correct, wind-drifting, tileable uv (40 km per tile)
  vec2 uv = p.xz / 40.0 + uWind[i] + float(uStatic) * 0.0;   // uWind frozen by CPU when static
  vec4 w = texture(uWeatherTex, uv);                   // 1 fetch
  float base = (i == 0) ? w.g : (i == 1) ? w.r : w.b;
  float detail = w.a;
  // coverage remap (Schneider; the same formula Skybolt uses, via takram [V])
  float cov = clamp(L.z * uCoverageMul, 0.0, 1.0);
  base = remap(base, 1.0 - cov, 1.0, 0.0, 1.0);
  // vertical profile: rounded top, tapered base (SebLague heightGradient [V])
  float prof = saturate(remap(hn, 0.0, 0.12, 0.0, 1.0)) * saturate(remap(hn, 1.0, 0.30, 0.0, 1.0));
  if (i == 2) prof = saturate(remap(hn, 0.0, 0.05, 0.0, 1.0)) * saturate(remap(hn, 1.0, 0.10, 0.0, 1.0)); // flat deck
  // erosion (high-frequency detail eats edges)
  base = saturate(remap(base - detail * 0.35, 0.0, 1.0, 0.0, 1.0));
  return L.w * base * prof;                            // ρ ∈ [0, ~1.5]
}
```

### 3.5 Lighting model (the "extremely high quality directional lighting" part)

Constants: extinction `σt = ρ · σk` with `σk ≈ 0.9 km⁻¹` (tunable); scattering albedo
`ω = 0.96` → `σs = ω·σt` (clouds scatter almost everything — the whiteness).

**Light direction & color (style- and time-aware):**
```glsl
vec3  Ld   = normalize(mix(uSunDir,  uMoonDir, uNightAmount));   // light dir: sun → moon at night
vec3  Lc   = mix(uSunColor, vec3(0.42, 0.52, 0.75) * 0.05, uNightAmount);  // moonlight: cool, dim
// realistic only: warm low-sun tint — sun transmittance through the air mass at cloud altitude:
if (uSkySource > 0.5) {                                          // 1 fetch (reuse sky.js LUT!)
  float sunZen = clamp(dot(uSunDir, normalize(p)), -1.0, 1.0);   // ≈ constant per frame; use zenith form
  Lc *= texture(uTransmitTex, uTransmittanceUvZenith).rgb;       // uTransmittanceUvZenith precomputed CPU-side
}
```
(Golden-hour clouds fall out of this for free — the same LUT that reddens the sun disc reddens
the cloud illumination.)

**Phase — dual-lobe Henyey-Greenstein** (forward silver lining + back-scatter halo; Wrenninge /
CK42BB / takram variants [V]):
```glsl
float hg(float mu, float g) { float g2 = g*g; return (1.0 - g2) / (4.0*PI*pow(1.0 + g2 - 2.0*g*mu, 1.5)); }
float phase2(float mu) { return mix(hg(mu, -0.20), hg(mu, 0.72), 0.62); }   // g_back, g_fwd, mix
```

**Light march (self-shadowing → dark undersides), 2 steps:**
```glsl
float lightMarch(vec3 p, vec3 Ld) {
  const float dl = 0.45;                       // km — one step ≈ half a layer's thickness
  float tau = 0.0;
  for (int j = 0; j < 2; j++) { tau += sampleDensity(p + Ld * (float(j) + 0.5) * dl) * SIGMA_K * dl; }
  return exp(-tau);                            // Beer-Lambert T toward the light
}
```

**Powder (bright rims on thin edges)** — Schneider's dark-edge/bright-edge term:
```glsl
float powder = 1.0 - exp(-2.0 * SIGMA_K * rho * dl);   // ≈1 deep inside, →0 at edges
```

**Ambient (sky light) — reuse the atmosphere LUTs we already bake:**
```glsl
vec3 ambient(float hn) {                       // hn: in-band height 0..1 — tops sky-lit, bases dark
  vec3 sky = (uSkySource > 0.5)
    ? texture(uSkyViewLut, uZenithUv).rgb                // 1 fetch — realistic: the actual sky radiance
    : uAmbientColor;                                      // classic: daylight-table mix, CPU-side
  return sky * (0.25 + 0.75 * hn) * uAmbientScale;        // dark undersides gradient
}
```
(This is the cheap cousin of takram's `skyIrradiance * RECIPROCAL_PI4 * skyGradient` [V] —
one LUT fetch instead of an irradiance integration; visually sufficient at editor scale.)

**Per-step integration** — the same analytic segment integral `sky.js` already uses
(Frostbite slide-28 [V-R7]), so the energy behavior matches the atmosphere code exactly:
```glsl
// E: radiance incident-scattered at the sample (sun + ambient)
vec3 E = Lc * Tlight * phase2(dot(V, Ld)) * mix(1.0, powder, uPowderK)
       + ambient(hn);
vec3 Sint = (E * sigmaS - E * sigmaS * exp(-sigmaT * dl)) / sigmaT;   // = E·σs·(1−e^(−σt·dl))/σt
Lcloud += Tview * Sint;
Tview  *= exp(-sigmaT * dl);
if (Tview < 0.03) break;                       // early-out (SebLague [V])
```

**Silver-lining boost (explicit, art-directable):**
```glsl
Lcloud += Lc * pow(max(dot(V, Ld), 0.0), 8.0) * (1.0 - rho) * 0.35 * Tlight;  // thin-edge forward glow
```

### 3.6 `layered` fast tier (the "texture-based but layered" ask, ~0.1 ms)

`uMarchSteps == 2`: instead of the march, take one sample per layer at the ray–layer **plane**
hit (mid-altitude plane per layer, parallax uv), compute a **normal from the coverage gradient**
(2 extra fetches, finite differences, mapped to world via the layer's tangent frame), and shade:

```glsl
float  a   = coverageAt(layerPlaneHit(i));                       // opacity source
vec3   N   = normalize(vec3(-dCdx * k, 1.0, -dCdz * k));         // "normal map layer" (derived, not baked)
float  wrap = clamp((dot(N, Ld) + 0.35) / 1.35, 0.0, 1.0);       // wrapped diffuse — sun-facing sides
vec3   col  = Lc * wrap * mix(1.0, powderCheap, 0.5)
            + ambient(0.5)
            + Lc * pow(max(dot(V, Ld), 0.0), 8.0) * 0.25         // silver lining
            + Lc * pow(max(dot(N, Hvec), 0.0), 24.0) * 0.06;     // sheen/spec (ice cirrus, wet decks)
float  T   = exp(-SIGMA_K * a * thicknessKm(i));
```
This is the ambientCG/BlenderKit-style "albedo + normal + coverage layers" look, but procedural
(no shipped assets, weather-reactive coverage), and it doubles as the auto-downgrade fallback.

### 3.7 Output & compositing

```glsl
// mood ops — identical to the domes (Rec.601 desat + darken), so clouds weather-match the sky
float lum = dot(Lcloud, vec3(0.299, 0.587, 0.114));
Lcloud = mix(vec3(lum), Lcloud, 1.0 - uWeatherDesat) * (1.0 - uWeatherDarken);

// horizon fog band — the SAME band the realistic dome uses (exp(-y/0.06)); clouds must converge
// to the fog color exactly like the sky does, or the horizon reads as a bug (R7 risk #4):
float band = exp(-max(V.y, 0.0) / 0.06);
Lcloud = mix(Lcloud, uFogColor * (1.0 - Tview), band * mix(uFogBlend, 1.0, band));

// tone: realistic = the dome's demo curve (1 - exp(-c/wp·e)); classic = passthrough (palette space)
if (uToneMap > 0.5) Lcloud = 1.0 - exp(-max(Lcloud, 0.0) / uWhitePoint * uExposure);
if (uOutputSRGB > 0.5) Lcloud = linearToSrgb(max(Lcloud, vec3(0.0)));   // sky.js's helper

outColor = vec4(Lcloud, Tview);
```
Material blending (JS): `blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
blendSrc: THREE.OneFactor, blendDst: THREE.SrcAlphaFactor, transparent: true,
depthTest: true, depthFunc: THREE.LessEqualDepth, depthWrite: false` — i.e.
`dst' = src.rgb + src.a · dst.rgb` = `L_cloud + T · sky` (radiance added, background attenuated —
correct HDR-ish over-compositing in both the sRGB canvas and the linear finish RT).

**QA determinism**: start-offset dither `hash(gl_FragCoord.xy)` (no time term); wind offsets are
CPU-driven (`uWind[i] += dir·speed·dt`) and frozen by `setStatic(true)` — the pixel-oracle's
converge-twice-3s-apart check then sees a stable image.

### 3.8 Cost estimate (1080p reference, cloud pixels ≈ upper 40–60% of screen)

| Tier | Fetches/px | Est. GPU time | Budget impact |
|---|---|---|---|
| volumetric (14 steps × (1 + 2×1) fetches + 2 LUT) | ≈ 45 | 0.8–1.8 ms (mid GPU), ~6–10 ms SwiftShader (QA stills only) | within the 11 ms finish budget without gating |
| layered (3 layers × 4 fetches) | ≈ 12 | ≈ 0.1–0.3 ms | negligible |
| weather LUT bake | — | ≈ 2–4 ms once (lazy, first enable) | one frame hitch on toggle, acceptable (same class as the sky LUT bake) |

Optional gate (stretch): a one-shot probe at first enable reusing the `measureFinish`/scheduler
pattern (`finish.js` `costWithinBudget`) → auto-downgrade volumetric→layered + localStorage
memory, mirroring the finish auto-measure UX.

---

## §4 Integration seams (exact files/functions)

| File | Change |
|---|---|
| `editor/js/sky.js` | **NONE.** Not a single line moves (the cloud dome only *reads* its RT textures: `realistic.luts.skyView.texture`, `.transmittance.texture` — exposed since round 10). |
| `editor/js/env.js` | import `createCloudLayer`; construct after `createRealisticSky`; `scene.add(cloud.mesh)`; new `buildCloudParams(light, g, fogColor, style)` (~30 lines, sibling of `buildSkyParams`: per-style sun dir — `sunDirection(light)` remapped for classic vs TRUE for realistic, sun color — `daylightAt().sunColor` vs `buildSkyParams` tint, night/moon/fog pass-through, preset lookup); `applyDaylight` calls `cloud.setParams(...)` when on (extend the memo key with clouds state); `setSkyStyle` also sets cloud `uSkySource`; new `updateClouds(camera, outputSRGB, dt)` called from renderFrame regardless of skyStyle; new `setClouds(state)` gate. |
| `editor/js/main.js` | `setClouds({on, style, coverage})` (mirrors `setSkyStyle`); `renderFrame` adds `this.env.updateClouds(this.camera, !finishOn, dt)` next to `updateRealisticSky`; scene-restore path applies `light.clouds`; autosave via `markAutosave`. |
| `editor/js/schema.js` | `SCHEMA_V` 12→13 (const), `v12to13(n) = { ...n, v: 13 }` (additive no-op like `v11to12`), `normLight` validates `l.clouds` (see §5). |
| `editor/js/const.js` | `C.SCHEMA_V = 13`; `C.CLOUD_STYLES = ['off', 'layered', 'volumetric']`; `C.CLOUD_PRESETS` (§5); `C.CLOUD_COV_MAX = 1.25`. |
| `editor/js/ui.js` | light popover: Clouds segmented row + coverage slider + hint (§5.2), handlers → `app.setClouds`. |
| `editor/js/clouds.js` | **NEW** — everything in §3 (bake, material, mesh, params, update, dispose, dumpWeather, setStatic, _debug). |
| `scripts/` QA | `r13_clouds_qa.py` probe (static mode, dump pixels above horizon, variance assertions + clouds-off regression byte-check), pixel-oracle cases; perf probe optional. |

**PMREM interplay**: unchanged by construction — `sky.js bakePMREM` renders `pmremScene` which
contains only the dome twin; the cloud mesh lives in the editor scene, so `scene.environment`
stays the clear-sky IBL. Overcast dimming of scene lighting is already provided by the existing
`C.WEATHER` hemi/sun multipliers — deliberately kept separate (physics in clouds, mood in lights,
the same split `SKY_WEATHER` established in round 10). If cloud IBL is ever wanted: add a cloud
twin to `pmremScene` + a `uToneMap=0` path (the uniforms already support it) — one-line-ish, but
re-bake cost grows; explicitly out of scope round 1.

**Finish composer interplay**: cloud pixels have depth 1.0 (depthWrite:false) → SSAO pass
early-outs (`depth >= 1.0`, `finish.js:146`) → composite applies toSrgb+dither to all pixels
(`finish.js:258`) and its fog pass skips depth==1 — our in-shader fog band (§3.7) is what keeps
the horizon seamless, exactly like the realistic dome already does.

---

## §5 Schema v13 + UI spec

### 5.1 Schema (minimal field set)

```jsonc
"light": {
  // ... existing v12 fields ...
  "clouds": {              // ABSENT in all pre-v13 scenes → off (byte-identical classic & realistic)
    "on": true,            // boolean, default false
    "style": "volumetric", // 'layered' | 'volumetric' (default 'volumetric' when on)
    "coverage": 1.0        // 0..1.25 multiplier over the weather preset (default 1)
  }
}
```
Deliberately minimal: everything else (per-layer coverage/density/altitude/wind/ambient) derives
from `light.weather` via `C.CLOUD_PRESETS` — one knob per concept, no scene bloat, and weather
changes keep looking coherent. Per-layer overrides can be a v14+ additive extension (the uniform
array already accepts them).

`normLight` (schema.js) additions:
```js
if (l.clouds && typeof l.clouds === 'object') {
  const c = {};
  if (l.clouds.on === true) c.on = true;
  if (c.on) {
    c.style = l.clouds.style === 'layered' ? 'layered' : 'volumetric';
    if (Number.isFinite(l.clouds.coverage)) c.coverage = Math.min(1.25, Math.max(0, l.clouds.coverage));
  }
  if (Object.keys(c).length) n.clouds = c;   // {on:false} dropped entirely → canonical off = absent
}
```
Migration: `v12to13` bumps `v` only (additive); `loadScene` gains the `t.v === 12` branch.
`emptyScene()` unchanged (no clouds key). All existing golden fixtures and pixel-oracle cases are
unaffected (clouds absent).

### 5.2 Weather → cloud presets (`const.js`)

`C.CLOUD_PRESETS[weather] = { cov: [cirrus, cumulus, stratus], density, ambient, powder, wind, dark }`

| weather | cirrus | cumulus | stratus | density | ambient | powder | wind× | extra |
|---|---|---|---|---|---|---|---|---|
| clear | 0.16 | 0.24 | 0.02 | 1.00 | 1.00 | 0.55 | 1.0 | — |
| cloudy | 0.30 | 0.48 | 0.26 | 1.00 | 0.90 | 0.50 | 1.2 | — |
| overcast | 0.28 | 0.30 | 0.92 | 1.15 | 0.72 | 0.40 | 1.1 | stratus deck dominates |
| rain | 0.18 | 0.42 | 0.95 | 1.35 | 0.50 | 0.35 | 1.6 | dark bases (ambient↓ + darken) |
| fog | 0.10 | 0.12 | 0.45 | 1.20 | 0.80 | 0.30 | 0.6 | low deck; horizon fog band dominates |

(Supersedes R7 §6.3's turbidity-era sketch; values are starting points, tuned in-editor.)

### 5.3 UI (light popover, `ui.js` — directly after the Sky style row `#lpSky`)

```html
<div class="row"><span class="lbl">Clouds</span>
  <div class="seg clouds" id="lpClouds">
    <button data-c="off">Off</button>
    <button data-c="layered">Layered</button>
    <button data-c="volumetric">Volumetric</button>
  </div></div>
<div class="row" id="lpCovRow"><span class="lbl">Coverage</span>
  <input type="range" id="lpCov" min="0" max="1.25" step="0.05">
  <span id="lpCovVal">1.00</span></div>
<div class="lp-hint" id="lpCloudsHint"></div>
```
- Render: mirror the `#lpSky` pattern (`el.querySelectorAll('#lpClouds button') … classList.toggle('on', …)`);
  slider row hidden when off; hint text: volumetric = "Ray-marched cloud layer lit by the sun and
  sky (MIT-technique, ~1–2 ms)." layered = "Fast two-layer clouds with sun-facing shading."
  off = "Clear sky (default)."
- Handlers: `b.onclick = () => { commit(() => app.setClouds({ on: b.dataset.c !== 'off', style: b.dataset.c })); render(); }`;
  slider `input` → `app.setClouds({ coverage })` with the same beginEditGesture/endEditGesture
  pattern as `lpAmb` (live drag = uniform update only; commit on pointerup, matching ambient
  slider behavior).
- The row is visible for BOTH sky styles (clouds work on classic and realistic).
- `setClouds` on `app` mutates `this.light.clouds`, calls `this.env.setClouds(state)` +
  `this.env.applyDaylight(this.light)` + `markAutosave()` — identical shape to `setSkyStyle`.

---

## §6 Implementation plan (one round, file-by-file, function-level)

Ordered so the editor stays green at every step:

1. **`const.js`** — add `C.CLOUD_STYLES`, `C.CLOUD_PRESETS`, `C.CLOUD_COV_MAX`; bump `C.SCHEMA_V = 13`.
2. **`schema.js`** — `v12to13` + `loadScene` v12 branch + `normLight` clouds validation (§5.1).
   *Checkpoint: all existing QA passes unchanged (pure additive).*
3. **`clouds.js`** (new, ~480 lines) —
   - `const CLOUD = { SIGMA_K: 0.9, TILE_KM: 40.0, TMAX_KM: 40.0, DITHER: … }`;
   - `WEATHER_BAKE_FRAG` (GLSL3): wrapped-hash Perlin + Worley fbm → R/G/B/A per §3.1;
   - `CLOUD_VERT` (xyww dome), `CLOUD_FRAG` per §3.3–§3.7 (single source, both tiers, both sky sources);
   - `createCloudLayer({ renderer })`:
     - `makeWeatherRT()` (RGBA8 RT 256², RepeatWrapping — note: RT textures clamp by default in three; use `rt.texture.wrapS/T = RepeatWrapping` before first use),
     - lazy `bakeWeather()` on first `setEnabled(true)`,
     - `setParams(p)` (all §3.3 uniforms; string-key memo like sky.js `paramKey` to skip no-op uploads),
     - `update(camera, outputSRGB, dtSeconds)` (uCameraPosKm from the same planet-frame formula as sky.js `setCamera`; advance `uWind` by preset wind × dt unless `staticMode`; set uOutputSRGB),
     - `setEnabled(v)`, `setStatic(v)` (QA), `dispose()`, `dumpWeather()` (Uint8Array readback), `mesh`, `materials.cloud`, `_debug`.
   *Checkpoint: module loads standalone; no callers yet.*
4. **`env.js`** — wire per §4: import, construct, add mesh, `buildCloudParams`, `applyDaylight` hook,
   `setSkyStyle` → `uSkySource`, `updateClouds`, `setClouds`. LUT sharing:
   `cloud.setLuts(realistic.luts)` (transmittance + sky-view textures + `uZenithUv` computed via the
   same `skyViewLutParamsToUv` math in JS — small port of 8 lines).
   *Checkpoint: clouds render in realistic mode via console/`_debug` forcing.*
5. **`main.js`** — `setClouds`, renderFrame hook, restore-from-scene, autosave.
6. **`ui.js`** — §5.3 markup + render + handlers (follow the `lpSky` diff shape from round 10).
7. **QA scripts** — `scripts/r13_clouds_qa.py`:
   - regression: clouds-off classic + realistic vs round-12 golden (byte-equal),
   - clouds-on (static): 3 weathers × midday/golden-hour/night, realistic + classic, layered + volumetric — assert ≥N% pixels above horizon deviate from clear-sky capture, horizon row ≈ fog color, night case shows moon-side brightening,
   - `dumpWeather()` channel sanity (tileable: column 0 ≈ column 255),
   - perf probe (real GPU, not SwiftShader): volumetric-on vs off dome render ≤ 2.5 ms delta at 1080p.
8. **Docs** — this file + a short ATTRIBUTION block in `clouds.js` header (MIT refs: SebLague/Clouds,
   takram/three-geospatial clouds, CK42BB, sebh/TileableVolumeNoise; papers: Hillaire 2016/2020,
   Schneider Nubis, Wrenninge). Update `CONTEXT.md`/`PLAN.md` pointer lines per repo convention.

Sizing: steps 1–2 ~30 min, step 3 the bulk (~half the round), 4–6 mechanical, 7–8 validation.
Fits one round with QA margin; the layered tier (§3.6) can be descope-safe if time runs short
(schema already carries it as an enum value; UI hides it until shipped).

---

## §7 Risks + fallbacks

| # | Risk | Mitigation / fallback |
|---|---|---|
| 1 | **Horizon over-densification** (grazing rays spend up to 40 km in the shell → walls of cloud) | `TMAX_KM` clamp (40) + the fog-band mix already fades clouds to fog color below ~2°; fallback: hard coverage falloff `smoothstep(0.0, 0.06, V.y)` on layer 2 (stratus) only. |
| 2 | **Classic byte-identity regression** | Structural: no existing shader text changes; cloud mesh `visible=false` default → never compiled. QA case 7.1 proves byte-equality; if a driver compiles-on-setParams anyway, gate material creation behind first `setEnabled(true)` (already the design). |
| 3 | **QA convergence vs wind drift** (pixel oracle diffs two captures 3 s apart) | `setStatic(true)` freezes wind + uses position-only dither; oracle cases run static. Live default animated. |
| 4 | **Perf on integrated GPUs** | Tier system; volumetric ≈1–2 ms worst case is under budget by itself; optional auto-downgrade probe (finish.js scheduler pattern) if measurement says otherwise; worst case default the *setting* to `layered` on detected weak GPUs (localStorage pref, like finish). |
| 5 | **SwiftShader QA slowness** | Bounded loops (14×(1+2) density evals), 256² bake, no half-res passes; stills converge in seconds; keep cloud cases out of the `live.py` 3–5 min/case path if needed. |
| 6 | **Seam between cloud fog band and FogExp2 ground** | Reuse the exact band formula/blend values from the realistic dome (§3.7) — same mechanism that already works there; QA asserts horizon-row color ≈ fog color. |
| 7 | **Night clouds too dark / wrong side lit** | Explicit moon mix (dir + cool dim color §3.5) + nightAmt ramp shared with dome; QA night case asserts moon-side silver lining present. |
| 8 | **Blending surprises in the finish RT (HalfFloat, linear)** | `src=ONE/dst=SRC_ALPHA` is format-agnostic; cloud radiance bounded [0, ~30] like the sun disc; clamp negatives before OETF (already spec'd). Composite clamps to [0,1] anyway. |
| 9 | **Transparent-sort interaction with glassy props** | Only member at renderOrder −0.5; depth LEQUAL resolves vs opaque; other transparents draw after and blend over clouds (correct order: clouds farthest). |
| 10 | **License contamination** | All-new code, informed by MIT sources + papers; attribution headers; nothing vendored (no new `tmp_*` registry needed). Re-verified this session: takram MIT, SebLague MIT, CK42BB MIT, Skybolt MPL-2.0 (formula citation only), FarazzShaikh no-license (avoided), Shadertoy NC (avoided), UE shaders EULA (avoided). |
| 11 | **Volumetric look disappoints vs "extremely high quality" expectation** | Escalation path, in order: (a) raise steps to 24 + adaptive step size (SebLague's `dstToFocalPoint`-style); (b) 64³ 3D shape LUT via `WebGL3DRenderTarget` (verified available in vendored r182) — takram's `Procedural3DTexture` pattern [V]; (c) half-res cloud pass + bilateral upsample (needs a mini-composer — pair with the finish RT path first); (d) full takram port (P3) with BSM cloud shadows — MIT, but a composer + temporal system (2–3 rounds). |
| 12 | **PMREM/IBL mismatch (clouds not in IBL)** | Accepted round 1 (documented §4); weather dimming already exists via C.WEATHER light multipliers; future: cloud twin in `pmremScene` (uniforms already support linear output). |

---

## §8 References (actually fetched this session unless marked [V-R7]/[UV])

**Verified fetches (this session):**
- `https://raw.githubusercontent.com/takram-design-engineering/three-geospatial/main/LICENSE` — MIT ©2024 Shota Matsuda
- `https://raw.githubusercontent.com/takram-design-engineering/three-geospatial/main/packages/clouds/README.md` — features (BSM, temporal, light shafts), R3F/postprocessing usage
- `https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/clouds/src` (+ `/src/shaders`) — file inventory via GitHub HTML
- `.../src/qualityPresets.ts` — 200–500 primary steps, 3×512² BSM cascades, 8 MS octaves, tier knobs
- `.../src/CloudLayer.ts` — per-layer params (altitude/height/densityScale/shape/coverageFilterWidth/densityProfile)
- `.../src/Procedural3DTexture.ts` — 3D texture bake via `WebGL3DRenderTarget` + GLSL3 slices (WebGL2-safe)
- `.../src/shaders/clouds.frag` (1003 lines) — transmittance-LUT reuse, Wrenninge octaves, powder, slide-28 integration, BSM sampling
- `.../src/shaders/clouds.glsl` — coverage remap (cites Skybolt), spherical/cube-sphere uv mapping, STBN
- `.../src/shaders/localWeather.frag` — Worley-fbm local weather bake (4 layers → RGBA channels)
- `.../src/constants.ts` — shape 128³ / detail 32³ / weather asset URLs
- `https://registry.npmjs.org/@takram/three-clouds` — v0.7.6, license MIT, peer deps (postprocessing/R3F)
- `https://raw.githubusercontent.com/SebLague/Clouds/master/LICENSE` — **MIT ©2019 Sebastian Lague**
- `https://raw.githubusercontent.com/SebLague/Clouds/master/Assets/Scripts/Clouds/Shaders/Clouds.shader` — slab march skeleton (box dst, blue-noise dither, HG, light march, Beer, early-out)
- `https://raw.githubusercontent.com/CK42BB/procedural-clouds-threejs/main/LICENSE` + `README.md` — MIT ©2026 Kingsley; 3 paths + 10 genera + lighting terms
- `https://raw.githubusercontent.com/repalash/Open-Shaders/master/Engines/Unreal/Private/VolumetricCloud.usf` — Epic copyright header (EULA; reference only)
- `https://raw.githubusercontent.com/Prograda/Skybolt/master/License.txt` — MPL-2.0
- `https://raw.githubusercontent.com/pmndrs/postprocessing/main/LICENSE.md` — zlib-style permissive
- `https://raw.githubusercontent.com/FarazzShaikh/three-volumetric-clouds/{main,master}/LICENSE` — 404/404 (no license)
- `https://github.com/fogleman/Cloud|cloud|clouds` — 404s; profile page: no cloud repo (candidate disproved)
- `https://api.polyhaven.com/assets?t=textures` — 870 textures, zero cloud sets (clouds are HDI-only)
- `https://dev.epicgames.com/documentation/en-us/unreal-engine/creating-a-skydome-in-unreal-engine` — HTTP 200, SPA body (content [UV])
- `ambientcg.com`, `api.ambientcg.com` — unreachable (000) [UV]; `visibleearth.nasa.gov/...` — 301 [UV]
- Vendored `editor/js/vendor/three.module.js` (r182) — `WebGL3DRenderTarget` + `Data3DTexture` + `texImage3D`/`TEXTURE_3D` framebuffer paths confirmed present

**Carried from R7 (verified there):** sebh/UnrealEngineSkyAtmosphere (MIT), sebh/TileableVolumeNoise
(MIT), Hillaire EGSR-2020 paper + Frostbite-2016 course slides, Nubis 2015 + Nubis Evolved,
three.js r182 Sky/SkyMesh, @pmndrs/sky (WebGPU-only), Shadertoy CC BY-NC-SA default,
xiaxiangfeng/sky-cloud-3d (NC). See `analysis/R7_SKYBOX_RESEARCH.md` §7.

**Internal:** `editor/js/sky.js` (dome/blend/tone conventions, bake pattern, `SKY_WEATHER`),
`editor/js/env.js` (`buildSkyParams`, `setSkyStyle`, `sunDirection` remap), `editor/js/schema.js`
(v11→v12 pattern, `normLight`), `editor/js/ui.js` (`#lpSky` row), `editor/js/finish.js`
(`depth >= 1.0` SSAO skip @146, composite toSrgb+dither @258, `costWithinBudget` scheduler),
`editor/js/const.js` (`C.WEATHER`, `C.SKY_*`), `analysis/tmp_skybox/NOTES.md`.
