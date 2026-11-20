(() => {
  const a = window.__app, d = document;
  const camIds = Object.keys(a.objects.all()).filter(k => a.objects.all()[k].kind === 'camera');
  const mesh = a.objectManager.meshById.get(camIds[0]);
  const pose = mesh?.userData?.evalPose;
  const info = {
    camCount: camIds.length,
    hasEvalPose: !!pose,
    playhead: a.page.playheadS,
    pose: pose ? { pos: pose.position.toArray().map(v => +v.toFixed(2)), fov: +pose.fovDeg.toFixed(1) } : null
  };
  // force a render + read the canvas center pixel via 2D snapshot of the wall region
  a.renderFrame();
  return JSON.stringify(info);
})()
