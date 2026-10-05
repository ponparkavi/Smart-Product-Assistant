from datetime import date, datetime
from app.services.product_service import ProductService
from app.schemas.maintenance_schema import MaintenancePredictionResponse

class PredictiveMaintenanceService:
    @staticmethod
    def get_service_interval_months(category: str) -> int:
        # Transparent rule-based baseline intervals per category
        intervals = {
            "refrigerator": 12,
            "washing_machine": 6,
            "ac": 6,
            "microwave": 12,
            "water_purifier": 3,
            "tv": 24,
            "laptop": 12,
            "mixer_grinder": 12,
            "other": 12
        }
        return intervals.get(category, 12)

    @staticmethod
    async def predict_maintenance(product_id: str, user_id: str) -> MaintenancePredictionResponse:
        # Retrieve product data
        product = await ProductService.get_product(product_id, user_id)
        
        category = product["category"]
        purchase_date = product["purchase_date"]
        # Use datetime.date specifically
        if isinstance(purchase_date, datetime):
            purchase_date = purchase_date.date()
        elif isinstance(purchase_date, str):
            purchase_date = datetime.strptime(purchase_date, "%Y-%m-%d").date()

        last_service_date = product.get("last_service_date")
        if isinstance(last_service_date, datetime):
            last_service_date = last_service_date.date()
        elif isinstance(last_service_date, str):
            last_service_date = datetime.strptime(last_service_date, "%Y-%m-%d").date()

        warranty_status = product.get("warranty_status", "expired")
        
        today = date.today()
        
        # Calculate product age in months
        age_months = (today.year - purchase_date.year) * 12 + today.month - purchase_date.month
        
        # Determine baseline intervals
        interval_months = PredictiveMaintenanceService.get_service_interval_months(category)
        
        # Calculate months since last service (or purchase if never serviced)
        reference_date = last_service_date if last_service_date else purchase_date
        months_since_service = (today.year - reference_date.year) * 12 + today.month - reference_date.month

        # Baseline Rules
        risk_indicator = "Low"
        maintenance_status = "Good"
        recommendation = "No immediate action required."
        next_action = "Continue regular usage."

        if months_since_service >= interval_months * 1.5:
            risk_indicator = "Critical"
            maintenance_status = "Overdue"
            recommendation = f"{category.replace('_', ' ').title()} is significantly overdue for service. Risk of critical failure."
            next_action = "Book a service appointment immediately."
        elif months_since_service >= interval_months:
            risk_indicator = "Medium"
            maintenance_status = "Maintenance Due"
            recommendation = f"Routine maintenance interval ({interval_months} months) has been reached."
            next_action = "Schedule routine maintenance."
        elif age_months > 60: # Older than 5 years
            risk_indicator = "Medium"
            maintenance_status = "Good (Aging)"
            recommendation = "Product is aging. Keep a close eye on unusual noises or performance drops."
            next_action = "Inspect regularly."
        elif warranty_status == "expiring_soon":
             recommendation = "Warranty is expiring soon. Consider a pre-expiry inspection."
             next_action = "Check for any minor issues and claim warranty if needed."

        return MaintenancePredictionResponse(
            product_id=product_id,
            maintenance_status=maintenance_status,
            risk_indicator=risk_indicator,
            maintenance_recommendation=recommendation,
            suggested_next_action=next_action
        )
