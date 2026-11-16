// ============================================================================
// fn: VZt   (bundle minified: function VZt()
// char range: 5485237..5485596   (byte range: 5493505..5493864)
// purpose: stick-figure painter: filled head circle (x, y-.72n, r=.3n), torso (x,-.4n)->(x,+.3n), arms single line ±.6n at -.12n, V legs (±.45n,+n)->(x,+.3n)->(±.45n,+n); lineWidth n>8?2.2:1.6 round caps
// params: ctx, center, n, color -> void
// closure/global deps (auto-derived, approximate): VZt
// ============================================================================
function VZt(t,e,n,r){t.fillStyle=r,t.strokeStyle=r,t.lineWidth=n>8?2.2:1.6,t.lineCap="round",t.beginPath(),t.arc(e.x,e.y-n*.72,n*.3,0,Math.PI*2),t.fill(),t.beginPath(),t.moveTo(e.x,e.y-n*.4),t.lineTo(e.x,e.y+n*.3),t.moveTo(e.x-n*.6,e.y-n*.12),t.lineTo(e.x+n*.6,e.y-n*.12),t.moveTo(e.x-n*.45,e.y+n),t.lineTo(e.x,e.y+n*.3),t.lineTo(e.x+n*.45,e.y+n),t.stroke()}
