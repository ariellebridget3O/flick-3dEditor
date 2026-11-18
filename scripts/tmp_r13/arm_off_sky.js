(() => {
  const a = window.__app;
  a.setClouds({ enabled: false });
  // keep current (sky-aimed) camera
  a.renderFrame();
  return 'armed clouds OFF (keep aim)';
})()
