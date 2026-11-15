import sys, re
BUNDLE = "/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js"
src = open(BUNDLE, encoding="utf-8", errors="replace").read()
# args: start end [outfile] — dumps raw region with newlines after ; and { } for readability
a, b = int(sys.argv[1]), int(sys.argv[2])
out = sys.argv[3] if len(sys.argv) > 3 else None
seg = src[a:b]
# naive pretty: newline after ; { } unless inside string — good enough for minified JS reading
pretty = re.sub(r'([;{}])', r'\1\n', seg)
if out:
    open(out, 'w').write(pretty)
    print(f"wrote {len(seg)} chars to {out}")
else:
    print(pretty[:20000])
