(() => {
function ilt({options:t,value:e,onChange:n}){return i.jsxs("div",{className:Ze(Wr.segmented,Wr.segmentedSliding,_s.viewSwitch),role:"radiogroup",style:{"--segment-count":t.length,"--segment-index":t.findIndex(([r])=>r===e)},children:[i.jsx("span",{className:Wr.segmentThumb,"aria-hidden":!0}),t.map(([r,s])=>i.jsx("button",{type:"button",role:"radio",className:Ze(Wr.segment,e===r&&Wr.active),"aria-checked":e===r,onClick:()=>n(r),children:s},r))]})}
});
