// ============================================================================
// fn: FRr   (bundle minified: function FRr()
// char range: 5420755..5421149   (byte range: 5429023..5429417)
// purpose: phone-link pill (linked/lost/idle)
// params: {state,qrShown,onClick} -> jsx
// closure/global deps (auto-derived, approximate): t, i, Eh, M, id, e, onClick, n, className, FRr, state, qrShown, type, children, Ze, K, name, size
// ============================================================================
function FRr({state:t,qrShown:e,onClick:n}){const r=t==="linked"||t==="lost";return i.jsxs("button",{type:"button",className:Eh.pill,"aria-expanded":e,"data-phone-pill":!0,onClick:n,children:[r?i.jsx("i",{className:Ze(Eh.linkedDot,t==="lost"&&Eh.lostDot)}):i.jsx(K,{name:"phone-camera",size:"sm"}),t==="linked"?i.jsx(M,{id:"xDSSCq"}):t==="lost"?i.jsx(M,{id:"8E7Fq8"}):i.jsx(M,{id:"kW8chx"})]})}
