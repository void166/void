import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";

/** Drop your own model at public/models/hero.glb and it becomes the glass centerpiece. */
const HERO_MODEL_URL = "/models/hero.glb";

export type CrystalHeroHandles = {
  quatText?: HTMLElement | null;
  gizmoGroup?: HTMLElement | null;
  crosshairV?: HTMLElement | null;
  crosshairH?: HTMLElement | null;
  coordText?: HTMLElement | null;
};

export type AboutPaneSpec = {
  word: string;
  accent: string;
  /** optional image drawn faintly behind the word (e.g. a portrait) */
  imageUrl?: string;
};

export type CrystalHeroApi = {
  dispose: () => void;
  resetOrientation: () => void;
  setRoughness: (v: number) => void;
  setNoiseScale: (v: number) => void;
  setTint: (hex: string) => void;
  /**
   * Drive the hero → about handover.
   * world 0..1 dissolves the glitch wall into the color field (and fades
   * wordmark/tags, pulls the camera a touch); progress 0..n-1 swings the
   * curved pane ring; glowA/glowB are the current color-world glows.
   */
  setAbout: (world: number, progress: number, glowA: string, glowB: string) => void;
};

const CONFIG = {
  cameraFov: 38,
  cameraZ: 7.4,
  maxTiltRad: THREE.MathUtils.degToRad(10),
  tiltStiffness: 60,
  tiltDamping: 12,
  bobAmplitude: 0.08,
  bobSpeed: 0.5,
  parallax: 0.12,
  wordmark: "RENCHIN",
  // material defaults — mirrored by the MainLogo Material panel
  roughness: 0.1,
  noiseScale: 9.0,
};

/* ------------------------------------------------------------------ */
/* Background: procedural glitch wall (zebra swirls, flicker tiles,   */
/* triangle watermarks, glitch bands, film grain)                     */
/* ------------------------------------------------------------------ */
const BG_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BG_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uWorld;
  uniform vec3  uAccent;
  uniform vec3  uGlowA;
  uniform vec3  uGlowB;
  varying vec2 vUv;

  float hash(vec2 p){
    p = fract(p*vec2(123.34, 456.21));
    p += dot(p, p+45.32);
    return fract(p.x*p.y);
  }

  void main(){
    vec2 uv = vUv;
    float t = uTime;

    /* LED pixel lattice across the whole wall */
    vec2 grid = vec2(260.0, 72.0);
    vec2 cell = floor(uv * grid);
    vec2 cuv  = fract(uv * grid);
    float dotMask = smoothstep(0.52, 0.36, max(abs(cuv.x - 0.5), abs(cuv.y - 0.5)));

    /* ---------- hero content: the glitch show ---------- */
    vec2 guv = uv;
    float band  = floor(guv.y * 42.0);
    float gseed = hash(vec2(band, floor(t*2.5)));
    if (gseed > 0.965){
      guv.x += (hash(vec2(band, floor(t*7.0))) - 0.5) * 0.05;
    }
    vec2 p = (guv - 0.5) * vec2(7.5, 2.6);
    vec2 c1 = p - vec2(-1.7, 0.45);
    vec2 c2 = p - vec2( 1.9,-0.55);
    float a1 = atan(c1.y, c1.x), r1 = length(c1);
    float a2 = atan(c2.y, c2.x), r2 = length(c2);
    float sw1 = sin(a1*4.0 + r1*5.5 - t*0.12);
    float sw2 = sin(a2*5.0 - r2*6.5 + t*0.09);
    float blendMask = smoothstep(-0.3, 0.3, sin(p.x*0.7 + p.y*0.9 + t*0.05));
    float zebra = smoothstep(-0.08, 0.08, mix(sw1, sw2, blendMask));
    float zebraMask = smoothstep(3.4, 0.6, min(r1, r2));
    float flickStep = floor(t*3.0);
    float fl = hash(cell + flickStep*0.013);
    float tileLum = step(0.95, fl) * 0.05 + step(0.99, fl) * 0.14;
    float accentTile = step(0.996, hash(cell + flickStep*0.029 + 7.7));

    vec3 heroCol = vec3(0.012);
    heroCol += vec3(0.10) * zebra * zebraMask;
    heroCol += vec3(1.0) * tileLum;
    heroCol += uAccent * accentTile * 0.30;
    /* subtle centre glow so the glass has something to catch */
    heroCol += mix(vec3(0.03), uAccent * 0.05, 0.4) * smoothstep(0.5, 0.0, distance(uv, vec2(0.5)));

    /* ---------- about content: dark LED room washed by the section glow ---------- */
    vec3 roomGlow = mix(uGlowA, uGlowB, clamp(uv.x * 0.8 + uv.y * 0.4 - 0.1, 0.0, 1.0));
    vec3 aboutCol = vec3(0.010);
    aboutCol += roomGlow * 1.4;
    aboutCol += vec3(1.0) * tileLum * 0.6;
    aboutCol += uAccent * accentTile * 0.12;

    vec3 content = mix(heroCol, aboutCol, uWorld);

    /* ---------- LED-ize ---------- */
    float cellVar = 0.82 + 0.36 * hash(cell * 0.731);
    vec3 col = content * dotMask * cellVar;
    col += vec3(0.013) * (1.0 - dotMask);

    /* module seams */
    col += vec3(0.026) * clamp(step(fract(uv.x * 28.0), 0.0035) + step(fract(uv.y * 9.0), 0.007), 0.0, 1.0);

    /* film noise + top/bottom falloff into darkness */
    col += (hash(uv * 913.7 + fract(t) * 71.0) - 0.5) * 0.02;
    col *= smoothstep(0.0, 0.14, uv.y) * smoothstep(1.0, 0.84, uv.y);

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

/** Glass prism: triangle ring — a personal mark, not a corporate letterform. */
function makeLogoGeometry(): THREE.ExtrudeGeometry {
  const R = 1.5;
  const r = 0.68;
  const tri = (radius: number, sign: number) => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + i * ((Math.PI * 2) / 3) * sign;
      pts.push(new THREE.Vector2(Math.cos(a) * radius, -Math.sin(a) * radius));
    }
    return pts;
  };
  const outer = tri(R, 1);
  const shape = new THREE.Shape();
  shape.moveTo(outer[0].x, outer[0].y);
  shape.lineTo(outer[1].x, outer[1].y);
  shape.lineTo(outer[2].x, outer[2].y);
  shape.closePath();
  const inner = tri(r, -1);
  const hole = new THREE.Path();
  hole.moveTo(inner[0].x, inner[0].y);
  hole.lineTo(inner[1].x, inner[1].y);
  hole.lineTo(inner[2].x, inner[2].y);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.6,
    bevelEnabled: true,
    bevelThickness: 0.11,
    bevelSize: 0.1,
    bevelSegments: 3,
    curveSegments: 4,
  });
  geo.center();
  return geo;
}

/* ------------------------------------------------------------------ */
/* About ring: curved glass panes orbiting the model                   */
/* ------------------------------------------------------------------ */
const PANE_STEP = 1.25;
const PANE_RADIUS = 3.2;
const PANE_ARC = 1.1;
const PANE_H = 2.2;

/* Curved plane: a vertical cylinder segment with explicit UVs
   (u runs left-to-right as seen from the camera, no mirroring). */
function curvedPlaneGeometry(radius: number, arc: number, height: number, segs = 48): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= segs; j++) {
    const t = j / segs;
    const theta = (t - 0.5) * arc;
    const x = Math.sin(theta) * radius;
    const z = Math.cos(theta) * radius;
    positions.push(x, -height / 2, z, x, height / 2, z);
    uvs.push(t, 0, t, 1);
  }
  for (let j = 0; j < segs; j++) {
    const a = j * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/* Inward-facing room wall: same construction, but centered BEHIND the
   stage (theta measured from -z) with u running left-to-right as seen
   from the camera, so wall content is never mirrored. */
function curvedWallGeometry(radius: number, arc: number, height: number, segs = 96): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= segs; j++) {
    const t = j / segs;
    const theta = Math.PI - (t - 0.5) * arc;
    const x = Math.sin(theta) * radius;
    const z = Math.cos(theta) * radius;
    positions.push(x, -height / 2, z, x, height / 2, z);
    uvs.push(t, 0, t, 1);
  }
  for (let j = 0; j < segs; j++) {
    const a = j * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

function drawPaneTexture(
  canvas: HTMLCanvasElement,
  spec: AboutPaneSpec,
  index: number,
  total: number,
  img?: HTMLImageElement
) {
  const W = (canvas.width = 1280);
  const H = (canvas.height = 800);
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, W, H);

  if (img && img.naturalWidth > 0) {
    /* picture pane, alche-style: the photo IS the pane — bright and
       full-bleed on the curved glass in front of the model */
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.restore();

    /* slight bottom grade so the meta stays readable */
    const grade = ctx.createLinearGradient(0, H, 0, H - 260);
    grade.addColorStop(0, "rgba(0,0,0,0.4)");
    grade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grade;
    ctx.fillRect(0, H - 260, W, 260);
  } else {
    /* no picture yet — frosted glass with the section word */
    ctx.fillStyle = "rgba(14, 16, 24, 0.3)";
    ctx.fillRect(0, 0, W, H);
    ctx.font = "900 165px 'Arial Black', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2.5;
    ctx.strokeText(spec.word, W / 2, H / 2 + 10);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillText(spec.word, W / 2, H / 2 + 10);
  }

  /* top-light sheen, like light catching glass */
  const sheen = ctx.createLinearGradient(0, 0, 0, H);
  sheen.addColorStop(0, "rgba(255,255,255,0.12)");
  sheen.addColorStop(0.35, "rgba(255,255,255,0.02)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);

  /* faint grid */
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }

  /* mono meta, top-left */
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "400 26px 'Courier New', monospace";
  ctx.fillStyle = spec.accent;
  ctx.fillText(`${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, 64, 84);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText(spec.word, 64, 122);

  /* accent bar, bottom-left */
  ctx.fillStyle = spec.accent;
  ctx.fillRect(64, H - 72, 220, 4);

  /* soft-edge mask: no hard border — the four corners and edges
     feather out like frosted glass */
  ctx.globalCompositeOperation = "destination-in";
  ctx.filter = "blur(26px)";
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  const inset = 42;
  const r = 90;
  ctx.roundRect(inset, inset, W - inset * 2, H - inset * 2, r);
  ctx.fill();
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
}

export function createCrystalHero(
  container: HTMLDivElement,
  handles: CrystalHeroHandles = {},
  paneSpecs: AboutPaneSpec[] = []
): CrystalHeroApi {
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
    uScroll: { value: 0 },
    uWorld: { value: 0 },
    uAccent: { value: new THREE.Color(0x59e3ff) },
    uGlowA: { value: new THREE.Color(0x2a0b52) },
    uGlowB: { value: new THREE.Color(0x0b0322) },
  };
  const bgMat = new THREE.ShaderMaterial({
    uniforms: bgUniforms,
    side: THREE.DoubleSide,
    vertexShader: BG_VERT,
    fragmentShader: BG_FRAG,
  });
  /* the curved LED wall — real geometry wrapping the whole stage */
  const bgQuadGeo = curvedWallGeometry(11, 4.35, 14, 96);
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
    /* the bg scene renders with the perspective camera now — size the
       wordmark plane to ~92% of the visible width at its depth */
    const dist = CONFIG.cameraZ + 2.6;
    const visW = 2 * dist * Math.tan(THREE.MathUtils.degToRad(CONFIG.cameraFov / 2)) * aspect;
    const w = visW * 0.92;
    const h = w / wordmark.aspect;
    textMesh.scale.set(w, Math.min(h, 3.4), 1);
    textMesh.position.set(0, 0.05, -2.6);
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

  const dGeo = makeLogoGeometry();

  const monogram = new THREE.Group();
  const d1 = new THREE.Mesh(dGeo, glassMat);
  const d2 = new THREE.Mesh(dGeo, glassMat);
  d2.scale.setScalar(0.4);
  d2.position.set(1.75, -0.85, -0.55);
  d2.rotation.z = 0.5;
  monogram.add(d1, d2);
  monogram.rotation.set(0, 0.32, 0); // upright — yaw only
  monogram.position.x = -0.1;
  scene.add(monogram);

  /* --- optional custom centerpiece: swap the prism for the user's GLB --- */
  const customGeos: THREE.BufferGeometry[] = [];
  new GLTFLoader().load(
    HERO_MODEL_URL,
    (gltf) => {
      const group = new THREE.Group();
      gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const src = child as THREE.Mesh;
          const geo = src.geometry.clone();
          geo.applyMatrix4(src.matrixWorld);
          if (!geo.getAttribute("normal")) geo.computeVertexNormals();
          customGeos.push(geo);
          group.add(new THREE.Mesh(geo, glassMat));
        }
      });
      if (customGeos.length === 0) return; // nothing usable — keep the prism

      /* auto-center, then scale so the model fills the stage:
         height drives the fit, width/depth only cap runaway shapes */
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const fit = Math.min(
        5.5 / Math.max(size.y, 0.001),
        5.2 / Math.max(size.x, 0.001),
        5.2 / Math.max(size.z, 0.001)
      );
      group.position.sub(center);
      const holder = new THREE.Group();
      holder.add(group);
      holder.scale.setScalar(fit);

      monogram.remove(d1); // the shard (d2) stays for depth layering
      monogram.add(holder);
    },
    undefined,
    () => {
      /* no model at public/models/hero.glb — the glass prism remains */
    }
  );

  // spinQuat is the user-owned orientation — dragging writes into it, momentum keeps it alive
  const spinQuat = monogram.quaternion.clone();
  const homeQuat = spinQuat.clone();
  const workEuler = new THREE.Euler();
  const hoverQuat = new THREE.Quaternion();
  const deltaQuat = new THREE.Quaternion();
  const finalQuat = new THREE.Quaternion();

  /* --- floating code tags orbiting the centerpiece --- */
  const CODE_TAGS = [
    "</>", "{ }", "=>", "const", "async / await", "npm run dev",
    "git push", "<div />", "useState()", "() => {}", "200 OK", "fetch()",
  ];

  function makeTagSprite(text: string, color: string, glow: string): THREE.Sprite {
    const pad = 28;
    const fs = 46;
    const measure = document.createElement("canvas").getContext("2d")!;
    measure.font = `600 ${fs}px "SF Mono", "Cascadia Code", Consolas, monospace`;
    const w = Math.ceil(measure.measureText(text).width) + pad * 2;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = fs + pad * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.font = `600 ${fs}px "SF Mono", "Cascadia Code", Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    const s = 0.0042;
    sp.scale.set(canvas.width * s, canvas.height * s, 1);
    return sp;
  }

  type TagState = {
    sprite: THREE.Sprite;
    angle: number;
    radius: number;
    height: number;
    speed: number;
    phase: number;
    base: number;
  };
  const tagGroup = new THREE.Group();
  const tagStates: TagState[] = CODE_TAGS.map((text, i) => {
    const accent = i % 3 === 0;
    const sprite = makeTagSprite(
      text,
      accent ? "#59e3ff" : "rgba(255,255,255,0.9)",
      accent ? "rgba(89,227,255,0.9)" : "rgba(255,255,255,0.55)"
    );
    tagGroup.add(sprite);
    return {
      sprite,
      angle: i * 2.41, // golden-ish spread
      radius: 2.5 + (i % 3) * 0.6,
      height: -1.1 + (i % 5) * 0.62,
      speed: 0.07 + (i % 4) * 0.028,
      phase: i * 1.37,
      base: accent ? 0.9 : 0.55,
    };
  });
  scene.add(tagGroup);

  /* --- about ring: curved glass panes orbiting the model --- */
  const ring = new THREE.Group();
  ring.position.y = 0.3;
  scene.add(ring);

  const paneGeo = curvedPlaneGeometry(PANE_RADIUS, PANE_ARC, PANE_H);
  const panes: { mat: THREE.MeshBasicMaterial; mesh: THREE.Mesh; angle: number }[] = [];
  paneSpecs.forEach((spec, i) => {
    const canvas = document.createElement("canvas");
    drawPaneTexture(canvas, spec, i, paneSpecs.length);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(paneGeo, mat);
    mesh.rotation.y = i * PANE_STEP;
    mesh.visible = false;
    ring.add(mesh);
    panes.push({ mat, mesh, angle: i * PANE_STEP });

    /* redraw with the picture once (and if) it loads */
    if (spec.imageUrl) {
      const img = new Image();
      img.onload = () => {
        drawPaneTexture(canvas, spec, i, paneSpecs.length, img);
        tex.needsUpdate = true;
      };
      img.src = spec.imageUrl;
    }
  });
  let ringTarget = 0;

  /* --- scroll state (0 = hero world, 1 = about world) --- */
  let scrollP = 0;
  let smoothScrollP = 0;
  const scrollQuat = new THREE.Quaternion();
  const scrollEuler = new THREE.Euler();

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

    /* hover tilt + crosshair HUD are mouse-only — on touch, a lifted finger
       would leave both frozen at the last contact point */
    if (e.pointerType === "mouse") {
      pointer.x = (px / rect.width) * 2 - 1;
      pointer.y = (py / rect.height) * 2 - 1;

      if (handles.crosshairV) handles.crosshairV.style.transform = `translate3d(${px}px,0,0)`;
      if (handles.crosshairH) handles.crosshairH.style.transform = `translate3d(0,${py}px,0)`;
      if (handles.coordText) {
        handles.coordText.style.transform = `translate3d(${px + 18}px,${py + 14}px,0)`;
        handles.coordText.textContent = `X ${pointer.x.toFixed(2)}  Y ${(-pointer.y).toFixed(2)}`;
      }
      showCrosshair(true);
    }

    if (drag.active) {
      const now = performance.now();
      const dtm = Math.max(8, now - drag.lastT) / 1000;
      /* turntable: drag only spins left / right, never tips */
      const yawD = ((e.clientX - drag.lastX) / rect.width) * DRAG_SENS;

      workEuler.set(0, yawD, 0, "XYZ");
      deltaQuat.setFromEuler(workEuler);
      spinQuat.premultiply(deltaQuat);

      drag.velYaw = THREE.MathUtils.clamp(THREE.MathUtils.lerp(drag.velYaw, yawD / dtm, 0.5), -6, 6);
      drag.velPitch = 0;
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
  /* pan-y: vertical swipes keep scrolling the page on touch screens;
     horizontal drags still rotate the model */
  container.style.touchAction = "pan-y";
  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("pointerdown", onPointerDown);
  container.addEventListener("pointerup", onPointerUp);
  container.addEventListener("pointercancel", onPointerUp);
  container.addEventListener("pointerleave", onPointerLeave);

  function resize() {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    /* phones get a lower pixel-ratio cap — the bg + glass shaders are heavy */
    const dpr = Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 2);
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
    glassUniforms.uRes.value.copy(drawSize);

    const fit = Math.min(1, w / 900);
    /* portrait frustums are narrow: visible width at the model is
       ~5.1 * aspect world units and the GLB is fitted to <= 5.2 wide,
       so cap the scale at 0.88 * aspect to keep it fully on screen */
    monogram.scale.setScalar(Math.min(0.6 + fit * 0.16, 0.88 * camera.aspect));
    /* the pane ring shrinks with the frustum too — the big front pane
       must fit portrait screens */
    ring.scale.setScalar(Math.min(1, 1.02 * camera.aspect));
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

    // hover lean is yaw-only now — the figure never tips forward/back
    const hoverScale = drag.active ? 0 : 1;
    const targetTiltX = 0;
    const targetTiltY = pointer.x * CONFIG.maxTiltRad * hoverScale;
    tilt.vx += ((targetTiltX - tilt.x) * CONFIG.tiltStiffness - tilt.vx * CONFIG.tiltDamping) * dt;
    tilt.vy += ((targetTiltY - tilt.y) * CONFIG.tiltStiffness - tilt.vy * CONFIG.tiltDamping) * dt;
    tilt.x += tilt.vx * dt;
    tilt.y += tilt.vy * dt;

    // released momentum carries the spin (yaw only), decaying like a flywheel
    if (!drag.active) {
      const momentum = Math.abs(drag.velYaw);
      if (momentum > 0.002) {
        workEuler.set(0, drag.velYaw * dt, 0, "XYZ");
        deltaQuat.setFromEuler(workEuler);
        spinQuat.premultiply(deltaQuat);
        drag.velYaw *= Math.exp(-2.1 * dt);
      } else {
        workEuler.set(0, 0.055 * dt * idleFade, 0, "XYZ");
        deltaQuat.setFromEuler(workEuler);
        spinQuat.premultiply(deltaQuat);
      }
    }

    const activity = Math.min(1, (Math.abs(pointer.x) + Math.abs(pointer.y)) * 1.6);
    idleFade += (1 - activity - idleFade) * 0.02;

    workEuler.set(0, tilt.y, 0, "XYZ");
    hoverQuat.setFromEuler(workEuler);
    finalQuat.copy(spinQuat).premultiply(hoverQuat);

    /* scroll adds extra spin — still yaw-only so the figure stays upright */
    smoothScrollP += (scrollP - smoothScrollP) * 0.08;
    scrollEuler.set(0, smoothScrollP * 2.1, 0, "XYZ");
    scrollQuat.setFromEuler(scrollEuler);
    finalQuat.premultiply(scrollQuat);
    monogram.quaternion.copy(finalQuat);

    // shard trails a breath behind — yaw only
    d2.rotation.x = 0;
    d2.rotation.y = THREE.MathUtils.clamp(-(tilt.vy + drag.velYaw * 0.5) * 0.045, -0.09, 0.09);

    monogram.position.y =
      0.12 + Math.sin(t * CONFIG.bobSpeed) * CONFIG.bobAmplitude + smoothScrollP * 0.5;

    /* about ring eases toward the scroll target; panes fade by facing
       angle, gated by how far into the about world we are */
    ring.rotation.y += (ringTarget - ring.rotation.y) * 0.09;
    for (const pane of panes) {
      let ang = (pane.angle + ring.rotation.y) % (Math.PI * 2);
      if (ang > Math.PI) ang -= Math.PI * 2;
      if (ang < -Math.PI) ang += Math.PI * 2;
      const facing = THREE.MathUtils.clamp(1 - (Math.abs(ang) - 0.62) / 0.85, 0, 1);
      pane.mat.opacity = facing * 0.98 * smoothScrollP;
      pane.mesh.visible = pane.mat.opacity > 0.01;
    }

    /* code tags: slow elliptical orbit + bob + flicker, fading on scroll */
    for (const ts of tagStates) {
      const a = ts.angle + t * ts.speed;
      ts.sprite.position.set(
        Math.cos(a) * ts.radius,
        ts.height + Math.sin(t * 0.8 + ts.phase) * 0.14,
        Math.sin(a) * ts.radius * 0.55
      );
      (ts.sprite.material as THREE.SpriteMaterial).opacity =
        ts.base * (0.7 + 0.3 * Math.sin(t * 1.7 + ts.phase)) * (1 - smoothScrollP);
    }

    camera.position.x = baseCameraPos.x + smoothedPointer.x * CONFIG.parallax;
    camera.position.y = baseCameraPos.y - smoothedPointer.y * CONFIG.parallax;
    camera.position.z = baseCameraPos.z + smoothScrollP * 2.4;
    camera.lookAt(lookTarget);

    /* wordmark parallax — the giant type climbs and fades as about arrives */
    textMesh.position.y = 0.05 + smoothScrollP * 1.6;
    textMat.opacity = 1 - smoothScrollP;
    bgUniforms.uWorld.value = smoothScrollP;

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
      /* the wall is real geometry now — render it with the scene camera */
      renderer.render(bgScene, camera);
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

  function setAbout(world: number, progress: number, glowA: string, glowB: string) {
    scrollP = THREE.MathUtils.clamp(world, 0, 1);
    ringTarget = -progress * PANE_STEP;
    bgUniforms.uGlowA.value.set(glowA);
    bgUniforms.uGlowB.value.set(glowB);
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
    customGeos.forEach((g) => g.dispose());
    for (const ts of tagStates) {
      const m = ts.sprite.material as THREE.SpriteMaterial;
      m.map?.dispose();
      m.dispose();
    }
    textGeo.dispose();
    textMat.dispose();
    textTexture.dispose();
    blitGeo.dispose();
    blitMat.dispose();
    dGeo.dispose();
    glassMat.dispose();
    paneGeo.dispose();
    for (const pane of panes) {
      pane.mat.map?.dispose();
      pane.mat.dispose();
    }
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return { dispose, resetOrientation, setRoughness, setNoiseScale, setTint, setAbout };
}
