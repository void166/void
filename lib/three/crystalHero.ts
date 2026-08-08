import * as THREE from "three";
import gsap from "gsap";

export type CrystalHeroHandles = {
  quatText?: HTMLElement | null;
  gizmoGroup?: HTMLElement | null;
  crosshairV?: HTMLElement | null;
  crosshairH?: HTMLElement | null;
  coordText?: HTMLElement | null;
};

export type CrystalHeroApi = {
  dispose: () => void;
  resetOrientation: () => void;
  setRoughness: (v: number) => void;
  setNoiseScale: (v: number) => void;
  setTint: (hex: string) => void;
};

const CONFIG = {
  cameraFov: 38,
  cameraZ: 7.4,
  letterHeight: 3.1,
  letterWidth: 2.35,
  letterBar: 0.78,
  letterDepth: 0.55,
  letterGap: 1.45,
  maxTiltRad: THREE.MathUtils.degToRad(10),
  tiltStiffness: 60,
  tiltDamping: 12,
  bobAmplitude: 0.08,
  bobSpeed: 0.5,
  parallax: 0.12,
  wordmark: "DDAM",
  // material defaults — mirrored by the MainLogo Material panel
  roughness: 0.1,
  noiseScale: 9.0,
};

/* ------------------------------------------------------------------ */
/* Background: procedural glitch wall (zebra swirls, flicker tiles,   */
/* triangle watermarks, glitch bands, film grain)                     */
/* ------------------------------------------------------------------ */
const BG_VERT = /* glsl */ `
  void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const BG_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2  uRes;

  float hash(vec2 p){
    p = fract(p*vec2(123.34, 456.21));
    p += dot(p, p+45.32);
    return fract(p.x*p.y);
  }

  float triSDF(vec2 p, float r){
    const float k = 1.7320508;
    p.x = abs(p.x) - r;
    p.y = p.y + r/k;
    if (p.x + k*p.y > 0.0) p = vec2(p.x - k*p.y, -k*p.x - p.y)/2.0;
    p.x -= clamp(p.x, -2.0*r, 0.0);
    return -length(p)*sign(p.y);
  }

  void main(){
    vec2 frag = gl_FragCoord.xy;
    vec2 uv = frag / uRes;
    float aspect = uRes.x / uRes.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    float t = uTime;

    /* occasional horizontal glitch displacement */
    float band  = floor(uv.y * 36.0);
    float gseed = hash(vec2(band, floor(t*2.5)));
    if (gseed > 0.965){
      uv.x += (hash(vec2(band, floor(t*7.0))) - 0.5) * 0.10;
      p.x  += (gseed - 0.98) * 2.0;
    }

    /* curved zebra stripes around two swirl centers */
    vec2 c1 = p - vec2(-0.45, 0.18);
    vec2 c2 = p - vec2( 0.52,-0.25);
    float a1 = atan(c1.y, c1.x), r1 = length(c1);
    float a2 = atan(c2.y, c2.x), r2 = length(c2);
    float sw1 = sin(a1*4.0 + r1*13.0 - t*0.12);
    float sw2 = sin(a2*5.0 - r2*15.0 + t*0.09);
    float blendMask = smoothstep(-0.3, 0.3, sin(p.x*1.3 + p.y*0.9 + t*0.05));
    float field = mix(sw1, sw2, blendMask);
    float zebra = smoothstep(-0.08, 0.08, field);
    float zebraMask = smoothstep(1.65, 0.30, min(r1, r2));
    float stripes = zebra * zebraMask;

    /* tile grid with per-tile flicker */
    vec2 grid = vec2(26.0*aspect, 26.0);
    vec2 cell = floor(uv * grid);
    vec2 cuv  = fract(uv * grid);
    float flickStep = floor(t*3.0);
    float fl = hash(cell + flickStep*0.013);
    float tileLum = step(0.95, fl) * 0.05 + step(0.99, fl) * 0.14;
    float lineSum = (step(cuv.x, 0.035) + step(1.0-0.035, cuv.x)
                   + step(cuv.y, 0.035) + step(1.0-0.035, cuv.y));
    float gridLines = clamp(lineSum, 0.0, 1.0) * 0.045;

    /* scattered triangle watermarks */
    float triMark = 0.0;
    float tsel = hash(cell*1.7 + 3.1);
    if (tsel > 0.90){
      float d = triSDF((cuv - 0.5)*2.2, 0.62);
      triMark = (1.0 - smoothstep(0.02, 0.09, abs(d))) * 0.10;
    }

    vec3 col = vec3(0.010);
    col += vec3(0.105) * stripes;
    col += vec3(1.0) * tileLum;
    col += vec3(1.0) * gridLines;
    col += vec3(1.0) * triMark * 0.7;

    /* film noise */
    col += (hash(frag + fract(t)*111.0) - 0.5) * 0.035;

    /* subtle centre glow so the glass has something to catch */
    col += vec3(0.03) * smoothstep(0.9, 0.0, length(p));

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ------------------------------------------------------------------ */
/* Glass: screen-space refraction sampling the background target,     */
/* with per-channel offsets (chromatic dispersion) + fresnel + streaks */
/* ------------------------------------------------------------------ */
const GLASS_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vView;
  varying vec3 vWorld;
  void main(){
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vN = normalize(normalMatrix * normal);
    vec4 mv = viewMatrix * wp;
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const GLASS_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uBg;
  uniform vec2  uRes;
  uniform float uTime;
  uniform float uRough;
  uniform float uNoise;
  uniform vec3  uTint;
  varying vec3 vN;
  varying vec3 vView;
  varying vec3 vWorld;

  float hash(vec2 p){
    p = fract(p*vec2(123.34, 456.21));
    p += dot(p, p+45.32);
    return fract(p.x*p.y);
  }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
  }

  void main(){
    vec2 suv = gl_FragCoord.xy / uRes;
    vec3 n  = normalize(vN);
    vec3 v  = normalize(vView);
    float ndv = clamp(dot(n, v), 0.0, 1.0);

    /* refraction offset from surface normal (screen space) */
    vec2 off = n.xy * 0.22;

    /* facet noise — bends light per-surface-region */
    float fn = noise(vWorld.xy * uNoise + vWorld.z * 3.0);
    off += (fn - 0.5) * 0.035;

    /* chromatic dispersion */
    float disp = 0.035 + uRough * 0.03;
    vec3 col = vec3(0.0);
    float blur = uRough * 0.035;
    for (int i = 0; i < 3; i++){
      float fi = float(i);
      vec2 j = (vec2(hash(gl_FragCoord.xy + fi), hash(gl_FragCoord.yx + fi + 7.0)) - 0.5) * blur;
      col.r += texture2D(uBg, clamp(suv + (off + j) * (1.0 + disp), 0.001, 0.999)).r;
      col.g += texture2D(uBg, clamp(suv + (off + j)              , 0.001, 0.999)).g;
      col.b += texture2D(uBg, clamp(suv + (off + j) * (1.0 - disp), 0.001, 0.999)).b;
    }
    col /= 3.0;

    /* glass brightness + fresnel rim */
    float fres = pow(1.0 - ndv, 2.5);
    col = col * (1.55 + fres * 0.9);
    col += vec3(1.0) * fres * 0.85;

    /* moving specular streaks */
    vec3 l1 = normalize(vec3( 0.6, 0.8, 0.5));
    vec3 l2 = normalize(vec3(-0.7, -0.2, 0.6));
    vec3 rf = reflect(-v, n);
    float sp = pow(max(dot(rf, l1), 0.0), 90.0) * 2.2
             + pow(max(dot(rf, l2), 0.0), 60.0) * 1.2;
    sp *= 0.7 + 0.3 * sin(uTime * 2.0 + vWorld.x * 4.0);
    col += vec3(sp);

    /* rainbow sheen along facets */
    float h = fract(fn * 2.0 + uTime * 0.05);
    vec3 sheen = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + h));
    col += sheen * fres * 0.25;

    col *= uTint;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/* Giant wordmark drawn to a canvas, auto-fit to width. */
function buildWordmarkTexture(word: string): { canvas: HTMLCanvasElement; aspect: number } {
  const W = 2048;
  const H = 640;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let fontSize = 400;
  let spacing = 90;
  const measure = () => {
    ctx.font = `900 ${fontSize}px "Helvetica Neue", Arial, system-ui, sans-serif`;
    const ws: number[] = [];
    let tot = 0;
    for (const ch of word) {
      const w = ctx.measureText(ch).width;
      ws.push(w);
      tot += w + spacing;
    }
    return { ws, tot: tot - spacing };
  };
  let m = measure();
  const fit = Math.min(1, (W * 0.94) / m.tot);
  fontSize = Math.floor(fontSize * fit);
  spacing = Math.floor(spacing * fit);
  m = measure();

  let x = (W - m.tot) / 2;
  for (let i = 0; i < word.length; i++) {
    ctx.fillText(word[i], x + m.ws[i] / 2, H / 2 + 10);
    x += m.ws[i] + spacing;
  }
  return { canvas, aspect: W / H };
}

/** "D" letterform: flat left bar, semicircular right bowl, counter hole. */
function buildDShape(width: number, height: number, bar: number): THREE.Shape {
  const radius = height / 2;
  const bowlX = width - radius;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, height);
  shape.lineTo(bowlX, height);
  shape.absarc(bowlX, radius, radius, Math.PI / 2, -Math.PI / 2, true);
  shape.lineTo(0, 0);

  const innerRadius = radius - bar;
  const hole = new THREE.Path();
  hole.moveTo(bar, bar);
  hole.lineTo(bowlX, bar);
  hole.absarc(bowlX, radius, innerRadius, -Math.PI / 2, Math.PI / 2, false);
  hole.lineTo(bar, height - bar);
  hole.lineTo(bar, bar);
  shape.holes.push(hole);

  return shape;
}

export function createCrystalHero(container: HTMLDivElement, handles: CrystalHeroHandles = {}): CrystalHeroApi {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 1);
  // shader values are authored as final output — skip the sRGB re-encode
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;";

  const drawSize = new THREE.Vector2();

  /* --- background scene → render target --- */
  const bgScene = new THREE.Scene();
  const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);

  const makeTarget = () => {
    renderer.getDrawingBufferSize(drawSize);
    return new THREE.WebGLRenderTarget(Math.max(2, drawSize.x), Math.max(2, drawSize.y), {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
  };
  let bgTarget: THREE.WebGLRenderTarget | null = null;

  const bgUniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(2, 2) },
  };
  const bgMat = new THREE.ShaderMaterial({
    uniforms: bgUniforms,
    depthWrite: false,
    depthTest: false,
    vertexShader: BG_VERT,
    fragmentShader: BG_FRAG,
  });
  const bgQuadGeo = new THREE.PlaneGeometry(2, 2);
  bgScene.add(new THREE.Mesh(bgQuadGeo, bgMat));

  const wordmark = buildWordmarkTexture(CONFIG.wordmark);
  const textTexture = new THREE.CanvasTexture(wordmark.canvas);
  textTexture.anisotropy = 4;
  const textMat = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const textGeo = new THREE.PlaneGeometry(1, 1);
  const textMesh = new THREE.Mesh(textGeo, textMat);
  bgScene.add(textMesh);

  function layoutText() {
    const rect = container.getBoundingClientRect();
    const aspect = Math.max(0.2, rect.width) / Math.max(0.2, rect.height);
    const w = 1.84;
    const h = (w / wordmark.aspect) * aspect;
    textMesh.scale.set(w, Math.min(h, 1.9), 1);
    textMesh.position.set(0, 0.02, -1);
  }

  /* --- blit quad (draws the bg target to screen) --- */
  const blitScene = new THREE.Scene();
  const blitMat = new THREE.MeshBasicMaterial({ depthTest: false, depthWrite: false });
  const blitGeo = new THREE.PlaneGeometry(2, 2);
  blitScene.add(new THREE.Mesh(blitGeo, blitMat));

  /* --- main scene: DD glass monogram --- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, 1, 0.1, 100);
  camera.position.set(0, 0.15, CONFIG.cameraZ);
  const baseCameraPos = camera.position.clone();
  const lookTarget = new THREE.Vector3(0, -0.1, 0);

  const glassUniforms = {
    uBg: { value: null as THREE.Texture | null },
    uRes: { value: new THREE.Vector2(2, 2) },
    uTime: { value: 0 },
    uRough: { value: CONFIG.roughness },
    uNoise: { value: CONFIG.noiseScale },
    uTint: { value: new THREE.Color(1, 1, 1) },
  };
  const glassMat = new THREE.ShaderMaterial({
    uniforms: glassUniforms,
    vertexShader: GLASS_VERT,
    fragmentShader: GLASS_FRAG,
  });

  const dShape = buildDShape(CONFIG.letterWidth, CONFIG.letterHeight, CONFIG.letterBar);
  const dGeo = new THREE.ExtrudeGeometry(dShape, {
    depth: CONFIG.letterDepth,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.08,
    bevelSegments: 3,
    curveSegments: 24,
  });
  dGeo.center();

  const monogram = new THREE.Group();
  const d1 = new THREE.Mesh(dGeo, glassMat);
  d1.position.x = -CONFIG.letterGap * 0.45;
  const d2 = new THREE.Mesh(dGeo, glassMat);
  d2.position.x = CONFIG.letterGap * 0.75;
  d2.position.z = -0.12;
  monogram.add(d1, d2);
  monogram.rotation.set(0.1, 0.32, -0.05);
  monogram.position.x = -0.25;
  scene.add(monogram);

  // spinQuat is the user-owned orientation — dragging writes into it, momentum keeps it alive
  const spinQuat = monogram.quaternion.clone();
  const homeQuat = spinQuat.clone();
  const workEuler = new THREE.Euler();
  const hoverQuat = new THREE.Quaternion();
  const deltaQuat = new THREE.Quaternion();
  const finalQuat = new THREE.Quaternion();

  /* --- pointer state --- */
  const pointer = { x: 0, y: 0 };
  const smoothedPointer = { x: 0, y: 0 };
  const tilt = { x: 0, y: 0, vx: 0, vy: 0 };
  let idleFade = 1;
  const DRAG_SENS = 4.6;
  const drag = { active: false, lastX: 0, lastY: 0, lastT: 0, velYaw: 0, velPitch: 0 };

  function showCrosshair(visible: boolean) {
    const opacity = visible ? "1" : "0";
    if (handles.crosshairV) handles.crosshairV.style.opacity = opacity;
    if (handles.crosshairH) handles.crosshairH.style.opacity = opacity;
    if (handles.coordText) handles.coordText.style.opacity = opacity;
  }

  function onPointerMove(e: PointerEvent) {
    const rect = container.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    pointer.x = (px / rect.width) * 2 - 1;
    pointer.y = (py / rect.height) * 2 - 1;

    if (handles.crosshairV) handles.crosshairV.style.transform = `translate3d(${px}px,0,0)`;
    if (handles.crosshairH) handles.crosshairH.style.transform = `translate3d(0,${py}px,0)`;
    if (handles.coordText) {
      handles.coordText.style.transform = `translate3d(${px + 18}px,${py + 14}px,0)`;
      handles.coordText.textContent = `X ${pointer.x.toFixed(2)}  Y ${(-pointer.y).toFixed(2)}`;
    }
    showCrosshair(true);

    if (drag.active) {
      const now = performance.now();
      const dtm = Math.max(8, now - drag.lastT) / 1000;
      const yawD = ((e.clientX - drag.lastX) / rect.width) * DRAG_SENS;
      const pitchD = ((e.clientY - drag.lastY) / rect.height) * DRAG_SENS * 0.85;

      workEuler.set(pitchD, yawD, 0, "XYZ");
      deltaQuat.setFromEuler(workEuler);
      spinQuat.premultiply(deltaQuat);

      drag.velYaw = THREE.MathUtils.clamp(THREE.MathUtils.lerp(drag.velYaw, yawD / dtm, 0.5), -6, 6);
      drag.velPitch = THREE.MathUtils.clamp(THREE.MathUtils.lerp(drag.velPitch, pitchD / dtm, 0.5), -6, 6);
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      drag.lastT = now;
    }
  }

  function onPointerDown(e: PointerEvent) {
    drag.active = true;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    drag.lastT = performance.now();
    drag.velYaw = 0;
    drag.velPitch = 0;
    container.setPointerCapture?.(e.pointerId);
    container.style.cursor = "grabbing";
  }

  function onPointerUp(e: PointerEvent) {
    drag.active = false;
    container.style.cursor = "grab";
    try {
      container.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  }

  function onPointerLeave() {
    pointer.x = 0;
    pointer.y = 0;
    showCrosshair(false);
  }

  container.style.cursor = "grab";
  container.style.touchAction = "none";
  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("pointerdown", onPointerDown);
  container.addEventListener("pointerup", onPointerUp);
  container.addEventListener("pointercancel", onPointerUp);
  container.addEventListener("pointerleave", onPointerLeave);

  function resize() {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);

    bgTarget?.dispose();
    bgTarget = makeTarget();
    blitMat.map = bgTarget.texture;
    blitMat.needsUpdate = true;
    glassUniforms.uBg.value = bgTarget.texture;

    renderer.getDrawingBufferSize(drawSize);
    bgUniforms.uRes.value.copy(drawSize);
    glassUniforms.uRes.value.copy(drawSize);

    const fit = Math.min(1, w / 900);
    monogram.scale.setScalar(0.6 + fit * 0.16);
    layoutText();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  let rafId = 0;
  const timer = new THREE.Timer();

  function frame() {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();
    bgUniforms.uTime.value = t;
    glassUniforms.uTime.value = t;

    smoothedPointer.x += (pointer.x - smoothedPointer.x) * 0.05;
    smoothedPointer.y += (pointer.y - smoothedPointer.y) * 0.05;

    // hover tilt is garnish only — it eases out entirely while the hand is on the object
    const hoverScale = drag.active ? 0 : 1;
    const targetTiltX = -pointer.y * CONFIG.maxTiltRad * hoverScale;
    const targetTiltY = pointer.x * CONFIG.maxTiltRad * hoverScale;
    tilt.vx += ((targetTiltX - tilt.x) * CONFIG.tiltStiffness - tilt.vx * CONFIG.tiltDamping) * dt;
    tilt.vy += ((targetTiltY - tilt.y) * CONFIG.tiltStiffness - tilt.vy * CONFIG.tiltDamping) * dt;
    tilt.x += tilt.vx * dt;
    tilt.y += tilt.vy * dt;

    // released momentum carries the spin, decaying like a heavy flywheel
    if (!drag.active) {
      const momentum = Math.abs(drag.velYaw) + Math.abs(drag.velPitch);
      if (momentum > 0.002) {
        workEuler.set(drag.velPitch * dt, drag.velYaw * dt, 0, "XYZ");
        deltaQuat.setFromEuler(workEuler);
        spinQuat.premultiply(deltaQuat);
        const decay = Math.exp(-2.1 * dt);
        drag.velYaw *= decay;
        drag.velPitch *= decay;
      } else {
        workEuler.set(0, 0.055 * dt * idleFade, 0, "XYZ");
        deltaQuat.setFromEuler(workEuler);
        spinQuat.premultiply(deltaQuat);
      }
    }

    const activity = Math.min(1, (Math.abs(pointer.x) + Math.abs(pointer.y)) * 1.6);
    idleFade += (1 - activity - idleFade) * 0.02;
    const idlePitch = Math.sin(t * 0.21) * 0.03 * idleFade;

    const roll = THREE.MathUtils.clamp(-(tilt.vy + drag.velYaw * 0.4) * 0.04, -0.06, 0.06);

    workEuler.set(tilt.x + idlePitch, tilt.y, roll, "XYZ");
    hoverQuat.setFromEuler(workEuler);
    finalQuat.copy(spinQuat).premultiply(hoverQuat);
    monogram.quaternion.copy(finalQuat);

    // back letter trails a breath behind the front — layered inertia
    d2.rotation.x = THREE.MathUtils.clamp(-(tilt.vx + drag.velPitch * 0.5) * 0.045, -0.09, 0.09);
    d2.rotation.y = THREE.MathUtils.clamp(-(tilt.vy + drag.velYaw * 0.5) * 0.045, -0.09, 0.09);

    monogram.position.y = 0.12 + Math.sin(t * CONFIG.bobSpeed) * CONFIG.bobAmplitude;

    camera.position.x = baseCameraPos.x + smoothedPointer.x * CONFIG.parallax;
    camera.position.y = baseCameraPos.y - smoothedPointer.y * CONFIG.parallax;
    camera.lookAt(lookTarget);

    if (handles.quatText) {
      const q = monogram.quaternion;
      handles.quatText.textContent = `${q.x.toFixed(2)} ${q.y.toFixed(2)} ${q.z.toFixed(2)} ${q.w.toFixed(2)}`;
    }
    if (handles.gizmoGroup) {
      handles.gizmoGroup.style.transform = `rotateX(${smoothedPointer.y * 12}deg) rotateY(${smoothedPointer.x * 12}deg)`;
    }

    /* render: bg → target, blit to screen, glass on top */
    if (bgTarget) {
      renderer.setRenderTarget(bgTarget);
      renderer.clear();
      renderer.render(bgScene, bgCam);
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(blitScene, bgCam);
      renderer.render(scene, camera);
    }

    rafId = requestAnimationFrame(frame);
  }

  const tl = gsap.timeline();
  tl.to(renderer.domElement, { opacity: 1, duration: 1.6, ease: "power2.out" });
  tl.from(monogram.position, { z: -1.6, duration: 1.9, ease: "expo.out" }, "<");

  rafId = requestAnimationFrame(frame);

  function resetOrientation() {
    pointer.x = 0;
    pointer.y = 0;
    smoothedPointer.x = 0;
    smoothedPointer.y = 0;
    tilt.x = 0;
    tilt.y = 0;
    tilt.vx = 0;
    tilt.vy = 0;
    drag.velYaw = 0;
    drag.velPitch = 0;
    spinQuat.copy(homeQuat);
  }

  function setRoughness(v: number) {
    glassUniforms.uRough.value = THREE.MathUtils.clamp(v, 0, 1);
  }

  function setNoiseScale(v: number) {
    glassUniforms.uNoise.value = THREE.MathUtils.clamp(v, 0, 20);
  }

  function setTint(hex: string) {
    glassUniforms.uTint.value.set(hex);
  }

  function dispose() {
    cancelAnimationFrame(rafId);
    timer.dispose();
    resizeObserver.disconnect();
    container.removeEventListener("pointermove", onPointerMove);
    container.removeEventListener("pointerdown", onPointerDown);
    container.removeEventListener("pointerup", onPointerUp);
    container.removeEventListener("pointercancel", onPointerUp);
    container.removeEventListener("pointerleave", onPointerLeave);
    tl.kill();

    bgTarget?.dispose();
    bgQuadGeo.dispose();
    bgMat.dispose();
    textGeo.dispose();
    textMat.dispose();
    textTexture.dispose();
    blitGeo.dispose();
    blitMat.dispose();
    dGeo.dispose();
    glassMat.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return { dispose, resetOrientation, setRoughness, setNoiseScale, setTint };
}
