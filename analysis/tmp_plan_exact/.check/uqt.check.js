(() => {
function uqt(t){if(!t.length)return null;const e={minX:1/0,minZ:1/0,maxX:-1/0,maxZ:-1/0};for(const n of t){const r=dqt(n);e.minX=Math.min(e.minX,r.minX),e.minZ=Math.min(e.minZ,r.minZ),e.maxX=Math.max(e.maxX,r.maxX),e.maxZ=Math.max(e.maxZ,r.maxZ)}return e}
});
