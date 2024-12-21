# backend/app/main.py
from fastapi import FastAPI, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
import shutil
import tempfile
from .auth import get_api_key
from .sentiment import process_csv
from typing import List
from .models import SentimentResponse

app = FastAPI(title="Sentiment Analysis API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze", response_model=List[SentimentResponse])
async def analyze_file(
    file: UploadFile = File(...),
    api_key: str = Depends(get_api_key)
):
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name
    
    # Process the CSV file
    results = process_csv(temp_path)
    
    # Clean up
    import os
    os.unlink(temp_path)
    
    return results

@app.get("/")
async def root():
    return {"message": "Welcome to Sentiment Analysis API"}