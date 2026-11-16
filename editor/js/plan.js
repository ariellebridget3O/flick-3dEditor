// plan.js — round 6 (C): the 2D top-down plan canvas (live stage-plan/SDr port).
// Spec source: R1 research + analysis/ROUND6_DESIGN.md §C. NOT a 3D view — an editor-UX
// surface that is easier top-down. Key live constants: pxPerM 14..170 default 34; grid 1m
// fade 8→24 + 5m majors; pools .14/.24; paths dash [2,4] 1.4px; group boxes dash [4,3] +8px
// pad label 11px +14 below; move snap .25 (Vie) / rotate 15° (Yat); marker hit 12px.
import * as THREE from 'three';
import { C } from './const.js';
import { showLayout } from './tracks.js';
import { polylineOf, buildTangents, arcLength } from './curves.js';
import { itemDuration } from './schema.js';

const PPM_MIN = 14, PPM_MAX = 170, PPM_DEFAULT = 34;
const FIT_MARGIN = 48;
const MARKER_HIT_PX = 12, FOOT_SLOP_PX = 8;
const MOVE_THRESH_PX = 3, MARQUEE_MIN_PX = 4;
const SNAP_M = 0.25, SNAP_DEG = 15;
const LENS_AHEAD_M = 4.2;
const POOL_A_SEL = 0.24, POOL_A = 0.14;
const Z_ORDER = { prop: 0, cube: 0, sphere: 0, cylinder: 0, group: 0, humanoid: 1, simple_figure: 1, target: 2, spotlight: 3, camera: 3 };  // tit
const fmt1 = v => (Math.round(v * 10) / 10).toFixed(1);

// real three scratch (getWorldPosition/Quaternion need working .set/.copy)
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3();
const _q1 = new THREE.Quaternion();
const _e1 = new THREE.Euler();

export class PlanView {
  constructor(app, host) {
    this.app = app;
    this.host = host;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'plan-canvas';
    this.canvas.dataset.testid = 'stage-plan';
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:none;z-index:2;';
    host.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.view = { cx: 0, cz: 0, pxPerM: PPM_DEFAULT, w: 300, h: 200 };
    this.fitted = false;
    this.drag = null;
    this.drawing = null;      // {charId}
    this.stroke = null;       // [{x,z,t}]
    this.marquee = null;
    this._matchSpeed = true;
    this.rotateHandlePx = null;
    this._wire();
    this._buildBar();
    app.onViewportMode = () => { this.setVisible(app.page?.viewportMode === 'plan'); this.bar.style.display = this.shown() ? 'flex' : 'none'; };
    this.setVisible(app.page?.viewportMode === 'plan');
  }

  shown() { return this.app.page.viewportMode === 'plan' && this.app.page.mode === 'edit' && !this.app.page.playing; }
  setVisible(v) { this.canvas.style.display = v ? 'block' : 'none'; if (v) { this.fitted = false; this.resize(); } }

  // ---------------- projection ----------------
  toPx(x, z) { return { x: this.view.w / 2 + (x - this.view.cx) * this.view.pxPerM, y: this.view.h / 2 + (z - this.view.cz) * this.view.pxPerM }; }
  toWorldAt(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return { x: this.view.cx + (clientX - r.left - this.view.w / 2) / this.view.pxPerM, z: this.view.cz + (clientY - r.top - this.view.h / 2) / this.view.pxPerM };
  }

  resize() {
    const r = this.host.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.view.w = r.width; this.view.h = r.height;
    if (!this.fitted) this.fit();
  }

  fit() {
    const items = this.items();
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, n = 0;
    for (const it of items) {
      const pad = it.fp.shape === 'marker' ? 1.5 : Math.max(it.fp.halfWidthM ?? 0.5, it.fp.halfDepthM ?? 0.5);
      minX = Math.min(minX, it.fp.x - pad); maxX = Math.max(maxX, it.fp.x + pad);
      minZ = Math.min(minZ, it.fp.z - pad); maxZ = Math.max(maxZ, it.fp.z + pad);
      n++;
    }
    if (!n) { this.view.cx = 0; this.view.cz = 0; this.view.pxPerM = PPM_DEFAULT; this.fitted = true; return; }
    const spanX = Math.max(2, maxX - minX), spanZ = Math.max(2, maxZ - minZ);
    this.view.pxPerM = Math.min(PPM_MAX, Math.max(PPM_MIN, Math.min((this.view.w - 2 * FIT_MARGIN) / spanX, (this.view.h - 2 * FIT_MARGIN) / spanZ)));
    this.view.cx = (minX + maxX) / 2; this.view.cz = (minZ + maxZ) / 2;
    this.fitted = true;
  }

  // ---------------- items() ----------------
  items() {
    const app = this.app, objs = app.objects.all();
    const out = [];
    for (const [id, o] of Object.entries(objs)) {
      if (o.kind === 'group') continue;
      const mesh = app.meshById.get(id);
      const pose = this.shownPose(id, o, mesh);
      out.push({ id, kind: o.kind, parentId: o.parentId, name: o.name ?? o.kind, fp: this.footprint(o, pose), pose });
    }
    out.sort((a, b) => (Z_ORDER[a.kind] ?? 0) - (Z_ORDER[b.kind] ?? 0));
    return out;
  }

  shownPose(id, o, mesh) {
    let x = 0, y = 0, z = 0, yaw = 0, sx = 1, sy = 1, sz = 1;
    if (mesh) {
      mesh.updateWorldMatrix(true, false);
      const p = mesh.matrixWorld.decompose(_v1, _q1, _v2);
      x = _v1.x; y = _v1.y; z = _v1.z;
      sx = _v2.x; sy = _v2.y; sz = _v2.z;
      yaw = _e1.setFromQuaternion(_q1, 'YXZ').y;
    } else {
      const st = o.position ?? [0, 0, 0];
      x = st[0]; y = st[1]; z = st[2];
      sx = (o.scale ?? [1, 1, 1])[0]; sz = (o.scale ?? [1, 1, 1])[2];
      yaw = (o.rotation ?? [0, 0, 0])[1];
    }
    const pose = { x, y, z, yaw, sx, sy, sz };
    if (o.kind === 'camera') {
      const [aw, ah] = C.ASPECTS[app.page?.recordAspect ?? '16:9'] ?? C.ASPECTS['16:9'];
      const aspect = aw / ah;
      const focal = o.focalLengthMm ?? 50;
      pose.fovDeg = 2 * Math.atan(35 / Math.max(aspect, 1) / 2 / focal) * 180 / Math.PI;   // Z_ (Lzt 35)
    }
    return pose;
  }

  footprint(o, pose) {  // Dst
    const k = o.kind;
    if (k === 'camera' || k === 'target' || k === 'spotlight') return { shape: 'marker', x: pose.x, z: pose.z, yawRad: pose.yaw, halfWidthM: 0.6, halfDepthM: 0.6 };
    if (k === 'humanoid') return { shape: 'ellipse', x: pose.x, z: pose.z, yawRad: pose.yaw, halfWidthM: 0.26 * pose.sx, halfDepthM: 0.26 * pose.sz };
    if (k === 'simple_figure') { const sA = 1.75 / 1.299; return { shape: 'rect', x: pose.x, z: pose.z, yawRad: pose.yaw, halfWidthM: 0.406 * sA * pose.sx, halfDepthM: 0.289 * sA * pose.sz }; }
    if (k === 'sphere' || k === 'cylinder') { const a = Math.max(pose.sx, 0.2); return { shape: 'ellipse', x: pose.x, z: pose.z, yawRad: pose.yaw, halfWidthM: a / 2, halfDepthM: a / 2 }; }
    const dims = k === 'prop' ? (this.app.propCatalogDims?.(o.propKey) ?? [1, 1, 1]) : [1, 1, 1];
    return { shape: 'rect', x: pose.x, z: pose.z, yawRad: pose.yaw, halfWidthM: Math.max(0.15, dims[0] * pose.sx / 2), halfDepthM: Math.max(0.15, dims[2] * pose.sz / 2) };
  }

  poolOf(item) {
    if (item.kind !== 'spotlight') return null;
    const app = this.app, o = app.objects.get(item.id);
    const pose = item.pose;
    const sc = o?.scale ?? [1, 1, 1];
    const half = Math.min(55, Math.max(3, 16 * (Math.abs(sc[0]) + Math.abs(sc[1]) + Math.abs(sc[2])) / 3)) * Math.PI / 180;   // Rhe
    const dirX = Math.sin(pose.yaw), dirZ = Math.cos(pose.yaw);     // spotlight aims −Z-of-rotation → forward = (sin yaw, cos yaw) in plan coords? use mesh world fwd:
    const mesh = app.meshById.get(item.id);
    let fx = dirX, fz = dirZ;
    if (mesh) {
      mesh.updateWorldMatrix(true, false);
      const m = mesh.matrixWorld.elements;
      fx = m[8]; fz = m[10];       // world −Z column = forward
    }
    if (pose.y <= 0 || fz > -0.05) return null;                     // needs downward aim
    const d = pose.y / -fz;
    if (!Number.isFinite(d) || d <= 0) return null;
    return { x: pose.x + fx * d, z: pose.z + fz * d, radiusM: Math.max(0.4, d * Math.tan(half)), square: o?.spotlight?.shape === 'square' };
  }

  paths() {
    const app = this.app, out = [];
    for (const tr of app.show.show.tracks) {
      for (const it of tr.items) {
        if ((it.kind === 'path' || it.kind === 'cam-path') && (it.anchors?.length ?? 0) > 1) {
          const pts = polylineOf(it.anchors).map(p => ({ x: p[0], z: p[2] }));
          out.push({ id: tr.characterId, kind: it.kind, points: pts, keys: [pts[pts.length - 1]] });
        } else if ((it.kind === 'transform' || it.kind === 'cam-transform') && (it.keys?.length ?? 0) > 1) {
          const keys = [...it.keys].sort((a, b) => a.tS - b.tS);
          const last = keys[keys.length - 1].tS || 1;
          const pts = [];
          for (let i = 0; i <= 40; i++) {
            const tt = i / 40 * last;
            let k0 = keys[0], k1 = keys[keys.length - 1];
            for (let j = 0; j < keys.length - 1; j++) if (tt >= keys[j].tS && tt <= keys[j + 1].tS) { k0 = keys[j]; k1 = keys[j + 1]; break; }
            const f = k1.tS === k0.tS ? 0 : (tt - k0.tS) / (k1.tS - k0.tS);
            pts.push({ x: (k0.position?.[0] ?? 0) + ((k1.position?.[0] ?? 0) - (k0.position?.[0] ?? 0)) * f, z: (k0.position?.[2] ?? 0) + ((k1.position?.[2] ?? 0) - (k0.position?.[2] ?? 0)) * f });
          }
          out.push({ id: tr.characterId, kind: it.kind, points: pts, keys: keys.map(k => ({ x: k.position?.[0] ?? 0, z: k.position?.[2] ?? 0 })) });
        }
      }
    }
    return out;
  }

  // ---------------- painter ----------------
  pal() {
    if (!this.palette) {
      const cs = getComputedStyle(document.documentElement);
      const v = (n, fb) => cs.getPropertyValue(n).trim() || fb;
      this.palette = {
        background: v('--plan-background', '#20242e'), grid: v('--plan-grid', '#3a4152'),
        gridMajor: v('--plan-grid-major', '#4a5468'), human: v('--plan-human', '#7fb2e5'),
        camera: v('--plan-camera', '#9ec7f0'), object: v('--plan-object', '#b8c4d8'),
        light: v('--plan-light', '#f0d8a0'), prop: v('--plan-prop', '#c8d0dc'),
        propEdge: v('--plan-prop-edge', '#8a94a8'), accent: v('--plan-accent', '#e8b25a'),
        accentSoft: v('--plan-accent-soft', 'rgba(232,178,90,.18)'), panel: v('--plan-panel', '#232936'),
        text: v('--plan-text', '#e8ecf4'), textDim: v('--plan-text-dim', '#98a2b8'),
      };
    }
    return this.palette;
  }

  draw() {
    const ctx = this.ctx, P = this.pal(), view = this.view;
    ctx.lineJoin = 'round';
    ctx.fillStyle = P.background;
    ctx.fillRect(0, 0, view.w, view.h);
    const grid = (step, color, alpha, skip5) => {
      if (alpha <= 0.01) return;
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.beginPath();
      const wx0 = view.cx - view.w / 2 / view.pxPerM, wx1 = view.cx + view.w / 2 / view.pxPerM;
      const wz0 = view.cz - view.h / 2 / view.pxPerM, wz1 = view.cz + view.h / 2 / view.pxPerM;
      for (let x = Math.ceil(wx0 / step) * step; x <= wx1; x += step) {
        if (skip5 && Math.round(x / 5) * 5 === Math.round(x * 1e6) / 1e6 * 5 / 5 && Math.abs(x / 5 - Math.round(x / 5)) < 1e-6) continue;
        const p = this.toPx(x, 0);
        ctx.moveTo(Math.round(p.x) + .5, 0); ctx.lineTo(Math.round(p.x) + .5, view.h);
      }
      for (let z = Math.ceil(wz0 / step) * step; z <= wz1; z += step) {
        if (skip5 && Math.abs(z / 5 - Math.round(z / 5)) < 1e-6) continue;
        const p = this.toPx(0, z);
        ctx.moveTo(0, Math.round(p.y) + .5); ctx.lineTo(view.w, Math.round(p.y) + .5);
      }
      ctx.stroke(); ctx.globalAlpha = 1;
    };
    grid(1, P.grid, Math.max(0, Math.min(1, (view.pxPerM - 8) / 16)), true);   // minor skips 5m multiples
    grid(5, P.gridMajor, 1, false);

    const items = this.items();
    const sel = new Set(this.app.objects.selectedIds);
    // pools
    for (const it of items) {
      const pool = this.poolOf(it);
      if (!pool) continue;
      ctx.globalAlpha = sel.has(it.id) ? POOL_A_SEL : POOL_A;
      ctx.fillStyle = P.light;
      const c = this.toPx(pool.x, pool.z), r = Math.max(2, pool.radiusM * view.pxPerM);
      if (pool.square) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(-(it.fp.yawRad ?? 0)); const rr = r * 1.414; ctx.fillRect(-rr, -rr, rr * 2, rr * 2); ctx.restore(); }
      else { ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    // selected paths + stroke
    for (const p of this.paths()) {
      if (!sel.has(p.id)) continue;
      const owner = this.app.objects.get(p.id);
      ctx.strokeStyle = p.kind === 'cam-path' ? P.camera : (owner?.kind === 'humanoid' || owner?.kind === 'simple_figure') ? P.human : P.object;
      ctx.lineWidth = 1.4; ctx.setLineDash([2, 4]);
      ctx.beginPath();
      p.points.forEach((pt, i) => { const c = this.toPx(pt.x, pt.z); i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y); });
      ctx.stroke(); ctx.setLineDash([]);
      for (const k of p.keys) {
        const c = this.toPx(k.x, k.z);
        ctx.fillStyle = P.accent; ctx.strokeStyle = P.panel; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(c.x, c.y - 6.4); ctx.lineTo(c.x + 6.4, c.y); ctx.lineTo(c.x, c.y + 6.4); ctx.lineTo(c.x - 6.4, c.y); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    if (this.stroke?.length > 1) {
      ctx.strokeStyle = P.accent; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath();
      this.stroke.forEach((pt, i) => { const c = this.toPx(pt.x, pt.z); i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y); });
      ctx.stroke();
    }
    // items: non-char then char
    const chars = new Set(['humanoid', 'simple_figure', 'target', 'spotlight', 'camera']);
    for (const it of items) if (!chars.has(it.kind)) this.drawItem(ctx, it, sel.has(it.id));
    for (const it of items) if (chars.has(it.kind)) this.drawItem(ctx, it, sel.has(it.id));
    // group boxes
    const selGroups = new Set([...sel].map(i => this.app.objects.get(i)).filter(o => o?.kind === 'group').map(o => o.id));
    const boxes = new Map();
    for (const it of items) {
      if (!it.parentId || !selGroups.has(it.parentId)) continue;
      const b = boxes.get(it.parentId) ?? { minX: Infinity, minZ: Infinity, maxX: -Infinity, maxZ: -Infinity };
      b.minX = Math.min(b.minX, it.fp.x - (it.fp.halfWidthM ?? 1)); b.maxX = Math.max(b.maxX, it.fp.x + (it.fp.halfWidthM ?? 1));
      b.minZ = Math.min(b.minZ, it.fp.z - (it.fp.halfDepthM ?? 1)); b.maxZ = Math.max(b.maxZ, it.fp.z + (it.fp.halfDepthM ?? 1));
      boxes.set(it.parentId, b);
    }
    ctx.setLineDash([4, 3]); ctx.strokeStyle = P.accent; ctx.lineWidth = 1;
    ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center';
    for (const [gid, b] of boxes) {
      const a = this.toPx(b.minX, b.minZ), c2 = this.toPx(b.maxX, b.maxZ);
      ctx.strokeRect(a.x - 8, a.y - 8, (c2.x - a.x) + 16, (c2.y - a.y) + 16);
      ctx.fillStyle = P.textDim;
      ctx.fillText(this.app.objects.get(gid)?.name ?? 'Group', (a.x + c2.x) / 2, c2.y + 8 + 14);
    }
    ctx.setLineDash([]);
    // callout ring + rotate handle (single selection)
    this.rotateHandlePx = null;
    if (sel.size === 1 && !this.drawing) {
      const it = items.find(i => i.id === [...sel][0]);
      if (it) {
        const c = this.toPx(it.fp.x, it.fp.z);
        const r = it.fp.shape === 'marker' ? 34 : Math.max(it.fp.halfWidthM ?? .5, it.fp.halfDepthM ?? .5) * 1.2 * view.pxPerM + 10;
        ctx.strokeStyle = P.accent; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
        const rh = this.toPx(it.fp.x + Math.sin(it.fp.yawRad ?? 0) * r / view.pxPerM, it.fp.z + Math.cos(it.fp.yawRad ?? 0) * r / view.pxPerM);
        ctx.beginPath(); ctx.arc(rh.x, rh.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = P.panel; ctx.fill(); ctx.strokeStyle = P.accent; ctx.lineWidth = 1.4; ctx.stroke();
        this.rotateHandlePx = rh;
      }
    }
    // marquee
    if (this.marquee && this.marquee.w > 2) {
      const m = this.marquee;
      ctx.fillStyle = P.accentSoft; ctx.fillRect(m.x, m.y, m.w, m.h);
      ctx.setLineDash([4, 3]); ctx.strokeStyle = P.accent; ctx.lineWidth = 1;
      ctx.strokeRect(m.x, m.y, m.w, m.h); ctx.setLineDash([]);
    }
    // edge indicators
    for (const it of items) {
      if (it.kind !== 'camera') continue;
      const c = this.toPx(it.fp.x, it.fp.z);
      if (c.x > 22 && c.x < this.view.w - 22 && c.y > 22 && c.y < this.view.h - 22) continue;
      const x = Math.max(22, Math.min(this.view.w - 22, c.x));
      const y = Math.max(22, Math.min(this.view.h - 22, c.y));
      ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.fillStyle = P.panel; ctx.fill();
      ctx.strokeStyle = P.camera; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = P.camera; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText((it.name.split(' ').pop() || '?'), x, y + 4);
    }
  }

  drawItem(ctx, it, selected) {
    const P = this.pal(), view = this.view, app = this.app;
    const c = this.toPx(it.fp.x, it.fp.z);
    const yaw = it.fp.yawRad ?? 0;
    if (it.kind === 'camera') {
      const [aw, ah] = C.ASPECTS[app.page?.recordAspect ?? '16:9'] ?? C.ASPECTS['16:9'];
      const aspect = aw / ah;
      const half = Math.atan(Math.tan((it.pose.fovDeg ?? 50) * Math.PI / 360) * aspect);
      const f1 = this.toPx(it.fp.x + Math.sin(yaw - half) * LENS_AHEAD_M, it.fp.z + Math.cos(yaw - half) * LENS_AHEAD_M);
      const f2 = this.toPx(it.fp.x + Math.sin(yaw + half) * LENS_AHEAD_M, it.fp.z + Math.cos(yaw + half) * LENS_AHEAD_M);
      ctx.globalAlpha = selected ? 0.2 : 0.1; ctx.fillStyle = P.camera;
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(f1.x, f1.y); ctx.lineTo(f2.x, f2.y); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = selected ? 1 : 0.6; ctx.strokeStyle = P.camera; ctx.lineWidth = selected ? 1.4 : 1; ctx.stroke();
      ctx.globalAlpha = 1;
      const rot = (x, y) => { const cs = Math.cos(yaw), sn = Math.sin(yaw); return { x: c.x + x * cs + y * sn, y: c.y - x * sn + y * cs }; };
      const poly = (pts, stroke, lw) => {
        ctx.beginPath(); pts.forEach((p, i) => { const q = rot(p[0], p[1]); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
        ctx.closePath(); ctx.fillStyle = P.panel; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
      };
      poly([[-9, -1], [9, -1], [9, 11], [-9, 11]], selected ? P.accent : P.camera, selected ? 1.6 : 1.2);
      poly([[-4, -1], [-6.5, -8], [6.5, -8], [4, -1]], selected ? P.accent : P.camera, 1.2);
      ctx.fillStyle = P.textDim; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(it.name + ' · ' + fmt1(it.pose.y) + 'm', c.x + 18, c.y + 26);
    } else if (it.kind === 'spotlight') {
      const pool = this.poolOf(it);
      if (pool) {
        const pc = this.toPx(pool.x, pool.z);
        ctx.setLineDash([3, 3]); ctx.strokeStyle = P.light; ctx.globalAlpha = selected ? 0.9 : 0.5; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(pc.x, pc.y); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
      ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = P.light; ctx.fill();
      ctx.strokeStyle = selected ? P.accent : P.panel; ctx.lineWidth = selected ? 1.6 : 1.2; ctx.stroke();
      if (selected) { ctx.fillStyle = P.textDim; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(it.name, c.x + 12, c.y + 4); }
    } else if (it.kind === 'target') {
      ctx.strokeStyle = selected ? P.accent : P.camera; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c.x - 12, c.y); ctx.lineTo(c.x + 12, c.y); ctx.moveTo(c.x, c.y - 12); ctx.lineTo(c.x, c.y + 12); ctx.stroke();
    } else if (it.kind === 'humanoid') {
      const n = Math.max(6, Math.min(12, view.pxPerM * 0.32));
      ctx.strokeStyle = P.human; ctx.lineWidth = n > 8 ? 2.2 : 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(c.x, c.y - 0.72 * n, 0.3 * n, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - 0.4 * n); ctx.lineTo(c.x, c.y + 0.3 * n);                       // torso
      ctx.moveTo(c.x - 0.6 * n, c.y - 0.12 * n); ctx.lineTo(c.x, c.y - 0.12 * n);           // arms
      ctx.moveTo(c.x + 0.6 * n, c.y - 0.12 * n); ctx.lineTo(c.x, c.y - 0.12 * n);
      ctx.moveTo(c.x - 0.45 * n, c.y + 0.3 * n); ctx.lineTo(c.x - 0.45 * n, c.y + n);       // legs
      ctx.moveTo(c.x + 0.45 * n, c.y + 0.3 * n); ctx.lineTo(c.x + 0.45 * n, c.y + n);
      ctx.stroke();
      const fx = Math.sin(yaw), fz = Math.cos(yaw);   // facing tick 1.35n→2.1n (screen: +z is down; world fwd (sin,cos) maps to screen (sin, cos)·(x, +y))
      ctx.beginPath();
      ctx.moveTo(c.x + fx * 1.35 * n, c.y + fz * 1.35 * n);
      ctx.lineTo(c.x + fx * 2.1 * n, c.y + fz * 2.1 * n);
      ctx.stroke();
      ctx.globalAlpha = selected ? 1 : 0.35; ctx.fillStyle = P.text; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(it.name, c.x + n + 6, c.y + 4); ctx.globalAlpha = 1;
    } else if (it.kind === 'simple_figure') {
      const W = Math.max(3, (it.fp.halfWidthM ?? .3) * view.pxPerM);
      const D = Math.max(2, (it.fp.halfDepthM ?? .2) * view.pxPerM);
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(yaw);
      ctx.fillStyle = P.human; ctx.fillRect(-W, -D, W * 2, D * 2);
      ctx.strokeStyle = selected ? P.accent : P.propEdge; ctx.lineWidth = 1; ctx.strokeRect(-W, -D, W * 2, D * 2);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-W, -D, W * 2, Math.max(1.5, D * 0.4));
      const headR = Math.max(2, 0.168 * (it.pose.sx ?? 1) * view.pxPerM);
      ctx.beginPath(); ctx.arc(0, 0, headR, 0, Math.PI * 2); ctx.fillStyle = P.human; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = Math.max(1.5, headR * 0.3);
      ctx.beginPath(); ctx.arc(0, 0, headR * 0.72, -Math.PI / 2 - 1.257, -Math.PI / 2 + 1.257); ctx.stroke();
      ctx.restore();
    } else {
      const W = Math.max(3, (it.fp.halfWidthM ?? .5) * view.pxPerM), D = Math.max(3, (it.fp.halfDepthM ?? .5) * view.pxPerM);
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(yaw);
      ctx.fillStyle = P.prop; ctx.strokeStyle = selected ? P.accent : P.propEdge; ctx.lineWidth = 1;
      if (it.fp.shape === 'ellipse') { ctx.beginPath(); ctx.ellipse(0, 0, W, D, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      else { ctx.fillRect(-W, -D, W * 2, D * 2); ctx.strokeRect(-W, -D, W * 2, D * 2); }
      ctx.restore();
      if (selected) { ctx.fillStyle = P.textDim; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(it.name, c.x, c.y + D + 14); }
    }
  }

  // ---------------- interactions ----------------
  _wire() {
    const cv = this.canvas;
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('pointerdown', e => this._down(e));
    cv.addEventListener('pointermove', e => this._move(e));
    const up = e => this._up(e);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        this.zoomAt(e.clientX, e.clientY, Math.max(0.1, 1 - e.deltaY * (Math.abs(e.deltaY) > 20 ? 0.005 : 0.02)));
      } else {
        const k = e.deltaMode === 0 ? 2 : 1;
        this.view.cx += e.deltaX * k / this.view.pxPerM;
        this.view.cz += e.deltaY * k / this.view.pxPerM;
      }
    }, { passive: false });
    window.addEventListener('keydown', e => {
      if (!this.shown() || e.target.tagName === 'INPUT') return;
      if (e.key === 'Escape' && this.drawing) { this.exitDrawing(); e.preventDefault(); }
    });
  }

  zoomAt(clientX, clientY, f) {
    const before = this.toWorldAt(clientX, clientY);
    this.view.pxPerM = Math.min(PPM_MAX, Math.max(PPM_MIN, this.view.pxPerM * f));
    const r = this.canvas.getBoundingClientRect();
    const afterPx = this.toPx(before.x, before.z);
    this.view.cx += (clientX - r.left - afterPx.x) / this.view.pxPerM;
    this.view.cz += (clientY - r.top - afterPx.y) / this.view.pxPerM;
  }

  hitAt(px, py) {
    const items = this.items();
    const sel = this.app.objects.selectedIds;
    if (sel.length === 1 && this.rotateHandlePx && Math.hypot(px - this.rotateHandlePx.x, py - this.rotateHandlePx.y) <= 8) {
      return { type: 'rotate', item: items.find(i => i.id === sel[0]) };
    }
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const c = this.toPx(it.fp.x, it.fp.z);
      if (it.fp.shape === 'marker') { if (Math.hypot(px - c.x, py - c.y) <= MARKER_HIT_PX) return { type: 'item', item: it }; continue; }
      const W = Math.max((it.fp.halfWidthM ?? .5) * this.view.pxPerM, FOOT_SLOP_PX);
      const D = Math.max((it.fp.halfDepthM ?? .5) * this.view.pxPerM, FOOT_SLOP_PX);
      const dx = px - c.x, dy = py - c.y;
      const cs = Math.cos(it.fp.yawRad ?? 0), sn = Math.sin(it.fp.yawRad ?? 0);
      const rx = dx * cs + dy * sn, ry = -dx * sn + dy * cs;
      const inside = it.fp.shape === 'ellipse'
        ? (rx / W) ** 2 + (ry / D) ** 2 <= 1.2
        : Math.abs(rx) <= W && Math.abs(ry) <= D;
      if (inside) return { type: 'item', item: it };
    }
    return null;
  }

  _down(e) {
    if (!this.shown()) return;
    const r = this.canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    if (e.button === 1 || e.button === 2) { this.drag = { kind: 'pan', lastX: e.clientX, lastY: e.clientY }; return; }
    if (e.button !== 0) return;
    if (this.drawing) { this.drag = { kind: 'draw' }; return; }
    const hit = this.hitAt(px, py);
    if (hit?.type === 'rotate') { this.drag = { kind: 'rotate', item: hit.item, snap: e.shiftKey }; return; }
    if (hit?.type === 'item') {
      let id = hit.item.id;
      const o = this.app.objects.get(id);
      const parent = o?.parentId ? this.app.objects.get(o.parentId) : null;
      if (parent?.kind === 'group' && !['camera', 'target', 'spotlight'].includes(o.kind)) id = o.parentId;   // plan promotion parentId ?? id
      if (e.shiftKey) this.app.objects.toggleSelect(id);
      else this.app.objects.select([id]);
      const base = new Map();
      for (const i2 of this.app.objects.selectedIds) {
        const oo = this.app.objects.get(i2);
        base.set(i2, { x: oo?.position?.[0] ?? 0, z: oo?.position?.[2] ?? 0, y: oo?.position?.[1] ?? 0 });
      }
      this.drag = { kind: 'move', ids: [...this.app.objects.selectedIds], base, snap: e.shiftKey, downPx: { x: px, y: py }, downW: this.toWorldAt(e.clientX, e.clientY), moved: false };
      this.app.show.beginEditGesture();
      return;
    }
    this.drag = { kind: 'marquee', x: px, y: py, shift: e.shiftKey, base: e.shiftKey ? [...this.app.objects.selectedIds] : [] };
    this.marquee = { x: px, y: py, w: 0, h: 0 };
  }

  _move(e) {
    if (!this.drag || !this.shown()) return;
    const r = this.canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const app = this.app;
    if (this.drag.kind === 'pan') {
      this.view.cx -= (e.clientX - this.drag.lastX) / this.view.pxPerM;
      this.view.cz -= (e.clientY - this.drag.lastY) / this.view.pxPerM;
      this.drag.lastX = e.clientX; this.drag.lastY = e.clientY;
    } else if (this.drag.kind === 'marquee') {
      this.marquee = { x: Math.min(this.drag.x, px), y: Math.min(this.drag.y, py), w: Math.abs(px - this.drag.x), h: Math.abs(py - this.drag.y) };
    } else if (this.drag.kind === 'draw') {
      const w = this.toWorldAt(e.clientX, e.clientY);
      const last = this.stroke[this.stroke.length - 1];
      if (!last || Math.hypot(w.x - last.x, w.z - last.z) > 0.04) {
        this.stroke.push({ x: w.x, z: w.z, t: (performance.now() - this._t0) / 1000 });
      }
    } else if (this.drag.kind === 'rotate') {
      const it = this.drag.item;
      if (!it) return;
      const c = this.toPx(it.fp.x, it.fp.z);
      let yaw = Math.atan2(px - c.x, -(py - c.y));    // screen-up = world −Z
      if (this.drag.snap) yaw = Math.round(yaw / SNAP_DEG * Math.PI / 180) * SNAP_DEG * Math.PI / 180;
      const o = app.objects.get(it.id);
      if (o) { app.objects.update(it.id, { rotation: [(o.rotation?.[0]) ?? 0, yaw, (o.rotation?.[2]) ?? 0] }); app.objects.changed(); }
    } else if (this.drag.kind === 'move') {
      const d = this.drag;
      if (!d.moved) {
        if (Math.hypot(px - d.downPx.x, py - d.downPx.y) < MOVE_THRESH_PX) return;
        d.moved = true;
      }
      const w = this.toWorldAt(e.clientX, e.clientY);
      let dx = w.x - d.downW.x, dz = w.z - d.downW.z;
      if (d.snap) { dx = Math.round(dx / SNAP_M) * SNAP_M; dz = Math.round(dz / SNAP_M) * SNAP_M; }
      for (const id of d.ids) {
        const b = d.base.get(id);
        const o = app.objects.get(id);
        if (!b || !o) continue;
        app.objects.update(id, { position: [b.x + dx, b.y, b.z + dz] });
      }
      app.objects.changed();
    }
  }

  _up() {
    const app = this.app;
    if (!this.drag) return;
    const d = this.drag;
    this.drag = null;
    if (d.kind === 'move') { app.show.endEditGesture(); return; }
    if (d.kind === 'marquee') {
      const m = this.marquee;
      this.marquee = null;
      if (m && m.w >= MARQUEE_MIN_PX && m.h >= MARQUEE_MIN_PX) {
        const items = this.items();
        const picked = [];
        for (const it of items) {
          const c = this.toPx(it.fp.x, it.fp.z);
          const pad = it.fp.shape === 'marker' ? 12 : 0;
          if (c.x + pad >= m.x && c.x - pad <= m.x + m.w && c.y + pad >= m.y && c.y - pad <= m.y + m.h) {
            const o = app.objects.get(it.id);
            const parent = o?.parentId ? app.objects.get(o.parentId) : null;
            picked.push(parent?.kind === 'group' && !['camera', 'target', 'spotlight'].includes(o.kind) ? o.parentId : it.id);
          }
        }
        app.select ? null : null;
        app.objects.select([...new Set([...d.base, ...picked])]);
      }
      return;
    }
    if (d.kind === 'draw') { this.finishStroke(); return; }
  }

  // ---------------- draw-direction ----------------
  drawingFor() {
    const sel = this.app.objects.selectedId;
    if (!sel) return null;
    const o = this.app.objects.get(sel);
    if (!o) return null;
    if (o.kind === 'camera') return sel;
    if (['humanoid', 'simple_figure', 'cube', 'sphere', 'cylinder', 'prop', 'spotlight'].includes(o.kind)) return sel;
    return null;
  }
  hasPathFor(id) {
    const tr = this.app.show.trackOf(id);
    return !!tr?.items.some(it => (it.kind === 'path' || it.kind === 'cam-path') && (it.anchors?.length ?? 0) > 1);
  }
  startDrawing() {
    const id = this.drawingFor();
    if (!id) return false;
    this.drawing = { charId: id };
    this.stroke = [];
    this._t0 = performance.now();
    this.app.page.seek(0);                       // drawing rewinds the show
    if (this.app.page.playing) this.app.page.setPlaying?.(false);
    return true;
  }
  exitDrawing() { this.drawing = null; this.stroke = null; }

  finishStroke() {
    if (!this.drawing) return;
    const id = this.drawing.charId;
    const samples = this.stroke ?? [];
    if (samples.length < 3) { this.exitDrawing(); return; }
    const arc = samples.reduce((s, p, i) => i ? s + Math.hypot(p.x - samples[i - 1].x, p.z - samples[i - 1].z) : 0, 0);
    if (arc < 0.3) { this.exitDrawing(); return; }          // fHr
    this.exitDrawing();
    // ¼-smoothing ×2
    let pts = samples.map(s => ({ x: s.x, z: s.z }));
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < pts.length - 1; i++) {
        pts[i] = { x: (pts[i - 1].x + 2 * pts[i].x + pts[i + 1].x) / 4, z: (pts[i - 1].z + 2 * pts[i].z + pts[i + 1].z) / 4 };
      }
    }
    const anchors = [pts[0]];
    for (const p of pts) if (Math.hypot(p.x - anchors[anchors.length - 1].x, p.z - anchors[anchors.length - 1].z) >= 0.2) anchors.push(p);
    if (anchors.length < 2) return;
    const o = this.app.objects.get(id);
    const dur = Math.max(0.5, samples[samples.length - 1].t ?? 1);
    const steady = this._matchSpeed !== false;
    const speed = steady ? (o.kind === 'camera' ? 2 : 1.4) : Math.max(0.01, arc / dur);
    const threeD = anchors.map(a => [a.x, o.position?.[1] ?? 0, a.z]);
    this.app.show.beginEditGesture();
    try {
      if (o.kind === 'camera') this.app.show.addItem(id, { kind: 'cam-path', anchors: buildTangents(threeD), speedUnitsPerS: speed, aim: 'travel' });
      else if (o.kind === 'humanoid' || o.kind === 'simple_figure') this.app.show.addItem(id, { kind: 'path', anchors: buildTangents(threeD), speedUnitsPerS: speed, gait: 'walk', aim: 'travel' });
      else this.app.show.addItem(id, { kind: 'path', anchors: buildTangents(threeD), speedUnitsPerS: speed, aim: 'locked' });
    } finally { this.app.show.endEditGesture(); }
  }

  // ---------------- plan bar (draw pill + match speed + fit + zoom%) ----------------
  _buildBar() {
    const bar = document.createElement('div');
    bar.className = 'plan-bar';
    bar.style.cssText = 'position:absolute;left:10px;top:10px;z-index:6;display:none;gap:6px;align-items:center;'
      + 'background:rgba(30,34,46,.78);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.08);'
      + 'border-radius:8px;padding:4px 6px;';
    bar.innerHTML = `
      <button id="pbDraw" title="Draw a path with your pointer — the show rewinds and plays while you draw">✎ Draw path</button>
      <label style="display:flex;gap:4px;align-items:center;font-size:11px;color:#98a2b8;cursor:pointer" title="Match the walk speed to your drawing speed (off = constant speed)">
        <input type="checkbox" id="pbMatch" checked> match speed</label>
      <span style="width:1px;height:16px;background:rgba(255,255,255,.12)"></span>
      <button id="pbFit" title="Zoom to fit (⌘/Ctrl + wheel zooms)">Fit</button>
      <span id="pbZoom" style="font-size:11px;color:#98a2b8;min-width:38px;text-align:right">100%</span>`;
    this.host.appendChild(bar);
    this.bar = bar;
    const drawBtn = bar.querySelector('#pbDraw'), fitBtn = bar.querySelector('#pbFit');
    const zoomEl = bar.querySelector('#pbZoom');
    this._zoomEl = zoomEl;
    drawBtn.onclick = () => {
      if (this.drawing) { this.exitDrawing(); this._syncBar(); return; }
      if (this.startDrawing()) this._syncBar();
      else { this.app.toast('Select a Human, Camera or object first (groups can\u2019t draw)'); }
    };
    bar.querySelector('#pbMatch').onchange = e => { this._matchSpeed = e.target.checked; };
    fitBtn.onclick = () => { this.fitted = false; this.resize(); this._syncBar(); };
    this._syncBar = () => {
      const has = this.drawingFor() && !this.drawing;
      drawBtn.classList.toggle('on', !!this.drawing);
      drawBtn.textContent = this.drawing ? '✓ Finish' : (this.hasPathFor(this.app.objects.selectedId ?? '') ? '✎ Redraw' : '✎ Draw path');
      zoomEl.textContent = Math.round(this.view.pxPerM / PPM_DEFAULT * 100) + '%';
    };
  }
  _syncBar() {}   // replaced by _buildBar

  tick() {
    if (!this.shown()) return;
    this.resize();
    this.draw();
    if (this._zoomEl && this._lastZoom !== this.view.pxPerM) {
      this._lastZoom = this.view.pxPerM;
      this._zoomEl.textContent = Math.round(this.view.pxPerM / PPM_DEFAULT * 100) + '%';
    }
  }
}
