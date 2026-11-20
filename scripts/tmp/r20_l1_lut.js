(() => {
  const a = window.__app;
  const env = a.env;
  const scene = env.sky.parent;
  let dome = null;
  scene.traverse(o => { if (!dome && o.material && o.material.uniforms && o.material.uniforms.uSunIlluminance !== undefined) dome = o; });
  const du = dome.material.uniforms;
  const ill = du.uSunIlluminance.value.toArray().map(v => +v.toFixed(2));
  const sky = env.realisticSky();
  let lutInfo = 'no dumpLut';
  try { const d = sky.dumpLut ? sky.dumpLut() : null; lutInfo = d ? JSON.stringify(d).slice(0, 300) : 'null'; } catch (e) { lutInfo = 'ERR ' + e.message; }
  return JSON.stringify({ illuminance: ill, lutInfo });
})()
