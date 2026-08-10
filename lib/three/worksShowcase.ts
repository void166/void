import * as THREE from "three";
import type { Work } from "@/lib/data/works";

export type WorksApi = {
  dispose: () => void;
  /** 0..1 across the whole pinned sequence */
  setProgress: (p: number) => void;
  /** 0..1 while the section scrolls into view — LED wall powers up, card emerges */
  setArrival: (a: number) => void;
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
  uniform vec2 uGrid;   /* LED wall pixel pitch (cols, rows) */
  uniform float uArrive; /* 0..1 — the wall powers up as the section arrives */
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
    /* curved stage wall: the panel bows around the viewer, so the sides
       tilt away — the LED grid itself follows the curve */
    vec2 cUv = vUv - 0.5;
    float bow = cUv.x * cUv.x;
    cUv.y *= 1.0 + bow * 0.42;
    cUv.x *= 1.0 - bow * 0.10;
    vec2 wall = cUv + 0.5;

    /* LED wall: all content is sampled at the emitter centers */
    vec2 uv = (floor(wall * uGrid) + 0.5) / uGrid;
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

    /* environment treatment: darker + slightly desaturated */
    col *= 0.6;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(lum), 0.22);

    /* LED emitters: square pixels with dark pitch gaps + faint panel bloom
       — the grid itself follows the curved wall coordinate */
    vec2 f = fract(wall * uGrid) - 0.5;
    float px = max(abs(f.x), abs(f.y));
    float emit = smoothstep(0.5, 0.34, px);
    col = col * (0.12 + 1.15 * emit) + col * 0.08;

    /* power-up: panels wake row by row as the section arrives */
    float wake = smoothstep(wall.y - 0.25, wall.y + 0.05, uArrive * 1.3);
    col *= 0.04 + 0.96 * wake;

    /* the wall angles away toward its curved sides — they catch less
       light and read a shade darker, like a real stage panel */
    col *= 1.0 - bow * 0.4;

    /* vignette + grain */
    float r2 = dot(vUv - 0.5, vUv - 0.5);
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

    /* borderless glass card: rounded corners via rounded-rect SDF,
       crisp ~1px edge instead of a soft feather */
    float aspect = 1.7778;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float rad = 0.07;
    vec2 q = abs(p) - (vec2(aspect, 1.0) * 0.5 - rad);
    float d = length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - rad;
    float alpha = smoothstep(0.0018, -0.0018, d);

    /* thick beveled rim: the video bends inward through the glass edge,
       with a chromatic split — the center stays untouched and crisp */
    float bev = smoothstep(-0.09, 0.0, d);
    float bend = bev * bev * 0.045;
    vec2 dirOut = normalize(p + vec2(1e-5));
    vec2 dirUv = dirOut * vec2(1.0 / aspect, 1.0);

    float r = uBlur * 0.012;
    vec3 col;
    col.r = texture2D(uTex, uv - dirUv * bend * 1.25).r * 0.5
          + texture2D(uTex, uv - dirUv * bend * 1.25 + vec2(r, 0.0)).r * 0.25
          + texture2D(uTex, uv - dirUv * bend * 1.25 - vec2(r, 0.0)).r * 0.25;
    col.g = texture2D(uTex, uv - dirUv * bend).g * 0.5
          + texture2D(uTex, uv - dirUv * bend + vec2(r, 0.0)).g * 0.25
          + texture2D(uTex, uv - dirUv * bend - vec2(r, 0.0)).g * 0.25;
    col.b = texture2D(uTex, uv - dirUv * bend * 0.75).b * 0.5
          + texture2D(uTex, uv - dirUv * bend * 0.75 + vec2(r, 0.0)).b * 0.25
          + texture2D(uTex, uv - dirUv * bend * 0.75 - vec2(r, 0.0)).b * 0.25;

    /* glass body: soft top-left gloss + glow hugging the inside edge */
    float gloss = smoothstep(0.2, 1.0, uv.y * 0.75 + (1.0 - uv.x) * 0.25);
    col += vec3(gloss) * 0.05;
    col += vec3(1.0) * smoothstep(-0.045, 0.0, d) * 0.07;

    /* slow diagonal sheen drifting across the card */
    float band = uv.x * 0.85 + uv.y * 0.35;
    float sPos = fract(uTime * 0.05) * 2.4 - 0.7;
    float sheen = exp(-pow((band - sPos) * 8.0, 2.0));
    col += vec3(sheen) * 0.10;

    /* iridescent hairline: a thin rim whose hue drifts around the card */
    float hair = smoothstep(0.005, 0.0005, abs(d));
    float ang = atan(p.y, p.x);
    vec3 iri = 0.5 + 0.5 * cos(6.2831 * (ang / 6.2831 + uTime * 0.05 + vec3(0.0, 0.33, 0.67)));
    col += (vec3(0.10) + iri * 0.14) * hair * (1.0 + 0.9 * smoothstep(0.0, 0.45, p.y));

    gl_FragColor = vec4(col, uOpacity * alpha);
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

    /* refraction strength follows the surface tilt — the bulge's flat
       center leaves the media crisp, the curved rim bends and shines */
    /* optically clean face: the media reads crisp through the glass;
       refraction, dispersion and shine all live on the curved rim only */
    float rim = pow(1.0 - ndv, 2.2);

    vec2 off = n.xy * (0.012 + rim * 0.06);
    off += (noise(vWorld.xy * 5.0 + vWorld.z * 2.0) - 0.5) * 0.012 * rim;

    float disp = 0.004 + rim * 0.03;
    vec3 col;
    col.r = texture2D(uBg, clamp(suv + off * (1.0 + disp), 0.001, 0.999)).r;
    col.g = texture2D(uBg, clamp(suv + off, 0.001, 0.999)).g;
    col.b = texture2D(uBg, clamp(suv + off * (1.0 - disp), 0.001, 0.999)).b;

    col = col * (1.0 + rim * 0.55) + vec3(1.0) * rim * 0.4;

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
  const VIS_W = 1920;
  const VIS_H = 1080;
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

  /* --- real project media (video / animated image) --- */
  type MediaEntry = {
    texture: THREE.Texture | null;
    ready: boolean;
    video?: HTMLVideoElement;
    img?: HTMLImageElement;
    canvas?: HTMLCanvasElement;
    ctx?: CanvasRenderingContext2D;
  };

  /** Cover-fit a texture into the 16:9 render target via repeat/offset. */
  function coverFit(tex: THREE.Texture, mediaW: number, mediaH: number) {
    const rtAspect = VIS_W / VIS_H;
    const mAspect = mediaW / Math.max(1, mediaH);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    if (mAspect > rtAspect) {
      tex.repeat.set(rtAspect / mAspect, 1);
      tex.offset.set((1 - tex.repeat.x) / 2, 0);
    } else {
      tex.repeat.set(1, mAspect / rtAspect);
      tex.offset.set(0, (1 - tex.repeat.y) / 2);
    }
  }

  const media: (MediaEntry | null)[] = works.map((w) => (w.media ? { texture: null, ready: false } : null));

  works.forEach((w, idx) => {
    const entry = media[idx];
    if (!w.media || !entry) return;

    if (w.media.type === "video") {
      const video = document.createElement("video");
      video.src = w.media.src;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.preload = "auto";
      video.addEventListener(
        "canplay",
        () => {
          const tex = new THREE.VideoTexture(video);
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          coverFit(tex, video.videoWidth || 16, video.videoHeight || 9);
          entry.texture = tex;
          entry.ready = true;
        },
        { once: true }
      );
      video.addEventListener("error", () => {
        console.error(`[WorksShowcase] video failed to load: ${w.media?.src}`);
      });
      video.play().catch(() => {
        /* muted autoplay should succeed; procedural art covers if not */
      });
      entry.video = video;
    } else {
      /* animated webp: an <img> keeps animating — drawImage samples the live frame */
      const img = document.createElement("img");
      img.decoding = "async";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const w0 = img.naturalWidth || 1024;
        const h0 = img.naturalHeight || 576;
        canvas.width = 1920;
        canvas.height = Math.max(2, Math.round((1920 * h0) / w0));
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        coverFit(tex, canvas.width, canvas.height);
        entry.canvas = canvas;
        entry.ctx = ctx;
        entry.texture = tex;
        entry.ready = true;
      };
      img.onerror = () => {
        console.error(`[WorksShowcase] image failed to load (v2): ${w.media?.src} currentSrc=${img.currentSrc}`);
      };
      img.src = w.media.src;
      entry.img = img;
    }
  });

  const mediaBlitMat = new THREE.MeshBasicMaterial({ depthTest: false, depthWrite: false });
  const mediaBlitScene = new THREE.Scene();
  mediaBlitScene.add(new THREE.Mesh(quadGeo, mediaBlitMat));

  function renderVisual(index: number, target: THREE.WebGLRenderTarget, time: number) {
    const m = media[index];
    if (m?.ready && m.texture) {
      /* live-copy the animated image's current frame */
      if (m.ctx && m.img && m.canvas) {
        m.ctx.drawImage(m.img, 0, 0, m.canvas.width, m.canvas.height);
        m.texture.needsUpdate = true;
      }
      if (mediaBlitMat.map !== m.texture) {
        mediaBlitMat.map = m.texture;
        mediaBlitMat.needsUpdate = true;
      }
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(mediaBlitScene, quadCam);
      return;
    }

    /* procedural art doubles as the loading state */
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
    uGrid: { value: new THREE.Vector2(160, 90) },
    uArrive: { value: 0 },
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
  let arrival = 0;
  let smoothArrival = 0;
  const pointer = { x: 0, y: 0 };
  const smoothPointer = { x: 0, y: 0 };
  let rtAIndex = -1;
  let rtBIndex = -1;

  function resize() {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    /* phones get a lower pixel-ratio cap — refraction + render targets are heavy */
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 1.75));
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
    /* LED wall pitch: fixed row count, square-ish emitters */
    const rows = 150;
    transUniforms.uGrid.value.set(Math.max(16, Math.round(rows * (w / h))), rows);
    /* fit: keep the card comfortably inside narrow viewports */
    const fit = Math.min(1, (w / h) / 1.55);
    scene.scale.setScalar(0.82 + fit * 0.18);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  let rafId = 0;
  let running = true;
  const timer = new THREE.Timer();

  function frameLoop() {
    if (!running) return;
    timer.update();
    const t = timer.getElapsed();

    smoothProgress += (progress - smoothProgress) * 0.16;
    smoothArrival += (arrival - smoothArrival) * 0.14;
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

    /* arrival: the card rises out of depth while the wall powers up */
    const arIn = 1 - smoothArrival;

    /* outgoing plane: pushes past the camera, exits decisively */
    planeCur.position.z = tt * 3.2 - arIn * 2.6;
    planeCur.position.x = -tt * 2.3;
    planeCur.position.y = tt * 0.4 - arIn * 0.9 + Math.sin(t * 0.5) * 0.03;
    planeCur.rotation.y = -tt * 0.5 + smoothPointer.x * 0.03;
    planeCur.rotation.x = tt * 0.1 + arIn * 0.3 - smoothPointer.y * 0.02;
    curUniforms.uOpacity.value =
      (1 - THREE.MathUtils.smoothstep(tt, 0.35, 0.8)) *
      THREE.MathUtils.smoothstep(smoothArrival, 0.1, 0.85);
    curUniforms.uBlur.value = tt * 1.6 + arIn * 1.2;
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
    transUniforms.uArrive.value = smoothArrival;
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

  /* render + decode only while the section is on screen — offscreen it costs nothing */
  const visibility = new IntersectionObserver(
    ([entry]) => {
      const onScreen = entry.isIntersecting;
      if (onScreen && !running) {
        running = true;
        timer.update(); // swallow the paused gap so smoothing doesn't jump
        rafId = requestAnimationFrame(frameLoop);
      } else if (!onScreen && running) {
        running = false;
        cancelAnimationFrame(rafId);
      }
      media.forEach((m) => {
        if (!m?.video || !m.ready) return;
        if (onScreen) m.video.play().catch(() => {});
        else m.video.pause();
      });
    },
    { rootMargin: "200px 0px" }
  );
  visibility.observe(container);

  function setProgress(p: number) {
    progress = THREE.MathUtils.clamp(p, 0, 1);
  }
  function setArrival(a: number) {
    arrival = THREE.MathUtils.clamp(a, 0, 1);
  }
  function setPointer(x: number, y: number) {
    pointer.x = THREE.MathUtils.clamp(x, -1, 1);
    pointer.y = THREE.MathUtils.clamp(y, -1, 1);
  }

  function dispose() {
    running = false;
    cancelAnimationFrame(rafId);
    visibility.disconnect();
    timer.dispose();
    resizeObserver.disconnect();
    media.forEach((m) => {
      if (!m) return;
      m.texture?.dispose();
      if (m.video) {
        m.video.pause();
        m.video.removeAttribute("src");
        m.video.load();
      }
      if (m.img) {
        /* detach handlers first — clearing src fires a spurious error event */
        m.img.onload = null;
        m.img.onerror = null;
        m.img.removeAttribute("src");
      }
    });
    mediaBlitMat.dispose();
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
    shardGeo.dispose();
    glassMat.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return { dispose, setProgress, setArrival, setPointer };
}
