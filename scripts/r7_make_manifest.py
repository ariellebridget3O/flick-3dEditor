#!/usr/bin/env python3
"""R7-2: copy upstream flick-3dstage scene exports into editor/samples/upstream/ + manifest."""
import json, os, shutil, glob

SRC = '/home/sync/flick-3dstage/data/exports'
DST = '/home/z/my-project/flick-3dEditor/editor/samples/upstream'
os.makedirs(DST, exist_ok=True)

entries = []
for f in sorted(glob.glob(f'{SRC}/scene_*.json')):
    d = json.load(open(f))
    row, sc = d['row'], d['scene']
    objs = sc.get('objects') or {}
    kinds = {}
    for o in objs.values(): kinds[o['kind']] = kinds.get(o['kind'], 0) + 1
    items = sum(len(t.get('items') or []) for t in sc.get('show', {}).get('tracks') or [])
    name = f"{row['name']} ({f'{len(objs)} objects' if objs else 'empty'})"
    entries.append({
        'id': row['scene_id'], 'name': row['name'], 'file': os.path.basename(f),
        'objects': len(objs), 'items': items,
        'kinds': ', '.join(f'{k}×{v}' for k, v in sorted(kinds.items(), key=lambda x: -x[1])[:4]),
        'updated': row['updated_at'][:10],
    })
    shutil.copy(f, DST)

# e2e_scene_full.json (no row wrapper) — include as synthetic-style fixture
shutil.copy(f'{SRC}/e2e_scene_full.json', f'{DST}/../e2e_scene_full.json')

manifest = sorted(entries, key=lambda e: -e['objects'])
json.dump(manifest, open(f'{DST}/manifest.json', 'w'), indent=1)
print(f'{len(manifest)} scenes -> {DST}')
for e in manifest: print(f"  {e['name'][:28]:28} {e['objects']:>4} objs {e['items']} items  {e['kinds'][:50]}")
