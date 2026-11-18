(() => {
  const a = window.__app;
  a.setSkyStyle('realistic');
  a.setWeather('clear');
  a.setClouds({ enabled: false });
  // fresh-load default camera: do NOT touch orbit/camera
  a.renderFrame();
  return 'armed clouds OFF default cam';
})()
