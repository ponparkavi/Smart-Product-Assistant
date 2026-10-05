import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.api.auth import get_current_user
from app.schemas.ocr_schema import OCRExtractedData
from app.services.ocr_service import OCRService

router = APIRouter(prefix="/ocr", tags=["OCR & Document Processing"])

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "invoices")
os.makedirs(STORAGE_DIR, exist_ok=True)

@router.post("/extract", response_model=OCRExtractedData)
async def extract_invoice_data(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload JPEG, PNG, or WEBP."
        )

    # Read image bytes
    image_bytes = await file.read()
    
    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty or corrupted file."
        )
        
    # Save the raw file for storage/reference
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    unique_filename = f"inv_{uuid.uuid4().hex[:8]}_{current_user['id']}{file_ext}"
    file_path = os.path.join(STORAGE_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(image_bytes)
            
        # Process using OCR service
        extracted_data = OCRService.process_invoice(image_bytes)
        extracted_data["invoice_file_path"] = f"/storage/invoices/{unique_filename}"
        
        return extracted_data
        
    except Exception as e:
        # Clean up if OCR fails completely
        if os.path.exists(file_path):
            os.remove(file_path)
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR Extraction failed: {str(e)}"
        )
