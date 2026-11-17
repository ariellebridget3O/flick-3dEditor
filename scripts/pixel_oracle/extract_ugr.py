#!/usr/bin/env python3
"""Extract UGr fully (the live camera-marker controller) to see mesh pose application."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()
i = src.find('function UGr(t,e)')
# brace-match from the function start
start = i
depth = 0
j = src.find('{', i)
k = j
while k < len(src):
    c = src[k]
    if c == '{': depth += 1
    elif c == '}':
        depth -= 1
        if depth == 0: break
    k += 1
body = src[start:k+1]
open('/tmp/ugr.js', 'w').write(body)
print('UGr bytes:', len(body))
# landmarks inside
for pat in [r'\.position\.copy', r'\.position\.set', r'evalCamera|dZt|fFr', r'quaternion\.copy', r'markers|marker', r'getObjectByName\(KWt\)', r'l2r|urt']:
    hits = [m.start() for m in re.finditer(pat, body)]
    print(pat, len(hits), hits[:12])
