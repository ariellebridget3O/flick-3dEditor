(() => {
function jLr(t,e,n){const{view:r}=t;if(r.widthPx===e&&r.heightPx===n)return t;const s=r.widthPx>0&&r.heightPx>0;return{...t,view:{...r,centerX:s?r.centerX+(e-r.widthPx)/(2*r.pxPerM):r.centerX,centerZ:s?r.centerZ+(n-r.heightPx)/(2*r.pxPerM):r.centerZ,widthPx:e,heightPx:n}}}
});
