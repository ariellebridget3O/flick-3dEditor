// ============================================================================
// fn: Dhe   (bundle minified: function Dhe()
// char range: 5069807..5070302   (byte range: 5085863..5086358)
// size: 495 chars / 495 bytes
// purpose: resize handle (edge top|bottom|left|right, sign ±1): pointer capture, onSizePx(startSize ± delta) — palette uses edge:right sign:1
// params: {edge,sign,onSizePx} -> jsx
// closure/global deps (auto-derived, approximate): t, s, a, e, n, Crt, Dhe, edge, sign, onSizePx, p, i, className, Ze, onPointerDown, onPointerMove, onPointerUp, onPointerCancel
// ============================================================================
function Dhe({edge:t,sign:e,onSizePx:n}){const r=p.useRef(null),s=t==="top"||t==="bottom",a=o=>s?o.clientY:o.clientX;return i.jsx("div",{className:Ze(Crt.handle,Crt[t]),onPointerDown:o=>{o.preventDefault();const l=o.currentTarget.parentElement;l&&(o.currentTarget.setPointerCapture(o.pointerId),r.current={posPx:a(o),sizePx:s?l.offsetHeight:l.offsetWidth})},onPointerMove:o=>{const l=r.current;l&&n(l.sizePx+e*(a(o)-l.posPx))},onPointerUp:()=>r.current=null,onPointerCancel:()=>r.current=null})}
