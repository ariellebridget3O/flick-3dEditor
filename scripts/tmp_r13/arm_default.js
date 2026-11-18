(() => {
  const a = window.__app;
  a.setSkyStyle('realistic');
  a.setWeather('clear');
  a.setClouds({ enabled: true, mode: 'procedural', coverage: 0.5, density: 1.0, cirrus: 0.35, windSpeed: 0 });
  // default camera: fresh-load view, do NOT touch orbit/camera
  a.renderFrame();
  return 'armed default cam (fresh-load camera)';
})()
