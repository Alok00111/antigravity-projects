"use client";

import { usePlayer, TrackData } from "@/context/PlayerContext";
import { Play, Pause } from "lucide-react";

interface TrackRowProps {
  track: TrackData;
  index: number;
  albumName: string;
  durationMs: number;
}

export default function TrackRow({ track, index, albumName, durationMs }: TrackRowProps) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();

  const isCurrentTrack = currentTrack?.id === track.id;

  const handlePlayClick = () => {
    if (isCurrentTrack) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (Number(seconds) < 10 ? "0" : "") + seconds;
  };

  return (
    <div 
      className={`group flex items-center px-4 py-2 rounded-md transition-colors hover:bg-white/10 ${
        isCurrentTrack ? "bg-white/5" : ""
      }`}
      onDoubleClick={handlePlayClick}
    >
      {/* Index or Play icon */}
      <div className="w-10 text-center text-muted-foreground mr-4">
        {isCurrentTrack && isPlaying ? (
          <div className="flex justify-center gap-[2px] h-4">
            <span className="w-1 bg-spotify rounded-sm animate-pulse" style={{ animationDelay: '0s' }} />
            <span className="w-1 bg-spotify rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 bg-spotify rounded-sm animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : (
          <>
            <span className="group-hover:hidden text-sm">{index + 1}</span>
            <button 
              onClick={handlePlayClick}
              className="hidden group-hover:block mx-auto text-white hover:text-spotify transition-colors"
            >
              {isCurrentTrack ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
          </>
        )}
      </div>

      {/* Title & Artist */}
      <div className="flex-1 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={track.image} alt={track.name} className="w-10 h-10 object-cover rounded shadow-sm" />
        <div className="flex flex-col">
          <span className={`font-medium line-clamp-1 ${isCurrentTrack ? "text-spotify" : "text-white"}`}>
            {track.name}
          </span>
          <span className="text-sm text-muted-foreground line-clamp-1 hover:underline cursor-pointer">
            {track.artist}
          </span>
        </div>
      </div>

      {/* Album (Hidden on mobile) */}
      <div className="hidden md:block flex-1 text-sm text-muted-foreground hover:underline cursor-pointer line-clamp-1 px-4">
        {albumName}
      </div>

      {/* Duration */}
      <div className="w-16 flex items-center justify-end text-sm text-muted-foreground tabular-nums opacity-60 group-hover:opacity-100 transition-opacity">
        {formatDuration(durationMs)}
      </div>
    </div>
  );
}
