# Instagram Reel Download Server

Node.js server that extracts video URLs from Instagram reels.

## Deploy to Render.com (Free)

1. Go to [render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repo (or use "Deploy from Git URL")
4. Configure:
   - **Name**: `instagram-reel-server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click "Create Web Service"
6. Copy your URL (e.g., `https://instagram-reel-server.onrender.com`)
7. Update the extension with your cloud URL

## Update Extension

After deploying, edit `background/service-worker.js`:

```javascript
const CONFIG = {
    // Change from localhost to your Render URL
    serverUrl: 'https://your-app-name.onrender.com'
};
```

## Local Development

```bash
npm install
npm start
```

Server runs on http://localhost:3847

## API Endpoints

- `GET /` - Health check
- `GET /status` - Server status
- `POST /extract` - Extract single video URL
- `POST /extract-batch` - Extract multiple video URLs
