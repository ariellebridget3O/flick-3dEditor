(() => {
function BLr(t,e,n,r){const s=t.drag;if(!s||s.kind!=="stroke"&&s.kind!=="move")return{state:t,intents:[]};if(s.kind==="move"&&!s.last)return{state:t,intents:[]};const{widthPx:a,heightPx:o}=t.view,l=(f,m)=>{const g=m*ALr/2,b=f-m/2,y=Math.abs(b)-g;return y<=0?0:Math.sign(b)*Math.min(1,y/Math.max(m/2-g,1))},c=CLr*Math.min(r,100)/1e3,d=l(n.x,a)*c,u=l(n.y,o)*c;if(d===0&&u===0)return{state:t,intents:[]};const h={...t,view:UDe(t.view,-d,-u)};return s.kind==="stroke"?{state:h,intents:[{type:"stroke-move",at:S1(h.view,n)}]}:DZt(h,e,{p:n,shift:!1})}
});
