from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ServiceType(str, Enum):
    REPAIR = "repair"
    MAINTENANCE = "maintenance"
    INSTALLATION = "installation"
    INSPECTION = "inspection"

class BookingStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ServiceCenter(BaseModel):
    id: str
    name: str
    location: str
    contact_number: str
    email: Optional[str] = None
    available_services: List[ServiceType]

class BookingCreate(BaseModel):
    product_id: str
    service_center_id: str
    service_center_name: str # Denormalized for history
    service_type: ServiceType
    scheduled_date: datetime
    description: str

class BookingOut(BaseModel):
    id: str
    user_id: str
    product_id: str
    service_center_id: str
    service_center_name: str
    service_type: ServiceType
    scheduled_date: datetime
    description: str
    status: BookingStatus
    cost: Optional[float] = 0.0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
