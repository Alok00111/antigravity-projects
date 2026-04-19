"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useEffect, useState, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, VolumeX, MonitorSpeaker } from "lucide-react";

export default function BottomPlayer() {
  const { currentTrack, isPlaying, progress, duration, volume, togglePlayPause, setVolumeLevel, seekTo, spotifyConnected } = usePlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  // Sync visual progress unless the user is dragging the slider
  useEffect(() => {
    if (!isDragging) {
      setLocalProgress((progress / duration) * 100 || 0);
    }
  }, [progress, duration, isDragging]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !currentTrack) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    seekTo(percentage);
    setLocalProgress(percentage);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolumeLevel(parseFloat(e.target.value));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-black border-t border-white/10 z-50 flex items-center justify-between px-4" />
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-black border-t border-white/10 z-50 flex items-center justify-between px-4 pb-safe transition-transform duration-500 translate-y-0">
      
      {/* Left: Track Info */}
      <div className="flex items-center gap-4 w-1/3 min-w-[180px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={currentTrack.image} 
          alt={currentTrack.name} 
          className="w-14 h-14 rounded-md object-cover shadow-lg"
        />
        <div className="overflow-hidden">
          <h4 className="text-sm font-semibold text-white truncate hover:underline cursor-pointer">
            {currentTrack.name}
          </h4>
          <p className="text-xs text-muted-foreground truncate hover:underline cursor-pointer hover:text-white">
            {currentTrack.artist}
          </p>
        </div>
        <button className="text-muted-foreground hover:text-white ml-2 transition-colors">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>
      </div>

      {/* Center: Playback Controls */}
      <div className="flex flex-col items-center justify-center w-1/3 max-w-2xl px-4">
        <div className="flex items-center gap-6 mb-2">
          <button className="text-muted-foreground hover:text-white transition-colors">
            <Shuffle className="w-4 h-4" />
          </button>
          <button className="text-muted-foreground hover:text-white transition-colors">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button 
            onClick={togglePlayPause}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button className="text-muted-foreground hover:text-white transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button className="text-muted-foreground hover:text-white transition-colors">
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 w-full max-w-md group">
          <span className="text-[11px] text-muted-foreground tabular-nums w-10 text-right">
            {formatTime(progress)}
          </span>
          
          <div 
            className="h-1.5 flex-1 bg-white/10 rounded-full cursor-pointer relative"
            ref={progressRef}
            onClick={handleProgressClick}
          >
            <div 
              className="absolute top-0 left-0 h-full rounded-full bg-white group-hover:bg-spotify transition-colors"
              style={{ width: `${localProgress}%` }}
            />
            {/* Grabber visible on hover */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-sm"
              style={{ left: `calc(${localProgress}% - 6px)` }}
            />
          </div>

          <span className="text-[11px] text-muted-foreground tabular-nums w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume & Extra Controls */}
      <div className="flex items-center justify-end gap-3 w-1/3 min-w-[180px]">
        <button className="text-muted-foreground hover:text-white transition-colors">
          <MonitorSpeaker className="w-4 h-4" />
        </button>
        <button 
          className="text-muted-foreground hover:text-white transition-colors"
          onClick={() => setVolumeLevel(volume === 0 ? 0.5 : 0)}
        >
          {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <div className="w-24 group flex items-center">
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-spotify"
          />
        </div>
      </div>
      
    </div>
  );
}
