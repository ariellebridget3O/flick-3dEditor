// ============================================================================
// fn: Xu   (bundle minified: function Xu()
// char range: 4902336..4902445   (byte range: 4905879..4905988)
// purpose: is target id still referenced by some camera (targetId)
// params: (objects, id) -> bool
// closure/global deps (auto-derived, approximate): Xu
// ============================================================================
function Xu(t,e){return t[e]?.kind!=="target"?!1:Object.values(t).some(n=>n.kind==="camera"&&n.targetId===e)}
