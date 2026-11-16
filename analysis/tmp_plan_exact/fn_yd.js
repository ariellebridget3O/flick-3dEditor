// ============================================================================
// fn: yd   (bundle minified: function yd()
// char range: 4319865..4319961   (byte range: 4323408..4323504)
// purpose: item duration: path/cam-path arc(MR(nx))/speedUnitsPerS else durationS
// params: item -> s
// closure/global deps (auto-derived, approximate): yd, g2, MR, nx
// ============================================================================
function yd(t){return g2(t)?t.anchors.length<2?0:MR(nx(t.anchors))/t.speedUnitsPerS:t.durationS}
