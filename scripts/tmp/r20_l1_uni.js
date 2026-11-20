(() => {
  const a = window.__app;
  // finishOn flips at render time — verify + read the realistic dome's uniforms
  const env = a.env;
  const fin = env.getFinishOn();
  const sky = env.realisticSky();
  const u = sky.mesh ? sky.mesh.material.uniforms : null;
  // sky exposes _debug only; reach the dome via the scene: find the big sphere in env's scene
  const scene = env.sky.parent;
  let dome = null;
  scene.traverse(o => { if (!dome && o.material && o.material.uniforms && o.material.uniforms.uNightAmount !== undefined) dome = o; });
  if (!dome) return 'NO DOME FOUND';
  const du = dome.material.uniforms;
  return JSON.stringify({
    finishOn: fin, el: a.light.elevationDeg, style: a.light.skyStyle,
    nightAmt: du.uNightAmount.value, curve: du.uCurve.value, gain: du.uHdrGain.value,
    sunDir: du.uSunDir.value.toArray().map(v => +v.toFixed(3)),
    outputSRGB: du.uOutputSRGB.value, toneMap: du.uToneMap.value
  });
})()
