// ============================================================================
// fn: CP   (bundle minified: function CP()
// char range: 4900781..4900993   (byte range: 4907712..4907924)
// size: 212 chars / 212 bytes
// purpose: TRS obj -> Matrix4: euler XYZ -> quat, new Matrix4().compose(pos,quat,scale) (scratch zb/hie/GB/qB)
// params: trs -> Matrix4
// closure/global deps (auto-derived, approximate): zb, hie, CP, $r, GB, qB
// ============================================================================
function CP(t){return zb.set(t.rotation[0],t.rotation[1],t.rotation[2],"XYZ"),hie.setFromEuler(zb),new $r().compose(GB.set(t.position[0],t.position[1],t.position[2]),hie,qB.set(t.scale[0],t.scale[1],t.scale[2]))}
