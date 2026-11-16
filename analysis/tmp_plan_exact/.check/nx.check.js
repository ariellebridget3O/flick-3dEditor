(() => {
function nx(t){if(t.length<2)return t.map(r=>[...r.pos]);const e=Rtt.get(t);if(e)return e;const n=[[...t[0].pos]];for(let r=0;r<t.length-1;r++){const s=t[r],a=t[r+1],o=[s.pos[0]+s.out[0],s.pos[1]+s.out[1],s.pos[2]+s.out[2]],l=[a.pos[0]+a.in[0],a.pos[1]+a.in[1],a.pos[2]+a.in[2]];for(let c=1;c<=Ptt;c++)n.push(E2r(s.pos,o,l,a.pos,c/Ptt))}return Rtt.set(t,n),n}
});
