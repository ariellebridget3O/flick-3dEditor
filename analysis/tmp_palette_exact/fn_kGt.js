// ============================================================================
// fn: kGt   (bundle minified: function kGt()
// char range: 5140109..5140383   (byte range: 5156165..5156439)
// size: 274 chars / 274 bytes
// purpose: apply reorder: sort, remove dragged, splice at toIndex at neighbor start / MP
// params: items, id, toIndex -> items
// closure/global deps (auto-derived, approximate): o, l, h, c, d, kGt, MP
// ============================================================================
function kGt(t,e,n){const r=[...t].sort((u,h)=>u.startS-h.startS),s=r.find(u=>u.id===e);if(!s)return[...t];const a=r.filter(u=>u.id!==e),o=Math.max(0,Math.min(n,a.length)),l=o<a.length?a[o]:void 0,c=l?l.startS:MP(a),d={...s,startS:c};return[...a.slice(0,o),d,...a.slice(o)]}
