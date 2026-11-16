// ============================================================================
// fn: Ait   (bundle minified: function Ait()
// char range: 5520872..5520967   (byte range: 5529140..5529235)
// purpose: cumulative arc length of samples
// params: samples -> cumsum[]
// closure/global deps (auto-derived, approximate): r, n, Ait
// ============================================================================
function Ait(t){let e=0;return t.map((n,r)=>(r&&(e+=Math.hypot(n.x-t[r-1].x,n.z-t[r-1].z)),e))}
