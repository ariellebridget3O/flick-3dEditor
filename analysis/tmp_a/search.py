#!/usr/bin/env python3
"""Search the minified bundle for regex patterns with context."""
import re, sys, json

BUNDLE = "/home/z/flick-3dEditor/analysis/index-DBE17t4T.js"
_src = None

def src():
    global _src
    if _src is None:
        with open(BUNDLE, encoding="utf-8") as f:
            _src = f.read()
    return _src

def find_all(pat, flags=0):
    return [m.start() for m in re.finditer(pat, src(), flags)]

def count(pat, flags=0):
    return len(find_all(pat, flags))

def sanitize(t):
    # the Bash tool output pipeline eats the sequence "[h" (and maybe others);
    # replace brackets with lookalikes so code survives round-tripping.
    return t.replace("[", "\u27e6").replace("]", "\u27e7")

def dump(off, before=400, after=1600, label=None):
    s = src()
    a = max(0, off - before)
    b = min(len(s), off + after)
    print(f"===== offset {off}" + (f" ({label})" if label else "") + f" 【{a}:{b}】 =====")
    print(sanitize(s[a:b]))
    print(f"===== end {off} =====")

if __name__ == "__main__":
    # usage: search.py PATTERN [BEFORE AFTER]
    pat = sys.argv[1]
    before = int(sys.argv[2]) if len(sys.argv) > 2 else 400
    after = int(sys.argv[3]) if len(sys.argv) > 3 else 1600
    flags = 0
    locs = find_all(pat, flags)
    print(f"# pattern {pat!r}: {len(locs)} matches at {locs[:40]}")
    for off in locs[:10]:
        dump(off, before, after)
