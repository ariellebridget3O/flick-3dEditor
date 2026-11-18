(() => {
  const a = window.__app;
  // flip sun azimuth back to the scene original (same session as azflip — same cloud field)
  a.setLightCustom(128.66, a.light.elevationDeg);
  a.renderFrame();
  return 'armed az back to original';
})()
