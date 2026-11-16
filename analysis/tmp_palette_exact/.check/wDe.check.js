(() => {
function wDe(t){t.decompose(GB,hie,qB),zb.setFromQuaternion(hie,"XYZ");const e=[s2e(zb.x+Math.PI),s2e(Math.PI-zb.y),s2e(zb.z+Math.PI)],n=Math.abs(e[0])+Math.abs(e[2])<Math.abs(zb.x)+Math.abs(zb.z)-1e-9?e:[zb.x,zb.y,zb.z];return{position:[GB.x,GB.y,GB.z],rotation:n,scale:[qB.x,qB.y,qB.z]}}
});
