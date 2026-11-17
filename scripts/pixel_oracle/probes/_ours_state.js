(() => {
  const app = window.__app;
  if (!app) return 'NO __app';
  const out = { lightAz: app.light ? app.light.azimuthDeg : null, lightEl: app.light ? app.light.elevationDeg : null };
  const c = document.querySelector('canvas');
  if (c) { const r = c.getBoundingClientRect(); out.canvas = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }
  return JSON.stringify(out);
})()
