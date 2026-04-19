"use client";

import { motion } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";

interface AuroraTextProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

export function AuroraText({
  className,
  children,
  as: Component = "span",
  ...props
}: AuroraTextProps) {
  const MotionComponent = motion(Component as any);

  return (
    <MotionComponent
      className={cn(
        "relative inline-flex items-center justify-center font-bold tracking-tighter text-transparent bg-clip-text z-0",
        "bg-[linear-gradient(to_right,hsl(var(--color-1)),hsl(var(--color-2)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-1)))]",
        "bg-[length:200%_auto] animate-aurora-text",
        className,
      )}
      style={{
        "--color-1": "0 0% 100%", // White
        "--color-2": "0 0% 70%", // Light Gray
        "--color-3": "0 0% 40%", // Dark Gray
        "--color-4": "0 0% 90%", // Very Light Gray
      } as React.CSSProperties}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
