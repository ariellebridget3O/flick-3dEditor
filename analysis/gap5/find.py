import sys, re
BUNDLE = "/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js"
src = open(BUNDLE, encoding="utf-8", errors="replace").read()
def ctx(pat, before=150, after=350, limit=6, flags=0):
    print(f"\n{'='*16} {pat} {'='*16}")
    n=0
    for m in re.finditer(pat, src, flags):
        if n>=limit: break
        s=max(0,m.start()-before); e=min(len(src),m.end()+after)
        print(f"--- @{m.start()} ---")
        print(src[s:e].replace("\n","\\n"))
        n+=1
    if n==0: print("(no hits)")
for pat in sys.argv[1:]:
    ctx(pat)
