import time
import logging
import os
from dotenv import load_dotenv
from rss_monitor import RSSMonitor
from breaking_alert import BreakingAlert
from x_poster import XPoster
from config import RSS_FEEDS

# Configure Logging separate from main bot if needed, or share
logging.basicConfig(
    format='%(asctime)s - [BREAKING] - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

load_dotenv()
WEBSITE_URL = os.getenv("WEBSITE_URL", "https://yourwebsite.com")

def run_breaking_loop():
    logger.info("Starting Breaking News Listener (60s cycle)...")
    
    monitor = RSSMonitor()
    alerter = BreakingAlert()
    poster = XPoster()
    
    while True:
        try:
            # Only check Priority 1 feeds
            feeds = RSS_FEEDS.get("priority_1", [])
            
            for feed_url in feeds:
                # We fetch minimal entries for speed
                entries = monitor.fetch_feed_entries(feed_url)
                # Just check top 3 to be fast
                entries = entries[:3]
                
                for entry in entries:
                    if alerter.is_breaking(entry.title, entry):
                        # Reset cache check
                        if alerter.check_and_add_to_cache(entry.link):
                            logger.info(f"🚨 BREAKING DETECTED: {entry.title}")
                            
                            # Construct Tweet
                            tweet = f"🚨 BREAKING: {entry.title}\n\nRead more: {WEBSITE_URL}"
                            
                            # Post
                            poster.post_tweet(tweet)
                        else:
                            # Already processed
                            pass
                            
            time.sleep(60)
            
        except Exception as e:
            logger.error(f"Error in breaking loop: {e}")
            time.sleep(60)

if __name__ == "__main__":
    run_breaking_loop()
