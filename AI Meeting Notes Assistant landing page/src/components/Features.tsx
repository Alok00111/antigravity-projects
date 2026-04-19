"use client";

import { motion } from "framer-motion";
import { Mic, Globe, Lock, Code, BrainCircuit, Zap } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const features = [
  {
    title: "Real-time Transcription",
    description: "Capture every word as it's spoken with 99% accuracy across 50+ languages.",
    icon: <Mic className="w-4 h-4 text-brand-400" />,
    className: "md:col-span-2",
    header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-white/5" />,
  },
  {
    title: "AI Summaries",
    description: "Instantly condense hour-long meetings into concise paragraphs.",
    icon: <BrainCircuit className="w-4 h-4 text-brand-400" />,
    className: "md:col-span-1",
    header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-white/5" />,
  },
  {
    title: "Action Items",
    description: "Automatically identify tasks and assignees.",
    icon: <Zap className="w-4 h-4 text-brand-400" />,
    className: "md:col-span-1",
    header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-white/5" />,
  },
  {
    title: "Bank-Grade Security",
    description: "End-to-end encryption and compliance.",
    icon: <Lock className="w-4 h-4 text-brand-400" />,
    className: "md:col-span-2",
    header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-white/5" />,
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-12 h-1 bg-brand-500 mb-6 rounded-full"
          />
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-heading font-bold mb-6"
          >
            Everything you need. <br className="hidden md:block" />
            <span className="text-gray-500">Nothing you don't.</span>
          </motion.h2>
        </div>

        <BentoGrid className="max-w-4xl mx-auto">
          {features.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={`${item.className} border-white/10`}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
