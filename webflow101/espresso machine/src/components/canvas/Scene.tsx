"use client";

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { ReactNode, Suspense } from "react";
import EspressoMachine from "./EspressoMachine";

export default function Scene() {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-[-10] bg-[#0a0a0a] overflow-hidden pointer-events-none">
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 45 }}>
        {/* Soft studio lighting to catch exact chrome edges */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={2} 
          castShadow 
        />
        <directionalLight 
          position={[-10, 5, -5]} 
          intensity={1} 
          color="#1b1b1b" 
        />
        
        <Suspense fallback={null}>
          <EspressoMachine />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}
