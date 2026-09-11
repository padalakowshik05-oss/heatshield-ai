"""
Unit tests for HeatShield AI Authentication API (/auth/*)
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_default_officer_login():
    """Verify seeded demo officer can log in with Password123!"""
    response = client.post("/auth/login", json={
        "username_or_email": "officer@heatshield.ai",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "officer@heatshield.ai"
    assert data["user"]["username"] == "officer"


def test_default_officer_login_via_username():
    """Verify seeded demo officer can log in with username 'officer'."""
    response = client.post("/auth/login", json={
        "username_or_email": "officer",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "officer@heatshield.ai"


def test_login_invalid_password():
    """Verify 401 on incorrect password."""
    response = client.post("/auth/login", json={
        "username_or_email": "officer@heatshield.ai",
        "password": "WrongPassword999"
    })
    assert response.status_code == 401
    assert "Invalid email/username or password" in response.json()["detail"]


def test_login_nonexistent_user():
    """Verify 401 on nonexistent user."""
    response = client.post("/auth/login", json={
        "username_or_email": "nobody_exists@heatshield.ai",
        "password": "Password123!"
    })
    assert response.status_code == 401


def test_register_and_get_me():
    """Verify registration creates new user and returns valid token."""
    test_email = "tester_new_user@heatshield.ai"
    # Ensure fresh test email
    response = client.post("/auth/register", json={
        "full_name": "Test Health Worker",
        "email": test_email,
        "password": "SecurePassword123!"
    })
    # Either 200 or 400 (if already registered in previous test run)
    if response.status_code == 200:
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == test_email
        token = data["access_token"]
    else:
        # If exists, log in
        login_res = client.post("/auth/login", json={
            "username_or_email": test_email,
            "password": "SecurePassword123!"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

    # Test /auth/me with Bearer token
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == test_email
    assert me_data["full_name"] == "Test Health Worker"


def test_protected_me_without_token():
    """Verify /auth/me rejects requests without token."""
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_protected_me_invalid_token():
    """Verify /auth/me rejects bad token."""
    response = client.get("/auth/me", headers={"Authorization": "Bearer invalid.fake.token"})
    assert response.status_code == 401
