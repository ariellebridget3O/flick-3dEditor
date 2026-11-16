// ============================================================================
// fn: yRr   (bundle minified: function yRr()
// char range: 5418603..5418950   (byte range: 5426871..5427218)
// purpose: camera pills: role=group, buttons aria-pressed when solely selected, swatch dot
// params: {cameras,selectedIds,onCameraClick} -> jsx
// closure/global deps (auto-derived, approximate): r, t, e, i, className, Q2e, n, id, children, s, yRr, cameras, selectedIds, onCameraClick, role, label, type, onClick
// ============================================================================
function yRr({cameras:t,selectedIds:e,onCameraClick:n}){return t.length?i.jsx("div",{className:Q2e.pills,role:"group","aria-label":_._({id:"Z1e/3b"}),children:t.map(({id:r,label:s})=>i.jsxs("button",{type:"button",className:Q2e.pill,"aria-pressed":e.length===1&&e[0]===r,onClick:()=>n(r),children:[i.jsx("i",{className:Q2e.swatch}),s]},r))}):null}
