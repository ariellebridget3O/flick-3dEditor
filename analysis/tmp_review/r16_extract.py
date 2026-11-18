#!/usr/bin/env python3
"""r16 review: extract switchPersonKind-family slices from the ground-truth bundle.

Writes slices to analysis/tmp_review/r16/*.txt for Read-tool inspection
(plain bash display eats [h control sequences).
Also reports code-point vs UTF-16 offset drift.
"""
import os, re, sys

BUNDLE = "/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js"
OUT = "/home/z/my-project/flick-3dEditor/analysis/tmp_review/r16"
os.makedirs(OUT, exist_ok=True)

src = open(BUNDLE, encoding="utf-8", errors="replace").read()

# UTF-16 drift check: count astral chars (code points > 0xFFFF)
astral = sum(1 for c in src if ord(c) > 0xFFFF)
print(f"total code points: {len(src)}  astral chars: {astral}  utf16 units: {len(src)+astral}")

def u16off(cp_off):
    """code-point offset -> utf16 code-unit offset"""
    return cp_off + sum(1 for c in src[:cp_off] if ord(c) > 0xFFFF)

def dump(name, sig, before, after, limit=6):
    pat = re.compile(re.escape(sig))
    hits = [m.start() for m in pat.finditer(src)]
    print(f"\n### {name}: {len(hits)} hit(s) for {sig!r}")
    for i, cp in enumerate(hits[:limit]):
        s = max(0, cp - before); e = min(len(src), cp + after)
        txt = src[s:e]
        fn = f"{OUT}/{name}_{i}_cp{cp}.txt"
        with open(fn, "w", encoding="utf-8") as f:
            f.write(f"// sig={sig!r} cp_offset={cp} u16_offset={u16off(cp)} span_cp={e-s}\n")
            f.write(txt)
        print(f"  cp={cp} u16={u16off(cp)} -> {fn}")

# 1. switchPersonKind + pickPersonKind
dump("switchPersonKind", "switchPersonKind=(e,n,r)=>", 100, 1400, 4)
# 2. UNr/Yqt/zNr
dump("UNr", "function UNr(t,e,n)", 300, 700, 4)
dump("Yqt", "const Yqt=", 100, 300, 4)
dump("zNr", "const zNr=", 100, 1200, 4)
# 3. setPersonKind
dump("setPersonKind", "setPersonKind=(e,n)=>", 100, 900, 4)
# 4. defaultName
dump("defaultName", "defaultName=(e,n)=>", 100, 1400, 4)
# 5. removePerformanceItem
dump("removePerformanceItem", "removePerformanceItem=", 200, 600, 6)
# 6. ere const
dump("ere", 'ere={animation:{clip:"idle",playing:!1}}', 200, 200, 4)
dump("ereAlt", 'clip:"idle",playing:!1}}', 400, 100, 6)
# 7. addObject
dump("addObject", "addObject=", 100, 1200, 6)
# 8. analytics recordPersonSwitched
dump("recordPersonSwitched", "recordPersonSwitched", 200, 400, 6)
# 9. i18n labels
dump("avAkAt", 'id:"avAkAt"', 150, 250, 6)
dump("DhTbJv", 'id:"DhTbJv"', 150, 250, 6)
dump("YUAoyO", 'id:"YUAoyO"', 150, 250, 6)
# 10. updateTrackItems (repack via lje)
dump("updateTrackItems", "updateTrackItems=", 100, 900, 4)
# 11. pickPersonKind
dump("pickPersonKind", "pickPersonKind=", 100, 900, 6)
# 12. finishPerformancePaint / performancePaint.peek
dump("performancePaint", "performancePaint", 150, 250, 12)
print("\ndone ->", OUT)
