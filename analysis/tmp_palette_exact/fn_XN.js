// ============================================================================
// fn: XN   (bundle minified: function XN()
// char range: 4316220..4316328   (byte range: 4323151..4323259)
// size: 108 chars / 108 bytes
// purpose: SUBJECT AIM POINT (item form): e(subjectId, n) resolver + aimOffsetUnits $6 -> [x,y+off,z] (module-level twin of store subjectAimPoint)
// params: item, resolve(subjectId,default)->[x,y,z], defaultY -> point|null
// closure/global deps (auto-derived, approximate): s, XN, $6
// ============================================================================
function XN(t,e,n){const r=e("subjectId"in t&&t.subjectId||null,n),s=$6(t);return r&&s?[r[0],r[1]+s,r[2]]:r}
