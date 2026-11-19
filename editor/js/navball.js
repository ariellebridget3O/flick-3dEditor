// navball.js — exact port of the live nav ball (lZr): a 67px pad at top-right
// showing a backdrop-blurred snapshot of the scene behind a white flat-shaded
// icosahedron that ROLLS as the camera moves (translate → Kzr roll, yaw → Xzr
// spin) and SHIFTS toward the drag vector while the pad is dragged (which
// drives the camera at 4 m/s, ×3 with Shift — Ye/bot).
import * as THREE from 'three';

const PAD_PX = 67;        // jw
const PAD_MARGIN = 12;    // zie
const NAV_FOV = 30;       // nZr
const NAV_CAM_POS = { x: 0, y: 0.42, z: 5.1 };   // Mye
const BLUR_RADIUS = 0.085;   // rZr
const BLUR_TAPS = 12;        // Uot
const BLUR_DIM = 0.82;       // iZr
const BLUR_FADE_FROM = 0.68; // sZr
const BLUR_FADE_TO = 1.0;    // aZr
const DRIVE_SENS = 0.17;     // Vot — ball shift magnitude per full stick
const DRIVE_LERP = 12;       // oZr — ball shift lerp rate per second
const BALL_RADIUS = 1;       // fot (shared with drive rotation speed)
const YAW_GAIN = 0.6;        // Uzr
const DRIVE_MPS = 4;         // Tye — camera drive speed
const SHIFT_BOOST = 3;       // Aye

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const _axisQ = new THREE.Quaternion();
const _X = new THREE.Vector3(1, 0, 0);
const _Y = new THREE.Vector3(0, 1, 0);
const _Z = new THREE.Vector3(0, 0, 1);
const _UP = new THREE.Vector3(0, 1, 0);
const _size = new THREE.Vector2();
const _snapPos = new THREE.Vector2();

// vot — yaw of a quaternion's forward vector
function yawOf(q) {
  _v.set(0, 0, -1).applyQuaternion(q);
  return Math.atan2(-_v.x, -_v.z);
}

// Kzr — rotation increment from camera-relative motion (forward → X roll, strafe → Z roll)
function rollFromMotion(motion, camQ, speed, out) {
  out.identity();
  _q.copy(camQ).invert();
  _v.copy(motion).applyQuaternion(_q);      // motion in camera space
  const fwd = -_v.z, strafe = _v.x;
  if (fwd !== 0) { _axisQ.setFromAxisAngle(_X, -fwd / speed); out.premultiply(_axisQ); }
  if (strafe !== 0) { _axisQ.setFromAxisAngle(_Z, -strafe / speed); out.premultiply(_axisQ); }
  return out;
}

// Xzr — yaw spin
function yawSpin(t, out) { return out.setFromAxisAngle(_Y, t * YAW_GAIN); }

// bot — move pos + target along camera-relative forward/strafe
export function moveByStick(stick, dist, pos, quat, target) {
  _fwd.set(0, 0, -1).applyQuaternion(quat);
  _right.crossVectors(_fwd, _UP).normalize();
  _move.set(0, 0, 0).addScaledVector(_fwd, stick.forward * dist).addScaledVector(_right, stick.strafe * dist);
  pos.add(_move);
  target.add(_move);
}

// zzr — pointer delta → normalized stick with .12 dead zone, clamped to the rim
export function stickFromDelta(dx, dy, radiusPx) {
  const DEAD = 0.12;
  const idle = { forward: 0, strafe: 0 };
  if (radiusPx <= 0) return idle;
  const strafe = dx / radiusPx, forward = -dy / radiusPx;
  const mag = Math.hypot(strafe, forward);
  if (mag <= DEAD) return idle;
  const scale = (Math.min(mag, 1) - DEAD) / (1 - DEAD) / mag;
  return { forward: forward * scale, strafe: strafe * scale };
}

export function createNavBall({ renderer, camera, page, getOrbit, keys }) {
  // ball scene
  const ballScene = new THREE.Scene();
  const ballCam = new THREE.PerspectiveCamera(NAV_FOV, 1, 0.1, 20);
  ballCam.position.set(NAV_CAM_POS.x, NAV_CAM_POS.y, NAV_CAM_POS.z);
  ballCam.lookAt(0, 0, 0);
  ballScene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));
  const dir = new THREE.DirectionalLight(0xffffff, 4);
  dir.position.set(5, 10, 4);
  ballScene.add(dir);

  // backdrop-blur overlay scene
  const blurScene = new THREE.Scene();
  const blurCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const blurMat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, fog: false,
    uniforms: {
      uMap: { value: null },
      uRadius: { value: BLUR_RADIUS },
      uDim: { value: BLUR_DIM },
      uFadeFrom: { value: BLUR_FADE_FROM },
      uFadeTo: { value: BLUR_FADE_TO },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uRadius;
      uniform float uDim;
      uniform float uFadeFrom;
      uniform float uFadeTo;
      varying vec2 vUv;

      void main() {
        // Taps on a golden-angle spiral: an even disc of samples for the cost
        // of a loop, with none of the cross-shaped artefacts a box of taps
        // leaves on a hard edge.
        vec3 sum = texture2D(uMap, vUv).rgb;
        float count = 1.0;
        for (int i = 0; i < ${BLUR_TAPS}; i++) {
          float a = float(i) * 2.399963;
          float r = sqrt((float(i) + 0.5) / float(${BLUR_TAPS}));
          vec2 off = vec2(cos(a), sin(a)) * r * uRadius;
          sum += texture2D(uMap, vUv + off).rgb;
          count += 1.0;
        }
        float d = length(vUv - 0.5) * 2.0;
        float mask = 1.0 - smoothstep(uFadeFrom, uFadeTo, d);
        gl_FragColor = vec4(sum / count * uDim, mask);
      }
    `,
  });
  blurScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat));

  // the ball
  const ball = new THREE.Mesh(
    new THREE.IcosahedronGeometry(BALL_RADIUS, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.52, metalness: 0, flatShading: true }),
  );
  ballScene.add(ball);

  let snapTex = null, snapSize = 0;
  const lastPos = camera.position.clone();
  let lastYaw = yawOf(camera.quaternion);
  const motion = new THREE.Vector3();
  const inc = new THREE.Quaternion();

  const visible = () => page.mode === 'edit' && !page.playing;

  // k(dt) — ball rolls with camera motion + shifts toward the drive stick
  function tick(dt) {
    motion.subVectors(camera.position, lastPos);
    lastPos.copy(camera.position);
    const yaw = yawOf(camera.quaternion);
    let dYaw = yaw - lastYaw;
    if (dYaw > Math.PI) dYaw -= Math.PI * 2;
    if (dYaw < -Math.PI) dYaw += Math.PI * 2;
    lastYaw = yaw;
    if (!visible()) return;
    if (motion.lengthSq() > 0) {
      rollFromMotion(motion, camera.quaternion, BALL_RADIUS, inc);
      ball.quaternion.premultiply(inc);
    }
    if (dYaw !== 0) {
      yawSpin(dYaw, inc);
      ball.quaternion.premultiply(inc);
    }
    const stick = page.navBallVector;
    const lerp = Math.min(1, dt * DRIVE_LERP);
    const tx = stick ? stick.strafe * DRIVE_SENS : 0;
    const ty = stick ? stick.forward * DRIVE_SENS : 0;
    ball.position.x += (tx - ball.position.x) * lerp;
    ball.position.y += (ty - ball.position.y) * lerp;
  }

  // Ye(dt) — dragging the pad drives the camera (4 m/s, Shift ×3)
  function driveTick(dt) {
    const stick = page.navBallVector;
    if (!stick || page.mode !== 'edit' || page.playing || (stick.forward === 0 && stick.strafe === 0)) return;
    const boost = keys?.()?.has('shift') ? SHIFT_BOOST : 1;   // keys = getter for the live key set
    const dist = DRIVE_MPS * boost * dt;
    const orbit = getOrbit?.();
    if (!orbit) return;
    moveByStick(stick, dist, camera.position, camera.quaternion, orbit.target);
  }

  // S() — scissored pad render: snapshot backdrop → blur → ball
  function render() {
    if (!visible()) return;
    renderer.getSize(_size);
    const x = _size.x - PAD_PX - PAD_MARGIN;
    const y = _size.y - PAD_PX - PAD_MARGIN;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setScissorTest(true);
    renderer.setScissor(x, y, PAD_PX, PAD_PX);
    renderer.setViewport(x, y, PAD_PX, PAD_PX);
    const pr = renderer.getPixelRatio();
    const px = Math.round(PAD_PX * pr);
    if (!snapTex || snapSize !== px) {
      snapTex?.dispose();
      snapTex = new THREE.FramebufferTexture(px, px);
      snapTex.minFilter = THREE.LinearFilter;
      snapTex.magFilter = THREE.LinearFilter;
      snapSize = px;
      blurMat.uniforms.uMap.value = snapTex;
    }
    _snapPos.set(Math.round(x * pr), Math.round(y * pr));
    renderer.copyFramebufferToTexture(snapTex, _snapPos);
    renderer.render(blurScene, blurCam);
    renderer.clearDepth();
    renderer.render(ballScene, ballCam);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, _size.x, _size.y);
    renderer.autoClear = autoClear;
  }

  function dispose() {
    ballScene.traverse(o => o.geometry?.dispose?.());
    blurScene.traverse(o => o.geometry?.dispose?.());
    ball.material.dispose();
    blurMat.dispose();
    snapTex?.dispose();
  }

  return { tick, driveTick, render, dispose };
}
