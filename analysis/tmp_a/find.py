import sys
sys.path.insert(0, '/home/z/flick-3dEditor/analysis/tmp_a')
from search import find_all
names = sys.argv[1:]
for name in names:
    pats = [r'function ' + name + r'\(', r'[,;{]' + name + r'=', r'let ' + name + r'=', r'const ' + name + r'=', r'var ' + name + r'=']
    locs = []
    for p in pats:
        locs += find_all(p)
    print(f'{name}: defs at {sorted(set(locs))[:12]}')
