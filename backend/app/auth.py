# backend/app/auth.py
import os
from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

API_KEY_NAME = "X-API-Key"
API_KEY = os.getenv("API_KEY")   # Default key for development

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)



async def get_api_key(api_key_header: str = Security(api_key_header)) -> Optional[str]:
    print(api_key_header)
    if api_key_header == API_KEY:
        return api_key_header
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API Key"
    )