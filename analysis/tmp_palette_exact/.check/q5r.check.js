(() => {
function q5r(t){const e=t.items.filter(a=>a.id!==t.draggedId),n={startS:t.desiredStartS,endS:t.desiredStartS+t.durationS};if(!e.some(a=>oje(n,wie(a)))){const{startS:a,guidesS:o}=_ie({desiredStartS:t.desiredStartS,durationS:t.durationS,obstacles:e.map(wie),markersS:t.markersS,radiusS:t.radiusS,fallbackStartS:t.fallbackStartS});return{kind:"move",startS:a,guidesS:o}}return{kind:"reorder",toIndex:e.filter(a=>G5r(a)<=t.desiredStartS).length}}
});
