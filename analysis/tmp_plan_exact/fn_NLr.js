// ============================================================================
// fn: NLr   (bundle minified: function NLr()
// char range: 5457367..5457549   (byte range: 5465635..5465817)
// purpose: wheel: zoom (FZt factor) or pan
// params: state, {p,dx,dy,deltaMode,zoom} -> state
// closure/global deps (auto-derived, approximate): r, NLr, PZt, deltaX, deltaY, fqt, FZt, UDe
// ============================================================================
function NLr(t,e){const n=PZt({deltaX:e.dx,deltaY:e.dy,deltaMode:e.deltaMode,zoom:e.zoom}),r=n.kind==="zoom"?fqt(t.view,e.p,FZt(n.delta)):UDe(t.view,-n.dx,-n.dy);return{...t,view:r}}
