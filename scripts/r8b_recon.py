#!/usr/bin/env python3
"""r8b recon helper: dump context windows around char offsets / probe identifiers.
Usage:
  python3 scripts/r8b_recon.py ctx <char_off> [before] [after]
  python3 scripts/r8b_recon.py probe SIG [SIG...]
"""
import sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLE = os.path.join(ROOT, 'analysis', 'index-DBE17t4T.js')
src = open(BUNDLE, encoding='utf-8', errors='replace').read()

def byte_off_of(ch):
    b = 0
    for i in range(min(ch, len(src))):
        c = src[i]
        b += 1 if ord(c) <= 0x7F else len(c.encode('utf-8'))
    return b

cmd = sys.argv[1]
if cmd == 'probe':
    for sig in sys.argv[2:]:
        offs = [m.start() for m in __import__('re').finditer(__import__('re').escape(sig), src)]
        print(f'{sig!r}: {len(offs)} hits -> {offs}')
elif cmd == 'ctx':
    off = int(sys.argv[2])
    before = int(sys.argv[3]) if len(sys.argv) > 3 else 400
    after = int(sys.argv[4]) if len(sys.argv) > 4 else 600
    lo = max(0, off - before)
    print(f'--- ctx @{off} (chars {lo}..{off+after}, byte~{byte_off_of(off)}) ---')
    print(src[lo:off + after])
