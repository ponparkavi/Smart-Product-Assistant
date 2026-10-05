from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

class DocumentType(str, Enum):
    MANUAL = "manual"
    WARRANTY_CARD = "warranty_card"
    INVOICE = "invoice"
    OTHER = "other"

class DocumentCreate(BaseModel):
    product_id: Optional[str] = None
    document_type: DocumentType = DocumentType.OTHER
    title: str = Field(..., min_length=2, description="Title of the document")

class DocumentOut(BaseModel):
    id: str
    user_id: str
    product_id: Optional[str] = None
    title: str
    filename: str
    file_path: str
    document_type: DocumentType
    content_type: str
    size_bytes: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
