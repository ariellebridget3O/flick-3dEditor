// ============================================================================
// fn: _je   (bundle minified: function _je()
// char range: 5447451..5447673   (byte range: 5455719..5455941)
// purpose: camera drag mode classification: manual | path-position | path-look | path-anchored | null
// params: (items, timeS, mode) -> mode|null
// closure/global deps (auto-derived, approximate): _je, wZt, Fp
// ============================================================================
function _je(t,e,n){const r=wZt(t,e);return r?r.kind==="cam-manual"?"manual":n!=="rotate"?"path-position":r.aim!=="locked"?"path-look":t.every(a=>!Fp(a)||a.startS>=r.startS||a.kind==="cam-still")?null:"path-anchored":null}
