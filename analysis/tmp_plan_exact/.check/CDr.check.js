(() => {
function CDr(t,e,n,r){$Zt(t,e,n.points),t.strokeStyle=kDr(n.kind,r),t.lineWidth=1.4,t.setLineDash([2,4]),t.stroke(),t.setLineDash([]),t.fillStyle=r.accent,t.strokeStyle=r.panel,t.lineWidth=1;for(const s of n.keys){const a=iu(e,s);t.beginPath(),t.moveTo(a.x,a.y-KY*Math.SQRT2),t.lineTo(a.x+KY*Math.SQRT2,a.y),t.lineTo(a.x,a.y+KY*Math.SQRT2),t.lineTo(a.x-KY*Math.SQRT2,a.y),t.closePath(),t.fill(),t.stroke()}}
});
