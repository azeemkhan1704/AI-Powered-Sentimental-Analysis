# backend/app/sentiment.py
from textblob import TextBlob
import pandas as pd
from typing import List
from .models import TextEntry, SentimentResponse

def analyze_sentiment(text: str) -> tuple[str, float]:
    analysis = TextBlob(text)
    # Convert polarity to sentiment label
    if analysis.sentiment.polarity > 0:
        return "positive", analysis.sentiment.polarity
    elif analysis.sentiment.polarity < 0:
        return "negative", analysis.sentiment.polarity
    return "neutral", analysis.sentiment.polarity

def process_csv(file_path: str) -> List[SentimentResponse]:
    df = pd.read_csv(file_path)
    results = []
    
    for _, row in df.iterrows():
        sentiment_label, score = analyze_sentiment(row['text'])
        result = SentimentResponse(
            id=row['id'],
            text=row['text'],
            sentiment=sentiment_label,
            score=score,
            timestamp=row.get('timestamp')
        )
        results.append(result)
    
    return results