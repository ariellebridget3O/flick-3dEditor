(() => {
  const a = window.__app;
  a.setSkyStyle('realistic');
  a.setWeather('overcast');
  a.setClouds({ enabled: true, mode: 'procedural', coverage: 0.9, density: 1.5, cirrus: 0.2, windSpeed: 0 });
  a.orbit.target.set(0, 60, -10);
  a.orbit.update();
  a.renderFrame();
  return 'armed overcast/.9 sky';
})()
