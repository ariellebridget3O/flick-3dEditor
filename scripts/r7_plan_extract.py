#!/usr/bin/env python3
"""r7_plan_extract.py — Round 7: VERBATIM function-level extraction of the live
flick.art "2D stage plan canvas" subsystem from the minified production bundle.

Bundle: analysis/index-DBE17t4T.js  (single-line minified; offsets below are
CHARACTER offsets into the UTF-8 decoded text, matching find_ctx.py / lib.py).

Outputs -> analysis/tmp_plan_exact/
  fn_<Name>.js   verbatim minified source + header (name, char range, byte range,
                 deobfuscated purpose, params, auto-derived closure deps)
  MAP.md         subsystem map (written by hand afterwards; this script emits
                 fn_index.json with ranges + auto dep lists to help)

Every extracted unit is syntax-validated with `node --check` (wrapped in a
plain IIFE or a dummy class for class-property methods).

Extraction kinds:
  function   `function NAME(...){...}`            -> wrapper: plain
  method     `NAME=(...)=>{...}` class property   -> wrapper: class
  stmt       statement starting at `const`/`let`  -> wrapper: plain
  class      whole `class NAME{...}`              -> wrapper: plain
  slice      fixed [a,b) char range               -> wrapper: plain

Usage:
  python3 scripts/r7_plan_extract.py              # full run
  python3 scripts/r7_plan_extract.py --check-only # re-validate only
  python3 scripts/r7_plan_extract.py --probe SIG  # print offsets of a signature
"""
import json, os, re, subprocess, sys, bisect

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLE = os.path.join(ROOT, 'analysis', 'index-DBE17t4T.js')
OUT = os.path.join(ROOT, 'analysis', 'tmp_plan_exact')
os.makedirs(OUT, exist_ok=True)

src = open(BUNDLE, encoding='utf-8', errors='replace').read()
N = len(src)

# byte offsets (bundle is mostly ASCII; map char->byte via non-ascii index)
_nonascii = [i for i, c in enumerate(src) if ord(c) > 127]
def byte_off(char_off):
    return char_off + bisect.bisect_left(_nonascii, char_off)

# ----------------------------------------------------------------------------
# scanning engine (string/template/comment/regex aware)
# ----------------------------------------------------------------------------

def skip_string(i):
    """src[i] is a quote (' " `). Return index just past the closing quote.
    Template literals: ${...} nests and may contain strings — handled by depth
    bookkeeping below via recursion-free state stack in scan()."""
    q = src[i]
    i += 1
    while i < N:
        c = src[i]
        if c == '\\':
            i += 2
            continue
        if q == '`' and c == '$' and i + 1 < N and src[i+1] == '{':
            # template expression: scan balanced braces, strings inside handled recursively
            i += 2
            depth = 1
            while i < N and depth:
                c2 = src[i]
                if c2 in '"\'`':
                    i = skip_string(i)
                    continue
                if c2 == '/' and i + 1 < N and src[i+1] in '/*':
                    i = skip_comment(i)
                    continue
                if c2 == '{':
                    depth += 1
                elif c2 == '}':
                    depth -= 1
                    if depth == 0:
                        i += 1
                        break
                i += 1
            continue
        if c == q:
            return i + 1
        i += 1
    return i

def skip_comment(i):
    """src[i]=='/' and src[i+1] in '/*'."""
    if src[i+1] == '/':
        j = src.find('\n', i)
        return N if j < 0 else j + 1
    j = src.find('*/', i + 2)
    return N if j < 0 else j + 2

_REGEX_PREV = set('(,=:[!&|?{};<>+-*/%^~') | {'return', 'typeof', 'case', 'in', 'of', 'new', 'do', 'else'}

def _prev_token_ends_regex():
    """Heuristic: is the previous non-space char one that precedes a regex literal?"""
    j = _scan_pos[0] - 1
    while j >= 0 and src[j] in ' \t\n':
        j -= 1
    if j < 0:
        return True
    if src[j] in _REGEX_PREV:
        return True
    # word char: regex only after keywords (return/case/typeof/...)
    k = j
    while k >= 0 and (src[k].isalnum() or src[k] in '_$'):
        k -= 1
    word = src[k+1:j+1]
    return word in _REGEX_PREV

_scan_pos = [0]

def skip_regex(i):
    """src[i]=='/' starting a regex literal. Skip to closing unescaped '/'."""
    i += 1
    in_class = False
    while i < N:
        c = src[i]
        if c == '\\':
            i += 2
            continue
        if c == '[':
            in_class = True
        elif c == ']':
            in_class = False
        elif c == '/' and not in_class:
            i += 1
            while i < N and src[i].isalpha():  # flags
                i += 1
            return i
        elif c == '\n':
            return i  # not a regex after all; bail
        i += 1
    return i

def match_brace(open_idx):
    """src[open_idx]=='{' -> index of matching '}' (or N)."""
    depth = 0
    i = open_idx
    stack_p = 0  # () depth, [] depth separately
    stack_b = 0
    while i < N:
        c = src[i]
        if c in '"\'`':
            i = skip_string(i)
            continue
        if c == '/' and i + 1 < N and src[i+1] in '/*':
            i = skip_comment(i)
            continue
        if c == '/':
            _scan_pos[0] = i
            if _prev_token_ends_regex():
                i = skip_regex(i)
                continue
        if c == '(':
            stack_p += 1
        elif c == ')':
            stack_p -= 1
        elif c == '[':
            stack_b += 1
        elif c == ']':
            stack_b -= 1
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0 and stack_p == 0 and stack_b == 0:
                return i
        i += 1
    return -1

def match_paren(open_idx):
    """src[open_idx]=='(' -> matching ')'."""
    depth = 0
    i = open_idx
    while i < N:
        c = src[i]
        if c in '"\'`':
            i = skip_string(i)
            continue
        if c == '/' and i + 1 < N and src[i+1] in '/*':
            i = skip_comment(i)
            continue
        if c == '/':
            _scan_pos[0] = i
            if _prev_token_ends_regex():
                i = skip_regex(i)
                continue
        if c == '(':
            depth += 1
        elif c == ')':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1

def stmt_end(start):
    """From a statement start, scan to the terminating ';' at depth 0."""
    i = start
    depth = 0
    while i < N:
        c = src[i]
        if c in '"\'`':
            i = skip_string(i)
            continue
        if c == '/' and i + 1 < N and src[i+1] in '/*':
            i = skip_comment(i)
            continue
        if c == '/':
            _scan_pos[0] = i
            if _prev_token_ends_regex():
                i = skip_regex(i)
                continue
        if c in '([{':
            depth += 1
        elif c in ')]}':
            depth -= 1
            if depth < 0:
                return i  # ran past enclosing block; stop
        elif c == ';' and depth == 0:
            return i + 1
        i += 1
    return i

def walk_back_stmt(pos):
    """Walk backwards from pos to the start of its statement (after a ';', '{',
    '}' or newline boundary at nesting depth >= 0). Skips strings is impossible
    backwards; minified code rarely has ';' inside strings before plan code —
    accept small risk, verify each dump visually."""
    i = pos - 1
    depth = 0
    while i > 0:
        c = src[i]
        if c in ')]':
            depth += 1
        elif c in '([':
            depth -= 1
        elif depth <= 0 and c in ';{}':
            return i + 1
        i -= 1
    return 0

# ----------------------------------------------------------------------------
# extraction kinds
# ----------------------------------------------------------------------------

def extract_function(off):
    """off points at 'function' keyword of `function NAME(a,b){...}`.
    Returns (start, end) covering decl through closing brace."""
    m = re.compile(r'function\s*[\w$]*\s*\(').match(src, off)
    assert m, f"not a function decl @{off}: {src[off:off+40]!r}"
    p = match_paren(m.end() - 1)
    i = p + 1
    while i < N and src[i] in ' \t\n':
        i += 1
    if src[i] == '{':
        return off, match_brace(i) + 1
    # expression-bodied (rare) or `function NAME(...)` used as value: extend stmt
    return off, stmt_end(off)

def extract_method(off):
    """off points at the NAME token of a class property `NAME=(...)=>{...}` /
    `NAME=Ne(...)` or an object-literal property `NAME:(...)=>{...}`.
    Extract NAME=... through the closing '}' / ';' (class) or ',' / '}' (object)."""
    # find '=' then decide
    i = off
    while i < N and (src[i].isalnum() or src[i] in '_$'):
        i += 1
    assert src[i] in '=:}', f"not a property assignment @{off}: {src[off:off+40]!r}"
    is_object_prop = src[i] == ':'
    j = i + 1
    depth = 0
    while j < N:
        c = src[j]
        if c in '"\'`':
            j = skip_string(j)
            continue
        if c == '/' and j + 1 < N and src[j+1] in '/*':
            j = skip_comment(j)
            continue
        if c == '/' :
            _scan_pos[0] = j
            if _prev_token_ends_regex():
                j = skip_regex(j)
                continue
        if c in '([{':
            depth += 1
        elif c in ')]}':
            if depth == 0:
                return off, j  # hit enclosing '}' boundary — property had no ';'
            depth -= 1
        elif c == ';' and depth == 0 and not is_object_prop:
            return off, j + 1
        elif c == ',' and depth == 0 and is_object_prop:
            return off, j
        j += 1
    return off, j

def extract_stmt_containing(off):
    """off inside a `const A=...,B=...;` statement; find statement start+end."""
    start = walk_back_stmt(off)
    # ensure we start at a declaration-ish token
    return start, stmt_end(start)

def extract_class(off):
    """off at 'class' keyword."""
    i = src.index('{', off)
    return off, match_brace(i) + 1

# ----------------------------------------------------------------------------
# free-identifier analysis (approximate scope resolution)
# ----------------------------------------------------------------------------

KEYWORDS = set('''abstract arguments async await boolean break byte case catch char class const continue
debugger default delete do double else enum eval export extends false final finally float for function
goto if implements import in instanceof int interface let long native new null of package private
protected public return short static super switch synchronized this throw throws transient true try
typeof var void volatile while with yield'''.split())
GLOBALS = set('''Math JSON Object Array String Number Boolean RegExp Error TypeError Map Set WeakMap WeakSet
Promise Symbol Proxy Reflect Intl Date console window document performance requestAnimationFrame
cancelAnimationFrame setTimeout clearTimeout setInterval clearInterval isFinite isNaN parseFloat
parseInt undefined NaN Infinity globalThis self fetch localStorage getComputedStyle
requestIdleCallback structuredClone queueMicrotask BroadcastChannel'''.split())

IDENT_RE = re.compile(r'[A-Za-z_$][\w$]*')
PROP_RE = re.compile(r'\.\s*([A-Za-z_$][\w$]*)')

def free_idents(code):
    """Approximate list of free identifiers (closure/global deps) in code.
    Strips strings/comments first, drops property accesses, drops anything
    bound by a declaration inside the snippet (over-approximate binding)."""
    # strip strings & comments
    out = []
    i = 0
    n = len(code)
    while i < n:
        c = code[i]
        if c in '"\'`':
            j = i + 1
            while j < n:
                if code[j] == '\\':
                    j += 2
                    continue
                # do not expand template ${} here; ids inside are rare and get caught as strings anyway
                if code[j] == c:
                    break
                j += 1
            i = j + 1
            continue
        if c == '/' and i + 1 < n and code[i+1] == '/':
            j = code.find('\n', i)
            i = n if j < 0 else j
            continue
        if c == '/' and i + 1 < n and code[i+1] == '*':
            j = code.find('*/', i)
            i = n if j < 0 else j + 2
            continue
        out.append(c)
        i += 1
    clean = ''.join(out)
    # bound names: any declared name (params, var/let/const/class/function/catch)
    bound = set()
    for m in re.finditer(r'(?:function\s+[\w$]*\s*|\(([^()]*)\)\s*=>|(?:^|[,;{(]\s*)(?:var|let|const)\s+|class\s+|catch\s*\(\s*|for\s*\(\s*(?:let|const|var)\s+)', clean):
        pass
    # simpler: capture param lists of functions/arrows and declarators
    for m in re.finditer(r'function\s*[\w$]*\s*\(([^()]*)\)', clean):
        for p in m.group(1).split(','):
            p = p.strip()
            if p:
                bound.add(p.split('=')[0].strip().replace('...',''))
    for m in re.finditer(r'(?:^|[,(;{=\s])(?:const|let|var)\s+([^;=]+)', clean):
        for p in re.finditer(r'[\w$]+', m.group(1).split('=')[0]):
            bound.add(p.group())
    for m in re.finditer(r'class\s+([\w$]+)', clean):
        bound.add(m.group(1))
    for m in re.finditer(r'catch\s*\(\s*([\w$]+)', clean):
        bound.add(m.group(1))
    for m in re.finditer(r'([\w$]+)\s*=>', clean):  # single-param arrows
        bound.add(m.group(1))
    # property accesses
    props = set(PROP_RE.findall(clean))
    idents = {}
    for m in IDENT_RE.finditer(clean):
        w = m.group()
        if w in KEYWORDS or w in GLOBALS or w in props or w in bound:
            continue
        # skip if part of a property access match position — props set covers by name
        idents[w] = idents.get(w, 0) + 1
    return sorted(idents, key=lambda w: -idents[w])

# ----------------------------------------------------------------------------
# target registry
# ----------------------------------------------------------------------------

def T(name, kind, anchor, purpose, params='?', wrapper=None, off=None):
    """Register an extraction target.
    kind: function|method|stmt|class|slice
    anchor: unique literal signature in the bundle (for function/method kinds it
            should point at the decl; we search + verify). For slice: (a,b)."""
    return dict(name=name, kind=kind, anchor=anchor, purpose=purpose,
                params=params, wrapper=wrapper, off=off)

TARGETS = []

# ===== Group A: label / edge-indicator / figure-body constants & helpers =====
TARGETS += [
 T('aqt', 'function', 'function aqt(', 'label contrast color: parse #rrggbb, luma(.2126/.7152/.0722)>.72(HIr) ? #1c0f09(BIr) : #ffffff(Pst)', 'hexColorStr -> "#1c0f09"|"#ffffff"'),
 T('consts_figbody', 'stmt', 'const RIr=1.299', 'simple_figure body dims: RIr=1.299 ratio, sA=jP(1.75)/RIr scale, PP=[.406,1.059,.289]*sA (W/H/D), Nie=.125*sA head r, FIr/OIr eye, LIr, Pie=72° head arc, DIr pitch, Pst/BIr/HIr label contrast consts', '—'),
 T('consts_edgeind', 'stmt', 'const Rst=22', 'edge indicator consts: Rst=22 margin px, uN=13 bubble radius px', '—'),
 T('$Ir', 'function', 'function $Ir(', 'edge indicators: cameras offscreen -> clamp to 22px margins along center ray; {id,tag,x,y,angleRad}[]', 'items, view -> indicators[]'),
 T('consts_planview', 'stmt', 'const Uhe=34', 'plan view consts: Uhe=34 default pxPerM, iqt=14 min, oqt=Uhe*5=170 max, Fst=.26 humanoid half m, Ost=4.2 lens-ahead m, lqt=12 marker hit px, VIr=34 marker ring px, cqt=6 handle radius, yT=[14,18,24,35,50,85,135,200] focal stops, Lst/H2e euler/vec3 scratch', '—'),
 T('i9', 'function', 'function i9(', 'plan yaw (rad) of a [x,y,z] euler: forward=(0,0,-1).applyEuler(XYZ), atan2(-fx,-fz) — screen-up = -Z convention', 'rotation[3] -> yawRad'),
 T('FU', 'function', 'function FU(', 'forward unit vector of yaw: {x:-sin(y), z:-cos(y)}', 'yawRad -> {x,z}'),
 T('Dst', 'function', 'function Dst(', 'footprint(obj, pose): group->null; camera/target/spotlight->{shape:marker,x,z,yawRad}; humanoid->ellipse halfW=.26*sx(Fst) halfD=.26*sz; simple_figure->rect halfW=PP[0]*sx/2 halfD=PP[2]*sz/2 (.547/.390 halves); sphere/cylinder->ellipse halfW=sx/2 halfD=sz/2 (NO min clamp); prop->rect from zh[propKey].dims ?? [1,1,1] halves (NO min clamp); yawRad=i9(pose.rotation)', 'obj, shownPose -> footprint'),
 T('dqt', 'function', 'function dqt(', 'footprint bbox in meters (rotated extents; ellipse=hypot)', 'fp -> {minX,minZ,maxX,maxZ}'),
 T('Rie', 'function', 'function Rie(', 'footprint bbox in px (marker pad lqt=12px)', 'fp, view -> {minX,minY,maxX,maxY} px'),
 T('uqt', 'function', 'function uqt(', 'union bbox of footprints (meters)', 'fps -> bbox|null'),
 T('hqt', 'function', 'function hqt(', 'horizontal half-fov rad from vertical fovDeg + aspect: atan(tan(fov/2)*aspect)', 'fovDeg, aspect -> halfRad'),
 T('UIr', 'function', 'function UIr(', 'focal mm from horizontal half-fov; snap to yT stops when n', 'halfRad, aspect, snap? -> focalMm'),
 T('pqt', 'function', 'function pqt(', 'lens-handle endpoints: footprint ± halfRad yaw, Ost=4.2m ahead', 'fp, halfRad -> [{x,z},{x,z}]'),
 T('iu', 'function', 'function iu(', 'world m -> px: {x: w/2+(x-cx)*ppm, y: h/2+(z-cz)*ppm}', 'view, {x,z} -> {x,y} px'),
 T('S1', 'function', 'function S1(', 'px -> world m (inverse of iu)', 'view, {x,y} px -> {x,z} m'),
 T('UDe', 'function', 'function UDe(', 'pan view by px delta', 'view, dx, dy -> view'),
 T('fqt', 'function', 'function fqt(', 'zoom view at anchor px keeping world point under cursor; clamps ppm via mqt(14..170)', 'view, anchorPx, factor -> view'),
 T('zIr', 'function', 'function zIr(', 'fit view to bbox with margin px (TLr=48)', 'view, bbox, margin -> view'),
 T('zDe', 'function', 'function zDe(', 'camera callout geometry: center px, ringRadiusPx (marker VIr=34 else max(halfW,halfD)*ppm*?+…), rotate handle on -forward, lens handles at pqt endpoints', 'footprint, view, wedgeHalfRad -> {center,ringRadiusPx,rotate,lens[]}'),
 T('mqt', 'function', 'function mqt(', 'clamp', 'v, lo, hi -> v'),
 T('consts_labelpos', 'stmt', 'const WIr=16', 'camera label pos consts: WIr=16, GIr=.72, qIr=28, $2e=4', '—'),
 T('ZIr', 'function', 'function ZIr(', 'camera label overlay position: ring center + radius, clamped into viewport', 'item, view, labelDims -> {x,y} px'),
 T('consts_KIr', 'stmt', 'const KIr=8', 'KIr=8 (focus overlay cross arm px?) + neighbors', '—'),
 T('VDe', 'function', 'function VDe(', 'vertical bounds {minY,maxY} of object (group=children union, via uje heightOf)', 'id, obj, objects -> {minY,maxY}'),
 T('uje', 'function', 'function uje(', 'object height m from dims (group recursion?)', 'obj -> heightM'),
 T('consts_MIr', 'stmt', 'const MIr=', 'MIr aim-height fraction (NP default)', '—'),
 T('NP', 'function', 'function NP(', 'aim height above object origin: minY-origin + MIr*(maxY-minY) (head-ish aim point)', 'id, objects, frac=MIr -> heightM'),
 T('PIr', 'function', 'function PIr(', 'height-range helper for NP (camera-height UI bounds?)', '(id, objects) -> ?'),
 T('aMr', 'function', 'function aMr(', 'selection promotion: drop children whose parent is also selected', 'ids, objects -> ids'),
 T('XIr', 'function', 'function XIr(', 'QR card placement: clamp card rect inside viewport, anchored at phone pill', '{pill,panel,card,view} -> {x,y} px'),
]

# ===== Group A2: math / transform / camera-drag helpers used by the plan store =====
TARGETS += [
 T('tDe', 'function', 'function tDe(', 'signed angular difference (mod 2π, wrapped to ±π) — lens drag: angle between footprint yaw and pointer dir', '(a,b) -> rad'),
 T('ybe', 'function', 'function ybe(', 'wrap angle t to nearest 2π multiple around e (euler flip helper)', '(t,e) -> rad'),
 T('GA', 'function', 'function GA(', 'euler flip ambiguity resolver: pick euler t or (t+π, π−t, t+π) closest to e (group rotation fold)', '(euler, refEuler) -> euler'),
 T('HAe', 'function', 'function HAe(', 'solid-js batch() wrapper (move intents coalesce into one reactive flush)', 'fn -> void'),
 T('pie', 'function', 'function pie(', 'world pose -> parent-local pose (invert parent matrix, multiply, decompose)', '(parentPose, worldPose) -> localPose'),
 T('Xu', 'function', 'function Xu(', 'is target id still referenced by some camera (targetId)', '(objects, id) -> bool'),
 T('XWt', 'function', 'function XWt(', 'camera+target follow: delta target position after camera pose change', '({camera,quaternion,target},{position,quaternion},out) -> vec3'),
 T('lZt', 'function', 'function lZt(', 'scratch camera eval out {position:new Ge, quaternion:new qn, fovDeg:0} (nit)', '-> scratch'),
 T('dZt', 'function', 'function dZt(', 'camera item evaluator: position/quaternion/fovDeg at timeS from base + items (used by flownHeightM + plan commitOne paths)', '({items,timeS,base,aspect,resolvers,out}) -> out'),
 T('wje', 'function', 'function wje(', 'can camera rotate to aim? (rebase check guard)', '(facade, id, pose, aim) -> bool'),
 T('_je', 'function', 'function _je(', 'camera drag mode classification: manual | path-position | path-look | path-anchored | null', '(items, timeS, mode) -> mode|null'),
 T('SZt', 'function', 'function SZt(', 'camera move/rotate commit with aim rebase solver (GOr) — refuses/unbased/rebased outcomes', 'deps -> outcome'),
 T('consts_aspects', 'stmt', 'Zae=[{key:"16:9"', 'aspect table Zae (16:9, 9:16, 1:1, 4:3, 1.85:1, 2.39:1), Lzt=35 half-height mm-equiv, Z_(focal,aspect)->fovDeg', '—'),
 T('consts_Hv', 'stmt', 'const Hv=50', 'Hv=50 default focalLengthMm; Xu target-referenced check', '—'),
 T('consts_CZt', 'stmt', 'CZt=1.6', 'CZt=1.6 walker eye height (head-look aim height in previewPose), neighbors (Wat=.4, QOr clamp, Gat wrap)', '—'),
]

# ===== Group B: interaction state machine (pure reducers) =====
TARGETS += [
 T('consts_wheel', 'stmt', 'const hLr=150', 'wheel consts: hLr=150 idle ms, Aje=.2 kb-zoom factor, pLr=.005 fine rate, fLr=.02 coarse rate, mLr=2 px-mode pan mult, gLr=1 line-mode', '—'),
 T('PZt', 'function', 'function PZt(', 'wheel event -> {kind:zoom,delta} (rate .005 fine |Δ|<=20 else .02) | {kind:pan,dx,dy} (×2 deltaMode 0 else ×1)', '{deltaX,deltaY,deltaMode,zoom} -> intent'),
 T('bLr', 'function', 'function bLr(', 'is inside a scrollable ancestor ([data-scrollable])', 'target -> bool'),
 T('RZt', 'function', 'function RZt(', 'wheel router: 150ms idle timer, scroll vs pan vs zoom(ctrl) routing to onWheel', '{getOrigin,onWheel} -> {handleWheel,dispose}'),
 T('consts_hit', 'stmt', 'const yLr=2', 'handle slop consts: yLr=2, vLr=8 footprint slop px', '—'),
 T('xLr', 'function', 'function xLr(', 'point-in-footprint: marker dist<=lqt(12px); any footprint within vLr=8px slop; else world-space rotated test rect |u|<=1&&|h|<=1, ellipse u*u+h*h<=1 (NO 1.2 factor)', 'footprint, view, px -> bool'),
 T('Qhe', 'function', 'function Qhe(', 'all hits topmost-first (items sorted by tit z-order)', 'items, view, px -> items[]'),
 T('Xat', 'function', 'function Xat(', 'topmost hit id with parentId??id promotion', 'items, view, px -> id|null'),
 T('wLr', 'function', 'function wLr(', 'mod-click cycle child within group', 'items, view, px, currentId -> id'),
 T('_Lr', 'function', 'function _Lr(', 'marquee rect∩bbox select with parentId??id promotion', 'items, view, rect -> ids[]'),
 T('kLr', 'function', 'function kLr(', 'camera handle hit: rotate | lens within cqt(6)+yLr(2) px', 'item, view, px -> "rotate"|"lens"|null'),
 T('consts_state', 'stmt', 'const Vie=.25', 'interaction consts: Vie=.25 snap m, Yat=π/12 (15°), Qat=3 move threshold px, Jat=4 marquee min px, SLr=4?, TLr=48 fit margin, ALr=.8?, CLr=720?', '—'),
 T('ELr', 'function', 'function ELr(', 'initial plan state {view:{centerX:0,centerZ:0,pxPerM:Uhe=34,widthPx:0,heightPx:0},drag:null,fitted:false}', '-> state'),
 T('jLr', 'function', 'function jLr(', 'resize keeping world center', 'state, w, h -> state'),
 T('ILr', 'function', 'function ILr(', 'zoom-to-fit: union footprints + TLr margin (once)', 'state, footprints -> state'),
 T('MLr', 'function', 'function MLr(', 'zoom to id: center on footprint, pxPerM=Uhe, fitted', 'state, fps, id -> state'),
 T('NLr', 'function', 'function NLr(', 'wheel: zoom (FZt factor) or pan', 'state, {p,dx,dy,deltaMode,zoom} -> state'),
 T('PLr', 'function', 'function PLr(', 'pan by px', 'state, dx, dy -> state'),
 T('RLr', 'function', 'function RLr(', 'keyboard zoom at center by e*Aje(.2)', 'state, factor -> state'),
 T('FLr', 'function', 'function FLr(', 'centerOn id (no zoom change)', 'state, fps, id -> state'),
 T('OLr', 'function', 'function OLr(', 'mark unfitted (re-fit on next frame)', 'state -> state'),
 T('LLr', 'function', 'function LLr(', 'zoom percent readout: round(pxPerM/Uhe*100)', 'view -> int'),
 T('FZt', 'stmt', 'const FZt=', 'zoom factor from wheel delta: max(.1, 1+delta)', '—'),
 T('OZt', 'function', 'function OZt(', 'tap-or-draw: hover another non-camera/target object while drawing -> its id (focus)', 'state, deps, px -> id|null'),
 T('LZt', 'function', 'function LZt(', 'single selected item or undefined', 'state -> item?'),
 T('DLr', 'function', 'function DLr(', 'pointerdown reducer: middle/right=pan drag; drawing=stroke-start; camera rotate/lens handles; hit select (shift toggle / mod cycle wLr); marquee start; move-drag base', 'state, deps, ev -> {state,intents}'),
 T('BLr', 'function', 'function BLr(', 'drag move/rotate update (part of DZt; move intents w/ Vie snap, Yat 15° snap)', '... -> intents'),
 T('DZt', 'function', 'function DZt(', 'pointermove reducer: pan, marquee, stroke-move (grab ease), move/rotate via BLr', 'state, deps, ev -> {state,intents}'),
 T('HLr', 'function', 'function HLr(', 'pointerup reducer: click vs move vs marquee commit (Jat min 4px), stroke-end, drag end', 'state, deps -> {state,intents}'),
 T('$Lr', 'function', 'function $Lr(', 'finalize: drain pending intents from state', 'state -> {state,intents}'),
 T('consts_drag', 'stmt', 'const eit=40', 'plan store consts: eit=40 path sample count, VLr=.05 stroke sample interval s, ULr=4000 tip ms, zLr=.05 face-turn m, WLr=20, GLr=12, qLr=4, ZLr=50 height max, KLr=.18, XLr=.12, YLr=1.6 QLr=1.4 drag rates, JLr=±3m drag clamp box, tit z-order map, eDr=.4 focus ease s, tDr=1 grab decay, nit/uL/qY/xb/nDr scratch', '—'),
]

# ===== Group C: the plan store (class rDr) =====
TARGETS += [
 T('class_rDr', 'class', 'class rDr{', 'THE PLAN STORE: labels(DDe), entries(tit z-order), cameraPills, paths(rit/nx/Bzt/cZt), heightMove, drawTarget, targetPerson, drawingFor/drawing/strokeClock/stroking, matchDrawSpeed, rehearseTip, setBounds(uqt), heightMaxM, selectedCamera(flownHeightM), drag{riding,aimDistance,start}, items() (Dst + shownPose + pool TDe + wedge hqt + camera label), intents reducer (stroke-start/move/end, select, move, rotate, focus...), startStroke, tickStroke (VLr sampling, seekPerformance, previewPose, drawPreview), endStroke (replaceMoveFromSamples steady:!matchDrawSpeed), stepBack (Esc), focusOf/toggleFocus, shownOrStored, zoomCommand/centerRequest handling', 'facade -> store'),
]

# ===== Group D: painter =====
TARGETS += [
 T('sDr', 'function', 'function sDr(', 'i18n id "Draw direction" label', '-> string'),
 T('hL', 'function', 'function hL(', '[x,y,z] -> {x,z} plan point', 'vec3 -> {x,z}'),
 T('rit', 'function', 'function rit(', 'resample keys (tS span) into eit+1(40+1) evenly spaced points', 'keys[], fn -> pts[]'),
 T('consts_palette', 'stmt', 'const aDr={', 'palette CSS var name map (background/grid/gridMajor/human/camera/object/light/prop/propEdge/accent/accentSoft/panel/text/textDim -> --plan-*)', '—'),
 T('BZt', 'function', 'function BZt(', 'read palette from computed style + fontFamily', 'element -> palette'),
 T('consts_painter', 'stmt', 'const HZt=1', 'painter consts: HZt=1 grid minor step m, oye=5 grid major step m, sit=8..iDr=24 grid fade pxPerM range, oDr=[[-9,-1],[9,-1],[9,11],[-9,11]] camera body poly, lDr=[[-4,-1],[-6.5,-8],[6.5,-8],[4,-1]] camera lens poly, cDr=.32 stick-fig scale of pxPerM, dDr=6..hDr=12 stick size clamp px, uDr=7 figure min body px, pDr=6 rotate-tick inner inset, fDr=12 rotate-tick angular base, mDr=16 rotate-tick angular length, gDr=8 target-cross circle r, ait=6 spotlight dot r, bDr=.14 pool alpha, yDr=.24 pool alpha selected, ZY=12 target-cross arm, pL=8 group-box pad px, KY=4.5 path-key diamond half, vDr=.5 dimmed-path alpha, xDr=2.4 stroke width, wDr=14 focus cross ring r, iit=11/lye=18 focus cross arms, l$=12 item label px, Cje=11 small label px', '—'),
 T('_Dr', 'function', 'function _Dr(', 'grid minor-line fade alpha: clamp((ppm-8)/(24-8),0,1)', 'pxPerM -> 0..1'),
 T('kDr', 'function', 'function kDr(', 'color by kind: walker->human, camera/target->camera, spotlight->light, else object', 'kind, palette -> color'),
 T('SDr', 'function', 'function SDr(', 'MAIN PAINTER: bg fill -> TDr grid -> pools(IDr) -> non-char items(jDr) -> CDr selected paths+dim + stroke(vDr xDr) -> char items(jDr) -> EDr group boxes -> focus ADr -> PDr callout -> marquee', 'ctx, {view,items,selection,paths,palette,marquee,dimPathOf,stroke,focus} -> void'),
 T('TDr', 'function', 'function TDr(', 'grid: 1m minors alpha _Dr skipping oye-5m multiples, 5m majors', 'ctx, view, palette -> void'),
 T('q5', 'function', 'function q5(', 'text label painter (sizePx/color/align/fontFamily)', 'ctx, text, x, y, opts -> void'),
 T('$Zt', 'function', 'function $Zt(', 'beginPath + polyline through world points (no stroke)', 'ctx, view, pts -> void'),
 T('ADr', 'function', 'function ADr(', 'focus overlay: dashed accent line fromId->subjectId + cross (wDr ring, iit/lye arms) + q5 label', 'ctx, view, items, focus, palette -> void'),
 T('CDr', 'function', 'function CDr(', 'selected paths painter: kDr color by kind, dimmed if dimPathOf; $Zt + dashed stroke [2,4] 1.4px; keys as diamond markers', 'ctx, view, paths, selection, palette, dimPathOf -> void'),
 T('cBe', 'function', 'function cBe(', 'rotated polygon path (cos/sin yaw)', 'ctx, center, pts, yawRad -> void'),
 T('dBe', 'function', 'function dBe(', 'rotated rect path via cBe', 'ctx, center, w, h, yawRad -> void'),
 T('EDr', 'function', 'function EDr(', 'simple_figure body painter: dBe rect (uDr min px), head Nie arc + Pie=72° face arc (aqt contrast), direction tick FU', 'ctx, view, item, selected, palette -> void'),
 T('VZt', 'function', 'function VZt(', 'stick-figure painter: filled head circle (x, y-.72n, r=.3n), torso (x,-.4n)->(x,+.3n), arms single line ±.6n at -.12n, V legs (±.45n,+n)->(x,+.3n)->(±.45n,+n); lineWidth n>8?2.2:1.6 round caps', 'ctx, center, n, color -> void'),
 T('consts_oit', 'stmt', 'const oit=.35', 'oit=.35 unselected label alpha (humanoid/figure labels)', '—'),
 T('jDr', 'function', 'function jDr(', 'per-kind glyph painter dispatch (ctx, view, item, selected, palette, drawLabel=true): camera -> NDr wedge + oDr/lDr body polys (cBe yaw) + label at +18/+26 (l$=12); spotlight -> dashed [3,3] line to pool (alpha .9/.5) + ait=6 dot; marker(target) -> gDr=8 circle + ZY=12 cross; humanoid -> MDr size, VZt stick, forward tick 1.35u..2.1u lw1.6, label alpha 1/oit; simple_figure -> EDr body + label at bbox.maxX+6; props -> dBe rect / ellipse(-yaw) + selected label below', 'ctx, view, item, selected, palette, drawLabel -> void'),
 T('IDr', 'function', 'function IDr(', 'spotlight pool fill: circle r=radiusM·ppm, or dBe ROTATED SQUARE half-extent radiusM·ppm (aligned to fixture yaw, NOT √2-scaled); fill light, alpha yDr=.24 selected else bDr=.14, no stroke', 'ctx, view, item, selected, palette -> void'),
 T('MDr', 'function', 'function MDr(', 'stick figure unit size: clamp(dDr=6, hDr=12, ppm*cDr=.32)', 'view -> px'),
 T('NDr', 'function', 'function NDr(', 'camera fov wedge: triangle to pqt lens endpoints 4.2m ahead, alpha .2/.1 fill + .6/1 stroke 1.4/1', 'ctx, view, item, halfRad, selected, palette -> void'),
 T('PDr', 'function', 'function PDr(', 'single-selection callout: zDe ring + rotate & lens handle dots (cqt=6) + RDr direction tick', 'ctx, view, item, palette -> void'),
 T('RDr', 'function', 'function RDr(', 'rotate-handle direction tick: arc at r+pDr, angle atan2(-cos,-sin)', 'ctx, center, r, yawRad, palette -> void'),
 T('FDr', 'function', 'function FDr(', 'offscreen camera edge indicator painter: bubble uN=13 + camera name tag (q5)', 'ctx, indicators, palette -> void'),
 T('consts_cursor', 'slice', None, 'pencil "crosshair" cursor data-URI (cye) + plan css classes (uit) + nBr=320 centerOn ease ms + hit/pit label offsets', '—'),
]

# ===== Group E: stroke pipeline =====
TARGETS += [
 T('consts_stroke', 'stmt', 'const fHr=.3', 'simplify consts: fHr=.3 min arc m, mHr=.7 dwell time-reblend factor, gHr=.25 dwell-span detect s (stationary >=.25s), bHr=.1 pace sample spacing s, yHr=.2 anchor spacing m, Tit=1e4 pace quantization', '—'),
 T('vHr', 'function', 'function vHr(', 'simplify stroke samples -> {points, pace, durationS}|null: reject if <3 samples or arc<fHr(.3m); xHr finds dwell spans (>=gHr .25s stationary); wHr ¼-smooths ×2 ONLY non-anchor points (dwell+endpoints pinned); monotone time re-spread inside dwell spans by mHr=.7; pace = d=max(K2r 32, ceil(dur/bHr .1)+1) arc-fraction samples quantized 1/Tit(1e-4) clamped monotone, pace[0]=0 pace[-1]=1; anchor points >= yHr(.2m) apart, exact last point forced', 'samples[{x,z,t}] -> {points,pace,durationS}|null'),
 T('xHr', 'function', 'function xHr(', 'find dwell spans [startIdx,endIdx] where position unchanged and span >= gHr(.25s) — these become smoothing anchors', 'samples -> [start,end][]'),
 T('wHr', 'function', 'function wHr(', 'anchor-aware smoothing: pins {0,last}+dwell spans, ¼-averages all other points ×2 passes; re-zeroes t to elapsed-since-start (monotone)', 'samples, dwellSpans -> samples'),
 T('Ait', 'function', 'function Ait(', 'cumulative arc length of samples', 'samples -> cumsum[]'),
 T('consts_YZt', 'stmt', 'const YZt=2', 'YZt=2 camera steady speed m/s (+ trailing consts of other subsystems)', '—'),
 T('consts_speeds', 'stmt', 'const Htt=1.4', 'Htt=1.4 walker steady speed m/s, Qae=.01 min speed m/s', '—'),
 T('consts_K2r', 'stmt', 'const K2r=32', 'K2r=32 minimum pace sample count in vHr (d=max(32, ceil(dur/.1)+1))', '—'),
 T('mT', 'function', 'function mT(', 'anchors with tangents from points (buildTangents; non-uniform Catmull-Rom, bezier in/out at 1/3)', 'points[[x,y,z]] -> anchors[]'),
 T('consts_curve', 'stmt', 'const Ptt=12', 'curve consts: Ptt=12 bezier steps per span (nx resample density), Rtt WeakMap cache', '—'),
 T('xU', 'function', 'function xU(', 'euclidean distance between two vec3', '(a,b) -> m'),
 T('E2r', 'function', 'function E2r(', 'cubic bezier eval at t (used by nx)', '(p0,p1,p2,p3,t) -> vec3'),
 T('consts_gait', 'stmt', 'JCe="walk"', 'gait enum Gzt=[walk_formal,walk,jog_fwd,sprint], default gait JCe="walk" (humanoid path), keymap qzt', '—'),
 T('nx', 'function', 'function nx(', 'polyline from anchors (polylineOf, bezier resample)', 'anchors -> points[]'),
 T('MR', 'function', 'function MR(', 'arc length of polyline', 'points -> m'),
 T('Z_', 'function', 'function Z_(', 'fovDeg from focal mm + aspect (2*atan(35/aspect/2/focal))', 'focalMm, aspect -> fovDeg'),
 T('yd', 'function', 'function yd(', 'item duration: path/cam-path arc(MR(nx))/speedUnitsPerS else durationS', 'item -> s'),
 T('rx', 'function', 'function rx(', 'show duration (max item endS over tracks)', 'show -> s'),
 T('Bzt', 'function', 'function Bzt(', 'transform key interpolation at t (position lerp/rotation slerp)', 'keys, t -> pose'),
 T('replaceMoveFromSamples', 'method', 'replaceMoveFromSamples=(e,n,r,s)=>', 'show-store method: vHr simplify -> mT tangents -> speed = steady? (camera YZt=2 : Htt=1.4) : max(Qae=.01, MR(nx)/durationS); REPLACE existing move segment (kind path/cam-path, aim subject-if-focus else locked/camera), focalLengthMm preserved', '(id, startS, samples, {focusId,steady}) -> bool'),
 T('kv', 'function', 'function kv(', 'look-at rotation (quaternion) from position to target', 'pos, target -> quat/euler'),
 T('xM', 'function', 'function xM(', 'head-look solver with 70°/35° limits (used by previewPose focus)', 'yaw, from, to -> {bodyYawRad,look}'),
]

# ===== Group F: spotlight pool =====
TARGETS += [
 T('consts_spotlight', 'stmt', 'const QWt={', 'spotlight defaults: QWt={shape:round,intensity:70,diffusion:30}, JWt=16 deg per unit scale, eGt=3 tGt=55 clamp deg, W8r/G8r/q8r', '—'),
 T('BR', 'function', 'function BR(', 'spotlight cfg accessor: obj.spotlight ?? QWt', 'obj -> cfg'),
 T('nGt', 'function', 'function nGt(', 'spotlight cfg normalizer', 'cfg -> cfg|void'),
 T('gie', 'function', 'function gie(', 'clamp 0..100', 'v -> v'),
 T('Rhe', 'function', 'function Rhe(', 'pool half-angle rad from scale: min(55°, max(3°, 16°*avg|scale|))', 'scale -> rad'),
 T('rGt', 'function', 'function rGt(', 'half-angle in deg from scale (Rhe*360/π)', 'scale -> deg'),
 T('X8r', 'function', 'function X8r(', 'inverse: scale vector from half-angle deg', 'deg -> [x,y,z]'),
 T('TDe', 'function', 'function TDe(', 'POOL SOLVER(pose): forward=(0,0,-1).applyEuler(rotation); null unless position.y>0 && forward.y<=-0.05; d=y/-forward.y; pool {x: pos.x+f.x*d, z: pos.z+f.z*d, radiusM: d*tan(Rhe(scale))} — NO min-radius clamp', 'pose -> {x,z,radiusM}|null'),
]

# ===== Group G: object-kind helpers =====
TARGETS += [
 T('Zo', 'function', 'function Zo(', 'stored pose: position/rotation/scale defaults', 'obj, objects -> pose'),
 T('el', 'function', 'function el(', 'is walker kind (humanoid|simple_figure)', 'kind -> bool'),
 T('fie', 'function', 'function fie(', 'is stage fixture: camera|target|spotlight (no group promotion, excluded from setBounds)', 'kind -> bool'),
 T('Q0', 'function', 'function Q0(', 'is path-drawable kind (for replaceMoveFromSamples guard)', 'kind -> bool'),
 T('DDe', 'function', 'function DDe(', 'default object label: name or "Cube {n}" etc per kind', 'obj, kindIndex, i18n -> label'),
]

# ===== Group H: UI components =====
TARGETS += [
 T('consts_pillscss', 'stmt', 'const mRr=', 'camera pills css class names (Q2e) + draw pill group css (Eh)', '—'),
 T('yRr', 'function', 'function yRr(', 'camera pills: role=group, buttons aria-pressed when solely selected, swatch dot', '{cameras,selectedIds,onCameraClick} -> jsx'),
 T('RRr', 'function', 'function RRr(', 'draw-direction pill group: state draw|update|drawing; drawing -> Finish + match-speed checkbox (Vk78FE); update -> delete pill; person toggle (figure/humanoid) when person && !drawing', '{state,groupRef,matchDrawSpeed,person,onClick,onDeleteClick,onMatchDrawSpeedChange,onPersonClick,editsHidden,children} -> jsx'),
 T('FRr', 'function', 'function FRr(', 'phone-link pill (linked/lost/idle)', '{state,qrShown,onClick} -> jsx'),
 T('ORr', 'function', 'function ORr(', 'QR card overlay positioned via XIr each frame', '{name,sessionUrl,onCloseClick} -> jsx'),
 T('LRr', 'function', 'function LRr(', 'stroke timer display: nowS / ofS (draw seconds vs rest-of-show duration)', '{nowS,ofS} -> jsx'),
 T('iFr', 'function', 'function iFr(', 'zoom bar: percent readout + zoom out / zoom-to-fit / zoom in buttons', '{percent,className,onZoomOutClick,onZoomToFitClick,onZoomInClick} -> jsx'),
 T('rBr', 'function', 'function rBr(', 'THE PLAN CANVAS COMPONENT: data-testid stage-plan; pointer handlers (DLr/DZt/HLr reducers, uN+3 edge-bubble click, middle/right pan, tap-or-draw cursor cye + focusTip); wheel -> NLr; dpr resize; SDr paint; $Ir+FDr edge indicators; camera label overlay (ZIr); zoomCommand/centerRequest; onComponentDrop S1; per-frame rAF', 'props -> jsx'),
 T('sBr', 'function', 'function sBr(', 'plan page factory: new rDr(t); memo component wiring rBr + yRr + RRr + LRr + iFr; Escape -> stepBack', 'facade -> component'),
 T('ilt', 'function', 'function ilt(', 'segmented control primitive', 'props -> jsx'),
 T('KYr', 'function', 'function KYr(', 'topbar switch: stageView editor|cameras segmented; when editor -> viewportMode 3d|plan segmented (s7ndfi/WaHG3t)', '{mode,stageView,viewportMode,hasPlayHud,onStageViewChange,onViewportModeChange} -> jsx'),
 T('nQr', 'function', 'function nQr(', 'ViewSwitch/RecordControls factory reading viewportMode/planShown/planView props', 'deps -> {ViewportOverlays,RecordControls,ViewSwitch}'),
 T('Am', 'function', 'function Am(', 'recordAspect key -> {aspect,...} (aspect used for camera fov wedge hqt/Z_)', 'aspectKey -> aspect'),
 T('dye', 'function', 'function dye(t,e){const n=t.getBoundingClientRect()', 'pointer event -> canvas-local px (accounts css scale clientWidth/rect.width)', 'element, ev -> {x,y} px'),
 T('U6', 'function', 'function U6(', 'items of a character track (playback evaluator view)', '(facade, id) -> items'),
 T('cZt', 'function', 'function cZt(', 'cam-transform key pose at t (position/rotation/focal interpolation)', '(keys, t) -> pose'),
 T('ne_frameloop', 'function', 'function ne(){if(e.isDisposed()', 'RUNTIME FRAME LOOP: rig/handles/playback/preview/bounds/spotlights/record ticks all run; if planShown||!pageLive -> only scene.updateMatrixWorld() — the WebGL render pauses on the plan view', '-> void'),
 T('z_drawPreview', 'function', 'function z(){const pe=t.drawPreview.peek()', 'drawPreview ghost tick: pose mesh to preview pose (stroke preview mirrors into 3D)', '-> void'),
 T('se_playback', 'function', 'function se(){const ce=t.isPreviewPlaying.peek()', 'playback ticking gate (isPreviewPlaying || isPerformancePlaying …)', '-> bool'),
]

# ===== Group I: page store + runtime gating =====
TARGETS += [
 T('oKr_planbits', 'slice', None, 'class oKr fields: mode=Ne("edit"), viewportMode=Ne("3d"), setViewportMode, enterSceneNode (saves mode, setViewportMode("plan"), first-camera wait), leaveSceneNode (restore), planShown=Ne(viewportMode==="plan" && mode==="edit" && !playSession), editInteraction, lassoRect, toggleLasso', '—', wrapper='class'),
 T('keyboard_gate', 'stmt', '&&!n.planShown.peek()', 'WASD fly gate ne(): controlMode default && mode edit && !playSession && !planShown && !sceneNodeOpen', '-> bool'),
 T('shownPose_impl', 'method', 'shownPose:pe=>{', 'runtime facade shownPose(id): mesh world TRS via Bie + getWorldScale; +fovDeg for cameras; used by rDr items() to mirror playback', 'id -> pose|null', wrapper='object'),
]

# ----------------------------------------------------------------------------
# extraction driver
# ----------------------------------------------------------------------------

def find_anchor(anchor, expect_off=None):
    offs = [m.start() for m in re.finditer(re.escape(anchor), src)]
    if not offs:
        return None, []
    off = offs[0]
    if expect_off is not None and off != expect_off:
        print(f"  ! note: {anchor!r} found @{off} (expected {expect_off})")
    return off, offs

def extract(target):
    kind = target['kind']
    if kind == 'slice':
        return None  # handled via SLICES
    off, hits = find_anchor(target['anchor'])
    if off is None:
        return None
    if kind == 'function':
        return extract_function(off)
    if kind == 'method':
        return extract_method(off)
    if kind == 'stmt':
        return extract_stmt_containing(off)
    if kind == 'class':
        return extract_class(off)
    raise ValueError(kind)

# fixed slices (char ranges, tuned by hand): name -> (a, b, wrapper)
def _okr_planbits_range():
    a = src.index('mode=Ne("edit")')
    t = src.index('toggleLasso=')
    _, b = extract_method(t)
    return a, b

SLICES = {
 'consts_cursor':        (5497062, 5498039, 'plain'),  # dit pencil-svg path, JDr cursor builder, cye cursor, eBr/tBr/uit css, nBr=320, hit/pit
 'oKr_planbits':         (*_okr_planbits_range(), 'class'),
}

def wrapper_for(target, code):
    if target.get('wrapper'):
        return target['wrapper']
    k = target['kind']
    if k == 'method':
        # object-literal property `shownPose:pe=>{` vs class prop `items=()=>{`
        m = re.match(r'[\w$]+', code)
        if m and code[m.end()] == ':':
            return 'object'
        return 'class'
    if k == 'class' and code.startswith('class'):
        return 'plain'
    return 'plain'

def write_fn(target, rng):
    a, b = rng
    name = target['name']
    code = src[a:b]
    deps = free_idents(code)
    header = []
    header.append('// ' + '='*76)
    header.append(f'// fn: {name}' + (f'   (bundle minified: {target["anchor"]})' if target['anchor'] else ''))
    header.append(f'// char range: {a}..{b}   (byte range: {byte_off(a)}..{byte_off(b)})')
    header.append(f'// purpose: {target["purpose"]}')
    header.append(f'// params: {target["params"]}')
    header.append(f'// closure/global deps (auto-derived, approximate): {", ".join(deps) if deps else "(none)"}')
    header.append('// ' + '='*76)
    path = os.path.join(OUT, f'fn_{name}.js')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(header) + '\n' + code + '\n')
    # validation wrapper
    w = wrapper_for(target, code)
    if w == 'class':
        wrapped = 'class __Validate__ {\n' + code + '\n}\n'
    elif w == 'object':
        wrapped = 'const __Validate__ = {\n' + code + '\n};\n'
    else:
        wrapped = '(() => {\n' + code + '\n});\n'
    check = os.path.join(OUT, '.check', f'{name}.check.js')
    os.makedirs(os.path.dirname(check), exist_ok=True)
    with open(check, 'w', encoding='utf-8') as f:
        f.write(wrapped)
    return dict(name=name, kind=target['kind'], a=a, b=b, chars=b-a,
                deps=deps, anchor=target['anchor'], purpose=target['purpose'],
                params=target['params'], check=check)

def validate(checkpath):
    r = subprocess.run(['node', '--check', checkpath], capture_output=True, text=True)
    return r.returncode == 0, (r.stderr or '').strip().splitlines()[-1] if r.returncode else ''

def main():
    if '--probe' in sys.argv:
        for sig in sys.argv[sys.argv.index('--probe')+1:]:
            offs = [m.start() for m in re.finditer(re.escape(sig), src)]
            print(f'{sig!r}: {len(offs)} hits -> {offs[:10]}')
        return

    check_only = '--check-only' in sys.argv
    if check_only:
        bad, n = [], 0
        cd = os.path.join(OUT, '.check')
        for f in sorted(os.listdir(cd)):
            if not f.endswith('.check.js'):
                continue
            n += 1
            ok, err = validate(os.path.join(cd, f))
            if not ok:
                bad.append((f, err))
        print(f'validated {n} units; failures: {bad if bad else "none"}')
        return

    results, failures, notfound = [], [], []
    for t in TARGETS:
        if t['kind'] == 'slice':
            if t['name'] in SLICES:
                a, b, w = SLICES[t['name']]
                results.append(write_fn(dict(t, wrapper=w), (a, b)))
            else:
                notfound.append((t['name'], 'no slice range defined'))
            continue
        rng = extract(t)
        if rng is None:
            notfound.append((t['name'], f"anchor not found: {t['anchor']!r}"))
            continue
        try:
            results.append(write_fn(t, rng))
        except Exception as e:
            failures.append((t['name'], f'{type(e).__name__}: {e}'))

    # validate
    bad = []
    for r in results:
        ok, err = validate(r['check'])
        if not ok:
            bad.append((r['name'], err))
    # fn_index.json
    with open(os.path.join(OUT, 'fn_index.json'), 'w') as f:
        json.dump([{k: v for k, v in r.items() if k != 'check'} for r in results], f, indent=1)

    print(f'extracted {len(results)} units -> {OUT}')
    for r in sorted(results, key=lambda r: r['a']):
        print(f'  {r["name"]:<28} @{r["a"]:>8}..{r["b"]:<8} {r["chars"]:>6} ch  deps={len(r["deps"])}')
    if bad:
        print('\nSYNTAX CHECK FAILURES:')
        for n, e in bad:
            print(f'  {n}: {e}')
    else:
        print('\nall units pass node --check')
    if failures:
        print('\nEXTRACTION FAILURES:')
        for n, e in failures:
            print(f'  {n}: {e}')
    if notfound:
        print('\nNOT FOUND:')
        for n, e in notfound:
            print(f'  {n}: {e}')

if __name__ == '__main__':
    main()
