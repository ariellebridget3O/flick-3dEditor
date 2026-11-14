#!/usr/bin/env python3
"""Extract a complete function/class from the minified bundle by balanced-brace
extension from a match position, extending backwards to the statement start."""
import re, sys

BUNDLE = "/home/z/flick-3dEditor/analysis/index-DBE17t4T.js"
SRC = open(BUNDLE, encoding="utf-8", errors="replace").read()

def find_stmt_start(src, pos):
    """Walk backwards from pos to the start of the statement (top-level or
    after ; { } newline at depth 0 of parens)."""
    i = pos
    depth = 0
    while i > 0:
        c = src[i-1]
        if c in ')]':
            depth += 1
        elif c in '([':
            if depth == 0:
                # could be function call args; keep walking
                pass
            depth -= 1
        elif depth <= 0 and c in ';{}':
            return i
        i -= 1
    return 0

def extract(src, start, max_len=200000):
    """From `start` (statement start), extract balanced text."""
    out = []
    depth = 0
    i = start
    n = len(src)
    end_pat = re.compile(r'[;}]')
    # Track brace/paren/bracket depth, respect strings & regex-ish
    while i < n and (i - start) < max_len:
        c = src[i]
        if c in '\'"`':
            q = c; i += 1
            while i < n:
                if src[i] == '\\': i += 2; continue
                if src[i] == q: break
                i += 1
            i += 1
            continue
        if c == '/' and i+1 < n and src[i+1] == '/':
            while i < n and src[i] != '\n': i += 1
            continue
        if c == '/' and i+1 < n and src[i+1] == '*':
            i = src.find('*/', i)
            if i < 0: break
            i += 2; continue
        if c in '{([': depth += 1
        elif c in '})]':
            depth -= 1
            if depth <= 0 and c == '}':
                # statement-scoped block closed
                return ''.join(out) + c, i+1
        out.append(c)
        i += 1
    return ''.join(out), i

def main():
    pat = sys.argv[1]
    fname = sys.argv[2] if len(sys.argv) > 2 else None
    max_len = int(sys.argv[3]) if len(sys.argv) > 3 else 120000
    rx = re.compile(pat)
    m = rx.search(SRC)
    if not m:
        print(f"NO MATCH {pat!r}"); return
    # find enclosing function: search backwards for 'function' keyword within reasonable range
    # strategy: dump from stmt start of match, but for full class extraction user gives
    # pattern at the declaration itself
    start = m.start()
    # walk back to nearest 'function' or '=>' boundary at same depth
    seg_start = start
    # try to include the 'function NAME(' prefix: search backwards for 'function' up to 200 chars
    back = SRC.rfind('function', max(0, start-120), start)
    if back >= 0 and start - back < 120:
        seg_start = back
    text, _ = extract(SRC, seg_start, max_len)
    # pretty-ish: add newlines after ; and { } for readability
    if fname:
        open(fname, 'w').write(text)
        print(f"wrote {len(text)} chars to {fname}")
    else:
        print(text[:5000])

if __name__ == '__main__':
    main()
