# RSS News Automation Bot

This bot monitors RSS feeds from global news sources, extracts content, summarizes it using AI, and saves it to Supabase.

## Features
- **RSS Monitoring**: Tracks feeds from major publishers (BBC, Reuters, Times of India, etc.).
- **Smart Priority**: Prioritizes India, US, and UK news before processing other regions.
- **AI Power**: Uses `t5-small` to summarize articles locally (Free).
- **Clean Extraction**: Removes ads/clutter from news pages.
- **Thumbnails**: Fetches high-res images from Unsplash/Pexels or generates fallbacks.

## Setup

1. **Install Dependencies**
   ```bash
   cd bot
   pip install -r requirements.txt
   ```

2. **Configuration**
   - Copy `.env.example` to `.env` and fill in Supabase details.
   - (Optional) Add Unsplash/Pexels keys for better images.

3. **Database**
   - Ensure Supabase has an `articles` table:
     - `id, title, slug, content, category, tags, thumbnail_url, source_url, created_at`

## Usage

Run the bot:
```bash
python main.py
```

The bot runs in a continuous loop, checking feeds every 15 minutes.

### Breaking News Pipeline (Optional)
To run the fast 60-second alert system for X (Twitter):
```bash
python breaking_main.py
```
*Note: This runs independently of the main article bot. You can run both simultaneously.*

## Customization
Edit `config.py` to add or remove RSS feeds from the `RSS_FEEDS` dictionary.
