import pytest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Aperture AIoT Control Center" in data["app_name"]

def test_login_and_auth_profile():
    # Login as Super Admin
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@aperture.io",
        "password": "AdminPass123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None

    # Get /auth/me
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == "admin@aperture.io"
    assert profile["is_super_admin"] is True

def test_companies_listing():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@aperture.io",
        "password": "AdminPass123!"
    })
    token = login_res.json()["access_token"]

    res = client.get(
        "/api/v1/companies",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    companies = res.json()
    assert len(companies) >= 1
    assert any(c["code"] == "APERTURE-AUTO" for c in companies)

def test_devices_listing():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@aperture.io",
        "password": "AdminPass123!"
    })
    token = login_res.json()["access_token"]

    res = client.get(
        "/api/v1/devices",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    devices = res.json()
    assert len(devices) >= 1
    assert devices[0]["device_id"] == "ble_node_01"
