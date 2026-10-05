from fastapi import APIRouter, Depends
from typing import List, Optional
from app.api.auth import get_current_user
from app.schemas.service_schema import ServiceCenter, BookingCreate, BookingOut
from app.services.service_center_service import ServiceCenterService

router = APIRouter()

@router.get("/centers", response_model=List[ServiceCenter])
async def search_service_centers(brand: Optional[str] = None, location: Optional[str] = None):
    return await ServiceCenterService.get_service_centers(brand, location)

@router.post("/bookings", response_model=BookingOut)
async def create_booking(
    booking: BookingCreate,
    current_user: dict = Depends(get_current_user)
):
    return await ServiceCenterService.create_booking(current_user["id"], booking)

@router.get("/bookings", response_model=List[BookingOut])
async def get_bookings(
    product_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    return await ServiceCenterService.get_user_bookings(current_user["id"], product_id)

@router.delete("/bookings/{booking_id}")
async def cancel_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    await ServiceCenterService.cancel_booking(booking_id, current_user["id"])
    return {"status": "success", "message": "Booking cancelled."}
