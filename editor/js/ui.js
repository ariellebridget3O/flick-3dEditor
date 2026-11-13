// ui.js — DOM UI: header (scene name, Light popover, Rehearse, view switches), workspace,
// right dock (inspector + add palette + hierarchy), timeline footer, camera pills, toasts.
// Layout per analysis/DOM_REFERENCE.md; vanilla DOM per DESIGN D1.
// Called AFTER boot with the live app instance.
import { C, CLIPS, CAM_MOVES, CAM_MOVE_PRESETS } from './const.js';
import { normalizeLight } from './env.js';
import { itemDuration } from './schema.js';
import { showLayout, ITEM_LABELS, fovFromFocal } from './tracks.js';

const $ = id => document.getElementById(id);

export function buildUI(app) {
  // DOM shell is static in index.html — only wire events here.
  app.toast = msg => {
    const t = $('toast');
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(app._toastT);
    app._toastT = setTimeout(() => t.style.display = 'none', 2600);
  };

  // Light popover (sun puck) — built lazily
  let lightPop = null;
  $('btnLight').onclick = e => {
    e.stopPropagation();
    if (!lightPop) lightPop = buildLightPopover(app);
    lightPop.toggle();
  };

  // Rehearse / play
  const $id = $;
  $('btnPlay').onclick = () => {
    if (app.page.playing) { app.page.stop(); app.resetToBase?.(); }
    else { app.page.play(); }
  };

  // view + mode switches
  $('viewSwitch').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    [...$('viewSwitch').children].forEach(x => x.classList.toggle('on', x === b));
    app.page.stageView = b.dataset.v;
    updateFrameGuide(app);
  });
  $('modeSwitch').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    [...$('modeSwitch').children].forEach(x => x.classList.toggle('on', x === b));
    app.page.controlMode = b.dataset.m;
    app._applyControlMode();
  });

  // open/save
  $('btnOpen').onclick = () => $('fileInput').click();
  $('fileInput').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    const data = JSON.parse(await f.text());
    await app.loadSceneData(data);
    $('sceneName').value = data?.row?.name ?? data?.show?.name ?? 'Scene';
    e.target.value = '';
  };
  $('btnSave').onclick = () => {
    const blob = new Blob([JSON.stringify(app.currentSceneJSON(), null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'scene.json'; link.click();
    URL.revokeObjectURL(url);
  };

  // edit toolbar
  $('editToolbar').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const tool = b.dataset.tool;
    if (tool === 'delete') {
      for (const id of app.objects.selectedIds) { app.show.detachReferences(id); app.objects.remove(id); }
    } else {
      app.manipulator.transform.setMode(tool);
      app.objects.changed();
    }
  });

  // add palette
  document.querySelector('.add-grid').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const kind = b.dataset.add;
    if (kind === 'prop') { openPropPicker(app); return; }
    const a = app;
    const id = a.objects.add({
      kind,
      name: kind === 'humanoid' ? 'Human' : kind === 'simple_figure' ? 'Figure' : kind.charAt(0).toUpperCase() + kind.slice(1),
      position: [0, kind === 'humanoid' || kind === 'simple_figure' || kind === 'cube' || kind === 'sphere' || kind === 'cylinder' ? 0 : 1, 0],
      rotation: [0, 0, 0], scale: [1, 1, 1],
      ...(kind === 'humanoid' ? { animation: { clip: 'idle', playing: false } } : {}),
      ...(kind === 'camera' ? { focalLengthMm: 50, shake: 'off' } : {}),
      ...(kind === 'spotlight' ? { spotlight: { shape: 'round', intensity: 70, diffusion: 30 } } : {}),
    });
    a.objects.select([id]);
    a.focusObject(id);
  });

  // selection → toolbar + inspector refresh; show → timeline refresh
  app.objects.subscribe(() => {
    refreshSelectionUI(app);
    refreshTimeline(app);
  });
  app.show.subscribe(() => refreshTimeline(app));
  refreshSelectionUI(app);
  refreshTimeline(app);

  // timeline
  buildTimeline(app);

  // per-frame UI updates
  let lastPlayhead = -1;
  setInterval(() => {
    const t = app.page?.playheadS ?? 0;
    if (Math.abs(t - lastPlayhead) > 0.005) {
      lastPlayhead = t;
      $('timeBadge').textContent = t.toFixed(2);
      updatePlayhead(app, t);
    }
  }, 100);

  // frame guide update on aspect change
  app.onAspect = () => updateFrameGuide(app);
  updateFrameGuide(app);
}

// ================= light popover (sun puck TQr/AQr port) =================
function buildLightPopover(app) {
  let el = document.getElementById('lightPop');
  if (el) return { toggle: () => el.classList.toggle('open') };
  el = document.createElement('div');
  el.id = 'lightPop'; el.className = 'light-pop hud-window';
  el.innerHTML = `
    <div class="puck-wrap"><div class="puck" id="sunPuck"><div class="knob" id="sunKnob"></div></div></div>
    <div class="presets">
      ${C.LIGHT_PRESETS.map((p, i) => `<button data-i="${i}" title="${p.azimuthDeg}°/${p.elevationDeg}°">${p.label}</button>`).join('')}
    </div>
    <div class="light-nums">
      <label>Az <input id="azNum" type="number" min="0" max="360" step="1"></label>
      <label>El <input id="elNum" type="number" min="-30" max="90" step="1"></label>
    </div>`;
  document.querySelector('.stage-header').appendChild(el);

  const knob = el.querySelector('#sunKnob');
  const puck = el.querySelector('#sunPuck');
  const azNum = el.querySelector('#azNum'), elNum = el.querySelector('#elNum');

  function render() {
    const l = app.light;
    // knob: centre = zenith 90°, rim = −30°; radius = (90−el)/120; rotated by view yaw
    const viewYaw = 0;
    const r = (90 - l.elevationDeg) / 120;
    const a = (l.azimuthDeg - viewYaw) * Math.PI / 180;
    knob.style.left = `${50 + Math.sin(a) * r * 46}%`;
    knob.style.top = `${50 - Math.cos(a) * r * 46}%`;
    azNum.value = l.azimuthDeg.toFixed(0);
    elNum.value = l.elevationDeg.toFixed(0);
    el.querySelectorAll('.presets button').forEach(b => {
      const p = C.LIGHT_PRESETS[+b.dataset.i];
      b.classList.toggle('on', Math.abs(p.elevationDeg - l.elevationDeg) < 0.5);
    });
  }
  function set(az, elv) {
    app.light = normalizeLight({ azimuthDeg: az, elevationDeg: elv, nightLights: app.light.nightLights });
    app.shadowFit.force();
    render();
  }
  let dragging = false;
  puck.addEventListener('pointerdown', e => { dragging = true; puck.setPointerCapture(e.pointerId); });
  puck.addEventListener('pointermove', e => {
    if (!dragging) return;
    const r = puck.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 2 - 1;
    const y = (e.clientY - r.top) / r.height * 2 - 1;
    const rad = Math.min(1, Math.hypot(x, y));
    const az = Math.atan2(x, -y) * 180 / Math.PI;
    set(((az % 360) + 360) % 360, 90 - rad * 120);
  });
  puck.addEventListener('pointerup', () => dragging = false);
  azNum.onchange = () => set(+azNum.value || 0, app.light.elevationDeg);
  elNum.onchange = () => set(app.light.azimuthDeg, +elNum.value || 0);
  el.querySelectorAll('.presets button').forEach(b => b.onclick = () => {
    const p = C.LIGHT_PRESETS[+b.dataset.i];
    set(p.azimuthDeg, p.elevationDeg);
  });
  document.addEventListener('click', e => {
    if (!el.contains(e.target) && e.target !== document.getElementById('btnLight')) el.classList.remove('open');
  });
  render();
  return { toggle: () => { el.classList.toggle('open'); render(); }, render };
}

// ================= frame guide (XGt/o2r/MGr port) =================
export function updateFrameGuide(app) {
  const guide = document.getElementById('frameGuide');
  if (!guide) return;
  const inCamMode = app.page.stageView === 'cameras';
  if (!inCamMode) { guide.style.display = 'none'; app.camera.fov = C.EDITOR_FOV; app.camera.updateProjectionMatrix(); return; }
  const host = document.getElementById('viewport');
  const w = host.clientWidth, h = host.clientHeight;
  const viewportAspect = w / Math.max(1, h);
  const [rw, rh] = C.ASPECTS[app.page.recordAspect] ?? C.ASPECTS['16:9'];
  const recordAspect = rw / rh;
  const Mtt = a => C.SENSOR_W * Math.min(a, 1);
  const XCe = a => C.SENSOR_W / Math.max(a, 1);
  const maxHeightFraction = Math.max(0, (h - 2 * C.FRAME_CHROME_PX) / h) || 1;
  const e = Mtt(recordAspect) / Mtt(viewportAspect);
  const n = XCe(recordAspect) / XCe(viewportAspect);
  const r = Math.max(1, e, n / maxHeightFraction);
  const wf = e / r, hf = n / r;
  guide.style.display = 'block';
  guide.style.left = `${(1 - wf) / 2 * 100}%`;
  guide.style.top = `${(1 - hf) / 2 * 100}%`;
  guide.style.width = `${wf * 100}%`;
  guide.style.height = `${hf * 100}%`;
  // camera-mode fov adoption: fov = 2·atan(fovScale·XCe(viewportAspect)/2/focal)
  const focal = app.page.focalLengthMm;
  const fov = 2 * Math.atan(r * XCe(viewportAspect) / 2 / focal) * 180 / Math.PI;
  app.camera.fov = Math.min(120, Math.max(10, fov));
  app.camera.updateProjectionMatrix();
}

// ================= selection UI =================
function refreshSelectionUI(app) {
  const tb = document.getElementById('editToolbar');
  const ids = app.objects.selectedIds;
  tb.style.display = ids.length ? 'flex' : 'none';
  if (ids.length && app.selection.screenBounds) {
    const b = app.selection.screenBounds;
    const host = document.getElementById('viewport');
    tb.style.left = `${Math.max(8, Math.min(host.clientWidth - 160, b.cx - 70))}px`;
    tb.style.top = `${Math.max(8, b.y0 - 44)}px`;
  }
  // tool active state
  [...tb.children].forEach(b => b.classList.toggle('on',
    b.dataset.tool === app.manipulator?.transform?.mode));
  app.manipulator?.attachToSelection();
  refreshInspector(app);
}

// ================= inspector =================
function refreshInspector(app) {
  const body = document.getElementById('inspectorBody');
  const id = app.objects.selectedId;
  const obj = id ? app.objects.get(id) : null;
  if (!obj) { body.innerHTML = '<div class="hint">Select an object</div>'; return; }
  const num = (label, value, step, cb) =>
    `<label class="row">${label}<input type="number" step="${step}" value="${fmt(value)}" data-k="${label}"></label>`;
  const vec = (label, v, step, cb) => `<div class="vec-row"><span>${label}</span>
    <input type="number" step="${step}" value="${fmt(v?.[0])}" data-k="${label}0">
    <input type="number" step="${step}" value="${fmt(v?.[1])}" data-k="${label}1">
    <input type="number" step="${step}" value="${fmt(v?.[2])}" data-k="${label}2"></div>`;
  let html = `<div class="insp-kind">${obj.kind}</div>
    <label class="row">Name<input type="text" id="inspName" value="${escAttr(obj.name ?? '')}"></label>
    ${vec('position', obj.position ?? [0, 0, 0], 0.1)}
    ${vec('rotation', obj.rotation ?? [0, 0, 0], 0.05)}
    ${vec('scale', obj.scale ?? [1, 1, 1], 0.05)}`;
  if (obj.kind === 'camera') {
    html += `<label class="row">Focal mm<input type="number" step="1" min="14" max="200" value="${obj.focalLengthMm ?? 50}" data-k="focalLengthMm"></label>
      <label class="row">Shake<select data-k="shake">${C.SHAKE_VALUES.map(s => `<option ${obj.shake === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>`;
  }
  if (obj.kind === 'spotlight') {
    const sp = obj.spotlight ?? C.SPOT_DEFAULTS;
    html += `<label class="row">Shape<select data-k="spotlight.shape">
      <option ${sp.shape === 'round' ? 'selected' : ''}>round</option>
      <option ${sp.shape === 'square' ? 'selected' : ''}>square</option></select></label>
      <label class="row">Intensity<input type="number" step="5" min="0" max="100" value="${sp.intensity}" data-k="spotlight.intensity"></label>
      <label class="row">Diffusion<input type="number" step="5" min="0" max="100" value="${sp.diffusion}" data-k="spotlight.diffusion"></label>`;
  }
  if (obj.kind === 'humanoid') {
    const others = Object.entries(app.objects.all()).filter(([, o]) => o.kind !== 'camera');
    html += `<label class="row">Clip<select data-k="animation.clip">
      ${Object.keys(CLIPS).filter(c => c !== 'a_tpose').map(c => `<option ${obj.animation?.clip === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>`;
  }
  if (obj.kind === 'prop') html += `<div class="row readonly">prop: ${obj.propKey}</div>`;
  // actions
  html += `<div class="insp-actions">
    <button data-act="walk">＋ Walk path</button>
    <button data-act="campath">＋ Camera path</button>
    <button data-act="clip">＋ Clip</button>
    <button data-act="cammove">＋ Camera move</button>
    <button data-act="focus">Focus</button>
    <button data-act="dup">Duplicate</button>
    <button data-act="del">Delete</button>
  </div>`;
  body.innerHTML = html;

  body.querySelectorAll('input, select').forEach(inp => {
    inp.onchange = () => {
      const k = inp.dataset.k;
      if (!k) return;
      const v = parseFloat(inp.value);
      if (k === 'position0') app.objects.update(id, { position: withIdx(obj.position, 0, v) });
      else if (k === 'position1') app.objects.update(id, { position: withIdx(obj.position, 1, v) });
      else if (k === 'position2') app.objects.update(id, { position: withIdx(obj.position, 2, v) });
      else if (k.startsWith('rotation')) app.objects.update(id, { rotation: withIdx(obj.rotation, +k.slice(-1), v) });
      else if (k.startsWith('scale')) app.objects.update(id, { scale: withIdx(obj.scale, +k.slice(-1), v) });
      else if (k === 'focalLengthMm') app.objects.update(id, { focalLengthMm: Math.min(200, Math.max(14, v)) });
      else if (k === 'shake') app.objects.update(id, { shake: inp.value });
      else if (k === 'spotlight.shape') app.objects.update(id, { spotlight: { ...obj.spotlight, shape: inp.value } });
      else if (k === 'spotlight.intensity') app.objects.update(id, { spotlight: { ...obj.spotlight, intensity: clampNum(v, 0, 100) } });
      else if (k === 'spotlight.diffusion') app.objects.update(id, { spotlight: { ...obj.spotlight, diffusion: clampNum(v, 0, 100) } });
      else if (k === 'animation.clip') app.objects.update(id, { animation: { clip: inp.value, playing: obj.animation?.playing ?? false } });
      app.objects.changed();
    };
  });
  const nameEl = body.querySelector('#inspName');
  if (nameEl) nameEl.onchange = () => app.objects.update(id, { name: nameEl.value });
  body.querySelector('.insp-actions')?.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'focus') app.focusObject(id);
    if (act === 'del') { app.show.detachReferences(id); app.objects.remove(id); }
    if (act === 'dup') { const nid = app.objects.duplicate(id, app.show); if (nid) app.objects.select([nid]); }
    if (act === 'walk') {
      const item = app.show.addPathItem(id, app.page.playheadS);
      app.pathEditor.enterPaint(app.show.trackOf(id).id, item.id);
      app.pathEditor.seedFirstAnchor();
    }
    if (act === 'campath') {
      const item = app.show.addItem(id, { kind: 'cam-path', anchors: [], speedUnitsPerS: 2, aim: 'travel' });
      app.pathEditor.enterPaint(app.show.trackOf(id).id, item.id);
      app.pathEditor.seedFirstAnchor();
    }
    if (act === 'clip') {
      app.show.addItem(id, { kind: 'clip', clip: 'idle', durationS: C.ITEM_DEFAULT_DUR });
    }
    if (act === 'cammove') {
      app.show.addItem(id, { kind: 'cam-move', move: 'orbit', direction: 'ccw', angleDeg: 360, durationS: CAM_MOVE_PRESETS.orbit.durationS, heightDeltaUnits: 0, distanceScale: 1 });
    }
    refreshTimeline(app);
  });
}
const withIdx = (arr, i, v) => { const a = [...(arr ?? [0, 0, 0])]; a[i] = v; return a; };
const clampNum = (v, a, b) => Math.min(b, Math.max(a, v));
const fmt = v => Number.isFinite(v) ? Math.round(v * 1000) / 1000 : 0;
const escAttr = s => String(s).replace(/"/g, '&quot;');

// ================= hierarchy =================
export function refreshHierarchy(app) {
  const el = document.getElementById('hierarchy');
  if (!el) return;
  const objs = app.objects.all();
  const names = Object.entries(objs).map(([id, o]) => ({ id, o, depth: o.parentId ? 1 : 0 }));
  el.innerHTML = names.map(({ id, o, depth }) =>
    `<div class="hier-row ${app.objects.selectedIds.includes(id) ? 'sel' : ''}" data-id="${id}" style="padding-left:${8 + depth * 14}px">
      <span class="hier-kind k-${o.kind}"></span>${escAttr(o.name ?? o.kind)}</div>`).join('');
  el.querySelectorAll('.hier-row').forEach(r => r.onclick = () => app.objects.select([r.dataset.id]));
}

// ================= cameras (pills + footer) =================
function refreshCameras(app) {
  const pills = document.getElementById('camPills');
  const cams = Object.entries(app.objects.all()).filter(([, o]) => o.kind === 'camera');
  pills.innerHTML = cams.map(([id, o]) =>
    `<button class="pill ${app.objects.selectedId === id ? 'on' : ''}" data-id="${id}">${escAttr(o.name ?? 'Camera')}</button>`).join('');
  pills.querySelectorAll('.pill').forEach(p => p.onclick = () => app.objects.select([p.dataset.id]));

  const footer = document.getElementById('camFooter');
  const single = app.objects.selectedId && app.objects.get(app.objects.selectedId)?.kind === 'camera';
  footer.style.display = single ? 'flex' : 'none';
  if (single) {
    const obj = app.objects.get(app.objects.selectedId);
    const h = document.getElementById('heightSlider');
    const tallest = Math.max(0, ...Object.values(app.objects.all())
      .filter(o => o.kind !== 'camera').map(o => (o.position?.[1] ?? 0)));
    h.max = Math.min(C.HEIGHT_HARD_MAX, Math.max(C.HEIGHT_MAX, Math.ceil(tallest + 4)));
    h.value = obj.position?.[1] ?? C.HEIGHT_DEFAULT;
    document.getElementById('heightVal').textContent = `${(+h.value).toFixed(1)} m`;
    const lens = document.getElementById('lensSlider');
    const f = obj.focalLengthMm ?? 50;
    lens.value = Math.round(1000 * Math.log(f / 14) / Math.log(200 / 14));
    document.getElementById('lensVal').textContent = `${Math.round(f)} mm`;
    h.oninput = () => {
      const id = app.objects.selectedId;
      const o = app.objects.get(id);
      app.objects.update(id, { position: [o.position[0], +h.value, o.position[2]] });
      document.getElementById('heightVal').textContent = `${(+h.value).toFixed(1)} m`;
    };
    lens.oninput = () => {
      const mm = Math.round(Math.exp(Math.log(14) + Math.log(200 / 14) * (+lens.value) / 1000));
      app.objects.update(app.objects.selectedId, { focalLengthMm: mm });
      document.getElementById('lensVal').textContent = `${mm} mm`;
      app.page.focalLengthMm = mm;
      updateFrameGuide(app);
    };
  }
}

// ================= timeline =================
function buildTimeline(app) {
  const lanes = document.getElementById('tlLanes');
  const ruler = document.getElementById('tlRuler');
  let pps = 60;   // px per second (min 60)
  app._tl = { pps };

  // seek by ruler click/drag
  let seeking = false;
  const seekAt = e => {
    const r = ruler.getBoundingClientRect();
    const t = Math.max(0, (e.clientX - r.left + lanes.parentElement.scrollLeft) / pps);
    const layout = showLayout(app.show.show);
    app.page.seek(Math.min(t, layout.durationS + 5));
    app.evaluateAt?.(app.page.playheadS, 1 / 60, true);
  };
  ruler.addEventListener('pointerdown', e => { seeking = true; ruler.setPointerCapture(e.pointerId); seekAt(e); });
  ruler.addEventListener('pointermove', e => seeking && seekAt(e));
  ruler.addEventListener('pointerup', () => seeking = false);

  // ctrl+wheel zoom anchored at cursor
  document.getElementById('tlBody').addEventListener('wheel', e => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const f = Math.exp(-e.deltaY * (Math.abs(e.deltaY) < 10 ? 0.02 : 0.005));
    pps = Math.max(60, pps * f);
    app._tl.pps = pps;
    refreshTimeline(app);
  }, { passive: false });

  $('btnAddTrack').onclick = () => {
    const objs = Object.entries(app.objects.all()).filter(([id, o]) =>
      !app.show.trackOf(id) && (isPersonKindO(o.kind) || o.kind === 'camera'));
    if (!objs.length) { app.toast('No animatable objects (add a Human or Camera first)'); return; }
    const [id] = objs[0];
    app.show.ensureTrack(id);
    refreshTimeline(app);
  };
  app.onTimeline = () => refreshTimeline(app);
}

const isPersonKindO = k => k === 'humanoid' || k === 'simple_figure';

export function refreshTimeline(app) {
  const lanes = document.getElementById('tlLanes');
  const ruler = document.getElementById('tlRuler');
  if (!lanes || !app.show) return;
  const pps = app._tl?.pps ?? 60;
  const layout = showLayout(app.show.show);
  const span = Math.max(10, layout.durationS + 5);
  const W = span * pps;

  // ruler ticks
  const steps = [.5, 1, 2, 5, 10, 15, 30, 60];
  const step = steps.find(s => s * pps >= 80) ?? 60;
  let ticks = '';
  for (let t = 0; t <= span; t += step) {
    const x = t * pps;
    ticks += `<div class="tick" style="left:${x}px"><span>${fmtTime(t)}</span></div>`;
  }
  ruler.style.width = `${W}px`;
  ruler.innerHTML = ticks + `<div class="tl-playhead" id="playheadLine" style="left:0px"></div>`;

  // lanes
  const kinds = Object.entries(app.objects.all()).filter(([, o]) => isPersonKindO(o.kind) || o.kind === 'camera');
  lanes.style.width = `${W}px`;
  lanes.innerHTML = layout.tracks.map(tr => {
    const obj = app.objects.get(tr.characterId);
    const name = obj ? (obj.name ?? obj.kind) : '?';
    const blocks = tr.items.map(u => {
      const it = u.item;
      const dur = u.endS - u.startS;
      const label = it.kind === 'cam-move' ? (it.move ?? 'move')
        : it.kind === 'clip' ? it.clip
          : it.kind === 'path' ? 'Walk'
            : ITEM_LABELS[it.kind] ?? it.kind;
      const selCls = app.page.selectedSegment?.itemId === it.id ? ' sel' : '';
      return `<div class="blk kind-${it.kind}${selCls}" data-track="${tr.trackId}" data-item="${it.id}"
        style="left:${u.startS * pps}px;width:${Math.max(3, dur * pps)}px">${escAttr(label)}</div>`;
    }).join('');
    return `<div class="lane ${obj?.kind === 'camera' ? 'cam' : ''}" data-track="${tr.trackId}">
      <div class="lane-head">${escAttr(name)}<button class="lane-del" data-track="${tr.trackId}">✕</button></div>
      <div class="lane-body">${blocks}
        <button class="lane-add" data-track="${tr.trackId}" data-char="${tr.characterId}">＋</button>
      </div></div>`;
  }).join('') || '<div class="hint">No tracks — select a Human/Camera and add actions from Properties</div>';

  // interactions
  lanes.querySelectorAll('.lane-del').forEach(b => b.onclick = e => {
    e.stopPropagation();
    app.show.removeTrack(b.dataset.track);
    refreshTimeline(app);
  });
  lanes.querySelectorAll('.lane-add').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const char = b.dataset.char;
    const obj = app.objects.get(char);
    const menu = document.createElement('div');
    menu.className = 'ctx-menu';
    const items = obj?.kind === 'camera'
      ? [['cam-still', 'Camera still'], ['cam-move', 'Camera move'], ['cam-path', 'Camera path'], ['cam-follow', 'Follow'], ['cam-transform', 'Camera transform']]
      : [['path', 'Walk path'], ['clip', 'Clip'], ['transform', 'Transform'], ['rotate', 'Rotate'], ['revolve', 'Revolve'], ['scale', 'Scale']];
    menu.innerHTML = items.map(([k, l]) => `<button data-kind="${k}">${l}</button>`).join('');
    document.body.appendChild(menu);
    const r = b.getBoundingClientRect();
    menu.style.left = `${r.left}px`; menu.style.top = `${r.bottom + 4}px`;
    menu.onclick = ev => {
      const btn = ev.target.closest('button'); if (!btn) return;
      const kind = btn.dataset.kind;
      menu.remove();
      addItemKind(app, char, kind, app.page.playheadS);
      refreshTimeline(app);
    };
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
  });
  lanes.querySelectorAll('.blk').forEach(b => {
    b.onclick = e => {
      e.stopPropagation();
      app.page.selectedSegment = { trackId: b.dataset.track, itemId: b.dataset.item };
      refreshTimeline(app);
      refreshSegInspector(app);
    };
    b.onpointerdown = e => { // drag to move
      if (e.target !== b) return;
      const startX = e.clientX;
      const trackId = b.dataset.track, itemId = b.dataset.item;
      const it = app.show.show.tracks.find(t => t.id === trackId)?.items.find(i => i.id === itemId);
      if (!it) return;
      const startS = it.startS;
      let moved = false;
      const mv = ev => {
        if (Math.abs(ev.clientX - startX) < 4 && !moved) return;
        moved = true;
        const d = (ev.clientX - startX) / pps;
        app.show.moveItem(trackId, itemId, Math.max(0, startS + d));
        refreshTimeline(app);
      };
      const up = () => {
        window.removeEventListener('pointermove', mv);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', mv);
      window.addEventListener('pointerup', up);
    };
  });
  updatePlayhead(app, app.page.playheadS);
  refreshHierarchy(app);
  refreshCameras(app);
}

function addItemKind(app, charId, kind, startS) {
  const obj = app.objects.get(charId);
  const add = item => {
    const it = app.show.addItem(charId, item);
    if (kind === 'path' || kind === 'cam-path') {
      app.pathEditor.enterPaint(app.show.trackOf(charId).id, it.id);
      app.pathEditor.seedFirstAnchor();
    }
    return it;
  };
  switch (kind) {
    case 'path': return add({ kind: 'path', anchors: [], speedUnitsPerS: C.SPEED_DEFAULT, gait: 'walk' });
    case 'cam-path': return add({ kind: 'cam-path', anchors: [], speedUnitsPerS: 2, aim: 'travel' });
    case 'clip': return add({ kind: 'clip', clip: 'idle', durationS: C.ITEM_DEFAULT_DUR });
    case 'transform': return add({ kind: 'transform', durationS: 4, keys: [] });
    case 'rotate': return add({ kind: 'rotate', axis: 'y', degPerS: 90, durationS: 5 });
    case 'revolve': return add({ kind: 'revolve', centerObjectId: null, degPerS: 60, durationS: 5 });
    case 'scale': return add({ kind: 'scale', factor: 2, durationS: 5 });
    case 'cam-still': return add({ kind: 'cam-still', durationS: 5 });
    case 'cam-move': return add({ kind: 'cam-move', move: 'orbit', direction: 'ccw', angleDeg: 360, heightDeltaUnits: 0, distanceScale: 1, durationS: CAM_MOVE_PRESETS.orbit.durationS });
    case 'cam-follow': return add({ kind: 'cam-follow', durationS: 5, objectId: null });
    case 'cam-transform': return add({ kind: 'cam-transform', durationS: 4, keys: [] });
  }
}

function refreshSegInspector(app) {
  const el = document.getElementById('segInspector');
  const seg = app.page.selectedSegment;
  if (!seg) { el.style.display = 'none'; return; }
  const tr = app.show.show.tracks.find(t => t.id === seg.trackId);
  const it = tr?.items.find(i => i.id === seg.itemId);
  if (!it) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  const patch = p => { app.show.patchItem(seg.trackId, seg.itemId, p); refreshTimeline(app); refreshSegInspector(app); };
  const objOpts = sel => Object.entries(app.objects.all())
    .map(([id, o]) => `<option value="${id}" ${sel === id ? 'selected' : ''}>${escAttr(o.name ?? o.kind)}</option>`).join('');
  let html = `<div class="seg-title">${ITEM_LABELS[it.kind] ?? it.kind}
    <button class="ghost small" id="segDel">Delete</button></div>`;
  if (it.kind === 'path') {
    html += `<label>Gait<select id="segGait">${C.GAITS.map(g => `<option ${it.gait === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
      <label>Aim<select id="segAim">${['travel', 'subject', 'locked'].map(a => `<option ${it.aim === a ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
      <label>Subject<select id="segSubject"><option value="">—</option>${objOpts(it.subjectId)}</select></label>
      <label>Speed<input type="number" id="segSpeed" min="0.2" step="0.1" value="${it.speedUnitsPerS ?? 1.4}"></label>
      <button class="primary small" id="segEdit">Edit path</button>`;
  }
  if (it.kind === 'cam-path') {
    html += `<label>Aim<select id="segAim">${['travel', 'subject', 'locked'].map(a => `<option ${it.aim === a ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
      <label>Subject<select id="segSubject"><option value="">—</option>${objOpts(it.subjectId)}</select></label>
      <label>Speed<input type="number" id="segSpeed" min="0.2" step="0.1" value="${it.speedUnitsPerS ?? 2}"></label>
      <button class="primary small" id="segEdit">Edit path</button>`;
  }
  if (it.kind === 'clip') {
    html += `<label>Clip<select id="segClip">${Object.keys(CLIPS).filter(c => c !== 'a_tpose').map(c => `<option ${it.clip === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label>Duration<input type="number" id="segDur" min="0.1" step="0.1" value="${it.durationS ?? 5}"></label>`;
  }
  if (it.kind === 'cam-move') {
    html += `<label>Move<select id="segMove">${CAM_MOVES.map(m => `<option ${it.move === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
      <label>Direction<select id="segDir"><option ${it.direction === 'ccw' ? 'selected' : ''}>ccw</option><option ${it.direction === 'cw' ? 'selected' : ''}>cw</option></select></label>
      <label>Angle°<input type="number" id="segAngle" min="15" max="360" value="${it.angleDeg ?? CAM_MOVE_PRESETS[it.move ?? 'orbit'].angleDeg}"></label>
      <label>HeightΔ<input type="number" id="segHeight" min="0.5" max="20" step="0.5" value="${it.heightDeltaUnits ?? 0}"></label>
      <label>Dist×<input type="number" id="segDist" min="0.1" max="4" step="0.1" value="${it.distanceScale ?? 1}"></label>
      <label>Duration<input type="number" id="segDur" min="0.1" step="0.5" value="${it.durationS ?? 8}"></label>`;
  }
  if (it.kind === 'cam-still') {
    html += `<label>Subject<select id="segSubject"><option value="">—</option>${objOpts(it.subjectId)}</select></label>
      <label>Duration<input type="number" id="segDur" min="0.1" step="0.5" value="${it.durationS ?? 5}"></label>`;
  }
  if (it.kind === 'cam-follow') {
    html += `<label>Object<select id="segFollow"><option value="">—</option>${objOpts(it.objectId)}</select></label>`;
  }
  if (it.kind === 'transform' || it.kind === 'cam-transform' || it.kind === 'rig-transform') {
    html += `<div class="hint">${it.keys?.length ?? 0} keys · drag the object while this segment is selected to capture a key at the playhead</div>
      <button class="primary small" id="segKey">⦿ Key at playhead</button>`;
  }
  el.innerHTML = html;
  el.querySelector('#segDel').onclick = () => { app.show.removeItem(seg.trackId, seg.itemId); app.page.selectedSegment = null; refreshTimeline(app); el.style.display = 'none'; };
  const bind = (id, ev, cb) => { const n = el.querySelector(id); if (n) n[ev] = cb; };
  bind('#segGait', 'onchange', e => patch({ gait: e.target.value }));
  bind('#segAim', 'onchange', e => patch({ aim: e.target.value }));
  bind('#segSubject', 'onchange', e => patch({ subjectId: e.target.value || null }));
  bind('#segFollow', 'onchange', e => patch({ objectId: e.target.value || null }));
  bind('#segSpeed', 'onchange', e => patch({ speedUnitsPerS: Math.max(0.2, +e.target.value || 0.2) }));
  bind('#segClip', 'onchange', e => patch({ clip: e.target.value, durationS: CLIPS[e.target.value] ?? 5 }));
  bind('#segMove', 'onchange', e => {
    const p = CAM_MOVE_PRESETS[e.target.value];
    patch({ move: e.target.value, durationS: p.durationS, angleDeg: p.angleDeg, heightDeltaUnits: p.heightDeltaUnits, distanceScale: p.distanceScale });
  });
  bind('#segDir', 'onchange', e => patch({ direction: e.target.value }));
  bind('#segAngle', 'onchange', e => patch({ angleDeg: clampNum(+e.target.value, 15, 360) }));
  bind('#segHeight', 'onchange', e => patch({ heightDeltaUnits: clampNum(+e.target.value, 0.5, 20) }));
  bind('#segDist', 'onchange', e => patch({ distanceScale: clampNum(+e.target.value, 0.1, 4) }));
  bind('#segDur', 'onchange', e => app.show.trimItem(seg.trackId, seg.itemId, +e.target.value));
  bind('#segEdit', 'onclick', () => app.pathEditor.enterPaint(seg.trackId, seg.itemId));
  bind('#segKey', 'onclick', () => {
    // capture key at playhead (captureFocused*Pose minimal port)
    const t = app.page.playheadS - it.startS;
    const char = tr.characterId;
    const obj = app.objects.get(char);
    const mesh = app.meshById.get(char);
    if (!obj || !mesh) return;
    const key = {
      tS: Math.max(0, t),
      position: [mesh.position.x, mesh.position.y, mesh.position.z],
      rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
      scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
    };
    if (it.kind === 'cam-transform') key.focalLengthMm = obj.focalLengthMm ?? 50;
    if (it.kind === 'rig-transform') key.joints = {};
    const keys = [...(it.keys ?? []).filter(k => Math.abs(k.tS - key.tS) > 0.001), key].sort((a, b) => a.tS - b.tS);
    patch({ keys, durationS: Math.max(it.durationS ?? 0, key.tS) });
  });
}

function updatePlayhead(app, t) {
  const line = document.getElementById('playheadLine');
  const pps = app._tl?.pps ?? 60;
  if (line) line.style.left = `${t * pps}px`;
}

const fmtTime = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

// ================= prop picker =================
let propCat = null;
function openPropPicker(app) {
  const modal = document.getElementById('propPicker');
  modal.style.display = 'flex';
  if (!propCat) {
    propCat = app.propCatalog;
    const cats = document.getElementById('propCats');
    const catsSet = ['all', ...new Set(Object.values(propCat).map(e => e.category))];
    cats.innerHTML = catsSet.map(c => `<button data-c="${c}" class="${c === 'all' ? 'on' : ''}">${c}</button>`).join('');
    cats.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      [...cats.children].forEach(x => x.classList.toggle('on', x === b));
      renderPropList(app, b.dataset.c, document.getElementById('propSearch').value);
    };
    document.getElementById('propSearch').oninput = e => {
      const active = cats.querySelector('.on')?.dataset.c ?? 'all';
      renderPropList(app, active, e.target.value);
    };
    renderPropList(app, 'all', '');
  }
  document.getElementById('propClose').onclick = () => modal.style.display = 'none';
  modal.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
}
function renderPropList(app, cat, search) {
  const list = document.getElementById('propList');
  const entries = Object.values(app.propCatalog).filter(e =>
    (cat === 'all' || e.category === cat) &&
    (!search || e.label.toLowerCase().includes(search.toLowerCase()) || e.key.includes(search)));
  list.innerHTML = entries.slice(0, 300).map(e =>
    `<button class="prop-item" data-key="${e.key}">${escAttr(e.label)}<span class="prop-cat">${e.category}</span></button>`).join('')
    + (entries.length > 300 ? `<div class="hint">${entries.length - 300} more — refine search</div>` : '');
  list.querySelectorAll('.prop-item').forEach(b => b.onclick = () => {
    const key = b.dataset.key;
    const cat = app.propCatalog[key].category;
    const id = app.objects.add({
      kind: 'prop', propKey: key, name: app.propCatalog[key].label,
      position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
    });
    app.objects.select([id]);
    app.focusObject(id);
    document.getElementById('propPicker').style.display = 'none';
  });
}
