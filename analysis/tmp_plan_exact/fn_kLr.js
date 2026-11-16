// ============================================================================
// fn: kLr   (bundle minified: function kLr()
// char range: 5456459..5456619   (byte range: 5464727..5464887)
// purpose: camera handle hit: rotate | lens within cqt(6)+yLr(2) px
// params: item, view, px -> "rotate"|"lens"|null
// closure/global deps (auto-derived, approximate): s, kLr, zDe, cqt, yLr
// ============================================================================
function kLr(t,e,n){const r=zDe(t.footprint,e,t.wedgeHalfRad),s=a=>Math.hypot(n.x-a.x,n.y-a.y)<=cqt+yLr;return s(r.rotate)?"rotate":r.lens?.some(s)?"lens":null}
