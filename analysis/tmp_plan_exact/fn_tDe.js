// ============================================================================
// fn: tDe   (bundle minified: function tDe()
// char range: 3923215..3923319   (byte range: 3926758..3926862)
// purpose: signed angular difference (mod 2π, wrapped to ±π) — lens drag: angle between footprint yaw and pointer dir
// params: (a,b) -> rad
// closure/global deps (auto-derived, approximate): tDe
// ============================================================================
function tDe(t,e){let n=(e-t)%(2*Math.PI);return n>Math.PI&&(n-=2*Math.PI),n<-Math.PI&&(n+=2*Math.PI),n}
