#!/usr/bin/env python3
# r13 step 2: draw-path remaining fixes (P0-3 setCameraFocus machine, P1-4/5/6b/7/8, P2-1/3)
# Verbatim sources: analysis/index-DBE17t4T.js (+ CaBu3A6T normalized-identical), audit R13_DRAWPATH_AUDIT.md
import re, sys

def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for i, (old, new) in enumerate(pairs):
        assert old in s, f"{path} #{i}: old not found: {old[:90]!r}"
        assert s.count(old) == 1, f"{path} #{i}: old not unique ({s.count(old)}x): {old[:90]!r}"
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8').write(s)
    print(f"OK {path}: {len(pairs)} patches")

# ---------- const.js: yP (CAM_MOVES_FOCUSABLE) + still durations (N8=5, Ije=.1) ----------
patch('editor/js/const.js', [
    ("export const CAM_MOVES = ['orbit', 'dolly_in', 'dolly_out', 'dolly_zoom', 'crane_up', 'crane_down', 'spiral', 'pan_sweep']; // yP",
     "export const CAM_MOVES = ['orbit', 'dolly_in', 'dolly_out', 'dolly_zoom', 'crane_up', 'crane_down', 'spiral', 'pan_sweep']; // bP\nexport const CAM_MOVES_FOCUSABLE = ['orbit', 'dolly_in', 'dolly_out', 'dolly_zoom', 'crane_up', 'crane_down', 'spiral']; // yP = bP minus pan_sweep (setCameraFocus patch gate)\nexport const STILL_DUR = 5;     // sje('still') -> N8 = 5 (default cam-still duration, _1 has no still key)\nexport const STILL_MIN_DUR = .1; // Ije (min cam-still duration)"),
])

# ---------- figures.js: export ezHeadRotation (EZt) ----------
patch('editor/js/figures.js', [
    ("function ezHeadRotation(yaw, pitch) { // EZt",
     "export function ezHeadRotation(yaw, pitch) { // EZt"),
])

# ---------- main.js ----------
patch('editor/js/main.js', [
    # import ezHeadRotation
    ("import { headLookOffsets, mergeRigOffsets, applyHeadRotation, getHeadRotation } from './figures.js';",
     "import { headLookOffsets, mergeRigOffsets, applyHeadRotation, getHeadRotation, ezHeadRotation } from './figures.js';"),
    # P1-6b: simple_figure ghost head — EZt(yaw,pitch) = euler(pitch,yaw,0) (pitch was landing on Z/roll)
    ("        if (d.look && m.userData.figure) m.userData.figure.head.rotation.set(0, d.look.headYawRad, d.look.headPitchRad);",
     "        if (d.look && m.userData.figure) m.userData.figure.head.rotation.set(...ezHeadRotation(d.look.headYawRad, d.look.headPitchRad));   // kje=EZt(yaw,pitch) — audit P1-6b"),
    # P1-7: planShown gates on playSession (recording) only — plan stays visible during playback
    ("    if (this.page.viewportMode === 'plan' && this.page.mode === 'edit' && !this.page.playing) {",
     "    if (this.page.viewportMode === 'plan' && this.page.mode === 'edit') {   // planShown @5787136: gates on playSession (recording) only — audit P1-7"),
    # hooks: playheadS + resolveAim for the store focus family
    ("      propDims: key => this.objectManager?.propCatalog?.[key]?.dims,\n    };",
     "      propDims: key => this.objectManager?.propCatalog?.[key]?.dims,\n      playheadS: () => this.page.playheadS,                     // performanceTimeS for the focus family\n      resolveAim: (id, t, off) => this.resolvers().aim(id, t, off),\n    };"),
    # P1-4: stopPerformance (live @5548587) — playing=false + seek cleared -> tick resets to rest
    ("  resetToBase() { // ye(): meshes back to stored TRS + rigs to their animation record (rest)",
     "  stopPerformance() { // live stopPerformance @5548587: playing=false + performanceSeekS=null -> at-rest tick resets (timeS 0 + stored TRS)\n    this.page.stop();\n    this.page.playheadS = 0;\n    this.page.seekEpoch = (this.page.seekEpoch ?? 0) + 1;\n    this.page.changed();\n    this._restEval = false;\n    this._restSeekPending = false;\n    this.resetToBase();\n  }\n  resetToBase() { // ye(): meshes back to stored TRS + rigs to their animation record (rest)"),
])

# ---------- store.js: the focus/move-segment family ----------
STORE_ADD = '''
  // ---- focus / move-segment family (live show-store methods; r13 audit P0-3 + P1-8;
  // setCameraFocus/keepLookOnClear/moveSegmentOf normalized-identical in DBE17t4T + CaBu3A6T) ----
  _playheadS() { return this._hooks?.playheadS?.() ?? 0; }
  moveSegmentOf(trackId, s) {                              // @5546275 — camera: Fp/V2r set; walker: path|play; covering + first fallback
    const tr = this.show.tracks.find(t => t.id === trackId);
    const objs = this._objs();
    const isCam = objs[tr?.characterId ?? '']?.kind === 'camera';
    const cands = (tr?.items ?? []).filter(o => isCam ? CAM_ITEM_KINDS.has(o.kind) : o.kind === 'path' || o.kind === 'play');
    return cands.find(o => s >= o.startS && s < o.startS + itemDuration(o)) ?? cands[0] ?? null;
  }
  cameraFocusId(cameraId) {                                // @5545617 — covering cam item at playhead -> Cit
    const trackId = this.show.tracks.find(t => t.characterId === cameraId)?.id ?? null;
    const r = trackId ? this.moveSegmentOf(trackId, this._playheadS()) : undefined;
    return r ? camItemFocusSubject(r) : null;
  }
  walkerFocusId(walkerId) {                                // @5545745
    const trackId = this.show.tracks.find(t => t.characterId === walkerId)?.id ?? null;
    const r = trackId ? this.moveSegmentOf(trackId, this._playheadS()) : undefined;
    return r?.kind === 'path' && r.aim === 'subject' ? r.subjectId ?? null : null;
  }
  setWalkerFocus(walkerId, subjectId) {                    // @5545918 verbatim (guards + covering path at playhead)
    const objs = this._objs();
    if (!isPersonKind(objs[walkerId]?.kind) || subjectId !== null && (subjectId === walkerId || !objs[subjectId])) return false;
    const trackId = this.show.tracks.find(t => t.characterId === walkerId)?.id ?? null;
    const a = trackId ? this.moveSegmentOf(trackId, this._playheadS()) : undefined;
    return !trackId || a?.kind !== 'path' ? false
      : (this.updatePathItemAim(trackId, a.id, subjectId ? 'subject' : 'travel', subjectId), true);
  }
  updatePathItemAim(trackId, itemId, aim, subjectId) {     // @5542837 — subjectId kept when travel (gates check aim)
    this._commit(trackId, t => {
      t.items = t.items.map(o => o.id === itemId && o.kind === 'path' ? { ...o, aim, ...(aim === 'subject' ? { subjectId } : {}) } : o);
    });
  }
  setCameraFocus(cameraId, subjectId, opts) {              // @5544109 verbatim (r13 audit P0-3)
    const objs = this._objs();
    if (objs[cameraId]?.kind !== 'camera' || subjectId !== null && (subjectId === cameraId || !objs[subjectId])) return false;
    const trackId = this.show.tracks.find(t => t.characterId === cameraId)?.id ?? this.addPerformanceTrack(cameraId);
    if (!trackId) return false;
    const items = this.show.tracks.find(t => t.id === trackId).items;
    const c = this.moveSegmentOf(trackId, this._playheadS());
    const patchable = c?.kind === 'cam-path' || c?.kind === 'cam-move' && CAM_MOVES_FOCUSABLE.includes(c.move);   // yP gate
    if (c && !patchable && c.kind !== 'cam-still') return false;   // refuse follow/transform/manual/pan_sweep
    const u = c ? camItemFocusSubject(c) : null;
    if (subjectId === null) {
      if (!c || !u) return false;
      const y = opts?.lookingAt ?? this.subjectAimPoint(u, c.aimOffsetUnits || 0);   // $6
      if (y) this.keepLookOnClear(cameraId, c, items, y);
    }
    if (c && patchable) {
      this.setCameraItemFields(trackId, c.id, { ...(c.kind === 'cam-path' ? { aim: 'subject' } : {}), subjectId });
      return true;
    }
    if (c?.kind === 'cam-still' && subjectId === null) {
      this.setCameraItemFields(trackId, c.id, { subjectId: null });
      return true;
    }
    const h = c?.startS ?? 0;
    const f = this._restDurationS(trackId);               // rx(show minus this track).durationS
    const m = items.find(y => y.startS > h)?.startS ?? Infinity;
    const g = Math.min(m, Math.max(f, h + (c ? itemDuration(c) : STILL_DUR)));       // sje('still') = N8 = 5
    const b = { id: c?.id ?? uuid(), kind: 'cam-still', startS: h,
      durationS: Math.max(STILL_MIN_DUR, g - h),           // Ije = .1
      ...(c && c.focalLengthMm !== undefined ? { focalLengthMm: c.focalLengthMm } : {}), subjectId };
    this._commit(trackId, t => { t.items = [b, ...t.items.filter(v => v.id !== c?.id)]; });
    return true;
  }
  keepLookOnClear(cameraId, item, items, lookPoint) {      // @5545290 verbatim
    if (!this._hooks?.updateObjectTransform) return;
    if (item.kind === 'cam-still') this._turnCameraToward(cameraId, lookPoint);
    const objs = this._objs();
    const o = objs[cameraId];
    const tid = o?.targetId, tobj = tid ? objs[tid] : undefined;
    if (!tid || !tobj) { this._hooks.updateObjectTransform(cameraId, { lastAimPosition: lookPoint }); return; }
    if (!items.some(d => d.id !== item.id && subjectlessItem(d))) this._hooks.updateObjectTransform(tid, { position: keepAimPoint(tobj, objs, lookPoint) });
  }
  _restDurationS(excludeTrackId) {                          // rx({...show minus track}).durationS — max endS over the rest
    let d = 0;
    for (const t of this.show.tracks) {
      if (t.id === excludeTrackId) continue;
      for (const it of t.items) d = Math.max(d, it.startS + itemDuration(it));
    }
    return d;
  }

  // ---- path item ops (paint mode) ----'''
patch('editor/js/store.js', [
    ("import { CAM_ITEM_KINDS, subjectlessItem } from './tracks.js';",
     "import { CAM_ITEM_KINDS, subjectlessItem, isPersonKind } from './tracks.js';\nimport { CAM_MOVES_FOCUSABLE, STILL_DUR, STILL_MIN_DUR } from './const.js';"),
    ("import { C, CAM_MOVE_PRESETS } from './const.js';",
     "import { C, CAM_MOVE_PRESETS } from './const.js';   // CAM_MOVES_FOCUSABLE/STILL_* via the second const import below"),
    ("  // ---- path item ops (paint mode) ----", STORE_ADD),
    # Cit module function — put after the keepAimPoint helper region: anchor on the first ShowStore-adjacent marker
    ("export class ShowStore extends StoreBase {",
     "function camItemFocusSubject(item) {                 // Cit @5523845 — cam-path needs aim==='subject'; cam-move/cam-still take subjectId directly\n  return item.kind === 'cam-path' ? (item.aim === 'subject' ? item.subjectId ?? null : null)\n    : item.kind === 'cam-move' || item.kind === 'cam-still' ? item.subjectId ?? null : null;\n}\n\nexport class ShowStore extends StoreBase {"),
])

# ---------- plan.js ----------
PLAN = [
    # P1-4: endStroke -> stopPerformance (reset to rest)
    ("    this.stroke = null, this.strokeClock = null, this.a._drawPreview = null, this.a.page.stop();",
     "    this.stroke = null, this.strokeClock = null, this.a._drawPreview = null;\n    this.a.stopPerformance?.();                                                                     // live stopPerformance @5548587 — reset to rest (audit P1-4)"),
    # toggleFocus: walker branch -> verbatim guards via show.setWalkerFocus
    ("""  toggleFocus(e) {
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
     """  toggleFocus(e) {
    const n = this.drawTarget();
    if (n && el(this.a.objects.get(n)?.kind)) {                                                        // walker: setWalkerFocus @5545918 verbatim (guards + covering path)
      const o = this.focusOf(n) === e;
      this.a.show.beginEditGesture();
      const l = this.a.show.setWalkerFocus(n, o ? null : e);
      this.a.show.endEditGesture();
      this.pendingWalkerFocus = l || o ? null : { id: n, subjectId: e };
      return;
    }
    const r = n;
    if (!r || this.a.objects.get(r)?.kind !== "camera") return;
    this.a.show.beginEditGesture();                                                                   // camera: setCameraFocus machine @5544109 (audit P0-3)
    const s = this.cameraFocusId(r) === e;
    const a = s ? this.clearFocus(r) : this.a.show.setCameraFocus(r, e);
    this.a.show.endEditGesture();
    !a && !s && this.a.toast?.("Couldn't set focus on this camera");                                  // ot.warning(sDr()) — i18n equivalent
  }
  clearFocus(camId) {                                                                                  // @5474407 — keep the current look point when clearing
    const n = this.cameraFocusId(camId);
    if (!n) return false;
    const t = this.a.page.playheadS;
    const s = this.a.resolvers().aim(n, t, 0);                                                        // foldResolvers().resolveAim
    return this.a.show.setCameraFocus(camId, null, { lookingAt: s ?? undefined });
  }"""),
    # deleteMove: use the store machine
    ("    s && this.setCameraFocus(e, s);",
     "    s && this.a.show.setCameraFocus(e, s);                                                       // @5469975 via the store machine"),
    # P1-5: drawTarget-changed -> exit drawing (live rDr ctor @5462644)
    ("""    app.page.subscribe?.(() => { if (this.locked() && this.stroke) { this.stroke = null; this.strokeClock = null; this.a._drawPreview = null; } if (this.locked()) this.drawingFor = null; });""",
     """    app.page.subscribe?.(() => { if (this.locked() && this.stroke) { this.stroke = null; this.strokeClock = null; this.a._drawPreview = null; this.hideRehearseTip(); } if (this.locked()) this.drawingFor = null; });
    let lastDrawTarget = this.drawTarget();                                                            // live rDr ctor @5462644: drawTarget change exits draw mode (audit P1-5)
    app.objects.subscribe?.(() => {
      const t = this.drawTarget();
      if (t !== lastDrawTarget) {
        lastDrawTarget = t;
        if (this.drawingFor !== null) { this.drawingFor = null; this._onDrawingChange?.(); }
      }
    });"""),
    # P2-3: bar sync on drawingFor changes — toggleDrawing/stopDrawing/stepBack/endStroke
    ("  toggleDrawing() { this.pendingWalkerFocus = null; this.drawingFor = this.drawing() ? null : this.drawTarget(); this.a.markAutosave?.(); }",
     "  toggleDrawing() { this.pendingWalkerFocus = null; this.drawingFor = this.drawing() ? null : this.drawTarget(); this._onDrawingChange?.(); this.a.markAutosave?.(); }"),
    ("  stopDrawing() { this.endStroke(), this.pendingWalkerFocus = null, this.drawingFor = null, this.hideRehearseTip(); }",
     "  stopDrawing() { this.endStroke(), this.pendingWalkerFocus = null, this.drawingFor = null, this.hideRehearseTip(), this._onDrawingChange?.(); }"),
    ("    return this.stroke ? !0 : this.drawing() ? (this.drawingFor = null, !0) : this.a.objects.selectedIds.length ? (this.a.objects.select([]), !0) : !1;",
     "    return this.stroke ? !0 : this.drawing() ? (this.drawingFor = null, this._onDrawingChange?.(), !0) : this.a.objects.selectedIds.length ? (this.a.objects.select([]), !0) : !1;"),
    ("    this.a.show.endEditGesture(), this.drawingFor = null;\n    s && (this.showRehearseTip(),",
     "    this.a.show.endEditGesture(), this.drawingFor = null, this._onDrawingChange?.();\n    s && (this.showRehearseTip(),"),
    # P2-1: carryPaths -> manipulator _refusalReason (the correct wZt-gated port); delete local driveMode
    ("""    if (this.a.objects.get(e)?.kind === "camera") {
      const a = this.a.show.trackOf(e)?.items ?? [], o = this.a.page.playheadS;
      if (this.driveMode(a, o, "translate") !== "path-position") return !1;                            // _je: ONLY path-position cameras carry
    }""",
     """    if (this.a.objects.get(e)?.kind === "camera") {
      const a = this.a.show.trackOf(e)?.items ?? [], o = this.a.page.playheadS;
      if (this.a.manipulator?._refusalReason(a, o, "translate") !== "path-position") return !1;        // _je via the manipulate port (wZt gates: manual needs samples, path needs anchors>=2) — audit P2-1
    }"""),
    ("""  driveMode(items, t, mode) {                                                                          // _je port
    let n = null;
    for (const it of items) { if (t < it.startS) break; if (['cam-path', 'cam-manual', 'cam-still', 'cam-move', 'cam-follow'].includes(it.kind)) n = it; if (t < it.startS + itemDuration(it)) break; }
    if (!n || t > n.startS + itemDuration(n)) return null;
    if (n.kind === 'cam-manual') return 'manual';
    if (mode !== 'rotate') return 'path-position';
    if ((n.aim ?? 'travel') !== 'locked') return 'path-look';
    return null;
  }
""",
     """"""),
    # P1-7 (plan.js side): shown() drops the !playing gate (planShown = plan && edit — no play sessions in the port)
    ("  shown() { return this.app.page.viewportMode === 'plan' && this.app.page.mode === 'edit' && !this.app.page.playing; }",
     "  shown() { return this.app.page.viewportMode === 'plan' && this.app.page.mode === 'edit'; }   // planShown @5787136 — gates on playSession (recording) only, not playback (audit P1-7)"),
    # wire the canvas bar sync hook (P2-3)
    ("    store._onTip = on => this._syncBar();",
     "    store._onTip = on => this._syncBar();\n    store._onDrawingChange = () => this._syncBar();   // P2-3: Esc/selection changes refresh the Finish pill"),
]
patch('editor/js/plan.js', PLAN)

print("ALL PATCHES APPLIED")
