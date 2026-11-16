// ============================================================================
// fn: gVr   (bundle minified: function gVr()
// char range: 5572082..5572917   (byte range: 5588172..5589007)
// size: 835 chars / 835 bytes
// purpose: 3rd MDe(getData($v)) consumer: keyboard key-slot (bind clip to hotkey) drop target; only accepts kind:"clip"
// params: {slotKey,clip,onBind,onEmptyClick} -> jsx
// closure/global deps (auto-derived, approximate): i, jh, children, t, className, o, e, n, r, s, a, $v, title, id, onClick, gVr, slotKey, onBind, onEmptyClick, i18n, Ia, p, Ze, onDragOver, onDragLeave, onDrop, MDe, mVr, JZt, keyName, ODe, K, name, size, type, M
// ============================================================================
function gVr({slotKey:t,clip:e,onBind:n,onEmptyClick:r}){const{i18n:s}=Ia(),[a,o]=p.useState(!1);return i.jsxs("span",{className:Ze(jh.keySlot,a&&jh.keySlotDropActive),onDragOver:l=>{l.dataTransfer.types.includes($v)&&(l.preventDefault(),l.dataTransfer.dropEffect="copy",o(!0))},onDragLeave:()=>o(!1),onDrop:l=>{o(!1);const c=MDe(l.dataTransfer.getData($v));c?.kind==="clip"&&(l.preventDefault(),n(t,c.clip))},children:[i.jsx("span",{className:jh.keySlotKey,title:mVr(t),children:i.jsx(JZt,{keyName:t})}),e?i.jsxs(i.Fragment,{children:[i.jsx("span",{className:jh.keySlotClip,children:ODe(e,s)}),i.jsx("button",{className:jh.keySlotClear,title:_._({id:"4gj0on"}),onClick:()=>n(t,null),children:i.jsx(K,{name:"close",size:"xs"})})]}):i.jsx("button",{type:"button",className:jh.keySlotEmpty,onClick:r,children:i.jsx(M,{id:"F/IjEH"})})]})}
