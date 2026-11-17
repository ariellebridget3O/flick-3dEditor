#!/usr/bin/env python3
"""r13 draw-path fixes: moveSegmentOf filter + covering-time focusOf + autopan JLr + ghost look/parent-space.
Every replacement is assert-guarded (SKILL #13/#44). Bundle refs: index-CaBu3A6T.js offsets in comments."""
import sys, pathlib

root = pathlib.Path('/home/z/my-project/flick-3dEditor')

def patch(path, pairs):
    p = root / path
    s = p.read_text()
    for old, new in pairs:
        assert old in s, f"MISSING ANCHOR in {path}: {old[:90]!r}"
        assert s.count(old) == 1, f"AMBIGUOUS ANCHOR ({s.count(old)}x) in {path}: {old[:90]!r}"
        s = s.replace(old, new)
    p.write_text(s)
    print(f"patched {path}: {len(pairs)} edits")

# ============================ plan.js ============================
PLAN_PAIRS = [
    # --- consts: autopan v2 (JLr: LLr=.8,DLr=28,HLr=250,BLr=.6 @5449053) + cam move kinds (gvr @4325385)
    (
        "const Vie = .25, Yat = Math.PI / 12, Qat = 3, Jat = 4, SLr = 4, TLr = 48, ALr = .8, CLr = 720; // consts_state",
        "const Vie = .25, Yat = Math.PI / 12, Qat = 3, Jat = 4, SLr = 4, TLr = 48, LLr = .8, DLr = 28, HLr = 250, BLr2 = .6; // consts_state (autopan v2 @5449053)\n"
        "const gvr = [\"cam-still\", \"cam-move\", \"cam-path\", \"cam-follow\", \"cam-transform\", \"cam-manual\"]; // cam move kinds (Lp filter @4325385)",
    ),
    # --- BLr -> JLr verbatim (autopan: deadzone min(.8d/2, d/2-28), quadratic ramp, 250ms dwell, .6 speed)
    (
        """export function BLr(t, e, n, r) {                                                                   // autopan during drag (deadzone .8, 720px/s)
  const s = t.drag;
  if (!s || s.kind !== "stroke" && s.kind !== "move") return { state: t, intents: [] };
  if (s.kind === "move" && !s.last) return { state: t, intents: [] };
  const { widthPx: a, heightPx: o } = t.view,
    l = (f, m) => { const g = m * ALr / 2, b = f - m / 2, y = Math.abs(b) - g; return y <= 0 ? 0 : Math.sign(b) * Math.min(1, y / Math.max(m / 2 - g, 1)); },
    c = CLr * Math.min(r, 100) / 1e3, d = l(n.x, a) * c, u = l(n.y, o) * c;
  if (d === 0 && u === 0) return { state: t, intents: [] };
  const h = { ...t, view: UDe(t.view, -d, -u) };
  return s.kind === "stroke" ? { state: h, intents: [{ type: "stroke-move", at: S1(h.view, n) }] } : DZt(h, e, { p: n, shift: !1 });
}""",
        """export function BLr(t, e, n, r) {                                                                   // autopan JLr verbatim (@5452693: dwell 250ms + quadratic ramp)
  const s = t.drag;
  if (!s || s.kind !== "stroke" && s.kind !== "move") return { state: t, intents: [] };
  if (s.kind === "move" && !s.last) return { state: t, intents: [] };
  const { widthPx: a, heightPx: o } = t.view,
    l = (f, m) => { const v = Math.min(m * LLr / 2, m / 2 - DLr), x = f - m / 2, w = Math.abs(x) - v; if (w <= 0) return 0; const k = Math.min(1, w / Math.max(m / 2 - v, 1)); return Math.sign(x) * k * k; },
    c = l(n.x, a), d = l(n.y, o);
  if (c === 0 && d === 0) return t.edgeHeldMs ? { state: { ...t, edgeHeldMs: 0 }, intents: [] } : { state: t, intents: [] };
  const u = (t.edgeHeldMs ?? 0) + r;
  if (u < HLr) return { state: { ...t, edgeHeldMs: u }, intents: [] };
  const h = BLr2 * Math.min(r, 100) / 1e3, f = c * a * h, m = d * o * h, g = { ...t, edgeHeldMs: u, view: UDe(t.view, -f, -m) };
  return s.kind === "stroke" ? { state: g, intents: [{ type: "stroke-move", at: S1(g.view, n) }] } : DZt(g, e, { p: n, shift: !1 });
}""",
    ),
    # --- HLr pointerup: edgeHeldMs reset (@5455019)
    (
        "export function HLr(t, e) {                                                                         // pointerup reducer\n  const n = t.drag, r = { ...t, drag: null };",
        "export function HLr(t, e) {                                                                         // pointerup reducer (eDr @5455044)\n  const n = t.drag, r = { ...t, drag: null, edgeHeldMs: 0 };",
    ),
    # --- $Lr finalize: edgeHeldMs reset (@5457025)
    (
        "  return { state: { ...t, drag: null }, intents: n ? [{ type: \"commit\" }] : [] };\n}",
        "  return { state: { ...t, drag: null, edgeHeldMs: 0 }, intents: n ? [{ type: \"commit\" }] : [] };\n}",
    ),
    # --- moveSegmentOf facade: verbatim isCam filter (@5575262)
    (
        """      moveSegmentOf: (trackId, s) => {
        const tr = show.show.tracks.find(t => t.id === trackId); if (!tr) return null;
        const cands = (tr.items ?? []).filter(o => o.kind === 'path' || o.kind === 'cam-path' || o.kind === 'play');
        return cands.find(o => s >= o.startS && s < o.startS + itemDuration(o)) ?? cands[0] ?? null;
      },""",
        """      moveSegmentOf: (trackId, s) => {                                                                 // verbatim @5575262: camera tracks replace any cam-* segment
        const tr = show.show.tracks.find(t => t.id === trackId); if (!tr) return null;
        const isCam = facade.objects[tr.characterId ?? '']?.kind === 'camera';
        const cands = (tr.items ?? []).filter(o => isCam ? gvr.includes(o.kind) : o.kind === 'path' || o.kind === 'play');
        return cands.find(o => s >= o.startS && s < o.startS + itemDuration(o)) ?? cands[0] ?? null;
      },""",
    ),
    # --- activeCamItem/activePathItem/focusOf -> verbatim cameraFocusId/walkerFocusId/xot (@5574597 + @5552688)
    (
        """  // ---- focus (camera: active cam-item subject / walker: path-item subject) ----
  activeCamItem(camId) {
    const tr = this.a.show.trackOf(camId); if (!tr) return null;
    return tr.items.find(i => (i.kind === 'cam-path' || i.kind === 'cam-move' || i.kind === 'cam-still') && i.aim === 'subject' && i.subjectId) ?? null;
  }
  activePathItem(walkerId) {
    const tr = this.a.show.trackOf(walkerId); if (!tr) return null;
    return tr.items.find(i => i.kind === 'path' && i.aim === 'subject' && i.subjectId) ?? null;
  }
  focusOf(e) {
    const n = this.a.objects.get(e)?.kind;
    if (n === "camera") return this.activeCamItem(e)?.subjectId ?? this.a.objects.get(e)?.targetId ?? null;
    if (!el(n)) return null;
    const r = this.pendingWalkerFocus;
    return this.activePathItem(e)?.subjectId ?? (r?.id === e && this.drawing() ? r.subjectId : null);
  }""",
        """  // ---- focus (verbatim: moveSegmentOf covering the playhead @5575262; xot @5552688; camera/walkerFocusId @5574597) ----
  _moveSegmentOf(tr, s) {
    if (!tr) return null;
    const isCam = this.a.objects.get(tr.characterId ?? '')?.kind === 'camera';
    const cands = (tr.items ?? []).filter(o => isCam ? gvr.includes(o.kind) : o.kind === 'path' || o.kind === 'play');
    return cands.find(o => s >= o.startS && s < o.startS + itemDuration(o)) ?? cands[0] ?? null;
  }
  _xot(item) {
    return item.kind === "cam-path" ? (item.aim === "subject" ? item.subjectId ?? null : null)
      : item.kind === "cam-move" || item.kind === "cam-still" ? item.subjectId ?? null : null;
  }
  cameraFocusId(camId) {
    const tr = this.a.show.trackOf(camId);
    const r = tr ? this._moveSegmentOf(tr, this.a.page.playheadS) : null;
    return r ? this._xot(r) : null;
  }
  walkerFocusId(walkerId) {
    const tr = this.a.show.trackOf(walkerId);
    const r = tr ? this._moveSegmentOf(tr, this.a.page.playheadS) : null;
    return r?.kind === "path" && r.aim === "subject" ? r.subjectId ?? null : null;
  }
  focusOf(e) {
    const n = this.a.objects.get(e)?.kind;
    if (n === "camera") return this.cameraFocusId(e);
    if (!el(n)) return null;
    const r = this.pendingWalkerFocus;
    return this.walkerFocusId(e) ?? (r?.id === e && this.drawing() ? r.subjectId : null);
  }""",
    ),
    # --- toggleFocus walker branch: setWalkerFocus covering-time (@5574597 setWalkerFocus)
    (
        """  toggleFocus(e) {
    const n = this.drawTarget();
    if (n && el(this.a.objects.get(n)?.kind)) {                                                        // walker: patch path item subject
      const o = this.focusOf(n) === e;
      this.a.show.beginEditGesture();
      const tr = this.a.show.trackOf(n), it = tr?.items.find(i => i.kind === 'path' && i.anchors?.length > 1);
      let ok = false;
      if (it) { this.a.show.patchItem(tr.id, it.id, o ? { aim: 'travel', subjectId: null } : { aim: 'subject', subjectId: e }); ok = true; }
      this.a.show.endEditGesture();
      this.pendingWalkerFocus = ok || o ? null : { id: n, subjectId: e };
      return;
    }
    if (!n || this.a.objects.get(n)?.kind !== "camera") return;
    this.a.show.beginEditGesture();
    const s = this.focusOf(n) === e, tr = this.a.show.trackOf(n), it = tr?.items.find(i => (i.kind === 'cam-path') && i.anchors?.length > 1);
    if (it) this.a.show.patchItem(tr.id, it.id, s ? { aim: 'locked', subjectId: null } : { aim: 'subject', subjectId: e });
    this.a.show.endEditGesture();
  }
  setCameraFocus(camId, subjectId) {
    const tr = this.a.show.trackOf(camId), it = tr?.items.find(i => i.kind === 'cam-path' && i.anchors?.length > 1);
    if (it) this.a.show.patchItem(tr.id, it.id, { aim: 'subject', subjectId });
    else this.a.objects.update(camId, { targetId: subjectId });
  }""",
        """  toggleFocus(e) {
    const n = this.drawTarget();
    if (n && el(this.a.objects.get(n)?.kind)) {                                                        // walker: setWalkerFocus @5574597 (covering-time segment)
      const o = this.focusOf(n) === e;
      this.a.show.beginEditGesture();
      const tr = this.a.show.trackOf(n), it = tr ? this._moveSegmentOf(tr, this.a.page.playheadS) : null;
      let ok = false;
      if (it?.kind === 'path') { this.a.show.patchItem(tr.id, it.id, o ? { aim: 'travel', subjectId: null } : { aim: 'subject', subjectId: e }); ok = true; }
      this.a.show.endEditGesture();
      this.pendingWalkerFocus = ok || o ? null : { id: n, subjectId: e };
      return;
    }
    if (!n || this.a.objects.get(n)?.kind !== "camera") return;
    this.a.show.beginEditGesture();
    const s = this.focusOf(n) === e;
    this.setCameraFocus(n, s ? null : e);
    this.a.show.endEditGesture();
  }
  setCameraFocus(camId, subjectId) {                                                                   // setCameraFocus core @5573096 (covering-time; keepLookOnClear = backlog)
    const tr = this.a.show.trackOf(camId);
    const it = tr ? this._moveSegmentOf(tr, this.a.page.playheadS) : null;
    if (it?.kind === 'cam-path' || it?.kind === 'cam-move' || it?.kind === 'cam-still')
      this.a.show.patchItem(tr.id, it.id, { ...(it.kind === 'cam-path' ? { aim: subjectId ? 'subject' : 'locked', subjectId } : { subjectId }) });
    else this.a.objects.update(camId, { targetId: subjectId });
  }""",
    ),
]

patch('editor/js/plan.js', PLAN_PAIRS)

# ============================ main.js ============================
MAIN_PAIRS = [
    # --- ghost: verbatim hoe parent-space quaternion compose (@5476375) — position AND rotation
    (
        """        // world pose → mesh-local (parent-aware, live Hie)
        if (m.parent && m.parent !== this.scene) {
          const v = new THREE.Vector3(...d.position);
          m.parent.worldToLocal(v);
          m.position.copy(v);
        } else m.position.set(...d.position);
        m.rotation.set(...d.rotation);
        if (d.look && m.userData.figure) m.userData.figure.head.rotation.set(0, d.look.headYawRad, d.look.headPitchRad);""",
        """        // world pose → mesh-local: verbatim hoe @5476375 (worldToLocal + parent world quat invert)
        if (m.parent) {
          m.parent.updateWorldMatrix(true, false);
          const v = _hoeV.set(...d.position);
          m.position.copy(m.parent.worldToLocal(v));
          m.parent.getWorldQuaternion(_hoePQ);
          m.quaternion.copy(_hoePQ.invert().multiply(_hoeQ.setFromEuler(_hoeE.set(...d.rotation))));
        } else { m.position.set(...d.position); m.quaternion.setFromEuler(_hoeE.set(...d.rotation)); }
        if (d.look && m.userData.figure) m.userData.figure.head.rotation.set(0, d.look.headYawRad, d.look.headPitchRad);""",
    ),
    # --- module-level scratch objects for hoe (SKILL #46: real THREE objects)
    (
        "  tickDrawPreview() {  // z port: pose the mesh to the stroke preview ghost; restore on end",
        "  tickDrawPreview() {  // z port: pose the mesh to the stroke preview ghost; restore on end (hoe verbatim @5476375)",
    ),
    # --- humanoid rig head-look while drawing (new bundle O @5790417): merge ghost look into offsets BEFORE rig.tick
    (
        """    // --- update ticks (D2.7 order) ---
    // 1. rig tick: restore → mixer → rig offsets
    for (const [id, rig] of this.objectManager.humanoidRigs) {
      rig.tick(dt, this.rigOffsets.get(id));
    }""",
        """    // --- update ticks (D2.7 order) ---
    // 1. rig tick: restore → mixer → rig offsets (ghost head-look merged: bundle O @5790417 — rigOffsets rebuilt every frame, no accumulation)
    const _ghost = this._drawPreview;
    const _ghostLook = _ghost?.look && this.objects.get(_ghost.id)?.kind === 'humanoid' ? headLookOffsets(_ghost.look) : null;
    for (const [id, rig] of this.objectManager.humanoidRigs) {
      let off = this.rigOffsets.get(id);
      if (_ghostLook && id === _ghost.id) off = mergeRigOffsets(off ?? {}, _ghostLook);
      rig.tick(dt, off);
    }""",
    ),
]

patch('editor/js/main.js', MAIN_PAIRS)

# --- module scratch objects for main.js hoe (insert after the first import block) ---
mjs = (root / 'editor/js/main.js').read_text()
anchor = "import { headLookOffsets, mergeRigOffsets, applyHeadRotation, getHeadRotation } from './figures.js';"
assert anchor in mjs, "main.js import anchor missing"
if '_hoeV' not in mjs:
    mjs = mjs.replace(anchor, anchor + "\n\nconst _hoeV = new THREE.Vector3(), _hoeE = new THREE.Euler(), _hoeQ = new THREE.Quaternion(), _hoePQ = new THREE.Quaternion(); // hoe scratch")
    (root / 'editor/js/main.js').write_text(mjs)
    print("main.js: hoe scratch inserted")

print("ALL PATCHES APPLIED")
