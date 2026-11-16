class __Validate__ {
turnCameraToward=(e,n)=>{const r=this.objects.peek(),s=r[e];if(!s||!this.updateObjectTransform)return;const a=Zo(s,r);this.updateObjectTransform(e,{rotation:cN(s,r,{...a,rotation:kv(a.position,n)}).rotation})};
}
