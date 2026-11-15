#!/usr/bin/env python3
"""Extract exact bundle regions for the humanoid/figure system into extracted/humanoid_raw.js."""
import re

SRC = open("/home/z/flick-3dEditor/analysis/index-DBE17t4T.js", encoding="utf-8").read()

def F(pat):
    i = SRC.find(pat)
    assert i >= 0, f"NOT FOUND: {pat!r}"
    return i

REGIONS = [
    ("simple_figure constants + contrast picker (RIr sA PP Nie FIr OIr LIr Pie DIr Pst BIr HIr aqt)",
     F("const RIr=1.299"), F("const Rst=22") + 120),
    ("figure construction + component subjects (eat tat nBe Zqt Kqt nat o$ DNr LU HNr rat $Nr VNr Xqt)",
     F("function eat(t=["), F("const DU=t=>")),
    ("humanoid GLB constants + material override + placeholder + dispose (c5r Hhe jP d5r $he u5r Rrt Kd)",
     F('const c5r="/assets/humanoid'), F("const Frt=128")),
    ("library tile preview classes (y5r: 128px orbit preview; D5r: clip tile preview w/ setClip)",
     F("const Frt=128"), F("const Hrt=128")),
    ("46-clip catalog Lhe + duration map XSr/IDe + action kinds",
     F('const Lhe=[{id:"a_tpose"'), F('const $v="application/x-stage-action"') + 60),
    ("rig math: euler/lerp/interp + headRotation Kae + rig-transform Vzt/T2r + ground constants + path resample",
     F("function bbe("), F("function I2r(") + 200),
    ("gaze solver + lookAt->bone offsets (XOr YOr CZt Wat xM EZt kje jZt IZt)",
     F("const XOr=70"), F("const JOr=60") + 40),
    ("stage mesh manager AWr: primitives, humanoid load+normalize, playback b(), rig offsets g(), colors, labels, N() sync",
     F("function fWr("), F("function jGr(") - 40),
    ("show playback director jGr: ground raycast k(), L() rig/head sync, ue() performers, ye() reset, je.tick",
     F("function jGr("), F("const IGr=") + 40),
    ("performer state sampler tyr/eEe + cam-path math + yd/rx/She/$tt/Vtt + Q0",
     F("function _he(t,e)"), F('const nDe="182"') + 40),
    ("rig joint pickable spheres (bqr yqr vqr xqr)",
     F("const bqr="), F("const Bot=") + 20),
    ("plan-canvas 2D figure drawing (EDr: PP/Nie/Pie mirror) + footprint Dst",
     F("function Dst("), F("function dqt(") + 20),
    ("objects store mutators: setObjectAnimation/Playing/Pose, setPersonKind, ere default",
     F("setObjectAnimation=(e,n)"), F("rotateAvailable=Ne(!0)") + 40),
    ("ere default animation + person defaults (nL rMr V2e ere Bst rL sL)",
     F('ere={animation:{clip:"idle"'), F("function aMr(") + 30),
    ("plan-canvas figure drawing EDr (2D PP/Nie/Pie/headYaw mirror)",
     F("function EDr("), F("function VZt(") + 20),
    ("rig editor: Dzr world->local joint delta + pWr controls/drag handler (setLiveRigDrag, captureFocusedRigPose)",
     F("function Dzr("), F("function G(){V.setFromQuaternion") + 500),
]

out = []
out.append("// RAW EXCERPTS — bundle index-DBE17t4T.js (13,457,064 bytes, one line)")
out.append("// humanoid + simple_figure character system. Extracted by tmp_c/extract_raw.py")
out.append("// Byte offsets given per region header. De-minification: manual (names preserved).\n")
for label, s, e in REGIONS:
    out.append("\n/*" + "=" * 100)
    out.append(f" * {label}")
    out.append(f" * bytes [{s}..{e}]")
    out.append("=" * 100 + "*/")
    out.append(SRC[s:e])
    out.append("")
open("/home/z/flick-3dEditor/analysis/extracted/humanoid_raw.js", "w").write("\n".join(out))
print("wrote", len("\n".join(out)), "chars")
for label, s, e in REGIONS:
    print(f"  [{s:8d}..{e:8d}] {e-s:6d}B  {label[:70]}")
