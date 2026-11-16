(() => {
function HLr(t,e){const n=t.drag,r={...t,drag:null};if(!n)return{state:t,intents:[]};if(n.kind==="stroke")return{state:r,intents:[{type:"stroke-end"}]};if(n.kind==="tap-or-draw")return{state:r,intents:[{type:"focus",id:n.focusId}]};if(n.kind==="marquee"){const{x0:s,y0:a,x1:o,y1:l}=n.rect;if(Math.abs(o-s)<=Jat&&Math.abs(l-a)<=Jat)return{state:r,intents:[]};const c=_Lr(e.items,t.view,n.rect);return{state:r,intents:[{type:"select",ids:[...new Set([...n.base,...c])]}]}}return{state:r,intents:n.last===null?[]:[{type:"commit"}]}}
});
