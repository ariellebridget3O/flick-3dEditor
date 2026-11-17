// r10 review probe: verify sky-view LUT vertical orientation (F1) + sun-side Mie asymmetry (F2)
import { createRequire } from 'node:module';
const require = createRequire('/home/z/.npm-global/lib/node_modules/');
const { chromium: C } = require('playwright');

const url = 'http://localhost:8199/editor/index.html';
const browser = await C.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
await page.goto(url);
await page.waitForFunction(() => window.__app && window.__app.env, null, { timeout: 30000 });
await page.waitForTimeout(1500);

// deterministic midday: azimuth 180, elevation 60, clear weather
await page.evaluate(() => { __app.setSkyStyle('realistic'); __app.setLightCustom(180, 60); });
await page.waitForTimeout(800);

const lutReport = await page.evaluate(() => {
  const rs = __app.env.realisticSky();
  const lut = rs.dumpLut('skyView');
  const { w, h, data } = lut;
  const px = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
  const rowMean = y => { let r = 0, g = 0, b = 0; for (let x = 0; x < w; x++) { const p = px(x, y); r += p[0]; g += p[1]; b += p[2]; } return [r / w, g / w, b / w]; };
  const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const rows = {};
  for (const y of [0, 2, 6, 14, 27, 40, 50, 53, 54, 64, 80, 107]) rows[y] = rowMean(y).map(v => +v.toFixed(4));
  // half comparison: left half (uv.x<0.5) vs right half — which is brighter (above-horizon rows only)
  let lLum = 0, rLum = 0, n = 0;
  for (let y = 0; y < 54; y++) for (let x = 0; x < w; x++) {
    const p = px(x, y); const l = lum(p); if (x < w / 2) lLum += l; else rLum += l; n++;
  }
  return {
    w, h, rows,
    leftLum: +(lLum / n).toFixed(4), rightLum: +(rLum / n).toFixed(4),
    note: 'rows 0..53 above-horizon; reference layout: row0=ZENITH(dark@noon), row53=horizon(bright)',
  };
});
console.log('=== SKYVIEW LUT ===');
console.log(JSON.stringify(lutReport, null, 1));

// camera probes: center pixel with camera aimed at zenith vs horizon (realistic noon)
const probe = await page.evaluate(async () => {
  const shot = async (q) => {
    __app.camera.position.set(0, 2, 0);
    __app.camera.quaternion.copy(q);
    __app.camera.updateMatrixWorld(true);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const gl = __app.renderer.getContext();
    const cw = gl.drawingBufferWidth, ch = gl.drawingBufferHeight;
    const buf = new Uint8Array(4);
    gl.readPixels(cw >> 1, ch >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf); // center pixel
    return [...buf];
  };
  const up = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, 3, 0), new THREE.Vector3(0, 1, 0)));
  const horiz = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, 2, -1), new THREE.Vector3(0, 1, 0)));
  return { zenithView: await shot(up), horizonView: await shot(horiz) };
});
console.log('=== DOME CENTER PIXEL (zenith aim vs horizon aim, el=60 noon) ===');
console.log(JSON.stringify(probe));

// low-sun aureole test: sun el 4deg az 0; camera aimed at sun azimuth vs anti-sun at SAME view elevation
await page.evaluate(() => { __app.setLightCustom(0, 4); });
await page.waitForTimeout(800);
const aureole = await page.evaluate(async () => {
  const shot = async (azDeg) => {
    const a = azDeg * Math.PI / 180;
    __app.camera.position.set(0, 2, 0);
    __app.camera.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(0, 2, 0), new THREE.Vector3(Math.sin(a) * 20, 3.4, -Math.cos(a) * 20), new THREE.Vector3(0, 1, 0)));
    __app.camera.updateMatrixWorld(true);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const gl = __app.renderer.getContext();
    const buf = new Uint8Array(4);
    gl.readPixels(gl.drawingBufferWidth >> 1, (gl.drawingBufferHeight * 0.62) | 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return [...buf];
  };
  return { towardSun_az0: await shot(0), antiSun_az180: await shot(180) };
});
console.log('=== AUREOLE (sun el=4, view ~5deg above horizon, sun azimuth vs anti-sun) ===');
console.log(JSON.stringify(aureole));

console.log('=== CONSOLE ERRORS ===', errors.length ? errors : 'none');
await browser.close();
