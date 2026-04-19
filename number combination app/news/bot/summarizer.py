import google.generativeai as genai
import logging
import re
import os

logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class Summarizer:
    def __init__(self):
        logger.info("Initializing Gemini-based article rewriter...")
        try:
            if GEMINI_API_KEY:
                genai.configure(api_key=GEMINI_API_KEY)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("Gemini model initialized successfully.")
            else:
                logger.error("GEMINI_API_KEY not set in environment!")
                self.model = None
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            self.model = None
            
    def summarize(self, text):
        """
        Creates a completely rewritten, original article from the provided text.
        Produces 600-800 word articles with unique phrasing that cannot be traced to source.
        Uses Google Gemini for intelligent rewriting and expansion.
        """
        if not self.model: return None
        if not text: return None
        
        try:
            # Clean the input text
            clean_text = self._clean_text(text)
            
            if len(clean_text) < 200:
                logger.warning(f"Input text too short ({len(clean_text)} chars)")
                return None

            # Craft a detailed prompt for complete article rewriting
            prompt = f"""You are a professional news journalist. Rewrite the following news content into a completely original, detailed article.

STRICT REQUIREMENTS:
1. Write 600-800 words minimum - this is CRITICAL
2. Completely rephrase EVERYTHING - do not copy any sentences or phrases from the original
3. Use your own unique vocabulary, sentence structures, and writing style
4. Expand on the facts with additional context and analysis
5. Write in an engaging, professional journalistic tone
6. Structure with clear paragraphs covering: introduction, key details, context/background, implications, and conclusion
7. Add relevant context that a reader would find valuable
8. DO NOT include any attribution to original sources
9. DO NOT mention that this is a rewrite or summary
10. Write as if you are the original author reporting this story

ORIGINAL CONTENT TO REWRITE:
{clean_text[:8000]}

Write the complete rewritten article now (minimum 600 words):"""

            # Generate the rewritten article
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.8,  # Higher creativity for unique phrasing
                    top_p=0.9,
                    max_output_tokens=2000,  # Allow for 600-800 words
                )
            )
            
            result = response.text.strip()
            
            # Post-process to improve readability
            result = self._post_process(result)
            
            # Verify minimum length
            word_count = len(result.split())
            if word_count < 400:
                logger.warning(f"Generated article too short ({word_count} words), retrying with emphasis...")
                return self._retry_with_length_emphasis(clean_text)
            
            logger.info(f"Generated article with {word_count} words")
            return result
            
        except Exception as e:
            logger.error(f"Error rewriting article: {e}")
            return None
    
    def _retry_with_length_emphasis(self, text):
        """Retry generation with stronger emphasis on length."""
        try:
            prompt = f"""IMPORTANT: Write a LONG, detailed news article of AT LEAST 700 WORDS.

You are a senior journalist writing an in-depth news report. Based on the information below, create a comprehensive, original article.

Your article MUST:
- Be at least 700 words (COUNT THEM)
- Have 6-8 well-developed paragraphs
- Include an engaging introduction
- Provide extensive background and context
- Analyze implications and significance
- Have a strong conclusion
- Use completely original phrasing - no copying

SOURCE INFORMATION:
{text[:8000]}

BEGIN YOUR 700+ WORD ARTICLE:"""

            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.85,
                    top_p=0.92,
                    max_output_tokens=2500,
                )
            )
            
            return self._post_process(response.text.strip())
            
        except Exception as e:
            logger.error(f"Retry failed: {e}")
            return None
    
    def _clean_text(self, text):
        """Clean input text for better rewriting."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove common noise patterns
        text = re.sub(r'\[.*?\]', '', text)  # Remove [brackets]
        text = re.sub(r'Read more:.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Also read:.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'ALSO READ.*', '', text)
        text = re.sub(r'Subscribe to.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Follow us on.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Click here.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Share this.*', '', text, flags=re.IGNORECASE)
        return text.strip()
    
    def _post_process(self, text):
        """Post-process the generated text for better readability."""
        # Remove any markdown formatting that might slip through
        text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\*\*', '', text)
        text = re.sub(r'\*', '', text)
        
        # Ensure proper paragraph breaks
        paragraphs = text.split('\n\n')
        processed_paragraphs = []
        
        for p in paragraphs:
            p = p.strip()
            if p and len(p) > 20:  # Skip very short fragments
                # Ensure first letter is capitalized
                if p[0].islower():
                    p = p[0].upper() + p[1:]
                processed_paragraphs.append(p)
        
        result = '\n\n'.join(processed_paragraphs)
        
        # Ensure it ends with proper punctuation
        if result and not result[-1] in '.!?':
            result += '.'
            
        return result
