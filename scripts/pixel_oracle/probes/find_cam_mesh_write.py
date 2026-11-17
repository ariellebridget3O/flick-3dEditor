#!/usr/bin/env python3
"""Find the live's performance loop camera branch (mesh writes for camera kinds)."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()
hits = [m.start() for m in re.finditer(r'kind==="camera"', src)]
print('kind==="camera" hits:', len(hits))
for h in hits:
    ctx = src[max(0, h-400):h+500]
    if '.position.copy' in ctx or '.position.set' in ctx or 'mesh' in ctx.lower():
        print('@%d: %s' % (h, repr(ctx[:800])))
        print('=====')
