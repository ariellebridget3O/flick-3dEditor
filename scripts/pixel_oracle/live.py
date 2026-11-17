#!/usr/bin/env python3
"""live.py — LiveSession: scripted live flick.art capture chain (steps 1-13).

VERIFIED mechanics (r11 session, live discovery) — do not "simplify" these,
each one exists because something else failed:
  * turnstile passes headless; login is just fill+click.
  * stage flags go into the ph_* posthog persistence blob ($override_feature_flags).
  * deep link needs a TRUE reload (about:blank → URL): SPA soft-nav does NOT
    reset editor state.
  * the live 3D viewport is render-on-demand: it stays gray until a REAL
    interaction — the seek-kick is a native mouse click on the timeline
    ruler (poses the scene + triggers a render without moving the camera).
  * the ruler scale varies between loads → calibrate px/sec from the
    "Ns" labels every time; seeks CLAMP to show duration.
  * the render converges ~6s after the kick in SwiftShader → converge()
    screenshots twice 3s apart until identical.
  * REST scene CRUD runs as a page-context fetch (JWT never printed).
"""
import json
import os
import tempfile
import time

from PIL import Image

import ab

# ---------------------------------------------------------------- constants
BASE_URL = "https://flick.art"
REST_BASE = "https://auth.flick.art/rest/v1/stage_scenes"
PROJECT_ID = "30f2a9fa-70ac-4fab-b488-1eef74d6217a"
# round-11 base Scene 1 (8a4d — an older index file said 7a4d, which is WRONG)
BASE_SCENE_ID = "27b98b6b-8a4d-4b3a-a810-7d542342ce41"
# public anon key — a bundle literal (zDn), safe to commit
ANON_KEY = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
            "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cGl3a21xeXZvY3p6YnVtbWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjA5MjMsImV4cCI6MjA2NTkzNjkyM30."
            "c8ruF0zJCi1JrpSnpPR3kKcFTOQ6bwIbhMYBqRmnF58")
# login creds — also recorded in repo CONTEXT.md (§Account / access)
EMAIL = "antonialarson40@outlook.com"
PASSWORD = "TR.z2q6:hQBGiUk"
# dedicated oracle scene row for cases that PATCH the live scene (M3/M5)
ORACLE_SCENE_ID = "ba11e0ba-0000-4000-8000-0000000000ba"
ORACLE_SCENE_NAME = "Oracle R11"
# live canvas geometry (verified r11): scene view after panel collapse the
# capture canvas sits at (0,75) ~1000x375; read at runtime, these are the
# fallback/expectation anchors.
TIMELINE_CLICK_Y = 487  # ruler strip y (viewport coords) for the seek-kick


class LiveError(RuntimeError):
    pass


class LiveSession:
    def __init__(self, session="po-live", tmpdir=None):
        self.session = session
        self.tmpdir = tmpdir or os.path.join(os.path.dirname(__file__), "out", "tmp")
        os.makedirs(self.tmpdir, exist_ok=True)

    # ------------------------------------------------------------- helpers
    def _tmp_js(self, code):
        """Write JS to a temp file (the >1.5KB eval path) and eval it."""
        fd, path = tempfile.mkstemp(suffix=".js", dir=self.tmpdir, text=True)
        with os.fdopen(fd, "w") as f:
            f.write(code)
        try:
            return ab.eval_file(self.session, path, timeout=120)
        finally:
            os.unlink(path)

    # ---------------------------------------------------------- step 1-2: login
    def login(self):
        ab.open_url(self.session, BASE_URL)
        ab.wait(self.session, 2500)
        snap = ab.snapshot(self.session)
        ref = ab.find_ref(snap, "button", "GET STARTED") or ab.find_ref(snap, "GET STARTED")
        if not ref:
            raise LiveError("GET STARTED button not found in snapshot:\n" + snap[:1500])
        ab.click_ref(self.session, ref)
        ab.wait(self.session, 3000)
        # login form: email + password textboxes, then Sign in
        snap = ab.snapshot(self.session)
        eref = ab.find_ref(snap, "textbox", "email") or ab.find_ref(snap, "email")
        pref = ab.find_ref(snap, "textbox", "password") or ab.find_ref(snap, "password")
        if eref and pref:
            ab.fill(self.session, eref, EMAIL)
            ab.fill(self.session, pref, PASSWORD)
        else:  # CSS fallback (labels were not exposed once)
            ab.fill(self.session, "input[type=email]", EMAIL)
            ab.fill(self.session, "input[type=password]", PASSWORD)
        sref = ab.find_ref(snap, "button", "sign in")
        if sref:
            ab.click_ref(self.session, sref)
        else:
            ab.run(self.session, "find", "role", "button", "click", "Sign in")
        ab.wait(self.session, 5000)  # turnstile passes headless
        url = ab.run(self.session, "get", "url")
        if "flick.art" not in str(url):
            raise LiveError(f"login left the site? url={url}")
        return "logged in"

    # ------------------------------------------------- step 3: stage flags
    def inject_flags(self):
        r = ab.eval_js(self.session, """
(() => {
  const k = Object.keys(localStorage).find(x => x.startsWith('ph_'));
  const b = JSON.parse(localStorage.getItem(k));
  const ov = { 'stage-3d': true, 'stage-scene-node': true };
  if (b.$override_feature_flags) Object.assign(b.$override_feature_flags, ov);
  else b.$override_feature_flags = ov;
  localStorage.setItem(k, JSON.stringify(b));
  return 'ok ' + k;
})()""".strip())
        if not str(r).startswith("ok "):
            raise LiveError(f"flag injection failed: {r}")
        return r

    # ------------------------------------------- step 12: finish-pref case
    def set_finish_pref(self):
        """stage-finish manual — must run on the flick.art origin BEFORE the
        deep-link navigation (i.e. right after flag injection)."""
        return ab.eval_js(self.session,
                          "localStorage.setItem('stage-finish', JSON.stringify({enabled:true, source:'manual'})); 'ok'")

    # ------------------------------------- step 4-5: deep link + scene load
    def deep_link(self, scene_id, finish=False, expect_objects=None):
        """TRUE reload: about:blank → deep link (SPA soft-nav does NOT reset
        editor state). Then click the scene tab and poll the components
        column until the scene objects are in.

        finish=True sets the stage-finish manual pref on the flick.art origin
        BEFORE navigating; finish=False REMOVES it (the pref persists across
        cases in one session and must not leak into the next case)."""
        if finish:
            self.set_finish_pref()
        else:
            ab.eval_js(self.session,
                       "localStorage.removeItem('stage-finish'); 'cleared'")
        ab.open_url(self.session, "about:blank")
        ab.wait(self.session, 1000)
        ab.open_url(self.session, f"{BASE_URL}/canvas/{PROJECT_ID}?view=stage&scene={scene_id}")
        ab.wait(self.session, 10000)
        self.click_scene_tab()
        return self.wait_scene_load(expect_objects)

    def click_scene_tab(self):
        r = ab.eval_js(self.session, """
(() => {
  const btn = [...document.querySelectorAll('button')]
    .find(b => /^Scene 1$/.test(b.textContent.trim()) && Math.abs(b.getBoundingClientRect().y - 49) < 8);
  if (!btn) return 'no scene tab';
  const tab = btn.closest('[class*=_tab_]') || btn;
  for (const t of ['pointerdown', 'pointerup', 'click']) {
    tab.dispatchEvent(new PointerEvent(t, {bubbles: true, pointerId: 1, isPrimary: true}));
  }
  return 'tab clicked';
})()""".strip())
        if "clicked" not in str(r):
            raise LiveError(f"scene tab click failed: {r}")
        return r

    def wait_scene_load(self, expect_objects=None, timeout_s=40):
        """Poll the components column until 'Scene is empty' is gone.
        expect_objects: optional count assertion (the r11 base scene = 7)."""
        code = """
(async()=>{
  const aside=document.querySelector('aside[class*=_panel_]');
  if(!aside)return 'na';
  return /Scene is empty/i.test(aside.textContent)
    ? 'empty'
    : 'loaded '+[...aside.querySelectorAll('button')].filter(b=>/Delete object/i.test(b.getAttribute('aria-label')||'')).length+' objects';
})()""".strip()
        deadline = time.time() + timeout_s
        last = None
        while time.time() < deadline:
            last = ab.eval_js(self.session, code, timeout=60)
            if str(last).startswith("loaded"):
                break
            time.sleep(5)
        if not str(last).startswith("loaded"):
            raise LiveError(f"scene never loaded (last={last})")
        if expect_objects is not None:
            n = int(str(last).split()[1])
            if n != expect_objects:
                raise LiveError(f"object count {n} != expected {expect_objects}")
        return str(last)

    # ---------------------------------------------- step 6: collapse panels
    def collapse_panels(self):
        ab.eval_js(self.session, """
(() => {
  const labels = ['Collapse panel', 'Hide the components column'];
  const hit = [];
  for (const L of labels) {
    const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === L);
    if (b) { b.click(); hit.push(L); }
  }
  return 'collapsed: ' + hit.join(', ');
})()""".strip())
        ab.wait(self.session, 800)
        # canvas becomes ~1000x375 at (0,75)
        return self.canvas_rect()

    def canvas_rect(self):
        r = ab.eval_js(self.session, """
(() => {
  const c = document.querySelector('canvas.ph-viewport-capture');
  if (!c) return 'no capture canvas';
  const r = c.getBoundingClientRect();
  return JSON.stringify([Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]);
})()""".strip())
        if isinstance(r, str) and r.startswith("["):
            return json.loads(r)
        raise LiveError(f"canvas rect read failed: {r}")

    # --------------------------------------- step 7: ruler calibrate + kick
    def calibrate_ruler(self):
        """Timeline zoom VARIES between loads — read the 'Ns' ruler labels
        every time. Returns {pxPerSec, t0x} (t0x = x of the t=0 tick)."""
        labels = ab.eval_js(self.session, """
(()=>{
  const ls=[...document.querySelectorAll('span,div,p')].filter(e=>/^\\d+s$/.test(e.textContent.trim())&&e.children.length===0);
  return JSON.stringify(ls.slice(0,8).map(e=>{const r=e.getBoundingClientRect();return [e.textContent.trim(),Math.round(r.x+r.width/2)]}));
})()""".strip())
        pts = json.loads(labels) if isinstance(labels, str) and labels.startswith("[") else []
        if len(pts) < 2:
            raise LiveError(f"ruler calibration failed (labels={labels})")
        # pxPerSec: every consecutive label pair yields a candidate; take the
        # median of the mutually-consistent ones (labels may skip steps)
        cands = []
        for (t0, x0), (t1, x1) in zip(pts, pts[1:]):
            d = float(t1[:-1]) - float(t0[:-1])
            if d > 0 and x1 > x0:
                cands.append((x1 - x0) / d)
        if not cands:
            raise LiveError(f"no pxPerSec from labels {pts}")
        cands.sort()
        px_per_sec = cands[len(cands) // 2]  # median
        readout = ab.eval_js(self.session, """
(()=>{
  const tl=[...document.querySelectorAll('span,div,p')].filter(e=>/^\\d+\\.\\d\\d$/.test(e.textContent.trim())&&e.children.length===0);
  const b=document.querySelector('[class*=_playheadBadge_]');
  const r=b?b.getBoundingClientRect():null;
  return JSON.stringify({t:tl[0]?.textContent.trim(),badgeX:r?Math.round(r.x+r.width/2):null});
})()""".strip())
        ro = json.loads(readout) if isinstance(readout, str) and readout.startswith("{") else {}
        t = float(ro.get("t")) if ro.get("t") else None
        badge_x = ro.get("badgeX")
        if t is None or badge_x is None:
            raise LiveError(f"playhead readout failed: {readout}")
        t0x = badge_x - t * px_per_sec  # x of the t=0 tick
        return {"pxPerSec": px_per_sec, "t0x": t0x, "readoutT": t, "badgeX": badge_x, "labels": pts}

    def read_time(self):
        r = ab.eval_js(self.session, """
(()=>{
  const tl=[...document.querySelectorAll('span,div,p')].filter(e=>/^\\d+\\.\\d\\d$/.test(e.textContent.trim())&&e.children.length===0);
  return tl[0]?.textContent.trim() ?? 'none';
})()""".strip())
        try:
            return float(r)
        except (TypeError, ValueError):
            return None

    def seek_kick(self, t):
        """REQUIRED: the live viewport is render-on-demand — a native ruler
        click both poses the scene AND triggers a render without touching the
        camera. Seeks CLAMP to the show duration (verify the readout)."""
        cal = self.calibrate_ruler()
        x = cal["t0x"] + t * cal["pxPerSec"]
        ab.mouse_click(self.session, round(x), TIMELINE_CLICK_Y)
        ab.wait(self.session, 600)
        got = self.read_time()
        if got is None or abs(got - t) > 0.01:
            # clamp check: report, don't hard-fail (show duration may differ)
            note = f" (wanted {t}; if t > show duration the seek CLAMPS)"
            print(f"  [seek_kick] readout={got}{note}")
        return {"clickedX": round(x), "readout": got, "calibration": cal}

    # ------------------------------------------------------ step 8: converge
    def converge(self, max_iter=6, settle_s=3.0):
        """The live render converges ~6s post-seek in SwiftShader; screenshot
        twice `settle_s` apart and require a ~0 diff."""
        import numpy as np
        prev = None
        for i in range(max_iter):
            p1 = os.path.join(self.tmpdir, f"conv_{i}_a.png")
            p2 = os.path.join(self.tmpdir, f"conv_{i}_b.png")
            ab.screenshot(self.session, p1)
            time.sleep(settle_s)
            ab.screenshot(self.session, p2)
            a = np.asarray(Image.open(p1).convert("RGB"), dtype=np.int16)
            b = np.asarray(Image.open(p2).convert("RGB"), dtype=np.int16)
            d = float(np.abs(a - b).mean())
            if d < 0.05:
                return {"converged": True, "iter": i, "diff": d}
            prev = d
        return {"converged": False, "iter": max_iter, "diff": prev}

    # ------------------------------------------------------ step 9: capture
    def capture(self, out_path):
        """Full screenshot cropped to the runtime-read capture-canvas rect."""
        full = os.path.join(self.tmpdir, "full_shot.png")
        ab.screenshot(self.session, full)
        x, y, w, h = self.canvas_rect()
        Image.open(full).convert("RGB").crop((x, y, x + w, y + h)).save(out_path)
        return out_path

    # --------------------------------------------- step 10: cameras (lens)
    def cameras_capture(self, out_path, wait_ms=4000):
        """Click the Cameras radio; the feed canvas (~805x452, geometry may
        shift) renders WITHOUT a kick. It's the second-largest canvas inside
        the viewport area — find it by geometry at runtime."""
        ab.eval_js(self.session, """
(() => {
  const r = [...document.querySelectorAll('[role=radio],input[type=radio],button,label')]
    .find(e => /cameras/i.test((e.textContent || '') + (e.getAttribute('aria-label') || '')));
  if (!r) return 'no cameras radio';
  const t = r.closest('label') || r;
  t.click();
  return 'cameras radio clicked';
})()""".strip())
        ab.wait(self.session, wait_ms)
        rect = ab.eval_js(self.session, """
(()=>{
  const cs=[...document.querySelectorAll('canvas')].map(c=>{const r=c.getBoundingClientRect();
    return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)];});
  return JSON.stringify(cs);
})()""".strip())
        canvases = json.loads(rect) if isinstance(rect, str) and rect.startswith("[") else []
        # feed = second-largest by area, inside the viewport band
        inside = [c for c in canvases if c[2] > 200 and c[3] > 150]
        inside.sort(key=lambda c: c[2] * c[3], reverse=True)
        if len(inside) < 2:
            raise LiveError(f"cameras feed canvas not found: {canvases}")
        x, y, w, h = inside[1]
        full = os.path.join(self.tmpdir, "full_shot_cam.png")
        ab.screenshot(self.session, full)
        Image.open(full).convert("RGB").crop((x, y, x + w, y + h)).save(out_path)
        return out_path

    # ------------------------------------------------- step 11: REST helpers
    # All run as page-context fetch on the flick.art origin (JWT never
    # printed). Bodies carrying scene JSON exceed the 1.5KB eval limit →
    # they go through _tmp_js (eval-via-file).
    def _rest_js(self, method, query, body=None, prefer=None):
        body_json = json.dumps(body) if body is not None else "null"
        prefer_js = f"Prefer: '{prefer}'," if prefer else ""
        # NB: Authorization lives INSIDE headers (JWT concatenated in-page,
        # never serialized into our files)
        return f"""
(async () => {{
  const t = JSON.parse(localStorage.getItem('sb-auth-auth-token'));
  const jwt = t.access_token || t.currentSession?.access_token;
  const r = await fetch('{REST_BASE}?{query}', {{
    method: '{method}',
    headers: {{apikey: '{ANON_KEY}', Authorization: 'Bearer ' + jwt, 'Content-Type': 'application/json', {prefer_js}}},
    body: {body_json},
  }});
  const txt = await r.text();
  return 'status=' + r.status + ' body=' + txt.slice(0, 4000);
}})()""".strip()

    def rest_read(self):
        """READ quirk: filter by project_id (scene_id=eq.<uuid> filters
        Mysteriously return empty — do NOT use); pick client-side."""
        code = """
(async () => {
  const t = JSON.parse(localStorage.getItem('sb-auth-auth-token'));
  const jwt = t.access_token || t.currentSession?.access_token;
  const r = await fetch('%s?project_id=eq.%s&select=scene_id,name,scene', {
    headers: {apikey: '%s', Authorization: 'Bearer ' + jwt}});
  const j = await r.json();
  if (!Array.isArray(j)) return 'ERR ' + JSON.stringify(j).slice(0,300);
  return JSON.stringify(j);
})()""" % (REST_BASE, PROJECT_ID, ANON_KEY)
        r = self._tmp_js(code)
        if not str(r).startswith("["):
            raise LiveError(f"rest_read failed: {str(r)[:300]}")
        return json.loads(r)

    def rest_read_scene(self, scene_id):
        rows = [row for row in self.rest_read() if row.get("scene_id") == scene_id]
        return rows[0] if rows else None

    def rest_post(self, scene_id, name, scene):
        code = self._rest_js("POST", "", {
            "scene_id": scene_id, "name": name,
            "project_id": PROJECT_ID, "scene": scene,
        }, prefer="return=representation")
        r = self._tmp_js(code)
        if "status=201" not in str(r):
            raise LiveError(f"rest_post failed: {str(r)[:300]}")
        return r

    def rest_patch(self, scene_id, scene, name=None):
        """PATCH quirk: GET with scene_id=eq returns empty, but PATCH with
        scene_id=eq.<id> in the URL is claimed to work. We try it first and
        fall back to (a) POST upsert Prefer: resolution=merge-duplicates and
        (b) PATCH by name filter."""
        body = {"scene": scene}
        if name:
            body["name"] = name
        try:
            code = self._rest_js("PATCH", f"scene_id=eq.{scene_id}", body)
            r = self._tmp_js(code)
            if "status=20" in str(r):  # 200/204
                return "PATCH scene_id ok"
        except Exception as e:  # noqa: BLE001 — fall through to upsert
            print(f"  [rest_patch] scene_id PATCH failed ({e}); trying upsert")
        code = self._rest_js("POST", "", {
            "scene_id": scene_id, "name": name or ORACLE_SCENE_NAME,
            "project_id": PROJECT_ID, "scene": scene,
        }, prefer="resolution=merge-duplicates")
        r = self._tmp_js(code)
        if "status=20" in str(r):
            return "POST upsert ok"
        raise LiveError(f"rest_patch failed (all strategies): {str(r)[:400]}")

    def rest_delete(self, scene_id):
        code = self._rest_js("DELETE", f"scene_id=eq.{scene_id}")
        r = self._tmp_js(code)
        if "status=204" not in str(r):
            raise LiveError(f"rest_delete failed: {str(r)[:300]}")
        return r

    def ensure_oracle_scene(self, scene):
        """M3/M5: one dedicated oracle scene row, PATCHed per case, deep
        linked to. POST once if missing (scene_id ba11e0ba-…-0ba)."""
        row = self.rest_read_scene(ORACLE_SCENE_ID)
        if row is None:
            self.rest_post(ORACLE_SCENE_ID, ORACLE_SCENE_NAME, scene)
            return "created oracle scene"
        return "oracle scene exists"

    # ------------------------------------------------------------- teardown
    def close(self):
        return ab.close(self.session)
