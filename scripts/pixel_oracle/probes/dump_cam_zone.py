#!/usr/bin/env python3
"""Dump the live camera-object zone and find marker posing (mesh position writes during performance)."""
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()
zone = src[4904178:4912000]
open('/tmp/cam_zone.js', 'w').write(zone)
print('zone saved', len(zone))
# quick landmarks
import re
for pat in [r'function \w+\(', r'\.position\.copy', r'\.position\.set', r'evalCamera', r'dZt', r'quaternion']:
    hits = [m.start() for m in re.finditer(pat, zone)]
    print(pat, len(hits), hits[:10])
