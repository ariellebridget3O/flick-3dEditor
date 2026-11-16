# R7 — Skybox / Skydome Research (realistic sky for flick-3dEditor)

Research-only doc. All URLs marked **[V]** were actually fetched/verified from the research sandbox
(raw.githubusercontent, npm registry, GitHub search API, curl of live pages). URLs marked **[API]**
were verified through the GitHub search API (repo existence, stars, license metadata). **[UV]**
= UNVERIFIED (site blocked automated fetch from the sandbox — re-verify from a browser before use).
Date of research: this session (three.js r182 era).

---

## §1 TL;DR recommendation

**Build a "Realistic Sky" viewport mode next to the existing flick-exact Classic mode, in three phases, using only MIT/BSD sources. Do NOT copy UE5 engine shader code.**

1. **Atmosphere (P1)** — replace the zenith/horizon gradient dome with a Hillaire-2020-style
   physically based sky **on the existing dome mesh** (`env.js: makeSkyDome()`). The
   license-safe, fetchable source is **`sebh/UnrealEngineSkyAtmosphere`** — this is *Sébastien
   Hillaire's own reference implementation of the exact technique UE5's Sky Atmosphere uses*,
   and it is **MIT licensed, copyright "Epic Games, Inc. 2020"** [V]. It contains the full LUT
   ray-marcher (`RenderSkyRayMarching.hlsl`), LUT sampler (`RenderWithLuts.hlsl`), and even
   Bruneton's 2017 reference code for comparison [V]. For a ready-made three.js/GLSL/WebGL2
   port of the same family, **`jeantimex/precomputed_atmospheric_scattering`** (Bruneton port,
   MIT) [V] and **`@takram/three-atmosphere`** (Bruneton port + aerial perspective + lighting,
   MIT, classic WebGL renderer) [V] are directly usable starting points.
   The official three.js `Sky` addon (Preetham, MIT) [V] is the *fallback* if we want something
   working in a day — but it has no clouds, no real night, and a washed-out horizon.

2. **Cloud layers (P2)** — 2–3 concentric dome shells (cirrus / cumulus / stratus-overcast) with
   **runtime-generated tileable fbm/Worley textures** (per-layer octaves, coverage, altitude,
   wind — this is what "controllable layers" means; nothing baked). Generation code reference:
   **`sebh/TileableVolumeNoise`** (MIT) [V] and **`CK42BB/procedural-clouds-threejs`** (MIT,
   complete GLSL/WGSL cloud shaders incl. billboard + mesh-cluster fallbacks) [V].
   Weather mapping: extend `C.WEATHER` (const.js) with per-layer parameters; transitions lerp.

3. **Volumetric clouds (P3)** — UE5-class raymarched volumetric clouds behind a quality toggle,
   half-res render target + temporal accumulation, reusing the depth texture we already produce
   for SSAO. Design references: **`@takram/three-clouds`** (MIT — Beer shadow maps, temporal
   upscaling, light shafts; the closest open-source equivalent of UE5's Volumetric Cloud)
   [V], Nubis ports (**`FarazzShaikh/three-volumetric-clouds`** — ⚠ no license file, reference
   only) [V], and **`ZyFou/ProceduralTerrains`** (MIT, WebGL, volumetric clouds + weather)
   [V]. Default OFF for integrated GPUs; gate via the existing ≤11 ms auto-measure harness.

**Why not the UE5 repo directly:** `EpicGames/UnrealEngine` on GitHub returns **404 for
anonymous access** [V] (it is gated behind linking a free Epic account to a GitHub account), its
content is under the Epic EULA (fine to *read* internally, **not** redistributable — we could not
ship shader code copied from it), and its huge. The user's instinct was right that the technique
is "in there" — but the same technique ships MIT-licensed from the technique's author (sebh),
which we *can* port and ship. A public third-party mirror of the engine shaders exists
(`repalash/Open-Shaders`) for reading the real HLSL [V] — reference only, Epic-copyrighted.

**Night/stars/moon:** `@pmndrs/sky` (MIT) [V] is the richest open implementation (sun, moon,
moonlight, stars, generated Milky Way, aerial perspective, height fog, presets) — but it is
**WebGPU/TSL-only** (`WebGPURenderer`); we run the classic `WebGLRenderer`, so it serves as the
architectural reference (and its MIT TSL math can be ported to GLSL).

---

## §2 Candidate implementations table

| Name | What it gives | Clouds? | Reacts to lighting? | License | Where to get it | Effort | Perf class |
|---|---|---|---|---|---|---|---|
| **three.js `Sky` addon (r182)** | Preetham analytic sky: `turbidity, rayleigh, mieCoefficient, mieDirectionalG, sunPosition, up` uniforms; sun disc; in-shader exposure curve; `#include <tonemapping_fragment>` | No | Yes (sun dir + turbidity/Rayleigh/Mie knobs); no clouds/night; no fog coupling | MIT [V] | `https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/jsm/objects/Sky.js` | S | ~0.1–0.3 ms fullscreen (negligible) |
| **three.js `SkyMesh` (r182)** | Same Preetham model as TSL nodes for `WebGPURenderer` (`turbidity/rayleigh/mieCoefficient/mieDirectionalG/sunPosition/up` as uniform nodes) | No | Same as above | MIT [V] | `https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/jsm/objects/SkyMesh.js` | S (but requires WebGPU renderer) | negligible |
| **three.js `webgl_shaders_ocean` pattern** | `Sky` + `PMREMGenerator.fromScene(sky)` → `scene.environment` (IBL from sky) | — | env lighting from sky | MIT [V] | `https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/webgl_shaders_ocean.html` | S | PMREM bake ~1–3 ms per change (throttle) |
| **`sebh/UnrealEngineSkyAtmosphere`** | The UE5 Sky Atmosphere technique itself: LUT ray-marcher, LUT sampling, path-traced reference, Bruneton17 comparison code (HLSL/GLSL) | No (sky only) | Yes — sun dir, Rayleigh/Mie/ozone, multiple-scattering approx, aerial perspective | **MIT, ©2020 Epic Games** [V] | `https://github.com/sebh/UnrealEngineSkyAtmosphere` (raw fetch OK, see §3) | M (HLSL→GLSL port) | LUT bake once per param change (~5–20 ms, amortizable); sampling ≈ 3 texture fetches/px |
| **`jeantimex/precomputed_atmospheric_scattering`** | Bruneton 2008/2017 precomputed scattering in three.js + GLSL, WebGL: transmittance/irradiance/scattering LUTs, ozone, multiple scattering, sky+ground+aerial perspective | No | Yes (sun dir, exposure) | MIT [API, README V] | `https://github.com/jeantimex/precomputed_atmospheric_scattering` | M (GLSL, integrate into dome) | LUT bake; per-pixel cheap |
| **`@takram/three-atmosphere`** | Bruneton atmosphere for three.js **classic WebGL**, `Atmosphere` (date/sun driven), `Sky`, `AerialPerspective` post effect (sun light + sky light + AP in one pass), R3F + vanilla | No | Yes — full IBL/aerial perspective pipeline; date-driven | MIT [V] | `https://github.com/takram-design-engineering/three-geospatial` (packages/atmosphere) / npm `@takram/three-atmosphere` | M | post-pass aerial perspective + LUTs; production-quality |
| **`@takram/three-clouds`** | Geospatial **volumetric clouds**: raymarched, Beer shadow maps (cloud shadows on scene), temporal upscaling/filtering, light shafts (crepuscular rays), haze; quality presets | **Yes (volumetric)** | Yes (sun/sky lit, shadows) | MIT [V] | same monorepo (packages/clouds) / npm `@takram/three-clouds` | L | half-res raymarch + temporal; needs budget gating |
| **`@pmndrs/sky` (`tsl-sky`)** | Full Hillaire-based sky system: sun, **moon + moonlight**, **stars + generated Milky Way**, ground, grounded skybox, aerial perspective haze (AP-LUT or raymarch), budget height-fog tier, presets earth/mars/titan, baked cube env + ~1 ms env re-filter, `compileAsync` | No (atmosphere/night only) | Yes (timeOfDay, latitude, exposure, grading) | MIT [V] | `https://github.com/pmndrs/sky` / npm `@pmndrs/sky` — **WebGPURenderer only** | L to port (TSL→GLSL) | designed for frame budgets (bake-on-change) |
| **`JolifantoBambla/webgpu-sky-atmosphere`** | Hillaire atmosphere as WebGPU post-process; LUT renderer; Cornette-Shanks or HG+Draine Mie phase; ground & space views; timestamped perf demos | No | Yes | MIT [V] | `https://github.com/JolifantoBambla/webgpu-sky-atmosphere` / npm `webgpu-sky-atmosphere` | L (WebGPU/WGSL) | has timing demos |
| **`SkyeShark/Eanpa-Sky`** | Volumetric sky **and weather engine** (TSL/WebGPU): 8 weather states incl. storm canopy, lightning, day/night, multiple skyboxes | **Yes (volumetric)** | Yes | MIT [V] | `https://github.com/SkyeShark/Eanpa-Sky` | L (WebGPU only) | "high frame rates" claimed; WebGPU required |
| **`FarazzShaikh/three-volumetric-clouds`** | Nubis "Evolved" envelope-model volumetric clouds in three.js: Perlin-Worley 3D noise, envelope erosion, adaptive raymarch, multiscatter lighting, anisotropic phase | **Yes (volumetric)** | Yes | ⚠ **NO LICENSE FILE — all rights reserved; reference only, cannot ship** [V] | `https://github.com/FarazzShaikh/three-volumetric-clouds` | M | author: "experimental, not production" |
| **`CK42BB/procedural-clouds-threejs`** | Complete cloud shader recipes (MIT): volumetric raymarch (Beer-Lambert, HG phase, light marching), **mesh-cluster** and **billboard** fallbacks, all 10 cloud genera, silver linings/2-lobe phase/Beer-powder edges, time-of-day palettes, god rays, WGSL noise compute, wind drift | **Yes (3 paths)** | Yes | MIT [V] | `https://github.com/CK42BB/procedural-clouds-threejs` | S–M (it's a copyable shader cookbook) | per-path |
| **`leoawen/volumetric-clouds`** | Three.js + GLSL volumetric cloud generator, PBR lighting, god rays | Yes | Yes | MIT [API] | `https://github.com/leoawen/volumetric-clouds` | M | — |
| **`ZyFou/ProceduralTerrains`** | Terrain system (three 0.185, classic WebGL) incl. **realistic volumetric clouds** (erosion, wind shear, silver linings, **cloud shadows on terrain**), water, atmosphere, fog, planet mode | Yes (volumetric) | Yes | MIT [API, README V] | `https://github.com/ZyFou/ProceduralTerrains` | M (extract cloud subsystem) | has reduced-res cloud mode |
| **`Token-Gremlin/natural-disasters` (ABYSSAL)** | Fully procedural WebGL2/GLSL3 (classic three r169): ocean + **storm weather cycle — clouds, rain, lightning** — everything generated on GPU, ~400 KB JS+GLSL | Yes (procedural) | Yes | MIT [V] | `https://github.com/Token-Gremlin/natural-disasters` | M | runs in a browser tab; good rain/lightning FX reference |
| **drei `<Sky>` / `<Cloud>` / `<Clouds>`** | R3F wrappers. `Sky` = three-stdlib Preetham Sky. `Cloud` = **instanced billboard planes** with a cloud.png texture (`MeshLambertMaterial`), segments/opacity/growth/speed params — NOT volumetric | Billboards only | Lit (Lambert) | MIT [V] | `https://raw.githubusercontent.com/pmndrs/drei/master/src/core/Sky.tsx`, `.../Cloud.tsx` | S | cheap |
| **`three-sky` (npm)** | Standalone packaging of the official three.js Sky object | No | Yes | MIT [V] | `https://registry.npmjs.org/three-sky` | S | negligible |
| **`ebruneton/precomputed_atmospheric_scattering`** | The original Bruneton 2008/2017 implementation (C++/OpenGL, WebGL demos) | No | Yes | BSD (©2017 Eric Bruneton) [V] | `https://github.com/ebruneton/precomputed_atmospheric_scattering` | reference | — |
| **Hosek-Wilkie ports** | `benanders/Hosek-Wilkie` (C++/OpenGL, no license) [API], `tylermorganwall/skymodelr` (R) [API], `phoekz/hw-skymodel` (Rust, MIT) [API]; **npm `hosek-wilkie` = NOT FOUND** [V]. Official C++ source page `cgg.mff.cuni.cz/projects/Skylight-Modelling/` = 404 [V] | No | Yes | mostly unclear | — | — | Superseded by Hillaire/Bruneton — **skip** |
| **UE5 engine shaders (SkyAtmosphere.usf / VolumetricCloud.usf / …)** | The production UE5 implementations | Yes | Yes | ⚠ Epic EULA — internal reference only, **not shippable**; repo gated (404 anonymous) [V] | see §3 | reference only | — |

Not pursued: `xiaxiangfeng/sky-cloud-3d` (physically based sky + volumetric cloud mesh, but its
LICENSE is **non-commercial only** [V] — excluded); `yisky/hillaire-sky-webgpu` (no license
[API]); `Itex34/HillaireAtmosphereOpenGL` + `Itex34/OpenGLHillaire` (MIT [API], small OpenGL
ports — plausible secondary reference); `jeromeetienne/threex.daynight` (MIT [API], 2013-era
day/night cycle — too primitive, but historically the "weather-driven sky system" niche).

---

## §3 UE5 shader file inventory (selective-fetch guide)

### 3.1 Access reality (verified)

- `https://github.com/EpicGames/UnrealEngine` → **HTTP 404 for anonymous visitors** [V]. The repo
  is only visible to GitHub accounts linked to an Epic account (free at unrealengine.com →
  profile → connections). Both the HTML and the GitHub API/raw endpoints are gated. **The plan
  "find a clone and fetch via API" does not work against the official repo anonymously.**
- Once an account is linked, per-file fetch works without cloning, e.g.:
  `https://raw.githubusercontent.com/EpicGames/UnrealEngine/<branch>/Engine/Shaders/Private/SkyAtmosphere.usf`
  (branch: `release` for 5.x at time of writing — confirm on first fetch).

### 3.2 Engine shader paths (UE5.x, `Engine/Shaders/Private/` — flat, no `AtmosphericAndCloud/` subdir found)

Verified by (a) a live UE user quoting `Engine/Shaders/Private/VolumetricCloud.usf`
(KStocky/HLSL-LSP#78) [V], and (b) a public mirror inventory via Sourcegraph global search of
`repalash/Open-Shaders` (`Engines/Unreal/Private/…` mirrors `Engine/Shaders/Private/…`) [V].
The vendored `VolumetricCloud.usf` carries the genuine `// Copyright Epic Games, Inc. All Rights
Reserved.` header (67 KB) [V].

Sky/cloud/atmosphere set (fetch these first):

| File (under `Engine/Shaders/Private/`) | Role |
|---|---|
| `SkyAtmosphere.usf` | Sky atmosphere passes (per-pixel sky + LUTs, AP) |
| `SkyAtmosphereCommon.ush` | Shared atmosphere types/constants/phase functions |
| `VolumetricCloud.usf` | Volumetric cloud render/relection/shadow passes |
| `VolumetricCloudCommon.ush` | Cloud tracing helpers, phase, density sampling |
| `AtmosphereCommon.ush` | Shared atmospheric-simulation math |
| `AtmospherePrecompute.usf` | Legacy/precompute atmosphere passes |
| `AtmosphericFogShader.usf` | UE4-era atmospheric fog (historical) |
| `SkyLightingShared.ush` (+ `SkyLighting.usf`) | Sky light capture/SH from sky |
| `VolumetricFog.usf`, `VolumeLightingCommon.ush`, `HeightFogCommon.ush` | Volumetric/height fog (weather coupling) |
| `LightShaftShader.usf` | Light shafts (god rays) — sky/cloud coupled |

Notes:
- A `CloudTracing.ush` is often mentioned in community write-ups, but **no public indexed copy
  was found** (Sourcegraph global `file:CloudTracing.ush` → 0 results) [V]; the tracing helpers
  live in `VolumetricCloudCommon.ush` in the mirrored snapshot. Expect UE 5.3+ to reorganize —
  verify the tree listing after gaining access:
  `https://github.com/EpicGames/UnrealEngine/tree/<branch>/Engine/Shaders/Private`.
- C++ orchestration (not fetched, from general UE knowledge — **UV**): `Engine/Source/Runtime/Renderer/Private/SkyAtmosphereRendering.cpp`, `VolumetricCloudRendering.cpp`, `SceneRendering.cpp` (cloud integration).
- **Anonymous readable mirror** (verified, use for reading the real HLSL): `https://github.com/repalash/Open-Shaders` → `Engines/Unreal/Private/<file>` via
  `https://raw.githubusercontent.com/repalash/Open-Shaders/master/Engines/Unreal/Private/VolumetricCloud.usf`.
  ⚠ This is Epic-copyrighted code under the UE EULA — fine to read for understanding, **must
  not be copied into our codebase**.
- **License bottom line:** Epic's EULA permits internal use/engine-extension but forbids
  redistribution of the source or derivatives to non-licensees. Shipping any of this in
  flick-3dEditor (even refactored) is off the table. We *can* study it and re-implement the
  published techniques (Hillaire 2020 is a public paper with an **MIT reference implementation**,
  see §4) — algorithms/techniques aren't copyrightable, code is.

### 3.3 UE5 sample content ("Open World" demo, Pixel Mining / Megascans)

Epic sample content (Open World sample, City Sample, Quixel Megascans) is distributed under the
same EULA — **engine-internal use only, not redistributable** with a third-party tool. There are
no layered cloud *textures* in the samples we could legally ship. (Statement from general
knowledge of the EULA — the marketplace/EULA pages were not fetch-verified; treat as high
confidence but re-read the EULA text before relying on it.) **Do not plan around these.**

---

## §4 SIGGRAPH / research ports inventory

| Technique / paper | Open implementation | Status |
|---|---|---|
| **Hillaire 2020, "A Scalable and Production Ready Sky and Atmosphere Rendering Technique" (EGSR 2020)** — the basis of UE5 Sky Atmosphere | Paper: `https://sebh.github.io/publications/egsr2020.pdf` [V]. Reference code: `sebh/UnrealEngineSkyAtmosphere` — **MIT, © Epic Games 2020** [V]; files: `Resources/RenderSkyRayMarching.hlsl` (LUT builder), `Resources/RenderWithLuts.hlsl` (LUT sampling), `Resources/RenderSkyCommon.hlsl`, `Resources/RenderSkyPathTracing.hlsl`, `Resources/Bruneton17/{definitions,functions}.glsl`, `Application/{RenderWithLuts.cpp, RenderSky.cpp, SkyAtmosphereCommon.h/.cpp}` [V tarball listed] | ⭐ primary source |
| **Hillaire & de Bellescize 2016, "Physically Based Sky, Atmosphere and Cloud Rendering in Frostbite"** (SIGGRAPH course) — cloud lighting, skylight, aerial perspective | Slides: `http://blog.selfshadow.com/publications/s2016-shading-course/hillaire/s2016_pbs_frostbite_sky_clouds.pptx` [V]; tileable volume noise (clouds): `sebh/TileableVolumeNoise` — MIT [V] | ⭐ cloud-noise source |
| **Preetham et al. 1999, "A Practical Analytic Model for Daylight"** | three.js `Sky` addon (with Simon Wallner's atmospheric-scattering demo cited in its header) [V]; example `webgl_shaders_sky` (turbidity 0–20, rayleigh 0–4, mieCoefficient 0–0.1, mieDirectionalG 0–1, elevation/azimuth) [V] | good cheap fallback |
| **Bruneton 2008 / 2017, "Precomputed Atmospheric Scattering"** | Original: `ebruneton/precomputed_atmospheric_scattering` — BSD [V]; three.js port: `jeantimex/precomputed_atmospheric_scattering` — MIT [V/API]; production port: `@takram/three-atmosphere` — MIT [V] | ⭐ WebGL-ready |
| **Schneider 2015, "The Real-Time Volumetric Cloudscape of Horizon Zero Dawn" (Nubis)** | Slides: `https://advances.realtimerendering.com/s2015/Siggraph15_Schneider_Real-Time_Volumetric_Cloudscapes_of_Horizon_Zero_Dawn.pptx` and companion PDF (linked from `https://advances.realtimerendering.com/s2015/`) [V]; follow-up "Nubis, Evolved": `https://www.guerrilla-games.com/read/nubis-evolved` [V]; three.js port: `FarazzShaikh/three-volumetric-clouds` (⚠ no license) [V] | technique reference |
| **Guérin et al. 2020, "Interactive Clouds and Atmospheric Effects" (Ubisoft)** | Artifact page `https://artifacts.montreal.ubisoft.com/interactive-clouds/` — **[UV]** (host unreachable from sandbox, HTTP 000) | check from browser |
| **Wrenninge, "Production Volume Rendering"** (Atlas) | `magnuswrenninge.com` — **[UV]** (unreachable from sandbox) | check from browser |
| Shadertoy ports (iq "Clouds", BigWings "Rainier", nimitz raymarch, sebh profile `shadertoy.com/user/sebh`) | **[UV]** — Shadertoy is behind a Cloudflare challenge for automated fetch ("Just a moment…") [V attempted]. Also: Shadertoy's default license is CC BY-NC-SA (non-commercial) unless the author states otherwise — **re-verify per shader before porting anything** [UV] | visual reference only |
| O'Neil, GPU Gems 2 ch. 16 "Accurate Atmospheric Scattering" | NVIDIA URLs 404 [V attempted] — **[UV]** (moved; findable via archive.org from a browser) | historical |

Shadertoy licensing note: because default Shadertoy licensing is NC, we should treat all
shadertoys as *visual* references and take code only from the MIT/BSD repos above.

---

## §5 Texture / asset sources

**The per-layer "controllable clouds" requirement is best served by runtime-generated noise
textures, not baked assets** (baked textures are static; we need coverage/density/altitude per
weather state). That said:

| Source | What | License | Status |
|---|---|---|---|
| **Runtime fbm/Worley generation** (recommended) | Tileable 2D/3D noise baked to textures on load, per layer (octaves/scale/gain/coverage/erosion as uniforms + generation params). Code: `sebh/TileableVolumeNoise` (MIT) [V]; three.js `ImprovedNoise.js` (MIT) [V, exists in r182]; `CK42BB` WGSL/GLSL noise gen (MIT) [V]; npm `simplex-noise` (MIT) | MIT | ⭐ primary |
| **Poly Haven** | 299 sky HDRIs via API `https://api.polyhaven.com/assets?t=hdris&categories=skies` [V] (EXR/HDR, 1k–8k). **Baked** — usable as static fallback / ambient IBL / overcast plates, not as the dynamic sky | CC0 ("CC0 means absolute freedom") [V] | fallback |
| **NASA Black Marble** | Night city lights maps for night-mode ground emissive | NASA imagery guidelines (generally free/public domain, no endorsement) [V page] | nice-to-have |
| **NASA Visible Earth — Blue Marble** | Whole-earth cloud map textures (BMNG cloud layers) for a planet/dome cloud layer | NASA (as above) [V page] | nice-to-have |
| **ambientCG** | CC0 asset library with HDRIs | CC0 | **[UV]** — site returned empty responses to the sandbox; re-check from browser (`ambientcg.com/hdris`) |
| Kenney "skies" | 2D skybox textures | CC0 | **[UV]** — `kenney.nl/assets/skies` returned an error page; likely wrong slug, verify before citing |
| **drei default cloud texture** | `cloud.png` billboard texture used by drei `<Cloud>` [V URL in source] | MIT (drei-assets) | quick billboard layer |
| UE5 samples / Megascans | Layered cloud textures/materials | EULA — not redistributable | ❌ excluded |
| Shadertoy cloud textures | — | CC BY-NC-SA default [UV] | ❌ excluded for shipping |

---

## §6 Integration design for flick-3dEditor

### 6.1 What we already have (grounding)

- **Sky dome**: `env.js makeSkyDome()` — `BackSide` sphere, `depthTest:false, depthWrite:false,
  fog:false`, `renderOrder = -1`, vertex trick `gl_Position = clip.xyww` (sky at far plane,
  view-rotation only), fragment = zenith/horizon mix + sun flare, `#include <colorspace_fragment>`.
  `raycast` disabled, `frustumCulled = false`.
- **Daylight coupling**: `applyDaylight(light)` (memoized) — reads `daylightAt(elevationDeg)`
  from `C.DAYLIGHT_STOPS` (7 byte-exact stops) → sets `hemi`/`ambient`/`sun` colors+intensities,
  `scene.fog.color = horizon`, sky uniforms (zenith/horizon/flare/flareDirection).
- **Weather**: `C.WEATHER` — 5 states (`clear, cloudy, overcast, rain, fog`) with
  `sun/hemi/fog/flare/desat/darken` multipliers; fog multiplier applied inside
  `createFogNearFar().tick()` (density clamp `FOG_DENSITY_CAP = 0.05`).
- **Geo sun solver**: `solarPositionDeg(geo)` (Spencer/NOAA) → az/el; `geoToSceneLight()` with
  `northOffsetDeg`; `sunDirection(light)` → unit vector (with the live EL_REMAP quirk).
- **Finish composer** (`finish.js`): scene → HalfFloat MSAA RT **with depth texture** → SSAO
  (early-outs on `depth >= 1.0` = sky) → separable blur → fog-aware composite (only touches
  `depth < 1.0` pixels; writes `gl_FragDepth`; manual toSrgb + triangular dither). Budget:
  `COST_BUDGET_MS = 11` at 1080p-equivalent pixels, measured by `measureFinish` + scheduler.
- **Renderer**: classic `WebGLRenderer`, `PCFShadowMap`, pixelRatio ≤ 2, default tone mapping
  (NoToneMapping), r182 vendored (verified `0.182.0` MIT).
- Classic look is a **feature** — realistic sky must be a mode, not a replacement.

### 6.2 Mode & schema

- Add `light.skyStyle: 'classic' | 'realistic'` (normalizeLight passthrough; schema v12
  migration alongside `SCHEMA_V: 11`). Default `classic` — migrated scenes are unchanged and
  golden tests keep passing.
- `createEnvironment()` constructs both domes up-front (classic dome stays; realistic dome is a
  second `ShaderMaterial` on the same geometry or a swapped material), `visible` per mode.

### 6.3 Uniform / coupling table (realistic mode)

| Existing state (source) | Drives (realistic-sky uniform/effect) |
|---|---|
| `sunDirection(light)` (env.js) | `uSunDirection` — one source of truth for sky, flare, sun disc, shadow fit (already shared) |
| `light.elevationDeg` (raw, pre-remap `_rawElevation` for geo mode) | LUT/sky sun elevation; night regime when < 0 (moon+stars path) |
| `C.WEATHER[light.weather]` | per-state atmosphere + cloud params (table below); lerp over ~2 s on change |
| `light.geo.altitudeM` | Rayleigh density scale (existing `altK` air-mass thinning: 6 % @ 4 km) |
| `daylightAt().glow` | night-lamp emissive (existing) **and** stars/moon intensity ramp |
| `sun.intensity / sun.color` (still table-driven in P1) | optional cloud-layer sun tint; keeps object lighting identical to classic |
| `createFogNearFar` density (weather × geometry) | sky-horizon fog blend + aerial-perspective haze density (sky shader mixes to fog color at horizon — same trick the classic dome relies on for a seamless horizon) |
| PMREM env (new, throttled) | `scene.environment` from sky-only scene (ocean-example pattern) so PBR props receive sky IBL; rebake debounced (e.g. ≥250 ms since last param change / on scrub end), measured |

Weather → atmosphere/cloud parameter sketch (tune in-editor):

| state | turbidity | rayleigh | mieC | cloud layers (coverage by layer: cirrus / cumulus / stratus) |
|---|---|---|---|---|
| clear | 2.5 | 1.0 | 0.005 | 0.15 / 0.12 / 0.00 |
| cloudy | 6 | 1.2 | 0.010 | 0.35 / 0.45 / 0.30 |
| overcast | 12 | 1.5 | 0.015 | 0.50 / 0.25 / 0.95 |
| rain | 15 | 2.0 | 0.020 | 0.60 / 0.80 / 0.90 (dark bases) |
| fog | 18 | 2.5 | 0.030 | 0.30 / 0.10 / 0.70 (+ high AP density; existing `fog ×3.5` multiplies density) |

Cloud layer object (per layer, all programmatic): `{ coverage, density, altitudeKm, thickness,
windDir, windSpeed, octaves, gain, bias, erosion }` — stored per weather state, tweened on
transitions. Layers render as: L1 cirrus (thin streaks, high shell), L2 cumulus (billowed
fbm shell or billboard clusters for parallax), L3 stratus (low, flat, overcast deck).

### 6.4 Where the sky draws & composer interaction

- Keep the dome-mesh approach (not `scene.background`): it already integrates with both render
  paths — plain render (colorspace_fragment handles sRGB out) and finish RT (linear into
  HalfFloat, composite does toSrgb; SSAO and crease skip sky because `depthWrite:false` leaves
  depth = 1.0).
- Realistic sky material outputs linear HDR and applies its own exposure/ACES **inside the
  shader** (renderer tone mapping stays NoToneMapping so the clay/finish aesthetic is
  untouched). Keep `fog:false`, `depthWrite:false`, `renderOrder=-1`, `raycast=()=>{}`.
- Night: stars + moon as extra dome passes (tiny extra fragment cost); `nightLights === false`
  already exists to kill lamp glow — reuse for stars if desired.
- **P3 volumetric clouds**: new half-res pass **after** the scene render, **before** SSAO
  composite, sampling the existing `rtScene.depthTexture` for early-out against geometry
  (mountains/buildings occlude clouds), writing composited color back into the chain (blend,
  no depth write — SSAO should not run on clouds). Cloud shadows on the ground (takram's Beer
  shadow maps) = stretch goal; a cheap start is modulating `sun.intensity` by cloud coverage
  per weather state (we already do `× w.sun`).

### 6.5 Performance plan (budget: the ≤11 ms finish pipeline at 1080p reference)

| Phase | Added cost (estimate, to be validated by extending `_autoMeasure`) |
|---|---|
| P1 atmosphere | LUT bake ≈ 5–20 ms once per committed param change (amortize: split LUT mips across frames, or accept a one-frame hitch on scrub-commit); per-pixel ≈ 3 texture fetches ≈ negligible; PMREM rebake ≈ 1–3 ms throttled. Net steady-state ≈ +0.2 ms |
| P2 cloud shells | 2–3 alpha-blended dome/shell passes ≈ +0.5–1.5 ms; texture gen on load (WebGL2 RG16F 512² ×3, a few ms, async) |
| P3 volumetric | Half-res raymarch, 32–96 steps + 2–6 light steps: ≈ 3–12 ms on integrated GPUs at 1080p half-res — **gated**: run `measureFinish`-style probe for the sky pass; auto-disable if `costWithinBudget` fails; expose "Volumetric clouds: Auto/On/Off". Temporal accumulation + blue-noise jitter to cut steps (~32) |

### 6.6 Phased plan

- **P1 — Dynamic sky shader + static cloud layers (S–M)**: port Hillaire LUT sky (from
  `sebh/UnrealEngineSkyAtmosphere`, MIT) or adopt `jeantimex`/`@takram/three-atmosphere` GLSL;
  couple az/el/weather/altitude via §6.3; PMREM IBL; stars/night; `skyStyle` toggle + UI in the
  light popover; extend auto-measure to include realistic mode. Classic mode byte-identical.
- **P2 — Weather-driven per-layer clouds (M)**: 3 layers with runtime fbm/Worley textures,
  per-state param tables, ~2 s transitions (reuse weather-state change point), wind drift,
  sun-tinted cloud lighting; billboard cumulus option (drei-style) for parallax.
- **P3 — Volumetric raymarch (L)**: half-res depth-aware raymarch pass (Nubis/Guérin-inspired,
  clean-room from MIT sources: takram clouds + CK42BB recipes + Frostbite-2016 slides), temporal
  upscaling, quality tiers, default-off on integrated GPUs; optional Beer-shadow cloud shadows.

### 6.7 Risks

1. **License contamination** — the only serious one. Never copy: UE engine `.usf/.ush` (EULA),
   `FarazzShaikh` clouds (no license), `xiaxiangfeng` (NC), shadertoys (NC default). Safe: MIT
   list in §2/§4. Keep an ATTRIBUTION note in the repo.
2. **WebGPU-only libraries** — `@pmndrs/sky`, `Eanpa-Sky`, `JolifantoBambla` cannot run on our
   classic `WebGLRenderer`; they are ports/references, not dependencies. (If the editor ever
   moves to `WebGPURenderer`, `@pmndrs/sky` becomes the turnkey answer.)
3. **PMREM hitching** during time-of-day scrub — throttle + reuse cube; show "baking" state; do
   not rebake per-frame.
4. **Horizon seam** between fog and sky — the classic dome already matches fog color at the
   horizon; the realistic shader must keep an equivalent blend (aerial perspective → fog color)
   or the seam will read as a bug.
5. **Two tone-mapping worlds** — realistic sky wants exposure+ACES; finish composite clamps and
   applies sRGB with no ACES. Do tonemapping inside the sky material; consider an optional
   ACES on the composite *only* in realistic mode (feature-flagged, off by default).
6. **Perf on integrated GPUs** — P3 must be auto-gated (extend the existing 11 ms measurement
   harness); P1/P2 costs are within noise.
7. **Golden-look regressions** — any change to `applyDaylight`'s classic path is forbidden;
   realistic mode must be additive (new uniforms/branch, same memo key extended with skyStyle).

---

## §7 References (verified unless marked)

**three.js (r182, MIT)**
- https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/jsm/objects/Sky.js [V]
- https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/jsm/objects/SkyMesh.js [V]
- https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/webgl_shaders_sky.html [V]
- https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/webgl_shaders_ocean.html [V] (Sky + PMREM pattern)
- https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/jsm/math/ImprovedNoise.js [V]
- three r182 package.json → version 0.182.0, MIT [V]

**Atmosphere (Hillaire / Bruneton / Preetham)**
- https://sebh.github.io/publications/egsr2020.pdf [V]
- https://github.com/sebh/UnrealEngineSkyAtmosphere [V] — **MIT ©2020 Epic Games** (LICENSE fetched); file inventory from release tarball [V]
- https://github.com/sebh/TileableVolumeNoise [V] — MIT
- https://github.com/ebruneton/precomputed_atmospheric_scattering [V] — BSD ©2017
- https://github.com/jeantimex/precomputed_atmospheric_scattering [API + README V] — MIT
- https://github.com/takram-design-engineering/three-geospatial (packages/atmosphere, packages/clouds) [V] — MIT ©2024 Shota Matsuda; npm `@takram/three-clouds`, `@takram/three-atmosphere` [V]
- https://github.com/pmndrs/sky [V] — MIT ©2026 Dennis Smolek (WebGPU/TSL only)
- https://github.com/JolifantoBambla/webgpu-sky-atmosphere [V] — MIT ©2024 Lukas Herzberger
- https://github.com/yisky/hillaire-sky-webgpu [API, no license]
- https://github.com/Itex34/HillaireAtmosphereOpenGL , /Itex34/OpenGLHillaire [API, MIT]
- https://github.com/benanders/Hosek-Wilkie [API, no license]; npm `hosek-wilkie` = NOT FOUND [V]
- http://blog.selfshadow.com/publications/s2016-shading-course/ (→ `hillaire/s2016_pbs_frostbite_sky_clouds.pptx`) [V]

**Clouds / weather**
- https://advances.realtimerendering.com/s2015/ (→ `Siggraph15_Schneider_Real-Time_Volumetric_Cloudscapes_of_Horizon_Zero_Dawn.pptx` + PDF) [V]
- https://www.guerrilla-games.com/read/nubis-evolved [V]
- https://github.com/FarazzShaikh/three-volumetric-clouds [V README] — ⚠ NO LICENSE
- https://github.com/CK42BB/procedural-clouds-threejs [V] — MIT
- https://github.com/SkyeShark/Eanpa-Sky [V] — MIT (WebGPU)
- https://github.com/leoawen/volumetric-clouds [API] — MIT
- https://github.com/ZyFou/ProceduralTerrains [API + README V] — MIT
- https://github.com/Token-Gremlin/natural-disasters [V] — MIT (WebGL2 storm FX)
- https://github.com/jeromeetienne/threex.daynight [API] — MIT
- https://raw.githubusercontent.com/pmndrs/drei/master/src/core/Sky.tsx , `.../Cloud.tsx` [V] — MIT (Cloud = instanced billboards, texture: `https://rawcdn.githack.com/pmndrs/drei-assets/.../cloud.png`)
- https://github.com/xiaxiangfeng/sky-cloud-3d [API + LICENSE V] — ⚠ NON-COMMERCIAL

**UE5**
- https://github.com/EpicGames/UnrealEngine — gated, 404 anonymous [V]
- https://github.com/repalash/Open-Shaders (public mirror of `Engine/Shaders/Private/*` under `Engines/Unreal/Private/*`; `VolumetricCloud.usf` header verified Epic-copyrighted) [V]
- https://github.com/KStocky/HLSL-LSP/issues/78 (quotes `Engine/Shaders/Private/VolumetricCloud.usf`) [V]

**Assets**
- https://api.polyhaven.com/assets?t=hdris&categories=skies [V] (299 sky HDRIs); https://polyhaven.com/license [V] — CC0
- https://blackmarble.gsfc.nasa.gov/ [V]
- https://visibleearth.nasa.gov/collection/1484/blue-marble [V]
- https://ambientcg.com/hdris — [UV] (sandbox-blocked; re-verify)
- https://kenney.nl/assets/skies — [UV] (error page)
- https://www.shadertoy.com/view/XslGRr , https://www.shadertoy.com/user/sebh — [UV] (Cloudflare); Shadertoy default license CC BY-NC-SA [UV]
- https://artifacts.montreal.ubisoft.com/interactive-clouds/ (Guérin 2020) — [UV] (host unreachable)
- https://magnuswrenninge.com/ (Wrenninge) — [UV]
- NVIDIA GPU Gems 2 ch.16 — [UV] (URLs 404)

**Internal (flick-3dEditor)**
- `editor/js/env.js` (sky dome, applyDaylight, sunDirection, fog/near/far, shadow fit)
- `editor/js/const.js` (`C.DAYLIGHT_STOPS`, `C.WEATHER`, `C.LIGHT_GEO_DEFAULTS`, fog consts)
- `editor/js/finish.js` (composer, SSAO, composite, 11 ms budget/auto-measure)
- `analysis/ENVIRONMENT.md`, `analysis/FINISH_RENDERER.md` (de-minified originals)
