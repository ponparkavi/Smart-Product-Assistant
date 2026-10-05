from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.schemas.maintenance_schema import MaintenancePredictionResponse
from app.services.predictive_maintenance_service import PredictiveMaintenanceService

router = APIRouter()

@router.get("/{product_id}", response_model=MaintenancePredictionResponse)
async def predict_maintenance(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await PredictiveMaintenanceService.predict_maintenance(product_id, current_user["id"])
