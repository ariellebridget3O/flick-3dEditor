class __Validate__ {
duplicateItem=(e,n,r,s)=>{const a=this.show.peek(),o=a.tracks.find(u=>u.id===e)?.items.find(u=>u.id===n);if(!o)return null;const l=a.tracks.find(u=>u.id===r);if(!l||!Art(o,this.objects.peek()[l.characterId]?.kind))return null;const c=an(),d=DHr({...structuredClone(o),id:c,startS:Math.max(0,s)},l.characterId);return this.updateTrackItems(r,u=>[...u,d]),c};
}
