(() => {
  const a = window.__app;
  a.setSkyStyle('classic');
  a.setHdr({enabled:true, bloom:0.0, exposure:1.0});
  const az = 308.66 * Math.PI / 180, el = 38 * Math.PI / 180;
  const d = [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
  a.orbit.maxPolarAngle = Math.PI;
  a.camera.position.set(-d[0] * 40, 40, -d[2] * 40);
  a.orbit.target.set(a.camera.position.x + d[0] * 60, a.camera.position.y + d[1] * 60, a.camera.position.z + d[2] * 60);
  a.orbit.enableDamping = false; a.orbit.update();
  a.renderFrame();
  const cam = a.camera.position.toArray().map(v => +v.toFixed(1));
  const tgt = a.orbit.target.toArray().map(v => +v.toFixed(1));
  return JSON.stringify({ cam, tgt });
})()
