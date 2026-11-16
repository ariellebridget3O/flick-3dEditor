#!/usr/bin/env python3
"""Find remaining palette-family definitions in the bundle."""
import re, sys

data = open('analysis/index-DBE17t4T.js', 'rb').read()

def show(name, pat, limit=340):
    hits = 0
    for m in re.finditer(pat, data):
        off = m.start()
        ctx = data[off:off+limit].decode('utf-8', 'replace')
        print(f'### {name} @{off}:')
        print(ctx)
        print()
        hits += 1
        if hits >= 4:
            break
    if not hits:
        print(f'### {name}: NOT FOUND')
        print()

show('Q0', rb'Q0=\(')
show('Q0alt', rb'function Q0\(')
show('Xzt', rb'Xzt=')
show('LHr', rb'LHr=')
show('Xu', rb'Xu=\(')
show('MP', rb'MP=\(')
show('an', rb'\ban=\(')
show('el_kind', rb'el=\(')
