// Take-range tool — exact port of the live xTr hook + _Tr ruler label + wTr lane overlay
// (xTr @5152344, Tie, PGt draw surface, wTr, _Tr; constants gTr=3, eie=.1, tie, bTr=1e-6,
//  Sie=3 short-label threshold, markers = [0, durationS, playhead, ...item edges]).
// State lives on app._tl.rangeTool; renderTakeRange() paints ruler label + lane box/ghost/guides.
// NOTE: render updates elements IN PLACE (never innerHTML) so pointer capture survives re-renders.
import { magnetSnap, MAGNET_PX } from './place.js';
import { showLayout } from './tracks.js';

const MOVE_THRESH_PX = 3;    // gTr — pointer-move threshold before a drag counts
const SNAP_GUIDE_EPS = 1e-6; // bTr — guide shows only when snapped onto a marker
const MIN_RANGE_S = 0.1;     // eie
const SHORT_LABEL_S = 3;     // Sie
const RANGE_CURSOR = (() => {  // vTr — 28px SVG crosshair w/ range box glyph (fne geometry)
  const r = (sw, col) =>
    `<g stroke='${col}'><rect x='56' y='64' width='144' height='128' rx='8' stroke-width='${sw}'/>` +
    `<path d='M56 104V152M200 104V152' stroke-width='${sw * 2.25}'/></g>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 256 256' ` +
    `fill='none' stroke-linecap='round' stroke-linejoin='round'>${r(44, '#fff')}${r(16, '#1c0f09')}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 14 14, crosshair`;
})();
const GUTTER = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lane-gutter')) || 110;

const isFormElement = t => !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
  t.tagName === 'SELECT' || t.isContentEditable);           // a9
const clampSpan = (v, u) => Math.min(Math.max(v, 0), u);    // QO

// tie(startS, endS) — range validity (>= eie - 1e-6)
export const validRange = (a, b) => b - a >= MIN_RANGE_S - 1e-6;

// xTr state factory — call once per app (app._tl.rangeTool)
export function createRangeTool() {
  return {
    on: false,        // toolOn = toggled && !locked (locked = recording; always false offline)
    selected: false,  // range "selected" (Delete-able)
    drag: null,       // {gesture, pointerX0Px, ppsPx, pressS, anchorS, from, markersS, radiusS, moved, preview, guidesS}
  };
}

// markers for magnet snapping: [0, durationS, playhead, ...every item edge] (live I in xTr.begin)
function rangeMarkers(app, durationS) {
  const layout = showLayout(app.show.show);
  const m = [0, durationS, app.page.playheadS];
  for (const tr of layout.tracks) for (const u of tr.items) m.push(u.startS, u.endS);
  return m;
}

// the displayed range (live h): committed range clamped to the show, invalid -> null
function committedRange(app, durationS) {
  const c = app.show.show.range;
  if (!c) return null;
  const a = clampSpan(c.startS, durationS), b = clampSpan(c.endS, durationS);
  return validRange(a, b) ? { startS: a, endS: b } : null;
}

// xTr().begin — pointerdown (gesture: 'draw' | 'start' | 'end' | 'slide').
// toS(clientX) maps a pointer x to timeline seconds (container origin + gutter aware).
export function rangeBegin(app, ev, gesture, ppsPx, toS) {
  const rt = app._tl.rangeTool;
  const durationS = app.show.durationS();
  const range = committedRange(app, durationS);
  if (ev.button !== 0) return;                       // left button only
  if (gesture !== 'draw' && !range) return;          // grips/slide need an existing range
  ev.stopPropagation();
  try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch (_) {}
  const useMagnet = app._tl.magnet && !(ev.metaKey || ev.ctrlKey);   // x(C,E)
  const radiusS = useMagnet ? MAGNET_PX / ppsPx : 0;
  const markersS = rangeMarkers(app, durationS);
  const pressS = toS(ev.clientX);
  app._tl.interaction = 'range';                     // FIRST: suppress re-render (protects capture)
  if (gesture === 'draw') rt.selected = false;       // o(!1)
  else rangeSelect(app, true);                       // v(): select + onSelect (re-render now a no-op)
  rt.drag = {
    gesture,
    pointerX0Px: ev.clientX,
    ppsPx,
    pressS,
    anchorS: clampSpan(magnetSnap({ desiredStartS: pressS, durationS: 0, markersS, radiusS }), durationS),
    from: range,
    markersS,
    radiusS,
    moved: false,
    preview: null,
    guidesS: [],
  };
  renderTakeRange(app);
}

// xTr().move
export function rangeMove(app, ev) {
  const rt = app._tl.rangeTool;
  const d = rt.drag;
  if (!d) return;
  ev.stopPropagation();
  // live effect: range deleted mid-drag (Delete key) cancels non-draw drags instead of re-committing
  if (d.gesture !== 'draw' && !committedRange(app, app.show.durationS())) {
    rt.drag = null;
    app._tl.interaction = null;
    renderTakeRange(app);
    return;
  }
  const dx = ev.clientX - d.pointerX0Px;
  if (!d.moved && Math.abs(dx) < MOVE_THRESH_PX) return;
  const durationS = app.show.durationS();
  const ds = dx / d.ppsPx;
  // live recomputes the magnet radius per move (I = x(C, l.ppsPx)): Ctrl/Cmd suspends mid-drag
  d.radiusS = app._tl.magnet && !(ev.metaKey || ev.ctrlKey) ? MAGNET_PX / d.ppsPx : 0;
  const snap = v => clampSpan(
    magnetSnap({ desiredStartS: v, durationS: 0, markersS: d.markersS, radiusS: d.radiusS }), durationS);
  let preview, guideAt;
  if (d.gesture === 'draw') {
    const z = snap(d.pressS + ds);
    preview = { startS: Math.min(d.anchorS, z), endS: Math.max(d.anchorS, z) };
    guideAt = [z];
  } else if (d.from) {
    if (d.gesture === 'start') {
      const z = Math.min(snap(d.from.startS + ds), d.from.endS - MIN_RANGE_S);
      preview = { startS: z, endS: d.from.endS }; guideAt = [z];
    } else if (d.gesture === 'end') {
      const z = Math.max(snap(d.from.endS + ds), d.from.startS + MIN_RANGE_S);
      preview = { startS: d.from.startS, endS: z }; guideAt = [z];
    } else {   // 'slide' — whole-range move (Tie slide on the ruler label)
      const w = d.from.endS - d.from.startS;
      const s = clampSpan(
        magnetSnap({ desiredStartS: d.from.startS + ds, durationS: w, markersS: d.markersS, radiusS: d.radiusS }),
        Math.max(0, durationS - w));
      preview = { startS: s, endS: s + w }; guideAt = [s, s + w];
    }
  } else return;
  const guidesS = d.radiusS > 0
    ? guideAt.filter(z => d.markersS.some(m => Math.abs(m - z) < SNAP_GUIDE_EPS)) : [];
  rt.drag = { ...d, moved: true, preview, guidesS };
  renderTakeRange(app);   // live re-renders via React state; imperative in-place equivalent
}

// xTr().end
export function rangeEnd(app, ev) {
  const rt = app._tl.rangeTool;
  const d = rt.drag;
  if (!d) return;
  ev.stopPropagation();
  rt.drag = null;
  app._tl.interaction = null;                        // re-renders allowed again before the commit fires
  // live effect: range deleted mid-drag — grips/slide commit nothing
  if (d.gesture !== 'draw' && !committedRange(app, app.show.durationS())) {
    renderTakeRange(app);
    return;
  }
  const p = d.preview;
  if (!p) { renderTakeRange(app); return; }
  if (d.gesture === 'draw') {
    if (!validRange(p.startS, p.endS)) { renderTakeRange(app); return; }
    if (app.show.setTakeRange(p)) { rt.on = false; rangeSelect(app, true); }   // s(!1), v()
    return;
  }
  const f = d.from;
  if (f && (p.startS !== f.startS || p.endS !== f.endS)) app.show.setTakeRange(p);   // -> refreshTimeline
  else renderTakeRange(app);
}

export function rangeCancel(app) {
  const rt = app._tl?.rangeTool;
  if (!rt?.drag) return;
  rt.drag = null;
  app._tl.interaction = null;
  renderTakeRange(app);
}

export function rangeSelect(app, sel) {
  const rt = app._tl.rangeTool;
  rt.selected = sel;
  if (sel) app.onTimeline?.();    // t.onSelect() — timeline focus in the live app
}

export function rangeDelete(app) {
  if (app.show.setTakeRange(null)) app._tl.rangeTool.selected = false;
}

// global keyboard/outside-click wiring (live xTr useEffect blocks) — call once from buildTimeline
export function wireRangeToolGlobal(app) {
  window.addEventListener('keydown', ev => {
    const rt = app._tl?.rangeTool;
    if (!rt) return;
    // Escape cancels the tool (live: document bubble-phase keydown, only while toolOn, not while typing)
    if (ev.key === 'Escape' && !ev.defaultPrevented && rt.on && !isFormElement(ev.target)) {
      if (rt.drag?.gesture === 'draw') { rt.drag = null; app._tl.interaction = null; }
      rt.on = false;
      app.onTimeline?.();
      return;
    }
    // Delete/Backspace removes the selected range (only when selected + not typing)
    const durationS = app.show?.durationS?.() ?? 0;
    if (rt.selected && committedRange(app, durationS) !== null &&
        !isFormElement(ev.target) && (ev.key === 'Delete' || ev.key === 'Backspace')) {
      ev.preventDefault();
      ev.stopPropagation();
      rangeDelete(app);
      app.onTimeline?.();
    }
  }, true);
  document.addEventListener('pointerdown', ev => {
    const rt = app._tl?.rangeTool;
    if (!rt || !rt.selected) return;
    if (!ev.target?.closest?.('[data-take-range]')) {
      rt.selected = false;
      app.onTimeline?.();
    }
  }, true);
}

// ---- rendering: _Tr (ruler label) + wTr (lane box/grips/ghost/guides/draw surface) ----
// In-place style updates only — elements are created once and reused so pointer capture survives.
export function renderTakeRange(app) {
  const rt = app._tl?.rangeTool;
  if (!rt) return;
  const ruler = document.getElementById('tlRuler');
  const lanes = document.getElementById('tlLanes');
  if (!ruler || !lanes) return;
  const pps = app._tl.pps;
  const gutter = GUTTER();
  const durationS = app.show.durationS();
  const committed = committedRange(app, durationS);
  if (!committed && !rt.drag) rt.selected = false;          // live: no range -> deselect
  const shown = (rt.drag && rt.drag.gesture !== 'draw' ? rt.drag.preview : null) ?? committed;   // live b
  const drawPreview = rt.drag?.gesture === 'draw' ? rt.drag.preview : null;

  // -- lanes overlay (wTr) --
  let overlay = lanes.querySelector('.tr-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'tr-overlay';
    lanes.appendChild(overlay);
  }
  const el = cls => overlay.querySelector('.' + cls);

  // PGt draw surface (toolOn only)
  let draw = el('tr-draw');
  if (rt.on && !draw) {
    draw = document.createElement('div');
    draw.className = 'tr-draw';
    draw.style.cursor = RANGE_CURSOR;
    overlay.appendChild(draw);
    wireGesture(draw, 'draw');
  } else if (!rt.on && draw) draw.remove();
  if (draw) draw.style.left = `${gutter}px`;

  // range box + grips (shown)
  let box = el('tr-box');
  if (shown && !box) {
    box = document.createElement('div');
    box.dataset.takeRange = '';
    box.className = 'tr-box';
    box.innerHTML = '<span class="tr-grip tr-grip-start"><span class="tr-grip-tab"></span></span>' +
      '<span class="tr-grip tr-grip-end"><span class="tr-grip-tab"></span></span>';
    overlay.appendChild(box);
    wireGesture(box.querySelector('.tr-grip-start'), 'start');
    wireGesture(box.querySelector('.tr-grip-end'), 'end');
  } else if (!shown && box) box.remove();
  if (box && shown) {
    box.classList.toggle('short', shown.endS - shown.startS < SHORT_LABEL_S);
    box.classList.toggle('selected', rt.selected);
    box.style.left = `${gutter + shown.startS * pps}px`;
    box.style.width = `${(shown.endS - shown.startS) * pps}px`;
  }

  // draw ghost + snap guides (rebuilt freely — they never hold capture)
  let ghost = el('tr-ghost');
  if (drawPreview && !ghost) {
    ghost = document.createElement('div');
    ghost.className = 'tr-ghost';
    overlay.appendChild(ghost);
  } else if (!drawPreview && ghost) ghost.remove();
  if (ghost && drawPreview) {
    ghost.style.left = `${gutter + drawPreview.startS * pps}px`;
    ghost.style.width = `${(drawPreview.endS - drawPreview.startS) * pps}px`;
  }
  overlay.querySelectorAll('.tr-guide').forEach(g => g.remove());
  for (const g of rt.drag?.guidesS ?? []) {
    const s = document.createElement('span');
    s.className = 'tr-guide';
    s.style.left = `${gutter + g * pps}px`;
    overlay.appendChild(s);
  }

  // -- ruler row (_Tr): PGt draw surface + label --
  let label = ruler.querySelector('.tr-label');
  // live _Tr renders a PGt draw surface INSIDE the ruler too — drawing works on the ruler strip
  let rdraw = ruler.querySelector('.tr-draw');
  if (rt.on && !rdraw) {
    rdraw = document.createElement('div');
    rdraw.className = 'tr-draw';
    rdraw.style.cursor = RANGE_CURSOR;
    ruler.insertBefore(rdraw, label || null);   // label renders after (paints above), live order: PGt then label
    wireGesture(rdraw, 'draw');
  } else if (!rt.on && rdraw) rdraw.remove();
  if (rdraw) rdraw.style.left = `${gutter}px`;
  if (!shown) { label?.remove(); return; }
  const widthS = shown.endS - shown.startS;
  const short = widthS < SHORT_LABEL_S;
  const fmt = v => v.toFixed(2);
  const text = short
    ? `${fmt(shown.startS)} – ${fmt(shown.endS)} · ${fmt(widthS)}s · min ${SHORT_LABEL_S}s`
    : `${fmt(shown.startS)} – ${fmt(shown.endS)} · ${fmt(widthS)}s`;
  if (!label) {
    label = document.createElement('div');
    label.className = 'tr-label';
    label.dataset.takeRange = '';
    label.title = 'Drag to move the take range';      // dkkfJf
    label.innerHTML = '<span></span><button type="button" class="tr-remove" aria-label="Remove take range" title="Remove take range">✕</button>';
    ruler.appendChild(label);
    wireGesture(label, 'slide');
    label.querySelector('.tr-remove').onpointerdown = ev => ev.stopPropagation();
    label.querySelector('.tr-remove').onclick = ev => { ev.stopPropagation(); rangeDelete(app); app.onTimeline?.(); };
  }
  label.classList.toggle('short', short);
  label.classList.add('movable');                     // !locked
  label.firstElementChild.textContent = text;
  label.style.left = `${gutter + shown.startS * pps}px`;
  label.style.setProperty('--room-px', `${Math.max(0, (app._tl.span - shown.startS) * pps)}px`);

  function wireGesture(target, gesture) {
    target.onpointerdown = ev => rangeBegin(app, ev, gesture, pps,
      x => (x - (target.closest('.tr-overlay') || ruler).getBoundingClientRect().left - gutter) / pps);
    target.onpointermove = ev => rangeMove(app, ev);
    target.onpointerup = ev => rangeEnd(app, ev);
    target.onpointercancel = () => rangeCancel(app);
  }
}
