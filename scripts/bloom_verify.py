#!/usr/bin/env python3
"""bloom_verify.py — prove the bloom chain CONTRIBUTES pixels (not just compiles).

Fresh page, realistic sky, hdr on (finish path). The high-pass threshold sweep is
the end-to-end proof: thr 0.4 + bloom 1.0 must differ from thr 1.0 + bloom 0.35
in the regions the chain feeds (whole-frame glow + sun disc). If identical, the
chain is still dead. Also probes the bright RT content directly via the app's
bloom object (render chain into a probe RT is NOT exposed — the sweep is the E2E
check; plus renderer.info draw-call count delta bloom-on vs off).
"""
import sys, time, os
sys.path.insert(0, '/home/z/my-project/flick-3dEditor/scripts/pixel_oracle')
import ab, bb
import numpy as np
from PIL import Image

SESS = 'bloomqa'
BASE = 'http://localhost:3000/editor/index.html'
FIX = 'samples/live_oracle_r11_base.json'
OUT = '/home/z/my-project/flick-3dEditor/analysis/tmp_r13_hdr'

def ev(code, timeout=120):
    r = ab.eval_js(SESS, code, timeout=timeout)
    s = str(r)
    if s in ('{}', 'undefined', ''):
        raise RuntimeError(f'SILENT EVAL FAILURE: {code[:100]}')
    return s

def cap(name, w=1000, h=375):
    p = f'{OUT}/{name}.png'
    bb.capture_png(SESS, p, w=w, h=h)
    return p

def diff(a, b, region=None):
    A = np.asarray(Image.open(a), dtype=np.int16)
    B = np.asarray(Image.open(b), dtype=np.int16)
    if region:
        x0, y0, x1, y1 = region
        A = A[y0:y1, x0:x1]; B = B[y0:y1, x0:x1]
    d = np.abs(A - B)
    return {'mean': round(float(d.mean()), 3), 'max': int(d.max()),
            'changed_px': int((d.max(axis=2) > 2).sum())}

print('== boot (fresh) ==')
ab.close(SESS)
ab.set_viewport(SESS, 1264, 639)
ab.open_url(SESS, f'{BASE}?scene={FIX}&noAutosave=1&finish=0&cloudsGate=0&v={int(time.time())}')
ab.wait(SESS, 1500)
r = ev("(async()=>{const a=window.__app;for(let i=0;i<30;i++){if(a&&a.light&&Math.abs(a.light.azimuthDeg-128.66)<0.01)break;await new Promise(r=>setTimeout(r,500))}return 'ok '+(a&&a.light?a.light.azimuthDeg:'NO')})()", timeout=90)
print(' ', r)
ab.wait(SESS, 2500)

print('== realistic + hdr on, defaults (thr 1.0, bloom .35) ==')
ev("(()=>{const a=window.__app;a.setSkyStyle('realistic');a.setHdr({enabled:true});return 'ok'})()")
ab.wait(SESS, 2500)
p1 = cap('bloom_thr10')
info1 = ev("(()=>{const a=window.__app;return JSON.stringify({calls:a.renderer.info.render.calls,tri:a.renderer.info.render.triangles})})()")
print(' draw calls hdr-on:', info1)

print('== bloom 1.0 + thr 0.4 (strong bloom) ==')
ev("(()=>{const a=window.__app;a.setHdr({bloom:1.0,bloomThreshold:0.4});return JSON.stringify({h:a.light.hdr.bloom,t:a.light.hdr.bloomThreshold})})()")
ab.wait(SESS, 800)
p2 = cap('bloom_thr04')
d = diff(p1, p2)
print(' thr1.0 vs thr0.4:', d)

print('== bloom 0 (pure ACES) vs thr 0.4 bloom 1.0 (bloom only difference) ==')
ev("(()=>{const a=window.__app;a.setHdr({bloom:0.0});return 'ok'})()")
ab.wait(SESS, 800)
p3 = cap('bloom_zero')
d2 = diff(p3, p2)
print(' bloom0 vs bloom1-thr0.4:', d2)
d3 = diff(p3, p1)
print(' bloom0 vs bloom.35-thr1.0:', d3)

print('== sun disc region check (bloom halo should be local) ==')
# find the sun: aim the camera at the sun azimuth/elevation is overkill —
# scan the thr-diff map for its bounding box
A = np.asarray(Image.open(p1), dtype=np.int16)
B = np.asarray(Image.open(p2), dtype=np.int16)
D = np.abs(A - B).max(axis=2)
ys, xs = np.nonzero(D > 2)
if len(xs):
    print(f' diff bbox x {xs.min()}-{xs.max()} y {ys.min()}-{ys.max()}, count {len(xs)}, max {D.max()}')
else:
    print(' NO DIFFERENT PIXELS — bloom chain dead')

print('== console errors ==')
import subprocess
c = subprocess.run(['agent-browser', '--session', SESS, 'console'], capture_output=True, text=True, timeout=120).stdout
errs = [l for l in c.splitlines() if 'error' in l.lower()]
print(' console error lines:', len(errs))
for l in errs[:6]: print('  ', l[:160])
print('BLOOM VERIFY DONE')
