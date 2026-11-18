#!/usr/bin/env python3
# r13 clouds fix batch: audit P1 (stale params on style switch), P2 (layered sliders),
# gate-mutates-schema (runtime-only downgrade + ?cloudsGate=0 QA bypass), P4 (classic-UI hint)
import re

def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for i, (old, new) in enumerate(pairs):
        assert old in s, f"{path} #{i}: old not found: {old[:100]!r}"
        assert s.count(old) == 1, f"{path} #{i}: not unique ({s.count(old)}x): {old[:100]!r}"
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8').write(s)
    print(f"OK {path}: {len(pairs)} patches")

# ---------- env.js ----------
patch('editor/js/env.js', [
    # P1a: memo key must include skyStyle (classic->realistic switch must re-push params)
    ("    const key = light.azimuthDeg + '|' + light.elevationDeg + '|' + light.weather + '|' + indoor + '|' + (light.ambientLevel ?? '') + '|' + (light.geo?.altitudeM ?? 0)\n      + '|c' + (light.clouds?.enabled ? [light.clouds.mode, light.clouds.coverage, light.clouds.density, light.clouds.altitudeM, light.clouds.thicknessM, light.clouds.cirrus, light.clouds.windSpeed].join(',') : 'off');",
     "    const key = light.azimuthDeg + '|' + light.elevationDeg + '|' + light.weather + '|' + indoor + '|' + (light.ambientLevel ?? '') + '|' + (light.geo?.altitudeM ?? 0) + '|s' + skyStyle\n      + '|c' + (light.clouds?.enabled ? [light.clouds.mode, light.clouds.coverage, light.clouds.density, light.clouds.altitudeM, light.clouds.thicknessM, light.clouds.cirrus, light.clouds.windSpeed].join(',') : 'off');   // r13 audit P1: skyStyle in the key"),
    # P1b: setSkyStyle pushes cloud params + mode too (single sp bundle)
    ("""    if (skyStyle === 'realistic') {
      const l = light ?? _lastLight;
      if (l) realistic.setParams(buildSkyParams(l, scene.fog.color));
    }
  }""",
     """    if (skyStyle === 'realistic') {
      const l = light ?? _lastLight;
      if (l) {                                        // r13 audit P1: push clouds on the style switch too
        const sp = buildSkyParams(l, scene.fog.color);
        realistic.setParams(sp);
        if (wantClouds) { cloudLayer.setMode(l.clouds?.mode); cloudLayer.setParams(buildCloudParams(l, sp)); }
      }
    }
  }"""),
    # runtime-only tier control for the budget gate (schema state untouched)
    ("""  function updateRealisticSky(camera, outputSRGB) {""",
     """  function setCloudsRuntime(kind) {   // budget-gate tier control: MESH-level only — light.clouds (the schema) keeps the authored intent (r13)
    if (kind === 'off') { cloudLayer.setEnabled(false); realistic.setCloudTwin(null); }
    else if (kind === 'layered') { if (cloudLayer.enabled) cloudLayer.setMode('layered'); }
    else if (kind === 'procedural') { if (cloudLayer.enabled) cloudLayer.setMode('procedural'); }
  }
  function updateRealisticSky(camera, outputSRGB) {"""),
    ("    clouds: () => cloudLayer, setClouds };",
     "    clouds: () => cloudLayer, setClouds, setCloudsRuntime };"),
])

# ---------- main.js ----------
patch('editor/js/main.js', [
    # gate: runtime-only downgrade (no schema mutation) + ?cloudsGate=0 QA bypass
    ("""    if (mode === 'procedural') {
      console.info(`[clouds] procedural cost ${costMs.toFixed(2)} ms (norm ${norm.toFixed(2)} ms @1080p) exceeds the ${C.CLOUD_BUDGET_MS} ms budget — auto-fallback to layered`);
      this.setClouds({ mode: 'layered' });
      this._cloudsGatePending = true; this._cloudsGateFrames = 0;   // re-probe the fallback tier
    } else {
      console.info(`[clouds] layered cost ${costMs.toFixed(2)} ms (norm ${norm.toFixed(2)} ms @1080p) still exceeds the ${C.CLOUD_BUDGET_MS} ms budget — clouds disabled`);
      this.setClouds({ enabled: false });
    }
  }""",
     """    const tier = this.env.clouds()?.mode ?? mode;   // runtime tier (may already be downgraded)
    if (tier !== 'layered') {
      console.info(`[clouds] procedural cost ${costMs.toFixed(2)} ms (norm ${norm.toFixed(2)} ms @1080p) exceeds the ${C.CLOUD_BUDGET_MS} ms budget — auto-fallback to layered (runtime)`);
      this.env.setCloudsRuntime('layered');           // MESH-level only: light.clouds keeps the authored mode (no autosave)
      this._cloudsGatePending = true; this._cloudsGateFrames = 0;   // re-probe the fallback tier
    } else {
      console.info(`[clouds] layered cost ${costMs.toFixed(2)} ms (norm ${norm.toFixed(2)} ms @1080p) still exceeds the ${C.CLOUD_BUDGET_MS} ms budget — clouds disabled (runtime; scene state unchanged)`);
      this.env.setCloudsRuntime('off');
    }
  }"""),
    # the probe measures the RUNTIME tier, and ?cloudsGate=0 bypasses entirely (QA/E2E path)
    ("""    const cloud = this.env.clouds?.();
    if (!cloud || !this.light.clouds?.enabled || !cloud.enabled) return;""",
     """    if (this._cloudsGateBypassed) return;            // ?cloudsGate=0 — QA/pixel-oracle path (SwiftShader always over budget)
    const cloud = this.env.clouds?.();
    if (!cloud || !this.light.clouds?.enabled || !cloud.enabled) return;"""),
    ("    const mode = this.light.clouds.mode ?? 'procedural';",
     "    const mode = this.env.clouds()?.mode ?? this.light.clouds.mode ?? 'procedural';   // runtime tier"),
    # arm the bypass flag in the constructor (near finishPref URL handling)
    ("    this.setIndoor = indoor => { this.light = { ...this.light, indoor: !!indoor }; this.shadowFit.force(); this.env.applyDaylight(this.light); this.markAutosave?.(); };",
     "    this._cloudsGateBypassed = new URLSearchParams(location.search).get('cloudsGate') === '0';   // QA: SwiftShader always measures over budget — bypass for captures\n    this.setIndoor = indoor => { this.light = { ...this.light, indoor: !!indoor }; this.shadowFit.force(); this.env.applyDaylight(this.light); this.markAutosave?.(); };"),
])

# ---------- clouds.js: P2 layered sliders (rebuild the sheet atlas when coverage/density change) ----------
patch('editor/js/clouds.js', [
    ("""  // ---- state ----
  let enabled = false, staticMode = false, mode = 'procedural';
  let paramKey = '', windClock = null, windSpeed = 0.2 * CL_WIND_UV_PER_UNIT;""",
     """  // ---- state ----
  let enabled = false, staticMode = false, mode = 'procedural';
  let paramKey = '', windClock = null, windSpeed = 0.2 * CL_WIND_UV_PER_UNIT;
  let sheetsKey = '';                                 // r13 audit P2: atlas bakes coverage/density — rebuild on change"""),
    ("""    if (p.fogColor) u.uFogColor.value.copy(p.fogColor);
    if (p.moonDir) u.uMoonDir.value.copy(p.moonDir);
    return changed;
  }""",
     """    if (p.fogColor) u.uFogColor.value.copy(p.fogColor);
    if (p.moonDir) u.uMoonDir.value.copy(p.moonDir);
    // r13 audit P2: the layered atlas bakes coverage/density at build time — rebuild when they
    // change in layered mode (CPU-side 256xN, ~2-5 ms; the sliders stay live)
    if (enabled && mode === 'layered' && noiseCPU) {
      const sk = next.coverage.toFixed(4) + '|' + next.density.toFixed(4);
      if (sk !== sheetsKey) { sheetsKey = sk; buildSheets(); }
    }
    return changed;
  }"""),
    # setMode entering layered must also refresh the atlas for current params
    ("""  function setMode(m) {
    mode = m === 'layered' ? 'layered' : 'procedural';
    u_stepsApply();
  }""",
     """  function setMode(m) {
    mode = m === 'layered' ? 'layered' : 'procedural';
    u_stepsApply();
    if (enabled && mode === 'layered' && noiseCPU) {   // entering layered: atlas must match current params
      const sk = uniforms.uCoverage.value.toFixed(4) + '|' + uniforms.uDensity.value.toFixed(4);
      if (sk !== sheetsKey) { sheetsKey = sk; buildSheets(); }
    }
  }"""),
])
print("ALL PATCHES APPLIED")
