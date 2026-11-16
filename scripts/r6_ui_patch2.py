#!/usr/bin/env python3
"""Round-6 ui.js patch #2: E2 (modeSwitch removal + collapse wiring), A2 (+Track dropdown),
menu upgrade (select new segment + scroll), empty-lane clear, rCr helper."""
import sys
p = '/home/z/my-project/flick-3dEditor/editor/js/ui.js'
s = open(p).read()
fails = []

def rep(old, new, tag):
    global s
    if old not in s:
        fails.append(tag)
        return
    s = s.replace(old, new, 1)

# ---- E2: remove modeSwitch handler (element deleted from HTML) ----
rep("""  $('modeSwitch').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    [...$('modeSwitch').children].forEach(x => x.classList.toggle('on', x === b));
    app.page.controlMode = b.dataset.m;
    app._applyControlMode();
  });
""", """  // round 6 E2: Default/Unreal control-mode switch REMOVED by user direction
  // (standard units/format only; controlMode stays 'default' — WASD nav unaffected)
  document.querySelectorAll('[data-collapse]').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(btn.dataset.collapse);
      panel?.classList.toggle('collapsed');
    });
  });
""", 'E2-modeSwitch')

# ---- A2: + Track dropdown (rCr) ----
rep("""  $('btnAddTrack').onclick = () => {
    const objs = Object.entries(app.objects.all()).filter(([id, o]) =>
      !app.show.trackOf(id) && (isPersonKindO(o.kind) || o.kind === 'camera'));
    if (!objs.length) { app.toast('No animatable objects (add a Human or Camera first)'); return; }
    const [id] = objs[0];
    app.show.ensureTrack(id);
    refreshTimeline(app);
  };""", """  // round 6 A2: live rCr Add-track dropdown (search + every object WITHOUT a track —
  // all animatable kinds incl. groups; the old silent first-candidate add felt like a no-op)
  $('btnAddTrack').onclick = () => {
    const paired = o => o.kind === 'target' && Object.values(app.objects.all()).some(c => c.targetId === o.id);
    const cands = Object.entries(app.objects.all())
      .filter(([id, o]) => !app.show.trackOf(id) && !o.parentId && !paired(o));
    if (!cands.length) { app.toast('Every object already has a track'); return; }
    openAddTrackMenu(app, $('btnAddTrack'), cands);
  };""", 'A2-btnAddTrack')

# ---- menu: select new segment + scroll ----
rep("""  menu.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    menu.remove();
    addItemKind(app, char, b.dataset.kind, app.page.playheadS);
    refreshTimeline(app);
  };
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);""",
"""  menu.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    menu.remove();
    const item = addItemKind(app, char, b.dataset.kind, app.page.playheadS);
    refreshTimeline(app);
    if (item) {                                   // round 6: new item becomes the selected segment
      app.page.selectedSegment = { trackId: btn.dataset.track, itemId: item.id };
      refreshInspector(app);
      document.querySelector('.blk[data-item="' + item.id + '"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  };
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);""",
'menu-select-segment')

# ---- empty-lane clear (live clearFocus) ----
rep("""  lanes.querySelectorAll('.blk').forEach(b => wireBlock(app, b, pps, magnet, layout, lanes));
}""",
"""  lanes.querySelectorAll('.blk').forEach(b => wireBlock(app, b, pps, magnet, layout, lanes));
  // round 6: empty-lane click clears the selected segment (live clearFocus) — closes the Action section
  lanes.querySelectorAll('.lane-body').forEach(lb => lb.addEventListener('click', e => {
    if (e.target !== lb) return;
    if (app.page.selectedSegment) {
      app.page.selectedSegment = null;
      refreshTimeline(app);
      refreshInspector(app);
    }
  }));
}

// live rCr: portal dropdown above the button — search input + object options
function openAddTrackMenu(app, btn, cands) {
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  const render = list => {
    menu.innerHTML = '<input class="ctx-search" placeholder="Search…">' +
      (list.length
        ? list.map(([id, o]) => '<button data-id="' + id + '">' + escAttr(o.name ?? o.kind) +
            ' <span style="color:var(--text-dim)">· ' + o.kind + '</span></button>').join('')
        : '<div class="hint" style="padding:8px 10px">No matches</div>');
    const search = menu.querySelector('.ctx-search');
    search.oninput = () => {
      const q = search.value.trim().toLowerCase();
      render(q ? cands.filter(([id, o]) => (o.name ?? '') + ' ' + o.kind.toLowerCase().includes(q)) : cands);
      menu.querySelector('.ctx-search').focus();
    };
    menu.querySelectorAll('button').forEach(b => b.onclick = () => {
      menu.remove();
      app.show.ensureTrack(b.dataset.id);
      refreshTimeline(app);
      refreshInspector(app);
    });
  };
  render(cands);
  document.body.appendChild(menu);
  const r = btn.getBoundingClientRect();
  const mw = Math.max(r.width, 200);
  menu.style.left = Math.min(r.left, innerWidth - mw - 8) + 'px';
  menu.style.top = Math.max(8, r.top - menu.offsetHeight - 6) + 'px';   // above the button (live portal)
  menu.style.minWidth = mw + 'px';
  menu.querySelector('.ctx-search')?.focus();
  setTimeout(() => document.addEventListener('click', e => { if (!menu.contains(e.target)) menu.remove(); }, { once: true }), 0);
}""", 'empty-lane+rCr')

open(p, 'w').write(s)
if fails:
    print('FAILED anchors:', fails); sys.exit(1)
print('all ui.js patches applied; lines:', len(s.splitlines()))
