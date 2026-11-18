(() => {
  const a = window.__app;
  a.setSkyStyle('realistic');
  a.setWeather('clear');
  a.setClouds({ enabled: true, mode: 'procedural', coverage: 0.5, density: 1.0, cirrus: 0.35, windSpeed: 0 });
  // flip sun azimuth 180° (directional-shading A/B test); keep elevation
  a.setLightCustom((a.light.azimuthDeg + 180) % 360, a.light.elevationDeg);
  a.orbit.target.set(0, 60, -10);
  a.orbit.update();
  a.renderFrame();
  return 'armed clear/.5 sky, az+180';
})()
