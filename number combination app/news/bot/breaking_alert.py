import json
import os
import logging
from datetime import datetime, timedelta
from dateutil import parser
import time

logger = logging.getLogger(__name__)

BREAKING_KEYWORDS = [
    "breaking", "just in", "live", "killed", "arrested", "explosion", 
    "earthquake", "verdict", "election", "war", "attack", "resigns", 
    "emergency", "banned", "launches", "passes bill", "shots fired",
    "dead", "crash", "assassinated", "coup", "abdicates"
]

CACHE_FILE = "breaking_cache.json"

class BreakingAlert:
    def __init__(self):
        self.cache = self._load_cache()

    def _load_cache(self):
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, 'r') as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}
    
    def _save_cache(self):
        try:
            with open(CACHE_FILE, 'w') as f:
                json.dump(self.cache, f)
        except Exception as e:
            logger.error(f"Error saving cache: {e}")

    def is_breaking(self, title, published_entry):
        """
        Determines if an entry is breaking news.
        """
        # 1. Keyword check
        title_lower = title.lower()
        if not any(k in title_lower for k in BREAKING_KEYWORDS):
            return False
            
        # 2. Time check (Published within last 5 minutes)
        # Note: RSS feeds might have slight delays, so we might need to be flexible e.g. 10 mins
        # But user requested 5 mins.
        try:
            date_str = published_entry.get('published') or published_entry.get('updated')
            if not date_str: return False
            
            if hasattr(published_entry, 'published_parsed') and published_entry.published_parsed:
                 pub_date = datetime.fromtimestamp(time.mktime(published_entry.published_parsed))
            else:
                 pub_date = parser.parse(date_str)
                 if pub_date.tzinfo:
                     pub_date = pub_date.replace(tzinfo=None)

            age = datetime.utcnow() - pub_date
            if age > timedelta(minutes=5):
                # Too old for immediate breaking alert
                return False
                
        except Exception as e:
            logger.warning(f"Date parse error in alert: {e}")
            return False

        return True

    def check_and_add_to_cache(self, url):
        """
        Returns True if URL is new (not in cache).
        Adds to cache if new.
        """
        if url in self.cache:
            return False
            
        # Add to cache with timestamp
        self.cache[url] = datetime.utcnow().timestamp()
        
        # Cleanup old cache (older than 24h)
        now = datetime.utcnow().timestamp()
        keys_to_delete = [k for k, v in self.cache.items() if (now - v) > 86400]
        for k in keys_to_delete:
            del self.cache[k]
            
        self._save_cache()
        return True
