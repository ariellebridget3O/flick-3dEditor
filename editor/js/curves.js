// curves.js — anchor/curve subsystem (mT/nx/MR/oq/Yae/E2r — analysis/TRACK_SYSTEM.md §3).
const BEZ_SAMPLES = 12; // Ptt

export function buildTangents(points) { // mT — sqrt-chordal Catmull-Rom tangents → {pos,in,out}
  // (bundle @3926329: chord metric n=(l,c)=>Math.sqrt(xU(l,c)) — NOT plain chordal;
  //  the sqrt cancels only at the end anchors, so out[0]=(next-cur)/3 still holds there)
  const n = points.length;
  if (n === 0) return [];
  if (n === 1) return [{ pos: [...points[0]], in: [0, 0, 0], out: [0, 0, 0] }];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const chord = (a, b) => Math.sqrt(dist(a, b));   // ← sqrt metric (mT's n)
  const mul = (v, k) => [v[0] * k, v[1] * k, v[2] * k];
  const sub = (a, b, k) => [(a[0] - b[0]) * k, (a[1] - b[1]) * k, (a[2] - b[2]) * k];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const out = [];
  for (let i = 0; i < n; i++) {
    const prev = points[i - 1] ?? points[i], cur = points[i], next = points[i + 1] ?? points[i];
    const h = chord(prev, cur) || 1;
    const f = chord(cur, next) || 1;
    const m = i === 0 ? sub(next, cur, 1 / f)
      : i === n - 1 ? sub(cur, prev, 1 / h)
        : add(add(sub(next, cur, 1 / f), sub(next, prev, -1 / (h + f))), sub(cur, prev, 1 / h));
    out.push({
      pos: [...cur],
      in: i === 0 ? [0, 0, 0] : mul(m, -h / 3),
      out: i === n - 1 ? [0, 0, 0] : mul(m, f / 3),
    });
  }
  return out;
}

function bez3(p0, c1, c2, p1, t) { // E2r
  const a = 1 - t, o = a * a * a, l = 3 * a * a * t, c = 3 * a * t * t, d = t * t * t;
  return [
    o * p0[0] + l * c1[0] + c * c2[0] + d * p1[0],
    o * p0[1] + l * c1[1] + c * c2[1] + d * p1[1],
    o * p0[2] + l * c1[2] + c * c2[2] + d * p1[2],
  ];
}
const bez1 = (p0, c1, c2, p1, t) => { const a = 1 - t; return a * a * a * p0 + 3 * a * a * t * c1 + 3 * a * t * t * c2 + t * t * t * p1; };

const polyCache = new WeakMap();
export function polylineOf(anchors) { // nx — dense polyline, WeakMap-cached
  if (polyCache.has(anchors)) return polyCache.get(anchors);
  let pts;
  if (anchors.length < 2) pts = anchors.map(a => [...a.pos]);
  else {
    pts = [[...anchors[0].pos]];
    for (let i = 0; i < anchors.length - 1; i++) {
      const s = anchors[i], a = anchors[i + 1];
      const c1 = [s.pos[0] + s.out[0], s.pos[1] + s.out[1], s.pos[2] + s.out[2]];
      const c2 = [a.pos[0] + a.in[0], a.pos[1] + a.in[1], a.pos[2] + a.in[2]];
      for (let j = 1; j <= BEZ_SAMPLES; j++) pts.push(bez3(s.pos, c1, c2, a.pos, j / BEZ_SAMPLES));
    }
  }
  polyCache.set(anchors, pts);
  return pts;
}

const segLen = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function arcLength(pts) { // MR
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += segLen(pts[i - 1], pts[i]);
  return L;
}

export function pointAtDistance(pts, d) { // oq
  if (!pts[0]) return [0, 0, 0];
  if (pts.length === 1 || d <= 0) return [...pts[0]];
  let r = d;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], seg = segLen(a, b);
    if (r <= seg && seg > 0) {
      const f = r / seg;
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    }
    r -= seg;
  }
  return [...pts[pts.length - 1]];
}

export function tangentAtDistance(pts, d) { // Yae — unit tangent, interp of adjacent segment tangents
  const segT = i => {
    const a = pts[i - 1], b = pts[i], L = segLen(a, b);
    return L === 0 ? null : [(b[0] - a[0]) / L, (b[1] - a[1]) / L, (b[2] - a[2]) / L];
  };
  const nextNZ = i => { for (let l = i; l < pts.length; l++) { const t = segT(l); if (t) return t; } return null; };
  let s = Math.max(0, d), last = null;
  for (let i = 1; i < pts.length; i++) {
    const L = segLen(pts[i - 1], pts[i]);
    if (L === 0) continue;
    const u = segT(i); last = u;
    if (s <= L) {
      const v = nextNZ(i + 1);
      if (!v) return u;
      const f = s / L;
      const t = [u[0] + (v[0] - u[0]) * f, u[1] + (v[1] - u[1]) * f, u[2] + (v[2] - u[2]) * f];
      const n = Math.hypot(...t) || 1;
      return [t[0] / n, t[1] / n, t[2] / n];
    }
    s -= L;
  }
  return last ?? [0, 0, -1];
}

// distance-vs-time with pace (khe): pace maps time-fraction → distance-fraction; held = standing still
export function pacedDistance(item, pts, elapsedS) {
  const naive = elapsedS * item.speedUnitsPerS;
  const pace = item.pace, total = pace ? arcLength(pts) : 0;
  if (!pace || !(total > 0)) return { distance: naive, held: false };
  const o = Math.min(1, Math.max(0, naive / total)) * (pace.length - 1);
  const l = Math.min(pace.length - 2, Math.floor(o));
  const c = pace[l], d = pace[l + 1];
  return { distance: (c + (d - c) * (o - l)) * total, held: c === d };
}

// heightCurve eval (ZA): cubic bezier in (u, heightM) space; binary-search u for time-fraction
export function heightAt(curve, t01) {
  const n = Math.min(1, Math.max(0, t01));
  if (!curve || curve.length === 0) return 0;
  let r = 0;
  while (r < curve.length - 2 && n > curve[r + 1].u) r++;
  const s = curve[r], a = curve[r + 1];
  const c1u = Math.min(s.u + s.out[0], a.u);
  const c2u = Math.max(a.u + a.in[0], s.u);
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) {
    const f = (lo + hi) / 2;
    bez1(s.u, c1u, c2u, a.u, f) < n ? lo = f : hi = f;
  }
  const u = (lo + hi) / 2;
  return Math.max(0, bez1(s.heightM, s.heightM + s.out[1], a.heightM + a.in[1], a.heightM, u));
}

// display polyline for cam-path with heightCurve (Q2r): 64 samples, y replaced by curve;
// time span = the item's durationS (yd), not arc/speed
export function curveDisplayPoints(item) {
  const pts = polylineOf(item.anchors);
  if (item.kind !== 'cam-path' || !item.heightCurve || pts.length < 2) return pts;
  const RES = 64; // Btt
  const total = arcLength(pts);
  const dur = item.durationS ?? (total / item.speedUnitsPerS);
  const out = [];
  for (let i = 0; i < RES; i++) {
    const u = i / (RES - 1);
    const { distance } = pacedDistance(item, pts, u * dur);
    const p = pointAtDistance(pts, distance);
    out.push([p[0], heightAt(item.heightCurve, u), p[2]]);
  }
  return out;
}

// nearest segment in XZ (j2r — straight CHORDS between anchor positions, not the bezier
// polyline; returns [startIndex, dist] where startIndex = the START anchor of the nearest chord)
export function nearestSegmentXZ(anchors, p) {
  if (anchors.length < 2) return [0, Infinity];
  let best = { segmentIndex: 0, distance: Infinity };
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i].pos, b = anchors[i + 1].pos;
    const dx = b[0] - a[0], dz = b[2] - a[2];
    const L2 = dx * dx + dz * dz;
    const t = L2 === 0 ? 0 : Math.min(1, Math.max(0, ((p[0] - a[0]) * dx + (p[2] - a[2]) * dz) / L2));
    const d = Math.hypot(a[0] + dx * t - p[0], a[2] + dz * t - p[2]);
    if (d < best.distance) best = { segmentIndex: i, distance: d };
  }
  return [best.segmentIndex, best.distance];
}
