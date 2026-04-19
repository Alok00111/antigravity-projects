const client_id = "a084c7074102445f830c9e0b7ac15e00";
const client_secret = "636ddf3702474b5395f8573e76449fc2";

async function testSpotify() {
  console.log("Testing token fetch...");
  const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("TOKEN FETCH FAILED:", response.status, text);
      return;
    }

    const data = await response.json();
    console.log("Token obtained successfully! Token:", data.access_token.substring(0, 10) + "...");

    console.log("Testing playlist fetch...");
    const playlistResponse = await fetch("https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    if (!playlistResponse.ok) {
      const text = await playlistResponse.text();
      console.error("PLAYLIST FETCH FAILED:", playlistResponse.status, text);
      return;
    }

    const playlist = await playlistResponse.json();
    console.log("Playlist fetched successfully! Name:", playlist.name, "Total tracks:", playlist.tracks.total);

  } catch (error) {
    console.error("Network or execution error:", error);
  }
}

testSpotify();
