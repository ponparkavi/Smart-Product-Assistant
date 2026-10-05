import os
from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.database import db_instance
from app.schemas.service_schema import ServiceCenter, BookingCreate, BookingOut, BookingStatus, ServiceType

in_memory_bookings = {}

class ServiceCenterService:
    @staticmethod
    async def get_service_centers(brand: Optional[str] = None, location: Optional[str] = None) -> List[ServiceCenter]:
        # Using Google Maps API if configured, else explicitly fallback to dummy demo centers
        api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if api_key:
            # Placeholder for actual API call, since we can't reliably do network calls without proper setup here.
            # Real implementation would call Google Places API here with the brand and location.
            pass
        
        # Transparently returning explicitly named demo service centers
        return [
            ServiceCenter(
                id="demo_center_1",
                name=f"{brand or 'Generic'} Demo Service Center (North)",
                location=f"{location or 'Local City'}, Sector 12",
                contact_number="+1-800-DEMO-001",
                email="north@demo-service.local",
                available_services=[ServiceType.REPAIR, ServiceType.MAINTENANCE, ServiceType.INSPECTION]
            ),
            ServiceCenter(
                id="demo_center_2",
                name=f"{brand or 'Generic'} Demo Service Center (South)",
                location=f"{location or 'Local City'}, Downtown Hub",
                contact_number="+1-800-DEMO-002",
                email="south@demo-service.local",
                available_services=[ServiceType.REPAIR, ServiceType.INSTALLATION]
            )
        ]

    @staticmethod
    async def create_booking(user_id: str, booking_in: BookingCreate) -> dict:
        now = datetime.now(timezone.utc)
        
        doc = {
            "user_id": user_id,
            "product_id": booking_in.product_id,
            "service_center_id": booking_in.service_center_id,
            "service_center_name": booking_in.service_center_name,
            "service_type": booking_in.service_type.value,
            "scheduled_date": booking_in.scheduled_date,
            "description": booking_in.description,
            "status": BookingStatus.SCHEDULED.value,
            "cost": 0.0,
            "created_at": now,
            "updated_at": now
        }

        if db_instance.is_connected and db_instance.db is not None:
            res = await db_instance.db["bookings"].insert_one(doc)
            doc["_id"] = res.inserted_id
            return ServiceCenterService._format_booking(doc)
        else:
            b_id = str(ObjectId())
            doc["_id"] = b_id
            in_memory_bookings[b_id] = doc
            return ServiceCenterService._format_booking(doc)

    @staticmethod
    async def get_user_bookings(user_id: str, product_id: Optional[str] = None) -> List[dict]:
        bookings = []
        if db_instance.is_connected and db_instance.db is not None:
            query = {"user_id": user_id}
            if product_id:
                query["product_id"] = product_id
                
            cursor = db_instance.db["bookings"].find(query).sort("scheduled_date", -1)
            async for doc in cursor:
                bookings.append(ServiceCenterService._format_booking(doc))
        else:
            for doc in in_memory_bookings.values():
                if doc["user_id"] == user_id:
                    if product_id and doc["product_id"] != product_id:
                        continue
                    bookings.append(ServiceCenterService._format_booking(doc))
        return sorted(bookings, key=lambda x: x["scheduled_date"], reverse=True)

    @staticmethod
    async def cancel_booking(booking_id: str, user_id: str) -> bool:
        if db_instance.is_connected and db_instance.db is not None:
            obj_id = ObjectId(booking_id)
            doc = await db_instance.db["bookings"].find_one({"_id": obj_id, "user_id": user_id})
            if not doc:
                raise HTTPException(status_code=404, detail="Booking not found or access denied.")
            
            if doc["status"] == BookingStatus.COMPLETED.value:
                raise HTTPException(status_code=400, detail="Cannot cancel a completed booking.")
                
            await db_instance.db["bookings"].update_one(
                {"_id": obj_id}, 
                {"$set": {"status": BookingStatus.CANCELLED.value, "updated_at": datetime.now(timezone.utc)}}
            )
        else:
            doc = in_memory_bookings.get(booking_id)
            if not doc or doc["user_id"] != user_id:
                raise HTTPException(status_code=404, detail="Booking not found or access denied.")
            if doc["status"] == BookingStatus.COMPLETED.value:
                raise HTTPException(status_code=400, detail="Cannot cancel a completed booking.")
            doc["status"] = BookingStatus.CANCELLED.value
            doc["updated_at"] = datetime.now(timezone.utc)
            
        return True

    @staticmethod
    def _format_booking(doc: dict) -> dict:
        return {
            "id": str(doc["_id"]),
            "user_id": doc["user_id"],
            "product_id": doc["product_id"],
            "service_center_id": doc["service_center_id"],
            "service_center_name": doc["service_center_name"],
            "service_type": doc["service_type"],
            "scheduled_date": doc["scheduled_date"],
            "description": doc.get("description", ""),
            "status": doc["status"],
            "cost": doc.get("cost", 0.0),
            "created_at": doc["created_at"],
            "updated_at": doc["updated_at"]
        }
