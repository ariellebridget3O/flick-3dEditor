import re
BUNDLE = "/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js"
SRC = open(BUNDLE, encoding="utf-8", errors="replace").read()
N = len(SRC)

def off(sig, start=0):
    """All byte offsets of a literal signature."""
    return [m.start() for m in re.finditer(re.escape(sig), SRC[start:])]

def around(pos, before=400, after=1200):
    a = max(0, pos-before); b = min(N, pos+after)
    return f"--- @{pos} ---\n" + SRC[a:b]

def find_re(pat, before=400, after=1200, limit=10):
    out=[]
    for i,m in enumerate(re.finditer(pat, SRC)):
        if i>=limit: break
        out.append((m.start(), SRC[max(0,m.start()-before):m.start()+after]))
    return out
