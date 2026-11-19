#!/usr/bin/env python3
# Build reference_r17.mjs — verbatim bundle units for the drive/rig/zoom family, extracted
# at their offsets from analysis/index-DBE17t4T.js (SKILL #50: the reference side runs the
# bundle's own code). Assembly = prepend the constants, rewrite free identifiers to locals.
import re

src = open('analysis/index-DBE17t4T.js').read()

def grab(sig, end_pat, name):
    i = src.find(sig)
    assert i >= 0, f'{name} not found'
    j = src.find(end_pat, i + len(sig))
    assert j > i, f'{name} end not found'
    return src[i:j]

# ---- constants (verbatim bytes) ----
# i$ sits after LQi. Extract precisely:
i_is = src.find('const i$=')
i_bg = src.find('BGt=', i_is)
assert i_is > 0 and i_bg > i_is
i_g2e = src.find('g2e={', i_bg)
i_gq = src.find('gq={', i_g2e)
i_hgt = src.find('HGt=', i_gq)
i_end = src.find('const Eie=', i_hgt)
table = src[i_is:i_end]           # i$, BGt, g2e, gq, HGt, $Gt, VGt, Grt, DCr..VCr helpers
eie = src[i_end:src.find('function HDe', i_end)]  # Eie, UCr, zCr, jie, HDe..GCr region
# HDe..GCr: grab from 'const Eie=' through 'const Iie'
i_iie = src.find('const Iie=')
i_qcr = src.find('function qCr(', i_iie)
assert i_qcr > 0
helpers2 = src[i_end:src.find('const ZCr', i_qcr)]   # Eie..GCr + Iie + DQi + qCr

# ---- function bodies ----
fns = []
fns.append(grab('function RU(', 'function XCr(', 'RU+Zrt'))
fns.append(grab('function XCr(', 'function YCr(', 'XCr'))
fns.append(grab('function YCr(', 'function tEr(', 'YCr'))  # includes GGt/Krt/Xrt/cje/QCr/JCr/eEr
fns.append(grab('function tEr(', 'function iEr(', 'tEr-nEr-Yrt'))
fns.append(grab('function hEr(', 'const pEr=', 'hEr'))
fns.append(grab('function Vhe(', 'const OGt=', 'Vhe-ECr'))
fns.append(grab('const OGt=', 'const TY=', 'OGt-jCr-ICr'))
fns.append(grab('function bEr(', 'const wEr=', 'zoom-family'))
fns.append(grab('function eC(', 'function DGt(', 'eC'))
fns.append(grab('function DGt(', 'function FCr(', 'DGt'))
fns.append(grab('function FCr(', 'function FQi(', 'FCr+OCr'))

# Build the module source: constants + functions, exporting what the runner needs.
mod = []
mod.append('// ---- constants (verbatim) ----')
mod.append(table)
mod.append(helpers2)
mod.append("const q_=14,WA=200;")
mod.append("const TCr=1;")
mod.append("const Tye=4,Aye=3,eWr=.4;")
mod.append("const ZCr=.6,KCr=.6;")
mod.append("const pEr=.35,fEr=.15,mEr=6e-4,gEr=33;")
mod.append('''
// destructure the verbatim names into module scope (they were declared as consts above)
''')
mod.append(fns[0])   # RU
mod.append(fns[8])   # eC
mod.append(fns[9])   # DGt
mod.append(fns[10])  # FCr + OCr (FCr comes first in the bundle)
mod.append(fns[1])   # XCr
mod.append(fns[2])   # GGt..YCr family
mod.append(fns[3])   # tEr/nEr/Yrt
mod.append(fns[4])   # hEr
mod.append(fns[5])   # Vhe/ECr
mod.append(fns[6])   # OGt/jCr/ICr
mod.append(fns[7])   # bEr/yEr/vEr/xEr
mod.append('''
// exports for the runner (bundle names -> runner labels)
export {
  i$ as RIG_KEYS, BGt as RIG_DEFAULT, gq as CAMERA_RIGS, HGt as SPEED_STEPS, $Gt as PAN_STEPS,
  VGt as PAN_DEFAULT, Grt as DEFAULT_SPEEDS, jie as DEFAULT_WEIGHTS, Eie as WEIGHT_MAX,
  zCr as WEIGHT_DEADZONE, UCr as WEIGHT_STEP,
  DCr as isRigKey, UGt as isPanOnly, BCr as speedPicker, HCr as carrySpeeds, qrt as stepSpeed,
  $Cr as clampToSteps, VCr as validateSpeeds,
  HDe as clampWeight, zGt as weightScale, WCr as rigWithWeight, WGt as validateWeight, GCr as validateWeights,
  hEr as cycleRigKey, ECr as speedValueLabel,
  RU as springStep, cje as springZero, GGt as springsStep, XCr as springValues,
  DGt as curveStick, eC as quatRotate, OCr as levelBasis, FCr as stickVelocity,
  JCr as panStep, QCr as panIdle, qCr as pitchStep, DQi as clampPitch, Yrt as turnRate,
  YCr as moveStep, tEr as sidewaysMps, nEr as rollStep,
  Vhe as clamp01, jCr as zoomMm, ICr as zoomLog, bEr, yEr, vEr, xEr,
  Zrt as MOVE_SPRINGS, Krt as PAN_SPRINGS, Tye, Aye, eWr, TCr as LEVEL_ON_DEG, q_, WA,
};
''')

# verify the assembled module parses
code = '\n'.join(mod)
import subprocess, tempfile, os
with tempfile.NamedTemporaryFile('w', suffix='.mjs', delete=False) as f:
    f.write(code); tmp = f.name
r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
if r.returncode != 0:
    print(r.stderr[:2000]); raise SystemExit(1)
os.unlink(tmp)
open('scripts/oracle/reference_r17.mjs', 'w').write(code)
print('reference_r17.mjs written,', len(code), 'bytes')
