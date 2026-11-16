(() => {
function rx(t){const e=t.tracks.map(r=>({trackId:r.id,characterId:r.characterId,startS:r.items[0]?.startS??0,items:r.items.map(s=>({item:s,startS:s.startS,endS:s.startS+yd(s)}))})),n=Math.max(0,...e.flatMap(r=>r.items.map(s=>s.endS)));return{tracks:e,durationS:n}}
});
