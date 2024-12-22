# backend/app/main.py
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import io
import os
from typing import List
from .sentiment import process_dataframe
from .models import SentimentResponse, SentimentBatchResponse
from .auth import get_api_key
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Sentiment Analysis API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", "http://65.1.112.82"),
        "http://65.1.112.82"  # Your EC2 IP
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze", response_model=List[SentimentResponse])
async def analyze_file(
    file: UploadFile = File(...),
    api_key: str = Depends(get_api_key)
):
    try:
        # Read the file content
        contents = await file.read()
        
        # Check if file is empty
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")
            
        # Convert to DataFrame
        try:
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error reading CSV file: {str(e)}"
            )
            
        # Validate required columns
        if 'text' not in df.columns:
            raise HTTPException(
                status_code=400,
                detail="CSV must contain a 'text' column"
            )
            
        # Process the data
        results = process_dataframe(df)
        
        if not results:
            raise HTTPException(
                status_code=400,
                detail="No valid text entries found in file"
            )
            
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
