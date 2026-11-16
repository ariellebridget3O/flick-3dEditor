// ============================================================================
// fn: pie   (bundle minified: function pie()
// char range: 4901342..4901413   (byte range: 4904885..4904956)
// purpose: world pose -> parent-local pose (invert parent matrix, multiply, decompose)
// params: (parentPose, worldPose) -> localPose
// closure/global deps (auto-derived, approximate): CP, pie, wDe
// ============================================================================
function pie(t,e){const n=CP(t).invert();return wDe(n.multiply(CP(e)))}
