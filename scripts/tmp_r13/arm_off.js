(() => {
  const a = window.__app;
  a.setSkyStyle('realistic');
  a.setWeather('clear');
  a.setClouds({ enabled: false });
  a.orbit.target.set(0, 60, -10);
  a.orbit.update();
  a.renderFrame();
  return 'armed clouds OFF (sky-aimed)';
})()
