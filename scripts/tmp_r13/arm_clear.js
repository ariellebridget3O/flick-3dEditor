(() => {
  const a = window.__app;
  a.setSkyStyle('realistic');
  a.setWeather('clear');
  a.setClouds({ enabled: true, mode: 'procedural', coverage: 0.5, density: 1.0, cirrus: 0.35, windSpeed: 0 });
  // aim the camera up at the sky
  a.orbit.target.set(0, 60, -10);
  a.orbit.update();
  a.renderFrame();
  return 'armed clear/.5 sky';
})()
