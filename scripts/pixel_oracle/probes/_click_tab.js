(() => {
  // the header tab strip: tabs at y≈49 under the top bar; find Scene 1 tab by position
  const btns = [...document.querySelectorAll('button')].filter(b => {
    const r = b.getBoundingClientRect();
    return Math.round(r.y) === 49 && Math.round(r.x) === 45;
  });
  if (!btns.length) return 'no tab at 45,49';
  const tab = btns[0];
  // find the clickable tab container (parent with _tab_ class)
  const tabEl = tab.closest('[class*=_tab_]');
  if (!tabEl) return 'no tab container';
  tabEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0 }));
  tabEl.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse', button: 0 }));
  tabEl.click();
  return 'dispatched on ' + (tabEl.className || '').toString().slice(0, 60);
})()
