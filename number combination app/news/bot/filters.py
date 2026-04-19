from datetime import datetime, timedelta
from dateutil import parser
import logging
from config import MIN_TITLE_LENGTH, MAX_ARTICLE_AGE_HOURS

logger = logging.getLogger(__name__)

def is_valid_entry(entry):
    """
    Validates an RSS entry based on age and title length.
    Note: Database duplication check is done separately to avoid DB calls for obviously invalid items.
    """
    
    # 1. Title Length
    if len(entry.title) < MIN_TITLE_LENGTH:
        # logger.debug(f"Skipping: Title too short ({len(entry.title)} chars)")
        return False

    # 2. Age Check
    # RSS feeds usually have 'published', 'updated', or 'pubDate'
    date_str = entry.get('published') or entry.get('updated') or entry.get('pubDate')
    
    if date_str:
        try:
            # Parse date (feedparser usually returns a struct_time, but sometimes raw string)
            # If entry has parsed date structure from feedparser
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                pub_date = datetime.fromtimestamp(time.mktime(entry.published_parsed))
            else:
                # Fallback to dateutil parser
                pub_date = parser.parse(date_str)
                # Ensure offset-naive for comparison (or make both aware)
                if pub_date.tzinfo:
                    pub_date = pub_date.replace(tzinfo=None) # Simplification for now

            age = datetime.utcnow() - pub_date
            if age > timedelta(hours=MAX_ARTICLE_AGE_HOURS):
                # logger.debug(f"Skipping: Too old ({age})")
                return False
                
        except Exception as e:
            # If we can't parse date, we might accept it to be safe, or reject. 
            # Let's log and accept for now, assuming feed is recent.
            logger.warning(f"Could not parse date for {entry.link}: {e}")
            pass

    return True

import time
