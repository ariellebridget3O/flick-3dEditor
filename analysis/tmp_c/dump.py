#!/usr/bin/env python3
"""Utility: search minified bundle for a regex, dump surrounding context windows."""
import re, sys, os

BUNDLE = "/home/z/flick-3dEditor/analysis/index-DBE17t4T.js"

with open(BUNDLE, "r", encoding="utf-8") as f:
    SRC = f.read()

def dump(pattern, width=1200, limit=20, offset_pad=0, unique_windows=False):
    rx = re.compile(pattern)
    n = 0
    seen = set()
    for m in rx.finditer(SRC):
        s = max(0, m.start()-width)
        e = min(len(SRC), m.end()+width)
        key = (s//400, e//400) if unique_windows else (s,e)
        if unique_windows:
            key = s//1000
            if key in seen: continue
            seen.add(key)
        n += 1
        print(f"\n===== match @{m.start()} ({m.group(0)[:60]!r}) =====")
        print(SRC[s:e])
        print(f"===== end @{m.end()} =====")
        if n >= limit:
            print(f"... (limit {limit} reached)")
            break
    if n == 0:
        print(f"NO MATCH for {pattern!r}")
    else:
        print(f"\n### {n} matches shown for {pattern!r}", file=sys.stderr)
    return n

if __name__ == "__main__":
    pat = sys.argv[1]
    width = int(sys.argv[2]) if len(sys.argv) > 2 else 1200
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 20
    uniq = len(sys.argv) > 4 and sys.argv[4] == "uniq"
    dump(pat, width, limit, unique_windows=uniq)
