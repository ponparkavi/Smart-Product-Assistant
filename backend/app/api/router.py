from fastapi import APIRouter
from app.api import auth, products, ocr, documents, rag, fault_detection, maintenance, claims, services
from app.core.database import db_instance

api_router = APIRouter()

# Health check route
@api_router.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "database": "connected" if db_instance.is_connected else "disconnected / fallback_mode",
        "service": "AI-Powered Smart Product Lifecycle Assistant API"
    }

# Include routers
api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(ocr.router)
api_router.include_router(documents.router)
api_router.include_router(rag.router)
api_router.include_router(fault_detection.router, prefix="/fault", tags=["Fault Detection"])
api_router.include_router(maintenance.router, prefix="/maintenance", tags=["Predictive Maintenance"])
api_router.include_router(claims.router, prefix="/claims", tags=["Claim Assistance"])
api_router.include_router(services.router, prefix="/services", tags=["Service Centers & Bookings"])
