(() => {
  const a = window.__app;
  a.setSkyStyle('realistic');
  a.setWeather('clear');
  a.setClouds({ enabled: true, mode: 'layered', coverage: 0.5, density: 1.0, cirrus: 0.35, windSpeed: 0 });
  a.orbit.target.set(0, 60, -10);
  a.orbit.update();
  a.renderFrame();
  return 'armed layered/.5 sky';
})()
