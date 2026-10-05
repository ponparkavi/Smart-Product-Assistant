import requests

def get_token():
    url = "http://localhost:8000/api/auth/login"
    data = {"email": "demo@example.com", "password": "password123"}
    resp = requests.post(url, json=data)
    if resp.status_code == 200:
        return resp.json()["access_token"]
    raise Exception(f"Failed to login: {resp.text}")

if __name__ == "__main__":
    token = get_token()
    url = "http://localhost:8000/api/ocr/extract"
    headers = {"Authorization": f"Bearer {token}"}
    files = {"file": ("test_invoice.png", open("test_invoice.png", "rb"), "image/png")}

    response = requests.post(url, headers=headers, files=files)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
