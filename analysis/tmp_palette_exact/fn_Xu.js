// ============================================================================
// fn: Xu   (bundle minified: function Xu()
// char range: 4902336..4902445   (byte range: 4909267..4909376)
// size: 109 chars / 109 bytes
// purpose: object e is a target AND some camera targets it (canOwnTrack dep)
// params: objects, id -> bool
// closure/global deps (auto-derived, approximate): Xu
// ============================================================================
function Xu(t,e){return t[e]?.kind!=="target"?!1:Object.values(t).some(n=>n.kind==="camera"&&n.targetId===e)}
