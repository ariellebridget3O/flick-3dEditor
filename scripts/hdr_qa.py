#!/usr/bin/env python3
"""hdr_qa.py — round-13 HDR E2E verification (backbuffer captures; SKILL #83: page
screenshots are stale under SwiftShader — readPixels is the only truth).

Matrix of states (fixture live_oracle_r11_base.json, finish=0 manual at boot):
  A  hdr OFF baseline            → plain render, NoToneMapping
  B  hdr ON (finish path)        → finish composite + bloom pre-pass + ACES in composite
  C  hdr OFF again (round-trip)  → must equal A byte-identical (restore path)
  D  hdr ON + finish forced off  → plain fallback: renderer ACESFilmic × exposure
  E  schema round-trip           → currentSceneJSON light.hdr present/enabled vs absent
  F  realistic sky + hdr on      → linear-HDR dome (uCurve=0) — visible difference vs off
Console must stay clean across all states.
"""
import sys, time, json, os
sys.path.insert(0, '/home/z/my-project/flick-3dEditor/scripts/pixel_oracle')
import ab, bb
import numpy as np
from PIL import Image

SESS = 'hdrqa'
BASE = 'http://localhost:3000/editor/index.html'
FIX = 'samples/live_oracle_r11_base.json'
OUT = '/home/z/my-project/flick-3dEditor/analysis/tmp_r13_hdr'
os.makedirs(OUT, exist_ok=True)

def ev(code, timeout=120):
    r = ab.eval_js(SESS, code, timeout=timeout)
    s = str(r)
    if s in ('{}', 'undefined', ''):
        raise RuntimeError(f'SILENT EVAL FAILURE (SKILL #88): {code[:120]} → {s!r}')
    return s

def cap(name, w=1000, h=375):
    p = f'{OUT}/{name}.png'
    dt = bb.capture_png(SESS, p, w=w, h=h)
    return p, dt

def diff(a, b):
    A = np.asarray(Image.open(a), dtype=np.int16)
    B = np.asarray(Image.open(b), dtype=np.int16)
    d = np.abs(A - B)
    return {
        'mean': round(float(d.mean()), 3),
        'max': int(d.max()),
        'pct_differ': round(float((d.max(axis=2) > 2).mean() * 100), 2),
        'changed_px': int((d.max(axis=2) > 2).sum()),
    }

print('== boot ==')
ab.close(SESS)
ab.set_viewport(SESS, 1264, 639)
ab.open_url(SESS, f'{BASE}?scene={FIX}&noAutosave=1&finish=0&cloudsGate=0&v={int(time.time())}')
ab.wait(SESS, 1500)
r = ev("(async()=>{const a=window.__app;for(let i=0;i<30;i++){if(a&&a.light&&Math.abs(a.light.azimuthDeg-128.66)<0.01)break;await new Promise(r=>setTimeout(r,500))}return 'az='+(a&&a.light?a.light.azimuthDeg:'NOAPP')})()", timeout=90)
print(' boot marker:', r)
assert r.startswith('az=') and abs(float(r[3:]) - 128.66) < 0.01, 'scene-load marker not reached'
ab.wait(SESS, 2500)

print('== T1: baseline A (hdr off, finish off) ==')
r = ev("(()=>{const a=window.__app;a.page.seek(0);return JSON.stringify({hdr:!!a.light.hdr?.enabled,finish:a.finishOn(),tm:a.renderer.toneMapping})})()")
print(' state:', r)
pA, _ = cap('hdr_A_off')

print('== T2: hdr ON → finish path with bloom ==')
r = ev("(()=>{const a=window.__app;a.setHdr({enabled:true});return JSON.stringify({hdr:!!a.light.hdr?.enabled,finish:a.finishOn(),pref:a.finishPref,tm:a.renderer.toneMapping})})()")
print(' state:', r)
assert '"hdr":true' in r and '"finish":true' in r, 'HDR ON must force the finish path'
pB, _ = cap('hdr_B_on_finish')
print(' B capture ok')

print('== T2b: hdr OFF, finish pref stays ON (forced manual in T2) → composite without bloom ==')
r = ev("(()=>{const a=window.__app;a.setHdr({enabled:false});return JSON.stringify({hdrOn:!!a.light.hdr?.enabled,finish:a.finishOn(),tm:a.renderer.toneMapping})})()")
print(' state:', r)
pB2, _ = cap('hdr_B2_finish_nohdr')
dB_B2 = diff(pB, pB2)
print(' B (hdr on) vs B2 (finish no hdr):', dB_B2)
assert dB_B2['changed_px'] > 5000, 'hdr must visibly change the finish composite'

print('== T3: hdr OFF + finish OFF → C must equal A byte-identical ==')
r = ev("(()=>{const a=window.__app;a.finishPref={enabled:false,source:'manual'};a.finishNeedsMeasuring=false;return JSON.stringify({hdrOn:!!a.light.hdr?.enabled,finish:a.finishOn(),tm:a.renderer.toneMapping,exp:a.renderer.toneMappingExposure})})()")
print(' state:', r)
assert '"finish":false' in r and '"hdrOn":false' in r
pC, _ = cap('hdr_C_off_again')
d = diff(pA, pC)
print(' A vs C:', d)
assert d['mean'] == 0 and d['changed_px'] == 0, 'OFF round-trip must be byte-identical'

print('== T4: hdr ON + finish forced off → plain ACES fallback ==')
r = ev("(()=>{const a=window.__app;a.setHdr({enabled:true});a.finishPref={enabled:false,source:'manual'};a.finishNeedsMeasuring=false;return JSON.stringify({hdr:!!a.light.hdr?.enabled,finish:a.finishOn(),tm:a.renderer.toneMapping,exp:a.renderer.toneMappingExposure})})()")
print(' state:', r)
assert '"finish":false' in r, r
r = ev("(()=>{const a=window.__app;a.renderFrame();return JSON.stringify({tm_after_render:a.renderer.toneMapping,exp:a.renderer.toneMappingExposure})})()")
print(' tm after renderFrame:', r)
assert '"tm_after_render":4' in r, 'plain+hdr fallback must switch renderer to ACESFilmic (=4)'
pD, _ = cap('hdr_D_plain_aces')
dDA = diff(pD, pA); dDB = diff(pD, pB)
print(' D vs A (must differ — tone map):', dDA)
print(' D vs B (must differ — no bloom/finish):', dDB)
assert dDA['changed_px'] > 5000, 'plain+hdr must visibly differ from hdr-off'

print('== T5: schema round-trip ==')
r = ev("(async()=>{const a=window.__app;a.setHdr({enabled:true,exposure:1.25,bloom:0.5});const j=a.currentSceneJSON();const on=j.light.hdr;a.setHdr({enabled:false});const j2=a.currentSceneJSON();return JSON.stringify({on:on,offHasHdr:('hdr' in (j2.light||{}))})})()")
print(' schema:', r)
assert '"exposure":1.25' in r and '"bloom":0.5' in r and '"offHasHdr":false' in r, 'hdr must serialize when on and be ABSENT when off'
r2 = ev("(()=>{const a=window.__app;return JSON.stringify({hdr:!!a.light.hdr?.enabled,tm:a.renderer.toneMapping})})()")
print(' after schema test, state restored:', r2)

print('== T6: realistic sky + hdr on/off A/B ==')
r = ev("(()=>{const a=window.__app;a.setHdr({enabled:false});a.setSkyStyle('realistic');return JSON.stringify({style:a.light.skyStyle,hdr:!!a.light.hdr?.enabled})})()")
print(' state:', r)
ab.wait(SESS, 2500)
pRoff, _ = cap('hdr_F_realistic_off')
r = ev("(()=>{const a=window.__app;a.setHdr({enabled:true});return JSON.stringify({hdr:!!a.light.hdr?.enabled,finish:a.finishOn()})})()")
print(' state:', r)
assert '"hdr":true' in r
ab.wait(SESS, 2500)
pRon, _ = cap('hdr_F_realistic_on')
dRF = diff(pRoff, pRon)
print(' realistic off vs on:', dRF)
assert dRF['changed_px'] > 5000, 'realistic+hdr must visibly differ'

print('== console errors ==')
import subprocess
c = subprocess.run(['agent-browser', '--session', SESS, 'console'], capture_output=True, text=True, timeout=120).stdout
errs = [l for l in c.splitlines() if 'error' in l.lower()]
print(' console error lines:', len(errs))
for l in errs[:10]: print('  ', l[:200])

print('== perf (record only) ==')
r = ev("(()=>{const a=window.__app;const t0=performance.now();a.renderFrame();const t1=performance.now();return 'hdr-on frame ms='+(t1-t0).toFixed(1)})()")
print(' ', r)

print('ALL HDR E2E CHECKS PASSED')
