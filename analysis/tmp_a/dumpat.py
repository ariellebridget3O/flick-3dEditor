import sys
sys.path.insert(0, '/home/z/flick-3dEditor/analysis/tmp_a')
from search import dump
off = int(sys.argv[1]); before = int(sys.argv[2]) if len(sys.argv)>2 else 200; after = int(sys.argv[3]) if len(sys.argv)>3 else 1200
label = sys.argv[4] if len(sys.argv)>4 else None
dump(off, before, after, label)
