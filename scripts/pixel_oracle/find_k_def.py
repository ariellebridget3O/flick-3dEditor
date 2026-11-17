#!/usr/bin/env python3
"""Find the stage editor's camera centering on scene load: the k=lookThroughCamera def + any content-centroid targeting."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()

# 1) the k= definition near @5869258 — walk back for 'const k=' or 'k=' function in that module
zone = src[5850000:5870000]
for pat in [r'\bk\s*=\s*(?:async\s*)?\(', r'const k\s*=']:
    for m in list(re.finditer(pat, zone))[:8]:
        s = max(0, m.start()-100)
        print('K-DEF @%d:' % (5850000+m.start()))
        print(repr(zone[s:m.start()+600]))
        print('---')
