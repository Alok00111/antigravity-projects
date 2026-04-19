import re

def get_category(title, summary_text=""):
    """
    Determines the category of the news article based on keywords.
    Uses comprehensive keyword matching with proper prioritization.
    """
    combined_text = (title + " " + summary_text).lower()
    title_lower = title.lower()

    # SPORTS - Check TITLE first for sports terms (athlete, triathlete, cricket, etc.)
    sports_title_keywords = ["triathlete", "athlete", "cricket", "football", "tennis", 
                            "basketball", "hockey", "golf", "olympics", "marathon", 
                            "ipl", "world cup", "championship"]
    if any(k in title_lower for k in sports_title_keywords):
        return "Sports"

    # ENTERTAINMENT - Grammy, Awards, celebrities
    entertainment_keywords = [
        "grammy", "grammys", "oscar", "oscars", "emmy", "emmys", "golden globe",
        "award show", "red carpet", "awards ceremony",
        "billie eilish", "bad bunny", "taylor swift", "beyonce", "drake", "kanye",
        "hollywood", "bollywood", "movie", "film", "actor", "actress",
        "netflix", "disney", "hbo", "streaming",
        "youtube", "tiktok", "instagram", "viral"
    ]
    if any(k in combined_text for k in entertainment_keywords):
        return "Entertainment"

    # WORLD/POLITICS - ONLY for clearly non-India international news
    # Check title for strong US/World indicators
    world_title_keywords = ["trump", "biden", "white house", "us government", "u.s.", 
                           "russia", "ukraine", "china", "gaza", "israel", "europe",
                           "kennedy center", "pentagon"]
    if any(k in title_lower for k in world_title_keywords):
        return "World"
    
    # World content keywords (excluding generic terms that match India)
    world_content_keywords = [
        # US specific
        "trump", "biden", "white house", "kennedy center", "pentagon", "oval office",
        "republican", "democrat", "washington d.c.",
        # Other countries (but NOT generic terms)
        "russia", "russian", "ukraine", "ukrainian", "china", "chinese",
        "britain", "british", "france", "french", "germany", "german",
        "denmark", "danish", "sweden", "norway", "netherlands",
        "brazil", "mexico", "japan", "japanese", "australia", "australian",
        # Conflict zones
        "gaza", "israel", "palestine", "iran", "north korea", "taiwan",
        # Organizations
        "nato", "european union"
    ]
    if any(k in combined_text for k in world_content_keywords):
        return "World"

    # INDIA - Check for Indian news
    india_keywords = [
        "india", "indian", "delhi", "mumbai", "bangalore", "bengaluru", "chennai", "kolkata",
        "hyderabad", "pune", "ahmedabad", "jaipur", "lucknow", "kerala", "karnataka",
        "tamil nadu", "maharashtra", "gujarat", "rajasthan", "uttar pradesh", "bihar",
        "west bengal", "madhya pradesh", "andhra", "telangana", "odisha", "jharkhand",
        "modi", "bjp", "congress", "aap", "shiv sena", "ncp", "tmc", "dmk",
        "isro", "rupee", "sensex", "nifty", "lok sabha", "rajya sabha",
        "supreme court", "high court", "rbi", "crore", "lakh",
        "aadhaar", "upi", "budget", "sitharaman", "jaishankar",
        "rahul gandhi", "amit shah", "yogi", "kejriwal", "mamata"
    ]
    if any(k in combined_text for k in india_keywords):
        return "India"

    # SPORTS - Full check for remaining sports content
    sports_keywords = [
        "cricket", "football", "soccer", "tennis", "basketball", "baseball", "hockey",
        "golf", "boxing", "wrestling", "mma", "ufc", "f1", "nascar",
        "badminton", "volleyball", "rugby", "triathlon", "triathlete", "marathon",
        "swimming", "cycling", "athletics", "gymnastics",
        "nfl", "nba", "mlb", "ipl", "fifa", "icc", "wimbledon",
        "premier league", "champions league", "world cup", "olympics", "olympic",
        "athlete", "cricketer", "batsman", "bowler", "wicket",
        "medal", "championship", "playoff", "semifinal", "super bowl"
    ]
    if any(k in combined_text for k in sports_keywords):
        return "Sports"
    
    # TECH - Technology and gadgets
    tech_keywords = [
        "tech", "technology", "software", "hardware", "app",
        "apple", "google", "microsoft", "amazon", "meta", "facebook", "twitter",
        "iphone", "android", "samsung", "laptop", "computer", "smartphone",
        "ai", "artificial intelligence", "chatgpt", "openai", "machine learning",
        "robot", "robotics", "startup", "silicon valley",
        "cyber", "hacking", "data breach",
        "crypto", "bitcoin", "blockchain", "nft",
        "5g", "chip", "semiconductor", "nvidia", "intel", "tesla"
    ]
    if any(k in combined_text for k in tech_keywords):
        return "Tech"
    
    # BUSINESS - Finance and economy
    business_keywords = [
        "stock", "stocks", "share market", "economy", "economic", "finance",
        "bank", "banking", "investment", "investor", "trading",
        "inflation", "gdp", "recession", "revenue", "profit", "earnings",
        "ceo", "corporate", "merger", "acquisition", "ipo",
        "fed", "federal reserve", "wall street", "dow jones", "nasdaq"
    ]
    if any(k in combined_text for k in business_keywords):
        return "Business"

    # HEALTH - Health and wellness
    health_keywords = [
        "health", "medical", "doctor", "hospital", "disease", "virus", "vaccine",
        "treatment", "medicine", "pharmaceutical",
        "cancer", "diabetes", "surgery", "patient"
    ]
    if any(k in combined_text for k in health_keywords):
        return "Health"

    # Default fallback
    return "Trending"

def generate_tags(title):
    """
    Generates simple tags from title.
    """
    ignore_words = {"the", "a", "an", "is", "of", "to", "in", "and", "for", "on", "with", "at", "by", "from", "up", "about", "says", "new", "top"}
    
    clean_title = re.sub(r'[^a-zA-Z0-9\s]', '', title)
    words = clean_title.split()
    
    tags = []
    for word in words:
        if len(word) > 3 and word.lower() not in ignore_words:
            tags.append(word)
            
    return list(set(tags))[:5]

def slugify(title):
    slug = title.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    slug = re.sub(r'^-+|-+$', '', slug)
    return slug
