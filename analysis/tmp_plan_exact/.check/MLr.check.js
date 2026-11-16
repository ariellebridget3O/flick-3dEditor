(() => {
function MLr(t,e,n){const r=e.find(s=>s.id===n)?.footprint;return!r||t.view.widthPx===0?t:{...t,view:{...t.view,centerX:r.x,centerZ:r.z,pxPerM:Uhe},fitted:!0}}
});
