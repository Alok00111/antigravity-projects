"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AuthModal() {
  const { isModalOpen, modalView, closeModal, openModal } = useUI();

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-6"
          >
            <div className="glass flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/50 p-8 shadow-2xl relative">
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8 text-center mt-2">
                <h2 className="font-heading text-2xl font-bold text-white mb-2">
                  {modalView === "signup" ? "Create an account" : "Welcome back"}
                </h2>
                <p className="text-sm text-gray-400">
                  {modalView === "signup"
                    ? "Start your 14-day free trial today."
                    : "Enter your details to sign in."}
                </p>
              </div>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); closeModal(); }}>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-medium text-gray-300 ml-1">Email</label>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    required
                    className="w-full rounded-xl border-white/10 bg-white/5 px-4 py-5 text-sm text-white placeholder:text-gray-500 focus-visible:ring-brand-500"
                  />
                </div>
                {modalView === "signup" && (
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-medium text-gray-300 ml-1">Name</label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      required
                      className="w-full rounded-xl border-white/10 bg-white/5 px-4 py-5 text-sm text-white placeholder:text-gray-500 focus-visible:ring-brand-500"
                    />
                  </div>
                )}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-medium text-gray-300 ml-1">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border-white/10 bg-white/5 px-4 py-5 text-sm text-white placeholder:text-gray-500 focus-visible:ring-brand-500"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full rounded-xl bg-brand-500 py-6 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-400">
                    {modalView === "signup" ? "Get Started" : "Sign In"}
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-gray-400">
                {modalView === "signup" ? (
                  <p>
                    Already have an account?{" "}
                    <button onClick={() => openModal("login")} className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                      Log in
                    </button>
                  </p>
                ) : (
                  <p>
                    Don't have an account?{" "}
                    <button onClick={() => openModal("signup")} className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                      Sign up
                    </button>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
