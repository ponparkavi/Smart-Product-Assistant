from fastapi import APIRouter
from app.api import auth, products
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
