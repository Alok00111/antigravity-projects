"""
Update existing articles with high-quality images from multiple sources.
Uses the enhanced ThumbnailEngine with Unsplash, Pexels, Pixabay support.
"""
import os
from dotenv import load_dotenv
from supabase import create_client
from thumbnail import ThumbnailEngine
import logging
import time

# Load environment
load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def update_thumbnails():
    """Update all articles with images from multiple sources."""
    
    # Initialize Supabase
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        logger.error("Supabase credentials not found in .env")
        return
    
    supabase = create_client(url, key)
    thumbnail_engine = ThumbnailEngine()
    
    # Log available sources
    logger.info("Available image sources:")
    logger.info(f"  • Unsplash: {'✓' if thumbnail_engine.unsplash_key else '✗'}")
    logger.info(f"  • Pexels: {'✓' if thumbnail_engine.pexels_key else '✗'}")
    logger.info(f"  • Pixabay: {'✓' if thumbnail_engine.pixabay_key else '✗'}")
    logger.info(f"  • Google: {'✓' if thumbnail_engine.google_api_key else '✗'}")
    
    logger.info("\nFetching all articles from database...")
    response = supabase.table("articles").select("id, title, category, thumbnail_url").execute()
    
    articles = response.data
    logger.info(f"Found {len(articles)} articles to update\n")
    
    updated_count = 0
    
    for i, article in enumerate(articles):
        article_id = article['id']
        title = article.get('title', '')
        category = article.get('category', 'News')
        
        logger.info(f"[{i+1}/{len(articles)}] {title[:55]}...")
        
        try:
            # Get new thumbnail from multi-source engine
            new_thumbnail = thumbnail_engine.get_thumbnail(title, category)
            
            if new_thumbnail:
                # Update the article
                supabase.table("articles").update({
                    "thumbnail_url": new_thumbnail
                }).eq("id", article_id).execute()
                
                updated_count += 1
                logger.info(f"  ✓ Updated\n")
            else:
                logger.info(f"  - No image found\n")
                
        except Exception as e:
            logger.error(f"  ✗ Error: {e}\n")
        
        # Rate limiting - be respectful to APIs
        time.sleep(0.3)
    
    # Summary
    logger.info("="*60)
    logger.info("MULTI-SOURCE IMAGE UPDATE COMPLETE")
    logger.info(f"Total articles: {len(articles)}")
    logger.info(f"Updated: {updated_count}")
    logger.info("="*60)

if __name__ == "__main__":
    update_thumbnails()
