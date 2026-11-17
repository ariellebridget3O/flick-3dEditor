#!/usr/bin/env python3
"""Find UGr (live camera markers) — mesh pose writes for cameras in the editor view."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()

# UGr class/function definition
for m in list(re.finditer(r'\bUGr\b', src))[:12]:
    ctx = src[max(0, m.start()-120):m.start()+400]
    print('@%d: %s' % (m.start(), repr(ctx[:420])))
    print('---')
