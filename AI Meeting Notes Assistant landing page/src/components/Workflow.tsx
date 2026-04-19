"use client";

import { motion } from "framer-motion";
import { Mic, FileText, Share2 } from "lucide-react";

export default function Workflow() {
  const steps = [
    {
      num: "01",
      title: "Hit Record",
      desc: "Connect your calendar, and MeetScribe automatically joins Google Meet, Zoom, or Teams.",
      icon: Mic,
    },
    {
      num: "02",
      title: "AI Analysis",
      desc: "As you speak, our engine transcribes the conversation with speaker identification.",
      icon: FileText,
    },
    {
      num: "03",
      title: "Get Insights",
      desc: "Receive a structured summary and action items pushed directly to Slack or Notion.",
      icon: Share2,
    },
  ];

  return (
    <section id="workflow" className="py-24 relative z-10 bg-surface-100 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-heading font-bold mb-6 text-white"
          >
            How it <span className="text-gradient">Works</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop only) */}
          <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent -z-10" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex flex-col items-center text-center relative"
              >
                <div className="w-20 h-20 rounded-full bg-[#0a0a0a] border-4 border-[#121212] flex items-center justify-center relative shadow-xl shadow-brand-500/10 mb-6">
                  <div className="absolute inset-0 rounded-full border border-white/10" />
                  <Icon className="w-8 h-8 text-brand-400" />
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-xs border-2 border-[#121212]">
                    {step.num}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold font-heading text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 font-sans max-w-[280px] leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
