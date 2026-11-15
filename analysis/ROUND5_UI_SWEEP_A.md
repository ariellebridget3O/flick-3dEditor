# ROUND 5 — UI SWEEP A: top bar · hierarchy · inspector · keyboard shortcuts
**Task R5-A1** · Editor `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1` (session `?v=a3`→`a4`, close+open between code states) · headless `agent-browser --session r5a1`.
**Tree audited:** HEAD `2311e71` ("round 5 repair: REBASE onto round-4 tree") — i.e. the *repaired* tree, **not** the `a55a900` state that `ROUND5_GAP_MATRIX.md` §0 describes (lasso/navball/take-range/place are restored at this HEAD; the §0 "regressions" table is stale).
**Scope discipline:** controls that EXIST in the port were exercised and their effect verified (store state via `__app`, mesh props, DOM, console). Features the gap matrix already lists as **MISSING** are only listed in §5 (confirmed absent, not re-counted). Path editing UX, timeline drag/trim/keyframes, tools/gizmo dragging and playback are Agent B's scope (touched only where an inspector button/shortcut crosses the boundary).
**Console:** 0 errors / 0 warnings across the entire session (capture verified live with a probe message).

Legend: WORKS · NO-OP (control exists, does nothing) · BROKEN (errors or wrong behavior) · DIVERGES (works but differs from `EDITOR_UX.md`/`DOM_REFERENCE.md`; citation given) · KNOWN (already tracked in `ROUND5_GAP_MATRIX.md` — not counted as new).

---

## 1. Full control inventory exercised (control | action | observed | expected | status | priority)

### 1.1 Top bar
| Control | Action | Observed | Expected | Status | Priority |
|---|---|---|---|---|---|
| `#sceneName` input | type "My Audit Scene" + change/blur | Field shows new text; **no listener** — `currentSceneJSON().show.name` stays "Synthetic"; autosave/save never see it | Name edits persist (original: editable project name; offline port could write `show.name`) | **NO-OP** | **P3** |
| `#sceneName` display on `?scene=` load | page load | Shows HTML default "Scene 1" while loaded show is "Synthetic" (value only set on file-open path, `ui.js:59`) | Reflects loaded scene name | BROKEN (display nit) | P3 |
| `#btnOpen` / `#fileInput` | click + File via DataTransfer | Scene JSON loaded: objects replaced, name field + `recordAspect` updated, `showName` set | Same | WORKS | — |
| `#btnSave` | click (blob intercepted) | Downloads `scene.json`, v10, complete: objects + show + recordAspect + light | Same (offline substitute for server save) | WORKS | — |

### 1.2 Stage header
| Control | Action | Observed | Expected | Status | Priority |
|---|---|---|---|---|---|
| `#btnLight` popover toggle | click ×2 | Opens (`.open`), closes on 2nd click | Same | WORKS | — |
| Light presets (4 buttons) | click preset 4 (128.66°/−28°) | `app.light` az 129 / el −28 | Same | WORKS | — |
| Light `#azNum`/`#elNum` | change 200/45 | Applied (200/45) | Same | WORKS | — |
| Sun puck drag | pointerdown→move | az 135 / el −12, knob repositioned | Same | WORKS | — |
| `#viewSwitch` Scene/Cameras | click Cameras→Scene | stageView switches; frame guide shown with record-aspect letterbox; editor-cam fov adopted (84) then restored (50) | Same (`XGt/o2r/MGr`) | WORKS | — |
| `#modeSwitch` Default/Unreal | click | `page.controlMode` switches, `.on` class follows | Same | WORKS | — |

### 1.3 Add grid (right dock "Add")
| Control | Action | Observed | Expected | Status | Priority |
|---|---|---|---|---|---|
| Human / Figure / Camera / Target / Spotlight / Cube / Sphere / Cylinder / Group (9 buttons) | click each | Object added, selected, focused, mesh created; per-kind defaults correct (humanoid `animation {clip:idle, playing:false}`; camera focal 50 + shake off; spotlight round/70/30) | Same | WORKS | — |
| — spawn position | (side observation) | All spawn stacked at `[0,0,0]`/`[0,1,0]`, no grid slot, fixed names | 5×6 grid @1.5 m, name counters (`EDITOR_UX` §2.5 L145-147) | KNOWN (gap matrix §1, P1) | — |
| `Props…` (`#btnPropPicker`) | open, browse categories, search "chair", click item | Modal with 8 categories, search filters (10 hits), item adds prop object (mesh created), modal closes, prop selected | Same | WORKS | — |

### 1.4 Hierarchy panel (Objects)
| Control | Action | Observed | Expected | Status | Priority |
|---|---|---|---|---|---|
| Row click (Walker/OrbitCam/Podium) | click | Selects object, row gets `.sel`, inspector re-renders per kind, cam footer appears only for camera | Same | WORKS | — |
| Grouped rows rendering | ctrl+G two objects | Children indented (22px) **but in map-insertion order while the Group row renders at the END of the list** — indented children visually attach to unrelated rows ("Walker(indent), OrbitCam, Podium(indent), …, Group") | Tree order: group row precedes its children (original components column, DOM_REFERENCE §A.3) | **BROKEN** | **P2** |
| Per-row delete / drag-reorder / multi-select | — | Absent (click = single select only) | Original rows have delete button + draggable | KNOWN (gap matrix §1 P3) | — |

### 1.5 Inspector — fields per kind
| Control | Action | Observed | Expected | Status | Priority |
|---|---|---|---|---|---|
| Kind label + per-kind field set | select each kind | humanoid: TRS + Clip + Playing; camera: TRS + Focal + Shake; spotlight: TRS + Shape/Intensity/Diffusion; cube/target/group/prop: TRS (+prop readonly row) | Field sets match port design | WORKS | — |
| Name field (`#inspName`) | change | Store updated, hierarchy row label updates | Same | WORKS | — |
| Name w/ HTML chars ("`Pod<i>um</i>`") | change | `<i>` parsed as markup in hierarchy row (`escAttr` escapes `"` only, `ui.js:344`) — names like `<input…` would corrupt the inspector DOM | Escaped text (`&<>` too) | DIVERGES | P3 |
| Position X/Y/Z (all kinds) | set y=2 | `obj.position` + mesh.position sync (Walker [0,2,0]) | Same | WORKS | — |
| Rotation X/Y/Z | set y=0.5 | 0.5 **radians** stored & displayed, mesh.rotation.y=0.5 | **Degrees** (DOM_REFERENCE L68 "Rotation … degrees"; typing 90 → 90 rad ≈ 5156°) | DIVERGES | KNOWN (gap matrix §11 "rotation-as-degrees", P1-tracked) |
| Scale X/Y/Z | set x=2 | Store + mesh scale sync | Same | WORKS | — |
| Focal mm (camera) | 500 → 200, 5 → 14, 85 → 85 | Clamped to [14,200], stored per-object | Same clamp (`WFa` range) | WORKS | — |
| Focal mm → page sync | set 85 | `obj.focalLengthMm=85` but `page.focalLengthMm` stays 50/53 → Cameras-view frame-guide fov follows the *other* control (lens slider) | Single page-level focal; inspector mm field drives it (`setFocalLengthMm`, EDITOR_UX L205-207) | **DIVERGES** | **P2** |
| Shake select (camera) | heavy | Stored `shake:'heavy'` (4 options off/subtle/medium/heavy); never applied at playback | Applied via camera rigs | WORKS (storage) / KNOWN apply gap (§6 P1) | — |
| Spotlight Shape select | round→square | `spotlight.shape` updated (light rebuild path verified round-5) | Same | WORKS | — |
| Spotlight Intensity | 500 | Clamped to 100 | Same | WORKS | — |
| Spotlight Diffusion | −20 | Clamped to 0 | Same | WORKS | — |
| Clip select (humanoid) | dance / walk | `animation.clip` updated; rest pose re-applied per clip (DEF-head world pos differs walk vs dance, held while paused) | Same (round-5 fix) | WORKS | — |
| Playing checkbox (humanoid) | on/off | `animation.playing` toggles; live pose advances while on | Same | WORKS | — |
| Multi-select inspector | select Walker+Podium | Inspector shows primary (last) selection (Podium) | Focused-object semantics | WORKS | — |

### 1.6 Inspector — action buttons (`.insp-actions`)
| Control | Action | Observed | Expected | Status | Priority |
|---|---|---|---|---|---|
| ＋ Walk path (humanoid/object) | click | Path item created, paint mode entered, first anchor seeded; Esc/Enter finish; <2 anchors → item auto-removed | Same | WORKS | — |
| ＋ Camera path (camera) | click | cam-path item + paint mode; Esc finish | Same | WORKS | — |
| ＋ Clip (humanoid) | click | clip item added (idle, default dur) at playhead via placement | Same | WORKS | — |
| ＋ Camera move (camera) | click | cam-move (orbit ccw 360°) added | Same | WORKS | — |
| **Kind gating of the 4 ＋ buttons** | campath/cammove/clip on **cube**; walk on **camera** | All succeed silently: cam-move + cam-path + clip items created on the *cube's* track; walk-path item + paint on the *camera's* track. No error, no toast. Port's own lane "+" menu gates correctly (`ui.js:621-623`) — inspector bypasses the gate | Original gates by kind: Animate actions "Humans only" (DOM_REFERENCE L62), camera actions camera-only (`canAddAction`/`a$`, EDITOR_UX §2.5 L144) | **DIVERGES** | **P2** |
| Focus | click (camera moved away first) | Orbit cam flies to object bounds ([30,20,30]→[3.4,3.2,3.4], target→object center) | Same | WORKS | — |
| Duplicate | click on Walker / OrbitCam | Copy object created at +0.5 x, selected. **Tracks NOT cloned** — "Walker copy" has no path/clip track, "OrbitCam copy" no cam-move track. Root cause: scene-JSON objects have **no inline `id`** (`schema.js` normalize `objects[id]={...obj}` never injects it; sample + saved files omit it) → `duplicate()`/`paste()` build `idMap.set(undefined, nid)` → `cloneTracksFor()` matches nothing. UI-added objects (id injected by `store.add`) clone fine. Save round-trip preserves the missing ids | Clone incl. tracks + camera target (gap matrix §1 lists copy/paste as "P+F" — true only for UI-added objects) | **BROKEN** | **P1** |
| Copy/Paste (ctrl+C/V, same `idMap` path) | copy Walker, paste | Same silent track-clone failure for loaded objects; +0.5 offset only (known §1 P3 parity) | Tracks cloned w/ subgraph | **BROKEN** (same root cause) | **P1** |
| Delete | click | Object removed, inspector resets to hint, hierarchy updates | Same | WORKS | — |
| Group inspector (via ctrl+G) | create group of 2, edit position | Group TRS fields present; group position moves children (cube world x 0→5); deleting group re-parents children to root | Same (ungroup missing = KNOWN §1 P2) | WORKS | — |

### 1.7 Camera footer (height/lens — appears when camera selected)
| Control | Action | Observed | Expected | Status | Priority |
|---|---|---|---|---|---|
| Height slider | 5 | `position.y`=5, label "5.0 m", max adapts to tallest object | Same (`dBe` range) | WORKS | — |
| Lens slider | 500 | focal 53 (log interp `WFa` exactly), **obj + page focal both sync**, label "53 mm" | Same | WORKS | — |

### 1.8 Keyboard shortcuts (`manipulate.js:605-646`)
| Key | Action | Observed | Expected | Status | Priority |
|---|---|---|---|---|---|
| Z / X / C | press with Walker selected | `transform.mode` translate/rotate/scale — matches original default-mode map (Z move, X rotate, C scale) | Same (`Jqt`) | WORKS | — |
| Z/X/C → toolbar highlight | press x then z | Mode changes but `#editToolbar .on` **stays on the old tool** (keyboard path never fires `objects.changed()`); same staleness when selection re-forces translate (track-driven/camera rule, `manipulate.js:97-98`) because `refreshSelectionUI` stamps `.on` **before** `attachToSelection()` (`ui.js:240-242`) | Highlight follows effective mode (original store-driven re-render) | **BROKEN** (visual state desync) | P3 |
| Unreal-mode W/E/R | (not bound — z/x/c remain) | z/x/c only | W/E/R in unreal mode (`EDITOR_UX` L136) | DIVERGES | P3 (minor) |
| F | press with OrbitCam selected | Camera flies to selection (target → object center) | Same | WORKS | — |
| Delete / Backspace | press with object selected | Object deleted (both keys); inspector resets | Same | WORKS | — |
| Delete/Backspace in path paint | (paint mode) | Deletes selected anchor; no crash when none selected | `deletePathAnchor` | WORKS | — |
| Escape | during path paint / lasso mode | Paint finished; lasso `editInteraction` → idle, button `aria-pressed` syncs | Same (L134) | WORKS | — |
| Enter | during path paint | Paint finished | Same (L135) | WORKS | — |
| Ctrl/Cmd+Z | after adding clip item | Item removed (show-store ops gesture-bracketed) ✓ | Same | WORKS | — |
| Ctrl/Cmd+Shift+Z, Ctrl+Y | after undo | Redo restores item | Same | WORKS | — |
| **Ctrl+Z on object-store ops** | add object → ctrl+Z; delete object → ctrl+Z; rename/field edit → undo | **Nothing is reverted** (undoStack empty — no `beginEditGesture` around `objects.add/remove/update/duplicate/paste/groupOrUngroup` from UI paths). Accidental Delete is unrecoverable | Original history is gesture-bracketed for drags AND slider/inspector edits (`EDITOR_UX` L281); object ops undoable | **BROKEN** | **P1** |
| Ctrl/Cmd+C, +V | copy/paste Podium | "… copy" created at +0.5 x, selected; (track-clone bug §1.6) | Same + cloned tracks | WORKS (object) / BROKEN (tracks, above) | — |
| Ctrl/Cmd+G | 2 objects selected → group; group selected → press again | Group created (children re-parented, indented); **2nd press is a no-op** (no ungroup path — `groupOrUngroup` returns early on <2 selected) | Group/ungroup toggle | KNOWN (gap matrix §1 "no ungroup path", P2) | — |
| Input guard | focus `#inspName`, press x + Delete | Keys typed into field; no mode switch, no object delete | Same (skip in INPUT/TEXTAREA/contentEditable, L128) | WORKS | — |
| Space | press | Nothing (no binding) | `togglePreview` play/pause (L137) | KNOWN (gap matrix §3 P3) | — |

---

## 2. New findings (not already in ROUND5_GAP_MATRIX.md)

| # | Finding | Evidence | Priority |
|---|---|---|---|
| **B1** | **Duplicate / Copy+Paste silently skip track cloning for scene-loaded objects.** Scene JSON (samples + the port's own `saveScene` output) keys objects without inline `id`; `schema.js` normalize never injects the map key into the record, so `obj.id === undefined` for every loaded object. `ObjectStore.duplicate()/paste()` → `idMap.set(undefined, nid)` → `ShowStore.cloneTracksFor(idMap)` matches no track. "Walker copy"/"OrbitCam copy" are created **without** their path/clip/cam-move tracks; camera-target remap equally broken. UI-added objects work. Verified live (instrumented `cloneTracksFor`: `entries:[[null,…]]`). Gap matrix §1 marks copy/paste "P+F" — only true for UI-added objects. | store.js:65-85/432-449, schema.js:76-81/237-241, samples/synthetic_tracks.json | **P1** |
| **B2** | **Undo (⌘Z) does not cover any object-store operation** — add (Add grid), delete (key/inspector/toolbar), rename & all inspector field edits, duplicate, paste, group. Only show-store ops (items/keys/tracks/anchors) push history. An accidental object delete is unrecoverable. | No `beginEditGesture` on those paths (grep: only ui.js:814 trim, manipulate.js:59 gizmo, paths.js:254, store internals); EDITOR_UX L281 | **P1** |
| **B3** | **Inspector focal field desyncs from page focal / frame guide.** Writes `obj.focalLengthMm` only; `updateFrameGuide` reads `page.focalLengthMm` (set only by the lens slider). Two focal controls disagree (session ended with obj 35 mm vs page 53 mm). Gap matrix §6 "per-object + page sync — OK" is only true for the slider path. | ui.js:304 vs ui.js:391/222; EDITOR_UX L205-207 | **P2** |
| **B4** | **Inspector action buttons are not gated by object kind** — cam-path/cam-move/clip items can be created on humanoid/cube tracks and walk-paths on camera tracks (silent, no error). The port's own lane "+" menu gates correctly; the inspector bypasses it. Original gates actions by kind ("Humans only" clips; camera actions camera-only). | ui.js:283-337 vs ui.js:621-623; DOM_REFERENCE L62, EDITOR_UX L144 | **P2** |
| **B5** | **Hierarchy renders groups as an afterthought**: children get indented but stay in insertion order while the Group row appears at the end of the list — indented children appear under unrelated parents. | ui.js:347-356 (`depth` padding only, no sort/grouping); live repro in §1.4 | **P2** |
| **B6** | **Toolbar tool highlight goes stale** on keyboard z/x/c and on selection-driven mode forcing (track-driven→translate, camera-scale→translate): `.on` shows the requested tool while the gizmo uses another. | ui.js:240-242 order + no `changed()` in manipulate.js:641-643 | P3 |
| **B7** | **Top-bar scene name is a dead input**: no listener; edits never reach the saved JSON; also shows stale "Scene 1" for `?scene=` loads. | ui.js:59 only; grep `sceneName` → no onchange | P3 |
| **B8** | **Name HTML-escaping insufficient** (`escAttr` escapes `"` only): object names containing `<`/`>` inject markup into hierarchy/inspector (self-XSS/layout corruption, offline-only impact). | ui.js:344, repro §1.5 | P3 |
| **B9** | Minor: camera inspector exposes Scale rows (original camera Properties has none — DOM_REFERENCE L66-72); unreal mode keeps z/x/c instead of W/E/R. | — | P3 |

## 3. Verified WORKS (condensed)
Open/Save (v10 round-trip incl. name + aspect), Light popover (toggle/presets/az-el/puck drag), viewSwitch Scene⇄Cameras (frame guide + fov adoption/restore), modeSwitch, all 9 Add-grid kinds with correct per-kind defaults, prop picker (categories/search/add), hierarchy row select + `.sel` + per-kind inspector swap, inspector name/position/scale (all kinds), rotation (works, radians — KNOWN divergence), camera focal clamp 14-200, shake storage, spotlight shape/intensity/diffusion + clamps, humanoid clip select (rest pose applies per clip, held while paused) + playing checkbox, walk/campath/clip/cammove add-item flows + paint enter/finish + <2-anchor auto-remove, focus button, delete button, cam-footer height + lens sliders (log-interp, page sync), keys z/x/c, f, Delete/Backspace (incl. path-anchor case), Escape (paint + lasso), Enter (paint), ⌘Z/⇧⌘Z/⌘Y on show ops, ⌘C/⌘V object copy, ⌘G group (+ group TRS moves children, delete group restores them), input-focus guard. **Zero console errors/warnings all session.**

## 4. Summary counts
- Controls/actions exercised: **59** (top bar 6, stage header 7, add grid 10, hierarchy 3, inspector fields 26, inspector actions 9, keyboard 12 — several overlapping)
- **WORKS: 45** · **NO-OP: 1** (scene name input) · **BROKEN: 5** (B1 dup/paste tracks P1, B2 undo-coverage P1, B5 hierarchy group order P2, B6 stale tool highlight P3, scene-name display nit P3 → folded into B7)
- **DIVERGES (new): 3** (B3 focal desync P2, B4 action-button kind gating P2, B8 name escaping P3) + 2 minor (camera scale rows, W/E/R unreal keys — P3)
- **KNOWN (confirmed, already in gap matrix — not re-counted):** aspect-ratio picker UI (P1 §6), help/cheatsheet dialog (P2 §8), finish-toggle UI (P2 §8), shake apply (P1 §6), through-the-lens Cameras preview (P1 §6), color row (P1 §1), person-kind switch (P1 §1), ungroup (P2 §1), live-pose inspector + drivenBy (P2/P3 §1), spawn grid + name counters (P1/P3 §1), hierarchy drag/delete-row (P3 §1), Space key (P3 §3), rotation-in-degrees (P1-tracked §11).
- Console errors: **0**.

## 5. Suggested fix order
1. **B1** (one-line: inject `id` in `setObjects`/normalize, or key `idMap` by the map key in `duplicate`/`paste`) — restores track cloning for every loaded object.
2. **B2** (wrap UI object mutations in `beginEditGesture/endEditGesture` — the store already snapshots the companion objects store).
3. **B3** (inspector focal → also `app.page.focalLengthMm = v; updateFrameGuide(app)`), **B4** (reuse the lane-menu kind gate for `.insp-actions`), **B5** (sort hierarchy: groups before their children).
4. B6/B7/B8/B9 polish.
