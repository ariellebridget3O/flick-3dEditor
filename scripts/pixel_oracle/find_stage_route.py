#!/usr/bin/env python3
"""Find the 3d-stage route + view param consumption in the bundle."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()

m = re.search(r'"3d-stage"', src)
s = max(0, m.start() - 600); e = min(len(src), m.end() + 600)
print('=== 3d-stage ctx ===')
print(repr(src[s:e]))
print()

# how is the stage view opened: search 'view' param near 'stage'
print('=== view param near stage ===')
for m in re.finditer(r'stage["\']\s*[:=]', src):
    ctx = src[max(0, m.start() - 200):m.end() + 300]
    if 'search' in ctx or 'param' in ctx or 'query' in ctx or 'location' in ctx:
        print(repr(ctx[:420]))
        print('---')
