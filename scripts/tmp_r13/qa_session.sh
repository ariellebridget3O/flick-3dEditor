#!/bin/bash
# r13 cloud QA driver v2: each config gets a FRESH browser session (SwiftShader rAF loop
# saturates the machine if the procedural march runs long; short sessions keep the
# agent-browser daemon responsive). Writes /tmp/r13/TAG_<cfg>_on.png (+_off.png).
# Usage: qa_session.sh TAG [configs...]
set -u
TAG="${1:?tag}"
shift || true
CFGS="${*:-offdefault clearsky overcast default layered azflip}"
D=/tmp/r13
H=/home/z/my-project/flick-3dEditor/scripts/tmp_r13
URLBASE="http://localhost:3000/editor/index.html?scene=samples/live_oracle_r11_base.json&noAutosave=1&finish=0&cloudsGate=0"
mkdir -p "$D"

arm_for() { # arm_for CFG -> echoes arm script path (off arm handled inline)
  case "$1" in
    offdefault) echo "$H/arm_off_default.js";;
    clearsky)   echo "$H/arm_clear.js";;
    overcast)   echo "$H/arm_overcast.js";;
    default)    echo "$H/arm_default.js";;
    layered)    echo "$H/arm_layered.js";;
    azflip)     echo "$H/arm_azflip.js";;
  esac
}

open_fresh() {
  agent-browser close >/dev/null 2>&1
  sleep 2.5
  agent-browser open "$URLBASE&v=$TAG$1" >/dev/null 2>&1
  sleep 3
  local ok=""
  for i in $(seq 1 40); do
    ok=$(agent-browser eval "!!(window.__app && window.__app.env && window.__app.renderFrame)" 2>/dev/null | tr -d '"')
    if [ "$ok" = "true" ]; then return 0; fi
    agent-browser get url 2>/dev/null | grep -q "editor/index.html" || \
      agent-browser open "$URLBASE&v=$TAG$1" >/dev/null 2>&1
    sleep 1
  done
  echo "WARN: app never became ready ($1)"
  return 1
}

fetch_png() { # fetch_png OUT.png
  local out="$1" i
  for i in 1 2 3; do
    agent-browser eval "window.__bbpng" > "$D/.b64" 2>/dev/null
    tail -c +24 "$D/.b64" | tr -d '"\n ' | base64 -d > "$out" 2>/dev/null
    if [ -s "$out" ] && [ "$(head -c 4 "$out" | od -An -tx1 | tr -d ' \n')" = "89504e47" ]; then
      agent-browser eval "window.__bbpng=null" >/dev/null 2>&1
      return 0
    fi
    sleep 2
  done
  return 1
}

capture() { # capture CFG ARMFILE [OFFARMFILE] — assumes fresh page open
  local cfg="$1" arm="$2" offarm="${3:-}"
  agent-browser set viewport 1024 640 >/dev/null 2>&1
  sleep 0.5
  agent-browser eval "$(cat "$arm")" >/dev/null 2>&1; sleep 1
  agent-browser eval "$(cat "$H/cap.js")" >/dev/null 2>&1; sleep 1
  fetch_png "$D/${TAG}_${cfg}_on.png"
  echo "cap $cfg on: $(stat -c%s "$D/${TAG}_${cfg}_on.png" 2>/dev/null || echo 0) bytes"
  if [ -n "$offarm" ]; then
    agent-browser eval "$(cat "$offarm")" >/dev/null 2>&1; sleep 1
    agent-browser eval "$(cat "$H/cap.js")" >/dev/null 2>&1; sleep 1
    fetch_png "$D/${TAG}_${cfg}_off.png"
    echo "cap $cfg off: $(stat -c%s "$D/${TAG}_${cfg}_off.png" 2>/dev/null || echo 0) bytes"
  fi
}

for cfg in $CFGS; do
  arm=$(arm_for "$cfg")
  case "$cfg" in
    offdefault|default|azflip) offarm="";;
    *) offarm="$H/arm_off_sky.js";;
  esac
  if open_fresh "$cfg"; then
    capture "$cfg" "$arm" "$offarm"
  else
    echo "SKIP $cfg (page not ready)"
  fi
done

agent-browser close >/dev/null 2>&1
echo "--- done $TAG ---"
