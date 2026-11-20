(() => {
  const w = window, d = document;
  const a = w.__app;
  if (!a) return 'NO APP';
  // open the light popover
  const btn = d.getElementById('btnLight');
  btn.click();
  const pop = d.getElementById('lightPop');
  const disc = d.getElementById('sunDir'), rail = d.getElementById('sunRail');
  const knob = d.getElementById('sunDirKnob'), handle = d.getElementById('sunRailHandle');
  if (!disc || !rail || !knob || !handle) return 'MISSING NEW CONTROL DOM: ' + JSON.stringify({ disc: !!disc, rail: !!rail, knob: !!knob, handle: !!handle });
  const r1 = { open: pop.classList.contains('open'), az: Math.round(a.light.azimuthDeg), el: Math.round(a.light.elevationDeg), knobMoon: knob.classList.contains('moon'), handleMoon: handle.classList.contains('moon'), aria: disc.getAttribute('aria-valuenow') + '/' + rail.getAttribute('aria-valuenow') };
  // drag the disc: pointer events at the disc's right edge (az → 90+yaw) keeping el
  const rr = disc.getBoundingClientRect();
  const cx = rr.left + rr.width / 2, cy = rr.top + rr.height / 2;
  disc.dispatchEvent(new PointerEvent('pointerdown', { clientX: cx + rr.width * 0.4, clientY: cy, button: 0, bubbles: true, pointerId: 1 }));
  disc.dispatchEvent(new PointerEvent('pointermove', { clientX: cx + rr.width * 0.42, clientY: cy, bubbles: true, pointerId: 1 }));
  disc.dispatchEvent(new PointerEvent('pointerup', { clientX: cx + rr.width * 0.42, clientY: cy, bubbles: true, pointerId: 1 }));
  const afterDisc = { az: Math.round(a.light.azimuthDeg), el: Math.round(a.light.elevationDeg) };
  // drag the rail to the bottom (el → -30 = moon zone)
  const rlr = rail.getBoundingClientRect();
  rail.dispatchEvent(new PointerEvent('pointerdown', { clientX: rlr.left + 4, clientY: rlr.top + 2, button: 0, bubbles: true, pointerId: 2 }));
  rail.dispatchEvent(new PointerEvent('pointermove', { clientX: rlr.left + 4, clientY: rlr.top + rlr.height * 0.98, bubbles: true, pointerId: 2 }));
  rail.dispatchEvent(new PointerEvent('pointerup', { clientX: rlr.left + 4, clientY: rlr.top + rlr.height * 0.98, bubbles: true, pointerId: 2 }));
  const afterRail = { az: Math.round(a.light.azimuthDeg), el: Math.round(a.light.elevationDeg), knobMoon: knob.classList.contains('moon'), handleMoon: handle.classList.contains('moon'), phase: d.getElementById('lpPhase').textContent };
  return JSON.stringify({ r1, afterDisc, afterRail, consoleErrs: (w.__errs || []).length });
})()
