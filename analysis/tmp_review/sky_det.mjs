// determinism check: dump the sky-view LUT 3 times in one session + trans LUT row check
import { createRequire } from 'node:module';
const require = createRequire('/home/z/.npm-global/lib/node_modules/');
const { chromium: C } = require('playwright');
const browser = await C.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:8199/editor/index.html');
await page.waitForFunction(() => window.__app && window.__app.env, null, { timeout: 30000 });
await page.waitForTimeout(1500);
await page.evaluate(() => { __app.setSkyStyle('realistic'); __app.setLightCustom(180, 60); });
await page.waitForTimeout(900);
const dumps = [];
for (let k = 0; k < 3; k++) {
  await page.waitForTimeout(350);
  dumps.push(await page.evaluate(() => {
    const rs = __app.env.realisticSky();
    const sv = rs.dumpLut('skyView');
    const row = y => { let r = 0, g = 0, b = 0; for (let x = 0; x < sv.w; x++) { const i = (y * sv.w + x) * 4; r += sv.data[i]; g += sv.data[i + 1]; b += sv.data[i + 2]; } return [r / sv.w, g / sv.w, b / sv.w].map(v => +v.toFixed(5)); };
    return { cam: rs.materials.skyView.uniforms.uCameraPosKm.value.toArray().map(v => +v.toFixed(4)), r0: row(0), r1: row(1), r2: row(2), r6: row(6), r53: row(53) };
  }));
}
for (const d of dumps) console.log(JSON.stringify(d));
await browser.close();
