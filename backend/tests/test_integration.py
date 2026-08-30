import pytest
import os
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_integration_full_pipeline():
    # A. Train data -> Conflict Detection
    response = client.get("/api/conflicts")
    assert response.status_code == 200
    conflicts_data = response.json()
    assert "summary_counts" in conflicts_data
    assert "conflicts" in conflicts_data
    
    # B & C. Conflict Detection -> Optimization -> KPI calculation
    # Simulate the AI Optimizer requesting a weekly plan
    opt_payload = {
        "start_date": "2026-09-01T00:00:00",
        "end_date": "2026-09-08T00:00:00"
    }
    opt_response = client.post("/api/planning/weekly", json=opt_payload)
    assert opt_response.status_code == 200
    opt_data = opt_response.json()
    
    assert "scheduled_requests" in opt_data
    assert "summary_metrics" in opt_data
    
    metrics = opt_data["summary_metrics"]
    assert "total_maintenance_requests" in metrics
    assert "conflicts_resolved" in metrics
    
    # D, E & F. Emergency Injection -> Replanning -> KPI calculation
    # Simulate an emergency disruption
    emergency_req = {
        "request_id": "EMG_INT_1",
        "department": "Engineering",
        "asset_type": "Track failure",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "end_time": "2026-09-01T14:00:00",
        "duration": 240,
        "severity": "Critical",
        "urgency": "Emergency",
        "safety_critical": True
    }
    
    emg_payload = {
        "emergency_request": emergency_req,
        "horizon_start": "2026-09-01T00:00:00",
        "horizon_end": "2026-09-08T00:00:00"
    }
    
    emg_response = client.post("/api/emergency/replan", json=emg_payload)
    assert emg_response.status_code == 200
    emg_data = emg_response.json()
    
    assert "before_schedule" in emg_data
    assert "affected_activities" in emg_data
    assert "actions" in emg_data
    assert "after_schedule" in emg_data
    
    # G. Simulation fallback -> complete pipeline
    # The above tests naturally use the SimulationProvider because RAIL_DATA_MODE is not set to live.
    mode_resp = client.get("/api/data-status")
    assert mode_resp.status_code == 200
    assert mode_resp.json()["mode"] == "simulation"

def test_live_fallback_integration():
    # Force live mode via env var to test fallback across the pipeline
    os.environ["RAIL_DATA_MODE"] = "live"
    os.environ["RAIL_LIVE_API_KEY"] = "fake_key"
    os.environ["RAIL_LIVE_API_URL"] = "http://localhost:9999/fake"
    
    # Reload app to pick up env vars is not fully possible in standard pytest without reload,
    # but we can just test that the endpoints gracefully handle it or fallback.
    # Actually, we can instantiate a LiveTrainProvider and verify it falls back.
    from data_providers.live_train_provider import LiveTrainProvider
    provider = LiveTrainProvider()
    
    # It should raise RuntimeError because we removed silent fallbacks
    with pytest.raises(RuntimeError) as excinfo:
        trains = provider.get_trains()
        
    assert "Live API request failed" in str(excinfo.value)
    
    # Reset env vars
    del os.environ["RAIL_DATA_MODE"]
