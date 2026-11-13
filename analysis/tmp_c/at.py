#!/usr/bin/env python3
"""Dump bundle around byte offsets with optional formatting (insert newlines after ; and { })."""
import sys, re

BUNDLE = "/home/z/flick-3dEditor/analysis/index-DBE17t4T.js"
SRC = open(BUNDLE, encoding="utf-8").read()

def pretty(s):
    # crude de-minifier: newline after ; { } when followed by something
    s = re.sub(r"(;)(?=[A-Za-z_$])", r";\n", s)
    s = re.sub(r"(\{)(?=[A-Za-z_$\"'])", r"{\n", s)
    s = re.sub(r"(\})(?=[A-Za-z_$\"'])", r"}\n", s)
    s = re.sub(r"(,)(?=(?:[A-Za-z_$][\w$]*):)", r",\n", s)
    return s

if __name__ == "__main__":
    off = int(sys.argv[1])
    before = int(sys.argv[2]) if len(sys.argv) > 2 else 400
    after = int(sys.argv[3]) if len(sys.argv) > 3 else 3000
    pretty_mode = len(sys.argv) > 4 and sys.argv[4] == "pretty"
    s = SRC[max(0,off-before):off+after]
    print(f"### offset {off} (range {max(0,off-before)}..{off+after}) ###")
    print(pretty(s) if pretty_mode else s)
