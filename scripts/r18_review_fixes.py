#!/usr/bin/env python3
"""r18 review fixes for clouds.js (P1-2 perf, P2-3 leak, P3 nits) — run after P2-1 (applied separately)."""
P = "/home/z/my-project/flick-3dEditor/editor/js/clouds.js"
s = open(P).read()


def sub1(old, new, tag):
    global s
    assert old in s, f"MISS [{tag}]"
    assert s.count(old) == 1, f"NON-UNIQUE [{tag}] count={s.count(old)}"
    s = s.replace(old, new)


# P1-2a: running-sum sliding-window blur
old_blur = """      const RB = 10;
      let blurred = field;
      for (let pass = 0; pass < 2; pass++) {
        const out = new Float32Array(W * W);
        for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
          let acc = 0;
          for (let k = -RB; k <= RB; k++) {
            acc += blurred[y * W + ((x + k + W) % W)];
          }
          out[y * W + x] = acc / (2 * RB + 1);
        }
        const out2 = new Float32Array(W * W);
        for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
          let acc = 0;
          for (let k = -RB; k <= RB; k++) {
            acc += out[((y + k + W) % W) * W + x];
          }
          out2[y * W + x] = acc / (2 * RB + 1);
        }
        blurred = out2;
      }"""
new_blur = """      // running-sum sliding window (review P1-2: the naive 21-tap box x2 passes x2 axes cost
      // ~150-380ms/build and janked the coverage slider; this is O(1)/px per axis)
      const RB = 10, WIN = 2 * RB + 1;
      let blurred = field;
      for (let pass = 0; pass < 2; pass++) {
        const outH = new Float32Array(W * W);
        for (let y = 0; y < W; y++) {
          const row = y * W;
          let acc = 0;
          for (let k = -RB; k <= RB; k++) acc += blurred[row + ((k + W) % W)];
          for (let x = 0; x < W; x++) {
            outH[row + x] = acc / WIN;
            acc += blurred[row + ((x + RB + 1) % W)] - blurred[row + ((x - RB + W) % W)];
          }
        }
        const out = new Float32Array(W * W);
        for (let x = 0; x < W; x++) {
          let acc = 0;
          for (let k = -RB; k <= RB; k++) acc += outH[((k + W) % W) * W + x];
          for (let y = 0; y < W; y++) {
            out[y * W + x] = acc / WIN;
            acc += outH[((y + RB + 1) % W) * W + x] - outH[((y - RB + W) % W) * W + x];
          }
        }
        blurred = out;
      }"""
sub1(old_blur, new_blur, "P1-2a blur")

# P2-3: dispose the previous atlas
sub1("""    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);""",
     """    ctx.putImageData(img, 0, 0);
    const prevTex = sheetAtlas;   // review P2-3: dispose the previous atlas (mip chain ~2MB VRAM leaked per rebuild)
    const tex = new THREE.CanvasTexture(canvas);""", "P2-3a")
sub1("""    sheetAtlas = tex;
    uniforms.uSheetAtlas.value = tex;
  }""",
     """    sheetAtlas = tex;
    uniforms.uSheetAtlas.value = tex;
    prevTex?.dispose();
  }""", "P2-3b")

# P1-2c: setEnabled seeds sheetsKey (setParams always follows — don't build twice)
sub1("""    if (enabled && !shapeTex) {
      bakeNoise3D();                            // one-time renderer-level 128^3 bake
      buildSheets();                            // layered fallback sheets from the same noise
    }""",
     """    if (enabled && !shapeTex) {
      bakeNoise3D();                            // one-time renderer-level 128^3 bake
      buildSheets();                            // layered sheets from the same noise
      sheetsKey = uniforms.uCoverage.value.toFixed(4) + '|' + uniforms.uDensity.value.toFixed(4) + '|' + currentSeed;   // review P1-2: setParams always follows on every enable path — don't build twice
    }""", "P1-2c")

# P1-2b: debounce the slider-driven rebuilds
sub1("""      if (sk !== sheetsKey) { sheetsKey = sk; buildSheets(); }
    }
    return changed;""",
     """      if (sk !== sheetsKey) { sheetsKey = sk; scheduleSheets(); }   // review P1-2: debounced — slider drags fired a ~100ms+ build per input tick
    }
    return changed;""", "P1-2b")

# stale comment (lives INSIDE setParams — 4-space indent)
sub1("""    // r13 audit P2: the layered atlas bakes coverage/density at build time — rebuild when they
    // change in layered mode (CPU-side 256xN, ~2-5 ms; the sliders stay live)""",
     """    // r13 audit P2 (perf re-benchmarked r18): the atlas bakes coverage/density/seed at build
    // time — rebuild when they change; the build is debounced (slider drags coalesce).""", "comment")

# the debounce scheduler (before the state block)
sub1("""  // ---- state ----
  let enabled = false, staticMode = false;""",
     """  let sheetsTimer = null;                              // review P1-2: debounce (coalesce slider-tick rebuilds)
  function scheduleSheets() {
    if (sheetsTimer !== null) return;
    sheetsTimer = setTimeout(() => { sheetsTimer = null; buildSheets(); }, 120);
  }

  // ---- state ----
  let enabled = false, staticMode = false;""", "scheduler")

# P3: parenthesize seedOffset
sub1("""  return [s * 37.7192 % 128, s * 61.8384 % 128, s * 29.5504 % 128];""",
     """  return [(s * 37.7192) % 128, (s * 61.8384) % 128, (s * 29.5504) % 128];""", "seedOffset parens")

open(P, "w").write(s)
print("clouds.js review fixes applied")
