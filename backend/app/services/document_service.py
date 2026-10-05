import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status, UploadFile
from bson import ObjectId
from app.core.database import db_instance
from app.schemas.document_schema import DocumentOut, DocumentCreate

# In-memory fallback if MongoDB is not available
in_memory_documents: Dict[str, dict] = {}

class DocumentService:
    @staticmethod
    def _format_document(doc: dict) -> dict:
        doc_dict = dict(doc)
        if "_id" in doc_dict:
            doc_dict["id"] = str(doc_dict.pop("_id"))
        return doc_dict

    @staticmethod
    async def upload_document(
        user_id: str, 
        doc_in: DocumentCreate, 
        filename: str, 
        file_path: str,
        content_type: str,
        size_bytes: int
    ) -> dict:
        now = datetime.now(timezone.utc)
        doc = {
            "user_id": user_id,
            "product_id": doc_in.product_id,
            "title": doc_in.title,
            "filename": filename,
            "file_path": file_path,
            "document_type": doc_in.document_type.value,
            "content_type": content_type,
            "size_bytes": size_bytes,
            "uploaded_at": now
        }

        if db_instance.is_connected and db_instance.db is not None:
            result = await db_instance.db["documents"].insert_one(doc)
            doc["_id"] = result.inserted_id
        else:
            doc_id = str(uuid.uuid4())
            doc["id"] = doc_id
            in_memory_documents[doc_id] = doc

        return DocumentService._format_document(doc)

    @staticmethod
    async def get_user_documents(user_id: str, product_id: Optional[str] = None) -> List[dict]:
        docs = []
        if db_instance.is_connected and db_instance.db is not None:
            query = {"user_id": user_id}
            if product_id:
                query["product_id"] = product_id
            cursor = db_instance.db["documents"].find(query).sort("uploaded_at", -1)
            async for doc in cursor:
                docs.append(DocumentService._format_document(doc))
        else:
            for d in in_memory_documents.values():
                if d["user_id"] == user_id:
                    if product_id and d.get("product_id") != product_id:
                        continue
                    docs.append(DocumentService._format_document(d))
        return docs

    @staticmethod
    async def get_document(doc_id: str, user_id: str) -> dict:
        doc = None
        if db_instance.is_connected and db_instance.db is not None:
            try:
                doc = await db_instance.db["documents"].find_one({"_id": ObjectId(doc_id), "user_id": user_id})
            except Exception:
                pass
        else:
            doc = in_memory_documents.get(doc_id)
            if doc and doc["user_id"] != user_id:
                doc = None

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found or access denied."
            )
        return DocumentService._format_document(doc)

    @staticmethod
    async def delete_document(doc_id: str, user_id: str) -> None:
        doc = await DocumentService.get_document(doc_id, user_id)
        
        # Remove physical file if it exists
        physical_path = doc["file_path"].replace("/storage/documents/", "")
        storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "documents")
        full_path = os.path.join(storage_dir, physical_path)
        
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except Exception as e:
                print(f"Warning: Failed to delete file {full_path}: {e}")

        # Remove from DB
        if db_instance.is_connected and db_instance.db is not None:
            await db_instance.db["documents"].delete_one({"_id": ObjectId(doc_id)})
        else:
            in_memory_documents.pop(doc_id, None)
