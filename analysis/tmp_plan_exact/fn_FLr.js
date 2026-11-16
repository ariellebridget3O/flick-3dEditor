// ============================================================================
// fn: FLr   (bundle minified: function FLr()
// char range: 5457713..5457851   (byte range: 5465981..5466119)
// purpose: centerOn id (no zoom change)
// params: state, fps, id -> state
// closure/global deps (auto-derived, approximate): FLr, centerX, centerZ
// ============================================================================
function FLr(t,e,n){const r=e.find(s=>s.id===n)?.footprint;return!r||t.view.widthPx===0?t:{...t,view:{...t.view,centerX:r.x,centerZ:r.z}}}
