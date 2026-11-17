(async () => {
  const t = JSON.parse(localStorage.getItem('sb-auth-auth-token'));
  const jwt = t.access_token || t.currentSession?.access_token;
  const A = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cGl3a21xeXZvY3p6YnVtbWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjA5MjMsImV4cCI6MjA2NTkzNjkyM30.c8ruF0zJCi1JrpSnpPR3kKcFTOQ6bwIbhMYBqRmnF58';
  const u = 'https://auth.flick.art/rest/v1/stage_scenes?project_id=eq.30f2a9fa-70ac-4fab-b488-1eef74d6217a&select=scene_id,scene';
  const r = await fetch(u, { headers: { apikey: A, Authorization: 'Bearer ' + jwt } });
  const j = await r.json();
  const want = '27b98b6b-7a4d-4b3a-a810-7d542342ce41';
  const info = (j || []).map(x => ({ id: x.scene_id, eq: x.scene_id === want, has: x.scene !== undefined }));
  return JSON.stringify({ want, info });
})()
