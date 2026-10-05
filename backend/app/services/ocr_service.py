import os
import shutil
import cv2
import numpy as np
import pytesseract
import re
from typing import Dict, Any

from app.core.config import settings

def _configure_tesseract():
    tess_cmd = settings.TESSERACT_CMD or os.getenv("TESSERACT_CMD")
    if tess_cmd and os.path.exists(tess_cmd):
        pytesseract.pytesseract.tesseract_cmd = tess_cmd
        return True
    
    if shutil.which("tesseract"):
        return True
        
    default_windows_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Users\ADMIN\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
    ]
    
    for path in default_windows_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            return True
            
    return False

class OCRService:
    @staticmethod
    def preprocess_image(image_bytes: bytes) -> np.ndarray:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding to binarize image
        # Using Otsu's thresholding for better background separation
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Denoise
        denoised = cv2.medianBlur(binary, 3)
        return denoised

    @staticmethod
    def extract_text(preprocessed_img: np.ndarray) -> str:
        # custom config to assume uniform text block
        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(preprocessed_img, config=custom_config)
        return text

    @staticmethod
    def parse_structured_data(text: str) -> Dict[str, Any]:
        data = {
            "product_name": None,
            "brand": None,
            "model_number": None,
            "purchase_date": None,
            "purchase_price": None,
            "invoice_number": None,
            "seller": None
        }
        
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # 1. Price extraction: find $XX.XX or simply XX.XX next to Total
        price_pattern = re.compile(r'(?i)(?:total|amount|price).*?\$?(\d+[\.,]\d{2})')
        for line in lines:
            match = price_pattern.search(line)
            if match:
                try:
                    data["purchase_price"] = float(match.group(1).replace(',', '.'))
                    break
                except ValueError:
                    pass
        
        if not data["purchase_price"]:
            # Fallback for just $XX.XX
            fallback_price = re.compile(r'\$(\d+[\.,]\d{2})')
            matches = fallback_price.findall(text)
            if matches:
                try:
                    data["purchase_price"] = max([float(m.replace(',', '.')) for m in matches])
                except ValueError:
                    pass

        # 2. Date extraction: DD/MM/YYYY or YYYY-MM-DD
        date_pattern = re.compile(r'(\d{2,4}[-/]\d{2}[-/]\d{2,4})')
        date_matches = date_pattern.findall(text)
        if date_matches:
            data["purchase_date"] = date_matches[0]
            
        # 3. Invoice number extraction
        inv_pattern = re.compile(r'(?i)(?:invoice|receipt)\s*(?:no|number|#)?\s*[:.-]?\s*([A-Z0-9-]+)')
        inv_match = inv_pattern.search(text)
        if inv_match:
            data["invoice_number"] = inv_match.group(1)
            
        # 4. Attempt to guess seller (usually first or second line)
        if len(lines) > 0:
            if not any(keyword in lines[0].lower() for keyword in ["invoice", "receipt", "date"]):
                data["seller"] = lines[0]
                
        # 5. Simple keyword matching for common brands
        brands = ["Samsung", "LG", "Whirlpool", "Sony", "Apple", "Dell", "Bosch", "Panasonic"]
        text_lower = text.lower()
        for brand in brands:
            if brand.lower() in text_lower:
                data["brand"] = brand
                break
                
        # 6. Very naive model number extraction (capital letters and numbers with hyphens)
        model_pattern = re.compile(r'\b([A-Z0-9]{3,}-[A-Z0-9]{3,})\b')
        model_match = model_pattern.search(text)
        if model_match:
            data["model_number"] = model_match.group(1)

        return data

    @staticmethod
    def process_invoice(image_bytes: bytes) -> Dict[str, Any]:
        if not _configure_tesseract():
            raise RuntimeError(
                "Tesseract OCR is not installed or configured correctly. "
                "Please install Tesseract and ensure it's in your PATH or set the TESSERACT_CMD environment variable."
            )
            
        try:
            preprocessed = OCRService.preprocess_image(image_bytes)
            raw_text = OCRService.extract_text(preprocessed)
            structured_data = OCRService.parse_structured_data(raw_text)
            
            structured_data["raw_text"] = raw_text
            structured_data["confidence_score"] = 0.85 
            
            return structured_data
        except Exception as e:
            raise RuntimeError(f"OCR processing failed: {str(e)}")
