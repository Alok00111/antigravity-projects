"""
Enhanced Multi-Source Thumbnail Engine with Smart Keyword Extraction
Searches multiple image APIs for the most relevant, high-quality, logo-free images.
Priority: Google (if available) → Pexels → Pixabay → Unsplash
"""
import requests
import re
import logging
from config import UNSPLASH_ACCESS_KEY, PEXELS_API_KEY
import os

logger = logging.getLogger(__name__)

# Common words to ignore when extracting search keywords
STOP_WORDS = {
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of',
    'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into',
    'over', 'after', 'and', 'but', 'or', 'so', 'yet', 'just', 'also', 'now',
    'says', 'said', 'new', 'top', 'latest', 'breaking', 'update', 'news',
    'amid', 'among', 'between', 'during', 'before', 'after', 'while',
    'this', 'that', 'what', 'which', 'who', 'whom', 'check', 'get', 'how',
    '2026', '2025', '2024', '2023', 'year', 'years', 'day', 'days', 'time', 'week',
    'pc', 'rs', 'crore', 'lakh', 'why', 'here', 'there', 'more', 'most',
    'announces', 'announced', 'reports', 'reported', 'launches', 'launched',
    'first', 'second', 'third', 'last', 'next', 'every', 'all', 'some',
    'key', 'know', 'things', 'thing', 'way', 'ways', 'make', 'makes',
    'per', 'cent', 'percent', 'due', 'set', 'likely', 'expected', 'soon',
    'today', 'tomorrow', 'yesterday', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday', 'sunday', 'january', 'february'
}

# Visual-focused topic mappings - what images look like, not abstract concepts
TOPIC_MAPPINGS = {
    # ============ PEOPLE - Politicians ============
    'trump': 'american president podium microphone flag',
    'biden': 'american president podium white house',
    'modi': 'indian prime minister speech parliament india',
    'rahul gandhi': 'indian politician speech rally crowd',
    'putin': 'russia president kremlin government',
    'xi jinping': 'china president beijing government',
    'zelensky': 'ukraine president government military',
    'netanyahu': 'israel prime minister government',
    'rishi sunak': 'british prime minister london parliament',
    'macron': 'france president paris elysee',
    
    # ============ POLITICS - India ============
    'bjp': 'india election rally crowd saffron flags',
    'congress party': 'india election rally crowd politics',
    'lok sabha': 'indian parliament interior session politicians',
    'rajya sabha': 'indian parliament interior session',
    'supreme court india': 'indian supreme court building justice',
    'election commission': 'voting ballot box india election',
    'budget 2026': 'indian parliament finance minister briefcase',
    'union budget': 'indian parliament finance minister briefcase',
    
    # ============ POLITICS - World ============
    'white house': 'white house building washington dc',
    'senate': 'us senate capitol building washington',
    'pentagon': 'pentagon building military usa',
    'nato': 'nato flags meeting diplomats',
    'united nations': 'united nations building flags diplomats',
    'european union': 'european union flags brussels parliament',
    'brexit': 'uk european flags parliament london',
    
    # ============ SPORTS - Cricket ============
    'cricket': 'cricket player batting stadium match',
    'ipl': 'ipl cricket stadium colorful night match',
    'test match': 'cricket test match players stadium',
    't20': 'cricket t20 match stadium night lights',
    'virat kohli': 'cricket player batting stadium india',
    'rohit sharma': 'cricket player batting stadium india',
    'bcci': 'cricket stadium india match',
    'world cup cricket': 'cricket world cup trophy celebration',
    
    # ============ SPORTS - Other ============
    'football': 'football soccer players stadium match',
    'fifa': 'fifa football world cup trophy stadium',
    'premier league': 'football soccer stadium england match',
    'champions league': 'football soccer stadium night europe',
    'tennis': 'tennis player court racket match',
    'wimbledon': 'wimbledon tennis grass court match',
    'olympics': 'olympic rings athletes medals ceremony',
    'badminton': 'badminton player shuttlecock court',
    'hockey': 'field hockey players stadium match',
    'boxing': 'boxing ring boxers fight match',
    'wrestling': 'wrestling match athletes mat',
    'marathon': 'marathon runners city street race',
    'formula 1': 'formula one race car track speed',
    'f1': 'formula one race car track speed',
    
    # ============ TECHNOLOGY ============
    'apple': 'apple iphone macbook technology products',
    'iphone': 'iphone smartphone apple technology',
    'samsung': 'samsung smartphone technology android',
    'google': 'google office technology colorful modern',
    'microsoft': 'microsoft office technology computer',
    'amazon': 'amazon warehouse packages delivery boxes',
    'meta': 'virtual reality headset technology metaverse',
    'facebook': 'social media smartphone app technology',
    'instagram': 'social media smartphone photo app',
    'twitter': 'social media smartphone app technology',
    'whatsapp': 'messaging app smartphone communication',
    'ai': 'artificial intelligence robot technology futuristic',
    'artificial intelligence': 'ai robot circuit board technology futuristic',
    'chatgpt': 'artificial intelligence chat robot technology',
    'openai': 'artificial intelligence robot technology future',
    'cyber': 'cybersecurity hacker computer code security',
    'hack': 'cybersecurity hacker computer dark code',
    'data breach': 'cybersecurity lock digital security warning',
    'startup': 'startup office modern workspace technology',
    '5g': 'mobile network tower technology communication',
    'smartphone': 'smartphone mobile phone technology hand',
    'laptop': 'laptop computer technology workspace office',
    'ev': 'electric vehicle car charging station green',
    'electric vehicle': 'electric car charging station modern',
    'tesla': 'tesla electric car modern technology',
    
    # ============ BUSINESS & FINANCE ============
    'stock market': 'stock market trading graph screen finance',
    'sensex': 'stock market india trading screen graph',
    'nifty': 'stock market india trading screen graph',
    'share price': 'stock market graph trading screen',
    'ipo': 'stock exchange bell ceremony business',
    'gold price': 'gold bars bullion investment wealth',
    'rupee': 'indian rupee currency money coins',
    'dollar': 'us dollar bills money currency',
    'bitcoin': 'bitcoin cryptocurrency digital gold coin',
    'crypto': 'cryptocurrency bitcoin digital coins technology',
    'inflation': 'shopping cart prices supermarket expensive',
    'interest rate': 'bank building finance money percent',
    'rbi': 'reserve bank india building mumbai finance',
    'federal reserve': 'federal reserve bank building usa',
    'recession': 'economy graph declining business worry',
    'gdp': 'economy growth chart business statistics',
    'tax': 'tax documents calculator money paperwork',
    'gst': 'tax invoice receipt business india',
    'income tax': 'tax forms calculator money documents',
    
    # ============ INFRASTRUCTURE ============
    'railway': 'indian railway train station platform',
    'train': 'train railway station platform passengers',
    'metro': 'metro train underground station urban',
    'airport': 'airport terminal airplane travel passengers',
    'flight': 'airplane sky flying travel aviation',
    'highway': 'highway expressway road cars driving',
    'bridge': 'bridge infrastructure architecture engineering',
    'dam': 'dam water reservoir hydroelectric infrastructure',
    'port': 'shipping port containers cargo ships',
    
    # ============ ENTERTAINMENT ============
    'grammy': 'grammy awards music trophy red carpet celebrity',
    'oscar': 'oscar academy awards hollywood red carpet trophy',
    'golden globe': 'golden globe awards red carpet hollywood',
    'bollywood': 'bollywood film set camera actors india',
    'hollywood': 'hollywood sign cinema film premiere',
    'netflix': 'streaming television screen entertainment',
    'movie': 'cinema movie theater screen popcorn',
    'film': 'film set camera director production',
    'concert': 'music concert stage lights crowd performance',
    'music': 'music performance stage instruments singer',
    'album': 'music studio recording headphones microphone',
    'actress': 'actress red carpet glamour celebrity',
    'actor': 'actor red carpet celebrity entertainment',
    
    # ============ HEALTH & MEDICINE ============
    'covid': 'covid vaccine hospital medical healthcare',
    'coronavirus': 'coronavirus vaccine hospital medical mask',
    'vaccine': 'vaccine injection syringe medical healthcare',
    'hospital': 'hospital medical healthcare doctor nurse',
    'doctor': 'doctor medical stethoscope healthcare professional',
    'cancer': 'medical research laboratory healthcare doctor',
    'heart': 'heart health medical healthcare doctor',
    'diabetes': 'diabetes health medical glucose healthcare',
    'medicine': 'medicine pills pharmacy healthcare',
    'who': 'world health organization medical healthcare global',
    'disease': 'medical healthcare hospital laboratory',
    
    # ============ ENVIRONMENT & NATURE ============
    'climate': 'climate change earth environment nature',
    'global warming': 'climate change earth temperature environment',
    'pollution': 'pollution smoke factory environment city',
    'flood': 'flood water disaster emergency rescue',
    'earthquake': 'earthquake destruction rubble disaster rescue',
    'cyclone': 'cyclone storm weather disaster emergency',
    'hurricane': 'hurricane storm weather disaster destruction',
    'wildfire': 'wildfire forest fire flames smoke',
    'drought': 'drought dry land cracked earth water',
    'tiger': 'bengal tiger wildlife forest nature india',
    'elephant': 'elephant wildlife nature forest africa',
    'forest': 'forest trees green nature wildlife',
    'ocean': 'ocean sea water blue waves nature',
    'mountain': 'mountain peaks snow landscape nature',
    
    # ============ CRIME & SECURITY ============
    'police': 'police officer law enforcement security uniform',
    'arrest': 'police arrest handcuffs law enforcement',
    'court': 'courtroom judge gavel law justice trial',
    'jail': 'prison bars jail criminal justice',
    'crime': 'police crime scene investigation law',
    'murder': 'crime scene police investigation yellow tape',
    'terror': 'security military police emergency',
    'bomb': 'security police emergency military bomb squad',
    'robbery': 'police crime investigation security',
    'fraud': 'fraud money crime documents investigation',
    
    # ============ MILITARY & DEFENSE ============
    'army': 'army soldiers military camouflage weapons',
    'navy': 'navy warship ocean military defense',
    'air force': 'fighter jet military airplane sky',
    'missile': 'missile military defense weapon launch',
    'war': 'military soldiers war conflict battlefield',
    'israel': 'israel flag jerusalem military conflict',
    'gaza': 'gaza conflict military humanitarian crisis',
    'ukraine': 'ukraine conflict military soldiers war',
    'russia war': 'military conflict tanks soldiers war',
    
    # ============ EDUCATION ============
    'university': 'university campus students education college',
    'college': 'college campus students education classrooms',
    'school': 'school classroom students teacher education',
    'exam': 'students exam test classroom education',
    'jee': 'students exam test education india',
    'neet': 'medical students exam education india',
    'upsc': 'government exam students preparation india',
    
    # ============ RELIGION ============
    'temple': 'hindu temple architecture india worship religious',
    'mosque': 'mosque islam architecture worship dome minaret',
    'church': 'church christian architecture worship cathedral',
    'gurudwara': 'sikh gurudwara golden architecture worship',
    'diwali': 'diwali festival lights lamps india celebration',
    'holi': 'holi festival colors india celebration joy',
    'eid': 'eid muslim festival mosque celebration',
    'christmas': 'christmas celebration tree gifts decoration',
    'ayodhya': 'ram temple ayodhya india hindu architecture',
    
    # ============ LOCATIONS - India ============
    'delhi': 'delhi india gate monument city capital',
    'mumbai': 'mumbai gateway india skyline city marine drive',
    'bangalore': 'bangalore tech city india modern buildings',
    'chennai': 'chennai marina beach city buildings india',
    'kolkata': 'kolkata howrah bridge victoria memorial india',
    'hyderabad': 'hyderabad charminar city monument india',
    'kerala': 'kerala backwaters boats nature green india',
    'kashmir': 'kashmir mountains valley scenic nature india',
    'goa': 'goa beach sunset palm trees india tourism',
    
    # ============ LOCATIONS - World ============
    'washington': 'washington dc white house capitol usa government',
    'london': 'london big ben parliament bridge uk england',
    'paris': 'paris eiffel tower france city romantic',
    'beijing': 'beijing china forbidden city architecture great wall',
    'moscow': 'moscow kremlin russia red square architecture',
    'tokyo': 'tokyo skyline japan city modern night',
    'dubai': 'dubai burj khalifa skyline modern architecture',
}

# Category to visual scene mapping
CATEGORY_VISUALS = {
    'India': 'india landmark city culture tricolor',
    'World': 'world globe international earth flags',
    'Tech': 'technology gadgets digital modern innovation',
    'Business': 'business office corporate meeting professional',
    'Sports': 'sports stadium athletes competition victory',
    'Entertainment': 'entertainment stage performance celebrity glamour',
    'Health': 'health medical doctor hospital healthcare',
    'Trending': 'trending viral popular social media news'
}

# File to track daily Google API usage
GOOGLE_USAGE_FILE = os.path.join(os.path.dirname(__file__), '.google_usage.json')
GOOGLE_DAILY_LIMIT = 100


class ThumbnailEngine:
    def __init__(self):
        self.unsplash_key = UNSPLASH_ACCESS_KEY
        self.pexels_key = PEXELS_API_KEY
        self.pixabay_key = os.getenv('PIXABAY_API_KEY')
        self.google_api_key = os.getenv('GOOGLE_API_KEY')
        self.google_cx = os.getenv('GOOGLE_CX')
        self.google_usage = self._load_google_usage()
        
    def _load_google_usage(self):
        """Load Google API usage from file."""
        import json
        from datetime import date
        try:
            if os.path.exists(GOOGLE_USAGE_FILE):
                with open(GOOGLE_USAGE_FILE, 'r') as f:
                    data = json.load(f)
                    if data.get('date') != str(date.today()):
                        return {'date': str(date.today()), 'count': 0}
                    return data
        except:
            pass
        return {'date': str(date.today()), 'count': 0}
    
    def _save_google_usage(self):
        """Save Google API usage to file."""
        import json
        try:
            with open(GOOGLE_USAGE_FILE, 'w') as f:
                json.dump(self.google_usage, f)
        except:
            pass
    
    def _can_use_google(self):
        """Check if we can still use Google API today."""
        from datetime import date
        if self.google_usage.get('date') != str(date.today()):
            self.google_usage = {'date': str(date.today()), 'count': 0}
        return self.google_usage['count'] < GOOGLE_DAILY_LIMIT
    
    def _increment_google_usage(self):
        """Increment Google API usage counter."""
        self.google_usage['count'] += 1
        self._save_google_usage()
        remaining = GOOGLE_DAILY_LIMIT - self.google_usage['count']
        logger.info(f"Google API: {self.google_usage['count']}/{GOOGLE_DAILY_LIMIT} ({remaining} left)")
        
    def get_thumbnail(self, title, category):
        """
        Get the best thumbnail from multiple sources.
        Uses smart keyword extraction for maximum relevance.
        """
        # Extract smart search query with multiple fallback options
        search_queries = self._extract_search_queries(title, category)
        
        for query in search_queries:
            logger.info(f"Searching for: '{query}'")
            
            # Try each source in priority order
            url = None
            
            # 1. Google (if configured and within limit)
            if self._can_use_google() and self.google_api_key and self.google_cx:
                url = self.search_google(query)
                if url:
                    self._increment_google_usage()
                    logger.info(f"Found on Google")
                    return url
            
            # 2. Pexels (20k/month limit)
            url = self.search_pexels(query)
            if url:
                logger.info(f"Found on Pexels")
                return url
            
            # 3. Pixabay
            url = self.search_pixabay(query)
            if url:
                logger.info(f"Found on Pixabay")
                return url
            
            # 4. Unsplash (50/hour limit)
            url = self.search_unsplash(query)
            if url:
                logger.info(f"Found on Unsplash")
                return url
        
        # Last resort - use category-specific placeholder
        logger.warning(f"No image found for: {title[:50]}")
        return self._get_category_placeholder(category)
    
    def _extract_search_queries(self, title, category):
        """
        Extract multiple search queries from title, ordered by relevance.
        Returns a list of queries to try.
        """
        queries = []
        title_lower = title.lower()
        
        # 1. Check for exact topic mappings (highest relevance)
        matched_topic = None
        for topic, search_terms in TOPIC_MAPPINGS.items():
            if topic in title_lower:
                matched_topic = search_terms
                break
        
        if matched_topic:
            queries.append(matched_topic)
        
        # 2. Build a custom query from important words in title
        custom_query = self._build_custom_query(title, category)
        if custom_query and custom_query not in queries:
            queries.append(custom_query)
        
        # 3. Simple keyword extraction query
        simple_query = self._extract_simple_keywords(title)
        if simple_query and simple_query not in queries:
            queries.append(simple_query)
        
        # 4. Category fallback
        category_query = CATEGORY_VISUALS.get(category, 'news headline media')
        if category_query not in queries:
            queries.append(category_query)
        
        return queries[:3]  # Return at most 3 queries to try
    
    def _build_custom_query(self, title, category):
        """
        Build a custom search query by extracting key entities and concepts.
        Focuses on visual/photographable elements.
        """
        title_lower = title.lower()
        
        # Extract proper nouns (words starting with capital letters)
        proper_nouns = re.findall(r'\b[A-Z][a-z]{2,}\b', title)
        
        # Extract key visual concepts based on category
        visual_hints = []
        
        if category == 'Sports':
            visual_hints = ['stadium', 'match', 'players', 'athletic']
        elif category == 'Tech':
            visual_hints = ['technology', 'digital', 'modern', 'device']
        elif category == 'Business':
            visual_hints = ['business', 'corporate', 'office', 'professional']
        elif category == 'Entertainment':
            visual_hints = ['celebrity', 'stage', 'performance', 'red carpet']
        elif category == 'Health':
            visual_hints = ['medical', 'healthcare', 'hospital', 'doctor']
        elif category == 'India':
            visual_hints = ['india', 'indian', 'delhi', 'new delhi']
        elif category == 'World':
            visual_hints = ['international', 'global', 'diplomacy', 'world']
        
        # Combine proper nouns with visual hints
        query_parts = []
        
        # Add first 2 proper nouns
        for noun in proper_nouns[:2]:
            if noun.lower() not in STOP_WORDS and len(noun) > 2:
                query_parts.append(noun.lower())
        
        # Add 1-2 visual hints
        query_parts.extend(visual_hints[:2])
        
        if len(query_parts) >= 2:
            return ' '.join(query_parts[:4])
        
        return None
    
    def _extract_simple_keywords(self, title):
        """Extract simple keywords from title."""
        clean_title = re.sub(r'[^\w\s]', ' ', title.lower())
        words = clean_title.split()
        
        # Filter and get meaningful keywords
        keywords = [w for w in words if w not in STOP_WORDS and len(w) > 3]
        
        if len(keywords) >= 2:
            return ' '.join(keywords[:3])
        
        return None
    
    def _get_category_placeholder(self, category):
        """Get a reliable placeholder image for the category."""
        placeholders = {
            'India': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200',  # India Gate
            'World': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',  # World globe
            'Tech': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',  # Technology
            'Business': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200',  # Business
            'Sports': 'https://images.unsplash.com/photo-1461896836934- voices1a?w=1200',  # Sports
            'Entertainment': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',  # Entertainment
            'Health': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200',  # Health
            'Trending': 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200',  # News
        }
        return placeholders.get(category, placeholders['Trending'])
    
    def search_unsplash(self, query):
        """Search Unsplash for high-quality images."""
        if not self.unsplash_key:
            return None
        try:
            url = f"https://api.unsplash.com/search/photos?query={query}&client_id={self.unsplash_key}&per_page=3&orientation=landscape"
            res = requests.get(url, timeout=5).json()
            
            if res.get('results'):
                for photo in res['results']:
                    img_url = photo['urls'].get('regular')
                    if img_url:
                        return img_url
        except Exception as e:
            logger.error(f"Unsplash error: {e}")
        return None
    
    def search_pexels(self, query):
        """Search Pexels for royalty-free images."""
        if not self.pexels_key:
            return None
        try:
            headers = {'Authorization': self.pexels_key}
            url = f"https://api.pexels.com/v1/search?query={query}&per_page=3&orientation=landscape"
            res = requests.get(url, headers=headers, timeout=5).json()
            
            if res.get('photos'):
                for photo in res['photos']:
                    img_url = photo['src'].get('large2x') or photo['src'].get('large')
                    if img_url:
                        return img_url
        except Exception as e:
            logger.error(f"Pexels error: {e}")
        return None
    
    def search_pixabay(self, query):
        """Search Pixabay for free images."""
        if not self.pixabay_key:
            return None
        try:
            url = f"https://pixabay.com/api/?key={self.pixabay_key}&q={query}&image_type=photo&orientation=horizontal&per_page=3&min_width=1200"
            res = requests.get(url, timeout=5).json()
            
            if res.get('hits'):
                for hit in res['hits']:
                    img_url = hit.get('largeImageURL') or hit.get('webformatURL')
                    if img_url:
                        return img_url
        except Exception as e:
            logger.error(f"Pixabay error: {e}")
        return None
    
    def search_google(self, query):
        """Search Google Custom Search for images."""
        if not self.google_api_key or not self.google_cx:
            return None
        try:
            url = f"https://www.googleapis.com/customsearch/v1?key={self.google_api_key}&cx={self.google_cx}&q={query}&searchType=image&num=3&imgSize=large&safe=active"
            res = requests.get(url, timeout=5).json()
            
            if res.get('items'):
                for item in res['items']:
                    img_url = item.get('link')
                    if img_url and not self._is_logo_image(img_url):
                        return img_url
        except Exception as e:
            logger.error(f"Google error: {e}")
        return None
    
    def _is_logo_image(self, url):
        """Check if URL likely points to a logo/icon image."""
        url_lower = url.lower()
        logo_indicators = ['logo', 'icon', 'avatar', 'sprite', 'button', 'banner', 'favicon', 'thumb', 'small']
        return any(indicator in url_lower for indicator in logo_indicators)
    
    def generate_fallback_image(self, title, category):
        """Legacy support method."""
        return self._get_category_placeholder(category)
