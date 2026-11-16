class __Validate__ {
aimCameraAtSubject=(e,n,r,s,a,o=0)=>{if(!this.updateObjectTransform||n.some(g=>g.startS<s&&Fp(g)&&g.kind!=="cam-still"))return;const c=this.objects.peek(),d=c[e],u=this.subjectAimPoint(a,o);if(!d||!u)return;const h=d.targetId,f=h?c[h]:void 0,m=n.some(g=>g.id!==r&&YN(g));h&&f&&h!==a&&!m&&this.updateObjectTransform(h,{position:s$(f,c,u)}),this.turnCameraToward(e,u)};
}
