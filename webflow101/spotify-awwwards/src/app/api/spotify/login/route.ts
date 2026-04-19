import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const scope = "streaming user-read-email user-read-private user-top-read";
  const state = Math.random().toString(36).substring(7);

  const requestUrl = new URL(request.url);
  const redirect_uri = process.env.NEXT_PUBLIC_BASE_URL 
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/spotify/callback` 
    : `${requestUrl.origin}/api/spotify/callback`;

  const queryParams = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID || '',
    scope: scope,
    redirect_uri: redirect_uri,
    state: state,
    show_dialog: 'true'
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${queryParams.toString()}`);
}
