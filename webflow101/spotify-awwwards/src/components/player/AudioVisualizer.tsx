"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ── Frequency Bars Mode ──
function FrequencyBars({ analyserData }: { analyserData: Uint8Array }) {
  const meshRef = useRef<THREE.Group>(null);
  const barsCount = 64;

  const bars = useMemo(() => {
    return Array.from({ length: barsCount }, (_, i) => {
      const angle = (i / barsCount) * Math.PI * 2;
      const radius = 3;
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        angle,
      };
    });
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const dataIndex = Math.floor((i / barsCount) * analyserData.length);
      const value = analyserData[dataIndex] / 255;
      const targetY = 0.2 + value * 4;
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, targetY, 0.3);
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
        value * 2;
    });
    meshRef.current.rotation.y += 0.002;
  });

  return (
    <group ref={meshRef}>
      {bars.map((bar, i) => (
        <mesh key={i} position={[bar.x, 0, bar.z]} rotation={[0, -bar.angle, 0]}>
          <boxGeometry args={[0.15, 1, 0.15]} />
          <meshStandardMaterial
            color="#1db954"
            emissive="#1db954"
            emissiveIntensity={0}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Particle Sphere Mode ──
function ParticleSphere({ analyserData }: { analyserData: Uint8Array }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 2000;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  const originalPositions = useMemo(() => new Float32Array(positions), [positions]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;

    // Calculate average bass energy
    const bassAvg =
      analyserData.slice(0, 10).reduce((sum, v) => sum + v, 0) / (10 * 255);

    for (let i = 0; i < particleCount; i++) {
      const ix = i * 3;
      const dataIndex = Math.floor((i / particleCount) * analyserData.length);
      const value = analyserData[dataIndex] / 255;

      const expansion = 1 + bassAvg * 0.8 + value * 0.3;
      pos[ix] = originalPositions[ix] * expansion;
      pos[ix + 1] =
        originalPositions[ix + 1] * expansion +
        Math.sin(time * 2 + i * 0.01) * 0.1;
      pos[ix + 2] = originalPositions[ix + 2] * expansion;
    }
    geo.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y += 0.003;
    pointsRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#1db954"
        size={0.04}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// ── Waveform Ring Mode ──
function WaveformRing({ analyserData }: { analyserData: Uint8Array }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const segments = 128;

  useFrame((state) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const pos = geo.attributes.position;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < pos.count; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const dataIndex = Math.floor((i / segments) * analyserData.length) % analyserData.length;
      const value = analyserData[dataIndex] / 255;
      const r = 2.5 + value * 1.5 + Math.sin(time + angle * 3) * 0.1;
      pos.setXYZ(
        i,
        Math.cos(angle) * r,
        Math.sin(angle) * r,
        Math.sin(time * 2 + angle * 5) * value * 0.5
      );
    }
    pos.needsUpdate = true;
    meshRef.current.rotation.z += 0.005;
  });

  const curve = useMemo(() => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0));
    }
    return new THREE.CatmullRomCurve3(points, true);
  }, []);

  return (
    <mesh ref={meshRef}>
      <tubeGeometry args={[curve, segments, 0.05, 8, true]} />
      <meshStandardMaterial
        color="#1db954"
        emissive="#1db954"
        emissiveIntensity={0.5}
        transparent
        opacity={0.9}
        wireframe
      />
    </mesh>
  );
}

// ── Main Visualizer Scene ──
export default function AudioVisualizer({
  analyserData,
  mode,
}: {
  analyserData: Uint8Array;
  mode: "bars" | "particles" | "wave";
}) {
  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 60 }}
      className="w-full h-full"
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#1db954" />
      <pointLight position={[-5, -3, 5]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[0, 5, -5]} intensity={0.3} color="#3b82f6" />

      {mode === "bars" && <FrequencyBars analyserData={analyserData} />}
      {mode === "particles" && <ParticleSphere analyserData={analyserData} />}
      {mode === "wave" && <WaveformRing analyserData={analyserData} />}

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}
