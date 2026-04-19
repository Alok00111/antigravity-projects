const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) process.env[k] = envConfig[k];

const c = Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64');

fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + c,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'grant_type=client_credentials'
}).then(r => r.json()).then(async d => {
  for (let l of [1, 5, 8, 10, 15, 20]) {
    const res = await fetch('https://api.spotify.com/v1/search?q=hit&type=track&limit=' + l, {
      headers: {'Authorization': 'Bearer ' + d.access_token}
    });
    console.log(`limit ${l}: status ${res.status}`);
  }
});
