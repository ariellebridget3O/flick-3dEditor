// ============================================================================
// fn: MDr   (bundle minified: function MDr()
// char range: 5487860..5487924   (byte range: 5496128..5496192)
// purpose: stick figure unit size: clamp(dDr=6, hDr=12, ppm*cDr=.32)
// params: view -> px
// closure/global deps (auto-derived, approximate): MDr, hDr, dDr, cDr
// ============================================================================
function MDr(t){return Math.min(hDr,Math.max(dDr,t.pxPerM*cDr))}
