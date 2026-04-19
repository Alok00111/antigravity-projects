import time
import logging
from datetime import datetime
from config import RSS_FEEDS, CHECK_INTERVAL_MINUTES
from rss_monitor import RSSMonitor
from extractor import extract_content
from summarizer import Summarizer
from thumbnail import ThumbnailEngine
from database import Database
from utils import get_category, generate_tags, slugify
from filters import is_valid_entry

# Configure Logging
logging.basicConfig(
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    handlers=[
        logging.FileHandler("bot.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def run_bot():
    logger.info("Starting RSS News Bot...")
    
    # Init Modules
    monitor = RSSMonitor()
    summarizer = Summarizer()
    thumb_engine = ThumbnailEngine()
    db = Database()
    
    while True:
        logger.info("Starting new cycle...")
        
        # Process priorities in order
        priority_levels = ["priority_1", "priority_2", "priority_3"]
        
        for level in priority_levels:
            feeds = RSS_FEEDS.get(level, [])
            logger.info(f"Processing {level} ({len(feeds)} feeds)...")
            
            for feed_url in feeds:
                entries = monitor.fetch_feed_entries(feed_url)
                
                for entry in entries:
                    try:
                        # 1. Basic Validation (Date, Title)
                        if not is_valid_entry(entry):
                            continue
                            
                        # 2. Duplicate Check
                        if db.check_url_exists(entry.link):
                            # logger.debug(f"Skipping duplicate: {entry.title}")
                            continue

                        logger.info(f"New article found: {entry.title}")
                        
                        # 3. Extract Content (now returns dict with text and image)
                        extracted = extract_content(entry.link)
                        if not extracted:
                            continue
                        
                        content_text = extracted['text']
                        source_image = extracted.get('image')
                            
                        # 4. Summarize
                        summary = summarizer.summarize(content_text)
                        if not summary:
                            continue
                            
                        # 5. Metadata
                        category = get_category(entry.title, summary)
                        tags = generate_tags(entry.title)
                        slug = slugify(entry.title)
                        
                        # 6. Thumbnail - prefer source image, fallback to stock photo
                        if source_image:
                            thumb_url = source_image
                            logger.info(f"Using source image: {source_image[:50]}...")
                        else:
                            thumb_url = thumb_engine.get_thumbnail(entry.title, category)
                            logger.info(f"Using stock image for: {entry.title[:40]}...")
                        
                        # 7. Save
                        article_data = {
                            "title": entry.title,
                            "slug": slug,
                            "content": summary,
                            "category": category,
                            "tags": tags,
                            "thumbnail_url": thumb_url,
                            "source_url": entry.link,
                            "created_at": datetime.utcnow().isoformat()
                        }
                        
                        db.save_article(article_data)
                        
                    except Exception as e:
                        logger.error(f"Error processing entry {entry.link}: {e}")
                        continue
                        
            # Optional: Sleep between priority groups to avoid throttling?
            # time.sleep(5) 
            
        logger.info(f"Cycle complete. Sleeping for {CHECK_INTERVAL_MINUTES} minutes...")
        time.sleep(CHECK_INTERVAL_MINUTES * 60)

if __name__ == "__main__":
    run_bot()
