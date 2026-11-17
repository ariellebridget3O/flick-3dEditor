#!/usr/bin/env python3
# read file, print with '[' replaced by '‹' so the tool output filter doesn't eat '[h'
import sys
path = sys.argv[1]
a = int(sys.argv[2]) if len(sys.argv) > 2 else 1
b = int(sys.argv[3]) if len(sys.argv) > 3 else 10**9
lines = open(path, encoding='utf-8').read().split('\n')
for i in range(a - 1, min(b, len(lines))):
    print(f"{i+1}\t{lines[i].replace('[', chr(0x2039))}")
