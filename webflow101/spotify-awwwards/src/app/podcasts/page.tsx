"use client";

import Navbar from "@/components/Navbar";
import FooterCTA from "@/components/sections/FooterCTA";
import Link from "next/link";
import { motion, useScroll, Variants } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Suspense } from "react";

const categories = [
  { name: "True Crime", color: "bg-[#E8115B]", image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=300&q=80" },
  { name: "Comedy", color: "bg-[#FFC864]", titleColor: "text-black", image: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=300&q=80" },
  { name: "News & Politics", color: "bg-[#1E3264]", image: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=300&auto=format&fit=crop" },
  { name: "Educational", color: "bg-[#1DB954]", image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=300&auto=format&fit=crop" },
  { name: "Sports", color: "bg-[#D84000]", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=300&auto=format&fit=crop" },
  { name: "Technology", color: "bg-[#777777]", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=300&auto=format&fit=crop" },
];

const trending = [
  { title: "The Joe Rogan Experience", host: "Joe Rogan", image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=400&auto=format&fit=crop" },
  { title: "Call Her Daddy", host: "Alex Cooper", image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=400&auto=format&fit=crop" },
  { title: "Huberman Lab", host: "Andrew Huberman", image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=400&auto=format&fit=crop" },
  { title: "Crime Junkie", host: "audiochuck", image: "https://images.unsplash.com/photo-1453227588063-bb302b62f50b?q=80&w=400&auto=format&fit=crop" },
];

function BoomBoxModel() {
  const { scene } = useGLTF("/models/boombox.glb");
  // Scale it up heavily since the Khronos model is tiny
  return <primitive object={scene} scale={[80, 80, 80]} position={[0, -0.5, 0]} rotation={[0, Math.PI / 4, 0]} />;
}

function CinematicCamera() {
  const { scrollYProgress } = useScroll();

  useFrame((state, delta) => {
    // Smoothed scroll value
    const progress = scrollYProgress.get();

    // Cinematic Flight Path calculations purely based on scroll depth
    // Start on the right side of the screen at progress 0, orbit to the front, and pull back and up
    const targetX = THREE.MathUtils.lerp(3, 0, progress * 2); 
    const targetY = THREE.MathUtils.lerp(0, 4, progress);
    const targetZ = THREE.MathUtils.lerp(4, 10, progress);

    // Smoothly damp the camera position towards the targets for a buttery feel
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 2, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 2, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 2, delta);

    // Always keep focus strictly on the BoomBox at the origin
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

function PodcastScene() {
  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#A855F7" />
      <directionalLight position={[-10, 10, -5]} intensity={1} color="#3B82F6" />
      
      <CinematicCamera />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={2}>
        <BoomBoxModel />
      </Float>
      
      {/* Dynamic ambient particles to provide 3D parallax depth references */}
      {Array.from({ length: 40 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 20;
        const z = (Math.random() - 0.5) * 20;
        const color = Math.random() > 0.5 ? "#A855F7" : "#EC4899";
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color={color} />
          </mesh>
        );
      })}

      <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={2} far={4} />
    </>
  );
}

export default function PodcastsPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-transparent">
      
      {/* Fixed 3D WebGL Canvas Layer */}
      <div className="fixed inset-0 -z-10 bg-[#060606] pointer-events-none">
        <Canvas camera={{ position: [3, 0, 4], fov: 45 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <PodcastScene />
          </Suspense>
        </Canvas>
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center">
        {/* Minimal glows to compliment 3D rather than overpowering it */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none transform -translate-y-1/2" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <motion.div variants={itemVariants} className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
                <span className="text-sm font-medium text-white/80">Premium Audio Experience</span>
              </motion.div>
              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold mb-6 font-[family-name:var(--font-outfit)] tracking-tight text-white drop-shadow-2xl">
                Stories that <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  move you.
                </span>
              </motion.h1>
              <motion.p variants={itemVariants} className="text-lg text-muted-foreground mb-8 max-w-xl">
                Experience an immersive 3D journey through global chart-toppers, original series, and groundbreaking investigative journalism.
              </motion.p>
              <motion.div variants={itemVariants} className="flex gap-4">
                <Link href="/web-player" className="inline-flex px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  Explore Podcasts
                </Link>
              </motion.div>
            </div>

            {/* Empty right half grid to leave pure, unadulterated room for the majestic 3D Boombox model */}
            <div className="hidden lg:block h-[500px]" />
          </motion.div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-20 px-6 relative z-10 backdrop-blur-sm bg-black/20 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 100 }}
            className="text-3xl font-bold mb-10 font-[family-name:var(--font-outfit)]"
          >
            Top Shows Globally
          </motion.h2>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {trending.map((show) => (
              <motion.div variants={itemVariants} key={show.title}>
                <Link href="/web-player" className="group cursor-pointer block h-full">
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-4 shadow-lg shadow-black/50">
                    <img src={show.image} alt={show.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-spotify text-black flex items-center justify-center pl-1 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl shadow-spotify/20">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground group-hover:text-white transition-colors truncate">{show.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{show.host}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Bento Grid */}
      <section className="py-20 px-6 relative z-10 backdrop-blur-md bg-black/40 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 100 }}
            className="text-3xl font-bold mb-10 font-[family-name:var(--font-outfit)]"
          >
            Explore by Genre
          </motion.h2>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
          >
            {categories.map((cat, i) => (
              <motion.div variants={itemVariants} key={cat.name}>
                <Link href="/web-player" className="block relative group overflow-hidden rounded-xl h-full">
                  {/* The card background container */}
                  <div className={`h-40 md:h-48 w-full p-4 relative ${cat.color} overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-[1.02]`}>
                    {/* Category Title */}
                    <h3 className={`relative z-10 text-2xl font-bold font-[family-name:var(--font-outfit)] leading-tight ${cat.titleColor || 'text-white'}`}>
                      {cat.name}
                    </h3>
                    
                    {/* Rotated Image tucked in bottom right */}
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 md:w-32 md:h-32 transform rotate-[25deg] shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      <img 
                        src={cat.image} 
                        alt={cat.name} 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <FooterCTA />
    </main>
  );
}
