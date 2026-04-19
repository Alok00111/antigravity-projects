"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const { openModal } = useUI();
  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden flex flex-col items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero_bg.png"
          alt="Abstract background"
          fill
          priority
          className="object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-[#050505]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border outline-none border-brand-500/30 text-brand-400 text-sm font-medium mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          MeetScribe AI 2.0 is Live
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-heading font-extrabold tracking-tight text-white mb-6 leading-tight"
        >
          Your Meetings, <br />
          <span className="text-gradient-brand">Perfectly Captured.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-sans"
        >
          Never miss a critical detail again. Our AI listens, transcribes, and instantly generates actionable summaries so you can focus on the conversation.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button onClick={() => openModal('signup')} className="w-full sm:w-auto px-8 py-6 rounded-xl font-medium tracking-tight hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.15)] bg-white text-black hover:bg-white/90">
            Start for Free <ArrowRight className="w-5 h-5" />
          </Button>
          <Link href="#demo" className="w-full sm:w-auto h-12 px-8 glass text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors duration-300 text-sm">
            <PlayCircle className="w-5 h-5 text-brand-400" /> Watch Demo
          </Link>
        </motion.div>

        {/* Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-blue-500 rounded-[2rem] blur-2xl opacity-20" />
          <div className="relative rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl bg-black">
            <div className="h-8 glass flex items-center px-4 gap-2 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <Image
              src="/images/dashboard.png"
              alt="MeetScribe Dashboard UI"
              width={1920}
              height={1080}
              className="w-full h-auto object-cover opacity-90"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
