import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.router import api_router
from app.utils.error_handlers import add_exception_handlers
from app.utils.logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect DB
    await connect_to_mongo()
    yield
    # Shutdown: Close DB
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Add global exception handlers
add_exception_handlers(app)

# Set CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploaded files
STORAGE_PATH = os.path.join(os.path.dirname(__file__), "..", "storage")
os.makedirs(STORAGE_PATH, exist_ok=True)
app.mount("/storage", StaticFiles(directory=STORAGE_PATH), name="storage")

app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount storage directory to serve images/invoices locally
import os
STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage")
if not os.path.exists(STORAGE_DIR):
    os.makedirs(STORAGE_DIR, exist_ok=True)
app.mount("/storage", StaticFiles(directory=STORAGE_DIR), name="storage")

@app.get("/")
async def root():
    return {
        "message": "Welcome to AI-Powered Smart Product Lifecycle Assistant API",
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }
