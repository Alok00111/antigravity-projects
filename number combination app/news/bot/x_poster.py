import tweepy
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class XPoster:
    def __init__(self):
        self.api_key = os.getenv("X_API_KEY")
        self.api_secret = os.getenv("X_API_SECRET")
        self.access_token = os.getenv("X_ACCESS_TOKEN")
        self.access_secret = os.getenv("X_ACCESS_SECRET")
        
        self.client = None
        if self.api_key and self.api_secret and self.access_token and self.access_secret:
            try:
                # Tweepy Client for v2 API
                self.client = tweepy.Client(
                    consumer_key=self.api_key,
                    consumer_secret=self.api_secret,
                    access_token=self.access_token,
                    access_token_secret=self.access_secret
                )
                logger.info("X (Twitter) Client initialized.")
            except Exception as e:
                logger.error(f"Failed to initialize X Client: {e}")
        else:
            logger.warning("X API credentials missing.")

    def post_tweet(self, text):
        """
        Posts a tweet.
        """
        if not self.client:
            logger.warning("No X Client available. Skipping tweet.")
            return False
            
        try:
            response = self.client.create_tweet(text=text)
            logger.info(f"Tweet posted successfully: {response.data['id']}")
            return True
        except Exception as e:
            logger.error(f"Error posting tweet: {e}")
            return False
