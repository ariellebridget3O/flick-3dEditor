(async () => {
  // read supabase config from the auth token key + the anon key from the bundle config on window
  const raw = localStorage.getItem('sb-auth-auth-token');
  if (!raw) return 'no sb-auth-auth-token';
  const tok = JSON.parse(raw);
  const jwt = tok.access_token || (tok.currentSession?.access_token);
  // find the supabase URL: try common window globals
  let url = null, anon = null;
  for (const k of Object.keys(window)) {
    try {
      const v = window[k];
      if (v && v.supabaseUrl && v.supabaseKey) { url = v.supabaseUrl; anon = v.supabaseKey; break; }
    } catch {}
  }
  if (!url) url = 'https://auth.flick.art'; // Ce = createClient("https://auth.flick.art", zDn) — custom-domain supabase
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cGl3a21xeXZvY3p6YnVtbWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjA5MjMsImV4cCI6MjA2NTkzNjkyM30.c8ruF0zJCi1JrpSnpPR3kKcFTOQ6bwIbhMYBqRmnF58'; // zDn bundle literal (public anon key)
  const r = await fetch(url + '/rest/v1/stage_scenes?scene_id=eq.27b98b6b-7a4d-4b3a-a810-7d542342ce41&select=*', {
    headers: { apikey: ANON, Authorization: 'Bearer ' + jwt }
  });
  const j = await r.json();
  if (!Array.isArray(j) || !j.length) return 'REST status=' + r.status + ' rows=' + JSON.stringify(j).slice(0, 200);
  const row = j[0];
  const scene = typeof row.scene === 'string' ? JSON.parse(row.scene) : row.scene;
  return JSON.stringify({
    url,
    id: row.id, name: row.name, project: row.project_id, updated: row.updated_at,
    sceneV: scene.v, objects: Object.keys(scene.objects || {}), light: scene.light,
    tracks: (scene.show?.tracks || []).map(t => (t.items || []).map(i => i.kind).join(','))
  });
})()
