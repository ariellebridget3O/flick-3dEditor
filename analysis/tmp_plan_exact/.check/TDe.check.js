(() => {
function TDe(t){const e=Z8r.set(0,0,-1).applyEuler(K8r.set(...t.rotation)),n=t.position[1];if(n<=0||e.y>-.05)return null;const r=n/-e.y,[s,a,o]=t.scale;return{x:t.position[0]+e.x*r,z:t.position[2]+e.z*r,radiusM:r*Math.tan(Rhe({x:s,y:a,z:o}))}}
});
