"""
Script to clear all articles from the Supabase database.
Run this before restarting the bot to refetch all articles.
"""
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def clear_all_articles():
    """Delete all articles from the database."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: Supabase credentials not found in .env")
        return False
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # First, get count of articles
        result = supabase.table("articles").select("id", count="exact").execute()
        count = result.count if result.count else 0
        
        if count == 0:
            print("ℹ️ Database is already empty.")
            return True
        
        print(f"🗑️ Found {count} articles. Deleting all...")
        
        # Delete all articles
        # Use 'gt' (greater than) with a zero UUID to match all records
        supabase.table("articles").delete().gt("created_at", "1900-01-01").execute()
        
        print(f"✅ Successfully deleted all {count} articles!")
        print("🔄 Now restart the bot (python main.py) to refetch articles with longer content.")
        return True
        
    except Exception as e:
        print(f"❌ Error clearing articles: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("  DATABASE CLEANUP SCRIPT")
    print("=" * 50)
    print()
    
    confirm = input("⚠️ This will DELETE ALL articles from your database. Continue? (yes/no): ")
    
    if confirm.lower() == "yes":
        clear_all_articles()
    else:
        print("❌ Cancelled. No articles were deleted.")
