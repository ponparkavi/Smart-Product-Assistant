import pytest
import io
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import db_instance
import os

def get_test_pdf_bytes():
    return b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"

@pytest.mark.asyncio
async def test_document_vault_flow():
    user1_email = "docvault1@test.com"
    user2_email = "docvault2@test.com"
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create users
        r1 = await ac.post("/api/auth/register", json={"email": user1_email, "password": "password123!", "full_name": "Doc User 1"})
        token1 = r1.json().get("access_token")
        h1 = {"Authorization": f"Bearer {token1}"}
        
        r2 = await ac.post("/api/auth/register", json={"email": user2_email, "password": "password123!", "full_name": "Doc User 2"})
        token2 = r2.json().get("access_token")
        h2 = {"Authorization": f"Bearer {token2}"}

        # 1. Upload valid document (PDF)
        files = {'file': ('manual.pdf', get_test_pdf_bytes(), 'application/pdf')}
        data = {
            'title': 'Washing Machine Manual',
            'document_type': 'manual'
        }
        res_upload = await ac.post("/api/documents", data=data, files=files, headers=h1)
        assert res_upload.status_code == 201
        doc = res_upload.json()
        assert doc["title"] == "Washing Machine Manual"
        assert doc["document_type"] == "manual"
        assert doc["content_type"] == "application/pdf"
        assert "file_path" in doc
        doc_id = doc["id"]

        # 2. Upload invalid document (text file)
        files_invalid = {'file': ('invalid.txt', b"Hello", 'text/plain')}
        res_invalid = await ac.post("/api/documents", data={'title': 'Invalid'}, files=files_invalid, headers=h1)
        assert res_invalid.status_code == 400

        # 3. List documents for User 1 (should be 1)
        res_list1 = await ac.get("/api/documents", headers=h1)
        assert res_list1.status_code == 200
        assert len(res_list1.json()) == 1

        # 4. List documents for User 2 (should be 0 - User Isolation)
        res_list2 = await ac.get("/api/documents", headers=h2)
        assert res_list2.status_code == 200
        assert len(res_list2.json()) == 0

        # 5. Get specific document (User 1)
        res_get = await ac.get(f"/api/documents/{doc_id}", headers=h1)
        assert res_get.status_code == 200
        
        # 6. Attempt access specific document (User 2 - should fail 404)
        res_unauth = await ac.get(f"/api/documents/{doc_id}", headers=h2)
        assert res_unauth.status_code == 404

        # 7. Delete document (User 1)
        res_del = await ac.delete(f"/api/documents/{doc_id}", headers=h1)
        assert res_del.status_code == 204

        # Verify deletion
        res_list_after = await ac.get("/api/documents", headers=h1)
        assert len(res_list_after.json()) == 0
