# backend/app/sentiment.py
from textblob import TextBlob
import pandas as pd
from typing import List, Tuple
from .models import TextEntry, SentimentResponse
import io

def analyze_sentiment(text: str) -> Tuple[str, float]:
    """
    Analyze sentiment of given text using TextBlob.
    Returns a tuple of (sentiment_label, polarity_score)
    """
    analysis = TextBlob(str(text))
    # Convert polarity to sentiment label
    if analysis.sentiment.polarity > 0:
        return "positive", analysis.sentiment.polarity
    elif analysis.sentiment.polarity < 0:
        return "negative", analysis.sentiment.polarity
    return "neutral", analysis.sentiment.polarity

def process_dataframe(df: pd.DataFrame) -> List[dict]:
    """
    Process DataFrame and return sentiment analysis results
    """
    results = []
    
    for index, row in df.iterrows():
        # Ensure text column exists and handle missing values
        text = str(row.get('text', '')).strip()
        if not text:
            continue
            
        sentiment_label, score = analyze_sentiment(text)
        
        result = {
            "id": index,
            "text": text,
            "sentiment": sentiment_label,
            "score": float(score),
            "timestamp": row.get('timestamp') if 'timestamp' in row else None
        }
        results.append(result)
    
    return results
