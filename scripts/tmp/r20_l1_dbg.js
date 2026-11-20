(() => {
  const a = window.__app;
  localStorage.setItem('stage-finish', JSON.stringify({enabled:true, source:'manual'}));
  a.setHdr({enabled:true, bloom:0.35, exposure:1.0});
  a.setSkyStyle('realistic');
  return 'set';
})()
