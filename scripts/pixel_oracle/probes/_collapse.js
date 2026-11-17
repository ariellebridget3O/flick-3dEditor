(() => {
  const acts = [];
  // collapse the chat panel (button aria "Collapse panel" near top right)
  const col = [...document.querySelectorAll('button')].find(b => /Collapse panel/i.test(b.getAttribute('aria-label') || ''));
  if (col) { col.click(); acts.push('collapsed chat'); }
  // hide components column
  const hide = [...document.querySelectorAll('button')].find(b => /Hide the components column/i.test(b.getAttribute('aria-label') || ''));
  if (hide) { hide.click(); acts.push('hid components'); }
  return acts.join(', ') || 'nothing found';
})()
