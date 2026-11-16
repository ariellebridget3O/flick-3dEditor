// ============================================================================
// fn: S1   (bundle minified: function S1()
// char range: 5252061..5252165   (byte range: 5260314..5260418)
// purpose: px -> world m (inverse of iu)
// params: view, {x,y} px -> {x,z} m
// closure/global deps (auto-derived, approximate): S1, z
// ============================================================================
function S1(t,e){return{x:t.centerX+(e.x-t.widthPx/2)/t.pxPerM,z:t.centerZ+(e.y-t.heightPx/2)/t.pxPerM}}
