(() => {
  const k = Object.keys(localStorage).find(x => x.startsWith('ph_'));
  const b = JSON.parse(localStorage.getItem(k));
  const ov = { 'stage-3d': true, 'stage-scene-node': true };
  if (b.$override_feature_flags) Object.assign(b.$override_feature_flags, ov);
  else b.$override_feature_flags = ov;
  localStorage.setItem(k, JSON.stringify(b));
  const back = JSON.parse(localStorage.getItem(k));
  return 'injected:' + k + ' flags=' + JSON.stringify(back.$override_feature_flags);
})()
