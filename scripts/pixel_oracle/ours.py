#!/usr/bin/env python3
"""ours.py — our-side capture (http://localhost:3000/editor/index.html).

Verified mechanics:
  * FRESH agent-browser session per case — reload does NOT bust the
    ES-module cache, a new session gets a new JS context.
  * URL: ?scene=samples/<FIXTURE>.json&noAutosave=1&finish=0|1&v=<bump>
    (finish=1 drives the finish composer: manual source pref).
  * viewport 1264x639 → canvas exactly (0,88,1000,375) [scene view];
    viewport 1069x716 → canvas exactly (0,88,805,452) [cameras lens view,
    verified live: W = 805+264, H = 88+452+176]. Rects are read at runtime
    and asserted, not trusted.
  * scene-load marker: window.__app.light.azimuthDeg reaches the fixture's
    azimuth; then ~2s more for rigs/GLBs.
  * seek via a.page.seek(t) (+800ms), readback a.page.playheadS.
  * cameras view: the lens needs the camera SELECTED (a.objects.select) AND
    stageView='cameras' — driven by clicking the real #viewSwitch radio so
    updateFrameGuide adopts the lens fov (plain store writes skip it).
"""
import time

from PIL import Image

import ab

OURS_BASE = "http://localhost:3000/editor/index.html"
# verified geometry (r11): scene-view chrome = 264px right + 88 top + 176 bottom
SCENE_VIEWPORT = (1264, 639)     # → canvas (0,88,1000,375)
CAMERAS_VIEWPORT = (1069, 716)   # → canvas (0,88,805,452)
SCENE_CANVAS = (0, 88, 1000, 375)
CAMERAS_CANVAS = (0, 88, 805, 452)


class OursError(RuntimeError):
    pass


class OursSession:
    def __init__(self, session, base=OURS_BASE):
        self.session = session
        self.base = base

    # ------------------------------------------------------------- helpers
    def _eval(self, code, timeout=90):
        return ab.eval_js(self.session, code, timeout=timeout)

    def canvas_rect(self):
        r = self._eval("(() => {const c=document.querySelector('canvas');if(!c)return 'none';"
                       "const r=c.getBoundingClientRect();"
                       "return Math.round(r.x)+','+Math.round(r.y)+','+Math.round(r.width)+','+Math.round(r.height)})()")
        try:
            x, y, w, h = (int(v) for v in str(r).split(","))
            return x, y, w, h
        except Exception:
            raise OursError(f"canvas rect read failed: {r}")

    # -------------------------------------------------------------- capture
    def capture(self, fixture, t, out_path, finish=False, cameras=False,
                camera_id=None, expected_az=128.66, bump=None, wait_rigs_s=2.0):
        """Open the editor with a fixture, seek to t, screenshot the canvas.

        fixture: path relative to editor/ (e.g. 'samples/live_oracle_r11_base.json')
        cameras: lens view — camera_id must be given (selected + radio click)
        expected_az: scene-load marker (the fixture's light azimuthDeg)
        """
        bump = bump or int(time.time())
        viewport = CAMERAS_VIEWPORT if cameras else SCENE_VIEWPORT
        want = CAMERAS_CANVAS if cameras else SCENE_CANVAS
        ab.set_viewport(self.session, *viewport)
        url = (f"{self.base}?scene={fixture}&noAutosave=1"
               f"&finish={'1' if finish else '0'}&v={bump}")
        ab.open_url(self.session, url)
        ab.wait(self.session, 1500)
        # --- scene-load marker: light azimuth reaches the fixture value
        r = self._eval(
            "(async()=>{const a=window.__app;for(let i=0;i<30;i++){"
            f"if(a&&a.light&&Math.abs(a.light.azimuthDeg-{expected_az})<0.01)break;"
            "await new Promise(r=>setTimeout(r,500))}"
            "return 'az='+(a&&a.light?a.light.azimuthDeg:'NOAPP')})()", timeout=60)
        try:
            got_az = float(str(r).split("=", 1)[1])
        except (IndexError, ValueError):
            raise OursError(f"scene-load marker not reached: {r} (want az={expected_az})")
        if abs(got_az - expected_az) > 0.01:
            raise OursError(f"scene-load marker not reached: az={got_az} (want {expected_az})")
        time.sleep(wait_rigs_s)  # rigs / GLBs settle past the marker
        # --- seek
        r = self._eval(
            f"(async()=>{{const a=window.__app;await a.page.seek({t});"
            "await new Promise(r=>setTimeout(r,800));"
            "return 'ok playhead='+a.page.playheadS+' restEval='+a._restEval})()")
        if not str(r).startswith("ok"):
            raise OursError(f"seek failed: {r}")
        # --- cameras (lens): select the camera, then click the REAL radio
        # (updateFrameGuide — lens fov adoption — rides the UI handler)
        if cameras:
            if not camera_id:
                raise OursError("cameras=True needs camera_id")
            r = self._eval(
                f"(()=>{{const a=window.__app;a.objects.select(['{camera_id}']);"
                "const b=document.querySelector('#viewSwitch button[data-v=cameras]');"
                "if(!b)return 'no radio';b.click();"
                "return 'lens on stageView='+a.page.stageView})()")
            if "lens on" not in str(r):
                raise OursError(f"cameras view failed: {r}")
            time.sleep(1.5)
        time.sleep(1.2)
        # --- canvas rect assert + screenshot + crop
        x, y, w, h = self.canvas_rect()
        if (x, y, w, h) != want:
            raise OursError(f"canvas rect {(x, y, w, h)} != expected {want} "
                            f"(viewport {viewport})")
        full = str(out_path).replace(".png", "_full.png")
        ab.screenshot(self.session, full)
        Image.open(full).convert("RGB").crop((x, y, x + w, y + h)).save(out_path)
        return out_path

    def close(self):
        return ab.close(self.session)
