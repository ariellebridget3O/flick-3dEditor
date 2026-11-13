#!/usr/bin/env python3
"""Deep GLB analysis: prim->material, stride-aware accessor reads, morph,
interpolation modes, bind-pose bbox and idle@t=0 skinned bbox (ground truth for 1.75m claim)."""
import json, struct, sys
from collections import defaultdict

def quat_to_mat(q):
    x, y, z, w = q
    n = (x*x+y*y+z*z+w*w) ** 0.5
    if n == 0: return identity()
    x, y, z, w = x/n, y/n, z/n, w/n
    return [
        [1-2*(y*y+z*z), 2*(x*y-z*w),   2*(x*z+y*w)],
        [2*(x*y+z*w),   1-2*(x*x+z*z), 2*(y*z-x*w)],
        [2*(x*z-y*w),   2*(y*z+x*w),   1-2*(x*x+y*y)],
    ]

def identity():
    return [[1,0,0],[0,1,0],[0,0,1]]

def matmul(a, b):
    return [[sum(a[i][k]*b[k][j] for k in range(3)) for j in range(3)] for i in range(3)]

def read_accessor(acc_idx, gltf, bin_data, bin_start):
    a = gltf["accessors"][acc_idx]
    bv = gltf["bufferViews"][a.get("bufferView", 0)]
    base = bin_start + bv.get("byteOffset", 0)
    stride = bv.get("byteStride", 0) or 0
    off0 = a.get("byteOffset", 0)
    comp = a["componentType"]; at = a["type"]; count = a["count"]
    sizes = {"SCALAR":1,"VEC2":2,"VEC3":3,"VEC4":4,"MAT4":16}
    fmts = {5120:"b",5121:"B",5122:"h",5123:"H",5125:"I",5126:"f"}
    n = sizes[at]; f = fmts[comp]
    if stride:
        out = []
        for i in range(count):
            off = base + off0 + i*stride
            vals = struct.unpack_from("<"+f*n, bin_data, off)
            out.append(list(vals))
    else:
        vals = struct.unpack_from("<"+f*(count*n), bin_data, base + off0)
        out = [list(vals[i*n:(i+1)*n]) for i in range(count)]
    if a.get("normalized") and comp in (5120, 5121, 5122, 5123):
        denom = {5120:127,5121:255,5122:32767,5123:65535}[comp]
        out = [[v/denom for v in row] for row in out]
    return out

path = "/home/sync/flick-3dstage/assets/app-shell/humanoid-B4Yewrzp.glb"
data = open(path, "rb").read()
pos = 12; json_chunk=None; bin_chunk=None; bin_start=None
while pos + 8 <= len(data):
    clen, ctype = struct.unpack_from("<II", data, pos)
    if ctype == 0x4E4F534A: json_chunk = data[pos+8:pos+8+clen]
    elif ctype == 0x004E4942: bin_chunk = data[pos+8:pos+8+clen]; bin_start = pos+8
    pos += 8 + clen + ((4-clen%4)%4 if ctype == 0x004E4942 else 0)
gltf = json.loads(json_chunk.decode())
BIN = bin_chunk
BIN_START = bin_start

def R(acc):
    return read_accessor(acc, gltf, data, BIN_START)

nodes = gltf["nodes"]
mesh = gltf["meshes"][0]
print("== mesh primitives ==")
prims = {}
for pi, p in enumerate(mesh["primitives"]):
    attrs = p["attributes"]
    pos = R(p["attributes"]["POSITION"])
    ys = [v[1] for v in pos]; xs=[v[0] for v in pos]; zs=[v[2] for v in pos]
    jnt = R(p["attributes"]["JOINTS_0"])
    wgt = R(p["attributes"]["WEIGHTS_0"])
    prims[pi] = (pos, jnt, wgt)
    print(f"prim[{pi}]: material={p.get('material')} attrs={sorted(attrs.keys())} verts={len(pos)}")
    print(f"   bbox x[{min(xs):.4f},{max(xs):.4f}] y[{min(ys):.4f},{max(ys):.4f}] z[{min(zs):.4f},{max(zs):.4f}] -> height {max(ys)-min(ys):.4f}")
    print(f"   JOINTS_0 first={jnt[0]} WEIGHTS[0]={wgt[0]} (sum={sum(wgt[0]):.3f})")

print("\n== sampler interpolation modes ==")
modes = defaultdict(int)
for a in gltf["animations"]:
    for s in a["samplers"]:
        modes[s.get("interpolation","LINEAR")] += 1
print(dict(modes))
# which paths use STEP?
step_paths = defaultdict(int); lin_paths = defaultdict(int)
for a in gltf["animations"]:
    for ch, s in zip(a["channels"], a["samplers"]):
        p = ch["target"]["path"]
        (step_paths if s.get("interpolation","LINEAR")=="STEP" else lin_paths)[p]+=1
print("STEP paths:", dict(step_paths), " LINEAR paths:", dict(lin_paths))

def local_matrix(n):
    m = quat_to_mat(n.get("rotation",[0,0,0,1])) if "rotation" in n else identity()
    if "scale" in n and n["scale"] != [1,1,1]:
        s = n["scale"]
        m = [[m[i][j]*s[j] for j in range(3)] for i in range(3)]
    t = n.get("translation",[0,0,0])
    return m, t

parent_of = {}
for i, n in enumerate(nodes):
    for c in n.get("children", []):
        parent_of[c] = i

world = {}
def world_of(i):
    if i in world: return world[i]
    m, t = local_matrix(nodes[i])
    p = parent_of.get(i)
    if p is not None:
        pm, pt = world_of(p)
        m = matmul(pm, m); t = [pt[k] + sum(pm[k][j]*t[j] for j in range(3)) for k in range(3)]
    world[i] = (m, t)
    return world[i]

scene_roots = gltf["scenes"][gltf["scene"]]["nodes"]
for r in scene_roots: world_of(r)
skin = gltf["skins"][0]
joints = skin["joints"]
ibm = R(skin["inverseBindMatrices"])
for j in joints: world_of(j)

print(f"\nskin: {len(joints)} joints, ibm {len(ibm)} matrices, skeleton={skin.get('skeleton')}")
print("== bind pose world Y of key nodes ==")
byname = {n.get("name"): i for i, n in enumerate(nodes)}
for nm in ["Rig","root","DEF-hips","DEF-head","DEF-toe.L","DEF-toe.R","Mannequin"]:
    if nm in byname:
        m, t = world_of(byname[nm])
        print(f"  {nm:12s} world pos {t[0]:+.4f} {t[1]:+.4f} {t[2]:+.4f}")

def mat_apply(m, t, v):
    return [m[0][0]*v[0]+m[0][1]*v[1]+m[0][2]*v[2]+t[0],
            m[1][0]*v[0]+m[1][1]*v[1]+m[1][2]*v[2]+t[1],
            m[2][0]*v[0]+m[2][1]*v[1]+m[2][2]*v[2]+t[2]]

def ibm_apply(mat16, v):
    # glTF MAT4 column-major: element(r,c) = mat16[c*4+r]
    return [sum(mat16[c*4+r]*v[c] for c in range(3)) + mat16[12+r] for r in range(3)]

def skin_bbox(pi, joint_world, use_ibm=True):
    pos, jnt, wgt = prims[pi]
    miny = 1e9; maxy=-1e9; minx=1e9; maxx=-1e9; minz=1e9; maxz=-1e9
    for v, js, ws in zip(pos, jnt, wgt):
        x=y=z=0.0
        for j, w in zip(js, ws):
            if w == 0: continue
            vv = ibm_apply(ibm[j], v) if use_ibm else v
            m, t = joint_world[joints[j]]
            p = mat_apply(m, t, vv)
            x += w*p[0]; y += w*p[1]; z += w*p[2]
        miny=min(miny,y); maxy=max(maxy,y); minx=min(minx,x); maxx=max(maxx,x); minz=min(minz,z); maxz=max(maxz,z)
    return (minx,maxx,miny,maxy,minz,maxz)

for pi in range(2):
    b = skin_bbox(pi, world)
    print(f"prim{pi} BIND-pose skinned bbox (with IBM): x[{b[0]:.4f},{b[1]:.4f}] y[{b[2]:.4f},{b[3]:.4f}] z[{b[4]:.4f},{b[5]:.4f}] height={b[3]-b[2]:.4f}")

def sample_anim(name, ts):
    a = next(x for x in gltf["animations"] if x["name"] == name)
    samps = a["samplers"]
    out = defaultdict(dict)
    for ch in a["channels"]:
        tgt = ch["target"]; ni = tgt["node"]; path = tgt["path"]
        smp = samps[ch["sampler"]]
        inp = R(smp["input"]); outp = R(smp["output"])
        interp = smp.get("interpolation","LINEAR")
        k = 0
        for i, tt in enumerate(inp):
            if tt[0] <= ts: k = i
            else: break
        k2 = min(k+1, len(inp)-1)
        t0 = inp[k][0]; t1 = inp[k2][0]
        u = (ts - t0)/(t1-t0) if t1 > t0 else 0.0
        u = max(0.0, min(1.0, u))
        if interp == "CUBICSPLINE":
            val = [outp[k*3+1][c]*(1-u) + outp[k2*3+1][c]*u for c in range(len(outp[0]))]
        else:
            val = [outp[k][c]*(1-u) + outp[k2][c]*u for c in range(len(outp[0]))]
        out[ni][path] = val
    return out

def joint_world_at(anim_vals):
    w2 = {}
    def wo(i):
        if i in w2: return w2[i]
        n = dict(nodes[i])
        av = anim_vals.get(i, {})
        if "translation" in av: n["translation"] = av["translation"]
        if "rotation" in av: n["rotation"] = av["rotation"]
        if "scale" in av: n["scale"] = av["scale"]
        m, t = local_matrix(n)
        p = parent_of.get(i)
        if p is not None:
            pm, pt = wo(p)
            m = matmul(pm, m); t = [pt[k] + sum(pm[k][j]*t[j] for j in range(3)) for k in range(3)]
        w2[i] = (m, t)
        return w2[i]
    for r in scene_roots: wo(r)
    for j in joints: wo(j)
    return w2

print("\n== sampled poses ==")
for tname, ts in [("idle",0.0), ("idle",1.25), ("a_tpose",0.0), ("walk",0.0), ("sprint",0.0)]:
    vals = sample_anim(tname, ts)
    jw = joint_world_at(vals)
    row = []
    for pi in range(2):
        b = skin_bbox(pi, jw)
        row.append(f"prim{pi} y[{b[2]:.4f},{b[3]:.4f}] h={b[3]-b[2]:.4f} z[{b[4]:.4f},{b[5]:.4f}]")
    head = jw[byname["DEF-head"]]
    hips = jw[byname["DEF-hips"]]
    print(f"'{tname}' @ {ts}s: " + " | ".join(row))
    print(f"   DEF-head world {head[1][0]:+.4f} {head[1][1]:+.4f} {head[1][2]:+.4f}; DEF-hips {hips[1][0]:+.4f} {hips[1][1]:+.4f} {hips[1][2]:+.4f}")

# joint sphere geometry check: is prim1 a set of spheres centered at joints?
pos, jnt, wgt = prims[1]
# find vertex count per joint index
from collections import Counter
cnt = Counter(j[0] for j in jnt)
print(f"\nprim1 joint usage: {len(cnt)} distinct joints used, verts per joint: min={min(cnt.values())} max={max(cnt.values())} e.g. {list(cnt.items())[:4]}")
# check: vertices of one joint form a sphere around joint world pos?
ji = list(cnt)[0]
verts = [pos[i] for i, jj in enumerate(jnt) if jj[0]==ji]
c = [sum(v[k] for v in verts)/len(verts) for k in range(3)]
rad = max(((v[0]-c[0])**2+(v[1]-c[1])**2+(v[2]-c[2])**2)**0.5 for v in verts)
print(f"prim1 joint{ji}: {len(verts)} verts, centroid {c} max radius from centroid {rad:.4f}")
