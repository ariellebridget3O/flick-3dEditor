#!/usr/bin/env python3
"""Find fFr call sites (the camera eval consumers) to locate the mesh-pose application."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()
hits = [m.start() for m in re.finditer(r'\bfFr\(', src)]
print('fFr( call sites:', len(hits), hits)
for h in hits:
    if h == 5428716 + src.find('function fFr') - src.find('function fFr'): pass
    ctx = src[max(0, h-350):h+350]
    print('@%d: %s' % (h, repr(ctx[:650])))
    print('=====')
