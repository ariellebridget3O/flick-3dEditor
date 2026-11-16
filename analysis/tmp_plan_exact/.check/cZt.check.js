(() => {
function cZt(t,e){if(t.length===0)return null;const n=t[0];if(e<=n.tS||t.length===1)return n;const r=t[t.length-1];if(e>=r.tS)return r;let s=t.findIndex(d=>d.tS>=e);s<=0&&(s=1);const a=t[s-1],o=t[s],l=o.tS-a.tS,c=l<=0?0:(e-a.tS)/l;return tye.setFromEuler(Vj.set(a.rotation[0],a.rotation[1],a.rotation[2])),wat.setFromEuler(Vj.set(o.rotation[0],o.rotation[1],o.rotation[2])),tye.slerp(wat,c),Vj.setFromQuaternion(tye),{position:tA(a.position,o.position,c),rotation:[Vj.x,Vj.y,Vj.z],focalLengthMm:a.focalLengthMm+(o.focalLengthMm-a.focalLengthMm)*c}}
});
