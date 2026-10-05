from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.schemas.rag_schema import ChatRequest, ChatResponse
from app.services.rag_service import RAGService

router = APIRouter(prefix="/rag", tags=["RAG Assistant"])

@router.post("/{doc_id}/chat", response_model=ChatResponse)
async def chat_with_manual(
    doc_id: str,
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    result = await RAGService.chat_with_document(doc_id, current_user["id"], request.question)
    return result

@router.post("/product/{product_id}/chat", response_model=ChatResponse)
async def chat_with_product(
    product_id: str,
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    result = await RAGService.chat_with_product(product_id, current_user["id"], request.question)
    return result

@router.post("/{doc_id}/index")
async def index_manual(
    doc_id: str,
    current_user: dict = Depends(get_current_user)
):
    await RAGService.index_document(doc_id, current_user["id"])
    return {"status": "success", "message": "Document indexed successfully for RAG"}
