(() => {
function zIr(t,e,n){const r=Math.max(1e-6,e.maxX-e.minX),s=Math.max(1e-6,e.maxZ-e.minZ),a=Math.min((t.widthPx-2*n)/r,(t.heightPx-2*n)/s);return{...t,centerX:(e.minX+e.maxX)/2,centerZ:(e.minZ+e.maxZ)/2,pxPerM:mqt(a,iqt,oqt)}}
});
