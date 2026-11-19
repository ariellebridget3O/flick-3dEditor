#!/usr/bin/env python3
"""r18 L1 — REMOVE the procedural clouds mode (user: 'unusably slow remove').

Keeps: the realistic SKY STYLE (classic|realistic), the 128^3 noise bake (cirrus + layered
atlas need it), the 3 LUTs, the layered path itself, cirrus.
Removes: the uSteps ray-march branch + sampleDensity/lightMarch + march consts, the
steps chain, uPowder uniforms, the mode state (single mode), the clouds budget gate
(its reason-to-exist was the procedural tier), the UI Procedural button, schema mode
emission (procedural scenes collapse to layered), CLOUD_MODES entry.
"""
import re

ED = "/home/z/my-project/flick-3dEditor/editor"


def patch(path, hunks):
    s = open(path).read()
    for old, new, tag in hunks:
        assert old in s, f"MISS [{tag}] in {path}"
        assert s.count(old) == 1, f"NON-UNIQUE [{tag}] in {path}"
        s = s.replace(old, new)
    open(path, "w").write(s)
    print(f"patched {path} ({len(hunks)} hunks)")


# ---------------- clouds.js ----------------
s = open(f"{ED}/js/clouds.js").read()

# 1. header comment
old = """// clouds.js — sky-dome cloud layer (P2). Procedural thin-shell raymarch + layered fallback.
//"""
new = """// clouds.js — sky-dome cloud layer (P2), layered sheets only (r18: the procedural
// thin-shell raymarch was removed — 'unusably slow' per user feedback; the budget
// auto-gate went with it, its reason-to-exist being the procedural tier).
//"""
assert old in s; s = s.replace(old, new)

# 2. march-only constants (each is a single source line)
for const in ["CL_SIGMA_K", "CL_LIGHT_EXTINCT_K", "CL_MS_OCTAVE", "CL_AMB_OCCLUDE_K",
              "CL_VIEW_EXTINCT_K", "CL_ALBEDO", "CL_TMAX_KM", "CL_MARCH_SPAN_KM",
              "CL_AERIAL_K", "CL_DETAIL_FREQ", "CL_DETAIL_STRENGTH",
              "CL_STEPS_MIN", "CL_STEPS_MAX", "CL_STEPS_DEFAULT"]:
    lines = s.split("\n")
    hits = [i for i, ln in enumerate(lines) if ln.startswith(f"const {const} = ")]
    assert len(hits) == 1, f"const strip failed: {const} hits={len(hits)}"
    del lines[hits[0]]
    s = "\n".join(lines)

# 3. GLSL: atmos chunk march-only defines
old = """  #define SHAPE_TILE_KM ${CL_SHAPE_TILE_KM.toFixed(1)}
  #define SIGMA_K ${CL_SIGMA_K.toFixed(4)}
  #define LIGHT_EXTINCT_K ${CL_LIGHT_EXTINCT_K.toFixed(2)}
  #define VIEW_EXTINCT_K ${CL_VIEW_EXTINCT_K.toFixed(2)}
  #define AMB_OCCLUDE_K ${CL_AMB_OCCLUDE_K.toFixed(2)}
  #define MS_OCTAVE ${CL_MS_OCTAVE.toFixed(2)}
  #define ALBEDO ${CL_ALBEDO.toFixed(3)}
  #define DETAIL_FREQ ${CL_DETAIL_FREQ.toFixed(1)}
  #define DETAIL_STRENGTH ${CL_DETAIL_STRENGTH.toFixed(3)}
  #define TMAX_KM ${CL_TMAX_KM.toFixed(1)}
  #define MARCH_SPAN_KM ${CL_MARCH_SPAN_KM.toFixed(1)}
  #define AERIAL_K ${CL_AERIAL_K.toFixed(4)}
  #define CIRRUS_KM ${CL_CIRRUS_KM.toFixed(2)}"""
new = """  #define SHAPE_TILE_KM ${CL_SHAPE_TILE_KM.toFixed(1)}
  #define CIRRUS_KM ${CL_CIRRUS_KM.toFixed(2)}"""
assert old in s; s = s.replace(old, new)

# 4. fragment shader: uniforms + sampleDensity/lightMarch + the march branch + aerial block
old = """  uniform sampler2D uSkyViewLut;         // sky.js sky-view LUT (aerial haze / horizon convergence)
"""
new = ""
assert old in s; s = s.replace(old, new)

old = """  uniform int uSteps;                    // primary march steps (0 = layered path)
  uniform int uSheetCount;               // layered sheets
  uniform float uPowderScale;            // powder term (defaults 1.0 / 4.0)
  uniform float uPowderExponent;"""
new = """  uniform int uSheetCount;               // layered sheets"""
assert old in s; s = s.replace(old, new)

# sampleDensity + lightMarch block (from '// density:' comment to the closing brace of lightMarch)
m = re.search(r"\n  // density: coverage->threshold remap.*?\n  }\n\n  // 2-step secondary sun march.*?\n  }\n", s, re.S)
assert m, "density/lightMarch block not found"
s = s.replace(m.group(0), "\n")

# the march branch: 'if (uSteps > 0) {' ... up to the '} else {' of the layered fallback
m = re.search(r"\n    if \(uSteps > 0\) \{\n.*?\n    \} else \{\n", s, re.S)
assert m, "march branch not found"
s = s.replace(m.group(0), "\n    {\n")

# close the brace we opened (the layered block was the else-arm; now direct)
old = """      distMean = max(distMean, uBaseKm + uHeightKm * 0.5);
    }
"""
new = """      distMean = max(distMean, uBaseKm + uHeightKm * 0.5);
    }
"""
# (structure unchanged — the else-block simply became the only block)

# aerial block
m = re.search(r"\n    // ---- aerial perspective: blend toward the sky-view LUT sample of the same direction ----.*?\n    \}\n", s, re.S)
assert m, "aerial block not found"
s = s.replace(m.group(0), "\n")

# layeredTier comment fix (fallback -> the tier)
old = "// ---- layered fallback: parallax alpha sheets (atlas rows), Lambert + HG-style glint ----"
new = "// ---- layered sheets: parallax alpha sheets (atlas rows), Lambert + HG-style glint ----"
assert old in s; s = s.replace(old, new)

# 5. JS: uniforms table
old = """    uSkyViewLut: { value: null },
"""
new = ""
assert old in s; s = s.replace(old, new)
old = """    uSteps: { value: CL_STEPS_DEFAULT },
"""
new = ""
assert old in s; s = s.replace(old, new)
old = """    uPowderScale: { value: 1.0 },
    uPowderExponent: { value: 4.0 },
"""
new = ""
assert old in s; s = s.replace(old, new)
old = """  uniforms.uSkyViewLut.value = sky.luts.skyView.texture;
"""
new = ""
assert old in s; s = s.replace(old, new)

# 6. JS: setParams — drop steps plumbing
old = """      exposure: p.exposure ?? u.uExposure.value,
      steps: p.steps ?? stepsRequested,
      windSpeed: p.windSpeed ?? null,"""
new = """      exposure: p.exposure ?? u.uExposure.value,
      windSpeed: p.windSpeed ?? null,"""
assert old in s; s = s.replace(old, new)
old = """      next.exposure.toFixed(3), String(next.steps)].join('|');"""
new = """      next.exposure.toFixed(3)].join('|');"""
assert old in s; s = s.replace(old, new)
old = """    stepsRequested = Math.round(Math.min(CL_STEPS_MAX, Math.max(CL_STEPS_MIN, next.steps)));
    u.uSteps.value = mode === 'layered' ? 0 : stepsRequested;
"""
new = ""
assert old in s; s = s.replace(old, new)

# 7. JS: mode state removal
old = """  let enabled = false, staticMode = false, mode = 'procedural';
  let paramKey = '', windClock = null, windSpeed = 0.2 * CL_WIND_UV_PER_UNIT;
  let sheetsKey = '';                                 // r13 audit P2: atlas bakes coverage/density — rebuild on change
  let stepsRequested = CL_STEPS_DEFAULT;
  let geoAltitudeM = 0;"""
new = """  let enabled = false, staticMode = false;
  let paramKey = '', windClock = null, windSpeed = 0.2 * CL_WIND_UV_PER_UNIT;
  let sheetsKey = '';                                 // r13 audit P2: atlas bakes coverage/density — rebuild on change
  let geoAltitudeM = 0;"""
assert old in s; s = s.replace(old, new)

old = """    if (enabled && mode === 'layered' && noiseCPU) {
      const sk = next.coverage.toFixed(4) + '|' + next.density.toFixed(4);
      if (sk !== sheetsKey) { sheetsKey = sk; buildSheets(); }
    }
    return changed;"""
new = """    if (enabled && noiseCPU) {
      const sk = next.coverage.toFixed(4) + '|' + next.density.toFixed(4);
      if (sk !== sheetsKey) { sheetsKey = sk; buildSheets(); }
    }
    return changed;"""
assert old in s; s = s.replace(old, new)

old = """  function setMode(m) {
    mode = m === 'layered' ? 'layered' : 'procedural';
    u_stepsApply();
    if (enabled && mode === 'layered' && noiseCPU) {   // entering layered: atlas must match current params
      const sk = uniforms.uCoverage.value.toFixed(4) + '|' + uniforms.uDensity.value.toFixed(4);
      if (sk !== sheetsKey) { sheetsKey = sk; buildSheets(); }
    }
  }
  function u_stepsApply() {
    uniforms.uSteps.value = mode === 'layered' ? 0 : stepsRequested;
  }

"""
new = ""
assert old in s; s = s.replace(old, new)

old = """  return {
    mesh, twinMesh, setParams, setCamera, update, setEnabled, setMode, setStatic,
    dispose, dumpWeather,
    get mode() { return mode; },
    get enabled() { return enabled; },"""
new = """  return {
    mesh, twinMesh, setParams, setCamera, update, setEnabled, setStatic,
    dispose, dumpWeather,
    get enabled() { return enabled; },"""
assert old in s; s = s.replace(old, new)

open(f"{ED}/js/clouds.js", "w").write(s)
print("patched js/clouds.js")

# ---------------- env.js ----------------
patch(f"{ED}/js/env.js", [
    ("""// ---------- clouds (P2): params from light.clouds + weather coupling (realistic branch only) ----------
const CLOUD_STEPS = 40;                    // procedural primary march (32-48 per design)
""",
     """// ---------- clouds (P2): params from light.clouds + weather coupling (realistic branch only) ----------
""", "CLOUD_STEPS"),
    ("""    windSpeed: cl.windSpeed ?? 0.2,
    steps: CLOUD_STEPS,
""", """    windSpeed: cl.windSpeed ?? 0.2,
""", "steps field"),
    ("""      cloudLayer.setMode(light.clouds?.mode);            // procedural | layered (idempotent)
      if (cloudLayer.setParams(buildCloudParams(light, sp))) {""",
     """      if (cloudLayer.setParams(buildCloudParams(light, sp))) {""", "applyDaylight setMode"),
    ("""      if (l) {                                        // r13 audit P1: push clouds on the style switch too
        const sp = buildSkyParams(l, scene.fog.color);
        realistic.setParams(sp);
        if (wantClouds) { cloudLayer.setMode(l.clouds?.mode); cloudLayer.setParams(buildCloudParams(l, sp)); }
      }""",
     """      if (l) {                                        // r13 audit P1: push clouds on the style switch too
        const sp = buildSkyParams(l, scene.fog.color);
        realistic.setParams(sp);
        if (wantClouds) cloudLayer.setParams(buildCloudParams(l, sp));
      }""", "setSkyStyle setMode"),
    ("""  // P2: after light.clouds mutations (main.js setClouds) — mesh + PMREM twin + renderOrder sync
  function setClouds(light) {
    const want = skyStyle === 'realistic' && light?.clouds?.enabled === true;
    cloudLayer.setEnabled(want);
    realistic.setCloudTwin(want ? cloudLayer.twinMesh : null);
  }
  function setCloudsRuntime(kind) {   // budget-gate tier control: MESH-level only — light.clouds (the schema) keeps the authored intent (r13)
    if (kind === 'off') { cloudLayer.setEnabled(false); realistic.setCloudTwin(null); }
    else if (kind === 'layered') { if (cloudLayer.enabled) cloudLayer.setMode('layered'); }
    else if (kind === 'procedural') { if (cloudLayer.enabled) cloudLayer.setMode('procedural'); }
  }""",
     """  // P2: after light.clouds mutations (main.js setClouds) — mesh + PMREM twin + renderOrder sync
  function setClouds(light) {
    const want = skyStyle === 'realistic' && light?.clouds?.enabled === true;
    cloudLayer.setEnabled(want);
    realistic.setCloudTwin(want ? cloudLayer.twinMesh : null);
  }""", "setCloudsRuntime"),
    ("""    clouds: () => cloudLayer, setClouds, setCloudsRuntime };""",
     """    clouds: () => cloudLayer, setClouds };""", "env exports"),
    ("""      mode: c.mode === 'layered' ? 'layered' : 'procedural',
""", "", "normalizeLight mode"),
])

# ---------------- schema.js ----------------
patch(f"{ED}/js/schema.js", [
    ("""    c.mode = l.clouds.mode === 'layered' ? 'layered' : 'procedural';
""", "", "normLight mode emission"),
])

# ---------------- const.js ----------------
patch(f"{ED}/js/const.js", [
    ("""  CLOUD_MODES: ['procedural', 'layered'],""",
     """  CLOUD_MODES: ['layered'],              // r18: procedural removed (unusably slow)"""),
])

# ---------------- ui.js ----------------
patch(f"{ED}/js/ui.js", [
    ("""        <button data-c="off">Off</button>
        <button data-c="procedural">Procedural</button>
        <button data-c="layered">Layered</button>""",
     """        <button data-c="off">Off</button>
        <button data-c="layered">Layered</button>""", "clouds seg"),
    ("""  const cl = l.clouds ?? { enabled: false, mode: 'procedural', coverage: C.CLOUD_COVERAGE_DEFAULT, density: 1, cirrus: 0.15, altitudeM: 2500, thicknessM: 1200 };
  const cmode = cl.enabled ? (cl.mode === 'layered' ? 'layered' : 'procedural') : 'off';""",
     """  const cl = l.clouds ?? { enabled: false, coverage: C.CLOUD_COVERAGE_DEFAULT, density: 1, cirrus: 0.15, altitudeM: 2500, thicknessM: 1200 };
  const cmode = cl.enabled ? 'layered' : 'off';""", "cmode"),
])

# ---------------- main.js — the budget gate ----------------
s = open(f"{ED}/js/main.js").read()

old = """    this._cloudsGatePending = false;     // P2: clouds budget probe (one-shot per enable)
    this._cloudsGateFrames = 0;
"""
new = ""
assert old in s; s = s.replace(old, new)

old = """      // P2: clouds are a realistic-sky feature — (re)enable through the app's own path + budget probe
      if (v === 'realistic' && this.light.clouds?.enabled) { this._cloudsGatePending = true; this._cloudsGateFrames = 0; }
"""
new = ""
assert old in s; s = s.replace(old, new)

old = """      this.env.setClouds(this.light);
      this.env.applyDaylight(this.light);
      if (this.light.clouds?.enabled && !wasEnabled) { this._cloudsGatePending = true; this._cloudsGateFrames = 0; }
      this.markAutosave?.();"""
new = """      this.env.setClouds(this.light);
      this.env.applyDaylight(this.light);
      this.markAutosave?.();"""
assert old in s; s = s.replace(old, new)

old = """    this._cloudsGateBypassed = new URLSearchParams(location.search).get('cloudsGate') === '0';   // QA: SwiftShader always measures over budget — bypass for captures
"""
new = ""
assert old in s; s = s.replace(old, new)

old = """    if (this.light.clouds?.enabled && this.light.skyStyle === 'realistic') { this._cloudsGatePending = true; this._cloudsGateFrames = 0; }
"""
new = ""
assert old in s; s = s.replace(old, new)

old = """    this._autoMeasure();
    if (this._cloudsGatePending) this._tickCloudsGate();   // P2: one-shot clouds budget probe
    this.drawOverlays();"""
new = """    this._autoMeasure();
    this.drawOverlays();"""
assert old in s; s = s.replace(old, new)

# _tickCloudsGate + _measureCloudsBudget (whole block through the closing brace before drawOverlays)
m = re.search(r"\n  // ================= clouds auto-gate \(P2, finish\.js measureFinish pattern\) =================\n  _tickCloudsGate\(\) \{.*?\n  \}\n\n  drawOverlays\(\)", s, re.S)
assert m, "clouds gate block not found"
s = s.replace(m.group(0), "\n  drawOverlays()")

open(f"{ED}/js/main.js", "w").write(s)
print("patched js/main.js")
print("ALL L1 PATCHES APPLIED")
