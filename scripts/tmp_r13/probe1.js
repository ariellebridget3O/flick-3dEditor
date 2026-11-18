(()=>{
const a=window.__app, c=a.env.clouds(), n=c._debug.noiseCPU, R=128;
const hist={r:0,g:0,b:0,a:0,rMean:0,gMean:0,bMean:0,aMean:0};
let cnt=0;
for(let z=0;z<R;z+=8)for(let y=0;y<R;y+=8)for(let x=0;x<R;x+=8){
  const k=(z*R*R+y*R+x)*4;
  hist.r+=n[k];hist.g+=n[k+1];hist.b+=n[k+2];hist.a+=n[k+3];cnt++;
}
hist.rMean=+(hist.r/cnt/255).toFixed(3);hist.gMean=+(hist.g/cnt/255).toFixed(3);
hist.bMean=+(hist.b/cnt/255).toFixed(3);hist.aMean=+(hist.a/cnt/255).toFixed(3);
const sat=x=>Math.min(1,Math.max(0,x));
const remap=(v,l0,h0,l1,h1)=>l1+sat((v-l0)/(h0-l0))*(h1-l1); // signed denom (clouds.js fix)
const smp=(px,py,pz)=>{ // trilinear sample of noiseCPU at normalized coords
  const fx=px*R-.5, fy=py*R-.5, fz=pz*R-.5;
  const x0=Math.floor(fx),y0=Math.floor(fy),z0=Math.floor(fz);
  const tx=fx-x0,ty=fy-y0,tz=fz-z0;
  const W=i=>((i%R)+R)%R;
  const v=(xx,yy,zz)=>{const k=(W(zz)*R*R+W(yy)*R+W(xx))*4;return[n[k],n[k+1],n[k+2],n[k+3]];};
  const out=[0,0,0,0];
  for(let dz=0;dz<2;dz++)for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
    const w=(dz?tz:1-tz)*(dy?ty:1-ty)*(dx?tx:1-tx);
    const vv=v(W(x0+dx),W(y0+dy),W(z0+dz));
    for(let i=0;i<4;i++)out[i]+=vv[i]*w/255;
  }
  return out;
};
const density=(pKm,baseKm=2.5,heightKm=1.2,cov=1,den=1)=>{
  const h=Math.hypot(pKm[0],pKm[1],pKm[2])-6360;
  const hn=sat((h-baseKm)/heightKm);
  const p=[pKm[0]/32,pKm[1]/32,pKm[2]/32];
  const s=smp(p[0]%1,p[1]%1,p[2]%1);
  const lowFBM=s[1]*0.625+s[2]*0.25+s[3]*0.125;
  let base=remap(s[0],lowFBM-1,1,0,1);
  base=remap(base,1-cov,1,0,1);
  const cumulus=sat(remap(hn,0,0.12,0,1))*sat(remap(hn,1,0.30,0,1));
  base=remap(base,lowFBM*0,1,0,1); // placeholder; erosion uses re-fetch below
  const d=smp((p[0]*6)%1,(p[1]*6)%1,(p[2]*6)%1);
  const dFBM=d[1]*0.625+d[2]*0.25+d[3]*0.125;
  base=remap(remap(s[0],lowFBM-1,1,0,1),1-cov,1,0,1);
  base=remap(base,dFBM*0.35,1,0,1);
  return {h,hn,s:[s[0],s[1],s[2],s[3]].map(v=>+v.toFixed(3)),lowFBM:+lowFBM.toFixed(3),
    dFBM:+dFBM.toFixed(3),rho:+(den*base*cumulus).toFixed(4)};
};
const pts=[[0,6363.0,0],[0,6362.7,0],[0,6363.4,0],[300,6362.9,200],[1000,6362.6,900]];
const res=pts.map(p=>density(p));
const cpuTexel=smp(0.25,0.845,0.5).map(v=>Math.round(v*255));
return JSON.stringify({hist,cpuTexel,densities:res});
})()
