#!/usr/bin/env python3
"""r20_height_e2e.py — round-20 L6 camera-height-into-the-timeline regression suite.

The ask (issue 6): "camera height can be part of the timeline instead of a separate popout?"
The original has NO timeline height row (R20_CAMVIEW_HEIGHT §B1); the sanctioned deviation
is the SegmentKeyframes pattern (@5192233) — a height-curve strip docked UNDER the selected
cam-path's lane, reusing the r8 buildCurvePanel SVG guts (the verbatim MOr port) with the
u-domain retargeted to the item's block span. The plan-canvas floating popout is REMOVED.

  T1  reveal on SEGMENT select (the @5488432 P0 fix): clicking the cam-path block reveals
      the strip OVERLAID right under that lane — panel is a .tl-body child (outside the
      rebuilt #tlLanes innerHTML, audit L6-1), points at u=0/1 map the block span
      (laneX + u*blockW), playhead line inside the item, and the stage canvas geometry is
      selection-INDEPENDENT (the pixel-oracle m5 contract — no layout space taken)
  T2  reveal via the CAMERA fallback: deselect the segment, select the camera object → the
      strip still reveals (heightMove's original branch); a non-camera selection hides it
  T3  edit round-trip: pointerdown on the curve line INSERTS a point; drag + release → the
      scene JSON's cam-path heightCurve carries it (u/heightM), playhead returns (releaseCurve)
  T4  playback evaluation unchanged: seek mid-item → the camera marker's evaluated Y equals
      heightAt(curve, u) (tracks.js:366 curve-replaces-Y; the plan oracle covers curves.js)
  T5  the refresh guard (audit L6-1): a store change while plan.curveDrag is open does NOT
      rebuild the lanes (the lane element survives); the strip panel node is stable across
      normal rebuilds (persistent overlay)
  T6  stays visible while PLAYING, disabled (the original `locked` semantics — grayed, not
      hidden); re-enabled on stop
  T7  deselect hides: empty-lane click → panel display none
  T8  console errors == 0

Run: python3 scripts/r20_height_e2e.py [--only T1,T2,...]
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "pixel_oracle"))
import ab

S = "r20l6l3"
BASE = "http://localhost:3000/editor/index.html"
URL = BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=r20l6e2e"
TMP = "/tmp/r20l6"
os.makedirs(TMP, exist_ok=True)
PASS, FAIL = [], []
ONLY = None
if len(sys.argv) > 1 and sys.argv[1] == "--only":
    ONLY = set(sys.argv[2].split(","))


def check(name, cond, detail=""):
    tid = name.split()[0]
    if ONLY and tid not in ONLY:
        return
    (PASS if cond else FAIL).append(name)
    print(("PASS " if cond else "FAIL ") + name + (f"  [{detail}]" if detail and not cond else ""))


def ev_file(name, js, wait=0.0):
    if wait:
        time.sleep(wait)
    p = os.path.join(TMP, name + ".js")
    with open(p, "w") as f:
        f.write(js)
    return ab.eval_file(S, p)


def parse(r):
    if isinstance(r, (dict, list)):
        return r
    try:
        return json.loads(str(r))
    except Exception:
        return {}


# ================================================================= bootstrap + fixture
ab.close(S)
time.sleep(1)
ab.open_url(S, URL)
time.sleep(6)

# Fixture: one camera with a cam-path (2 anchors, arc 6m @ 1 m/s → duration 6s). The sample
# already carries a walker lane so the strip-docking has a lane below to NOT cover.
r = ev_file("setup", r'''
(() => {
  const a = window.__app, os = a.objects, show = a.show;
  const out = {};
  out.cam = os.add({ kind: 'camera', name: 'HeightCam', position: [0, 2, 0],
    rotation: [0, 0, 0], scale: [1, 1, 1] });
  const it = show.addItem(out.cam, { kind: 'cam-path', anchors: [
    { pos: [-3, 2, 0], in: [0, 0, 0], out: [1, 0, 0] },
    { pos: [3, 2, 0], in: [-1, 0, 0], out: [0, 0, 0] }], speedUnitsPerS: 1, aim: 'travel' });
  out.itemId = it.id;
  out.trackId = show.show.tracks.find(t => t.characterId === out.cam).id;
  out.lanes = show.show.tracks.length;
  a._ui.refreshTimeline();
  out.okMesh = !!a.meshById.get(out.cam);
  return JSON.stringify(out);
})()
''')
FX = parse(r)
for k in ("cam", "itemId", "trackId"):
    assert FX.get(k), f"setup missing {k}: {r}"
check("SETUP camera + cam-path fixture", FX.get("okMesh") and FX.get("lanes", 0) >= 2, str(FX))

# fixture ids are injected as a JS var (no %-formatting hazards in the templates; `var` —
# top-level const in an eval persists in the page's lexical env and collides on redeclare)
PREAMBLE = "var FX = " + json.dumps(FX) + ";\n"


def fx(js):
    return PREAMBLE + js


# ================================================================= T1: reveal on segment select
r = ev_file("t1", fx(r'''
(async () => {
  const a = window.__app;
  const out = {};
  const canvas = a.renderer.domElement;
  const canvasH0 = canvas.getBoundingClientRect().height;
  // strip hidden before any selection
  a.page.selectedSegment = null;
  a._ui.refreshTimeline();
  const panel0 = document.querySelector('.tl-curve-strip');
  out.hiddenBefore = panel0?.style.display === 'none';
  // click the cam-path BLOCK (the natural edit entry — the P0 fix)
  const blk = document.querySelector(`.blk[data-item="${FX.itemId}"]`);
  blk.click();
  await new Promise(r => setTimeout(r, 250));
  const panel = document.querySelector('.tl-curve-strip');
  out.visible = panel?.style.display === 'flex';
  out.inTlBody = panel?.parentElement?.id === 'tlBody';          // OUTSIDE #tlLanes (audit L6-1)
  const lane = document.querySelector(`.lane[data-track="${FX.trackId}"]`);
  const lr = lane.getBoundingClientRect(), pr = panel.getBoundingClientRect();
  out.dockedUnderLane = Math.abs(pr.top - lr.bottom) < 1.5;      // overlaid right below the row
  out.canvasStable = Math.abs(canvas.getBoundingClientRect().height - canvasH0) < 0.5;   // NO layout space
  // u-domain = the block span: points at u=0/1 sit at laneX / laneX + blockW
  const svg = panel.querySelector('svg.curve-chart');
  const pts = [...svg.querySelectorAll('.curve-point')];
  const pps = a._tl.pps, gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lane-gutter'));
  const item = a.show.show.tracks.find(t => t.id === FX.trackId).items.find(i => i.id === FX.itemId);
  const dur = a.plan.heightMove().durationS;
  out.pts = pts.length;
  out.x0 = +pts[0].getAttribute('cx');
  out.x1 = +pts[pts.length - 1].getAttribute('cx');
  out.expX0 = gutter + item.startS * pps;
  out.expX1 = gutter + (item.startS + dur) * pps;
  // playhead line inside the item (seek mid-item)
  a.page.seek(item.startS + dur / 2);
  a._ui.refreshHeightStrip();
  await new Promise(r => setTimeout(r, 150));
  const line = svg.querySelector('.curve-playhead');
  out.playheadX = line ? +line.getAttribute('x1') : null;
  out.expPlayheadX = gutter + (item.startS + dur / 2) * pps;
  return JSON.stringify(out);
})()
'''))
d = parse(r)
check("T1 strip reveals under the lane on SEGMENT select (P0 @5488432)",
      d.get("visible") and d.get("inTlBody") and d.get("dockedUnderLane") and d.get("hiddenBefore"),
      str(d))
check("T1 overlay takes NO layout space (canvas geometry selection-independent)",
      d.get("canvasStable"), str(d))
check("T1 u-domain maps the item's block span (u=0/1 at the block edges)",
      d.get("pts") == 2 and abs((d.get("x0") or -9) - (d.get("expX0") or -8)) < 2 and abs((d.get("x1") or -9) - (d.get("expX1") or -8)) < 2,
      str(d))
check("T1 playhead tick inside the item", d.get("playheadX") is not None and abs(d["playheadX"] - d["expPlayheadX"]) < 2, str(d))

# ================================================================= T2: reveal via the camera fallback
r = ev_file("t2", fx(r'''
(async () => {
  const a = window.__app;
  const out = {};
  a.page.selectedSegment = null;              // no segment selected…
  a.objects.select([FX.cam]);                 // …the CAMERA object instead
  await new Promise(r => setTimeout(r, 300));
  const panel = document.querySelector('.tl-curve-strip');
  out.cameraFallbackShows = panel?.style.display === 'flex';
  const hm = a.plan.heightMove();
  out.hmItem = hm?.itemId === FX.itemId;
  // a NON-camera object selection hides it (the sample's cube)
  const cube = Object.keys(a.objects.all()).find(id => a.objects.get(id).kind === 'cube');
  a.objects.select([cube]);
  await new Promise(r => setTimeout(r, 300));
  out.cubeHides = document.querySelector('.tl-curve-strip')?.style.display === 'none';
  return JSON.stringify(out);
})()
'''))
d = parse(r)
check("T2 camera-object fallback reveals; non-camera hides",
      d.get("cameraFallbackShows") and d.get("hmItem") and d.get("cubeHides"), str(d))

# ================================================================= T3: edit round-trip (drag → heightCurve)
r = ev_file("t3", fx(r'''
(async () => {
  const a = window.__app;
  const out = {};
  a.page.selectedSegment = { trackId: FX.trackId, itemId: FX.itemId };
  a.page.seek(0);
  a._ui.refreshTimeline();
  const panel = document.querySelector('.tl-curve-strip');
  const svg = panel.querySelector('svg.curve-chart');
  const svgR = svg.getBoundingClientRect();
  const pxScale = svg.clientWidth / (svgR.width || 1);
  const toClient = (x, y) => ({ clientX: svgR.left + x / pxScale, clientY: svgR.top + y / pxScale });
  const fire = (type, opts) => svg.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 7, ...opts }));
  const hm = a.plan.heightMove();
  const laneX = 110, blockW = hm.durationS * a._tl.pps;   // gutter 110 + startS 0
  const yOf = h => 14 + 64 - 8 - (h / hm.maxM) * (64 - 16);
  // press ON the polyline at u=0.5, height = the anchor default (flat → anchor Y 2m)
  const mid = toClient(laneX + blockW * 0.5, yOf(2));
  fire('pointerdown', mid);
  out.dragOpened = !!a.plan.curveDrag;
  // drag the fresh point up to ~ (0.52, 3.6m)
  const up = toClient(laneX + blockW * 0.52, yOf(3.6));
  fire('pointermove', up);
  fire('pointermove', up);
  fire('pointerup', up);
  await new Promise(r => setTimeout(r, 200));
  out.dragClosed = !a.plan.curveDrag;
  const scene = a.currentSceneJSON();
  const item = scene.show.tracks.find(t => t.id === FX.trackId).items.find(i => i.id === FX.itemId);
  const c = item.heightCurve || [];
  out.n = c.length;
  out.mid = c.length === 3 ? { u: +c[1].u.toFixed(3), h: +c[1].heightM.toFixed(2) } : null;
  out.endpointsHeld = c.length === 3 && +c[0].u.toFixed(3) === 0 && +c[2].u.toFixed(3) === 1
    && +c[0].heightM.toFixed(2) === 2 && +c[2].heightM.toFixed(2) === 2;
  out.playheadReturned = Math.abs(a.page.playheadS - 0) < 1e-6;   // releaseCurve seeks back to returnS
  // point-select re-opens the drag (the bezier-handle path)
  const pts = [...svg.querySelectorAll('.curve-point')];
  fire('pointerdown', toClient(+pts[1].getAttribute('cx'), +pts[1].getAttribute('cy')));
  out.selOpened = !!a.plan.curveDrag;
  fire('pointerup', toClient(+pts[1].getAttribute('cx'), +pts[1].getAttribute('cy')));
  await new Promise(r => setTimeout(r, 150));
  const item2 = a.currentSceneJSON().show.tracks.find(t => t.id === FX.trackId).items.find(i => i.id === FX.itemId);
  out.drawn = !!item2.heightCurve;
  return JSON.stringify(out);
})()
'''))
d = parse(r)
check("T3 press-line INSERTS a point; drag round-trips into heightCurve",
      d.get("dragOpened") and d.get("dragClosed") and d.get("n") == 3 and d.get("mid")
      and 0.45 < d["mid"]["u"] < 0.6 and 3.2 < d["mid"]["h"] < 4.0 and d.get("endpointsHeld"),
      str(d))
check("T3 release seeks the playhead back; point-select re-opens the drag (handles)",
      d.get("playheadReturned") and d.get("selOpened") and d.get("drawn"), str(d))

# ================================================================= T4: playback evaluation unchanged
r = ev_file("t4", fx(r'''
(async () => {
  const a = window.__app;
  const out = {};
  const CV = await import('/editor/js/curves.js');
  const tr = a.show.show.tracks.find(t => t.id === FX.trackId);
  const item = tr.items.find(i => i.id === FX.itemId);
  const dur = a.plan.heightMove().durationS;
  const mesh = a.meshById.get(FX.cam);
  // seek mid-item; the camera marker evaluates (updateCameraMarkers per frame)
  a.page.seek(item.startS + dur / 2);
  await new Promise(r => setTimeout(r, 400));
  const pose = mesh.userData.evalPose;
  out.evalY = pose ? +pose.position.y.toFixed(4) : null;
  out.expectedY = +CV.heightAt(item.heightCurve, 0.5).toFixed(4);
  // and at u=0.25
  a.page.seek(item.startS + dur * 0.25);
  await new Promise(r => setTimeout(r, 400));
  const pose2 = mesh.userData.evalPose;
  out.evalY2 = pose2 ? +pose2.position.y.toFixed(4) : null;
  out.expectedY2 = +CV.heightAt(item.heightCurve, 0.25).toFixed(4);
  a.page.seek(0);
  return JSON.stringify(out);
})()
'''))
d = parse(r)
check("T4 playback evaluation unchanged (curve replaces Y at u=0.5 / u=0.25)",
      d.get("evalY") is not None and abs(d["evalY"] - d["expectedY"]) < 0.01
      and d.get("evalY2") is not None and abs(d["evalY2"] - d["expectedY2"]) < 0.01, str(d))

# ================================================================= T5: the refresh guard + panel persistence
r = ev_file("t5", fx(r'''
(async () => {
  const a = window.__app;
  const out = {};
  a.page.selectedSegment = { trackId: FX.trackId, itemId: FX.itemId };
  a._ui.refreshTimeline();
  const panel = document.querySelector('.tl-curve-strip');
  const lane = document.querySelector('.lane');
  lane.__marker = 'alive';
  // a store change fires while a curve drag is open (the per-move setPathHeightCurve path):
  // the guard must keep the lanes DOM (no innerHTML rebuild) so the strip + drag survive
  a.plan.holdCurve(1, null);
  a.show.setPathHeightCurve(FX.trackId, FX.itemId,
    a.plan.heightMove().curve.map((p, i) => i === 1 ? { ...p, heightM: p.heightM + 0.4 } : p));
  out.laneSurvived = document.querySelector('.lane') === lane && lane.__marker === 'alive';
  out.panelStillVisible = panel.style.display === 'flex';
  a.plan.releaseCurve();
  await new Promise(r => setTimeout(r, 150));
  // a NORMAL refresh rebuilds the lanes but the panel node persists (outside #tlLanes)
  a._ui.refreshTimeline();
  out.panelNodeStable = document.querySelector('.tl-curve-strip') === panel;
  out.laneFresh = document.querySelector('.lane').__marker === undefined;
  // strip position still docked after the rebuild
  const laneR = document.querySelector(`.lane[data-track="${FX.trackId}"]`).getBoundingClientRect();
  const pr = panel.getBoundingClientRect();
  out.stillDocked = Math.abs(pr.top - laneR.bottom) < 1.5;
  return JSON.stringify(out);
})()
'''))
d = parse(r)
check("T5 guard: store change during curveDrag never rebuilds the lanes",
      d.get("laneSurvived") and d.get("panelStillVisible"), str(d))
check("T5 panel node persists across normal rebuilds (persistent overlay)",
      d.get("panelNodeStable") and d.get("laneFresh") and d.get("stillDocked"), str(d))

# ================================================================= T6: visible while playing, disabled
r = ev_file("t6", fx(r'''
(async () => {
  const a = window.__app;
  const out = {};
  a.page.selectedSegment = { trackId: FX.trackId, itemId: FX.itemId };
  a.page.seek(0);
  a._ui.refreshTimeline();
  a.page.play();
  await new Promise(r => setTimeout(r, 500));
  const panel = document.querySelector('.tl-curve-strip');
  const svg = panel.querySelector('svg.curve-chart');
  out.visibleWhilePlaying = panel.style.display === 'flex';       // original: DISABLES, never hides
  out.disabledWhilePlaying = svg.dataset.disabled === '';
  out.playheadMoved = a.page.playheadS > 0.2;
  a.page.stop();
  a.page.seek(0);
  await new Promise(r => setTimeout(r, 400));
  out.reEnabled = document.querySelector('.tl-curve-strip svg').dataset.disabled === undefined;
  return JSON.stringify(out);
})()
'''))
d = parse(r)
check("T6 stays VISIBLE while playing (grayed, not hidden); re-enabled on stop",
      d.get("visibleWhilePlaying") and d.get("disabledWhilePlaying") and d.get("playheadMoved") and d.get("reEnabled"), str(d))

# ================================================================= T7: deselect hides
r = ev_file("t7", fx(r'''
(async () => {
  const a = window.__app;
  const out = {};
  a.page.selectedSegment = { trackId: FX.trackId, itemId: FX.itemId, tS: 0 };
  a._ui.refreshTimeline();
  // empty-lane click clears the selected segment (the live clearFocus path)
  const lb = document.querySelector('.lane-body');
  lb.click();
  await new Promise(r => setTimeout(r, 200));
  out.hidden = document.querySelector('.tl-curve-strip')?.style.display === 'none';
  out.segmentCleared = a.page.selectedSegment === null;
  return JSON.stringify(out);
})()
'''))
d = parse(r)
check("T7 deselect hides the strip", d.get("hidden") and d.get("segmentCleared"), str(d))

# ================================================================= T8: console errors
errs = ab.console_errors(S)
check("T8 console errors == 0", not errs, str(errs)[:300])

print()
print(f"==== r20 L6 height-strip E2E: {len(PASS)} PASS / {len(FAIL)} FAIL ====")
if FAIL:
    print("FAILED:")
    for f in FAIL:
        print("  " + f)
sys.exit(1 if FAIL else 0)
