#!/usr/bin/env python3
"""r13 clouds tuning captures — backbuffer QA (SKILL #83: page screenshots are stale
under SwiftShader; all cloud QA via readPixels). Safe-workspace edition.
Usage: python3 scripts/r13_clouds_tune.py "name=json-params" [...]
  e.g. python3 scripts/r13_clouds_tune.py base={} hi_cov={"coverage":0.75}
"""
import json, os, sys, time

REPO = "/home/z/my-project/flick-3dEditor"
OUT = "/home/z/my-project/flick-3dEditor/analysis/tmp_r13_clouds"
sys.path.insert(0, os.path.join(REPO, "scripts/pixel_oracle"))
import ab, bb  # noqa: E402

W, H = 480, 300
URL = ("http://localhost:3000/editor/index.html"
       "?scene=samples/synthetic_tracks.json&noAutosave=1&finish=0&cloudsGate=0&v={}")

VARIANTS = {
    "base":   {},
    "cov75":  {"coverage": 0.75},
    "dens2":  {"density": 2.0},
    "overcast": {"coverage": 0.85},
    "hi_alt": {"altitudeM": 4200},
    "cirrus_full": {"cirrus": 0.8},
    "layered": {"mode": "layered", "coverage": 0.6},
}


def ev(sess, code, timeout=120):
    return ab.eval_js(sess, code, timeout=timeout)


def capture(sess, path, retries=4):
    dims = None
    for i in range(retries):   # SKILL #88: evals silently fail under SwiftShader GPU load
        try:
            dims = ab.eval_js(sess, "(()=>{const a=window.__app;a.renderFrame();const gl=a.renderer.getContext();return JSON.stringify([gl.drawingBufferWidth,gl.drawingBufferHeight])})()", timeout=120)
            w, h = json.loads(str(dims))
            break
        except Exception:
            time.sleep(2 + i)
    else:
        raise RuntimeError(f"dims eval failed {retries}x: {dims!r}")
    bb.capture_png(sess, path, w=w, h=h, rows_per_eval=50, timeout=180)


def main():
    os.makedirs(OUT, exist_ok=True)
    ab.close("tune")
    ab.open_url("tune", URL.format(int(time.time())))
    time.sleep(4)
    # aim the camera at the sky (up-tilt) so the upper half is dome+clouds
    ev("tune", "(()=>{const a=window.__app; a.setSkyStyle('realistic');"
               " a.orbit&&a.orbit.setPolarAngle?null:null;"
               " const c=a.camera; c.position.set(0,2,8); a.orbit.target.set(0,60,-50);"
               " if(a.orbit) { a.orbit.update&&a.orbit.update(); }"
               " return 'ok'})()", timeout=90)
    only = sys.argv[1:] or list(VARIANTS.keys())
    for arg in only:
        if arg in VARIANTS:
            name = arg
            params = VARIANTS[arg]
        elif '=' in arg:                      # "label={\"json\":...}" — override/extend a variant
            name, _, payload = arg.partition('=')
            params = dict(VARIANTS.get(name, {}))
            params.update(json.loads(payload) if payload else {})
        else:
            name = arg
            params = json.loads(arg)
        for attempt in (1, 2):
            try:
                ab.close("tune")
                ab.open_url("tune", URL.format(int(time.time()) + attempt))
                time.sleep(4)
                ev("tune", "(()=>{const a=window.__app; a.setSkyStyle('realistic');"
                           " const c=a.camera; c.position.set(0,2,8); a.orbit.target.set(0,60,-50);"
                           " if(a.orbit) { a.orbit.update&&a.orbit.update(); }"
                           " return 'ok'})()", timeout=90)
                ev("tune", "(()=>{const a=window.__app;setTimeout(()=>a.setClouds(Object.assign({enabled:true, coverage:.5, density:1,"
                           " mode:'procedural', cirrus:.15}, " + json.dumps(params) + ")),50);return 'fired'})()", timeout=30)
                ok = ''
                for _ in range(20):          # the 128^3 bake blocks the main thread — poll for return
                    time.sleep(3)
                    try:
                        ok = ev("tune", "(()=>{const a=window.__app;return 'p '+JSON.stringify({on:!!a.light.clouds?.enabled})})()", timeout=30)
                        if '"on":true' in ok: break
                    except Exception:
                        continue
                if '"on":true' not in ok:
                    raise RuntimeError(f"clouds never enabled: {ok!r}")
                time.sleep(2.5)  # PMREM settle
                out = os.path.join(OUT, f"tune_{name}.png")
                capture("tune", out)
                print("captured", out)
                break
            except Exception as e:  # noqa: BLE001 — transport flaky under SwiftShader; retry once
                print(f"[{name}] attempt {attempt} failed: {type(e).__name__}: {str(e)[:120]}")
                if attempt == 2:
                    raise


if __name__ == "__main__":
    main()
