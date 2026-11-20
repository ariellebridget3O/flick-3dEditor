(() => {
  const a = window.__app;
  localStorage.setItem('stage-finish', JSON.stringify({enabled:true, source:'manual'}));
  a.setLightCustom(128.66, 57.38);
  a.setSkyStyle('realistic');
  return 'set';
})()
