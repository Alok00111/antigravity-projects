import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/?error=spotify_auth_failed', request.url));
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID || '';
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET || '';
  const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
  
  const requestUrl = new URL(request.url);
  const redirect_uri = process.env.NEXT_PUBLIC_BASE_URL 
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/spotify/callback` 
    : `${requestUrl.origin}/api/spotify/callback`;

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        redirect_uri,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();

    if (data.access_token && data.refresh_token) {
      const cookieStore = await cookies();
      cookieStore.set('spotify_refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });
      
      cookieStore.set('spotify_access_token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.expires_in - 60
      });

      return NextResponse.redirect(new URL('/web-player', request.url));
    } else {
      console.error("Spotify Auth Callback Error:", data);
      return NextResponse.redirect(new URL('/?error=spotify_auth_failed', request.url));
    }
  } catch (err) {
    console.error("Spotify Auth Final Fetch Error:", err);
    return NextResponse.redirect(new URL('/?error=spotify_auth_failed', request.url));
  }
}
