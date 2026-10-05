import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.api.auth import get_current_user
from app.schemas.product_schema import (
    ProductCreate, ProductUpdate, ProductOut, ProductSummaryStats, ProductCategory, WarrantyStatus
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Product Management"])

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "products")
os.makedirs(STORAGE_DIR, exist_ok=True)

@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    current_user: dict = Depends(get_current_user)
):
    return await ProductService.create_product(current_user["id"], product_in)

@router.get("/summary", response_model=ProductSummaryStats)
async def get_product_summary(current_user: dict = Depends(get_current_user)):
    return await ProductService.get_summary_stats(current_user["id"])

@router.get("", response_model=List[ProductOut])
async def list_products(
    category: Optional[str] = None,
    warranty_status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    return await ProductService.get_user_products(current_user["id"], category, warranty_status, search)

@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await ProductService.get_product_by_id(product_id, current_user["id"])

@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: dict = Depends(get_current_user)
):
    return await ProductService.update_product(product_id, current_user["id"], product_update)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    await ProductService.delete_product(product_id, current_user["id"])
    return None

@router.post("/{product_id}/image", response_model=ProductOut)
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: JPEG, PNG, WEBP."
        )

    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{product_id}_{current_user['id']}{file_ext}"
    file_path = os.path.join(STORAGE_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    relative_path = f"/storage/products/{filename}"
    return await ProductService.update_product_image(product_id, current_user["id"], relative_path)
