// ui.js — DOM UI: header (scene name, Light popover, Rehearse, view switches), workspace,
// right dock (inspector + add palette + hierarchy), timeline footer, camera pills, toasts.
// Layout per analysis/DOM_REFERENCE.md; vanilla DOM per DESIGN D1.
// Called AFTER boot with the live app instance.
import { C, CLIPS, CAM_MOVES, CAM_MOVE_PRESETS } from './const.js';
import { normalizeLight } from './env.js';
import { itemDuration } from './schema.js';
import { showLayout, ITEM_LABELS, fovFromFocal } from './tracks.js';
import { MAGNET_PX, maxEnd, placeAvoiding, repackSequential, planMove, moveItemToIndex, clampKeyTime, canDuplicateOnto } from './place.js';
import { createRangeTool, renderTakeRange, wireRangeToolGlobal } from './takerange.js';
import { stickFromDelta } from './navball.js';

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
  $('btnPlay').onclick = () => {
    if (app.page.playing) { app.page.stop(); app.resetToBase?.(); }
    else { app.page.play(); }
  };

  // view + mode switches
  $('viewSwitch').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    [...$('viewSwitch').children].forEach(x => x.classList.toggle('on', x === b));
    app.page.stageView = b.dataset.v;
    app.page.changed();          // nav ball pad / lasso button visibility ride this
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

  // timeline (build first — initializes app._tl used by refreshTimeline)
  buildTimeline(app);
  refreshTimeline(app);

  buildViewportOverlays(app);

  // per-frame UI updates
  let lastPlayhead = -1;
  setInterval(() => {
    const t = app.page?.playheadS ?? 0;
    if (Math.abs(t - lastPlayhead) > 0.005) {
      lastPlayhead = t;
      $('timeBadge').textContent = fmtClock(t);
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
    app.markAutosave?.();
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

// ================= timeline (exact port of the live drag/trim/keyframe system) =================
// Placement solver: place.js (q5r/_ie/kGt/lje). Drag machine: nCr pointer flow.
// Trim: right-edge handle → store trimItem (path/cam-path keeps speed=arc/dur).
// Keyframe diamonds: SCr flow (drag=B2r clamp + xbe move, click=select+seek).
const MIN_DUR = 0.05;          // WAr
const DRAG_THRESH_PX = 4;      // zAr
const KF_DRAG_THRESH_PX = 3;   // kCr
const KF_MARGIN_PX = 7;        // f2e
const KEY_EPS = 0.001;         // ym

const OBJECT_ITEM_KINDS = new Set(['rotate', 'revolve', 'scale', 'transform', 'rig-transform']); // $2r (aN)
const CAMERA_ITEM_KINDS = new Set(['cam-still', 'cam-move', 'cam-path', 'cam-follow', 'cam-transform', 'cam-manual']); // V2r (Fp)
const KF_KINDS = new Set(['transform', 'rig-transform', 'cam-transform']); // Zzt

function buildTimeline(app) {
  app._tl = { pps: 60, magnet: true, interaction: null, rangeTool: createRangeTool() };
  wireRangeToolGlobal(app);
  const ruler = document.getElementById('tlRuler');

  // seek by ruler click/drag (clamped to span)
  let seeking = false;
  const seekAt = e => {
    const r = ruler.getBoundingClientRect();
    const gutter = LANE_GUTTER();
    const t = Math.max(0, (e.clientX - r.left - gutter) / app._tl.pps);
    const layout = showLayout(app.show.show);
    app.page.seek(Math.min(t, Math.max(10, layout.durationS + 5)));
    app.evaluateAt?.(app.page.playheadS, 1 / 60, true);
  };
  ruler.addEventListener('pointerdown', e => {
    if (app._tl.rangeTool?.on) return;   // range tool owns the ruler (live PGt covers it)
    seeking = true;
    try { ruler.setPointerCapture(e.pointerId); } catch (_) {}   // synthetic-event safe
    seekAt(e);
  });
  ruler.addEventListener('pointermove', e => seeking && seekAt(e));
  ruler.addEventListener('pointerup', () => seeking = false);

  // ctrl+wheel zoom anchored at cursor
  document.getElementById('tlBody').addEventListener('wheel', e => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const f = Math.exp(-e.deltaY * (Math.abs(e.deltaY) < 10 ? 0.02 : 0.005));
    app._tl.pps = Math.max(60, app._tl.pps * f);
    refreshTimeline(app);
  }, { passive: false });

  // magnet toggle (live header iconBtn)
  const magBtn = document.createElement('button');
  magBtn.id = 'btnMagnet';
  magBtn.className = 'ghost small magnet-btn on';
  magBtn.textContent = '🧲';
  magBtn.title = 'Snap to nearby blocks (hold Ctrl/Cmd to bypass while dragging)';
  magBtn.setAttribute('aria-pressed', 'true');
  magBtn.onclick = () => {
    app._tl.magnet = !app._tl.magnet;
    magBtn.classList.toggle('on', app._tl.magnet);
    magBtn.setAttribute('aria-pressed', String(app._tl.magnet));
  };
  const tlTitle = document.querySelector('.tl-title');
  if (tlTitle) tlTitle.after(magBtn);

  // take-range toggle (live header: iconBtn "range", disabled while a take films — never offline)
  const rangeBtn = document.createElement('button');
  rangeBtn.id = 'btnRange';
  rangeBtn.className = 'ghost small range-btn';
  rangeBtn.textContent = '⇥';
  rangeBtn.title = 'Take range — drag on the timeline to set what gets filmed';
  rangeBtn.setAttribute('aria-pressed', 'false');
  rangeBtn.onclick = () => {
    app._tl.rangeTool.on = !app._tl.rangeTool.on;
    refreshTimeline(app);
  };
  magBtn.after(rangeBtn);

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

// block color category (live blockHuman/blockObject/blockCamera)
function blockCategory(it, isWalker) {
  if (CAMERA_ITEM_KINDS.has(it.kind)) return 'cat-cam';
  if (OBJECT_ITEM_KINDS.has(it.kind) || (it.kind === 'path' && !isWalker)) return 'cat-obj';
  return 'cat-human';
}

function blockLabel(it, isWalker) {
  switch (it.kind) {
    case 'path': return isWalker ? 'Walk' : 'Move';
    case 'play': return 'Play';
    case 'clip': return it.clip ?? 'Clip';
    case 'rotate': return 'Rotate';
    case 'revolve': return 'Revolve';
    case 'scale': return (it.factor ?? 1) >= 1 ? 'Scale up' : 'Scale down';
    case 'transform': return 'Transform';
    case 'rig-transform': return 'Pose';
    case 'cam-still': return 'Camera still';
    case 'cam-move': return it.move ?? 'move';
    case 'cam-path': return 'Camera path';
    case 'cam-follow': return 'Follow';
    case 'cam-transform': return 'Camera transform';
    case 'cam-manual': return 'Manual';
    default: return ITEM_LABELS[it.kind] ?? it.kind;
  }
}

// trim eligibility (live `be` gate): clip, path, object items, camera except cam-manual, dur>0
const trimmable = it => (it.kind === 'clip' || it.kind === 'path' ||
  OBJECT_ITEM_KINDS.has(it.kind) || (CAMERA_ITEM_KINDS.has(it.kind) && it.kind !== 'cam-manual'))
  && itemDuration(it) > 0;

// markers = start/end of every OTHER block across ALL tracks (live U())
function allMarkers(layout, excludeId) {
  const s = new Set();
  for (const tr of layout.tracks) for (const u of tr.items) {
    if (u.item.id !== excludeId) { s.add(u.startS); s.add(u.endS); }
  }
  return [...s];
}

export function refreshTimeline(app) {
  const lanes = document.getElementById('tlLanes');
  const ruler = document.getElementById('tlRuler');
  if (!lanes || !app.show) return;
  if (!app._tl) app._tl = { pps: 60, magnet: true, interaction: null };
  if (app._tl?.interaction) { updatePlayhead(app, app.page.playheadS); return; }   // live drag: no re-render
  const pps = app._tl?.pps ?? 60;
  const magnet = app._tl?.magnet ?? true;
  const layout = showLayout(app.show.show);
  const span = Math.max(10, layout.durationS + 5);
  const W = span * pps;
  app._tl.span = span;

  // ruler ticks (steps GAr, min label width 80px qAr)
  const steps = [.5, 1, 2, 5, 10, 15, 30, 60];
  const step = steps.find(s => s * pps >= 80) ?? 60;
  const gutter = LANE_GUTTER();
  let ticks = '';
  for (let t = 0; t <= span; t += step) {
    ticks += `<div class="tick" style="left:${gutter + t * pps}px"><span>${fmtTime(t)}</span></div>`;
  }
  // +gutter so the last tick (at gutter + span*pps) and its label fit the scroll area
  // (P3: last-label clip at the scroll edge)
  ruler.style.width = `${W + gutter}px`;
  ruler.innerHTML = ticks + `<div class="tl-playhead" id="playheadLine" style="left:${gutter}px"></div>`;

  // take-range button state (live iconBtnActive on toolOn)
  const rangeBtn = document.getElementById('btnRange');
  if (rangeBtn) {
    rangeBtn.classList.toggle('on', !!app._tl.rangeTool?.on);
    rangeBtn.setAttribute('aria-pressed', String(!!app._tl.rangeTool?.on));
  }

  // lanes
  lanes.style.width = `${W + gutter}px`;   // match the ruler (last-tick room)
  lanes.innerHTML = layout.tracks.map(tr => {
    const obj = app.objects.get(tr.characterId);
    const name = obj ? (obj.name ?? obj.kind) : '?';
    const isWalker = isPersonKindO(obj?.kind);
    const blocks = tr.items.map(u => blockHTML(app, u, tr, pps, isWalker)).join('');
    const addLeft = maxEnd(tr.items.map(u => u.item)) * pps;
    return `<div class="lane ${obj?.kind === 'camera' ? 'cam' : ''}" data-track="${tr.trackId}">
      <div class="lane-head">${escAttr(name)}<button class="lane-del" data-track="${tr.trackId}">✕</button></div>
      <div class="lane-body" data-track-id="${tr.trackId}" data-char="${tr.characterId}">${blocks}
        <button class="lane-add" data-track="${tr.trackId}" data-char="${tr.characterId}" style="left:${addLeft}px">＋</button>
      </div></div>`;
  }).join('') || '<div class="hint">No tracks — select a Human/Camera and add actions from Properties</div>';

  wireTimelineInteractions(app, lanes, pps, magnet, layout);
  updatePlayhead(app, app.page.playheadS);
  renderTakeRange(app);   // _Tr ruler label + wTr lane overlay (box/grips/ghost/guides/draw)
  refreshHierarchy(app);
  refreshCameras(app);
}

function blockHTML(app, u, tr, pps, isWalker) {
  const it = u.item;
  const dur = u.endS - u.startS;
  const w = Math.max(3, dur * pps);   // p2e min width
  const sel = app.page.selectedSegment?.itemId === it.id;
  const painting = app.page.paint?.itemId === it.id;
  const kf = KF_KINDS.has(it.kind) && (it.keys?.length ?? 0) > 0;
  const seg = app.page.selectedSegment;
  const diamonds = kf ? `<span class="kf-layer">${it.keys.map(k =>
    `<span class="kf-diamond${seg?.itemId === it.id && seg?.tS !== undefined && Math.abs(seg.tS - k.tS) <= KEY_EPS ? ' selected' : ''}" data-ts="${k.tS}" title="Keyframe — click to select, drag to move" style="left:${clampPx(k.tS * pps, w)}px"></span>`).join('')}</span>` : '';
  const handle = trimmable(it) && !painting ? '<span class="trim-handle" title="Drag to change duration"></span>' : '';
  return `<div class="blk ${blockCategory(it, isWalker)}${sel ? ' sel' : ''}${painting ? ' painting' : ''}"
    data-track="${tr.trackId}" data-item="${it.id}" data-start="${u.startS}" data-end="${u.endS}"
    style="left:${u.startS * pps}px;width:${w}px">
    <span class="blk-label">${escAttr(blockLabel(it, isWalker))}</span>${diamonds}${handle}</div>`;
}

const clampPx = (x, w) => Math.min(Math.max(x, KF_MARGIN_PX), Math.max(w - KF_MARGIN_PX, KF_MARGIN_PX));

function wireTimelineInteractions(app, lanes, pps, magnet, layout) {
  lanes.querySelectorAll('.lane-del').forEach(b => b.onclick = e => {
    e.stopPropagation();
    app.show.removeTrack(b.dataset.track);
    refreshTimeline(app);
  });
  lanes.querySelectorAll('.lane-add').forEach(b => b.onclick = e => {
    e.stopPropagation();
    openAddMenu(app, b);
  });
  lanes.querySelectorAll('.blk').forEach(b => wireBlock(app, b, pps, magnet, layout, lanes));
}

function openAddMenu(app, btn) {
  const char = btn.dataset.char;
  const obj = app.objects.get(char);
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  const items = obj?.kind === 'camera'
    ? [['cam-still', 'Camera still'], ['cam-move', 'Camera move'], ['cam-path', 'Camera path'], ['cam-follow', 'Follow'], ['cam-transform', 'Camera transform']]
    : [['path', 'Walk path'], ['clip', 'Clip'], ['transform', 'Transform'], ['rotate', 'Rotate'], ['revolve', 'Revolve'], ['scale', 'Scale']];
  menu.innerHTML = items.map(([k, l]) => `<button data-kind="${k}">${l}</button>`).join('');
  document.body.appendChild(menu);
  const r = btn.getBoundingClientRect();
  menu.style.left = `${r.left}px`; menu.style.top = `${r.bottom + 4}px`;
  menu.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    menu.remove();
    addItemKind(app, char, b.dataset.kind, app.page.playheadS);
    refreshTimeline(app);
  };
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
}

// ---- block drag: move / reorder / alt-duplicate (nCr pointer flow, q5r/_ie solvers) ----
function wireBlock(app, blockEl, pps, magnet, layout, lanes) {
  const trackId = blockEl.dataset.track, itemId = blockEl.dataset.item;

  blockEl.onclick = e => {
    e.stopPropagation();
    if (app._tl.justDragged) { app._tl.justDragged = false; return; }  // live L.current suppress
    app.page.selectedSegment = { trackId, itemId };
    refreshTimeline(app);
    refreshSegInspector(app);
  };

  blockEl.onpointerdown = e => {
    if (e.target.closest('.trim-handle')) return;                  // trim handle owns the gesture
    if (e.target.closest('.kf-diamond')) return;                   // diamonds own the gesture
    if (e.button !== 0) return;
    if (app.page.paint?.itemId === itemId) return;                  // live: painting blocks are not draggable (se gates on paintingItemId)
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}   // synthetic-event safe
    const it = app.show.show.tracks.find(t => t.id === trackId)?.items.find(i => i.id === itemId);
    if (!it) return;
    const startXPx = e.clientX, startYPx = e.clientY;
    const startS0 = +blockEl.dataset.start, endS0 = +blockEl.dataset.end;
    const durationS = endS0 - startS0;
    const duplicating = e.altKey;
    let dragging = false;
    let plan = { kind: 'idle' };
    let curStart = startS0, guidesS = [], previewStarts = new Map(), toTrackId = trackId;

    const laneBodyOf = id => lanes.querySelector(`.lane-body[data-track-id="${id}"]`);
    const renderGuides = (laneBody, gs) => {
      laneBody.querySelectorAll('.snap-guide').forEach(g => g.remove());
      for (const g of gs) {
        const el = document.createElement('span');
        el.className = 'snap-guide';
        el.style.left = `${g * pps}px`;
        laneBody.appendChild(el);
      }
    };
    const setGhost = (laneBody, startS, dur) => {
      // live duplicate ghost: ghost renders in the TARGET lane (V?.toTrackId === ae.id);
      // lane gets `laneDuplicateTarget` only when a DIFFERENT lane passes the domain gate
      lanes.querySelectorAll('.ghost-blk,.ghost-caret').forEach(g => g.remove());
      lanes.querySelectorAll('.lane-body.dup-target').forEach(l => l.classList.remove('dup-target'));
      if (!laneBody) return;
      if (laneBody.dataset.trackId !== trackId && compatibleFor(laneBody.dataset.trackId)) {
        laneBody.classList.add('dup-target');
      }
      const el = document.createElement('span');
      el.className = dur > 0 ? 'ghost-blk' : 'ghost-caret';
      el.style.left = `${startS * pps}px`;
      if (dur > 0) el.style.width = `${Math.max(3, dur * pps)}px`;
      laneBody.appendChild(el);
    };
    // domain gate (live `se`: resolve + yGt) for a candidate target lane id
    const compatibleFor = tid => {
      const tt = app.show.show.tracks.find(t => t.id === tid);
      const obj = tt ? app.objects.get(tt.characterId) : null;
      return !!(tt && obj && canDuplicateOnto(it, obj.kind));
    };
    // live nCr `se`: alt-pointerdown opens the duplicate ghost IMMEDIATELY (before any
    // threshold), in the SOURCE lane at the block's own position (E called with toTrackId=t.id)
    if (duplicating) setGhost(laneBodyOf(trackId), startS0, durationS);

    const mv = ev => {
      const dx = ev.clientX - startXPx, dy = ev.clientY - startYPx;
      const dist = duplicating ? Math.hypot(dx, dy) : Math.abs(dx);
      if (!dragging && dist < DRAG_THRESH_PX) return;
      if (!dragging) {
        dragging = true;
        app._tl.interaction = 'drag';
        blockEl.classList.add('dragging');
      }
      const desiredStart = startS0 + dx / pps;
      const useMagnet = magnet && !(ev.metaKey || ev.ctrlKey);   // live: meta/ctrl bypasses
      const radiusS = useMagnet ? MAGNET_PX / pps : 0;

      if (duplicating) {
        // target lane from pointer position (live elementFromPoint on [data-track-id]); keep the LAST hit on a miss
        const hit = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-track-id]');
        if (hit instanceof HTMLElement && hit.dataset.trackId) toTrackId = hit.dataset.trackId;
        const targetTrack = app.show.show.tracks.find(t => t.id === toTrackId);
        const targetObj = targetTrack ? app.objects.get(targetTrack.characterId) : null;
        const compatible = !!(targetTrack && targetObj && canDuplicateOnto(it, targetObj.kind));   // missing owner refuses (Art with undefined kind)
        const tItems = targetTrack?.items ?? [];
        const placed = compatible ? placeAvoiding({
          desiredStartS: desiredStart, durationS,
          obstacles: tItems.map(x => ({ startS: x.startS, endS: x.startS + itemDuration(x) })),
          markersS: allMarkers(layout, null),
          radiusS, fallbackStartS: maxEnd(tItems),
        }) : null;
        if (placed) {
          curStart = placed.startS; guidesS = placed.guidesS;
          setGhost(laneBodyOf(toTrackId), curStart, durationS);
          // live: guides render in the lane that OWNS the drag (F belongs to the source
          // lane's component); the ghost follows the pointer into the target lane
          renderGuides(laneBodyOf(trackId), guidesS);
        } else {
          setGhost(null);
          renderGuides(laneBodyOf(trackId), []);
        }
        return;
      }

      // plain drag: q5r move-or-reorder plan against own track
      const tr = app.show.show.tracks.find(t => t.id === trackId);
      plan = planMove({
        items: tr.items, draggedId: itemId,
        desiredStartS: desiredStart, durationS,
        markersS: allMarkers(layout, itemId),
        radiusS, fallbackStartS: startS0,
      });
      const laneBody = laneBodyOf(trackId);
      if (plan.kind === 'move') {
        curStart = plan.startS; guidesS = plan.guidesS;
        previewStarts = new Map();
        blockEl.style.transform = `translateX(${(curStart - startS0) * pps}px)`;
        laneBody.querySelectorAll('.blk').forEach(b => { if (b !== blockEl) b.style.transform = ''; });
      } else {
        // reorder: dragged block follows the RAW desired start; siblings preview the packed layout (live lje(kGt)) 
        previewStarts = new Map(repackSequential(moveItemToIndex(tr.items, itemId, plan.toIndex))
          .map(x => [x.id, x.startS]));
        laneBody.querySelectorAll('.blk').forEach(b => {
          if (b === blockEl) return;
          const ps = previewStarts.get(b.dataset.item);
          const base = +b.dataset.start;
          b.style.transform = (ps !== undefined && ps !== base) ? `translateX(${(ps - base) * pps}px)` : '';
        });
        curStart = Math.max(0, desiredStart);   // live: F.startS = Math.max(0, pe) for reorder plans
        blockEl.style.transform = `translateX(${(curStart - startS0) * pps}px)`;
        guidesS = [];
      }
      renderGuides(laneBody, guidesS);
    };

    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      lanes.querySelectorAll('.snap-guide,.ghost-blk,.ghost-caret').forEach(g => g.remove());
      lanes.querySelectorAll('.lane-body.dup-target').forEach(l => l.classList.remove('dup-target'));
      if (!dragging) return;
      app._tl.justDragged = true;
      app._tl.interaction = null;
      if (duplicating) {
        app.show.duplicateItemTo(trackId, itemId, toTrackId, curStart);
      } else if (plan.kind === 'reorder') {
        app.show.reorderItem(trackId, itemId, plan.toIndex);
      } else if (plan.kind === 'move') {
        app.show.moveItem(trackId, itemId, plan.startS);
      }
      app.show.changed();
      refreshTimeline(app);
      refreshSegInspector(app);
    };
    const cancel = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      lanes.querySelectorAll('.snap-guide,.ghost-blk,.ghost-caret').forEach(g => g.remove());
      lanes.querySelectorAll('.lane-body.dup-target').forEach(l => l.classList.remove('dup-target'));
      if (dragging) { app._tl.interaction = null; refreshTimeline(app); }
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  };

  // ---- trim handle (live Q/q flow: right-edge drag → duration / path speed) ----
  const handle = blockEl.querySelector('.trim-handle');
  if (handle) {
    handle.onpointerdown = e => {
      e.stopPropagation();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}   // synthetic-event safe
      const startXPx = e.clientX, startS = +blockEl.dataset.start, endS0 = +blockEl.dataset.end;
      const it0 = app.show.show.tracks.find(t => t.id === trackId)?.items.find(i => i.id === itemId);
      if (!it0) return;
      app._tl.interaction = 'trim';
      app.show.beginEditGesture();
      const mv = ev => {
        const dS = (ev.clientX - startXPx) / pps;
        const newDur = Math.max(MIN_DUR, endS0 + dS - startS);
        if (Number.isNaN(newDur)) return;
        app.show.trimItem(trackId, itemId, newDur);       // live per-move commit (clip/speed/object/camera)
        blockEl.style.width = `${Math.max(3, newDur * pps)}px`;   // live width while render suppressed
      };
      const finish = () => {
        window.removeEventListener('pointermove', mv);
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', finish);
        app.show.endEditGesture();
        app._tl.interaction = null;
        refreshTimeline(app);
        refreshSegInspector(app);
      };
      window.addEventListener('pointermove', mv);
      window.addEventListener('pointerup', finish);      // was `up` (undefined) — froze the timeline
      window.addEventListener('pointercancel', finish);
    };
    handle.onclick = e => e.stopPropagation();   // no segment select after a trim (live onClick stopPropagation)
  }

  // ---- keyframe diamonds (SCr flow) ----
  blockEl.querySelectorAll('.kf-diamond').forEach(d => {
    d.onpointerdown = e => {
      e.stopPropagation();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}   // synthetic-event safe
      const fromTS = +d.dataset.ts;
      const startS = +blockEl.dataset.start;
      const w = parseFloat(blockEl.style.width);
      const it = app.show.show.tracks.find(t => t.id === trackId)?.items.find(i => i.id === itemId);
      if (!it) return;
      let moved = false, previewTS = fromTS;
      const mv = ev => {
        const dx = ev.clientX - e.clientX;
        if (!moved && Math.abs(dx) < KF_DRAG_THRESH_PX) return;
        moved = true;
        previewTS = clampKeyTime(it.keys ?? [], fromTS, fromTS + dx / pps, itemDuration(it));  // B2r
        d.style.left = `${clampPx(previewTS * pps, w)}px`;
      };
      const up = ev => {
        window.removeEventListener('pointermove', mv);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', finishKey);   // don't leak the cancel listener
        ev.stopPropagation();
        if (moved) {
          if (it.kind === 'cam-transform') app.show.moveCameraKeyframe(trackId, itemId, fromTS, previewTS);
          else if (it.kind === 'rig-transform') app.show.moveRigKeyframe(trackId, itemId, fromTS, previewTS);
          else app.show.moveTransformKeyframe(trackId, itemId, fromTS, previewTS);
        } else {
          app.page.selectedSegment = { trackId, itemId, tS: fromTS };   // selectKeyframe
          app.page.seek(startS + fromTS);                                 // seekPerformance
        }
        app.show.changed();
        refreshTimeline(app);
        refreshSegInspector(app);
      };
      const finishKey = () => {
        window.removeEventListener('pointermove', mv);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', finishKey);
      };
      window.addEventListener('pointermove', mv);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', finishKey);
    };
    d.onclick = e => e.stopPropagation();   // live: block click must not clobber the keyframe selection
  });
}

// solver-placed add (live Z(): _ie with obstacles + magnet + markers, fallback = end)
function placeNewItem(app, charId, desiredStartS, durationS) {
  const tr = app.show.trackOf(charId);
  const items = tr?.items ?? [];
  const layout = showLayout(app.show.show);
  const pps = 1; // seconds-domain math; markers in seconds
  return appendPlace(items, durationS, desiredStartS);   // live placeItemS → W5r: obstacles yes, magnet/markers no
}

function addItemKind(app, charId, kind, startS) {
  const obj = app.objects.get(charId);
  const add = item => {
    const dur = item.durationS ?? C.ITEM_DEFAULT_DUR;
    const placed = placeNewItem(app, charId, startS, dur);
    const it = app.show.addItem(charId, { ...item, startS: placed });
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
  // ---- segment editors for object kinds (live setRotateAxis/setObjectItemSpeed/setRevolveCenter/setScaleFactor) ----
  if (it.kind === 'rotate') {
    html += `<label>Axis<select id="segAxis">${['x', 'y', 'z'].map(a => `<option ${it.axis === a ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
      <label>Speed °/s<input type="number" id="segDeg" step="15" value="${it.degPerS ?? 90}"></label>`;
  }
  if (it.kind === 'revolve') {
    html += `<label>Center<select id="segCenter"><option value="">—</option>${objOpts(it.centerObjectId)}</select></label>
      <label>Speed °/s<input type="number" id="segDeg" step="15" value="${it.degPerS ?? 60}"></label>`;
  }
  if (it.kind === 'scale') {
    html += `<label>Factor<input type="number" id="segFactor" min="0.1" step="0.1" value="${it.factor ?? 2}"></label>`;
  }
  if (it.kind === 'transform' || it.kind === 'cam-transform' || it.kind === 'rig-transform') {
    const keys = it.keys ?? [];
    const selectedTS = seg.tS;
    html += `<div class="hint">${keys.length} keys · drag the object while this segment is selected to capture a key at the playhead</div>
      <button class="primary small" id="segKey">⦿ Key at playhead</button>`;
    if (keys.length) {
      html += `<div class="key-list">${keys.map(k =>
        `<div class="key-row${selectedTS !== undefined && Math.abs(k.tS - selectedTS) <= KEY_EPS ? ' sel' : ''}" data-ts="${k.tS}">
          <span>◆ ${k.tS.toFixed(2)}s</span>
          <button class="ghost small key-jump" data-ts="${k.tS}">↦</button>
          <button class="ghost small key-del" data-ts="${k.tS}">✕</button>
        </div>`).join('')}</div>`;
    }
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
  bind('#segAxis', 'onchange', e => patch({ axis: e.target.value }));
  bind('#segDeg', 'onchange', e => { const v = +e.target.value; if (!Number.isNaN(v)) patch({ degPerS: v }); });
  bind('#segCenter', 'onchange', e => patch({ centerObjectId: e.target.value || null }));
  bind('#segFactor', 'onchange', e => { const v = +e.target.value; if (!Number.isNaN(v) && v > 0) patch({ factor: v }); });
  bind('#segKey', 'onclick', () => {
    // captureFocused*Pose (minimal port — exact store API)
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
    if (it.kind === 'transform') app.show.addTransformKeyframe(seg.trackId, seg.itemId, key);
    else if (it.kind === 'cam-transform') app.show.addCameraKeyframe(seg.trackId, seg.itemId, key);
    else app.show.addRigKeyframe(seg.trackId, seg.itemId, key);
    refreshTimeline(app);
    refreshSegInspector(app);
  });
  // key list: jump / delete (deleteSelectedKeyframe equivalent per-key)
  const selRow = el.querySelector('.key-row.sel');
  if (selRow) selRow.scrollIntoView({ block: 'nearest' });
  el.querySelectorAll('.key-jump').forEach(b => b.onclick = () => {
    const tS = +b.dataset.ts;
    app.page.selectedSegment = { trackId: seg.trackId, itemId: seg.itemId, tS };
    app.page.seek(it.startS + tS);
    refreshTimeline(app); refreshSegInspector(app);
  });
  el.querySelectorAll('.key-del').forEach(b => b.onclick = () => {
    const tS = +b.dataset.ts;
    if (it.kind === 'rig-transform') app.show.removeRigKeyframe(seg.trackId, seg.itemId, tS);
    else if (it.kind === 'cam-transform') app.show.removeCameraKeyframe(seg.trackId, seg.itemId, tS);
    else app.show.removeTransformKeyframe(seg.trackId, seg.itemId, tS);
    const sel = app.page.selectedSegment;
    if (sel?.tS !== undefined && Math.abs(sel.tS - tS) <= KEY_EPS) app.page.selectedSegment = { trackId: seg.trackId, itemId: seg.itemId };
    refreshTimeline(app); refreshSegInspector(app);
  });
}

function updatePlayhead(app, t) {
  const line = document.getElementById('playheadLine');
  const badge = document.getElementById('timeBadge');
  const pps = app._tl?.pps ?? 60;
  if (line) line.style.left = `${LANE_GUTTER() + t * pps}px`;
  if (badge) badge.textContent = fmtClock(t);
  // keyframe diamonds: active when the playhead sits exactly on the key (local time)
  document.querySelectorAll('.blk').forEach(b => {
    const layer = b.querySelector('.kf-layer');
    if (!layer) return;
    const startS = +b.dataset.start;
    const local = t - startS;
    layer.querySelectorAll('.kf-diamond').forEach(d => {
      d.classList.toggle('active', Math.abs(+d.dataset.ts - local) <= KEY_EPS);
    });
  });
}

// lane gutter width (must match --lane-gutter in CSS)
const LANE_GUTTER = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lane-gutter')) || 110;

// YAr — live clock format: 12.34 under a minute, 1:02.34 above
const fmtTime = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const fmtClock = t => {
  const cs = Math.round(t * 100);
  const m = Math.floor(cs / 6000), s = cs % 6000 / 100;
  return m === 0 ? s.toFixed(2) : `${m}:${s.toFixed(2).padStart(5, '0')}`;
};


// ================= viewport overlays: lasso + nav ball =================
function buildViewportOverlays(app) {
  // ---- lasso button + rect box (live rightToolbar/lassoBox) + nav ball pad visibility ----
  const lassoBtn = document.getElementById('btnLasso');
  const lassoBox = document.getElementById('lassoBox');
  const pad = document.getElementById('navBallPad');
  lassoBtn.onclick = () => app.page.toggleLasso();
  app.page.subscribe(() => {
    const inEdit = app.page.mode === 'edit' && app.page.stageView !== 'cameras' && !app.page.playing;
    pad.style.display = inEdit ? '' : 'none';           // live mounts the pad only in edit view
    lassoBtn.style.display = inEdit ? '' : 'none';
    const active = app.page.editInteraction === 'lasso';
    lassoBtn.classList.toggle('on', active);
    lassoBtn.setAttribute('aria-pressed', String(active));
    const r = app.page.lassoRect;
    if (active && r && r.w > 0 && r.h > 0) {
      lassoBox.style.display = 'block';
      lassoBox.style.left = `${r.x}px`; lassoBox.style.top = `${r.y}px`;
      lassoBox.style.width = `${r.w}px`; lassoBox.style.height = `${r.h}px`;
    } else {
      lassoBox.style.display = 'none';
    }
  });

  // ---- nav ball pad drag (RXr port): pointer delta → stick → page.navBallVector ----
  let drag = null;
  const drive = (x, y) => { if (drag) app.page.setNavBallVector(stickFromDelta(x - drag.x, y - drag.y, drag.radiusPx)); };
  const end = () => { if (drag) { drag = null; app.page.setNavBallVector(null); } };
  window.addEventListener('blur', end);
  pad.addEventListener('pointerdown', e => {
    const r = pad.getBoundingClientRect();
    drag = { x: r.left + r.width / 2, y: r.top + r.height / 2, radiusPx: r.width / 2 };
    try { pad.setPointerCapture(e.pointerId); } catch (_) {}
    drive(e.clientX, e.clientY);
  });
  pad.addEventListener('pointermove', e => drive(e.clientX, e.clientY));
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);
}

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
