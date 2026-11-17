// r10 review harness: double-precision reimplementation of the sky-view LUT bake.
// Inputs: the GPU-dumped transmittance + MS LUTs and exact uniforms (sky_dump.json).
// Variants isolate the two suspected divergences from the MIT reference:
//   forward: 'port' (coord = A*A) vs 'ref' (coord = 1 - A*A)  [uvToSkyViewLutParams above-horizon]
//   phase:   'port' (denom 1+g^2-2g*arg, called with -c) vs 'ref' (denom 1+g^2+2g*arg, called with -c)
import { readFileSync } from 'node:fs';
const D = JSON.parse(readFileSync('sky_dump.json', 'utf8'));
const U = D.uniforms;

// ---------- vec helpers ----------
const V = (x, y, z) => [x, y, z];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const len = a => Math.hypot(a[0], a[1], a[2]);
const norm = a => mul(a, 1 / len(a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sat1 = x => Math.min(1, Math.max(0, x));
const sat3 = v => v.map(sat1);

// ---------- LUT sampling (LinearFilter + ClampToEdge, texel centers) ----------
function sample2D(lut, u, v) {
  const { w, h, data } = lut;
  const px = u * w - 0.5, py = v * h - 0.5;
  const x0 = Math.floor(px), y0 = Math.floor(py);
  const fx = px - x0, fy = py - y0;
  const cl = (i, n) => Math.min(n - 1, Math.max(0, i));
  const at = (x, y) => { const i = (cl(y, h) * w + cl(x, w)) * 4; return [data[i], data[i + 1], data[i + 2]]; };
  const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
  return [0, 1, 2].map(k => (a[k] * (1 - fx) * (1 - fy) + b[k] * fx * (1 - fy) + c[k] * (1 - fx) * fy + d[k] * fx * fy));
}

// ---------- medium ----------
function sampleMedium(P) {
  const vh = len(P) - U.uBottomRadius;
  const dMie = Math.exp(U.uMieDensityExpScale * vh);
  const dRay = Math.exp(U.uRayleighDensityExpScale * vh);
  const dOzo = sat1(vh < U.uAbsorptionDensity0LayerWidth
    ? U.uAbsorptionDensity0LinearTerm * vh + U.uAbsorptionDensity0ConstantTerm
    : U.uAbsorptionDensity1LinearTerm * vh + U.uAbsorptionDensity1ConstantTerm);
  const scMie = mul(U.uMieScattering, dMie), exMie = mul(U.uMieExtinction, dMie);
  const scRay = mul(U.uRayleighScattering, dRay);
  const exOzo = mul(U.uAbsorptionExtinction, dOzo);
  return {
    scattering: add(add(scMie, scRay), [0, 0, 0]),
    extinction: add(add(exMie, scRay), exOzo),
    scatteringMie: scMie, scatteringRay: scRay,
  };
}

// ---------- phases ----------
const PI = Math.PI;
const rayleighPhase = c => 3 / (16 * PI) * (1 + c * c);
function cornette(g, arg, mode) {
  const k = 3 / (8 * PI) * (1 - g * g) / (2 + g * g);
  const denom = mode === 'ref' ? 1 + g * g + 2 * g * arg : 1 + g * g - 2 * g * arg; // ref: -2g*-arg ; port: +2g*-arg
  return k * (1 + arg * arg) / Math.pow(denom, 1.5);
}

// ---------- geometry ----------
function raySphereNearest(r0, rd, s0, sR) {
  const a = dot(rd, rd);
  const s0_r0 = sub(r0, s0);
  const b = 2 * dot(rd, s0_r0);
  const c = dot(s0_r0, s0_r0) - sR * sR;
  const delta = b * b - 4 * a * c;
  if (delta < 0 || a === 0) return -1;
  const sol0 = (-b - Math.sqrt(delta)) / (2 * a), sol1 = (-b + Math.sqrt(delta)) / (2 * a);
  if (sol0 < 0 && sol1 < 0) return -1;
  if (sol0 < 0) return Math.max(0, sol1);
  if (sol1 < 0) return Math.max(0, sol0);
  return Math.max(0, Math.min(sol0, sol1));
}
const PRO = 0.01;
function moveToTop(pos, dir) {
  const vh = len(pos);
  if (vh > U.uTopRadius) {
    const t = raySphereNearest(pos, dir, [0, 0, 0], U.uTopRadius);
    if (t >= 0) { pos = sub(add(pos, mul(dir, t)), mul(norm(pos), PRO)); return [pos, true]; }
    return [pos, false];
  }
  return [pos, true];
}
function lutTransToUv(pHeight, sunZenithCos) {
  const H = Math.sqrt(Math.max(0, U.uTopRadius ** 2 - U.uBottomRadius ** 2));
  const rho = Math.sqrt(Math.max(0, pHeight * pHeight - U.uBottomRadius ** 2));
  const disc = pHeight * pHeight * (sunZenithCos * sunZenithCos - 1) + U.uTopRadius ** 2;
  const d = Math.max(0, -pHeight * sunZenithCos + Math.sqrt(disc));
  const dMin = U.uTopRadius - pHeight, dMax = rho + H;
  return [(d - dMin) / (dMax - dMin), rho / H];
}
function msUv(sunZenithCos, pHeight) {
  let u = sat1(sunZenithCos * 0.5 + 0.5), v = sat1((pHeight - U.uBottomRadius) / (U.uTopRadius - U.uBottomRadius));
  const f = (x, res) => (x + 0.5 / res) * (res / (res + 1));
  return [f(u, 32), f(v, 32)];
}

// ---------- the march (sky-view pass: 30 samples, variable, mieRayPhase=true, MULTISCAT on) ----------
function march(worldPos, worldDir, sunDir, phaseMode) {
  const O = [0, 0, 0];
  let tBottom = raySphereNearest(worldPos, worldDir, O, U.uBottomRadius);
  let tTop = raySphereNearest(worldPos, worldDir, O, U.uTopRadius);
  let tMax = 0;
  if (tBottom < 0) { if (tTop < 0) return [0, 0, 0]; tMax = tTop; }
  else if (tTop > 0) tMax = Math.min(tTop, tBottom);
  tMax = Math.min(tMax, 9000000);
  let sampleCount = 30, scFloor = 30, tMaxFloor = tMax;
  sampleCount = 4 + (14 - 4) * sat1(tMax * 0.01);
  scFloor = Math.floor(sampleCount);
  tMaxFloor = tMax * scFloor / sampleCount;
  const uniformPhase = 1 / (4 * PI);
  const cosTheta = dot(sunDir, worldDir);
  const miePhase = cornette(U.uMiePhaseG, -cosTheta, phaseMode); // call-site negation (both ref and port)
  const rayleigh = rayleighPhase(cosTheta);
  const globalL = U.uSunIlluminance;
  let L = [0, 0, 0], throughput = [1, 1, 1];
  let t = 0, dt = tMax / Math.max(sampleCount, 1);
  const SST = 0.3;
  for (let s = 0; s < sampleCount; s++) {
    let t0 = s / scFloor, t1 = (s + 1) / scFloor;
    t0 = t0 * t0; t1 = t1 * t1;
    t0 = tMaxFloor * t0;
    t1 = t1 > 1 ? tMax : tMaxFloor * t1;
    t = t0 + (t1 - t0) * SST; dt = t1 - t0;
    const P = add(worldPos, mul(worldDir, t));
    const med = sampleMedium(P);
    const so = med.extinction.map(e => e * dt);
    const st = so.map(o => Math.exp(-o));
    const pHeight = len(P);
    const up = mul(P, 1 / pHeight);
    const sunZ = dot(sunDir, up);
    const [tu, tv] = lutTransToUv(pHeight, sunZ);
    const transToSun = sample2D(D.transmittance, tu, tv);
    const pts = add(mul(med.scatteringMie, miePhase), mul(med.scatteringRay, rayleigh));
    const tEarth = raySphereNearest(P, sunDir, add(O, mul(up, PRO)), U.uBottomRadius);
    const shadow = tEarth >= 0 ? 0 : 1;
    const [mu, mv] = msUv(sunZ, pHeight);
    const ms = sample2D(D.multiscat, mu, mv);
    const S = globalL.map((g, k) => g * (shadow * transToSun[k] * pts[k] + ms[k] * med.scattering[k]));
    const Sint = S.map((sv, k) => (sv - sv * st[k]) / med.extinction[k]);
    L = L.map((lv, k) => lv + throughput[k] * Sint[k]);
    throughput = throughput.map((tp, k) => tp * st[k]);
  }
  return L;
}

// ---------- sky-view forward parametrizations ----------
const SWW = 192, SWH = 108;
const fromSub = (u, res) => (u - 0.5 / res) * (res / (res - 1));
function uvToSkyView(uv, vh, forwardMode) {
  const u = fromSub(uv[0], SWW), v = fromSub(uv[1], SWH);
  const Vh = Math.sqrt(vh * vh - U.uBottomRadius ** 2);
  const cosBeta = Vh / vh;
  const beta = Math.acos(cosBeta);
  const zha = PI - beta;
  let vzc;
  if (v < 0.5) {
    const A = 1 - 2 * v;
    const coord = forwardMode === 'port' ? A * A : 1 - A * A; // port: A^2 ; ref: 1-A^2
    vzc = Math.cos(zha * coord);
  } else {
    const coord = v * 2 - 1;
    vzc = Math.cos(zha + beta * coord * coord);
  }
  const cx = u * u;
  const lvca = -(cx * 2 - 1);
  return [vzc, lvca];
}

// ---------- bake one LUT ----------
function bakeSkyView(forwardMode, phaseMode) {
  const vh = len(U.uCameraPosKm);
  const up = mul(U.uCameraPosKm, 1 / vh);
  const sunZ = dot(up, U.uSunDir);
  const sunDir = norm([Math.sqrt(Math.max(0, 1 - sunZ * sunZ)), sunZ, 0]);
  const out = new Float32Array(SWW * SWH * 4);
  for (let j = 0; j < SWH; j++) for (let i = 0; i < SWW; i++) {
    const uv = [(i + 0.5) / SWW, (j + 0.5) / SWH];
    const [vzc, lvca] = uvToSkyView(uv, vh, forwardMode);
    const worldPos = [0, vh, 0];
    const vzsa = Math.sqrt(Math.max(0, 1 - vzc * vzc));
    let worldDir = [vzsa * lvca, vzc, vzsa * Math.sqrt(Math.max(0, 1 - lvca * lvca))];
    let pos = worldPos, ok = true;
    [pos, ok] = moveToTop(worldPos, worldDir);
    const L = ok ? march(pos, worldDir, sunDir, phaseMode) : [0, 0, 0];
    const o = (j * SWW + i) * 4;
    out[o] = L[0]; out[o + 1] = L[1]; out[o + 2] = L[2]; out[o + 3] = 1;
  }
  return { w: SWW, h: SWH, data: out };
}

// ---------- compare ----------
const gpu = D.skyview;
const variants = {
  'PORT (as shipped)': bakeSkyView('port', 'port'),
  'REF forward + PORT phase': bakeSkyView('ref', 'port'),
  'PORT forward + REF phase': bakeSkyView('port', 'ref'),
  'REF (both fixed)': bakeSkyView('ref', 'ref'),
};
const relErr = (a, b) => {
  let e = 0, n = 0, mx = 0;
  for (let i = 0; i < a.data.length; i += 4) for (let k = 0; k < 3; k++) {
    const av = a.data[i + k], bv = b.data[i + k];
    const d = Math.abs(av - bv) / Math.max(1e-9, Math.abs(bv)); e += d; n++; if (d > mx) mx = d;
  }
  return { mean: +(e / n).toFixed(4), max: +mx.toFixed(3) };
};
console.log('harness validation: PORT(as shipped) vs GPU dump:', JSON.stringify(relErr(variants['PORT (as shipped)'], gpu)));

const rowOf = (lut, y) => { let r = 0, g = 0, b = 0; for (let x = 0; x < lut.w; x++) { const i = (y * lut.w + x) * 4; r += lut.data[i]; g += lut.data[i + 1]; b += lut.data[i + 2]; } return [r / lut.w, g / lut.w, b / lut.w].map(v => +v.toFixed(4)); };
for (const [name, lut] of Object.entries(variants)) {
  const rows = [0, 6, 27, 53].map(y => rowOf(lut, y));
  console.log(`${name}: row0=${rows[0]} row6=${rows[1]} row27=${rows[2]} row53=${rows[3]}`);
}
// sun-side (uv.x<0.5) vs anti-sun luminance, above horizon rows only
for (const [name, lut] of Object.entries(variants)) {
  let L = 0, R = 0, n = 0;
  for (let y = 0; y < 54; y++) for (let x = 0; x < lut.w; x++) {
    const i = (y * lut.w + x) * 4;
    const l = 0.2126 * lut.data[i] + 0.7152 * lut.data[i + 1] + 0.0722 * lut.data[i + 2];
    if (x < lut.w / 2) L += l; else R += l; n++;
  }
  console.log(`${name}: sunSide(uv.x<.5)=${(L / n).toFixed(5)} antiSun=${(R / n).toFixed(5)} ratio=${(L / Math.max(1e-9, R)).toFixed(2)}`);
}
