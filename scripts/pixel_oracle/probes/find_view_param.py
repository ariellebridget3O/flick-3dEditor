#!/usr/bin/env python3
"""Find location.search / view param consumers in the bundle."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()

print('=== location.search consumers ===')
for m in list(re.finditer(r'location\.search', src))[:20]:
    s = max(0, m.start() - 120); e = min(len(src), m.end() + 380)
    ctx = src[s:e]
    if 'view' in ctx or 'stage' in ctx or 'scene' in ctx:
        print(repr(ctx[:460]))
        print('---')
