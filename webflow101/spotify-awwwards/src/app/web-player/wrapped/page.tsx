"use client";

import { useEffect, useState, useRef } from "react";
import { Crown, TrendingUp, Music, Disc3, ChevronLeft, LogIn } from "lucide-react";
import Link from "next/link";

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
  popularity: number;
}

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
}

interface Genre {
  name: string;
  count: number;
}

type TimeRange = "short_term" | "medium_term" | "long_term";

const TIME_LABELS: Record<TimeRange, string> = {
  short_term: "Last 4 Weeks",
  medium_term: "Last 6 Months",
  long_term: "All Time",
};

export default function WrappedPage() {
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [topGenres, setTopGenres] = useState<Genre[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setAuthError(false);
      try {
        const res = await fetch(`/api/spotify/top-items?time_range=${timeRange}`);
        if (res.status === 401) {
          setAuthError(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.error) {
          setAuthError(true);
        } else {
          setTopArtists(data.topArtists || []);
          setTopTracks(data.topTracks || []);
          setTopGenres(data.topGenres || []);
        }
      } catch {
        setAuthError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // Animate sections on mount using Intersection Observer
  useEffect(() => {
    if (!sectionsRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = sectionsRef.current.querySelectorAll(".wrapped-section");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [loading]);

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 py-20">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-spotify/20 to-purple-500/20 flex items-center justify-center mb-6">
          <LogIn className="w-10 h-10 text-spotify" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 font-[family-name:var(--font-outfit)]">
          Connect Your Spotify
        </h2>
        <p className="text-muted-foreground max-w-md mb-6">
          To see your personal Wrapped stats, you need to connect your Spotify account.
        </p>
        <a
          href="/api/spotify/login"
          className="px-6 py-3 bg-spotify text-black font-bold rounded-full hover:bg-spotify/90 transition-colors flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Connect Spotify
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="w-12 h-12 border-2 border-spotify border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground">Loading your stats...</p>
      </div>
    );
  }

  const totalGenres = topGenres.length;
  const maxGenreCount = topGenres[0]?.count || 1;

  return (
    <div className="relative min-h-full pb-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black/80 to-black pointer-events-none" />

      <div ref={sectionsRef} className="relative z-10 px-8 py-12 max-w-6xl mx-auto">
        {/* Header */}
        <Link
          href="/web-player"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Player
        </Link>

        <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-tight">
              Your Wrapped
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Your personal listening stats
            </p>
          </div>

          {/* Time Range Toggle */}
          <div className="flex bg-white/5 rounded-full p-1 gap-1">
            {(Object.keys(TIME_LABELS) as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  timeRange === range
                    ? "bg-spotify text-black"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {TIME_LABELS[range]}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="wrapped-section opacity-0 translate-y-8 grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: "Top Artists", value: topArtists.length, icon: Crown, color: "from-yellow-500/20 to-orange-500/20" },
            { label: "Top Tracks", value: topTracks.length, icon: Music, color: "from-spotify/20 to-emerald-500/20" },
            { label: "Genres", value: totalGenres, icon: Disc3, color: "from-purple-500/20 to-pink-500/20" },
            { label: "Top Genre", value: topGenres[0]?.name || "—", icon: TrendingUp, color: "from-blue-500/20 to-cyan-500/20", isText: true },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${stat.color} backdrop-blur-lg border border-white/10 rounded-2xl p-6 flex flex-col gap-3`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <stat.icon className="w-5 h-5 text-white/60" />
              <div>
                <p className={`font-bold text-white font-[family-name:var(--font-outfit)] ${"isText" in stat ? "text-lg capitalize" : "text-3xl"}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Top Artists Section */}
        {topArtists.length > 0 && (
          <div className="wrapped-section opacity-0 translate-y-8 mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 font-[family-name:var(--font-outfit)] flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-400" />
              Top Artists
            </h2>

            {/* Hero Artist (#1) */}
            <div className="relative rounded-3xl overflow-hidden mb-6 group">
              <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={topArtists[0]?.images?.[0]?.url}
                  alt={topArtists[0]?.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
              <div className="relative z-10 p-8 pt-48 md:pt-64">
                <span className="text-spotify text-sm font-bold uppercase tracking-widest">#1 Artist</span>
                <h3 className="text-4xl md:text-6xl font-bold text-white font-[family-name:var(--font-outfit)] mt-2">
                  {topArtists[0]?.name}
                </h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  {topArtists[0]?.genres?.slice(0, 3).map((g) => (
                    <span key={g} className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/70 capitalize">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Artists Grid (#2-#10) */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {topArtists.slice(1, 11).map((artist, idx) => (
                <div
                  key={artist.id}
                  className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  style={{ animationDelay: `${(idx + 1) * 80}ms` }}
                >
                  <div className="relative w-full aspect-square rounded-full overflow-hidden shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={artist.images?.[0]?.url || artist.images?.[1]?.url}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-xs font-bold text-white">
                      {idx + 2}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white text-center line-clamp-1">{artist.name}</p>
                  <p className="text-xs text-muted-foreground text-center line-clamp-1 capitalize">
                    {artist.genres?.[0] || "Artist"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Tracks Section */}
        {topTracks.length > 0 && (
          <div className="wrapped-section opacity-0 translate-y-8 mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 font-[family-name:var(--font-outfit)] flex items-center gap-3">
              <Music className="w-6 h-6 text-spotify" />
              Top Tracks
            </h2>

            <div className="flex flex-col gap-2">
              {topTracks.map((track, idx) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <span className="w-8 text-center text-sm font-bold text-muted-foreground tabular-nums">
                    {idx + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={track.album?.images?.[0]?.url || track.album?.images?.[1]?.url}
                    alt={track.name}
                    className="w-12 h-12 rounded-lg object-cover shadow-md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium line-clamp-1">{track.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                  <p className="hidden md:block text-sm text-muted-foreground line-clamp-1 flex-1">
                    {track.album.name}
                  </p>
                  {/* Popularity bar */}
                  <div className="w-24 hidden md:flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-spotify to-emerald-400"
                        style={{ width: `${Math.max(20, ((topTracks.length - idx) / topTracks.length) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Genre Breakdown */}
        {topGenres.length > 0 && (
          <div className="wrapped-section opacity-0 translate-y-8 mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 font-[family-name:var(--font-outfit)] flex items-center gap-3">
              <Disc3 className="w-6 h-6 text-purple-400" />
              Genre Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Bar Chart */}
              <div className="flex flex-col gap-4">
                {topGenres.map((genre, idx) => {
                  const percentage = (genre.count / maxGenreCount) * 100;
                  const colors = [
                    "from-spotify to-emerald-400",
                    "from-purple-500 to-pink-500",
                    "from-blue-500 to-cyan-400",
                    "from-yellow-500 to-orange-400",
                    "from-red-500 to-rose-400",
                    "from-indigo-500 to-violet-400",
                    "from-teal-500 to-green-400",
                    "from-amber-500 to-yellow-400",
                  ];
                  return (
                    <div key={genre.name} className="flex items-center gap-4">
                      <span className="w-32 text-sm text-white/80 text-right capitalize truncate">
                        {genre.name}
                      </span>
                      <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden">
                        <div
                          className={`h-full rounded-lg bg-gradient-to-r ${colors[idx % colors.length]} flex items-center justify-end pr-3 transition-all duration-1000 ease-out`}
                          style={{ width: `${percentage}%`, transitionDelay: `${idx * 100}ms` }}
                        >
                          <span className="text-xs font-bold text-white/90">{genre.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Donut Chart (CSS) */}
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {topGenres.map((genre, idx) => {
                      const total = topGenres.reduce((sum, g) => sum + g.count, 0);
                      const offset = topGenres
                        .slice(0, idx)
                        .reduce((sum, g) => sum + (g.count / total) * 100, 0);
                      const dashLength = (genre.count / total) * 100;
                      const colors = [
                        "#1db954", "#a855f7", "#3b82f6", "#eab308",
                        "#ef4444", "#6366f1", "#14b8a6", "#f59e0b",
                      ];
                      return (
                        <circle
                          key={genre.name}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke={colors[idx % colors.length]}
                          strokeWidth="12"
                          strokeDasharray={`${dashLength} ${100 - dashLength}`}
                          strokeDashoffset={`${-offset}`}
                          className="transition-all duration-1000"
                          style={{ transitionDelay: `${idx * 150}ms` }}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{totalGenres}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Genres</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS for animation */}
      <style jsx>{`
        .wrapped-section {
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .wrapped-section.animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  );
}
