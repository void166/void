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
};

export type CrystalHeroApi = {
  dispose: () => void;
  resetOrientation: () => void;
};

const CONFIG = {
  cameraFov: 34,
  cameraZ: 7.4,
  ior: 1.55,
  thickness: 3.2,
  roughness: 0.24,
  letterHeight: 3.1,
  letterWidth: 2.35,
  letterBar: 0.78,
  letterDepth: 0.55,
  letterGap: 1.45,
  wallRadius: 12,
  wallHeight: 10,
  maxTiltRad: THREE.MathUtils.degToRad(18),
  slerpSpeed: 0.055,
  idleYawSpeed: 0.045,
  bobAmplitude: 0.14,
  bobSpeed: 0.55,
  breatheAmplitude: 0.01,
  breatheSpeed: 0.7,
  parallax: 0.26,
  wordmarkLines: ["DENTSU DATA", "ARTIST MONGOL"],
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

function buildWallTexture(): HTMLCanvasElement {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#04070a";
  ctx.fillRect(0, 0, size, size);

  const cols = 10;
  const rows = 10;
  const cell = size / cols;
  const rand = mulberry32(42);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x * cell;
      const py = y * cell;
      const glow = rand() > 0.88;
      const shade = 5 + Math.floor(rand() * 9);

      ctx.fillStyle = glow ? "rgba(50,140,220,0.30)" : `rgb(${shade},${shade + 2},${shade + 4})`;
      ctx.fillRect(px + 2, py + 2, cell - 4, cell - 4);

      if (glow) {
        const grad = ctx.createRadialGradient(px + cell / 2, py + cell / 2, 0, px + cell / 2, py + cell / 2, cell * 0.75);
        grad.addColorStop(0, "rgba(80,170,255,0.5)");
        grad.addColorStop(1, "rgba(80,170,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(px - cell, py - cell, cell * 3, cell * 3);
      }

      // fine inner grid
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

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(px, py, cell, cell);

      // faint watermark triangle
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

/** Build a "D" letterform as an extrudable shape: flat left bar, semicircular right bowl, counter hole. */
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
  scene.fog = new THREE.FogExp2(0x02040a, 0.038);

  const camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, 1, 0.1, 100);
  camera.position.set(0, 0, CONFIG.cameraZ);
  const baseCameraPos = camera.position.clone();

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

  // --- curved background wall ---
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
  const wallTexture = new THREE.CanvasTexture(buildWallTexture());
  wallTexture.colorSpace = THREE.SRGBColorSpace;
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(6, 3);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTexture,
    side: THREE.BackSide,
    roughness: 0.85,
    metalness: 0.15,
    emissive: new THREE.Color(0x14335c),
    emissiveMap: wallTexture,
    emissiveIntensity: 0.55,
  });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.z = -2.5;
  scene.add(wall);

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
  wordmark.position.set(0, 0, -3.6);
  scene.add(wordmark);

  // --- glass "DD" monogram ---
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

  const glassMat = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    thickness: 2.0,
    roughness: 0.16,
    ior: CONFIG.ior,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    normalMap: normalTexture,
    normalScale: new THREE.Vector2(0.07, 0.07),
    envMap: envTexture,
    envMapIntensity: 1.7,
    color: new THREE.Color(0xf2f7ff),
    attenuationColor: new THREE.Color(0xa8d4ff),
    attenuationDistance: 4.5,
    specularIntensity: 1,
    iridescence: 0.2,
    iridescenceIOR: 1.3,
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

  const baseQuat = monogram.quaternion.clone();
  const targetQuat = baseQuat.clone();
  const workEuler = new THREE.Euler();
  const mouseQuat = new THREE.Quaternion();

  // --- lighting ---
  const keyLight = new THREE.DirectionalLight(0xe8f0ff, 2.2);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x3f8fe0, 6, 24, 2);
  rimLight.position.set(-4, -1.5, 3);
  scene.add(rimLight);

  const ambient = new THREE.HemisphereLight(0x2c4a72, 0x05070a, 0.65);
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

  // --- pointer state ---
  const pointer = { x: 0, y: 0 };
  const smoothedPointer = { x: 0, y: 0 };

  function onPointerMove(e: PointerEvent) {
    const rect = container.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  }
  function onPointerLeave() {
    pointer.x = 0;
    pointer.y = 0;
  }

  container.addEventListener("pointermove", onPointerMove);
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

    // scale the monogram down a touch on narrow screens
    const fit = Math.min(1, w / 900);
    monogram.scale.setScalar(0.8 + fit * 0.2);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  let rafId = 0;
  const timer = new THREE.Timer();
  let idleYaw = 0;

  function frame() {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();

    smoothedPointer.x += (pointer.x - smoothedPointer.x) * 0.06;
    smoothedPointer.y += (pointer.y - smoothedPointer.y) * 0.06;

    idleYaw += CONFIG.idleYawSpeed * dt;

    workEuler.set(
      -smoothedPointer.y * CONFIG.maxTiltRad,
      smoothedPointer.x * CONFIG.maxTiltRad + Math.sin(idleYaw) * 0.22,
      0,
      "XYZ"
    );
    mouseQuat.setFromEuler(workEuler);
    targetQuat.copy(baseQuat).multiply(mouseQuat);
    monogram.quaternion.slerp(targetQuat, CONFIG.slerpSpeed);

    monogram.position.y = Math.sin(t * CONFIG.bobSpeed) * CONFIG.bobAmplitude;

    camera.position.x = baseCameraPos.x + smoothedPointer.x * CONFIG.parallax;
    camera.position.y = baseCameraPos.y - smoothedPointer.y * CONFIG.parallax;
    camera.lookAt(0, 0, 0);

    wallMat.emissiveIntensity = 0.5 + Math.sin(t * 0.35) * 0.15;
    rimLight.intensity = 5.5 + Math.sin(t * 0.6) * 1.2;
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
  tl.from(rimLight, { intensity: 0, duration: 1.8, ease: "power2.out" }, "<");

  rafId = requestAnimationFrame(frame);

  function resetOrientation() {
    idleYaw = 0;
    pointer.x = 0;
    pointer.y = 0;
    smoothedPointer.x = 0;
    smoothedPointer.y = 0;
  }

  function dispose() {
    cancelAnimationFrame(rafId);
    timer.dispose();
    resizeObserver.disconnect();
    container.removeEventListener("pointermove", onPointerMove);
    container.removeEventListener("pointerleave", onPointerLeave);
    tl.kill();

    composer.dispose();
    dGeo.dispose();
    glassMat.dispose();
    wallGeo.dispose();
    wallMat.dispose();
    wallTexture.dispose();
    wordmark.geometry.dispose();
    wordmarkMat.dispose();
    wordmarkTexture.dispose();
    normalTexture.dispose();
    envTexture.dispose();
    pmrem.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return { dispose, resetOrientation };
}
