#!/usr/bin/env python3
"""ab.py — thin agent-browser CLI wrapper for the pixel-oracle harness.

Every command goes through run(): `agent-browser --session <S> <args...>`.

Eval quoting (IMPORTANT): agent-browser's `eval` takes the JS as ONE argv
element. We therefore pass the code as a direct subprocess argv entry and
NEVER through a shell — no shell can mangle backticks (JS template
literals), $(...) or quotes inside the code. This is the "eval-via-file"
path: eval_file() reads a .js file and passes its content as one argv
element (equivalent to `agent-browser --session S eval "$(cat file)"` but
immune to shell interpolation). eval_js() is for SHORT snippets only —
the CLI chokes on args over ~1.5KB (measured in-session), so anything
bigger must live in a file and go through eval_file().

Eval result normalization: agent-browser prints numbers/undefined plain,
strings JSON-quoted, objects pretty-printed. _norm() returns plain str /
parsed JSON for the quoted/pretty forms.
"""
import json
import os
import re
import subprocess
import time

DEFAULT_TIMEOUT = 90  # live page is heavy in SwiftShader; be generous

# snapshot ref formats: "[ref=e47]" (v0.43 live) and "[ref=@e47]" (docs)
_REF_RE = re.compile(r"ref=@?(e\w+)")


class ABError(RuntimeError):
    pass


def run(session, *args, timeout=DEFAULT_TIMEOUT, check=True):
    """Run one agent-browser command in a session; return stdout text."""
    cmd = ["agent-browser", "--session", session, *[str(a) for a in args]]
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise ABError(f"agent-browser timeout ({timeout}s): {' '.join(cmd[:6])} …")
    out = (p.stdout or "") + (p.stderr or "")
    if check and (p.returncode != 0
                  or any(l.lstrip().startswith("✗") for l in out.splitlines())):
        raise ABError(f"agent-browser failed (rc={p.returncode}): {' '.join(cmd[:6])} …\n{out.strip()[:800]}")
    return (p.stdout or "").strip()


def _norm(text):
    """Normalize eval output: unquote JSON strings, parse pretty JSON."""
    t = text.strip()
    if not t or t in ("undefined", "null", "true", "false"):
        return t or None
    if t.startswith('"') and t.endswith('"'):
        try:
            return json.loads(t)
        except Exception:
            return t
    if t[0] in "[{":
        try:
            return json.loads(t)
        except Exception:
            return t
    return t


def eval_js(session, code, timeout=DEFAULT_TIMEOUT):
    """Eval a SHORT (<~1.5KB) JS snippet; returns normalized result."""
    if len(code) > 1500:
        raise ABError(f"eval_js payload {len(code)}B > 1.5KB CLI limit — use eval_file()")
    return _norm(run(session, "eval", code, timeout=timeout))


def eval_file(session, path, timeout=DEFAULT_TIMEOUT):
    """Eval a JS file's content (the >1.5KB path). Content is passed as a
    single argv element — no shell, so backticks/$()/quotes are safe."""
    with open(path, "r") as f:
        code = f.read()
    return _norm(run(session, "eval", code, timeout=timeout))


def open_url(session, url, timeout=DEFAULT_TIMEOUT):
    return run(session, "open", url, timeout=timeout)


def close(session, timeout=30):
    return run(session, "close", timeout=timeout, check=False)


def set_viewport(session, w, h, timeout=30):
    return run(session, "set", "viewport", w, h, timeout=timeout)


def wait(session, ms, timeout=None):
    """agent-browser wait <ms> (own sleep budget = ms + grace)."""
    t = timeout or (int(ms) / 1000.0 + 60)
    return run(session, "wait", ms, timeout=t)


def screenshot(session, path, timeout=120):
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    run(session, "screenshot", path, timeout=timeout)
    if not os.path.exists(path):
        raise ABError(f"screenshot did not produce {path}")
    return path


def snapshot(session, timeout=60):
    """Accessibility tree with @eN refs (interactive only keeps it small)."""
    return run(session, "snapshot", "-i", timeout=timeout)


def find_ref(snap_text, *needles, return_all=False):
    """Find @eN refs in a snapshot whose line contains every needle
    (case-insensitive). Returns list of refs (or single first ref).
    Snapshot line formats seen (agent-browser 0.43):
      - button "GET STARTED" [ref=e47]     ← live (NO @ after ref=)
      - button "GET STARTED" [ref=@e47]    ← older doc example
    Both normalize to "@e47". NB: the kwarg is `return_all` — a param
    named `all` would shadow the builtin and crash the loop.
    """
    refs = []
    for line in snap_text.splitlines():
        low = line.lower()
        if all(n.lower() in low for n in needles):
            m = _REF_RE.search(line)
            if m:
                refs.append("@" + m.group(1))
    if return_all:
        return refs
    return refs[0] if refs else None


def click_ref(session, ref, timeout=60):
    return run(session, "click", ref, timeout=timeout)


def fill(session, selector, value, timeout=60):
    return run(session, "fill", selector, value, timeout=timeout)


def mouse_click(session, x, y, timeout=30):
    """Native mouse click = move + down + up (three CDP events).
    Required for the live timeline seek-kick: synthetic element clicks do
    not pose the render-on-demand viewport; native input does."""
    run(session, "mouse", "move", int(x), int(y), timeout=timeout)
    run(session, "mouse", "down", timeout=timeout)
    run(session, "mouse", "up", timeout=timeout)


def mouse_move(session, x, y, timeout=30):
    return run(session, "mouse", "move", int(x), int(y), timeout=timeout)


def storage_set(session, key, value, origin="", timeout=30):
    """localStorage set via `storage local` if supported; JS fallback."""
    try:
        return run(session, "storage", "local", "set", key, value,
                   timeout=timeout, check=True)
    except ABError:
        return eval_js(session, f"localStorage.setItem({json.dumps(key)}, {json.dumps(value)}); 'ok'")


def console_errors(session, timeout=30):
    return run(session, "errors", timeout=timeout, check=False)
