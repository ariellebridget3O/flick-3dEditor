// ============================================================================
// fn: pie   (bundle minified: function pie()
// char range: 4901342..4901413   (byte range: 4908273..4908344)
// size: 71 chars / 71 bytes
// purpose: local TRS of child given parent world TRS: wDe(CP(parent).invert().multiply(CP(child))) (cN dep)
// params: parentTRS, childTRS -> localTRS
// closure/global deps (auto-derived, approximate): CP, pie, wDe
// ============================================================================
function pie(t,e){const n=CP(t).invert();return wDe(n.multiply(CP(e)))}
