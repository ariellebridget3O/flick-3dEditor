// ============================================================================
// fn: kv   (bundle minified: function kv()
// char range: 4904662..4904808   (byte range: 4911593..4911739)
// size: 146 chars / 146 bytes
// purpose: LOOKAT ROTATION position->target incl rotateY(PI) (camera faces -Z): Dj.position.set(t); Dj.lookAt(e); Dj.rotateY(PI); return [x,y,z] euler
// params: pos, target -> [x,y,z]
// closure/global deps (auto-derived, approximate): Dj, kv
// ============================================================================
function kv(t,e){return Dj.position.set(t[0],t[1],t[2]),Dj.lookAt(e[0],e[1],e[2]),Dj.rotateY(Math.PI),[Dj.rotation.x,Dj.rotation.y,Dj.rotation.z]}
