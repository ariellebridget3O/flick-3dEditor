// ---- constants (verbatim) ----
const i$=["tripod","gimbal","steadicam","handheld","run","drone"],BGt="gimbal",g2e={turnRoll:0,strafeRoll:0},gq={tripod:{speedMps:0,startEaseS:.35,stopEaseS:.2,lookEaseS:.2,stickCurve:1.4,level:!0,shake:"off",...g2e,rollEaseS:.6},gimbal:{speedMps:1.8,startEaseS:.35,stopEaseS:.18,lookEaseS:.18,stickCurve:1.3,level:!0,shake:"off",...g2e,rollEaseS:.6},steadicam:{speedMps:1.8,startEaseS:.55,stopEaseS:.3,lookEaseS:.28,stickCurve:1.3,level:!0,shake:"subtle",turnRoll:.06,strafeRoll:.04,rollEaseS:.7},handheld:{speedMps:1.8,startEaseS:.2,stopEaseS:.12,lookEaseS:.08,stickCurve:1.2,level:!0,shake:"medium",...g2e,rollEaseS:.4},run:{speedMps:5,startEaseS:.25,stopEaseS:.15,lookEaseS:.06,stickCurve:1.2,level:!0,shake:"stride",turnRoll:.04,strafeRoll:0,rollEaseS:.4},drone:{speedMps:7.5,startEaseS:.6,stopEaseS:.35,lookEaseS:.32,stickCurve:1.5,level:!1,shake:"off",turnRoll:.2,strafeRoll:.12,rollEaseS:.6}},HGt=[.3,.6,.9,1.2,1.8,2.4,3.6,5,7.5,11,16,24,36,50],$Gt=[5,10,15,20,30,45,60,90],VGt=20,Grt={speedMps:gq[BGt].speedMps,panDegPerS:VGt};function DCr(t){return i$.includes(t)}function UGt(t){return gq[t].speedMps===0}function BCr(t){return UGt(t)?{key:"panDegPerS",steps:$Gt}:{key:"speedMps",steps:HGt}}function HCr(t,e){return UGt(t)?{...e,panDegPerS:VGt}:{...e,speedMps:gq[t].speedMps}}function qrt(t,e,n,r=!1){const{key:s,steps:a}=BCr(t),o=e[s],l=n>0?a.find(d=>d>o+1e-6):[...a].reverse().find(d=>d<o-1e-6),c=n>0?a[0]:a.at(-1);return{...e,[s]:l??(r?c:o)}}function $Cr(t,e){return Math.min(Math.max(e,t[0]),t.at(-1))}function VCr(t,e){const n=(r,s,a)=>typeof r=="number"&&Number.isFinite(r)?$Cr(s,r):a;return{speedMps:n(t.speedMps,HGt,e.speedMps),panDegPerS:n(t.panDegPerS,$Gt,e.panDegPerS)}}
const Eie=Math.log2(3),UCr=.25,zCr=.08,jie={tripod:0,gimbal:0,steadicam:0,handheld:0,run:0,drone:0};function HDe(t){const e=Math.min(Eie,Math.max(-Eie,t));return Math.abs(e)<zCr?0:e}function zGt(t){return Math.pow(2,t)}function WCr(t,e){if(!e)return t;const n=zGt(e);return{...t,startEaseS:t.startEaseS*n,stopEaseS:t.stopEaseS*n,lookEaseS:t.lookEaseS*n,rollEaseS:t.rollEaseS*n}}function WGt(t){return typeof t=="number"&&Number.isFinite(t)?HDe(t):null}function GCr(t){const e={...jie};if(typeof t!="object"||t===null)return e;for(const n of i$)e[n]=WGt(t[n])??0;return e}const Iie=Math.PI/2-.05;function DQi(t){return Math.max(-Iie,Math.min(Iie,t))}function qCr(t,e){const n=Math.min(-Iie,t),r=Math.max(Iie,t);return Math.min(r,Math.max(n,t+e))-t}
const q_=14,WA=200;
const TCr=1;
const Tye=4,Aye=3,eWr=.4;
const ZCr=.6,KCr=.6;
const pEr=.35,fEr=.15,mEr=6e-4,gEr=33;

// destructure the verbatim names into module scope (they were declared as consts above)

function RU(t,e,n,r){const s=2/Math.max(1e-4,n),a=s*r,o=1/(1+a+.48*a*a+.235*a*a*a),l=t.value-e,c=(t.rate+s*l)*r;return{value:e+(l+c)*o,rate:(t.rate-s*c)*o}}const Zrt=[{value:0,rate:0},{value:0,rate:0},{value:0,rate:0}];
function eC(t,e){const[n,r,s]=t,[a,o,l,c]=e,d=2*(o*s-l*r),u=2*(l*n-a*s),h=2*(a*r-o*n);return[n+c*d+o*h-l*u,r+c*u+l*d-a*h,s+c*h+a*u-o*d]}const m2e=.1,RCr=.001;
function DGt(t,e,n){const r=Math.hypot(t,e);if(r<m2e)return[0,0];const s=(Math.min(1,r)-m2e)/(1-m2e),a=Math.pow(s,n)/r;return[t*a,e*a]}
function FCr(t){const[e,n]=DGt(t.x,t.y,t.curve);if(e===0&&n===0)return[0,0,0];const r=t.level?OCr(t.aim):[eC([0,0,-1],t.aim),eC([1,0,0],t.aim)];if(!r)return[0,0,0];const[s,a]=r,o=t.maxSpeedUnitsPerS;return[(a[0]*e+s[0]*n)*o,(a[1]*e+s[1]*n)*o,(a[2]*e+s[2]*n)*o]}function OCr(t){const e=eC([0,0,-1],t),n=eC([0,1,0],t);let r=e[0]-n[0]*e[1],s=e[2]-n[2]*e[1];const a=Math.hypot(r,s);return a<RCr?null:(r/=a,s/=a,[[r,0,s],[-s,0,r]])}
function XCr(t){return[t[0].value,t[1].value,t[2].value]}
function YCr(t,e){const n=e.rig.speedMps===0?0:e.speedMps,r=FCr({x:e.stickX,y:e.stickY,aim:e.aim,maxSpeedUnitsPerS:n,curve:e.rig.stickCurve,level:e.rig.level});n>0&&(r[1]+=e.vertical*Math.max(KCr,n*ZCr));const[s,a,o]=GGt(t,r,e.rig,e.dtS);return[s,a,o]}function GGt(t,e,n,r){let s=0,a=0,o=0;t.forEach((d,u)=>{s+=d.value*d.value,a+=e[u]*e[u],o+=d.value*e[u]});const c=a<s||o<0?n.stopEaseS:n.startEaseS;return t.map((d,u)=>RU(d,e[u],c,r))}const Krt=[{value:0,rate:0},{value:0,rate:0}],Xrt=1e-4;function cje(t,e){return e===0&&Math.abs(t.value)<Xrt&&Math.abs(t.rate)<Xrt?{value:0,rate:0}:t}function QCr(t){return t[0].value===0&&t[1].value===0}function JCr(t,e){const n=e.rig.speedMps===0?e.panDegPerS*Math.PI/180:0,[r,s]=DGt(e.stickX,e.stickY,e.rig.stickCurve),a=-r*n,o=s*n,[l,c]=GGt(t,[a,o],e.rig,e.dtS);return[cje(l,a),cje(c,o)]}const eEr=25*Math.PI/180;function Yrt(t,e,n){if(n<=0)return 0;const r=e-t;return Math.atan2(Math.sin(r),Math.cos(r))/n}
function tEr(t,e){return t[0]*Math.cos(e)-t[2]*Math.sin(e)}function nEr(t,e){const n=e.rig.turnRoll*e.turnRadPerS-e.rig.strafeRoll*e.sidewaysMps/Math.max(.5,e.topMps),r=Math.max(-1,Math.min(1,n))*eEr;return cje(RU(t,r,e.rig.rollEaseS,e.dtS),r)}const rEr=3,sEr=.05,aEr=15;
function hEr(t,e){const n=i$.length;return i$[(i$.indexOf(t)+e+n)%n]}
function Vhe(t){return Math.min(1,Math.max(0,t))}function ECr(t){return t>=10?t.toFixed(0):t.toFixed(1)}
const OGt=Math.log(WA/q_);function jCr(t){return q_*Math.exp(Vhe(t)*OGt)}function ICr(t){return Vhe(Math.log(t/q_)/OGt)}function PQi(t){const e=t.trim();if(!e)return null;try{const n=new URL(e).searchParams.get("session");return n&&n.trim()?n.trim():null}catch{return/\s/.test(e)||e.includes("://")?null:e}}
function bEr(t){return{targetT:t,lens:{value:t,rate:0}}}function yEr(t,e,n){const r=Vhe(t.targetT+e*pEr*n),s=RU(t.lens,r,fEr,n);return{targetT:r,lens:s}}function vEr(t,e,n){const r=e*(n===1?gEr:1);return{...t,targetT:Vhe(t.targetT-r*mEr)}}function xEr(t){return Math.abs(t.lens.value-t.targetT)<1e-4&&Math.abs(t.lens.rate)<.001}

// exports for the runner (bundle names -> runner labels)
export {
  i$ as RIG_KEYS, BGt as RIG_DEFAULT, gq as CAMERA_RIGS, HGt as SPEED_STEPS, $Gt as PAN_STEPS,
  VGt as PAN_DEFAULT, Grt as DEFAULT_SPEEDS, jie as DEFAULT_WEIGHTS, Eie as WEIGHT_MAX,
  zCr as WEIGHT_DEADZONE, UCr as WEIGHT_STEP,
  DCr as isRigKey, UGt as isPanOnly, BCr as speedPicker, HCr as carrySpeeds, qrt as stepSpeed,
  $Cr as clampToSteps, VCr as validateSpeeds,
  HDe as clampWeight, zGt as weightScale, WCr as rigWithWeight, WGt as validateWeight, GCr as validateWeights,
  hEr as cycleRigKey, ECr as speedValueLabel,
  RU as springStep, cje as springZero, GGt as springsStep, XCr as springValues,
  DGt as curveStick, eC as quatRotate, OCr as levelBasis, FCr as stickVelocity,
  JCr as panStep, QCr as panIdle, qCr as pitchStep, DQi as clampPitch, Yrt as turnRate,
  YCr as moveStep, tEr as sidewaysMps, nEr as rollStep,
  Vhe as clamp01, jCr as zoomMm, ICr as zoomLog, bEr, yEr, vEr, xEr,
  Zrt as MOVE_SPRINGS, Krt as PAN_SPRINGS, Tye, Aye, eWr, TCr as LEVEL_ON_DEG, q_, WA,
};
