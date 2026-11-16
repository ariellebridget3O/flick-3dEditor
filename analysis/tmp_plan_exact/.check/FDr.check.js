(() => {
function FDr(t,e,n){for(const r of e)t.save(),t.translate(r.x,r.y),t.fillStyle=n.panel,t.strokeStyle=n.camera,t.lineWidth=1.4,t.beginPath(),t.arc(0,0,uN,0,Math.PI*2),t.fill(),t.stroke(),t.rotate(r.angleRad),t.fillStyle=n.camera,t.beginPath(),t.moveTo(uN+6,0),t.lineTo(uN,-5),t.lineTo(uN,5),t.closePath(),t.fill(),t.rotate(-r.angleRad),t.fillStyle=n.text,t.font=`${l$}px ${n.fontFamily}`,t.textAlign="center",t.textBaseline="middle",t.fillText(r.tag,0,.5),t.restore()}
});
