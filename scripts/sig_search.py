#!/usr/bin/env python3
"""Signature-based subsystem extraction from the flick bundle (names reshuffle per build).
Finds code by content shape, dumps generous context."""
import os, re, sys, json

BUNDLE = '/home/z/flick-3dEditor/analysis/index-DBE17t4T.js'
OUT = '/home/z/flick-3dEditor/analysis/extracted'
os.makedirs(OUT, exist_ok=True)
src = open(BUNDLE, encoding='utf-8').read()
N = len(src)

def dumps(sig, label, before=400, after=4000, limit=6, fname=None):
    hits = [m.start() for m in re.finditer(re.escape(sig), src)][:limit]
    out = [f"// #### SIG '{sig}' — {label} — {len(hits)} hits ####\n"]
    for i, off in enumerate(hits):
        a = max(0, off-before); b = min(N, off+after)
        out.append(f"/* ==== hit[{i}] @{off} ==== */\n" + src[a:b] + "\n\n")
    blob = ''.join(out)
    if fname:
        with open(fname,'a') as f: f.write(blob)
    return blob, hits

# ============ P1: RENDERER + DAYLIGHT + SKY + FOG ============
f = f'{OUT}/sig_renderer.js'
open(f,'w').write('// Renderer / scene construction / floor / fog / shadows signatures\n\n')
dumps('PlaneGeometry(80000', 'floor plane 80000', 3000, 3000, 3, f)
dumps('FogExp2', 'fog exp2', 1500, 1500, 4, f)
dumps('antialias:!0', 'renderer antialias', 800, 2500, 4, f)
dumps('outputColorSpace', 'colorspace', 600, 1200, 3, f)
dumps('shadowMap', 'shadow map enable', 800, 2000, 3, f)
dumps('PCFSoft', 'PCF soft', 500, 800, 3, f)
dumps('HemisphereLight', 'hemisphere fill light', 1200, 1800, 4, f)
dumps('DirectionalLight', 'sun light', 1000, 1500, 5, f)
dumps('azimuthDeg', 'azimuth usage (light UI + normalize)', 300, 900, 8, f)

# ============ P1: DAYLIGHT TABLE + APPLY ============
f = f'{OUT}/sig_daylight.js'
open(f,'w').write('// Daylight table + interpolation + apply + sky shader\n\n')
dumps('HY=[{elevationDeg', 'daylight 8-stop table def', 200, 4200, 1, f)
dumps('elevationDeg:-30', 'table stop -30', 300, 3800, 2, f)
dumps('sunColor', 'sunColor refs (apply fn)', 500, 1200, 10, f)
dumps('fillSky', 'fillSky refs', 500, 1000, 8, f)
dumps('0xdfdcf0', 'full-day zenith hex', 600, 2400, 3, f) if '0xdfdcf0' in src else dumps('dfdcf0', 'full-day zenith hex*', 400, 1600, 3, f)
dumps('zenith', 'zenith uniform usage', 400, 900, 12, f)
dumps('.55', 'pow 0.55 sky', 300, 600, 2, f) if False else None
dumps('pow(z', 'sky shader pow mix', 800, 2000, 6, f)
dumps('flare', 'flare uniform', 500, 1000, 8, f)

# ============ P1: SELECTION SHADER ============
f = f'{OUT}/sig_selection.js'
open(f,'w').write('// Selection rounded-box shader + gizmos\n\n')
dumps('sdRoundBox', 'rounded box SDF', 600, 3600, 3, f)
dumps('length(max(abs', 'box sdf classic', 1000, 3000, 4, f)
dumps('uBand', 'band uniform', 800, 2500, 4, f)
dumps('frustum', 'frustum marker', 600, 1500, 6, f)

# ============ P2: ANIMATION / TRACKS ============
f = f'{OUT}/sig_tracks.js'
open(f,'w').write('// Track system / item eval / camera rigs / clips\n\n')
dumps('a_tpose', 'clip catalog', 300, 2600, 2, f)
dumps('pistol_reload', 'clip catalog 2', 200, 1600, 2, f)
dumps('speedUnitsPerS', 'path speed', 400, 900, 10, f)
dumps('cam-move', 'cam-move kind', 300, 700, 8, f)
dumps('dolly_zoom', 'dolly presets', 500, 3000, 3, f)
dumps('pan_sweep', 'pan sweep', 500, 2000, 3, f)
dumps('heightCurve', 'heightCurve', 400, 900, 6, f)
dumps('cam-manual', 'cam-manual', 300, 700, 6, f)
dumps('cam-follow', 'cam-follow', 300, 700, 6, f)
dumps('rig-transform', 'rig-transform', 300, 700, 6, f)
dumps('keymap', 'play keymap', 400, 900, 4, f)
dumps('walk_formal', 'gait enum', 300, 700, 4, f)
dumps('steadicam', 'camera rigs', 800, 3000, 3, f)
dumps('stride', 'stride shake', 400, 1200, 6, f)
dumps('AnimationMixer', 'mixer', 600, 1400, 6, f)
dumps('humanoid-B4Yewrzp', 'humanoid glb url', 800, 800, 3, f)

# ============ P1/P2: FOV / focal / aspects ============
f = f'{OUT}/sig_camera.js'
open(f,'w').write('// Camera fov math / focal / aspects / framing\n\n')
dumps('"1.85:1"', 'aspect 1.85', 500, 1800, 3, f)
dumps('2*Math.atan', 'fov from focal', 900, 2600, 4, f)
dumps('focalLengthMm', 'focal field', 300, 700, 10, f)
dumps('maxHeightFraction', 'record framing', 700, 2200, 3, f)

# ============ EDITOR UX: DOM testids ============
f = f'{OUT}/sig_ux.js'
open(f,'w').write('// UI strings / testids / panels\n\n')
dumps('stage-plan', '2D plan canvas', 600, 1500, 3, f)
dumps('data-testid', 'testids', 0, 0, 1, f) if False else None
dumps('Rehearse', 'rehearse button', 800, 2500, 3, f)
dumps('Camera Height', 'camera height slider', 900, 2800, 2, f)
dumps('Time of day', 'time-of-day UI', 900, 2800, 4, f)
dumps('sunlight', 'sunlight UI', 600, 1800, 6, f)
dumps('Azimuth', 'azimuth UI label', 800, 2400, 4, f)
dumps('Elevation', 'elevation UI label', 800, 2400, 4, f)

for fn in ['sig_renderer.js','sig_daylight.js','sig_selection.js','sig_tracks.js','sig_camera.js','sig_ux.js']:
    p = f'{OUT}/{fn}'
    print(fn, os.path.getsize(p) if os.path.exists(p) else 'MISSING')
