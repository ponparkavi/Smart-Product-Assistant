import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from app.api.auth import get_current_user
from app.schemas.document_schema import DocumentOut, DocumentCreate, DocumentType
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Document Vault"])

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "documents")
os.makedirs(STORAGE_DIR, exist_ok=True)

# 10 MB limit
MAX_FILE_SIZE = 10 * 1024 * 1024

ALLOWED_CONTENT_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
]

@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    title: str = Form(...),
    document_type: DocumentType = Form(DocumentType.OTHER),
    product_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF, JPEG, PNG, or WEBP."
        )

    file_bytes = await file.read()
    size_bytes = len(file_bytes)
    
    if size_bytes == 0:
        raise HTTPException(status_code=400, detail="File is empty.")
        
    if size_bytes > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10MB limit."
        )

    file_ext = os.path.splitext(file.filename)[1] or ".pdf"
    unique_filename = f"{uuid.uuid4().hex}_{current_user['id']}{file_ext}"
    physical_path = os.path.join(STORAGE_DIR, unique_filename)
    
    with open(physical_path, "wb") as buffer:
        buffer.write(file_bytes)
        
    relative_path = f"/storage/documents/{unique_filename}"
    
    doc_in = DocumentCreate(
        title=title,
        document_type=document_type,
        product_id=product_id
    )
    
    return await DocumentService.upload_document(
        user_id=current_user["id"],
        doc_in=doc_in,
        filename=file.filename,
        file_path=relative_path,
        content_type=file.content_type,
        size_bytes=size_bytes
    )

@router.get("", response_model=List[DocumentOut])
async def list_documents(
    product_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    return await DocumentService.get_user_documents(current_user["id"], product_id)

@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await DocumentService.get_document(doc_id, current_user["id"])

@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user)
):
    await DocumentService.delete_document(doc_id, current_user["id"])
    return None
