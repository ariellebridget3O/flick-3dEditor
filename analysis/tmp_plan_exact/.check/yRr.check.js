(() => {
function yRr({cameras:t,selectedIds:e,onCameraClick:n}){return t.length?i.jsx("div",{className:Q2e.pills,role:"group","aria-label":_._({id:"Z1e/3b"}),children:t.map(({id:r,label:s})=>i.jsxs("button",{type:"button",className:Q2e.pill,"aria-pressed":e.length===1&&e[0]===r,onClick:()=>n(r),children:[i.jsx("i",{className:Q2e.swatch}),s]},r))}):null}
});
