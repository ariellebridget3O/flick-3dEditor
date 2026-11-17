#!/usr/bin/env python3
# slice the bundle at char offsets (utf-8 decoded), print with '[' escaped
import sys
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8').read()
start = int(sys.argv[1]); n = int(sys.argv[2]) if len(sys.argv) > 2 else 700
print(src[start:start+n].replace('[', chr(0x2039)))
