(() => {
  const a = window.__app;
  const out = { appKeys: Object.keys(a).filter(k => /show|track|page|store/i.test(k)) };
  try { out.showKeys = a.show ? Object.keys(a.show) : null; } catch (e) { out.showErr = e.message; }
  try { out.storesKeys = a.stores ? Object.keys(a.stores) : null; } catch (e) {}
  return JSON.stringify(out);
})()
