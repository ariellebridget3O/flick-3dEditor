// ============================================================================
// fn: RDr   (bundle minified: function RDr()
// char range: 5488596..5489152   (byte range: 5496864..5497420)
// purpose: rotate-handle direction tick: arc at r+pDr, angle atan2(-cos,-sin)
// params: ctx, center, r, yawRad, palette -> void
// closure/global deps (auto-derived, approximate): h, o, l, m, c, RDr, pDr, fDr, mDr
// ============================================================================
function RDr(t,e,n,r,s){const a=n+pDr,o=Math.atan2(-Math.cos(r),-Math.sin(r)),l=fDr/n,c=mDr/n;t.strokeStyle=s.accent,t.fillStyle=s.accent,t.lineWidth=1.6,t.lineCap="round";for(const d of[1,-1]){const u=o+d*l,h=o+d*(l+c);t.beginPath(),t.arc(e.x,e.y,a,Math.min(u,h),Math.max(u,h)),t.stroke();const f={x:e.x+Math.cos(h)*a,y:e.y+Math.sin(h)*a},m=h+d*Math.PI/2;t.beginPath(),t.moveTo(f.x+Math.cos(m)*4,f.y+Math.sin(m)*4),t.lineTo(f.x+Math.cos(h)*3.5,f.y+Math.sin(h)*3.5),t.lineTo(f.x-Math.cos(h)*3.5,f.y-Math.sin(h)*3.5),t.closePath(),t.fill()}t.lineCap="butt"}
