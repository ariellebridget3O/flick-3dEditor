(() => {
  const a = window.__app, d = document;
  // back to day via preset 1 (Full day el 57.38)
  const b = d.querySelector('.presets button[data-i="0"]');
  b.click();
  return 'preset clicked: el=' + Math.round(a.light.elevationDeg);
})()
