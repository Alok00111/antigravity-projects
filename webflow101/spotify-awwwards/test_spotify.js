const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables manually
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const fetchWithRetry = async (url, options, retries = 3) => {
  const headers = new Headers(options.headers || {});
  headers.set("Cache-Control", "no-cache");
  const patchedOptions = { ...options, headers };

  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, patchedOptions);
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, i) * 1000 + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    return response;
  }
  return fetch(url, patchedOptions);
};

const getAccessToken = async () => {
  const client_id = process.env.SPOTIFY_CLIENT_ID || "";
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET || "";
  
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
  });
  
  return response.json();
};

const getSpotifyChart = async () => {
  const { access_token } = await getAccessToken();

  const params = new URLSearchParams({
    q: "top hits 2026",
    type: "track",
    limit: "20",
    market: "US",
  });
  const url = `https://api.spotify.com/v1/search?${params.toString()}`;
  console.log("Fetching", url);

  const response = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Body:", text);
};

getSpotifyChart().catch(console.error);
