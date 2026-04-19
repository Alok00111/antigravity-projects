"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { Play, Sparkles, FileText, CheckCircle } from "lucide-react";

const tabs = [
  { id: "transcript", label: "Live Transcript", icon: FileText },
  { id: "summary", label: "AI Summary", icon: Sparkles },
  { id: "action", label: "Action Items", icon: CheckCircle },
];

export default function ProductDemo() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <section id="demo" className="py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-900/10 rounded-full blur-3xl -z-10" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-heading font-bold mb-6"
          >
            See the Magic in <span className="text-gradient">Action</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Experience how MeetScribe AI transforms an hour-long meeting into a 2-minute actionable summary.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Interactive Controls */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 flex flex-col gap-4"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative p-6 rounded-2xl text-left transition-all duration-300 ${
                    isActive ? "bg-white/10 border-brand-500/50" : "glass-card hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 rounded-2xl border-2 border-brand-500"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isActive ? "bg-brand-500 text-white" : "bg-white/5 text-gray-400"}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-lg ${isActive ? "text-white" : "text-gray-300"}`}>
                        {tab.label}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Instantly generated with perfect precision.
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>

          {/* Video / Image Display */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-8 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-brand-600 to-blue-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black aspect-video flex items-center justify-center">
              <Image
                src="/images/dashboard.png"
                alt="Feature Demo"
                fill
                className="object-cover opacity-80"
              />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-brand-500/80 flex items-center justify-center backdrop-blur-md">
                  <Play className="w-8 h-8 text-white ml-2" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
