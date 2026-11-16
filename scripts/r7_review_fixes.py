#!/usr/bin/env python3
"""R7-1 review fixes: all P1s + P2s + P3s from the round-7 code review."""
import sys

ED = '/home/z/my-project/flick-3dEditor/editor/js'

# ================= plan.js =================
src = open(f'{ED}/plan.js').read()
def rep(old, new, what, count=1):
    global src
    assert src.count(old) == count, f'plan.js anchor {what}: found {src.count(old)}, expected {count}'
    src = src.replace(old, new)
    print(f'  plan.js: {what} OK')

# --- P3 #13: dead n in drawTarget ---
rep("""  drawTarget() {
    const e = this.a.objects.selectedIds, n = e.length === 1 ? e[0]?.kind ?? this.a.objects.get(e[0])?.kind : void 0;
    const kind = e.length === 1 ? (this.a.objects.get(e[0])?.kind) : void 0;
    return kind === "camera" || (Q0(kind) && kind !== "group" && kind !== "target") ? e[0] : null;
  }""",
    """  drawTarget() {
    const e = this.a.objects.selectedIds;
    const kind = e.length === 1 ? this.a.objects.get(e[0])?.kind : void 0;
    return kind === "camera" || (Q0(kind) && kind !== "group" && kind !== "target") ? e[0] : null;
  }""",
    'P3-13 drawTarget cleanup')

# --- P1 #2: shiftPaths — zero-delta true, path/cam-path only, packing ---
rep("""  shiftPaths(e, dx, dz) {                                                                              // shift the object's path anchors + transform keys
    if (dx === 0 && dz === 0) return !1;
    const tr = this.a.show.trackOf(e); if (!tr) return !1;
    let touched = !1;
    for (const it of tr.items) {
      if ((it.kind === 'path' || it.kind === 'cam-path') && it.anchors?.length) {
        it.anchors = it.anchors.map(a => ({ ...a, pos: [a.pos[0] + dx, a.pos[1], a.pos[2] + dz] })); touched = !0;
      } else if ((it.kind === 'transform' || it.kind === 'cam-transform') && it.keys?.length) {
        it.keys = it.keys.map(k => ({ ...k, position: k.position ? [k.position[0] + dx, k.position[1], k.position[2] + dz] : k.position })); touched = !0;
      }
    }
    return touched && (this.a.show.changed(), !0);
  }""",
    """  shiftPaths(e, dx, dz) {                                                                              // live shiftPaths: path/cam-path anchors ONLY (Eit), zero-delta → true, packed
    if (dx === 0 && dz === 0) return !0;
    const tr = this.a.show.trackOf(e); if (!tr) return !1;
    const Eit = t => (t.kind === "path" || t.kind === "cam-path") && t.anchors?.length > 0;
    if (!tr.items.some(Eit)) return !1;
    this._updateTrackItems(tr.id, o => o.map(l => Eit(l)
      ? { ...l, anchors: l.anchors.map(a => ({ ...a, pos: [a.pos[0] + dx, a.pos[1], a.pos[2] + dz] })) }
      : l));
    return !0;
  }
  _updateTrackItems(trackId, fn) {                                                                     // live updateTrackItems: mutate + lje pack
    const tr = this.a.show.show.tracks.find(t => t.id === trackId);
    if (tr) { tr.items = packItems(fn(tr.items)); this.a.show.changed(); }
  }""",
    'P1-2 shiftPaths exact')

# --- P1 #3: carryPaths gate — only path-position ---
rep("""    if (this.a.objects.get(e)?.kind === "camera") {
      const a = this.a.show.trackOf(e)?.items ?? [], o = this.a.page.playheadS;
      if (!this.driveMode(a, o, "translate")) return !1;                                               // _je: only path-position cameras carry
    }""",
    """    if (this.a.objects.get(e)?.kind === "camera") {
      const a = this.a.show.trackOf(e)?.items ?? [], o = this.a.page.playheadS;
      if (this.driveMode(a, o, "translate") !== "path-position") return !1;                            // _je: ONLY path-position cameras carry
    }""",
    'P1-3 carryPaths gate')

# --- P1 #4+#5: _replaceMove facade — moveSegmentOf covering-time + packing ---
rep("""  _replaceMove(id, startS, samples, opts) {                                                            // replaceMoveFromSamples over my facade
    const facade = {
      objects: this.a.objects.all(),
      trackIdOf: e => this.a.show.trackOf(e)?.id ?? null,
      addPerformanceTrack: e => this.a.show.ensureTrack(e)?.id ?? null,
      moveSegmentOf: (trackId, s) => this.a.show.show.tracks.find(t => t.id === trackId)?.items.find(i => (i.kind === 'path' || i.kind === 'cam-path') && i.anchors?.length > 1) ?? null,
      updateTrackItems: (trackId, fn) => { const tr = this.a.show.show.tracks.find(t => t.id === trackId); if (tr) { tr.items = fn(tr.items); this.a.show.changed(); } },
      an: () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2)),
    };
    return replaceMoveFromSamples(facade, id, startS, samples, opts);
  }""",
    """  _replaceMove(id, startS, samples, opts) {                                                            // replaceMoveFromSamples over my facade
    const show = this.a.show;
    const facade = {
      objects: this.a.objects.all(),
      trackIdOf: e => show.trackOf(e)?.id ?? null,
      addPerformanceTrack: e => show.ensureTrack(e)?.id ?? null,
      // live moveSegmentOf: covering-time selection with first-item fallback (incl. anchors≤1 + play items)
      moveSegmentOf: (trackId, s) => {
        const tr = show.show.tracks.find(t => t.id === trackId); if (!tr) return null;
        const cands = (tr.items ?? []).filter(o => o.kind === 'path' || o.kind === 'cam-path' || o.kind === 'play');
        return cands.find(o => s >= o.startS && s < o.startS + itemDuration(o)) ?? cands[0] ?? null;
      },
      updateTrackItems: (trackId, fn) => this._updateTrackItems(trackId, fn),                          // packed (lje)
      an: () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2)),
    };
    return replaceMoveFromSamples(facade, id, startS, samples, opts);
  }""",
    'P1-4/5 _replaceMove facade')

# import packItems
rep("import { itemDuration } from './schema.js';",
    "import { itemDuration, packItems } from './schema.js';",
    'packItems import')

# --- P1 #7: warnOnce + Xu target guard in turn ---
rep("""  turn(e, n) {                                                                                          // world-Y premultiply (rebase for cameras)
    const r = this.a.objects.get(e), s = this.startPose(e);
    if (!r || !s) return;""",
    """  turn(e, n) {                                                                                          // world-Y premultiply (rebase for cameras)
    const r = this.a.objects.get(e), s = this.startPose(e);
    if (!r || !s || (r.kind === "target" && this._targetReferenced(e))) return;                         // Xu: paired targets don't turn""",
    'P1-7 turn Xu guard')
rep("""  startPose(e) { const n = this.drag?.start, r = n?.get(e); if (r) return r; const s = this.shownOrStored(e); return s && n && n.set(e, s), s; }""",
    """  startPose(e) { const n = this.drag?.start, r = n?.get(e); if (r) return r; const s = this.shownOrStored(e); return s && n && n.set(e, s), s; }
  _targetReferenced(e) { return this.a.objects.all()[e]?.kind === 'target' && Object.values(this.a.objects.all()).some(c => c.kind === 'camera' && c.targetId === e); } // Xu
  warnOnce(msg) { if (this.drag?.warned) return; if (this.drag) this.drag.warned = true; this.a.toast?.(msg); }""",
    'P1-7 warnOnce + Xu helper')

# --- P3 #14: dispose ---
rep("""  commitOne(e, n, r) {
    const a = this.a.objects.get(e); if (!a) return;""",
    """  dispose() { this.stopDrawing(); }
  commitOne(e, n, r) {
    const a = this.a.objects.get(e); if (!a) return;""",
    'P3-14 dispose')

# --- P2 #10: _syncBar cam pills hash covers labels (rename-safe) + textContent (no HTML injection) ---
rep("""    // camera pills
    const pills = b.querySelector('#pbCamPills'), cams = st.cameraPills(), sel = this.app.objects.selectedIds;
    if (this._camKeys !== cams.map(c => c.id).join(',')) {
      this._camKeys = cams.map(c => c.id).join(',');
      pills.innerHTML = cams.map(c => `<button type="button" data-cam="${c.id}" title="${c.label}"><i></i>${c.label}</button>`).join('');
      pills.querySelectorAll('button').forEach(x => x.onclick = () => this.store.goToCamera(x.dataset.cam));
    }
    pills.querySelectorAll('button').forEach(x => x.classList.toggle('on', sel.length === 1 && sel[0] === x.dataset.cam));
    this._syncZoomBar();
  }""",
    """    // camera pills — hash ids+labels (P2: rename updates, no innerHTML when unchanged) + textContent (P2: no HTML injection)
    const pills = b.querySelector('#pbCamPills'), cams = st.cameraPills(), sel = this.app.objects.selectedIds;
    const hash = cams.map(c => c.id + '|' + c.label).join(',');
    if (this._camKeys !== hash) {
      this._camKeys = hash;
      pills.textContent = '';
      for (const c of cams) {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.dataset.cam = c.id; btn.title = c.label;
        const dot = document.createElement('i'); btn.appendChild(dot); btn.appendChild(document.createTextNode(c.label));
        btn.onclick = () => this.store.goToCamera(c.id);
        pills.appendChild(btn);
      }
    }
    pills.querySelectorAll('button').forEach(x => x.classList.toggle('on', sel.length === 1 && sel[0] === x.dataset.cam));
    this._syncZoomBar();
  }""",
    'P2-10/11 cam pills')
# tick(): drop the per-frame _syncBar (subscriptions cover it; force on zoom only)
rep("""    this._edge = $Ir(this._items, oe);
    FDr(se, this._edge, this.palette);
    this._syncCamChip(oe, Ee);                                                  // camera label overlay (ZIr)
    this._syncBar();
  }""",
    """    this._edge = $Ir(this._items, oe);
    FDr(se, this._edge, this.palette);
    this._syncCamChip(oe, Ee);                                                  // camera label overlay (ZIr)
  }""",
    'P2-10 drop per-frame syncBar')
# chip size caching
rep("""    this._camChip.textContent = Ae.label;
      const Te = ZIr(Ae, oe, { widthPx: this._camChip.offsetWidth, heightPx: this._camChip.offsetHeight });
      this._camChip.style.transform = `translate(${Te.x}px, ${Te.y}px)`;""",
    """    this._camChip.textContent = Ae.label;
      if (!this._chipW || this._chipLbl !== Ae.label) { this._chipLbl = Ae.label; this._chipW = this._camChip.offsetWidth; this._chipH = this._camChip.offsetHeight; }
      const Te = ZIr(Ae, oe, { widthPx: this._chipW, heightPx: this._chipH });
      this._camChip.style.transform = `translate(${Te.x}px, ${Te.y}px)`;""",
    'P2-10 chip size cache')
# bar sync on store change should force (labels/ids may change)
rep("if (app.objects?.subscribe) app.objects.subscribe(() => { if (this.shown()) this._syncBar(); });\n    if (app.show?.subscribe) app.show.subscribe(() => { if (this.shown()) this._syncBar(); });",
    "if (app.objects?.subscribe) app.objects.subscribe(() => { if (this.shown()) this._syncBar(true); });\n    if (app.show?.subscribe) app.show.subscribe(() => { if (this.shown()) this._syncBar(true); });",
    'P2-10 subscription force')

# --- P3 #15: zoom buttons cancel center ease (handled in tick's zoomCommand branch via _interacted; add ease clear) ---
rep("""    const je = this.store.zoomCommand;                                          // zoom −/fit/+ buttons
    if (je && je.seq !== this._lastZoomSeq) {
      this._lastZoomSeq = je.seq, this._interacted = true;
      this.w = je.kind === "fit" ? OLr(this.w) : RLr(this.w, je.kind === "in" ? 1 : -1);
    }""",
    """    const je = this.store.zoomCommand;                                          // zoom −/fit/+ buttons
    if (je && je.seq !== this._lastZoomSeq) {
      this._lastZoomSeq = je.seq, this._interacted = true, this._centerEase = null;
      this.w = je.kind === "fit" ? OLr(this.w) : RLr(this.w, je.kind === "in" ? 1 : -1);
    }""",
    'P3-15 zoom cancels ease')

open(f'{ED}/plan.js', 'w').write(src)
print('plan.js written')

# ================= main.js =================
src = open(f'{ED}/main.js').read()
def repm(old, new, what):
    global src
    assert src.count(old) == 1, f'main.js anchor {what}: found {src.count(old)}'
    src = src.replace(old, new)
    print(f'  main.js: {what} OK')

# P1 #6: pickPersonKind gesture bracket + no double changed
repm("""  pickPersonKind(id, kind) {   // live pickPersonKind — mesh rebuilds via syncOne kind check
    if (this.objects.get(id)?.kind === kind) return;
    this.objects.update(id, { kind });
    this.objects.changed();
  }""",
    """  pickPersonKind(id, kind) {   // live pickPersonKind — gesture-bracketed (undoable), mesh rebuilds via syncOne
    if (this.objects.get(id)?.kind === kind) return;
    this.show.beginEditGesture();
    try { this.objects.update(id, { kind }); }                    // update() already fires changed()
    finally { this.show.endEditGesture(); }
  }""",
    'P1-6 pickPersonKind')

# P2 #9: tickDrawPreview head restore + parent-local compose
repm("""    } else if (this._drawPreviewId) {
      const id = this._drawPreviewId; this._drawPreviewId = null;
      const obj = this.objects.get(id); const m = this.meshById.get(id);
      if (obj && m) {  // restore stored pose
        m.position.set(...(obj.position ?? [0, 0, 0]));
        m.rotation.set(...(obj.rotation ?? [0, 0, 0]));
      }
    }""",
    """    } else if (this._drawPreviewId) {
      const id = this._drawPreviewId; this._drawPreviewId = null;
      const obj = this.objects.get(id); const m = this.meshById.get(id);
      if (obj && m) {  // restore stored pose (+ head)
        m.position.set(...(obj.position ?? [0, 0, 0]));
        m.rotation.set(...(obj.rotation ?? [0, 0, 0]));
        if (m.userData.figure?.head) m.userData.figure.head.rotation.set(...(obj.headRotation ?? [0, 0, 0]));
      }
    }""",
    'P2-9 preview restore head')
repm("""      if (m) {
        this._drawPreviewId = d.id;
        m.position.set(...d.position);
        m.rotation.set(...d.rotation);
        if (d.look && m.userData.figure) m.userData.figure.head.rotation.set(0, d.look.headYawRad, d.look.headPitchRad);
      }""",
    """      if (m) {
        this._drawPreviewId = d.id;
        // world pose → mesh-local (parent-aware, live Hie)
        if (m.parent && m.parent !== this.scene) {
          const v = new THREE.Vector3(...d.position);
          m.parent.worldToLocal(v);
          m.position.copy(v);
        } else m.position.set(...d.position);
        m.rotation.set(...d.rotation);
        if (d.look && m.userData.figure) m.userData.figure.head.rotation.set(0, d.look.headYawRad, d.look.headPitchRad);
      }""",
    'P2-9 preview parent-local')

open(f'{ED}/main.js', 'w').write(src)
print('main.js written')

# ================= manipulate.js =================
src = open(f'{ED}/manipulate.js').read()
def repx(old, new, what):
    global src
    assert src.count(old) == 1, f'manipulate.js anchor {what}: found {src.count(old)}'
    src = src.replace(old, new)
    print(f'  manipulate.js: {what} OK')

# P2 #8: plan path skips the stale _dragStartObj paired-target branch (plan store updates the target itself in move())
repx("""    if (planStore?.drag?.planTargetPos && targetObj) {
      app.objects.update(targetObj.id, { position: planStore.drag.planTargetPos(targetObj.id) });
    } else if (targetObj && this._dragStartObj) {""",
    """    if (planStore) {                                       // plan drags: PlanStore.move updates the paired target itself
      /* skip — no stale gizmo _dragStartObj */
    } else if (targetObj && this._dragStartObj) {""",
    'P2-8 plan skips stale paired-target')

# P1 #7: refusal toast gated on drag.warned (one per drag, not per move-intent)
repx("""    const outcome = this._commitSZt(id, obj, null, world, local, mode, planStore);
    if (outcome?.outcome === 'refused') app.toast?.(this._refusalText(outcome.reason));
    else if (outcome?.outcome === 'unbased') app.toast?.('Camera move could not be re-based (' + outcome.reason + ')');
    return outcome;""",
    """    const outcome = this._commitSZt(id, obj, null, world, local, mode, planStore);
    if (outcome?.outcome === 'refused') planStore.warnOnce(this._refusalText(outcome.reason));   // once per drag
    else if (outcome?.outcome === 'unbased') planStore.warnOnce('Camera move could not be re-based (' + outcome.reason + ')');
    return outcome;""",
    'P1-7 toast gated warnOnce')

open(f'{ED}/manipulate.js', 'w').write(src)
print('manipulate.js written')

# ================= ui.js =================
src = open(f'{ED}/ui.js').read()
def repu(old, new, what):
    global src
    assert src.count(old) == 1, f'ui.js anchor {what}: found {src.count(old)}'
    src = src.replace(old, new)
    print(f'  ui.js: {what} OK')

# P2 #12: New empty scene — undoable gesture + playhead reset (no destructive one-click)
repu("""  el.querySelector('#spNew').onclick = async () => {
    app.objects.setObjects({});
    app.show.setShow({ name: 'Show', tracks: [] });
    app.light = normalizeLight(null);
    app.page.recordAspect = '16:9';
    app._syncObjects(); app.shadowFit.force(); app.fogNearFar.fitNow();
    app._restEval = false; app._restSeekPending = false;
    app._seenSeekEpoch = app.page.seekEpoch ?? 0;
    app.playbackClips = new Map();
    $('sceneName').value = 'Scene';
    el.classList.remove('open');
    app.toast('New empty scene');
  };""",
    """  el.querySelector('#spNew').onclick = async () => {
    // gesture-bracketed so the previous scene is recoverable via ⌘Z (setShow clears undo otherwise)
    app.show.beginEditGesture();
    try {
      app.objects.setObjects({});
      app.show.show = { name: 'Show', tracks: [] };
      app.show.changed();
    } finally { app.show.endEditGesture(); }
    app.light = normalizeLight(null);
    app.page.recordAspect = '16:9';
    app.page.playheadS = 0; app.page.playing = false; app.page.changed();
    app._syncObjects(); app.shadowFit.force(); app.fogNearFar.fitNow();
    app._restEval = false; app._restSeekPending = false;
    app._seenSeekEpoch = app.page.seekEpoch ?? 0;
    app.playbackClips = new Map();
    $('sceneName').value = 'Scene';
    el.classList.remove('open');
    app.toast('New empty scene (⌘Z to undo)');
  };""",
    'P2-12 new-scene undoable')

open(f'{ED}/ui.js', 'w').write(src)
print('ui.js written')
