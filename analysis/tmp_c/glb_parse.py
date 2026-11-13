#!/usr/bin/env python3
"""Parse a GLB file (little-endian): header, chunks; JSON chunk pretty tables.
Usage: python3 glb_parse.py <file.glb> [--bin-hex N]
"""
import json, struct, sys

def parse(path):
    out = {"path": path}
    with open(path, "rb") as f:
        data = f.read()
    out["size"] = len(data)
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    assert magic == b"glTF", f"not a GLB: {magic!r}"
    out["version"] = version
    out["declaredLength"] = length
    pos = 12
    chunks = []
    while pos < len(data):
        clen, ctype = struct.unpack_from("<II", data, pos)
        cdata = data[pos+8: pos+8+clen]
        chunks.append({"type": ctype, "typeStr": {0x4E4F534A: "JSON", 0x004E4942: "BIN"}.get(ctype, hex(ctype)), "length": clen, "start": pos+8})
        pos += 8 + clen + ((4 - clen % 4) % 4 if ctype == 0x4E4942 else 0)  # BIN chunks padded to 4
        pos = pos - ((4 - clen % 4) % 4 if ctype == 0x4E4942 else 0) + 8 + clen
        # simpler: recompute below
        break
    # simpler chunk walk
    chunks = []
    pos = 12
    while pos + 8 <= len(data):
        clen, ctype = struct.unpack_from("<II", data, pos)
        payload_start = pos + 8
        chunks.append({"typeStr": {0x4E4F534A: "JSON", 0x004E4942: "BIN"}.get(ctype, hex(ctype)), "length": clen, "start": payload_start})
        pos = payload_start + clen
        if ctype == 0x004E4942:  # BIN must be 4-byte aligned end (padding not included in clen)
            pos += (4 - clen % 4) % 4
    out["chunks"] = chunks
    json_chunk = next(c for c in chunks if c["typeStr"] == "JSON")
    gltf = json.loads(data[json_chunk["start"]: json_chunk["start"] + json_chunk["length"]].decode("utf-8"))
    out["gltf"] = gltf
    return out

def node_chain(idx, gltf, memo=None):
    if memo is None: memo = {}
    if idx in memo: return memo[idx]
    chain = []
    cur = idx
    while cur is not None and cur != -1:
        chain.append(cur)
        cur = gltf["nodes"][cur].get("children")
        break
    return chain

def report(out):
    gltf = out["gltf"]
    print(f"== {out['path']} ({out['size']:,} bytes, glTF {out['version']}) ==")
    print("chunks:", [(c["typeStr"], f"{c['length']:,}") for c in out["chunks"]])
    print("\n-- top-level keys:", sorted(gltf.keys()))
    if "scenes" in gltf:
        for si, sc in enumerate(gltf["scenes"]):
            print(f"scene[{si}]: name={sc.get('name')!r} roots={sc.get('nodes')}")
    nodes = gltf.get("nodes", [])
    print(f"\n-- {len(nodes)} nodes --")
    children_of = {}
    for i, n in enumerate(nodes):
        for c in n.get("children", []):
            children_of[c] = i
    def name(i): return nodes[i].get("name", f"<node{i}>")
    def depth(i):
        d = 0
        while i in children_of:
            i = children_of[i]; d += 1
        return d
    for i, n in enumerate(nodes):
        ind = "  " * depth(i)
        tags = []
        if "mesh" in n: tags.append(f"mesh={n['mesh']}")
        if "skin" in n: tags.append(f"skin={n['skin']}")
        if "camera" in n: tags.append(f"camera={n['camera']}")
        if "rotation" in n: tags.append(f"rot={n['rotation']}")
        if "scale" in n and n["scale"] != [1,1,1]: tags.append(f"scale={n['scale']}")
        if "translation" in n and n["translation"] != [0,0,0]: tags.append(f"t={n['translation']}")
        parent = children_of.get(i)
        print(f"{ind}[{i:3d}] {name(i)!r}" + (f"  (parent [{parent}] {name(parent)!r})" if parent is not None else "  (ROOT)") + ("  " + ", ".join(tags) if tags else ""))
    skins = gltf.get("skins", [])
    print(f"\n-- {len(skins)} skins --")
    for si, s in enumerate(skins):
        joints = s.get("joints", [])
        print(f"skin[{si}] name={s.get('name')!r} joints={len(joints)} skeleton={s.get('skeleton')} ibm={s.get('inverseBindMatrices')}")
        for j in joints:
            print(f"    joint [{j:3d}] {nodes[j].get('name', f'<node{j}>')!r}")
    anims = gltf.get("animations", [])
    print(f"\n-- {len(anims)} animations --")
    for ai, a in enumerate(anims):
        chans = a.get("channels", [])
        samplers = a.get("samplers", [])
        targets = {}
        for ch in chans:
            tgt = ch.get("target", {})
            p = tgt.get("path")
            ni = tgt.get("node")
            targets[p] = targets.get(p, 0) + 1
        # duration: max of input accessor max values
        dur = 0.0
        accs = gltf.get("accessors", [])
        for smp in samplers:
            inp = accs[smp.get("input", 0)]
            if inp.get("max") is not None:
                dur = max(dur, inp["max"][0] if isinstance(inp["max"], list) else inp["max"])
        print(f"anim[{ai:2d}] {a.get('name', f'<anim{ai}>')!r}: duration={dur:.6f}s channels={len(chans)} samplers={len(samplers)} {targets}")
    mats = gltf.get("materials", [])
    print(f"\n-- {len(mats)} materials --")
    for mi, m in enumerate(mats):
        pbr = m.get("pbrMetallicRoughness", {})
        print(f"material[{mi}] name={m.get('name')!r} baseColor={pbr.get('baseColorFactor')} metallic={pbr.get('metallicFactor')} roughness={pbr.get('roughnessFactor')} doubleSided={m.get('doubleSided')} alpha={m.get('alphaMode')}")
    meshes = gltf.get("meshes", [])
    print(f"\n-- {len(meshes)} meshes --")
    for mi, m in enumerate(meshes):
        prims = m.get("primitives", [])
        morph = m.get("extras", {}).get("targetNames") if "extras" in m else None
        print(f"mesh[{mi}] name={m.get('name')!r} prims={len(prims)} morphTargets={[len(p.get('targets', [])) for p in prims]} extrasTargetNames={morph}")
    accs = gltf.get("accessors", [])
    if accs: print(f"\n-- {len(accs)} accessors (first 10) --")
    for ai, a in enumerate(accs[:10]):
        print(f"accessor[{ai}] type={a.get('type')} componentType={a.get('componentType')} count={a.get('count')} min={a.get('min')} max={a.get('max')}")
    ex = gltf.get("extensionsUsed", [])
    print("\nextensionsUsed:", ex)
    print("extensionsRequired:", gltf.get("extensionsRequired", []))
    extras = gltf.get("extras")
    if extras: print("top-level extras:", str(extras)[:500])
    if "images" in gltf: print(f"\nimages: {len(gltf['images'])}", [im.get('mimeType', im.get('uri','?')[:40] if im.get('uri') else im.get('bufferView')) for im in gltf["images"]][:8])
    if "textures" in gltf: print("textures:", len(gltf["textures"]))

if __name__ == "__main__":
    rep = parse(sys.argv[1])
    report(rep)
    with open(sys.argv[2], "w") if len(sys.argv) > 2 else open("/dev/null", "w") as f:
        json.dump({"gltf": rep["gltf"], "chunks": rep["chunks"]}, f, indent=1)
