"use client";

import Link from "next/link";
import { Home, Search, Library, PlusSquare, Heart, Bookmark, ArrowLeft, Mic2, BarChart3, Waves } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-black flex-shrink-0 flex flex-col h-full pt-6">
      <div className="px-6 mb-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center transition-transform group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-black">
              <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.573.398-.886.204-2.426-1.483-5.48-1.815-9.07-.993-.338.077-.67-.133-.747-.47-.077-.337.133-.67.47-.747 3.93-.9 7.306-.525 10.027 1.14.316.192.418.59.206.866zm1.2-3.238c-.226.366-.71.482-1.09.248-2.774-1.704-7.005-2.22-9.67-1.214-.413.155-.86-.056-1.015-.468-.155-.413.056-.86.468-1.015 3.12-1.176 7.82-.603 11.06 1.385.38.234.498.724.247 1.064zm.116-3.397C14.542 7.79 8.448 7.587 4.92 8.66c-.496.15-1.017-.13-1.168-.625-.15-.494.13-1.016.626-1.167 4.04-1.225 10.77-1.002 14.773 1.37.45.267.596.86.328 1.31-.266.45-.86.596-1.31.328z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white line-clamp-1">Spotify App</span>
        </Link>
      </div>

      <nav className="px-3">
        <div className="space-y-1 bg-[#121212] p-2 rounded-lg">
          <Link href="/" className="flex items-center gap-4 px-3 py-2.5 text-muted-foreground hover:text-white transition-colors font-semibold">
            <ArrowLeft className="w-6 h-6" />
            Back to Website
          </Link>
          <Link href="/web-player" className="flex items-center gap-4 px-3 py-2.5 text-white bg-white/10 rounded-md transition-colors font-semibold">
            <Home className="w-6 h-6" />
            Home
          </Link>
          <Link href="/web-player/search" className="flex items-center gap-4 px-3 py-2.5 text-muted-foreground hover:text-white transition-colors font-semibold">
            <Search className="w-6 h-6" />
            Search
          </Link>
          <Link href="/web-player/lyrics" className="flex items-center gap-4 px-3 py-2.5 text-muted-foreground hover:text-white transition-colors font-semibold">
            <Mic2 className="w-6 h-6" />
            Lyrics
          </Link>
          <Link href="/web-player/wrapped" className="flex items-center gap-4 px-3 py-2.5 text-muted-foreground hover:text-white transition-colors font-semibold">
            <BarChart3 className="w-6 h-6" />
            Wrapped
          </Link>
          <Link href="/web-player/visualizer" className="flex items-center gap-4 px-3 py-2.5 text-muted-foreground hover:text-white transition-colors font-semibold">
            <Waves className="w-6 h-6" />
            Visualizer
          </Link>
        </div>

        <div className="mt-2 bg-[#121212] rounded-lg p-2 flex-grow flex flex-col h-[calc(100vh-230px)]">
          <div className="flex items-center justify-between px-3 py-2 text-muted-foreground hover:text-white transition-colors cursor-pointer">
            <span className="flex items-center gap-2 font-semibold">
              <Library className="w-6 h-6" />
              Your Library
            </span>
            <PlusSquare className="w-5 h-5 hover:text-white" />
          </div>

          <div className="mt-4 flex gap-2 px-3">
            <span className="px-3 py-1 rounded-full bg-white/10 text-sm hover:bg-white/20 transition-colors cursor-pointer text-white">Playlists</span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-sm hover:bg-white/20 transition-colors cursor-pointer text-white">Albums</span>
          </div>

          {/* Dummy Playlists Box */}
          <div className="mt-4 flex-1 overflow-y-auto overflow-x-hidden space-y-2 px-1 custom-scrollbar">
            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-white/10 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded flex items-center justify-center text-white shadow-lg">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-medium">Liked Songs</span>
                <span className="text-xs text-muted-foreground">Playlist • 134 songs</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-white/10 group cursor-pointer">
              <div className="w-12 h-12 bg-[#006450] rounded flex items-center justify-center text-spotify shadow-lg">
                <Bookmark className="w-5 h-5 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-medium">Your Episodes</span>
                <span className="text-xs text-muted-foreground">Saved & downloaded</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
