// ============================================================================
// fn: _Lr   (bundle minified: function _Lr()
// char range: 5456209..5456459   (byte range: 5464477..5464727)
// purpose: marquee rect∩bbox select with parentId??id promotion
// params: items, view, rect -> ids[]
// closure/global deps (auto-derived, approximate): s, a, o, _Lr, Rie
// ============================================================================
function _Lr(t,e,n){const r=Math.min(n.x0,n.x1),s=Math.max(n.x0,n.x1),a=Math.min(n.y0,n.y1),o=Math.max(n.y0,n.y1),l=new Set;for(const c of t){const d=Rie(c.footprint,e);d.maxX>=r&&d.minX<=s&&d.maxY>=a&&d.minY<=o&&l.add(c.parentId??c.id)}return[...l]}
