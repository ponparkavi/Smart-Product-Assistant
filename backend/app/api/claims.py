from fastapi import APIRouter, Depends, HTTPException
from app.api.auth import get_current_user
from app.services.claim_service import ClaimService
from pydantic import BaseModel

class ClaimDraftRequest(BaseModel):
    product_id: str
    issue_description: str

class ClaimDraftResponse(BaseModel):
    draft_text: str
    verified_facts: dict

router = APIRouter()

@router.post("/generate-draft", response_model=ClaimDraftResponse)
async def generate_claim_draft(
    request: ClaimDraftRequest,
    current_user: dict = Depends(get_current_user)
):
    draft = await ClaimService.generate_draft(request.product_id, current_user["id"], request.issue_description)
    return draft
