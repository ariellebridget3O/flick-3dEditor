(async () => {
  const app = window.__app;
  if (!app.page || !app.page.seek) return 'no page.seek API';
  await app.page.seek(2.51);
  await new Promise(r => setTimeout(r, 600));
  return 'seeked 2.5, t=' + (app.page.timeS ?? app.page.t ?? '?');
})()
