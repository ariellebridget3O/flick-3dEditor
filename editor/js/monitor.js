// monitor.js — r17 port of the camera-mode viewfinder (Yjr @5225471 + eIr controller UI +
// lEr weight slider @5191422 + Zjr timecode @5222880/uEr @5193223 + ACr level @5183920 +
// qjr height field + the aspect menu (Zae/Gjr rows) + XGt frame guide reuse + Je click-to-lock
// @5655723). Divergences (SKILL #34/#41, ledgered in FIDELITY r17):
//  · labels are semantic English (the i18n catalog is a separate live asset);
//  · REC is present + enabled but shows a toast — the MediaRecorder filming arc is a separate
//    backlog entry (the live REC starts a real recording);
//  · the phone status field + connect card are omitted (WebRTC to the phone app — live-only);
//  · TC is ported verbatim (counts only while recording → renders 00:00:00:00 offline).
import { C } from './const.js';
import {
  rigName, weightButtonLabel, weightLabel, speedValueLabel, isPanOnly,
} from './rigs.js';

const uEr = (t, e) => {   // @5193223 — hh:mm:ss:ff timecode
  const n = Math.floor(t / e);
  return [Math.floor(n / 3600), Math.floor(n / 60) % 60, n % 60, t % e]
    .map(r => String(r).padStart(2, '0')).join(':');
};

// Gjr @5222035 — the aspect glyph: e = a>=1 ? min(2.2, 1.3·a) : 1.3·a; w = e·8px, h = (e/a)·8px
function aspectGlyph(a) {
  const e = a >= 1 ? Math.min(2.2, 1.3 * a) : 1.3 * a;
  const w = e * 8, h = (e / a) * 8;
  return `<span class="mon-aspect-glyph" style="width:${w.toFixed(1)}px;height:${h.toFixed(1)}px"></span>`;
}

export function createMonitor(app) {
  let menu = null;          // 'aspect' | 'weight' | null (eIr openMenu)
  let tcStart = 0, tcSecs = 0;   // Zjr state (running only while "recording" — never offline)
  const mon = document.createElement('div');
  mon.className = 'monitor';
  mon.addEventListener('click', e => {   // Yjr onClick: detail!==0 && button blur (keyboard focus hygiene)
    if (e.detail !== 0) e.target.closest('button')?.blur();
  });
  mon.innerHTML = `
    <div class="mon-frame">
      <div class="mon-grid" style="display:none"></div>
      <div class="mon-level"><i></i><div class="mon-level-line"></div><i></i></div>
    </div>
    <div class="mon-picture"></div>
    <div class="mon-bar mon-top">
      <div class="mon-field mon-state">STBY</div>
      <div class="mon-field" title="Timecode">TC <span class="mon-tc">00:00:00:00</span></div>
      <button class="mon-field mon-rig" aria-label="Camera rig (Tab)"></button>
      <button class="mon-field mon-speed" aria-label="Speed (Z/X)"></button>
      <div class="mon-menufield mon-weight-field">
        <button class="mon-field mon-weight" aria-label="Weight ([ / ])" aria-expanded="false"></button>
        <div class="mon-menu mon-menu-down mon-weight-menu" role="dialog" style="display:none">
          <div class="mon-weight-panel">
            <div class="mon-weight-row"><span>Weight <span class="mon-weight-rig"></span></span><span class="mon-weight-value"></span></div>
            <input class="mon-weight-range" type="range">
            <p class="mon-weight-help">Negative slows the rig's easing, positive speeds it up.</p>
          </div>
        </div>
      </div>
      <div class="mon-field mon-height" title="Height (Q/E)"></div>
      <div class="mon-field mon-focal" title="Focal (O/P + wheel)"></div>
      <div class="mon-spacer"></div>
      <div class="mon-menufield mon-aspect-field">
        <button class="mon-field mon-aspect" aria-expanded="false"></button>
        <div class="mon-menu mon-aspect-menu" role="menu" style="display:none"></div>
      </div>
    </div>
    <div class="mon-bar mon-bottom">
      <div class="mon-side"><button class="mon-back" title="Back to editing (Esc)">← Back</button></div>
      <button class="mon-record" aria-pressed="false" aria-label="Record (R)"><i></i>REC</button>
      <div class="mon-side mon-toggles">
        <button class="mon-grid-toggle" aria-pressed="false" title="Grid">Grid</button>
        <button class="mon-level-toggle" aria-pressed="true" title="Level">Level</button>
      </div>
    </div>`;
  document.getElementById('viewport').appendChild(mon);

  const q = sel => mon.querySelector(sel);
  const els = {
    state: q('.mon-state'), tc: q('.mon-tc'), rig: q('.mon-rig'), speed: q('.mon-speed'),
    weight: q('.mon-weight'), weightMenu: q('.mon-weight-menu'), weightRig: q('.mon-weight-rig'),
    weightValue: q('.mon-weight-value'), weightRange: q('.mon-weight-range'),
    height: q('.mon-height'), focal: q('.mon-focal'), aspect: q('.mon-aspect'),
    aspectMenu: q('.mon-aspect-menu'), grid: q('.mon-grid'), level: q('.mon-level'),
    levelLine: q('.mon-level-line'), record: q('.mon-record'), back: q('.mon-back'),
    gridToggle: q('.mon-grid-toggle'), levelToggle: q('.mon-level-toggle'),
  };

  // ---- controller buttons (eIr: cycleRig on click; cycleSpeed on click) ----
  els.rig.onclick = () => app.cycleRig(1);
  els.speed.onclick = () => app.cycleSpeed();
  els.weight.onclick = () => { toggleMenu(menu === 'weight' ? null : 'weight'); };
  els.back.onclick = () => app.exitCameraMode();
  els.record.onclick = () => app.toast('Video recording ships with the filming subsystem — not available offline');
  els.gridToggle.onclick = () => {
    els.gridToggle.setAttribute('aria-pressed', els.gridToggle.getAttribute('aria-pressed') !== 'true');
    els.grid.style.display = els.gridToggle.getAttribute('aria-pressed') === 'true' ? 'block' : 'none';
  };
  els.levelToggle.onclick = () => {
    const on = els.levelToggle.getAttribute('aria-pressed') !== 'true';
    els.levelToggle.setAttribute('aria-pressed', on);
    els.level.style.display = on ? 'block' : 'none';
  };

  // ---- the aspect menu (verbatim menuField/menuCatcher/menuitemradio rows, Zae list) ----
  function toggleMenu(next) {
    menu = next;
    app._monitorMenuOpen = menu;   // the eIr Esc handler closes the menu first
    els.weightMenu.style.display = menu === 'weight' ? 'block' : 'none';
    els.weight.setAttribute('aria-expanded', menu === 'weight');
    els.aspectMenu.style.display = menu === 'aspect' ? 'block' : 'none';
    els.aspect.setAttribute('aria-expanded', menu === 'aspect');
    if (menu) {
      const catcher = document.createElement('div');
      catcher.className = 'mon-catcher';
      catcher.onclick = () => toggleMenu(null);
      mon.appendChild(catcher);
    } else {
      mon.querySelector('.mon-catcher')?.remove();
    }
  }
  els.aspect.onclick = () => toggleMenu(menu === 'aspect' ? null : 'aspect');
  els.aspectMenu.innerHTML = C.ASPECT_KEYS.map(k => {
    const [rw, rh] = C.ASPECTS[k];
    return `<button class="mon-aspect-row" role="menuitemradio" data-aspect="${k}">
      ${aspectGlyph(rw / rh)}<span class="mon-ratio">${k}</span></button>`;
  }).join('');
  els.aspectMenu.addEventListener('click', e => {
    const row = e.target.closest('.mon-aspect-row');
    if (!row) return;
    app.page.recordAspect = row.dataset.aspect;
    app.page.changed();
    app.onAspect?.();
    toggleMenu(null);
  });

  // ---- the weight slider (lEr @5191422: range ±log2(3) step .01, HDe on change) ----
  els.weightRange.min = -C.RIG_WEIGHT_MAX;
  els.weightRange.max = C.RIG_WEIGHT_MAX;
  els.weightRange.step = '.01';
  els.weightRange.addEventListener('input', () => app.rigs.setWeight(+els.weightRange.value));
  els.weightRange.addEventListener('pointerdown', ev => {
    // lEr quirk: blur the range on pointerup so arrow keys don't stay trapped in the slider
    const a = ev.currentTarget;
    window.addEventListener('pointerup', () => a.blur(), { once: true });
  });

  // ---- Je @5655723: click the CANVAS → pointer lock (the live wires s.domElement — monitor
  // buttons never trigger it). requestPointerLock throws without a user gesture (synthetic
  // events, headless) — guard (SKILL #53 pattern). ----
  const canvas = app.renderer.domElement;
  const onClickLock = () => {
    if (app.page.mode !== 'camera' || app._look?.isLocked) return;
    try { app._look?.lock(); } catch { /* no gesture / not allowed — ignore */ }
  };
  canvas.addEventListener('click', onClickLock);

  // ---- P2-3: ONE frame — the monitor's frame mirrors the XGt guide geometry; the #frameGuide
  // DOM hides while the monitor is up (the fov adoption math in updateFrameGuide still runs).
  // The guide element carries its geometry via inline styles — mirror them onto .mon-frame.
  function syncFrame() {
    const guide = document.getElementById('frameGuide');
    if (!guide) return;
    if (app.page.mode === 'camera' && guide.style.display !== 'none') {
      const frame = mon.querySelector('.mon-frame');
      frame.style.left = guide.style.left; frame.style.top = guide.style.top;
      frame.style.width = guide.style.width; frame.style.height = guide.style.height;
      frame.classList.add('mon-frame-guide');
      guide.style.display = 'none';
      guide.dataset.monitorHidden = '1';
    } else if (app.page.mode !== 'camera' && guide.dataset.monitorHidden === '1') {
      guide.style.display = 'block';   // the cameras view restores the shared guide
      guide.dataset.monitorHidden = '';
    }
  }

  // ---- per-frame update (the React render path — polled fields only, SKILL #63 discipline) ----
  let lastRig = null, lastSpeed = null, lastWeight = null, lastFocal = null, lastAspect = null;
  function render() {
    if (app.page.mode !== 'camera') { mon.style.display = 'none'; return; }
    mon.style.display = 'block';
    const r = app.rigs;
    if (r.rig !== lastRig) {
      lastRig = r.rig;
      els.rig.textContent = rigName(r.rig);
      els.weightRig.textContent = rigName(r.rig);   // P3-3: the weight menu's rig label follows switches
    }
    const pan = isPanOnly(r.rig);
    const speedVal = pan ? r.panDegPerS : r.speedMps;
    const speedKey = `${r.rig}|${speedVal}`;
    if (speedKey !== lastSpeed) {
      lastSpeed = speedKey;
      const label = pan ? String(speedVal) : speedValueLabel(speedVal);   // Yjr @5225600: tripod shows the raw pan value
      els.speed.innerHTML = `${label}<small class="mon-unit">${pan ? '°/s' : 'm/s'}</small>`;
    }
    if (r.weight !== lastWeight) {
      lastWeight = r.weight;
      els.weight.textContent = weightButtonLabel(r.weight);
      els.weightRig.textContent = rigName(r.rig);
      els.weightValue.textContent = weightLabel(r.weight);
      if (document.activeElement !== els.weightRange) els.weightRange.value = r.weight;
    }
    const focal = Math.round(app.focalLengthMm);
    if (focal !== lastFocal) { lastFocal = focal; els.focal.innerHTML = `${focal}<small class="mon-unit">mm</small>`; }
    if (app.page.recordAspect !== lastAspect) {
      lastAspect = app.page.recordAspect;
      els.aspect.textContent = app.page.recordAspect;
      els.aspectMenu.querySelectorAll('.mon-aspect-row').forEach(row =>
        row.setAttribute('aria-checked', row.dataset.aspect === lastAspect));
    }
    // qjr height field (rAF-polled from the drive camera height)
    els.height.textContent = `${app.camera.position.y.toFixed(2)} m`;
    // ACr level: rotate by the drive roll; "on" when |roll| < 1° (TCr)
    const rollDeg = app._drive ? rollOf(app._driveCam.quaternion) : 0;
    els.levelLine.style.transform = `rotate(${rollDeg}deg)`;
    els.levelLine.classList.toggle('mon-level-on', Math.abs(rollDeg) < C.LEVEL_ON_DEG);
  }
  const rollOf = quat => {
    // LCr @5186365: roll = atan2(xAxis.y, yAxis.y)
    const e = quat;   // quat components
    const xy = 2 * (e.x * e.y + e.z * e.w), yy = 1 - 2 * (e.x * e.x + e.z * e.z);
    return Math.atan2(xy, yy) * 180 / Math.PI;
  };
  // TC (Zjr): counts at 24fps only while recording — frozen at 00:00:00:00 offline
  els.tc.textContent = uEr(0, C.TC_FPS);

  render = (orig => () => { orig(); syncFrame(); })(render);
  app._monitorRender = render;
  app._monitorToggleMenu = toggleMenu;
  return { render, dispose: () => { mon.remove(); canvas.removeEventListener('click', onClickLock); } };
}
