// r10 review probe part 3: vertical gradient of the rendered dome + aureole, camera driven via orbit API
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
await page.waitForTimeout(900);

// ---- vertical gradient of the dome: camera nearly horizontal; bin pixels by view elevation
const gradient = await page.evaluate(async () => {
  __app.orbit.target.set(0, 3.4, 0);
  __app.camera.position.set(0, 3.9, 34);
  __app.orbit.update();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const gl = __app.renderer.getContext();
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const img = new Uint8Array(W * H * 4);
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, img);
  // unproject via reusing camera.position as a scratch Vector3
  const cam = __app.camera;
  const dir = cam.position.clone();
  const at = (x, y) => { dir.set((x / W) * 2 - 1, (y / H) * 2 - 1, 0.5).unproject(cam); dir.sub(cam.position).normalize(); return dir; };
  const bins = {};
  const band = (px, py) => { const d = at(px, py); const el = Math.asin(Math.max(-1, Math.min(1, d.y))) * 180 / Math.PI; return el; };
  for (let py = Math.floor(H * 0.45); py < H; py += 2) {
    for (let px = 0; px < W; px += 4) {
      const el = band(px, py);
      if (el < 0.5 || el > 40) continue;
      const b = Math.min(39, Math.floor(el));
      const i = (py * W + px) * 4;
      (bins[b] ??= { n: 0, r: 0, g: 0, bl: 0 });
      bins[b].n++; bins[b].r += img[i]; bins[b].g += img[i + 1]; bins[b].bl += img[i + 2];
    }
  }
  const out = [];
  for (let b = 0; b < 40; b++) if (bins[b]?.n > 30)
    out.push([b, Math.round(bins[b].r / bins[b].n), Math.round(bins[b].g / bins[b].n), Math.round(bins[b].bl / bins[b].n), bins[b].n]);
  return { W, H, cameraPos: cam.position.toArray().map(v => +v.toFixed(2)), bins: out };
});
console.log('=== DOME VERTICAL GRADIENT el=60 (view-elevation bin -> avg RGB, display space) ===');
for (const b of gradient.bins) console.log(`  el ${String(b[0]).padStart(2)}-${b[0]+1}deg: R${b[1]} G${b[2]} B${b[3]}  (n=${b[4]})`);

// ---- aureole: sun el 4 az 0; camera aimed ~5deg up toward sun azimuth vs anti-sun
await page.evaluate(() => { __app.setLightCustom(0, 4); });
await page.waitForTimeout(900);
const aureole = await page.evaluate(async () => {
  const shot = async (tx, tz, label) => {
    __app.orbit.target.set(tx, 6.0, tz);
    __app.camera.position.set(0, 2, 0);
    __app.orbit.update();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const gl = __app.renderer.getContext();
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    const img = new Uint8Array(4);
    gl.readPixels(W >> 1, (H * 0.60) | 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, img);
    // also the exact center of the frame (view ~5deg up)
    const c = new Uint8Array(4);
    gl.readPixels(W >> 1, H >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, c);
    return { label, upper: [...img], center: [...c] };
  };
  return [await shot(0, -40, 'towardSun_az0(-Z)'), await shot(0, 40, 'antiSun_az180(+Z)')];
});
console.log('=== AUREOLE el=4 (sun az0=-Z; views ~5deg above horizon) ===');
for (const a of aureole) console.log(`  ${a.label}: upper=${a.upper.slice(0, 3)} center=${a.center.slice(0, 3)}`);

console.log('=== CONSOLE ERRORS ===', errors.length ? errors : 'none');
await browser.close();
