import logging
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.database import db_instance
from app.core.security import get_password_hash, verify_password
from app.schemas.auth_schema import UserRegister, UserOut

logger = logging.getLogger("uvicorn.error")

# Fallback in-memory store if MongoDB is offline during initial local dev testing
in_memory_users = {}

class UserService:
    @staticmethod
    async def create_user(user_in: UserRegister) -> dict:
        email = user_in.email.lower()
        hashed_password = get_password_hash(user_in.password)
        now = datetime.now(timezone.utc)

        if db_instance.is_connected and db_instance.db is not None:
            # MongoDB mode
            existing = await db_instance.db["users"].find_one({"email": email})
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A user with this email already exists."
                )

            user_doc = {
                "email": email,
                "hashed_password": hashed_password,
                "full_name": user_in.full_name,
                "role": "user",
                "created_at": now,
                "updated_at": now
            }
            result = await db_instance.db["users"].insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            return UserService._format_user(user_doc)
        else:
            # Fallback memory mode
            if email in in_memory_users:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A user with this email already exists."
                )
            
            user_id = str(ObjectId())
            user_doc = {
                "_id": user_id,
                "email": email,
                "hashed_password": hashed_password,
                "full_name": user_in.full_name,
                "role": "user",
                "created_at": now,
                "updated_at": now
            }
            in_memory_users[email] = user_doc
            in_memory_users[user_id] = user_doc
            return UserService._format_user(user_doc)

    @staticmethod
    async def authenticate_user(email: str, password: str) -> dict:
        email_clean = email.lower()

        if db_instance.is_connected and db_instance.db is not None:
            user_doc = await db_instance.db["users"].find_one({"email": email_clean})
        else:
            user_doc = in_memory_users.get(email_clean)

        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

        if not verify_password(password, user_doc["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

        return UserService._format_user(user_doc)

    @staticmethod
    async def get_user_by_id(user_id: str) -> dict:
        if db_instance.is_connected and db_instance.db is not None:
            try:
                obj_id = ObjectId(user_id)
                user_doc = await db_instance.db["users"].find_one({"_id": obj_id})
            except Exception:
                user_doc = None
        else:
            user_doc = in_memory_users.get(user_id)

        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        return UserService._format_user(user_doc)

    @staticmethod
    def _format_user(user_doc: dict) -> dict:
        return {
            "id": str(user_doc["_id"]),
            "email": user_doc["email"],
            "full_name": user_doc["full_name"],
            "role": user_doc.get("role", "user"),
            "created_at": user_doc["created_at"]
        }
