"use client";

import { motion, Variants } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  // Awwwards-style Staggered Column Wipe Constants
  const columns = 5;
  const animVariants: Variants = {
    initial: { height: "100vh" },
    animate: (i: number) => ({
      height: "0vh",
      transition: {
        duration: 0.6,
        ease: [0.76, 0, 0.24, 1], // Custom Awwwards cubic-bezier
        delay: 0.05 * i,
      },
    }),
  };

  const contentVariants: Variants = {
    initial: { opacity: 0, y: 100 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.76, 0, 0.24, 1],
        delay: 0.4, // Wait for columns to begin clearing
      },
    },
  };

  return (
    <>
      {/* The 5-Column Overlay Wipe */}
      <div className="fixed inset-0 z-[9999] pointer-events-none flex w-full h-full">
        {Array.from({ length: columns }).map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={animVariants}
            initial="initial"
            animate="animate"
            className="w-1/5 bg-zinc-950 border-r border-white/5 last:border-r-0"
            style={{ originY: 0 }} // Retract upwards
          />
        ))}
      </div>

      {/* The Page Content Reveal */}
      <motion.div
        variants={contentVariants}
        initial="initial"
        animate="animate"
        className="w-full min-h-screen"
      >
        {children}
      </motion.div>
    </>
  );
}
