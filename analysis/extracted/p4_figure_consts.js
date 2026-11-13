// #### IP — 1 def sites ####
/* ==== IP site[0] kind=assign @5120401 len=724 ==== */
IP=128,C5r={move:()=>_._({id:"ZHYI6T"}),animate:()=>_._({id:"WSviW0"}),camera:()=>_._({id:"xmwcS8"})},E5r=[{action:"rotate",icon:"rotate",label:i.jsx(M,{id:"BulyBf"}),color:"var(--stage-action-object)"},{action:"revolve",icon:"orbit",label:i.jsx(M,{id:"NP8KUz"}),color:"var(--stage-action-object)"},{action:"scale-up",icon:"expand",label:i.jsx(M,{id:"5DdjZ9"}),color:"var(--stage-action-object)"},{action:"scale-down",icon:"collapse",label:i.jsx(M,{id:"8Mw+hK"}),color:"var(--stage-action-object)"},{action:"transform",icon:"sliders",label:i.jsx(M,{id:"OCy3k9"}),color:"var(--stage-action-object)"}],j5r="var(--stage-action-camera)",I5r={still:"stop",path:"spline",follow:"locate",transform:"sliders",manual:"phone-camera"};


// uIr: NOT FOUND

// #### RP — 1 def sites ####
/* ==== RP site[0] kind=assign @5432399 len=51 ==== */
RP=500,hZt=2e4,wFr=1.25,_Fr=400,Sat=1.1,kFr=RP/Khe;


// #### Iie — 1 def sites ####
/* ==== Iie site[0] kind=assign @5188800 len=19 ==== */
 Iie=Math.PI/2-.05;


// #### Mie — 1 def sites ####
/* ==== Mie site[0] kind=assign @5246899 len=16 ==== */
Mie=Math.PI/180;


// #### mIr — 1 def sites ####
/* ==== mIr site[0] kind=function @5239830 len=1392 ==== */
function mIr(t,e,n){const r=t[0]*e[0]+t[1]*e[1]+t[2]*e[2]+t[3]*e[3]<0?-1:1,s=[t[0]+(r*e[0]-t[0])*n,t[1]+(r*e[1]-t[1])*n,t[2]+(r*e[2]-t[2])*n,t[3]+(r*e[3]-t[3])*n],a=Math.hypot(...s);return[s[0]/a,s[1]/a,s[2]/a,s[3]/a]}class gIr{samples=[];lagMs=null;lastSampledMs=0;floorMs=-1/0;waiting=!1;push=(e,n,r)=>{if(!(n<=(this.samples.at(-1)?.phoneMs??this.floorMs)))for(this.samples.push({...e,phoneMs:n,arrivedMs:r});this.samples[0].arrivedMs<r-hIr;)this.samples.shift()};clear=(e=-1/0)=>{this.samples=[],this.lagMs=null,this.floorMs=e,this.waiting=!1};lastArrivedMs=()=>this.samples.at(-1)?.arrivedMs??null;sample=e=>{const n=this.samples;if(n.length===0)return null;if(n.length===1)return n[0];let r=-1/0;for(const c of n)r=Math.max(r,c.arrivedMs-c.phoneMs);const s=(n.at(-1).phoneMs-n[0].phoneMs)/(n.length-1),a=r+s;if(this.lagMs===null||this.waiting&&this.lagMs-a>fIr)this.lagMs=a;else{const c=pIr*Math.max(0,e-this.lastSampledMs),d=a-this.lagMs;this.lagMs+=Math.max(-c,Math.min(c,d))}this.lastSampledMs=e;const o=n.at(-1).phoneMs;this.waiting=e-this.lagMs>o,this.waiting&&(this.lagMs=e-o);const l=e-this.lagMs;if(l<=n[0].phoneMs)return n[0];for(let c=n.length-1;c>0;c--){const d=n[c-1];if(d.phoneMs>l)continue;const u=n[c],h=Math.min(1,(l-d.phoneMs)/(u.phoneMs-d.phoneMs));return{q:mIr(d.q,u.q,h),p:[d.p[0]+(u.p[0]-d.p[0])*h,d.p[1]+(u.p[1]-d.p[1])*h,d.p[2]+(u.p[2]-d.p[2])*h]}}return n.at(-1)}


// #### fIr — 1 def sites ####
/* ==== fIr site[0] kind=assign @5239822 len=8 ==== */
fIr=250;


// #### rA — 1 def sites ####
/* ==== rA site[0] kind=assign @4936262 len=267 ==== */
rA=HUt.map((t,e)=>({...t,heading:C6r[e],...t.id==="collaborate"?{label:i.jsx(M,{id:"QRIfAm"})}:{}})),E6r={PRE:i.jsx(M,{id:"RST4sM"}),MID:i.jsx(M,{id:"2PEK39"}),POST:i.jsx(M,{id:"jwtsdJ"}),COMMUNITY:i.jsx(M,{id:"ENbbF3"})},b1=t=>rA.findIndex(e=>e.id===t),t9=rA.length;

