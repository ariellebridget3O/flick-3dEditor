// ============================================================================
// fn: Rrt   (bundle minified: function Rrt()
// char range: 5117163..5117234   (byte range: 5133219..5133290)
// size: 71 chars / 71 bytes
// purpose: dispose skinned meshes: traverse RR -> skeleton.dispose()
// params: root -> void
// closure/global deps (auto-derived, approximate): Rrt, RR
// ============================================================================
function Rrt(t){t.traverse(e=>{e instanceof RR&&e.skeleton.dispose()})}
