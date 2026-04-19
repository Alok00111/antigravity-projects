"""
Script to re-categorize all existing articles in the database
using the improved category detection logic.
"""
import os
from dotenv import load_dotenv
from supabase import create_client
from utils import get_category
import logging

# Load environment
load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def recategorize_all_articles():
    """Fetch all articles and update their categories."""
    
    # Initialize Supabase
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        logger.error("Supabase credentials not found in .env")
        return
    
    supabase = create_client(url, key)
    
    # Fetch all articles
    logger.info("Fetching all articles from database...")
    response = supabase.table("articles").select("id, title, content, category").execute()
    
    articles = response.data
    logger.info(f"Found {len(articles)} articles to process")
    
    updated_count = 0
    changed_categories = []
    
    for article in articles:
        article_id = article['id']
        title = article.get('title', '')
        content = article.get('content', '')
        old_category = article.get('category', 'Trending')
        
        # Get new category using improved logic
        new_category = get_category(title, content)
        
        if old_category != new_category:
            # Update the article
            try:
                supabase.table("articles").update({
                    "category": new_category
                }).eq("id", article_id).execute()
                
                changed_categories.append({
                    'title': title[:60] + '...' if len(title) > 60 else title,
                    'old': old_category,
                    'new': new_category
                })
                updated_count += 1
                logger.info(f"Updated: '{title[:50]}...' | {old_category} → {new_category}")
                
            except Exception as e:
                logger.error(f"Failed to update article {article_id}: {e}")
    
    # Summary
    logger.info("\n" + "="*60)
    logger.info(f"RECATEGORIZATION COMPLETE")
    logger.info(f"Total articles: {len(articles)}")
    logger.info(f"Updated: {updated_count}")
    logger.info(f"Unchanged: {len(articles) - updated_count}")
    logger.info("="*60)
    
    if changed_categories:
        logger.info("\nChanges made:")
        for change in changed_categories:
            logger.info(f"  • {change['title']}")
            logger.info(f"    {change['old']} → {change['new']}")

if __name__ == "__main__":
    recategorize_all_articles()
