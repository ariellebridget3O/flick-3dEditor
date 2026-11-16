// ============================================================================
// fn: $Ur   (bundle minified: function $Ur()
// char range: 5605204..5605332   (byte range: 5621294..5621422)
// size: 128 chars / 128 bytes
// purpose: apply ghost material to whole subtree (clone → $it each mesh)
// params: root -> void
// closure/global deps (auto-derived, approximate): $it, $Ur
// ============================================================================
function $Ur(t){t.traverse(e=>{const n=e;n.isMesh&&(n.material=Array.isArray(n.material)?n.material.map($it):$it(n.material))})}
