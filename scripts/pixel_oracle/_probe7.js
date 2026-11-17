(() => {
  // components column: the aside panel right of the viewport
  const aside = document.querySelector('aside[class*=_panel_]');
  if (!aside) return 'no aside';
  const text = aside.textContent.trim().slice(0, 300);
  const sceneEmpty = /Scene is empty/i.test(text);
  // count object rows (buttons with Delete object siblings)
  const dels = [...aside.querySelectorAll('button')].filter(b => /Delete object/i.test(b.getAttribute('aria-label') || '')).length;
  return JSON.stringify({ sceneEmpty, dels, head: text.slice(0, 160) });
})()
