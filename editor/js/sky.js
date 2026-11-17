// sky.js — round 10 (skybox P1): realistic sky atmosphere.
// Technique: Hillaire 2020 "A Scalable and Production Ready Sky and Atmosphere Rendering
// Technique" (EGSR 2020) — ported from the author's MIT reference implementation
// sebh/UnrealEngineSkyAtmosphere (© 2020 Epic Games, MIT; reference set + ported-constant
// registry in analysis/tmp_skybox/). This file is an independent GLSL ES 3.0 / three.js r182
// port: values and data-shapes are ported, no HLSL text is included.
//
// Architecture (see analysis/tmp_skybox/NOTES.md):
//   LUT 1 transmittance 256x64  (40 samples, no texture reads — feedback-loop-free by design)
//   LUT 2 multi-scattering 32x32 (64 sphere dirs x 20 samples; reads transmittance)
//   LUT 3 sky-view 192x108      (30 variable samples; reads transmittance + multi-scattering)
//   dome  BackSide sphere, xyww far-plane trick (same recipe as the classic dome), samples
//         the sky-view LUT + transmittance-tinted sun disc + stars + moon at night.
// Frame: the reference is Z-up; this port is Y-up (three). Planet center sits at
//   (0, -(bottomRadiusKm + altitudeM/1000), 0) in editor world space so the geo altitude
//   thins the air physically (exp(-alt/8km) Rayleigh scale).

import * as THREE from './vendor/three.module.js';
import { C } from './const.js';

// ---- Earth constants (SetupEarthAtmosphere, km units; analysis/tmp_skybox/NOTES.md) ----
const EARTH = {
  bottomRadius: 6360.0,
  topRadius: 6460.0,           // 100 km Karman-ish atmosphere shell
  rayleighScattering: [0.005802, 0.013558, 0.033100],   // 1/km
  rayleighDensityExpScale: -1.0 / 8.0,
  mieScattering: [0.003996, 0.003996, 0.003996],
  mieExtinction: [0.004440, 0.004440, 0.004440],
  mieAbsorption: [0.000444, 0.000444, 0.000444],        // extinction - scattering (MaxZero3)
  mieDensityExpScale: -1.0 / 1.2,
  miePhaseG: 0.8,
  absorptionDensity0LayerWidth: 25.0,
  absorptionDensity0ConstantTerm: -2.0 / 3.0,
  absorptionDensity0LinearTerm: 1.0 / 15.0,
  absorptionDensity1ConstantTerm: 8.0 / 3.0,
  absorptionDensity1LinearTerm: -1.0 / 15.0,
  absorptionExtinction: [0.000650, 0.001881, 0.000085], // 1/km
  groundAlbedo: [0, 0, 0],
};
// Weather → physical atmosphere multipliers (research doc §6.3; haze = Mie load).
// clear = identity like the C.WEATHER table. The existing desat/darken mood still applies
// to the dome output (kept separate: physics in the LUTs, mood on the dome).
const SKY_WEATHER = {
  clear:    { rayleighK: 1.0,  mieK: 1.0 },
  cloudy:   { rayleighK: 1.03, mieK: 2.5 },
  overcast: { rayleighK: 1.06, mieK: 5.0 },
  rain:     { rayleighK: 1.10, mieK: 9.0 },
  fog:      { rayleighK: 1.15, mieK: 15.0 },
};
const TRANS_W = 256, TRANS_H = 64;
const SKYVIEW_W = 192, SKYVIEW_H = 108;
const MS_RES = 32;
const PLANET_RADIUS_OFFSET = 0.01;
const REBAKE_MIN_MS = 80;      // scrub throttle: LUT bakes coalesce to >=80ms apart
const PMREM_MIN_MS = 250;      // IBL rebake debounce (research doc §6.3: >=250ms)

// =====================================================================================
// GLSL — shared atmosphere chunk. #define PASS_* selects the entry point; the integration
// is one function with reference-faithful branches. Y-up port of the Z-up reference.
// =====================================================================================
const GLSL_COMMON = /* glsl */`
  #define PI 3.14159265358979
  #define PLANET_RADIUS_OFFSET 0.01
  #define TRANS_W 256.0
  #define TRANS_H 64.0
  #define SKYVIEW_W 192.0
  #define SKYVIEW_H 108.0
  #define MS_RES_F 32.0
  #define SPP_MIN 4.0
  #define SPP_MAX 14.0

  uniform float uBottomRadius, uTopRadius;
  uniform vec3 uRayleighScattering;
  uniform float uRayleighDensityExpScale;
  uniform vec3 uMieScattering, uMieExtinction, uMieAbsorption;
  uniform float uMieDensityExpScale, uMiePhaseG;
  uniform float uAbsorptionDensity0LayerWidth, uAbsorptionDensity0ConstantTerm;
  uniform float uAbsorptionDensity0LinearTerm, uAbsorptionDensity1ConstantTerm, uAbsorptionDensity1LinearTerm;
  uniform vec3 uAbsorptionExtinction;
  uniform vec3 uGroundAlbedo;
  uniform vec3 uSunDir;
  uniform vec3 uSunIlluminance;
  uniform vec3 uCameraPosKm;      // planet-frame camera (editor cam + planet offset), km

  #ifdef USE_TRANSMIT_TEX
  uniform sampler2D uTransmitTex;   // NOT declared for the transmittance pass — feedback-free by construction
  #endif
  #ifdef MULTISCAT_APPROX
  uniform sampler2D uMultiScatTex;   // declared only where the approximation compiles in
  #endif

  float sat(float x) { return clamp(x, 0.0, 1.0); }
  vec2 sat(vec2 x) { return clamp(x, vec2(0.0), vec2(1.0)); }

  // raySphereIntersectNearest — SkyAtmosphereCommon.hlsl @150
  float raySphereIntersectNearest(vec3 r0, vec3 rd, vec3 s0, float sR) {
    float a = dot(rd, rd);
    vec3 s0_r0 = r0 - s0;
    float b = 2.0 * dot(rd, s0_r0);
    float c = dot(s0_r0, s0_r0) - (sR * sR);
    float delta = b * b - 4.0 * a * c;
    if (delta < 0.0 || a == 0.0) return -1.0;
    float sol0 = (-b - sqrt(delta)) / (2.0 * a);
    float sol1 = (-b + sqrt(delta)) / (2.0 * a);
    if (sol0 < 0.0 && sol1 < 0.0) return -1.0;
    if (sol0 < 0.0) return max(0.0, sol1);
    if (sol1 < 0.0) return max(0.0, sol0);
    return max(0.0, min(sol0, sol1));
  }

  // Phase functions — RenderSkyCommon.hlsl
  float rayleighPhase(float cosTheta) {
    return 3.0 / (16.0 * PI) * (1.0 + cosTheta * cosTheta);
  }
  float cornetteShanks(float g, float cosTheta) {
    float k = 3.0 / (8.0 * PI) * (1.0 - g * g) / (2.0 + g * g);
    return k * (1.0 + cosTheta * cosTheta) / pow(1.0 + g * g + 2.0 * g * (-cosTheta), 1.5);
  }
  float hgPhase(float g, float cosTheta) { return cornetteShanks(g, cosTheta); }

  // Medium — sampleMediumRGB (density exp scales + piecewise-linear ozone)
  struct MediumSampleRGB {
    vec3 scattering, absorption, extinction;
    vec3 scatteringMie, extinctionMie, scatteringRay, extinctionRay, extinctionOzo;
  };
  MediumSampleRGB sampleMediumRGB(vec3 worldPos) {
    float viewHeight = length(worldPos) - uBottomRadius;
    float densityMie = exp(uMieDensityExpScale * viewHeight);
    float densityRay = exp(uRayleighDensityExpScale * viewHeight);
    float densityOzo = sat(viewHeight < uAbsorptionDensity0LayerWidth
      ? uAbsorptionDensity0LinearTerm * viewHeight + uAbsorptionDensity0ConstantTerm
      : uAbsorptionDensity1LinearTerm * viewHeight + uAbsorptionDensity1ConstantTerm);
    MediumSampleRGB s;
    s.scatteringMie = densityMie * uMieScattering;
    s.extinctionMie = densityMie * uMieExtinction;
    s.scatteringRay = densityRay * uRayleighScattering;
    s.extinctionRay = s.scatteringRay;                 // rayleigh absorption = 0
    s.extinctionOzo = densityOzo * uAbsorptionExtinction;
    s.scattering = s.scatteringMie + s.scatteringRay;
    s.absorption = densityMie * uMieAbsorption + s.extinctionOzo;
    s.extinction = s.extinctionMie + s.extinctionRay + s.extinctionOzo;
    return s;
  }

  // ---- Transmittance LUT parametrization (Bruneton 2017) ----
  void uvToLutTransmittanceParams(out float viewHeight, out float viewZenithCosAngle, vec2 uv) {
    float x_mu = uv.x, x_r = uv.y;
    float H = sqrt(uTopRadius * uTopRadius - uBottomRadius * uBottomRadius);
    float rho = H * x_r;
    viewHeight = sqrt(rho * rho + uBottomRadius * uBottomRadius);
    float d_min = uTopRadius - viewHeight;
    float d_max = rho + H;
    float d = d_min + x_mu * (d_max - d_min);
    viewZenithCosAngle = d == 0.0 ? 1.0 : (H * H - rho * rho - d * d) / (2.0 * viewHeight * d);
    viewZenithCosAngle = clamp(viewZenithCosAngle, -1.0, 1.0);
  }
  void lutTransmittanceParamsToUv(float viewHeight, float viewZenithCosAngle, out vec2 uv) {
    float H = sqrt(max(0.0, uTopRadius * uTopRadius - uBottomRadius * uBottomRadius));
    float rho = sqrt(max(0.0, viewHeight * viewHeight - uBottomRadius * uBottomRadius));
    float discriminant = viewHeight * viewHeight * (viewZenithCosAngle * viewZenithCosAngle - 1.0) + uTopRadius * uTopRadius;
    float d = max(0.0, -viewHeight * viewZenithCosAngle + sqrt(discriminant));
    float d_min = uTopRadius - viewHeight;
    float d_max = rho + H;
    uv = vec2((d - d_min) / (d_max - d_min), rho / H);
  }

  // ---- Sky-view LUT parametrization (NONLINEARSKYVIEWLUT 1) ----
  float fromUnitToSubUvs(float u, float resolution) { return (u + 0.5 / resolution) * (resolution / (resolution + 1.0)); }
  float fromSubUvsToUnit(float u, float resolution) { return (u - 0.5 / resolution) * (resolution / (resolution - 1.0)); }
  void uvToSkyViewLutParams(out float viewZenithCosAngle, out float lightViewCosAngle, float viewHeight, vec2 uv) {
    uv = vec2(fromSubUvsToUnit(uv.x, SKYVIEW_W), fromSubUvsToUnit(uv.y, SKYVIEW_H));
    float Vhorizon = sqrt(viewHeight * viewHeight - uBottomRadius * uBottomRadius);
    float CosBeta = Vhorizon / viewHeight;
    float Beta = acos(CosBeta);
    float ZenithHorizonAngle = PI - Beta;
    if (uv.y < 0.5) {
      float coord = 1.0 - (1.0 - (1.0 - 2.0 * uv.y) * (1.0 - 2.0 * uv.y));
      viewZenithCosAngle = cos(ZenithHorizonAngle * coord);
    } else {
      float coord = uv.y * 2.0 - 1.0;
      viewZenithCosAngle = cos(ZenithHorizonAngle + Beta * coord * coord);
    }
    float cx = uv.x * uv.x;
    lightViewCosAngle = -(cx * 2.0 - 1.0);
  }
  void skyViewLutParamsToUv(bool intersectGround, float viewZenithCosAngle, float lightViewCosAngle, float viewHeight, out vec2 uv) {
    float Vhorizon = sqrt(viewHeight * viewHeight - uBottomRadius * uBottomRadius);
    float CosBeta = Vhorizon / viewHeight;
    float Beta = acos(CosBeta);
    float ZenithHorizonAngle = PI - Beta;
    if (!intersectGround) {
      float coord = acos(viewZenithCosAngle) / ZenithHorizonAngle;
      coord = 1.0 - coord;
      coord = sqrt(coord);
      uv.y = (1.0 - coord) * 0.5;
    } else {
      float coord = (acos(viewZenithCosAngle) - ZenithHorizonAngle) / Beta;
      coord = sqrt(max(0.0, coord));
      uv.y = coord * 0.5 + 0.5;
    }
    float cx = -lightViewCosAngle * 0.5 + 0.5;
    uv.x = sqrt(max(0.0, cx));
    uv = vec2(fromUnitToSubUvs(uv.x, SKYVIEW_W), fromUnitToSubUvs(uv.y, SKYVIEW_H));
  }

  bool moveToTopAtmosphere(inout vec3 worldPos, vec3 worldDir) {
    float viewHeight = length(worldPos);
    if (viewHeight > uTopRadius) {
      float tTop = raySphereIntersectNearest(worldPos, worldDir, vec3(0.0), uTopRadius);
      if (tTop >= 0.0) {
        vec3 upVector = worldPos / viewHeight;
        worldPos = worldPos + worldDir * tTop - upVector * PLANET_RADIUS_OFFSET;
        return true;
      }
      return false;
    }
    return true;
  }

  // ---- Integration (IntegrateScatteredLuminance; Frostbite slide-28 analytic step) ----
  struct SSSResult { vec3 L; vec3 opticalDepth; vec3 transmittance; vec3 multiScatAs1; };
  SSSResult integrateScatteredLuminance(
      vec3 worldPos, vec3 worldDir, vec3 sunDir,
      float sampleCountIni, bool variableSampleCount, bool mieRayPhase) {
    SSSResult result = SSSResult(vec3(0.0), vec3(0.0), vec3(1.0), vec3(0.0));
    vec3 earthO = vec3(0.0);
    float tBottom = raySphereIntersectNearest(worldPos, worldDir, earthO, uBottomRadius);
    float tTop = raySphereIntersectNearest(worldPos, worldDir, earthO, uTopRadius);
    float tMax = 0.0;
    if (tBottom < 0.0) {
      if (tTop < 0.0) return result;              // no intersection with medium
      tMax = tTop;
    } else {
      if (tTop > 0.0) tMax = min(tTop, tBottom);
    }
    tMax = min(tMax, 9000000.0);
    float sampleCount = sampleCountIni;
    float sampleCountFloor = sampleCountIni;
    float tMaxFloor = tMax;
    if (variableSampleCount) {
      sampleCount = mix(SPP_MIN, SPP_MAX, sat(tMax * 0.01));
      sampleCountFloor = floor(sampleCount);
      tMaxFloor = tMax * sampleCountFloor / sampleCount;
    }
    float dt = tMax / max(sampleCount, 1.0);
    float uniformPhase = 1.0 / (4.0 * PI);
    float cosTheta = dot(sunDir, worldDir);
    float miePhaseValue = hgPhase(uMiePhaseG, -cosTheta);     // negate: WorldDir is an "in" direction
    float rayleighPhaseValue = rayleighPhase(cosTheta);
    #ifdef ILLUMINANCE_IS_ONE
    vec3 globalL = vec3(1.0);
    #else
    vec3 globalL = uSunIlluminance;
    #endif
    vec3 L = vec3(0.0), throughput = vec3(1.0), opticalDepth = vec3(0.0);
    float t = 0.0;
    const float SampleSegmentT = 0.3;
    for (float s = 0.0; s < sampleCount; s += 1.0) {
      if (variableSampleCount) {
        float t0 = s / sampleCountFloor;
        float t1 = (s + 1.0) / sampleCountFloor;
        t0 = t0 * t0;
        t1 = t1 * t1;
        t0 = tMaxFloor * t0;
        t1 = t1 > 1.0 ? tMax : tMaxFloor * t1;
        t = t0 + (t1 - t0) * SampleSegmentT;
        dt = t1 - t0;
      } else {
        float newT = tMax * (s + SampleSegmentT) / sampleCount;
        dt = newT - t;
        t = newT;
      }
      vec3 P = worldPos + t * worldDir;
      MediumSampleRGB medium = sampleMediumRGB(P);
      vec3 sampleOpticalDepth = medium.extinction * dt;
      vec3 sampleTransmittance = exp(-sampleOpticalDepth);
      opticalDepth += sampleOpticalDepth;

      float pHeight = length(P);
      vec3 upVector = P / pHeight;
      float sunZenithCosAngle = dot(sunDir, upVector);
      vec2 uvT;
      lutTransmittanceParamsToUv(pHeight, sunZenithCosAngle, uvT);
      #ifdef USE_TRANSMIT_TEX
      vec3 transmittanceToSun = texture(uTransmitTex, uvT).rgb;
      #else
      vec3 transmittanceToSun = vec3(1.0);
      #endif

      vec3 phaseTimesScattering = mieRayPhase
        ? medium.scatteringMie * miePhaseValue + medium.scatteringRay * rayleighPhaseValue
        : medium.scattering * uniformPhase;

      // Earth shadow
      float tEarth = raySphereIntersectNearest(P, sunDir, earthO + PLANET_RADIUS_OFFSET * upVector, uBottomRadius);
      float earthShadow = tEarth >= 0.0 ? 0.0 : 1.0;

      #ifdef MULTISCAT_APPROX
      vec2 uvMS = sat(vec2(sunZenithCosAngle * 0.5 + 0.5,
        (length(P) - uBottomRadius) / (uTopRadius - uBottomRadius)));
      uvMS = vec2(fromUnitToSubUvs(uvMS.x, MS_RES_F), fromUnitToSubUvs(uvMS.y, MS_RES_F));
      vec3 multiScatteredLuminance = texture(uMultiScatTex, uvMS).rgb;
      #else
      vec3 multiScatteredLuminance = vec3(0.0);
      #endif

      vec3 S = globalL * (earthShadow * transmittanceToSun * phaseTimesScattering
                          + multiScatteredLuminance * medium.scattering);

      // multi-scattering energy term (power serie numerator)
      vec3 MS = medium.scattering;
      result.multiScatAs1 += throughput * (MS - MS * sampleTransmittance) / medium.extinction;

      // in-scatter (analytic segment integral — slide 28)
      vec3 Sint = (S - S * sampleTransmittance) / medium.extinction;
      L += throughput * Sint;
      throughput *= sampleTransmittance;
    }
    #ifdef GROUND_BOUNCE
    if (tMax == tBottom && tBottom > 0.0) {
      vec3 P = worldPos + tBottom * worldDir;
      float pHeight = length(P);
      vec3 upVector = P / pHeight;
      float sunZenithCosAngle = dot(sunDir, upVector);
      vec2 uvT;
      lutTransmittanceParamsToUv(pHeight, sunZenithCosAngle, uvT);
      #ifdef USE_TRANSMIT_TEX
      vec3 transmittanceToSun = texture(uTransmitTex, uvT).rgb;
      #else
      vec3 transmittanceToSun = vec3(1.0);
      #endif
      float NdotL = sat(dot(upVector, sunDir));
      L += globalL * transmittanceToSun * throughput * NdotL * uGroundAlbedo / PI;
    }
    #endif
    result.L = L;
    result.opticalDepth = opticalDepth;
    result.transmittance = throughput;
    return result;
  }
`;

// =====================================================================================
// Bake shaders
// =====================================================================================
const BAKE_VERT = /* glsl */`
  out vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Pass 1 — RenderTransmittanceLutPS: no texture reads (TransmittanceToSun := 1), 40 samples,
// uniform spacing, MieRayPhase off. Only opticalDepth is consumed.
const TRANS_FRAG = /* glsl */`
  #define PASS_TRANSMITTANCE
${GLSL_COMMON}
  in vec2 vUv;
  layout(location = 0) out vec4 outColor;
  void main() {
    float viewHeight, viewZenithCosAngle;
    uvToLutTransmittanceParams(viewHeight, viewZenithCosAngle, vUv);
    vec3 worldPos = vec3(0.0, viewHeight, 0.0);
    vec3 worldDir = vec3(0.0, viewZenithCosAngle, sqrt(max(0.0, 1.0 - viewZenithCosAngle * viewZenithCosAngle)));
    SSSResult r = integrateScatteredLuminance(worldPos, worldDir, uSunDir, 40.0, false, false);
    outColor = vec4(exp(-r.opticalDepth), 1.0);
  }
`;

// Pass 2 — NewMultiScattCS as a fragment loop: 64 sphere directions (8x8 stratified grid),
// 20 samples each, ground bounce on (albedo 0 here), ILLUMINANCE_IS_ONE (transfer factor).
const MULTISCAT_FRAG = /* glsl */`
  #define PASS_MULTISCAT
  #define ILLUMINANCE_IS_ONE
  #define GROUND_BOUNCE
  #define USE_TRANSMIT_TEX
${GLSL_COMMON}
  in vec2 vUv;
  layout(location = 0) out vec4 outColor;
  void main() {
    vec2 uvUnit = vec2(fromSubUvsToUnit(vUv.x, MS_RES_F), fromSubUvsToUnit(vUv.y, MS_RES_F));
    float cosSunZenithAngle = uvUnit.x * 2.0 - 1.0;
    vec3 sunDir = normalize(vec3(sqrt(sat(1.0 - cosSunZenithAngle * cosSunZenithAngle)), cosSunZenithAngle, 0.0));
    float viewHeight = uBottomRadius + sat(uvUnit.y + PLANET_RADIUS_OFFSET)
      * (uTopRadius - uBottomRadius - PLANET_RADIUS_OFFSET);
    vec3 worldPos = vec3(0.0, viewHeight, 0.0);
    vec3 msSum = vec3(0.0), lSum = vec3(0.0);
    const float SQ = 8.0;
    for (float k = 0.0; k < 64.0; k += 1.0) {
      float i = floor(k / SQ) + 0.5;
      float j = k - floor(k / SQ) * SQ + 0.5;
      float theta = 2.0 * PI * (i / SQ);
      float phi = acos(1.0 - 2.0 * (j / SQ));      // uniform sphere sampling
      float sinPhi = sin(phi), cosPhi = cos(phi);
      vec3 worldDir = vec3(cos(theta) * sinPhi, cosPhi, sin(theta) * sinPhi);
      SSSResult r = integrateScatteredLuminance(worldPos, worldDir, sunDir, 20.0, false, false);
      msSum += r.multiScatAs1;
      lSum += r.L;
    }
    // The reference's 4pi/(sqrtSample^2) reduction x isotropic phase cancels to /64.
    vec3 multiScatAs1 = msSum / 64.0;
    vec3 inScattered = lSum / 64.0;
    vec3 L = inScattered / (vec3(1.0) - multiScatAs1);   // geometric serie 1/(1-r)
    outColor = vec4(L, 1.0);                              // MultipleScatteringFactor = 1.0
  }
`;

// Pass 3 — SkyViewLutPS: 30 variable samples, MieRayPhase on, MULTISCAT on. Camera-relative
// frame reconstructed from the LUT uv (the camera height is baked into the parametrization).
const SKYVIEW_FRAG = /* glsl */`
  #define PASS_SKYVIEW
  #define MULTISCAT_APPROX
  #define USE_TRANSMIT_TEX
${GLSL_COMMON}
  in vec2 vUv;
  layout(location = 0) out vec4 outColor;
  void main() {
    float viewHeight = length(uCameraPosKm);
    float viewZenithCosAngle, lightViewCosAngle;
    uvToSkyViewLutParams(viewZenithCosAngle, lightViewCosAngle, viewHeight, vUv);
    vec3 upVector = uCameraPosKm / viewHeight;
    float sunZenithCosAngle = dot(upVector, uSunDir);
    vec3 sunDir = normalize(vec3(sqrt(max(0.0, 1.0 - sunZenithCosAngle * sunZenithCosAngle)), sunZenithCosAngle, 0.0));
    vec3 worldPos = vec3(0.0, viewHeight, 0.0);
    float vzsa = sqrt(max(0.0, 1.0 - viewZenithCosAngle * viewZenithCosAngle));
    vec3 worldDir = vec3(vzsa * lightViewCosAngle, viewZenithCosAngle,
                         vzsa * sqrt(max(0.0, 1.0 - lightViewCosAngle * lightViewCosAngle)));
    if (!moveToTopAtmosphere(worldPos, worldDir)) { outColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    SSSResult ss = integrateScatteredLuminance(worldPos, worldDir, sunDir, 30.0, true, true);
    outColor = vec4(ss.L, 1.0);
  }
`;

// =====================================================================================
// Dome — same mesh recipe as the classic dome (BackSide, xyww far plane, renderOrder -1).
// GLSL3 ShaderMaterial: three does NOT inject gl_FragColor / linearToOutputTexel for
// explicit GLSL3, so the output declaration and the sRGB OETF are ours (uOutputSRGB gates
// plain-render vs finish-RT linear). Tone curve = demo post (1-exp(-c/wp*e)) on the visible
// dome only; PMREM bakes linear HDR without disc/moon/stars.
// =====================================================================================
const DOME_VERT = /* glsl */`
  out vec3 vDirection;
  void main() {
    vDirection = position;
    vec4 clip = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
    gl_Position = clip.xyww;      // sky at infinity: view rotation only
  }
`;

const DOME_FRAG = /* glsl */`
  #define PASS_DOME
  #define USE_TRANSMIT_TEX
${GLSL_COMMON}
  uniform sampler2D uSkyViewLut;
  uniform float uExposure;
  uniform vec3 uWhitePoint;
  uniform float uOutputSRGB;     // 1 = plain render (apply OETF), 0 = linear target (finish RT / PMREM)
  uniform float uToneMap;        // 1 = visible dome (demo post curve), 0 = PMREM (linear HDR)
  uniform float uNightAmount;    // 0 day .. 1 deep dusk (stars/moon ramp)
  uniform vec3 uMoonDir;
  uniform float uWeatherDesat, uWeatherDarken;
  uniform vec3 uFogColor;        // linear working space (matches scene.fog.color exactly)
  uniform float uFogBlend;       // 0..1 horizon band mix
  uniform vec3 uSunDiscL;        // sun disc luminance (pre-curve)
  in vec3 vDirection;
  layout(location = 0) out vec4 outColor;

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  vec3 linearToSrgb(vec3 c) {
    vec3 lo = c * 12.92;
    vec3 hi = 1.055 * pow(max(c, vec3(0.0031308)), vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(vec3(0.0031308), c));
  }

  void main() {
    vec3 worldDir = normalize(vDirection);
    vec3 worldPos = uCameraPosKm;
    float viewHeight = length(worldPos);
    vec3 upVector = worldPos / viewHeight;
    float viewZenithCosAngle = dot(worldDir, upVector);

    // sun-relative frame (RenderRayMarchingPS FASTSKY path)
    vec3 sideVector = normalize(cross(upVector, worldDir));
    vec3 forwardVector = normalize(cross(sideVector, upVector));
    vec2 lightOnPlane = normalize(vec2(dot(uSunDir, forwardVector), dot(uSunDir, sideVector)));
    float lightViewCosAngle = lightOnPlane.x;

    bool intersectGround = raySphereIntersectNearest(worldPos, worldDir, vec3(0.0), uBottomRadius) >= 0.0;
    vec2 uv;
    skyViewLutParamsToUv(intersectGround, viewZenithCosAngle, lightViewCosAngle, viewHeight, uv);
    vec3 L = texture(uSkyViewLut, uv).rgb;

    float visible = uToneMap;   // disc/moon/stars are sky-VISUALS — excluded from the IBL bake

    // --- sun disc, transmittance-tinted (angular radius 0.505 deg, hidden behind the planet) ---
    if (dot(worldDir, uSunDir) > cos(0.5 * 0.505 * PI / 180.0)) {
      float t = raySphereIntersectNearest(worldPos, worldDir, vec3(0.0), uBottomRadius);
      if (t < 0.0) {
        float sunZenithCos = dot(uSunDir, upVector);
        vec2 tuv;
        lutTransmittanceParamsToUv(viewHeight, sunZenithCos, tuv);
        vec3 T = texture(uTransmitTex, tuv).rgb;
        L += visible * uSunDiscL * T;
      }
    }

    // --- night: stars + moon (P1: cosmetic — scene lighting stays table-driven) ---
    if (uNightAmount > 0.001) {
      float horizonFade = smoothstep(0.0, 0.18, worldDir.y);
      vec3 sp = worldDir * 260.0;
      vec3 id = floor(sp);
      vec3 f = fract(sp) - 0.5;
      float h = hash13(id);
      vec3 jit = vec3(hash13(id + 7.1), hash13(id + 3.7), hash13(id + 9.3)) - 0.5;
      float d = length(f - jit * 0.8);
      float star = step(0.955, h) * smoothstep(0.12, 0.0, d) * (0.25 + 0.75 * hash13(id + 1.3));
      vec3 starCol = vec3(0.85, 0.9, 1.0) + vec3(0.15, 0.02, -0.1) * hash13(id + 2.6);
      L += visible * uNightAmount * horizonFade * star * starCol * 0.9;
      // moon: ~0.55 deg disc + halo, opposite the sun
      float moonCos = dot(worldDir, uMoonDir);
      float disc = smoothstep(cos(0.0096), cos(0.0080), moonCos);
      float halo = pow(max(moonCos, 0.0), 700.0) * 0.12;
      L += visible * uNightAmount * horizonFade * vec3(0.86, 0.88, 0.95) * (disc * 0.55 + halo);
    }

    // --- weather mood (same Rec.601 desat + darken as the classic dome) ---
    float lum = dot(L, vec3(0.299, 0.587, 0.114));
    L = mix(vec3(lum), L, 1.0 - uWeatherDesat);
    L *= (1.0 - uWeatherDarken);

    // --- horizon fog band: blends to the SAME linear fog color the FogExp2 ground uses,
    //     applied post-curve so the seam matches the classic horizon exactly ---
    float band = exp(-max(worldDir.y, 0.0) / 0.06);
    if (uToneMap > 0.5) L = vec3(1.0) - exp(-max(L, vec3(0.0)) / uWhitePoint * uExposure);
    L = mix(L, uFogColor, band * uFogBlend);

    if (uOutputSRGB > 0.5) L = linearToSrgb(max(L, vec3(0.0)));
    outColor = vec4(L, 1.0);
  }
`;

// =====================================================================================
// JS — bake manager
// =====================================================================================
function makeLutRT(w, h) {
  return new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType, format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
  });
}

function scalarUniforms() {
  return {
    uBottomRadius: { value: EARTH.bottomRadius },
    uTopRadius: { value: EARTH.topRadius },
    uRayleighScattering: { value: new THREE.Vector3(...EARTH.rayleighScattering) },
    uRayleighDensityExpScale: { value: EARTH.rayleighDensityExpScale },
    uMieScattering: { value: new THREE.Vector3(...EARTH.mieScattering) },
    uMieExtinction: { value: new THREE.Vector3(...EARTH.mieExtinction) },
    uMieAbsorption: { value: new THREE.Vector3(...EARTH.mieAbsorption) },
    uMieDensityExpScale: { value: EARTH.mieDensityExpScale },
    uMiePhaseG: { value: EARTH.miePhaseG },
    uAbsorptionDensity0LayerWidth: { value: EARTH.absorptionDensity0LayerWidth },
    uAbsorptionDensity0ConstantTerm: { value: EARTH.absorptionDensity0ConstantTerm },
    uAbsorptionDensity0LinearTerm: { value: EARTH.absorptionDensity0LinearTerm },
    uAbsorptionDensity1ConstantTerm: { value: EARTH.absorptionDensity1ConstantTerm },
    uAbsorptionDensity1LinearTerm: { value: EARTH.absorptionDensity1LinearTerm },
    uAbsorptionExtinction: { value: new THREE.Vector3(...EARTH.absorptionExtinction) },
    uGroundAlbedo: { value: new THREE.Vector3(...EARTH.groundAlbedo) },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunIlluminance: { value: new THREE.Vector3(1, 1, 1) },
    uCameraPosKm: { value: new THREE.Vector3(0, EARTH.bottomRadius, 0) },
  };
}

export function createRealisticSky({ renderer }) {
  const glsl3 = { glslVersion: THREE.GLSL3 };
  const transMat = new THREE.ShaderMaterial({
    ...glsl3, vertexShader: BAKE_VERT, fragmentShader: TRANS_FRAG,
    depthTest: false, depthWrite: false,
    uniforms: scalarUniforms(),                    // NO texture uniforms — feedback-free
  });
  const msMat = new THREE.ShaderMaterial({
    ...glsl3, vertexShader: BAKE_VERT, fragmentShader: MULTISCAT_FRAG,
    depthTest: false, depthWrite: false,
    uniforms: { ...scalarUniforms(), uTransmitTex: { value: null } },
  });
  const svMat = new THREE.ShaderMaterial({
    ...glsl3, vertexShader: BAKE_VERT, fragmentShader: SKYVIEW_FRAG,
    depthTest: false, depthWrite: false,
    uniforms: { ...scalarUniforms(), uTransmitTex: { value: null }, uMultiScatTex: { value: null } },
  });
  const domeMat = new THREE.ShaderMaterial({
    ...glsl3, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG,
    side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false,
    uniforms: {
      ...scalarUniforms(),
      uSkyViewLut: { value: null },
      uTransmitTex: { value: null },
      uExposure: { value: C.SKY_EXPOSURE },
      uWhitePoint: { value: new THREE.Vector3(...C.SKY_WHITE_POINT) },
      uOutputSRGB: { value: 1 },
      uToneMap: { value: 1 },
      uNightAmount: { value: 0 },
      uMoonDir: { value: new THREE.Vector3(0, -1, 0) },
      uWeatherDesat: { value: 0 },
      uWeatherDarken: { value: 0 },
      uFogColor: { value: new THREE.Color(0xffffff) },
      uFogBlend: { value: 0.06 },
      uSunDiscL: { value: new THREE.Vector3(30, 30, 30) },
    },
  });

  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), domeMat);
  dome.frustumCulled = false;
  dome.renderOrder = -1;
  dome.raycast = () => {};
  dome.visible = false;

  const transRT = makeLutRT(TRANS_W, TRANS_H);
  const msRT = makeLutRT(MS_RES, MS_RES);
  const svRT = makeLutRT(SKYVIEW_W, SKYVIEW_H);
  msMat.uniforms.uTransmitTex.value = transRT.texture;
  svMat.uniforms.uTransmitTex.value = transRT.texture;
  svMat.uniforms.uMultiScatTex.value = msRT.texture;
  domeMat.uniforms.uTransmitTex.value = transRT.texture;
  domeMat.uniforms.uSkyViewLut.value = svRT.texture;

  // fullscreen bake scene (vertex ignores the camera; ortho cam satisfies three)
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), transMat);
  quad.frustumCulled = false;
  const bakeScene = new THREE.Scene();
  bakeScene.add(quad);
  const bakeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // PMREM twin: same geometry+material, own scene (dome can't be in two scenes)
  const pmremScene = new THREE.Scene();
  const domeTwin = new THREE.Mesh(dome.geometry, domeMat);
  domeTwin.frustumCulled = false;
  pmremScene.add(domeTwin);
  let pmremGen = null, pmremRT = null;

  // ---- state ----
  const _cam = new THREE.Vector3();
  let paramKey = '', camHeightKm = -1, lutDirty = true, svDirty = true;
  let lastBakeAt = -1e9, lastPmremAt = -1e9, pmremPending = false;
  let lastEnvTex = null, enabled = false, altitudeM = 0;

  function setParams(p) {
    const mats = [transMat, msMat, svMat, domeMat];
    const sw = SKY_WEATHER[p.weather] ?? SKY_WEATHER.clear;
    const ray = EARTH.rayleighScattering.map(v => v * sw.rayleighK);
    const mieS = EARTH.mieScattering.map(v => v * sw.mieK);
    const mieE = EARTH.mieExtinction.map(v => v * sw.mieK);
    const mieA = mieE.map((v, i) => Math.max(0, v - mieS[i]));
    altitudeM = p.altitudeM ?? 0;
    const key = [
      p.sunDir.x.toFixed(5), p.sunDir.y.toFixed(5), p.sunDir.z.toFixed(5),
      p.sunIlluminance.map(v => v.toFixed(4)).join(','),
      ray.join(','), mieS.join(','), mieE.join(','),
      altitudeM.toFixed(1),
    ].join('|');
    if (key !== paramKey) { paramKey = key; lutDirty = true; }
    for (const m of mats) {
      const u = m.uniforms;
      u.uSunDir.value.copy(p.sunDir);
      u.uSunIlluminance.value.set(...p.sunIlluminance);
      u.uRayleighScattering.value.set(...ray);
      u.uMieScattering.value.set(...mieS);
      u.uMieExtinction.value.set(...mieE);
      u.uMieAbsorption.value.set(...mieA);
    }
    const du = domeMat.uniforms;
    du.uNightAmount.value = p.nightAmt ?? 0;   // env.js buildSkyParams field: nightAmt
    du.uMoonDir.value.copy(p.moonDir);
    du.uWeatherDesat.value = p.weatherDesat ?? 0;
    du.uWeatherDarken.value = p.weatherDarken ?? 0;
    if (p.fogColor) du.uFogColor.value.copy(p.fogColor);
    du.uFogBlend.value = p.fogBlend ?? 0.06;
    du.uSunDiscL.value.copy(p.sunDiscL);
    du.uExposure.value = p.exposure ?? C.SKY_EXPOSURE;
  }

  function setCamera(camera) {
    // editor world → planet frame (km). Planet center at -(bottomRadius + alt/1000) y.
    const off = EARTH.bottomRadius + altitudeM / 1000;
    _cam.set(camera.position.x / 1000, camera.position.y / 1000 + off, camera.position.z / 1000);
    const h = _cam.length();
    if (Math.abs(h - camHeightKm) > 0.005) { camHeightKm = h; svDirty = true; }   // 5 m
    for (const m of [transMat, msMat, svMat, domeMat]) m.uniforms.uCameraPosKm.value.copy(_cam);
  }

  function renderPass(mat, rt) {
    quad.material = mat;
    renderer.setRenderTarget(rt);
    renderer.render(bakeScene, bakeCam);
    renderer.setRenderTarget(null);
  }

  function bake() {
    renderPass(transMat, transRT);     // 1. transmittance (no texture reads)
    renderPass(msMat, msRT);           // 2. multi-scattering (reads transmittance)
    renderPass(svMat, svRT);           // 3. sky-view (reads transmittance + multi-scattering)
    lutDirty = false; svDirty = false;
    lastBakeAt = performance.now();
    pmremPending = true;
  }

  function bakeSkyView() {
    renderPass(svMat, svRT);
    svDirty = false;
    lastBakeAt = performance.now();
    pmremPending = true;
  }

  function bakePMREM() {
    if (!pmremGen) pmremGen = new THREE.PMREMGenerator(renderer);
    const u = domeMat.uniforms;
    const prevOut = u.uOutputSRGB.value, prevTone = u.uToneMap.value;
    u.uOutputSRGB.value = 0; u.uToneMap.value = 0;    // linear HDR, no disc/moon/stars
    const prev = pmremRT;
    pmremRT = pmremGen.fromScene(pmremScene, 0, 0.1, 1000);
    prev?.dispose();
    u.uOutputSRGB.value = prevOut; u.uToneMap.value = prevTone;
    lastPmremAt = performance.now();
    pmremPending = false;
  }

  // per-frame: rebake LUTs when dirty (throttled), refresh IBL debounced, set output mode
  function update(camera, outputSRGB, scene) {
    if (!enabled) return null;
    setCamera(camera);
    domeMat.uniforms.uOutputSRGB.value = outputSRGB ? 1 : 0;
    domeMat.uniforms.uToneMap.value = 1;
    const now = performance.now();
    if ((lutDirty || svDirty) && now - lastBakeAt >= REBAKE_MIN_MS) {
      if (lutDirty) bake(); else bakeSkyView();
    }
    if (pmremPending && now - lastPmremAt >= PMREM_MIN_MS) bakePMREM();
    if (scene && scene.environment !== (pmremRT?.texture ?? null)) {
      scene.environment = pmremRT ? pmremRT.texture : null;
    }
    return pmremRT ? pmremRT.texture : null;
  }

  function setEnabled(v) {
    enabled = !!v;
    dome.visible = enabled;
    if (!enabled) { pmremRT?.dispose(); pmremRT = null; lastEnvTex = null; }
    else { lutDirty = true; }   // re-enable always rebakes: the PMREM RT was disposed on disable
  }

  // E2E/debug: read a LUT back — r182 readRenderTargetPixels reads HalfFloat RTs with type
  // HALF_FLOAT, so the buffer must be Uint16Array (raw half bits) which we decode here.
  function dumpLut(name) {
    const rt = name === 'transmittance' ? transRT : name === 'multiscat' ? msRT : svRT;
    const raw = new Uint16Array(rt.width * rt.height * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, rt.width, rt.height, raw);
    const data = new Float32Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      const h = raw[i];
      const s = (h & 0x8000) >> 15, e = (h & 0x7c00) >> 10, f = h & 0x03ff;
      data[i] = e === 0 ? (f === 0 ? 0 : (f / 1024) * 2 ** -24) * (s ? -1 : 1)
        : e === 31 ? (f ? NaN : (s ? -Infinity : Infinity))
        : (1 + f / 1024) * 2 ** (e - 15) * (s ? -1 : 1);
    }
    return { w: rt.width, h: rt.height, data };
  }

  function dispose() {
    transRT.dispose(); msRT.dispose(); svRT.dispose();
    pmremRT?.dispose(); pmremGen?.dispose();
    dome.geometry.dispose();
    for (const m of [transMat, msMat, svMat, domeMat]) m.dispose();
    quad.geometry.dispose();
  }

  return {
    mesh: dome, setParams, setCamera, update, setEnabled, bake, dispose, dumpLut,
    luts: { transmittance: transRT, multiscat: msRT, skyView: svRT },
    materials: { transmittance: transMat, multiscat: msMat, skyView: svMat, dome: domeMat },
    _debug: { bakePMREM, get pmremPending() { return pmremPending; }, get lutDirty() { return lutDirty; } },
  };
}
