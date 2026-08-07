import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data

@pytest.mark.asyncio
async def test_user_registration_and_login_flow():
    test_email = "testuser_phase12@example.com"
    test_password = "securePassword123!"
    test_name = "Test Engineer"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register User
        reg_payload = {
            "email": test_email,
            "password": test_password,
            "full_name": test_name
        }
        reg_response = await ac.post("/api/auth/register", json=reg_payload)
        assert reg_response.status_code == 201
        reg_data = reg_response.json()
        assert "access_token" in reg_data
        assert reg_data["user"]["email"] == test_email
        assert reg_data["user"]["full_name"] == test_name

        token = reg_data["access_token"]

        # 2. Access Protected /me Route with Bearer Token
        headers = {"Authorization": f"Bearer {token}"}
        me_response = await ac.get("/api/auth/me", headers=headers)
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["email"] == test_email
        assert me_data["full_name"] == test_name

        # 3. Test Login Endpoint
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        login_response = await ac.post("/api/auth/login", json=login_payload)
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert "access_token" in login_data

        # 4. Test Invalid Login
        invalid_payload = {
            "email": test_email,
            "password": "WrongPassword!"
        }
        invalid_response = await ac.post("/api/auth/login", json=invalid_payload)
        assert invalid_response.status_code == 401
