// ============================================================================
// fn: P5r   (bundle minified: function P5r()
// char range: 5126078..5126850   (byte range: 5142134..5142906)
// size: 772 chars / 772 bytes
// purpose: camera action tile: canvas preview when g5r(action) (cinematic), else iconThumb I5r[action]??"video" colored j5r; drag {kind:"camera",action}; hover start/stop loop; title 1YVTmS; aria rYb0+Q
// params: props -> jsx
// closure/global deps (auto-derived, approximate): d, t, i, n, className, Zr, e, children, action, label, r, s, a, o, l, p, u, id, IP, P5r, drawCameraTile, startCameraPreview, stopCameraPreview, beginDrag, addButton, onActionDragEnd, g5r, I5r, Ze, ff, draggable, title, onDragStart, kind, onDragEnd, onPointerEnter, onPointerLeave, ref, width, height, values, style, color, j5r, K, name, size
// ============================================================================
function P5r({action:t,label:e,drawCameraTile:n,startCameraPreview:r,stopCameraPreview:s,beginDrag:a,addButton:o,onActionDragEnd:l}){const c=p.useRef(null),d=g5r(t)?t:null,u=I5r[t]??"video";return p.useEffect(()=>{d&&c.current&&n(c.current,d)},[d,n]),i.jsxs("div",{className:Ze(Zr.tile,ff.tile),draggable:!0,title:_._({id:"1YVTmS"}),onDragStart:h=>a(h,{kind:"camera",action:t}),onDragEnd:l,onPointerEnter:()=>{d&&c.current&&r(c.current,d)},onPointerLeave:()=>{d&&(s(),c.current&&n(c.current,d))},children:[o,d?i.jsx("canvas",{ref:c,className:Zr.tileThumb,width:IP,height:IP,"aria-label":_._({id:"rYb0+Q",values:{label:e}})}):i.jsx("span",{className:Zr.iconThumb,style:{color:j5r},children:i.jsx(K,{name:u,size:"2xl"})}),i.jsx("span",{className:Zr.tileName,children:e})]})}
