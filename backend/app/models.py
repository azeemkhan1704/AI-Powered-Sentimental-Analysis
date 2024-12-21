# backend/app/models.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TextEntry(BaseModel):
    id: int
    text: str
    timestamp: Optional[datetime] = None

class SentimentResponse(BaseModel):
    id: int
    text: str
    sentiment: str
    score: float
    timestamp: Optional[datetime] = None