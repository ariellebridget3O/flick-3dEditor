// ============================================================================
// fn: kDr   (bundle minified: function kDr()
// char range: 5480523..5480631   (byte range: 5488791..5488899)
// purpose: color by kind: walker->human, camera/target->camera, spotlight->light, else object
// params: kind, palette -> color
// closure/global deps (auto-derived, approximate): kDr, el
// ============================================================================
function kDr(t,e){return el(t)?e.human:t==="camera"||t==="target"?e.camera:t==="spotlight"?e.light:e.object}
