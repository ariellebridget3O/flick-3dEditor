#!/usr/bin/env python3
"""R16 extraction: component-drag family units from the bundle by byte offset.
Usage: python3 scripts/r16_extract.py <name> [name...]   (names from UNITS dict)
       python3 scripts/r16_extract.py range <start> <end>
       python3 scripts/r16_extract.py around <needle> <before> <after>
"""
import re, sys, os

BUNDLE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'analysis', 'index-DBE17t4T.js')
SRC = open(BUNDLE, encoding='utf-8', errors='replace').read()

UNITS = {
    'addComponent_store':  (5260542, 'store addComponent switch'),
    'addComponent_facade': (5790071, 'facade addComponent + default camera track'),
    'RNr':                 (5376734, 'component payload serializer (after V6 const)'),
    'k9r_tile_dragstart':  (5371849, 'component tile dragstart (V6 + RNr)'),
    'dock_drop':           (5395951, 'left dock component drop'),
    'dropComponentAt':     (5866246, 'plan canvas component drop'),
    'showComponentList':   (5817658, 'componentsTab reveal'),
    'setDraggingComponent':(5258094, 'draggingComponent signal + setters'),
}

def find_stmt_start(pos):
    i = pos; depth = 0
    while i > 0:
        c = SRC[i-1]
        if c in ')]': depth += 1
        elif c in '([':
            if depth == 0: pass
            depth -= 1
        elif depth <= 0 and c in ';{}': return i
        i -= 1
    return 0

def extract_balanced(start):
    out = []; depth = 0; i = start; instr = None
    while i < len(SRC):
        c = SRC[i]
        if instr:
            out.append(c)
            if c == instr and SRC[i-1] != '\\': instr = None
        else:
            out.append(c)
            if c in '"\'`': instr = c
            elif c in '{([': depth += 1
            elif c in '})]':
                depth -= 1
                if depth == 0 and c == '}': return ''.join(out)
        i += 1
    return ''.join(out)

def get(name):
    off, desc = UNITS[name]
    st = find_stmt_start(off)
    return extract_balanced(st)

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('fn_') and sys.argv[1] not in UNITS else 'units'
    if mode == 'range':
        a, b = int(sys.argv[2]), int(sys.argv[3])
        print(SRC[a:b]); sys.exit(0)
    if mode == 'around':
        i = SRC.find(sys.argv[2])
        if i < 0: print('NOT FOUND'); sys.exit(1)
        print(f"@{i}")
        print(SRC[max(0,i-int(sys.argv[3])):i+len(sys.argv[2])+int(sys.argv[4])]); sys.exit(0)
    for name in sys.argv[1:]:
        txt = get(name)
        print(f"===== {name} ({UNITS[name][1]}) =====")
        print(txt)
        print()
