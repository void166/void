import * as THREE from "three";
import type { Work } from "@/lib/data/works";

export type WorksApi = {
  dispose: () => void;
  /** 0..1 across the whole pinned sequence */
  setProgress: (p: number) => void;
  /** pointer in -1..1 (x right, y down) */
  setPointer: (x: number, y: number) => void;
};

/** Hold → transition → settle shaping shared with the DOM layer. */
export function shapeSegment(t: number): number {
  const raw = THREE.MathUtils.clamp((t - 0.14) / 0.72, 0, 1);
  return raw * raw * raw * (raw * (raw * 6 - 15) + 10); // smootherstep
}

const NOISE_GLSL = /* glsl */ `
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
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++){
      v += a * noise(p);
      p = p * 2.03 + 17.7;
      a *= 0.5;
    }
    return v;
  }
`;

const QUAD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/* ------------------------------------------------------------------ */
/* Per-project procedural visual — 5 pattern families, one palette    */
/* ------------------------------------------------------------------ */
const VIS_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSeed;
  uniform int   uPattern;
  uniform vec3  uColA;
  uniform vec3  uColB;
  uniform vec3  uColC;
  ${NOISE_GLSL}

  void main(){
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(1.78, 1.0);
    float t = uTime * 0.25 + uSeed;
    vec3 col = uColC;

    if (uPattern == 0){
      /* flowing ribbons */
      float w = fbm(p * 1.6 + vec2(t * 0.4, 0.0));
      float band = sin(p.y * 9.0 + w * 5.5 + t * 1.2);
      float rib = smoothstep(0.15, 0.85, band * 0.5 + 0.5);
      float glow = pow(abs(band), 6.0);
      col = mix(uColC, mix(uColB, uColA, rib), 0.35 + 0.55 * rib);
      col += uColA * glow * 0.6;
    } else if (uPattern == 1){
      /* warped tunnel rings */
      vec2 q = p + vec2(fbm(p * 2.0 + t) - 0.5) * 0.25;
      float r = length(q);
      float a = atan(q.y, q.x);
      float ring = sin(3.2 / (r + 0.25) - t * 2.2 + a * 2.0);
      float m = smoothstep(-0.2, 0.9, ring);
      col = mix(uColC, mix(uColB, uColA, m), m * 0.9);
      col += uColA * pow(max(0.0, 1.0 - r * 1.4), 3.0) * 0.5;
    } else if (uPattern == 2){
      /* glowing cell field with scan sweep */
      vec2 g = uv * vec2(14.0, 8.0);
      vec2 cell = floor(g);
      vec2 cuv = fract(g);
      float pulse = hash(cell + uSeed) * 0.6 + 0.4 * sin(t * 2.0 + hash(cell) * 6.28);
      float sweep = pow(max(0.0, 1.0 - abs(uv.x - fract(t * 0.3)) * 3.0), 2.0);
      float box = smoothstep(0.08, 0.16, cuv.x) * smoothstep(0.92, 0.84, cuv.x)
                * smoothstep(0.08, 0.16, cuv.y) * smoothstep(0.92, 0.84, cuv.y);
      float lit = step(0.72, pulse + sweep * 0.5);
      col = mix(uColC, mix(uColB, uColA, pulse), box * lit * (0.5 + sweep));
      col += uColB * (1.0 - box) * 0.06;
    } else if (uPattern == 3){
      /* interference waves */
      float w1 = sin(dot(p, vec2(6.0, 2.4)) + t * 1.6);
      float w2 = sin(dot(p, vec2(-3.5, 7.2)) - t * 1.1 + fbm(p * 2.0) * 3.0);
      float i1 = w1 * w2;
      float m = smoothstep(-0.4, 0.9, i1);
      col = mix(uColC, mix(uColB, uColA, m), 0.25 + m * 0.75);
      col += uColA * pow(max(0.0, i1), 5.0) * 0.45;
    } else {
      /* voronoi glow */
      vec2 g = p * 3.2;
      vec2 cell = floor(g);
      float d = 10.0;
      for (int y = -1; y <= 1; y++)
      for (int x = -1; x <= 1; x++){
        vec2 o = vec2(float(x), float(y));
        vec2 site = o + vec2(hash(cell + o + uSeed), hash(cell + o + uSeed + 9.1))
                  - 0.5 + 0.35 * vec2(sin(t + hash(cell + o) * 6.28), cos(t * 0.8 + hash(cell + o) * 6.28));
        d = min(d, length(fract(g) - 0.5 - site * 0.5));
      }
      float glow = pow(max(0.0, 1.0 - d * 1.6), 3.0);
      float edge = smoothstep(0.02, 0.0, abs(d - 0.28));
      col = mix(uColC, uColB, glow * 0.6);
      col += uColA * glow * 0.55 + uColA * edge * 0.35;
    }

    /* shared treatment: vignette + grain */
    float r2 = dot(uv - 0.5, uv - 0.5);
    col *= 1.0 - r2 * 1.1;
    col += (hash(gl_FragCoord.xy + fract(uTime) * 71.0) - 0.5) * 0.04;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ------------------------------------------------------------------ */
/* Background: spatial transition between two project visuals         */
/* ------------------------------------------------------------------ */
const TRANS_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uT;     /* shaped 0..1 transition */
  uniform float uTime;
  ${NOISE_GLSL}

  vec3 blurSample(sampler2D tex, vec2 uv, float r){
    vec3 c = texture2D(tex, uv).rgb * 0.4;
    c += texture2D(tex, uv + vec2( r,  r * 0.6)).rgb * 0.15;
    c += texture2D(tex, uv + vec2(-r,  r * 0.6)).rgb * 0.15;
    c += texture2D(tex, uv + vec2( r * 0.6, -r)).rgb * 0.15;
    c += texture2D(tex, uv + vec2(-r * 0.6, -r)).rgb * 0.15;
    return c;
  }

  void main(){
    vec2 uv = vUv;
    float n = fbm(uv * 3.0 + uTime * 0.05);

    /* outgoing: zoom in, drift left, blur up */
    vec2 uvA = (uv - 0.5) / (1.0 + uT * 0.45) + 0.5;
    uvA += vec2(-uT * 0.16, uT * 0.04) + (n - 0.5) * 0.05 * uT;
    vec3 a = blurSample(uTexA, uvA, 0.012 + uT * 0.03);

    /* incoming: settle from a wider crop, sharpen */
    float back = 1.0 - uT;
    vec2 uvB = (uv - 0.5) / (1.4 - 0.4 * uT) + 0.5;
    uvB += vec2(back * 0.18, -back * 0.03) + (n - 0.5) * 0.05 * back;
    vec3 b = blurSample(uTexB, uvB, 0.004 + back * 0.028);

    /* directional-noise sweep instead of a flat crossfade */
    float field = uv.x * 0.55 + (1.0 - uv.y) * 0.2 + n * 0.35;
    float sweep = uT * 1.9 - 0.45;
    float m = smoothstep(sweep - 0.35, sweep + 0.15, field);
    m = 1.0 - m;                       /* uT=0 -> show A everywhere */
    vec3 col = mix(a, b, m);

    /* environment treatment: darker + slightly desaturated + vignette */
    col *= 0.52;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(lum), 0.22);
    float r2 = dot(uv - 0.5, uv - 0.5);
    col *= 1.0 - r2 * 1.35;
    col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.03;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ------------------------------------------------------------------ */
/* Foreground project plane — sharp visual w/ motion warp + fade      */
/* ------------------------------------------------------------------ */
const PLANE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLANE_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform float uOpacity;
  uniform float uBlur;
  uniform float uWarp;
  uniform float uTime;
  ${NOISE_GLSL}

  void main(){
    vec2 uv = vUv;
    /* subtle barrel + noise warp while in motion */
    vec2 c = uv - 0.5;
    uv = 0.5 + c * (1.0 + dot(c, c) * 0.35 * uWarp);
    uv += (vec2(noise(uv * 7.0 + uTime), noise(uv * 7.0 - uTime)) - 0.5) * 0.035 * uWarp;

    float r = 0.002 + uBlur * 0.012;
    vec3 col = texture2D(uTex, uv).rgb * 0.5;
    col += texture2D(uTex, uv + vec2(r, 0.0)).rgb * 0.25;
    col += texture2D(uTex, uv - vec2(r, 0.0)).rgb * 0.25;

    /* faint scanlines keep it in the site's CRT world */
    col *= 0.96 + 0.04 * sin(uv.y * 700.0);

    /* soft edge falloff so it reads as an object, not a crop */
    vec2 e = smoothstep(0.0, 0.015, uv) * smoothstep(1.0, 0.985, uv);
    float edge = e.x * e.y;

    gl_FragColor = vec4(col, uOpacity * edge);
  }
`;

/* Glass frame: screen-space refraction of the background (same family as the hero) */
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
  varying vec3 vN;
  varying vec3 vView;
  varying vec3 vWorld;
  ${NOISE_GLSL}

  void main(){
    vec2 suv = gl_FragCoord.xy / uRes;
    vec3 n = normalize(vN);
    vec3 v = normalize(vView);
    float ndv = clamp(dot(n, v), 0.0, 1.0);

    vec2 off = n.xy * 0.10;
    off += (noise(vWorld.xy * 5.0 + vWorld.z * 2.0) - 0.5) * 0.02;

    float disp = 0.018;
    vec3 col;
    col.r = texture2D(uBg, clamp(suv + off * (1.0 + disp), 0.001, 0.999)).r;
    col.g = texture2D(uBg, clamp(suv + off, 0.001, 0.999)).g;
    col.b = texture2D(uBg, clamp(suv + off * (1.0 - disp), 0.001, 0.999)).b;

    float fres = pow(1.0 - ndv, 2.6);
    col = col * (1.35 + fres * 0.8) + vec3(1.0) * fres * 0.6;

    vec3 l1 = normalize(vec3(0.5, 0.85, 0.45));
    vec3 rf = reflect(-v, n);
    float sp = pow(max(dot(rf, l1), 0.0), 80.0) * 1.8;
    sp *= 0.7 + 0.3 * sin(uTime * 1.7 + vWorld.x * 3.0);
    col += vec3(sp);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function frameGeometry(outerW: number, outerH: number, border: number, depth: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-outerW / 2, -outerH / 2);
  shape.lineTo(outerW / 2, -outerH / 2);
  shape.lineTo(outerW / 2, outerH / 2);
  shape.lineTo(-outerW / 2, outerH / 2);
  shape.closePath();
  const iw = outerW / 2 - border;
  const ih = outerH / 2 - border;
  const hole = new THREE.Path();
  hole.moveTo(-iw, -ih);
  hole.lineTo(iw, -ih);
  hole.lineTo(iw, ih);
  hole.lineTo(-iw, ih);
  hole.closePath();
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 2,
    curveSegments: 4,
  });
  geo.center();
  return geo;
}

export function createWorksShowcase(container: HTMLDivElement, works: Work[]): WorksApi {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";

  const drawSize = new THREE.Vector2();

  /* --- project-visual render targets (fixed res, cheap) --- */
  const VIS_W = 1024;
  const VIS_H = 576;
  const mkVisRT = () =>
    new THREE.WebGLRenderTarget(VIS_W, VIS_H, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
  const visRTA = mkVisRT();
  const visRTB = mkVisRT();

  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);

  const visUniforms = {
    uTime: { value: 0 },
    uSeed: { value: 0 },
    uPattern: { value: 0 },
    uColA: { value: new THREE.Color() },
    uColB: { value: new THREE.Color() },
    uColC: { value: new THREE.Color() },
  };
  const visMat = new THREE.ShaderMaterial({
    uniforms: visUniforms,
    vertexShader: QUAD_VERT,
    fragmentShader: VIS_FRAG,
    depthWrite: false,
    depthTest: false,
  });
  const visScene = new THREE.Scene();
  visScene.add(new THREE.Mesh(quadGeo, visMat));

  function renderVisual(index: number, target: THREE.WebGLRenderTarget, time: number) {
    const v = works[index].visual;
    visUniforms.uTime.value = time;
    visUniforms.uSeed.value = v.seed;
    visUniforms.uPattern.value = v.pattern;
    visUniforms.uColA.value.set(v.colA);
    visUniforms.uColB.value.set(v.colB);
    visUniforms.uColC.value.set(v.colC);
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(visScene, quadCam);
  }

  /* --- background transition pass (into bgRT for glass refraction) --- */
  let bgRT: THREE.WebGLRenderTarget | null = null;
  const transUniforms = {
    uTexA: { value: visRTA.texture as THREE.Texture },
    uTexB: { value: visRTB.texture as THREE.Texture },
    uT: { value: 0 },
    uTime: { value: 0 },
  };
  const transMat = new THREE.ShaderMaterial({
    uniforms: transUniforms,
    vertexShader: QUAD_VERT,
    fragmentShader: TRANS_FRAG,
    depthWrite: false,
    depthTest: false,
  });
  const transScene = new THREE.Scene();
  transScene.add(new THREE.Mesh(quadGeo, transMat));

  const blitMat = new THREE.MeshBasicMaterial({ depthTest: false, depthWrite: false });
  const blitScene = new THREE.Scene();
  blitScene.add(new THREE.Mesh(quadGeo, blitMat));

  /* --- main 3D scene --- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  const CAM_Z = 6;
  camera.position.set(0, 0, CAM_Z);

  const mkPlaneUniforms = (tex: THREE.Texture) => ({
    uTex: { value: tex },
    uOpacity: { value: 1 },
    uBlur: { value: 0 },
    uWarp: { value: 0 },
    uTime: { value: 0 },
  });
  const planeGeo = new THREE.PlaneGeometry(3.36, 1.89);
  const curUniforms = mkPlaneUniforms(visRTA.texture);
  const nextUniforms = mkPlaneUniforms(visRTB.texture);
  const mkPlaneMat = (uniforms: ReturnType<typeof mkPlaneUniforms>) =>
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: PLANE_VERT,
      fragmentShader: PLANE_FRAG,
      transparent: true,
      depthWrite: false,
    });
  const planeCur = new THREE.Mesh(planeGeo, mkPlaneMat(curUniforms));
  const planeNext = new THREE.Mesh(planeGeo, mkPlaneMat(nextUniforms));
  planeNext.renderOrder = 1;
  planeCur.renderOrder = 3;
  scene.add(planeCur, planeNext);

  const glassUniforms = {
    uBg: { value: null as THREE.Texture | null },
    uRes: { value: new THREE.Vector2(2, 2) },
    uTime: { value: 0 },
  };
  const glassMat = new THREE.ShaderMaterial({
    uniforms: glassUniforms,
    vertexShader: GLASS_VERT,
    fragmentShader: GLASS_FRAG,
  });
  const frame = new THREE.Mesh(frameGeometry(3.9, 2.36, 0.24, 0.16), glassMat);
  frame.renderOrder = 2;
  scene.add(frame);

  /* floating glass shards for depth */
  const shardGeo = frameGeometry(0.9, 0.62, 0.1, 0.08);
  const shard1 = new THREE.Mesh(shardGeo, glassMat);
  shard1.position.set(-2.9, 1.35, -2.6);
  shard1.rotation.set(0.3, 0.5, 0.1);
  const shard2 = new THREE.Mesh(shardGeo, glassMat);
  shard2.position.set(3.1, -1.5, -1.8);
  shard2.rotation.set(-0.2, -0.6, 0.15);
  scene.add(shard1, shard2);

  /* --- state --- */
  let progress = 0;
  let smoothProgress = 0;
  const pointer = { x: 0, y: 0 };
  const smoothPointer = { x: 0, y: 0 };
  let rtAIndex = -1;
  let rtBIndex = -1;

  function resize() {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    bgRT?.dispose();
    renderer.getDrawingBufferSize(drawSize);
    bgRT = new THREE.WebGLRenderTarget(Math.max(2, drawSize.x), Math.max(2, drawSize.y), {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    blitMat.map = bgRT.texture;
    blitMat.needsUpdate = true;
    glassUniforms.uBg.value = bgRT.texture;
    glassUniforms.uRes.value.copy(drawSize);
    /* fit: keep the frame comfortably inside narrow viewports */
    const fit = Math.min(1, (w / h) / 1.55);
    scene.scale.setScalar(0.82 + fit * 0.18);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  let rafId = 0;
  const timer = new THREE.Timer();

  function frameLoop() {
    timer.update();
    const t = timer.getElapsed();

    smoothProgress += (progress - smoothProgress) * 0.16;
    smoothPointer.x += (pointer.x - smoothPointer.x) * 0.06;
    smoothPointer.y += (pointer.y - smoothPointer.y) * 0.06;

    const segments = works.length - 1;
    const global = THREE.MathUtils.clamp(smoothProgress, 0, 1) * segments;
    const i = Math.min(segments - 1, Math.floor(global));
    const local = segments === 0 ? 0 : global - i;
    const tt = shapeSegment(local);
    const arc = Math.sin(tt * Math.PI);

    /* keep the two RTs mapped to current + next */
    const needA = Math.min(i, works.length - 1);
    const needB = Math.min(i + 1, works.length - 1);
    rtAIndex = needA;
    rtBIndex = needB;
    renderVisual(rtAIndex, visRTA, t);
    if (rtBIndex !== rtAIndex && (tt > 0.001 || local > 0.05)) {
      renderVisual(rtBIndex, visRTB, t * 0.9 + 7.0);
    }

    /* outgoing plane: pushes past the camera, exits decisively */
    planeCur.position.z = tt * 3.2;
    planeCur.position.x = -tt * 2.3;
    planeCur.position.y = tt * 0.4 + Math.sin(t * 0.5) * 0.03;
    planeCur.rotation.y = -tt * 0.5 + smoothPointer.x * 0.03;
    planeCur.rotation.x = tt * 0.1 - smoothPointer.y * 0.02;
    curUniforms.uOpacity.value = 1 - THREE.MathUtils.smoothstep(tt, 0.35, 0.8);
    curUniforms.uBlur.value = tt * 1.6;
    curUniforms.uWarp.value = arc;
    curUniforms.uTime.value = t;

    /* incoming plane: emerges from depth */
    const back = 1 - tt;
    planeNext.visible = rtBIndex !== rtAIndex;
    planeNext.position.z = -6.5 * back;
    planeNext.position.x = back * 1.1;
    planeNext.position.y = -back * 0.25 + Math.sin(t * 0.5 + 2.0) * 0.03;
    planeNext.rotation.y = back * 0.3 + smoothPointer.x * 0.03;
    planeNext.rotation.x = -back * 0.06 - smoothPointer.y * 0.02;
    nextUniforms.uOpacity.value = THREE.MathUtils.smoothstep(tt, 0.12, 0.5);
    nextUniforms.uBlur.value = back * 2.0;
    nextUniforms.uWarp.value = arc * 0.7;
    nextUniforms.uTime.value = t;

    /* glass portal: repositioned like a physical object mid-transition */
    frame.rotation.y = Math.sin(tt * Math.PI * 2.0) * -0.14 + smoothPointer.x * 0.06;
    frame.rotation.x = arc * 0.05 - smoothPointer.y * 0.045;
    frame.position.z = arc * 0.5;
    frame.position.y = Math.sin(t * 0.5) * 0.04;

    shard1.rotation.y += 0.0012;
    shard2.rotation.y -= 0.0009;
    shard1.position.y = 1.35 + Math.sin(t * 0.4) * 0.08;
    shard2.position.y = -1.5 + Math.sin(t * 0.35 + 1.5) * 0.08;

    /* camera: gallery dolly + mouse parallax */
    camera.position.x = smoothPointer.x * 0.28;
    camera.position.y = -smoothPointer.y * 0.18 + arc * 0.12;
    camera.position.z = CAM_Z - arc * 0.55;
    camera.lookAt(0, 0, 0);

    /* passes */
    transUniforms.uT.value = tt;
    transUniforms.uTime.value = t;
    glassUniforms.uTime.value = t;

    if (bgRT) {
      renderer.setRenderTarget(bgRT);
      renderer.clear();
      renderer.render(transScene, quadCam);
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(blitScene, quadCam);
      renderer.render(scene, camera);
    }

    rafId = requestAnimationFrame(frameLoop);
  }
  rafId = requestAnimationFrame(frameLoop);

  function setProgress(p: number) {
    progress = THREE.MathUtils.clamp(p, 0, 1);
  }
  function setPointer(x: number, y: number) {
    pointer.x = THREE.MathUtils.clamp(x, -1, 1);
    pointer.y = THREE.MathUtils.clamp(y, -1, 1);
  }

  function dispose() {
    cancelAnimationFrame(rafId);
    timer.dispose();
    resizeObserver.disconnect();
    visRTA.dispose();
    visRTB.dispose();
    bgRT?.dispose();
    quadGeo.dispose();
    visMat.dispose();
    transMat.dispose();
    blitMat.dispose();
    planeGeo.dispose();
    (planeCur.material as THREE.Material).dispose();
    (planeNext.material as THREE.Material).dispose();
    frame.geometry.dispose();
    shardGeo.dispose();
    glassMat.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return { dispose, setProgress, setPointer };
}
