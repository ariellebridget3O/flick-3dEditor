#!/usr/bin/env python3
"""r13_cloud_probe.py — diagnostics: WHY do captures with clouds enabled look
byte-identical to clouds-off? Isolate (1) weather-look pollution in the baseline,
(2) 128^3 bake content (noiseCPU), (3) shader-program compile errors (full console),
(4) uniforms at render time, (5) dome-hidden capture (cloud pixels alone)."""
import json
import os
import sys
import time

REPO = "/home/z/my-project/flick-3dEditor"
OUT = os.path.join(REPO, "analysis/tmp_r13_clouds")
sys.path.insert(0, os.path.join(REPO, "scripts/pixel_oracle"))
import ab  # noqa: E402
import bb  # noqa: E402

VPORT = (664, 509)
W, H = 400, 245
URL = ("http://localhost:3000/editor/index.html"
       "?scene=samples/synthetic_tracks.json&noAutosave=1&finish=0&v={}")
S = "probe"


def ev(code, timeout=90):
    return ab.eval_js(S, code, timeout=timeout)


def capture(path):
    bb.capture_png(S, path, w=W, h=H, rows_per_eval=50, timeout=180)


def poll(js, want, timeout_s=60, gap=0.4):
    t0 = time.time()
    last = None
    while time.time() - t0 < timeout_s:
        last = str(ev(js, timeout=60))
        if want in last:
            return last
        time.sleep(gap)
    raise RuntimeError(f"poll timeout: want {want!r}, last {last!r}")


def main():
    ab.close(S)
    ab.set_viewport(S, *VPORT)
    ab.open_url(S, URL.format(905))
    ab.wait(S, 1500)
    poll("(window.__app&&window.__app.light)?'marker':'no'", "marker", 60)
    time.sleep(2.0)
    ev("window.__app.setSkyStyle('realistic')")
    poll("(()=>{const a=window.__app;return a.env.realisticSky()._debug.lutDirty?'d':'b'})()",
         "b", 60, 1.0)
    # 1. weather FIRST, then baseline (isolates clouds from the weather look)
    ev("window.__app.setWeather('cloudy')")
    time.sleep(1.5)
    poll("(()=>{const a=window.__app;return a.env.realisticSky()._debug.lutDirty?'d':'b'})()",
         "b", 60, 1.0)
    time.sleep(0.5)
    base2 = os.path.join(OUT, "probe_cloudy_no_clouds.png")
    capture(base2)
    print("cloudy baseline ->", base2)

    # 2. enable clouds
    ev("window.__app.setClouds({enabled:true,mode:'procedural',coverage:1.0,density:1,"
       "cirrus:0.15,altitudeM:2500,thicknessM:1200,windSpeed:0.2})")
    poll("(()=>{const a=window.__app;return a.env.clouds()._debug.uniforms.uShapeTex.value?'b':'n'})()",
         "b", 60)
    time.sleep(0.5)
    dbg = json.loads(ev("""JSON.stringify((()=>{
      const a=window.__app, c=a.env.clouds(), u=c._debug.uniforms, n=c._debug.noiseCPU;
      let nz=0, mx=0;
      if(n) for(let i=0;i<n.length;i+=997){ if(n[i]>0) nz++; if(n[i]>mx) mx=n[i]; }
      const progs=(a.renderer.info.programs||[]).map(p=>({name:p.name, dbg:p.diagnostics!==undefined&&Object.keys(p.diagnostics).length?p.diagnostics.fragmentShader??p.diagnostics.vertexShader:'ok'}));
      return {uniforms:{steps:u.uSteps.value, cov:u.uCoverage.value, den:u.uDensity.value,
        base:u.uBaseKm.value, height:u.uHeightKm.value, camKm:a.env.realisticSky().sharedUniforms.uCameraPosKm.value.toArray().map(v=>+v.toFixed(3)),
        sun:a.env.realisticSky().sharedUniforms.uSunDir.value.toArray().map(v=>+v.toFixed(3)),
        outSRGB:u.uOutputSRGB.value, tone:u.uToneMap.value},
        meshVisible:c.mesh.visible, enabled:c.enabled, mode:c.mode,
        noiseBytes:n?n.length:0, noiseNonZeroSample:nz, noiseMaxSample:mx,
        nPrograms:progs.length,
        progNames:progs.map(p=>p.name),
        progErrors:progs.filter(p=>p.dbg!=='ok').map(p=>({name:p.name, dbg:String(p.dbg).slice(0,600)}))};
    })())""", timeout=90))
    print("debug:", json.dumps(dbg, indent=1)[:2200])
    onp = os.path.join(OUT, "probe_clouds_on.png")
    capture(onp)
    print("clouds-on capture ->", onp)

    # 3. dome-hidden capture: whatever is NOT black now is the cloud layer itself
    ev("(()=>{const a=window.__app;a.env.realisticSky().mesh.visible=false;"
       "return 'dome hidden'})()")
    time.sleep(0.3)
    domeoff = os.path.join(OUT, "probe_dome_hidden.png")
    capture(domeoff)
    ev("(()=>{const a=window.__app;a.env.realisticSky().mesh.visible=true;"
       "return 'dome back'})()")
    print("dome-hidden capture ->", domeoff)

    # 4. full console dump (three logs shader errors via console.error)
    console = ab.run(S, "console", check=False)
    print("=== FULL CONSOLE (tail 3000) ===")
    print(console[-3000:])
    errs = ab.run(S, "errors", check=False)
    print("=== PAGE ERRORS ===")
    print(errs.strip()[:1500])
    ab.close(S)

    # 5. pixel math
    from PIL import Image
    import numpy as np
    b = np.asarray(Image.open(base2).convert("RGB"), dtype=np.int16)
    o = np.asarray(Image.open(onp).convert("RGB"), dtype=np.int16)
    d = np.asarray(Image.open(domeoff).convert("RGB"), dtype=np.int16)
    for name, img in (("clouds_on", o), ("dome_hidden", d)):
        diff = np.abs(img - b).max(axis=2)
        print(name, "vs cloudy-no-clouds:", {"changed_d8": int((diff > 8).sum()),
              "changed_d2": int((diff > 2).sum()), "max": int(diff.max()),
              "mean": round(float(np.abs(img - b).mean()), 3)})
    print("dome_hidden nonblack px:", int((d.max(axis=2) > 4).sum()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
