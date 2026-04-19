const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const VIDEO_DIR = 'C:\\Users\\aloks\\Downloads\\instagram videos';

// Serve video files statically
app.use('/video-file', express.static(VIDEO_DIR));

// Extract video URL from Instagram page
async function getVideoUrl(instagramUrl) {
    try {
        const response = await fetch(instagramUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        const html = await response.text();

        // Patterns to find video URL
        const patterns = [
            /"video_url":"([^"]+)"/,
            /contentUrl":"([^"]+\.mp4[^"]*)/,
            /"playable_url":"([^"]+)"/,
            /"playable_url_quality_hd":"([^"]+)"/,
            /"src":"(https:\/\/[^"]*\.mp4[^"]*)"/,
            /video_versions.*?"url":"([^"]+)"/
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                let url = match[1]
                    .replace(/\\u0026/g, '&')
                    .replace(/\\u002F/g, '/')
                    .replace(/\\/g, '');
                return url;
            }
        }

        // Try embed endpoint
        const embedUrl = instagramUrl.replace('/reel/', '/reel/embed/').replace('/reels/', '/reels/embed/');
        const embedResponse = await fetch(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const embedHtml = await embedResponse.text();

        for (const pattern of patterns) {
            const match = embedHtml.match(pattern);
            if (match && match[1]) {
                let url = match[1]
                    .replace(/\\u0026/g, '&')
                    .replace(/\\u002F/g, '/')
                    .replace(/\\/g, '');
                return url;
            }
        }

        return null;
    } catch (error) {
        console.error('Error extracting video URL:', error);
        return null;
    }
}

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        service: 'Instagram Reel URL Extractor',
        endpoints: {
            extract: 'POST /extract { url: "instagram_reel_url" }',
            batch: 'POST /extract-batch { urls: ["url1", "url2"] }',
            videos: 'GET /videos?limit=10',
            delete: 'POST /delete-videos { filenames: ["vid1.mp4"] }'
        }
    });
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({ running: true });
});

// Extract single video URL
app.post('/extract', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, error: 'URL required' });
        }

        console.log('Extracting:', url);
        const videoUrl = await getVideoUrl(url);

        if (!videoUrl) {
            return res.status(400).json({
                success: false,
                error: 'Could not extract video URL. The reel may be private or require login.'
            });
        }

        res.json({
            success: true,
            videoUrl: videoUrl,
            originalUrl: url
        });

    } catch (error) {
        console.error('Extract error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Extract multiple video URLs
app.post('/extract-batch', async (req, res) => {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
        return res.status(400).json({ success: false, error: 'URLs array required' });
    }

    console.log(`Processing batch of ${urls.length} URLs`);
    const results = [];

    for (const url of urls) {
        try {
            const videoUrl = await getVideoUrl(url);
            results.push({
                originalUrl: url,
                success: !!videoUrl,
                videoUrl: videoUrl || null,
                error: videoUrl ? null : 'Could not extract'
            });
        } catch (error) {
            results.push({
                originalUrl: url,
                success: false,
                error: error.message
            });
        }
    }

    res.json({ success: true, results });
});

// Get local videos
app.get('/videos', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Ensure directory exists
        if (!fs.existsSync(VIDEO_DIR)) {
            console.log(`Directory not found: ${VIDEO_DIR}`);
            return res.json({ success: true, videos: [], error: 'Directory not found' });
        }

        const files = fs.readdirSync(VIDEO_DIR)
            .filter(file => file.toLowerCase().endsWith('.mp4'))
            .map(file => {
                try {
                    const stats = fs.statSync(path.join(VIDEO_DIR, file));
                    return {
                        name: file,
                        path: path.join(VIDEO_DIR, file),
                        created: stats.birthtimeMs
                    };
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean)
            .sort((a, b) => b.created - a.created) // Newest first
            .slice(0, limit);

        res.json({ success: true, videos: files });
    } catch (err) {
        console.error('Error listing videos:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete local videos
app.post('/delete-videos', (req, res) => {
    try {
        const { filenames } = req.body;
        if (!filenames || !Array.isArray(filenames)) {
            return res.status(400).json({ success: false, error: 'Invalid filenames array' });
        }

        console.log(`Deleting ${filenames.length} videos`);
        const results = [];

        for (const file of filenames) {
            const safeFile = path.basename(file);
            const filePath = path.join(VIDEO_DIR, safeFile);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                results.push({ file: safeFile, status: 'deleted' });
            } else {
                results.push({ file: safeFile, status: 'not_found' });
            }
        }

        res.json({ success: true, results });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 3847;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Watching video directory: ${VIDEO_DIR}`);
});
