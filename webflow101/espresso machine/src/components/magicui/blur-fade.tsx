"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
}

export function BlurFade({
  children,
  className,
  delay = 0,
  yOffset = 24,
  inView = false,
}: BlurFadeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)", y: yOffset }}
      animate={
        inView
          ? { opacity: 1, filter: "blur(0px)", y: 0 }
          : { opacity: 0, filter: "blur(10px)", y: yOffset }
      }
      transition={{ delay, duration: 0.8, ease: "easeOut" }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
