from pydantic import BaseModel
from typing import Optional

class MaintenancePredictionResponse(BaseModel):
    product_id: str
    maintenance_status: str
    risk_indicator: str
    maintenance_recommendation: str
    suggested_next_action: str
    is_baseline_rule_based: bool = True
    baseline_disclaimer: str = "This is a transparent rule-based baseline prediction. Sufficient ML historical telemetry data is unavailable."
