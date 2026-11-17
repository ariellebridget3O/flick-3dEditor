// r10 review: dump LUTs + exact bake uniforms from the live GPU state
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire('/home/z/.npm-global/lib/node_modules/');
const { chromium: C } = require('playwright');

const browser = await C.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:8199/editor/index.html');
await page.waitForFunction(() => window.__app && window.__app.env, null, { timeout: 30000 });
await page.waitForTimeout(1500);
await page.evaluate(() => { __app.setSkyStyle('realistic'); __app.setLightCustom(180, 60); });
await page.waitForTimeout(900);

const out = await page.evaluate(() => {
  const rs = __app.env.realisticSky();
  const U = rs.materials.skyView.uniforms;
  const v3 = u => [u.value.x, u.value.y, u.value.z];
  return {
    uniforms: {
      uCameraPosKm: v3(U.uCameraPosKm), uSunDir: v3(U.uSunDir), uSunIlluminance: v3(U.uSunIlluminance),
      uRayleighScattering: v3(U.uRayleighScattering), uRayleighDensityExpScale: U.uRayleighDensityExpScale.value,
      uMieScattering: v3(U.uMieScattering), uMieExtinction: v3(U.uMieExtinction), uMieAbsorption: v3(U.uMieAbsorption),
      uMieDensityExpScale: U.uMieDensityExpScale.value, uMiePhaseG: U.uMiePhaseG.value,
      uBottomRadius: U.uBottomRadius.value, uTopRadius: U.uTopRadius.value,
      uAbsorptionDensity0LayerWidth: U.uAbsorptionDensity0LayerWidth.value,
      uAbsorptionDensity0ConstantTerm: U.uAbsorptionDensity0ConstantTerm.value,
      uAbsorptionDensity0LinearTerm: U.uAbsorptionDensity0LinearTerm.value,
      uAbsorptionDensity1ConstantTerm: U.uAbsorptionDensity1ConstantTerm.value,
      uAbsorptionDensity1LinearTerm: U.uAbsorptionDensity1LinearTerm.value,
      uAbsorptionExtinction: v3(U.uAbsorptionExtinction),
      uGroundAlbedo: v3(U.uGroundAlbedo),
    },
    transmittance: rs.dumpLut('transmittance'),
    multiscat: rs.dumpLut('multiscat'),
    skyview: rs.dumpLut('skyView'),
  };
});
writeFileSync('sky_dump.json', JSON.stringify(out));
console.log('uniforms:', JSON.stringify(out.uniforms));
console.log('LUT sizes:', out.transmittance.w + 'x' + out.transmittance.h, out.multiscat.w + 'x' + out.multiscat.h, out.skyview.w + 'x' + out.skyview.h);
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
