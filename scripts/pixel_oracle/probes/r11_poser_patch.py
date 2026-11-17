#!/usr/bin/env python3
"""R11 pixel-oracle P1 fix: camera mesh poser (live mqr Q @5720949) port."""
import re

MAIN = '/home/z/my-project/flick-3dEditor/editor/js/main.js'
TRACKS = '/home/z/my-project/flick-3dEditor/editor/js/tracks.js'

def patch(path, edits, label):
    s = open(path, encoding='utf-8').read()
    for old, new in edits:
        assert old in s, f'{label}: anchor not found: {old[:80]!r}'
        assert s.count(old) == 1, f'{label}: anchor not unique: {old[:80]!r}'
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8').write(s)
    print(f'{label}: {len(edits)} edits applied')

patch(TRACKS, [
    (
        "export function evalCameraObject({ base, out, items, timeS, aspect, resolvers }) { // dZt",
        "export function evalCameraObject({ base, out, items, timeS, aspect, resolvers, cameraId }) { // dZt"
    ),
    # NOTE: this port builds ctx INLINE at the evalCameraItem call (live editor has a standalone
    # `const ctx = {...}` line). Same semantic change: cameraId added to the ctx object literal.
    (
        "    evalCameraItem(item, Math.min(timeS - item.startS, dur), dur, { base, out, timeS, aspect, resolvers, items });",
        "    evalCameraItem(item, Math.min(timeS - item.startS, dur), dur, { base, out, timeS, aspect, resolvers, items, cameraId });"
    ),
], 'tracks.js')

s = open(MAIN, encoding='utf-8').read()

old = "    this._restEval = false;           // live performanceSeekS model: seek-posed rest keeps evaluating (pinned)"
new = """    this._restEval = false;           // live performanceSeekS model: seek-posed rest keeps evaluating (pinned)
    this._posedCams = new Set();      // live mqr Q(): camera ids posed by a previous frame (v set)"""
assert old in s and s.count(old) == 1
s = s.replace(old, new)

old = "          meshDragged: !!this.manipulator?.isMeshDragged?.(id),"
new = "          meshDragged: !!this.manipulator?.isMeshDragged?.(mesh),"
assert old in s and s.count(old) == 1
s = s.replace(old, new)

old = """    this.updateCameraMarkers();
    // 6b. r8-3: through-the-lens — cameras view renders THROUGH the selected camera"""
new = """    this.updateCameraMarkers();
    // 6a. camera mesh poser (live mqr Q @5720949, tickPreview — runs after the marker tick
    // like the live frame order): pose camera MESHES to their evaluated track pose while
    // performance is active; at rest only static cam-follow; v-loop resets others to store TRS
    this.tickCameraMeshPoses();
    // 6b. r8-3: through-the-lens — cameras view renders THROUGH the selected camera"""
assert old in s and s.count(old) == 1
s = s.replace(old, new)

anchor = """  // r8-3: through-the-lens cameras view — the editor camera adopts the selected camera's"""
poser = '''  // ================= camera mesh poser (live mqr Q @5720949) =================
  // Pixel-oracle R11 M2: the live camera PROP sits at its evaluated orbit pose at t=2.51
  // while ours stayed at store TRS — the live poses camera meshes every frame (edit mode,
  // performance active) via dZt + Hie. vFr @5432235 skip: meshDragged always, selected at
  // rest. xFr @5432334: v-loop resets previously-posed cameras to store TRS when no longer
  // animated. Static cam-follow at rest poses via U8r @4905083; selected+previously-animated
  // cameras bake their mesh pose to the store (updateObjectTransform).
  _storeWorldTRS(obj) {  // Zo @4901839 — store TRS -> world (single-level parent compose, VWt/CP/wDe)
    const objs = this.objects.all();
    const p = obj.parentId ? objs[obj.parentId] : undefined;
    if (!p) return { position: obj.position ?? [0, 0, 0], rotation: obj.rotation ?? [0, 0, 0] };
    const pm = new THREE.Matrix4().compose(
      new THREE.Vector3(...(p.position ?? [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(p.rotation ?? [0, 0, 0]), 'XYZ')),
      new THREE.Vector3(...(p.scale ?? [1, 1, 1])));
    const cm = new THREE.Matrix4().compose(
      new THREE.Vector3(...(obj.position ?? [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(obj.rotation ?? [0, 0, 0]), 'XYZ')),
      new THREE.Vector3(...(obj.scale ?? [1, 1, 1])));
    const m = pm.multiply(cm);
    const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
    m.decompose(pos, quat, scl);
    const e = new THREE.Euler().setFromQuaternion(quat, 'XYZ');
    return { position: [pos.x, pos.y, pos.z], rotation: [e.x, e.y, e.z] };
  }
  _camHie(mesh, worldPos, worldQuat) {  // Hie @5445559 — world pose -> parent-local
    const parent = mesh.parent;
    if (!parent) { mesh.position.copy(worldPos); mesh.quaternion.copy(worldQuat); return; }
    parent.updateWorldMatrix(true, false);
    mesh.position.copy(parent.worldToLocal(worldPos.clone()));
    parent.getWorldQuaternion(_q1);
    mesh.quaternion.copy(_q1.invert().multiply(worldQuat));
  }
  tickCameraMeshPoses() {  // Q @5720949 (mqr.tickPreview)
    if (this.page.mode !== undefined && this.page.mode !== 'edit') { this._posedCams.clear(); return; }
    // G(): isPreviewPlaying || capturing || performanceSeekS!==null -> playing || _restEval (no hub capture)
    const active = !!this.page.playing || this._restEval;
    const animatedNow = new Set();
    const objs = this.objects.all();
    const [rw, rh] = C.ASPECTS[this.page.recordAspect] ?? C.ASPECTS['16:9'];
    const aspect = rw / rh;
    if (active) {
      for (const [id, obj] of Object.entries(objs)) {
        if (obj.kind !== 'camera') continue;
        const mesh = this.meshById.get(id);
        if (!mesh) continue;
        if (this.manipulator?.isMeshDragged(mesh)) continue;   // vFr: dragged cameras keep their drag pose
        const track = this.show.trackOf(id);
        if (!track) continue;
        const base = this._storeWorldTRS(obj);   // ce(): base = Zo world-resolved store TRS
        const out = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), fovDeg: 0 };
        const any = evalCameraObject({
          base: { position: base.position, rotation: base.rotation, focalLengthMm: obj.focalLengthMm ?? C.FOCAL_DEFAULT },
          out, items: track.items, timeS: this.page.playheadS, aspect,
          resolvers: this.resolvers(), cameraId: id,
        });
        if (any) { this._camHie(mesh, out.position, out.quaternion); animatedNow.add(id); }
      }
    } else {
      // at rest: only static cam-follow stays posed (O @5719948: first item cam-follow w/ offset+objectId, startS<=0)
      for (const [id, obj] of Object.entries(objs)) {
        if (obj.kind !== 'camera') continue;
        const track = this.show.trackOf(id);
        const first = track?.items?.[0];
        if (!(first?.kind === 'cam-follow' && first.offset && first.objectId && first.startS <= 0)) continue;
        const mesh = this.meshById.get(id);
        const followed = this.meshById.get(first.objectId);
        if (!mesh || !followed) continue;
        // vFr at rest: skip selected/dragged — bake the mesh pose to the store if it was animated
        const dragged = !!this.manipulator?.isMeshDragged?.(mesh);
        if (dragged || this.objects.selectedId === id) {
          if (this._posedCams.has(id)) {
            this.objects.update(id, {
              position: [mesh.position.x, mesh.position.y, mesh.position.z],
              rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
            });
          }
          continue;
        }
        // U8r @4905083: Eye = followedWorld composed with offset
        const fp = followed.getWorldPosition(new THREE.Vector3());
        const fq = followed.getWorldQuaternion(new THREE.Quaternion());
        const eyePos = new THREE.Vector3(...(first.offset.position ?? [0, 0, 0])).applyQuaternion(fq).add(fp);
        const eyeQuat = fq.clone().multiply(new THREE.Quaternion(...(first.offset.quaternion ?? [0, 0, 0, 1])));
        this._camHie(mesh, eyePos, eyeQuat);
        animatedNow.add(id);
      }
    }
    // v-loop: previously posed, not animated now, not dragging -> store TRS
    for (const id of this._posedCams) {
      if (animatedNow.has(id)) continue;
      const obj = objs[id];
      const mesh = this.meshById.get(id);
      if (!obj || !mesh) continue;
      if (this.manipulator?.isMeshDragged(mesh)) continue;
      mesh.position.set(...(obj.position ?? [0, 0, 0]));
      mesh.rotation.set(...(obj.rotation ?? [0, 0, 0]));
    }
    this._posedCams = new Set([...animatedNow, ...[...this._posedCams].filter(id => {
      const m = this.meshById.get(id);
      return m && this.manipulator?.isMeshDragged(m);
    })]);
  }

'''
assert anchor in s and s.count(anchor) == 1
s = s.replace(anchor, poser + anchor)

open(MAIN, 'w', encoding='utf-8').write(s)
print('main.js: 4 edits applied')

s2 = open(MAIN, encoding='utf-8').read()
if re.search(r'const _q1\s*=', s2):
    print('_q1 scratch: EXISTS')
else:
    print('_q1 scratch: MISSING — must add')
