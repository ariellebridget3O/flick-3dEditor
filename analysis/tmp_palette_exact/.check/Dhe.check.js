(() => {
function Dhe({edge:t,sign:e,onSizePx:n}){const r=p.useRef(null),s=t==="top"||t==="bottom",a=o=>s?o.clientY:o.clientX;return i.jsx("div",{className:Ze(Crt.handle,Crt[t]),onPointerDown:o=>{o.preventDefault();const l=o.currentTarget.parentElement;l&&(o.currentTarget.setPointerCapture(o.pointerId),r.current={posPx:a(o),sizePx:s?l.offsetHeight:l.offsetWidth})},onPointerMove:o=>{const l=r.current;l&&n(l.sizePx+e*(a(o)-l.posPx))},onPointerUp:()=>r.current=null,onPointerCancel:()=>r.current=null})}
});
