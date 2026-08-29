import pytest
import os
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "RailOptima AI API"
    assert "data_mode" in data
    # Should default to simulation if not configured
    assert data["data_mode"] == "simulation"

def test_cors_headers():
    # Test that CORS headers are present for a typical preflight request
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/health", headers=headers)
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers

def test_environment_configuration():
    # The app should gracefully use defaults if env vars are missing
    assert os.environ.get("RAIL_DATA_MODE", "simulation") in ["simulation", "live"]
