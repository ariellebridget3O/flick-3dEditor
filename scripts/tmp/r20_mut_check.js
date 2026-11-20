import('/editor/js/const.js').then(m => {
  const before = m.C.HDR_SKY_LIFT;
  try { m.C.HDR_SKY_LIFT = 1.25; } catch (e) { window.__mutErr = e.message; }
  window.__mutCheck = JSON.stringify({ before, after: m.C.HDR_SKY_LIFT, frozen: Object.isFrozen(m.C), err: window.__mutErr || null });
}).catch(e => { window.__mutCheck = 'IMPORT ERR: ' + e.message; });
'kicked'
