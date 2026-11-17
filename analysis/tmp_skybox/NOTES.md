# tmp_skybox — sebh/UnrealEngineSkyAtmosphere reference (round 10)

Source: https://github.com/sebh/UnrealEngineSkyAtmosphere — MIT License, Copyright (c) 2020 Epic Games, Inc.
(Sébastien Hillaire's own reference implementation of the EGSR-2020 technique used by UE5's Sky Atmosphere.)
Files fetched verbatim from raw.githubusercontent.com master on 2026-11-17. LICENSE included here.
These files are REFERENCE ONLY — the shipped code (editor/js/sky.js) is a GLSL ES 3.0 port for three.js r182
written in this repo; values/data-shapes below are the ported spec.

## Files
- SkyAtmosphereCommon.hlsl — AtmosphereParameters struct (camelCase), GetAtmosphereParameters (Bruneton layer →
  ExpScale translation), raySphereIntersectNearest, LutTransmittanceParamsToUv. This is the ray-march model header.
- RenderSkyCommon.hlsl — LUT parametrizations (UvToLutTransmittanceParams / UvToSkyViewLutParams /
  SkyViewLutParamsToUv, fromUnitToSubUvs/fromSubUvsToUnit), sampleMediumRGB (density exp scales + ozone
  piecewise-linear), phase functions (RayleighPhase, CornetteShanks via hgPhase, uniformPhase), MoveToTopAtmosphere,
  GetSunLuminance (sun disc, cos(0.5*0.505*3.14159/180)), GetMultipleScattering (MS LUT fetch), PLANET_RADIUS_OFFSET=0.01.
- RenderSkyRayMarching.hlsl — IntegrateScatteredLuminance (the ray march; Frostbite slide-28 analytic step
  integration Sint=(S−S·e^{−σdt})/σ, MULTI_SCATTERING_POWER_SERIE geometric sum 1/(1−r)), RenderTransmittanceLutPS
  (40 samples, VariableSampleCount=false, MieRayPhase=false, uses ONLY OpticalDepth), SkyViewLutPS (30 samples,
  Variable=true, MieRayPhase=true, camera-relative frame), NewMultiScattCS (64 sphere dirs 8×8, SampleCountIni=20,
  ground=true, ILLUMINANCE_IS_ONE), RenderRayMarchingPS FASTSKY path (dome: side/forward vectors → lightViewCosAngle,
  SkyViewLutParamsToUv → sky-view sample + sun disc).
- RenderWithLuts.hlsl, SkyAtmosphereBruneton.hlsl, definitions.glsl, Common.hlsl, PostProcess.hlsl — context only
  (old precomputed model; post = 1−exp(−rgb/wp×exp) + gamma 2.2, exposure 10, white point 1.08241/0.96756/0.95003).
- app_Game.h/.cpp, app_RenderSky.cpp, app_SkyAtmosphereCommon.h/.cpp, app_RenderWithLuts.cpp — C++ app: cbuffer
  packing, LUT allocation, defaults.

## Ported constants (verified against the files above)
- Earth (km, SetupEarthAtmosphere): bottom_radius 6360, top_radius 6460, RayleighScaleHeight 8
  (density layer {0,1,−1/8}), MieScaleHeight 1.2 (layer {0,1,−1/1.2}), rayleigh_scattering
  (5.802e-3, 1.3558e-2, 3.31e-2)/km, mie_scattering 3.996e-3, mie_extinction 4.44e-3, mie g 0.8,
  ozone layers [width25, linear 1/15, const −2/3] + [−1/15, 8/3], absorption_extinction
  (6.5e-4, 1.881e-3, 8.5e-5)/km, ground_albedo 0, solar_irradiance 1 (transfer-factor approach),
  sun_angular_radius 0.004675, mu_s_min = cos(120°).
- LUT sizes: transmittance 256×64, sky-view 192×108 (app uses R11G11B10 — we use RGBA16F, not renderable-safe in
  WebGL2 otherwise), multi-scattering 32×32. All RGBA16F, Linear, ClampToEdge.
- RayMarchMinMaxSPP default (4, 14) — Game.h uiViewRayMarchMinSPP=4 / MaxSPP=14 (paper §4.1 variable march).
- MultipleScatteringFactor 1.0; gSunIlluminance = 1.0×IllumScale (white).
- Transmittance pass binds NO textures (app_RenderSky.cpp renderTransmittanceLutPS — only cbuffers). The in-loop
  TransmittanceToSun LUT fetch is dead code for this pass (only OpticalDepth is consumed). PORT RULE: bake passes
  get per-material uniform sets; the transmittance variant replaces the LUT fetch with vec3(1.0) (no framebuffer
  feedback loop is possible).
- MS pass binds the transmittance LUT (slot 2) + writes MultiScattTex (UAV). Sky-view binds transmittance + MS.
  Dome binds sky-view (+ transmittance for sun transmittance if wanted). Dependency order: T → MS → SkyView → dome.
- Post tone curve (demo): 1 − exp(−rgb/whitePoint × exposure), exposure 10, white point (1.08241, 0.96756, 0.95003),
  then gamma 1/2.2. We apply the demo curve INSIDE the dome shader in linear space, then the existing output paths
  (plain render: manual sRGB OETF via uOutputSRGB; finish RT: linear passthrough, composite toSrgb).
- Atmosphere frame is Y-up in our port (demo is Z-up): planet center at (0, −(BottomRadius + altitudeM/1000), 0)
  in editor world space → camera altitude above the atmosphere ground plane is automatic (exp(−alt/8km) thinning).

## WebGL2/three r182 port rules (from the round-10 interrupted session, SKILL-worthy)
- Explicit glslVersion: GLSL3 ShaderMaterial: declare `layout(location=0) out vec4 skyFragColor;` yourself; three
  does NOT auto-define gl_FragColor nor inject linearToOutputTexel for explicit GLSL3 → do NOT `#include
  <colorspace_fragment>`; apply sRGB OETF manually gated by a uOutputSRGB uniform (plain vs finish-RT paths).
- GLSL ES: `const` initializers must be constant expressions — never `const` alias a uniform-derived value.
- HLSL→GLSL: lerp→mix, saturate→clamp(x,0.,1.), frac→fract, mad→fma or explicit, mul(v,M)→M*v (row-major),
  float3(a,b,c)→vec3, Texture.SampleLevel(s,uv,0)→texture(s,uv) (LOD0 explicit not needed in our passes),
  GroupMemoryBarrier shared-mem reduction → plain fragment loop (64 iterations for the MS LUT).
- r182 keeps renderbuffers/framebuffers in WeakMaps — probe RTs via renderer.readRenderTargetPixels, never
  rt.__webglFramebuffer.
