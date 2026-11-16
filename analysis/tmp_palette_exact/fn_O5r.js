// ============================================================================
// fn: O5r   (bundle minified: function O5r()
// char range: 5127872..5128453   (byte range: 5143928..5144509)
// size: 581 chars / 581 bytes
// purpose: object action tile: canvas 128 tileThumb drawObjectTile(canvas,action); drag {kind:"object",action}; hover start/stop loop; title w2DmPr
// params: props -> jsx
// closure/global deps (auto-derived, approximate): t, n, i, className, Zr, action, e, r, s, a, o, l, p, children, IP, O5r, label, drawObjectTile, startObjectPreview, stopObjectPreview, beginDrag, addButton, onActionDragEnd, Ze, ff, draggable, title, id, onDragStart, kind, onDragEnd, onPointerEnter, onPointerLeave, ref, width, height
// ============================================================================
function O5r({action:t,label:e,drawObjectTile:n,startObjectPreview:r,stopObjectPreview:s,beginDrag:a,addButton:o,onActionDragEnd:l}){const c=p.useRef(null);return p.useEffect(()=>{c.current&&n(c.current,t)},[t,n]),i.jsxs("div",{className:Ze(Zr.tile,ff.tile),draggable:!0,title:_._({id:"w2DmPr"}),onDragStart:d=>a(d,{kind:"object",action:t}),onDragEnd:l,onPointerEnter:()=>{c.current&&r(c.current,t)},onPointerLeave:()=>{s(),c.current&&n(c.current,t)},children:[o,i.jsx("canvas",{ref:c,className:Zr.tileThumb,width:IP,height:IP}),i.jsx("span",{className:Zr.tileName,children:e})]})}
