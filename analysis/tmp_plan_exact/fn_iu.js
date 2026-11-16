// ============================================================================
// fn: iu   (bundle minified: function iu()
// char range: 5251957..5252061   (byte range: 5260210..5260314)
// purpose: world m -> px: {x: w/2+(x-cx)*ppm, y: h/2+(z-cz)*ppm}
// params: view, {x,z} -> {x,y} px
// closure/global deps (auto-derived, approximate): iu, y
// ============================================================================
function iu(t,e){return{x:t.widthPx/2+(e.x-t.centerX)*t.pxPerM,y:t.heightPx/2+(e.z-t.centerZ)*t.pxPerM}}
