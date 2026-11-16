// ============================================================================
// fn: IDr   (bundle minified: function IDr()
// char range: 5487635..5487860   (byte range: 5495903..5496128)
// purpose: spotlight pool fill: circle r=radiusM·ppm, or dBe ROTATED SQUARE half-extent radiusM·ppm (aligned to fixture yaw, NOT √2-scaled); fill light, alpha yDr=.24 selected else bDr=.14, no stroke
// params: ctx, view, item, selected, palette -> void
// closure/global deps (auto-derived, approximate): o, l, IDr, iu, dBe, yDr, bDr
// ============================================================================
function IDr(t,e,n,r,s){const a=n.pool,o=iu(e,a),l=a.radiusM*e.pxPerM;a.square?dBe(t,o,l,l,n.footprint.yawRad):(t.beginPath(),t.arc(o.x,o.y,l,0,Math.PI*2)),t.fillStyle=s.light,t.globalAlpha=r?yDr:bDr,t.fill(),t.globalAlpha=1}
