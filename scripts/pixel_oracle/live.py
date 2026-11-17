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
# (2026-11 live: ruler band y=480..496, clickable ~484..496 — 487 verified
# in-band; the FIRST native click after a deep-link is swallowed, seek_kick
# sends a warm-up click at the current playhead first)


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
    def deep_link(self, scene_id, finish=False, expect_objects=None,
                  tab_name="Scene 1"):
        """TRUE reload: about:blank → deep link (SPA soft-nav does NOT reset
        editor state). Then click the scene tab and poll the components
        column until the scene objects are in.

        tab_name: the scene-row NAME whose tab gets clicked — 'Scene 1' for
        the base scene; oracle cases pass 'Oracle R11' (the tab strip lists
        one tab per scene row in the project).

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
        self.click_scene_tab(tab_name)
        loaded = self.wait_scene_load(expect_objects)
        self.dismiss_overlays()  # the 2026-11 live auto-opens a picker panel
        return loaded

    # ------------------------------------------------- overlay dismissal
    def dismiss_overlays(self):
        """The 2026-11 live auto-opens a 'New move' picker panel + backdrop
        over the viewport/timeline on deep-link (r11 did not — the live
        evolves). It covers the capture canvas AND eats ruler clicks.
        Dismiss: Escape → the panel's close button → a native click on the
        backdrop's own area; verify it is gone after each attempt."""
        check = ("(() => {const p = document.querySelector(" 
                 "'[class*=_pickerPanel_],[class*=_backdrop_],[class*=_modal_]');"
                 "return p ? 'open' : 'clear';})()")
        for attempt in ("escape", "close-btn", "backdrop"):
            state = ab.eval_js(self.session, check)
            if state == "clear":
                return "no overlay" if attempt == "escape" else f"dismissed ({attempt})"
            if attempt == "escape":
                ab.run(self.session, "press", "Escape", check=False)
            elif attempt == "close-btn":
                ab.eval_js(self.session, """
(() => {
  const p = document.querySelector('[class*=_pickerPanel_],[class*=_modal_]');
  if (!p) return 'no panel';
  const c = p.querySelector('[class*=_close_],button[aria-label*=lose i]');
  if (!c) return 'no close in panel';
  c.click();
  return 'close clicked';
})()""".strip())
            else:  # backdrop: native click on the backdrop's own left edge
                r = ab.eval_js(self.session, """
(() => {
  const b = document.querySelector('[class*=_backdrop_]');
  if (!b) return 'none';
  const r = b.getBoundingClientRect();
  return JSON.stringify([Math.round(r.x + 8), Math.round(r.y + r.height / 2)]);
})()""".strip())
                if isinstance(r, str) and r.startswith("["):
                    bx, by = json.loads(r)
                    ab.mouse_click(self.session, bx, by)
            ab.wait(self.session, 800)
        state = ab.eval_js(self.session, check)
        if state != "clear":
            raise LiveError("dismiss_overlays: picker/backdrop still open after all attempts")
        return "dismissed (last resort worked)"

    def click_scene_tab(self, tab_name="Scene 1", timeout_s=30):
        """Click a scene tab by its exact text. The tab strip lazy-renders
        AFTER the editor boots (r11 saw 'Scene 1' at y≈49 immediately; the
        2026-11 live renders the strip a few seconds in, and the project
        now has 10+ scene tabs) — POLL for the button instead of assuming
        geometry. Exact-name match anywhere, preferring a button inside a
        [class*=_tab_] container; synthetic pointer events on the tab."""
        code = """
(() => {
  const want = %s;
  const btns = [...document.querySelectorAll('button')]
    .filter(b => b.textContent.trim() === want);
  if (!btns.length) return 'no button "' + want + '" yet';
  const btn = btns.find(b => b.closest('[class*=_tab_]')) || btns[0];
  const tab = btn.closest('[class*=_tab_]') || btn;
  for (const t of ['pointerdown', 'pointerup', 'click']) {
    tab.dispatchEvent(new PointerEvent(t, {bubbles: true, pointerId: 1, isPrimary: true}));
  }
  return 'tab clicked: ' + want;
})()""".strip() % json.dumps(tab_name)
        deadline = time.time() + timeout_s
        last = None
        while time.time() < deadline:
            last = ab.eval_js(self.session, code)
            if "clicked" in str(last):
                return str(last)
            time.sleep(3)
        raise LiveError(f"scene tab click failed (strip never rendered?): {last}")

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
    # the r11-verified collapsed scene-view canvas band — a capture outside
    # it (r11 step 3a saw a full-viewport 1280x375) means the layout is not in
    # the canonical comparison basis: fail loudly instead.
    COLLAPSED_BAND = ((970, 1030), (368, 382))

    @classmethod
    def _in_band(cls, w, h, band=None):
        (w0, w1), (h0, h1) = band or cls.COLLAPSED_BAND
        return w0 <= w <= w1 and h0 <= h <= h1

    def collapse_panels(self):
        """Bring the live scene view into the canonical comparison basis
        (~1000x375 canvas at (0,75)), VERIFIED by geometry — the 2026-11 live
        layout drifts per load and the r11 click-list no longer implies the
        r11 geometry (step-3a: both r11 buttons fired yet the canvas was a
        full-viewport 1280x375). Probe-verified state machine (po-dbg4):
          wide viewHost (1280) + components column in-flow (280)
            → 'Collapse panel' alone lands EXACTLY 1000x375 (the r11/m2
                       basis; the right-inspector panel is off-screen already);
          sidePanel (360, chat) open → viewHost 920: same click lands 640
            → 'Hide the components column' reclaims the 280 → 920… still
            not 1000, so the sidePanel must be CLOSED (its 'Collapse panel'
            button) and the sequence re-run → 1000.
          'Hide the components column' on a wide load would widen the canvas
                       to 1280 = a different aspect — NEVER click it on a wide
                       viewHost (probe-verified).
        Retries for late-rendered buttons; raises LiveError with diagnostics
        if the canvas never lands in band."""
        def click(*labels):
            want = json.dumps(list(labels))
            r = str(ab.eval_js(self.session, """
(() => {
  const labels = %s;
  const hit = [];
  for (const L of labels) {
    const b = [...document.querySelectorAll('button')]
      .find(x => x.getAttribute('aria-label') === L && !x.disabled);
    if (b) { b.click(); hit.push(L); }
  }
  return 'fired: ' + hit.join(', ') || 'fired: none';
})()""".strip() % want))
            return [L for L in labels if L in r]

        def view_host_width():
            r = ab.eval_js(self.session, """
(()=>{const vh=document.querySelector('[class*=_viewHost_]');
 return vh?Math.round(vh.getBoundingClientRect().width):0;})()""".strip())
            try:
                return int(r)
            except (TypeError, ValueError):
                return 0

        def sidepanel_open():
            r = ab.eval_js(self.session, """
(()=>{const sp=document.querySelector('[class*=_sidePanel_]');
 if(!sp)return 'gone';const r=sp.getBoundingClientRect();
 return r.width>200&&r.x<window.innerWidth?'open':'closed';})()""".strip())
            return str(r) == "open"

        def close_sidepanel():
            """Close the chat sidePanel via ITS OWN collapse button (the label
            is ambiguous in document order — target inside the panel)."""
            r = ab.eval_js(self.session, """
(() => {
  const sp = document.querySelector('[class*=_sidePanel_]');
  if (!sp) return 'gone';
  const r = sp.getBoundingClientRect();
  if (!(r.width > 200 && r.x < window.innerWidth)) return 'closed';
  const b = [...sp.querySelectorAll('button')]
    .find(x => x.getAttribute('aria-label') === 'Collapse panel' && !x.disabled);
  if (b) { b.click(); return 'closed via click'; }
  return 'open-no-btn';
})()""".strip())
            return str(r)

        log = []
        for attempt in range(4):
            if sidepanel_open():   # chat sidePanel steals 360px of viewHost
                log.append("sidePanel " + close_sidepanel())
                ab.wait(self.session, 1200)
            vw = view_host_width()
            log.append(f"viewHost={vw} " + str(click("Collapse panel")))
            ab.wait(self.session, 1500)
            x, y, w, h = self.canvas_rect()
            if self._in_band(w, h):
                log.append(f"canvas {x},{y},{w},{h}")
                return [x, y, w, h]
            if w < 970:  # too narrow → free the components column's 280px
                log.append("hide-components " + str(click("Hide the components column")))
                ab.wait(self.session, 1200)
                x, y, w, h = self.canvas_rect()
                if self._in_band(w, h):
                    log.append(f"canvas {x},{y},{w},{h}")
                    return [x, y, w, h]
            ab.wait(self.session, 1000)
        x, y, w, h = self.canvas_rect()
        raise LiveError(
            f"collapse_panels: canvas {x},{y},{w},{h} never reached the canonical "
            f"band {self.COLLAPSED_BAND} — {'; '.join(log)}; live layout changed?")

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
        every time. Returns {pxPerSec, t0x} (t0x = x of the t=0 tick).
        2026-11 live: the playhead BADGE's LEFT EDGE is the playhead position
        (its CENTER is +17px off — probe-verified: badge.left=80=true t0)."""
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
        t = self.read_time()  # band-aware (duration chips lie)
        badge = ab.eval_js(self.session, """
(()=>{
  const b=document.querySelector('[class*=_playheadBadge_]');
  if(!b)return 'none';
  const r=b.getBoundingClientRect();
  return JSON.stringify([Math.round(r.x),Math.round(r.width)]);
})()""".strip())
        try:
            badge_left, badge_w = json.loads(badge)
        except (TypeError, ValueError):
            raise LiveError(f"playhead badge read failed: {badge}")
        if t is None:
            raise LiveError("playhead readout failed (read_time=None)")
        t0x = badge_left - t * px_per_sec  # badge LEFT edge = playhead
        return {"pxPerSec": px_per_sec, "t0x": t0x, "readoutT": t,
                "badgeLeftX": badge_left, "badgeW": badge_w, "labels": pts}

    def read_time(self):
        """The playhead readout 'N.NN'. CAREFUL: other N.NN texts can appear
        mid-flow (e.g. a selected track-item's duration chip ≈'4.98') and DOM
        order is not stable — prefer the N.NN inside the ruler's y-band
        (±10px of the 'Ns' labels' median y), leftmost x."""
        r = ab.eval_js(self.session, """
(()=>{
  const els=[...document.querySelectorAll('span,div,p')]
    .filter(e=>/^\\d+\\.\\d\\d$/.test(e.textContent.trim())&&e.children.length===0)
    .map(e=>{const r=e.getBoundingClientRect();return [e.textContent.trim(),Math.round(r.x),Math.round(r.y)];});
  if(!els.length)return 'none';
  const labels=[...document.querySelectorAll('span,div,p')]
    .filter(e=>/^\\d+s$/.test(e.textContent.trim())&&e.children.length===0);
  const ys=labels.map(e=>Math.round(e.getBoundingClientRect().y)).sort((a,b)=>a-b);
  const band=ys.length?ys[Math.floor(ys.length/2)]:480;
  const inBand=els.filter(e=>Math.abs(e[2]-band)<=10);
  return (inBand.length?inBand:els).sort((a,b)=>a[1]-b[1])[0][0];
})()""".strip())
        try:
            return float(r)
        except (TypeError, ValueError):
            return None

    def seek_kick(self, t, max_tries=4):
        """REQUIRED: the live viewport is render-on-demand — a native ruler
        click both poses the scene AND triggers a render without touching the
        camera. Seeks CLAMP to the show duration (verify the readout).

        2026-11 live quirks (probe-verified):
          * the FIRST native click after a deep-link is swallowed (window
            focus) — a harmless warm-up click at the CURRENT playhead (a
            no-move seek) precedes the real one;
          * the playhead-badge CENTER is offset ~17px from the true t=0
            tick (badge LEFT edge = playhead) — calibrate_ruler's
            badge-center t0x is only the initial guess; this loop
            SELF-CORRECTS t0x from the observed readout.
        Raises LiveError if |readout - t| > 0.01 after max_tries (a bad seek
        would poison the capture — fail loudly instead)."""
        self.dismiss_overlays()  # idempotent; re-check the picker isn't back
        cal = self.calibrate_ruler()
        # warm-up click at the current playhead (no-op seek, warms the input)
        wx = cal["t0x"] + (cal.get("readoutT") or 0) * cal["pxPerSec"]
        ab.mouse_click(self.session, round(wx), TIMELINE_CLICK_Y)
        ab.wait(self.session, 500)
        y_opts = (TIMELINE_CLICK_Y, TIMELINE_CLICK_Y - 3, TIMELINE_CLICK_Y + 5)
        got = None
        for i in range(max_tries):
            x = cal["t0x"] + t * cal["pxPerSec"]
            ab.mouse_click(self.session, round(x), y_opts[i % len(y_opts)])
            ab.wait(self.session, 600)
            got = self.read_time()
            if got is not None and abs(got - t) <= 0.01:
                return {"clickedX": round(x), "readout": got, "tries": i + 1,
                        "t0x": round(cal["t0x"]), "pxPerSec": cal["pxPerSec"]}
            if got is not None and got > 0.01:
                # a real seek landed off-target → correct t0x, retry
                cal["t0x"] += (got - t) * cal["pxPerSec"]
            # got ≈ 0 → click swallowed/missed → retry (next y in the band)
        raise LiveError(
            f"seek_kick could not land t={t} (readout={got} after {max_tries} "
            f"tries; if t > show duration the seek CLAMPS — check the case spec)")

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
        """Full screenshot cropped to the runtime-read capture-canvas rect.
        The rect is re-verified against the collapsed band (an overlay can
        re-open / the layout can relayout between seek and capture)."""
        full = os.path.join(self.tmpdir, "full_shot.png")
        ab.screenshot(self.session, full)
        x, y, w, h = self.canvas_rect()
        if not self._in_band(w, h):
            raise LiveError(f"capture: canvas {x},{y},{w},{h} outside the "
                            f"collapsed band {self.COLLAPSED_BAND}")
        Image.open(full).convert("RGB").crop((x, y, x + w, y + h)).save(out_path)
        return out_path

    # --------------------------------------------- step 10: cameras (lens)
    # the r11-verified lens feed band (~805x452) — the feed is its own render
    # target and CONVERGES like the scene view (SwiftShader ~6s post-switch):
    # a single wait_ms screenshot can catch it mid-render (step-3a m1 live was
    # a bright unconverged frame, mean 190 vs ours 134, whole-image blob).
    LENS_BAND = ((700, 900), (400, 520))

    def cameras_capture(self, out_path, wait_ms=4000, converge_iter=4):
        """Click the Cameras radio; the feed canvas (~805x452, geometry may
        shift) renders WITHOUT a kick. It's the second-largest canvas inside
        the viewport area — find it by geometry at runtime. The feed is then
        CONVERGED (screenshot pairs 3s apart, like the scene view) before the
        capture."""
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
        if not self._in_band(w, h, self.LENS_BAND):
            raise LiveError(f"cameras feed {x},{y},{w},{h} outside the lens band "
                            f"{self.LENS_BAND} (canvases {canvases})")
        # converge the FEED (its own render target — the earlier scene-view
        # converge does not cover it); the LAST screenshot is the capture
        import numpy as np
        for i in range(converge_iter):
            p1 = os.path.join(self.tmpdir, f"lens_{i}_a.png")
            p2 = os.path.join(self.tmpdir, f"lens_{i}_b.png")
            ab.screenshot(self.session, p1)
            time.sleep(3.0)
            ab.screenshot(self.session, p2)
            a = np.asarray(Image.open(p1).convert("RGB"), dtype=np.int16)
            b = np.asarray(Image.open(p2).convert("RGB"), dtype=np.int16)
            d = float(np.abs(a - b).mean())
            if d < 0.05:
                break
        full = p2  # the latest screenshot (post-converge)
        Image.open(full).convert("RGB").crop((x, y, x + w, y + h)).save(out_path)
        return out_path

    # ------------------------------------------------- step 11: REST helpers
    # All run as page-context fetch on the flick.art origin (JWT never
    # printed). Bodies carrying scene JSON exceed the 1.5KB eval limit →
    # they go through _tmp_js (eval-via-file).
    def _rest_js(self, method, query, body=None, prefer=None):
        # NB: fetch needs a STRING body — a raw object literal goes out as
        # "[object Object]" → PostgREST 400 PGRST102 "Empty or invalid json"
        # (probe _post_scene.js always JSON.stringify'd; found on the first
        # live oracle POST).
        body_js = f"JSON.stringify({json.dumps(body)})" if body is not None else "null"
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
    body: {body_js},
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

    def rest_read_scene(self, scene_id, with_scene=True):
        """Read ONE scene row: project_id filter (scene_id=eq returns empty
        — the quirk), pick client-side IN PAGE so only the picked row crosses
        the transport. Returns the row dict or None."""
        sel = "scene_id,name,scene" if with_scene else "scene_id,name"
        code = """
(async () => {
  const t = JSON.parse(localStorage.getItem('sb-auth-auth-token'));
  const jwt = t.access_token || t.currentSession?.access_token;
  const r = await fetch('%s?project_id=eq.%s&select=%s', {
    headers: {apikey: '%s', Authorization: 'Bearer ' + jwt}});
  const j = await r.json();
  if (!Array.isArray(j)) return 'ERR ' + JSON.stringify(j).slice(0, 300);
  const row = j.find(x => x.scene_id === '%s');
  return row ? JSON.stringify(row) : 'none';
})()""" % (REST_BASE, PROJECT_ID, sel, ANON_KEY, scene_id)
        r = self._tmp_js(code)
        if str(r).startswith("ERR"):
            raise LiveError(f"rest_read_scene failed: {str(r)[:300]}")
        if r in (None, "none", "None", "null"):
            return None
        return json.loads(r) if isinstance(r, str) else r

    def rest_post(self, scene_id, name, scene):
        code = self._rest_js("POST", "", {
            "scene_id": scene_id, "name": name,
            "project_id": PROJECT_ID, "scene": scene,
        }, prefer="return=representation")
        r = self._tmp_js(code)
        if "status=201" not in str(r):
            raise LiveError(f"rest_post failed: {str(r)[:300]}")
        return r

    def rest_upsert(self, scene_id, name, scene):
        """POST upsert (Prefer: resolution=merge-duplicates) — the reliable
        write path when PATCH's scene_id=eq filter silently affects 0 rows."""
        code = self._rest_js("POST", "", {
            "scene_id": scene_id, "name": name,
            "project_id": PROJECT_ID, "scene": scene,
        }, prefer="resolution=merge-duplicates")
        r = self._tmp_js(code)
        if "status=20" not in str(r):
            raise LiveError(f"rest_upsert failed: {str(r)[:300]}")
        return "POST upsert ok"

    def rest_patch(self, scene_id, scene, name=None):
        """PATCH quirk: GET with scene_id=eq returns empty, but PATCH with
        scene_id=eq.<id> in the URL is claimed to work. CAVEAT: a 2xx PATCH
        can silently affect 0 rows — ALWAYS follow with rest_scene_matches()
        (see patch_oracle_verified); on mismatch, rest_upsert() is the
        reliable fallback."""
        body = {"scene": scene}
        if name:
            body["name"] = name
        try:
            code = self._rest_js("PATCH", f"scene_id=eq.{scene_id}", body)
            r = self._tmp_js(code)
            if "status=20" in str(r):  # 200/204
                return "PATCH scene_id ok (verify by readback)"
        except Exception as e:  # noqa: BLE001 — fall through to upsert
            print(f"  [rest_patch] scene_id PATCH failed ({e}); trying upsert")
        return self.rest_upsert(scene_id, name or ORACLE_SCENE_NAME, scene)

    def rest_delete(self, scene_id):
        code = self._rest_js("DELETE", f"scene_id=eq.{scene_id}")
        r = self._tmp_js(code)
        if "status=204" not in str(r):
            raise LiveError(f"rest_delete failed: {str(r)[:300]}")
        return r

    def rest_scene_matches(self, scene_id, scene):
        """READ-BACK verify: fetch the row (project_id filter, client-side
        pick) and deep-equal its scene JSON against `scene` IN PAGE — jsonb
        reorders keys, so a string comparison would lie. Returns 'match' /
        'no-row' / 'mismatch:<name>' / 'ERR …'."""
        code = """
(async () => {
  const t = JSON.parse(localStorage.getItem('sb-auth-auth-token'));
  const jwt = t.access_token || t.currentSession?.access_token;
  const r = await fetch('%s?project_id=eq.%s&select=scene_id,name,scene', {
    headers: {apikey: '%s', Authorization: 'Bearer ' + jwt}});
  const j = await r.json();
  if (!Array.isArray(j)) return 'ERR ' + JSON.stringify(j).slice(0, 300);
  const row = j.find(x => x.scene_id === '%s');
  if (!row) return 'no-row';
  const eq = (a, b) => {
    if (a === b) return true;
    if (typeof a !== typeof b || a === null || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) return a.length === b.length && a.every((v, i) => eq(v, b[i]));
    if (typeof a === 'object') {
      const ka = Object.keys(a), kb = Object.keys(b);
      return ka.length === kb.length && ka.every(k => eq(a[k], b[k]));
    }
    return false;
  };
  return eq(row.scene, %s) ? 'match' : 'mismatch:' + row.name;
})()""" % (REST_BASE, PROJECT_ID, ANON_KEY, scene_id, json.dumps(scene))
        return self._tmp_js(code)

    def ensure_oracle_scene(self, scene):
        """M3/M5: one dedicated oracle scene row, PATCHed per case, deep
        linked to. POST once if missing (scene_id ba11e0ba-…-0ba); a 409
        POST (row exists but the read missed it) is tolerated after a
        confirming re-read."""
        row = self.rest_read_scene(ORACLE_SCENE_ID, with_scene=False)
        if row is None:
            try:
                self.rest_post(ORACLE_SCENE_ID, ORACLE_SCENE_NAME, scene)
                return "created oracle scene"
            except LiveError as e:
                if self.rest_read_scene(ORACLE_SCENE_ID, with_scene=False) is not None:
                    return f"oracle scene exists (POST 409 tolerated: {str(e)[:80]})"
                raise
        return "oracle scene exists"

    def patch_oracle_verified(self, scene):
        """ensure-oracle-row + PATCH + READ-BACK VERIFY + upsert fallback.
        The readback is the truth (a 2xx PATCH can affect 0 rows); raises
        LiveError if the row never comes back deep-equal to the fixture."""
        steps = [self.ensure_oracle_scene(scene)]
        steps.append(self.rest_patch(ORACLE_SCENE_ID, scene, name=ORACLE_SCENE_NAME))
        v = self.rest_scene_matches(ORACLE_SCENE_ID, scene)
        if v != "match":
            steps.append(f"readback {v} → upsert fallback")
            steps.append(self.rest_upsert(ORACLE_SCENE_ID, ORACLE_SCENE_NAME, scene))
            v = self.rest_scene_matches(ORACLE_SCENE_ID, scene)
            if v != "match":
                raise LiveError(f"oracle row refused to match after patch+upsert: {v}")
        steps.append(f"readback {v}")
        return "; ".join(steps)

    # ------------------------------------------------------------- teardown
    def close(self):
        return ab.close(self.session)
