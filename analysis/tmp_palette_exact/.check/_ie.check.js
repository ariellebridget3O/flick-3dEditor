(() => {
function _ie(t){const{durationS:e,obstacles:n,markersS:r}=t,s=Math.max(0,Xne({desiredStartS:t.desiredStartS,durationS:e,markersS:r,radiusS:t.radiusS})),a=d=>d>=-O8&&!n.some(u=>oje({startS:d,endS:d+e},u));let o;if(a(s))o=s;else{const d={startS:s,endS:s+e};o=n.filter(h=>oje(d,h)).flatMap(h=>[h.startS-e,h.endS]).filter(a).sort((h,f)=>Math.abs(h-s)-Math.abs(f-s))[0]??t.fallbackStartS}const l=o+e,c=[...new Set(r.filter(d=>Math.abs(d-o)<O8||Math.abs(d-l)<O8))];return{startS:o,guidesS:c}}
});
