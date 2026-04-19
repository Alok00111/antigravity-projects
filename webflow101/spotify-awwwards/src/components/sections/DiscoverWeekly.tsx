"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SpotlightCard from "@/components/ui/SpotlightCard";
import Link from "next/link";

export interface DeezerPlaylist {
  id: number;
  title: string;
  picture_medium: string;
  picture_big: string;
  nb_tracks: number;
  user?: { name: string };
}

const fallbackPlaylists = [
  {
    title: "Discover Weekly",
    description: "Your personal mixtape of fresh music. Enjoy new discoveries and deep cuts chosen just for you.",
    tracks: "30 songs",
    updated: "Every Monday",
    gradient: "from-[#1DB954] to-[#134e30]",
  },
  {
    title: "Release Radar",
    description: "New music from artists you follow and new releases we think you'll love, every Friday.",
    tracks: "30 songs",
    updated: "Every Friday",
    gradient: "from-[#8b5cf6] to-[#3b0764]",
  },
  {
    title: "Daily Mix 1",
    description: "A mix of your favorite tracks with some new ones thrown in. Updated daily based on your listening.",
    tracks: "50+ songs",
    updated: "Daily",
    gradient: "from-[#e11d48] to-[#4a0519]",
  },
  {
    title: "Time Capsule",
    description: "Songs that take you back. A nostalgic playlist based on your listening history and age.",
    tracks: "40 songs",
    updated: "Monthly",
    gradient: "from-[#f59e0b] to-[#451a03]",
  },
  {
    title: "On Repeat",
    description: "Your most played tracks right now. The songs you just can not stop listening to.",
    tracks: "30 songs",
    updated: "Live",
    gradient: "from-[#06b6d4] to-[#083344]",
  },
  {
    title: "Blend",
    description: "Share a playlist that merges your taste with a friend's. See where your music worlds collide.",
    tracks: "Shared",
    updated: "Daily",
    gradient: "from-[#ec4899] to-[#500724]",
  },
];

export default function DiscoverWeekly({ playlists }: { playlists?: DeezerPlaylist[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  // Map real Spotify data to our UI shape, or use fallbacks if data is missing
  const displayPlaylists = playlists?.length
    ? playlists.filter(Boolean).map((p: any) => ({
        id: `spotify-${p.id}`,
        title: p.name || "Untitled Playlist",
        description: p.description ? (p.description.replace(/<[^>]*>?/gm, '')) : `A curated playlist by ${p.owner?.display_name || "Spotify"}`,
        tracks: `${p.tracks?.total || "??"} songs`,
        updated: "Recently updated",
        image: p.images?.[0]?.url,
        gradient: "from-[#1DB954] to-[#134e30]",
      }))
    : fallbackPlaylists.map((p, i) => ({ ...p, id: `fallback-${i}`, image: undefined }));

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 85%",
        },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
          },
          y: 80,
          opacity: 0,
          scale: 0.95,
          duration: 0.8,
          delay: i * 0.08,
          ease: "power3.out",
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="discover" className="section-padding relative">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-20">
          <p className="text-spotify text-sm font-semibold tracking-widest uppercase mb-4">
            Personalized
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-[family-name:var(--font-outfit)] text-gradient-primary mb-6">
            Made for you
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Playlists that evolve with your taste. Powered by AI that listens, learns, and curates.
          </p>
        </div>

        {/* 3D Pin-style Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPlaylists.map((playlist, index) => (
            <div
              key={playlist.id}
              ref={(el) => { if (el) cardsRef.current[index] = el; }}
              style={{ perspective: "1000px" }}
            >
              <SpotlightCard className="hover:shadow-2xl transform-gpu hover:-translate-y-2 hover:rotate-x-[-2deg]">
                {/* Album art header */}
                <div className={`h-48 relative overflow-hidden bg-gradient-to-br ${playlist.gradient}`}>
                  {playlist.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={playlist.image}
                      alt={playlist.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6">
                    <h3 className="text-2xl font-bold font-[family-name:var(--font-outfit)] line-clamp-1">
                      {playlist.title}
                    </h3>
                  </div>
                  {/* Play button */}
                  <Link href="/web-player" className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-spotify flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-lg shadow-spotify/30 z-10">
                    <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </Link>
                </div>

                {/* Card content */}
                <div className="p-6">
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {playlist.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-spotify/60" />
                      {playlist.tracks}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                      {playlist.updated}
                    </span>
                  </div>
                </div>

                {/* Pin line + dot */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                  <div className="w-3 h-3 rounded-full bg-spotify glow-green" />
                  <div className="w-[1px] h-6 bg-gradient-to-b from-spotify to-transparent" />
                </div>
              </SpotlightCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
