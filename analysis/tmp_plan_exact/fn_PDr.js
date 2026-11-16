// ============================================================================
// fn: PDr   (bundle minified: function PDr()
// char range: 5488222..5488596   (byte range: 5496490..5496864)
// purpose: single-selection callout: zDe ring + rotate & lens handle dots (cqt=6) + RDr direction tick
// params: ctx, view, item, palette -> void
// closure/global deps (auto-derived, approximate): PDr, zDe, RDr
// ============================================================================
function PDr(t,e,n,r){const s=zDe(n.footprint,e,n.wedgeHalfRad);t.strokeStyle=r.accent,t.lineWidth=1,t.beginPath(),t.arc(s.center.x,s.center.y,s.ringRadiusPx,0,Math.PI*2),t.stroke(),t.fillStyle=r.panel,t.lineWidth=1.4;for(const a of[s.rotate,...s.lens??[]])t.beginPath(),t.arc(a.x,a.y,cqt,0,Math.PI*2),t.fill(),t.stroke();RDr(t,s.center,s.ringRadiusPx,n.footprint.yawRad,r)}
