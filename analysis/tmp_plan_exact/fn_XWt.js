// ============================================================================
// fn: XWt   (bundle minified: function XWt()
// char range: 4905387..4905540   (byte range: 4908930..4909083)
// purpose: camera+target follow: delta target position after camera pose change
// params: ({camera,quaternion,target},{position,quaternion},out) -> vec3
// closure/global deps (auto-derived, approximate): drt, XWt
// ============================================================================
function XWt(t,e,n){return drt.copy(t.quaternion).invert().premultiply(e.quaternion),n.copy(t.target).sub(t.camera).applyQuaternion(drt).add(e.position)}
