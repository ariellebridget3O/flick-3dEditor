#!/usr/bin/env python3
"""Extract readable subsystem code from the flick.art minified bundle — v2.
Statement-aware: extends across chained brackets (foo(...){...}[...]) until terminator.
Usage: python3 extract_bundle.py [bundle] [outdir]
"""
import os, re, sys, json

BUNDLE = sys.argv[1] if len(sys.argv) > 1 else '/home/z/flick-3dEditor/analysis/index-DBE17t4T.js'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/home/z/flick-3dEditor/analysis/extracted'
os.makedirs(OUT, exist_ok=True)
src = open(BUNDLE, encoding='utf-8').read()

OPEN = {'(': ')', '[': ']', '{': '}'}

class Scan:
    """string/regex-aware scanner"""
    def __init__(self, src):
        self.src = src
    def match_bracket(self, k):
        """src[k] is an opener; return index after its matching close, or -1."""
        src = self.src
        open_ch = src[k]; close_ch = OPEN[open_ch]
        depth = 0; in_str = None; esc = False; in_re = False
        prev = ''
        m = k
        while m < len(src):
            c = src[m]
            if in_str:
                if esc: esc = False
                elif c == '\\': esc = True
                elif c == in_str: in_str = None
            elif in_re:
                if esc: esc = False
                elif c == '\\': esc = True
                elif c == '/': in_re = False
                elif c == '\n': in_re = False  # regexes don't span lines
            elif c in '"\'`':
                in_str = c
            elif c == '/' and m + 1 < len(src) and src[m+1] not in ' /' and prev in '=(,[:!&|?{};':
                in_re = True
            elif c == open_ch:
                depth += 1
            elif c == close_ch:
                depth -= 1
                if depth == 0:
                    return m + 1
            prev = c if (c.isalnum() or c in '_$') else ''
            m += 1
        return -1

sc = Scan(src)

def statement(off):
    """Given offset at/just-before a statement start, extract the full statement.
    Strategy: repeatedly consume: identifier chunk, then any bracketed region,
    until we hit a terminator (; or , or } at depth 0 or 'var' boundary)."""
    i = off
    last_good = off
    guard = 0
    while i < len(src) and guard < 200:
        guard += 1
        c = src[i]
        if c in '([{':
            j = sc.match_bracket(i)
            if j < 0:
                return src[off:i], last_good
            i = j
            last_good = i
        elif c.isalnum() or c in '_$."\'`':
            i += 1
        elif c in '=+-*/%<>!&|^~?:;,':
            if c == ';':
                return src[off:i+1], i+1
            i += 1
        elif c == ' ' or c == '\n' or c == '\t':
            i += 1
        else:
            return src[off:i], i
    return src[off:i], i

def find_defs(name):
    """definition sites: 'name=' (not ==), 'function name', 'name:function', 'name:(' """
    sites = []
    for m in re.finditer(r'function\s+' + re.escape(name) + r'\s*\(', src):
        sites.append((m.start(), 'function'))
    for m in re.finditer(r'(?<![A-Za-z0-9_$])' + re.escape(name) + r'\s*=(?!=)', src):
        sites.append((m.start(), 'assign'))
    for m in re.finditer(r'(?<![A-Za-z0-9_$])' + re.escape(name) + r'\s*:\s*(function|\()', src):
        sites.append((m.start(), 'method'))
    return sites

def walk_back_start(off):
    """Walk back from a def-site to the true statement start (past 'const/', 'let ', 'var ', 'function', 'async')."""
    j = off
    # back over whitespace
    while j > 0 and src[j-1] in ' \n\t': j -= 1
    for kw in ('const ', 'let ', 'var ', 'function ', 'async ', 'class '):
        if src.startswith(kw, j - len(kw)):
            return j - len(kw)
    # check comma-chain: 'xxx,NAME=' — walk back over 'ident,' sequences to the chain head
    k = j
    depth = 0
    while k > 0:
        k -= 1
        ch = src[k]
        if ch in ')]}': depth += 1
        elif ch in '([{':
            if depth == 0: return j  # inside a bracket — start here
            depth -= 1
        elif depth == 0:
            if ch == ';': return j
            if ch == ',':
                # maybe chain; look further back for ';' or '{' or start
                continue
            if ch == '\n' and src[k-1] == '\n':
                return j
    return j

def extract(name, label=None, max_sites=6, max_len=220000):
    sites = find_defs(name)
    label = label or name
    if not sites:
        return f"// {name}: NOT FOUND\n"
    out = [f"// #### {name} — {len(sites)} def sites ####\n"]
    total = 0
    for i, (off, kind) in enumerate(sites[:max_sites]):
        start = walk_back_start(off)
        body, _ = statement(start)
        if len(body) > max_len: body = body[:max_len] + f"  /* ...TRUNCATED {len(body)} */"
        out.append(f"/* ==== {name} site[{i}] kind={kind} @{off} len={len(body)} ==== */\n{body}\n\n")
        total += len(body)
    return ''.join(out)

GROUPS = {
 'p1_daylight_renderer.js': [
   ('HY', 'daylight 8-stop table'), ('mFr', 'full-day anchor'), ('yFr', 'daylight stop interp'),
   ('QFr', 'daylight apply'), ('KFr', 'sky dome shader A'), ('XFr', 'sky dome shader B'),
   ('l8r', 'sun dir + elev remap'), ('uZt', 'fog + dynamic near/far'), ('sOr', 'renderer/scene construction'),
   ('tFr', 'distance to bounds'), ('c8r', 'light normalize'), ('CDe', 'light normalize 2'),
   ('dZt', 'fog cap'), ('QRr', 'fog factor'),
 ],
 'p2_selection_fov.js': [
   ('HWr', 'selection rounded-box shader A'), ('$Wr', 'selection shader B'),
   ('Nhe', 'frustum marker angle'), ('ZGt', 'record framing'), ('Dbr', 'record framing 2'),
   ('q_', 'fov from focal'), ('_Fa', 'lens log interp'), ('kFa', 'lens log inv'),
   ('Fzt', 'sensor 35mm'), ('bT', 'focal steps'), ('G_', 'focal min'), ('zA', 'focal max'),
   ('Gae', 'aspect map'), ('OP', 'editor fov'), ('qhe', 'near'), ('FP', 'far'),
 ],
 'p3_animation_tracks.js': [
   ('Fhe', '46-clip catalog'), ('eEe', 'humanoid anim eval'), ('fT', 'Catmull-Rom anchors'),
   ('bd', 'path duration'), ('whe', 'pace hold'), ('Kae', 'walk yaw'), ('GA', '20Hz'),
   ('Htt', 'default speed'), ('gq', 'camera rigs'), ('$br', 'shake presets'), ('Vbr', 'shake sines'),
   ('qbr', 'stride bob'), ('LCr', 'stride 2'), ('Ubr', 'shake seed A'), ('Wbr', 'shake seed B'),
   ('w1', 'cam-move presets'), ('rDe', 'smoothstep'), ('Btt', 'heightCurve 64'), ('E2r', 'height cap'),
   ('C2r', 'pace check'), ('Bzt', 'rig-transform normalizer'), ('Wzt', 'play keymap'),
   ('zzt', 'gaits'), ('b2r', 'aim modes'), ('Xst', 'shake values'), ('XWt', 'spotlight defaults'),
   ('M8', 'clip default dur'), ('Qae', 'range min gap'),
 ],
 'p4_figure_consts.js': [
   ('IP', 'person height'), ('uIr', 'ratio'), ('RP', 'body dims'), ('Iie', 'head radius'),
   ('Mie', 'visor arc'), ('mIr', 'visor pitch'), ('fIr', 'band bounds'), ('rA', 'scale ratio'),
 ],
}

report = {}
for fname, entries in GROUPS.items():
    parts = []
    for name, label in entries:
        try:
            t = extract(name, label)
        except Exception as e:
            t = f"// {name}: ERROR {e}\n"
        parts.append(t)
        report[name] = f'{len(t)} chars'
    open(f'{OUT}/{fname}', 'w').write('\n'.join(parts))
    print(fname, os.path.getsize(f'{OUT}/{fname}'))
json.dump(report, open(f'{OUT}/extract_report.json', 'w'), indent=1)
