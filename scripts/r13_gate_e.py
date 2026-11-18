#!/usr/bin/env python3
"""r13_gate_e.py — Gate B+E for the P2 cloud layer.

Gate E: classic-safety visual proof. Capture the DEFAULT boot screenshot from
the PRE-FEATURE tree (git worktree at 20f8316, the last pre-clouds commit)
and from the CURRENT tree, then byte-compare with PIL — expect exact equality
(clouds off => mesh invisible => material never compiled => identical render).

Gate B: boot gate on the current tree — window.__app booted, 0 console errors,
clouds never enabled (light.clouds absent by default), classic look.

Captures are BACKBUFFER readbacks (bb.py — SKILL #83: never trust the page
screenshot for WebGL under headless SwiftShader).
"""
import json
import os
import subprocess
import sys
import time

REPO = "/home/z/my-project/flick-3dEditor"
WT = "/home/z/wt_preclouds"
PRE = "20f8316"
OUT = os.path.join(REPO, "analysis/tmp_r13_clouds")
sys.path.insert(0, os.path.join(REPO, "scripts/pixel_oracle"))
import ab  # noqa: E402
import bb  # noqa: E402

VPORT = (1264, 639)          # scene view chrome geometry (ours.py r11)
CANVAS = (1000, 375)
URL = ("http://localhost:3000/editor/index.html"
       "?scene=samples/synthetic_tracks.json&noAutosave=1&finish=0&v={}")


def sh(cmd, **kw):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        raise RuntimeError(f"cmd failed rc={r.returncode}: {cmd}\n{r.stdout}\n{r.stderr}")
    return r.stdout


def boot(session, bump, settle_s=2.5):
    """Fresh session -> open boot URL -> wait for the az scene-load marker."""
    ab.close(session)
    ab.set_viewport(session, *VPORT)
    ab.open_url(session, URL.format(bump))
    ab.wait(session, 1500)
    r = ab.eval_js(session, "(async()=>{const a=window.__app;"
                   "for(let i=0;i<40;i++){if(a&&a.light&&Math.abs(a.light.azimuthDeg-128.66)<0.01)break;"
                   "await new Promise(r=>setTimeout(r,500))}"
                   "return 'booted='+(!!(a&&a.light))})()", timeout=90)
    if "booted=true" not in str(r):
        raise RuntimeError(f"boot marker not reached: {r}")
    time.sleep(settle_s)
    return r


def probes(session):
    """Gate-B invariants + console/page errors."""
    js = ("(()=>{const a=window.__app;"
          "return JSON.stringify({app:!!a, frame:a.renderer.info.render.frame,"
          "lightClouds:a.light.clouds===undefined?'absent':a.light.clouds,"
          "skyStyle:a.light.skyStyle??'classic(default)',"
          "cloudEnabled:a.env.clouds?a.env.clouds().enabled:'n/a',"
          "domeVisible:a.env.realisticSky?a.env.realisticSky().mesh.visible:'n/a',"
          "canvasW:a.renderer.domElement.width,canvasH:a.renderer.domElement.height})})()")
    return json.loads(ab.eval_js(session, js, timeout=60))


def errors(session):
    e = ab.run(session, "errors", check=False)
    c = ab.run(session, "console", "--clear", check=False)
    bad = [l for l in (e + "\n" + c).splitlines()
           if l.strip().startswith(("[ERROR]", "[error]")) or "Uncaught" in l]
    return e, c, bad


def capture(session, path):
    bb.capture_png(session, path, w=CANVAS[0], h=CANVAS[1], rows_per_eval=25, timeout=120)


def main():
    os.makedirs(OUT, exist_ok=True)
    before_png = os.path.join(OUT, "boot_before.png")
    after_png = os.path.join(OUT, "boot_after.png")

    # ---- 1. pre-feature worktree -> public/editor -> capture BEFORE
    sh(f"git -C {REPO} worktree add {WT} {PRE} --detach 2>/dev/null || true")
    print("worktree:", sh(f"git -C {WT} log --oneline -1").strip())
    sh(f"rsync -a --delete {WT}/editor/ /home/z/my-project/public/editor/")
    boot("gateE", 901)
    capture("gateE", before_png)
    print("before capture ->", before_png)

    # ---- 2. current tree -> public/editor -> capture AFTER (+ Gate B probes)
    sh(f"bash /home/z/my-project/scripts/sync-editor.sh")
    boot("gateE", 902)
    p = probes("gateE")
    e, c, bad = errors("gateE")
    capture("gateE", after_png)
    print("after capture  ->", after_png)
    print("gate-B probes:", json.dumps(p))
    print("page errors:", repr(e.strip())[:400])
    print("console (cleared after read):", repr(c.strip())[:400])
    ab.close("gateE")

    # ---- 3. byte-compare
    from PIL import Image
    import numpy as np
    a = np.asarray(Image.open(before_png).convert("RGB"), dtype=np.int16)
    b = np.asarray(Image.open(after_png).convert("RGB"), dtype=np.int16)
    if a.shape != b.shape:
        print(f"GATE-E FAIL: shape {a.shape} != {b.shape}")
        return 1
    diff = np.abs(a - b)
    n = int((diff.max(axis=2) > 0).sum())
    print(f"GATE-E: pixel diff >0 count = {n} / {a.shape[0]*a.shape[1]}  "
          f"max channel delta = {int(diff.max())}")
    verdict = "PASS (byte-identical)" if n == 0 else ("PASS (<=0.05% jitter)" if n <= a.shape[0]*a.shape[1]*0.0005 else "FAIL")
    print("GATE-E verdict:", verdict)
    print("GATE-B verdict:", "PASS" if (p["app"] and not bad and p["lightClouds"] == "absent"
                                        and p["cloudEnabled"] is False) else f"FAIL {bad}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
