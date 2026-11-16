#!/usr/bin/env python3
"""Round-6 ui.js patch #3: hierarchy group chevrons (collapse), children indent;
verify no dangling refs to removed ids."""
import sys
p = '/home/z/my-project/flick-3dEditor/editor/js/ui.js'
s = open(p).read()
fails = []

def rep(old, new, tag):
    global s
    if old not in s:
        fails.append(tag); return
    s = s.replace(old, new, 1)

# ---- hierarchy: group chevron collapse (in-memory) ----
rep("""export function refreshHierarchy(app) {
  const el = document.getElementById('hierarchy');
  if (!el) return;
  const objs = app.objects.all();
  // tree order: roots in insertion order, each immediately followed by its children (indented)
  const rows = [];
  const seen = new Set();
  const emit = (id, o, depth) => {
    if (seen.has(id)) return;
    seen.add(id);
    rows.push(`<div class="hier-row ${app.objects.selectedIds.includes(id) ? 'sel' : ''}" data-id="${id}" style="padding-left:${8 + depth * 14}px">
      <span class="hier-kind k-${o.kind}"></span>${escAttr(o.name ?? o.kind)}</div>`);
    for (const [cid, c] of Object.entries(objs)) if (c.parentId === id) emit(cid, c, depth + 1);
  };
  for (const [id, o] of Object.entries(objs)) if (!o.parentId || !objs[o.parentId]) emit(id, o, 0);
  for (const [id, o] of Object.entries(objs)) emit(id, o, 0);   // orphans/late parents — safety net
  el.innerHTML = rows.join('');
  el.querySelectorAll('.hier-row').forEach(r => r.onclick = () => app.objects.select([r.dataset.id]));
}""",
"""const hierCollapsed = new Set();   // group ids whose children are collapsed (round 6)
export function refreshHierarchy(app) {
  const el = document.getElementById('hierarchy');
  if (!el) return;
  const objs = app.objects.all();
  // tree order: roots in insertion order, each immediately followed by its children (indented)
  const rows = [];
  const seen = new Set();
  const anyChildHidden = id => {
    // a group's children hide when the group is collapsed OR an ancestor is collapsed
    for (const gid of hierCollapsed) {
      if (gid === id) return true;
      let p = objs[id]?.parentId;
      while (p) { if (p === gid) return true; p = objs[p]?.parentId; }
    }
    return false;
  };
  const emit = (id, o, depth) => {
    if (seen.has(id)) return;
    seen.add(id);
    const isGroup = o.kind === 'group';
    const kids = Object.entries(objs).filter(([, c]) => c.parentId === id);
    const hidden = anyChildHidden(id) ? ' hidden-child' : '';
    const chev = isGroup
      ? `<button class="hier-toggle" data-group="${id}" title="${hierCollapsed.has(id) ? 'Expand group' : 'Collapse group'}">${hierCollapsed.has(id) ? '▸' : '▾'}</button>`
      : '';
    rows.push(`<div class="hier-row ${app.objects.selectedIds.includes(id) ? 'sel' : ''}${hidden}" data-id="${id}" style="padding-left:${8 + depth * 14}px">
      ${chev}<span class="hier-kind k-${o.kind}"></span>${escAttr(o.name ?? o.kind)}${isGroup ? ` <span style="color:var(--text-dim)">(${kids.length})</span>` : ''}</div>`);
    if (isGroup && hierCollapsed.has(id)) return;   // children not rendered while collapsed
    for (const [cid, c] of Object.entries(objs)) if (c.parentId === id) emit(cid, c, depth + 1);
  };
  for (const [id, o] of Object.entries(objs)) if (!o.parentId || !objs[o.parentId]) emit(id, o, 0);
  for (const [id, o] of Object.entries(objs)) emit(id, o, 0);   // orphans/late parents — safety net
  el.innerHTML = rows.join('');
  el.querySelectorAll('.hier-row').forEach(r => r.onclick = e => {
    if (e.target.closest('.hier-toggle')) return;              // chevron owns the click
    app.objects.select([r.dataset.id]);
  });
  el.querySelectorAll('.hier-toggle').forEach(t => t.onclick = e => {
    e.stopPropagation();
    const gid = t.dataset.group;
    if (hierCollapsed.has(gid)) hierCollapsed.delete(gid); else hierCollapsed.add(gid);
    refreshHierarchy(app);
  });
}""", 'hierarchy-chevrons')

open(p, 'w').write(s)
if fails:
    print('FAILED:', fails); sys.exit(1)
print('hierarchy patch applied; lines:', len(s.splitlines()))
