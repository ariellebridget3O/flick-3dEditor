#!/usr/bin/env python3
"""r8b_extract.py — Round 8b: VERBATIM second-pass extraction of the units needed
to implement the aim/seed/lane-drop flows of flick.art, from the live production
bundle.

REUSES the r8 engine wholesale (import r8_palette_extract): same UTF-8 byte math
(real byte offsets via multi-byte char accounting), same string/template/comment/
regex-aware brace matcher, same wrapper + `node --check` validation.

Bundle: analysis/index-DBE17t4T.js (single-line minified)
Outputs -> analysis/tmp_palette_exact/
  fn_<name>.js           verbatim minified slice + header (char + BYTE ranges)
  fn_index_r8b.json      machine-readable index (separate from r8's fn_index.json)

NEW vs r8: after writing each unit, BYTE-IDENTITY is verified by re-slicing the
bundle as raw bytes [byte_a:byte_b] and decoding; slice must equal the char-range
source exactly.  Any mismatch aborts with a report.

Usage:
  python3 scripts/r8b_extract.py
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import r8_palette_extract as R8          # engine: src, byte_off, extract, write_fn, validate...
from r8_palette_extract import T, extract, write_fn, validate, byte_off, src, OUT

BUNDLE = R8.BUNDLE

TARGETS = []

# ===== Group A: TRS compose/normalize math (support for cN/Zo/kv) =====
TARGETS += [
 T('CP', 'function', 'function CP(', 'TRS obj -> Matrix4: euler XYZ -> quat, new Matrix4().compose(pos,quat,scale) (scratch zb/hie/GB/qB)', 'trs -> Matrix4'),
 T('wDe', 'function', 'function wDe(', 'Matrix4 -> TRS decompose with euler-flip normalization: s2e wraps to (-pi,pi]; tries x+PI,y=PI-z,z+PI variant when |x|+|z| smaller by 1e-9', 'Matrix4 -> {position,rotation,scale}'),
 T('pie', 'function', 'function pie(', 'local TRS of child given parent world TRS: wDe(CP(parent).invert().multiply(CP(child))) (cN dep)', 'parentTRS, childTRS -> localTRS'),
 T('VWt', 'function', 'function VWt(', 'world TRS: wDe(CP(parent).multiply(CP(child))) (Zo dep)', 'parentTRS, childTRS -> worldTRS'),
 T('cN', 'function', 'function cN(', 'TRANSFORM VALIDATION/NORMALIZATION (turnCameraToward dep): object+store -> resolve parentId; parent? pie(parent, n) : n (n is the desired local TRS)', 'object, objects, trs -> trs'),
 T('s$', 'function', 'function s$(','TARGET-REPOSITION HELPER: world position a camera-target object must be moved to so it keeps pointing at aim point u: cN(t,e,{position:u,rotation:[0,0,0],scale:[1,1,1]}).position', 'targetObj, objects, aimPoint -> position'),
 T('Zo', 'function', 'function Zo(', 'BASE TRS COMPOSE for an object from the objects store: {position,rotation,scale} from object; parentId? VWt(parent, local) : local (referenced by aimCameraAtSubject/subjectAimPoint/seedPathStart/NP/VDe)', 'object, objects -> worldTRS'),
 T('el', 'function', 'function el(', 'is humanoid/simple_figure kind (uje dep)', 'kind -> bool'),
 T('Xu', 'function', 'function Xu(', 'object e is a target AND some camera targets it (canOwnTrack dep)', 'objects, id -> bool'),
 T('Dj_scratch', 'stmt', 'const Dj=new di', 'scratch THREE.Object3D used by kv for lookAt+rotateY(PI)', '-> const'),
 T('kv', 'function', 'function kv(', 'LOOKAT ROTATION position->target incl rotateY(PI) (camera faces -Z): Dj.position.set(t); Dj.lookAt(e); Dj.rotateY(PI); return [x,y,z] euler', 'pos, target -> [x,y,z]'),
]

# ===== Group B: subject-aim items (XN/$6/U2r/YN + Fp/V2r) =====
TARGETS += [
 T('consts_V2r', 'stmt', 'const V2r=', 'V2r = camera-item kind set ["cam-still","cam-move","cam-path","cam-follow","cam-transform","cam-manual"]', '-> Set'),
 T('Fp', 'function', 'function Fp(', 'item is a CAMERA track item: V2r.has(t.kind) — the Fp(g) gate in aimCameraAtSubject/lane rendering', 'item -> bool'),
 T('XN', 'function', 'function XN(', 'SUBJECT AIM POINT (item form): e(subjectId, n) resolver + aimOffsetUnits $6 -> [x,y+off,z] (module-level twin of store subjectAimPoint)', 'item, resolve(subjectId,default)->[x,y,z], defaultY -> point|null'),
 T('$6', 'function', 'function $6(', 'item.aimOffsetUnits || 0', 'item -> number'),
 T('U2r', 'function', 'function U2r(', 'items.some(YN)', 'items -> bool'),
 T('YN', 'function', 'function YN(', 'item NEEDS the camera target object (subjectless): cam-move && move!=="pan_sweep" && subjectId===null || cam-path && aim==="subject" && subjectId===null (subjectlessItem)', 'item -> bool'),
]

# ===== Group C: subject aim height (NP family) =====
TARGETS += [
 T('consts_MIr', 'stmt', 'const MIr=', 'MIr=.7 default aim margin for NP', '-> const'),
 T('uje', 'function', 'function uje(', 'object height units: humanoid jP*scaleY; prop dims[1]*scaleY; target/spotlight 0; else scaleY', 'object -> m'),
 T('VDe', 'function', 'function VDe(', 'vertical extent (minY,maxY) of object incl. children (skips group/camera/target/spotlight children) using Zo+uje', 'id, object, objects -> {minY,maxY}'),
 T('NP', 'function', 'function NP(', 'SUBJECT AIM HEIGHT OFFSET: NP(objectId, objects, margin=MIr=.7) = minY - objectY + margin*max(0,maxY-minY) via VDe+Zo', 'objectId, objects, ?margin -> m'),
]

# ===== Group D: timeline magnet / px->time core =====
TARGETS += [
 T('consts_Kne_O8', 'stmt', 'const Kne=', 'Kne=12 MAGNET RADIUS px; O8=1e-6 eps', '-> consts'),
 T('wie', 'function', 'function wie(', 'item -> {startS, endS:startS+yd(item)}', 'item -> span'),
 T('MP', 'function', 'function MP(', 'max endS over items = append position (laneAdd button left, dropSegment fallback)', 'items -> s'),
 T('oje', 'function', 'function oje(', 'span overlap test with O8 eps', 'a, b -> bool'),
 T('Xne', 'function', 'function Xne(', 'MAGNET SNAP to markersS within radiusS (tries marker and marker-durationS)', '{desiredStartS,durationS,markersS,radiusS} -> startS'),
 T('_ie', 'function', 'function _ie(', 'THE MAGNET PLACER (lane drop Z()): snap desiredStartS via Xne; if colliding with obstacles try obstacle edges (startS-durationS, endS), pick closest, else fallbackStartS; guidesS = markers within eps of placement edges; -> {startS,guidesS}', 'spec -> {startS,guidesS}'),
 T('W5r', 'function', 'function W5r(', 'collision-free placer (no magnet): _ie with obstacles=items, radiusS=0, fallback=MP — used by placeItemS, NOT by the lane drop', 'items, durationS, desiredStartS -> startS'),
 T('lje', 'function', 'function lje(', 'normalize items left-wards (sort by startS, push to first free slot)', 'items -> items'),
 T('G5r', 'function', 'function G5r(', 'span center time startS+yd/2 (reorder comparator)', 'item -> s'),
 T('q5r', 'function', 'function q5r(', 'segment-drag PLAN: no overlap -> {kind:"move",startS,guidesS} via _ie magnet; else {kind:"reorder",toIndex} by centers', 'spec -> plan'),
 T('kGt', 'function', 'function kGt(', 'apply reorder: sort, remove dragged, splice at toIndex at neighbor start / MP', 'items, id, toIndex -> items'),
 T('consts_timeline_px', 'stmt', 'const UAr=', 'timeline px consts: UAr=5 (min span s?), zAr=4 drag-threshold px, WAr=.05 min duration s, p2e=3 min block px, GAr zoom steps [.5..60], qAr=80', '-> consts'),
 T('ZAr', 'function', 'function ZAr(', 'object-action block label (rotate/revolve/scale/transform/rig-transform i18n)', 'item -> jsx'),
 T('s9_mime', 'stmt', 'const s9=', 's9="application/x-stage-object" MIME (object list -> timeline panel drop) + SGt apple-platform + kie()/TGt() key hints', '-> consts'),
]

# ===== Group E: timeline lane-drop controller + parents =====
TARGETS += [
 T('nCr', 'function', 'function nCr(', 'THE TIMELINE LANE-DROP CONTROLLER: per-track lane div; G=payload->resolveAction(characterId); Z(el,x,alt,item)=px->time ((x-rect.left)/ppsPx) + n3r(item) duration + _ie magnet (radius Kne/ppsPx when magnetEnabled&&!alt); onDragOver: ghost state {startS,durationS,guidesS}; onDrop: MDe(getData($v))->G->Z->onAddAction(trackId,item,startS); renders ghostBlock (duration>0) / ghostCaret (duration 0) + snapGuide lines at guidesS; also pointer segment drag/move/duplicate (q5r/_ie) + trim handles', 'props -> jsx'),
 T('KAr', 'function', 'function KAr(', 'TIMELINE PANEL (parent of lanes): header magnet toggle + range tool (xTr), ruler VAr, lanes map -> nCr with onAddAction/magnetEnabled/duplicate ghost props; PANEL-LEVEL onDrop for s9 (object list -> track) with objectDropHint', 'props -> jsx'),
 T('SCr', 'function', 'function SCr(', 'BOTTOM-PANEL FACTORY (wires lane drop to store): n=(trackId,payload,atS)=>{t.addActionToTrack(trackId,payload,atS); t.dismissActions()} passed as onAddAction to KAr; keyframe-drag SegmentKeyframes factory (o), playhead/ruler factories', 'store -> {BottomPanel}',
   ),
 T('gVr', 'function', 'function gVr(', '3rd MDe(getData($v)) consumer: keyboard key-slot (bind clip to hotkey) drop target; only accepts kind:"clip"', '{slotKey,clip,onBind,onEmptyClick} -> jsx'),
]

# ===== Group F: store methods (aim/seed/segment-drop) =====
TARGETS += [
 T('updateObjectTransform', 'method', 'updateObjectTransform=', 'DEFAULT objects-store transform hook: objects[id].set({...obj,...patch}) — injected into BHr performance store via constructor', 'id, patch -> void'),
 T('aimCameraAtSubject', 'method', 'aimCameraAtSubject=', 'AIM FLOW: guard !updateObjectTransform || existing camera item started before s (n.some(g=>g.startS<s&&Fp(g)&&g.kind!=="cam-still")) abort; u=subjectAimPoint(a,o); reposition target h via s$(f,c,u) iff not referenced by YN item; turnCameraToward(e,u)', 'objectId, items, itemId, s, subjectId, dy -> void'),
 T('subjectAimPoint', 'method', 'subjectAimPoint=', 'store SUBJECT AIM POINT: Zo(obj,objects).position + NP(e,objects) + n -> [x,y+h,z] (uses Zo + NP)', 'objectId, ?dy -> point|null'),
 T('turnCameraToward', 'method', 'turnCameraToward=', 'camera rotation validation: cN(obj,objects,{...Zo(obj),rotation:kv(pos,target)}).rotation -> updateObjectTransform(id,{rotation}) (uses cN + kv + Zo)', 'objectId, target -> void'),
 T('seedPathStart', 'method', 'seedPathStart=', 'SEED FIRST PATH ANCHOR: appendPathAnchor([...Zo(object,objects).position]) — exact XZ+Y world position', 'objectId -> void'),
 T('enterPathEdit', 'method', 'enterPathEdit=', 'ENTER PATH EDIT MODE: selectedSegment.set({trackId,itemId}) + performancePaint.set({trackId,itemId,selectedAnchor:null}) + editInteraction.set("editingPath")', 'trackId, itemId -> void'),
 T('appendPathAnchor', 'method', 'appendPathAnchor=', 'append path anchor (Y via anchorPosFor unless exactHeight), patchPathAnchors mT(smooth), select last', 'pos, ?opts -> void'),
 T('placeItemS', 'method', 'placeItemS=', 'placement startS for added items: atS===void 0 ? MP(items) : W5r(items,durationS,atS)', 'items, durationS, ?atS -> s'),
 T('canDropSegmentOnObject', 'method', 'canDropSegmentOnObject=', 'segment drag -> object: draggedSegment() && canOwnTrack(id) && Art(segment, objects[id]?.kind)', 'objectId -> bool'),
 T('dropSegmentOnObject', 'method', 'dropSegmentOnObject=', 'drop existing segment onto object: target track (by characterId ?? addPerformanceTrack), duplicateItem into it at MP(items); sets segmentDropTaken=true', 'objectId -> itemId|null'),
 T('duplicateItem', 'method', 'duplicateItem=', 'clone item into target track at startS (new id via an(), DHr strips stale refs, Art guard)', 'fromTrackId, itemId, toTrackId, startS -> id|null'),
]

# ===== Group G: updateObjectTransform wiring slices =====
TARGETS += [
 T('wire_BHr_ctor', 'stmt', 'this.updateObjectTransform=a', 'BHr performance-store constructor body: receives (objects, editInteraction, recording, isPreviewPlaying, updateObjectTransform) and keeps it on this — verbatim constructor-body slice', '-> slice'),
 T('wire_newBHr', 'stmt', 'new BHr(', 'PERFORMANCE STORE INSTANTIATION: performanceStore=new BHr(objectsStore.objects, editInteraction, cameraStore.recording, cameraStore.isPreviewPlaying, objectsStore.updateObjectTransform) — the DEFAULT objects-store method is the injected hook', '-> slice'),
 T('wire_facade_uot', 'stmt', 'updateObjectTransform=this.objectsStore.updateObjectTransform', 'editor facade store rebinds objectsStore.updateObjectTransform', '-> slice'),
 T('wire_facade_epe', 'stmt', 'enterPathEdit=this.performanceStore.enterPathEdit', 'editor facade store delegates enterPathEdit to performance store', '-> slice'),
]

def main():
    results, failures, notfound = [], [], []
    for t in TARGETS:
        rng = extract(t)
        if rng is None:
            notfound.append((t['name'], f"anchor not found: {t['anchor']!r}"))
            continue
        try:
            results.append(write_fn(t, rng))
        except Exception as e:
            failures.append((t['name'], f'{type(e).__name__}: {e}'))

    # --- node --check every unit ---
    bad = []
    for r in results:
        ok, err = validate(r['check'])
        if not ok:
            bad.append((r['name'], err))

    # --- BYTE-IDENTITY verification (stronger than r8): raw byte re-slice ---
    raw = open(BUNDLE, 'rb').read()
    mismatch = []
    for r in results:
        a, b = r['byte_a'], r['byte_b']
        code = src[r['a']:r['b']]
        try:
            reborn = raw[a:b].decode('utf-8')
        except UnicodeDecodeError as e:
            mismatch.append((r['name'], f'decode error: {e}'))
            continue
        if reborn != code:
            mismatch.append((r['name'], f'byte slice != char slice ({len(reborn)} vs {len(code)} chars)'))

    with open(os.path.join(OUT, 'fn_index_r8b.json'), 'w') as f:
        json.dump([{k: v for k, v in r.items() if k != 'check'} for r in results], f, indent=1)

    print(f'r8b extracted {len(results)} units -> {OUT}')
    for r in sorted(results, key=lambda r: r['a']):
        print(f'  {r["name"]:<28} @{r["a"]:>8}..{r["b"]:<8} {r["chars"]:>6} ch (bytes {r["byte_a"]}..{r["byte_b"]})  deps={len(r["deps"])}')
    if bad:
        print('\nSYNTAX CHECK FAILURES:')
        for n, e in bad:
            print(f'  {n}: {e}')
    else:
        print('\nall units pass node --check')
    if mismatch:
        print('\nBYTE-IDENTITY FAILURES:')
        for n, e in mismatch:
            print(f'  {n}: {e}')
    else:
        print('all units byte-identical (raw byte re-slice == char slice)')
    if failures:
        print('\nEXTRACTION FAILURES:')
        for n, e in failures:
            print(f'  {n}: {e}')
    if notfound:
        print('\nNOT FOUND:')
        for n, e in notfound:
            print(f'  {n}: {e}')

if __name__ == '__main__':
    main()
