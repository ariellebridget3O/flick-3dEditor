(() => {
function O5r({action:t,label:e,drawObjectTile:n,startObjectPreview:r,stopObjectPreview:s,beginDrag:a,addButton:o,onActionDragEnd:l}){const c=p.useRef(null);return p.useEffect(()=>{c.current&&n(c.current,t)},[t,n]),i.jsxs("div",{className:Ze(Zr.tile,ff.tile),draggable:!0,title:_._({id:"w2DmPr"}),onDragStart:d=>a(d,{kind:"object",action:t}),onDragEnd:l,onPointerEnter:()=>{c.current&&r(c.current,t)},onPointerLeave:()=>{s(),c.current&&n(c.current,t)},children:[o,i.jsx("canvas",{ref:c,className:Zr.tileThumb,width:IP,height:IP}),i.jsx("span",{className:Zr.tileName,children:e})]})}
});
