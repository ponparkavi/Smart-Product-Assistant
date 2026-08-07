import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

class Database:
    client: AsyncIOMotorClient = None
    db = None
    is_connected: bool = False

db_instance = Database()

async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    try:
        db_instance.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=3000
        )
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        # Ping server to verify connection
        await db_instance.client.admin.command('ping')
        db_instance.is_connected = True
        logger.info("Successfully connected to MongoDB!")

        # Create unique indexes
        await db_instance.db["users"].create_index("email", unique=True)
        await db_instance.db["products"].create_index([("user_id", 1)])
        await db_instance.db["invoices"].create_index([("user_id", 1)])
        await db_instance.db["manuals"].create_index([("product_id", 1)], unique=True)
    except Exception as e:
        db_instance.is_connected = False
        logger.warning(f"MongoDB connection warning: {e}. App running with fallback in-memory database handler.")

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db_instance.db
