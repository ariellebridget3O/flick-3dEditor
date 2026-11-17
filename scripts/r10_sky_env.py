#!/usr/bin/env python3
# r10 step 3: env.js integration — realistic sky branch (classic path untouched)
import re, sys

P = '/home/z/my-project/flick-3dEditor/editor/js/env.js'
s = open(P).read()

def sub(old, new, n=1):
    global s
    assert s.count(old) == n, f"anchor x{s.count(old)} (want {n}): {old[:80]!r}"
    s = s.replace(old, new)

# 1. import
sub("export function solarPositionDeg(geo) {",
    "// round 10 (skybox P1): realistic atmosphere dome (sebh/UnrealEngineSkyAtmosphere port)\n"
    "import { createRealisticSky } from './sky.js';\n\n"
    "export function solarPositionDeg(geo) {")

# 2. createEnvironment: construct the realistic sky next to the classic dome
sub("export function createEnvironment(scene, settings) {\n"
    "  const sky = makeSkyDome();\n"
    "  scene.add(sky);",
    "export function createEnvironment(scene, settings) {\n"
    "  const sky = makeSkyDome();\n"
    "  scene.add(sky);\n"
    "  // round 10 (skybox P1): realistic dome — hidden until light.skyStyle === 'realistic'\n"
    "  const realistic = createRealisticSky({ renderer: settings.renderer });\n"
    "  scene.add(realistic.mesh);\n"
    "  let skyStyle = 'classic';\n"
    "  let _lastLight = null;")

# 3. applyDaylight: remember the light + refresh realistic params when the style is active
sub("  let _lastKey = '', glow = 0;\n"
    "  function applyDaylight(light) {\n"
    "    const glowAmount = () => light.nightLights === false ? 0 : glow;",
    "  let _lastKey = '', glow = 0;\n"
    "  function applyDaylight(light) {\n"
    "    const glowAmount = () => light.nightLights === false ? 0 : glow;\n"
    "    _lastLight = light;")

# after the classic uniforms block (before `glow = g.glow;`), refresh the realistic dome
sub("    u.flare.value.copy(g.sunColor).multiplyScalar(g.flare * w.flare);",
    "    u.flare.value.copy(g.sunColor).multiplyScalar(g.flare * w.flare);\n"
    "    if (skyStyle === 'realistic') realistic.setParams(buildSkyParams(light, scene.fog.color, g));")

# 4. style switcher + per-frame update, returned from createEnvironment
sub("  return { sky, floor, sun, hemi, ambient, applyDaylight, walkableSurfaces, shadowMapPx: mapPx };",
    "  function setSkyStyle(style, light) {\n"
    "    skyStyle = style === 'realistic' ? 'realistic' : 'classic';\n"
    "    sky.visible = skyStyle === 'classic';\n"
    "    realistic.setEnabled(skyStyle === 'realistic');\n"
    "    if (skyStyle === 'realistic') {\n"
    "      const l = light ?? _lastLight;\n"
    "      if (l) realistic.setParams(buildSkyParams(l, scene.fog.color));\n"
    "    }\n"
    "  }\n"
    "  function updateRealisticSky(camera, outputSRGB) {\n"
    "    if (skyStyle !== 'realistic') return;\n"
    "    realistic.update(camera, outputSRGB, scene);\n"
    "  }\n"
    "  return { sky, floor, sun, hemi, ambient, applyDaylight, walkableSurfaces, shadowMapPx: mapPx,\n"
    "    setSkyStyle, updateRealisticSky, realisticSky: () => realistic, getSkyStyle: () => skyStyle };")

# 5. buildSkyParams helper (module level, after sunDirection)
sub("// ---------- sky dome (xOr) ----------",
    "// round 10 (skybox P1): realistic-sky parameter bundle from the light state.\n"
    "// Sun direction follows sunDirection(light) so the disc, shadows and flare always agree;\n"
    "// the atmosphere illuminance is reference-normalized (1.0) with a mild daylight sun tint.\n"
    "const _tint = new THREE.Color(), _white = new THREE.Color(1, 1, 1);\n"
    "const _moonRight = new THREE.Vector3();\n"
    "const SKY_FOG_BLEND = { clear: 0.06, cloudy: 0.2, overcast: 0.32, rain: 0.45, fog: 0.85 };\n"
    "function buildSkyParams(light, fogColor, g) {\n"
    "  const w = C.WEATHER[light.weather] ?? C.WEATHER.clear;\n"
    "  const gg = g ?? daylightAt(light.elevationDeg);\n"
    "  const sunDir = sunDirection(light);\n"
    "  _tint.copy(gg.sunColor);\n"
    "  const mx = Math.max(_tint.r, _tint.g, _tint.b, 1e-6);\n"
    "  _tint.multiplyScalar(1 / mx).lerp(_white, 0.5);          // hue only, halved toward white\n"
    "  const nightAmt = Math.min(1, Math.max(0, (-light.elevationDeg - 3) / 11));\n"
    "  const moonDir = sunDir.clone().multiplyScalar(-1);       // anti-solar full moon\n"
    "  _moonRight.set(-sunDir.z, 0, sunDir.x).normalize();\n"
    "  moonDir.addScaledVector(_moonRight, 0.25).normalize();\n"
    "  return {\n"
    "    sunDir,\n"
    "    sunIlluminance: [_tint.r, _tint.g, _tint.b],\n"
    "    altitudeM: light.geo?.altitudeM ?? 0,\n"
    "    weather: light.weather,\n"
    "    nightAmt, moonDir,\n"
    "    weatherDesat: w.desat, weatherDarken: w.darken,\n"
    "    fogColor: fogColor ? fogColor.clone() : new THREE.Color(0xffffff),\n"
    "    fogBlend: SKY_FOG_BLEND[light.weather] ?? 0.06,\n"
    "    sunDiscL: new THREE.Vector3(30, 30, 30),\n"
    "    exposure: C.SKY_EXPOSURE,\n"
    "  };\n"
    "}\n\n"
    "// ---------- sky dome (xOr) ----------")

open(P, 'w').write(s)
print('env.js patched OK')
