#!/usr/bin/env python3
"""R16 probe: search the bundle for signatures (char offsets)."""
import re, sys, os

BUNDLE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'analysis', 'index-DBE17t4T.js')
SRC = open(BUNDLE, encoding='utf-8', errors='replace').read()

def ctx(pat, before=100, after=200, limit=10, flags=0):
    print(f"\n===== {pat} =====")
    n = 0
    for m in re.finditer(pat, SRC, flags):
        if n >= limit: break
        s = max(0, m.start()-before); e = min(len(SRC), m.end()+after)
        print(f"--- @{m.start()} ---")
        print(SRC[s:e].replace("\n", "\\n"))
        n += 1
    if n == 0: print("(no hits)")

for pat in sys.argv[1:]:
    ctx(pat)
