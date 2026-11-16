// ============================================================================
// fn: W5r   (bundle minified: function W5r()
// char range: 5139339..5139472   (byte range: 5155395..5155528)
// size: 133 chars / 133 bytes
// purpose: collision-free placer (no magnet): _ie with obstacles=items, radiusS=0, fallback=MP — used by placeItemS, NOT by the lane drop
// params: items, durationS, desiredStartS -> startS
// closure/global deps (auto-derived, approximate): W5r, _ie, desiredStartS, durationS, obstacles, wie, markersS, radiusS, fallbackStartS, MP
// ============================================================================
function W5r(t,e,n){return _ie({desiredStartS:n,durationS:e,obstacles:t.map(wie),markersS:[],radiusS:0,fallbackStartS:MP(t)}).startS}
