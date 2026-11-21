#!/usr/bin/env python3
"""r21_draw_probe.py — reproduce the draw-start 'first step jump'.

Two scenarios, ghost/char/playhead sampled every ~120ms during a synthetic stroke:
  S1 press NEAR the character (grab easing in play), drag away smoothly.
  S2 press FAR from the character (9m), drag — the leap case.
Also records whether the 3D ghost (_drawPreview) position jumps between samples.
"""
import os, sys, time, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "pixel_oracle"))
import ab

S = "r21draw"
BASE = "http://localhost:3000/editor/index.html"

def stroke_script(px0, py0, px1, py1, steps=8, dwell=0.12):
    return """(function(){
  const a = window.__app;
  const c = document.querySelector('[data-testid=stage-plan]');
  const r = c.getBoundingClientRect();
  const pe = (t,x,y)=>c.dispatchEvent(new PointerEvent(t,{pointerId:77,clientX:r.x+x,clientY:r.y+y,bubbles:true,isPrimary:true,button:0,buttons:t==='pointerup'?0:1}));
  const log = [];
  const snap = (tag) => {
    const st = a.plan.stroke;
    const g = a._drawPreview || (a.page && a.page._drawPreview);
    log.push({tag, at: st ? {x:+st.at.x.toFixed(2), z:+st.at.z.toFixed(2)} : null,
      n: st ? st.samples.length : 0,
      ghost: g ? {x:+g.position[0].toFixed(2), z:+g.position[2].toFixed(2)} : null,
      playhead: +a.page.playheadS.toFixed(2)});
  };
  const px0=%d, py0=%d, px1=%d, py1=%d, steps=%d;
  pe('pointerdown', px0, py0); snap('down');
  for (let i = 1; i <= steps; i++) {
    const x = px0 + (px1-px0)*i/steps, y = py0 + (py1-py0)*i/steps;
    pe('pointermove', x, y); snap('m'+i);
  }
  pe('pointerup', px1, py1); snap('up');
  window.__drawLog = log;
  return JSON.stringify(log);
})()""" % (px0, py0, px1, py1, steps)

def run(name, px0, py0, px1, py1):
    # switch to 2D, ensure draw mode on the humanoid, verify canvas size
    ab.eval_js(S, """(function(){
      const a = window.__app;
      const b2d = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '2D');
      if (b2d && a.page.viewportMode !== 'plan') b2d.click();
      return '2d';
    })()""")
    time.sleep(1.2)
    ab.eval_js(S, """(function(){
      const a = window.__app;
      if (!a.plan.drawing()) {
        const hid = Object.keys(a.objects.all()).find(id => a.objects.get(id).kind === 'humanoid');
        a.objects.select([hid]); document.getElementById('pbDrawBtn').click();
      }
      a.page.seek(0);
      const c = document.querySelector('[data-testid=stage-plan]');
      const r = c.getBoundingClientRect();
      return JSON.stringify({w: r.width, h: r.height, drawing: a.plan.drawing()});
    })()""")
    time.sleep(0.5)
    out = ab.eval_js(S, stroke_script(px0, py0, px1, py1))
    print("=== %s ===" % name)
    try:
        log = json.loads(out)
        for e in log:
            print(e)
        # jump analysis on ghost
        gs = [e["ghost"] for e in log if e.get("ghost")]
        if len(gs) >= 2:
            j = [round(((gs[i+1][0]-gs[i][0])**2 + (gs[i+1][1]-gs[i][1])**2) ** 0.5, 2) for i in range(len(gs)-1)]
            print("ghost step dists:", j, " MAX:", max(j))
    except Exception as ex:
        print("RAW:", out[:800], "ERR", ex)

ab.close(S)
ab.open_url(S, BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=r21draw")
time.sleep(7)

# find the character's plan-canvas px first
pos = ab.eval_js(S, """(function(){
  const a = window.__app;
  const c = document.querySelector('[data-testid=stage-plan]');
  const r = c.getBoundingClientRect();
  // plan view center = world origin typically; use the view transform via a.plan if exposed
  let cx = null, cy = null;
  try { const v = a.plan.view || (a.plan._cache && null); } catch(e){}
  return JSON.stringify({w: r.width, h: r.height});
})()""")
print("canvas", pos)

# S1: assume origin near canvas center (default fit view) — press near center, drag 200px
run("S1 near-press", 400, 150, 600, 150)
time.sleep(0.8)
# S2: press far corner
run("S2 far-press", 150, 150, 600, 160)

errs = ab.console_errors(S)
print("console errors:", len(errs), errs[:3])
