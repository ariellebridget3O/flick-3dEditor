#!/usr/bin/env python3
"""Find lookThroughCamera def: search 'lookThrough' assignments and the camera-target-centering on scene open."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()

# lookThroughStageCamera (from @11258928: It.lookThroughStageCamera)
for pat in ['lookThroughStageCamera', 'lookThroughCamera=']:
    for m in list(re.finditer(re.escape(pat), src))[:6]:
        s = max(0, m.start()-80)
        print('=== %s @%d ===' % (pat, m.start()))
        print(repr(src[s:m.start()+500]))
        print()
