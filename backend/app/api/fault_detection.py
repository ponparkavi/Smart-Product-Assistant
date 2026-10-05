from fastapi import APIRouter, Depends, UploadFile, File
from app.api.auth import get_current_user
from app.services.fault_detection_service import fault_detector

router = APIRouter()

@router.post("/analyze")
async def analyze_fault(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    image_bytes = await file.read()
    result = await fault_detector.analyze_image(image_bytes)
    return {"status": "success", "result": result}
