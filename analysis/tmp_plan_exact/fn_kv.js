// ============================================================================
// fn: kv   (bundle minified: function kv()
// char range: 4904662..4904808   (byte range: 4908205..4908351)
// purpose: look-at rotation (quaternion) from position to target
// params: pos, target -> quat/euler
// closure/global deps (auto-derived, approximate): Dj, kv
// ============================================================================
function kv(t,e){return Dj.position.set(t[0],t[1],t[2]),Dj.lookAt(e[0],e[1],e[2]),Dj.rotateY(Math.PI),[Dj.rotation.x,Dj.rotation.y,Dj.rotation.z]}
