(async () => {
  const t = JSON.parse(localStorage.getItem('sb-auth-auth-token'));
  const jwt = t.access_token || t.currentSession?.access_token;
  const A = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cGl3a21xeXZvY3p6YnVtbWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjA5MjMsImV4cCI6MjA2NTkzNjkyM30.c8ruF0zJCi1JrpSnpPR3kKcFTOQ6bwIbhMYBqRmnF58';
  const r = await fetch('https://auth.flick.art/rest/v1/stage_scenes?scene_id=eq.aa11e0a1-0000-4000-8000-00000000a111', {
    method: 'DELETE',
    headers: { apikey: A, Authorization: 'Bearer ' + jwt }
  });
  return 'DELETE status=' + r.status;
})()
