# Backend Implementation (backend/app/main.py)
from fastapi import FastAPI, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import pandas as pd
from .sentiment import analyze_sentiment
from .models import SentimentResponse
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", "http://65.1.112.82")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_file(
    file: UploadFile = File(...),
    x_api_key: Optional[str] = Header(None)
):
    # API key validation
    if x_api_key != os.getenv("API_KEY"):
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        # Read CSV file
        df = pd.read_csv(file.file)
        
        # Perform sentiment analysis
        results = analyze_sentiment(df)
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
