from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.error("Supabase credentials missing.")
            self.client = None
        else:
            self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            
    def check_url_exists(self, url):
        """
        Checks if the source URL is already in the database.
        """
        if not self.client: return False
        
        try:
            response = self.client.table("articles").select("id").eq("source_url", url).execute()
            if response.data and len(response.data) > 0:
                return True
            return False
        except Exception as e:
            logger.error(f"Error checking DB existence: {e}")
            return False

    def save_article(self, article_data):
        """
        Inserts article data into Supabase.
        """
        if not self.client: return False

        try:
            response = self.client.table("articles").insert(article_data).execute()
            if response.data:
                logger.info(f"Saved to DB: {article_data['title']}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error saving to DB: {e}")
            return False
