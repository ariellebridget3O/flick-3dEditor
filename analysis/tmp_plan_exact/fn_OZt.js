// ============================================================================
// fn: OZt   (bundle minified: function OZt()
// char range: 5457977..5458177   (byte range: 5466245..5466445)
// purpose: tap-or-draw: hover another non-camera/target object while drawing -> its id (focus)
// params: state, deps, px -> id|null
// closure/global deps (auto-derived, approximate): OZt, LZt, el, Qhe
// ============================================================================
function OZt(t,e,n){const r=LZt(e);if(!e.drawing||!r||r.kind!=="camera"&&!el(r.kind))return null;const s=Qhe(e.items,t.view,n)[0];return s&&s.id!==r.id&&s.kind!=="camera"&&s.kind!=="target"?s.id:null}
