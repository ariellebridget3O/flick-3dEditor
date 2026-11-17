(()=>{
const a=window.__app;
const c=a.camera;
const e=c.matrixWorld.elements;
const pos=[e[12],e[13],e[14]];
const right=[e[0],e[1],e[2]], up=[e[4],e[5],e[6]], back=[e[8],e[9],e[10]];
const W=1000,H=375;
const tanH=Math.tan(c.fov*Math.PI/360)*c.aspect, tanV=Math.tan(c.fov*Math.PI/360);
const rho=a.scene.fog.density;
const rows=[];
for(const y of [34,36,40,44,50,60,70,90,120,160,200,240,300,360]){
  const row=[];
  for(const x of [80,115,150]){
    const ndcX=(x+0.5-W/2)/(W/2), ndcY=(H/2-(y+0.5))/(H/2);
    const dir=[-back[0]+right[0]*ndcX*tanH+up[0]*ndcY*tanV,
               -back[1]+right[1]*ndcX*tanH+up[1]*ndcY*tanV,
               -back[2]+right[2]*ndcX*tanH+up[2]*ndcY*tanV];
    const L=Math.hypot(dir[0],dir[1],dir[2]);
    const d=[dir[0]/L,dir[1]/L,dir[2]/L];
    const t = d[1]<-1e-6 ? -pos[1]/d[1] : -1;
    let z=null, f=null;
    if(t>0){
      const fwd=[-back[0],-back[1],-back[2]];
      z = t*(d[0]*fwd[0]+d[1]*fwd[1]+d[2]*fwd[2]);
      f = 1-Math.exp(-(rho*z)*(rho*z));
    }
    row.push([x,y,+t.toFixed(1),z===null?null:+z.toFixed(1),f===null?null:+f.toFixed(4)]);
  }
  rows.push(row);
}
return JSON.stringify({rho:rho, rows:rows});
})()
