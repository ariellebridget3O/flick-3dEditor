// ============================================================================
// fn: i9   (bundle minified: function i9()
// char range: 5250004..5250114   (byte range: 5258257..5258367)
// purpose: plan yaw (rad) of a [x,y,z] euler: forward=(0,0,-1).applyEuler(XYZ), atan2(-fx,-fz) — screen-up = -Z convention
// params: rotation[3] -> yawRad
// closure/global deps (auto-derived, approximate): H2e, Lst, i9
// ============================================================================
function i9(t){return Lst.set(t[0],t[1],t[2],"XYZ"),H2e.set(0,0,-1).applyEuler(Lst),Math.atan2(-H2e.x,-H2e.z)}
