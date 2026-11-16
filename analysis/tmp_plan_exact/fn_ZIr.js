// ============================================================================
// fn: ZIr   (bundle minified: function ZIr()
// char range: 5253079..5253293   (byte range: 5261332..5261546)
// purpose: camera label overlay position: ring center + radius, clamped into viewport
// params: item, view, labelDims -> {x,y} px
// closure/global deps (auto-derived, approximate): r, s, a, $2e, o, l, ZIr, center, ringRadiusPx, zDe, WIr, GIr, qIr
// ============================================================================
function ZIr(t,e,n){const{center:r,ringRadiusPx:s}=zDe(t.footprint,e,t.wedgeHalfRad),a=(o,l)=>Math.min(Math.max(o,$2e),l);return{x:a(r.x+s+WIr,e.widthPx-n.widthPx-$2e),y:a(r.y-s*GIr-qIr,e.heightPx-n.heightPx-$2e)}}
