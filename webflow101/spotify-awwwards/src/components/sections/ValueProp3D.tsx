"use client";

import { useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Environment } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

function FloatingSphere({ position, color, speed = 1, distort = 0.4 }: {
  position: [number, number, number];
  color: string;
  speed?: number;
  distort?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.3) * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.15;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1.5}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function WobblyTorus({ position, color }: {
  position: [number, number, number];
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1}>
      <mesh ref={meshRef} position={position}>
        <torusGeometry args={[0.8, 0.35, 32, 64]} />
        <MeshWobbleMaterial
          color={color}
          factor={0.3}
          speed={1.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </Float>
  );
}

function IcosahedronShape({ position, color }: {
  position: [number, number, number];
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.25;
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.8} floatIntensity={2}>
      <mesh ref={meshRef} position={position} scale={0.7}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color={color}
          distort={0.3}
          speed={3}
          roughness={0.15}
          metalness={0.85}
          wireframe
        />
      </mesh>
    </Float>
  );
}

function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#1DB954" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#1ed760" />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#ffffff" />

      <FloatingSphere position={[-2.5, 0.5, 0]} color="#1DB954" speed={1.2} distort={0.5} />
      <WobblyTorus position={[2.5, -0.5, -1]} color="#1ed760" />
      <IcosahedronShape position={[0, 1.5, -2]} color="#1DB954" />
      <FloatingSphere position={[1, -1.5, 1]} color="#15a146" speed={0.8} distort={0.3} />

      <Environment preset="night" />
    </>
  );
}

export default function ValueProp3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(textRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          end: "top 25%",
          scrub: 1,
        },
        y: 80,
        opacity: 0,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-spotify border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 0, 6], fov: 50 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
          >
            <Scene3D />
          </Canvas>
        </Suspense>
      </div>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-[1]" />

      {/* Text content */}
      <div ref={textRef} className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 w-full">
        <div className="max-w-xl">
          <p className="text-spotify text-sm font-semibold tracking-widest uppercase mb-4">
            Why Spotify
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6 font-[family-name:var(--font-outfit)] text-gradient-primary">
            Sound that moves you
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-8">
            Experience music in a whole new dimension. With spatial audio, lossless quality,
            and AI-curated playlists—every listen feels like the first time.
          </p>
          <div className="flex flex-wrap gap-6">
            {[
              { stat: "100M+", label: "Tracks" },
              { stat: "5B+", label: "Playlists" },
              { stat: "4M+", label: "Podcasts" },
            ].map((item) => (
              <div key={item.label} className="text-left">
                <div className="text-3xl md:text-4xl font-bold text-gradient-green font-[family-name:var(--font-outfit)]">
                  {item.stat}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
