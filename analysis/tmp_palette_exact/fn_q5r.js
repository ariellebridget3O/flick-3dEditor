// ============================================================================
// fn: q5r   (bundle minified: function q5r()
// char range: 5139667..5140109   (byte range: 5155723..5156165)
// size: 442 chars / 442 bytes
// purpose: segment-drag PLAN: no overlap -> {kind:"move",startS,guidesS} via _ie magnet; else {kind:"reorder",toIndex} by centers
// params: spec -> plan
// closure/global deps (auto-derived, approximate): startS, n, wie, guidesS, o, kind, q5r, endS, oje, _ie, obstacles, toIndex, G5r
// ============================================================================
function q5r(t){const e=t.items.filter(a=>a.id!==t.draggedId),n={startS:t.desiredStartS,endS:t.desiredStartS+t.durationS};if(!e.some(a=>oje(n,wie(a)))){const{startS:a,guidesS:o}=_ie({desiredStartS:t.desiredStartS,durationS:t.durationS,obstacles:e.map(wie),markersS:t.markersS,radiusS:t.radiusS,fallbackStartS:t.fallbackStartS});return{kind:"move",startS:a,guidesS:o}}return{kind:"reorder",toIndex:e.filter(a=>G5r(a)<=t.desiredStartS).length}}
