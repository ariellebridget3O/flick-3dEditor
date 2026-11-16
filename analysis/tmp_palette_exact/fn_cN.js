// ============================================================================
// fn: cN   (bundle minified: function cN()
// char range: 4901465..4901598   (byte range: 4908396..4908529)
// size: 133 chars / 133 bytes
// purpose: TRANSFORM VALIDATION/NORMALIZATION (turnCameraToward dep): object+store -> resolve parentId; parent? pie(parent, n) : n (n is the desired local TRS)
// params: object, objects, trs -> trs
// closure/global deps (auto-derived, approximate): cN, pie
// ============================================================================
function cN(t,e,n){const r=t.parentId?e[t.parentId]:void 0;return r?pie({position:r.position,rotation:r.rotation,scale:r.scale},n):n}
