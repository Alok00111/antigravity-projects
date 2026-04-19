"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useEffect, useState, useRef, useCallback } from "react";
import { Music2, Mic2, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function LyricsPage() {
  const { currentTrack, isPlaying, progress, duration } = usePlayer();
  const [lyrics, setLyrics] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // Fetch lyrics when the track changes
  useEffect(() => {
    if (!currentTrack) {
      setLyrics(null);
      return;
    }

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);
      setLyrics(null);

      try {
        const params = new URLSearchParams({
          artist: currentTrack.artist,
          title: currentTrack.name,
        });
        const res = await fetch(`/api/lyrics?${params.toString()}`);
        const data = await res.json();

        if (data.lyrics) {
          const lines = data.lyrics
            .split("\n")
            .filter((line: string) => line.trim() !== "");
          setLyrics(lines);
          lineRefs.current = new Array(lines.length).fill(null);
        } else {
          setError(data.message || "Lyrics not available.");
        }
      } catch {
        setError("Could not fetch lyrics.");
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [currentTrack?.id]);

  // Calculate current line index based on playback progress
  const updateCurrentLine = useCallback(() => {
    if (!lyrics || lyrics.length === 0 || duration === 0) return;
    const progressRatio = progress / duration;
    const estimatedLine = Math.floor(progressRatio * lyrics.length);
    const clampedLine = Math.max(0, Math.min(estimatedLine, lyrics.length - 1));
    setCurrentLineIndex(clampedLine);
  }, [lyrics, progress, duration]);

  useEffect(() => {
    updateCurrentLine();
  }, [updateCurrentLine]);

  // Auto-scroll to current line
  useEffect(() => {
    if (!lyrics || !lineRefs.current[currentLineIndex]) return;
    lineRefs.current[currentLineIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [currentLineIndex, lyrics]);

  // No track playing state
  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 py-20">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <Mic2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 font-[family-name:var(--font-outfit)]">
          No Track Playing
        </h2>
        <p className="text-muted-foreground max-w-md">
          Play a song from the{" "}
          <Link href="/web-player" className="text-spotify hover:underline">
            web player
          </Link>{" "}
          to see its lyrics here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Gradient background based on album art */}
      <div
        className="absolute inset-0 opacity-40 blur-3xl scale-110 pointer-events-none"
        style={{
          backgroundImage: `url(${currentTrack.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-8 py-12">
        {/* Back button + Track info */}
        <div className="w-full max-w-3xl mb-12">
          <Link
            href="/web-player"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Player
          </Link>

          <div className="flex items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTrack.image}
              alt={currentTrack.name}
              className="w-20 h-20 rounded-lg shadow-2xl shadow-black/50 object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)] line-clamp-1">
                {currentTrack.name}
              </h1>
              <p className="text-muted-foreground text-lg">
                {currentTrack.artist}
              </p>
            </div>
            {isPlaying && (
              <div className="ml-auto flex gap-1 items-end h-5">
                <span className="w-1 bg-spotify rounded-sm animate-pulse h-3" style={{ animationDelay: "0s" }} />
                <span className="w-1 bg-spotify rounded-sm animate-pulse h-5" style={{ animationDelay: "0.15s" }} />
                <span className="w-1 bg-spotify rounded-sm animate-pulse h-2" style={{ animationDelay: "0.3s" }} />
                <span className="w-1 bg-spotify rounded-sm animate-pulse h-4" style={{ animationDelay: "0.45s" }} />
              </div>
            )}
          </div>
        </div>

        {/* Lyrics Area */}
        <div
          ref={lyricsContainerRef}
          className="w-full max-w-3xl flex flex-col items-center gap-1 pb-48"
        >
          {loading && (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="w-10 h-10 border-2 border-spotify border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm">Fetching lyrics...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <Music2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">{error}</p>
              <p className="text-muted-foreground/60 text-sm max-w-sm">
                Lyrics aren&apos;t available for every track. Try playing a different song!
              </p>
            </div>
          )}

          {lyrics &&
            lyrics.map((line, idx) => {
              const isCurrent = idx === currentLineIndex;
              const isPast = idx < currentLineIndex;
              const isFuture = idx > currentLineIndex;

              return (
                <p
                  key={idx}
                  ref={(el) => { lineRefs.current[idx] = el; }}
                  className={`text-center px-4 py-2 transition-all duration-500 ease-out cursor-default select-none leading-relaxed ${
                    isCurrent
                      ? "text-white text-3xl md:text-4xl font-bold scale-105 drop-shadow-[0_0_30px_rgba(29,185,84,0.5)]"
                      : isPast
                      ? "text-white/30 text-xl md:text-2xl font-medium"
                      : isFuture
                      ? "text-white/20 text-xl md:text-2xl font-medium"
                      : ""
                  }`}
                  style={{
                    transform: isCurrent ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {line}
                </p>
              );
            })}
        </div>
      </div>
    </div>
  );
}
