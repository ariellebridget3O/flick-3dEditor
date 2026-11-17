// r10 review probe part 4: high-elevation dome pixels — is the zenith bright (flip) or dark (correct)?
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

// camera 40 deg up; bin view-elevation 2..85 deg
const grad = await page.evaluate(async () => {
  __app.orbit.target.set(0, 120, 8);
  __app.camera.position.set(0, 2, 0);
  __app.orbit.update();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const gl = __app.renderer.getContext();
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const img = new Uint8Array(W * H * 4);
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, img);
  const cam = __app.camera;
  const dir = cam.position.clone();
  const at = (x, y) => { dir.set((x / W) * 2 - 1, (y / H) * 2 - 1, 0.5).unproject(cam); dir.sub(cam.position).normalize(); return dir; };
  const bins = {};
  for (let py = Math.floor(H * 0.25); py < H; py += 2) {
    for (let px = 0; px < W; px += 4) {
      const d = at(px, py);
      if (d.y < 0.02) continue;
      const el = Math.asin(d.y) * 180 / Math.PI;
      const b = Math.floor(el / 5);
      const i = (py * W + px) * 4;
      (bins[b] ??= { n: 0, r: 0, g: 0, bl: 0 });
      bins[b].n++; bins[b].r += img[i]; bins[b].g += img[i + 1]; bins[b].bl += img[i + 2];
    }
  }
  const out = [];
  for (let b = 0; b <= 19; b++) if (bins[b]?.n > 8)
    out.push(`${(b * 5)}-${b * 5 + 5}deg: R${Math.round(bins[b].r / bins[b].n)} G${Math.round(bins[b].g / bins[b].n)} B${Math.round(bins[b].bl / bins[b].n)} (n=${bins[b].n})`);
  return out;
});
console.log('=== DOME GRADIENT 2..85deg view elevation (el=60 sun) ===');
for (const l of grad) console.log('  ' + l);
console.log('=== ERRORS ===', errors.length ? errors : 'none');
await browser.close();
