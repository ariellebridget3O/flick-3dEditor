class __Validate__ {
appendActionToObject=(e,n)=>{if(!this.canDropActionOnObject(e,n))return;const s=this.show.peek().tracks.find(a=>a.characterId===e)?.id??this.addPerformanceTrack(e);s&&this.addActionToTrack(s,n)};
}
