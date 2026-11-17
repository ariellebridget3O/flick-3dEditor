#!/usr/bin/env python3
"""Find the live's L (evaluateAt) camera branch: mesh pose writes from the camera eval."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()

# the camera eval writes out.position/out.quaternion/out.fovDeg; find consumers applying to meshes
hits = list(re.finditer(r'fovDeg', src))
print('fovDeg hits:', len(hits))
shown = 0
for m in hits:
    ctx = src[max(0, m.start()-300):m.start()+400]
    if '.position.copy' in ctx or '.quaternion' in ctx:
        print('@%d: %s' % (m.start(), repr(ctx[:600])))
        print('---')
        shown += 1
        if shown >= 5: break
