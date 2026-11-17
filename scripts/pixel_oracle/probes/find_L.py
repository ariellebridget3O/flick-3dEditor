#!/usr/bin/env python3
"""Find the live's L (performance loop) — the camera mesh pose application during performance."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()

# The L function applies eval to meshes. Our port called it 'L'. Search for functions that
# iterate tracks + write mesh transforms and reference Fp/camera items.
# Anchor: 'aN' gate equivalent — FOLD_KINDS in our port = the aN set. Search 'aN' set def:
for pat in [r'const aN=', r'aN=new Set', r'Fp\(']:
    for m in list(re.finditer(pat, src))[:4]:
        print('@%d %s:' % (m.start(), pat))
        print(repr(src[max(0,m.start()-200):m.start()+400]))
        print('---')
