import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token');
  const refreshToken = cookieStore.get('spotify_refresh_token');

  // If we still have a valid access token, return it
  if (accessToken && accessToken.value) {
    return NextResponse.json({ access_token: accessToken.value });
  }

  // If we have a refresh token but no active access token, refresh it
  if (refreshToken && refreshToken.value) {
    const client_id = process.env.SPOTIFY_CLIENT_ID || '';
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET || '';
    const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken.value
        })
      });

      const data = await response.json();

      if (data.access_token) {
        cookieStore.set('spotify_access_token', data.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: data.expires_in - 60
        });

        if (data.refresh_token) {
          cookieStore.set('spotify_refresh_token', data.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30
          });
        }

        return NextResponse.json({ access_token: data.access_token });
      } else {
        cookieStore.delete('spotify_refresh_token');
        return NextResponse.json({ error: "Invalid refresh token", access_token: null }, { status: 401 });
      }
    } catch (err) {
      console.error("Spotify Token Refresh Error:", err);
      return NextResponse.json({ error: "Failed to refresh token", access_token: null }, { status: 500 });
    }
  }

  // No tokens found
  return NextResponse.json({ access_token: null });
}
