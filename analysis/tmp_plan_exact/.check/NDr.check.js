(() => {
function NDr(t,e,n,r,s,a){const o=iu(e,n),[l,c]=pqt(n,r).map(d=>iu(e,d));t.beginPath(),t.moveTo(o.x,o.y),t.lineTo(l.x,l.y),t.lineTo(c.x,c.y),t.closePath(),t.fillStyle=a.camera,t.globalAlpha=s?.2:.1,t.fill(),t.strokeStyle=a.camera,t.globalAlpha=s?1:.6,t.lineWidth=s?1.4:1,t.stroke(),t.globalAlpha=1}
});
