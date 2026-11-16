// ============================================================================
// fn: $Zt   (bundle minified: function $Zt()
// char range: 5482966..5483078   (byte range: 5491234..5491346)
// purpose: beginPath + polyline through world points (no stroke)
// params: ctx, view, pts -> void
// closure/global deps (auto-derived, approximate): r, s, $Zt, iu
// ============================================================================
function $Zt(t,e,n){t.beginPath(),n.forEach((r,s)=>{const a=iu(e,r);s===0?t.moveTo(a.x,a.y):t.lineTo(a.x,a.y)})}
