import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function getUserToken() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("spotify_access_token");
  const refreshToken = cookieStore.get("spotify_refresh_token");

  if (accessToken?.value) return accessToken.value;

  // Try refreshing
  if (refreshToken?.value) {
    const client_id = process.env.SPOTIFY_CLIENT_ID || "";
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET || "";
    const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken.value,
      }),
    });

    const data = await res.json();
    if (data.access_token) {
      cookieStore.set("spotify_access_token", data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: data.expires_in - 60,
      });
      return data.access_token;
    }
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get("time_range") || "medium_term";

  const token = await getUserToken();
  if (!token) {
    return NextResponse.json(
      { error: "Not authenticated. Please connect your Spotify account." },
      { status: 401 }
    );
  }

  try {
    // Fetch top artists and top tracks in parallel
    const [artistsRes, tracksRes] = await Promise.all([
      fetch(
        `https://api.spotify.com/v1/me/top/artists?limit=20&time_range=${timeRange}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      fetch(
        `https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=${timeRange}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    ]);

    if (!artistsRes.ok || !tracksRes.ok) {
      const errText = await artistsRes.text();
      console.error("Top items API error:", artistsRes.status, errText);
      return NextResponse.json(
        { error: `Spotify API error: ${artistsRes.status}` },
        { status: artistsRes.status }
      );
    }

    const [artistsData, tracksData] = await Promise.all([
      artistsRes.json(),
      tracksRes.json(),
    ]);

    // Extract genre breakdown from top artists
    const genreCount: Record<string, number> = {};
    (artistsData.items || []).forEach((artist: any) => {
      (artist.genres || []).forEach((genre: string) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    // Sort genres by count, take top 8
    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      topArtists: artistsData.items || [],
      topTracks: tracksData.items || [],
      topGenres,
      timeRange,
    });
  } catch (err: any) {
    console.error("Top items fetch error:", err);
    return NextResponse.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    );
  }
}
