import logging
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.database import db_instance
from app.schemas.product_schema import ProductCreate, ProductUpdate, WarrantyStatus

logger = logging.getLogger("uvicorn.error")

# Fallback memory store if MongoDB is offline
in_memory_products = {}

class ProductService:
    @staticmethod
    def calculate_warranty_info(warranty_start: date, months: int):
        # Calculate warranty end date
        # Rough calculation: months * 30 days or calendar months
        year = warranty_start.year + (warranty_start.month + months - 1) // 12
        month = (warranty_start.month + months - 1) % 12 + 1
        day = min(warranty_start.day, 28) # handle month end overflow safely
        try:
            warranty_end = date(year, month, warranty_start.day)
        except ValueError:
            warranty_end = date(year, month, day)

        today = date.today()
        remaining_days = (warranty_end - today).days

        if remaining_days < 0:
            status_val = WarrantyStatus.EXPIRED
        elif remaining_days <= 30:
            status_val = WarrantyStatus.EXPIRING_SOON
        else:
            status_val = WarrantyStatus.ACTIVE

        return warranty_end, remaining_days, status_val

    @staticmethod
    async def create_product(user_id: str, product_in: ProductCreate) -> dict:
        now = datetime.now(timezone.utc)
        start_date = product_in.warranty_start_date or product_in.purchase_date
        end_date, remaining_days, warranty_status = ProductService.calculate_warranty_info(
            start_date, product_in.warranty_period_months
        )

        doc = {
            "user_id": user_id,
            "name": product_in.name,
            "category": product_in.category.value,
            "brand": product_in.brand,
            "model_number": product_in.model_number or "",
            "serial_number": product_in.serial_number or "",
            "purchase_date": datetime.combine(product_in.purchase_date, datetime.min.time()),
            "purchase_price": product_in.purchase_price or 0.0,
            "warranty_start_date": datetime.combine(start_date, datetime.min.time()),
            "warranty_end_date": datetime.combine(end_date, datetime.min.time()),
            "warranty_period_months": product_in.warranty_period_months,
            "usage_info": product_in.usage_info or "",
            "image_path": None,
            "invoice_id": None,
            "manual_id": None,
            "last_service_date": None,
            "next_recommended_service_date": datetime.now(timezone.utc) + timedelta(days=90),
            "created_at": now,
            "updated_at": now
        }

        if db_instance.is_connected and db_instance.db is not None:
            res = await db_instance.db["products"].insert_one(doc)
            doc["_id"] = res.inserted_id
            return ProductService._format_product(doc)
        else:
            p_id = str(ObjectId())
            doc["_id"] = p_id
            in_memory_products[p_id] = doc
            return ProductService._format_product(doc)

    @staticmethod
    async def get_user_products(user_id: str, category: Optional[str] = None, warranty_status: Optional[str] = None) -> List[dict]:
        products = []
        if db_instance.is_connected and db_instance.db is not None:
            query = {"user_id": user_id}
            if category:
                query["category"] = category
            cursor = db_instance.db["products"].find(query).sort("created_at", -1)
            async for doc in cursor:
                formatted = ProductService._format_product(doc)
                if not warranty_status or formatted["warranty_status"] == warranty_status:
                    products.append(formatted)
        else:
            for doc in in_memory_products.values():
                if doc["user_id"] == user_id:
                    if category and doc["category"] != category:
                        continue
                    formatted = ProductService._format_product(doc)
                    if not warranty_status or formatted["warranty_status"] == warranty_status:
                        products.append(formatted)
        return products

    @staticmethod
    async def get_product_by_id(product_id: str, user_id: str) -> dict:
        doc = None
        if db_instance.is_connected and db_instance.db is not None:
            try:
                obj_id = ObjectId(product_id)
                doc = await db_instance.db["products"].find_one({"_id": obj_id, "user_id": user_id})
            except Exception:
                doc = None
        else:
            p = in_memory_products.get(product_id)
            if p and p["user_id"] == user_id:
                doc = p

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or access denied."
            )
        return ProductService._format_product(doc)

    @staticmethod
    async def update_product(product_id: str, user_id: str, update_in: ProductUpdate) -> dict:
        # Check ownership
        existing = await ProductService.get_product_by_id(product_id, user_id)
        now = datetime.now(timezone.utc)

        update_fields = {}
        for k, v in update_in.model_dump(exclude_unset=True).items():
            if v is not None:
                if isinstance(v, date):
                    update_fields[k] = datetime.combine(v, datetime.min.time())
                elif hasattr(v, "value"): # Enum handling
                    update_fields[k] = v.value
                else:
                    update_fields[k] = v
        update_fields["updated_at"] = now

        # Recalculate warranty if start date or months changed
        start_dt = update_fields.get("warranty_start_date") or datetime.combine(existing["warranty_start_date"], datetime.min.time())
        start_d = start_dt.date() if isinstance(start_dt, datetime) else start_dt
        months = update_fields.get("warranty_period_months", existing["warranty_period_months"])

        end_date, _, _ = ProductService.calculate_warranty_info(start_d, months)
        update_fields["warranty_end_date"] = datetime.combine(end_date, datetime.min.time())

        if db_instance.is_connected and db_instance.db is not None:
            obj_id = ObjectId(product_id)
            await db_instance.db["products"].update_one({"_id": obj_id}, {"$set": update_fields})
        else:
            in_memory_products[product_id].update(update_fields)

        return await ProductService.get_product_by_id(product_id, user_id)

    @staticmethod
    async def delete_product(product_id: str, user_id: str) -> bool:
        await ProductService.get_product_by_id(product_id, user_id) # ensures exists & belongs to user
        if db_instance.is_connected and db_instance.db is not None:
            obj_id = ObjectId(product_id)
            await db_instance.db["products"].delete_one({"_id": obj_id})
        else:
            in_memory_products.pop(product_id, None)
        return True

    @staticmethod
    async def update_product_image(product_id: str, user_id: str, image_path: str) -> dict:
        await ProductService.get_product_by_id(product_id, user_id)
        now = datetime.now(timezone.utc)
        if db_instance.is_connected and db_instance.db is not None:
            obj_id = ObjectId(product_id)
            await db_instance.db["products"].update_one({"_id": obj_id}, {"$set": {"image_path": image_path, "updated_at": now}})
        else:
            in_memory_products[product_id]["image_path"] = image_path
            in_memory_products[product_id]["updated_at"] = now
        return await ProductService.get_product_by_id(product_id, user_id)

    @staticmethod
    async def get_summary_stats(user_id: str) -> dict:
        products = await ProductService.get_user_products(user_id)
        total = len(products)
        active = sum(1 for p in products if p["warranty_status"] == WarrantyStatus.ACTIVE)
        expiring = sum(1 for p in products if p["warranty_status"] == WarrantyStatus.EXPIRING_SOON)
        expired = sum(1 for p in products if p["warranty_status"] == WarrantyStatus.EXPIRED)
        maintenance_due = sum(1 for p in products if p["next_recommended_service_date"] and p["next_recommended_service_date"].date() <= date.today() + timedelta(days=7))

        return {
            "total_products": total,
            "active_warranties": active,
            "expiring_warranties": expiring,
            "expired_warranties": expired,
            "maintenance_due": maintenance_due
        }

    @staticmethod
    def _format_product(doc: dict) -> dict:
        purchase_d = doc["purchase_date"].date() if isinstance(doc["purchase_date"], datetime) else doc["purchase_date"]
        start_d = doc["warranty_start_date"].date() if isinstance(doc["warranty_start_date"], datetime) else doc["warranty_start_date"]
        
        months = doc.get("warranty_period_months", 12)
        end_d, remaining_days, status_val = ProductService.calculate_warranty_info(start_d, months)

        return {
            "id": str(doc["_id"]),
            "user_id": doc["user_id"],
            "name": doc["name"],
            "category": doc["category"],
            "brand": doc["brand"],
            "model_number": doc.get("model_number", ""),
            "serial_number": doc.get("serial_number", ""),
            "purchase_date": purchase_d,
            "purchase_price": doc.get("purchase_price", 0.0),
            "warranty_start_date": start_d,
            "warranty_end_date": end_d,
            "warranty_period_months": months,
            "warranty_status": status_val,
            "remaining_days": remaining_days,
            "usage_info": doc.get("usage_info", ""),
            "image_path": doc.get("image_path"),
            "invoice_id": doc.get("invoice_id"),
            "manual_id": doc.get("manual_id"),
            "last_service_date": doc.get("last_service_date"),
            "next_recommended_service_date": doc.get("next_recommended_service_date"),
            "created_at": doc["created_at"],
            "updated_at": doc["updated_at"]
        }
