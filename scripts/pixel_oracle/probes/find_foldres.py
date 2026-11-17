#!/usr/bin/env python3
"""Find the live's performance mesh application: foldResolvers consumers + mesh pose writes."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()

hits = [m.start() for m in re.finditer(r'foldResolvers', src)]
print('foldResolvers hits:', len(hits), hits[:12])
for h in hits[:12]:
    ctx = src[max(0, h-200):h+500]
    print('@%d: %s' % (h, repr(ctx[:600])))
    print('=====')
