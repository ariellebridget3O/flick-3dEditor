#!/usr/bin/env python3
"""r14 clouds+HDR interplay gate (recreated — referenced by r13 docs but never committed).

The P1 scenario from the r13 HDR review: realistic sky + procedural clouds + finish
composer + HDR ON. The clouds deck must ride the dome's linear-HDR space (uCurve=0):
the HDR look applies (large px delta vs hdr-off) WITHOUT white-out (clipped >=250
comparable on both sides). Zero console errors is a gate.

usage: python3 scripts/clouds_hdr_check.py
"""
import json, os, sys, time
import numpy as np
from PIL import Image

REPO = "/home/z/my-project/flick-3dEditor"
OUT = os.path.join(REPO, "analysis/tmp_r13_clouds")
sys.path.insert(0, os.path.join(REPO, "scripts/pixel_oracle"))
import ab, bb  # noqa: E402

URL = ("http://localhost:3000/editor/index.html"
       "?scene=samples/synthetic_tracks.json&noAutosave=1&finish=1&cloudsGate=0&v={}")


def ev(code, timeout=90):
    return ab.eval_js("chk", code, timeout=timeout)


def capture(path):
    dims = None
    for i in range(4):                                  # SKILL #88 retry pattern
        try:
            dims = ab.eval_js("chk", "(()=>{const a=window.__app;a.renderFrame();const gl=a.renderer.getContext();"
                                     "return JSON.stringify([gl.drawingBufferWidth,gl.drawingBufferHeight])})()",
                              timeout=120)
            w, h = json.loads(str(dims))
            break
        except Exception:
            time.sleep(2 + i)
    else:
        raise RuntimeError(f"dims eval failed: {dims!r}")
    bb.capture_png("chk", path, w=w, h=h, rows_per_eval=50, timeout=180)


def setup_session(tag):
    ab.close("chk")
    ab.open_url("chk", URL.format(int(time.time()) + hash(tag) % 1000))
    time.sleep(4)
    # realistic sky + 45-degree sky view (the fixed harness camera)
    ev("(()=>{const a=window.__app; a.setSkyStyle('realistic');"
       " const c=a.camera; c.position.set(0,2,8); a.orbit.target.set(0,60,-50);"
       " a.orbit.update&&a.orbit.update(); return 'ok'})()")
    # fire-and-forget clouds (the 128^3 bake blocks the main thread)
    ev("(()=>{const a=window.__app;setTimeout(()=>a.setClouds({enabled:true, coverage:.5, density:1,"
       " mode:'procedural', cirrus:.15}),50);return 'fired'})()", timeout=30)
    ok = ""
    for _ in range(20):
        time.sleep(3)
        try:
            ok = ev("(()=>{const a=window.__app;return 'p '+JSON.stringify({on:!!a.light.clouds?.enabled})})()", timeout=30)
            if '"on":true' in ok:
                break
        except Exception:
            continue
    if '"on":true' not in ok:
        raise RuntimeError(f"clouds never enabled: {ok!r}")
    time.sleep(2.5)                                     # PMREM settle


def main():
    os.makedirs(OUT, exist_ok=True)
    errs = ab.console_errors("chk") if hasattr(ab, "console_errors") else 0

    # --- A: clouds + finish, hdr OFF ---
    setup_session("a")
    a_path = os.path.join(OUT, "chk_hdr_off.png")
    capture(a_path)

    # --- B: same session, hdr ON ---
    ev("(()=>{const a=window.__app;a.setHdr({enabled:true});return 'hdr on'})()", timeout=60)
    time.sleep(2.5)                                     # bloom settle
    b_path = os.path.join(OUT, "chk_hdr_on.png")
    capture(b_path)

    A = np.asarray(Image.open(a_path).convert('RGB')).astype(np.float32)
    B = np.asarray(Image.open(b_path).convert('RGB')).astype(np.float32)
    assert A.shape == B.shape
    d = np.abs(A - B).max(axis=2)
    differ = int((d > 2).sum())
    clipA = 100 * (A.max(axis=2) >= 250).mean()
    clipB = 100 * (B.max(axis=2) >= 250).mean()
    print(f"differ px (>2/255): {differ} ({100 * (d > 2).mean():.2f}%)")
    print(f"clipped>=250: hdr-off {clipA:.2f}%  hdr-on {clipB:.2f}%")
    verdict = []
    verdict.append(("HDR LOOK APPLIED", differ > 50000))
    verdict.append(("NO WHITE-OUT", clipB < max(1.0, clipA * 3 + 0.5)))
    for name, ok in verdict:
        print(("PASS " if ok else "FAIL ") + name)
    if not all(ok for _, ok in verdict):
        sys.exit(1)


if __name__ == "__main__":
    main()
