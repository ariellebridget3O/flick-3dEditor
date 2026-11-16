// ============================================================================
// fn: lje   (bundle minified: function lje()
// char range: 5139472..5139627   (byte range: 5155528..5155683)
// size: 155 chars / 155 bytes
// purpose: normalize items left-wards (sort by startS, push to first free slot)
// params: items -> items
// closure/global deps (auto-derived, approximate): lje, yd
// ============================================================================
function lje(t){let e=0;return[...t].sort((n,r)=>n.startS-r.startS).map(n=>{const r=Math.max(n.startS,e);return e=r+yd(n),r===n.startS?n:{...n,startS:r}})}
