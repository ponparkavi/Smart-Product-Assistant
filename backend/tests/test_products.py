import pytest
from datetime import date, timedelta
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_product_crud_and_user_isolation():
    user1_email = "produser1@example.com"
    user2_email = "produser2@example.com"
    password = "password123!"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register User 1
        r1 = await ac.post("/api/auth/register", json={"email": user1_email, "password": password, "full_name": "User One"})
        token1 = r1.json()["access_token"]
        h1 = {"Authorization": f"Bearer {token1}"}

        # Register User 2
        r2 = await ac.post("/api/auth/register", json={"email": user2_email, "password": password, "full_name": "User Two"})
        token2 = r2.json()["access_token"]
        h2 = {"Authorization": f"Bearer {token2}"}

        # 1. Create Product for User 1
        p_payload = {
            "name": "Samsung Smart Refrigerator 500L",
            "category": "refrigerator",
            "brand": "Samsung",
            "model_number": "RF-500L",
            "serial_number": "SN123456789",
            "purchase_date": str(date.today() - timedelta(days=100)),
            "purchase_price": 1200.0,
            "warranty_period_months": 24,
            "usage_info": "Used in kitchen"
        }
        res_create = await ac.post("/api/products", json=p_payload, headers=h1)
        assert res_create.status_code == 201
        p_data = res_create.json()
        p_id = p_data["id"]
        assert p_data["name"] == p_payload["name"]
        assert p_data["warranty_status"] == "active"
        assert p_data["remaining_days"] > 500

        # 2. List Products for User 1 (should contain 1 product)
        res_list1 = await ac.get("/api/products", headers=h1)
        assert res_list1.status_code == 200
        assert len(res_list1.json()) == 1

        # 3. List Products for User 2 (should be empty - User Isolation)
        res_list2 = await ac.get("/api/products", headers=h2)
        assert res_list2.status_code == 200
        assert len(res_list2.json()) == 0

        # 4. User 2 tries to fetch User 1's product (should fail 404)
        res_unauth_fetch = await ac.get(f"/api/products/{p_id}", headers=h2)
        assert res_unauth_fetch.status_code == 404

        # 5. User 1 updates product (including maintenance fields)
        update_payload = {
            "model_number": "RF-500L-PLUS",
            "last_service_date": str(date.today() - timedelta(days=5)),
            "next_recommended_service_date": str(date.today() + timedelta(days=180))
        }
        res_update = await ac.put(f"/api/products/{p_id}", json=update_payload, headers=h1)
        assert res_update.status_code == 200
        updated_data = res_update.json()
        assert updated_data["model_number"] == "RF-500L-PLUS"
        assert "T" in updated_data["last_service_date"]
        
        # 5.5 Check Search Functionality
        res_search_1 = await ac.get("/api/products?search=samsung", headers=h1)
        assert res_search_1.status_code == 200
        assert len(res_search_1.json()) == 1
        
        res_search_2 = await ac.get("/api/products?search=LG", headers=h1)
        assert res_search_2.status_code == 200
        assert len(res_search_2.json()) == 0

        # 6. Check Summary Stats for User 1
        res_stats = await ac.get("/api/products/summary", headers=h1)
        assert res_stats.status_code == 200
        stats = res_stats.json()
        assert stats["total_products"] == 1
        assert stats["active_warranties"] == 1

        # 7. User 1 deletes product
        res_del = await ac.delete(f"/api/products/{p_id}", headers=h1)
        assert res_del.status_code == 204

        # Verify product is deleted
        res_fetch_after = await ac.get(f"/api/products/{p_id}", headers=h1)
        assert res_fetch_after.status_code == 404
