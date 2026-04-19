import feedparser
import logging
from config import MAX_SEARCH_DEPTH

logger = logging.getLogger(__name__)

class RSSMonitor:
    def __init__(self):
        pass
        
    def fetch_feed_entries(self, feed_url):
        """
        Fetches entries from a single RSS feed.
        """
        try:
            # logger.info(f"Fetching feed: {feed_url}")
            feed = feedparser.parse(feed_url)
            
            if feed.bozo:
                logger.warning(f"Feed parsing warning for {feed_url}: {feed.bozo_exception}")
                # We often continue even if bozo=1 because it might be just encoding issues
            
            entries = feed.entries[:MAX_SEARCH_DEPTH]
            logger.info(f"Fetched {len(entries)} entries from {feed_url}")
            return entries
            
        except Exception as e:
            logger.error(f"Error fetching feed {feed_url}: {e}")
            return []
