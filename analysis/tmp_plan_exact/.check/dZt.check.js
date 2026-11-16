(() => {
function dZt(t){const{base:e,out:n}=t;n.position.set(e.position[0],e.position[1],e.position[2]),Lie.set(e.rotation[0],e.rotation[1],e.rotation[2]),n.quaternion.setFromEuler(Lie),n.fovDeg=Z_(e.focalLengthMm,t.aspect);let r=!1;for(const s of t.items){if(!Fp(s))continue;if(t.timeS<s.startS)break;r=!0;const a=yd(s);if(fFr(s,Math.min(t.timeS-s.startS,a),a,t),t.timeS<s.startS+a)break}return r}
});
