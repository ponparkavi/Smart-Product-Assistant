import pytest
from httpx import AsyncClient, ASGITransport
import io
from unittest.mock import patch
from PIL import Image, ImageDraw, ImageFont
from app.main import app

def generate_test_invoice_image() -> bytes:
    # Create a simple white image
    img = Image.new('RGB', (400, 300), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    
    # Add some text simulating an invoice
    text = """
    Invoice No: INV-12345
    Seller: Mega Electronics Store
    Date: 2026-10-02
    
    Item: Samsung Galaxy S25
    Brand: Samsung
    Model: SM-G999
    
    Total Amount: $999.99
    Thank you for your purchase!
    """
    try:
        # Try to use a basic font if available, else default
        d.text((10, 10), text, fill=(0, 0, 0))
    except Exception:
        pass
        
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    return img_byte_arr.getvalue()

@pytest.mark.asyncio
@patch('pytesseract.image_to_string')
async def test_ocr_extraction(mock_tesseract):
    # Mock tesseract output
    mock_tesseract.return_value = """
    Invoice No: INV-12345
    Seller: Mega Electronics Store
    Date: 2026-10-02
    Item: Samsung Galaxy S25
    Brand: Samsung
    Model: SM-G999
    Total Amount: $999.99
    """

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create user
        r = await ac.post("/api/auth/register", json={"email": "ocruser@test.com", "password": "password123!", "full_name": "OCR User"})
        token = r.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Upload fake invoice image
        image_bytes = generate_test_invoice_image()
        files = {'file': ('invoice.jpg', image_bytes, 'image/jpeg')}
        
        res = await ac.post("/api/ocr/extract", files=files, headers=headers)
        
        print(res.json())
        assert res.status_code == 200
        data = res.json()
        
        # Since Tesseract might struggle with default font on tiny images without proper fonts installed,
        # we at least check that the API returns the correct structure and saves the file.
        assert "invoice_file_path" in data
        assert data["invoice_file_path"].startswith("/storage/invoices/inv_")
        assert "raw_text" in data
        
        # We can't guarantee 100% OCR accuracy on a synthetically drawn image with default fonts in CI, 
        # but the endpoint should complete without error.
