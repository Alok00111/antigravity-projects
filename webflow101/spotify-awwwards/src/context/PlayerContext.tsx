"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

export interface TrackData {
  id: string;
  name: string;
  artist: string;
  image: string;
  previewUrl: string | null;
  spotifyUri?: string; // e.g. "spotify:track:4cOdK2wGLETKBW3PvgPWqT"
}

interface PlayerContextType {
  currentTrack: TrackData | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  spotifyConnected: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playTrack: (track: TrackData) => void;
  togglePlayPause: () => void;
  setVolumeLevel: (vol: number) => void;
  seekTo: (percentage: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(30);
  const [volume, setVolume] = useState(0.5);
  const [isFallbackPlayback, setIsFallbackPlayback] = useState(false);

  // Spotify SDK state
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [spotifyDeviceId, setSpotifyDeviceId] = useState<string | null>(null);
  const spotifyPlayerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback HTML5 audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── 1. Fetch the user's Spotify access token ───
  useEffect(() => {
    fetch('/api/spotify/token')
      .then(res => res.json())
      .then(data => {
        if (data.access_token) {
          setSpotifyToken(data.access_token);
          setSpotifyConnected(true);
        }
      })
      .catch(() => {});
  }, []);

  // ─── 2. Load the Spotify Web Playback SDK script ───
  useEffect(() => {
    if (!spotifyToken) return;

    // Define the global callback Spotify's SDK will call
    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      const player = new (window as any).Spotify.Player({
        name: "Spotify Awwwards Player",
        getOAuthToken: (cb: (token: string) => void) => {
          // Re-fetch token in case it expired
          fetch('/api/spotify/token')
            .then(res => res.json())
            .then(data => {
              if (data.access_token) {
                cb(data.access_token);
              }
            })
            .catch(() => cb(spotifyToken));
        },
        volume: volume,
      });

      // Ready
      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("🎵 Spotify Player Ready with Device ID:", device_id);
        setSpotifyDeviceId(device_id);
      });

      // Not Ready
      player.addListener("not_ready", ({ device_id }: { device_id: string }) => {
        console.warn("Spotify Player not ready, device_id:", device_id);
      });

      // Player state changed
      player.addListener("player_state_changed", (state: any) => {
        if (!state) return;
        const track = state.track_window?.current_track;
        if (track) {
          setCurrentTrack({
            id: track.id,
            name: track.name,
            artist: track.artists.map((a: any) => a.name).join(", "),
            image: track.album?.images?.[0]?.url || "",
            previewUrl: null,
            spotifyUri: track.uri,
          });
          setDuration(state.duration / 1000);
          setProgress(state.position / 1000);
        }
        setIsPlaying(!state.paused);
      });

      // Error listeners
      player.addListener("initialization_error", ({ message }: { message: string }) => console.error("Init Error:", message));
      player.addListener("authentication_error", ({ message }: { message: string }) => {
        console.error("Auth Error:", message);
        setSpotifyConnected(false);
      });
      player.addListener("account_error", ({ message }: { message: string }) => console.error("Account Error:", message));

      player.connect();
      spotifyPlayerRef.current = player;
    };

    // Load SDK script if not already loaded
    if (!document.getElementById("spotify-sdk-script")) {
      const script = document.createElement("script");
      script.id = "spotify-sdk-script";
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      if (spotifyPlayerRef.current) {
        spotifyPlayerRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyToken]);

  // ─── 3. Progress tracking for Spotify SDK ───
  useEffect(() => {
    if (spotifyConnected && isPlaying && spotifyPlayerRef.current) {
      progressIntervalRef.current = setInterval(() => {
        spotifyPlayerRef.current.getCurrentState().then((state: any) => {
          if (state) {
            setProgress(state.position / 1000);
          }
        });
      }, 500);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [spotifyConnected, isPlaying]);

  // ─── 4. HTML5 Audio fallback setup ───
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Play Track (dual-mode) ───
  const playTrack = useCallback(async (track: TrackData) => {
    // MODE 1: Spotify Premium SDK
    if (spotifyConnected && spotifyDeviceId && spotifyToken) {
      // If clicking the same track, just toggle
      if (currentTrack?.id === track.id) {
        togglePlayPause();
        return;
      }

      setCurrentTrack(track);
      const spotifyUri = track.spotifyUri || `spotify:track:${track.id}`;

      try {
        // Get a fresh token
        const tokenRes = await fetch('/api/spotify/token');
        const tokenData = await tokenRes.json();
        const token = tokenData.access_token || spotifyToken;

        const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: [spotifyUri] }),
        });

        if (res.ok || res.status === 204) {
          setIsFallbackPlayback(false);
          setIsPlaying(true);
        } else {
          const errText = await res.text();
          console.warn("Spotify play failed, falling back to iTunes:", res.status, errText);
          setIsFallbackPlayback(true);
          await playWithFallback(track);
        }
      } catch (err) {
        console.error("Spotify SDK play error:", err);
        setIsFallbackPlayback(true);
        await playWithFallback(track);
      }
      return;
    }

    // MODE 2: iTunes preview fallback
    setIsFallbackPlayback(true);
    await playWithFallback(track);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyConnected, spotifyDeviceId, spotifyToken, currentTrack]);

  // ─── iTunes Fallback ───
  const playWithFallback = async (track: TrackData) => {
    if (!audioRef.current) return;

    // Stop any existing Spotify SDK playback
    if (spotifyPlayerRef.current) {
      try { spotifyPlayerRef.current.pause(); } catch {}
    }

    // If same track, toggle
    if (currentTrack?.id === track.id && currentTrack.previewUrl) {
      togglePlayPauseAudio();
      return;
    }

    let finalPreviewUrl = track.previewUrl;

    // Fetch from iTunes if missing
    if (!finalPreviewUrl) {
      try {
        const query = encodeURIComponent(`${track.name} ${track.artist}`);
        const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
        const data = await res.json();
        if (data.results?.length > 0 && data.results[0].previewUrl) {
          finalPreviewUrl = data.results[0].previewUrl;
        }
      } catch (err) {
        console.error("iTunes fallback failed:", err);
      }
    }

    const updatedTrack = { ...track, previewUrl: finalPreviewUrl || null };
    setCurrentTrack(updatedTrack);

    if (!finalPreviewUrl) {
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
      return;
    }

    audioRef.current.src = finalPreviewUrl;
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(err => console.error("Playback failed:", err));
  };

  // ─── Toggle Play/Pause ───
  const togglePlayPause = useCallback(() => {
    if (spotifyConnected && spotifyPlayerRef.current && !isFallbackPlayback) {
      spotifyPlayerRef.current.togglePlay();
      return;
    }
    togglePlayPauseAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyConnected, isPlaying, currentTrack, isFallbackPlayback]);

  const togglePlayPauseAudio = () => {
    if (!audioRef.current || !currentTrack || !currentTrack.previewUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.error("Playback failed:", err));
    }
  };

  // ─── Volume ───
  const setVolumeLevel = useCallback((vol: number) => {
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    if (spotifyPlayerRef.current) {
      spotifyPlayerRef.current.setVolume(vol);
    }
  }, []);

  // ─── Seek ───
  const seekTo = useCallback((percentage: number) => {
    if (spotifyConnected && spotifyPlayerRef.current && !isFallbackPlayback) {
      const positionMs = (percentage / 100) * duration * 1000;
      spotifyPlayerRef.current.seek(positionMs);
      setProgress((percentage / 100) * duration);
      return;
    }
    if (!audioRef.current) return;
    const newTime = (percentage / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  }, [spotifyConnected, duration]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        spotifyConnected,
        audioRef,
        playTrack,
        togglePlayPause,
        setVolumeLevel,
        seekTo,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
