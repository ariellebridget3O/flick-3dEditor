// ============================================================================
// fn: MLr   (bundle minified: function MLr()
// char range: 5457208..5457367   (byte range: 5465476..5465635)
// purpose: zoom to id: center on footprint, pxPerM=Uhe, fitted
// params: state, fps, id -> state
// closure/global deps (auto-derived, approximate): MLr, centerX, centerZ, pxPerM, Uhe, fitted
// ============================================================================
function MLr(t,e,n){const r=e.find(s=>s.id===n)?.footprint;return!r||t.view.widthPx===0?t:{...t,view:{...t.view,centerX:r.x,centerZ:r.z,pxPerM:Uhe},fitted:!0}}
