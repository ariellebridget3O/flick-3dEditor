(() => {
  const a = window.__app;
  // Direct: call applyDaylight manually with the current light and see what happens
  const before = a.env.sun.position.toArray().map(v => +v.toFixed(2));
  let threw = null;
  try { a.env.applyDaylight(a.light); } catch (e) { threw = e.message; }
  const after = a.env.sun.position.toArray().map(v => +v.toFixed(2));
  // force a different value and re-apply
  a.setLightCustom(50, 20);
  try { a.env.applyDaylight(a.light); } catch (e) { threw = threw + ' | second: ' + e.message; }
  const after2 = a.env.sun.position.toArray().map(v => +v.toFixed(2));
  return JSON.stringify({ before, after, after2, threw, skyStyle: a.light.skyStyle, az: Math.round(a.light.azimuthDeg), el: Math.round(a.light.elevationDeg) });
})()
