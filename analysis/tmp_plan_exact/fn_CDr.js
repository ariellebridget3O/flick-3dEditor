// ============================================================================
// fn: CDr   (bundle minified: function CDr()
// char range: 5483640..5484047   (byte range: 5491908..5492315)
// purpose: selected paths painter: kDr color by kind, dimmed if dimPathOf; $Zt + dashed stroke [2,4] 1.4px; keys as diamond markers
// params: ctx, view, paths, selection, palette, dimPathOf -> void
// closure/global deps (auto-derived, approximate): KY, CDr, $Zt, kDr, iu
// ============================================================================
function CDr(t,e,n,r){$Zt(t,e,n.points),t.strokeStyle=kDr(n.kind,r),t.lineWidth=1.4,t.setLineDash([2,4]),t.stroke(),t.setLineDash([]),t.fillStyle=r.accent,t.strokeStyle=r.panel,t.lineWidth=1;for(const s of n.keys){const a=iu(e,s);t.beginPath(),t.moveTo(a.x,a.y-KY*Math.SQRT2),t.lineTo(a.x+KY*Math.SQRT2,a.y),t.lineTo(a.x,a.y+KY*Math.SQRT2),t.lineTo(a.x-KY*Math.SQRT2,a.y),t.closePath(),t.fill(),t.stroke()}}
