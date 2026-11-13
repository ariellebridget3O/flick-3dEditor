Dqr(t){const{scene:e,camera:n,renderer:r,meshById:s}=t,{floor:a,sun:o,applyDaylight:l}=wOr(e,{shadowMapPx:Math.min(Fqr,r.capabilities.maxTextureSize)}),c=new _qr(n,r.domElement);c.target.set(0,1,0),c.enableDamping=!0,c.rotateSpeed=Lqr,c.mouseButtons={LEFT:wm.ROTATE,MIDDLE:wm.PAN,RIGHT:null},c.enableZoom=!1;function d(){const g=[a];for(const b of s.values()){const y=b.userData.kind;y==="camera"||y==="target"||y==="spotlight"||y==="humanoid"||y==="simple_figure"||y==="group"||g.push(b)}return g}const u=new Ge,h=new On;let f=!1;c.addEventListener("start",()=>{f=!0}),c.addEventListener("end",()=>{f=!1});const m=()=>{r.getDrawingBufferSize(h);const g=h.y/2*n.projectionMatrix.elements[5]/Math.max(1e-6,n.position.distanceTo(c.target)),b=n.position.distanceTo(u)*g;if(u.copy(n.position),f||b===0||b>=Oqr)return;const y=n.position.clone(),v=c.target.clone();c.enableDamping=!1,c.update(),c.enableDamping=!0,n.position.copy(y),c.target.copy(v),c.update()};return{orbit:c,sun:o,applyDaylight:l,floor:a,walkableSurfaces:d,tick:()=>{c.enabled&&(c.update(),m())},dispose:()=>c.dispose()}}const yKt="stage-finish",Bqr=11;function $ot(t){try{const e=t?.getItem(yKt);if(!e)return null;const{enabled:n,source:r}=JSON.parse(e);return typeof n!="boolean"||r!=="auto"&&r!=="manual"?null:{enabled:n,source:r}}catch{return null}}function Hqr(t,e){try{t?.setItem(yKt,JSON.stringify(e))}catch{}}const $qr=1920*1080,Vqr=320*200,Uqr=t=>t>=Vqr,zqr=t=>t.costMs*Math.max(1,$qr/t.pixels)<=Bqr,Wqr=5,Gqr=2;function qqr(t){const e=t.now??(()=>performance.now()),n=l=>{const c=e();return l(),t.finishGpu(),e()-c};for(let l=0;l<Gqr;l++)n(t.drawPlain),n(t.drawFinished);const r=[],s=[];for(let l=0;l<Wqr;l++)r.push(n(t.drawPlain)),s.push(n(t.drawFinished));const a=l=>l.sort((c,d)=>c-d)[l.length>>1],o=a(r);return{costMs:Math.max(0,a(s)-o),plainMs:o,pixels:t.pixels}}const Zqr=30,Kqr=300;function Xqr(){let t=0,e=Zqr,n=0;return{frame:()=>++t>=e,report:r=>zqr(r)?!0:++n>=2?!1:(e=t+Kqr,null)}}const Yqr=1e3,Iye=250,Qqr=50;function Jqr(){const t=new Uint32Array(Iye+1);let e=0,n=0;const r=s=>{const a=Math.ceil(s*e);let o=0;for(let l=0;l<t.length;l++)if(o+=t[l],o>=a)return l;return Iye};return{add:s=>{!(s>0)||s>Yqr||(t[Math.min(Iye,Math.round(s))]++,e++,s>Qqr&&n++)},summary:()=>e===0?null:{frames:e,p50Ms:r(.5),p95Ms:r(.95),slowShare:Math.round(n/e*1e3)/1e3}}}const eZr=16777215,tZr=1,nZr=30,Mye={x:0,y:.42,z:5.1},Vot=.17,rZr=.085,Uot=12,sZr=.68,aZr=1,iZr=.82,oZr=12;function lZr(t){const{renderer:e,camera:n,a:r}=t,s=new Kh,a=new Xo(nZr,1,.1,20);a.position.set(Mye.x,Mye.y,Mye.z),a.lookAt(0,0,0),s.add(new VC(16777215,4473924,2));const o=new ax(16777215,4);o.position.set(5,10,4),s.add(o);let l=null,c=0;const d=new Kh,u=new J1(-1,1,1,-1,0,1),h=new rl({transparent:!0,depthTest:!1,depthWrite:!1,uniforms:{uMap:{value:null},uRadius:{value:rZr},uDim:{value:iZr},uFadeFrom:{value:sZr},uFadeTo:{value:aZr}},vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,fragmentShader:`
      uniform sampler2D uMap;
      uniform float uRadius;
      uniform float uDim;
      uniform float uFadeFrom;
      uniform float uFadeTo;
      varying vec2 vUv;

      void main() {
        // Taps on a golden-angle spiral: an even disc of samples for the cost
        // of a loop, with none of the cross-shaped artefacts a box of taps
        // leaves on a hard edge.
        vec3 sum = texture2D(uMap, vUv).rgb;
        float count = 1.0;
        for (int i = 0; i < ${Uot}; i++) {
          float a = float(i) * 2.399963;
          float r = sqrt((float(i) + 0.5) / float(${Uot}));
          vec2 off = vec2(cos(a), sin(a)) * r * uRadius;
          sum += texture2D(uMap, vUv + off).rgb;
          count += 1.0;
        }
        float d = length(vUv - 0.5) * 2.0;
        float mask = 1.0 - smoothstep(uFadeFrom, uFadeTo, d);
        gl_FragColor = vec4(sum / count * uDim, mask);
      }
    `});d.add(new Vt(new Mi(2,2),h));const f=new Vt(new jhe(fot,tZr),new Io({color:eZr,roughness:.52,metalness:0,flatShading:!0}));s.add(f);const m=n.position.clone();let g=vot(n.quaternion);const b=new Ge,y=new qn,v=new On,x=new On,w=()=>iKt(r.mode.peek(),r.playSession.peek()!==null);function k(T){b.subVectors(n.position,m),m.copy(n.position);const A=vot(n.quaternion);let C=A-g;if(C>Math.PI&&(C-=Math.PI*2),C<-Math.PI&&(C+=Math.PI*2),g=A,!w())return;b.lengthSq()>0&&(Kzr(b,n.quaternion,fot,y),f.quaternion.premultiply(y)),C!==0&&f.quaternion.premultiply(Xzr(C,y));const E=r.navBallVector.peek(),j=Math.min(1,T*oZr),I=E?E.strafe*Vot:0,N=E?E.forward*Vot:0;f.position.x+=(I-f.position.x)*j,f.position.y+=(N-f.position.y)*j}function S(){if(!w())return;e.getSize(v);const T=v.x-jw-zie,A=v.y-jw-zie,C=e.autoClear;e.autoClear=!1,e.setScissorTest(!0),e.setScissor(T,A,jw,jw),e.setViewport(T,A,jw,jw);const E=e.getPixelRatio(),j=Math.round(jw*E);(!l||c!==j)&&(l?.dispose(),l=new Wvr(j,j),l.minFilter=$i,l.magFilter=$i,c=j,h.uniforms.uMap.value=l),x.set(Math.round(T*E),Math.round(A*E)),e.copyFramebufferToTexture(l,x)