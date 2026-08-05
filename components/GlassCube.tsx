"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { buildBackgroundCanvas } from "@/lib/backgroundCanvas";

export const CUBE_CONFIG = {
  text: "DENTSU DATA ARTIST",
  ghostCopies: 3,
  ghostScale: 0.06,
  ghostOffset: 18,
  ghostOpacity: 0.055,
  grainStrength: 0.027,

  cubeSize: 1.15,
  cornerRadius: 0.08,
  ior: 1.48,
  thickness: 1.6,
  roughness: 0.12,
  chromaticAberration: 0.045,
  anisotropicBlur: 0.15,

  initialYaw: 0.5,
  initialPitch: 0.24,
  pitchClamp: 1.25,
  dragSensitivity: 0.008,
  inertiaDecay: 0.94,
  idleRotationSpeed: 0.12,
  idleBobAmplitude: 0.06,
  idleBobSpeed: 0.5,

  backgroundDistance: 6,
};

function BackgroundPlane() {
  const { viewport } = useThree();
  const texture = useMemo(() => {
    const canvas = buildBackgroundCanvas(1600, 1200, CUBE_CONFIG);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, []);

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  const width = viewport.width * 1.4;
  const height = width * (1200 / 1600);

  return (
    <mesh position={[0, 0, -CUBE_CONFIG.backgroundDistance]}>
      <planeGeometry args={[width, Math.max(height, viewport.height * 1.4)]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

export default function GlassCube({ onDraggingChange }: { onDraggingChange?: (dragging: boolean) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const yaw = useRef(CUBE_CONFIG.initialYaw);
  const pitch = useRef(CUBE_CONFIG.initialPitch);
  const velocity = useRef({ yaw: 0, pitch: 0 });
  const { gl } = useThree();
  const canvasEl = gl.domElement;

  useEffect(() => {
    function clampPitch(v: number) {
      return Math.max(-CUBE_CONFIG.pitchClamp, Math.min(CUBE_CONFIG.pitchClamp, v));
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      const dYaw = dx * CUBE_CONFIG.dragSensitivity;
      const dPitch = -dy * CUBE_CONFIG.dragSensitivity;
      yaw.current += dYaw;
      pitch.current = clampPitch(pitch.current + dPitch);
      velocity.current = { yaw: dYaw, pitch: dPitch };
    }

    function onPointerUp(e: PointerEvent) {
      dragging.current = false;
      onDraggingChange?.(false);
      try {
        canvasEl.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    canvasEl.addEventListener("pointermove", onPointerMove);
    canvasEl.addEventListener("pointerup", onPointerUp);
    canvasEl.addEventListener("pointercancel", onPointerUp);

    return () => {
      canvasEl.removeEventListener("pointermove", onPointerMove);
      canvasEl.removeEventListener("pointerup", onPointerUp);
      canvasEl.removeEventListener("pointercancel", onPointerUp);
    };
  }, [canvasEl, onDraggingChange]);

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    velocity.current = { yaw: 0, pitch: 0 };
    onDraggingChange?.(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (!dragging.current) {
      if (Math.abs(velocity.current.yaw) > 0.00005 || Math.abs(velocity.current.pitch) > 0.00005) {
        yaw.current += velocity.current.yaw;
        pitch.current = Math.max(
          -CUBE_CONFIG.pitchClamp,
          Math.min(CUBE_CONFIG.pitchClamp, pitch.current + velocity.current.pitch)
        );
        velocity.current.yaw *= CUBE_CONFIG.inertiaDecay;
        velocity.current.pitch *= CUBE_CONFIG.inertiaDecay;
      } else {
        yaw.current += CUBE_CONFIG.idleRotationSpeed * delta;
      }
    }

    const displayPitch = dragging.current
      ? pitch.current
      : Math.max(
          -CUBE_CONFIG.pitchClamp,
          Math.min(
            CUBE_CONFIG.pitchClamp,
            pitch.current + Math.sin(state.clock.elapsedTime * CUBE_CONFIG.idleBobSpeed) * CUBE_CONFIG.idleBobAmplitude
          )
        );

    groupRef.current.rotation.set(displayPitch, yaw.current, 0);
  });

  const transmissionProps = useMemo(
    () => ({
      thickness: CUBE_CONFIG.thickness,
      roughness: CUBE_CONFIG.roughness,
      transmission: 1,
      ior: CUBE_CONFIG.ior,
      chromaticAberration: CUBE_CONFIG.chromaticAberration,
      anisotropicBlur: CUBE_CONFIG.anisotropicBlur,
      distortion: 0.02,
      distortionScale: 0.1,
      temporalDistortion: 0,
      samples: 8,
      resolution: 1024,
      backside: true,
      color: "#e8ecf5",
    }),
    []
  );

  return (
    <>
      <BackgroundPlane />
      <group ref={groupRef}>
        <RoundedBox
          args={[CUBE_CONFIG.cubeSize * 2, CUBE_CONFIG.cubeSize * 2, CUBE_CONFIG.cubeSize * 2]}
          radius={CUBE_CONFIG.cornerRadius}
          smoothness={6}
          onPointerDown={onPointerDown}
        >
          <MeshTransmissionMaterial {...transmissionProps} />
        </RoundedBox>
      </group>
    </>
  );
}
