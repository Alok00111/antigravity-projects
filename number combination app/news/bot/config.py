import os
from dotenv import load_dotenv

load_dotenv()

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Image APIs
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

# RSS Feed Configuration
# Priority 1: High value, core markets (India, US, UK)
# Priority 2: Regional/Continent level
# Priority 3: Niche/Tech/Business specific

RSS_FEEDS = {
    "priority_1": [
        # India - Major Sources
        "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "https://www.thehindu.com/news/national/feeder/default.rss",
        "https://indianexpress.com/section/india/feed/",
        "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
        "https://www.ndtv.com/rss/top-stories",
        "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
        # US - Major Sources
        "http://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
        "https://www.npr.org/rss/rss.php?id=1001",
        "https://feeds.washingtonpost.com/rss/national",
        "https://feeds.nbcnews.com/nbcnews/public/news",
        # UK - Major Sources
        "http://feeds.bbci.co.uk/news/uk/rss.xml",
        "https://www.theguardian.com/uk/rss",
        "https://www.independent.co.uk/news/uk/rss",
        "https://feeds.skynews.com/feeds/rss/uk.xml",
    ],
    "priority_2": [
        # World / Broad
        "http://feeds.bbci.co.uk/news/world/rss.xml",
        "https://www.aljazeera.com/xml/rss/all.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
        "https://www.theguardian.com/world/rss",
        "https://feeds.reuters.com/reuters/topNews",
        "https://www.france24.com/en/rss",
        # Asia
        "http://feeds.bbci.co.uk/news/world/asia/rss.xml",
        "https://www.scmp.com/rss/91/feed", # South China Morning Post
        "https://www3.nhk.or.jp/rss/news/cat0.xml", # NHK Japan
        # Europe
        "http://feeds.bbci.co.uk/news/world/europe/rss.xml",
        "https://www.euronews.com/rss",
        # Middle East
        "http://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
        # Africa
        "http://feeds.bbci.co.uk/news/world/africa/rss.xml",
    ],
    "priority_3": [
        # Tech
        "https://techcrunch.com/feed/",
        "https://www.theverge.com/rss/index.xml",
        "https://www.wired.com/feed/rss",
        "https://arstechnica.com/feed/",
        "https://feeds.feedburner.com/TechCrunch/",
        # Business & Finance
        "https://feeds.bloomberg.com/markets/news.rss",
        "https://www.cnbc.com/id/10000664/device/rss/rss.html",
        "https://feeds.a]ft.com/markets/headlines",
        "https://www.economist.com/rss",
        # Sports
        "https://www.espn.com/espn/rss/news",
        "https://feeds.bbci.co.uk/sport/rss.xml",
        "https://www.skysports.com/rss/12040", # Football
        # Entertainment
        "https://variety.com/feed/",
        "https://www.billboard.com/feed/",
        # Science & Health
        "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml",
        "https://www.sciencedaily.com/rss/all.xml",
    ]
}

# Settings
CHECK_INTERVAL_MINUTES = 15
MAX_SEARCH_DEPTH = 5 # How many entries to check per feed per cycle
MIN_TITLE_LENGTH = 40
MAX_ARTICLE_AGE_HOURS = 12
