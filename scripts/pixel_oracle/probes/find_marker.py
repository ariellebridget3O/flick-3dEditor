#!/usr/bin/env python3
"""Find the live's camera marker system: where camera meshes get posed during performance (UGr family)."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()

# find frustum-related code (16-point frustum urt port reference)
for pat in [r'__frustum', r'camera-frustum', r'16.*frustum', r'frustum']:
    hits = list(re.finditer(pat, src))
    print(pat, '->', len(hits))
    for m in hits[:4]:
        print('  @%d' % m.start(), repr(src[max(0,m.start()-150):m.start()+250][:380]))
        print('  ---')
