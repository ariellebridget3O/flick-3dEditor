(() => {
  const a = window.__app;
  const env = a.env;
  const u = env.sky.material.uniforms;
  const fog = a.env && a.renderer && (function(){ const s = a.objectManager.scene; return s && s.fog; })();
  // find the scene via the renderer's render target? Use env's own scene: sky is in it
  const sceneFog = env.sky.parent && env.sky.parent.fog;
  const r2h = v => Math.round(v * 1000) / 1000;
  return JSON.stringify({
    zenith: u.zenith.value.toArray().map(r2h),
    horizon: u.horizon.value.toArray().map(r2h),
    flare: u.flare.value.toArray().map(r2h),
    fogColor: (sceneFog || {}).color ? sceneFog.color.toArray().map(r2h) : null,
    fogDensity: (sceneFog || {}).density,
    hdrEnabled: !!a.light.hdr,
    finishOn: env.getFinishOn ? env.getFinishOn() : null,
    lift: (a.light.hdr && (env.getFinishOn ? env.getFinishOn() : true)) ? 1.06 : 1
  });
})()
