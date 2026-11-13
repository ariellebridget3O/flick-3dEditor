"""Shared helpers for bundle mining. Usage: python3 with imports from this file (same dir)."""
import re, os, sys, json

BUNDLE = "/home/z/flick-3dEditor/analysis/index-DBE17t4T.js"
OUT = "/home/z/flick-3dEditor/analysis/extracted/ux_raw.js"

_cache = None
def src():
    global _cache
    if _cache is None:
        with open(BUNDLE, "r", encoding="utf-8") as f:
            _cache = f.read()
    return _cache

def find_all(pat, s=None, flags=0):
    s = s if s is not None else src()
    return [m.start() for m in re.finditer(pat, s, flags)]

def offsets(name):
    """Find identifier occurrences (word-bounded)."""
    return find_all(r'(?<![A-Za-z0-9_$])' + re.escape(name) + r'(?![A-Za-z0-9_$])')

def region(pos, before=0, after=2000):
    s = src()
    return s[max(0, pos - before): pos + after]

def pretty(js, indent=0):
    """Tiny JS de-minifier: newline after ; { } and before }. Not a parser, just readability."""
    out = []
    depth = indent
    i = 0
    n = len(js)
    instr = None
    while i < n:
        c = js[i]
        if instr:
            out.append(c)
            if c == '\\':
                if i + 1 < n:
                    out.append(js[i+1]); i += 2; continue
            elif c == instr:
                instr = None
            i += 1
            continue
        if c in '"\'`':
            instr = c; out.append(c); i += 1; continue
        if c == '/' and i + 1 < n and js[i+1] == '/':
            j = js.find('\n', i)
            if j == -1: j = n
            out.append(js[i:j]); i = j; continue
        if c == '/' and i + 1 < n and js[i+1] == '*':
            j = js.find('*/', i)
            j = n if j == -1 else j + 2
            out.append(js[i:j]); i = j; continue
        if c in '{[(':
            depth += 1
            out.append(c)
            # newline after { but keep ([ on same line mostly
            if c == '{':
                out.append('\n' + '  ' * depth)
            i += 1
            continue
        if c in '}])':
            depth -= 1
            if c == '}':
                out.append('\n' + '  ' * max(depth, 0) + c)
            else:
                out.append(c)
            i += 1
            continue
        if c == ';':
            out.append(';\n' + '  ' * depth)
            i += 1
            continue
        if c == ',' and depth > 0:
            out.append(',\n' + '  ' * depth)
            i += 1
            continue
        out.append(c)
        i += 1
    return ''.join(out)

def write_section(f, title, js, note=""):
    f.write("\n\n/*" + "=" * 70 + "\n * " + title + "\n")
    if note:
        f.write(" * " + note + "\n")
    f.write(" *" + "=" * 70 + "\n*/\n")
    f.write(pretty(js))

def fmt_pos(p):
    return f"@{p} (line {src()[:p].count(chr(10))+1})"
