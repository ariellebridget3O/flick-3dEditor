(() => {
  const a = window.__app, d = document;
  // add a second camera (via the objects API)
  a.objects.add({ kind: 'camera', name: 'Cam 2', position: [-4, 2, -6], focalLengthMm: 24 });
  a.objects.changed();
  return 'added';
})()
