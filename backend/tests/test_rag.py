import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, MagicMock

from app.main import app

@pytest.mark.asyncio
@patch('app.services.rag_service.PyPDFLoader')
@patch('app.services.rag_service.OpenAIEmbeddings')
@patch('app.services.rag_service.FAISS')
@patch('app.services.rag_service.ChatOpenAI')
async def test_rag_assistant_flow(
    mock_chat, mock_faiss, mock_embed, mock_loader
):
    # Setup mocks for indexing
    mock_doc1 = MagicMock()
    mock_doc1.page_content = "This is a washing machine manual. To clean the filter, open the bottom panel."
    mock_doc1.metadata = {"page": 1}
    
    mock_doc2 = MagicMock()
    mock_doc2.page_content = "To start the wash cycle, press the start button."
    mock_doc2.metadata = {"page": 2}
    
    mock_loader_instance = mock_loader.return_value
    mock_loader_instance.load.return_value = [mock_doc1, mock_doc2]
    
    mock_vectorstore = MagicMock()
    mock_faiss.from_documents.return_value = mock_vectorstore
    mock_faiss.load_local.return_value = mock_vectorstore
    
    # Setup mocks for chat
    from langchain_core.messages import AIMessage
    mock_llm_instance = MagicMock()
    mock_chat.return_value = mock_llm_instance
    
    # Mock retriever
    mock_retriever = MagicMock()
    mock_vectorstore.as_retriever.return_value = mock_retriever
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create user
        r = await ac.post("/api/auth/register", json={
            "email": "raguser_full@test.com", 
            "password": "password123!", 
            "full_name": "RAG User Full"
        })
        token = r.json().get("access_token")
        if not token:
            r = await ac.post("/api/auth/login", data={"username": "raguser_full@test.com", "password": "password123!"})
            token = r.json().get("access_token")
            
        headers = {"Authorization": f"Bearer {token}"}
        
        # Upload product
        product_res = await ac.post("/api/products", json={
            "name": "Super Washer",
            "brand": "Samsung",
            "model_number": "SW-100",
            "category": "appliance"
        }, headers=headers)
        product_id = product_res.json()["id"]

        # Upload two documents for this product
        pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        
        files1 = {'file': ('manual1.pdf', pdf_bytes, 'application/pdf')}
        data1 = {'title': 'Washer Part 1', 'document_type': 'manual', 'product_id': product_id}
        res_doc1 = await ac.post("/api/documents", data=data1, files=files1, headers=headers)
        doc1_id = res_doc1.json()["id"]
        
        files2 = {'file': ('manual2.pdf', pdf_bytes, 'application/pdf')}
        data2 = {'title': 'Washer Part 2', 'document_type': 'manual', 'product_id': product_id}
        res_doc2 = await ac.post("/api/documents", data=data2, files=files2, headers=headers)
        doc2_id = res_doc2.json()["id"]

        # 1. Test Indexing
        res_index = await ac.post(f"/api/rag/{doc1_id}/index", headers=headers)
        assert res_index.status_code == 200
        assert res_index.json()["status"] == "success"

        # 2. Test Relevant Question
        mock_retriever.invoke.return_value = [mock_doc1]
        mock_llm_instance.invoke.return_value = AIMessage(content="To clean the filter, open the bottom panel.")
        
        res_chat = await ac.post(f"/api/rag/{doc1_id}/chat", json={"question": "How do I clean the filter?"}, headers=headers)
        assert res_chat.status_code == 200
        assert "clean the filter" in res_chat.json()["answer"]
        assert len(res_chat.json()["sources"]) == 1
        
        # 3. Test Irrelevant Question (Hallucination check)
        mock_retriever.invoke.return_value = []
        mock_llm_instance.invoke.return_value = AIMessage(content="The manual does not provide enough information.")
        
        res_chat = await ac.post(f"/api/rag/{doc1_id}/chat", json={"question": "What is the capital of France?"}, headers=headers)
        assert res_chat.status_code == 200
        assert "does not provide enough information" in res_chat.json()["answer"].lower()
        
        # 4. Test Question whose answer is absent
        mock_retriever.invoke.return_value = [mock_doc1]
        mock_llm_instance.invoke.return_value = AIMessage(content="The manual does not provide enough information.")
        
        res_chat = await ac.post(f"/api/rag/{doc1_id}/chat", json={"question": "How do I fix the motor?"}, headers=headers)
        assert res_chat.status_code == 200
        assert "does not provide enough information" in res_chat.json()["answer"].lower()
        
        # 5. Test Multiple-document question (Product level)
        mock_retriever.invoke.return_value = [mock_doc1, mock_doc2]
        mock_llm_instance.invoke.return_value = AIMessage(content="Open the bottom panel to clean the filter and press start.")
        
        res_chat = await ac.post(f"/api/rag/product/{product_id}/chat", json={"question": "How do I clean the filter and start?"}, headers=headers)
        assert res_chat.status_code == 200
        ans = res_chat.json()["answer"]
        assert "clean the filter" in ans.lower()
        assert len(res_chat.json()["sources"]) == 2
