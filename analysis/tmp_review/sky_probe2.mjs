// r10 review probe part 2: dome pixel orientation + low-sun aureole (no THREE global in page)
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

await page.evaluate(() => { __app.setSkyStyle('realistic'); __app.setLightCustom(180, 60); });
await page.waitForTimeout(800);

// camera probes WITHOUT THREE global: use camera.up + lookAt
const probe = await page.evaluate(async () => {
  const shot = async (target) => {
    __app.camera.position.set(0, 2, 0);
    __app.camera.up.set(0, 1, 0);
    __app.camera.lookAt(target.x, target.y, target.z);
    __app.camera.updateMatrixWorld(true);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const gl = __app.renderer.getContext();
    const buf = new Uint8Array(4);
    gl.readPixels(gl.drawingBufferWidth >> 1, gl.drawingBufferHeight >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return [...buf];
  };
  return {
    zenithView: await shot({ x: 0, y: 3, z: 0 }),
    horizonView: await shot({ x: 0, y: 2.0, z: -1 }),
  };
});
console.log('=== DOME CENTER PIXEL el=60 (zenith aim vs horizon aim) ===');
console.log(JSON.stringify(probe));

await page.evaluate(() => { __app.setLightCustom(0, 4); });
await page.waitForTimeout(800);
const aureole = await page.evaluate(async () => {
  const shot = async (azDeg, frac) => {
    const a = azDeg * Math.PI / 180;
    __app.camera.position.set(0, 2, 0);
    __app.camera.up.set(0, 1, 0);
    __app.camera.lookAt(Math.sin(a) * 20, 2 + 20 * 0.088 * frac, -Math.cos(a) * 20);
    __app.camera.updateMatrixWorld(true);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const gl = __app.renderer.getContext();
    const buf = new Uint8Array(4);
    gl.readPixels(gl.drawingBufferWidth >> 1, (gl.drawingBufferHeight * 0.62) | 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return [...buf];
  };
  // same view elevation (~5deg up), aimed at sun azimuth (0) vs anti-sun (180)
  return { towardSun_az0: await shot(0, 1), antiSun_az180: await shot(180, 1) };
});
console.log('=== AUREOLE el=4 (view ~5deg above horizon; sun azimuth vs anti-sun) ===');
console.log(JSON.stringify(aureole));

console.log('=== CONSOLE ERRORS ===', errors.length ? errors : 'none');
await browser.close();
