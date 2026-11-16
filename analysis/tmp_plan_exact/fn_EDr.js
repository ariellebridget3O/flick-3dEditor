// ============================================================================
// fn: EDr   (bundle minified: function EDr()
// char range: 5484249..5485237   (byte range: 5492517..5493505)
// purpose: simple_figure body painter: dBe rect (uDr min px), head Nie arc + Pie=72° face arc (aqt contrast), direction tick FU
// params: ctx, view, item, selected, palette -> void
// closure/global deps (auto-derived, approximate): d, c, m, u, b, PP, FU, Pie, EDr, uDr, aqt, dBe, cBe, Nie
// ============================================================================
function EDr(t,e,n,r,s,a){const o=n.footprint;if(o.shape!=="rect")return;const l=Math.max(1,uDr/(o.halfWidthM*e.pxPerM)),c=o.halfWidthM*e.pxPerM*l,d=o.halfDepthM*e.pxPerM*l,u=aqt(a.human);dBe(t,r,c,d,o.yawRad),t.fillStyle=a.human,t.fill(),s&&(t.strokeStyle=a.accent,t.lineWidth=1.6,t.stroke());const h=Math.max(1.5,d*.2);cBe(t,r,[[-c,-d],[c,-d],[c,-d+h],[-c,-d+h]],o.yawRad),t.fillStyle=u,t.fill();const f=Math.min(Math.abs(o.halfWidthM)/(PP[0]/2),Math.abs(o.halfDepthM)/(PP[2]/2)),m=Nie*f*e.pxPerM*l;t.beginPath(),t.arc(r.x,r.y,m,0,Math.PI*2),t.fillStyle=a.human,t.fill(),t.strokeStyle=a.background,t.lineWidth=1,t.stroke();const g=FU(o.yawRad+(n.headYawRad??0)),b=Math.atan2(g.z,g.x);t.beginPath(),t.arc(r.x,r.y,m*.72,b-Pie,b+Pie),t.strokeStyle=u,t.lineWidth=Math.max(1.5,m*.3),t.stroke();const y=FU(o.yawRad);t.strokeStyle=a.human,t.lineWidth=1.6,t.lineCap="round",t.beginPath(),t.moveTo(r.x+y.x*(d+3),r.y+y.z*(d+3)),t.lineTo(r.x+y.x*(d+10),r.y+y.z*(d+10)),t.stroke(),t.lineCap="butt"}
