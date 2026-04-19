import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist");
  const title = searchParams.get("title");

  if (!artist || !title) {
    return NextResponse.json(
      { error: "Missing artist or title query parameter" },
      { status: 400 }
    );
  }

  try {
    // Try lyrics.ovh (free, no API key)
    const encodedArtist = encodeURIComponent(artist);
    const encodedTitle = encodeURIComponent(title);
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`,
      { next: { revalidate: 86400 } } // Cache lyrics for 24 hours
    );

    if (res.ok) {
      const data = await res.json();
      if (data.lyrics) {
        return NextResponse.json({ lyrics: data.lyrics });
      }
    }

    // If lyrics.ovh fails, return a friendly message
    return NextResponse.json({
      lyrics: null,
      message: "Lyrics not available for this track.",
    });
  } catch (err: any) {
    console.error("Lyrics API error:", err);
    return NextResponse.json({
      lyrics: null,
      message: "Could not fetch lyrics at this time.",
    });
  }
}
