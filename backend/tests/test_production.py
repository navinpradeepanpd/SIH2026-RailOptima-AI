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

def test_data_status_endpoint():
    response = client.get("/api/data-status")
    assert response.status_code == 200
    data = response.json()
    assert "mode" in data
    assert "provider" in data
    assert "live_ready" in data
    assert "live_configured" in data
    assert "message" in data
    
    assert data["mode"] == "simulation"
    assert data["provider"] == "simulation"

def test_data_validation():
    # Valid payload should pass validation and return 200 (or fail cleanly in logic later)
    valid_payload = {
        "planning_horizon_start": "2026-09-01T00:00:00",
        "planning_horizon_end": "2026-09-01T23:59:59",
        "trains": [{"train_id": "T1", "planned_start": "2026-09-01T10:00:00", "planned_end": "2026-09-01T12:00:00"}],
        "maintenance": [{"request_id": "M1", "duration": 60}]
    }
    # It might fail in optimization but should pass validation (400)
    response = client.post("/api/optimize", json=valid_payload)
    assert response.status_code != 400

    # Test invalid timestamp (start > end)
    invalid_trains = {
        **valid_payload,
        "trains": [{"train_id": "T2", "planned_start": "2026-09-01T14:00:00", "planned_end": "2026-09-01T12:00:00"}]
    }
    response = client.post("/api/optimize", json=invalid_trains)
    assert response.status_code == 400
    assert "start > end" in response.json()["detail"]

    # Test negative duration
    invalid_maint = {
        **valid_payload,
        "maintenance": [{"request_id": "M2", "duration": -30}]
    }
    response = client.post("/api/optimize", json=invalid_maint)
    assert response.status_code == 400
    assert "negative duration" in response.json()["detail"]
