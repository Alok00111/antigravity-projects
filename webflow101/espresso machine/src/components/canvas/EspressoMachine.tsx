"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function EspressoMachine() {
  // References to our fake "parts" so we can detach them on scroll
  const machineRef = useRef<THREE.Group>(null);
  const portafilterRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!machineRef.current || !portafilterRef.current) return;

    // Timeline 1: The machine slowly rotates as you scroll the very top section
    gsap.to(machineRef.current.rotation, {
      y: Math.PI * 2, // 360 degree spin
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom", // Will spin across the entire page scroll
        scrub: 1, // Momentum-based scrub linking it to Lenis
      },
    });

    // Timeline 2: The Portafilter specifically drops down when reaching Section 2
    gsap.to(portafilterRef.current.position, {
      y: -3, // Drop it down on the Y axis
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: ".disassembly-trigger", // HTML class we will build later
        start: "top center", // When trigger hits center of screen
        end: "bottom center",
        scrub: 1,
      },
    });

  }, []);

  // For right now, since we have no real .glb file, we use 3D primitives (Cylinder & Box)
  // structured to look like the main machine block and the portafilter handle.
  
  return (
    <group ref={machineRef} position={[0, -1, 0]}>
      {/* The Main Machine Body (Chrome / Dark Gray Box) */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[4, 5, 3]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* The Drip Tray (Bottom Box) */}
      <mesh position={[0, -1, 1]} castShadow>
        <boxGeometry args={[4, 0.5, 3]} />
        <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* The Portafilter (The specific piece that detaches!) */}
      <mesh ref={portafilterRef} position={[0, 1, 1.5]} castShadow>
        <cylinderGeometry args={[0.4, 0.3, 1, 32]} />
        {/* Rotate the cylinder so it looks like a handle jutting out */}
        <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={1} />
      </mesh>
    </group>
  );
}
