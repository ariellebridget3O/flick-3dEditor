// ============================================================================
// fn: NDr   (bundle minified: function NDr()
// char range: 5487924..5488222   (byte range: 5496192..5496490)
// purpose: camera fov wedge: triangle to pqt lens endpoints 4.2m ahead, alpha .2/.1 fill + .6/1 stroke 1.4/1
// params: ctx, view, item, halfRad, selected, palette -> void
// closure/global deps (auto-derived, approximate): l, c, iu, NDr, pqt
// ============================================================================
function NDr(t,e,n,r,s,a){const o=iu(e,n),[l,c]=pqt(n,r).map(d=>iu(e,d));t.beginPath(),t.moveTo(o.x,o.y),t.lineTo(l.x,l.y),t.lineTo(c.x,c.y),t.closePath(),t.fillStyle=a.camera,t.globalAlpha=s?.2:.1,t.fill(),t.strokeStyle=a.camera,t.globalAlpha=s?1:.6,t.lineWidth=s?1.4:1,t.stroke(),t.globalAlpha=1}
