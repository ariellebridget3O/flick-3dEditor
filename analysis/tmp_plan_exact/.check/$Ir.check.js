(() => {
function $Ir(t,e){const n=e.widthPx/2,r=e.heightPx/2,s=[];for(const a of t){if(a.kind!=="camera")continue;const o=iu(e,a.footprint);if(o.x>=0&&o.x<=e.widthPx&&o.y>=0&&o.y<=e.heightPx)continue;const l=o.x-n,c=o.y-r,d=Math.min((n-Rst)/Math.abs(l||1e-6),(r-Rst)/Math.abs(c||1e-6));s.push({id:a.id,tag:a.tag??"",x:n+l*d,y:r+c*d,angleRad:Math.atan2(c,l)})}return s}
});
