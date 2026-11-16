(() => {
function zDe(t,e,n){const r=iu(e,t),s=t.shape==="marker"?VIr:t.shape==="ellipse"?Math.max(t.halfWidthM,t.halfDepthM)*e.pxPerM+12:Math.max(t.halfWidthM,t.halfDepthM)*1.2*e.pxPerM+10,a=FU(t.yawRad),o={x:r.x+a.x*s,y:r.y+a.z*s};if(n===void 0)return{center:r,ringRadiusPx:s,rotate:o};const[l,c]=pqt(t,n);return{center:r,ringRadiusPx:s,rotate:o,lens:[iu(e,l),iu(e,c)]}}
});
