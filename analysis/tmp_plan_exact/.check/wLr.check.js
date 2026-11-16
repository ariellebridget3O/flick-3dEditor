(() => {
function wLr(t,e,n,r){const s=Qhe(t,e,n);if(!s.length)return null;const a=s.find(c=>c.parentId===r);if(a)return a.id;const o=s.findIndex(c=>c.id===r),l=o>=0?(o+1)%s.length:Math.min(1,s.length-1);return s[l].id}
});
