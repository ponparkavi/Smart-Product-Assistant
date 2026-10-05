from pydantic import BaseModel
from typing import Optional

class OCRExtractedData(BaseModel):
    product_name: Optional[str] = None
    brand: Optional[str] = None
    model_number: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_price: Optional[float] = None
    invoice_number: Optional[str] = None
    seller: Optional[str] = None
    invoice_file_path: Optional[str] = None
    raw_text: str
    confidence_score: float
