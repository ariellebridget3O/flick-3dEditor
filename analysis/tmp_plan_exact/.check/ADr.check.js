(() => {
function ADr(t,e,n,r,s){const a=n.find(d=>d.id===r.fromId),o=n.find(d=>d.id===r.subjectId);if(!a||!o)return;const l=iu(e,a.footprint),c=iu(e,o.footprint);t.strokeStyle=s.accent,t.lineWidth=1,t.setLineDash([2,4]),t.beginPath(),t.moveTo(l.x,l.y),t.lineTo(c.x,c.y),t.stroke(),t.setLineDash([]),t.lineWidth=1.4,t.beginPath(),t.arc(c.x,c.y,wDr,0,Math.PI*2);for(const[d,u]of[[0,-1],[0,1],[-1,0],[1,0]])t.moveTo(c.x+d*iit,c.y+u*iit),t.lineTo(c.x+d*lye,c.y+u*lye);t.stroke(),q5(t,r.label,c.x+lye+2,c.y-10,{sizePx:l$,color:s.accent,align:"left",fontFamily:s.fontFamily})}
});
