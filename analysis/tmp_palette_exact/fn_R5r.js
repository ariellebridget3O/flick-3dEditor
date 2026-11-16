// ============================================================================
// fn: R5r   (bundle minified: function R5r()
// char range: 5126850..5127443   (byte range: 5142906..5143499)
// size: 593 chars / 593 bytes
// purpose: clip tile: canvas 128 tileThumb drawTile(canvas,clip); drag {kind:"clip",clip}; hover start/stop loop; dance->data-onboard-target="dance-tile"
// params: props -> jsx
// closure/global deps (auto-derived, approximate): t, n, i, className, Zr, clip, e, r, s, a, o, l, p, children, IP, R5r, name, drawTile, startTilePreview, stopTilePreview, beginDrag, addButton, onActionDragEnd, Ze, ff, draggable, onDragStart, kind, onDragEnd, onPointerEnter, onPointerLeave, ref, width, height
// ============================================================================
function R5r({clip:t,name:e,drawTile:n,startTilePreview:r,stopTilePreview:s,beginDrag:a,addButton:o,onActionDragEnd:l}){const c=p.useRef(null);return p.useEffect(()=>{c.current&&n(c.current,t)},[t,n]),i.jsxs("div",{className:Ze(Zr.tile,ff.tile),draggable:!0,"data-onboard-target":t==="dance"?"dance-tile":void 0,onDragStart:d=>a(d,{kind:"clip",clip:t}),onDragEnd:l,onPointerEnter:()=>{c.current&&r(c.current,t)},onPointerLeave:()=>{s(),c.current&&n(c.current,t)},children:[o,i.jsx("canvas",{ref:c,className:Zr.tileThumb,width:IP,height:IP}),i.jsx("span",{className:Zr.tileName,children:e})]})}
