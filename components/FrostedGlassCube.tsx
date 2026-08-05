"use client";

import { useEffect, useRef, useState } from "react";
import { buildBackgroundCanvas } from "@/lib/backgroundCanvas";

export const CONFIG = {
  text: "DENTSU DATA ARTIST",
  ghostCopies: 3,
  ghostScale: 0.06,
  ghostOffset: 18,
  ghostOpacity: 0.055,
  cubeSize: 0.62,
  cornerRadius: 0.03,
  ior: 1.48,
  frostBlur: 0.055,
  chromaticAberration: 0.02,
  grainStrength: 0.027,
  rotationSpeed: 0.12,

  // additional tunables, all adjustable from this single object
  focal: 1.9,
  cameraZ: 3.0,
  backgroundPlaneZ: -3.2,
  initialYaw: 0.62,
  initialPitch: 0.46,
  pitchClamp: 1.25,
  dragSensitivity: 0.006,
  inertiaDecay: 0.94,
  idleBobAmplitude: 0.05,
  idleBobSpeed: 0.5,
  frostFrequency: 26.0,
  frostAmplitude: 0.1,
  frostRayBendScale: 0.045,
  marchSteps: 100,
  blurTaps: 16,
  textureMaxSize: 2048,
};

const VERTEX_SHADER_SRC = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

function buildFragmentShader(c: typeof CONFIG) {
  const boxExtent = (c.cubeSize - c.cornerRadius).toFixed(6);
  return `
precision highp float;
varying vec2 vUv;

uniform vec2 uResolution;
uniform float uTime;
uniform mat3 uRot;
uniform mat3 uInvRot;
uniform sampler2D uBackground;

const vec3 CAM_POS = vec3(0.0, 0.0, ${c.cameraZ.toFixed(6)});
const float FOCAL = ${c.focal.toFixed(6)};
const vec3 BOX_EXTENT = vec3(${boxExtent});
const float BOX_RADIUS = ${c.cornerRadius.toFixed(6)};
const float IOR = ${c.ior.toFixed(6)};
const float FROST_FREQ = ${c.frostFrequency.toFixed(6)};
const float FROST_AMP = ${c.frostAmplitude.toFixed(6)};
const float FROST_AMP_RAY = ${(c.frostAmplitude * c.frostRayBendScale).toFixed(6)};
const float BLUR_BASE = 0.010;
const float BLUR_MUL = ${c.frostBlur.toFixed(6)};
const float CA_BASE = 0.004;
const float CA_MUL = ${c.chromaticAberration.toFixed(6)};
const float GRAIN = ${c.grainStrength.toFixed(6)};
const float PLANE_Z = ${c.backgroundPlaneZ.toFixed(6)};
const int MARCH_STEPS = ${c.marchSteps};
const int BLUR_TAPS = ${c.blurTaps};
const float GOLDEN_ANGLE = 2.39996323;

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p3){
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec3 p){
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);
  float nxy0 = mix(nx00, nx10, u.y);
  float nxy1 = mix(nx01, nx11, u.y);
  return mix(nxy0, nxy1, u.z);
}

float sdRoundBox(vec3 p, vec3 b, float r){
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float mapLocal(vec3 p){
  return sdRoundBox(p, BOX_EXTENT, BOX_RADIUS);
}

vec3 calcNormalLocal(vec3 p){
  vec2 e = vec2(0.0006, 0.0);
  return normalize(vec3(
    mapLocal(p + e.xyy) - mapLocal(p - e.xyy),
    mapLocal(p + e.yxy) - mapLocal(p - e.yxy),
    mapLocal(p + e.yyx) - mapLocal(p - e.yyx)
  ));
}

vec3 frostNormalAmp(vec3 n, vec3 p, float amp){
  vec3 j = vec3(
    vnoise(p * FROST_FREQ + vec3(7.13, 0.0, 0.0)),
    vnoise(p * FROST_FREQ + vec3(0.0, 31.7, 0.0)),
    vnoise(p * FROST_FREQ + vec3(0.0, 0.0, 113.3))
  ) - 0.5;
  return normalize(n + j * amp);
}

vec3 frostNormal(vec3 n, vec3 p){
  return frostNormalAmp(n, p, FROST_AMP);
}

vec3 frostNormalRay(vec3 n, vec3 p){
  return frostNormalAmp(n, p, FROST_AMP_RAY);
}

vec2 boxIntersect(vec3 ro, vec3 rd, vec3 b){
  vec3 m = 1.0 / rd;
  vec3 n = m * ro;
  vec3 k = abs(m) * b;
  vec3 t1 = -n - k;
  vec3 t2 = -n + k;
  float tN = max(max(t1.x, t1.y), t1.z);
  float tF = min(min(t2.x, t2.y), t2.z);
  return vec2(tN, tF);
}

vec3 boxExitNormal(vec3 p, vec3 b){
  vec3 d = abs(p) - b;
  if (d.x > d.y && d.x > d.z) return vec3(sign(p.x), 0.0, 0.0);
  if (d.y > d.z) return vec3(0.0, sign(p.y), 0.0);
  return vec3(0.0, 0.0, sign(p.z));
}

vec2 projectToUv(vec3 worldPoint){
  vec3 d = worldPoint - CAM_POS;
  float scale = -FOCAL / d.z;
  vec2 ndc = d.xy * scale;
  float aspect = uResolution.x / uResolution.y;
  ndc.x /= aspect;
  return ndc * 0.5 + 0.5;
}

vec3 blurredSample(vec2 uv, float radius, float seed){
  vec3 sum = vec3(0.0);
  float aspect = uResolution.x / uResolution.y;
  float jitter = hash12(gl_FragCoord.xy + seed) * 6.2831853;
  for (int i = 0; i < BLUR_TAPS; i++){
    float fi = float(i);
    float ang = fi * GOLDEN_ANGLE + jitter;
    float rad = sqrt((fi + 0.5) / float(BLUR_TAPS)) * radius;
    vec2 offset = vec2(cos(ang), sin(ang)) * rad;
    offset.x /= aspect;
    sum += texture2D(uBackground, uv + offset).rgb;
  }
  return sum / float(BLUR_TAPS);
}

void main(){
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = uv;
  p.x *= aspect;

  vec3 rayDirWorld = normalize(vec3(p.x, p.y, -FOCAL));
  vec3 rayOriginWorld = CAM_POS;

  vec3 ro = uInvRot * rayOriginWorld;
  vec3 rd = normalize(uInvRot * rayDirWorld);

  float t = 0.0;
  bool hit = false;
  vec3 pos = ro;
  for (int i = 0; i < MARCH_STEPS; i++){
    pos = ro + rd * t;
    float d = mapLocal(pos);
    if (d < 0.0008) { hit = true; break; }
    t += d;
    if (t > 12.0) break;
  }

  vec3 color;

  if (!hit) {
    vec3 planeHit = rayOriginWorld + rayDirWorld * ((PLANE_Z - rayOriginWorld.z) / rayDirWorld.z);
    vec2 bgUv = projectToUv(planeHit);
    color = texture2D(uBackground, bgUv).rgb;
  } else {
    vec3 nLocal = calcNormalLocal(pos);
    vec3 nLocalFrost = frostNormal(nLocal, pos);
    vec3 nLocalFrostRay = frostNormalRay(nLocal, pos);
    vec3 nWorld = normalize(uRot * nLocalFrost);
    float fresnel = pow(clamp(1.0 - dot(-rayDirWorld, nWorld), 0.0, 1.0), 3.5);

    vec3 rd1 = refract(rd, nLocalFrostRay, 1.0 / IOR);
    if (dot(rd1, rd1) < 0.0001) {
      rd1 = reflect(rd, nLocalFrostRay);
    }
    vec3 ro1 = pos + rd1 * 0.01;

    vec2 tExit = boxIntersect(ro1, rd1, BOX_EXTENT);
    vec3 exitLocal = ro1 + rd1 * max(tExit.y, 0.0);
    vec3 nExitLocal = boxExitNormal(exitLocal, BOX_EXTENT);
    vec3 nExitFrost = frostNormal(nExitLocal, exitLocal);
    vec3 nExitFrostRay = frostNormalRay(nExitLocal, exitLocal);

    vec3 rd2 = refract(rd1, -nExitFrostRay, IOR);
    if (dot(rd2, rd2) < 0.0001) {
      rd2 = reflect(rd1, -nExitFrostRay);
    }

    vec3 exitWorld = uRot * exitLocal;
    vec3 dirWorld = normalize(uRot * rd2);

    float tp = (PLANE_Z - exitWorld.z) / dirWorld.z;
    vec3 planeHit = exitWorld + dirWorld * tp;
    vec2 bgUv = projectToUv(planeHit);

    float blurRadius = BLUR_BASE + BLUR_MUL * fresnel;
    float caAmt = CA_BASE + CA_MUL * fresnel;
    vec2 caDir = normalize(nExitFrost.xy + vec2(0.0001));

    float rC = blurredSample(bgUv + caDir * caAmt, blurRadius, 1.0).r;
    float gC = blurredSample(bgUv, blurRadius, 0.0).g;
    float bC = blurredSample(bgUv - caDir * caAmt, blurRadius, 2.0).b;
    vec3 refracted = vec3(rC, gC, bC);

    vec3 tint = vec3(0.90, 0.93, 0.97);
    refracted *= tint;

    vec3 purple = vec3(0.55, 0.35, 0.85);
    refracted += purple * fresnel * 0.35;

    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
    vec3 reflDir = reflect(rayDirWorld, nWorld);
    float spec = pow(max(dot(reflDir, lightDir), 0.0), 34.0) * 0.55;

    color = refracted + vec3(fresnel * 0.6) + vec3(spec);
  }

  float grain = (hash12(gl_FragCoord.xy + uTime * 60.0) - 0.5) * 2.0 * GRAIN;
  color += grain;

  float vig = smoothstep(1.3, 0.2, length(uv));
  color *= mix(0.6, 1.0, vig);

  gl_FragColor = vec4(color, 1.0);
}
`;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("[FrostedGlassCube] shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("[FrostedGlassCube] program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

function transpose3(m: Float32Array): Float32Array {
  return new Float32Array([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);
}

function rotationMatrix(yaw: number, pitch: number): Float32Array {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  // column-major mat3 = Ry(yaw) * Rx(pitch)
  return new Float32Array([cy, 0, -sy, sy * sp, cp, cy * sp, sy * cp, -sp, cy * cp]);
}

export default function FrostedGlassCube() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl")) as WebGLRenderingContext | null;

    if (!gl) {
      setSupported(false);
      return;
    }

    const program = createProgram(gl, VERTEX_SHADER_SRC, buildFragmentShader(CONFIG));
    if (!program) {
      setSupported(false);
      return;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const aPosition = gl.getAttribLocation(program, "aPosition");

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uRot = gl.getUniformLocation(program, "uRot");
    const uInvRot = gl.getUniformLocation(program, "uInvRot");
    const uBackground = gl.getUniformLocation(program, "uBackground");

    let width = 0;
    let height = 0;

    function uploadBackgroundTexture() {
      if (!gl || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const texW = Math.min(CONFIG.textureMaxSize, Math.round(canvas.width));
      const texH = Math.min(CONFIG.textureMaxSize, Math.round(canvas.height));
      void dpr;
      const bgCanvas = buildBackgroundCanvas(texW, texH, {
        text: CONFIG.text,
        ghostCopies: CONFIG.ghostCopies,
        ghostScale: CONFIG.ghostScale,
        ghostOffset: CONFIG.ghostOffset,
        ghostOpacity: CONFIG.ghostOpacity,
        grainStrength: CONFIG.grainStrength,
      });
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgCanvas);
    }

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (w === width && h === height) return;
      width = w;
      height = h;
      canvas.width = w;
      canvas.height = h;
      gl!.viewport(0, 0, w, h);
      uploadBackgroundTexture();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    let yaw = CONFIG.initialYaw;
    let pitch = CONFIG.initialPitch;
    let velocityYaw = 0;
    let velocityPitch = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let startTime = 0;
    let rafId = 0;

    function clampPitch(v: number) {
      return Math.max(-CONFIG.pitchClamp, Math.min(CONFIG.pitchClamp, v));
    }

    function onPointerDown(e: PointerEvent) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velocityYaw = 0;
      velocityPitch = 0;
      canvas!.setPointerCapture(e.pointerId);
      canvas!.style.cursor = "grabbing";
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const dYaw = dx * CONFIG.dragSensitivity;
      const dPitch = -dy * CONFIG.dragSensitivity;
      yaw += dYaw;
      pitch = clampPitch(pitch + dPitch);
      velocityYaw = dYaw;
      velocityPitch = dPitch;
    }

    function onPointerUp(e: PointerEvent) {
      dragging = false;
      try {
        canvas!.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      canvas!.style.cursor = "grab";
    }

    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    function frame(time: number) {
      if (!gl || !canvas) return;
      if (startTime === 0) startTime = time;
      const elapsed = (time - startTime) / 1000;

      if (!dragging) {
        if (Math.abs(velocityYaw) > 0.00005 || Math.abs(velocityPitch) > 0.00005) {
          yaw += velocityYaw;
          pitch = clampPitch(pitch + velocityPitch);
          velocityYaw *= CONFIG.inertiaDecay;
          velocityPitch *= CONFIG.inertiaDecay;
        } else {
          yaw += CONFIG.rotationSpeed * 0.016;
        }
      }

      const displayPitch = dragging
        ? pitch
        : clampPitch(pitch + Math.sin(elapsed * CONFIG.idleBobSpeed) * CONFIG.idleBobAmplitude);

      const rot = rotationMatrix(yaw, displayPitch);
      const invRot = transpose3(rot);

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uResolution, width, height);
      gl.uniform1f(uTime, elapsed);
      gl.uniformMatrix3fv(uRot, false, rot);
      gl.uniformMatrix3fv(uInvRot, false, invRot);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uBackground, 0);

      gl.viewport(0, 0, width, height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      gl.deleteTexture(texture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      {supported ? (
        <canvas ref={canvasRef} className="block h-full w-full" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-ink text-sm text-mist">
          Your browser doesn&apos;t support WebGL. Please try a different browser to view this visual.
        </div>
      )}
      <div className="eyebrow pointer-events-none absolute bottom-6 left-6 text-white/30">
        Drag to rotate
      </div>
    </div>
  );
}
