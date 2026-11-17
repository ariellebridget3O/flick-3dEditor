(() => {
  // try synthetic events on the viewport canvas: pointermove streams (what OrbitControls listens to)
  const c = document.querySelector('canvas.ph-viewport-capture');
  if (!c) return 'no canvas';
  const r = c.getBoundingClientRect();
  const mk = (type, x, y) => new PointerEvent(type, {
    bubbles: true, composed: true, pointerType: 'mouse', pointerId: 1, buttons: type === 'pointermove' ? 0 : 1,
    clientX: r.x + x, clientY: r.y + y, isPrimary: true
  });
  c.dispatchEvent(mk('pointermove', 300, 150));
  c.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r.x + 310, clientY: r.y + 160 }));
  c.dispatchEvent(mk('pointermove', 320, 170));
  return 'dispatched moves on ' + r.width + 'x' + r.height;
})()
