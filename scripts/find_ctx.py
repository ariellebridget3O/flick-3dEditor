#!/usr/bin/env python3
"""Find contexts around multiple signatures in the bundle."""
import sys, re
import pathlib

BUNDLE = str(pathlib.Path(__file__).resolve().parents[1] / "analysis/index-DBE17t4T.js")
src = open(BUNDLE, encoding="utf-8", errors="replace").read()

def ctx(pat, before=200, after=200, limit=8, flags=0):
    print(f"\n{'='*20} {pat} {'='*20}")
    n = 0
    for m in re.finditer(pat, src, flags):
        if n >= limit: break
        s = max(0, m.start()-before); e = min(len(src), m.end()+after)
        print(f"--- @{m.start()} ---")
        print(src[s:e].replace("\n", "\\n"))
        n += 1
    if n == 0: print("(no hits)")

for pat in sys.argv[1:]:
    ctx(pat)
