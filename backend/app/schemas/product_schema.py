from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class ProductCategory(str, Enum):
    REFRIGERATOR = "refrigerator"
    WASHING_MACHINE = "washing_machine"
    AC = "ac"
    MICROWAVE = "microwave"
    TV = "tv"
    WATER_PURIFIER = "water_purifier"
    MIXER_GRINDER = "mixer_grinder"
    LAPTOP = "laptop"
    OTHER = "other"

class WarrantyStatus(str, Enum):
    ACTIVE = "active"
    EXPIRING_SOON = "expiring_soon"
    EXPIRED = "expired"

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Product Name, e.g. LG Dual Inverter Split AC")
    category: ProductCategory
    brand: str = Field(..., min_length=1, description="Brand name, e.g. LG")
    model_number: Optional[str] = ""
    serial_number: Optional[str] = ""
    purchase_date: date
    purchase_price: Optional[float] = 0.0
    warranty_start_date: Optional[date] = None
    warranty_period_months: int = Field(default=12, ge=0, description="Warranty coverage in months")
    usage_info: Optional[str] = ""

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[ProductCategory] = None
    brand: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    warranty_start_date: Optional[date] = None
    warranty_period_months: Optional[int] = None
    usage_info: Optional[str] = None

class ProductOut(BaseModel):
    id: str
    user_id: str
    name: str
    category: ProductCategory
    brand: str
    model_number: str
    serial_number: str
    purchase_date: date
    purchase_price: float
    warranty_start_date: date
    warranty_end_date: date
    warranty_period_months: int
    warranty_status: WarrantyStatus
    remaining_days: int
    usage_info: str
    image_path: Optional[str] = None
    invoice_id: Optional[str] = None
    manual_id: Optional[str] = None
    last_service_date: Optional[datetime] = None
    next_recommended_service_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProductSummaryStats(BaseModel):
    total_products: int
    active_warranties: int
    expiring_warranties: int
    expired_warranties: int
    maintenance_due: int
