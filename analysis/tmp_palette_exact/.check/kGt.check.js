(() => {
function kGt(t,e,n){const r=[...t].sort((u,h)=>u.startS-h.startS),s=r.find(u=>u.id===e);if(!s)return[...t];const a=r.filter(u=>u.id!==e),o=Math.max(0,Math.min(n,a.length)),l=o<a.length?a[o]:void 0,c=l?l.startS:MP(a),d={...s,startS:c};return[...a.slice(0,o),d,...a.slice(o)]}
});
