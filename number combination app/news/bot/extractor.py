import requests
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

def extract_content(url):
    """
    Fetches the article URL and extracts the main body text and image.
    Returns a dict with 'text' and 'image' keys.
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            logger.error(f"Failed to fetch {url}: Status {response.status_code}")
            return None
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract the main image BEFORE removing elements
        image_url = extract_main_image(soup, url)
        
        # Remove unwanted elements
        for script in soup(["script", "style", "nav", "header", "footer", "aside", "form"]):
            script.decompose()

        # Extract Text from Paragraphs
        paragraphs = soup.find_all('p')
        text = " ".join([p.get_text().strip() for p in paragraphs])
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        clean_text = ' '.join(chunk for chunk in chunks if chunk)
        
        if len(clean_text) < 500:
            logger.warning(f"Extracted text too short ({len(clean_text)} chars) for {url}")
            return None
        
        return {
            'text': clean_text,
            'image': image_url
        }
        
    except Exception as e:
        logger.error(f"Error extracting content from {url}: {e}")
        return None

def extract_main_image(soup, base_url):
    """
    Extract the main/featured image from an article.
    Tries multiple methods in order of reliability.
    """
    image_url = None
    
    # Method 1: Open Graph image (most reliable for news sites)
    og_image = soup.find('meta', property='og:image')
    if og_image and og_image.get('content'):
        image_url = og_image['content']
        if image_url and is_valid_image_url(image_url):
            return make_absolute_url(image_url, base_url)
    
    # Method 2: Twitter card image
    twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
    if twitter_image and twitter_image.get('content'):
        image_url = twitter_image['content']
        if image_url and is_valid_image_url(image_url):
            return make_absolute_url(image_url, base_url)
    
    # Method 3: Schema.org image
    schema_image = soup.find('meta', attrs={'itemprop': 'image'})
    if schema_image and schema_image.get('content'):
        image_url = schema_image['content']
        if image_url and is_valid_image_url(image_url):
            return make_absolute_url(image_url, base_url)
    
    # Method 4: Look for figure > img in article
    article = soup.find('article') or soup.find('main') or soup
    figure = article.find('figure')
    if figure:
        img = figure.find('img')
        if img and img.get('src'):
            image_url = img.get('src') or img.get('data-src')
            if image_url and is_valid_image_url(image_url):
                return make_absolute_url(image_url, base_url)
    
    # Method 5: First large image in article
    for img in article.find_all('img')[:5]:
        src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
        if src and is_valid_image_url(src):
            # Check if it's likely a content image (not icon/logo)
            width = img.get('width', '0')
            height = img.get('height', '0')
            try:
                if int(width) >= 300 or int(height) >= 200:
                    return make_absolute_url(src, base_url)
            except:
                # If no dimensions, check the URL patterns
                if not any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'sprite', 'button']):
                    return make_absolute_url(src, base_url)
    
    return None

def is_valid_image_url(url):
    """Check if URL looks like a valid image."""
    if not url:
        return False
    url_lower = url.lower()
    # Check for image extensions or image CDN patterns
    return (url_lower.endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')) or
            'image' in url_lower or
            '/img/' in url_lower or
            '/images/' in url_lower or
            '/photo/' in url_lower)

def make_absolute_url(url, base_url):
    """Convert relative URL to absolute."""
    if not url:
        return None
    if url.startswith('//'):
        return 'https:' + url
    if url.startswith('/'):
        from urllib.parse import urlparse
        parsed = urlparse(base_url)
        return f"{parsed.scheme}://{parsed.netloc}{url}"
    if not url.startswith('http'):
        return base_url.rstrip('/') + '/' + url
    return url

