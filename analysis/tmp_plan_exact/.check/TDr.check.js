(() => {
function TDr(t,e,n){const r=S1(e,{x:0,y:0}),s=S1(e,{x:e.widthPx,y:e.heightPx}),a=(l,c)=>{t.beginPath();for(let d=Math.ceil(r.x/l)*l;d<=s.x;d+=l){if(c&&d%oye===0)continue;const u=Math.round(iu(e,{x:d,z:0}).x)+.5;t.moveTo(u,0),t.lineTo(u,e.heightPx)}for(let d=Math.ceil(r.z/l)*l;d<=s.z;d+=l){if(c&&d%oye===0)continue;const u=Math.round(iu(e,{x:0,z:d}).y)+.5;t.moveTo(0,u),t.lineTo(e.widthPx,u)}t.stroke()};t.lineWidth=1;const o=_Dr(e.pxPerM);o>0&&(t.globalAlpha=o,t.strokeStyle=n.grid,a(HZt,!0),t.globalAlpha=1),t.strokeStyle=n.gridMajor,a(oye,!1)}
});
