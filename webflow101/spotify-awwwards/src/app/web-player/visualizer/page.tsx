"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, Waves, BarChart3, Globe, Music2 } from "lucide-react";
import Link from "next/link";

// Dynamic import Three.js visualizer (SSR not supported)
const AudioVisualizer = dynamic(
  () => import("@/components/player/AudioVisualizer"),
  { ssr: false }
);

type VisualizerMode = "bars" | "particles" | "wave";

const MODE_CONFIG: {
  id: VisualizerMode;
  label: string;
  icon: typeof BarChart3;
}[] = [
  { id: "bars", label: "Frequency Bars", icon: BarChart3 },
  { id: "particles", label: "Particle Sphere", icon: Globe },
  { id: "wave", label: "Waveform Ring", icon: Waves },
];

export default function VisualizerPage() {
  const { currentTrack, isPlaying, audioRef, progress, duration } = usePlayer();
  const [mode, setMode] = useState<VisualizerMode>("particles");
  const [analyserData, setAnalyserData] = useState<Uint8Array>(
    new Uint8Array(128)
  );

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // Connect Web Audio API analyser to the HTML5 audio element
  const connectAnalyser = useCallback(() => {
    if (!audioRef.current || analyserRef.current) return;

    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (err) {
      // MediaElementSource may already exist – ignore
      console.warn("Could not create audio analyser:", err);
    }
  }, [audioRef]);

  // Update analyser data each frame
  useEffect(() => {
    const update = () => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAnalyserData(dataArray);
      } else if (isPlaying && duration > 0) {
        // Fallback: generate synthetic visualizer data from progress when using Spotify SDK
        const synth = new Uint8Array(128);
        const t = Date.now() / 1000;
        const progressRatio = progress / duration;
        for (let i = 0; i < 128; i++) {
          synth[i] = Math.floor(
            (Math.sin(t * 3 + i * 0.2) * 0.3 +
              Math.sin(t * 7 + i * 0.5) * 0.2 +
              Math.cos(t * 1.5 + i * 0.1) * 0.2 +
              0.3 +
              progressRatio * 0.1) *
              255
          );
        }
        setAnalyserData(synth);
      }
      animFrameRef.current = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, progress, duration]);

  // Try connecting analyser when audio starts playing
  useEffect(() => {
    if (isPlaying && audioRef.current && !analyserRef.current) {
      connectAnalyser();
    }
  }, [isPlaying, audioRef, connectAnalyser]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Three.js Canvas */}
      <div className="absolute inset-0">
        <AudioVisualizer analyserData={analyserData} mode={mode} />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between">
        <Link
          href="/web-player"
          className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors backdrop-blur-md bg-white/5 px-3 py-2 rounded-full"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Mode Toggle */}
        <div className="flex gap-2 backdrop-blur-md bg-white/5 rounded-full p-1">
          {MODE_CONFIG.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                mode === m.id
                  ? "bg-spotify text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <m.icon className="w-4 h-4" />
              <span className="hidden md:inline">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Track Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-8">
        {currentTrack ? (
          <div className="flex items-end gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTrack.image}
              alt={currentTrack.name}
              className="w-20 h-20 rounded-xl shadow-2xl shadow-black/50 object-cover"
            />
            <div className="flex-1">
              <p className="text-xs text-spotify font-semibold uppercase tracking-widest mb-1">
                Now Visualizing
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-[family-name:var(--font-outfit)] line-clamp-1">
                {currentTrack.name}
              </h2>
              <p className="text-white/60 text-lg">{currentTrack.artist}</p>
            </div>
            {isPlaying && (
              <div className="flex gap-1 items-end h-6 mb-2">
                <span className="w-1 bg-spotify rounded-sm animate-pulse h-3" style={{ animationDelay: "0s" }} />
                <span className="w-1 bg-spotify rounded-sm animate-pulse h-6" style={{ animationDelay: "0.15s" }} />
                <span className="w-1 bg-spotify rounded-sm animate-pulse h-2" style={{ animationDelay: "0.3s" }} />
                <span className="w-1 bg-spotify rounded-sm animate-pulse h-5" style={{ animationDelay: "0.45s" }} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-white font-medium">No Track Playing</p>
              <p className="text-sm text-muted-foreground">
                Play a song to see the visualizer react to the music
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
