(() => {
function z(){const pe=t.drawPreview.peek(),ce=pe?e.meshById.get(pe.id):void 0;!pe||!ce||(Hie(ce,F.set(...pe.position),B.setFromEuler(H.set(...pe.rotation))),pe.look&&t.objects.peek()[pe.id]?.kind==="simple_figure"&&o$(ce,kje(pe.look)))}
});
