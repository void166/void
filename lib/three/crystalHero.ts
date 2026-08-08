import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  VignetteEffect,
  ChromaticAberrationEffect,
  NoiseEffect,
  BlendFunction,
} from "postprocessing";
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
};

const CONFIG = {
  cameraFov: 34,
  cameraZ: 7.4,
  ior: 1.55,
  letterHeight: 3.1,
  letterWidth: 2.35,
  letterBar: 0.78,
  letterDepth: 0.55,
  letterGap: 1.45,
  wallRadius: 12,
  wallHeight: 10,
  floorY: -2.5,
  maxTiltRad: THREE.MathUtils.degToRad(12),
  // damped spring for mouse tilt — heavy, physical, settles without wobble
  tiltStiffness: 60,
  tiltDamping: 12,
  bobAmplitude: 0.1,
  bobSpeed: 0.5,
  parallax: 0.15,
  wordmarkLines: ["DENTSU DATA", "ARTIST MONGOL"],
  // LED show — hues cycled by the wall, lights, and glass tint
  ledPalette: [
    { h: 212, s: 0.95, l: 0.5 }, // blue
    { h: 186, s: 0.95, l: 0.45 }, // cyan
    { h: 264, s: 0.9, l: 0.55 }, // violet
    { h: 316, s: 0.9, l: 0.5 }, // magenta
    { h: 162, s: 0.9, l: 0.45 }, // teal
  ],
  ledSwitchInterval: 3.4,
  ledLerpSpeed: 0.025,
};

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Static base structure of the LED wall: dark tiles + fine grid. */
function buildWallBaseTexture(): HTMLCanvasElement {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#04060a";
  ctx.fillRect(0, 0, size, size);

  const cols = 10;
  const rows = 10;
  const cell = size / cols;
  const rand = mulberry32(7);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x * cell;
      const py = y * cell;
      const shade = 5 + Math.floor(rand() * 8);
      ctx.fillStyle = `rgb(${shade},${shade + 1},${shade + 3})`;
      ctx.fillRect(px + 2, py + 2, cell - 4, cell - 4);

      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 0.5;
      const sub = cell / 5;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(px + i * sub, py);
        ctx.lineTo(px + i * sub, py + cell);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px, py + i * sub);
        ctx.lineTo(px + cell, py + i * sub);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(px, py, cell, cell);

      if (rand() > 0.62) {
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        const cx = px + cell / 2;
        const cy = py + cell / 2;
        const r = cell * 0.18;
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy + r);
        ctx.lineTo(cx - r, cy + r);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  return canvas;
}

/**
 * Glow pattern for the LED wall, drawn in WHITE on black.
 * Hue comes from wallMat.emissive (lerped each frame), so color
 * transitions stay perfectly smooth while the lit-tile pattern jumps
 * like a real LED show.
 */
function paintGlowPattern(ctx: CanvasRenderingContext2D, size: number, seed: number) {
  const cols = 10;
  const rows = 10;
  const cell = size / cols;
  const rand = mulberry32(seed);

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (rand() <= 0.86) continue;
      const px = x * cell;
      const py = y * cell;

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(px + 2, py + 2, cell - 4, cell - 4);

      const grad = ctx.createRadialGradient(
        px + cell / 2,
        py + cell / 2,
        0,
        px + cell / 2,
        py + cell / 2,
        cell * 0.9
      );
      grad.addColorStop(0, "rgba(255,255,255,0.6)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(px - cell, py - cell, cell * 3, cell * 3);
    }
  }
}

function buildNoiseNormalMap(): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = 128 + (Math.random() * 2 - 1) * 16;
    imageData.data[i + 1] = 128 + (Math.random() * 2 - 1) * 16;
    imageData.data[i + 2] = 255;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/** Blotchy roughness map — smudged frost patches over clearer glass, like hand-finished crystal. */
function buildFrostRoughnessMap(): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // base: already hazy — this glass is never clear
  ctx.fillStyle = "rgb(92,92,92)";
  ctx.fillRect(0, 0, size, size);

  const rand = mulberry32(99);
  ctx.filter = "blur(26px)";
  for (let i = 0; i < 34; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const rx = 30 + rand() * 120;
    const ry = 20 + rand() * 90;
    const v = 145 + Math.floor(rand() * 75);
    ctx.fillStyle = `rgba(${v},${v},${v},0.6)`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = "none";

  return canvas;
}

function buildWordmarkTexture(lines: string[]): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lineHeight = h / (lines.length + 0.4);
  lines.forEach((line, i) => {
    let fontSize = lineHeight * 0.82;
    const font = (s: number) => `900 ${s}px "Helvetica Neue", Arial, system-ui, sans-serif`;
    ctx.font = font(fontSize);
    const measured = ctx.measureText(line).width;
    if (measured > w * 0.94) fontSize *= (w * 0.94) / measured;
    ctx.font = font(fontSize);

    const y = (i + 0.75) * lineHeight;
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 42;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, w / 2, y);
    ctx.shadowBlur = 0;
    ctx.fillText(line, w / 2, y);
  });

  return canvas;
}

/** Soft elliptical contact shadow under the monogram. */
function buildContactShadowTexture(): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(0,0,0,0.85)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.4)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
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
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02040a, 0.034);

  const camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, 1, 0.1, 100);
  camera.position.set(0, 0.65, CONFIG.cameraZ);
  const baseCameraPos = camera.position.clone();
  const lookTarget = new THREE.Vector3(0, -0.1, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x050505, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;";

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;

  // --- curved LED wall (theater screen wrapping the stage) ---
  const wallGeo = new THREE.CylinderGeometry(
    CONFIG.wallRadius,
    CONFIG.wallRadius,
    CONFIG.wallHeight,
    28,
    16,
    true,
    Math.PI * 0.65,
    Math.PI * 1.7
  );
  const wallBaseTexture = new THREE.CanvasTexture(buildWallBaseTexture());
  wallBaseTexture.colorSpace = THREE.SRGBColorSpace;
  wallBaseTexture.wrapS = THREE.RepeatWrapping;
  wallBaseTexture.wrapT = THREE.RepeatWrapping;
  wallBaseTexture.repeat.set(6, 3);

  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = 1024;
  glowCanvas.height = 1024;
  const glowCtx = glowCanvas.getContext("2d")!;
  let glowSeed = 1;
  paintGlowPattern(glowCtx, 1024, glowSeed);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  glowTexture.wrapS = THREE.RepeatWrapping;
  glowTexture.wrapT = THREE.RepeatWrapping;
  glowTexture.repeat.set(6, 3);

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallBaseTexture,
    side: THREE.BackSide,
    roughness: 0.85,
    metalness: 0.15,
    emissive: new THREE.Color().setHSL(212 / 360, 0.9, 0.6),
    emissiveMap: glowTexture,
    emissiveIntensity: 0.6,
  });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.z = -2.5;
  wall.position.y = 0.8;
  scene.add(wall);

  // --- stage floor: glossy dark deck that catches LED + spotlight ---
  const floorGeo = new THREE.CircleGeometry(15, 48);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x07090d,
    metalness: 0.75,
    roughness: 0.28,
    envMap: envTexture,
    envMapIntensity: 0.7,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = CONFIG.floorY;
  scene.add(floor);

  const shadowTexture = new THREE.CanvasTexture(buildContactShadowTexture());
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.75,
  });
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.6), shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = CONFIG.floorY + 0.01;
  contactShadow.position.x = 0.1;
  scene.add(contactShadow);

  // --- giant glowing wordmark behind the monogram ---
  const wordmarkTexture = new THREE.CanvasTexture(buildWordmarkTexture(CONFIG.wordmarkLines));
  wordmarkTexture.colorSpace = THREE.SRGBColorSpace;
  const wordmarkMat = new THREE.MeshBasicMaterial({
    map: wordmarkTexture,
    transparent: true,
    toneMapped: false,
    depthWrite: false,
    fog: false,
  });
  const wordmark = new THREE.Mesh(new THREE.PlaneGeometry(15, 7.5), wordmarkMat);
  wordmark.position.set(0, 0.2, -3.6);
  scene.add(wordmark);

  // --- glass "DD" monogram: the main character on stage ---
  const dShape = buildDShape(CONFIG.letterWidth, CONFIG.letterHeight, CONFIG.letterBar);
  const dGeo = new THREE.ExtrudeGeometry(dShape, {
    depth: CONFIG.letterDepth,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.06,
    bevelSegments: 5,
    curveSegments: 40,
  });
  dGeo.center();

  const normalTexture = new THREE.CanvasTexture(buildNoiseNormalMap());
  normalTexture.wrapS = THREE.RepeatWrapping;
  normalTexture.wrapT = THREE.RepeatWrapping;
  normalTexture.repeat.set(2, 2);

  const frostTexture = new THREE.CanvasTexture(buildFrostRoughnessMap());
  frostTexture.wrapS = THREE.RepeatWrapping;
  frostTexture.wrapT = THREE.RepeatWrapping;

  const glassMat = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    thickness: 2.8,
    roughness: 1, // driven by the frost roughness map
    roughnessMap: frostTexture,
    ior: CONFIG.ior,
    metalness: 0,
    clearcoat: 0.7,
    clearcoatRoughness: 0.18,
    normalMap: normalTexture,
    normalScale: new THREE.Vector2(0.09, 0.09),
    envMap: envTexture,
    envMapIntensity: 1.7,
    color: new THREE.Color(0xf2f7ff),
    attenuationColor: new THREE.Color(0xa8d4ff),
    attenuationDistance: 2.6,
    specularIntensity: 1,
    iridescence: 0.22,
    iridescenceIOR: 1.3,
    dispersion: 4,
  });

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

  // --- stage lighting ---
  const keyLight = new THREE.DirectionalLight(0xe8f0ff, 1.9);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  // overhead spotlight — theatrical key on the main character
  const spot = new THREE.SpotLight(0xffffff, 55, 30, 0.45, 0.9, 1.6);
  spot.position.set(0, 7.5, 3.5);
  spot.target = monogram;
  scene.add(spot);

  // LED wash lights — tinted by the current LED color each frame
  const ledWash = new THREE.PointLight(0x3f8fe0, 6, 26, 2);
  ledWash.position.set(-4, -1, 3);
  scene.add(ledWash);

  const ledWash2 = new THREE.PointLight(0x3f8fe0, 4, 26, 2);
  ledWash2.position.set(4.5, 1.5, 1.5);
  scene.add(ledWash2);

  const ambient = new THREE.HemisphereLight(0x2c4a72, 0x05070a, 0.55);
  scene.add(ambient);

  // --- postprocessing ---
  const composer = new EffectComposer(renderer, { multisampling: 4 });
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new BloomEffect({ intensity: 1.0, luminanceThreshold: 0.3, luminanceSmoothing: 0.25, mipmapBlur: true });
  const chroma = new ChromaticAberrationEffect({
    offset: new THREE.Vector2(0.0006, 0.0006),
    radialModulation: false,
    modulationOffset: 0,
  });
  const vignette = new VignetteEffect({ darkness: 0.68, offset: 0.32 });
  const grain = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: true });
  grain.blendMode.opacity.value = 0.06;
  composer.addPass(new EffectPass(camera, bloom, chroma, vignette, grain));

  // --- LED show state ---
  const currentLed = new THREE.Color().setHSL(
    CONFIG.ledPalette[0].h / 360,
    CONFIG.ledPalette[0].s,
    CONFIG.ledPalette[0].l
  );
  const targetLed = currentLed.clone();
  const glassTintBase = new THREE.Color(0xdceafd);
  const workColor = new THREE.Color();
  let paletteIndex = 0;
  let ledTimer = 0;

  // --- pointer state ---
  const pointer = { x: 0, y: 0 };
  const smoothedPointer = { x: 0, y: 0 };
  // damped-spring tilt state (angle + angular velocity per axis)
  const tilt = { x: 0, y: 0, vx: 0, vy: 0 };
  let idleFade = 1;
  // drag-to-spin state — direct manipulation with momentum, alche-style
  const DRAG_SENS = 4.6; // radians across a full-viewport sweep
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

    // cursor-tracking HUD: the user always sees where the mouse is
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

      // rotate around world axes — the letters follow the hand directly
      workEuler.set(pitchD, yawD, 0, "XYZ");
      deltaQuat.setFromEuler(workEuler);
      spinQuat.premultiply(deltaQuat);

      drag.velYaw = THREE.MathUtils.clamp(
        THREE.MathUtils.lerp(drag.velYaw, yawD / dtm, 0.5),
        -6,
        6
      );
      drag.velPitch = THREE.MathUtils.clamp(
        THREE.MathUtils.lerp(drag.velPitch, pitchD / dtm, 0.5),
        -6,
        6
      );
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
    composer.setSize(w, h);

    const fit = Math.min(1, w / 900);
    monogram.scale.setScalar(0.64 + fit * 0.16);
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
        // untouched, the sculpture keeps a slow museum turn
        workEuler.set(0, 0.055 * dt * idleFade, 0, "XYZ");
        deltaQuat.setFromEuler(workEuler);
        spinQuat.premultiply(deltaQuat);
      }
    }

    // idle breathing fades while the pointer is in command
    const activity = Math.min(1, (Math.abs(pointer.x) + Math.abs(pointer.y)) * 1.6);
    idleFade += (1 - activity - idleFade) * 0.02;
    const idlePitch = Math.sin(t * 0.21) * 0.03 * idleFade;

    // banking roll from total angular velocity — the mass is felt
    const roll = THREE.MathUtils.clamp(-(tilt.vy + drag.velYaw * 0.4) * 0.04, -0.06, 0.06);

    workEuler.set(tilt.x + idlePitch, tilt.y, roll, "XYZ");
    hoverQuat.setFromEuler(workEuler);
    finalQuat.copy(spinQuat).premultiply(hoverQuat);
    monogram.quaternion.copy(finalQuat);

    // back letter trails a breath behind the front — layered inertia
    d2.rotation.x = THREE.MathUtils.clamp(-(tilt.vx + drag.velPitch * 0.5) * 0.045, -0.09, 0.09);
    d2.rotation.y = THREE.MathUtils.clamp(-(tilt.vy + drag.velYaw * 0.5) * 0.045, -0.09, 0.09);

    monogram.position.y = 0.12 + Math.sin(t * CONFIG.bobSpeed) * CONFIG.bobAmplitude;
    contactShadow.material.opacity = 0.75 - Math.sin(t * CONFIG.bobSpeed) * 0.12;

    camera.position.x = baseCameraPos.x + smoothedPointer.x * CONFIG.parallax;
    camera.position.y = baseCameraPos.y - smoothedPointer.y * CONFIG.parallax;
    camera.lookAt(lookTarget);

    // --- LED show ---
    ledTimer += dt;
    if (ledTimer >= CONFIG.ledSwitchInterval) {
      ledTimer = 0;
      paletteIndex = (paletteIndex + 1) % CONFIG.ledPalette.length;
      const next = CONFIG.ledPalette[paletteIndex];
      targetLed.setHSL(next.h / 360, next.s, next.l);
      glowSeed += 13;
      paintGlowPattern(glowCtx, 1024, glowSeed);
      glowTexture.needsUpdate = true;
    }
    currentLed.lerp(targetLed, CONFIG.ledLerpSpeed);

    wallMat.emissive.copy(currentLed);
    wallMat.emissiveIntensity = 0.95 + Math.sin(t * 1.7) * 0.18;
    ledWash.color.copy(currentLed);
    ledWash.intensity = 7 + Math.sin(t * 0.9) * 1.8;
    ledWash2.color.copy(currentLed);
    ledWash2.intensity = 5 + Math.sin(t * 1.2 + 1.5) * 1.4;
    // the DD breathes with the LED color: glass tint follows the wash
    glassMat.attenuationColor.copy(workColor.copy(currentLed).lerp(glassTintBase, 0.3));
    wordmarkMat.opacity = 0.92 + Math.sin(t * 0.8) * 0.08;

    if (handles.quatText) {
      const q = monogram.quaternion;
      handles.quatText.textContent = `${q.x.toFixed(2)} ${q.y.toFixed(2)} ${q.z.toFixed(2)} ${q.w.toFixed(2)}`;
    }
    if (handles.gizmoGroup) {
      handles.gizmoGroup.style.transform = `rotateX(${smoothedPointer.y * 12}deg) rotateY(${smoothedPointer.x * 12}deg)`;
    }

    composer.render();
    rafId = requestAnimationFrame(frame);
  }

  const tl = gsap.timeline();
  tl.to(renderer.domElement, { opacity: 1, duration: 1.6, ease: "power2.out" });
  tl.from(monogram.position, { z: -1.6, duration: 1.9, ease: "expo.out" }, "<");
  tl.from(spot, { intensity: 0, duration: 2.2, ease: "power2.out" }, "<0.3");
  tl.from(ledWash, { intensity: 0, duration: 1.8, ease: "power2.out" }, "<");

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

    composer.dispose();
    dGeo.dispose();
    glassMat.dispose();
    wallGeo.dispose();
    wallMat.dispose();
    wallBaseTexture.dispose();
    glowTexture.dispose();
    floorGeo.dispose();
    floorMat.dispose();
    contactShadow.geometry.dispose();
    shadowMat.dispose();
    shadowTexture.dispose();
    wordmark.geometry.dispose();
    wordmarkMat.dispose();
    wordmarkTexture.dispose();
    normalTexture.dispose();
    frostTexture.dispose();
    envTexture.dispose();
    pmrem.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return { dispose, resetOrientation };
}
