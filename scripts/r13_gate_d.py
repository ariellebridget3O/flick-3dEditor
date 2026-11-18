#!/usr/bin/env python3
"""r13_gate_d.py — Gate D: clouds-ON E2E through the app's own setter path.

Headless-SwiftShader plan (the procedural tier is ~1000x real-GPU cost here):
  small drawing buffer (canvas 400x245) + camera pitched UP so sky+clouds fill
  the view; capture each tier BEFORE the 30-frame gate fires, then let the
  auto-gate chain settle (procedural > budget -> fallback layered -> re-probe
  -> off) and read the [clouds] console.info decisions.

Evidence produced:
  realistic_no_clouds.png   baseline (same session, same camera, same weather)
  clouds_on_procedural.png  procedural tier pre-gate (pixel-probe target)
  clouds_on_layered.png     layered tier pre-gate (fallback look)
  clouds_on_final.png       post-gate settled state (auto-gate decision applied)
  gate log: [clouds] console.info measurement lines + PIL upper-third probe
"""
import json
import os
import sys
import time

REPO = "/home/z/my-project/flick-3dEditor"
OUT = os.path.join(REPO, "analysis/tmp_r13_clouds")
sys.path.insert(0, os.path.join(REPO, "scripts/pixel_oracle"))
import ab  # noqa: E402
import bb  # noqa: E402

VPORT = (664, 509)          # chrome 264 right + 88 top + 176 bottom -> canvas 400x245
W, H = 400, 245
URL = ("http://localhost:3000/editor/index.html"
       "?scene=samples/synthetic_tracks.json&noAutosave=1&finish=0&v={}")
S = "gateD"


def eval_js(code, timeout=90):
    return ab.eval_js(S, code, timeout=timeout)


def capture(path, rows=50):
    bb.capture_png(S, path, w=W, h=H, rows_per_eval=rows, timeout=180)


def poll(js, want, timeout_s=60, gap=0.6, timeout_eval=90):
    t0 = time.time()
    last = None
    while time.time() - t0 < timeout_s:
        last = str(eval_js(js, timeout=timeout_eval))
        if want in last:
            return last
        time.sleep(gap)
    raise RuntimeError(f"poll timeout ({timeout_s}s): want {want!r}, last {last!r}")


def main():
    os.makedirs(OUT, exist_ok=True)
    ab.close(S)
    ab.set_viewport(S, *VPORT)
    ab.open_url(S, URL.format(907))
    ab.wait(S, 1500)
    poll("(window.__app&&window.__app.light)?'marker':'no'", "marker", 60)
    time.sleep(2.0)
    dim = json.loads(eval_js("JSON.stringify({w:window.__app.renderer.domElement.width,"
                             "h:window.__app.renderer.domElement.height})"))
    assert (dim["w"], dim["h"]) == (W, H), f"canvas {dim} != {(W, H)}"
    print(f"canvas = {dim['w']}x{dim['h']}")

    # pitch the editor camera up (default view barely shows the horizon: the
    # sky occupies only the top row) — same camera for baseline + cloud captures
    print("camera ->", eval_js("(()=>{const a=window.__app;"
                               "a.orbit.target.set(0,500,0);"
                               "a.camera.position.set(0,2,60);a.orbit.update();"
                               "return 'up-pitch set'})()"))
    time.sleep(0.5)

    # -- baseline: realistic sky, CLOUDY weather, no clouds (same session/camera/weather)
    print("setSkyStyle ->", eval_js("(()=>{const a=window.__app;a.setSkyStyle('realistic');"
                                    "a.setWeather('cloudy');"
                                    "return 'style='+(a.light.skyStyle??'')+'/'+a.light.weather})()"))
    poll("(()=>{const a=window.__app;return a.env.realisticSky().mesh.visible?'true':'false'})()",
         "true", 30)
    poll("(()=>{const a=window.__app;return a.env.realisticSky()._debug.lutDirty?'dirty':'baked'})()",
         "baked", 60, 1.0)
    time.sleep(1.0)
    baseline = os.path.join(OUT, "realistic_no_clouds.png")
    capture(baseline)
    print("baseline ->", baseline)

    # -- enable PROCEDURAL clouds through the app mutator path
    ab.run(S, "console", "--clear", check=False)
    r = eval_js("(()=>{const a=window.__app;"
                "a.setClouds({enabled:true,mode:'procedural',coverage:1.0,density:1,"
                "cirrus:0.15,altitudeM:2500,thicknessM:1200,windSpeed:0.2});"
                "return JSON.stringify({style:a.light.skyStyle,weather:a.light.weather,"
                "clouds:a.light.clouds})})()")
    print("setClouds(procedural) ->", r)
    poll("(()=>{const a=window.__app;return a.env.clouds()._debug.uniforms.uShapeTex.value?'baked':'none'})()",
         "baked", 60, 0.3)
    time.sleep(0.5)                      # one render frame past the bake
    proc = os.path.join(OUT, "clouds_on_procedural.png")
    capture(proc)                        # ~5 frames driven; gate fires at frame 30
    print("procedural capture ->", proc)
    print("state:", eval_js("JSON.stringify({gatePending:window.__app._cloudsGatePending,"
                            "frames:window.__app._cloudsGateFrames,"
                            "mode:window.__app.light.clouds.mode})"))

    # -- let the one-shot auto-gate chain settle (procedural decision -> fallback
    #    re-probe -> layered decision). Both console.info lines are evidence.
    try:
        poll("(()=>{const a=window.__app;return a._cloudsGatePending?'pending':'done'})()",
             "done", 480, 3.0, timeout_eval=240)
        time.sleep(1.0)
    except RuntimeError as e:
        print("gate wait:", e)
    console = ab.run(S, "console", check=False)
    lines = [l.strip() for l in console.splitlines() if "[clouds]" in l]
    print("auto-gate console.info lines:")
    for l in lines:
        print("  ", l)
    settled = os.path.join(OUT, "clouds_on_final.png")
    capture(settled)
    print("post-gate capture ->", settled)
    print("settled state:", eval_js("JSON.stringify({clouds:window.__app.light.clouds,"
                                    "mode:window.__app.env.clouds().mode,"
                                    "enabled:window.__app.env.clouds().enabled,"
                                    "gatePending:window.__app._cloudsGatePending})"))

    # -- capture the LAYERED look: re-enable (re-arms the gate), capture pre-gate
    ab.run(S, "console", "--clear", check=False)
    eval_js("(()=>{const a=window.__app;a.setClouds({enabled:true,mode:'layered'});"
            "return 'mode='+(a.light.clouds.mode??'')})()")
    time.sleep(0.5)
    lay = os.path.join(OUT, "clouds_on_layered.png")
    capture(lay)
    print("layered capture ->", lay)
    layconsole = ab.run(S, "console", check=False)
    laylines = [l.strip() for l in layconsole.splitlines() if "[clouds]" in l]
    if laylines:
        print("layered re-probe lines:")
        for l in laylines:
            print("  ", l)
    e = ab.run(S, "errors", check=False)
    print("page errors after full run:", repr(e.strip())[:300])
    ab.close(S)

    # -- PIL pixel probe: upper third vs baseline
    from PIL import Image
    import numpy as np
    base = np.asarray(Image.open(baseline).convert("RGB"), dtype=np.int16)
    third = H // 3
    report = {}
    for name, p in (("procedural", proc), ("layered", lay), ("post_gate", settled)):
        img = np.asarray(Image.open(p).convert("RGB"), dtype=np.int16)
        d = np.abs(img[:third] - base[:third]).max(axis=2)
        report[name] = {
            "changed_px(d>8)": int((d > 8).sum()),
            "changed_px(d>2)": int((d > 2).sum()),
            "total_px": third * W,
            "mean_delta": round(float(np.abs(img[:third] - base[:third]).mean()), 3),
            "max_delta": int(d.max()),
        }
    print("UPPER-THIRD PIXEL PROBE (vs cloudy realistic-no-clouds baseline):")
    for k, v in report.items():
        print("  ", k, json.dumps(v))
    ok = report["procedural"]["changed_px(d>8)"] > 1000
    print("GATE-D verdict:", "PASS (clouds visibly render)" if ok else "FAIL")
    return 0


if __name__ == "__main__":
    sys.exit(main())
