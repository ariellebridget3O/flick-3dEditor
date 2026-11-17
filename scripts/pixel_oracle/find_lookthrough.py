#!/usr/bin/env python3
"""Find the live's scene-load camera centering (lookThroughCamera / centerOn / fit)."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()

# lookThroughCamera definition
i = src.find('lookThroughCamera')
while i != -1:
    ctx = src[max(0, i-300):i+500]
    if 'function' in ctx[:320] or '=>' in ctx[:320] or 'lookThroughCamera(' in ctx and ('set' in ctx or 'target' in ctx):
        print('=== @%d ===' % i)
        print(repr(ctx[:700]))
        print()
    i = src.find('lookThroughCamera', i+1)
    if i > 20_000_000: break
