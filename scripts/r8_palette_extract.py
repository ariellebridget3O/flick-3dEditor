#!/usr/bin/env python3
"""r8_palette_extract.py — Round 8: VERBATIM function-level extraction of the live
flick.art "Actions palette" subsystem (the M5r component family) from the minified
production bundle.

Bundle: analysis/index-DBE17t4T.js  (single-line minified; offsets below are
CHARACTER offsets into the UTF-8 decoded text, matching find_ctx.py / r7_plan_extract.py).
Byte offsets (grep -bo) are computed and printed in each header.

Outputs -> analysis/tmp_palette_exact/
  fn_<name>.js   verbatim minified source + header (name, char range, byte range,
                 purpose, params, auto-derived closure deps)
  fn_index.json  machine-readable index
  (MAP.md is written by hand afterwards)

Every unit is syntax-validated with `node --check` (wrapped: plain IIFE for
functions/statements, dummy class for class-property methods).

Extraction kinds (same as r7):
  function | method | stmt | class | slice

Usage:
  python3 scripts/r8_palette_extract.py              # full run
  python3 scripts/r8_palette_extract.py --check-only # re-validate only
  python3 scripts/r8_palette_extract.py --probe SIG  # print offsets of a signature
"""
import json, os, re, subprocess, sys, bisect

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLE = os.path.join(ROOT, 'analysis', 'index-DBE17t4T.js')
OUT = os.path.join(ROOT, 'analysis', 'tmp_palette_exact')
os.makedirs(OUT, exist_ok=True)

src = open(BUNDLE, encoding='utf-8', errors='replace').read()
N = len(src)

# Real UTF-8 byte offsets: multi-byte chars contribute 1..3 EXTRA bytes
# (r7's +1-per-nonascii approximation under-counts 3-byte chars — verified
# against `grep -bo` anchors, e.g. 'function M5r(' -> byte 5137181).
_byteidx = []   # (char_index, cumulative_extra_bytes_up_to_and_including_that_char)
_extra = 0
for _i, _c in enumerate(src):
    if ord(_c) > 0x7F:
        _extra += len(_c.encode('utf-8')) - 1
        _byteidx.append((_i, _extra))
_idx_pos = [p for p, _ in _byteidx]
def byte_off(char_off):
    k = bisect.bisect_left(_idx_pos, char_off)
    return char_off + (_byteidx[k-1][1] if k else 0)

# ----------------------------------------------------------------------------
# scanning engine (string/template/comment/regex aware) — copied from r7
# ----------------------------------------------------------------------------

def skip_string(i):
    q = src[i]
    i += 1
    while i < N:
        c = src[i]
        if c == '\\':
            i += 2
            continue
        if q == '`' and c == '$' and i + 1 < N and src[i+1] == '{':
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
    if src[i+1] == '/':
        j = src.find('\n', i)
        return N if j < 0 else j + 1
    j = src.find('*/', i + 2)
    return N if j < 0 else j + 2

_REGEX_PREV = set('(,=:[!&|?{};<>+-*/%^~') | {'return', 'typeof', 'case', 'in', 'of', 'new', 'do', 'else'}

def _prev_token_ends_regex():
    j = _scan_pos[0] - 1
    while j >= 0 and src[j] in ' \t\n':
        j -= 1
    if j < 0:
        return True
    if src[j] in _REGEX_PREV:
        return True
    k = j
    while k >= 0 and (src[k].isalnum() or src[k] in '_$'):
        k -= 1
    word = src[k+1:j+1]
    return word in _REGEX_PREV

_scan_pos = [0]

def skip_regex(i):
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
            while i < N and src[i].isalpha():
                i += 1
            return i
        elif c == '\n':
            return i
        i += 1
    return i

def match_brace(open_idx):
    depth = 0
    i = open_idx
    stack_p = 0
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
                return i
        elif c == ';' and depth == 0:
            return i + 1
        i += 1
    return i

def walk_back_stmt(pos):
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
    m = re.compile(r'function\s*[\w$]*\s*\(').match(src, off)
    assert m, f"not a function decl @{off}: {src[off:off+40]!r}"
    p = match_paren(m.end() - 1)
    i = p + 1
    while i < N and src[i] in ' \t\n':
        i += 1
    if src[i] == '{':
        return off, match_brace(i) + 1
    return off, stmt_end(off)

def extract_method(off):
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
        if c == '/':
            _scan_pos[0] = j
            if _prev_token_ends_regex():
                j = skip_regex(j)
                continue
        if c in '([{':
            depth += 1
        elif c in ')]}':
            if depth == 0:
                return off, j
            depth -= 1
        elif c == ';' and depth == 0 and not is_object_prop:
            return off, j + 1
        elif c == ',' and depth == 0 and is_object_prop:
            return off, j
        j += 1
    return off, j

def extract_stmt_containing(off):
    start = walk_back_stmt(off)
    return start, stmt_end(start)

def extract_class(off):
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
requestIdleCallback structuredClone queueMicrotask BroadcastChannel navigator URL URLSearchParams'''.split())

IDENT_RE = re.compile(r'[A-Za-z_$][\w$]*')
PROP_RE = re.compile(r'\.\s*([A-Za-z_$][\w$]*)')

def free_idents(code):
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
    bound = set()
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
    for m in re.finditer(r'([\w$]+)\s*=>', clean):
        bound.add(m.group(1))
    props = set(PROP_RE.findall(clean))
    idents = {}
    for m in IDENT_RE.finditer(clean):
        w = m.group()
        if w in KEYWORDS or w in GLOBALS or w in props or w in bound:
            continue
        idents[w] = idents.get(w, 0) + 1
    return sorted(idents, key=lambda w: -idents[w])

# ----------------------------------------------------------------------------
# target registry
# ----------------------------------------------------------------------------

def T(name, kind, anchor, purpose, params='?', wrapper=None):
    return dict(name=name, kind=kind, anchor=anchor, purpose=purpose,
                params=params, wrapper=wrapper)

TARGETS = []

# ===== Group A: action-kind registry + drag payload model =====
TARGETS += [
 T('consts_Lhe', 'stmt', 'const Lhe=', 'HUMANOID CLIP CATALOG: 46 entries {id,durationS} (a_tpose..walk_formal) + XSr=Map(id->durationS)', '-> [{id,durationS}], Map'),
 T('IDe', 'function', 'function IDe(', 'clip duration lookup: XSr.get(id) ?? 1 (D5r.drawPose multiplies by L5r=.35 for the still-thumb pose time)', 'clipId -> durationS'),
 T('consts_action_mimes', 'stmt', 'const $v=', 'DRAG MIME + ACTION-ID REGISTRY: $v="application/x-stage-action" (drag dataTransfer type); YSr=[rotate,revolve,scale-up,scale-down,transform,rig-transform] object actions (QSr=Set); xie=[still,path,follow,transform,manual,...bP] camera actions (JSr=Set)', '-> consts'),
 T('t3r', 'stmt', 'const t3r=', 't3r=Set(Lhe ids) — valid clip ids for payload parse', '-> Set'),
 T('e3r', 'function', 'function e3r(', 'DRAGSTART SERIALIZER: {kind:"clip",clip}->"clip:<clip>"; {kind:"object",action}->"object:<action>"; {kind:"camera",action}->"camera:<action>"; else kind string (path/play)', 'payload -> string'),
 T('MDe', 'function', 'function MDe(', 'DRAGOVER/DROP PARSER (inverse of e3r): "path"->{kind:"path"}, "play"->{kind:"play"}, "clip:<id>"->{kind:"clip",clip} iff t3r.has(id), "object:<a>"->{kind:"object",action} iff QSr.has(a), "camera:<a>"->{kind:"camera",action} iff JSr.has(a), else null', 'string -> payload|null'),
 T('n3r', 'function', 'function n3r(', 'DEFAULT DURATION when dropped on a timeline lane: clip->N8(5s); object->transform|rig-transform?Jae(4s):N8(5s); camera->sje(action); else 0', 'payload -> seconds'),
 T('sje', 'function', 'function sje(', 'camera action default duration: _1[action].durationS (cinematic presets); path|manual->0; transform->Jae(4); else N8(5)', 'action -> seconds'),
 T('a$', 'function', 'function a$(','DROP-COERCION RULE: action payload -> concrete action for object kind e ("cube"|"humanoid"|"camera"|...). camera kind: object-transform→camera-transform, path→camera-path (iff Q0(e)); humanoid: camera-path→path iff Q0, camera-transform→object transform iff Q0; rig-transform only humanoid; clips only via e==="humanoid" tail', 'payload, kind -> action|null'),
 T('bGt', 'function', 'function bGt(', 'normalize internal/legacy drag kinds to canonical payloads: rotate/revolve/scale(factor>=1?scale-up:scale-down)/transform/rig-transform/cam-still/cam-move{move}/cam-path/cam-follow/cam-transform/cam-manual', 'payload -> payload'),
 T('yGt', 'function', 'function yGt(', 'action equality (same kind+action/clip; path vs path always equal)', 'a, b -> bool'),
 T('r3r', 'function', 'function r3r(', 'payload -> drop-target kind tags: cube-capable->"object", humanoid->"human", camera->"camera" (highlight bucket keys)', 'payload -> ["object"|"human"|"camera"]'),
 T('Art', 'function', 'function Art(', 'can-add-action primitive: bGt(payload) -> a$(parsed, kind) !== null && yGt(parsed, coerced)', 'payload, kind -> bool'),
 T('consts_bP', 'stmt', 'const bP=', 'CINEMATIC CAMERA MOVES: bP=[orbit,dolly_in,dolly_out,dolly_zoom,crane_up,crane_down,spiral,pan_sweep]; YLe orbit-class; QLe vertical class; JLe dolly class; yP=bP minus pan_sweep; _1 presets {durationS,angleDeg,heightDeltaUnits,distanceScale}; s2r=10 a2r=120 fov clamp', '-> consts'),
 T('eDe', 'function', 'function eDe(', 'smoothstep 0..1 easing for cinematic moves', 't -> e'),
 T('i2r', 'function', 'function i2r(', 'fov clamp 10..120 deg (dolly_zoom guard)', 'deg -> deg'),
 T('KCe', 'function', 'function KCe(', 'CAMERA-MOVE POSE EVALUATOR: {kind,start,target,direction?,baseFovDeg,angleDeg?,heightDeltaUnits?,distanceScale?,t} -> {position,lookAt,fovDeg}; crane = vertical lift; dolly = radial scale + dolly_zoom fov compensation; orbit/spiral = polar sweep around target; pan_sweep = rotate lookAt around start', 'spec -> {position,lookAt,fovDeg}'),
]

# ===== Group B: labels =====
TARGETS += [
 T('NDe', 'function', 'function NDe(', 'cinematic move -> i18n label: orbit k1ojqx, dolly_in DMQ5rS, dolly_out i7+TXP, dolly_zoom 2HQ6pZ, crane_up QQHcNA, crane_down 0+8v4P, spiral d8dJnh, pan_sweep DzL+ir', 'action -> string'),
 T('s3r', 'function', 'function s3r(', 'camera ACTION -> i18n label: still 6Kqbka, path I6gXOa, follow MKEPCY, transform OCy3k9, manual zmwvG2, else NDe for cinematic', 'action -> string'),
 T('PDe', 'function', 'function PDe(', 'camera track ITEM kind -> label: cam-still/cam-move/cam-path/cam-follow/cam-transform/cam-manual reuse same i18n ids', 'item -> string'),
 T('ODe', 'function', 'function ODe(', 'clip label fallback: t in PU ? i18n._(PU[t]) : t', 'clipId, i18n -> string'),
]

# ===== Group C: palette chrome (window, tabs, search, tiles) =====
TARGETS += [
 T('consts_PU_vGt_Crt', 'stmt', 'const PU=', 'PU clip->i18n-key map (46 ids); vGt=ANIMATE-TAB CLIP LIST = Lhe minus a_tpose (45); a3r/i3r/o3r/l3r/c3r Crt resize-handle CSS class strings (_handle_1pcmd_1/_left_.../_right_15/_top_30/_bottom_31)', '-> consts'),
 T('Dhe', 'function', 'function Dhe(', 'resize handle (edge top|bottom|left|right, sign ±1): pointer capture, onSizePx(startSize ± delta) — palette uses edge:right sign:1', '{edge,sign,onSizePx} -> jsx'),
 T('consts_Zr', 'stmt', 'const d3r=', 'Zr palette CSS module (kwh50): hudWindow/hudScroll/title/close/search/tabs/tabsHug/tab/active/tabLabel/tabCount/scroll/tabPane/grid/tile/tileThumb/iconThumb/tileName/empty', '-> css class strings'),
 T('RDe', 'function', 'function RDe(', 'search box: icon K("search") + input, onValueChange; class Zr.search', '{value,label,onValueChange} -> jsx'),
 T('FDe', 'function', 'function FDe(', 'tab strip: buttons aria-pressed, fit "fill"|"hug", optional count badge, data-onboard-target', '{tabs,active,fit,onTabClick} -> jsx'),
 T('consts_ff_IP', 'stmt', 'const v5r=', 'ff CSS module (1a7mk): reveal/revealCollapsed/actionsWindow/tile/tileAdd/sectionLabel/tabCaption/switchNotice; IP=128 tile px; C5r tab captions (move ZHYI6T, animate WSviW0, camera xmwcS8); E5r object-action list [{action,icon,label,color}]; j5r="var(--stage-action-camera)"; I5r camera icon map {still:stop,path:spline,follow:locate,transform:sliders,manual:phone-camera}', '-> consts'),
 T('M5r', 'function', 'function M5r(', 'THE ACTIONS PALETTE (entry): reveal wrapper + hudWindow aside, Dhe right resize, title "Actions"+close, RDe search, FDe tabs (move/animate/camera + counts while searching), tabCaption C5r, 3 tab panes: move=[F5r path, E5r tiles (transform inline, rest O5r)], animate=[switchNotice (LtrDTL+dvQ5qW via Ws), Perform: play tile T91vKp gamepad + rig-transform tile f88wXe person, Clips: R5r tiles], camera=[P5r tiles]; drag start P(se,X): dataTransfer.setData($v, e3r(X)) effectAllowed copy + onActionDragStart; search auto-switches tab when empty', 'props -> jsx'),
 T('N5r', 'function', 'function N5r(', 'add-button tile (ff.tileAdd): enabled=canAddAction(payload); disabled aria/label 13Y2lv, enabled BNg2cx; icon K add', '{enabled,onClick} -> jsx'),
 T('P5r', 'function', 'function P5r(', 'camera action tile: canvas preview when g5r(action) (cinematic), else iconThumb I5r[action]??"video" colored j5r; drag {kind:"camera",action}; hover start/stop loop; title 1YVTmS; aria rYb0+Q', 'props -> jsx'),
 T('R5r', 'function', 'function R5r(', 'clip tile: canvas 128 tileThumb drawTile(canvas,clip); drag {kind:"clip",clip}; hover start/stop loop; dance->data-onboard-target="dance-tile"', 'props -> jsx'),
 T('F5r', 'function', 'function F5r(', 'path tile: icon spline (--stage-action-object); drag {kind:"path"} + onPathDragStart; title a1QB8W', 'props -> jsx'),
 T('O5r', 'function', 'function O5r(', 'object action tile: canvas 128 tileThumb drawObjectTile(canvas,action); drag {kind:"object",action}; hover start/stop loop; title w2DmPr', 'props -> jsx'),
 T('Ze', 'function', 'function Ze(', 'classnames helper (clsx-like): join truthy class strings', '...args -> string'),
]

# ===== Group D: tile preview renderers (the three mini 3D canvases) =====
TARGETS += [
 T('consts_c5r', 'stmt', 'const c5r=', 'preview assets: c5r=Hhe="/assets/humanoid-B4Yewrzp.glb" (ALL three preview renderers load this), jP=1.75 normalize height m, d5r="M_Main" skin material name', '-> consts'),
 T('$he', 'function', 'function $he(', 'preview material normalize: traverse meshes, roughness=X_, material named M_Main -> color Phe', 'scene -> void'),
 T('u5r', 'function', 'function u5r(', 'mannequin fallback builder (capsule torso+head+arms+legs, color Phe)', '-> Group'),
 T('Rrt', 'function', 'function Rrt(', 'dispose skinned meshes: traverse RR -> skeleton.dispose()', 'root -> void'),
 T('consts_Frt', 'stmt', 'const Frt=128', 'camera-tile consts: Frt=128 px, Ort=3 loop s, h5r=[0,1.6,4.5] start, p5r=[0,1.1,0] target, Lrt=40 fov, f5r="idle" anim clip, m5r per-action STILL pose t {orbit:.28,dolly_in:.75,dolly_out:.75,dolly_zoom:.8,crane_up:.7,crane_down:.7,spiral:.35,pan_sweep:.45}', '-> consts'),
 T('g5r', 'function', 'function g5r(', 'is cinematic camera move (bP.includes) — only these get live canvas tiles', 'action -> bool'),
 T('b5r', 'function', 'function b5r(', 'triangle wave 1-|2t-1| (camera loop ping-pong)', 't -> 0..1'),
 T('y5r', 'class', 'class y5r', 'CAMERA TILE PREVIEW RENDERER: loads humanoid glb as subject + idle mixer, builds set (ground plane + 3 pillars, light 0xFFFFFF/0x444666 int 2.2 + dir light), renderTo blits webgl->2d ctx; drawPose(canvas,action)= still pose KCe({...m5r t}); startLoop ping-pongs b5r(a%Ort/Ort); dispose mixer+scene', '-> class'),
 T('Drt', 'function', 'function Drt(', 'skeleton dispose (D5r twin of Rrt)', 'root -> void'),
 T('consts_Brt', 'stmt', 'const Brt=128', 'Brt=128 tile px, L5r=.35 — drawPose samples clip at IDe(clip)*L5r (35% of duration) for the still thumbnail', '-> consts'),
 T('D5r', 'class', 'class D5r', 'HUMANOID CLIP TILE RENDERER: loadAsync Hhe, normalize to jP=1.75, mixer + all animations into actions Map; setClip(name,time) crossfades; drawPose(canvas,clip)= setClip(clip, IDe(clip)*L5r) render; startLoop= rAF mixer.update; stopLoop drains pendingPoses; camera (.7,1.3,3.1) lookAt (0,.85,0)', '-> class'),
 T('consts_Hrt', 'stmt', 'const Hrt=128', 'cube-tile consts: Hrt=128 px, h2e=2.4 loop s, B5r still-pose fractions {rotate:.14,revolve:.12,scale-up:.5,scale-down:.5}', '-> consts'),
 T('$rt', 'function', 'function $rt(', 'triangle wave 1-|2t-1| (H5r scale ping-pong)', 't -> 0..1'),
 T('H5r', 'class', 'class H5r', 'OBJECT-ACTION CUBE TILE RENDERER: 1x1x1 MeshStandardMaterial color 13404228 (0xCCAC44? see map) roughness .55 metalness .05; applyPose per action (rotate spin y, revolve circle r=.7, scale ±$rt*.7/.5); drawPose=start pose at B5r[a]*h2e; startLoop real-time; no asset load', '-> class'),
 T('$5r', 'function', 'function $5r(', 'CALLER FACTORY: creates D5r (clip tiles) + H5r (object tiles) + y5r (camera tiles); ActionsPanel memo renders i.jsx(M5r,{show:!collapsed&&panelsVisible, onClose:toggleCollapsed, widthPx, onWidthChange:setWidthPx, drawTile/startTilePreview/stopTilePreview=e.*, drawObjectTile/...=n.*, drawCameraTile/...=r.*, onActionDragStart:setDraggingAction, onActionDragEnd:clearDraggingAction, canAddAction:id&&canDropActionOnObject(id,payload), onAddActionClick:id&&appendActionToObject(id,payload), onPathDragStart:t.onPathDrag, onPlayDragStart:t.onPlayDrag, requestedTab, selectedFigureName (simple_figure name||"Figure"), onSwitchToHumanClick:pickPersonKind(id,"humanoid","actions")}); disposeActionsPanel disposes all three', 'facade -> {ActionsPanel,disposeActionsPanel}'),
]

# ===== Group E: drop targets (viewport) =====
TARGETS += [
 T('consts_Bit', 'stmt', 'const Bit=3829720', 'drop-highlight emissive consts: Bit=3829720 (0x3A7C58) + Hit=.4 idle intensity; OUr=3394696 (0x33D948) hover + LUr=.9; DUr=t=>"emissive" in t (glowable material test)', '-> consts'),
 T('BUr', 'function', 'function BUr(', 'VIEWPORT ACTION-DROP CONTROLLER: qt effect reads draggingAction/draggingSegment -> candidate mesh ids (canDropActionOnObject / canDropSegmentOnObject), emissive-glow all candidates (Bit/Hit); raycast hover (On NDC via renderer.domElement rect, Bv.setFromCamera, intersectObjects, walk up to userData.objectId); dragover (types includes $v) -> dropEffect copy/none + hover glow OUr/LUr; drop -> MDe(parse data) + appendActionToObject(objectId, payload); dragleave/drop-cleanup; pointermove/up capture segment drop (dropSegmentOnObject)', '{a,renderer,camera,meshById,disposers} -> void'),
 T('consts_HUr', 'stmt', 'const HUr=.45', 'HUr=.45 ghost mesh opacity', '-> const'),
 T('$it', 'function', 'function $it(', 'ghost material clone: transparent, opacity .45, depthWrite false', 'material -> material'),
 T('$Ur', 'function', 'function $Ur(', 'apply ghost material to whole subtree (clone → $it each mesh)', 'root -> void'),
 T('VUr', 'function', 'function VUr(', 'COMPONENT DROP CONTROLLER (components palette → viewport): dragover types includes V6 → draggingComponent; ray∩ground plane r2(Vector3(0,1,0),0) → ghost preview mesh via Xqt.ensure(kind) + $Ur + position (x, UWt(kind), z); drop → addComponent(kind,[x,z]) + showComponentList()', '{a,renderer,scene,camera,disposers} -> void'),
 T('UWt', 'function', 'function UWt(', 'drop hover height by kind: target→zWt(1) else 0', 'kind -> m'),
 T('consts_zWt', 'stmt', 'const zWt=1', 'zWt=1 (target ghost height); trailing Jw=6 (maxConcurrency), WWt=1.6 (camera ghost y) belong to neighbors', '-> consts'),
 T('consts_AHr', 'stmt', 'AHr=2', 'scale item factors: AHr=2 (scale-up ×2), CHr=.5 (scale-down ×½), EHr=1', '-> consts'),
 T('BNr', 'function', 'function BNr(', 'component kind getter (obj.kind)', 'obj -> kind'),
 T('LU', 'function', 'function LU(', 'component cache key: prop → "prop:<propKey>" else kind', 'comp -> string'),
 T('consts_V6', 'stmt', 'V6="application/x-stage-component"', 'component drag MIME + RNr payload serializer head (prop:<propKey>...)', '-> consts'),
]

# ===== Group F: performance-store methods (append flow) =====
TARGETS += [
 T('setDraggingAction', 'method', 'setDraggingAction=', 'store.draggingAction.set(payload) — M5r onActionDragStart', 'payload -> void'),
 T('clearDraggingAction', 'method', 'clearDraggingAction=', 'store.draggingAction.set(null) — M5r onActionDragEnd', '-> void'),
 T('resolveActionForObject', 'method', 'resolveActionForObject=', 'a$(payload, objects[id].kind) — coerce action for a given object', 'id, payload -> action|null'),
 T('canDropActionOnObject', 'method', 'canDropActionOnObject=', 'canOwnTrack(id) && resolveActionForObject(id,payload)!==null', 'id, payload -> bool'),
 T('canOwnTrack', 'method', 'canOwnTrack=', '!Xu(objects,id) — object not referenced as a camera target', 'id -> bool'),
 T('addActionToTrack', 'method', 'addActionToTrack=', 'dispatch resolved action to track: path→addPathItem, play→addPlayItem, clip→addClipItem, camera→addCameraItem, object: rotate/revolve/scale-up(AHr=2)/scale-down(CHr=.5)/transform/rig-transform', 'trackId, payload, ?atS -> void'),
 T('appendActionToObject', 'method', 'appendActionToObject=', 'THE ADD-ACTION FLOW: guard canDropActionOnObject; find existing track by characterId ?? addPerformanceTrack(id); addActionToTrack(trackId, payload)', 'id, payload -> void'),
]

# ----------------------------------------------------------------------------
# driver
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

def wrapper_for(target, code):
    if target.get('wrapper'):
        return target['wrapper']
    k = target['kind']
    if k == 'method':
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
    header.append(f'// size: {b-a} chars / {byte_off(b)-byte_off(a)} bytes')
    header.append(f'// purpose: {target["purpose"]}')
    header.append(f'// params: {target["params"]}')
    header.append(f'// closure/global deps (auto-derived, approximate): {", ".join(deps) if deps else "(none)"}')
    header.append('// ' + '='*76)
    path = os.path.join(OUT, f'fn_{name}.js')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(header) + '\n' + code + '\n')
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
                bytes=byte_off(b)-byte_off(a), byte_a=byte_off(a), byte_b=byte_off(b),
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
        rng = extract(t)
        if rng is None:
            notfound.append((t['name'], f"anchor not found: {t['anchor']!r}"))
            continue
        try:
            results.append(write_fn(t, rng))
        except Exception as e:
            failures.append((t['name'], f'{type(e).__name__}: {e}'))

    bad = []
    for r in results:
        ok, err = validate(r['check'])
        if not ok:
            bad.append((r['name'], err))
    with open(os.path.join(OUT, 'fn_index.json'), 'w') as f:
        json.dump([{k: v for k, v in r.items() if k != 'check'} for r in results], f, indent=1)

    print(f'extracted {len(results)} units -> {OUT}')
    for r in sorted(results, key=lambda r: r['a']):
        print(f'  {r["name"]:<28} @{r["a"]:>8}..{r["b"]:<8} {r["chars"]:>6} ch (bytes {r["byte_a"]}..{r["byte_b"]})  deps={len(r["deps"])}')
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
