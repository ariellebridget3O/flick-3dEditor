(async () => {
  const t = JSON.parse(localStorage.getItem('sb-auth-auth-token'));
  const jwt = t.access_token || t.currentSession?.access_token;
  const A = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cGl3a21xeXZvY3p6YnVtbWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjA5MjMsImV4cCI6MjA2NTkzNjkyM30.c8ruF0zJCi1JrpSnpPR3kKcFTOQ6bwIbhMYBqRmnF58';
  const u = 'https://auth.flick.art/rest/v1/stage_scenes?project_id=eq.30f2a9fa-70ac-4fab-b488-1eef74d6217a&select=scene_id,scene';
  const r = await fetch(u, { headers: { apikey: A, Authorization: 'Bearer ' + jwt } });
  const j = await r.json();
  const row = j.find(x => x.scene_id === '27b98b6b-8a4d-4b3a-a810-7d542342ce41');
  window.__liveScene = typeof row.scene === 'string' ? JSON.parse(row.scene) : row.scene;
  // hash the JSON deterministically
  const s = JSON.stringify(window.__liveScene);
  let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return 'bytes=' + s.length + ' hash=' + h;
})()
