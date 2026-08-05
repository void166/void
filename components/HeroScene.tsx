"use client";

import { Component, Suspense, useCallback, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import GlassCube from "./GlassCube";

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[HeroScene] WebGL/Three.js error:", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#060606] text-sm text-mist">
          Your browser doesn&apos;t support WebGL. Please try a different browser to view this visual.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function HeroScene() {
  const [dragging, setDragging] = useState(false);
  const handleDraggingChange = useCallback((next: boolean) => setDragging(next), []);

  return (
    <div className="relative h-full w-full">
      <CanvasErrorBoundary>
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
          camera={{ position: [0, 0, 5.6], fov: 30 }}
          onCreated={({ gl }) => {
            gl.setClearColor("#060606", 1);
          }}
          style={{ cursor: dragging ? "grabbing" : "grab" }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 4, 5]} intensity={1.4} />
          <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#6e97ff" />
          <Suspense fallback={null}>
            <Environment resolution={256}>
              <Lightformer intensity={2.5} color="#ffffff" position={[3, 2, 4]} scale={[3, 3, 1]} form="rect" />
              <Lightformer intensity={1.5} color="#6e97ff" position={[-4, -1, 2]} scale={[3, 2, 1]} form="rect" />
              <Lightformer intensity={1.2} color="#ffffff" position={[0, 4, -3]} scale={[6, 2, 1]} form="rect" />
              <Lightformer intensity={0.8} color="#9db8ff" position={[-2, -3, -2]} scale={[4, 4, 1]} form="ring" />
            </Environment>
            <GlassCube onDraggingChange={handleDraggingChange} />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
      <div className="eyebrow pointer-events-none absolute bottom-6 left-6 text-white/30">
        Drag to rotate
      </div>
    </div>
  );
}
