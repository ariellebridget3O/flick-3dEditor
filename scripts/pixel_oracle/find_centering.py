#!/usr/bin/env python3
"""Find scene-open camera centering: search for bbox/centroid -> camera/orbit target sets."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()

# find 'expandByObject' or 'setFromObject' (bbox of scene) near camera ops
for pat in [r'setFromObject', r'expandByObject', r'getCenter', r'boundingBox']:
    hits = list(re.finditer(pat, src))
    print(pat, '->', len(hits))
    for m in hits[:8]:
        ctx = src[max(0, m.start()-250):m.start()+350]
        if 'camera' in ctx or 'target' in ctx or 'lookAt' in ctx:
            print('  @%d: %s' % (m.start(), repr(ctx[:500])))
            print('  ---')
