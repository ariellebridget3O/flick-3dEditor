class __Validate__ {
subjectAimPoint=(e,n=0)=>{const r=this.objects.peek(),s=r[e];if(!s)return null;const a=Zo(s,r).position;return[a[0],a[1]+NP(e,r)+n,a[2]]};
}
