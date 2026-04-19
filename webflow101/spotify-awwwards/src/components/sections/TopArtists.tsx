"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface DeezerAlbum {
  id: number;
  title: string;
  cover_medium: string;
  cover_big: string;
  artist: { name: string; picture_medium?: string };
  record_type: string;
}

const fallbackArtists = [
  { name: "Taylor Swift", genre: "Pop", listeners: "92.4M", color: "#c084fc" },
  { name: "Drake", genre: "Hip-Hop", listeners: "78.2M", color: "#60a5fa" },
  { name: "The Weeknd", genre: "R&B", listeners: "85.1M", color: "#f87171" },
  { name: "Bad Bunny", genre: "Latin", listeners: "69.8M", color: "#fbbf24" },
  { name: "Billie Eilish", genre: "Alt Pop", listeners: "65.3M", color: "#34d399" },
  { name: "BTS", genre: "K-Pop", listeners: "58.7M", color: "#c084fc" },
  { name: "Ed Sheeran", genre: "Pop", listeners: "82.1M", color: "#fb923c" },
  { name: "Ariana Grande", genre: "Pop", listeners: "73.6M", color: "#f472b6" },
];

type MappedArtist = {
  id: string;
  name: string;
  genre: string;
  listeners: string;
  color: string;
  image?: string;
  albumName?: string;
};

function ArtistAvatar({
  artist,
  index,
}: {
  artist: MappedArtist;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight hover */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(250px circle at ${mousePos.x}px ${mousePos.y}px, rgba(29, 185, 84, 0.06), transparent 80%)`,
          }}
        />
      )}

      <div className="relative rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 transition-all duration-500 hover:border-white/[0.12] overflow-hidden">
        {/* Avatar / Cover Art */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          {artist.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={artist.image} 
              alt={artist.name}
              className="w-full h-full rounded-full object-cover shadow-lg transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div
              className="w-full h-full rounded-full flex items-center justify-center text-3xl font-bold font-[family-name:var(--font-outfit)] transition-transform duration-300 group-hover:scale-110"
              style={{ background: `linear-gradient(135deg, ${artist.color}40, ${artist.color}10)` }}
            >
              {artist.name[0]}
            </div>
          )}
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-spotify border-2 border-[#0a0a0a] group-hover:scale-125 transition-transform duration-300" />
        </div>

        {/* Info */}
        <div className="text-center">
          <h4 className="font-bold font-[family-name:var(--font-outfit)] mb-1 group-hover:text-spotify transition-colors duration-300">
            {artist.name}
          </h4>
          <p className="text-xs text-muted-foreground mb-2">{artist.genre}</p>
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-semibold">{artist.listeners}</span> monthly
          </p>
        </div>

        {/* Tooltip on hover */}
        <div className={`absolute -top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-xs whitespace-nowrap transition-all duration-300 pointer-events-none z-20 ${
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}>
          <span className="text-muted-foreground">Currently playing on </span>
          <span className="text-foreground font-medium">Spotify</span>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-[#1a1a1a] border-r border-b border-white/10 rotate-45" />
        </div>
      </div>
    </div>
  );
}

export default function TopArtists({ releases }: { releases?: DeezerAlbum[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const isLive = releases && releases.length > 0;

  const displayArtists = isLive
    ? releases.filter(Boolean).map((r: any) => ({
        id: `spotify-album-${r.id}`,
        name: r.artists?.[0]?.name || "Unknown Artist",
        genre: r.album_type || "Album",
        listeners: r.name,
        color: "#1DB954",
        image: r.images?.[0]?.url,
        albumName: r.name,
      }))
    : fallbackArtists.map((a, i) => ({ ...a, id: `fallback-artist-${i}` }));

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

      const cards = gridRef.current?.children;
      if (cards) {
        gsap.from(Array.from(cards), {
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
          },
          y: 60,
          opacity: 0,
          stagger: 0.06,
          duration: 0.8,
          ease: "power3.out",
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-padding relative">
      <div className="max-w-7xl mx-auto">
        <div ref={headingRef} className="text-center mb-20">
          <p className="text-spotify text-sm font-semibold tracking-widest uppercase mb-4">
            {isLive ? "Live from Spotify" : "Community"}
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-[family-name:var(--font-outfit)] text-gradient-primary mb-6">
            {isLive ? "New Releases" : "Top artists globally"}
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            {isLive 
              ? "The hottest tracks and albums dropping right now on Spotify." 
              : "Join billions of fans streaming the world's biggest artists."}
          </p>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {displayArtists.map((artist, index) => (
            <ArtistAvatar key={artist.id} artist={artist} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
