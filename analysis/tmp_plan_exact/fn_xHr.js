// ============================================================================
// fn: xHr   (bundle minified: function xHr()
// char range: 5520413..5520574   (byte range: 5528681..5528842)
// purpose: find dwell spans [startIdx,endIdx] where position unchanged and span >= gHr(.25s) — these become smoothing anchors
// params: samples -> [start,end][]
// closure/global deps (auto-derived, approximate): xHr, gHr
// ============================================================================
function xHr(t){const e=[];let n=0;for(let r=1;r<=t.length;r++){const s=t[r];s&&s.x===t[n].x&&s.z===t[n].z||(t[r-1].t-t[n].t>=gHr&&e.push([n,r-1]),n=r)}return e}
