// ============================================================================
// fn: aMr   (bundle minified: function aMr()
// char range: 5257512..5257614   (byte range: 5265765..5265867)
// purpose: selection promotion: drop children whose parent is also selected
// params: ids, objects -> ids
// closure/global deps (auto-derived, approximate): aMr
// ============================================================================
function aMr(t,e){const n=new Set(t);return t.filter(r=>{const s=e[r]?.parentId;return!s||!n.has(s)})}
