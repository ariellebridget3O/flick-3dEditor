(async () => {
  const t = JSON.parse(localStorage.getItem('sb-auth-auth-token'));
  const jwt = t.access_token || t.currentSession?.access_token;
  const A = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cGl3a21xeXZvY3p6YnVtbWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjA5MjMsImV4cCI6MjA2NTkzNjkyM30.c8ruF0zJCi1JrpSnpPR3kKcFTOQ6bwIbhMYBqRmnF58';
  const scene = {
    v: 10,
    show: { name: 'Show 1', tracks: [] },
    light: { azimuthDeg: 128.66, elevationDeg: 57.38 },
    objects: {},
    recordAspect: '16:9'
  };
  const body = {
    scene_id: 'aa11e0a1-0000-4000-8000-00000000a111',
    name: 'Oracle R11 Probe',
    project_id: '30f2a9fa-70ac-4fab-b488-1eef74d6217a',
    scene
  };
  const r = await fetch('https://auth.flick.art/rest/v1/stage_scenes', {
    method: 'POST',
    headers: { apikey: A, Authorization: 'Bearer ' + jwt, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  return 'POST status=' + r.status + ' -> ' + JSON.stringify(j).slice(0, 200);
})()
