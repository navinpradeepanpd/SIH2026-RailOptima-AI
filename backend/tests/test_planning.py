import pytest
from optimization.engine import run_optimization

def test_summary_metrics():
    # Setup some basic requests
    trains = []
    maintenance = [{
        "request_id": "MNT_1",
        "department": "Engineering",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "end_time": "2026-09-01T14:00:00",
        "duration": 240, # 4 hours
        "severity": "Critical",
        "urgency": "Emergency",
        "safety_critical": True
    }]
    
    result = run_optimization(trains, maintenance, "2026-09-01T00:00:00", "2026-09-08T00:00:00")
    
    # Assert metrics exist
    assert "summary_metrics" in result
    metrics = result["summary_metrics"]
    
    assert metrics["total_maintenance_requests"] == 1
    assert metrics["scheduled_requests"] == 1
    assert metrics["unscheduled_requests"] == 0
    assert metrics["block_hours"] == 4.0
    assert metrics["utilized_block_hours"] == 4.0
    assert metrics["critical_maintenance_completed"] == 1
    assert metrics["conflicts_resolved"] == 0 # no initial conflicts since no trains
