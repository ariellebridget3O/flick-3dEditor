(() => {
function xHr(t){const e=[];let n=0;for(let r=1;r<=t.length;r++){const s=t[r];s&&s.x===t[n].x&&s.z===t[n].z||(t[r-1].t-t[n].t>=gHr&&e.push([n,r-1]),n=r)}return e}
});
