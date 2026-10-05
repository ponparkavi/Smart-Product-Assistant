from pydantic import BaseModel
from typing import List

class SourceChunk(BaseModel):
    page_content: str
    metadata: dict

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]
