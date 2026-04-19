const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
  // Use Cache-Control headers to prevent Vercel Edge from serving stale responses
  // (do NOT append query params like _cb to the URL — Spotify rejects unknown params)
  const headers = new Headers(options.headers || {});
  headers.set("Cache-Control", "no-cache");
  const patchedOptions = { ...options, headers };

  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, patchedOptions);
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, i) * 1000 + 500;
      console.warn(`[Spotify API] Rate Limited (429). Retrying after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    // If we get a 401, the token has expired — clear cache so next call gets a fresh one
    if (response.status === 401) {
      console.warn(`[Spotify API] Unauthorized (401). Clearing cached token.`);
      cachedToken = null;
      tokenExpiresAt = 0;
    }
    return response;
  }
  return fetch(url, patchedOptions);
};

import { cookies } from "next/headers";

export const getAccessToken = async () => {
  // First, check if the user is logged in via OAuth and has an active token in cookies
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get("spotify_access_token")?.value;
    if (userToken) {
      return { access_token: userToken };
    }
  } catch (e) {
    // Ignore error if this is called outside of a request context
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID || "";
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET || "";
  
  if (!client_id || !client_secret) {
    console.error("SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is missing from environment variables!");
    return { access_token: null, error: "SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is missing. Check Vercel Env Vars." };
  }
  
  // Return in-memory cached token if valid
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return { access_token: cachedToken };
  }
  
  const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

  const response = await fetchWithRetry(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
    next: { revalidate: 3500 }, // Cache token for a bit less than 1 hour
  });
  
  const data = await response.json();
  
  if (!data.access_token) {
    const errText = JSON.stringify(data);
    console.error("Failed to get Spotify access token:", errText);
    return { access_token: null, error: `Failed to get token: ${errText}` };
  } else {
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + 3500 * 1000;
  }
  
  return data;
};

/**
 * Fetches trending/popular tracks via the Search API.
 * Spotify restricted access to editorial playlists (404/403) for client_credentials,
 * so we use search as a reliable alternative.
 */
export const getSpotifyChart = async () => {
  const { access_token, error: tokenError } = await getAccessToken() as any;
  if (!access_token) {
    console.error("getSpotifyChart: No access token available");
    return { error: tokenError || "No access token available" };
  }

  try {
    const params = new URLSearchParams({
      q: "top hits 2026",
      type: "track",
      limit: "20",
      market: "US",
    });
    const url = `https://api.spotify.com/v1/search?${params.toString()}`;
    console.log("getSpotifyChart: Fetching", url);

    const response = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${access_token}` },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("getSpotifyChart: API error", response.status, text);
      return { error: `API error ${response.status}: ${text}` };
    }

    const data = await response.json();
    let tracks = (data.tracks?.items || []).filter(Boolean);
    console.log("getSpotifyChart: Got", tracks.length, "tracks from primary query");

    // Fallback: if primary query returned no results, try a broader query
    if (tracks.length === 0) {
      console.warn("getSpotifyChart: Primary query returned 0 tracks, trying fallback query...");
      const fallbackParams = new URLSearchParams({
        q: "popular music",
        type: "track",
        limit: "20",
        market: "US",
      });
      const fallbackUrl = `https://api.spotify.com/v1/search?${fallbackParams.toString()}`;
      const fallbackRes = await fetchWithRetry(fallbackUrl, {
        headers: { Authorization: `Bearer ${access_token}` },
        next: { revalidate: 3600 },
      });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        tracks = (fallbackData.tracks?.items || []).filter(Boolean);
        console.log("getSpotifyChart: Got", tracks.length, "tracks from fallback query");
      }
    }

    // Transform into the format the web-player page expects
    return {
      name: "Global Top Hits",
      description: "The biggest tracks in the world right now — powered by Spotify.",
      images: tracks.length > 0 ? [{ url: tracks[0]?.album?.images?.[0]?.url }] : [],
      tracks: {
        items: tracks.map((track: any) => ({ track })),
      },
    };
  } catch (err: any) {
    console.error("getSpotifyChart error:", err);
    return { error: `Network exception: ${err?.message || String(err)}` };
  }
};

/**
 * Fetches a specific Spotify playlist by ID
 */
export const getSpotifyPlaylist = async (playlistId: string) => {
  const { access_token } = await getAccessToken();
  if (!access_token) return null;

  const response = await fetchWithRetry(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const text = await response.text();
    console.warn(`Failed to fetch Spotify playlist ${playlistId}:`, response.status, text);
    return null;
  }

  return response.json();
};

/**
 * Search Spotify for tracks, albums, artists
 */
export const searchSpotify = async (query: string, limit = 20) => {
  const { access_token } = await getAccessToken();
  if (!access_token) return null;

  const response = await fetchWithRetry(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,album,artist&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      next: { revalidate: 3600 },
    }
  );

  if (!response.ok) {
    console.warn("Failed to search Spotify:", response.status);
    return null;
  }

  return response.json();
}

/**
 * Fetches popular playlists via Search API (replaces broken browse/featured-playlists)
 */
export const getFeaturedPlaylists = async (limit = 6) => {
  const { access_token } = await getAccessToken();
  if (!access_token) return null;

  try {
    const response = await fetchWithRetry(
      `https://api.spotify.com/v1/search?q=top+hits+2026&type=playlist&limit=${limit}&market=US`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
        next: { revalidate: 3600 },
      }
    );
    if (!response.ok) {
      console.warn("Failed to fetch playlists via search:", response.status);
      return null;
    }
    const data = await response.json();
    return { playlists: data.playlists };
  } catch (err) {
    console.error("getFeaturedPlaylists error:", err);
    return null;
  }
};

/**
 * Fetches new releases via Search API (replaces broken browse/new-releases)
 */
export const getNewReleases = async (limit = 8) => {
  const { access_token } = await getAccessToken();
  if (!access_token) return null;

  try {
    const response = await fetchWithRetry(
      `https://api.spotify.com/v1/search?q=tag%3Anew&type=album&limit=${limit}&market=US`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
        next: { revalidate: 3600 },
      }
    );
    if (!response.ok) {
      console.warn("Failed to fetch new releases via search:", response.status);
      return null;
    }
    const data = await response.json();
    return { albums: data.albums };
  } catch (err) {
    console.error("getNewReleases error:", err);
    return null;
  }
};

