// ============================================================================
// fn: _ie   (bundle minified: function _ie()
// char range: 5138853..5139339   (byte range: 5154909..5155395)
// size: 486 chars / 486 bytes
// purpose: THE MAGNET PLACER (lane drop Z()): snap desiredStartS via Xne; if colliding with obstacles try obstacle edges (startS-durationS, endS), pick closest, else fallbackStartS; guidesS = markers within eps of placement edges; -> {startS,guidesS}
// params: spec -> {startS,guidesS}
// closure/global deps (auto-derived, approximate): s, e, n, r, a, O8, durationS, markersS, oje, f, l, c, _ie, obstacles, Xne, guidesS
// ============================================================================
function _ie(t){const{durationS:e,obstacles:n,markersS:r}=t,s=Math.max(0,Xne({desiredStartS:t.desiredStartS,durationS:e,markersS:r,radiusS:t.radiusS})),a=d=>d>=-O8&&!n.some(u=>oje({startS:d,endS:d+e},u));let o;if(a(s))o=s;else{const d={startS:s,endS:s+e};o=n.filter(h=>oje(d,h)).flatMap(h=>[h.startS-e,h.endS]).filter(a).sort((h,f)=>Math.abs(h-s)-Math.abs(f-s))[0]??t.fallbackStartS}const l=o+e,c=[...new Set(r.filter(d=>Math.abs(d-o)<O8||Math.abs(d-l)<O8))];return{startS:o,guidesS:c}}
