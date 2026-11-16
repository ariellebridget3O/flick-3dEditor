// ============================================================================
// fn: ilt   (bundle minified: function ilt()
// char range: 5839824..5840274   (byte range: 5848094..5848544)
// purpose: segmented control primitive
// params: props -> jsx
// closure/global deps (auto-derived, approximate): r, Wr, t, e, i, className, n, Ze, role, children, s, ilt, options, value, onChange, _s, style, type, onClick
// ============================================================================
function ilt({options:t,value:e,onChange:n}){return i.jsxs("div",{className:Ze(Wr.segmented,Wr.segmentedSliding,_s.viewSwitch),role:"radiogroup",style:{"--segment-count":t.length,"--segment-index":t.findIndex(([r])=>r===e)},children:[i.jsx("span",{className:Wr.segmentThumb,"aria-hidden":!0}),t.map(([r,s])=>i.jsx("button",{type:"button",role:"radio",className:Ze(Wr.segment,e===r&&Wr.active),"aria-checked":e===r,onClick:()=>n(r),children:s},r))]})}
